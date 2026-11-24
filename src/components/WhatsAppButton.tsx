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
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

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
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopiedNumber(false), 1800);
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
          aria-label="Robotera BD WhatsApp Support"
          className="animate-pop-in w-[min(calc(100vw-1.5rem),22.5rem)] rounded-2xl bg-white text-[#0F172A] border border-emerald-200/90 shadow-[0_24px_56px_-12px_rgba(7,94,84,0.34)] overflow-hidden"
        >
          {/* Authentic WhatsApp Green Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#075E54] via-[#0F766E] to-[#128C7E] text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-white shrink-0">
                <WhatsAppGlyph className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-white leading-tight truncate">
                  Robotera BD Support
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-emerald-50 font-mono tabular-nums">
                  <span className="truncate">{WHATSAPP_DISPLAY}</span>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    aria-label="Copy WhatsApp support number"
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-[10px] font-sans font-semibold text-white transition-colors shrink-0"
                  >
                    {copiedNumber ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-[#86EFAC]" />
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
              className="p-1.5 rounded-xl text-white/85 hover:text-white bg-white/10 hover:bg-white/20 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Support Hours Strip */}
          <div className="px-4 py-2 bg-[#F0FDF4] border-b border-emerald-100 flex items-center justify-between text-[11px] text-[#166534]">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Clock className="w-3 h-3 text-[#15803D] shrink-0" />
              <span>Support Hours: 10 AM – 10 PM</span>
            </span>
            <span className="font-mono text-[#075E54] font-semibold">Quick Reply</span>
          </div>

          {/* Quick Inquiry Options + Custom Message Input */}
          <div className="p-3.5 space-y-2.5 bg-white">
            <p className="px-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#475569]">
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
                    className="animate-form-stagger group flex items-center gap-3 p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F0FDF4] border border-slate-200/80 hover:border-[#25D366]/65 transition-all duration-200 hover:translate-x-0.5"
                  >
                    <span className="w-8 h-8 rounded-lg bg-white border border-emerald-200/80 group-hover:bg-[#128C7E] group-hover:border-[#128C7E] group-hover:text-white flex items-center justify-center text-[#075E54] shrink-0 transition-colors duration-200">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold text-[#0F172A] group-hover:text-[#075E54] truncate">
                        {topic.title}
                      </span>
                      <span className="block text-[11px] text-[#475569] leading-snug line-clamp-1">
                        {topic.subtitle}
                      </span>
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#128C7E] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
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
                className="flex-1 h-10 px-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#128C7E] focus:outline-none transition-colors"
              />
              <button
                type="submit"
                aria-label="Send message on WhatsApp"
                className="h-10 px-3.5 rounded-xl bg-[#128C7E] hover:bg-[#075E54] active:scale-95 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-all shrink-0"
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
              className="cta-sheen w-full h-10 rounded-xl bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#15803D] hover:brightness-110 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <WhatsAppGlyph className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Start WhatsApp Chat</span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        </div>
      )}

      {/* Sleek Authentic WhatsApp Green Floating Trigger */}
      <button
        type="button"
        onClick={() => {
          playTapSound();
          setOpen((prev) => !prev);
        }}
        aria-expanded={open}
        aria-label="Open Robotera BD WhatsApp Support (+880 1624-987366)"
        className={`group cta-sheen inline-flex items-center gap-2.5 h-11 sm:h-12 pl-2.5 pr-3.5 sm:pl-3 sm:pr-4 rounded-2xl bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#15803D] hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.97] border border-[#25D366]/60 text-white shadow-[0_14px_28px_-8px_rgba(7,94,84,0.55)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 ${
          !open ? 'md:animate-whatsapp-bob' : ''
        }`}
      >
        <span className="relative w-7 h-7 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
          {!open && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl border border-[#86EFAC]/85 animate-whatsapp-halo"
            />
          )}
          <WhatsAppGlyph className="w-4 h-4 text-white transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6" />
        </span>

        <span className="hidden sm:inline text-[13px] font-bold tracking-tight whitespace-nowrap">
          WhatsApp Support
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
