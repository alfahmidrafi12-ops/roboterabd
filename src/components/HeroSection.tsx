import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Cpu,
  Headphones,
  PackageCheck,
  Radar,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { DEFAULT_SITE_SETTINGS } from '../data/catalog';
import { Product, SiteImagesConfig } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';

interface HeroSectionProps {
  siteSettings?: SiteImagesConfig;
  products?: Product[];
  onShopNow: () => void;
  onExploreKits: () => void;
  onSelectProduct?: (product: Product) => void;
}

const LEGACY_KICKER = 'Dhaka Robotics & Embedded Supply';
const LEGACY_TITLE = 'Precision Robotics & Electronics Built for Makers';
const LEGACY_SUBTITLE =
  'Source bench-tested microcontrollers, SLAM LiDAR scanners, high-torque actuators, and industrial IoT modules with fast nationwide courier across Bangladesh.';

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  durationMs?: number;
  startReady: boolean;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  target,
  suffix = '',
  durationMs = 1150,
  startReady,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!startReady || hasAnimated) return;
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      setDisplayValue(target);
      setHasAnimated(true);
      return;
    }

    let rafId = 0;

    const startCounting = () => {
      if (hasAnimated) return;
      setHasAnimated(true);
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        // Smooth easeOutQuart curve
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(eased * target);
        setDisplayValue(current);
        if (progress < 1) {
          rafId = window.requestAnimationFrame(step);
        } else {
          setDisplayValue(target);
        }
      };

      rafId = window.requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            startCounting();
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [startReady, hasAnimated, target, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {displayValue.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  siteSettings = DEFAULT_SITE_SETTINGS,
  products = [],
  onShopNow,
  onExploreKits,
  onSelectProduct,
}) => {
  const configuredHeroImg = siteSettings.heroImageUrl?.trim() || DEFAULT_SITE_SETTINGS.heroImageUrl;
  const [heroSrc, setHeroSrc] = useState(configuredHeroImg);
  const [countersReady, setCountersReady] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return true;
    try {
      return window.sessionStorage.getItem('roboterabd_intro_seen_v1') === '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (countersReady) return;
    const onBootDone = () => setCountersReady(true);
    window.addEventListener('robotera:boot-complete', onBootDone);
    const fallback = window.setTimeout(() => setCountersReady(true), 1700);
    return () => {
      window.removeEventListener('robotera:boot-complete', onBootDone);
      window.clearTimeout(fallback);
    };
  }, [countersReady]);

  useEffect(() => {
    setHeroSrc(configuredHeroImg);
  }, [configuredHeroImg]);

  const rawKicker = siteSettings.heroKicker?.trim();
  const displayKicker =
    !rawKicker || rawKicker === LEGACY_KICKER ? DEFAULT_SITE_SETTINGS.heroKicker : rawKicker;

  const rawTitle = siteSettings.heroTitle?.trim();
  const displayTitle =
    !rawTitle || rawTitle === LEGACY_TITLE ? DEFAULT_SITE_SETTINGS.heroTitle : rawTitle;

  const rawSubtitle = siteSettings.heroSubtitle?.trim();
  const displaySubtitle =
    !rawSubtitle || rawSubtitle === LEGACY_SUBTITLE
      ? DEFAULT_SITE_SETTINGS.heroSubtitle
      : rawSubtitle;

  const isCustomHeroImg =
    Boolean(siteSettings.heroImageUrl?.trim()) &&
    siteSettings.heroImageUrl?.trim() !== DEFAULT_SITE_SETTINGS.heroImageUrl &&
    heroSrc !== DEFAULT_SITE_SETTINGS.heroImageUrl;

  const showcaseProducts = useMemo(() => {
    if (products.length === 0) return [];
    const preferredIds = ['esp32-s3', 'rplidar-a1m8', 'rpi-5-8gb', 'dof6-arm-kit'];
    const picks: Product[] = [];
    for (const id of preferredIds) {
      const match = products.find((p) => p.id === id);
      if (match) picks.push(match);
    }
    for (const p of products) {
      if (picks.length >= 4) break;
      if (!picks.some((item) => item.id === p.id)) {
        picks.push(p);
      }
    }
    return picks.slice(0, 4);
  }, [products]);

  const trustCounters = [
    {
      target: 1000,
      suffix: '+',
      label: 'Components',
      sub: 'Verified Stock',
      accentClass: 'text-[#0866F5]',
      dotClass: 'bg-[#0866F5]',
    },
    {
      target: 500,
      suffix: '+',
      label: 'Shipments',
      sub: 'Nationwide Delivery',
      accentClass: 'text-[#0D9488]',
      dotClass: 'bg-[#0D9488]',
    },
    {
      target: 64,
      suffix: '',
      label: 'Districts',
      sub: 'Courier Reach',
      accentClass: 'text-[#071A3B]',
      dotClass: 'bg-[#0866F5]',
    },
    {
      target: 99,
      suffix: '%',
      label: 'QC Pass',
      sub: 'Engineering Support',
      accentClass: 'text-[#EA580C]',
      dotClass: 'bg-[#EA580C]',
    },
  ];

  return (
    <>
      <section
        id="top"
        className="relative overflow-hidden bg-[#F1F5F9]"
      >
        {/* Subtle technical grid & restrained multi-tone atmospheric lighting */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-24 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(8,102,245,0.1)_0%,rgba(13,148,136,0.05)_45%,rgba(8,102,245,0)_72%)] animate-float-drift"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(234,88,12,0.05)_0%,rgba(7,26,59,0)_70%)] animate-ambient-pulse"
        />

        <div className="relative z-10 w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10 py-7 sm:py-11 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-11 items-center">
            {/* Left Engineering Narrative */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="animate-hero-rise flex items-center gap-2.5 mb-3">
                <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#0866F5] to-[#0D9488]" aria-hidden="true" />
                <p className="text-[11px] sm:text-xs font-mono font-semibold tracking-widest uppercase text-[#0D9488]">
                  {displayKicker}
                </p>
              </div>

              <h1 className="animate-hero-rise-delay-1 font-display text-[28px] sm:text-5xl lg:text-[54px] font-extrabold text-[#071A3B] leading-[1.08] tracking-[-0.03em] [text-wrap:balance]">
                {displayTitle}
              </h1>

              <p className="animate-hero-rise-delay-2 mt-3 sm:mt-5 text-sm sm:text-[16.5px] text-[#64748B] max-w-2xl leading-relaxed">
                {displaySubtitle}
              </p>

              {/* Primary CTAs — Full-width stack on narrow mobile, inline on sm+ */}
              <div className="animate-hero-rise-delay-2 mt-5 sm:mt-6 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={onShopNow}
                  className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#0866F5] hover:bg-[#0866F5]/90 active:bg-[#0654CC] border border-[#0866F5] hover:border-[#1685FF] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866F5] focus-visible:ring-offset-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#FB923C]" aria-hidden="true" />
                  <span>Explore Hardware</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
                <button
                  type="button"
                  onClick={onExploreKits}
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-[#0866F5]/[0.05] text-[#071A3B] border border-slate-200 hover:border-[#0D9488]/60 transition-colors text-sm font-semibold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866F5] focus-visible:ring-offset-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" aria-hidden="true" />
                  <span>Discover Robotics Kits</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#0D9488] transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>

              {/* Animated Scroll-Triggered Trust Counters */}
              <div className="animate-hero-rise-delay-3 mt-7 pt-5 border-t border-slate-200/90 space-y-3.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {trustCounters.map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white rounded-xl border border-slate-200/90 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${stat.dotClass}`} aria-hidden="true" />
                        <p className={`font-mono text-base sm:text-lg font-extrabold tracking-tight ${stat.accentClass}`}>
                          <AnimatedCounter
                            target={stat.target}
                            suffix={stat.suffix}
                            startReady={countersReady}
                          />
                        </p>
                      </div>
                      <p className="font-display text-xs font-bold text-[#071A3B] mt-0.5 truncate">
                        {stat.label}
                      </p>
                      <p className="text-[10px] text-[#64748B] truncate">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs font-medium text-[#64748B]">
                  <span className="inline-flex items-center gap-1.5 text-[#101828]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488]" />
                    Verified Components
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#101828]">
                    <PackageCheck className="w-3.5 h-3.5 text-[#0866F5]" />
                    Nationwide Delivery
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#101828]">
                    <Radar className="w-3.5 h-3.5 text-[#EA580C]" />
                    Engineering Support
                  </span>
                </div>
              </div>
            </div>

            {/* Right Robotics Hardware Showroom */}
            <div className="lg:col-span-6 animate-hero-rise-delay-2 space-y-3.5">
              <div className="group relative p-2 sm:p-3 rounded-[20px] sm:rounded-[24px] bg-white border border-slate-200/90">
                <div className="w-full rounded-[14px] sm:rounded-[16px] overflow-hidden bg-[#F8FAFC] flex items-center justify-center relative">
                  <img
                    src={heroSrc}
                    alt="Robotera BD — Robotics and Embedded Electronics Showroom"
                    referrerPolicy="no-referrer"
                    onError={() => {
                      if (heroSrc !== DEFAULT_SITE_SETTINGS.heroImageUrl) {
                        setHeroSrc(DEFAULT_SITE_SETTINGS.heroImageUrl);
                      }
                    }}
                    className={
                      isCustomHeroImg
                        ? 'w-full h-auto max-h-[260px] sm:max-h-[360px] lg:max-h-[420px] object-contain block'
                        : 'w-full h-auto max-h-[260px] sm:max-h-[360px] lg:max-h-[400px] object-contain block'
                    }
                  />
                </div>
              </div>

              {/* Interactive Featured Hardware Strip */}
              {showcaseProducts.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {showcaseProducts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => (onSelectProduct ? onSelectProduct(item) : onShopNow())}
                      className="group bg-white hover:bg-[#071A3B]/95 border border-slate-200/90 hover:border-[#0866F5]/70 rounded-xl p-2.5 text-left transition-colors duration-200 flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#F1F5F9] group-hover:bg-white/10 p-1 flex items-center justify-center shrink-0 transition-colors">
                          <HardwareArtwork
                            kind={item.artwork}
                            imageUrl={item.imageUrl}
                            alt={item.name}
                            fit="contain"
                            className="w-full h-full"
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-[#0866F5] group-hover:text-[#38BDF8] tabular-nums">
                          ৳{item.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-display font-semibold text-[#101828] group-hover:text-white line-clamp-1 transition-colors">
                          {item.name}
                        </p>
                        <p className="text-[10px] font-mono text-[#64748B] group-hover:text-slate-300 truncate">
                          {item.sku}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* C. Minimal Trust & Service Highlights Strip Directly Below Hero */}
      <section aria-label="Service highlights" className="bg-white border-t border-slate-200/80">
        <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10 py-3.5 sm:py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[
              {
                icon: Cpu,
                title: 'Authentic Components',
                desc: 'Original silicon & ESD-safe packing',
                tone: 'bg-[#EFF6FF] text-[#0866F5]',
              },
              {
                icon: Truck,
                title: 'Nationwide Delivery',
                desc: 'Dhaka 2–3d (৳80) · Outside 2–4d (৳150)',
                tone: 'bg-[#ECFEFF] text-[#0891B2]',
              },
              {
                icon: ShieldCheck,
                title: 'Secure Payments',
                desc: 'bKash, Nagad, Cards & COD',
                tone: 'bg-[#ECFDF5] text-[#059669]',
              },
              {
                icon: Headphones,
                title: 'Engineering Support',
                desc: 'Pinout & integration guidance',
                tone: 'bg-[#EEF2FF] text-[#4F46E5]',
              },
              {
                icon: Award,
                title: 'Quality Assurance',
                desc: 'Bench-tested & 7-day replacement',
                tone: 'bg-[#FFFBEB] text-[#D97706]',
                spanFullMobile: true,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className={`flex items-center gap-2.5 py-1 ${
                    item.spanFullMobile ? 'col-span-2 sm:col-span-1' : ''
                  }`}
                >
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${item.tone} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-xs font-bold text-[#071A3B] truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[#64748B] truncate">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};
