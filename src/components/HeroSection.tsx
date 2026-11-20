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
import { BRAND_STUDIO_MEDIA } from '../data/brandMedia';
import { DEFAULT_SITE_SETTINGS } from '../data/catalog';
import { Product, SiteImagesConfig } from '../types/store';

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
  durationMs = 1100,
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
  const rawHeroUrl = siteSettings.heroImageUrl?.trim() || '';
  const hasCustomAdminHero =
    Boolean(rawHeroUrl) && rawHeroUrl !== DEFAULT_SITE_SETTINGS.heroImageUrl;

  const resolvedHeroSrc = hasCustomAdminHero ? rawHeroUrl : BRAND_STUDIO_MEDIA.heroShowcase;
  const [heroSrc, setHeroSrc] = useState(resolvedHeroSrc);

  useEffect(() => {
    setHeroSrc(resolvedHeroSrc);
  }, [resolvedHeroSrc]);

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

  const showcaseProducts = useMemo(() => {
    if (products.length === 0) return [];
    const preferredIds = ['esp32-s3-devkit', 'rplidar-a1m8', 'raspberry-pi-5-8gb', '6dof-robot-arm-kit'];
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
      accentClass: 'text-[#60A5FA]',
    },
    {
      target: 500,
      suffix: '+',
      label: 'Shipments',
      accentClass: 'text-[#2DD4BF]',
    },
    {
      target: 64,
      suffix: '',
      label: 'Districts',
      accentClass: 'text-white',
    },
    {
      target: 99,
      suffix: '%',
      label: 'QC Pass',
      accentClass: 'text-[#FB923C]',
    },
  ];

  const isStudioPhoto = heroSrc === BRAND_STUDIO_MEDIA.heroShowcase;

  return (
    <>
      <section
        id="top"
        className="relative z-20 overflow-hidden bg-[#071A3B] bg-gradient-to-br from-[#06142E] via-[#071A3B] to-[#0C2B5E] text-white"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-75" />
        <div
          aria-hidden="true"
          className="animate-ambient-pulse pointer-events-none absolute -top-28 -right-20 w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,rgba(8,102,245,0.28)_0%,rgba(13,148,136,0.12)_48%,transparent_72%)]"
        />
        <div
          aria-hidden="true"
          className="animate-spin-slow pointer-events-none hidden lg:block absolute -top-44 -right-32 w-[620px] h-[620px] rounded-full border border-dashed border-white/[0.06]"
        />

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left Rich Deep-Navy Flagship Copy & Metric Rail */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="animate-hero-rise flex items-center gap-2.5 mb-3.5">
                <span className="h-[2px] w-7 bg-[#2DD4BF]" aria-hidden="true" />
                <p className="text-[11px] font-mono font-semibold tracking-[0.14em] uppercase text-[#2DD4BF]">
                  {displayKicker}
                </p>
              </div>

              <h1 className="animate-hero-rise-delay-1 font-display text-[32px] sm:text-5xl lg:text-[56px] font-bold text-white leading-[1.06] tracking-[-0.025em] [text-wrap:balance] max-w-xl">
                {displayTitle}
              </h1>

              <p className="animate-hero-rise-delay-2 mt-4 sm:mt-5 text-[15px] sm:text-[17px] text-slate-300 max-w-xl leading-relaxed">
                {displaySubtitle}
              </p>

              {/* High-Contrast Flat-Premium CTA Pair */}
              <div className="animate-hero-rise-delay-2 mt-6 sm:mt-7 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={onShopNow}
                  className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#0866F5] hover:bg-[#1685FF] border border-[#1685FF]/60 hover:border-white/60 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071A3B]"
                >
                  <span className="w-2 h-2 rounded-full bg-[#FB923C]" aria-hidden="true" />
                  <span>Explore Hardware</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
                <button
                  type="button"
                  onClick={onExploreKits}
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/25 hover:border-[#2DD4BF] transition-colors text-sm font-semibold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071A3B]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF]" aria-hidden="true" />
                  <span>Discover Robotics Kits</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#2DD4BF] transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>

              {/* Unboxed High-Contrast Metric Rail */}
              <div className="animate-hero-rise-delay-3 mt-8 pt-6 border-t border-white/15 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 sm:gap-y-0 sm:divide-x divide-white/15">
                  {trustCounters.map((stat, idx) => (
                    <div
                      key={stat.label}
                      className={`${idx === 0 ? 'sm:pr-4' : 'sm:px-4'} min-w-0`}
                    >
                      <p className={`font-mono text-xl sm:text-[23px] font-bold tracking-tight ${stat.accentClass}`}>
                        <AnimatedCounter
                          target={stat.target}
                          suffix={stat.suffix}
                          startReady={countersReady}
                        />
                      </p>
                      <p className="text-xs font-medium text-slate-300 mt-0.5 truncate">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-medium text-slate-200">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2DD4BF]" />
                    Verified Components
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5 text-[#60A5FA]" />
                    Nationwide Delivery
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Radar className="w-3.5 h-3.5 text-[#FB923C]" />
                    Engineering Support
                  </span>
                </div>
              </div>
            </div>

            {/* Right Flagship Hardware Showroom Frame */}
            <div className="lg:col-span-6 animate-hero-rise-delay-2 flex">
              <div className="group relative w-full rounded-2xl overflow-hidden bg-[#06132B] border border-white/15 hover:border-[#38BDF8]/40 transition-colors flex flex-col justify-between min-h-[260px] sm:min-h-[360px] lg:min-h-[430px]">
                {/* Animated Telemetry Sweep along Top Edge */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px z-20 overflow-hidden"
                >
                  <div className="animate-trace-sweep w-40 h-full bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent" />
                </div>

                <div className="relative flex-1 w-full bg-[#06132B] flex items-center justify-center overflow-hidden">
                  <img
                    src={heroSrc}
                    alt="Robotera BD — Precision Robotics & Embedded Electronics Showroom"
                    referrerPolicy="no-referrer"
                    onError={() => {
                      if (heroSrc !== BRAND_STUDIO_MEDIA.heroShowcase) {
                        setHeroSrc(BRAND_STUDIO_MEDIA.heroShowcase);
                      }
                    }}
                    className={
                      isStudioPhoto
                        ? 'w-full h-full object-cover object-center block transition-transform duration-700 ease-out group-hover:scale-[1.03]'
                        : 'w-full h-full max-h-[400px] object-contain bg-[#F8FAFC] block transition-transform duration-500 group-hover:scale-[1.02]'
                    }
                  />

                  {isStudioPhoto && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#06132B]/90 via-[#06132B]/40 to-transparent"
                    />
                  )}
                </div>

                {/* Integrated Bottom Showroom Quick-Jump Bar */}
                {showcaseProducts.length > 0 && (
                  <div className="bg-[#081C3E] border-t border-white/15 px-3.5 sm:px-5 py-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-300">
                        Featured Bench Components
                      </span>
                      <button
                        type="button"
                        onClick={onShopNow}
                        className="text-[11px] font-semibold text-[#38BDF8] hover:text-white transition-colors inline-flex items-center gap-1"
                      >
                        <span>Full Catalog</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {showcaseProducts.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => (onSelectProduct ? onSelectProduct(item) : onShopNow())}
                          className="group text-left px-2.5 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 hover:border-[#38BDF8]/65 transition-colors min-w-0"
                        >
                          <p className="text-[11px] font-display font-semibold text-white group-hover:text-[#38BDF8] truncate transition-colors">
                            {item.name}
                          </p>
                          <p className="font-mono text-[10px] text-[#2DD4BF] tabular-nums mt-0.5">
                            ৳{item.price.toLocaleString('en-IN')}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Crisp High-Contrast Trust & Service Strip */}
      <section
        aria-label="Service highlights"
        className="bg-white min-[1500px]:bg-transparent min-[1500px]:pointer-events-none border-b border-slate-300/80 min-[1500px]:border-b-0"
      >
        <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-white min-[1500px]:border-x min-[1500px]:border-b min-[1500px]:border-slate-300/90 px-4 sm:px-6 lg:px-10 py-3.5 sm:py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-0 sm:divide-x divide-slate-200">
            {[
              {
                icon: Cpu,
                title: 'Authentic Components',
                desc: 'Original silicon & ESD-safe packing',
                iconColor: 'text-[#0866F5]',
              },
              {
                icon: Truck,
                title: 'Nationwide Delivery',
                desc: 'Dhaka 2–3d (৳80) · Outside 2–4d (৳150)',
                iconColor: 'text-[#0F766E]',
              },
              {
                icon: ShieldCheck,
                title: 'Secure Payments',
                desc: 'bKash, Nagad, Cards & COD',
                iconColor: 'text-[#0F766E]',
              },
              {
                icon: Headphones,
                title: 'Engineering Support',
                desc: 'Pinout & integration guidance',
                iconColor: 'text-[#0866F5]',
              },
              {
                icon: Award,
                title: 'Quality Assurance',
                desc: 'Bench-tested & 7-day replacement',
                iconColor: 'text-[#C2410C]',
                spanFullMobile: true,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className={`group flex items-center gap-2.5 py-1 ${
                    idx === 0 ? 'sm:pr-4' : 'sm:px-4'
                  } ${item.spanFullMobile ? 'col-span-2 sm:col-span-1' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${item.iconColor} transition-transform duration-200 group-hover:scale-110`}
                    strokeWidth={2}
                  />
                  <div className="min-w-0">
                    <p className="font-display text-xs font-bold text-[#071A3B] truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] font-medium text-[#475569] truncate">{item.desc}</p>
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
