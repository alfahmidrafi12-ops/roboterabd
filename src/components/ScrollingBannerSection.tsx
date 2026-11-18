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
    card: 'bg-[#070D19] bg-gradient-to-br from-[#070D19] via-[#0B1730] to-[#112650] text-white border-[#183164]',
    gridClass: 'bg-lab-grid-dark',
    kicker: 'text-blue-300',
    title: 'text-white',
    subtitle: 'text-slate-300',
    cta: 'btn-glossy-blue',
    artworkBox: 'bg-white/[0.06] border-white/10 backdrop-blur-xs',
  },
  cobalt: {
    card: 'bg-[#0048C4] bg-gradient-to-br from-[#0048C4] via-[#0057E7] to-[#1A73FF] text-white border-[#0044BB]',
    gridClass: 'bg-lab-grid-dark',
    kicker: 'text-blue-100',
    title: 'text-white',
    subtitle: 'text-blue-50/90',
    cta: 'btn-liquid-glass-dark',
    artworkBox: 'bg-white/10 border-white/15 backdrop-blur-xs',
  },
  slate: {
    card: 'bg-[#F4F7FB] bg-gradient-to-br from-[#F4F7FB] to-[#EBF0F7] text-[#070D19] border-slate-200/90',
    gridClass: 'bg-lab-grid',
    kicker: 'text-[#0057E7]',
    title: 'text-[#070D19]',
    subtitle: 'text-slate-600',
    cta: 'btn-glossy-dark',
    artworkBox: 'bg-white border-slate-200/90 shadow-2xs',
  },
  emerald: {
    card: 'bg-[#06211E] bg-gradient-to-br from-[#06211E] via-[#082B27] to-[#0E3F39] text-white border-[#134F47]',
    gridClass: 'bg-lab-grid-dark',
    kicker: 'text-emerald-300',
    title: 'text-white',
    subtitle: 'text-emerald-100/85',
    cta: 'btn-liquid-glass-dark',
    artworkBox: 'bg-white/10 border-white/15 backdrop-blur-xs',
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
    }, 4000);

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
      aria-label="Promotional highlights"
      className="py-6 sm:py-8 bg-white border-b border-slate-200/70"
    >
      <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10">
        <Reveal>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#070D19] tracking-tight">
              Featured Campaigns &amp; Offers
            </h2>

            {count > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => goToSlide(activeIndex - 1)}
                  aria-label="Previous banner"
                  className="btn-liquid-glass w-8 h-8 rounded-xl flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => goToSlide(activeIndex + 1)}
                  aria-label="Next banner"
                  className="btn-liquid-glass w-8 h-8 rounded-xl flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Smooth Continuous Auto-Scrolling Banner Track */}
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
                    className={`group snap-start shrink-0 ${widthClass} rounded-2xl border border-slate-200/90 bg-[#F8FAFD] overflow-hidden flex items-center justify-center hover:border-[#0057E7] hover:shadow-[0_14px_30px_-14px_rgba(7,13,25,0.2)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600`}
                  >
                    <img
                      src={customImg}
                      alt={banner.title || 'Promotional banner'}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto max-h-[420px] object-contain block transition-transform duration-300 group-hover:scale-[1.015]"
                    />
                  </button>
                );
              }

              return (
                <div
                  key={banner.id}
                  className={`group relative overflow-hidden snap-start shrink-0 ${widthClass} rounded-2xl border p-5 sm:p-7 flex items-center justify-between gap-4 sm:gap-6 shadow-[0_12px_30px_-18px_rgba(7,13,25,0.25)] hover:-translate-y-0.5 transition-all duration-200 ${style.card}`}
                >
                  <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${style.gridClass}`} />
                  <div className="relative z-10 min-w-0 flex-1">
                    <p className={`text-[11px] sm:text-xs font-mono font-semibold mb-1 sm:mb-1.5 truncate ${style.kicker}`}>
                      {banner.kicker}
                    </p>
                    <h3 className={`font-display text-base sm:text-[22px] font-bold leading-snug [text-wrap:balance] ${style.title}`}>
                      {banner.title}
                    </h3>
                    <p className={`text-xs sm:text-sm mt-1.5 sm:mt-2 leading-relaxed line-clamp-2 ${style.subtitle}`}>
                      {banner.subtitle}
                    </p>
                    <button
                      type="button"
                      onClick={() => onSelectCategory(banner.targetCategory)}
                      className={`mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${style.cta}`}
                    >
                      <span>{banner.ctaLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </div>

                  <div
                    className={`relative z-10 w-24 h-20 sm:w-36 sm:h-32 shrink-0 rounded-xl border p-1.5 sm:p-2 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105 ${style.artworkBox}`}
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
                  aria-label={`Go to banner ${idx + 1}: ${banner.title}`}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    idx === activeIndex ? 'w-7 bg-[#0057E7]' : 'w-2 bg-slate-300 hover:bg-slate-400'
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
