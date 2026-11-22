import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Check,
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
import { playTapSound } from '../lib/sound';
import { HighlightMatch } from './HighlightMatch';
import { ProductCard } from './ProductCard';
import { Reveal } from './Reveal';

interface BestSellingSectionProps {
  products: Product[];
  allProducts?: Product[];
  categories: CategoryItem[];
  activeCategory: CategoryId;
  searchQuery: string;
  minPrice: string;
  maxPrice: string;
  availabilityFilter: AvailabilityFilter;
  sortBy: SortOption;
  wishlistIds: string[];
  compareIds?: string[];
  onSelectCategory: (id: CategoryId) => void;
  onSearchChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onAvailabilityChange: (value: AvailabilityFilter) => void;
  onSortChange: (sort: SortOption) => void;
  onClearFilters: () => void;
  onToggleWishlist: (productId: string) => void;
  onToggleCompare?: (productId: string) => void;
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

const INITIAL_PAGE_SIZE = 12;
const PAGE_INCREMENT = 8;

type DiscoveryTab = 'all' | 'best-sellers' | 'new-arrivals' | 'makers';

export const BestSellingSection: React.FC<BestSellingSectionProps> = ({
  products,
  allProducts,
  categories,
  activeCategory,
  searchQuery,
  minPrice,
  maxPrice,
  availabilityFilter,
  sortBy,
  wishlistIds,
  compareIds = [],
  onSelectCategory,
  onSearchChange,
  onMinPriceChange,
  onMaxPriceChange,
  onAvailabilityChange,
  onSortChange,
  onClearFilters,
  onToggleWishlist,
  onToggleCompare,
  onAddToCart,
  onOpenDetail,
}) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [discoveryTab, setDiscoveryTab] = useState<DiscoveryTab>('all');
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_PAGE_SIZE);
  const [openSections, setOpenSections] = useState({
    categories: true,
    sort: true,
    brand: true,
    price: true,
    availability: true,
    specs: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  const sourcePool = allProducts && allProducts.length > 0 ? allProducts : products;

  const liveCategoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of sourcePool) {
      map[p.category] = (map[p.category] || 0) + 1;
    }
    return map;
  }, [sourcePool]);

  const availableBrands = useMemo(() => {
    return BRAND_PLATFORMS.filter((brand) =>
      sourcePool.some((p) => {
        const corpus = `${p.name} ${p.shortDesc} ${p.specs.map((s) => s.value).join(' ')}`.toLowerCase();
        return corpus.includes(brand.toLowerCase());
      })
    );
  }, [sourcePool]);

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

  useEffect(() => {
    setVisibleCount(INITIAL_PAGE_SIZE);
  }, [activeCategory, searchQuery, minPrice, maxPrice, availabilityFilter, sortBy, selectedBrand, discoveryTab]);

  const paginatedProducts = useMemo(
    () => displayedProducts.slice(0, visibleCount),
    [displayedProducts, visibleCount]
  );

  const remainingProductsCount = Math.max(0, displayedProducts.length - paginatedProducts.length);

  const activeCategoryName = activeCategory === 'all' ? null : categoryLabels[activeCategory];

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
    (activeCategory !== 'all' ? 1 : 0) +
    (minPrice.trim() || maxPrice.trim() ? 1 : 0) +
    (availabilityFilter !== 'all' ? 1 : 0) +
    (selectedBrand !== 'all' ? 1 : 0);

  const handleResetAll = () => {
    playTapSound();
    setSelectedBrand('all');
    setDiscoveryTab('all');
    onClearFilters();
  };

  const handleToggleTechKeyword = (keyword: string) => {
    playTapSound();
    const tokens = searchQuery.trim().split(/\s+/).filter(Boolean);
    const exists = tokens.some((t) => t.toLowerCase() === keyword.toLowerCase());
    if (exists) {
      onSearchChange(tokens.filter((t) => t.toLowerCase() !== keyword.toLowerCase()).join(' '));
    } else {
      onSearchChange([...tokens, keyword].join(' '));
    }
  };

  const applyPricePreset = (min: string, max: string) => {
    playTapSound();
    onMinPriceChange(min);
    onMaxPriceChange(max);
  };

  const renderSectionToggle = (title: string, key: keyof typeof openSections, icon?: React.ReactNode) => (
    <button
      type="button"
      onClick={() => toggleSection(key)}
      aria-expanded={openSections[key]}
      className="w-full flex items-center justify-between gap-2 text-left py-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] rounded-md"
    >
      <span className="font-hero text-xs font-bold uppercase tracking-[0.08em] text-[#071A3D] group-hover:text-[#087BFF] transition-colors flex items-center gap-1.5">
        {icon}
        <span>{title}</span>
      </span>
      <ChevronDown
        className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${
          openSections[key] ? 'rotate-180' : ''
        }`}
      />
    </button>
  );

  const filterSidebarContent = (
    <div className="space-y-5">
      {/* Top Filter Bar Title + Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <span className="font-hero text-sm font-extrabold text-[#071A3D]">Filter Hardware</span>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={handleResetAll}
            className="text-xs font-semibold text-[#087BFF] hover:text-[#071A3D] inline-flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Categories Checkboxes */}
      <div>
        {renderSectionToggle('Categories', 'categories')}
        {openSections.categories && (
          <div className="mt-2.5 space-y-1">
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'bg-[#F3F7FC] text-[#087BFF] font-bold'
                  : 'text-[#334155] hover:bg-[#F8FAFC]'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    activeCategory === 'all'
                      ? 'bg-[#087BFF] border-[#087BFF] text-white'
                      : 'bg-white border-slate-300'
                  }`}
                >
                  {activeCategory === 'all' && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                </span>
                <span className="truncate">All Hardware</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums text-[#64748B] ml-2">
                {sourcePool.length}
              </span>
            </button>

            {activeCategories.map((cat) => {
              const selected = activeCategory === cat.id;
              const catCount = liveCategoryCounts[cat.id] ?? 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(selected ? 'all' : cat.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                    selected
                      ? 'bg-[#F3F7FC] text-[#087BFF] font-bold'
                      : 'text-[#334155] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        selected
                          ? 'bg-[#087BFF] border-[#087BFF] text-white'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      {selected && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                    </span>
                    <span className="truncate">
                      <HighlightMatch text={cat.name} query={searchQuery} />
                    </span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-[#64748B] shrink-0 ml-2">
                    {catCount}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Brand & Ecosystem */}
      {availableBrands.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          {renderSectionToggle('Brand & Ecosystem', 'brand')}
          {openSections.brand && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedBrand('all')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                  selectedBrand === 'all'
                    ? 'bg-[#071A3D] border-[#071A3D] text-white'
                    : 'bg-[#F8FAFC] border-slate-200 text-[#334155] hover:border-[#087BFF]/55'
                }`}
              >
                All Brands
              </button>
              {availableBrands.map((brand) => {
                const active = selectedBrand === brand;
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setSelectedBrand(active ? 'all' : brand)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                      active
                        ? 'bg-[#087BFF] border-[#087BFF] text-white'
                        : 'bg-[#F8FAFC] border-slate-200 text-[#334155] hover:border-[#087BFF]/55'
                    }`}
                  >
                    {brand}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Price Range (BDT) */}
      <div className="pt-4 border-t border-slate-100">
        {renderSectionToggle('Price Range (BDT)', 'price')}
        {openSections.price && (
          <div className="mt-2.5 space-y-2.5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
              <div className="flex items-center gap-1 bg-[#F8FAFC] border border-slate-200 focus-within:border-[#087BFF] focus-within:bg-white rounded-xl px-2.5 h-9 min-w-0 transition-colors">
                <span className="text-xs text-[#64748B]">৳</span>
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(e) => onMinPriceChange(e.target.value)}
                  placeholder="Min"
                  aria-label="Minimum price"
                  className="w-full bg-transparent text-base sm:text-xs font-mono text-[#071A3D] focus:outline-none"
                />
              </div>
              <span className="text-xs text-slate-400">–</span>
              <div className="flex items-center gap-1 bg-[#F8FAFC] border border-slate-200 focus-within:border-[#087BFF] focus-within:bg-white rounded-xl px-2.5 h-9 min-w-0 transition-colors">
                <span className="text-xs text-[#64748B]">৳</span>
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => onMaxPriceChange(e.target.value)}
                  placeholder="Max"
                  aria-label="Maximum price"
                  className="w-full bg-transparent text-base sm:text-xs font-mono text-[#071A3D] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Under ৳1k', min: '', max: '1000' },
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
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-colors ${
                      active
                        ? 'bg-[#087BFF] border-[#087BFF] text-white'
                        : 'bg-[#F8FAFC] border-slate-200 text-[#334155] hover:border-[#087BFF]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="pt-4 border-t border-slate-100">
        {renderSectionToggle('Availability', 'availability')}
        {openSections.availability && (
          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
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
                className={`px-2.5 py-2 rounded-xl text-[11px] font-semibold border transition-colors text-center ${
                  availabilityFilter === opt.id
                    ? 'bg-[#071A3D] border-[#071A3D] text-white'
                    : 'bg-[#F8FAFC] border-slate-200 text-[#334155] hover:border-[#087BFF]/55'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interfaces & Voltage */}
      <div className="pt-4 border-t border-slate-100">
        {renderSectionToggle(
          'Interfaces & Voltage',
          'specs',
          <Cpu className="w-3.5 h-3.5 text-[#087BFF]" />
        )}
        {openSections.specs && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
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
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-colors ${
                    active
                      ? 'bg-[#087BFF] border-[#087BFF] text-white'
                      : 'bg-[#F8FAFC] border-slate-200 text-[#334155] hover:border-[#087BFF]'
                  }`}
                >
                  {kw}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sorting Quick Options */}
      <div className="pt-4 border-t border-slate-100">
        {renderSectionToggle('Sorting Options', 'sort')}
        {openSections.sort && (
          <div className="mt-2.5 space-y-1">
            {(
              [
                { id: 'featured', label: 'Best Selling' },
                { id: 'popular', label: 'Most Popular' },
                { id: 'price-asc', label: 'Price: Low to High' },
                { id: 'price-desc', label: 'Price: High to Low' },
                { id: 'newest', label: 'Newest Arrivals' },
              ] as const
            ).map((opt) => {
              const active = sortBy === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSortChange(opt.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    active
                      ? 'bg-[#F3F7FC] text-[#087BFF] font-bold'
                      : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#071A3D]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {active && <Check className="w-3.5 h-3.5 text-[#087BFF]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section
      id="best-selling"
      className="scroll-mt-20 bg-[#F3F7FC] min-[1500px]:bg-transparent min-[1500px]:pointer-events-none"
    >
      <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-gradient-to-b from-white via-[#F3F7FC] to-white min-[1500px]:border-x min-[1500px]:border-slate-200/90 px-4 sm:px-6 lg:px-10 py-11 sm:py-14 lg:py-16">
        {/* Catalog Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 pb-6 border-b border-slate-200/90 mb-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-1.5">
              <span className="h-[2px] w-5 bg-[#087BFF]" aria-hidden="true" />
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#087BFF]">
                PRODUCT CATALOG
              </p>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="font-hero text-2xl sm:text-[32px] font-extrabold text-[#071A3D] tracking-[-0.025em] leading-tight">
                Explore Our Hardware
              </h2>
              <span className="text-xs font-mono font-semibold text-[#087BFF] tabular-nums">
                {displayedProducts.length} of {sourcePool.length}{' '}
                {sourcePool.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-[#475569] leading-relaxed">
              Discover carefully selected electronics, robotics components and engineering tools.
            </p>
          </div>

          {/* Toolbar: Search, Mobile Drawer Trigger, Sort & Grid/List Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search model, SKU, specs..."
                aria-label="Filter hardware catalog by name, SKU, or technical keywords"
                className="w-full h-10 pl-9 pr-8 rounded-xl bg-white border border-slate-200 text-base sm:text-sm text-[#071A3D] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#087BFF] focus:border-[#087BFF] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear filter search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#071A3D] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setMobileFiltersOpen(true);
                }}
                className={`active:scale-95 lg:hidden h-10 px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                  activeAdvancedCount > 0
                    ? 'bg-[#071A3D] border-[#071A3D] text-white'
                    : 'bg-white border-slate-200 text-[#071A3D]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeAdvancedCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#087BFF] text-white text-[10px] font-mono tabular-nums">
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
                  className="w-full min-w-0 sm:w-48 h-10 pl-8 pr-8 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-medium text-[#071A3D] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#087BFF] hover:border-[#087BFF]/55 transition-colors"
                >
                  <option value="featured">Sort: Best Selling</option>
                  <option value="popular">Sort: Most Popular</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Grid / List Toggle */}
              <div className="hidden sm:flex items-center p-1 rounded-xl bg-white border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setViewMode('grid');
                  }}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#071A3D] text-white'
                      : 'text-[#64748B] hover:text-[#071A3D] hover:bg-[#F3F7FC]'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setViewMode('list');
                  }}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[#071A3D] text-white'
                      : 'text-[#64748B] hover:text-[#071A3D] hover:bg-[#F3F7FC]'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Discovery Quick Tabs + Active Filter Indicators */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {(
              [
                { id: 'all', label: 'All Hardware' },
                { id: 'best-sellers', label: 'Best Sellers' },
                { id: 'new-arrivals', label: 'New Arrivals' },
                { id: 'makers', label: 'Top Rated' },
              ] as const
            ).map((tab) => {
              const active = discoveryTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setDiscoveryTab(tab.id);
                  }}
                  className={`active:scale-[0.98] px-4 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#071A3D] border-[#071A3D] text-white shadow-[0_6px_14px_-6px_rgba(7,26,61,0.35)]'
                      : 'bg-white hover:bg-[#F8FAFC] text-[#334155] border-slate-200 hover:border-[#087BFF]/55 hover:text-[#071A3D]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {hasAnyFilter && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#087BFF]/10 border border-[#087BFF]/25 text-[#071A3D] font-medium hover:border-[#087BFF]"
                >
                  <Search className="w-3 h-3 text-[#087BFF]" />
                  <span>&ldquo;{searchQuery.trim()}&rdquo;</span>
                  <X className="w-3 h-3 text-[#64748B]" />
                </button>
              )}
              {activeCategoryName && (
                <button
                  type="button"
                  onClick={() => onSelectCategory('all')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[#071A3D] font-medium hover:border-[#087BFF]"
                >
                  <span>{activeCategoryName}</span>
                  <X className="w-3 h-3 text-[#64748B]" />
                </button>
              )}
              {selectedBrand !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedBrand('all')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[#071A3D] font-medium hover:border-[#087BFF]"
                >
                  <span>{selectedBrand}</span>
                  <X className="w-3 h-3 text-[#64748B]" />
                </button>
              )}
              {availabilityFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => onAvailabilityChange('all')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[#071A3D] font-medium hover:border-[#087BFF]"
                >
                  <span className="capitalize">{availabilityFilter.replace('-', ' ')}</span>
                  <X className="w-3 h-3 text-[#64748B]" />
                </button>
              )}
              {(minPrice || maxPrice) && (
                <button
                  type="button"
                  onClick={() => applyPricePreset('', '')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[#071A3D] font-mono text-[11px] hover:border-[#087BFF]"
                >
                  <span>
                    ৳{minPrice || '0'}–{maxPrice ? `৳${maxPrice}` : 'Any'}
                  </span>
                  <X className="w-3 h-3 text-[#64748B]" />
                </button>
              )}
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-1 px-2 py-1 text-[#087BFF] font-semibold hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            </div>
          )}
        </div>

        {/* Desktop Sidebar + Spacious Product Catalog Grid */}
        <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
          <aside className="hidden lg:block w-[272px] xl:w-[284px] shrink-0 bg-white rounded-2xl border border-slate-200/90 shadow-[0_8px_24px_-12px_rgba(7,26,61,0.08)] p-5 sticky top-20">
            {filterSidebarContent}
          </aside>

          <div className="flex-1 min-w-0 w-full">
            {displayedProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-14 text-center shadow-[0_8px_24px_-12px_rgba(7,26,61,0.06)]">
                <h3 className="font-hero text-lg font-bold text-[#071A3D]">
                  No matching components found
                </h3>
                <p className="text-sm text-[#475569] mt-1.5 max-w-md mx-auto">
                  Try adjusting your category, brand, price range, availability filter, or technical keywords.
                </p>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-[#087BFF] hover:bg-[#0669DB] text-white text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-4">
                {paginatedProducts.map((product, idx) => (
                  <div
                    key={product.id}
                    style={{ animationDelay: `${Math.min(idx * 30, 180)}ms` }}
                    className="animate-cart-enter"
                  >
                    <ProductCard
                      product={product}
                      layout="list"
                      categoryDisplayName={categoryLabels[product.category]}
                      highlightQuery={searchQuery}
                      isWishlisted={wishlistIds.includes(product.id)}
                      isCompared={compareIds.includes(product.id)}
                      compareLimitReached={compareIds.length >= 3}
                      onToggleWishlist={onToggleWishlist}
                      onToggleCompare={onToggleCompare}
                      onAddToCart={onAddToCart}
                      onOpenDetail={onOpenDetail}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
                {paginatedProducts.map((product, idx) => (
                  <Reveal key={product.id} delayMs={Math.min(idx * 20, 160)} className="h-full">
                    <ProductCard
                      product={product}
                      layout="grid"
                      categoryDisplayName={categoryLabels[product.category]}
                      highlightQuery={searchQuery}
                      isWishlisted={wishlistIds.includes(product.id)}
                      isCompared={compareIds.includes(product.id)}
                      compareLimitReached={compareIds.length >= 3}
                      onToggleWishlist={onToggleWishlist}
                      onToggleCompare={onToggleCompare}
                      onAddToCart={onAddToCart}
                      onOpenDetail={onOpenDetail}
                    />
                  </Reveal>
                ))}
              </div>
            )}

            {/* Pagination / Load More Footer */}
            {displayedProducts.length > INITIAL_PAGE_SIZE && (
              <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs font-mono text-[#475569] tabular-nums">
                  Showing {paginatedProducts.length} of {displayedProducts.length} products
                </p>
                {remainingProductsCount > 0 ? (
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setVisibleCount((prev) => prev + PAGE_INCREMENT);
                      }}
                      className="active:scale-[0.98] px-5 py-2.5 rounded-xl bg-white hover:bg-[#071A3D] border border-slate-200 hover:border-[#071A3D] text-xs font-bold tracking-[0.04em] uppercase text-[#071A3D] hover:text-white shadow-[0_6px_16px_-8px_rgba(7,26,61,0.12)] transition-all duration-200"
                    >
                      Load More (+{Math.min(PAGE_INCREMENT, remainingProductsCount)})
                    </button>
                    {remainingProductsCount > PAGE_INCREMENT && (
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setVisibleCount(displayedProducts.length);
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#087BFF] hover:underline"
                      >
                        Show All
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setVisibleCount(INITIAL_PAGE_SIZE);
                    }}
                    className="active:scale-[0.98] px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#475569] hover:text-[#071A3D] transition-all"
                  >
                    Show First {INITIAL_PAGE_SIZE}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-In Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-start">
          <div
            className="animate-fade-in fixed inset-0 bg-[#071A3D]/55 backdrop-blur-xs"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <aside className="animate-drawer-in-left relative z-10 w-[320px] max-w-[88vw] h-full bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="font-hero text-base font-extrabold text-[#071A3D]">Filters &amp; Sort</h3>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="p-1.5 rounded-lg text-[#475569] hover:text-[#071A3D] hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{filterSidebarContent}</div>
            <div className="p-4 border-t border-slate-200 bg-[#F3F7FC] pb-[max(1rem,env(safe-area-inset-bottom))] shrink-0">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full h-11 rounded-xl bg-[#087BFF] hover:bg-[#0669DB] text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Show {displayedProducts.length}{' '}
                {displayedProducts.length === 1 ? 'Product' : 'Products'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};
