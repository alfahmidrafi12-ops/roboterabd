import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Cable,
  Check,
  Code2,
  Cpu,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  User as UserIcon,
  Zap,
} from 'lucide-react';
import { playErrorSound, playTapSound } from '../lib/sound';
import { AddToCartResult, Product } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';

export type ChatRoleId = 'stock-advisor' | 'circuit-debug' | 'firmware-mentor';
export type ChatSpeedMode = 'fast' | 'balanced';

export interface ChatTurnMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  streaming?: boolean;
}

interface RoboticsAiChatProps {
  products: Product[];
  projectContext?: string;
  seedPrompt?: string | null;
  onSeedPromptConsumed?: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    variant?: string,
    silentToast?: boolean
  ) => AddToCartResult | void;
  onSelectProduct: (product: Product) => void;
}

const CHAT_ROLES: {
  id: ChatRoleId;
  label: string;
  desc: string;
  icon: typeof Cpu;
}[] = [
  {
    id: 'stock-advisor',
    label: 'Stock & Parts Advisor',
    desc: 'Pick Dhaka in-stock hardware, compare prices & compatibility',
    icon: Cpu,
  },
  {
    id: 'circuit-debug',
    label: 'Wiring Troubleshooter',
    desc: 'Pinouts, 3.3V/5V logic dividers, LiPo & power rail fixes',
    icon: Cable,
  },
  {
    id: 'firmware-mentor',
    label: 'Firmware & Code Mentor',
    desc: 'Arduino C++, MicroPython & ESP32 library guidance',
    icon: Code2,
  },
];

const QUICK_CHAT_PROMPTS: Record<ChatRoleId, string[]> = {
  'stock-advisor': [
    'Amar 3000 takar moddhe ESP32 diye ki ki project kora jabe?',
    'Compare ESP32-S3 vs Arduino Mega for a multi-sensor rover',
    'Which power bank or LiPo + buck converter is in stock for servos?',
  ],
  'circuit-debug': [
    'MG996R servo ar ESP32 kibhabe power dibo jeno brownout na hoy?',
    'How do I wire 0.96" OLED and HC-SR04P safely to ESP32-S3?',
    'BTS7960 43A motor driver pin connections for 12V rover motors',
  ],
  'firmware-mentor': [
    'Give me clean Arduino C++ test code for HC-SR04P + SSD1306 OLED',
    'How to read RPLIDAR A1M8 UART data cleanly on ESP32 or Pi 5?',
    'Write non-blocking millis() servo sweep code for 6-DOF arm',
  ],
};

function findMentionedCatalogProducts(text: string, products: Product[]): Product[] {
  if (!text.trim() || products.length === 0) return [];
  const lower = text.toLowerCase();
  const matched: Product[] = [];
  for (const prod of products) {
    const skuMatch = prod.sku && lower.includes(prod.sku.toLowerCase());
    const nameTokens = prod.name
      .toLowerCase()
      .split(/[\s—/]+/)
      .filter((t) => t.length >= 4 && !['with', 'board', 'module', 'motor', 'sensor', 'kit'].includes(t));
    const keyHits = nameTokens.filter((t) => lower.includes(t)).length;
    const fullMatch = lower.includes(prod.name.toLowerCase());
    if (skuMatch || fullMatch || keyHits >= 2) {
      matched.push(prod);
    }
    if (matched.length >= 3) break;
  }
  return matched;
}

function renderInlineSegments(line: string): React.ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, pIdx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={pIdx} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={pIdx}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-[#0C1D3F] border border-[rgba(0,200,255,0.25)] font-mono text-[11px] text-[#00C8FF]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={pIdx}>{part}</React.Fragment>;
  });
}

function renderFormattedMessage(text: string): React.ReactNode {
  const segments = text.split(/(```[\s\S]*?```)/g);
  return segments.map((segment, segIdx) => {
    if (segment.startsWith('```') && segment.endsWith('```')) {
      const inner = segment.slice(3, -3).replace(/^[a-zA-Z0-9+#_-]+\n/, '').trim();
      return (
        <pre
          key={`code-${segIdx}`}
          className="my-2.5 rounded-xl bg-[#030711] border border-[rgba(100,150,255,0.22)] p-3 font-mono text-[11.5px] text-[#CFE3FF] overflow-x-auto leading-relaxed"
        >
          <code>{inner}</code>
        </pre>
      );
    }
    return segment.split('\n').map((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={`sp-${segIdx}-${lineIdx}`} className="h-1.5" />;
      }
      const headingMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
      if (headingMatch) {
        return (
          <p
            key={`hd-${segIdx}-${lineIdx}`}
            className="font-display text-[13px] font-bold text-[#00C8FF] pt-1.5 pb-0.5"
          >
            {renderInlineSegments(headingMatch[1])}
          </p>
        );
      }
      const bulletMatch = trimmed.match(/^(?:[-*]|\d+\.)\s+(.+)$/);
      if (bulletMatch) {
        const marker = /^\d+\./.test(trimmed) ? trimmed.match(/^\d+\./)?.[0] : '•';
        return (
          <div key={`li-${segIdx}-${lineIdx}`} className="flex items-start gap-2 pl-1 leading-relaxed">
            <span className="font-mono text-[#00C8FF] shrink-0 select-none">{marker}</span>
            <span className="min-w-0 flex-1">{renderInlineSegments(bulletMatch[1])}</span>
          </div>
        );
      }
      return (
        <p key={`ln-${segIdx}-${lineIdx}`} className="leading-relaxed">
          {renderInlineSegments(line)}
        </p>
      );
    });
  });
}

export const RoboticsAiChat: React.FC<RoboticsAiChatProps> = ({
  products,
  projectContext,
  seedPrompt,
  onSeedPromptConsumed,
  onAddToCart,
  onSelectProduct,
}) => {
  const [roleId, setRoleId] = useState<ChatRoleId>('stock-advisor');
  const [speedMode, setSpeedMode] = useState<ChatSpeedMode>('fast');
  const [messages, setMessages] = useState<ChatTurnMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [addedProductIds, setAddedProductIds] = useState<Record<string, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const userAbortedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const activeRole = useMemo(
    () => CHAT_ROLES.find((r) => r.id === roleId) ?? CHAT_ROLES[0],
    [roleId]
  );

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  useEffect(() => {
    if (seedPrompt && seedPrompt.trim()) {
      setInput(seedPrompt);
      onSeedPromptConsumed?.();
    }
  }, [seedPrompt, onSeedPromptConsumed]);

  useEffect(() => {
    return () => {
      userAbortedRef.current = true;
      abortControllerRef.current?.abort();
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  const stopStreaming = () => {
    userAbortedRef.current = true;
    abortControllerRef.current?.abort();
  };

  const sendMessage = async (overrideText?: string) => {
    const userText = (overrideText ?? input).trim();
    if (!userText || streaming) return;

    playTapSound();
    setErrorMsg('');
    if (!overrideText) setInput('');

    const userMsg: ChatTurnMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: userText,
    };
    const modelMsgId = `m-${Date.now() + 1}`;
    const placeholderModelMsg: ChatTurnMessage = {
      id: modelMsgId,
      role: 'model',
      text: '',
      streaming: true,
    };

    // Keep strictly valid alternating user -> model history turns
    const historySnapshot: { role: 'user' | 'model'; text: string }[] = [];
    for (const m of messages) {
      const clean = m.text.trim();
      if (!clean) continue;
      const last = historySnapshot[historySnapshot.length - 1];
      if (!last && m.role === 'model') continue;
      if (last && last.role === m.role) {
        last.text = `${last.text}\n${clean}`;
      } else {
        historySnapshot.push({ role: m.role, text: clean });
      }
    }
    while (historySnapshot.length > 0 && historySnapshot[historySnapshot.length - 1].role !== 'model') {
      historySnapshot.pop();
    }

    setMessages((prev) => [...prev, userMsg, placeholderModelMsg]);
    setStreaming(true);
    userAbortedRef.current = false;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 28000);

    const compactCatalog = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      categoryLabel: p.categoryLabel,
      price: p.price,
      stock: p.stock,
    }));

    const processSseEvents = (rawEvents: string[]) => {
      for (const evt of rawEvents) {
        const dataLines = evt
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim());
        for (const rawJson of dataLines) {
          if (!rawJson) continue;
          const payload = JSON.parse(rawJson) as {
            chunk?: string;
            done?: boolean;
            error?: string;
          };
          if (payload.error) {
            throw new Error(payload.error);
          }
          if (payload.chunk) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === modelMsgId ? { ...m, text: m.text + payload.chunk } : m
              )
            );
          }
        }
      }
    };

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: userText,
          history: historySnapshot,
          roleId,
          speedMode,
          projectContext,
          catalogItems: compactCatalog,
        }),
      });

      if (!response.ok || !response.body) {
        const errPayload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          errPayload.error || 'Could not reach the Gemini chatbot right now. Please try again.'
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        sseBuffer = (sseBuffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, '\n');
        const events = sseBuffer.split('\n\n');
        sseBuffer = events.pop() || '';
        processSseEvents(events);
      }

      const trailing = sseBuffer.trim();
      if (trailing) {
        processSseEvents(trailing.split('\n\n'));
      }

      setMessages((prev) =>
        prev
          .filter((m) => !(m.id === modelMsgId && m.text.trim() === ''))
          .map((m) => (m.id === modelMsgId ? { ...m, streaming: false } : m))
      );
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (isAbort && userAbortedRef.current) {
        setMessages((prev) =>
          prev
            .filter((m) => !(m.id === modelMsgId && m.text.trim() === ''))
            .map((m) => (m.id === modelMsgId ? { ...m, streaming: false } : m))
        );
      } else {
        playErrorSound();
        const errText = isAbort
          ? 'AI response timed out. Please try Fast mode or send again.'
          : err instanceof Error
          ? err.message
          : 'Unable to complete AI chat response.';
        setErrorMsg(errText);
        setMessages((prev) =>
          prev
            .filter((m) => !(m.id === modelMsgId && m.text.trim() === ''))
            .map((m) => (m.id === modelMsgId ? { ...m, streaming: false } : m))
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setStreaming(false);
    }
  };

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleQuickAdd = (product: Product) => {
    if (product.stock <= 0) return;
    const res = onAddToCart(product, 1);
    if (!res || res.addedQty > 0) {
      setAddedProductIds((prev) => ({ ...prev, [product.id]: true }));
      const id = window.setTimeout(() => {
        timersRef.current = timersRef.current.filter((t) => t !== id);
        setAddedProductIds((prev) => ({ ...prev, [product.id]: false }));
      }, 1500);
      timersRef.current.push(id);
    }
  };

  return (
    <div className="rounded-2xl bg-[#091633] border border-[#00C8FF]/35 ring-1 ring-[#0866F5]/30 overflow-hidden shadow-[0_24px_64px_-24px_rgba(0,200,255,0.28)]">
      {/* Top Role & Speed Controls */}
      <div className="p-4 sm:p-5 border-b border-[rgba(100,150,255,0.18)] bg-[#071124] space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0866F5]/20 border border-[#00C8FF]/45 flex items-center justify-center shrink-0">
              <Bot className="w-4.5 h-4.5 text-[#00C8FF]" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Robotera Multi-Turn AI Engineer</span>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#00C8FF] bg-[#08224A] border border-[#00C8FF]/35 px-2 py-0.5 rounded-md">
                  {speedMode === 'fast' ? 'Flash Lite' : '4 Hydrogen'}
                </span>
              </h3>
              <p className="text-[11.5px] text-[#9BB0D4]">{activeRole.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="inline-flex rounded-xl bg-[#050B18] border border-[rgba(100,150,255,0.22)] p-1 gap-1">
              <button
                type="button"
                onClick={() => setSpeedMode('fast')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors ${
                  speedMode === 'fast'
                    ? 'bg-[#0866F5] text-white'
                    : 'text-[#8CA3C9] hover:text-white'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Fast</span>
              </button>
              <button
                type="button"
                onClick={() => setSpeedMode('balanced')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors ${
                  speedMode === 'balanced'
                    ? 'bg-[#0866F5] text-white'
                    : 'text-[#8CA3C9] hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Detailed</span>
              </button>
            </div>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  stopStreaming();
                  setMessages([]);
                  setErrorMsg('');
                }}
                className="motion-press px-2.5 py-1.5 rounded-xl bg-[#050B18] hover:bg-[#0D1E3D] border border-[rgba(100,150,255,0.22)] text-[11px] font-semibold text-[#C8D8F4] inline-flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>New Chat</span>
              </button>
            )}
          </div>
        </div>

        {/* Specific Chatbot Role Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {CHAT_ROLES.map((role) => {
            const Icon = role.icon;
            const selected = role.id === roleId;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  playTapSound();
                  setRoleId(role.id);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all ${
                  selected
                    ? 'bg-[#0C214A] border-[#00C8FF]/65 text-white shadow-[0_8px_20px_-12px_rgba(0,200,255,0.5)]'
                    : 'bg-[#050B18]/75 border-[rgba(100,150,255,0.16)] text-[#9BB0D4] hover:text-white hover:border-[rgba(100,150,255,0.35)]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${selected ? 'text-[#00C8FF]' : 'text-[#69A8FF]'}`}
                />
                <span className="text-xs font-semibold truncate">{role.label}</span>
              </button>
            );
          })}
        </div>

        {projectContext && (
          <div className="rounded-lg bg-[#050B18]/80 border border-emerald-400/30 px-3 py-1.5 text-[11px] text-emerald-200 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate">
              Active Build Context Loaded: <strong className="text-white">{projectContext.split('\n')[0]}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Scrollable Multi-Turn Conversation Thread */}
      <div
        ref={scrollContainerRef}
        className="h-[400px] sm:h-[460px] overflow-y-auto px-4 sm:px-6 py-5 space-y-4 bg-[#050B18]/75"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-[#08224A] border border-[#00C8FF]/45 flex items-center justify-center shadow-[0_0_28px_-10px_rgba(0,200,255,0.6)]">
              <Sparkles className="w-5 h-5 text-[#00C8FF]" />
            </div>
            <div>
              <h4 className="font-hero text-lg sm:text-xl font-bold text-white">
                Ask anything about parts, wiring, or code
              </h4>
              <p className="text-xs sm:text-sm text-[#9BB0D4] mt-1.5 leading-relaxed">
                This chat keeps full conversation memory and knows all {products.length} Robotera BD
                Dhaka catalog items, prices, and stock counts. Ask follow-ups in English or Banglish.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 w-full">
              {QUICK_CHAT_PROMPTS[roleId].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => void sendMessage(sample)}
                  className="motion-press text-left px-3 py-2 rounded-xl bg-[#091633] hover:bg-[#0D214D] border border-[rgba(100,150,255,0.24)] hover:border-[#00C8FF]/60 text-xs text-[#D6E4FF] transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const mentionedProducts =
              !isUser && !msg.streaming ? findMentionedCatalogProducts(msg.text, products) : [];

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#08224A] border border-[#00C8FF]/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-[#00C8FF]" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[78%] space-y-2.5 ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs sm:text-[13px] ${
                      isUser
                        ? 'bg-[#0866F5] text-white rounded-tr-sm shadow-[0_10px_24px_-12px_rgba(8,102,245,0.7)]'
                        : 'bg-[#091633] border border-[rgba(100,150,255,0.22)] text-[#DCE8FF] rounded-tl-sm'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    ) : msg.text ? (
                      <div className="space-y-1">
                        {renderFormattedMessage(msg.text)}
                        {msg.streaming && (
                          <span className="inline-block w-2 h-3.5 bg-[#00C8FF] ml-1 align-middle animate-pulse rounded-[1px]" />
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[#8CA3C9]">
                        <span className="w-2 h-2 rounded-full bg-[#00C8FF] animate-ping" />
                        <span>Thinking...</span>
                      </div>
                    )}
                  </div>

                  {/* Clickable Store Catalog Matches Mentioned in AI Reply */}
                  {mentionedProducts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                      {mentionedProducts.map((prod) => {
                        const isAdded = Boolean(addedProductIds[prod.id]);
                        return (
                          <div
                            key={`${msg.id}-${prod.id}`}
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-[#071124] border border-[rgba(0,200,255,0.24)]"
                          >
                            <button
                              type="button"
                              onClick={() => onSelectProduct(prod)}
                              className="w-10 h-10 rounded-lg bg-white p-1 shrink-0 flex items-center justify-center overflow-hidden"
                            >
                              <HardwareArtwork
                                kind={prod.artwork}
                                imageUrl={prod.imageUrl}
                                alt={prod.name}
                                fit="contain"
                                className="w-full h-full"
                              />
                            </button>
                            <div className="min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => onSelectProduct(prod)}
                                className="text-left w-full"
                              >
                                <p className="text-[11px] font-bold text-white hover:text-[#00C8FF] truncate transition-colors">
                                  {prod.name}
                                </p>
                              </button>
                              <p className="font-mono text-[10.5px] text-[#9BB0D4] tabular-nums">
                                ৳{prod.price.toLocaleString('en-IN')} ·{' '}
                                <span
                                  className={
                                    prod.stock > 0 ? 'text-emerald-400' : 'text-amber-400'
                                  }
                                >
                                  {prod.stock > 0 ? `${prod.stock} in stock` : 'Out of stock'}
                                </span>
                              </p>
                            </div>
                            {prod.stock > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleQuickAdd(prod)}
                                className={`px-2 py-1 rounded-lg text-[10.5px] font-semibold shrink-0 inline-flex items-center gap-1 transition-colors ${
                                  isAdded
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-[#0866F5] hover:bg-[#1685FF] text-white'
                                }`}
                              >
                                {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                <span>{isAdded ? 'Added' : 'Add'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onSelectProduct(prod)}
                                className="p-1.5 rounded-lg bg-[#0D1E3D] text-[#00C8FF]"
                                aria-label={`Inspect ${prod.name}`}
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#0866F5]/25 border border-[#0866F5]/45 flex items-center justify-center shrink-0 mt-0.5">
                    <UserIcon className="w-4 h-4 text-[#69A8FF]" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Error & Message Composer */}
      <div className="p-3.5 sm:p-4 border-t border-[rgba(100,150,255,0.18)] bg-[#071124] space-y-2.5">
        {errorMsg && (
          <div
            role="alert"
            className="rounded-xl bg-rose-950/75 border border-rose-500/45 px-3 py-2 flex items-start gap-2 text-xs text-rose-200"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage();
          }}
          className="flex items-end gap-2.5"
        >
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder={`Ask ${activeRole.label} in English or Banglish... (Enter to send)`}
            className="flex-1 rounded-xl bg-[#050B18] border border-[rgba(100,150,255,0.24)] focus:border-[#00C8FF] focus:outline-none px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-[#5B7096] resize-none min-h-[48px] max-h-[120px] transition-colors"
          />
          {streaming ? (
            <button
              type="button"
              onClick={() => {
                playTapSound();
                stopStreaming();
              }}
              className="motion-press h-12 px-4 sm:px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shrink-0 transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="cta-sheen motion-press h-12 px-4 sm:px-5 rounded-xl bg-[#0866F5] hover:bg-[#1685FF] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shrink-0 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
