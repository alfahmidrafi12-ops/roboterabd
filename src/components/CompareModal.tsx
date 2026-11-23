import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BatteryCharging,
  Bot,
  Check,
  Cog,
  Cpu,
  Eye,
  GitCompareArrows,
  Monitor,
  Package,
  Plus,
  Radar,
  Radio,
  ShoppingCart,
  Star,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { isWatermarkedUrl } from '../data/brandMedia';
import { ArtworkKind, Product } from '../types/store';

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

const CompareThumbnail: React.FC<{ product: Product; compact?: boolean }> = ({
  product,
  compact = false,
}) => {
  const [failed, setFailed] = useState(false);
  const rawUrl = product.imageUrl?.trim() || '';
  const showImage = Boolean(rawUrl) && !isWatermarkedUrl(rawUrl) && !failed;

  if (showImage) {
    return (
      <img
        src={rawUrl}
        alt={product.name}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="w-full h-full object-contain object-center"
      />
    );
  }

  const PlaceholderIcon = getNeutralPlaceholderIcon(product.category, product.artwork);

  if (compact) {
    return <PlaceholderIcon className="w-4 h-4 text-[#475569]" strokeWidth={1.6} />;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 text-center select-none px-2">
      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#475569]">
        <PlaceholderIcon className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
        {product.sku}
      </span>
    </div>
  );
};

interface CompareDockProps {
  products: Product[];
  isVisible: boolean;
  limitNotice: boolean;
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  onOpenModal: () => void;
}

export const CompareDock: React.FC<CompareDockProps> = ({
  products,
  isVisible,
  limitNotice,
  onRemoveProduct,
  onClearAll,
  onOpenModal,
}) => {
  if (!isVisible || products.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Product comparison tray"
      className="animate-pop-in fixed bottom-[calc(8.35rem+env(safe-area-inset-bottom))] md:bottom-5 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] max-w-2xl md:max-w-[calc(100vw-24rem)] lg:max-w-2xl"
    >
      <div className="bg-[#071A3D]/95 backdrop-blur-md text-white rounded-2xl border border-[#1E3A6E] shadow-[0_20px_44px_-12px_rgba(7,26,61,0.55)] p-3 sm:px-4 sm:py-3">
        {limitNotice && (
          <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/35 text-amber-200 text-[11px] font-medium flex items-center justify-between gap-2">
            <span>Maximum 3 products can be compared side-by-side. Remove one to swap.</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Selected Items Strip */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar min-w-0">
            <div className="hidden sm:flex items-center gap-1.5 pr-1 shrink-0">
              <GitCompareArrows className="w-4 h-4 text-[#00CFFF]" />
              <span className="font-mono text-[11px] font-bold text-slate-300 tabular-nums">
                {products.length}/3
              </span>
            </div>

            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-2 bg-[#0F2754] border border-white/15 rounded-xl pl-1.5 pr-1.5 py-1 shrink-0 max-w-[175px]"
              >
                <div className="w-7 h-7 rounded-lg bg-[#F7FAFE] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  <CompareThumbnail product={product} compact />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-white truncate leading-tight">
                    {product.name}
                  </p>
                  <p className="font-mono text-[10px] text-[#00CFFF] tabular-nums leading-tight">
                    ৳{product.price.toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveProduct(product.id)}
                  aria-label={`Remove ${product.name} from compare`}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {Array.from({ length: Math.max(0, 3 - products.length) }).map((_, idx) => (
              <div
                key={`empty-slot-${idx}`}
                className="hidden lg:flex items-center justify-center h-9 px-3 rounded-xl border border-dashed border-white/20 text-[10.5px] font-mono text-slate-400 shrink-0"
              >
                + Slot {products.length + idx + 1}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-0.5 sm:pt-0">
            <button
              type="button"
              onClick={onClearAll}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onOpenModal}
              className="h-9 px-3.5 rounded-xl bg-[#087BFF] hover:bg-[#0669DB] text-white text-xs font-bold tracking-[0.03em] inline-flex items-center gap-1.5 whitespace-nowrap shadow-[0_8px_18px_-8px_rgba(8,123,255,0.65)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00CFFF]"
            >
              <GitCompareArrows className="w-3.5 h-3.5 shrink-0" />
              <span>Compare Specs ({products.length})</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CompareModalProps {
  isOpen: boolean;
  products: Product[];
  categoryLabels: Record<string, string>;
  onClose: () => void;
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onQuickViewProduct: (product: Product) => void;
  onBrowseCatalog: () => void;
}

interface ComparisonRow {
  key: string;
  label: string;
  values: string[];
  hasDifference: boolean;
  isSpec?: boolean;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  products,
  categoryLabels,
  onClose,
  onRemoveProduct,
  onClearAll,
  onAddToCart,
  onQuickViewProduct,
  onBrowseCatalog,
}) => {
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const comparisonRows = useMemo<ComparisonRow[]>(() => {
    if (products.length === 0) return [];

    const checkDiff = (vals: string[]) => {
      if (vals.length < 2) return false;
      const normalized = vals.map((v) => v.trim().toLowerCase());
      return new Set(normalized).size > 1;
    };

    const overviewRows: ComparisonRow[] = [
      {
        key: 'department',
        label: 'Department',
        values: products.map((p) => categoryLabels[p.category] || p.categoryLabel),
        hasDifference: checkDiff(products.map((p) => categoryLabels[p.category] || p.categoryLabel)),
      },
      {
        key: 'sku',
        label: 'Model / SKU',
        values: products.map((p) => p.sku),
        hasDifference: checkDiff(products.map((p) => p.sku)),
      },
      {
        key: 'availability',
        label: 'Stock Status',
        values: products.map((p) =>
          p.stock <= 0
            ? 'Out of Stock'
            : p.stock <= 5
            ? `Low Stock (${p.stock} left)`
            : `In Stock (${p.stock} units)`
        ),
        hasDifference: checkDiff(
          products.map((p) => (p.stock <= 0 ? 'out' : p.stock <= 5 ? 'low' : 'in'))
        ),
      },
      {
        key: 'rating',
        label: 'Customer Rating',
        values: products.map((p) =>
          p.reviews > 0 && p.rating > 0
            ? `${p.rating.toFixed(1)} ★ (${p.reviews})`
            : 'No reviews yet'
        ),
        hasDifference: checkDiff(
          products.map((p) => (p.reviews > 0 ? `${p.rating.toFixed(1)}` : 'none'))
        ),
      },
      {
        key: 'variants',
        label: 'Variants / Options',
        values: products.map((p) =>
          p.variants && p.variants.length > 0 ? p.variants.join(', ') : 'Standard Edition'
        ),
        hasDifference: checkDiff(
          products.map((p) =>
            p.variants && p.variants.length > 0 ? p.variants.join(', ') : 'Standard Edition'
          )
        ),
      },
    ];

    // Collect ordered union of technical specifications across selected products
    const specOrder: { normKey: string; displayLabel: string }[] = [];
    const seenKeys = new Set<string>();

    for (const product of products) {
      for (const spec of product.specs) {
        const normKey = spec.label.trim().toLowerCase();
        if (!normKey || seenKeys.has(normKey)) continue;
        seenKeys.add(normKey);
        specOrder.push({ normKey, displayLabel: spec.label.trim() });
      }
    }

    const specRows: ComparisonRow[] = specOrder.map(({ normKey, displayLabel }) => {
      const vals = products.map((product) => {
        const match = product.specs.find((s) => s.label.trim().toLowerCase() === normKey);
        return match?.value?.trim() || '—';
      });
      return {
        key: `spec-${normKey}`,
        label: displayLabel,
        values: vals,
        hasDifference: checkDiff(vals),
        isSpec: true,
      };
    });

    return [...overviewRows, ...specRows];
  }, [products, categoryLabels]);

  const visibleRows = useMemo(() => {
    if (!differencesOnly || products.length < 2) return comparisonRows;
    return comparisonRows.filter((row) => row.hasDifference);
  }, [comparisonRows, differencesOnly, products.length]);

  if (!isOpen || products.length === 0) return null;

  const handleQuickAdd = (product: Product) => {
    if (product.stock <= 0) return;
    onAddToCart(product, 1);
    setRecentlyAddedId(product.id);
    window.setTimeout(() => {
      setRecentlyAddedId((prev) => (prev === product.id ? null : prev));
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
    >
      {/* Backdrop */}
      <div
        className="animate-fade-in fixed inset-0 bg-[#071A3D]/65 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Overlay Container */}
      <div className="animate-modal-in relative z-10 w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="inline-flex items-center gap-2 mb-0.5">
              <span className="h-[2px] w-4 bg-[#087BFF]" aria-hidden="true" />
              <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#087BFF]">
                TECHNICAL COMPARISON
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h2
                id="compare-modal-title"
                className="font-hero text-lg sm:text-2xl font-extrabold text-[#071A3D] tracking-tight"
              >
                Compare Hardware Specifications
              </h2>
              <span className="font-mono text-xs font-semibold text-[#64748B] tabular-nums">
                {products.length} of 3 selected
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {products.length >= 2 && (
              <button
                type="button"
                onClick={() => setDifferencesOnly((prev) => !prev)}
                aria-pressed={differencesOnly}
                className={`h-9 px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  differencesOnly
                    ? 'bg-[#087BFF] border-[#087BFF] text-white'
                    : 'bg-[#F8FAFC] border-slate-200 text-[#334155] hover:border-[#087BFF]/60 hover:text-[#071A3D]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    differencesOnly ? 'bg-white' : 'bg-[#087BFF]'
                  }`}
                />
                <span>Differences Only</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClearAll();
                onClose();
              }}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-xs font-semibold text-[#475569] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close specification comparison modal"
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-[#475569] hover:text-[#071A3D] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Comparison Table */}
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full border-collapse text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 align-top">
                <th
                  scope="col"
                  className="sticky left-0 z-20 w-[150px] sm:w-[190px] min-w-[150px] sm:min-w-[190px] bg-[#F8FAFC] border-r border-slate-200 p-4 align-bottom"
                >
                  <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#64748B]">
                    Parameter
                  </p>
                  <p className="text-xs text-[#475569] font-normal mt-1">
                    Side-by-side component breakdown
                  </p>
                </th>

                {products.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const hasDiscount = Boolean(
                    product.originalPrice && product.originalPrice > product.price
                  );
                  const discountPct =
                    hasDiscount && product.originalPrice
                      ? Math.round(
                          ((product.originalPrice - product.price) / product.originalPrice) * 100
                        )
                      : null;
                  const justAdded = recentlyAddedId === product.id;

                  return (
                    <th
                      key={product.id}
                      scope="col"
                      className="p-4 align-top font-normal border-r border-slate-100 last:border-r-0 min-w-[205px] w-[240px]"
                    >
                      <div className="flex flex-col h-full justify-between gap-3">
                        <div>
                          <div className="relative h-28 rounded-xl bg-[#F7FAFE] border border-slate-200/80 p-3 flex items-center justify-center overflow-hidden mb-3">
                            <button
                              type="button"
                              onClick={() => onQuickViewProduct(product)}
                              className="w-full h-full flex items-center justify-center cursor-pointer focus-visible:outline-none"
                              aria-label={`Quick view ${product.name}`}
                            >
                              <CompareThumbnail product={product} />
                            </button>

                            <button
                              type="button"
                              onClick={() => onRemoveProduct(product.id)}
                              aria-label={`Remove ${product.name} from comparison`}
                              className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/95 border border-slate-200 text-[#64748B] hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#087BFF] truncate">
                            {categoryLabels[product.category] || product.categoryLabel}
                          </p>

                          <button
                            type="button"
                            onClick={() => onQuickViewProduct(product)}
                            className="mt-1 text-left font-hero text-sm font-bold text-[#071A3D] hover:text-[#087BFF] transition-colors line-clamp-2 focus-visible:outline-none focus-visible:underline"
                          >
                            {product.name}
                          </button>

                          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                            <span className="font-mono text-base font-extrabold text-[#071A3D] tabular-nums">
                              ৳{product.price.toLocaleString('en-IN')}
                            </span>
                            {hasDiscount && product.originalPrice && (
                              <span className="font-mono text-xs text-slate-400 line-through tabular-nums">
                                ৳{product.originalPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                            {discountPct && discountPct > 0 && !isOutOfStock && (
                              <span className="font-mono text-[10.5px] font-bold text-[#087BFF] tabular-nums">
                                -{discountPct}%
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => onQuickViewProduct(product)}
                            className="w-full h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-[#F3F7FC] hover:border-[#087BFF]/60 text-[#071A3D] hover:text-[#087BFF] text-[11px] font-bold tracking-[0.03em] inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF]"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span>Quick View</span>
                          </button>

                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => handleQuickAdd(product)}
                            className={`w-full h-9 px-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.04em] inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed ${
                              isOutOfStock
                                ? ''
                                : justAdded
                                ? 'bg-[#071A3D] text-white'
                                : 'bg-[#087BFF] hover:bg-[#0669DB] text-white'
                            }`}
                          >
                            {justAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#00CFFF]" />
                                <span>Added</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </th>
                  );
                })}

                {products.length < 3 && (
                  <th
                    scope="col"
                    className="p-4 align-middle font-normal min-w-[185px] w-[200px] bg-[#FAFBFD]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onBrowseCatalog();
                      }}
                      className="w-full h-44 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#087BFF] bg-white hover:bg-[#F3F7FC] transition-colors flex flex-col items-center justify-center gap-2 p-4 text-center group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#F3F7FC] group-hover:bg-[#087BFF] text-[#087BFF] group-hover:text-white flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-[#071A3D]">Add Another Product</span>
                      <span className="text-[11px] text-[#64748B]">
                        Compare up to 3 items side-by-side
                      </span>
                    </button>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={products.length + (products.length < 3 ? 2 : 1)}
                    className="p-8 text-center text-sm text-[#475569]"
                  >
                    All specification values match across these products. Disable{' '}
                    <button
                      type="button"
                      onClick={() => setDifferencesOnly(false)}
                      className="font-semibold text-[#087BFF] hover:underline"
                    >
                      Differences Only
                    </button>{' '}
                    to inspect all rows.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <tr
                    key={row.key}
                    className={
                      row.hasDifference && products.length >= 2
                        ? 'bg-[#087BFF]/[0.03]'
                        : 'hover:bg-slate-50/70'
                    }
                  >
                    <th
                      scope="row"
                      className={`sticky left-0 z-10 border-r border-slate-200 px-4 py-3 text-xs font-semibold text-[#071A3D] align-top ${
                        row.hasDifference && products.length >= 2
                          ? 'bg-[#F3F8FF]'
                          : 'bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {row.hasDifference && products.length >= 2 && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-[#087BFF] shrink-0"
                            title="Values differ across compared items"
                          />
                        )}
                        <span>{row.label}</span>
                      </div>
                    </th>

                    {row.values.map((val, colIdx) => {
                      const product = products[colIdx];
                      const isMissing = val === '—';
                      return (
                        <td
                          key={`${row.key}-${product.id}`}
                          className={`px-4 py-3 text-xs border-r border-slate-100 last:border-r-0 align-top ${
                            isMissing ? 'text-slate-400 font-mono' : 'text-[#334155] font-medium'
                          } ${row.key === 'sku' ? 'font-mono text-[11.5px]' : ''}`}
                        >
                          {row.key === 'rating' && product.reviews > 0 && product.rating > 0 ? (
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                              <strong className="text-[#071A3D]">
                                {product.rating.toFixed(1)}
                              </strong>
                              <span className="text-[#64748B]">({product.reviews})</span>
                            </span>
                          ) : row.key === 'availability' ? (
                            <span
                              className={`font-semibold tabular-nums ${
                                product.stock <= 0
                                  ? 'text-red-600'
                                  : product.stock <= 5
                                  ? 'text-[#D97706]'
                                  : 'text-[#0F766E]'
                              }`}
                            >
                              {val}
                            </span>
                          ) : (
                            val
                          )}
                        </td>
                      );
                    })}

                    {products.length < 3 && (
                      <td className="px-4 py-3 text-xs text-slate-300 bg-[#FAFBFD] font-mono">
                        —
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-[#F8FAFC] flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-[#64748B]">
            Blue-highlighted rows mark technical differences between selected hardware.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#071A3D] hover:bg-[#087BFF] text-white text-xs font-bold transition-colors whitespace-nowrap"
          >
            Done Comparing
          </button>
        </div>
      </div>
    </div>
  );
};
