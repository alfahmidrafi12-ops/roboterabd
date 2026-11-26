import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { playBootChime } from '../lib/sound';
import { BrandLogo } from './BrandLogo';

interface FuturisticBootLoaderProps {
  onComplete?: () => void;
}

const BOOT_SESSION_KEY = 'roboterabd_intro_seen_v2';
const INTRO_DURATION_MS = 1950;

const INIT_STEPS = [
  { threshold: 18, label: 'Core MCU & SBC Registry' },
  { threshold: 52, label: 'LiDAR, Sensors & Actuators' },
  { threshold: 88, label: 'Dhaka Lab Bench Ready' },
] as const;

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
  const [progress, setProgress] = useState(0);
  const dismissedRef = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
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
    }, 440);
  }, [onComplete]);

  useEffect(() => {
    if (!visible) {
      window.dispatchEvent(new Event('robotera:boot-complete'));
      onComplete?.();
      return;
    }

    let rafId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / INTRO_DURATION_MS);
      // Smooth ease-out curve for crisp calibrated progress readout
      const eased = 1 - Math.pow(1 - t, 2.4);
      setProgress(Math.min(100, Math.round(eased * 100)));

      if (t < 1 && !dismissedRef.current) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);

    const exitTimer = window.setTimeout(() => {
      dismiss();
    }, INTRO_DURATION_MS + 220);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        if (e.key === ' ') {
          e.preventDefault();
        }
        dismiss();
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(exitTimer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [visible, dismiss, onComplete]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Initializing Robotera BD"
      className={`fixed inset-0 z-[100] bg-[#040F24] text-white flex flex-col items-center justify-center overflow-hidden touch-none overscroll-none transition-all duration-[440ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        exiting ? 'opacity-0 scale-[1.035] blur-[2px] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Architectural Deep Navy Gradient + Lab Coordinate Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(8,123,255,0.22)_0%,rgba(7,26,61,0.72)_45%,rgba(4,15,36,1)_85%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-75" />

      {/* Horizontal Bus Signal Traces Converging Toward Center */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 720"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        className="pointer-events-none absolute inset-0 w-full h-full opacity-55"
      >
        <path
          d="M0 360H440L486 314H610"
          stroke="#087BFF"
          strokeOpacity="0.35"
          strokeWidth="1.25"
        />
        <path
          d="M1440 360H1000L954 406H830"
          stroke="#00CFFF"
          strokeOpacity="0.35"
          strokeWidth="1.25"
        />
        <path
          d="M0 388H380L422 430H540"
          stroke="#1E3A6E"
          strokeWidth="1"
        />
        <path
          d="M1440 332H1060L1018 290H900"
          stroke="#1E3A6E"
          strokeWidth="1"
        />
        <circle cx="610" cy="314" r="3" fill="#087BFF" />
        <circle cx="830" cy="406" r="3" fill="#00CFFF" />
      </svg>

      {/* Subtle Corner Engineering Telemetry Marks */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden sm:flex absolute top-6 left-7 right-7 items-center justify-between font-mono text-[10px] tracking-[0.18em] uppercase text-slate-400/80"
      >
        <span>ROBOTERA BD // LABS</span>
        <span className="inline-flex items-center gap-2 text-[#00CFFF]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00CFFF] animate-pulse" />
          <span>SYSTEM BOOT</span>
        </span>
      </div>

      {/* Main Precision Robotics Emblem & Calibration Readout */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-md w-full">
        {/* Multi-Stage Gyroscope + LiDAR Sweep Dial */}
        <div className="animate-hero-rise relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center mb-7">
          {/* Outer Expanding Pulse Ring */}
          <div
            aria-hidden="true"
            className="animate-ring-expand absolute inset-1 rounded-full border border-[#00CFFF]/30"
          />

          {/* Conic LiDAR Sweep Beam */}
          <div
            aria-hidden="true"
            className="animate-spin-slow absolute inset-3 rounded-full opacity-75"
            style={{
              background:
                'conic-gradient(from 0deg, rgba(0, 207, 255, 0.36) 0deg, rgba(8, 123, 255, 0.14) 55deg, transparent 115deg, transparent 360deg)',
            }}
          />

          {/* Outer Precision Degree Ring */}
          <svg
            viewBox="0 0 160 160"
            className="animate-spin-slow absolute inset-0 w-full h-full"
            aria-hidden="true"
          >
            <circle
              cx="80"
              cy="80"
              r="74"
              fill="none"
              stroke="rgba(8, 123, 255, 0.35)"
              strokeWidth="1.2"
              strokeDasharray="20 8 4 8"
            />
            <circle cx="80" cy="6" r="3" fill="#00CFFF" />
            <circle cx="80" cy="154" r="2.5" fill="#087BFF" />
          </svg>

          {/* Inner Counter-Rotating Calibration Ring */}
          <svg
            viewBox="0 0 160 160"
            className="animate-spin-reverse-slow absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)]"
            aria-hidden="true"
          >
            <circle
              cx="80"
              cy="80"
              r="62"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1.2"
              strokeDasharray="34 14 10 14"
            />
          </svg>

          {/* Crisp Brand Emblem Core */}
          <div className="relative w-20 h-20 rounded-2xl bg-white p-1.5 border border-[#00CFFF]/55 shadow-[0_0_40px_-8px_rgba(8,123,255,0.85),inset_0_1px_0_rgba(255,255,255,0.3)] flex items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#00CFFF]"
            />
            <span
              aria-hidden="true"
              className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#00CFFF]"
            />
            <BrandLogo size="xl" className="w-full h-full border-0 p-1" />
          </div>
        </div>

        {/* Brand Title Lockup */}
        <div className="animate-hero-rise-delay-1 flex items-center gap-2.5 mb-2">
          <span className="font-hero text-3xl sm:text-[34px] font-extrabold tracking-[-0.03em] text-white">
            ROBOTERA
          </span>
          <span className="px-2.5 py-0.5 rounded-lg bg-[#087BFF] border border-[#00CFFF]/40 font-mono text-xs font-extrabold tracking-wider text-white shadow-[0_6px_18px_-4px_rgba(8,123,255,0.8)]">
            BD
          </span>
        </div>

        <p className="animate-hero-rise-delay-1 font-mono text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-[#00CFFF] mb-6">
          Build · Create · Innovate
        </p>

        {/* Precision Segmented Calibration Checklist */}
        <div className="animate-hero-rise-delay-2 w-full max-w-[300px] bg-[#0A2045]/75 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-3 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]">
          <div className="space-y-1.5 text-left">
            {INIT_STEPS.map((step) => {
              const done = progress >= step.threshold;
              return (
                <div
                  key={step.label}
                  className={`flex items-center justify-between gap-2 text-[11px] font-mono transition-colors duration-200 ${
                    done ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        done
                          ? 'bg-[#087BFF] text-white'
                          : 'bg-white/5 border border-white/15 text-transparent'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                    <span className="truncate">{step.label}</span>
                  </span>
                  <span className={done ? 'text-[#00CFFF] font-semibold' : 'text-slate-500'}>
                    {done ? 'OK' : '...'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Shimmering Progress Rail */}
          <div className="pt-1 border-t border-white/10 space-y-1.5">
            <div className="relative h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-[#087BFF] to-[#00CFFF] transition-[width] duration-100 ease-out overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <span className="animate-bar-shimmer absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              </div>
            </div>
            <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-300">
              <span>PRECISION HARDWARE CATALOG</span>
              <span className="tabular-nums font-bold text-white">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Unobtrusive Skip Action */}
        <button
          type="button"
          onClick={() => {
            playBootChime();
            dismiss();
          }}
          className="animate-hero-rise-delay-3 mt-6 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white/8 hover:bg-white/15 border border-white/15 hover:border-[#00CFFF]/45 text-xs font-medium text-slate-200 hover:text-white active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00CFFF]"
        >
          <span>Skip Intro</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
