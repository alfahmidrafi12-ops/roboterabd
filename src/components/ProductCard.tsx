import React, { useEffect, useRef, useState } from 'react';
import { Check, Heart, Minus, Plus, ShoppingCart, Star } from 'lucide-react';
import { Product } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';

interface ProductCardProps {
  product: Product;
  categoryDisplayName?: string;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenDetail: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  categoryDisplayName,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onOpenDetail,
}) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (product.stock > 0 && qty > product.stock) {
      setQty(product.stock);
    }
  }, [product.stock, qty]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart(product, Math.min(qty, product.stock));
    setJustAdded(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setJustAdded(false), 1200);
  };

  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPct =
    hasDiscount && product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const displayCategory = categoryDisplayName || product.categoryLabel;

  return (
    <article className="group bg-white rounded-2xl border border-slate-200/85 hover:border-blue-300/80 hover:shadow-[0_14px_30px_-14px_rgba(6,20,46,0.16)] transition-all duration-200 flex flex-col overflow-hidden h-full">
      {/* Studio Product Artwork Stage */}
      <div className="relative bg-[#F7F9FC] border-b border-slate-100 aspect-[4/3] overflow-hidden">
        <button
          type="button"
          onClick={() => onOpenDetail(product)}
          aria-label={`View details for ${product.name}`}
          className={`w-full h-full ${
            product.imageUrl?.trim() ? 'p-1.5 sm:p-2' : 'p-3 sm:p-5'
          } flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600`}
        >
          <div className="w-full h-full min-w-0 min-h-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.03]">
            <HardwareArtwork
              kind={product.artwork}
              imageUrl={product.imageUrl}
              alt={product.name}
              fit="contain"
              className="w-full h-full"
            />
          </div>
        </button>

        {discountPct && discountPct > 0 && !isOutOfStock && (
          <span className="pointer-events-none absolute top-2 left-2 sm:top-2.5 sm:left-2.5 text-[10px] sm:text-[11px] font-mono font-bold text-[#0057E7] bg-white/95 px-2 py-0.5 rounded-md border border-blue-100 shadow-2xs tabular-nums">
            -{discountPct}%
          </span>
        )}

        {isOutOfStock && (
          <span className="pointer-events-none absolute top-2 left-2 sm:top-2.5 sm:left-2.5 text-[10px] sm:text-[11px] font-mono font-semibold text-red-700 bg-red-50/95 px-2 py-0.5 rounded-md border border-red-200">
            Out of Stock
          </span>
        )}

        <button
          type="button"
          onClick={() => onToggleWishlist(product.id)}
          aria-label={isWishlisted ? `Remove ${product.name} from saved` : `Save ${product.name}`}
          className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
            isWishlisted
              ? 'bg-[#06142E] border-[#06142E] text-white shadow-xs'
              : 'bg-white/95 border-slate-200/90 text-slate-500 hover:text-[#0057E7] hover:border-blue-200'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Product Details */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-1.5 text-[10px] sm:text-[11px] text-slate-400 mb-1">
          <span className="truncate font-semibold uppercase tracking-wider text-slate-500">
            {displayCategory}
          </span>
          <span className="hidden sm:inline font-mono text-[10px] text-slate-400 shrink-0">
            {product.sku}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenDetail(product)}
          className="text-left focus-visible:outline-none focus-visible:underline"
        >
          <h3 className="font-display text-[13px] sm:text-[15px] font-semibold text-[#06142E] leading-snug line-clamp-2 group-hover:text-[#0057E7] transition-colors min-h-[2.3rem] sm:min-h-[2.6rem]">
            {product.name}
          </h3>
        </button>

        {/* Rating & Availability Row */}
        <div className="mt-1.5 sm:mt-2 flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-slate-600">
          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500 shrink-0" />
          <span className="font-semibold text-slate-800 tabular-nums">{product.rating.toFixed(1)}</span>
          <span className="text-slate-400 tabular-nums">({product.reviews})</span>
          <span aria-hidden="true" className="hidden sm:inline text-slate-300">·</span>
          {isOutOfStock ? (
            <span className="hidden sm:inline text-red-600 font-medium whitespace-nowrap">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="hidden sm:inline text-amber-700 font-medium whitespace-nowrap tabular-nums">
              Only {product.stock} left
            </span>
          ) : (
            <span className="hidden sm:inline text-emerald-700 font-medium whitespace-nowrap">
              In Stock
            </span>
          )}
        </div>

        {/* Price Row */}
        <div className="mt-2 sm:mt-2.5 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
          <span className="font-mono text-sm sm:text-base font-bold text-[#06142E] tabular-nums">
            ৳{product.price.toLocaleString('en-IN')}
          </span>
          {hasDiscount && product.originalPrice && (
            <span className="font-mono text-[11px] sm:text-xs text-slate-400 line-through tabular-nums">
              ৳{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Responsive Stepper + Add to Cart Row */}
        <div className="mt-auto pt-3 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2">
          <div className="flex items-center justify-between sm:justify-start border border-slate-200 rounded-lg bg-[#F6F8FB] h-8 sm:h-9 px-1 sm:px-0 shrink-0">
            <button
              type="button"
              disabled={isOutOfStock || qty <= 1}
              onClick={() => setQty((prev) => Math.max(1, prev - 1))}
              aria-label="Decrease quantity"
              className="w-8 sm:w-7 h-full flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center text-xs font-mono font-semibold text-slate-900 tabular-nums">
              {isOutOfStock ? 0 : qty}
            </span>
            <button
              type="button"
              disabled={isOutOfStock || qty >= product.stock}
              onClick={() => setQty((prev) => Math.min(product.stock, prev + 1))}
              aria-label="Increase quantity"
              className="w-8 sm:w-7 h-full flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAdd}
            className={`w-full sm:flex-1 h-9 px-2.5 sm:px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed ${
              justAdded
                ? 'bg-[#06142E] text-white'
                : 'bg-[#0057E7] hover:bg-[#0044BB] text-white'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                <span>{isOutOfStock ? 'Unavailable' : 'Add to Cart'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
