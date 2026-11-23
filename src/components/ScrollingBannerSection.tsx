import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { BannerItem, BannerTheme, CategoryId } from '../types/store';
import { playStepTickSound, playTapSound } from '../lib/sound';
import { HardwareArtwork } from './HardwareArtwork';
import { Reveal } from './Reveal';

function resolveBannerLink(raw?: string): { kind: 'external' | 'internal'; href: string } | null {
  if (!raw) return null;
  let trimmed = raw.trim();
  if (!trimmed || /^(javascript|data|vbscript):/i.test(trimmed)) return null;
  if (
    !/^(https?:\/\/|\/|#)/i.test(trimmed) &&
    /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)
  ) {
    trimmed = `https://${trimmed}`;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return { kind: 'external', href: trimmed };
  }
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) {
    return { kind: 'internal', href: trimmed };
  }
  return null;
}

interface ScrollingBannerSectionProps {
  banners: BannerItem[];
  onSelectCategory: (categoryId: CategoryId) => void;
}

const ARTWORK_BACKDROPS: Record<
  BannerTheme,
  {
    surface: string;
    grid: string;
    accentGlow: string;
    kickerColor: string;
    titleColor: string;
    subColor: string;
    stageBox: string;
  }
> = {
  navy: {
    surface: 'bg-gradient-to-br from-[#071A3B] via-[#0B2554] to-[#0E3270]',
    grid: 'bg-lab-grid-dark opacity-70',
    accentGlow:
      'bg-[radial-gradient(circle_at_80%_25%,rgba(0,207,255,0.22),transparent_60%)]',
    kickerColor: 'text-[#00CFFF]',
    titleColor: 'text-white',
    subColor: 'text-slate-300',
    stageBox: 'bg-white/[0.06] border-white/15',
  },
  cobalt: {
    surface: 'bg-gradient-to-br from-[#0657D0] via-[#087BFF] to-[#238FFF]',
    grid: 'bg-lab-grid-dark opacity-60',
    accentGlow:
      'bg-[radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.22),transparent_60%)]',
    kickerColor: 'text-[#BAE6FD]',
    titleColor: 'text-white',
    subColor: 'text-blue-50/90',
    stageBox: 'bg-white/12 border-white/25',
  },
  slate: {
    surface: 'bg-gradient-to-br from-[#F3F7FC] via-[#E8EFF8] to-[#DCE7F5]',
    grid: 'bg-lab-grid opacity-75',
    accentGlow:
      'bg-[radial-gradient(circle_at_80%_25%,rgba(8,123,255,0.14),transparent_60%)]',
    kickerColor: 'text-[#087BFF]',
    titleColor: 'text-[#071A3B]',
    subColor: 'text-[#334155]',
    stageBox: 'bg-white border-slate-200/90',
  },
  emerald: {
    surface: 'bg-gradient-to-br from-[#062426] via-[#073134] to-[#0A474B]',
    grid: 'bg-lab-grid-dark opacity-65',
    accentGlow:
      'bg-[radial-gradient(circle_at_80%_25%,rgba(0,207,255,0.18),transparent_60%)]',
    kickerColor: 'text-[#00CFFF]',
    titleColor: 'text-white',
    subColor: 'text-slate-200/85',
    stageBox: 'bg-white/[0.08] border-white/15',
  },
};

const AUTO_INTERVAL_MS = 5000;

interface BannerVisualStageProps {
  banner: BannerItem;
}

const BannerVisualStage: React.FC<BannerVisualStageProps> = ({ banner }) => {
  const customImg = banner.imageUrl?.trim();
  const theme = ARTWORK_BACKDROPS[banner.theme] ?? ARTWORK_BACKDROPS.navy;

  if (customImg) {
    return (
      <div className="w-full h-full bg-[#F8FAFC] flex items-center justify-center overflow-hidden">
        <img
          src={customImg}
          alt={banner.title || 'Featured Robotics Campaign'}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain block transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full p-5 sm:p-7 flex items-center justify-between gap-4 sm:gap-6 overflow-hidden ${theme.surface}`}
    >
      <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${theme.grid}`} />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${theme.accentGlow}`}
      />

      <div className="relative z-10 min-w-0 flex-1 space-y-2">
        <p
          className={`text-[11px] font-mono font-semibold uppercase tracking-[0.14em] truncate ${theme.kickerColor}`}
        >
          {banner.kicker}
        </p>
        <h3
          className={`font-display text-lg sm:text-xl lg:text-2xl font-bold leading-snug line-clamp-2 [text-wrap:balance] ${theme.titleColor}`}
        >
          {banner.title}
        </h3>
        <p className={`text-xs sm:text-sm leading-relaxed line-clamp-2 ${theme.subColor}`}>
          {banner.subtitle}
        </p>
      </div>

      <div
        className={`relative z-10 w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 shrink-0 rounded-2xl border p-3 flex items-center justify-center overflow-hidden transition-transform duration-500 ease-out group-hover:scale-[1.05] ${theme.stageBox}`}
      >
        <HardwareArtwork
          kind={banner.artwork}
          imageUrl={banner.imageUrl}
          alt={banner.title}
          fit="contain"
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

interface CampaignCardSlotProps {
  banners: BannerItem[];
  currentIndex: number;
  prevIndex: number | null;
  direction: 'next' | 'prev';
  cycleKey: number;
  onSelectCategory: (categoryId: CategoryId) => void;
  className?: string;
}

const CampaignCardSlot: React.FC<CampaignCardSlotProps> = ({
  banners,
  currentIndex,
  prevIndex,
  direction,
  cycleKey,
  onSelectCategory,
  className = '',
}) => {
  const count = banners.length;
  const safeCurrent = count > 0 ? ((currentIndex % count) + count) % count : 0;
  const safePrev =
    prevIndex !== null && count > 0 ? ((prevIndex % count) + count) % count : null;

  const activeBanner = banners[safeCurrent];
  const outgoingBanner =
    safePrev !== null && safePrev !== safeCurrent ? banners[safePrev] : null;

  if (!activeBanner) return null;

  const enterAnim =
    outgoingBanner !== null
      ? direction === 'next'
        ? 'animate-banner-in-right'
        : 'animate-banner-in-left'
      : '';
  const exitAnim = direction === 'next' ? 'animate-banner-out-left' : 'animate-banner-out-right';
  const resolvedLink = resolveBannerLink(activeBanner.linkUrl);

  const sharedCardClassName = `group relative text-left w-full rounded-2xl bg-[#F3F7FC] border border-slate-200/90 hover:border-[#087BFF]/65 shadow-[0_6px_24px_-10px_rgba(7,26,61,0.1)] hover:shadow-[0_14px_34px_-12px_rgba(8,123,255,0.22)] transition-all duration-300 overflow-hidden flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] focus-visible:ring-offset-2 ${className}`;

  const cardInnerContent = (
    <>
      {/* Large 16:9 Uncropped Visual Artwork Viewport */}
      <div className="relative w-full aspect-[16/9] bg-[#F8FAFC] overflow-hidden border-b border-slate-200/80">
        {outgoingBanner && (
          <div
            key={`out-${cycleKey}-${outgoingBanner.id}`}
            className={`absolute inset-0 z-10 pointer-events-none ${exitAnim}`}
          >
            <BannerVisualStage banner={outgoingBanner} />
          </div>
        )}

        <div
          key={`in-${cycleKey}-${activeBanner.id}`}
          className={`absolute inset-0 z-20 ${enterAnim}`}
        >
          <BannerVisualStage banner={activeBanner} />
        </div>
      </div>

      {/* Refined Minimal Footer Caption Strip */}
      <div className="w-full px-4 sm:px-5 py-3.5 bg-white flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-mono font-semibold text-[#087BFF] uppercase tracking-wider truncate">
            {activeBanner.kicker}
          </p>
          <h3 className="font-display text-sm sm:text-base font-bold text-[#071A3B] group-hover:text-[#087BFF] transition-colors truncate mt-0.5">
            {activeBanner.title}
          </h3>
        </div>

        <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#071A3B] group-hover:text-[#087BFF] transition-colors whitespace-nowrap shrink-0">
          <span>{activeBanner.ctaLabel || 'Explore Campaign'}</span>
          {resolvedLink?.kind === 'external' ? (
            <ExternalLink className="w-3.5 h-3.5 text-[#087BFF] transition-transform duration-200 group-hover:translate-x-0.5" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5 text-[#087BFF] transition-transform duration-200 group-hover:translate-x-1" />
          )}
        </span>
      </div>
    </>
  );

  if (resolvedLink?.kind === 'external') {
    return (
      <a
        href={resolvedLink.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${activeBanner.title} — ${activeBanner.ctaLabel}`}
        className={sharedCardClassName}
      >
        {cardInnerContent}
      </a>
    );
  }

  const handleInternalClick = () => {
    if (resolvedLink?.kind === 'internal') {
      const target = resolvedLink.href;
      if (target.startsWith('#')) {
        if (target === '#track' || target.startsWith('#track=')) {
          window.location.hash = target;
          return;
        }
        const el = document.getElementById(target.slice(1));
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        window.location.hash = target;
        return;
      }
      window.location.assign(target);
      return;
    }
    onSelectCategory(activeBanner.targetCategory);
  };

  return (
    <button
      type="button"
      onClick={() => {
        playTapSound();
        handleInternalClick();
      }}
      aria-label={`${activeBanner.title} — ${activeBanner.ctaLabel}`}
      className={sharedCardClassName}
    >
      {cardInnerContent}
    </button>
  );
};

export const ScrollingBannerSection: React.FC<ScrollingBannerSectionProps> = ({
  banners,
  onSelectCategory,
}) => {
  const activeBanners = banners.filter((b) => b.active);
  const count = activeBanners.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [cycleKey, setCycleKey] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const activeRef = useRef(activeIndex);
  activeRef.current = activeIndex;

  useEffect(() => {
    if (activeIndex >= count && count > 0) {
      setActiveIndex(0);
      setPrevIndex(null);
    }
  }, [count, activeIndex]);

  const advanceTo = (targetIdx: number, dir: 'next' | 'prev') => {
    if (count <= 1) return;
    const normalized = ((targetIdx % count) + count) % count;
    if (normalized === activeRef.current) return;
    setPrevIndex(activeRef.current);
    setDirection(dir);
    setActiveIndex(normalized);
    setCycleKey((k) => k + 1);
  };

  useEffect(() => {
    if (count <= 1) return;
    const timer = window.setInterval(() => {
      advanceTo((activeRef.current + 1) % count, 'next');
    }, AUTO_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [count, cycleKey]);

  if (count === 0) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || count <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX;
    const delta = touchStartX - endX;
    if (Math.abs(delta) > 40) {
      advanceTo(
        delta > 0 ? activeIndex + 1 : activeIndex - 1,
        delta > 0 ? 'next' : 'prev'
      );
    }
    setTouchStartX(null);
  };

  const leftCurr = activeIndex;
  const leftPrev = prevIndex;
  const rightCurr = (activeIndex + 1) % count;
  const rightPrev = prevIndex !== null ? (prevIndex + 1) % count : null;

  return (
    <section
      id="campaigns"
      aria-label="Featured campaigns"
      className="scroll-mt-[108px] bg-white min-[1500px]:bg-transparent min-[1500px]:pointer-events-none"
    >
      <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-white min-[1500px]:border-x min-[1500px]:border-slate-200/90 px-4 sm:px-6 lg:px-10 py-8 sm:py-11">
        <Reveal>
          {/* Clean Header + Circular Navigation Controls */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-[2px] rounded-full bg-[#087BFF]" aria-hidden="true" />
                <p className="text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-[#087BFF]">
                  ROBOTERA BD / SPECIAL CAMPAIGNS
                </p>
              </div>
              <h2 className="font-display text-2xl sm:text-[28px] font-bold text-[#071A3B] tracking-tight leading-tight">
                Featured Campaigns &amp; Offers
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Discover the latest robotics launches, exclusive hardware deals and special offers.
              </p>
            </div>

            {count > 1 && (
              <div className="flex items-center gap-2 self-start sm:self-end shrink-0">
                <span className="font-mono text-xs font-semibold text-[#475569] tabular-nums mr-1">
                  {String(activeIndex + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playStepTickSound(false);
                    advanceTo(activeIndex - 1, 'prev');
                  }}
                  aria-label="Previous campaign"
                  className="w-10 h-10 rounded-full bg-[#F3F7FC] hover:bg-[#087BFF] text-[#071A3B] hover:text-white border border-slate-200 hover:border-[#087BFF] active:scale-90 transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playStepTickSound(true);
                    advanceTo(activeIndex + 1, 'next');
                  }}
                  aria-label="Next campaign"
                  className="w-10 h-10 rounded-full bg-[#F3F7FC] hover:bg-[#087BFF] text-[#071A3B] hover:text-white border border-slate-200 hover:border-[#087BFF] active:scale-90 transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* 2 Balanced Campaign Cards Side by Side on Desktop/Tablet, 1 Full-Width on Mobile */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`grid grid-cols-1 ${
              count > 1 ? 'md:grid-cols-2' : 'max-w-3xl mx-auto'
            } gap-5 lg:gap-6`}
          >
            <CampaignCardSlot
              banners={activeBanners}
              currentIndex={leftCurr}
              prevIndex={leftPrev}
              direction={direction}
              cycleKey={cycleKey}
              onSelectCategory={onSelectCategory}
            />

            {count > 1 && (
              <CampaignCardSlot
                banners={activeBanners}
                currentIndex={rightCurr}
                prevIndex={rightPrev}
                direction={direction}
                cycleKey={cycleKey}
                onSelectCategory={onSelectCategory}
                className="hidden md:flex"
              />
            )}
          </div>

          {/* Modern Pagination Indicators */}
          {count > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2">
              {activeBanners.map((banner, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => {
                      playStepTickSound(idx > activeIndex);
                      advanceTo(idx, idx > activeIndex ? 'next' : 'prev');
                    }}
                    aria-label={`View campaign ${idx + 1}: ${banner.title}`}
                    aria-current={isActive ? 'true' : undefined}
                    className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] ${
                      isActive
                        ? 'w-8 bg-gradient-to-r from-[#087BFF] to-[#00CFFF]'
                        : 'w-2 bg-slate-300 hover:bg-[#087BFF]/55'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
};
