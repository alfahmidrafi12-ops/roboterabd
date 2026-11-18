import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryId, CategoryItem } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';

interface CategoryCarouselProps {
  categories: CategoryItem[];
  activeCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
}

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const visibleCategories = categories.filter((c) => c.active !== false);

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;
    const distance = direction === 'left' ? -320 : 320;
    trackRef.current.scrollBy({ left: distance, behavior: 'smooth' });
  };

  return (
    <section id="categories" className="scroll-mt-20 py-6 sm:py-8 bg-white border-b border-slate-200/60">
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-4 sm:mb-5">
          <div>
            <h2 className="font-display text-lg sm:text-2xl font-bold text-[#06142E] tracking-tight">
              Shop by Category
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className="text-xs sm:text-sm font-semibold text-[#0057E7] hover:text-[#0044BB] transition-colors whitespace-nowrap shrink-0 mr-1"
            >
              View All
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount('left')}
              aria-label="Scroll categories left"
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount('right')}
              aria-label="Scroll categories right"
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="flex gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar scroll-smooth pb-1"
        >
          {visibleCategories.map((category) => {
            const isSelected = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(isSelected ? 'all' : category.id)}
                className={`group shrink-0 w-[calc(44%-4px)] sm:w-[162px] rounded-xl p-2.5 sm:p-3 text-center border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isSelected
                    ? 'bg-[#06142E] border-[#06142E] text-white shadow-xs'
                    : 'bg-[#F7F9FC] border-slate-200/85 hover:border-blue-300/80 hover:bg-white hover:shadow-xs text-slate-900'
                }`}
              >
                <div
                  className={`w-16 h-12 sm:w-20 sm:h-14 mx-auto rounded-lg flex items-center justify-center p-1 mb-2 overflow-hidden transition-transform duration-200 group-hover:-translate-y-0.5 ${
                    isSelected ? 'bg-white/10 border border-white/10' : 'bg-white border border-slate-200/60'
                  }`}
                >
                  <HardwareArtwork
                    kind={category.artwork}
                    imageUrl={category.imageUrl}
                    alt={category.name}
                    fit="contain"
                    className="w-full h-full"
                  />
                </div>
                <h3 className="font-display text-xs sm:text-[13px] font-semibold leading-snug line-clamp-1">
                  {category.name}
                </h3>
                <p
                  className={`text-[10px] sm:text-[11px] mt-0.5 font-mono tabular-nums ${
                    isSelected ? 'text-blue-200' : 'text-slate-500'
                  }`}
                >
                  {category.countLabel}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
