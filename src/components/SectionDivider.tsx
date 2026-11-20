import React, { useEffect, useRef, useState } from 'react';

export interface SectionDividerProps {
  indexCode?: string;
  label?: string;
  fromBg?: string;
  toBg?: string;
  dark?: boolean;
  accent?: 'blue' | 'cyan' | 'emerald' | 'amber' | 'indigo';
}

const ACCENT_STYLE: Record<
  NonNullable<SectionDividerProps['accent']>,
  { dot: string; beam: string; code: string; borderHover: string }
> = {
  blue: {
    dot: 'bg-[#0866F5]',
    beam: 'from-transparent via-[#0866F5]/75 to-transparent',
    code: 'text-[#0866F5]',
    borderHover: 'border-[#0866F5]/30',
  },
  cyan: {
    dot: 'bg-[#0EA5E9]',
    beam: 'from-transparent via-[#38BDF8]/85 to-transparent',
    code: 'text-[#0284C7]',
    borderHover: 'border-[#38BDF8]/35',
  },
  emerald: {
    dot: 'bg-[#0F766E]',
    beam: 'from-transparent via-[#14B8A6]/80 to-transparent',
    code: 'text-[#0F766E]',
    borderHover: 'border-[#0F766E]/30',
  },
  amber: {
    dot: 'bg-[#C2410C]',
    beam: 'from-transparent via-[#FB923C]/80 to-transparent',
    code: 'text-[#C2410C]',
    borderHover: 'border-[#EA580C]/30',
  },
  indigo: {
    dot: 'bg-[#0866F5]',
    beam: 'from-transparent via-[#60A5FA]/80 to-transparent',
    code: 'text-[#0866F5]',
    borderHover: 'border-[#0866F5]/30',
  },
};

function isDarkColor(hex?: string): boolean {
  return hex?.toUpperCase() === '#071A3B' || hex?.toUpperCase() === '#06142E';
}

export const SectionDivider: React.FC<SectionDividerProps> = ({
  indexCode,
  label,
  fromBg = '#FFFFFF',
  toBg = '#E6ECF4',
  dark = false,
  accent = 'blue',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.98) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const topIsDark = isDarkColor(fromBg);
  const bottomIsDark = isDarkColor(toBg);
  const isHybridDark = dark || topIsDark || bottomIsDark;
  const theme = ACCENT_STYLE[accent];

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative w-full pointer-events-none select-none overflow-hidden"
    >
      {/* Top Half — Seamlessly extends outgoing section */}
      <div
        className={`relative h-5 sm:h-6 w-full ${
          topIsDark ? 'z-20 bg-[#071A3B]' : 'min-[1500px]:bg-transparent'
        }`}
      >
        {topIsDark ? (
          <div className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-60" />
        ) : (
          <div
            style={{ backgroundColor: fromBg }}
            className="relative z-20 h-full w-full min-[1500px]:max-w-[1440px] min-[1500px]:mx-auto min-[1500px]:border-x min-[1500px]:border-slate-300/90"
          />
        )}
      </div>

      {/* Bottom Half — Seamlessly transitions into incoming section */}
      <div
        className={`relative h-5 sm:h-6 w-full ${
          bottomIsDark ? 'z-20 bg-[#071A3B]' : 'min-[1500px]:bg-transparent'
        }`}
      >
        {bottomIsDark ? (
          <div className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-60" />
        ) : (
          <div
            style={{ backgroundColor: toBg }}
            className="relative z-20 h-full w-full min-[1500px]:max-w-[1440px] min-[1500px]:mx-auto min-[1500px]:border-x min-[1500px]:border-slate-300/90"
          />
        )}
      </div>

      {/* Crisp Horizon Circuit-Bus Seam Overlay */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 ${
          isHybridDark ? '' : 'min-[1500px]:max-w-[1440px] min-[1500px]:mx-auto'
        }`}
      >
        {/* Full-seam crisp rule line */}
        <div
          className={`relative w-full h-px overflow-hidden ${
            isHybridDark
              ? 'bg-gradient-to-r from-[#0866F5]/35 via-[#38BDF8]/55 to-[#2DD4BF]/35'
              : 'bg-slate-300/90'
          }`}
        >
          {/* Animated horizontal signal pulse */}
          {inView && (
            <div
              className={`animate-trace-sweep absolute inset-y-0 left-0 w-36 sm:w-56 bg-gradient-to-r ${theme.beam}`}
            />
          )}
        </div>

        {/* Center-Aligned Engineering Node & Flanking CAD Crosshairs */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-3">
          {/* Left CAD Registration Mark */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center justify-center w-3.5 h-3.5 font-mono text-[11px] leading-none ${
                isHybridDark ? 'text-[#38BDF8]/80' : 'text-slate-400'
              }`}
            >
              +
            </span>
            <span
              className={`w-6 h-px ${
                isHybridDark ? 'bg-[#38BDF8]/40' : 'bg-slate-300'
              }`}
            />
          </div>

          {/* Central Precision Chapter Tag */}
          {(indexCode || label) && (
            <div
              className={`mx-auto inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full border transition-all duration-500 ${
                inView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              } ${
                isHybridDark
                  ? 'bg-[#081F47] border-[#38BDF8]/45 text-white shadow-sm shadow-[#071A3B]/40'
                  : `bg-white ${theme.borderHover} text-[#071A3B]`
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${theme.dot} shrink-0`} />
              {indexCode && (
                <span
                  className={`font-mono text-[10px] font-bold tracking-[0.16em] ${
                    isHybridDark ? 'text-[#38BDF8]' : theme.code
                  }`}
                >
                  {indexCode}
                </span>
              )}
              {indexCode && label && (
                <span
                  className={`text-[10px] font-mono ${
                    isHybridDark ? 'text-white/30' : 'text-slate-300'
                  }`}
                >
                  //
                </span>
              )}
              {label && (
                <span
                  className={`font-mono text-[10px] font-semibold tracking-[0.14em] uppercase ${
                    isHybridDark ? 'text-slate-100' : 'text-[#334155]'
                  }`}
                >
                  {label}
                </span>
              )}
            </div>
          )}

          {/* Right CAD Registration Mark */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span
              className={`w-6 h-px ${
                isHybridDark ? 'bg-[#2DD4BF]/40' : 'bg-slate-300'
              }`}
            />
            <span
              className={`inline-flex items-center justify-center w-3.5 h-3.5 font-mono text-[11px] leading-none ${
                isHybridDark ? 'text-[#2DD4BF]/80' : 'text-slate-400'
              }`}
            >
              +
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
