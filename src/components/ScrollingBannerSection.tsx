import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Monitor } from 'lucide-react';
import { BannerItem, BannerTheme, CategoryId } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';
import { Reveal } from './Reveal';

interface ScrollingBannerSectionProps {
  banners: BannerItem[];
  onSelectCategory: (categoryId: CategoryId) => void;
}

const THEME_STYLES: Record<
  BannerTheme,
  {
    canvas: string;
    gridClass: string;
    kicker: string;
    title: string;
    subtitle: string;
    cta: string;
    artworkBox: string;
  }
> = {
  navy: {
    canvas: 'bg-gradient-to-br from-[#06142E] via-[#071A3B] to-[#0C2B5E] text-white',
    gridClass: 'bg-lab-grid-dark',
    kicker: 'text-[#2DD4BF]',
    title: 'text-white',
    subtitle: 'text-slate-300',
    cta: 'bg-[#0866F5] hover:bg-[#1685FF] border border-[#1685FF]/50 text-white',
    artworkBox: 'bg-white/[0.06] border-white/15',
  },
  cobalt: {
    canvas: 'bg-gradient-to-br from-[#0654CC] via-[#0866F5] to-[#1685FF] text-white',
    gridClass: 'bg-lab-grid-dark',
    kicker: 'text-blue-100',
    title: 'text-white',
    subtitle: 'text-blue-50/90',
    cta: 'bg-white hover:bg-white/90 border border-white/60 text-[#071A3B]',
    artworkBox: 'bg-white/10 border-white/20',
  },
  slate: {
    canvas: 'bg-gradient-to-br from-[#E6ECF4] via-[#EDF2F8] to-[#FFFFFF] text-[#071A3B]',
    gridClass: 'bg-lab-grid',
    kicker: 'text-[#C2410C]',
    title: 'text-[#071A3B]',
    subtitle: 'text-[#334155]',
    cta: 'bg-[#071A3B] hover:bg-[#0866F5] border border-[#071A3B] text-white',
    artworkBox: 'bg-white border-slate-300/85',
  },
  emerald: {
    canvas: 'bg-gradient-to-br from-[#052624] via-[#062E2B] to-[#0B4F4A] text-white',
    gridClass: 'bg-lab-grid-dark',
    kicker: 'text-[#2DD4BF]',
    title: 'text-white',
    subtitle: 'text-teal-100/85',
    cta: 'bg-white hover:bg-white/90 border border-white/60 text-[#062E2B]',
    artworkBox: 'bg-white/[0.08] border-teal-400/20',
  },
};

const AUTO_INTERVAL_MS = 4500;

interface BannerSlideContentProps {
  banner: BannerItem;
  onSelectCategory: (categoryId: CategoryId) => void;
}

const BannerSlideContent: React.FC<BannerSlideContentProps> = ({ banner, onSelectCategory }) => {
  const style = THEME_STYLES[banner.theme] ?? THEME_STYLES.navy;
  const customImg = banner.imageUrl?.trim();

  if (customImg) {
    return (
      <button
        type="button"
        onClick={() => onSelectCategory(banner.targetCategory)}
        aria-label={banner.title || 'View featured campaign'}
        className="w-full h-full bg-[#F8FAFC] flex items-center justify-center overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0866F5]"
      >
        <img
          src={customImg}
          alt={banner.title || 'Promotional campaign'}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain block"
        />
      </button>
    );
  }

  return (
    <div
      onClick={() => onSelectCategory(banner.targetCategory)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectCategory(banner.targetCategory);
        }
      }}
      aria-label={banner.title}
      className={`w-full h-full p-4 sm:p-6 lg:p-7 flex items-center justify-between gap-3 sm:gap-5 cursor-pointer overflow-hidden ${style.canvas}`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 opacity-75 ${style.gridClass}`}
      />

      <div className="relative z-10 min-w-0 flex-1 flex flex-col justify-center">
        <p
          className={`text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider mb-1 truncate ${style.kicker}`}
        >
          {banner.kicker}
        </p>
        <h3
          className={`font-display text-base sm:text-xl lg:text-[22px] font-bold leading-snug line-clamp-2 [text-wrap:balance] ${style.title}`}
        >
          {banner.title}
        </h3>
        <p
          className={`text-[11px] sm:text-xs lg:text-sm mt-1.5 leading-relaxed line-clamp-2 ${style.subtitle}`}
        >
          {banner.subtitle}
        </p>
        <div className="mt-3 sm:mt-4">
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap ${style.cta}`}
          >
            <span>{banner.ctaLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>

      <div
        className={`relative z-10 w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 shrink-0 rounded-xl border p-2.5 flex items-center justify-center overflow-hidden ${style.artworkBox}`}
      >
        <div className="w-full h-full transition-transform duration-300 ease-out group-hover:scale-[1.06]">
          <HardwareArtwork
            kind={banner.artwork}
            imageUrl={banner.imageUrl}
            alt={banner.title}
            fit="contain"
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};

interface ScreenViewportProps {
  screenLabel: string;
  accentColor: string;
  banners: BannerItem[];
  currentIndex: number;
  prevIndex: number | null;
  direction: 'next' | 'prev';
  cycleKey: number;
  onSelectCategory: (categoryId: CategoryId) => void;
  className?: string;
}

const ScreenViewport: React.FC<ScreenViewportProps> = ({
  screenLabel,
  accentColor,
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

  const enterAnim =
    outgoingBanner !== null
      ? direction === 'next'
        ? 'animate-banner-in-right'
        : 'animate-banner-in-left'
      : '';
  const exitAnim = direction === 'next' ? 'animate-banner-out-left' : 'animate-banner-out-right';

  return (
    <div
      className={`group rounded-2xl bg-[#071A3B] border border-slate-400/35 hover:border-[#0866F5] p-2 sm:p-2.5 transition-colors flex flex-col shadow-sm ${className}`}
    >
      {/* Sleek Screen Header Bezel */}
      <div className="px-2.5 pb-2 pt-0.5 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-300">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: accentColor }}
            aria-hidden="true"
          />
          <span className="font-bold tracking-[0.14em] uppercase text-white shrink-0">
            {screenLabel}
          </span>
          {activeBanner?.kicker && (
            <>
              <span aria-hidden="true" className="text-white/25 hidden sm:inline">
                //
              </span>
              <span className="truncate text-slate-300 hidden sm:inline">
                {activeBanner.kicker}
              </span>
            </>
          )}
        </div>

        <span className="px-2 py-0.5 rounded-md bg-white/[0.08] border border-white/10 tabular-nums text-slate-200 font-semibold shrink-0">
          {String(safeCurrent + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
        </span>
      </div>

      {/* Main 16:9 Uncropped Showcase Display Screen */}
      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#06132B] border border-white/15">
        {/* Subtle Optical Scan Trace on Screen Top Edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px z-30 overflow-hidden"
        >
          <div className="animate-trace-sweep w-36 h-full bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent" />
        </div>

        {/* Outgoing Banner Layer (strictly slides out in uniform direction) */}
        {outgoingBanner && (
          <div
            key={`out-${cycleKey}-${outgoingBanner.id}`}
            className={`absolute inset-0 z-10 pointer-events-none ${exitAnim}`}
          >
            <BannerSlideContent banner={outgoingBanner} onSelectCategory={onSelectCategory} />
          </div>
        )}

        {/* Active Incoming Banner Layer (strictly slides in from the right on auto/next) */}
        {activeBanner && (
          <div key={`in-${cycleKey}-${activeBanner.id}`} className={`absolute inset-0 z-20 ${enterAnim}`}>
            <BannerSlideContent banner={activeBanner} onSelectCategory={onSelectCategory} />
          </div>
        )}
      </div>

      {/* Sleek Bottom Dwell Progress Rail + Action Caption */}
      <div className="mt-2 px-1.5 space-y-2">
        {count > 1 && (
          <div className="h-[2px] w-full rounded-full bg-white/10 overflow-hidden">
            <div
              key={`prog-${cycleKey}`}
              className="animate-banner-progress h-full w-full rounded-full"
              style={{ backgroundColor: accentColor }}
            />
          </div>
        )}

        <div className="px-1 flex items-center justify-between gap-2 text-[11px]">
          <span className="font-display font-semibold text-slate-200 truncate">
            {activeBanner?.title}
          </span>
          <button
            type="button"
            onClick={() => activeBanner && onSelectCategory(activeBanner.targetCategory)}
            className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] hover:text-white inline-flex items-center gap-1 shrink-0 transition-colors"
          >
            <span>Explore</span>
            <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
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

  // Continuous non-stop auto-scroll — strictly one direction (right -> left)
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

  // Left Screen displays activeIndex; Right Screen displays (activeIndex + 1) % count
  const leftCurr = activeIndex;
  const leftPrev = prevIndex;
  const rightCurr = count > 1 ? (activeIndex + 1) % count : 0;
  const rightPrev = prevIndex !== null && count > 1 ? (prevIndex + 1) % count : null;

  return (
    <section
      id="campaigns"
      aria-label="Featured campaigns"
      className="scroll-mt-20 bg-white min-[1500px]:bg-transparent min-[1500px]:pointer-events-none"
    >
      <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-white min-[1500px]:border-x min-[1500px]:border-slate-300/90 px-4 sm:px-6 lg:px-10 py-9 sm:py-12">
        <Reveal>
          {/* Architectural Showcase Wall Container */}
          <div className="rounded-2xl bg-[#EDF2F8] border border-slate-300/85 p-4 sm:p-6 lg:p-7 space-y-5">
            {/* Header Row */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-[#0F766E] mb-1 inline-flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Dual-Screen Campaign Wall</span>
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#071A3B] tracking-tight">
                  Featured Campaigns &amp; Offers
                </h2>
              </div>

              {count > 1 && (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex font-mono text-[11px] font-semibold text-[#475569] mr-1">
                    {String(activeIndex + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() => advanceTo(activeIndex - 1, 'prev')}
                    aria-label="Previous campaign"
                    className="w-9 h-9 rounded-xl bg-white hover:bg-[#071A3B] text-[#071A3B] hover:text-white border border-slate-300 hover:border-[#071A3B] transition-colors flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => advanceTo(activeIndex + 1, 'next')}
                    aria-label="Next campaign"
                    className="w-9 h-9 rounded-xl bg-white hover:bg-[#071A3B] text-[#071A3B] hover:text-white border border-slate-300 hover:border-[#071A3B] transition-colors flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* 2 Fixed Main Display Screen Boxes on PC (md:grid-cols-2), 1 Main Screen on Mobile */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5"
            >
              <ScreenViewport
                screenLabel="Screen 01"
                accentColor="#38BDF8"
                banners={activeBanners}
                currentIndex={leftCurr}
                prevIndex={leftPrev}
                direction={direction}
                cycleKey={cycleKey}
                onSelectCategory={onSelectCategory}
              />

              <ScreenViewport
                screenLabel="Screen 02"
                accentColor="#2DD4BF"
                banners={activeBanners}
                currentIndex={rightCurr}
                prevIndex={rightPrev}
                direction={direction}
                cycleKey={cycleKey}
                onSelectCategory={onSelectCategory}
                className="hidden md:flex"
              />
            </div>

            {/* Bottom Slide Dots */}
            {count > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-0.5">
                {activeBanners.map((banner, idx) => (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => advanceTo(idx, 'next')}
                    aria-label={`Show banner ${idx + 1}: ${banner.title}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeIndex ? 'w-8 bg-[#0866F5]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
};
