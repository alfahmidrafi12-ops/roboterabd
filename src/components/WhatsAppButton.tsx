import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronUp,
  Clock,
  Copy,
  Cpu,
  PackageCheck,
  Send,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { playTapSound } from '../lib/sound';

const WHATSAPP_PHONE = '8801624987366';
const WHATSAPP_DISPLAY = '+880 1624-987366';

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
  'Hello Robotera BD, I need support with robotics and electronics orders.'
)}`;

const QUICK_TOPICS = [
  {
    id: 'order',
    title: 'Order & Courier Status',
    subtitle: 'Track Steadfast / Pathao dispatch or edit order',
    icon: PackageCheck,
    text: 'Hello Robotera BD, I would like an update on my order and courier dispatch status.',
  },
  {
    id: 'tech',
    title: 'Kit & Component Advice',
    subtitle: 'Check compatibility for ESP32, LiPo, motors & sensors',
    icon: Cpu,
    text: 'Hello Robotera BD, I need engineering help picking compatible components for my project.',
  },
  {
    id: 'bulk',
    title: 'University Lab / Bulk Quote',
    subtitle: 'Wholesale pricing for clubs, labs & competitions',
    icon: Users,
    text: 'Hello Robotera BD, I would like a bulk / university robotics club quotation.',
  },
  {
    id: 'warranty',
    title: '7-Day Lab Warranty Help',
    subtitle: 'ESD test replacement or technical troubleshooting',
    icon: ShieldCheck,
    text: 'Hello Robotera BD, I need assistance with component testing or warranty support.',
  },
];

const WhatsAppGlyph: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M12.03 2C6.51 2 2.02 6.48 2.02 12c0 1.76.46 3.48 1.34 5L2 22l5.13-1.34A9.96 9.96 0 0 0 12.03 22c5.52 0 10-4.48 10-10S17.55 2 12.03 2Zm5.82 14.18c-.25.7-1.44 1.34-2 1.42-.52.08-1.18.11-1.91-.12-.44-.14-1-.33-1.72-.64-3.02-1.3-4.99-4.35-5.14-4.55-.15-.2-1.23-1.64-1.23-3.13s.78-2.22 1.06-2.52c.28-.3.61-.38.81-.38.2 0 .41 0 .59.01.19.01.44-.07.69.53.25.6.86 2.09.94 2.24.08.15.13.33.02.53-.1.2-.15.33-.31.51-.15.18-.32.4-.46.54-.15.15-.31.32-.13.62.18.3.79 1.3 1.7 2.11 1.17 1.04 2.15 1.36 2.46 1.51.3.15.48.13.66-.08.18-.2.76-.88.96-1.18.2-.3.4-.25.67-.15.28.1 1.75.83 2.05.98.3.15.5.22.58.35.08.13.08.73-.17 1.43Z" />
  </svg>
);

export const WhatsAppButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleCopyPhone = () => {
    playTapSound();
    navigator.clipboard?.writeText(WHATSAPP_DISPLAY).catch(() => {});
    setCopiedNumber(true);
    window.setTimeout(() => setCopiedNumber(false), 1800);
  };

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    const text =
      customMessage.trim() ||
      'Hello Robotera BD, I need support with robotics and electronics orders.';
    const targetUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
    const link = document.createElement('a');
    link.href = targetUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCustomMessage('');
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-5 right-3 sm:right-5 z-40 flex flex-col items-end gap-2.5 font-sans"
    >
      {open && (
        <div
          role="dialog"
          aria-label="Robotera BD WhatsApp Concierge"
          className="animate-pop-in w-[min(calc(100vw-1.5rem),22.5rem)] rounded-2xl bg-[#071A3D] text-white border border-emerald-400/35 shadow-[0_26px_60px_-12px_rgba(3,12,28,0.72)] overflow-hidden"
        >
          {/* Concierge Header */}
          <div className="relative overflow-hidden px-4 py-3.5 bg-gradient-to-r from-[#064E3B] via-[#0F766E] to-[#071A3D] border-b border-white/12 flex items-center justify-between gap-3">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-45" />
            <div className="relative z-10 flex items-center gap-2.5 min-w-0">
              <span className="w-10 h-10 rounded-xl bg-emerald-400/20 border border-emerald-300/45 flex items-center justify-center text-emerald-200 shrink-0">
                <WhatsAppGlyph className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-white leading-tight truncate">
                  Robotera BD WhatsApp Desk
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-emerald-100/90 font-mono tabular-nums">
                  <span className="truncate">{WHATSAPP_DISPLAY}</span>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    aria-label="Copy WhatsApp support number"
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-sans font-semibold text-white transition-colors shrink-0"
                  >
                    {copiedNumber ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-emerald-300" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close WhatsApp support menu"
              className="relative z-10 p-1.5 rounded-xl text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Support Hours Strip */}
          <div className="px-4 py-2 bg-[#05132E] border-b border-white/10 flex items-center justify-between text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-emerald-300 shrink-0" />
              <span>Dhaka Lab Hours: 10 AM – 10 PM</span>
            </span>
            <span className="font-mono text-emerald-300 font-semibold">Fast Reply</span>
          </div>

          {/* Quick Inquiry Options + Custom Message Input */}
          <div className="p-3.5 space-y-2.5 bg-[#071A3D]">
            <p className="px-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
              Select a support topic
            </p>
            <div className="space-y-1.5">
              {QUICK_TOPICS.map((topic, idx) => {
                const Icon = topic.icon;
                const href = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
                  topic.text
                )}`;
                return (
                  <a
                    key={topic.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      playTapSound();
                      setOpen(false);
                    }}
                    style={{ '--stagger-delay': `${idx * 35}ms` } as React.CSSProperties}
                    className="animate-form-stagger group flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.05] hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-400/45 transition-all duration-200 hover:translate-x-0.5"
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#0B234F] border border-white/15 group-hover:border-emerald-300/50 group-hover:scale-105 flex items-center justify-center text-emerald-300 shrink-0 transition-all duration-200">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold text-white group-hover:text-emerald-200 truncate">
                        {topic.title}
                      </span>
                      <span className="block text-[11px] text-slate-300 leading-snug line-clamp-1">
                        {topic.subtitle}
                      </span>
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                  </a>
                );
              })}
            </div>

            {/* Direct Message Input */}
            <form onSubmit={handleSendCustom} className="pt-1 flex items-center gap-1.5">
              <input
                type="text"
                maxLength={240}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type your question or Order ID..."
                aria-label="Write a message for Robotera BD WhatsApp Support"
                className="flex-1 h-10 px-3 rounded-xl bg-white/[0.08] border border-white/15 text-xs text-white placeholder:text-slate-400 focus:bg-white/[0.12] focus:border-emerald-400 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                aria-label="Send message on WhatsApp"
                className="h-10 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-[#041A12] font-bold text-xs inline-flex items-center justify-center gap-1 transition-all shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                playTapSound();
                setOpen(false);
              }}
              className="cta-sheen w-full h-10 rounded-xl bg-gradient-to-r from-[#15803D] to-[#16A34A] hover:from-[#16A34A] hover:to-[#22C55E] border border-emerald-300/40 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <WhatsAppGlyph className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Start Direct WhatsApp Chat</span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        </div>
      )}

      {/* Sleek Floating Trigger with Animated Halo Ring */}
      <button
        type="button"
        onClick={() => {
          playTapSound();
          setOpen((prev) => !prev);
        }}
        aria-expanded={open}
        aria-label="Open Robotera BD WhatsApp Support (+880 1624-987366)"
        className={`group cta-sheen inline-flex items-center gap-2.5 h-11 sm:h-12 pl-2.5 pr-3.5 sm:pl-3 sm:pr-4 rounded-2xl bg-gradient-to-r from-[#064E3B] via-[#0F766E] to-[#15803D] hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.97] border border-emerald-300/50 text-white shadow-[0_16px_32px_-8px_rgba(15,118,110,0.62)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ${
          !open ? 'md:animate-whatsapp-bob' : ''
        }`}
      >
        <span className="relative w-7 h-7 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
          {!open && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl border border-emerald-200/80 animate-whatsapp-halo"
            />
          )}
          <WhatsAppGlyph className="w-4 h-4 text-white transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6" />
        </span>

        <span className="hidden sm:flex flex-col items-start text-left leading-none">
          <span className="text-[12.5px] font-bold tracking-wide whitespace-nowrap">
            WhatsApp Support
          </span>
          <span className="text-[10px] text-emerald-100/85 font-mono tabular-nums mt-0.5 whitespace-nowrap">
            Dhaka Help Desk
          </span>
        </span>

        <span className="sm:hidden text-xs font-bold whitespace-nowrap">
          WhatsApp
        </span>

        <ChevronUp
          className={`w-3.5 h-3.5 text-emerald-100 transition-transform duration-200 shrink-0 ${
            open ? 'rotate-180' : 'group-hover:-translate-y-0.5'
          }`}
        />
      </button>
    </div>
  );
};
