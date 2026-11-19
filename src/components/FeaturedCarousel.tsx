import React, { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types/store';
import { ProductCard } from './ProductCard';
import { Reveal } from './Reveal';

interface FeaturedCarouselProps {
  products: Product[];
  allProducts?: Product[];
  categoryLabels?: Record<string, string>;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenDetail: (product: Product) => void;
}

type SpotlightTab = 'new' | 'trending' | 'makers';

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
  products,
  allProducts = [],
  categoryLabels,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onOpenDetail,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<SpotlightTab>('new');

  const sourcePool = allProducts.length > 0 ? allProducts : products;

  const displayedList = useMemo(() => {
    if (activeTab === 'new') {
      return products;
    }
    if (activeTab === 'trending') {
      return [...sourcePool].sort((a, b) => b.reviews - a.reviews).slice(0, 8);
    }
    return [...sourcePool].sort((a, b) => b.rating - a.rating).slice(0, 8);
  }, [activeTab, products, sourcePool]);

  if (products.length === 0 && sourcePool.length === 0) return null;

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  return (
    <section id="just-arrived" className="scroll-mt-20 py-10 sm:py-14 bg-[#F1F5F9]">
      <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-7">
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#EA580C] mb-1 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" aria-hidden="true" />
                <span>Curated Hardware Spotlights</span>
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#071A3B] tracking-tight">
                {activeTab === 'new'
                  ? 'New Arrivals'
                  : activeTab === 'trending'
                  ? 'Trending Components'
                  : 'Recommended for Makers'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
              <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200/90">
                {(
                  [
                    { id: 'new', label: 'New Arrivals' },
                    { id: 'trending', label: 'Trending' },
                    { id: 'makers', label: 'For Makers' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-[#0866F5] text-white'
                        : 'text-[#64748B] hover:text-[#101828] hover:bg-[#0866F5]/[0.05]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollByAmount('left')}
                  aria-label="Scroll products left"
                  className="w-9 h-9 rounded-xl bg-white hover:bg-[#0866F5]/[0.05] text-[#101828] border border-slate-200 hover:border-[#0866F5]/45 transition-colors flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollByAmount('right')}
                  aria-label="Scroll products right"
                  className="w-9 h-9 rounded-xl bg-white hover:bg-[#0866F5]/[0.05] text-[#101828] border border-slate-200 hover:border-[#0866F5]/45 transition-colors flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={trackRef}
            className="flex gap-3.5 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1"
          >
            {displayedList.map((product, idx) => (
              <div
                key={`${activeTab}-${product.id}`}
                className="shrink-0 w-[72%] min-w-[215px] max-w-[260px] sm:w-[254px] sm:max-w-none lg:w-[276px]"
              >
                <Reveal delayMs={Math.min(idx * 45, 200)} className="h-full">
                  <ProductCard
                    product={product}
                    categoryDisplayName={categoryLabels?.[product.category]}
                    isWishlisted={wishlistIds.includes(product.id)}
                    onToggleWishlist={onToggleWishlist}
                    onAddToCart={onAddToCart}
                    onOpenDetail={onOpenDetail}
                  />
                </Reveal>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};
