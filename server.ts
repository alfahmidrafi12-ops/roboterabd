import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { GenerateContentResponse, GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

interface CompactCatalogItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  categoryLabel: string;
  price: number;
  stock: number;
  shortDesc: string;
  specs: string[];
}

interface RequiredPartOutput {
  partName: string;
  quantity: number;
  purpose: string;
  matchedProductId: string;
  matchNote: string;
}

interface BuildStepOutput {
  stepNumber: number;
  title: string;
  detail: string;
  wiringConnections: string[];
}

interface ProjectBlueprintPayload {
  projectTitle: string;
  summary: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedBuildTime: string;
  powerArchitecture: string;
  requiredParts: RequiredPartOutput[];
  buildSteps: BuildStepOutput[];
  safetyAndProTips: string[];
  starterCodeLanguage: string;
  starterCodeSketch: string;
}

class ApiRouteError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const PRIMARY_FAST_MODEL = 'gemini-3.1-flash-lite';
const FALLBACK_HYDROGEN_MODEL = 'gemini-4-hydrogen';
const BLUEPRINT_CACHE_TTL_MS = 10 * 60 * 1000;
const BLUEPRINT_CACHE_MAX_ENTRIES = 80;

interface CachedBlueprintEntry {
  blueprint: ProjectBlueprintPayload;
  expiresAt: number;
}

const blueprintCache = new Map<string, CachedBlueprintEntry>();

function getCachedBlueprint(key: string): ProjectBlueprintPayload | null {
  const entry = blueprintCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    blueprintCache.delete(key);
    return null;
  }
  // Refresh LRU recency
  blueprintCache.delete(key);
  blueprintCache.set(key, entry);
  return entry.blueprint;
}

function setCachedBlueprint(key: string, blueprint: ProjectBlueprintPayload): void {
  if (blueprintCache.size >= BLUEPRINT_CACHE_MAX_ENTRIES) {
    const oldestKey = blueprintCache.keys().next().value;
    if (oldestKey) blueprintCache.delete(oldestKey);
  }
  blueprintCache.set(key, {
    blueprint,
    expiresAt: Date.now() + BLUEPRINT_CACHE_TTL_MS,
  });
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new ApiRouteError(
      503,
      'Gemini API key is not configured. Please check your key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractUpstreamErrorDetails(err: unknown): { status?: number; message: string } {
  const directStatus =
    typeof (err as { status?: unknown })?.status === 'number'
      ? (err as { status: number }).status
      : undefined;
  let message = err instanceof Error ? err.message : String(err);
  let status = directStatus;

  // Unwrap nested JSON error payloads produced by @google/genai SDK
  for (let depth = 0; depth < 3; depth += 1) {
    const trimmed = message.trim();
    if (!trimmed.startsWith('{')) break;
    try {
      const parsed = JSON.parse(trimmed) as {
        error?: { code?: number; message?: string; status?: string };
        code?: number;
        message?: string;
      };
      const inner = parsed.error ?? parsed;
      if (typeof inner.code === 'number' && !status) {
        status = inner.code;
      }
      if (typeof inner.message === 'string' && inner.message.trim()) {
        message = inner.message.trim();
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  return { status, message };
}

function isFailoverEligibleError(err: unknown): boolean {
  const { status, message } = extractUpstreamErrorDetails(err);
  if (
    status === 404 ||
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return true;
  }
  return /503|502|504|429|UNAVAILABLE|high demand|temporarily unavailable|RESOURCE_EXHAUSTED|NOT_FOUND|fetch failed|ECONNRESET|ETIMEDOUT|AbortError|timed out/i.test(
    message
  );
}

async function withTimeout<T>(
  promiseFactory: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promiseFactory(controller.signal),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new ApiRouteError(504, `${label} timed out after ${Math.round(timeoutMs / 1000)}s.`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function runWithModelFailover<T>(
  models: string[],
  timeoutPerModelMs: number,
  task: (model: string, signal: AbortSignal) => Promise<T>
): Promise<{ result: T; modelUsed: string }> {
  let lastError: unknown;
  for (let idx = 0; idx < models.length; idx += 1) {
    const model = models[idx];
    try {
      const result = await withTimeout(
        (signal) => task(model, signal),
        timeoutPerModelMs,
        `Gemini (${model})`
      );
      return { result, modelUsed: model };
    } catch (err) {
      lastError = err;
      const hasFallback = idx < models.length - 1;
      if (!hasFallback || !isFailoverEligibleError(err)) {
        throw err;
      }
      console.warn(`Model ${model} failed (${extractUpstreamErrorDetails(err).message}); failing over to ${models[idx + 1]}.`);
    }
  }
  throw lastError;
}

function getThinkingConfigForModel(model: string, preferLow = false) {
  if (model === PRIMARY_FAST_MODEL && !preferLow) {
    return { thinkingLevel: ThinkingLevel.MINIMAL };
  }
  return { thinkingLevel: ThinkingLevel.LOW };
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  if (err instanceof ApiRouteError) {
    return { status: err.status, message: err.message };
  }
  const { status: rawStatus, message: rawMessage } = extractUpstreamErrorDetails(err);

  if (rawStatus === 403 || /PERMISSION_DENIED/i.test(rawMessage)) {
    return {
      status: 403,
      message: 'Gemini API permission denied. Please verify your API key in Settings > Secrets.',
    };
  }
  if (rawStatus === 400 && /API_KEY_INVALID|API key not valid/i.test(rawMessage)) {
    return {
      status: 400,
      message: 'Invalid Gemini API key. Please check your key in Settings > Secrets.',
    };
  }
  if (rawStatus === 429 || /RESOURCE_EXHAUSTED/i.test(rawMessage)) {
    return {
      status: 429,
      message: 'AI quota is temporarily busy. Please wait a few seconds and try again.',
    };
  }
  if (rawStatus === 503 || /UNAVAILABLE|high demand/i.test(rawMessage)) {
    return {
      status: 503,
      message: 'AI servers are experiencing a brief traffic spike. Please tap Send/Generate again.',
    };
  }
  if (rawStatus === 504 || /timed out|ETIMEDOUT|AbortError/i.test(rawMessage)) {
    return {
      status: 504,
      message: 'AI response took too long to connect. Please try again.',
    };
  }
  if (rawStatus === 404 || /NOT_FOUND/i.test(rawMessage)) {
    return {
      status: 502,
      message: 'Configured Gemini model was unavailable. Please try again shortly.',
    };
  }
  return {
    status: rawStatus && rawStatus >= 400 && rawStatus < 600 ? rawStatus : 500,
    message: rawMessage || 'Unable to generate AI response right now.',
  };
}

function sanitizeCatalogItems(rawList: unknown): CompactCatalogItem[] {
  if (!Array.isArray(rawList)) return [];
  const cleaned: CompactCatalogItem[] = [];
  for (const entry of rawList.slice(0, 120)) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    const id = typeof item.id === 'string' ? item.id.trim().slice(0, 80) : '';
    const name = typeof item.name === 'string' ? item.name.trim().slice(0, 160) : '';
    if (!id || !name) continue;
    cleaned.push({
      id,
      sku: typeof item.sku === 'string' ? item.sku.trim().slice(0, 48) : '',
      name,
      category: typeof item.category === 'string' ? item.category.trim().slice(0, 60) : '',
      categoryLabel:
        typeof item.categoryLabel === 'string' ? item.categoryLabel.trim().slice(0, 80) : '',
      price: typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : 0,
      stock: typeof item.stock === 'number' && Number.isFinite(item.stock) ? item.stock : 0,
      shortDesc: '',
      specs: [],
    });
  }
  return cleaned;
}

const BLUEPRINT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    projectTitle: {
      type: Type.STRING,
      description: 'Concise engineering title for the project.',
    },
    summary: {
      type: Type.STRING,
      description: '1-2 concise sentences summarizing how the hardware works together.',
    },
    difficulty: {
      type: Type.STRING,
      description: 'Exactly one of: Beginner, Intermediate, Advanced.',
    },
    estimatedBuildTime: {
      type: Type.STRING,
      description: 'Short duration like "2-4 Hours".',
    },
    powerArchitecture: {
      type: Type.STRING,
      description: 'Short rail flow, e.g. "2S LiPo -> 5V Buck -> MCU & Servos".',
    },
    requiredParts: {
      type: Type.ARRAY,
      description: 'Core hardware bill of materials (4-7 items).',
      items: {
        type: Type.OBJECT,
        properties: {
          partName: {
            type: Type.STRING,
            description: 'Hardware component name.',
          },
          quantity: {
            type: Type.INTEGER,
            description: 'Integer quantity (>= 1).',
          },
          purpose: {
            type: Type.STRING,
            description: 'Short role in <= 10 words.',
          },
          matchedProductId: {
            type: Type.STRING,
            description: 'Exact catalog id if stocked/matched, else "".',
          },
          matchNote: {
            type: Type.STRING,
            description: 'Short note in <= 6 words (e.g. "In Dhaka stock" or "External DIY item").',
          },
        },
        required: ['partName', 'quantity', 'purpose', 'matchedProductId', 'matchNote'],
      },
    },
    buildSteps: {
      type: Type.ARRAY,
      description: '4 concise ordered build & wiring steps.',
      items: {
        type: Type.OBJECT,
        properties: {
          stepNumber: {
            type: Type.INTEGER,
            description: '1-indexed step number.',
          },
          title: {
            type: Type.STRING,
            description: 'Short step title.',
          },
          detail: {
            type: Type.STRING,
            description: '1-2 crisp practical sentences.',
          },
          wiringConnections: {
            type: Type.ARRAY,
            description: 'Explicit "ModuleA PIN -> ModuleB PIN" strings.',
            items: {
              type: Type.STRING,
            },
          },
        },
        required: ['stepNumber', 'title', 'detail', 'wiringConnections'],
      },
    },
    safetyAndProTips: {
      type: Type.ARRAY,
      description: '2-3 crisp electrical safety tips.',
      items: {
        type: Type.STRING,
      },
    },
    starterCodeLanguage: {
      type: Type.STRING,
      description: 'e.g. "Arduino C++" or "MicroPython".',
    },
    starterCodeSketch: {
      type: Type.STRING,
      description: 'Clean minimal 10-16 line starter sketch with \\n newlines.',
    },
  },
  required: [
    'projectTitle',
    'summary',
    'difficulty',
    'estimatedBuildTime',
    'powerArchitecture',
    'requiredParts',
    'buildSteps',
    'safetyAndProTips',
    'starterCodeLanguage',
    'starterCodeSketch',
  ],
};

function normalizeChatHistory(
  rawHistory: unknown
): { role: 'user' | 'model'; parts: { text: string }[] }[] {
  if (!Array.isArray(rawHistory)) return [];
  const cleaned: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
  for (const entry of rawHistory.slice(-16)) {
    if (!entry || typeof entry !== 'object') continue;
    const role = (entry as { role?: unknown }).role;
    const text = (entry as { text?: unknown }).text;
    if ((role !== 'user' && role !== 'model') || typeof text !== 'string') continue;
    const trimmed = text.trim().slice(0, 2500);
    if (!trimmed) continue;

    const prev = cleaned[cleaned.length - 1];
    if (prev && prev.role === role) {
      // Merge consecutive same-role entries to guarantee strict user/model alternation
      prev.parts[0].text = `${prev.parts[0].text}\n${trimmed}`.slice(0, 3000);
    } else if (cleaned.length === 0 && role === 'model') {
      continue;
    } else {
      cleaned.push({ role, parts: [{ text: trimmed }] });
    }
  }
  // Gemini chat history before sendMessageStream must end with a model turn
  while (cleaned.length > 0 && cleaned[cleaned.length - 1].role !== 'model') {
    cleaned.pop();
  }
  return cleaned;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '512kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/ai/project-architect', async (req, res) => {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const projectDescription =
        typeof body.projectDescription === 'string' ? body.projectDescription.trim() : '';

      if (projectDescription.length < 4) {
        res.status(400).json({
          error: 'Please describe the robotics or electronics project you want to build (at least 4 characters).',
        });
        return;
      }

      if (projectDescription.length > 1500) {
        res.status(400).json({
          error: 'Project description is too long. Please keep it under 1500 characters.',
        });
        return;
      }

      const experienceLevel =
        typeof body.experienceLevel === 'string' &&
        ['Beginner', 'Intermediate', 'Advanced'].includes(body.experienceLevel)
          ? body.experienceLevel
          : 'Intermediate';

      const budgetBdt =
        typeof body.budgetBdt === 'number' && Number.isFinite(body.budgetBdt) && body.budgetBdt > 0
          ? Math.round(body.budgetBdt)
          : null;

      const catalogItems = sanitizeCatalogItems(body.catalogItems);
      const validCatalogIds = new Set(catalogItems.map((item) => item.id));

      // Ultra-compact catalog digest & cache key
      const catalogDigest = catalogItems
        .map((item) => `${item.id}:${item.stock}:${item.price}`)
        .join('|');
      const cacheKey = `${projectDescription.toLowerCase()}__${experienceLevel}__${budgetBdt ?? 'any'}__${catalogDigest.length}:${catalogDigest.slice(0, 120)}`;
      const cached = getCachedBlueprint(cacheKey);
      if (cached) {
        res.json({ blueprint: cached, cached: true });
        return;
      }

      const ai = getGeminiClient();

      // Compact pipe-delimited catalog trims prompt size while preserving exact IDs/prices/stock
      const catalogContext =
        catalogItems.length > 0
          ? catalogItems
              .map((item) => `${item.id}|${item.name}|৳${item.price}|s:${item.stock}`)
              .join('\n')
          : 'No catalog items provided.';

      const userPrompt = [
        `Project: ${projectDescription}`,
        `Skill: ${experienceLevel} | Budget: ${budgetBdt ? `৳${budgetBdt} BDT` : 'Flexible'}`,
        '',
        'Catalog (id|name|price|stock):',
        catalogContext,
      ].join('\n');

      const systemInstruction = [
        'Fast, practical Robotics Engineer at Robotera BD (Dhaka).',
        'Return compact JSON matching the schema:',
        '1. requiredParts (4-7 core items). `matchedProductId` MUST be an exact catalog `id` when available, or "" if external (jumper wires, breadboard, chassis if absent).',
        '2. buildSteps (4 concise steps) with explicit `"SourceModule PIN -> TargetModule PIN"` strings in `wiringConnections` so circuit diagrams render clearly.',
        '3. safetyAndProTips (2-3 crisp bullets: 3.3V/5V logic, common GND, separate motor rail).',
        '4. starterCodeSketch: 10-16 clean lines with \\n newlines.',
        'Match user language (Banglish/Bengali -> Banglish/English hybrid; English -> English). Keep pin names and code in English.',
      ].join('\n');

      const { result: response } = await runWithModelFailover(
        [PRIMARY_FAST_MODEL, FALLBACK_HYDROGEN_MODEL],
        12000,
        (model, signal) =>
          ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: BLUEPRINT_SCHEMA,
              thinkingConfig: getThinkingConfigForModel(model),
              abortSignal: signal,
            },
          })
      );

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        throw new ApiRouteError(502, 'Gemini returned an empty response. Please try again.');
      }

      const parsed = JSON.parse(rawText) as Partial<ProjectBlueprintPayload>;
      const normalizedDifficulty =
        parsed.difficulty === 'Beginner' ||
        parsed.difficulty === 'Intermediate' ||
        parsed.difficulty === 'Advanced'
          ? parsed.difficulty
          : experienceLevel;

      const sanitizedParts: RequiredPartOutput[] = Array.isArray(parsed.requiredParts)
        ? parsed.requiredParts.slice(0, 14).map((part) => {
            const rawMatchId =
              typeof part.matchedProductId === 'string' ? part.matchedProductId.trim() : '';
            const verifiedMatchId = validCatalogIds.has(rawMatchId) ? rawMatchId : '';
            return {
              partName: typeof part.partName === 'string' ? part.partName.trim() : 'Component',
              quantity:
                typeof part.quantity === 'number' && Number.isFinite(part.quantity) && part.quantity > 0
                  ? Math.min(99, Math.round(part.quantity))
                  : 1,
              purpose: typeof part.purpose === 'string' ? part.purpose.trim() : '',
              matchedProductId: verifiedMatchId,
              matchNote:
                typeof part.matchNote === 'string'
                  ? part.matchNote.trim()
                  : verifiedMatchId
                  ? 'Available in Robotera BD catalog'
                  : 'Not listed in store catalog — source externally',
            };
          })
        : [];

      const sanitizedSteps: BuildStepOutput[] = Array.isArray(parsed.buildSteps)
        ? parsed.buildSteps.slice(0, 10).map((step, index) => ({
            stepNumber:
              typeof step.stepNumber === 'number' && Number.isFinite(step.stepNumber)
                ? step.stepNumber
                : index + 1,
            title: typeof step.title === 'string' ? step.title.trim() : `Step ${index + 1}`,
            detail: typeof step.detail === 'string' ? step.detail.trim() : '',
            wiringConnections: Array.isArray(step.wiringConnections)
              ? step.wiringConnections
                  .filter((w): w is string => typeof w === 'string' && w.trim().length > 0)
                  .map((w) => w.trim())
              : [],
          }))
        : [];

      const blueprint: ProjectBlueprintPayload = {
        projectTitle:
          typeof parsed.projectTitle === 'string' && parsed.projectTitle.trim()
            ? parsed.projectTitle.trim()
            : 'Custom Robotics Build Plan',
        summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
        difficulty: normalizedDifficulty as 'Beginner' | 'Intermediate' | 'Advanced',
        estimatedBuildTime:
          typeof parsed.estimatedBuildTime === 'string' && parsed.estimatedBuildTime.trim()
            ? parsed.estimatedBuildTime.trim()
            : '3–5 Hours',
        powerArchitecture:
          typeof parsed.powerArchitecture === 'string' && parsed.powerArchitecture.trim()
            ? parsed.powerArchitecture.trim()
            : 'Regulated 5V / 3.3V Logic Rail + Isolated Actuator Power',
        requiredParts: sanitizedParts,
        buildSteps: sanitizedSteps,
        safetyAndProTips: Array.isArray(parsed.safetyAndProTips)
          ? parsed.safetyAndProTips
              .filter((tip): tip is string => typeof tip === 'string' && tip.trim().length > 0)
              .map((tip) => tip.trim())
              .slice(0, 5)
          : [],
        starterCodeLanguage:
          typeof parsed.starterCodeLanguage === 'string' && parsed.starterCodeLanguage.trim()
            ? parsed.starterCodeLanguage.trim()
            : 'Arduino C++',
        starterCodeSketch:
          typeof parsed.starterCodeSketch === 'string' ? parsed.starterCodeSketch.trim() : '',
      };

      setCachedBlueprint(cacheKey, blueprint);
      res.json({ blueprint });
    } catch (err) {
      console.error('AI Project Architect error:', err);
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/ai/chat', async (req, res) => {
    let clientClosed = false;
    res.on('close', () => {
      if (!res.writableEnded) {
        clientClosed = true;
      }
    });

    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const message = typeof body.message === 'string' ? body.message.trim() : '';

      if (!message) {
        res.status(400).json({ error: 'Please enter a message to ask the AI engineer.' });
        return;
      }
      if (message.length > 2000) {
        res.status(400).json({ error: 'Message is too long. Please keep it under 2000 characters.' });
        return;
      }

      const roleId =
        typeof body.roleId === 'string' &&
        ['stock-advisor', 'circuit-debug', 'firmware-mentor'].includes(body.roleId)
          ? body.roleId
          : 'stock-advisor';

      const speedMode = body.speedMode === 'balanced' ? 'balanced' : 'fast';
      const candidateModels =
        speedMode === 'balanced'
          ? [FALLBACK_HYDROGEN_MODEL, PRIMARY_FAST_MODEL]
          : [PRIMARY_FAST_MODEL, FALLBACK_HYDROGEN_MODEL];

      const projectContext =
        typeof body.projectContext === 'string' ? body.projectContext.trim().slice(0, 1200) : '';

      const formattedHistory = normalizeChatHistory(body.history);

      const catalogItems = sanitizeCatalogItems(body.catalogItems);
      const catalogSummary =
        catalogItems.length > 0
          ? catalogItems
              .map((item) => `${item.sku}|${item.name}|৳${item.price}|s:${item.stock}`)
              .join('\n')
          : 'No catalog items provided.';

      const rolePromptMap: Record<string, string> = {
        'stock-advisor':
          'Role: **Hardware & Dhaka Stock Advisor** at Robotera BD. Recommend matching catalog items with exact SKU, ৳ price, and stock count, warn when stock is 0 or absent, and keep answers concise.',
        'circuit-debug':
          'Role: **Wiring & Circuit Troubleshooter** at Robotera BD. Focus on pin-to-pin wiring maps, 3.3V/5V safety, common GND, brownout fixes, and crisp debugging steps.',
        'firmware-mentor':
          'Role: **Embedded Firmware & Code Mentor** at Robotera BD. Share clean, copy-ready Arduino C++ or MicroPython snippets, pin defines, and concise explanations.',
      };

      const systemInstruction = [
        rolePromptMap[roleId],
        'Keep responses crisp, direct, and easy to scan (short bullet points, no filler). Match the user language (Banglish/Bengali -> Banglish/English hybrid; English -> English).',
        'Cite exact Robotera BD product names and SKUs from the live catalog below whenever recommending store items; never invent stock or prices.',
        projectContext ? `Active Project Blueprint:\n${projectContext}` : '',
        'Catalog (SKU|Name|Price|Stock):',
        catalogSummary,
      ]
        .filter(Boolean)
        .join('\n\n');

      const ai = getGeminiClient();

      // Open SSE stream immediately with proxy anti-buffering headers
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();
      res.write(': stream-open\n\n');

      let streamSucceeded = false;
      let lastStreamErr: unknown;

      for (let idx = 0; idx < candidateModels.length; idx += 1) {
        if (clientClosed) break;
        const model = candidateModels[idx];
        const timeoutMs = model === PRIMARY_FAST_MODEL ? 10000 : 18000;
        let emittedAnyChunk = false;

        try {
          const chat = ai.chats.create({
            model,
            history: formattedHistory,
            config: {
              systemInstruction,
              thinkingConfig: getThinkingConfigForModel(model),
            },
          });

          const streamResponse = await withTimeout(
            (signal) =>
              chat.sendMessageStream({
                message,
                config: { abortSignal: signal },
              }),
            timeoutMs,
            `Chat (${model})`
          );

          for await (const chunk of streamResponse) {
            if (clientClosed) break;
            const c = chunk as GenerateContentResponse;
            const textChunk = c.text;
            if (textChunk) {
              emittedAnyChunk = true;
              res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
            }
          }

          if (!clientClosed) {
            res.write(`data: ${JSON.stringify({ done: true, model })}\n\n`);
            res.end();
          }
          streamSucceeded = true;
          break;
        } catch (err) {
          lastStreamErr = err;
          const hasFallback = idx < candidateModels.length - 1;
          if (!emittedAnyChunk && hasFallback && isFailoverEligibleError(err) && !clientClosed) {
            console.warn(`Chat model ${model} failed before first token; failing over to ${candidateModels[idx + 1]}.`);
            continue;
          }
          throw err;
        }
      }

      if (!streamSucceeded && !clientClosed && !res.writableEnded) {
        const formatted = formatGeminiError(lastStreamErr);
        res.write(`data: ${JSON.stringify({ error: formatted.message })}\n\n`);
        res.end();
      }
    } catch (err) {
      console.error('AI Chat error:', err);
      const formatted = formatGeminiError(err);
      if (!res.headersSent) {
        res.status(formatted.status).json({ error: formatted.message });
      } else if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: formatted.message })}\n\n`);
        res.end();
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir, { extensions: ['html'] }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      const cleanReqPath = req.path.replace(/^\/+|\/+$/g, '');
      const candidateHtml = cleanReqPath
        ? path.join(distDir, cleanReqPath, 'index.html')
        : path.join(distDir, 'index.html');
      const fallbackHtml = path.join(distDir, 'index.html');
      const targetHtml = fs.existsSync(candidateHtml) ? candidateHtml : fallbackHtml;
      if (fs.existsSync(targetHtml)) {
        res.sendFile(targetHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Robotera BD full-stack server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Robotera BD server:', err);
  process.exit(1);
});
