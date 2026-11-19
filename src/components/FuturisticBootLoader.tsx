import React, { useEffect, useState } from 'react';
import { ArrowRight, Cpu } from 'lucide-react';

interface FuturisticBootLoaderProps {
  onComplete?: () => void;
}

const BOOT_SESSION_KEY = 'roboterabd_intro_seen_v1';

export const FuturisticBootLoader: React.FC<FuturisticBootLoaderProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return false;
    try {
      return window.sessionStorage.getItem(BOOT_SESSION_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(12);

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(BOOT_SESSION_KEY, '1');
    } catch {
      // ignore storage errors
    }
    setExiting(true);
    window.setTimeout(() => {
      setVisible(false);
      window.dispatchEvent(new Event('robotera:boot-complete'));
      onComplete?.();
    }, 360);
  };

  useEffect(() => {
    if (!visible) {
      window.dispatchEvent(new Event('robotera:boot-complete'));
      onComplete?.();
      return;
    }

    const t1 = window.setTimeout(() => setProgress(46), 160);
    const t2 = window.setTimeout(() => setProgress(82), 520);
    const t3 = window.setTimeout(() => setProgress(100), 920);
    const tExit = window.setTimeout(() => dismiss(), 1280);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(tExit);
    };
  }, [visible]);

  if (!visible) return null;

  const phaseText =
    progress < 45
      ? 'Initializing Hardware Registry'
      : progress < 90
      ? 'Calibrating Robotics & IoT Catalog'
      : 'System Ready';

  return (
    <div
      role="status"
      aria-label="Loading Robotera BD"
      className={`fixed inset-0 z-[100] bg-[#071A3B] text-white flex flex-col items-center justify-center overflow-hidden transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        exiting ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Architectural Lab Grid & Radial Spotlights */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-90" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(8,102,245,0.28)_0%,rgba(8,102,245,0)_70%)] animate-ambient-pulse"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-[#1685FF]/10 to-transparent animate-scan-sweep"
      />

      {/* Center Precision Gyroscope + Brand Core */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-md w-full">
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center mb-7">
          {/* Outer Orbit Track */}
          <svg
            viewBox="0 0 140 140"
            className="absolute inset-0 w-full h-full animate-spin-slow"
            aria-hidden="true"
          >
            <circle
              cx="70"
              cy="70"
              r="64"
              fill="none"
              stroke="rgba(22, 133, 255, 0.25)"
              strokeWidth="1.2"
              strokeDasharray="18 10 6 10"
            />
            <circle cx="70" cy="6" r="3" fill="#1685FF" />
            <circle cx="70" cy="134" r="2.2" fill="#60A5FA" />
          </svg>

          {/* Inner Counter-Rotating Precision Ring */}
          <svg
            viewBox="0 0 140 140"
            className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] animate-spin-reverse-slow"
            aria-hidden="true"
          >
            <circle
              cx="70"
              cy="70"
              r="52"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1.2"
              strokeDasharray="44 16 12 16"
            />
          </svg>

          {/* Core Emblem */}
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1685FF] to-[#0866F5] border border-blue-300/40 shadow-[0_14px_34px_-8px_rgba(8,102,245,0.75)] flex items-center justify-center">
            <Cpu className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Brand Wordmark */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            ROBOTERA
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#0866F5] border border-blue-400/40 font-mono text-xs font-bold tracking-wider text-white">
            BD
          </span>
        </div>

        <p className="font-mono text-[11px] sm:text-xs tracking-[0.22em] uppercase text-blue-200/85 mb-7">
          Engineering The Future
        </p>

        {/* Precision Calibration Progress Bar */}
        <div className="w-full max-w-xs space-y-2.5">
          <div className="h-1.5 w-full rounded-full bg-white/10 border border-white/10 overflow-hidden p-[1px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0866F5] via-[#1685FF] to-cyan-300 transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-blue-200/80">
            <span>{phaseText}</span>
            <span className="tabular-nums text-white font-semibold">{progress}%</span>
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="mt-8 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-blue-100 hover:text-white transition-colors"
        >
          <span>Skip Intro</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
