import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Cpu,
  Heart,
  Menu,
  RotateCcw,
  Search,
  ShoppingBag,
  User as UserIcon,
  X,
} from 'lucide-react';
import { AvailabilityFilter, Product } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activePage?: 'shop' | 'track';
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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_12px_-4px_rgba(6,20,46,0.06)]">
      <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-2 sm:gap-8">
        {/* Zone 1: Menu Trigger + Brand Wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open department categories menu"
            className="p-2 -ml-1.5 sm:-ml-2 rounded-xl text-slate-700 hover:text-[#0057E7] hover:bg-slate-100/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Menu className="w-5 h-5" />
          </button>

          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onGoHome();
            }}
            className="font-display text-base sm:text-[21px] font-extrabold tracking-tight text-[#070D19] whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span>ROBOTERA</span>
            <span className="bg-[#0057E7] text-white text-[10px] sm:text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md shadow-2xs">
              BD
            </span>
          </a>
        </div>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-[13.5px] font-semibold text-slate-600">
          {[
            { label: 'Categories', action: () => onNavigateSection('categories'), active: false },
            { label: 'Shop Hardware', action: () => onNavigateSection('best-selling'), active: false },
            { label: 'New Arrivals', action: () => onNavigateSection('just-arrived'), active: false },
            { label: 'Robotics Kits', action: () => onNavigateSection('bundles'), active: false },
            { label: 'Track Order', action: onOpenTracking, active: activePage === 'track' },
          ].map((navItem) => (
            <button
              key={navItem.label}
              type="button"
              onClick={navItem.action}
              className={`relative py-1.5 whitespace-nowrap shrink-0 transition-colors after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:rounded-full after:bg-[#0057E7] after:origin-left after:transition-transform after:duration-200 ${
                navItem.active
                  ? 'text-[#0057E7] after:scale-x-100'
                  : 'hover:text-[#070D19] after:scale-x-0 hover:after:scale-x-100'
              }`}
            >
              {navItem.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Install App, Search, Wishlist, Account & Primary Cart Action */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <PWAInstallButton variant="header" />

          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            aria-label="Toggle product search"
            aria-expanded={searchOpen}
            className={`h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl inline-flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              searchOpen || hasActiveSearchFilters
                ? 'text-[#0057E7] bg-[#EEF4FF] border border-blue-200 shadow-2xs'
                : 'btn-liquid-glass text-slate-700'
            }`}
          >
            {searchOpen ? <X className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> : <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
            <span className="hidden xl:inline text-xs font-medium text-slate-600">
              Search SKU, 3.3V...
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenWishlist}
            aria-label={`Saved items (${wishlistCount})`}
            className="relative p-2 sm:p-2.5 rounded-xl text-slate-700 hover:text-[#0057E7] hover:bg-slate-100/90 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Heart className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            {wishlistCount > 0 && (
              <span
                key={wishlistCount}
                className="animate-badge-bounce absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#070D19] text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums"
              >
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenAuth}
            aria-label={isSignedIn ? 'Open account settings' : 'Sign in to Robotera BD'}
            className={`p-2 sm:p-2.5 rounded-xl active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              isSignedIn
                ? 'text-[#0057E7] bg-[#EEF4FF] hover:bg-blue-100'
                : 'text-slate-700 hover:text-[#0057E7] hover:bg-slate-100/90'
            }`}
          >
            <UserIcon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Open shopping cart (${cartCount} items)`}
            className="btn-glossy-dark inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            <span
              key={cartCount}
              className="animate-badge-bounce font-mono text-[11px] bg-white/15 px-1.5 py-0.5 rounded-md tabular-nums"
            >
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Live Technical Catalog Search Panel */}
      {searchOpen && (
        <div className="animate-slide-down border-t border-slate-200 bg-[#F6F8FB] shadow-xl max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">
          <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10 py-3.5 space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-2.5">
              <div className="relative flex-1 flex items-center bg-white border border-slate-200 rounded-lg px-3 h-10 focus-within:ring-2 focus-within:ring-blue-600">
                <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search model, SKU, or specs (3.3V UART)..."
                  autoFocus
                  className="w-full bg-transparent text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
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
                  <span className="text-[11px] font-semibold text-slate-500">৳</span>
                  <input
                    type="number"
                    min={0}
                    value={minPrice}
                    onChange={(e) => onMinPriceChange(e.target.value)}
                    placeholder="Min"
                    aria-label="Minimum price BDT"
                    className="flex-1 min-w-0 sm:w-16 text-base sm:text-xs font-mono text-slate-900 bg-transparent focus:outline-none"
                  />
                  <span className="text-slate-300">–</span>
                  <input
                    type="number"
                    min={0}
                    value={maxPrice}
                    onChange={(e) => onMaxPriceChange(e.target.value)}
                    placeholder="Max"
                    aria-label="Maximum price BDT"
                    className="flex-1 min-w-0 sm:w-16 text-base sm:text-xs font-mono text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>

                <select
                  value={availabilityFilter}
                  onChange={(e) => onAvailabilityChange(e.target.value as AvailabilityFilter)}
                  aria-label="Filter by availability"
                  className="h-10 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">All Stock</option>
                  <option value="in-stock">In Stock Only</option>
                  <option value="low-stock">Low Stock (1–5)</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1 h-10 px-4 rounded-lg bg-[#06142E] text-white text-xs font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>View {liveResults.length}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Technical Keyword Chips */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 whitespace-nowrap shrink-0 mr-1">
                  <Cpu className="w-3.5 h-3.5 text-[#0057E7]" />
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
                          ? 'bg-[#0057E7] border-[#0057E7] text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-[#0057E7]/60'
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
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0057E7] hover:underline whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Real-Time Instant Search Results */}
            {hasActiveSearchFilters && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-[#F9FBFD] border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Real-time matches:{' '}
                    <strong className="font-mono text-[#06142E] tabular-nums">
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
                      className="font-semibold text-[#0057E7] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Show all in catalog</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {liveResults.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-500">
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
                          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#F6F8FB] transition-colors text-left"
                        >
                          <div className="w-11 h-11 rounded-lg bg-[#F4F7FB] border border-slate-200/70 p-1 flex items-center justify-center shrink-0">
                            <HardwareArtwork
                              kind={product.artwork}
                              imageUrl={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs sm:text-sm font-semibold text-[#06142E] truncate">
                                {product.name}
                              </p>
                              <span className="hidden sm:inline font-mono text-[10px] text-slate-400 shrink-0">
                                {product.sku}
                              </span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span>{categoryLabels?.[product.category] || product.categoryLabel}</span>
                              {specSnippet && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono text-[#0057E7] truncate max-w-[220px]">
                                    {specSnippet}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-mono text-xs sm:text-sm font-bold text-[#06142E] tabular-nums">
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
