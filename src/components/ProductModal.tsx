import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  ExternalLink,
  Heart,
  Image as ImageIcon,
  Minus,
  Play,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Video,
  X,
  Zap,
} from 'lucide-react';
import { resolveProductVideo } from '../lib/video';
import { LocalPriceWatch, Product } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';

interface ProductModalProps {
  product: Product | null;
  categoryDisplayName?: string;
  isWishlisted: boolean;
  defaultEmail?: string | null;
  watchedAlert?: LocalPriceWatch | null;
  onClose: () => void;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number, variant?: string) => void;
  onBuyNow?: (product: Product, quantity: number, variant?: string) => void;
  onSubscribePriceDrop?: (product: Product, email: string) => Promise<void>;
}

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  categoryDisplayName,
  isWishlisted,
  defaultEmail,
  watchedAlert,
  onClose,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onSubscribePriceDrop,
}) => {
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(undefined);
  const [mediaTab, setMediaTab] = useState<'image' | 'video'>('image');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertBusy, setAlertBusy] = useState(false);
  const [alertError, setAlertError] = useState('');
  const [alertSuccess, setAlertSuccess] = useState('');

  const resolvedVideo = useMemo(
    () => resolveProductVideo(product?.videoUrl),
    [product?.videoUrl]
  );

  useEffect(() => {
    if (product) {
      setQty(1);
      setSelectedVariant(product.variants?.[0]);
      setMediaTab('image');
      setNotifyOpen(false);
      setAlertError('');
      setAlertSuccess('');
    }
  }, [product?.id]);

  useEffect(() => {
    if (product) {
      setAlertEmail(watchedAlert?.email || defaultEmail || '');
    }
  }, [product?.id, defaultEmail, watchedAlert?.email]);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPct =
    hasDiscount && product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const handlePriceDropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubscribePriceDrop || alertBusy) return;
    const trimmed = alertEmail.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setAlertError('Please enter a valid email address.');
      return;
    }

    setAlertBusy(true);
    setAlertError('');
    setAlertSuccess('');
    try {
      await onSubscribePriceDrop(product, trimmed);
      setAlertSuccess(
        `Price alert active for ${trimmed}. You'll be notified if ${product.name} drops below ৳${product.price.toLocaleString('en-IN')}.`
      );
      setNotifyOpen(false);
    } catch (err) {
      console.error('Price alert subscription error:', err);
      setAlertError('Could not save price alert right now. Please try again.');
    } finally {
      setAlertBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className="fixed inset-0 bg-[#06142E]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdp-title"
        className="relative z-10 w-full max-w-3xl max-h-[92dvh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
      >
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
            <span className="font-semibold text-[#0057E7] truncate">
              {categoryDisplayName || product.categoryLabel}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono shrink-0">{product.sku}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product details"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto overflow-x-hidden p-4 sm:p-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-7">
          {/* Left Product Visual & Demo Video */}
          <div className="md:col-span-5 space-y-3">
            {resolvedVideo && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#F4F7FB] rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMediaTab('image')}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                    mediaTab === 'image'
                      ? 'bg-white text-[#06142E] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaTab('video')}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                    mediaTab === 'video'
                      ? 'bg-[#0057E7] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#0057E7]'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Demo Video</span>
                </button>
              </div>
            )}

            {mediaTab === 'video' && resolvedVideo ? (
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-950">
                {resolvedVideo.kind === 'iframe' ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={resolvedVideo.embedUrl}
                      title={`${product.name} demonstration video`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : resolvedVideo.kind === 'video' ? (
                  <div className="aspect-video w-full bg-black">
                    <video
                      src={resolvedVideo.src}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full p-5 flex flex-col items-center justify-center text-center bg-[#06142E] text-white space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#0057E7] flex items-center justify-center">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold">Product Video Demo</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Watch this hardware bench demonstration in your player
                      </p>
                    </div>
                    <a
                      href={resolvedVideo.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-[#06142E] text-xs font-bold hover:bg-blue-50 transition-colors"
                    >
                      <span>Open Demo Video</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
                <div className="px-3 py-2 bg-[#06142E] text-[11px] text-slate-300 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Video className="w-3.5 h-3.5 text-blue-400" />
                    <span>Bench Demonstration</span>
                  </span>
                  <a
                    href={resolvedVideo.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-white inline-flex items-center gap-1 font-semibold"
                  >
                    <span>Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div
                className={`bg-[#F6F8FB] rounded-xl border border-slate-200/80 ${
                  product.imageUrl?.trim()
                    ? 'p-2.5 sm:p-3 min-h-[220px] sm:min-h-[260px]'
                    : 'p-5 sm:p-6 aspect-square'
                } flex items-center justify-center relative overflow-hidden`}
              >
                <HardwareArtwork
                  kind={product.artwork}
                  imageUrl={product.imageUrl}
                  alt={product.name}
                  fit="contain"
                  className={product.imageUrl?.trim() ? 'w-full h-auto max-h-[380px]' : 'w-full h-full'}
                />
                {discountPct && discountPct > 0 && !isOutOfStock && (
                  <span className="absolute top-3 left-3 text-xs font-mono font-semibold text-[#0057E7] bg-white px-2 py-0.5 rounded border border-blue-100 tabular-nums">
                    Save {discountPct}%
                  </span>
                )}
                {resolvedVideo && (
                  <button
                    type="button"
                    onClick={() => setMediaTab('video')}
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06142E]/90 hover:bg-[#0057E7] text-white text-xs font-semibold shadow-md transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch Demo</span>
                  </button>
                )}
              </div>
            )}

            <div className="bg-[#F6F8FB] rounded-xl border border-slate-200/70 p-3.5 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#0057E7] shrink-0" />
                <span>Inside Dhaka: 2–3 days (৳80) · Outside Dhaka: 2–4 days (৳150)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0057E7] shrink-0" />
                <span>Bench-tested before dispatch · 7-day replacement</span>
              </div>
            </div>
          </div>

          {/* Right Contiguous Purchase Module */}
          <div className="md:col-span-7 flex flex-col min-w-0">
            <h2 id="pdp-title" className="font-display text-lg sm:text-2xl font-bold text-[#06142E] leading-snug">
              {product.name}
            </h2>

            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-semibold text-slate-900 tabular-nums">{product.rating.toFixed(1)}</span>
              <span className="text-slate-400 tabular-nums">({product.reviews} reviews)</span>
              <span aria-hidden="true">·</span>
              {isOutOfStock ? (
                <span className="text-red-600 font-semibold">Out of stock</span>
              ) : product.stock <= 5 ? (
                <span className="text-amber-700 font-semibold tabular-nums">
                  Only {product.stock} left in Dhaka stock
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold tabular-nums">
                  {product.stock} units in Dhaka stock
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-mono text-2xl font-bold text-[#06142E] tabular-nums">
                ৳{product.price.toLocaleString('en-IN')}
              </span>
              {hasDiscount && product.originalPrice && (
                <span className="font-mono text-sm text-slate-400 line-through tabular-nums">
                  ৳{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <p className="mt-4 text-sm text-slate-600 leading-relaxed">{product.shortDesc}</p>

            {/* Variant Picker */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-slate-700 mb-2">Configuration</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const active = selectedVariant === variant;
                    return (
                      <button
                        key={variant}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                          active
                            ? 'bg-[#06142E] border-[#06142E] text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {variant}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Technical Specs Table */}
            {product.specs.length > 0 && (
              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold text-[#06142E] mb-2.5">Key Specifications</p>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {product.specs.map((spec) => (
                    <div key={spec.label} className="bg-[#F6F8FB] rounded-lg px-3 py-2">
                      <dt className="text-slate-500">{spec.label}</dt>
                      <dd className="font-mono font-medium text-slate-900 mt-0.5 break-words">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Purchase Actions */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="flex items-center border border-slate-200 rounded-lg bg-[#F6F8FB] h-11 shrink-0">
                  <button
                    type="button"
                    disabled={isOutOfStock || qty <= 1}
                    onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                    aria-label="Decrease quantity"
                    className="w-9 h-full flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-35"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-7 sm:w-8 text-center font-mono text-sm font-semibold tabular-nums">
                    {isOutOfStock ? 0 : qty}
                  </span>
                  <button
                    type="button"
                    disabled={isOutOfStock || qty >= product.stock}
                    onClick={() => setQty((prev) => Math.min(product.stock, prev + 1))}
                    aria-label="Increase quantity"
                    className="w-9 h-full flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-35"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => {
                    if (isOutOfStock) return;
                    onAddToCart(product, Math.min(qty, product.stock), selectedVariant);
                    onClose();
                  }}
                  className="flex-1 min-w-0 h-11 px-3 sm:px-4 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap"
                >
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  <span className="truncate">{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleWishlist(product.id)}
                  aria-label={isWishlisted ? 'Remove from saved' : 'Save item'}
                  className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                    isWishlisted
                      ? 'bg-[#06142E] border-[#06142E] text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-[#0057E7]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              {onBuyNow && !isOutOfStock && (
                <button
                  type="button"
                  onClick={() => {
                    onBuyNow(product, Math.min(qty, product.stock), selectedVariant);
                    onClose();
                  }}
                  className="w-full h-10 rounded-lg bg-[#06142E] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Zap className="w-4 h-4 text-blue-300" />
                  <span>Buy Now — Fast Checkout</span>
                </button>
              )}

              {/* Notify me when price drops */}
              {onSubscribePriceDrop && (
                <div className="pt-1">
                  {alertSuccess ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{alertSuccess}</span>
                    </div>
                  ) : watchedAlert && !notifyOpen ? (
                    <div className="p-3 rounded-xl bg-[#EEF4FF] border border-blue-200 text-xs text-[#06142E] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <BellRing className="w-4 h-4 text-[#0057E7] shrink-0" />
                        <span className="truncate">
                          Price alert active for <strong>{watchedAlert.email}</strong> (below ৳
                          {watchedAlert.baselinePrice.toLocaleString('en-IN')})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifyOpen(true)}
                        className="text-[11px] font-semibold text-[#0057E7] hover:underline whitespace-nowrap shrink-0"
                      >
                        Update email
                      </button>
                    </div>
                  ) : !notifyOpen ? (
                    <button
                      type="button"
                      onClick={() => setNotifyOpen(true)}
                      className="w-full h-10 rounded-lg border border-slate-200 bg-[#F6F8FB] hover:bg-slate-100 hover:border-slate-300 text-[#06142E] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <Bell className="w-3.5 h-3.5 text-[#0057E7]" />
                      <span>Notify me when price drops</span>
                    </button>
                  ) : (
                    <form
                      onSubmit={handlePriceDropSubmit}
                      className="p-3.5 rounded-xl bg-[#F6F8FB] border border-slate-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor="price-drop-email"
                          className="text-xs font-semibold text-[#06142E] flex items-center gap-1.5 min-w-0"
                        >
                          <Bell className="w-3.5 h-3.5 text-[#0057E7] shrink-0" />
                          <span className="truncate">
                            Email me if price drops below ৳{product.price.toLocaleString('en-IN')}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setNotifyOpen(false);
                            setAlertError('');
                          }}
                          aria-label="Cancel price alert"
                          className="text-slate-400 hover:text-slate-700 p-0.5 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          id="price-drop-email"
                          type="email"
                          required
                          maxLength={120}
                          value={alertEmail}
                          onChange={(e) => setAlertEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="flex-1 h-10 sm:h-9 px-3 rounded-lg bg-white border border-slate-200 text-base sm:text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <button
                          type="submit"
                          disabled={alertBusy}
                          className="h-10 sm:h-9 px-4 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                        >
                          {alertBusy ? 'Saving...' : 'Set Price Alert'}
                        </button>
                      </div>

                      {alertError && (
                        <p className="text-[11px] text-red-600 font-medium">{alertError}</p>
                      )}
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
