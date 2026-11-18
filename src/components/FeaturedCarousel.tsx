import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types/store';
import { ProductCard } from './ProductCard';

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
    <section id="just-arrived" className="scroll-mt-20 py-10 sm:py-12 lg:py-14 bg-white">
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-6 sm:mb-7">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#06142E] tracking-tight">
              Just Arrived
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByAmount('left')}
              aria-label="Scroll new arrivals left"
              className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount('right')}
              aria-label="Scroll new arrivals right"
              className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="flex gap-3 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-2"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="shrink-0 w-[calc(50%-6px)] sm:w-[240px] lg:w-[265px]"
            >
              <ProductCard
                product={product}
                categoryDisplayName={categoryLabels?.[product.category]}
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onOpenDetail={onOpenDetail}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
