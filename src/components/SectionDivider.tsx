import React from 'react';

export interface SectionDividerProps {
  indexCode?: string;
  label?: string;
  fromBg?: string;
  toBg?: string;
  dark?: boolean;
  accent?: 'blue' | 'cyan' | 'emerald' | 'amber' | 'indigo';
}

const ACCENT_DOT: Record<NonNullable<SectionDividerProps['accent']>, string> = {
  blue: 'bg-[#0866F5] ring-[#0866F5]/20',
  cyan: 'bg-[#06B6D4] ring-[#06B6D4]/20',
  emerald: 'bg-[#10B981] ring-[#10B981]/20',
  amber: 'bg-[#F59E0B] ring-[#F59E0B]/20',
  indigo: 'bg-[#6366F1] ring-[#6366F1]/20',
};

const ACCENT_TEXT: Record<NonNullable<SectionDividerProps['accent']>, string> = {
  blue: 'text-[#0866F5]',
  cyan: 'text-[#0891B2]',
  emerald: 'text-[#059669]',
  amber: 'text-[#D97706]',
  indigo: 'text-[#4F46E5]',
};

export const SectionDivider: React.FC<SectionDividerProps> = ({
  indexCode,
  label,
  fromBg = '#FFFFFF',
  toBg = '#F5F8FC',
  dark = false,
  accent = 'blue',
}) => {
  return (
    <div
      aria-hidden="true"
      style={{
        background: `linear-gradient(180deg, ${fromBg} 0%, ${toBg} 100%)`,
      }}
      className="relative w-full py-3 sm:py-4 select-none overflow-hidden"
    >
      <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center gap-3 sm:gap-4">
        {/* Left tapered hairline */}
        <div
          className={`h-px flex-1 ${
            dark
              ? 'bg-gradient-to-r from-transparent via-blue-400/30 to-blue-400/55'
              : 'bg-gradient-to-r from-transparent via-slate-300/60 to-slate-300/90'
          }`}
        />

        {/* Center precision schematic node */}
        <div
          className={`flex items-center gap-2 shrink-0 ${
            dark ? 'bg-[#071A3B]/90 px-2.5 py-0.5 rounded-md border border-blue-400/25 shadow-xs' : ''
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rotate-45 rounded-[1px] ring-4 ${ACCENT_DOT[accent]}`}
          />
          {(indexCode || label) && (
            <span
              className={`font-mono text-[10px] font-semibold tracking-[0.16em] uppercase ${
                dark ? 'text-cyan-200' : ACCENT_TEXT[accent]
              }`}
            >
              {indexCode}
              {indexCode && label ? ' // ' : ''}
              {label}
            </span>
          )}
          <span
            className={`w-1.5 h-1.5 rotate-45 rounded-[1px] ${
              dark ? 'bg-cyan-300/70' : 'bg-slate-300'
            }`}
          />
        </div>

        {/* Right tapered hairline */}
        <div
          className={`h-px flex-1 ${
            dark
              ? 'bg-gradient-to-l from-transparent via-blue-400/30 to-blue-400/55'
              : 'bg-gradient-to-l from-transparent via-slate-300/60 to-slate-300/90'
          }`}
        />
      </div>
    </div>
  );
};
