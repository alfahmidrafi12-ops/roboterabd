import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryId, CategoryItem } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';
import { Reveal } from './Reveal';

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
    <section id="categories" className="scroll-mt-20 py-7 sm:py-9 bg-[#F7F9FC] border-b border-slate-200/80">
      <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10">
        <Reveal>
          <div className="flex items-center justify-between gap-4 mb-4 sm:mb-5">
            <h2 className="font-display text-lg sm:text-2xl font-bold text-[#070D19] tracking-tight">
              Shop by Category
            </h2>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => onSelectCategory('all')}
                className="text-xs sm:text-sm font-semibold text-[#0057E7] hover:text-[#070D19] transition-colors whitespace-nowrap shrink-0 mr-1"
              >
                View All
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount('left')}
                aria-label="Scroll categories left"
                className="btn-liquid-glass w-8 h-8 rounded-xl flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount('right')}
                aria-label="Scroll categories right"
                className="btn-liquid-glass w-8 h-8 rounded-xl flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={trackRef}
            className="flex gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar scroll-smooth pb-1.5 pt-0.5"
          >
            {visibleCategories.map((category) => {
              const isSelected = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onSelectCategory(isSelected ? 'all' : category.id)}
                  className={`group shrink-0 w-[calc(44%-4px)] sm:w-[172px] rounded-2xl p-2.5 sm:p-3.5 text-center border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isSelected
                      ? 'btn-glossy-dark border-[#070D19] text-white'
                      : 'bg-white border-slate-200/90 hover:border-blue-300/90 hover:-translate-y-1.5 hover:shadow-[0_16px_30px_-16px_rgba(7,13,25,0.22)] text-slate-900'
                  }`}
                >
                  <div
                    className={`w-16 h-12 sm:w-20 sm:h-14 mx-auto rounded-xl flex items-center justify-center p-1 mb-2.5 overflow-hidden transition-transform duration-300 group-hover:scale-110 ${
                      isSelected ? 'bg-white/10 border border-white/15' : 'bg-[#F5F7FA] border border-slate-100'
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
                      isSelected ? 'text-blue-300' : 'text-slate-500'
                    }`}
                  >
                    {category.countLabel}
                  </p>
                </button>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
};
