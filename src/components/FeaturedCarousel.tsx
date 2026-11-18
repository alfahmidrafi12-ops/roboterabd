import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types/store';
import { ProductCard } from './ProductCard';
import { Reveal } from './Reveal';

interface FeaturedCarouselProps {
  products: Product[];
  categoryLabels?: Record<string, string>;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenDetail: (product: Product) => void;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
  products,
  categoryLabels,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onOpenDetail,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  return (
    <section id="just-arrived" className="scroll-mt-20 py-10 sm:py-14 bg-[#F7F9FC] border-b border-slate-200/70">
      <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10">
        <Reveal>
          <div className="flex items-end justify-between gap-4 mb-6 sm:mb-7">
            <div>
              <p className="text-xs font-mono font-semibold text-[#0057E7] mb-1">
                Latest Lab Stock
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#070D19] tracking-tight">
                Just Arrived
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollByAmount('left')}
                aria-label="Scroll new arrivals left"
                className="btn-liquid-glass w-9 h-9 rounded-xl flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount('right')}
                aria-label="Scroll new arrivals right"
                className="btn-liquid-glass w-9 h-9 rounded-xl flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={trackRef}
            className="flex gap-3 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1"
          >
            {products.map((product, idx) => (
              <div
                key={product.id}
                className="shrink-0 w-[calc(50%-6px)] sm:w-[250px] lg:w-[272px]"
              >
                <Reveal delayMs={Math.min(idx * 55, 220)} className="h-full">
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
