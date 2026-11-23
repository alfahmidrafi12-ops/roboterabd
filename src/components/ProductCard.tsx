import React, { useEffect, useRef, useState } from 'react';
import {
  BatteryCharging,
  Bell,
  BellRing,
  Bot,
  Check,
  Cog,
  Cpu,
  GitCompareArrows,
  Heart,
  Minus,
  Monitor,
  Package,
  Plus,
  Radar,
  Radio,
  ShoppingCart,
  Star,
  Wrench,
} from 'lucide-react';
import { isWatermarkedUrl } from '../data/brandMedia';
import { playStepTickSound, playTapSound } from '../lib/sound';
import { ArtworkKind, Product } from '../types/store';
import { HighlightMatch } from './HighlightMatch';

interface ProductCardProps {
  product: Product;
  categoryDisplayName?: string;
  highlightQuery?: string;
  isWishlisted: boolean;
  isRestockWatched?: boolean;
  isCompared?: boolean;
  compareLimitReached?: boolean;
  layout?: 'grid' | 'list';
  onToggleWishlist: (productId: string) => void;
  onToggleCompare?: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenDetail: (product: Product) => void;
  onRequestRestockAlert?: (product: Product) => void;
}

function getNeutralPlaceholderIcon(category: string, artwork: ArtworkKind) {
  if (category === 'microcontrollers' || ['esp32', 'arduino', 'raspberry-pi', 'stm32'].includes(artwork)) {
    return Cpu;
  }
  if (category === 'sensors' || ['lidar', 'ultrasonic', 'imu'].includes(artwork)) {
    return Radar;
  }
  if (category === 'motors' || ['servo', 'stepper', 'brushless', 'driver'].includes(artwork)) {
    return Cog;
  }
  if (category === 'robotics-kits' || ['arm', 'rover'].includes(artwork)) {
    return Bot;
  }
  if (category === 'power' || ['lipo', 'bms', 'buck'].includes(artwork)) {
    return BatteryCharging;
  }
  if (category === 'displays' || artwork === 'oled') {
    return Monitor;
  }
  if (category === 'wireless' || artwork === 'lora') {
    return Radio;
  }
  if (category === 'tools' || ['soldering', 'analyzer'].includes(artwork)) {
    return Wrench;
  }
  return Package;
}

interface ProductMediaProps {
  product: Product;
  className?: string;
}

const ProductMedia: React.FC<ProductMediaProps> = ({ product, className = '' }) => {
  const [imgFailed, setImgFailed] = useState(false);

  const rawUrl = product.imageUrl?.trim() || '';
  const hasAuthenticImage = Boolean(rawUrl) && !isWatermarkedUrl(rawUrl) && !imgFailed;

  useEffect(() => {
    setImgFailed(false);
  }, [rawUrl]);

  if (hasAuthenticImage) {
    return (
      <img
        src={rawUrl}
        alt={product.name}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`w-full h-full object-contain object-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] ${className}`}
      />
    );
  }

  const PlaceholderIcon = getNeutralPlaceholderIcon(product.category, product.artwork);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center select-none px-3">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200/90 shadow-[0_4px_12px_-6px_rgba(7,26,61,0.08)] flex items-center justify-center text-[#475569] group-hover:text-[#087BFF] group-hover:border-[#087BFF]/35 transition-colors duration-300">
        <PlaceholderIcon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.5} />
      </div>
      <div className="space-y-0.5">
        <p className="font-mono text-[10px] font-semibold tracking-[0.08em] uppercase text-[#64748B]">
          {product.sku}
        </p>
        <p className="text-[10.5px] font-medium text-slate-400">Image Unavailable</p>
      </div>
    </div>
  );
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  categoryDisplayName,
  highlightQuery = '',
  isWishlisted,
  isRestockWatched = false,
  isCompared = false,
  compareLimitReached = false,
  layout = 'grid',
  onToggleWishlist,
  onToggleCompare,
  onAddToCart,
  onOpenDetail,
  onRequestRestockAlert,
}) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [heartBurstKey, setHeartBurstKey] = useState(0);
  const timerRef = useRef<number | null>(null);
  const lastAddTsRef = useRef<number>(0);

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
    const now = Date.now();
    if (now - lastAddTsRef.current < 350) return;
    lastAddTsRef.current = now;

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

  const hasRatings = product.rating > 0 && product.reviews > 0;
  const displayCategory = categoryDisplayName || product.categoryLabel;

  const badge = isOutOfStock
    ? { label: 'OUT OF STOCK', cls: 'bg-[#0F172A] text-white' }
    : hasDiscount
    ? { label: 'SALE', cls: 'bg-[#087BFF] text-white' }
    : isLowStock
    ? { label: 'LOW STOCK', cls: 'bg-[#D97706] text-white' }
    : null;

  if (layout === 'list') {
    return (
      <article className="group bg-white rounded-2xl border border-slate-200/90 hover:border-[#087BFF]/75 shadow-[0_4px_16px_-8px_rgba(7,26,61,0.08)] hover:shadow-[0_16px_32px_-12px_rgba(8,123,255,0.16)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col sm:flex-row overflow-hidden">
        {/* Clean Light Product Image Stage */}
        <div className="relative bg-[#F7FAFE] border-b sm:border-b-0 sm:border-r border-slate-100 w-full sm:w-56 h-48 sm:h-auto shrink-0 overflow-hidden">
          <button
            type="button"
            onClick={() => onOpenDetail(product)}
            aria-label={`View details for ${product.name}`}
            className="w-full h-full p-4 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#087BFF]"
          >
            <ProductMedia product={product} />
          </button>

          {badge && (
            <span
              className={`pointer-events-none absolute top-3 left-3 text-[10px] font-mono font-bold tracking-[0.06em] px-2 py-0.5 rounded-md ${badge.cls}`}
            >
              {badge.label}
            </span>
          )}
        </div>

        {/* Product Specifications & Actions */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 min-w-0">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
              <span className="font-bold uppercase tracking-wider text-[#087BFF]">
                <HighlightMatch
                  text={displayCategory}
                  query={highlightQuery}
                  markClassName="bg-[#087BFF]/15 text-[#0656B8] rounded-[3px] px-0.5 font-extrabold ring-1 ring-inset ring-[#087BFF]/30"
                />
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{product.sku}</span>
            </div>

            <button
              type="button"
              onClick={() => onOpenDetail(product)}
              className="text-left focus-visible:outline-none focus-visible:underline"
            >
              <h3 className="font-hero text-base sm:text-[17px] font-bold text-[#071A3D] group-hover:text-[#087BFF] transition-colors line-clamp-2">
                <HighlightMatch text={product.name} query={highlightQuery} />
              </h3>
            </button>

            <p className="text-xs sm:text-[13px] text-[#475569] line-clamp-2">{product.shortDesc}</p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-[#475569]">
              {hasRatings && (
                <>
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <strong className="text-[#071A3D] tabular-nums">
                      {product.rating.toFixed(1)}
                    </strong>
                    <span className="tabular-nums text-[#64748B]">({product.reviews})</span>
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                </>
              )}
              {isOutOfStock ? (
                <span className="text-red-600 font-semibold">Out of Stock</span>
              ) : isLowStock ? (
                <span className="text-[#D97706] font-semibold tabular-nums">
                  Low Stock ({product.stock} left)
                </span>
              ) : (
                <span className="text-[#0F766E] font-semibold">In Stock</span>
              )}
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 sm:pl-5 sm:border-l border-slate-100">
            <div className="text-left sm:text-right">
              <div className="flex items-baseline sm:justify-end gap-2">
                <span className="font-mono text-lg sm:text-xl font-extrabold text-[#071A3D] tabular-nums">
                  ৳{product.price.toLocaleString('en-IN')}
                </span>
                {hasDiscount && product.originalPrice && (
                  <span className="font-mono text-xs text-slate-400 line-through tabular-nums">
                    ৳{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              {discountPct && discountPct > 0 && !isOutOfStock && (
                <p className="font-mono text-[11px] font-bold text-[#087BFF] tabular-nums mt-0.5">
                  Save {discountPct}%
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {onToggleCompare && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCompare(product.id);
                  }}
                  aria-pressed={isCompared}
                  aria-label={
                    isCompared
                      ? `Remove ${product.name} from comparison`
                      : `Compare ${product.name}`
                  }
                  className={`h-9 px-2.5 rounded-xl border text-[11px] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] ${
                    isCompared
                      ? 'bg-[#087BFF] border-[#087BFF] text-white'
                      : compareLimitReached
                      ? 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-[#475569]'
                      : 'bg-white border-slate-200 text-[#475569] hover:text-[#087BFF] hover:border-[#087BFF]/45'
                  }`}
                >
                  {isCompared ? (
                    <Check className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <GitCompareArrows className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{isCompared ? 'Comparing' : 'Compare'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!isWishlisted) setHeartBurstKey((k) => k + 1);
                  onToggleWishlist(product.id);
                }}
                aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
                className={`relative w-9 h-9 rounded-xl flex items-center justify-center border active:scale-90 transition-all ${
                  isWishlisted
                    ? 'bg-[#071A3D] border-[#071A3D] text-white'
                    : 'bg-white border-slate-200 text-[#64748B] hover:text-[#087BFF] hover:border-[#087BFF]/45'
                }`}
              >
                {heartBurstKey > 0 && isWishlisted && (
                  <span
                    key={heartBurstKey}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-xl border-2 border-[#087BFF] animate-heart-burst"
                  />
                )}
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current animate-icon-pop' : ''}`} />
              </button>

              <div className="flex items-center border border-slate-200 rounded-xl bg-[#F8FAFC] h-9">
                <button
                  type="button"
                  disabled={isOutOfStock || qty <= 1}
                  onClick={() => {
                    playStepTickSound(false);
                    setQty((prev) => Math.max(1, prev - 1));
                  }}
                  aria-label="Decrease quantity"
                  className="w-7 h-full flex items-center justify-center text-[#64748B] hover:text-[#071A3D] hover:bg-white active:scale-90 rounded-l-xl transition-all disabled:opacity-35"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-xs font-mono font-bold text-[#071A3D] tabular-nums">
                  {isOutOfStock ? 0 : qty}
                </span>
                <button
                  type="button"
                  disabled={isOutOfStock || qty >= product.stock}
                  onClick={() => {
                    playStepTickSound(true);
                    setQty((prev) => Math.min(product.stock, prev + 1));
                  }}
                  aria-label="Increase quantity"
                  className="w-7 h-full flex items-center justify-center text-[#64748B] hover:text-[#071A3D] hover:bg-white active:scale-90 rounded-r-xl transition-all disabled:opacity-35"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {isOutOfStock ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playTapSound();
                    if (onRequestRestockAlert) {
                      onRequestRestockAlert(product);
                    } else {
                      onOpenDetail(product);
                    }
                  }}
                  className={`h-9 px-3.5 rounded-xl text-[11px] font-bold tracking-[0.04em] uppercase inline-flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-[0.96] transition-all duration-200 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] ${
                    isRestockWatched
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-[#071A3D] border-[#071A3D] hover:bg-[#087BFF] hover:border-[#087BFF] text-white'
                  }`}
                >
                  {isRestockWatched ? (
                    <>
                      <BellRing className="w-3.5 h-3.5 shrink-0 text-emerald-600 animate-bell-ring" />
                      <span>Alert Set</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5 shrink-0 text-[#00CFFF]" />
                      <span>Notify Me</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAdd}
                  className={`cta-sheen h-9 px-4 rounded-xl text-[11px] font-bold tracking-[0.04em] uppercase inline-flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-[0.96] transition-all duration-200 ${
                    justAdded
                      ? 'animate-spring-pop bg-[#071A3D] text-white'
                      : 'bg-[#087BFF] hover:bg-[#0669DB] text-white shadow-[0_6px_14px_-6px_rgba(8,123,255,0.45)]'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 shrink-0 animate-icon-pop text-[#00CFFF]" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group bg-white rounded-2xl border border-slate-200/90 hover:border-[#087BFF]/75 shadow-[0_4px_16px_-8px_rgba(7,26,61,0.08)] hover:shadow-[0_18px_36px_-14px_rgba(8,123,255,0.16)] hover:-translate-y-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col overflow-hidden h-full">
      {/* Consistent Clean Studio Product Image Area */}
      <div className="relative bg-[#F7FAFE] border-b border-slate-100 h-[168px] sm:h-[200px] overflow-hidden shrink-0">
        <button
          type="button"
          onClick={() => {
            playTapSound();
            onOpenDetail(product);
          }}
          aria-label={`View details for ${product.name}`}
          className="w-full h-full p-3.5 sm:p-4 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#087BFF]"
        >
          <ProductMedia product={product} />
        </button>

        {badge && (
          <span
            className={`pointer-events-none absolute top-2.5 left-2.5 text-[9.5px] sm:text-[10px] font-mono font-bold tracking-[0.06em] px-2 py-0.5 rounded-md ${badge.cls}`}
          >
            {badge.label}
          </span>
        )}

        <button
          type="button"
          onClick={() => {
            if (!isWishlisted) setHeartBurstKey((k) => k + 1);
            onToggleWishlist(product.id);
          }}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Save ${product.name} to wishlist`
          }
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center border active:scale-90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] ${
            isWishlisted
              ? 'bg-[#071A3D] border-[#071A3D] text-white'
              : 'bg-white/95 border-slate-200 text-[#64748B] hover:text-[#087BFF] hover:border-[#087BFF]/50'
          }`}
        >
          {heartBurstKey > 0 && isWishlisted && (
            <span
              key={heartBurstKey}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#087BFF] animate-heart-burst"
            />
          )}
          <Heart
            className={`w-3.5 h-3.5 transition-transform ${
              isWishlisted ? 'fill-current animate-icon-pop' : ''
            }`}
          />
        </button>

        {onToggleCompare && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(product.id);
            }}
            aria-pressed={isCompared}
            aria-label={
              isCompared
                ? `Remove ${product.name} from comparison`
                : `Compare ${product.name}`
            }
            className={`absolute bottom-2.5 right-2.5 h-7 px-2.5 rounded-lg border text-[10.5px] font-semibold inline-flex items-center gap-1 whitespace-nowrap shadow-[0_4px_10px_-4px_rgba(7,26,61,0.16)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] ${
              isCompared
                ? 'bg-[#087BFF] border-[#087BFF] text-white'
                : compareLimitReached
                ? 'bg-white/90 border-slate-200 text-slate-400 hover:text-[#475569] hover:border-slate-300'
                : 'bg-white/95 border-slate-200 text-[#334155] hover:text-[#087BFF] hover:border-[#087BFF]/60'
            }`}
          >
            {isCompared ? (
              <Check className="w-3 h-3 shrink-0" />
            ) : (
              <GitCompareArrows className="w-3 h-3 shrink-0" />
            )}
            <span>{isCompared ? 'Comparing' : 'Compare'}</span>
          </button>
        )}
      </div>

      {/* Product Information Hierarchy */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 min-w-0">
        {/* 1. Category & 3. Model / SKU */}
        <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[10.5px] mb-1">
          <span className="truncate font-bold uppercase tracking-[0.06em] text-[#087BFF]">
            <HighlightMatch
              text={displayCategory}
              query={highlightQuery}
              markClassName="bg-[#087BFF]/15 text-[#0656B8] rounded-[3px] px-0.5 font-extrabold ring-1 ring-inset ring-[#087BFF]/30"
            />
          </span>
          <span className="hidden sm:inline font-mono text-[10px] text-[#64748B] shrink-0">
            {product.sku}
          </span>
        </div>

        {/* 2. Readable 2-Line Product Title */}
        <button
          type="button"
          onClick={() => onOpenDetail(product)}
          className="text-left focus-visible:outline-none focus-visible:underline"
        >
          <h3 className="font-hero text-[13.5px] sm:text-[15px] font-bold text-[#071A3D] leading-[1.35] line-clamp-2 group-hover:text-[#087BFF] transition-colors min-h-[2.3rem] sm:min-h-[2.55rem]">
            <HighlightMatch text={product.name} query={highlightQuery} />
          </h3>
        </button>

        {/* 4. Real Ratings & 8. Stock Availability */}
        <div className="mt-1.5 flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] sm:text-xs text-[#475569] min-h-[1.1rem]">
          {hasRatings && (
            <>
              <span className="inline-flex items-center gap-1">
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                <span className="font-bold text-[#071A3D] tabular-nums">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-[#64748B] tabular-nums">({product.reviews})</span>
              </span>
              <span aria-hidden="true" className="hidden sm:inline text-slate-300">
                ·
              </span>
            </>
          )}

          {isOutOfStock ? (
            <span className="text-red-600 font-semibold whitespace-nowrap">Out of Stock</span>
          ) : isLowStock ? (
            <span className="text-[#D97706] font-semibold whitespace-nowrap tabular-nums">
              {product.stock} left
            </span>
          ) : (
            <span className="text-[#0F766E] font-semibold whitespace-nowrap">In Stock</span>
          )}
        </div>

        {/* 5. Prominent BDT Price + 6. Original Price + 7. Discount % */}
        <div className="mt-2.5 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
          <span className="font-mono text-[15px] sm:text-[18px] font-extrabold text-[#071A3D] tabular-nums">
            ৳{product.price.toLocaleString('en-IN')}
          </span>
          {hasDiscount && product.originalPrice && (
            <span className="font-mono text-[11px] sm:text-xs text-slate-400 line-through tabular-nums">
              ৳{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
          {discountPct && discountPct > 0 && !isOutOfStock && (
            <span className="font-mono text-[10.5px] sm:text-[11px] font-bold text-[#087BFF] tabular-nums">
              -{discountPct}%
            </span>
          )}
        </div>

        {/* 9. Quantity Selector & 10. Electric Blue Add to Cart CTA */}
        <div className="mt-auto pt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center justify-between sm:justify-start border border-slate-200 rounded-xl bg-[#F8FAFC] h-9 shrink-0">
            <button
              type="button"
              disabled={isOutOfStock || qty <= 1}
              onClick={() => {
                playStepTickSound(false);
                setQty((prev) => Math.max(1, prev - 1));
              }}
              aria-label="Decrease quantity"
              className="w-8 sm:w-7 h-full flex items-center justify-center text-[#475569] hover:text-[#071A3D] hover:bg-white active:scale-90 rounded-l-xl transition-all disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center text-xs font-mono font-bold text-[#071A3D] tabular-nums">
              {isOutOfStock ? 0 : qty}
            </span>
            <button
              type="button"
              disabled={isOutOfStock || qty >= product.stock}
              onClick={() => {
                playStepTickSound(true);
                setQty((prev) => Math.min(product.stock, prev + 1));
              }}
              aria-label="Increase quantity"
              className="w-8 sm:w-7 h-full flex items-center justify-center text-[#475569] hover:text-[#071A3D] hover:bg-white active:scale-90 rounded-r-xl transition-all disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isOutOfStock ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playTapSound();
                if (onRequestRestockAlert) {
                  onRequestRestockAlert(product);
                } else {
                  onOpenDetail(product);
                }
              }}
              className={`w-full sm:flex-1 h-9 px-3 rounded-xl text-[11px] font-bold tracking-[0.04em] uppercase inline-flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-[0.96] transition-all duration-200 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] ${
                isRestockWatched
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-[#071A3D] border-[#071A3D] hover:bg-[#087BFF] hover:border-[#087BFF] text-white shadow-[0_8px_18px_-10px_rgba(7,26,61,0.45)]'
              }`}
            >
              {isRestockWatched ? (
                <>
                  <BellRing className="w-3.5 h-3.5 shrink-0 text-emerald-600 animate-bell-ring" />
                  <span>Alert Set</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 shrink-0 text-[#00CFFF]" />
                  <span>Notify Me</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className={`cta-sheen w-full sm:flex-1 h-9 px-3 rounded-xl text-[11px] font-bold tracking-[0.04em] uppercase inline-flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-[0.96] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] ${
                justAdded
                  ? 'animate-spring-pop bg-[#071A3D] text-white'
                  : 'bg-[#087BFF] hover:bg-[#0669DB] text-white shadow-[0_8px_18px_-8px_rgba(8,123,255,0.5)]'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0 animate-icon-pop text-[#00CFFF]" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
