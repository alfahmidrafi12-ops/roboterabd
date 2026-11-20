import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Cpu,
  Heart,
  Menu,
  RotateCcw,
  Search,
  ShoppingBag,
  User as UserIcon,
  X,
} from 'lucide-react';
import { AvailabilityFilter, CategoryId, CategoryItem, Product } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activePage?: 'shop' | 'track';
  categories?: CategoryItem[];
  cartCount: number;
  wishlistCount: number;
  isSignedIn: boolean;
  searchQuery: string;
  minPrice: string;
  maxPrice: string;
  availabilityFilter: AvailabilityFilter;
  liveResults: Product[];
  categoryLabels?: Record<string, string>;
  onSearchChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onAvailabilityChange: (value: AvailabilityFilter) => void;
  onClearFilters: () => void;
  onSelectCategory?: (categoryId: CategoryId) => void;
  onSelectProduct: (product: Product) => void;
  onOpenSidebar: () => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
  onNavigateSection: (sectionId: string) => void;
  onGoHome: () => void;
  onOpenTracking: () => void;
}

const TECH_KEYWORD_CHIPS = ['3.3V', '5V', 'USB-C', 'UART', 'I2C', 'SPI', 'LiDAR', 'Brushless', 'XT60'];

export const Header: React.FC<HeaderProps> = ({
  activePage = 'shop',
  categories = [],
  cartCount,
  wishlistCount,
  isSignedIn,
  searchQuery,
  minPrice,
  maxPrice,
  availabilityFilter,
  liveResults,
  categoryLabels,
  onSearchChange,
  onMinPriceChange,
  onMaxPriceChange,
  onAvailabilityChange,
  onClearFilters,
  onSelectCategory,
  onSelectProduct,
  onOpenSidebar,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
  onNavigateSection,
  onGoHome,
  onOpenTracking,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const visibleCategories = categories.filter((c) => c.active !== false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!categoriesOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCategoriesOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [categoriesOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [searchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateSection('best-selling');
    setSearchOpen(false);
  };

  const hasActiveSearchFilters = Boolean(
    searchQuery.trim() || minPrice.trim() || maxPrice.trim() || availabilityFilter !== 'all'
  );

  const handleKeywordChip = (keyword: string) => {
    const tokens = searchQuery.trim().split(/\s+/).filter(Boolean);
    const exists = tokens.some((t) => t.toLowerCase() === keyword.toLowerCase());
    if (exists) {
      onSearchChange(tokens.filter((t) => t.toLowerCase() !== keyword.toLowerCase()).join(' '));
    } else {
      onSearchChange([...tokens, keyword].join(' '));
    }
  };

  const getMatchedSpecBadge = (product: Product): string | null => {
    const tokens = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return product.specs[0] ? `${product.specs[0].label}: ${product.specs[0].value}` : null;
    for (const spec of product.specs) {
      const combined = `${spec.label} ${spec.value}`.toLowerCase();
      if (tokens.some((tok) => combined.includes(tok))) {
        return `${spec.label}: ${spec.value}`;
      }
    }
    return product.specs[0] ? `${product.specs[0].label}: ${product.specs[0].value}` : null;
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-200 border-b ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-slate-200/90'
          : 'bg-white/92 backdrop-blur-xl border-slate-200/75'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-2 sm:gap-4 xl:gap-8">
        {/* Zone 1: Menu Trigger + Geometric Robotera BD Brand Lockup */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open department categories menu"
            className="p-2 -ml-1 sm:-ml-2 rounded-xl text-[#101828] hover:text-[#0866F5] hover:bg-[#F1F5F9] border border-transparent hover:border-slate-200/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866F5]"
          >
            <Menu className="w-5 h-5" />
          </button>

          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onGoHome();
            }}
            className="font-display text-[15px] sm:text-[18px] font-bold tracking-tight text-[#071A3B] whitespace-nowrap shrink-0 flex items-center gap-2 group"
          >
            <span className="w-7 h-7 rounded-lg bg-[#071A3B] flex items-center justify-center group-hover:bg-[#0866F5] transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="2.2" fill="#2DD4BF" />
                <path d="M9 2.5V6M15 2.5V6M9 18V21.5M15 18V21.5M2.5 9H6M2.5 15H6M18 9H21.5M18 15H21.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </span>
            <span className="flex items-center gap-1.5">
              <span>ROBOTERA</span>
              <span className="bg-[#0866F5] text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                BD
              </span>
            </span>
          </a>
        </div>

        {/* Zone 2: Clean Single-Line Navigation Links + Interactive Categories Dropdown */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-[13px] font-semibold text-[#1E293B]">
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setCategoriesOpen((prev) => !prev)}
              aria-expanded={categoriesOpen}
              className={`inline-flex items-center gap-1 py-1.5 whitespace-nowrap shrink-0 transition-colors ${
                categoriesOpen ? 'text-[#0866F5]' : 'hover:text-[#0866F5]'
              }`}
            >
              <span>Categories</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  categoriesOpen ? 'rotate-180 text-[#0866F5]' : ''
                }`}
              />
            </button>

            {categoriesOpen && (
              <div className="animate-slide-down absolute left-0 top-full mt-2.5 w-[540px] bg-white rounded-2xl border border-slate-200 shadow-[0_20px_44px_-16px_rgba(7,26,59,0.2)] p-4 z-50">
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#64748B]">
                    Hardware Departments
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoriesOpen(false);
                      onSelectCategory?.('all');
                    }}
                    className="text-xs font-semibold text-[#0866F5] hover:underline inline-flex items-center gap-1"
                  >
                    <span>View All Hardware</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {visibleCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategoriesOpen(false);
                        if (onSelectCategory) {
                          onSelectCategory(cat.id);
                        } else {
                          onNavigateSection('categories');
                        }
                      }}
                      className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F1F5F9] border border-transparent hover:border-slate-200 text-left transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] border border-slate-200/90 p-1 flex items-center justify-center shrink-0">
                        <HardwareArtwork
                          kind={cat.artwork}
                          imageUrl={cat.imageUrl}
                          alt={cat.name}
                          fit="contain"
                          className="w-full h-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#101828] group-hover:text-[#0866F5] truncate transition-colors">
                          {cat.name}
                        </p>
                        <p className="text-[11px] font-mono text-[#64748B] truncate">
                          {cat.countLabel}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {[
            { label: 'Shop Hardware', action: () => onNavigateSection('best-selling'), active: false },
            { label: 'New Arrivals', action: () => onNavigateSection('just-arrived'), active: false },
            { label: 'Robotics Kits', action: () => onNavigateSection('bundles'), active: false },
            { label: 'Guides', action: () => onNavigateSection('lab-guides'), active: false },
            { label: 'Track Order', action: onOpenTracking, active: activePage === 'track' },
          ].map((navItem) => (
            <button
              key={navItem.label}
              type="button"
              onClick={navItem.action}
              className={`relative py-1.5 whitespace-nowrap shrink-0 transition-colors after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:rounded-full after:bg-[#0866F5] after:origin-left after:transition-transform after:duration-200 ${
                navItem.active
                  ? 'text-[#0866F5] font-semibold after:scale-x-100'
                  : 'hover:text-[#071A3B] after:scale-x-0 hover:after:scale-x-100'
              }`}
            >
              {navItem.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Install App, Smart Search, Wishlist, Account & Primary Cart Action */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <PWAInstallButton variant="header" />

          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            aria-label="Toggle product search"
            aria-expanded={searchOpen}
            className={`h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl inline-flex items-center gap-2 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866F5] ${
              searchOpen || hasActiveSearchFilters
                ? 'text-[#0866F5] bg-[#DBEAFE] border-[#0866F5]/45'
                : 'bg-[#E6ECF4] hover:bg-[#DCE4F0] border-slate-300 text-[#0F172A]'
            }`}
          >
            {searchOpen ? <X className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> : <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
            <span className="hidden xl:inline text-xs font-medium text-[#334155]">
              Search ESP32, LiDAR...
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenWishlist}
            aria-label={`Saved items (${wishlistCount})`}
            className="relative p-1.5 sm:p-2.5 rounded-xl text-[#101828] hover:text-[#0866F5] hover:bg-[#F1F5F9] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866F5]"
          >
            <Heart className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            {wishlistCount > 0 && (
              <span
                key={wishlistCount}
                className="animate-badge-bounce absolute top-0.5 right-0.5 sm:top-1 sm:right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#0D9488] text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums"
              >
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenAuth}
            aria-label={isSignedIn ? 'Open account settings' : 'Sign in to Robotera BD'}
            className={`p-1.5 sm:p-2.5 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866F5] ${
              isSignedIn
                ? 'text-[#0866F5] bg-[#EFF6FF] hover:bg-blue-100'
                : 'text-[#101828] hover:text-[#0866F5] hover:bg-[#F1F5F9]'
            }`}
          >
            <UserIcon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Open shopping cart (${cartCount} items)`}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 h-9 sm:h-10 rounded-xl bg-[#071A3B] hover:bg-[#071A3B]/90 border border-[#071A3B] hover:border-[#0866F5]/60 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866F5] focus-visible:ring-offset-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            <span
              key={cartCount}
              className={`animate-badge-bounce font-mono text-[11px] px-1.5 py-0.5 rounded-md tabular-nums ${
                cartCount > 0 ? 'bg-[#EA580C] text-white' : 'bg-white/15 text-white'
              }`}
            >
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Live Technical Catalog Search Panel */}
      {searchOpen && (
        <div className="animate-slide-down border-t border-slate-300 bg-[#E6ECF4] shadow-xl max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-3.5 space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-2.5">
              <div className="relative flex-1 flex items-center bg-white border border-slate-300 rounded-lg px-3 h-10 focus-within:ring-2 focus-within:ring-[#0866F5]">
                <Search className="w-4 h-4 text-[#64748B] shrink-0 mr-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search hardware model, SKU, or specs (3.3V UART, LiDAR)..."
                  autoFocus
                  className="w-full bg-transparent text-base sm:text-sm text-[#101828] placeholder:text-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    aria-label="Clear search query"
                    className="text-slate-400 hover:text-slate-800 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Price Range & Availability Controls */}
              <div className="grid grid-cols-2 sm:flex sm:flex-nowrap items-center gap-2">
                <div className="col-span-2 sm:col-span-1 flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 h-10">
                  <span className="text-[11px] font-semibold text-[#64748B]">৳</span>
                  <input
                    type="number"
                    min={0}
                    value={minPrice}
                    onChange={(e) => onMinPriceChange(e.target.value)}
                    placeholder="Min"
                    aria-label="Minimum price BDT"
                    className="flex-1 min-w-0 sm:w-16 text-base sm:text-xs font-mono text-[#101828] bg-transparent focus:outline-none"
                  />
                  <span className="text-slate-300">–</span>
                  <input
                    type="number"
                    min={0}
                    value={maxPrice}
                    onChange={(e) => onMaxPriceChange(e.target.value)}
                    placeholder="Max"
                    aria-label="Maximum price BDT"
                    className="flex-1 min-w-0 sm:w-16 text-base sm:text-xs font-mono text-[#101828] bg-transparent focus:outline-none"
                  />
                </div>

                <select
                  value={availabilityFilter}
                  onChange={(e) => onAvailabilityChange(e.target.value as AvailabilityFilter)}
                  aria-label="Filter by availability"
                  className="h-10 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#0866F5]"
                >
                  <option value="all">All Stock</option>
                  <option value="in-stock">In Stock Only</option>
                  <option value="low-stock">Low Stock (1–5)</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1 h-10 px-4 rounded-lg bg-[#0866F5] hover:bg-[#0654CC] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <span>View {liveResults.length}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Technical Keyword Chips */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#64748B] whitespace-nowrap shrink-0 mr-1">
                  <Cpu className="w-3.5 h-3.5 text-[#0866F5]" />
                  Tech Specs:
                </span>
                {TECH_KEYWORD_CHIPS.map((kw) => {
                  const active = searchQuery
                    .toLowerCase()
                    .split(/\s+/)
                    .includes(kw.toLowerCase());
                  return (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => handleKeywordChip(kw)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[#0866F5] border-[#0866F5] text-white'
                          : 'bg-white border-slate-200 text-[#101828] hover:border-[#0866F5]/60'
                      }`}
                    >
                      {kw}
                    </button>
                  );
                })}
              </div>

              {hasActiveSearchFilters && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0866F5] hover:underline whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Real-Time Instant Search Suggestions */}
            {hasActiveSearchFilters && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-[#F8FAFC] border-b border-slate-100 flex items-center justify-between text-xs text-[#64748B]">
                  <span>
                    Real-time matches:{' '}
                    <strong className="font-mono text-[#071A3B] tabular-nums">
                      {liveResults.length}
                    </strong>
                  </span>
                  {liveResults.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateSection('best-selling');
                        setSearchOpen(false);
                      }}
                      className="font-semibold text-[#0866F5] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Show all in catalog</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {liveResults.length === 0 ? (
                  <div className="p-5 text-center text-xs text-[#64748B]">
                    No hardware matched your keywords or price/stock criteria. Try adjusting min/max price or clearing a keyword.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {liveResults.slice(0, 6).map((product) => {
                      const specSnippet = getMatchedSpecBadge(product);
                      const isOut = product.stock <= 0;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            setSearchOpen(false);
                            onSelectProduct(product);
                          }}
                          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#F8FAFC] transition-colors text-left"
                        >
                          <div className="w-11 h-11 rounded-lg bg-[#F1F5F9] border border-slate-200/70 p-1 flex items-center justify-center shrink-0">
                            <HardwareArtwork
                              kind={product.artwork}
                              imageUrl={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs sm:text-sm font-semibold text-[#101828] truncate">
                                {product.name}
                              </p>
                              <span className="hidden sm:inline font-mono text-[10px] text-[#64748B] shrink-0">
                                {product.sku}
                              </span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[#64748B]">
                              <span>{categoryLabels?.[product.category] || product.categoryLabel}</span>
                              {specSnippet && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono text-[#0866F5] truncate max-w-[220px]">
                                    {specSnippet}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-mono text-xs sm:text-sm font-bold text-[#071A3B] tabular-nums">
                              ৳{product.price.toLocaleString('en-IN')}
                            </p>
                            <p
                              className={`text-[10px] font-semibold ${
                                isOut
                                  ? 'text-red-600'
                                  : product.stock <= 5
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {isOut ? 'Out of stock' : `${product.stock} in stock`}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
