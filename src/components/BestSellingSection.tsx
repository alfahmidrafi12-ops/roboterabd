import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ChevronDown,
  Cpu,
  LayoutGrid,
  List,
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
import { Reveal } from './Reveal';

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

const BRAND_PLATFORMS = [
  'ESP32',
  'Raspberry Pi',
  'Arduino',
  'STM32',
  'SLAMTEC',
  'TowerPro',
  'Miniware',
  'MeanWell',
  'Yahboom',
];

type DiscoveryTab = 'all' | 'best-sellers' | 'new-arrivals' | 'makers';

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [discoveryTab, setDiscoveryTab] = useState<DiscoveryTab>('all');

  const activeCategories = useMemo(
    () => categories.filter((c) => c.active !== false),
    [categories]
  );

  const categoryLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categories) {
      map[c.id] = c.name;
    }
    return map;
  }, [categories]);

  // Derive available brands present in catalog cleanly
  const availableBrands = useMemo(() => {
    return BRAND_PLATFORMS.filter((brand) =>
      products.some((p) => {
        const corpus = `${p.name} ${p.shortDesc} ${p.specs.map((s) => s.value).join(' ')}`.toLowerCase();
        return corpus.includes(brand.toLowerCase());
      })
    );
  }, [products]);

  const displayedProducts = useMemo(() => {
    let list = products;
    if (selectedBrand !== 'all') {
      const needle = selectedBrand.toLowerCase();
      list = list.filter((p) => {
        const corpus = `${p.name} ${p.shortDesc} ${p.specs.map((s) => s.value).join(' ')}`.toLowerCase();
        return corpus.includes(needle);
      });
    }
    if (discoveryTab === 'best-sellers') {
      list = [...list].sort((a, b) => b.reviews - a.reviews);
    } else if (discoveryTab === 'new-arrivals') {
      list = list.filter((p) => p.isJustArrived);
    } else if (discoveryTab === 'makers') {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [products, selectedBrand, discoveryTab]);

  const activeCategoryName =
    activeCategory === 'all' ? null : categoryLabels[activeCategory];

  const hasAnyFilter = Boolean(
    searchQuery.trim() ||
      activeCategory !== 'all' ||
      sortBy !== 'featured' ||
      minPrice.trim() ||
      maxPrice.trim() ||
      availabilityFilter !== 'all' ||
      selectedBrand !== 'all' ||
      discoveryTab !== 'all'
  );

  const activeAdvancedCount =
    (minPrice.trim() || maxPrice.trim() ? 1 : 0) +
    (availabilityFilter !== 'all' ? 1 : 0) +
    (selectedBrand !== 'all' ? 1 : 0);

  const handleResetAll = () => {
    setSelectedBrand('all');
    setDiscoveryTab('all');
    onClearFilters();
  };

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

  const filterSidebarContent = (
    <div className="space-y-6">
      {/* Categories Filter */}
      <div>
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#071A3B] mb-2.5">
          Categories
        </h3>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeCategory === 'all'
                ? 'bg-[#0866F5] text-white'
                : 'text-[#64748B] hover:bg-[#F5F8FC] hover:text-[#101828]'
            }`}
          >
            <span>All Hardware</span>
          </button>
          {activeCategories.map((cat) => {
            const selected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(selected ? 'all' : cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                  selected
                    ? 'bg-[#0866F5] text-white font-semibold'
                    : 'text-[#101828] hover:bg-[#F5F8FC]'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                <span
                  className={`font-mono text-[10px] shrink-0 ml-2 ${
                    selected ? 'text-blue-100' : 'text-[#64748B]'
                  }`}
                >
                  {cat.countLabel.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand / Platform Filter */}
      {availableBrands.length > 0 && (
        <div className="pt-5 border-t border-slate-200/80">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#071A3B] mb-2.5">
            Brand &amp; Ecosystem
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedBrand('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                selectedBrand === 'all'
                  ? 'bg-[#071A3B] border-[#071A3B] text-white'
                  : 'bg-[#F5F8FC] border-slate-200 text-[#101828] hover:border-slate-300'
              }`}
            >
              All
            </button>
            {availableBrands.map((brand) => {
              const active = selectedBrand === brand;
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setSelectedBrand(active ? 'all' : brand)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                    active
                      ? 'bg-[#0866F5] border-[#0866F5] text-white'
                      : 'bg-[#F5F8FC] border-slate-200 text-[#101828] hover:border-[#0866F5]/50'
                  }`}
                >
                  {brand}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range Filter */}
      <div className="pt-5 border-t border-slate-200/80 space-y-2.5">
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#071A3B]">
          Price Range (BDT)
        </h3>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
          <div className="flex items-center gap-1 bg-[#F5F8FC] border border-slate-200 rounded-lg px-2.5 h-9 min-w-0">
            <span className="text-xs text-[#64748B]">৳</span>
            <input
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              placeholder="Min"
              aria-label="Minimum price"
              className="w-full bg-transparent text-base sm:text-xs font-mono text-[#101828] focus:outline-none"
            />
          </div>
          <span className="text-xs text-slate-400">–</span>
          <div className="flex items-center gap-1 bg-[#F5F8FC] border border-slate-200 rounded-lg px-2.5 h-9 min-w-0">
            <span className="text-xs text-[#64748B]">৳</span>
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              placeholder="Max"
              aria-label="Maximum price"
              className="w-full bg-transparent text-base sm:text-xs font-mono text-[#101828] focus:outline-none"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
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
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border transition-colors ${
                  active
                    ? 'bg-[#0866F5] border-[#0866F5] text-white'
                    : 'bg-[#F5F8FC] border-slate-200 text-[#101828] hover:border-slate-300'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Availability Filter */}
      <div className="pt-5 border-t border-slate-200/80 space-y-2.5">
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#071A3B]">
          Availability
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { id: 'all', label: 'All Stock' },
              { id: 'in-stock', label: 'In Stock' },
              { id: 'low-stock', label: 'Low Stock' },
              { id: 'out-of-stock', label: 'Out of Stock' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onAvailabilityChange(opt.id)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                availabilityFilter === opt.id
                  ? 'bg-[#071A3B] border-[#071A3B] text-white'
                  : 'bg-[#F5F8FC] border-slate-200 text-[#101828] hover:border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Technical Specs Keywords */}
      <div className="pt-5 border-t border-slate-200/80 space-y-2.5">
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#071A3B] flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-[#0866F5]" />
          <span>Interfaces &amp; Voltage</span>
        </h3>
        <div className="flex flex-wrap gap-1.5">
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
                className={`px-2 py-1 rounded-md text-[11px] font-mono font-semibold border transition-colors ${
                  active
                    ? 'bg-[#0866F5] border-[#0866F5] text-white'
                    : 'bg-[#F5F8FC] border-slate-200 text-[#101828] hover:border-[#0866F5]/60'
                }`}
              >
                {kw}
              </button>
            );
          })}
        </div>
      </div>

      {hasAnyFilter && (
        <div className="pt-4 border-t border-slate-200/80">
          <button
            type="button"
            onClick={handleResetAll}
            className="w-full h-9 rounded-xl border border-slate-200 hover:bg-[#F5F8FC] text-xs font-semibold text-[#0866F5] inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear All Filters</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <section
      id="best-selling"
      className="scroll-mt-20 py-10 sm:py-14 lg:py-16 bg-white"
    >
      <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Top Page Heading & Discovery Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6 border-b border-slate-200/80 mb-6">
          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#059669] mb-1">
              Product Discovery Catalog
            </p>
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#071A3B] tracking-tight">
                {activeCategoryName ? activeCategoryName : 'Shop Hardware'}
              </h2>
              <span className="text-xs font-mono text-[#64748B] tabular-nums">
                {displayedProducts.length} {displayedProducts.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            {hasAnyFilter && (
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                <span>
                  Filtered view
                  {searchQuery ? ` · "${searchQuery}"` : ''}
                  {selectedBrand !== 'all' ? ` · ${selectedBrand}` : ''}
                  {availabilityFilter !== 'all' ? ` · ${availabilityFilter.replace('-', ' ')}` : ''}
                  {minPrice || maxPrice
                    ? ` · ৳${minPrice || '0'}–${maxPrice ? `৳${maxPrice}` : 'Any'}`
                    : ''}
                </span>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="inline-flex items-center gap-1 text-[#0866F5] font-semibold hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset all
                </button>
              </div>
            )}
          </div>

          {/* Search, Mobile Filters, View Mode & Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search model, SKU, specs..."
                aria-label="Filter hardware catalog by name, SKU, or technical keywords"
                className="w-full h-10 pl-9 pr-8 rounded-xl bg-[#F1F5F9] border border-slate-200/90 text-base sm:text-sm text-[#101828] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0866F5] transition-colors"
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
                onClick={() => setMobileFiltersOpen(true)}
                className={`lg:hidden h-10 px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                  activeAdvancedCount > 0
                    ? 'bg-[#071A3B] border-[#071A3B] text-white'
                    : 'bg-[#F1F5F9] border-slate-200 text-[#101828]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeAdvancedCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#EA580C] text-white text-[10px] font-mono tabular-nums">
                    {activeAdvancedCount}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="relative flex-1 min-w-0 sm:flex-initial shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value as SortOption)}
                  aria-label="Sort products"
                  className="w-full min-w-0 sm:w-48 h-10 pl-8 pr-8 rounded-xl bg-[#F5F8FC] border border-slate-200/90 text-xs sm:text-sm font-medium text-[#101828] appearance-none cursor-pointer focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0866F5] hover:border-slate-300 transition-colors"
                >
                  <option value="featured">Sort: Best Selling</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Grid / List Toggle */}
              <div className="hidden sm:flex items-center p-1 rounded-xl bg-[#F5F8FC] border border-slate-200/90">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-[#0866F5] border-slate-200/80'
                      : 'border-transparent text-[#64748B] hover:text-[#101828] hover:bg-white/60'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-[#0866F5] border-slate-200/80'
                      : 'border-transparent text-[#64748B] hover:text-[#101828] hover:bg-white/60'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Discovery Quick Curations */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
          {(
            [
              { id: 'all', label: 'All Hardware' },
              { id: 'best-sellers', label: 'Best Sellers' },
              { id: 'new-arrivals', label: 'New Arrivals' },
              { id: 'makers', label: 'Recommended for Makers' },
            ] as const
          ).map((tab) => {
            const active = discoveryTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDiscoveryTab(tab.id)}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#071A3B] border-[#071A3B] text-white'
                    : 'bg-[#F5F8FC] hover:bg-[#0866F5]/[0.06] text-[#64748B] border-slate-200/80 hover:border-[#0866F5]/45 hover:text-[#101828]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Desktop Sidebar + Product Discovery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-7 items-start">
          <aside className="hidden lg:block lg:col-span-3 2xl:col-span-2 bg-[#F8FAFC] rounded-2xl border border-slate-200/90 p-5 sticky top-20">
            {filterSidebarContent}
          </aside>

          <div className="lg:col-span-9 2xl:col-span-10">
            {displayedProducts.length === 0 ? (
              <div className="bg-[#F5F8FC] rounded-2xl border border-slate-200 p-8 sm:p-14 text-center">
                <h3 className="font-display text-lg font-bold text-[#071A3B]">
                  No matching components found
                </h3>
                <p className="text-sm text-[#64748B] mt-1.5">
                  Try adjusting your brand, price range, availability filter, or technical keywords.
                </p>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-[#0866F5] hover:bg-[#0654CC] text-white text-sm font-semibold transition-colors"
                >
                  Show All Hardware
                </button>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-4">
                {displayedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    layout="list"
                    categoryDisplayName={categoryLabels[product.category]}
                    isWishlisted={wishlistIds.includes(product.id)}
                    onToggleWishlist={onToggleWishlist}
                    onAddToCart={onAddToCart}
                    onOpenDetail={onOpenDetail}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 xl:gap-5">
                {displayedProducts.map((product, idx) => (
                  <Reveal key={product.id} delayMs={Math.min(idx * 30, 210)} className="h-full">
                    <ProductCard
                      product={product}
                      layout="grid"
                      categoryDisplayName={categoryLabels[product.category]}
                      isWishlisted={wishlistIds.includes(product.id)}
                      onToggleWishlist={onToggleWishlist}
                      onAddToCart={onAddToCart}
                      onOpenDetail={onOpenDetail}
                    />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-Up Filter Panel */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-end">
          <div
            className="animate-fade-in fixed inset-0 bg-[#071A3B]/60 backdrop-blur-xs"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div className="animate-drawer-up relative z-10 w-full max-h-[85dvh] bg-white rounded-t-3xl border-t border-slate-200 flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#071A3B]">Filter Hardware</h3>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#101828]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{filterSidebarContent}</div>
            <div className="p-4 border-t border-slate-200 bg-[#F5F8FC] pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full h-11 rounded-xl bg-[#0866F5] hover:bg-[#0654CC] text-white text-sm font-semibold transition-colors"
              >
                Apply Filters ({displayedProducts.length} items)
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
