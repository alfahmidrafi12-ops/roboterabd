import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { BannerItem, BannerTheme, CategoryId } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';

interface ScrollingBannerSectionProps {
  banners: BannerItem[];
  onSelectCategory: (categoryId: CategoryId) => void;
}

const THEME_STYLES: Record<
  BannerTheme,
  {
    card: string;
    kicker: string;
    title: string;
    subtitle: string;
    cta: string;
    artworkBox: string;
  }
> = {
  navy: {
    card: 'bg-[#06142E] text-white border-[#122952]',
    kicker: 'text-blue-300',
    title: 'text-white',
    subtitle: 'text-slate-300',
    cta: 'bg-[#0057E7] hover:bg-[#0044BB] text-white',
    artworkBox: 'bg-white/5 border-white/10',
  },
  cobalt: {
    card: 'bg-[#0057E7] text-white border-[#0044BB]',
    kicker: 'text-blue-100',
    title: 'text-white',
    subtitle: 'text-blue-50',
    cta: 'bg-[#06142E] hover:bg-slate-900 text-white',
    artworkBox: 'bg-white/10 border-white/15',
  },
  slate: {
    card: 'bg-[#F4F7FB] text-[#06142E] border-slate-200',
    kicker: 'text-[#0057E7]',
    title: 'text-[#06142E]',
    subtitle: 'text-slate-600',
    cta: 'bg-[#06142E] hover:bg-slate-800 text-white',
    artworkBox: 'bg-white border-slate-200',
  },
  emerald: {
    card: 'bg-[#082B27] text-white border-[#0E443D]',
    kicker: 'text-emerald-300',
    title: 'text-white',
    subtitle: 'text-emerald-100/80',
    cta: 'bg-white hover:bg-emerald-50 text-[#06142E]',
    artworkBox: 'bg-white/10 border-white/15',
  },
};

export const ScrollingBannerSection: React.FC<ScrollingBannerSectionProps> = ({
  banners,
  onSelectCategory,
}) => {
  const activeBanners = banners.filter((b) => b.active);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const count = activeBanners.length;

  useEffect(() => {
    if (activeIndex >= count && count > 0) {
      setActiveIndex(0);
    }
  }, [count, activeIndex]);

  useEffect(() => {
    if (count <= 1 || isPaused) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % count;
        if (trackRef.current) {
          const cardEl = trackRef.current.children[next] as HTMLElement | undefined;
          if (cardEl) {
            trackRef.current.scrollTo({
              left: cardEl.offsetLeft,
              behavior: 'smooth',
            });
          }
        }
        return next;
      });
    }, 4000);

    return () => window.clearInterval(timer);
  }, [count, isPaused]);

  if (count === 0) return null;

  const goToSlide = (idx: number) => {
    const normalized = ((idx % count) + count) % count;
    setActiveIndex(normalized);
    if (trackRef.current) {
      const cardEl = trackRef.current.children[normalized] as HTMLElement | undefined;
      if (cardEl) {
        trackRef.current.scrollTo({
          left: cardEl.offsetLeft,
          behavior: 'smooth',
        });
      }
    }
  };

  const handleTrackScroll = () => {
    const el = trackRef.current;
    if (!el || el.children.length === 0) return;
    const scrollLeft = el.scrollLeft;
    let closestIdx = 0;
    let closestDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement;
      const dist = Math.abs(child.offsetLeft - scrollLeft);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }
    if (closestIdx !== activeIndex) {
      setActiveIndex(closestIdx);
    }
  };

  return (
    <section
      aria-label="Promotional highlights"
      className="py-8 sm:py-10 bg-white border-b border-slate-200/70"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#06142E] tracking-tight">
              Featured Campaigns &amp; Offers
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              aria-label={isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => goToSlide(activeIndex - 1)}
              aria-label="Previous banner"
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => goToSlide(activeIndex + 1)}
              aria-label="Next banner"
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Smooth Auto-Scrolling Horizontal Banner Track */}
        <div
          ref={trackRef}
          onScroll={handleTrackScroll}
          className="relative flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1"
        >
          {activeBanners.map((banner) => {
            const style = THEME_STYLES[banner.theme] ?? THEME_STYLES.navy;
            return (
              <div
                key={banner.id}
                className={`snap-start shrink-0 w-full md:w-[calc(50%-10px)] rounded-2xl border p-4 sm:p-7 flex items-center justify-between gap-3 sm:gap-6 transition-transform duration-200 ${style.card}`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] sm:text-xs font-mono font-semibold mb-1 sm:mb-1.5 truncate ${style.kicker}`}>
                    {banner.kicker}
                  </p>
                  <h3 className={`font-display text-base sm:text-2xl font-bold leading-snug [text-wrap:balance] ${style.title}`}>
                    {banner.title}
                  </h3>
                  <p className={`text-xs sm:text-sm mt-1.5 sm:mt-2 leading-relaxed line-clamp-2 ${style.subtitle}`}>
                    {banner.subtitle}
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectCategory(banner.targetCategory)}
                    className={`mt-3 sm:mt-4 inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${style.cta}`}
                  >
                    <span>{banner.ctaLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div
                  className={`w-24 h-20 sm:w-36 sm:h-32 shrink-0 rounded-xl border p-1.5 sm:p-2 flex items-center justify-center overflow-hidden ${style.artworkBox}`}
                >
                  <HardwareArtwork
                    kind={banner.artwork}
                    imageUrl={banner.imageUrl}
                    alt={banner.title}
                    fit="cover"
                    className="w-full h-full"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Slide Indicators */}
        {count > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {activeBanners.map((banner, idx) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`Go to banner ${idx + 1}: ${banner.title}`}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  idx === activeIndex ? 'w-7 bg-[#0057E7]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
