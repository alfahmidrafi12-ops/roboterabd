import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  Bot,
  Check,
  Cpu,
  Headphones,
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

const LEGACY_KICKERS = new Set([
  'Dhaka Robotics & Embedded Supply',
  'ENGINEERING THE FUTURE',
]);

const LEGACY_TITLES = new Set([
  'Precision Robotics & Electronics Built for Makers',
  'Build Beyond Imagination.',
]);

const LEGACY_SUBTITLES = new Set([
  'Source bench-tested microcontrollers, SLAM LiDAR scanners, high-torque actuators, and industrial IoT modules with fast nationwide courier across Bangladesh.',
  'Discover premium robotics components, advanced microcontrollers, precision sensors, and engineering tools to turn your ideas into reality.',
]);

const LEGACY_IMAGE_URLS = new Set([
  '',
  '/assets/aistudio/image_88bf5559.png',
]);

export const HeroSection: React.FC<HeroSectionProps> = ({
  siteSettings = DEFAULT_SITE_SETTINGS,
  onShopNow,
  onExploreKits,
}) => {
  const rawHeroUrl = siteSettings.heroImageUrl?.trim() || '';
  const hasCustomAdminHero = Boolean(rawHeroUrl) && !LEGACY_IMAGE_URLS.has(rawHeroUrl);
  const resolvedHeroSrc = hasCustomAdminHero ? rawHeroUrl : BRAND_STUDIO_MEDIA.heroShowcase;

  const [heroSrc, setHeroSrc] = useState(resolvedHeroSrc);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const showcaseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHeroSrc(resolvedHeroSrc);
  }, [resolvedHeroSrc]);

  const rawKicker = siteSettings.heroKicker?.trim() || '';
  const displayKicker =
    !rawKicker || LEGACY_KICKERS.has(rawKicker)
      ? DEFAULT_SITE_SETTINGS.heroKicker
      : rawKicker;

  const rawTitle = siteSettings.heroTitle?.trim() || '';
  const displayTitle =
    !rawTitle || LEGACY_TITLES.has(rawTitle)
      ? DEFAULT_SITE_SETTINGS.heroTitle
      : rawTitle;

  const rawSubtitle = siteSettings.heroSubtitle?.trim() || '';
  const displaySubtitle =
    !rawSubtitle || LEGACY_SUBTITLES.has(rawSubtitle)
      ? DEFAULT_SITE_SETTINGS.heroSubtitle
      : rawSubtitle;

  const isDefaultStackedHeadline = displayTitle === DEFAULT_SITE_SETTINGS.heroTitle;

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const el = showcaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({
      x: Number((nx * 10).toFixed(2)),
      y: Number((ny * 8).toFixed(2)),
    });
  };

  const handlePointerLeave = () => {
    setParallax({ x: 0, y: 0 });
  };

  const floatingDetails = [
    {
      title: 'ESP32 DEVELOPMENT',
      subtitle: 'Robotics & IoT',
      icon: Cpu,
      iconBg: 'bg-[#087BFF]/10 text-[#087BFF]',
      positionClass: 'sm:top-5 sm:-left-4 lg:-left-6',
      floatClass: 'animate-float-card-1',
      action: onShopNow,
    },
    {
      title: 'PRECISION SENSORS',
      subtitle: 'Explore Components',
      icon: Radar,
      iconBg: 'bg-[#00CFFF]/15 text-[#0284C7]',
      positionClass: 'sm:bottom-5 sm:left-4 lg:left-6',
      floatClass: 'animate-float-card-2',
      action: onShopNow,
    },
    {
      title: 'DESK ROBOTS',
      subtitle: 'Coming Soon',
      icon: Bot,
      iconBg: 'bg-[#071A3D]/8 text-[#071A3D]',
      positionClass: 'sm:top-6 sm:-right-3 lg:-right-5',
      floatClass: 'animate-float-card-3',
      action: onExploreKits,
    },
  ];

  return (
    <>
      <section
        id="top"
        className="relative z-20 overflow-x-clip bg-[#F5F8FC] min-[1500px]:bg-transparent min-[1500px]:pointer-events-none"
      >
        <div className="relative pointer-events-auto w-full max-w-[1440px] mx-auto overflow-hidden bg-gradient-to-br from-white via-[#F5F8FC] to-[#ECF3FC] min-[1500px]:border-x min-[1500px]:border-slate-300/90">
          {/* Subtle Technical Grid */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-lab-grid opacity-75"
          />

          {/* Subtle Blueprint Circuit Traces SVG */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.26]"
            viewBox="0 0 1440 720"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            {/* Top-left subtle schematic traces */}
            <path
              d="M0 96H132L176 140H310"
              stroke="#087BFF"
              strokeOpacity="0.22"
              strokeWidth="1"
            />
            <circle cx="310" cy="140" r="3" fill="#087BFF" fillOpacity="0.3" />
            <path
              d="M0 112H118L162 156H248"
              stroke="#071A3D"
              strokeOpacity="0.14"
              strokeWidth="1"
            />
            <circle cx="248" cy="156" r="2.5" stroke="#071A3D" strokeOpacity="0.24" strokeWidth="1" />

            {/* Right-side schematic bus routing framing studio stage */}
            <path
              d="M1440 160H1280L1230 210H1080"
              stroke="#087BFF"
              strokeOpacity="0.2"
              strokeWidth="1"
            />
            <circle cx="1080" cy="210" r="3" fill="#00CFFF" fillOpacity="0.45" />
            <path
              d="M1440 540H1250L1196 486H1040"
              stroke="#071A3D"
              strokeOpacity="0.14"
              strokeWidth="1"
            />
            <circle cx="1040" cy="486" r="3" stroke="#087BFF" strokeOpacity="0.28" strokeWidth="1" />

            {/* Lower-left blueprint datum hairline */}
            <path
              d="M72 640H240L272 608H390"
              stroke="#087BFF"
              strokeOpacity="0.16"
              strokeWidth="1"
            />
            <path d="M58 640H68M63 635V645" stroke="#071A3D" strokeOpacity="0.25" strokeWidth="1" />
          </svg>

          {/* Soft Studio Radial Lighting Accents */}
          <div
            aria-hidden="true"
            className="animate-ambient-pulse pointer-events-none absolute -top-24 right-8 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(8,123,255,0.12)_0%,rgba(0,207,255,0.08)_42%,transparent_72%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-12 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(8,123,255,0.06)_0%,transparent_70%)]"
          />

          <div className="relative z-10 px-4 sm:px-6 lg:px-10 py-10 sm:py-14 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* LEFT SIDE: Executive Hardware Copy & Actions */}
              <div className="lg:col-span-6 flex flex-col justify-center">
                {/* Small Eyebrow */}
                <div className="animate-hero-rise inline-flex items-center gap-2.5 mb-4">
                  <span className="h-[2px] w-7 bg-[#087BFF]" aria-hidden="true" />
                  <p className="font-mono text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase text-[#087BFF]">
                    {displayKicker}
                  </p>
                </div>

                {/* Main Headline */}
                {isDefaultStackedHeadline ? (
                  <h1 className="animate-hero-rise-delay-1 font-hero font-extrabold text-[44px] sm:text-[58px] lg:text-[66px] xl:text-[74px] leading-[0.98] tracking-[-0.035em] text-[#071A3D]">
                    <span className="block">BUILD.</span>
                    <span className="block mt-1">CREATE.</span>
                    <span className="block mt-1 bg-gradient-to-r from-[#087BFF] via-[#087BFF] to-[#00A8E8] bg-clip-text text-transparent">
                      INNOVATE.
                    </span>
                  </h1>
                ) : (
                  <h1 className="animate-hero-rise-delay-1 font-hero font-extrabold text-[38px] sm:text-[52px] lg:text-[60px] leading-[1.04] tracking-[-0.03em] text-[#071A3D] [text-wrap:balance] max-w-xl">
                    {displayTitle}
                  </h1>
                )}

                {/* Description */}
                <p className="animate-hero-rise-delay-2 mt-5 sm:mt-6 text-[15px] sm:text-[17px] text-[#334155] max-w-[530px] leading-[1.65] font-normal">
                  {displaySubtitle}
                </p>

                {/* Primary & Secondary CTAs */}
                <div className="animate-hero-rise-delay-2 mt-7 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3.5">
                  <button
                    type="button"
                    onClick={onShopNow}
                    className="group inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-[#087BFF] hover:bg-[#0668DC] text-white text-[12px] sm:text-[13px] font-bold tracking-[0.06em] uppercase shadow-[0_14px_30px_-10px_rgba(8,123,255,0.52)] hover:shadow-[0_18px_36px_-10px_rgba(8,123,255,0.62)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F8FC]"
                  >
                    <span>Explore Hardware</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={onExploreKits}
                    className="group inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#071A3D] border border-[#071A3D]/18 hover:border-[#087BFF]/55 text-[12px] sm:text-[13px] font-bold tracking-[0.06em] uppercase shadow-[0_6px_18px_-8px_rgba(7,26,61,0.12)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F8FC]"
                  >
                    <span>Discover Robotics</span>
                    <ArrowRight className="w-4 h-4 text-[#087BFF] transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>

                {/* Minimal Trust Indicators (No Numerical Stats) */}
                <div className="animate-hero-rise-delay-3 mt-8 pt-6 border-t border-slate-200/90 flex flex-wrap items-center gap-x-6 gap-y-2.5">
                  {[
                    'Authentic Components',
                    'Nationwide Delivery',
                    'Engineering Support',
                  ].map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-2 text-[13px] font-medium text-[#1E293B]"
                    >
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#087BFF]/12 text-[#087BFF]">
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </span>
                      <span>{label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* RIGHT SIDE: Commercial Studio Hardware Showcase */}
              <div className="lg:col-span-6 animate-hero-rise-delay-2 sm:px-3 lg:px-4">
                <div
                  ref={showcaseRef}
                  onMouseMove={handlePointerMove}
                  onMouseLeave={handlePointerLeave}
                  className="relative group"
                >
                  {/* Soft ambient rim backlight behind studio slab */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-3 rounded-[34px] bg-gradient-to-tr from-[#087BFF]/10 via-white/40 to-[#00CFFF]/14 blur-xl opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                  />

                  {/* Studio Hardware Frame */}
                  <div
                    style={{
                      transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
                      transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    className="relative rounded-[26px] bg-white p-2 sm:p-2.5 border border-slate-200/90 shadow-[0_28px_64px_-22px_rgba(7,26,61,0.18),0_10px_24px_-10px_rgba(8,123,255,0.10)]"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[18px] bg-[#F5F8FC]">
                      <img
                        src={heroSrc}
                        alt="Robotera BD hardware collection featuring ESP32 boards, Arduino microcontrollers, 360 LiDAR scanner, sensor modules, and desktop companion robot"
                        referrerPolicy="no-referrer"
                        onError={() => {
                          if (heroSrc !== BRAND_STUDIO_MEDIA.heroShowcase) {
                            setHeroSrc(BRAND_STUDIO_MEDIA.heroShowcase);
                          }
                        }}
                        className="animate-hero-image-reveal w-full h-full object-cover object-center block transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                      />

                      {/* Subtle studio vignette polish along bottom corners */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-inset ring-black/[0.04]"
                      />

                      {/* Minimal Precision Corner Brackets */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-3 left-3 w-3.5 h-3.5 border-t border-l border-[#087BFF]/35 rounded-tl-[4px]"
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-3 right-3 w-3.5 h-3.5 border-t border-r border-[#087BFF]/35 rounded-tr-[4px]"
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-3 left-3 w-3.5 h-3.5 border-b border-l border-[#087BFF]/35 rounded-bl-[4px]"
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-3 right-3 w-3.5 h-3.5 border-b border-r border-[#087BFF]/35 rounded-br-[4px]"
                      />
                    </div>
                  </div>

                  {/* Desktop & Tablet Floating Glassmorphic Product Detail Cards */}
                  {floatingDetails.map((card) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={card.title}
                        type="button"
                        onClick={card.action}
                        style={{
                          transform: `translate3d(${Number((parallax.x * -0.45).toFixed(2))}px, ${Number((parallax.y * -0.45).toFixed(2))}px, 0)`,
                          transition: 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                        className={`hidden sm:flex ${card.positionClass} ${card.floatClass} absolute z-20 items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/85 shadow-[0_14px_30px_-10px_rgba(7,26,61,0.16),0_4px_10px_-4px_rgba(8,123,255,0.08)] hover:border-[#087BFF]/45 hover:bg-white text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF]`}
                      >
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-xl shrink-0 ${card.iconBg}`}
                        >
                          <Icon className="w-4 h-4" strokeWidth={2} />
                        </span>
                        <div className="min-w-0 pr-0.5">
                          <p className="font-mono text-[10px] font-bold tracking-[0.08em] uppercase text-[#071A3D] leading-tight whitespace-nowrap">
                            {card.title}
                          </p>
                          <p className="text-[11px] font-medium text-[#475569] leading-tight mt-0.5 whitespace-nowrap">
                            {card.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}

                  {/* Mobile Clean Glassmorphic Detail Strip (Zero Overlap with Photo) */}
                  <div className="grid grid-cols-1 min-[460px]:grid-cols-3 sm:hidden gap-2.5 mt-3">
                    {floatingDetails.map((card) => {
                      const Icon = card.icon;
                      return (
                        <button
                          key={card.title}
                          type="button"
                          onClick={card.action}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200/85 shadow-[0_8px_18px_-8px_rgba(7,26,61,0.12)] text-left"
                        >
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${card.iconBg}`}
                          >
                            <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                          </span>
                          <div className="min-w-0">
                            <p className="font-mono text-[10px] font-bold tracking-[0.06em] uppercase text-[#071A3D] truncate">
                              {card.title}
                            </p>
                            <p className="text-[11px] font-medium text-[#475569] truncate">
                              {card.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Crisp High-Contrast Trust & Service Strip */}
      <section
        aria-label="Service highlights"
        className="bg-white min-[1500px]:bg-transparent min-[1500px]:pointer-events-none border-y border-slate-200/90 min-[1500px]:border-y-0"
      >
        <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-white min-[1500px]:border-x min-[1500px]:border-t min-[1500px]:border-b min-[1500px]:border-slate-300/90 px-4 sm:px-6 lg:px-10 py-3.5 sm:py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-0 sm:divide-x divide-slate-200">
            {[
              {
                icon: Cpu,
                title: 'Authentic Components',
                desc: 'Original silicon & ESD-safe packing',
                iconColor: 'text-[#087BFF]',
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
                iconColor: 'text-[#087BFF]',
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
