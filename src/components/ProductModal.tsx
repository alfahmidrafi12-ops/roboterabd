import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Heart,
  Image as ImageIcon,
  Layers,
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
  allProducts?: Product[];
  categoryDisplayName?: string;
  isWishlisted: boolean;
  defaultEmail?: string | null;
  watchedAlert?: LocalPriceWatch | null;
  zIndexClass?: string;
  onClose: () => void;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number, variant?: string) => void;
  onBuyNow?: (product: Product, quantity: number, variant?: string) => void;
  onSelectProduct?: (product: Product) => void;
  onSubscribePriceDrop?: (product: Product, email: string) => Promise<void>;
}

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

function getCompatibilitySummary(product: Product): string[] {
  const specsText = product.specs.map((s) => `${s.label} ${s.value}`).join(' ').toLowerCase();
  const notes: string[] = [];

  if (specsText.includes('3.3v')) {
    notes.push('Compatible with 3.3V logic boards (ESP32, Raspberry Pi, STM32).');
  } else if (specsText.includes('5v')) {
    notes.push('Compatible with 5V TTL systems (Arduino Uno/Mega) and level-shifted 3.3V MCUs.');
  } else {
    notes.push('Standard maker & university robotics breadboard/chassis mounting compatible.');
  }

  if (specsText.includes('i2c') || specsText.includes('spi') || specsText.includes('uart')) {
    notes.push('Supports standard serial bus protocols (I2C / SPI / UART) with open-source libraries.');
  } else if (specsText.includes('xt60') || product.category === 'power') {
    notes.push('Verify polarity and discharge C-rating before connecting to ESCs or buck regulators.');
  } else if (product.category === 'motors' || product.category === 'robotics-kits') {
    notes.push('Recommended to power actuators from an isolated regulated rail rather than MCU pins.');
  }

  return notes;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  allProducts = [],
  categoryDisplayName,
  isWishlisted,
  defaultEmail,
  watchedAlert,
  zIndexClass = 'z-50',
  onClose,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
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

  const relatedAndPaired = useMemo(() => {
    if (!product || allProducts.length === 0) return { related: [] as Product[], paired: [] as Product[] };
    const others = allProducts.filter((p) => p.id !== product.id && p.stock > 0);
    const sameCat = others.filter((p) => p.category === product.category).slice(0, 3);
    const complementary = others
      .filter((p) => p.category !== product.category)
      .slice(0, 3);
    return {
      related: sameCat.length > 0 ? sameCat : others.slice(0, 3),
      paired: complementary,
    };
  }, [product, allProducts]);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPct =
    hasDiscount && product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const compatibilityNotes = getCompatibilitySummary(product);

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
    <div className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-2 sm:p-4`}>
      <div
        className="animate-fade-in fixed inset-0 bg-[#071A3B]/65 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdp-title"
        className="animate-pop-in relative z-10 w-full max-w-4xl max-h-[92dvh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
      >
        {/* Modal Top Bar */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 bg-[#F5F8FC]">
          <div className="flex items-center gap-2 text-xs text-[#64748B] min-w-0">
            <span className="font-semibold text-[#0866F5] truncate">
              {categoryDisplayName || product.categoryLabel}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono shrink-0 text-[#071A3B] font-medium">{product.sku}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product details"
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#101828] hover:bg-white shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto overflow-x-hidden p-4 sm:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
            {/* Left Gallery & Shipping Summary */}
            <div className="md:col-span-5 space-y-3.5">
              {resolvedVideo && (
                <div className="grid grid-cols-2 gap-1 p-1 bg-[#F5F8FC] rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setMediaTab('image')}
                    className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                      mediaTab === 'image'
                        ? 'bg-white text-[#071A3B] border-slate-200/90'
                        : 'border-transparent text-[#64748B] hover:text-[#101828] hover:bg-white/60'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaTab('video')}
                    className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                      mediaTab === 'video'
                        ? 'bg-[#0866F5] text-white border-[#0866F5]'
                        : 'border-transparent text-[#64748B] hover:text-[#0866F5] hover:bg-[#0866F5]/[0.06]'
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
                    <div className="aspect-video w-full p-5 flex flex-col items-center justify-center text-center bg-[#071A3B] text-white space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#0866F5] flex items-center justify-center">
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
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-[#071A3B] text-xs font-bold hover:bg-blue-50 transition-colors"
                      >
                        <span>Open Demo Video</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                  <div className="px-3 py-2 bg-[#071A3B] text-[11px] text-slate-300 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Video className="w-3.5 h-3.5 text-[#1685FF]" />
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
                  className={`bg-[#F1F5F9] rounded-2xl border border-slate-200/80 ${
                    product.imageUrl?.trim()
                      ? 'p-3 sm:p-4 min-h-[240px] sm:min-h-[280px]'
                      : 'p-6 aspect-square'
                  } flex items-center justify-center relative overflow-hidden`}
                >
                  <HardwareArtwork
                    kind={product.artwork}
                    imageUrl={product.imageUrl}
                    alt={product.name}
                    fit="contain"
                    className={product.imageUrl?.trim() ? 'w-full h-auto max-h-[360px]' : 'w-full h-full'}
                  />
                  {discountPct && discountPct > 0 && !isOutOfStock && (
                    <span className="absolute top-3 left-3 text-xs font-mono font-bold text-[#0866F5] bg-white px-2.5 py-0.5 rounded-md border border-blue-100 tabular-nums">
                      Save {discountPct}%
                    </span>
                  )}
                  {resolvedVideo && (
                    <button
                      type="button"
                      onClick={() => setMediaTab('video')}
                      className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#071A3B] hover:bg-[#087BFF] border border-white/20 hover:border-[#087BFF] text-white text-xs font-semibold shadow-lg transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Watch Demo</span>
                    </button>
                  )}
                </div>
              )}

              {/* Media Gallery Thumbnail Strip (Shown when Product Demo Video is available) */}
              {resolvedVideo && (
                <div
                  role="tablist"
                  aria-label="Product media gallery"
                  className="grid grid-cols-2 gap-2.5"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mediaTab === 'image'}
                    onClick={() => setMediaTab('image')}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                      mediaTab === 'image'
                        ? 'bg-white border-[#087BFF] ring-2 ring-[#087BFF]/15'
                        : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-lg bg-[#F1F5F9] border border-slate-200/80 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                      <HardwareArtwork
                        kind={product.artwork}
                        imageUrl={product.imageUrl}
                        alt={product.name}
                        fit="contain"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#071A3D] truncate">Hardware Photo</p>
                      <p className="text-[10px] font-mono text-[#64748B] truncate">Studio View</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={mediaTab === 'video'}
                    onClick={() => setMediaTab('video')}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                      mediaTab === 'video'
                        ? 'bg-[#071A3B] border-[#087BFF] ring-2 ring-[#087BFF]/20 text-white'
                        : 'bg-[#071A3B]/95 border-[#071A3B] hover:border-[#087BFF] text-white/90'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-lg bg-[#0F2754] border border-white/15 shrink-0 flex items-center justify-center text-[#00CFFF]">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-white truncate">Demo Video</p>
                      <p className="text-[10px] font-mono text-[#00CFFF] truncate">
                        {resolvedVideo.kind === 'external' ? 'External Video' : resolvedVideo.provider}
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {/* Shipping & Quality Assurance Box */}
              <div className="bg-[#F1F5F9] rounded-xl border border-slate-200/80 p-3.5 space-y-2 text-xs text-[#64748B]">
                <div className="flex items-start gap-2">
                  <Truck className="w-4 h-4 text-[#0866F5] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#101828]">Delivery:</strong> Inside Dhaka 2–3 days (৳80) ·
                    Outside Dhaka 2–4 days (৳150) · Free ≥ ৳3,000
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#101828]">Assurance:</strong> ESD-packed &amp; bench-tested
                    prior to dispatch · 7-day replacement
                  </span>
                </div>
              </div>
            </div>

            {/* Right Purchase Module & Technical Specs */}
            <div className="md:col-span-7 flex flex-col min-w-0">
              <h2 id="pdp-title" className="font-display text-xl sm:text-2xl font-bold text-[#071A3B] leading-snug">
                {product.name}
              </h2>

              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-semibold text-[#101828] tabular-nums">{product.rating.toFixed(1)}</span>
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

              <div className="mt-4 flex items-baseline gap-3 flex-wrap">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-[#071A3B] tabular-nums">
                  ৳{product.price.toLocaleString('en-IN')}
                </span>
                {hasDiscount && product.originalPrice && (
                  <span className="font-mono text-sm text-slate-400 line-through tabular-nums">
                    ৳{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {discountPct && discountPct > 0 && (
                  <span className="text-xs font-mono font-bold text-[#0866F5] bg-[#EFF6FF] px-2 py-0.5 rounded">
                    -{discountPct}% OFF
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm text-[#64748B] leading-relaxed">{product.shortDesc}</p>

              {/* Variant Picker */}
              {product.variants && product.variants.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-[#101828] mb-2">Configuration</p>
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
                              ? 'bg-[#071A3B] border-[#071A3B] text-white'
                              : 'bg-white border-slate-200 text-[#101828] hover:border-slate-300'
                          }`}
                        >
                          {variant}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Purchase Controls */}
              <div className="mt-5 pt-4 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-[#F5F8FC] h-11 shrink-0">
                    <button
                      type="button"
                      disabled={isOutOfStock || qty <= 1}
                      onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                      aria-label="Decrease quantity"
                      className="w-9 h-full flex items-center justify-center text-[#64748B] hover:text-[#101828] disabled:opacity-35"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-7 sm:w-8 text-center font-mono text-sm font-semibold text-[#101828] tabular-nums">
                      {isOutOfStock ? 0 : qty}
                    </span>
                    <button
                      type="button"
                      disabled={isOutOfStock || qty >= product.stock}
                      onClick={() => setQty((prev) => Math.min(product.stock, prev + 1))}
                      aria-label="Increase quantity"
                      className="w-9 h-full flex items-center justify-center text-[#64748B] hover:text-[#101828] disabled:opacity-35"
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
                    className="flex-1 min-w-0 h-11 px-3 sm:px-4 rounded-xl bg-[#0866F5] hover:bg-[#0866F5]/90 border border-[#0866F5] hover:border-[#1685FF] text-white transition-colors disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap"
                  >
                    <ShoppingCart className="w-4 h-4 shrink-0" />
                    <span className="truncate">{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleWishlist(product.id)}
                    aria-label={isWishlisted ? 'Remove from saved' : 'Save item'}
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-colors shrink-0 ${
                      isWishlisted
                        ? 'bg-[#071A3B] hover:bg-[#071A3B]/90 border-[#071A3B] text-white'
                        : 'bg-white border-slate-200 text-[#64748B] hover:text-[#0866F5] hover:bg-[#0866F5]/[0.06] hover:border-[#0866F5]/45'
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
                    className="w-full h-11 rounded-xl bg-[#071A3B] hover:bg-[#071A3B]/90 border border-[#071A3B] hover:border-[#EA580C]/65 text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <Zap className="w-4 h-4 text-[#FB923C]" />
                    <span>Buy Now — Express Checkout</span>
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
                      <div className="p-3 rounded-xl bg-[#EFF6FF] border border-blue-200 text-xs text-[#071A3B] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <BellRing className="w-4 h-4 text-[#0866F5] shrink-0" />
                          <span className="truncate">
                            Price alert active below ৳{watchedAlert.baselinePrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotifyOpen(true)}
                          className="text-[11px] font-semibold text-[#0866F5] hover:underline whitespace-nowrap shrink-0"
                        >
                          Update alert
                        </button>
                      </div>
                    ) : !notifyOpen ? (
                      <button
                        type="button"
                        onClick={() => setNotifyOpen(true)}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-[#F5F8FC] hover:bg-slate-100 text-[#071A3B] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <Bell className="w-3.5 h-3.5 text-[#0866F5]" />
                        <span>Notify me when price drops</span>
                      </button>
                    ) : (
                      <form
                        onSubmit={handlePriceDropSubmit}
                        className="p-3.5 rounded-xl bg-[#F5F8FC] border border-slate-200 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label
                            htmlFor="price-drop-email"
                            className="text-xs font-semibold text-[#071A3B] flex items-center gap-1.5 min-w-0"
                          >
                            <Bell className="w-3.5 h-3.5 text-[#0866F5] shrink-0" />
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
                            className="flex-1 h-10 sm:h-9 px-3 rounded-lg bg-white border border-slate-200 text-base sm:text-xs text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0866F5]"
                          />
                          <button
                            type="submit"
                            disabled={alertBusy}
                            className="h-10 sm:h-9 px-4 rounded-lg bg-[#0866F5] hover:bg-[#0654CC] disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
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

          {/* Engineering Specifications Table & Compatibility Info */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 border-t border-slate-200">
            {product.specs.length > 0 && (
              <div className="md:col-span-7">
                <h3 className="font-display text-sm font-bold text-[#071A3B] mb-3 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#0866F5]" />
                  <span>Technical Specifications</span>
                </h3>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-200">
                      {product.specs.map((spec, idx) => (
                        <tr
                          key={spec.label}
                          className={idx % 2 === 0 ? 'bg-[#F5F8FC]' : 'bg-white'}
                        >
                          <th
                            scope="row"
                            className="px-4 py-2.5 text-left font-medium text-[#64748B] w-2/5"
                          >
                            {spec.label}
                          </th>
                          <td className="px-4 py-2.5 font-mono font-semibold text-[#101828] break-words">
                            {spec.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className={product.specs.length > 0 ? 'md:col-span-5' : 'md:col-span-12'}>
              <h3 className="font-display text-sm font-bold text-[#071A3B] mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0866F5]" />
                <span>Compatibility &amp; Integration</span>
              </h3>
              <ul className="bg-[#F5F8FC] rounded-xl border border-slate-200 p-4 space-y-2.5 text-xs text-[#64748B]">
                {compatibilityNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0866F5] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Frequently Bought Together & Related Hardware */}
          {(relatedAndPaired.paired.length > 0 || relatedAndPaired.related.length > 0) && (
            <div className="pt-6 border-t border-slate-200 space-y-5">
              {relatedAndPaired.paired.length > 0 && (
                <div>
                  <h3 className="font-display text-sm font-bold text-[#071A3B] mb-3">
                    Frequently Bought Together
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {relatedAndPaired.paired.map((item) => (
                      <div
                        key={`pair-${item.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-[#F5F8FC] hover:border-[#0866F5]/50 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => onSelectProduct?.(item)}
                          className="w-12 h-12 rounded-lg bg-white border border-slate-200 p-1 shrink-0 flex items-center justify-center"
                        >
                          <HardwareArtwork
                            kind={item.artwork}
                            imageUrl={item.imageUrl}
                            alt={item.name}
                            fit="contain"
                            className="w-full h-full"
                          />
                        </button>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => onSelectProduct?.(item)}
                            className="text-left w-full"
                          >
                            <p className="font-display text-xs font-semibold text-[#101828] hover:text-[#0866F5] line-clamp-1">
                              {item.name}
                            </p>
                          </button>
                          <p className="font-mono text-xs font-bold text-[#071A3B] mt-0.5 tabular-nums">
                            ৳{item.price.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onAddToCart(item, 1)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#0866F5] hover:bg-[#0654CC] text-white text-[11px] font-semibold shrink-0"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedAndPaired.related.length > 0 && (
                <div>
                  <h3 className="font-display text-sm font-bold text-[#071A3B] mb-3">
                    Related Components
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {relatedAndPaired.related.map((item) => (
                      <button
                        key={`rel-${item.id}`}
                        type="button"
                        onClick={() => onSelectProduct?.(item)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-[#F5F8FC] hover:border-[#0866F5]/50 text-left transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg bg-[#F5F8FC] border border-slate-200 p-1 shrink-0 flex items-center justify-center">
                          <HardwareArtwork
                            kind={item.artwork}
                            imageUrl={item.imageUrl}
                            alt={item.name}
                            fit="contain"
                            className="w-full h-full"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-xs font-semibold text-[#101828] line-clamp-1">
                            {item.name}
                          </p>
                          <p className="font-mono text-xs font-bold text-[#0866F5] mt-0.5 tabular-nums">
                            ৳{item.price.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
