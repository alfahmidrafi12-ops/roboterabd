import React from 'react';
import { Check, Copy, Cpu, Download, ShieldCheck, Sparkles, Wifi } from 'lucide-react';
import { playTapSound } from '../lib/sound';
import { GiftCardReward } from '../types/store';

interface DigitalGiftCardProps {
  card: GiftCardReward;
  copied: boolean;
  onCopy: (code: string) => void;
  onDownload: (card: GiftCardReward) => void;
  variant?: 'receipt' | 'vault';
}

export const DigitalGiftCard: React.FC<DigitalGiftCardProps> = ({
  card,
  copied,
  onCopy,
  onDownload,
  variant = 'receipt',
}) => {
  const isRedeemed = Boolean(card.redeemed);

  return (
    <div
      className={`group relative overflow-hidden rounded-[22px] p-[1.5px] transition-all duration-300 ${
        variant === 'receipt' ? 'animate-gift-card-reveal' : ''
      } ${
        isRedeemed
          ? 'bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300 shadow-sm'
          : 'animate-gift-foil bg-gradient-to-br from-[#00CFFF]/75 via-[#087BFF]/55 to-[#2DD4BF]/70 shadow-[0_22px_50px_-14px_rgba(8,123,255,0.52)] hover:shadow-[0_26px_56px_-12px_rgba(0,207,255,0.48)]'
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-[20.5px] p-4 sm:p-5 ${
          isRedeemed
            ? 'bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-700'
            : 'bg-gradient-to-br from-[#030916] via-[#06183A] to-[#0A2C68] text-white'
        }`}
      >
        {/* Subtle Engineering Grid + Prismatic Ambient Flares */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 ${
            isRedeemed ? 'opacity-20 bg-lab-grid' : 'opacity-65 bg-lab-grid-dark'
          }`}
        />

        {!isRedeemed && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-16 w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(0,207,255,0.28)_0%,rgba(8,123,255,0.12)_50%,transparent_75%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-12 w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.22)_0%,transparent_72%)]"
            />
            <div
              aria-hidden="true"
              className="animate-holo-sweep pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#7DD3FC]/20 to-transparent skew-x-[-20deg]"
            />
          </>
        )}

        {/* Precision Corner Alignment Crosshairs + PCB Traces */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 220"
          className={`pointer-events-none absolute inset-0 w-full h-full ${
            isRedeemed ? 'opacity-15' : 'opacity-30'
          }`}
          fill="none"
          preserveAspectRatio="none"
        >
          <path d="M 400 44 H 322 L 298 68 H 242" stroke="#00CFFF" strokeWidth="1.2" />
          <path d="M 400 60 H 334 L 310 84 H 264" stroke="#2DD4BF" strokeWidth="1.1" />
          <circle cx="242" cy="68" r="3" fill="#00CFFF" />
          <circle cx="264" cy="84" r="2.8" fill="#2DD4BF" />
          <path d="M 14 22 V 14 H 22" stroke="#38BDF8" strokeWidth="1.2" />
          <path d="M 386 22 V 14 H 378" stroke="#38BDF8" strokeWidth="1.2" />
          <path d="M 14 198 V 206 H 22" stroke="#2DD4BF" strokeWidth="1.2" />
          <path d="M 386 198 V 206 H 378" stroke="#2DD4BF" strokeWidth="1.2" />
        </svg>

        <div className="relative z-10 space-y-4">
          {/* Top Metallic Header + Tier + Value Bezel */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {/* Brand Hardware Emblem */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                  isRedeemed
                    ? 'bg-white border-slate-300 text-slate-500'
                    : 'bg-[#087BFF]/20 border-[#00CFFF]/45 text-[#00CFFF] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                }`}
              >
                <Cpu className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p
                  className={`inline-flex items-center gap-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] ${
                    isRedeemed ? 'text-slate-500' : 'text-[#2DD4BF]'
                  }`}
                >
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {card.tierLabel} {isRedeemed ? '· Redeemed' : '· Unlocked'}
                  </span>
                </p>
                <h4
                  className={`font-display text-sm sm:text-base font-extrabold tracking-tight mt-0.5 truncate ${
                    isRedeemed ? 'text-slate-700' : 'text-white'
                  }`}
                >
                  ROBOTERA BD HARDWARE PASS
                </h4>
              </div>
            </div>

            {/* Credit Value Bezel */}
            <div
              className={`px-3 py-1.5 rounded-xl border text-right shrink-0 ${
                isRedeemed
                  ? 'bg-white/80 border-slate-300 text-slate-600'
                  : 'bg-gradient-to-br from-[#00CFFF]/20 to-[#087BFF]/20 border-[#00CFFF]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
              }`}
            >
              <p
                className={`font-mono text-[9px] font-bold uppercase tracking-[0.12em] ${
                  isRedeemed ? 'text-slate-500' : 'text-sky-200'
                }`}
              >
                ৳3 / ৳100 PASS
              </p>
              <p
                className={`font-mono text-lg sm:text-xl font-extrabold tabular-nums leading-tight ${
                  isRedeemed ? 'text-slate-700' : 'text-white'
                }`}
              >
                ৳{card.value.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Brushed-Gold Silicon EMV Chip + Contactless Wave + Recipient */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Embossed Brushed-Gold EMV Chip */}
              <div
                aria-hidden="true"
                className={`w-11 h-8 rounded-lg border relative overflow-hidden shrink-0 ${
                  isRedeemed
                    ? 'bg-gradient-to-br from-slate-300 to-slate-400 border-slate-400/70'
                    : 'bg-gradient-to-br from-[#FDE68A] via-[#F59E0B] to-[#B45309] border-[#FEF3C7]/70 shadow-[0_4px_12px_-2px_rgba(245,158,11,0.45)]'
                }`}
              >
                <svg viewBox="0 0 44 32" className="w-full h-full" fill="none">
                  <rect
                    x="13"
                    y="7"
                    width="18"
                    height="18"
                    rx="3"
                    stroke={isRedeemed ? '#475569' : '#78350F'}
                    strokeWidth="1.2"
                  />
                  <line x1="0" y1="12" x2="13" y2="12" stroke={isRedeemed ? '#475569' : '#78350F'} strokeWidth="1.1" />
                  <line x1="0" y1="20" x2="13" y2="20" stroke={isRedeemed ? '#475569' : '#78350F'} strokeWidth="1.1" />
                  <line x1="31" y1="12" x2="44" y2="12" stroke={isRedeemed ? '#475569' : '#78350F'} strokeWidth="1.1" />
                  <line x1="31" y1="20" x2="44" y2="20" stroke={isRedeemed ? '#475569' : '#78350F'} strokeWidth="1.1" />
                  <line x1="22" y1="0" x2="22" y2="7" stroke={isRedeemed ? '#475569' : '#78350F'} strokeWidth="1.1" />
                  <line x1="22" y1="25" x2="22" y2="32" stroke={isRedeemed ? '#475569' : '#78350F'} strokeWidth="1.1" />
                </svg>
              </div>

              <Wifi
                className={`w-4 h-4 rotate-90 shrink-0 ${
                  isRedeemed ? 'text-slate-400' : 'text-sky-300/80'
                }`}
              />

              <div className="min-w-0">
                <p
                  className={`font-mono text-[9.5px] uppercase tracking-[0.12em] ${
                    isRedeemed ? 'text-slate-500' : 'text-slate-300'
                  }`}
                >
                  Cardholder
                </p>
                <p
                  className={`font-display text-xs sm:text-sm font-bold truncate ${
                    isRedeemed ? 'text-slate-700' : 'text-white'
                  }`}
                >
                  {card.recipientName}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 hidden sm:block">
              <p
                className={`font-mono text-[9.5px] uppercase tracking-[0.12em] ${
                  isRedeemed ? 'text-slate-500' : 'text-slate-300'
                }`}
              >
                Source Order
              </p>
              <p
                className={`font-mono text-xs font-bold tabular-nums ${
                  isRedeemed ? 'text-slate-600' : 'text-sky-200'
                }`}
              >
                #{card.orderId}
              </p>
            </div>
          </div>

          {/* Recessed Laser-Engraved Serial Plate */}
          <div
            className={`rounded-xl px-3.5 py-2.5 border flex items-center justify-between gap-2.5 ${
              isRedeemed
                ? 'bg-white/80 border-slate-300'
                : 'bg-[#020814]/75 border-[#00CFFF]/30 shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)]'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-[9px] font-bold uppercase tracking-[0.14em] ${
                    isRedeemed ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Serial Key
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wider ${
                    isRedeemed ? 'text-slate-500' : 'text-[#2DD4BF]'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span>
                    {isRedeemed
                      ? `Used on #${card.redeemedOrderId || 'Order'}`
                      : 'Active · Single Use'}
                  </span>
                </span>
              </div>
              <p
                className={`font-mono text-sm sm:text-base font-extrabold tracking-[0.1em] truncate mt-0.5 select-all ${
                  isRedeemed ? 'text-slate-500 line-through' : 'text-white'
                }`}
              >
                {card.code}
              </p>
            </div>

            {!isRedeemed && (
              <button
                type="button"
                onClick={() => onCopy(card.code)}
                className="h-8 px-3 rounded-lg bg-[#087BFF] hover:bg-[#0669DB] border border-sky-300/35 text-white text-[11px] font-bold inline-flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[#2DD4BF] animate-icon-pop" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          {/* Card Footer & Official PNG Exporter */}
          <div
            className={`pt-2.5 border-t flex items-center justify-between gap-2 text-[11px] ${
              isRedeemed ? 'border-slate-300 text-slate-500' : 'border-white/12 text-slate-300'
            }`}
          >
            <span className="font-mono text-[10.5px] truncate">
              Issued {card.issuedAt} · Order #{card.orderId}
            </span>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onDownload(card);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] shrink-0 transition-all ${
                isRedeemed
                  ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  : 'bg-white hover:bg-sky-50 text-[#071A3B] shadow-sm active:scale-[0.97]'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-[#087BFF]" />
              <span>Save Card PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
