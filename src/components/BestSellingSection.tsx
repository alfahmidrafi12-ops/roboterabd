import React, { useState } from 'react';
import {
  ArrowUpDown,
  ChevronDown,
  Cpu,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  AvailabilityFilter,
  CategoryId,
  CategoryItem,
  Product,
  SortOption,
} from '../types/store';
import { ProductCard } from './ProductCard';

interface BestSellingSectionProps {
  products: Product[];
  categories: CategoryItem[];
  activeCategory: CategoryId;
  searchQuery: string;
  minPrice: string;
  maxPrice: string;
  availabilityFilter: AvailabilityFilter;
  sortBy: SortOption;
  wishlistIds: string[];
  onSelectCategory: (id: CategoryId) => void;
  onSearchChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onAvailabilityChange: (value: AvailabilityFilter) => void;
  onSortChange: (sort: SortOption) => void;
  onClearFilters: () => void;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenDetail: (product: Product) => void;
}

const TECH_FILTER_KEYWORDS = [
  '3.3V',
  '5V',
  'USB-C',
  'UART',
  'I2C',
  'SPI',
  'PWM',
  'Brushless',
  'LiDAR',
  'XT60',
  'ESP32',
];

export const BestSellingSection: React.FC<BestSellingSectionProps> = ({
  products,
  categories,
  activeCategory,
  searchQuery,
  minPrice,
  maxPrice,
  availabilityFilter,
  sortBy,
  wishlistIds,
  onSelectCategory,
  onSearchChange,
  onMinPriceChange,
  onMaxPriceChange,
  onAvailabilityChange,
  onSortChange,
  onClearFilters,
  onToggleWishlist,
  onAddToCart,
  onOpenDetail,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filterTabs: { id: CategoryId; label: string }[] = [
    { id: 'all', label: 'All Hardware' },
    ...categories
      .filter((c) => c.active !== false)
      .map((c) => ({ id: c.id, label: c.name })),
  ];

  const categoryLabels = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categories) {
      map[c.id] = c.name;
    }
    return map;
  }, [categories]);

  const activeCategoryName =
    activeCategory === 'all' ? null : categoryLabels[activeCategory];

  const hasAnyFilter = Boolean(
    searchQuery.trim() ||
      activeCategory !== 'all' ||
      sortBy !== 'featured' ||
      minPrice.trim() ||
      maxPrice.trim() ||
      availabilityFilter !== 'all'
  );

  const activeAdvancedCount =
    (minPrice.trim() || maxPrice.trim() ? 1 : 0) +
    (availabilityFilter !== 'all' ? 1 : 0);

  const handleToggleTechKeyword = (keyword: string) => {
    const tokens = searchQuery.trim().split(/\s+/).filter(Boolean);
    const exists = tokens.some((t) => t.toLowerCase() === keyword.toLowerCase());
    if (exists) {
      onSearchChange(tokens.filter((t) => t.toLowerCase() !== keyword.toLowerCase()).join(' '));
    } else {
      onSearchChange([...tokens, keyword].join(' '));
    }
  };

  const applyPricePreset = (min: string, max: string) => {
    onMinPriceChange(min);
    onMaxPriceChange(max);
  };

  return (
    <section
      id="best-selling"
      className="scroll-mt-20 py-10 sm:py-12 lg:py-16 bg-[#F9FBFD] border-y border-slate-200/70"
    >
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5 sm:mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#06142E] tracking-tight">
              {activeCategoryName ? activeCategoryName : 'Best Selling Hardware'}
            </h2>
            {hasAnyFilter && (
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span>
                  Showing <strong className="font-mono tabular-nums">{products.length}</strong> items
                  {searchQuery ? ` matching "${searchQuery}"` : ''}
                  {availabilityFilter !== 'all' ? ` · ${availabilityFilter.replace('-', ' ')}` : ''}
                  {minPrice || maxPrice
                    ? ` · ৳${minPrice || '0'}–${maxPrice ? `৳${maxPrice}` : 'Any'}`
                    : ''}
                </span>
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="inline-flex items-center gap-1 text-[#0057E7] font-semibold hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset all
                </button>
              </div>
            )}
          </div>

          {/* Search, Advanced Filter Toggle & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            {/* Inline Real-Time Technical Search Input */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search model, SKU, or specs (3.3V, I2C...)"
                aria-label="Filter hardware catalog by name, SKU, or technical keywords"
                className="w-full h-10 pl-9 pr-8 rounded-lg bg-white border border-slate-200 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear filter search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen((prev) => !prev)}
                aria-expanded={filtersOpen}
                className={`h-10 px-3.5 rounded-lg border text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                  filtersOpen || activeAdvancedCount > 0
                    ? 'bg-[#06142E] border-[#06142E] text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeAdvancedCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#0057E7] text-white text-[10px] font-mono tabular-nums">
                    {activeAdvancedCount}
                  </span>
                )}
              </button>

              {/* Sorting Dropdown */}
              <div className="relative flex-1 sm:flex-initial shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value as SortOption)}
                  aria-label="Sort products"
                  className="w-full sm:w-52 h-10 pl-8 pr-8 rounded-lg bg-white border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 hover:border-slate-300 transition-colors"
                >
                  <option value="featured">Sort: Best Selling</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Advanced Filters: Price Range, Availability & Technical Keywords */}
        {filtersOpen && (
          <div className="mb-5 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Price Range */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="block text-xs font-semibold text-[#06142E]">
                  Price Range (BDT)
                </label>
                <div className="grid grid-cols-[1fr_auto_1fr] sm:flex sm:flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#F6F8FB] border border-slate-200 rounded-lg px-2.5 h-9 min-w-0">
                    <span className="text-xs text-slate-500">৳</span>
                    <input
                      type="number"
                      min={0}
                      value={minPrice}
                      onChange={(e) => onMinPriceChange(e.target.value)}
                      placeholder="Min"
                      aria-label="Minimum price"
                      className="w-full sm:w-20 bg-transparent text-base sm:text-xs font-mono text-slate-900 focus:outline-none"
                    />
                  </div>
                  <span className="text-xs text-slate-400 text-center">to</span>
                  <div className="flex items-center gap-1.5 bg-[#F6F8FB] border border-slate-200 rounded-lg px-2.5 h-9 min-w-0">
                    <span className="text-xs text-slate-500">৳</span>
                    <input
                      type="number"
                      min={0}
                      value={maxPrice}
                      onChange={(e) => onMaxPriceChange(e.target.value)}
                      placeholder="Max"
                      aria-label="Maximum price"
                      className="w-full sm:w-20 bg-transparent text-base sm:text-xs font-mono text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-1 flex items-center gap-1 flex-wrap">
                    {[
                      { label: '≤ ৳1k', min: '', max: '1000' },
                      { label: '৳1k–5k', min: '1000', max: '5000' },
                      { label: '৳5k+', min: '5000', max: '' },
                    ].map((preset) => {
                      const active = minPrice === preset.min && maxPrice === preset.max;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            active
                              ? applyPricePreset('', '')
                              : applyPricePreset(preset.min, preset.max)
                          }
                          className={`px-2 py-1 rounded-md text-[11px] font-mono font-semibold border transition-colors ${
                            active
                              ? 'bg-[#0057E7] border-[#0057E7] text-white'
                              : 'bg-[#F6F8FB] border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="block text-xs font-semibold text-[#06142E]">
                  Availability
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'in-stock', label: 'In Stock' },
                      { id: 'low-stock', label: 'Low Stock' },
                      { id: 'out-of-stock', label: 'Out of Stock' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onAvailabilityChange(opt.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        availabilityFilter === opt.id
                          ? 'bg-[#06142E] border-[#06142E] text-white'
                          : 'bg-[#F6F8FB] border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              <div className="md:col-span-3 flex md:justify-end">
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="h-9 px-3.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            </div>

            {/* Technical Keywords */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 mr-1">
                <Cpu className="w-3.5 h-3.5 text-[#0057E7]" />
                Technical Keywords:
              </span>
              {TECH_FILTER_KEYWORDS.map((kw) => {
                const active = searchQuery
                  .toLowerCase()
                  .split(/\s+/)
                  .includes(kw.toLowerCase());
                return (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => handleToggleTechKeyword(kw)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold border transition-colors ${
                      active
                        ? 'bg-[#0057E7] border-[#0057E7] text-white'
                        : 'bg-[#F6F8FB] border-slate-200 text-slate-700 hover:border-[#0057E7]/60'
                    }`}
                  >
                    {kw}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Interactive Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-5 sm:mb-6">
          {filterTabs.map((tab) => {
            const isSelected = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectCategory(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#06142E] text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 sm:p-12 text-center">
            <h3 className="font-display text-lg font-bold text-[#06142E]">
              No matching components found
            </h3>
            <p className="text-sm text-slate-500 mt-1.5">
              Try adjusting your price range, availability filter, or technical keywords.
            </p>
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-5 px-5 py-2.5 rounded-lg bg-[#0057E7] text-white text-sm font-semibold hover:bg-[#0044BB] transition-colors"
            >
              Show All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryDisplayName={categoryLabels[product.category]}
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
