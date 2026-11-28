import React from 'react';

export interface SectionDividerProps {
  indexCode?: string;
  label?: string;
  fromBg?: string;
  toBg?: string;
  dark?: boolean;
  accent?: 'blue' | 'cyan' | 'emerald' | 'amber' | 'indigo';
}

function isDarkColor(hex?: string): boolean {
  const normalized = hex?.toUpperCase();
  return (
    normalized === '#050B18' ||
    normalized === '#0A1428' ||
    normalized === '#071A3D' ||
    normalized === '#071A3B' ||
    normalized === '#06142E'
  );
}

export const SectionDivider: React.FC<SectionDividerProps> = ({
  fromBg = '#FFFFFF',
  toBg = '#F3F7FC',
  dark = false,
}) => {
  const topIsDark = isDarkColor(fromBg);
  const bottomIsDark = isDarkColor(toBg);
  const isHybridDark = dark || topIsDark || bottomIsDark;

  if (isHybridDark) {
    return (
      <div
        aria-hidden="true"
        className="relative w-full pointer-events-none select-none overflow-hidden min-[1500px]:bg-transparent"
      >
        <div className="relative z-20 w-full max-w-[1440px] mx-auto min-[1500px]:border-x min-[1500px]:border-[#1E3A6E]/55">
          <div className="relative h-px w-full bg-gradient-to-r from-[#071A3D] via-[#087BFF]/45 to-[#071A3D] overflow-hidden">
            <span className="animate-signal-sweep pointer-events-none absolute top-0 left-0 h-px w-44 bg-gradient-to-r from-transparent via-[#00CFFF] to-transparent" />
          </div>
          <span className="animate-telemetry-led hidden sm:block absolute left-3 -top-[2px] w-1 h-1 rounded-full bg-[#00CFFF]/75" />
          <span
            className="animate-telemetry-led hidden sm:block absolute right-3 -top-[2px] w-1 h-1 rounded-full bg-[#00CFFF]/75"
            style={{ animationDelay: '1.1s' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="relative w-full pointer-events-none select-none overflow-hidden min-[1500px]:bg-transparent"
    >
      <div className="relative z-20 w-full max-w-[1440px] mx-auto min-[1500px]:border-x min-[1500px]:border-slate-200/90">
        <div className="relative h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent overflow-hidden">
          <span
            className="animate-signal-sweep pointer-events-none absolute top-0 left-0 h-px w-36 bg-gradient-to-r from-transparent via-[#087BFF]/65 to-transparent"
            style={{ animationDuration: '4.6s' }}
          />
        </div>
      </div>
    </div>
  );
};
