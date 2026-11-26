import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Cpu,
  Headphones,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { BRAND_STUDIO_MEDIA } from '../data/brandMedia';
import { DEFAULT_SITE_SETTINGS } from '../data/catalog';
import { playTapSound } from '../lib/sound';
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
  'DHAKA ROBOTICS & EMBEDDED SUPPLY',
  'ENGINEERING THE FUTURE',
  'ROBOTERA BD — ENGINEERING THE FUTURE',
]);

const LEGACY_TITLES = new Set([
  'Precision Robotics & Electronics Built for Makers',
  'Precision Robotics & Embedded Silicon.',
  'Build Beyond Imagination.',
  'BUILD. CREATE. INNOVATE.',
]);

const LEGACY_SUBTITLES = new Set([
  'Source bench-tested microcontrollers, SLAM LiDAR scanners, high-torque actuators, and industrial IoT modules with fast nationwide courier across Bangladesh.',
  'Bench-tested ESP32-S3 boards, Raspberry Pi 5 compute, 360° SLAM LiDAR scanners, and metal-gear actuation stocked locally in Dhaka.',
  'Discover premium robotics components, advanced microcontrollers, precision sensors, and engineering tools to turn your ideas into reality.',
  'Your ideas deserve the right technology. Explore premium microcontrollers, robotics components, advanced sensors and engineering tools — all in one place.',
]);

const LEGACY_IMAGE_URLS = new Set([
  '',
  '/assets/aistudio/image_88bf5559.png',
]);

export const HeroSection: React.FC<HeroSectionProps> = ({
  siteSettings = DEFAULT_SITE_SETTINGS,
  products = [],
  onShopNow,
  onExploreKits,
  onSelectProduct,
}) => {
  const rawHeroUrl = siteSettings.heroImageUrl?.trim() || '';
  const hasCustomAdminHero = Boolean(rawHeroUrl) && !LEGACY_IMAGE_URLS.has(rawHeroUrl);
  const resolvedHeroSrc = hasCustomAdminHero ? rawHeroUrl : BRAND_STUDIO_MEDIA.darkRoboticsStage;

  const [heroSrc, setHeroSrc] = useState(resolvedHeroSrc);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);

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

  const isDefaultHeadline = displayTitle === DEFAULT_SITE_SETTINGS.heroTitle;

  const line1Text: string = isDefaultHeadline ? 'Precision Robotics.' : displayTitle || '';
  const line2Text: string = isDefaultHeadline ? 'Built for Innovation.' : '';
  const totalTypeChars = line1Text.length + line2Text.length;

  const [typedCount, setTypedCount] = useState<number>(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return totalTypeChars;
    }
    return 0;
  });
  const [showCursor, setShowCursor] = useState<boolean>(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setTypedCount(totalTypeChars);
      setShowCursor(false);
      return;
    }

    let cancelled = false;
    let stepTimer = 0;
    let cursorHideTimer = 0;
    let fallbackStartTimer = 0;
    let started = false;

    setTypedCount(0);
    setShowCursor(true);

    const scheduleNextChar = (currentCount: number) => {
      if (cancelled) return;
      if (currentCount >= totalTypeChars) {
        cursorHideTimer = window.setTimeout(() => {
          if (!cancelled) setShowCursor(false);
        }, 1150);
        return;
      }

      const nextCount = currentCount + 1;
      const typedChar =
        currentCount < line1Text.length
          ? line1Text[currentCount]
          : line2Text[currentCount - line1Text.length];

      let delay = 36 + (currentCount % 3) * 8;
      if (isDefaultHeadline && currentCount === line1Text.length) {
        delay = 220;
      } else if (typedChar === '.') {
        delay = 95;
      } else if (typedChar === ' ') {
        delay = 58;
      }

      stepTimer = window.setTimeout(() => {
        if (cancelled) return;
        setTypedCount(nextCount);
        scheduleNextChar(nextCount);
      }, delay);
    };

    const startTyping = () => {
      if (cancelled || started) return;
      started = true;
      window.clearTimeout(fallbackStartTimer);
      window.removeEventListener('robotera:boot-complete', startTyping);
      stepTimer = window.setTimeout(() => {
        scheduleNextChar(0);
      }, 120);
    };

    const bootOverlay = document.querySelector('[aria-label="Initializing Robotera BD"]');
    if (!bootOverlay) {
      startTyping();
    } else {
      window.addEventListener('robotera:boot-complete', startTyping, { once: true });
      fallbackStartTimer = window.setTimeout(startTyping, 2800);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(stepTimer);
      window.clearTimeout(cursorHideTimer);
      window.clearTimeout(fallbackStartTimer);
      window.removeEventListener('robotera:boot-complete', startTyping);
    };
  }, [line1Text, line2Text, totalTypeChars, isDefaultHeadline]);

  const typedLine1 = line1Text.slice(0, Math.min(typedCount, line1Text.length));
  const typedLine2 =
    isDefaultHeadline && typedCount > line1Text.length
      ? line2Text.slice(0, typedCount - line1Text.length)
      : '';
  const cursorOnLine1 =
    showCursor && (!isDefaultHeadline || typedCount < line1Text.length);
  const cursorOnLine2 =
    showCursor && isDefaultHeadline && typedCount >= line1Text.length;

  const handleStagePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({
      x: Number((nx * -6).toFixed(2)),
      y: Number((ny * -4).toFixed(2)),
    });
  };

  const handleStagePointerLeave = () => {
    setParallax({ x: 0, y: 0 });
  };

  // Real featured catalog items for minimal inline hardware shortcuts
  const featuredLinks = useMemo(() => {
    const pick = (id: string, fallbackCat?: string) =>
      products.find((p) => p.id === id) ||
      (fallbackCat ? products.find((p) => p.category === fallbackCat) : undefined);

    const candidates = [
      pick('esp32-s3-devkit', 'microcontrollers'),
      pick('rplidar-a1m8', 'sensors'),
      pick('raspberry-pi-5-8gb', 'microcontrollers'),
      pick('6dof-robot-arm-kit', 'robotics-kits'),
    ].filter((item): item is Product => Boolean(item));

    const unique: Product[] = [];
    const seen = new Set<string>();
    for (const item of candidates) {
      if (!seen.has(item.id)) {
        unique.push(item);
        seen.add(item.id);
      }
      if (unique.length === 3) break;
    }
    return unique;
  }, [products]);

  const openProductOrCatalog = (product?: Product) => {
    if (product && onSelectProduct) {
      onSelectProduct(product);
    } else {
      onShopNow();
    }
  };

  return (
    <>
      <section
        id="top"
        className="bg-[#050B18] min-[1500px]:bg-transparent min-[1500px]:pointer-events-none"
      >
        <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto overflow-hidden bg-[#050B18] text-[#F5F8FF] min-[1500px]:border-x min-[1500px]:border-[#1E3A6E]/60">
          {/* Ultra-Subtle Architectural Grid */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(100, 150, 255, 0.038) 1px, transparent 1px), linear-gradient(to bottom, rgba(100, 150, 255, 0.038) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            }}
          />

          {/* Quiet Breathing Key-Light Radial Behind the Hardware Showcase */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/2 flex justify-center lg:justify-end lg:pr-[6%]"
          >
            <div className="animate-keylight w-[780px] h-[540px] shrink-0 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(22,119,255,0.18)_0%,rgba(0,200,255,0.05)_44%,transparent_72%)]" />
          </div>

          {/* Subtle Signal Light Beam Across Top Rail */}
          <div
            aria-hidden="true"
            className="animate-signal-sweep pointer-events-none absolute top-0 left-0 h-[1.5px] w-48 bg-gradient-to-r from-transparent via-[#00C8FF]/80 to-transparent"
          />

          <div className="relative z-10 px-5 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* LEFT COLUMN: Clean Minimal Editorial Copy & Focused Actions */}
              <div className="lg:col-span-5 text-center lg:text-left">
                <p className="animate-hero-rise font-mono text-[11px] font-medium tracking-[0.22em] uppercase text-[#00C8FF] mb-4">
                  {displayKicker}
                </p>

                {isDefaultHeadline ? (
                  <h1
                    aria-label="Precision Robotics. Built for Innovation."
                    className="relative font-hero font-extrabold text-[38px] sm:text-[50px] lg:text-[56px] xl:text-[62px] leading-[1.04] tracking-[-0.035em] text-[#F5F8FF] [text-wrap:balance]"
                  >
                    <span
                      aria-hidden="true"
                      className="invisible select-none pointer-events-none block"
                    >
                      Precision Robotics.
                      <span className="block text-[#1677FF] mt-1">Built for Innovation.</span>
                    </span>
                    <span aria-hidden="true" className="absolute inset-0 block">
                      <span>
                        {typedLine1}
                        {cursorOnLine1 && (
                          <span className="animate-type-cursor inline-block w-[3px] h-[0.82em] align-[-0.06em] ml-1 rounded-[1px] bg-[#00C8FF] shadow-[0_0_12px_rgba(0,200,255,0.85)]" />
                        )}
                      </span>
                      <span className="block text-[#1677FF] mt-1">
                        {typedLine2}
                        {cursorOnLine2 && (
                          <span className="animate-type-cursor inline-block w-[3px] h-[0.82em] align-[-0.06em] ml-1 rounded-[1px] bg-[#00C8FF] shadow-[0_0_12px_rgba(0,200,255,0.85)]" />
                        )}
                      </span>
                    </span>
                  </h1>
                ) : (
                  <h1
                    aria-label={displayTitle}
                    className="relative font-hero font-extrabold text-[36px] sm:text-[48px] lg:text-[54px] leading-[1.05] tracking-[-0.035em] text-[#F5F8FF] [text-wrap:balance]"
                  >
                    <span
                      aria-hidden="true"
                      className="invisible select-none pointer-events-none block"
                    >
                      {displayTitle}
                    </span>
                    <span aria-hidden="true" className="absolute inset-0 block">
                      {typedLine1}
                      {showCursor && (
                        <span className="animate-type-cursor inline-block w-[3px] h-[0.82em] align-[-0.06em] ml-1 rounded-[1px] bg-[#00C8FF] shadow-[0_0_12px_rgba(0,200,255,0.85)]" />
                      )}
                    </span>
                  </h1>
                )}

                <p className="animate-hero-rise-delay-2 mt-5 text-[15px] sm:text-[16px] text-[#A8B6CC] max-w-xl mx-auto lg:mx-0 leading-[1.68]">
                  {displaySubtitle}
                </p>

                {/* Two Clean, Uncluttered Conversion Buttons */}
                <div className="animate-hero-rise-delay-2 mt-7 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
                  <a
                    href="/shop"
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                      e.preventDefault();
                      playTapSound();
                      onShopNow();
                    }}
                    className="cta-sheen group inline-flex items-center justify-center gap-2.5 px-6 h-12 rounded-xl bg-[#1677FF] hover:bg-[#2684FF] text-white text-[13.5px] font-semibold tracking-tight shadow-[0_12px_30px_-10px_rgba(22,119,255,0.65)] hover:shadow-[0_16px_36px_-8px_rgba(22,119,255,0.78)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C8FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B18]"
                  >
                    <span>Explore Hardware Catalog</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </a>

                  <a
                    href="/category/robotics-kits"
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                      e.preventDefault();
                      playTapSound();
                      onExploreKits();
                    }}
                    className="group inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-transparent hover:bg-[#101D33] text-[#F5F8FF] border border-[rgba(100,150,255,0.28)] hover:border-[#1677FF]/70 active:scale-[0.98] text-[13.5px] font-semibold tracking-tight transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C8FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B18]"
                  >
                    <span>Discover Robotics Kits</span>
                    <ArrowRight className="w-4 h-4 text-[#A8B6CC] group-hover:text-[#00C8FF] transition-all duration-200 group-hover:translate-x-0.5" />
                  </a>
                </div>

                {/* Quiet Inline Hardware Index (Zero Cards, Zero Pills — Pure Links & Real DB Prices) */}
                {featuredLinks.length > 0 && (
                  <div className="animate-hero-rise-delay-3 mt-8 pt-6 border-t border-[rgba(100,150,255,0.14)] flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2.5">
                    {featuredLinks.map((item) => (
                      <a
                        key={item.id}
                        href={`/product/${encodeURIComponent(item.id)}`}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                          e.preventDefault();
                          playTapSound();
                          openProductOrCatalog(item);
                        }}
                        className="group/link inline-flex items-center gap-1.5 text-left active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C8FF] rounded"
                      >
                        <span className="text-[12.5px] font-medium text-[#A8B6CC] group-hover/link:text-[#F5F8FF] transition-colors">
                          {item.name}
                        </span>
                        <span className="font-mono text-[12px] font-semibold text-[#00C8FF] tabular-nums">
                          ৳{item.price.toLocaleString()}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#A8B6CC]/70 group-hover/link:text-[#00C8FF] group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-all" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Single Seamless Dark Studio Hardware Focal Stage */}
              <div className="lg:col-span-7">
                <div
                  ref={stageRef}
                  onMouseMove={handleStagePointerMove}
                  onMouseLeave={handleStagePointerLeave}
                  className="animate-hero-image-reveal group/stage relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#050B18] border border-[rgba(100,150,255,0.16)] shadow-[0_36px_80px_-28px_rgba(0,0,0,0.95)]"
                >
                  <img
                    src={heroSrc}
                    alt="Robotera BD dark robotics bench showcasing 6-DOF CNC robotic arm, 360 degree LiDAR scanner, Raspberry Pi, and ESP32 controller"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    referrerPolicy="no-referrer"
                    style={{
                      transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0) scale(1.03)`,
                      transition: 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onError={() => {
                      if (heroSrc !== BRAND_STUDIO_MEDIA.roboticsArm) {
                        setHeroSrc(BRAND_STUDIO_MEDIA.roboticsArm);
                      }
                    }}
                    className="w-full h-full object-cover object-center block"
                  />

                  {/* Subtle Interactive Rim Highlight Following Parallax */}
                  <div
                    aria-hidden="true"
                    style={{
                      transform: `translate3d(${parallax.x * -1.8}px, ${parallax.y * -1.8}px, 0)`,
                      transition: 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    className="pointer-events-none absolute -inset-10 opacity-0 group-hover/stage:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_55%_42%,rgba(0,200,255,0.12)_0%,transparent_55%)]"
                  />

                  {/* Soft All-Around Studio Vignette Blending Edges Smoothly Into #050B18 */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_52%,rgba(5,11,24,0.68)_100%)]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#050B18]/85 via-[#050B18]/25 to-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Minimal Dark Navy Trust Strip Framed to Match Lower Section Rails */}
      <section
        aria-label="Trust and store policies"
        className="bg-[#0A1428] min-[1500px]:bg-transparent min-[1500px]:pointer-events-none border-y border-[rgba(100,150,255,0.14)] min-[1500px]:border-y-0"
      >
        <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-[#0A1428] text-[#F5F8FF] min-[1500px]:border-x min-[1500px]:border-x-[#1E3A6E]/60 min-[1500px]:border-y min-[1500px]:border-y-[rgba(100,150,255,0.18)] px-5 sm:px-8 lg:px-12 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-0 sm:divide-x divide-[rgba(100,150,255,0.14)]">
            {[
              {
                icon: Cpu,
                title: 'Original Silicon',
                desc: 'ESD-safe lab tested stock',
              },
              {
                icon: Truck,
                title: 'Nationwide Delivery',
                desc: 'Dhaka ৳80 · Outside ৳150',
              },
              {
                icon: ShieldCheck,
                title: 'Secure Checkout',
                desc: 'bKash, Nagad, Cards & COD',
              },
              {
                icon: Headphones,
                title: 'Technical Support',
                desc: 'Pinout & setup guidance',
              },
              {
                icon: Award,
                title: '7-Day Warranty',
                desc: 'Verified defect replacement',
                spanFullMobile: true,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  style={{ animationDelay: `${idx * 65}ms` }}
                  className={`animate-trust-enter group/trust flex items-center gap-3 py-0.5 ${
                    idx === 0 ? 'sm:pr-5' : 'sm:px-5'
                  } ${item.spanFullMobile ? 'col-span-2 sm:col-span-1' : ''}`}
                >
                  <Icon
                    className="w-4 h-4 text-[#F5F8FF]/90 group-hover/trust:text-[#00C8FF] group-hover/trust:scale-110 transition-all duration-200 shrink-0"
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0">
                    <p className="font-hero text-[12px] font-semibold text-[#F5F8FF] group-hover/trust:text-white transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[#A8B6CC] truncate">{item.desc}</p>
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
