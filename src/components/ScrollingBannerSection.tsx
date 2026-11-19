import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
    card: string;
    gridClass: string;
    kicker: string;
    title: string;
    subtitle: string;
    cta: string;
    artworkBox: string;
  }
> = {
  navy: {
    card: 'bg-[#071A3B] bg-gradient-to-br from-[#071A3B] via-[#0B234D] to-[#11336E] text-white border-[#1B3B73]',
    gridClass: 'bg-lab-grid-dark',
    kicker: 'text-[#38BDF8]',
    title: 'text-white',
    subtitle: 'text-slate-300',
    cta: 'bg-[#0866F5] hover:bg-[#0866F5]/90 border border-[#1685FF]/40 hover:border-white/50 text-white',
    artworkBox: 'bg-white/[0.08] border-white/15',
  },
  cobalt: {
    card: 'bg-[#0866F5] bg-gradient-to-br from-[#0654CC] via-[#0866F5] to-[#1685FF] text-white border-[#0654CC]',
    gridClass: 'bg-lab-grid-dark',
    kicker: 'text-cyan-200',
    title: 'text-white',
    subtitle: 'text-blue-50/90',
    cta: 'bg-white hover:bg-white/90 border border-white/60 hover:border-white text-[#071A3B]',
    artworkBox: 'bg-white/10 border-white/20',
  },
  slate: {
    card: 'bg-[#F5F8FC] bg-gradient-to-br from-[#F5F8FC] to-[#EAF1FA] text-[#071A3B] border-slate-200/90',
    gridClass: 'bg-lab-grid',
    kicker: 'text-[#0891B2]',
    title: 'text-[#071A3B]',
    subtitle: 'text-[#64748B]',
    cta: 'bg-[#071A3B] hover:bg-[#071A3B]/90 border border-[#071A3B] hover:border-[#0866F5]/60 text-white',
    artworkBox: 'bg-white border-slate-200/90',
  },
  emerald: {
    card: 'bg-[#052E2B] bg-gradient-to-br from-[#052E2B] via-[#064E3B] to-[#065F46] text-white border-emerald-700/60',
    gridClass: 'bg-lab-grid-dark',
    kicker: 'text-emerald-300',
    title: 'text-white',
    subtitle: 'text-emerald-100/90',
    cta: 'bg-white hover:bg-white/90 border border-white/60 hover:border-emerald-200 text-[#052E2B]',
    artworkBox: 'bg-white/10 border-emerald-300/20',
  },
};

export const ScrollingBannerSection: React.FC<ScrollingBannerSectionProps> = ({
  banners,
  onSelectCategory,
}) => {
  const activeBanners = banners.filter((b) => b.active);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const count = activeBanners.length;

  useEffect(() => {
    if (activeIndex >= count && count > 0) {
      activeIndexRef.current = 0;
      setActiveIndex(0);
    }
  }, [count, activeIndex]);

  const goToSlide = (idx: number) => {
    if (count === 0) return;
    const normalized = ((idx % count) + count) % count;
    activeIndexRef.current = normalized;
    setActiveIndex(normalized);
    const el = trackRef.current;
    if (el) {
      const cardEl = el.children[normalized] as HTMLElement | undefined;
      if (cardEl) {
        const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
        const targetLeft = Math.min(cardEl.offsetLeft, maxScroll);
        el.scrollTo({
          left: targetLeft,
          behavior: 'smooth',
        });
      }
    }
  };

  useEffect(() => {
    if (count <= 1) return;

    const timer = window.setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      let next = (activeIndexRef.current + 1) % count;
      if (maxScroll > 0) {
        const nextCard = el.children[next] as HTMLElement | undefined;
        if (nextCard && el.scrollLeft >= maxScroll - 4 && nextCard.offsetLeft >= maxScroll - 4) {
          next = 0;
        }
      }
      goToSlide(next);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

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
    if (closestIdx !== activeIndexRef.current) {
      activeIndexRef.current = closestIdx;
      setActiveIndex(closestIdx);
    }
  };

  return (
    <section
      aria-label="Featured campaigns"
      className="py-7 sm:py-9 bg-white"
    >
      <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10">
        <Reveal>
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#0891B2] mb-1">
                Engineering Campaigns
              </p>
              <h2 className="font-display text-lg sm:text-2xl font-bold text-[#071A3B] tracking-tight">
                Featured Campaigns &amp; Offers
              </h2>
            </div>

            {count > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => goToSlide(activeIndex - 1)}
                  aria-label="Previous campaign"
                  className="w-8 h-8 rounded-xl bg-white hover:bg-[#F5F8FC] text-[#101828] border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => goToSlide(activeIndex + 1)}
                  aria-label="Next campaign"
                  className="w-8 h-8 rounded-xl bg-white hover:bg-[#F5F8FC] text-[#101828] border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Continuous Auto-Scrolling Campaign Track (No Pause/Start buttons) */}
          <div
            ref={trackRef}
            onScroll={handleTrackScroll}
            className="relative flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1"
          >
            {activeBanners.map((banner) => {
              const style = THEME_STYLES[banner.theme] ?? THEME_STYLES.navy;
              const customImg = banner.imageUrl?.trim();
              const widthClass = count === 1 ? 'w-full' : 'w-full md:w-[calc(50%-10px)]';

              if (customImg) {
                return (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => onSelectCategory(banner.targetCategory)}
                    aria-label={banner.title || 'View featured campaign'}
                    className={`group snap-start shrink-0 ${widthClass} rounded-2xl border border-slate-200/90 bg-[#F5F8FC] hover:bg-[#0866F5]/[0.03] overflow-hidden flex items-center justify-center hover:border-[#0866F5]/65 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866F5]`}
                  >
                    <img
                      src={customImg}
                      alt={banner.title || 'Promotional campaign'}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto max-h-[210px] sm:max-h-[280px] lg:max-h-[340px] object-contain block"
                    />
                  </button>
                );
              }

              return (
                <div
                  key={banner.id}
                  className={`group relative overflow-hidden snap-start shrink-0 ${widthClass} rounded-2xl border p-4 sm:p-7 flex items-center justify-between gap-3.5 sm:gap-6 transition-colors duration-200 ${style.card}`}
                >
                  <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${style.gridClass}`} />
                  <div className="relative z-10 min-w-0 flex-1">
                    <p className={`text-[11px] sm:text-xs font-mono font-semibold mb-1 sm:mb-1.5 truncate ${style.kicker}`}>
                      {banner.kicker}
                    </p>
                    <h3 className={`font-display text-base sm:text-[21px] font-bold leading-snug [text-wrap:balance] ${style.title}`}>
                      {banner.title}
                    </h3>
                    <p className={`text-xs sm:text-sm mt-1.5 sm:mt-2 leading-relaxed line-clamp-2 ${style.subtitle}`}>
                      {banner.subtitle}
                    </p>
                    <button
                      type="button"
                      onClick={() => onSelectCategory(banner.targetCategory)}
                      className={`mt-4 inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${style.cta}`}
                    >
                      <span>{banner.ctaLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </div>

                  <div
                    className={`relative z-10 w-20 h-20 sm:w-32 sm:h-28 shrink-0 rounded-xl border p-2 flex items-center justify-center overflow-hidden ${style.artworkBox}`}
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
                  aria-label={`Go to campaign ${idx + 1}: ${banner.title}`}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    idx === activeIndex ? 'w-7 bg-[#0866F5]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
};
