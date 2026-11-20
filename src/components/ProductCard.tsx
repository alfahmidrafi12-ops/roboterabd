import React, { useEffect, useRef, useState } from 'react';
import { Check, Heart, Minus, Plus, ShoppingCart, Star } from 'lucide-react';
import { Product } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';

interface ProductCardProps {
  product: Product;
  categoryDisplayName?: string;
  isWishlisted: boolean;
  layout?: 'grid' | 'list';
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenDetail: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  categoryDisplayName,
  isWishlisted,
  layout = 'grid',
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

  if (layout === 'list') {
    return (
      <article className="group bg-white rounded-2xl border border-slate-300/85 hover:border-[#0866F5] transition-colors duration-200 flex flex-col sm:flex-row overflow-hidden">
        {/* Left Studio Stage */}
        <div className="relative bg-[#EDF2F8] border-b sm:border-b-0 sm:border-r border-slate-200 w-full sm:w-52 aspect-[4/3] sm:aspect-auto shrink-0 overflow-hidden">
          <button
            type="button"
            onClick={() => onOpenDetail(product)}
            aria-label={`View details for ${product.name}`}
            className="w-full h-full p-4 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0866F5]"
          >
            <div className="w-full h-full max-h-36 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-[1.06]">
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
            <span className="pointer-events-none absolute top-2.5 left-2.5 text-[11px] font-mono font-bold text-white bg-[#0F766E] px-2 py-0.5 rounded-md tabular-nums">
              -{discountPct}%
            </span>
          )}
          {isOutOfStock && (
            <span className="pointer-events-none absolute top-2.5 left-2.5 text-[11px] font-mono font-semibold text-white bg-red-600 px-2 py-0.5 rounded-md">
              Out of Stock
            </span>
          )}
        </div>

        {/* Center Info + Right Purchase Action */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 min-w-0">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
              <span className="font-semibold uppercase tracking-wider text-[#0D9488]">
                {displayCategory}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{product.sku}</span>
            </div>

            <button
              type="button"
              onClick={() => onOpenDetail(product)}
              className="text-left focus-visible:outline-none focus-visible:underline"
            >
              <h3 className="font-display text-base sm:text-lg font-bold text-[#071A3B] group-hover:text-[#0866F5] transition-colors">
                {product.name}
              </h3>
            </button>

            <p className="text-xs sm:text-sm text-[#475569] line-clamp-2">{product.shortDesc}</p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-[#64748B]">
              <span className="inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <strong className="text-[#101828] tabular-nums">{product.rating.toFixed(1)}</strong>
                <span className="tabular-nums">({product.reviews})</span>
              </span>
              <span aria-hidden="true">·</span>
              {isOutOfStock ? (
                <span className="text-red-600 font-semibold">Out of Stock</span>
              ) : isLowStock ? (
                <span className="text-[#EA580C] font-semibold tabular-nums">
                  Only {product.stock} left
                </span>
              ) : (
                <span className="text-[#0D9488] font-semibold">In Stock</span>
              )}
              {product.specs.slice(0, 2).map((s) => (
                <span
                  key={s.label}
                  className="hidden xl:inline-flex font-mono text-[11px] text-[#475569]"
                >
                  · {s.label}: {s.value}
                </span>
              ))}
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 sm:pl-4 sm:border-l border-slate-100">
            <div className="text-left sm:text-right">
              <div className="flex items-baseline sm:justify-end gap-2">
                <span className="font-mono text-lg font-bold text-[#071A3B] tabular-nums">
                  ৳{product.price.toLocaleString('en-IN')}
                </span>
                {hasDiscount && product.originalPrice && (
                  <span className="font-mono text-xs text-slate-400 line-through tabular-nums">
                    ৳{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                aria-label={isWishlisted ? `Remove ${product.name} from saved` : `Save ${product.name}`}
                className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                  isWishlisted
                    ? 'bg-[#071A3B] hover:bg-[#071A3B]/90 border-[#071A3B] text-white'
                    : 'bg-white border-slate-200 text-[#64748B] hover:text-[#0866F5] hover:bg-[#0866F5]/[0.05] hover:border-[#0866F5]/45'
                }`}
              >
                <Heart className={`w-4 h-4 transition-transform ${isWishlisted ? 'fill-current animate-icon-pop' : ''}`} />
              </button>

              <div className="flex items-center border border-slate-200 rounded-xl bg-[#F8FAFC] h-9">
                <button
                  type="button"
                  disabled={isOutOfStock || qty <= 1}
                  onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                  aria-label="Decrease quantity"
                  className="w-7 h-full flex items-center justify-center text-[#64748B] hover:text-[#101828] hover:bg-white rounded-l-xl transition-colors disabled:opacity-35"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-xs font-mono font-semibold text-[#101828] tabular-nums">
                  {isOutOfStock ? 0 : qty}
                </span>
                <button
                  type="button"
                  disabled={isOutOfStock || qty >= product.stock}
                  onClick={() => setQty((prev) => Math.min(product.stock, prev + 1))}
                  aria-label="Increase quantity"
                  className="w-7 h-full flex items-center justify-center text-[#64748B] hover:text-[#101828] hover:bg-white rounded-r-xl transition-colors disabled:opacity-35"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAdd}
                className={`h-9 px-4 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed ${
                  isOutOfStock
                    ? ''
                    : justAdded
                    ? 'bg-[#071A3B] border-[#071A3B] text-white'
                    : 'bg-[#0866F5] hover:bg-[#0866F5]/90 border-[#0866F5] hover:border-[#1685FF] text-white'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5 shrink-0 animate-icon-pop text-[#2DD4BF]" />
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
        </div>
      </article>
    );
  }

  return (
    <article className="group bg-white rounded-2xl border border-slate-300/85 hover:border-[#0866F5] transition-colors duration-200 flex flex-col overflow-hidden h-full">
      {/* Studio Hardware Stage */}
      <div className="relative bg-[#EDF2F8] border-b border-slate-200 aspect-[4/3] overflow-hidden">
        <button
          type="button"
          onClick={() => onOpenDetail(product)}
          aria-label={`View details for ${product.name}`}
          className={`w-full h-full ${
            product.imageUrl?.trim() ? 'p-2 sm:p-3' : 'p-4 sm:p-5'
          } flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0866F5]`}
        >
          <div className="w-full h-full min-w-0 min-h-0 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-[1.06]">
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
          <span className="pointer-events-none absolute top-2.5 left-2.5 text-[10px] sm:text-[11px] font-mono font-bold text-white bg-[#0F766E] px-2 py-0.5 rounded-md tabular-nums">
            -{discountPct}%
          </span>
        )}

        {isOutOfStock && (
          <span className="pointer-events-none absolute top-2.5 left-2.5 text-[10px] sm:text-[11px] font-mono font-semibold text-white bg-red-600 px-2 py-0.5 rounded-md">
            Out of Stock
          </span>
        )}

        <button
          type="button"
          onClick={() => onToggleWishlist(product.id)}
          aria-label={isWishlisted ? `Remove ${product.name} from saved` : `Save ${product.name}`}
          className={`absolute top-2.5 right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866F5] ${
            isWishlisted
              ? 'bg-[#071A3B] hover:bg-[#071A3B]/90 border-[#071A3B] text-white'
              : 'bg-white border-slate-300 text-[#475569] hover:text-[#0866F5] hover:bg-[#EFF6FF] hover:border-[#0866F5]/60'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${isWishlisted ? 'fill-current animate-icon-pop' : ''}`} />
        </button>
      </div>

      {/* Product Details */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-1.5 text-[10px] sm:text-[11px] text-[#475569] mb-1">
          <span className="truncate font-bold uppercase tracking-wider text-[#0F766E]">
            {displayCategory}
          </span>
          <span className="hidden sm:inline font-mono text-[10px] text-[#475569] shrink-0">
            {product.sku}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenDetail(product)}
          className="text-left focus-visible:outline-none focus-visible:underline"
        >
          <h3 className="font-display text-[13px] sm:text-[15px] font-bold text-[#071A3B] leading-snug line-clamp-2 group-hover:text-[#0866F5] transition-colors min-h-[2.25rem] sm:min-h-[2.6rem]">
            {product.name}
          </h3>
        </button>

        {/* Rating & Availability Row */}
        <div className="mt-1.5 sm:mt-2 flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-[#475569]">
          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500 shrink-0" />
          <span className="font-bold text-[#0F172A] tabular-nums">{product.rating.toFixed(1)}</span>
          <span className="text-[#475569] tabular-nums">({product.reviews})</span>
          <span aria-hidden="true" className="hidden sm:inline text-slate-300">·</span>
          {isOutOfStock ? (
            <span className="hidden sm:inline text-red-700 font-semibold whitespace-nowrap">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="hidden sm:inline text-[#C2410C] font-bold whitespace-nowrap tabular-nums">
              Only {product.stock} left
            </span>
          ) : (
            <span className="hidden sm:inline text-[#0F766E] font-semibold whitespace-nowrap">
              In Stock
            </span>
          )}
        </div>

        {/* Price Row */}
        <div className="mt-2 sm:mt-2.5 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
          <span className="font-mono text-sm sm:text-[17px] font-bold text-[#071A3B] tabular-nums">
            ৳{product.price.toLocaleString('en-IN')}
          </span>
          {hasDiscount && product.originalPrice && (
            <span className="font-mono text-[10.5px] sm:text-xs text-slate-500 line-through tabular-nums">
              ৳{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Stepper + Add to Cart Row */}
        <div className="mt-auto pt-3 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2">
          <div className="flex items-center justify-between sm:justify-start border border-slate-300 rounded-xl bg-[#EDF2F8] h-8 sm:h-9 px-1 sm:px-0 shrink-0">
            <button
              type="button"
              disabled={isOutOfStock || qty <= 1}
              onClick={() => setQty((prev) => Math.max(1, prev - 1))}
              aria-label="Decrease quantity"
              className="w-8 sm:w-7 h-full flex items-center justify-center text-[#334155] hover:text-[#071A3B] hover:bg-white rounded-l-xl transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center text-xs font-mono font-bold text-[#071A3B] tabular-nums">
              {isOutOfStock ? 0 : qty}
            </span>
            <button
              type="button"
              disabled={isOutOfStock || qty >= product.stock}
              onClick={() => setQty((prev) => Math.min(product.stock, prev + 1))}
              aria-label="Increase quantity"
              className="w-8 sm:w-7 h-full flex items-center justify-center text-[#334155] hover:text-[#071A3B] hover:bg-white rounded-r-xl transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAdd}
            className={`w-full sm:flex-1 h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed ${
              isOutOfStock
                ? ''
                : justAdded
                ? 'bg-[#071A3B] border-[#071A3B] text-white'
                : 'bg-[#0866F5] hover:bg-[#0866F5]/90 border-[#0866F5] hover:border-[#1685FF] text-white'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 shrink-0 animate-icon-pop text-[#2DD4BF]" />
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
