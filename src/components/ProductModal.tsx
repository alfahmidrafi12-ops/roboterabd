import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bell,
  BellRing,
  Check,
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
import {
  playAddToCartSound,
  playErrorSound,
  playModalOpenSound,
  playRestockBellSound,
  playStepTickSound,
  playSuccessSound,
  playTapSound,
} from '../lib/sound';
import { resolveProductVideo } from '../lib/video';
import {
  AddToCartResult,
  CartItem,
  LocalPriceWatch,
  LocalRestockWatch,
  Product,
} from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';

interface ProductModalProps {
  product: Product | null;
  allProducts?: Product[];
  cartItems?: CartItem[];
  categoryDisplayName?: string;
  isWishlisted: boolean;
  defaultEmail?: string | null;
  watchedAlert?: LocalPriceWatch | null;
  watchedRestock?: LocalRestockWatch | null;
  zIndexClass?: string;
  onClose: () => void;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    variant?: string,
    silentToast?: boolean
  ) => AddToCartResult | void;
  onBuyNow?: (product: Product, quantity: number, variant?: string) => void;
  onSelectProduct?: (product: Product) => void;
  onSubscribePriceDrop?: (product: Product, email: string) => Promise<void>;
  onSubscribeRestock?: (product: Product, email: string) => Promise<void>;
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

const SHORT_CATEGORY_LABELS: Record<string, string> = {
  microcontrollers: 'Microcontrollers',
  sensors: 'Sensors',
  motors: 'Motors & Drivers',
  power: 'Power & LiPo',
  'robotics-kits': 'Robotics Kits',
  '3d-printing': '3D Printing',
  components: 'Components',
  tools: 'Tools & Soldering',
};

function formatShortCategory(slug: string): string {
  return SHORT_CATEGORY_LABELS[slug] ?? slug.replace(/-/g, ' ');
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  allProducts = [],
  cartItems = [],
  categoryDisplayName,
  isWishlisted,
  defaultEmail,
  watchedAlert,
  watchedRestock,
  zIndexClass = 'z-50',
  onClose,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  onSubscribePriceDrop,
  onSubscribeRestock,
}) => {
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(undefined);
  const [mediaTab, setMediaTab] = useState<'image' | 'video'>('image');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertBusy, setAlertBusy] = useState(false);
  const [alertError, setAlertError] = useState('');
  const [alertSuccess, setAlertSuccess] = useState('');
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockEmail, setRestockEmail] = useState('');
  const [restockBusy, setRestockBusy] = useState(false);
  const [restockError, setRestockError] = useState('');
  const [restockSuccess, setRestockSuccess] = useState('');
  const [heartBurstKey, setHeartBurstKey] = useState(0);
  const [addedPairIds, setAddedPairIds] = useState<Record<string, boolean>>({});
  const [bundleAdded, setBundleAdded] = useState(false);
  const timersRef = useRef<number[]>([]);

  const scheduleTimer = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
  };

  const clearScheduledTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearScheduledTimers();
  }, []);

  const resolvedVideo = useMemo(
    () => resolveProductVideo(product?.videoUrl),
    [product?.videoUrl]
  );

  useEffect(() => {
    clearScheduledTimers();
    if (product) {
      playModalOpenSound();
      setQty(1);
      setSelectedVariant(product.variants?.[0]);
      setMediaTab('image');
      setNotifyOpen(false);
      setAlertError('');
      setAlertSuccess('');
      setRestockOpen(product.stock <= 0);
      setRestockError('');
      setRestockSuccess('');
      setAddedPairIds({});
      setBundleAdded(false);
    }
  }, [product?.id]);

  useEffect(() => {
    if (product) {
      setAlertEmail(watchedAlert?.email || defaultEmail || '');
      setRestockEmail(watchedRestock?.email || defaultEmail || '');
    }
  }, [product?.id, defaultEmail, watchedAlert?.email, watchedRestock?.email]);

  const activeVariant = selectedVariant ?? product?.variants?.[0];
  const currentVariantInCartQty = useMemo(() => {
    if (!product) return 0;
    return (
      cartItems.find(
        (item) => item.product.id === product.id && item.variant === activeVariant
      )?.quantity ?? 0
    );
  }, [cartItems, product, activeVariant]);

  const remainingForModal = product
    ? Math.max(0, product.stock - currentVariantInCartQty)
    : 0;
  const maxSelectableModalQty = remainingForModal > 0 ? remainingForModal : 1;

  useEffect(() => {
    if (product && product.stock > 0 && qty > maxSelectableModalQty) {
      setQty(maxSelectableModalQty);
    }
  }, [product?.stock, maxSelectableModalQty, qty]);

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
  const isAtCartLimit = !isOutOfStock && remainingForModal === 0;
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPct =
    hasDiscount && product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const compatibilityNotes = getCompatibilitySummary(product);

  const pairedTotal = relatedAndPaired.paired.reduce((sum, item) => sum + item.price, 0);

  const handleAddPairedItem = (item: Product) => {
    const res = onAddToCart(item, 1);
    if (!res || res.addedQty > 0) {
      setAddedPairIds((prev) => ({ ...prev, [item.id]: true }));
      scheduleTimer(() => {
        setAddedPairIds((prev) => ({ ...prev, [item.id]: false }));
      }, 1400);
    }
  };

  const handleAddAllPaired = () => {
    if (relatedAndPaired.paired.length === 0) return;
    const nextFlags: Record<string, boolean> = {};
    let addedCount = 0;
    relatedAndPaired.paired.forEach((item) => {
      const res = onAddToCart(item, 1, undefined, true);
      if (!res || res.addedQty > 0) {
        nextFlags[item.id] = true;
        addedCount += 1;
      }
    });
    if (addedCount > 0) {
      playAddToCartSound();
      setAddedPairIds((prev) => ({ ...prev, ...nextFlags }));
      setBundleAdded(true);
      scheduleTimer(() => {
        setBundleAdded(false);
        setAddedPairIds({});
      }, 1600);
    } else {
      playErrorSound();
    }
  };

  const handlePriceDropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubscribePriceDrop || alertBusy) return;
    const trimmed = alertEmail.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      playErrorSound();
      setAlertError('Please enter a valid email address.');
      return;
    }

    setAlertBusy(true);
    setAlertError('');
    setAlertSuccess('');
    try {
      await onSubscribePriceDrop(product, trimmed);
      playSuccessSound();
      setAlertSuccess(
        `Price alert active for ${trimmed}. You'll be notified if ${product.name} drops below ৳${product.price.toLocaleString('en-IN')}.`
      );
      setNotifyOpen(false);
    } catch (err) {
      console.error('Price alert subscription error:', err);
      playErrorSound();
      setAlertError('Could not save price alert right now. Please try again.');
    } finally {
      setAlertBusy(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubscribeRestock || restockBusy) return;
    const trimmed = restockEmail.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      playErrorSound();
      setRestockError('Please enter a valid email address.');
      return;
    }

    setRestockBusy(true);
    setRestockError('');
    setRestockSuccess('');
    try {
      await onSubscribeRestock(product, trimmed);
      playRestockBellSound();
      setRestockSuccess(
        `Restock alert active for ${trimmed}. You'll receive a dashboard & email notification when ${product.name} is back in stock.`
      );
      setRestockOpen(false);
    } catch (err) {
      console.error('Restock alert subscription error:', err);
      playErrorSound();
      setRestockError('Could not save restock alert right now. Please try again.');
    } finally {
      setRestockBusy(false);
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
                    onClick={() => {
                      playTapSound();
                      setMediaTab('image');
                    }}
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
                    onClick={() => {
                      playTapSound();
                      setMediaTab('video');
                    }}
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
                  className={`group card-scan bg-[#F1F5F9] rounded-2xl border border-slate-200/80 ${
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
                    className={
                      product.imageUrl?.trim()
                        ? 'thumb-hover-zoom w-full h-auto max-h-[360px]'
                        : 'thumb-hover-zoom w-full h-full'
                    }
                  />
                  {discountPct && discountPct > 0 && !isOutOfStock && (
                    <span className="absolute top-3 left-3 z-10 text-xs font-mono font-bold text-[#0866F5] bg-white px-2.5 py-0.5 rounded-md border border-blue-100 tabular-nums">
                      Save {discountPct}%
                    </span>
                  )}
                  {resolvedVideo && (
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setMediaTab('video');
                      }}
                      className="motion-press group/btn absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#071A3B] hover:bg-[#087BFF] border border-white/20 hover:border-[#087BFF] text-white text-xs font-semibold shadow-lg transition-all"
                    >
                      <Play className="motion-icon-tilt w-3.5 h-3.5 fill-current" />
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
                    onClick={() => {
                      playTapSound();
                      setMediaTab('image');
                    }}
                    className={`motion-press group flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
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
                        className="thumb-hover-zoom w-full h-full"
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
                    onClick={() => {
                      playTapSound();
                      setMediaTab('video');
                    }}
                    className={`motion-press group flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                      mediaTab === 'video'
                        ? 'bg-[#071A3B] border-[#087BFF] ring-2 ring-[#087BFF]/20 text-white'
                        : 'bg-[#071A3B]/95 border-[#071A3B] hover:border-[#087BFF] text-white/90'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-lg bg-[#0F2754] border border-white/15 shrink-0 flex items-center justify-center text-[#00CFFF]">
                      <Play className="motion-icon-tilt w-4 h-4 fill-current ml-0.5" />
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
                <div className="group flex items-start gap-2">
                  <Truck className="motion-icon-tilt w-4 h-4 text-[#0866F5] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#101828]">Delivery:</strong> Inside Dhaka 2–3 days (৳80) ·
                    Outside Dhaka 2–4 days (৳150)
                  </span>
                </div>
                <div className="group flex items-start gap-2">
                  <ShieldCheck className="motion-icon-tilt w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
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
                          onClick={() => {
                            playTapSound();
                            setSelectedVariant(variant);
                          }}
                          className={`motion-pill px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
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
                      disabled={isOutOfStock || isAtCartLimit || qty <= 1}
                      onClick={() => {
                        playStepTickSound(false);
                        setQty((prev) => Math.max(1, prev - 1));
                      }}
                      aria-label="Decrease quantity"
                      className="motion-press w-9 h-full flex items-center justify-center text-[#64748B] hover:text-[#101828] disabled:opacity-35"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span
                      key={qty}
                      className="animate-qty-pop w-7 sm:w-8 text-center font-mono text-sm font-semibold text-[#101828] tabular-nums"
                    >
                      {isOutOfStock || isAtCartLimit ? 0 : qty}
                    </span>
                    <button
                      type="button"
                      disabled={isOutOfStock || isAtCartLimit || qty >= maxSelectableModalQty}
                      onClick={() => {
                        playStepTickSound(true);
                        setQty((prev) => Math.min(maxSelectableModalQty, prev + 1));
                      }}
                      aria-label="Increase quantity"
                      className="motion-press w-9 h-full flex items-center justify-center text-[#64748B] hover:text-[#101828] disabled:opacity-35"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => {
                      if (isOutOfStock) return;
                      const requested = isAtCartLimit
                        ? 1
                        : Math.min(qty, maxSelectableModalQty);
                      const res = onAddToCart(product, requested, selectedVariant);
                      if (!res || res.addedQty > 0) {
                        onClose();
                      }
                    }}
                    className={`motion-press cta-sheen flex-1 min-w-0 h-11 px-3 sm:px-4 rounded-xl transition-all disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap border ${
                      isOutOfStock
                        ? ''
                        : isAtCartLimit
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-[#071A3D]'
                        : 'bg-[#0866F5] hover:bg-[#0866F5]/90 border-[#0866F5] hover:border-[#1685FF] text-white'
                    }`}
                  >
                    {isAtCartLimit ? (
                      <>
                        <Check className="w-4 h-4 shrink-0 text-[#0866F5]" />
                        <span className="truncate">Max in Cart ({currentVariantInCartQty})</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 shrink-0" />
                        <span className="truncate">{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isWishlisted) {
                        setHeartBurstKey((k) => k + 1);
                      }
                      onToggleWishlist(product.id);
                    }}
                    aria-label={isWishlisted ? 'Remove from saved' : 'Save item'}
                    className={`group/heart motion-press relative w-11 h-11 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                      isWishlisted
                        ? 'bg-[#071A3B] hover:bg-[#071A3B]/90 border-[#071A3B] text-white'
                        : 'bg-white border-slate-200 text-[#64748B] hover:text-[#0866F5] hover:bg-[#0866F5]/[0.06] hover:border-[#0866F5]/45'
                    }`}
                  >
                    {heartBurstKey > 0 && isWishlisted && (
                      <span
                        key={heartBurstKey}
                        aria-hidden="true"
                        className="animate-heart-burst pointer-events-none absolute inset-0 rounded-xl border-2 border-[#00CFFF]"
                      />
                    )}
                    <Heart className={`icon-hover-beat w-4 h-4 ${isWishlisted ? 'fill-current animate-icon-pop' : ''}`} />
                  </button>
                </div>

                {onBuyNow && !isOutOfStock && (
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      const requested = isAtCartLimit
                        ? 1
                        : Math.min(qty, maxSelectableModalQty);
                      onBuyNow(product, requested, selectedVariant);
                    }}
                    className="motion-press cta-sheen w-full h-11 rounded-xl bg-[#071A3B] hover:bg-[#071A3B]/90 border border-[#071A3B] hover:border-[#EA580C]/65 text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all"
                  >
                    <Zap className="w-4 h-4 text-[#FB923C]" />
                    <span>Buy Now — Express Checkout</span>
                  </button>
                )}

                {/* Back-in-Stock Alert (Shown when Out of Stock) */}
                {isOutOfStock && onSubscribeRestock && (
                  <div className="pt-1">
                    {restockSuccess ? (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{restockSuccess}</span>
                      </div>
                    ) : watchedRestock && !restockOpen ? (
                      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-[#071A3B] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <BellRing className="w-4 h-4 text-emerald-600 shrink-0 animate-bell-ring" />
                          <span className="truncate font-medium">
                            Restock alert active for {watchedRestock.email}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            playTapSound();
                            setRestockOpen(true);
                          }}
                          className="text-[11px] font-semibold text-emerald-700 hover:underline whitespace-nowrap shrink-0"
                        >
                          Update email
                        </button>
                      </div>
                    ) : !restockOpen ? (
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setRestockOpen(true);
                        }}
                        className="w-full h-10 rounded-xl border border-[#071A3D] bg-[#071A3D] hover:bg-[#087BFF] hover:border-[#087BFF] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <Bell className="w-3.5 h-3.5 text-[#00CFFF]" />
                        <span>Notify Me When Back in Stock</span>
                      </button>
                    ) : (
                      <form
                        onSubmit={handleRestockSubmit}
                        className="p-3.5 rounded-xl bg-[#071A3D]/[0.04] border border-[#087BFF]/35 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label
                            htmlFor="restock-alert-email"
                            className="text-xs font-semibold text-[#071A3B] flex items-center gap-1.5 min-w-0"
                          >
                            <Bell className="w-3.5 h-3.5 text-[#087BFF] shrink-0" />
                            <span className="truncate">
                              Notify me by dashboard &amp; email when restocked
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setRestockOpen(false);
                              setRestockError('');
                            }}
                            aria-label="Cancel restock alert"
                            className="text-slate-400 hover:text-slate-700 p-0.5 shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            id="restock-alert-email"
                            type="email"
                            required
                            maxLength={120}
                            value={restockEmail}
                            onChange={(e) => setRestockEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="flex-1 h-10 sm:h-9 px-3 rounded-lg bg-white border border-slate-200 text-base sm:text-xs text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0866F5]"
                          />
                          <button
                            type="submit"
                            disabled={restockBusy}
                            className="h-10 sm:h-9 px-4 rounded-lg bg-[#071A3D] hover:bg-[#087BFF] disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                          >
                            {restockBusy ? 'Saving...' : 'Notify Back in Stock'}
                          </button>
                        </div>

                        {restockError && (
                          <p className="text-[11px] text-red-600 font-medium">{restockError}</p>
                        )}
                      </form>
                    )}
                  </div>
                )}

                {/* Notify me when price drops */}
                {!isOutOfStock && onSubscribePriceDrop && (
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
                          onClick={() => {
                            playTapSound();
                            setNotifyOpen(true);
                          }}
                          className="text-[11px] font-semibold text-[#0866F5] hover:underline whitespace-nowrap shrink-0"
                        >
                          Update alert
                        </button>
                      </div>
                    ) : !notifyOpen ? (
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setNotifyOpen(true);
                        }}
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
                          className={`spec-row-hover ${idx % 2 === 0 ? 'bg-[#F5F8FC]' : 'bg-white'}`}
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
                  <li key={idx} className="motion-row rounded-lg px-1.5 py-1 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0866F5] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Frequently Bought Together & Related Hardware */}
          {(relatedAndPaired.paired.length > 0 || relatedAndPaired.related.length > 0) && (
            <div className="pt-6 border-t border-slate-200 space-y-7">
              {relatedAndPaired.paired.length > 0 && (
                <section aria-label="Frequently Bought Together">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-display text-[15px] font-bold text-[#071A3B] tracking-tight">
                        Frequently Bought Together
                      </h3>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Verified build companions ready in Dhaka warehouse
                      </p>
                    </div>
                    {relatedAndPaired.paired.length > 1 && (
                      <button
                        type="button"
                        onClick={handleAddAllPaired}
                        className={`cta-sheen motion-press inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          bundleAdded
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-[#071A3B] hover:bg-[#0866F5] text-white shadow-xs'
                        }`}
                      >
                        {bundleAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added All ({relatedAndPaired.paired.length})</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>
                              Add All {relatedAndPaired.paired.length} · ৳{pairedTotal.toLocaleString('en-IN')}
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {relatedAndPaired.paired.map((item) => {
                      const pairHasDiscount = Boolean(
                        item.originalPrice && item.originalPrice > item.price
                      );
                      const pairDiscountPct =
                        pairHasDiscount && item.originalPrice
                          ? Math.round(
                              ((item.originalPrice - item.price) / item.originalPrice) * 100
                            )
                          : null;
                      const pairSpec = item.specs[0]
                        ? `${item.specs[0].label}: ${item.specs[0].value}`
                        : item.sku;
                      const isItemAdded = Boolean(addedPairIds[item.id]);

                      return (
                        <div
                          key={`pair-${item.id}`}
                          className="group motion-card flex flex-col justify-between p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-[#0866F5]/45 hover:shadow-[0_14px_28px_-18px_rgba(7,26,59,0.22)] transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => onSelectProduct?.(item)}
                              className="w-16 h-16 rounded-xl bg-[#F8FAFD] border border-slate-200/80 p-1.5 shrink-0 flex items-center justify-center overflow-hidden"
                              aria-label={`View ${item.name}`}
                            >
                              <HardwareArtwork
                                kind={item.artwork}
                                imageUrl={item.imageUrl}
                                alt={item.name}
                                fit="contain"
                                className="thumb-hover-zoom w-full h-full"
                              />
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-[11px] leading-none">
                                <span className="font-semibold text-[#0866F5] truncate">
                                  {formatShortCategory(item.category)}
                                </span>
                                <span className="text-slate-300" aria-hidden="true">
                                  ·
                                </span>
                                <span className="inline-flex items-center gap-0.5 text-[#64748B] font-mono shrink-0">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                  {item.rating.toFixed(1)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => onSelectProduct?.(item)}
                                className="text-left w-full mt-1"
                              >
                                <p className="font-display text-[13px] font-bold text-[#071A3B] group-hover:text-[#0866F5] leading-snug line-clamp-2 transition-colors">
                                  {item.name}
                                </p>
                              </button>

                              <p className="font-mono text-[10.5px] text-[#64748B] line-clamp-1 mt-1">
                                {pairSpec}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
                              <span className="font-mono text-sm font-bold text-[#071A3B] tabular-nums">
                                ৳{item.price.toLocaleString('en-IN')}
                              </span>
                              {pairHasDiscount && item.originalPrice && (
                                <span className="font-mono text-[11px] text-slate-400 line-through tabular-nums">
                                  ৳{item.originalPrice.toLocaleString('en-IN')}
                                </span>
                              )}
                              {pairDiscountPct !== null && (
                                <span className="font-mono text-[10.5px] font-semibold text-emerald-600 tabular-nums">
                                  -{pairDiscountPct}%
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddPairedItem(item)}
                              className={`cta-sheen motion-press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                                isItemAdded
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-[#0866F5] hover:bg-[#0654CC] text-white'
                              }`}
                            >
                              {isItemAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {relatedAndPaired.related.length > 0 && (
                <section aria-label="Related Components">
                  <div className="flex items-center justify-between gap-3 mb-3.5">
                    <h3 className="font-display text-[15px] font-bold text-[#071A3B] tracking-tight">
                      Related Components
                    </h3>
                    <span className="text-xs text-[#64748B]">Same category alternatives</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {relatedAndPaired.related.map((item) => (
                      <button
                        key={`rel-${item.id}`}
                        type="button"
                        onClick={() => onSelectProduct?.(item)}
                        className="group motion-card flex items-center gap-3 p-3 rounded-2xl border border-slate-200/90 bg-white hover:border-[#0866F5]/45 hover:shadow-[0_12px_24px_-18px_rgba(7,26,59,0.2)] text-left transition-all"
                      >
                        <div className="w-14 h-14 rounded-xl bg-[#F8FAFD] border border-slate-200/80 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                          <HardwareArtwork
                            kind={item.artwork}
                            imageUrl={item.imageUrl}
                            alt={item.name}
                            fit="contain"
                            className="thumb-hover-zoom w-full h-full"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10.5px] font-medium text-[#64748B] truncate">
                            {formatShortCategory(item.category)} · ★ {item.rating.toFixed(1)}
                          </p>
                          <p className="font-display text-[13px] font-bold text-[#071A3B] group-hover:text-[#0866F5] transition-colors line-clamp-1 mt-0.5">
                            {item.name}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="font-mono text-xs font-bold text-[#0866F5] tabular-nums">
                              ৳{item.price.toLocaleString('en-IN')}
                            </p>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0866F5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
