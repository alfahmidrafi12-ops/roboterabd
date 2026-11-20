import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { CategoryId, CategoryItem } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';
import { Reveal } from './Reveal';

interface CategoryCarouselProps {
  categories: CategoryItem[];
  activeCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
}

const MOBILE_INITIAL_COUNT = 4;
const DESKTOP_INITIAL_COUNT = 6;

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
}) => {
  const visibleCategories = categories.filter((c) => c.active !== false);
  const [showAll, setShowAll] = useState(false);

  const mobileRemaining = Math.max(0, visibleCategories.length - MOBILE_INITIAL_COUNT);
  const desktopRemaining = Math.max(0, visibleCategories.length - DESKTOP_INITIAL_COUNT);

  useEffect(() => {
    if (
      activeCategory !== 'all' &&
      visibleCategories.slice(MOBILE_INITIAL_COUNT).some((c) => c.id === activeCategory)
    ) {
      setShowAll(true);
    }
  }, [activeCategory, visibleCategories]);

  return (
    <section id="categories" className="scroll-mt-20 bg-[#E6ECF4] min-[1500px]:bg-transparent min-[1500px]:pointer-events-none">
      <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-[#E6ECF4] min-[1500px]:border-x min-[1500px]:border-slate-300/90 px-4 sm:px-6 lg:px-10 py-9 sm:py-12">
        <Reveal>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-[#0F766E] mb-1">
                Hardware Departments
              </p>
              <h2 className="font-display text-xl sm:text-2xl lg:text-[28px] font-bold text-[#071A3B] tracking-tight">
                Shop by Category
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300/80 hover:border-[#0866F5]/60 bg-white/80 hover:bg-white text-xs sm:text-sm font-semibold text-[#0866F5] hover:text-[#071A3B] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Shop All Hardware</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#EA580C]" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {visibleCategories.map((category, idx) => {
              const isSelected = activeCategory === category.id;
              const hasUploadedImage = Boolean(category.imageUrl?.trim());

              // Mobile/tablet (<lg): 4 cards initially (2x2); Desktop (lg+): 6 cards in 1 row initially
              let visibilityClass = 'flex';
              if (!showAll) {
                if (idx >= DESKTOP_INITIAL_COUNT) {
                  visibilityClass = 'hidden';
                } else if (idx >= MOBILE_INITIAL_COUNT) {
                  visibilityClass = 'hidden lg:flex';
                }
              }

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onSelectCategory(isSelected ? 'all' : category.id)}
                  style={{ animationDelay: `${Math.min(idx * 40, 220)}ms` }}
                  className={`animate-cart-enter group w-full rounded-2xl p-2.5 sm:p-3 text-center border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866F5] flex-col items-stretch ${visibilityClass} ${
                    isSelected
                      ? 'bg-[#071A3B] border-[#071A3B] text-white'
                      : 'bg-white border-slate-300/85 hover:border-[#0866F5] hover:bg-white text-[#0F172A]'
                  }`}
                >
                  {/* Dedicated Uncropped 4:3 Image Frame */}
                  <div
                    className={`w-full aspect-[4/3] rounded-xl border flex items-center justify-center overflow-hidden transition-colors ${
                      hasUploadedImage ? 'p-1.5 bg-white' : 'p-2.5 sm:p-3'
                    } ${
                      isSelected
                        ? 'bg-white/10 border-white/20'
                        : hasUploadedImage
                        ? 'border-slate-300/80 group-hover:border-[#0866F5]/55'
                        : 'bg-[#EDF2F8] border-slate-300/75 group-hover:border-[#0866F5]/50'
                    }`}
                  >
                    <div className="w-full h-full transition-transform duration-300 ease-out group-hover:scale-[1.06]">
                      <HardwareArtwork
                        kind={category.artwork}
                        imageUrl={category.imageUrl}
                        alt={category.name}
                        fit="contain"
                        className="w-full h-full"
                      />
                    </div>
                  </div>

                  {/* Category Name & Item Count Below Frame */}
                  <div className="pt-2.5 px-1 pb-0.5 flex flex-col items-center flex-1 justify-between">
                    <h3 className="font-display text-xs sm:text-[13px] font-bold leading-snug line-clamp-2 min-h-[2.1rem] flex items-center justify-center">
                      {category.name}
                    </h3>
                    <p
                      className={`text-[11px] mt-1 font-mono font-semibold tabular-nums transition-colors ${
                        isSelected ? 'text-[#2DD4BF]' : 'text-[#475569] group-hover:text-[#0866F5]'
                      }`}
                    >
                      {category.countLabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {(mobileRemaining > 0 || desktopRemaining > 0) && (
            <div
              className={`mt-6 justify-center ${
                desktopRemaining > 0 ? 'flex' : 'flex lg:hidden'
              }`}
            >
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                aria-expanded={showAll}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#071A3B] border border-slate-300 hover:border-[#071A3B] text-xs sm:text-sm font-semibold text-[#071A3B] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866F5]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" aria-hidden="true" />
                {showAll ? (
                  <span>Show Less Categories</span>
                ) : (
                  <>
                    <span className="lg:hidden">See All Categories (+{mobileRemaining})</span>
                    {desktopRemaining > 0 && (
                      <span className="hidden lg:inline">
                        See All Categories (+{desktopRemaining})
                      </span>
                    )}
                  </>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-[#0866F5] transition-transform duration-200 ${
                    showAll ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
};
