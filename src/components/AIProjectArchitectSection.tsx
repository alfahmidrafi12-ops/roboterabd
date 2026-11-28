import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Bot,
  Cable,
  Check,
  Clock,
  Code2,
  Copy,
  Cpu,
  Layers,
  Loader2,
  MessageSquareText,
  PackageCheck,
  Plus,
  ShieldAlert,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  playAddToCartSound,
  playErrorSound,
  playSuccessSound,
  playTapSound,
} from '../lib/sound';
import {
  AddToCartResult,
  AiBlueprintDifficulty,
  AiProjectBlueprint,
  AiRequiredPart,
  Product,
} from '../types/store';
import { CircuitDiagramD3 } from './CircuitDiagramD3';
import { HardwareArtwork } from './HardwareArtwork';
import { Reveal } from './Reveal';
import { RoboticsAiChat } from './RoboticsAiChat';

interface AIProjectArchitectSectionProps {
  products: Product[];
  onAddToCart: (
    product: Product,
    quantity: number,
    variant?: string,
    silentToast?: boolean
  ) => AddToCartResult | void;
  onSelectProduct: (product: Product) => void;
  onBackToStore?: () => void;
}

type ResultTab = 'parts' | 'diagram' | 'steps' | 'code';

interface StarterPromptPreset {
  label: string;
  prompt: string;
  level: AiBlueprintDifficulty;
}

const STARTER_PRESETS: StarterPromptPreset[] = [
  {
    label: 'ESP32 Obstacle Rover',
    prompt:
      '4WD obstacle-avoiding autonomous rover using ESP32, ultrasonic sensor, motor driver, and LiPo battery',
    level: 'Beginner',
  },
  {
    label: 'Smart Home + OLED',
    prompt:
      'Wi-Fi smart room monitor with ESP32-S3, I2C OLED status screen, and remote telemetry alerts',
    level: 'Beginner',
  },
  {
    label: '6-DOF Robotic Arm',
    prompt:
      '6-DOF metal gear servo robotic arm controlled via Arduino/ESP32 with isolated 5V power supply',
    level: 'Intermediate',
  },
  {
    label: 'Banglish: Smart Plant Care',
    prompt:
      'Ami ekta ESP32 diye automatic smart plant monitoring & telemetry project banabo jeta OLED display te data dekhabe',
    level: 'Beginner',
  },
];

interface ResolvedPartRow {
  part: AiRequiredPart;
  matchedProduct: Product | null;
}

export const AIProjectArchitectSection: React.FC<AIProjectArchitectSectionProps> = ({
  products,
  onAddToCart,
  onSelectProduct,
  onBackToStore,
}) => {
  const [description, setDescription] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<AiBlueprintDifficulty>('Beginner');
  const [budgetInput, setBudgetInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [blueprint, setBlueprint] = useState<AiProjectBlueprint | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>('parts');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [bundleAdded, setBundleAdded] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<'blueprint' | 'chat'>('blueprint');
  const [chatSeedPrompt, setChatSeedPrompt] = useState<string | null>(null);
  const architectAbortRef = useRef<AbortController | null>(null);
  const architectUserCancelledRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const scheduleTimer = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
  };

  useEffect(() => {
    return () => {
      architectUserCancelledRef.current = true;
      architectAbortRef.current?.abort();
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => {
      map.set(p.id, p);
    });
    return map;
  }, [products]);

  const resolvedParts = useMemo<ResolvedPartRow[]>(() => {
    if (!blueprint) return [];
    return blueprint.requiredParts.map((part) => {
      const matched = part.matchedProductId ? productById.get(part.matchedProductId) ?? null : null;
      return { part, matchedProduct: matched };
    });
  }, [blueprint, productById]);

  const matchedRows = useMemo(
    () => resolvedParts.filter((row): row is { part: AiRequiredPart; matchedProduct: Product } => Boolean(row.matchedProduct)),
    [resolvedParts]
  );

  const externalRows = useMemo(
    () => resolvedParts.filter((row) => !row.matchedProduct),
    [resolvedParts]
  );

  const inStockRows = useMemo(
    () => matchedRows.filter((row) => row.matchedProduct.stock > 0),
    [matchedRows]
  );

  const inStockTotalBdt = useMemo(
    () =>
      inStockRows.reduce(
        (sum, row) =>
          sum + row.matchedProduct.price * Math.min(row.part.quantity, row.matchedProduct.stock),
        0
      ),
    [inStockRows]
  );

  const runArchitect = async (overridePrompt?: string, overrideLevel?: AiBlueprintDifficulty) => {
    const promptToSend = (overridePrompt ?? description).trim();
    const levelToSend = overrideLevel ?? experienceLevel;
    if (promptToSend.length < 4) {
      playErrorSound();
      setErrorMessage('Please describe what project you want to build (at least 4 characters).');
      return;
    }

    playTapSound();
    architectAbortRef.current?.abort();
    architectUserCancelledRef.current = false;
    const controller = new AbortController();
    architectAbortRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 25000);

    setLoading(true);
    setErrorMessage('');
    setAddedIds({});
    setBundleAdded(false);
    setCodeCopied(false);

    const parsedBudget =
      budgetInput.trim() !== '' && Number.isFinite(Number(budgetInput)) && Number(budgetInput) > 0
        ? Number(budgetInput)
        : null;

    const compactCatalog = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      categoryLabel: p.categoryLabel,
      price: p.price,
      stock: p.stock,
    }));

    try {
      const response = await fetch('/api/ai/project-architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          projectDescription: promptToSend,
          experienceLevel: levelToSend,
          budgetBdt: parsedBudget,
          catalogItems: compactCatalog,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        blueprint?: AiProjectBlueprint;
        error?: string;
      };

      if (!response.ok || !payload.blueprint) {
        throw new Error(
          payload.error || 'Could not generate your build plan right now. Please try again.'
        );
      }

      playSuccessSound();
      setBlueprint(payload.blueprint);
      setActiveTab('parts');
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (!(isAbort && architectUserCancelledRef.current)) {
        playErrorSound();
        setErrorMessage(
          isAbort
            ? 'AI request timed out. Please try again.'
            : err instanceof Error
            ? err.message
            : 'Unable to reach AI Project Architect right now.'
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (architectAbortRef.current === controller) {
        architectAbortRef.current = null;
      }
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runArchitect();
  };

  const handlePresetClick = (preset: StarterPromptPreset) => {
    setDescription(preset.prompt);
    setExperienceLevel(preset.level);
    void runArchitect(preset.prompt, preset.level);
  };

  const handleAddSingleMatched = (product: Product, qty: number) => {
    const addQty = Math.min(Math.max(1, qty), product.stock);
    if (addQty <= 0) return;
    const res = onAddToCart(product, addQty);
    if (!res || res.addedQty > 0) {
      setAddedIds((prev) => ({ ...prev, [product.id]: true }));
      scheduleTimer(() => {
        setAddedIds((prev) => ({ ...prev, [product.id]: false }));
      }, 1500);
    }
  };

  const handleAddAllInStock = () => {
    if (inStockRows.length === 0) return;
    const nextFlags: Record<string, boolean> = {};
    let addedCount = 0;
    inStockRows.forEach((row) => {
      const addQty = Math.min(Math.max(1, row.part.quantity), row.matchedProduct.stock);
      if (addQty > 0) {
        const res = onAddToCart(row.matchedProduct, addQty, undefined, true);
        if (!res || res.addedQty > 0) {
          nextFlags[row.matchedProduct.id] = true;
          addedCount += 1;
        }
      }
    });
    if (addedCount > 0) {
      playAddToCartSound();
      setAddedIds((prev) => ({ ...prev, ...nextFlags }));
      setBundleAdded(true);
      scheduleTimer(() => {
        setBundleAdded(false);
        setAddedIds({});
      }, 1800);
    } else {
      playErrorSound();
    }
  };

  const handleCopyCode = async () => {
    if (!blueprint?.starterCodeSketch) return;
    try {
      await navigator.clipboard.writeText(blueprint.starterCodeSketch);
      playTapSound();
      setCodeCopied(true);
      scheduleTimer(() => setCodeCopied(false), 1800);
    } catch {
      // Ignore clipboard permission denials
    }
  };

  return (
    <section
      id="ai-architect"
      className="bg-[#050B18] min-h-[calc(100vh-80px)] min-[1500px]:bg-transparent min-[1500px]:pointer-events-none"
    >
      <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto overflow-hidden bg-[#050B18] text-[#F5F8FF] min-[1500px]:border-x min-[1500px]:border-[#1E3A6E]/60 px-5 sm:px-8 lg:px-12 pt-24 sm:pt-28 lg:pt-32 pb-14 sm:pb-20">
        {/* Blueprint Hairline Grid & Luminous Ambient Spotlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-55"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(0, 200, 255, 0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 200, 255, 0.055) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[780px] h-[360px] rounded-full bg-[radial-gradient(circle,rgba(8,102,245,0.28)_0%,rgba(0,200,255,0.14)_45%,transparent_72%)] blur-2xl"
        />
        <div
          aria-hidden="true"
          className="animate-signal-sweep pointer-events-none absolute top-0 left-0 h-[2px] w-64 bg-gradient-to-r from-transparent via-[#00C8FF] to-transparent"
        />

        <div className="relative z-10 space-y-8">
          {onBackToStore && (
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onBackToStore();
                }}
                className="motion-press inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#091633] hover:bg-[#0F234D] border border-[rgba(100,150,255,0.24)] text-xs font-semibold text-[#CFE3FF] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#00C8FF]" />
                <span>Back to Storefront</span>
              </button>
              <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] text-[#7D94B8]">
                <span>/ai-builder</span>
                <span aria-hidden="true">·</span>
                <span>{products.length} Live Catalog Items Loaded</span>
              </span>
            </div>
          )}

          {/* Editorial Section Header */}
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 lg:items-end gap-4 pb-7 border-b border-[rgba(0,200,255,0.22)]">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#08224A] border border-[#00C8FF]/45 mb-3 shadow-[0_0_24px_-8px_rgba(0,200,255,0.6)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C8FF] opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C8FF]" />
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-[#00C8FF]" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#E6F4FF]">
                    Live Gemini AI · Instant Stock &amp; Wiring
                  </span>
                </div>
                <h2 className="font-hero text-[28px] sm:text-[36px] lg:text-[44px] font-extrabold text-[#F5F8FF] tracking-[-0.03em] leading-[1.08] [text-wrap:balance]">
                  Describe your robotics build.{' '}
                  <span className="text-[#00C8FF]">Get parts, stock &amp; wiring.</span>
                </h2>
              </div>
              <div className="lg:col-span-5">
                <p className="text-sm sm:text-[15px] text-[#C6D5ED] leading-relaxed">
                  Write your project idea in English or Banglish—our AI analyzes every component
                  needed, highlights what we stock in Dhaka, and writes step-by-step wiring
                  instructions in seconds.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Workspace Mode Switcher: Project Blueprint vs Multi-Turn AI Chat */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-[#091633] border border-[rgba(0,200,255,0.28)] max-w-2xl">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setWorkspaceMode('blueprint');
              }}
              className={`flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all ${
                workspaceMode === 'blueprint'
                  ? 'bg-[#0866F5] text-white shadow-[0_10px_24px_-12px_rgba(8,102,245,0.85)]'
                  : 'text-[#A8BCE0] hover:text-white hover:bg-[#0D1E3D]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Project Blueprint &amp; Stock Matcher</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTapSound();
                setWorkspaceMode('chat');
              }}
              className={`flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all ${
                workspaceMode === 'chat'
                  ? 'bg-[#0866F5] text-white shadow-[0_10px_24px_-12px_rgba(8,102,245,0.85)]'
                  : 'text-[#A8BCE0] hover:text-white hover:bg-[#0D1E3D]'
              }`}
            >
              <MessageSquareText className="w-4 h-4 text-[#00C8FF]" />
              <span>Multi-Turn AI Engineer Chat</span>
            </button>
          </div>

          <div className={workspaceMode === 'chat' ? 'block' : 'hidden'}>
            <RoboticsAiChat
              products={products}
              projectContext={
                blueprint
                  ? `${blueprint.projectTitle} — ${blueprint.summary} (Parts: ${blueprint.requiredParts
                      .map((p) => `${p.quantity}x ${p.partName}`)
                      .join(', ')})`
                  : undefined
              }
              seedPrompt={chatSeedPrompt}
              onSeedPromptConsumed={() => setChatSeedPrompt(null)}
              onAddToCart={onAddToCart}
              onSelectProduct={onSelectProduct}
            />
          </div>

          <div className={workspaceMode === 'blueprint' ? 'block' : 'hidden'}>
          {/* Main Interactive Two-Column Workbench */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Console: Prompt & Controls */}
            <div className="lg:col-span-5 rounded-2xl bg-[#091633] border border-[#00C8FF]/35 ring-1 ring-[#0866F5]/30 p-5 sm:p-6 shadow-[0_24px_64px_-24px_rgba(0,200,255,0.28)]">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label
                      htmlFor="ai-project-prompt"
                      className="text-xs font-mono uppercase tracking-[0.16em] text-[#A8BCE0]"
                    >
                      Project Description
                    </label>
                    <span className="text-[11px] text-[#7D94B8]">English or Banglish</span>
                  </div>
                  <textarea
                    id="ai-project-prompt"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Ami ekta ESP32 diye obstacle avoiding robot car banabo jeta LiPo battery te cholbe..."
                    className="w-full rounded-xl bg-[#050B18] border border-[rgba(100,150,255,0.24)] focus:border-[#00C8FF] focus:outline-none px-3.5 py-3 text-sm text-[#F5F8FF] placeholder:text-[#5B7096] resize-y min-h-[112px] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <span className="block text-[11px] font-mono uppercase tracking-[0.15em] text-[#A8BCE0] mb-1.5">
                      Skill Level
                    </span>
                    <div className="grid grid-cols-3 rounded-xl bg-[#050B18] border border-[rgba(100,150,255,0.2)] p-1 gap-1">
                      {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setExperienceLevel(level)}
                          className={`py-1.5 px-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                            experienceLevel === level
                              ? 'bg-[#0866F5] text-white'
                              : 'text-[#8CA3C9] hover:text-white'
                          }`}
                        >
                          {level === 'Intermediate' ? 'Interm.' : level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="ai-budget-bdt"
                      className="block text-[11px] font-mono uppercase tracking-[0.15em] text-[#A8BCE0] mb-1.5"
                    >
                      Max Budget (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#7D94B8]">
                        ৳
                      </span>
                      <input
                        id="ai-budget-bdt"
                        type="number"
                        min={100}
                        step={50}
                        value={budgetInput}
                        onChange={(e) => setBudgetInput(e.target.value)}
                        placeholder="e.g. 4500"
                        className="w-full h-[38px] rounded-xl bg-[#050B18] border border-[rgba(100,150,255,0.2)] focus:border-[#00C8FF] focus:outline-none pl-7 pr-3 font-mono text-xs text-[#F5F8FF] placeholder:text-[#5B7096] tabular-nums transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-xl bg-rose-950/70 border border-rose-500/45 px-3.5 py-2.5 flex items-start gap-2.5 text-xs text-rose-200"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{errorMessage}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="cta-sheen motion-press flex-1 h-11 rounded-xl bg-[#0866F5] hover:bg-[#1685FF] disabled:opacity-65 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-[0_14px_30px_-14px_rgba(8,102,245,0.8)] transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Matching Stock &amp; Wiring...</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4" />
                        <span>Generate Build Plan &amp; Stock Check</span>
                      </>
                    )}
                  </button>
                  {loading && (
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        architectUserCancelledRef.current = true;
                        architectAbortRef.current?.abort();
                      }}
                      className="h-11 px-3.5 rounded-xl bg-[#050B18] hover:bg-[#0D1E3D] border border-[rgba(100,150,255,0.28)] text-xs font-semibold text-[#C8D8F4] hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {/* Quick Example Presets */}
                <div className="pt-3 border-t border-[rgba(100,150,255,0.14)]">
                  <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#7D94B8] mb-2.5">
                    Try Instant Project Ideas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STARTER_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        disabled={loading}
                        onClick={() => handlePresetClick(preset)}
                        className="motion-press text-left px-2.5 py-1.5 rounded-lg bg-[#050B18] hover:bg-[#0D1E3D] border border-[rgba(100,150,255,0.2)] hover:border-[#00C8FF]/55 text-xs text-[#C8D8F4] hover:text-white transition-colors disabled:opacity-50"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Right Workbench: Output Stage */}
            <div className="lg:col-span-7">
              {!blueprint && !loading && (
                <div className="rounded-2xl bg-[#09142B]/80 border border-[rgba(100,150,255,0.18)] p-6 sm:p-8 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#00C8FF]">
                        Ready for Your Schematic
                      </p>
                      <h3 className="font-hero text-xl sm:text-2xl font-bold text-[#F5F8FF] mt-1">
                        What the AI Project Architect prepares for you
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#0866F5]/15 border border-[#0866F5]/35 flex items-center justify-center shrink-0">
                      <Cpu className="w-5 h-5 text-[#2F8BFF]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {[
                      {
                        step: '01',
                        icon: Layers,
                        title: 'Full Hardware BOM',
                        desc: 'Lists every board, sensor, driver, and battery needed with exact quantities.',
                      },
                      {
                        step: '02',
                        icon: PackageCheck,
                        title: 'Store Stock Match',
                        desc: 'Separates parts in our Dhaka warehouse from external DIY items, with 1-click cart add.',
                      },
                      {
                        step: '03',
                        icon: Cable,
                        title: 'Wiring & Build Steps',
                        desc: 'Step-by-step assembly, pin-to-pin wiring map, safety checks, and starter test code.',
                      },
                    ].map((card) => {
                      const Icon = card.icon;
                      return (
                        <div
                          key={card.step}
                          className="rounded-xl bg-[#050B18]/85 border border-[rgba(100,150,255,0.16)] p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-mono text-[11px] text-[#00C8FF]">{card.step}</span>
                            <Icon className="w-4 h-4 text-[#69A8FF]" />
                          </div>
                          <p className="font-display text-sm font-bold text-white">{card.title}</p>
                          <p className="text-xs text-[#9BB0D4] mt-1.5 leading-relaxed">
                            {card.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {loading && (
                <div className="rounded-2xl bg-[#09142B] border border-[rgba(0,200,255,0.28)] p-6 sm:p-8 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0866F5]/20 border border-[#00C8FF]/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-[#00C8FF] animate-spin" />
                    </div>
                    <div>
                      <p className="font-display text-base font-bold text-white">
                        Architecting Your Build Plan...
                      </p>
                      <p className="text-xs text-[#9BB0D4]">
                        Checking {products.length} Robotera BD catalog items &amp; calculating pin
                        connections
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-16 rounded-xl bg-[#050B18]/80 border border-[rgba(100,150,255,0.14)] animate-pulse" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="h-24 rounded-xl bg-[#050B18]/80 border border-[rgba(100,150,255,0.14)] animate-pulse" />
                      <div className="h-24 rounded-xl bg-[#050B18]/80 border border-[rgba(100,150,255,0.14)] animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {blueprint && !loading && (
                <div className="rounded-2xl bg-[#09142B] border border-[rgba(100,150,255,0.22)] overflow-hidden shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">
                  {/* Blueprint Header */}
                  <div className="p-5 sm:p-6 border-b border-[rgba(100,150,255,0.16)] bg-gradient-to-br from-[#0B1936] to-[#081226]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#00C8FF] mb-1.5">
                          <span>{blueprint.difficulty}</span>
                          <span className="text-slate-600" aria-hidden="true">
                            ·
                          </span>
                          <span className="inline-flex items-center gap-1 text-[#A8BCE0]">
                            <Clock className="w-3 h-3 text-[#00C8FF]" />
                            {blueprint.estimatedBuildTime}
                          </span>
                          <span className="text-slate-600" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-emerald-400 font-semibold">
                            {matchedRows.length}/{resolvedParts.length} In Catalog
                          </span>
                        </div>
                        <h3 className="font-hero text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                          {blueprint.projectTitle}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#B8C7E0] mt-2 leading-relaxed">
                          {blueprint.summary}
                        </p>
                      </div>

                      {inStockRows.length > 0 && (
                        <button
                          type="button"
                          onClick={handleAddAllInStock}
                          className={`cta-sheen motion-press shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors ${
                            bundleAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#0866F5] hover:bg-[#1685FF] text-white'
                          }`}
                        >
                          {bundleAdded ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Added {inStockRows.length} Items</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>
                                Add All Available ({inStockRows.length}) · ৳
                                {inStockTotalBdt.toLocaleString('en-IN')}
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Power Rail Bar */}
                    <div className="mt-4 rounded-xl bg-[#050B18]/85 border border-[rgba(100,150,255,0.16)] px-3.5 py-2.5 flex items-center gap-2.5 text-xs">
                      <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-mono text-[11px] text-[#7D94B8] shrink-0">
                        Power Rail:
                      </span>
                      <span className="font-mono text-[11.5px] text-[#E2ECFF] truncate">
                        {blueprint.powerArchitecture}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Output Tabs */}
                  <div className="px-5 sm:px-6 pt-3 border-b border-[rgba(100,150,255,0.14)] flex flex-wrap items-center gap-2 bg-[#071124]">
                    {[
                      {
                        id: 'parts' as const,
                        label: `Parts & Store Stock (${resolvedParts.length})`,
                        icon: PackageCheck,
                      },
                      {
                        id: 'diagram' as const,
                        label: 'Circuit Diagram',
                        icon: Cable,
                      },
                      {
                        id: 'steps' as const,
                        label: `How to Build & Wire (${blueprint.buildSteps.length})`,
                        icon: Wrench,
                      },
                      {
                        id: 'code' as const,
                        label: `${blueprint.starterCodeLanguage} Sketch`,
                        icon: Code2,
                      },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const active = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                            active
                              ? 'border-[#00C8FF] text-white'
                              : 'border-transparent text-[#8CA3C9] hover:text-white'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Content */}
                  <div className="p-5 sm:p-6">
                    {activeTab === 'parts' && (
                      <div className="space-y-6">
                        {/* Available at Robotera BD */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span>Available in Robotera BD Catalog ({matchedRows.length})</span>
                            </h4>
                            {inStockRows.length > 0 && (
                              <span className="font-mono text-xs text-[#9BB0D4] tabular-nums">
                                Subtotal: ৳{inStockTotalBdt.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>

                          {matchedRows.length === 0 ? (
                            <p className="text-xs text-[#9BB0D4] rounded-xl bg-[#050B18] border border-[rgba(100,150,255,0.14)] p-4">
                              No direct store catalog items matched automatically for this custom
                              request—see the full parts list below.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {matchedRows.map(({ part, matchedProduct }) => {
                                const inStock = matchedProduct.stock > 0;
                                const isAdded = Boolean(addedIds[matchedProduct.id]);
                                const effectiveQty = Math.min(part.quantity, Math.max(1, matchedProduct.stock));
                                const lineTotal = matchedProduct.price * part.quantity;

                                return (
                                  <div
                                    key={`${matchedProduct.id}-${part.partName}`}
                                    className="group rounded-xl bg-[#050B18]/90 border border-[rgba(100,150,255,0.18)] hover:border-[#00C8FF]/45 p-3.5 flex flex-col justify-between gap-3 transition-colors"
                                  >
                                    <div className="flex items-start gap-3">
                                      <button
                                        type="button"
                                        onClick={() => onSelectProduct(matchedProduct)}
                                        className="w-14 h-14 rounded-xl bg-white p-1.5 shrink-0 flex items-center justify-center overflow-hidden"
                                        aria-label={`Inspect ${matchedProduct.name}`}
                                      >
                                        <HardwareArtwork
                                          kind={matchedProduct.artwork}
                                          imageUrl={matchedProduct.imageUrl}
                                          alt={matchedProduct.name}
                                          fit="contain"
                                          className="thumb-hover-zoom w-full h-full"
                                        />
                                      </button>

                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2 text-[10.5px] font-mono">
                                          <span className="text-[#00C8FF]">
                                            Need {part.quantity}×
                                          </span>
                                          <span
                                            className={
                                              inStock ? 'text-emerald-400' : 'text-amber-400'
                                            }
                                          >
                                            {inStock
                                              ? `${matchedProduct.stock} in Dhaka stock`
                                              : 'Out of Stock'}
                                          </span>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => onSelectProduct(matchedProduct)}
                                          className="text-left w-full mt-0.5"
                                        >
                                          <p className="font-display text-[13px] font-bold text-white group-hover:text-[#69A8FF] line-clamp-2 leading-snug transition-colors">
                                            {matchedProduct.name}
                                          </p>
                                        </button>

                                        <p className="text-[11px] text-[#9BB0D4] line-clamp-2 mt-1 leading-relaxed">
                                          {part.purpose}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="pt-2.5 border-t border-[rgba(100,150,255,0.12)] flex items-center justify-between gap-2">
                                      <div>
                                        <span className="font-mono text-sm font-bold text-white tabular-nums">
                                          ৳{lineTotal.toLocaleString('en-IN')}
                                        </span>
                                        {part.quantity > 1 && (
                                          <span className="ml-1.5 font-mono text-[10.5px] text-[#7D94B8] tabular-nums">
                                            (৳{matchedProduct.price.toLocaleString('en-IN')} ea)
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => onSelectProduct(matchedProduct)}
                                          className="px-2.5 py-1.5 rounded-lg bg-[#0B1936] hover:bg-[#122650] border border-[rgba(100,150,255,0.2)] text-[11px] font-semibold text-[#C8D8F4] inline-flex items-center gap-1 transition-colors"
                                        >
                                          <span>Specs</span>
                                          <ArrowUpRight className="w-3 h-3" />
                                        </button>

                                        {inStock ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleAddSingleMatched(matchedProduct, effectiveQty)
                                            }
                                            className={`motion-press px-2.5 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors ${
                                              isAdded
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-[#0866F5] hover:bg-[#1685FF] text-white'
                                            }`}
                                          >
                                            {isAdded ? (
                                              <>
                                                <Check className="w-3 h-3" />
                                                <span>Added</span>
                                              </>
                                            ) : (
                                              <>
                                                <Plus className="w-3 h-3" />
                                                <span>Add {effectiveQty}</span>
                                              </>
                                            )}
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => onSelectProduct(matchedProduct)}
                                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-400/35 text-[11px] font-semibold text-amber-300"
                                          >
                                            Notify Me
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Additional Required / DIY Items */}
                        {externalRows.length > 0 && (
                          <div>
                            <h4 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-3">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span>
                                Additional Items Needed ({externalRows.length} · Not in Catalog)
                              </span>
                            </h4>
                            <div className="space-y-2">
                              {externalRows.map(({ part }) => (
                                <div
                                  key={`ext-${part.partName}`}
                                  className="rounded-xl bg-[#050B18]/70 border border-[rgba(100,150,255,0.14)] px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-[#E2ECFF]">
                                      <span className="font-mono text-amber-300 mr-1.5">
                                        {part.quantity}×
                                      </span>
                                      {part.partName}
                                    </p>
                                    <p className="text-[11px] text-[#9BB0D4] mt-0.5">
                                      {part.purpose}
                                    </p>
                                  </div>
                                  <span className="text-[11px] font-mono text-[#7D94B8] sm:text-right shrink-0">
                                    {part.matchNote}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              playTapSound();
                              setChatSeedPrompt(
                                `Explain step-by-step wiring or component alternatives for "${blueprint.projectTitle}".`
                              );
                              setWorkspaceMode('chat');
                            }}
                            className="text-xs font-semibold text-[#C8D8F4] hover:text-[#00C8FF] inline-flex items-center gap-1.5 transition-colors"
                          >
                            <MessageSquareText className="w-3.5 h-3.5 text-[#00C8FF]" />
                            <span>Ask Follow-Up in AI Chat</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playTapSound();
                              setActiveTab('diagram');
                            }}
                            className="text-xs font-semibold text-[#00C8FF] hover:text-white inline-flex items-center gap-1.5 transition-colors"
                          >
                            <span>View Interactive Circuit Diagram</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'diagram' && (
                      <CircuitDiagramD3
                        blueprint={blueprint}
                        productById={productById}
                        onSelectProduct={onSelectProduct}
                      />
                    )}

                    {activeTab === 'steps' && (
                      <div className="space-y-5">
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-[#061024] border border-[rgba(0,200,255,0.2)] px-3.5 py-2.5">
                          <span className="text-xs text-[#A8BCE0]">
                            Want to see these pin connections laid out visually?
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              playTapSound();
                              setActiveTab('diagram');
                            }}
                            className="shrink-0 text-xs font-semibold text-[#00C8FF] hover:text-white inline-flex items-center gap-1 transition-colors"
                          >
                            <Cable className="w-3.5 h-3.5" />
                            <span>Open Circuit Diagram</span>
                          </button>
                        </div>
                        <div className="space-y-3">
                          {blueprint.buildSteps.map((step) => (
                            <div
                              key={step.stepNumber}
                              className="rounded-xl bg-[#050B18]/85 border border-[rgba(100,150,255,0.16)] p-4"
                            >
                              <div className="flex items-start gap-3">
                                <span className="w-7 h-7 rounded-lg bg-[#0866F5]/20 border border-[#0866F5]/45 text-[#69A8FF] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                                  {step.stepNumber}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-display text-sm font-bold text-white">
                                    {step.title}
                                  </h4>
                                  <p className="text-xs sm:text-[13px] text-[#B8C7E0] mt-1 leading-relaxed">
                                    {step.detail}
                                  </p>
                                  {step.wiringConnections.length > 0 && (
                                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                                      {step.wiringConnections.map((wire, idx) => (
                                        <span
                                          key={`${step.stepNumber}-w-${idx}`}
                                          className="font-mono text-[11px] text-[#00C8FF] bg-[#0A1833] border border-[rgba(0,200,255,0.25)] rounded-md px-2 py-1"
                                        >
                                          {wire}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {blueprint.safetyAndProTips.length > 0 && (
                          <div className="rounded-xl bg-amber-950/25 border border-amber-500/30 p-4">
                            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber-300 flex items-center gap-1.5 mb-2">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Bench Safety &amp; Pro Checks</span>
                            </p>
                            <ul className="space-y-1.5">
                              {blueprint.safetyAndProTips.map((tip, i) => (
                                <li
                                  key={`tip-${i}`}
                                  className="text-xs text-amber-100/90 flex items-start gap-2 leading-relaxed"
                                >
                                  <span className="text-amber-400 font-mono">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'code' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-[#A8BCE0]">
                            {blueprint.starterCodeLanguage} · Initial Bench Verification Sketch
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyCode}
                            className="motion-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1936] hover:bg-[#132957] border border-[rgba(100,150,255,0.24)] text-xs font-semibold text-white transition-colors"
                          >
                            {codeCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>

                        <pre className="rounded-xl bg-[#040812] border border-[rgba(100,150,255,0.18)] p-4 text-xs font-mono text-[#CFE3FF] overflow-x-auto leading-relaxed max-h-[380px]">
                          <code>
                            {blueprint.starterCodeSketch
                              ? blueprint.starterCodeSketch.includes('\n')
                                ? blueprint.starterCodeSketch
                                : blueprint.starterCodeSketch.replace(/;\s+/g, ';\n')
                              : '// No starter firmware snippet generated for this project.'}
                          </code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
};
