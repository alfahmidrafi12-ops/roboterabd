import React, { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AddToCartResult, Product } from '../types/store';
import { ProductCard } from './ProductCard';
import { Reveal } from './Reveal';

interface FeaturedCarouselProps {
  products: Product[];
  allProducts?: Product[];
  categoryLabels?: Record<string, string>;
  wishlistIds: string[];
  restockWatchedIds?: string[];
  compareIds?: string[];
  cartQtyByProductId?: Record<string, number>;
  onToggleWishlist: (productId: string) => void;
  onToggleCompare?: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number) => AddToCartResult | void;
  onOpenDetail: (product: Product) => void;
  onRequestRestockAlert?: (product: Product) => void;
}

type SpotlightTab = 'new' | 'trending' | 'makers';

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
  products,
  allProducts = [],
  categoryLabels,
  wishlistIds,
  restockWatchedIds = [],
  compareIds = [],
  cartQtyByProductId = {},
  onToggleWishlist,
  onToggleCompare,
  onAddToCart,
  onOpenDetail,
  onRequestRestockAlert,
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
    <section id="just-arrived" className="cv-section scroll-mt-[108px] bg-white min-[1500px]:bg-transparent min-[1500px]:pointer-events-none">
      <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-white min-[1500px]:border-x min-[1500px]:border-slate-200/90 px-4 sm:px-6 lg:px-10 py-11 sm:py-14">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7 sm:mb-8">
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[#087BFF] mb-1.5">
                Curated Hardware Spotlights
              </p>
              <h2 className="font-hero text-2xl sm:text-3xl font-extrabold text-[#071A3D] tracking-tight">
                {activeTab === 'new'
                  ? 'New Arrivals'
                  : activeTab === 'trending'
                  ? 'Trending Components'
                  : 'Recommended for Makers'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
              <div className="inline-flex p-1 rounded-xl bg-[#F3F7FC] border border-slate-200/90">
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
                    className={`motion-press px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-white text-[#071A3D] shadow-[0_2px_8px_rgba(7,26,61,0.08)]'
                        : 'text-[#475569] hover:text-[#071A3D]'
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
                  className="motion-press w-9 h-9 rounded-full bg-[#F3F7FC] hover:bg-[#071A3D] text-[#071A3D] hover:text-white border border-slate-200/90 hover:border-[#071A3D] transition-colors flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollByAmount('right')}
                  aria-label="Scroll products right"
                  className="motion-press w-9 h-9 rounded-full bg-[#F3F7FC] hover:bg-[#071A3D] text-[#071A3D] hover:text-white border border-slate-200/90 hover:border-[#071A3D] transition-colors flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div
            key={activeTab}
            ref={trackRef}
            className="animate-tab-enter flex gap-3.5 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1"
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
                    isRestockWatched={restockWatchedIds.includes(product.id)}
                    isCompared={compareIds.includes(product.id)}
                    compareLimitReached={compareIds.length >= 3}
                    inCartQty={cartQtyByProductId[product.id] ?? 0}
                    onToggleWishlist={onToggleWishlist}
                    onToggleCompare={onToggleCompare}
                    onAddToCart={onAddToCart}
                    onOpenDetail={onOpenDetail}
                    onRequestRestockAlert={onRequestRestockAlert}
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
