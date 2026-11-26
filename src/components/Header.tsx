import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Cpu,
  Heart,
  Menu,
  Radio,
  RotateCcw,
  Search,
  ShoppingBag,
  User as UserIcon,
  X,
} from 'lucide-react';
import { DEFAULT_SITE_SETTINGS } from '../data/catalog';
import { playTapSound } from '../lib/sound';
import { AvailabilityFilter, CategoryId, CategoryItem, Product } from '../types/store';
import { BrandLogo } from './BrandLogo';
import { HardwareArtwork } from './HardwareArtwork';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activePage?: 'shop' | 'track';
  categories?: CategoryItem[];
  cartCount: number;
  cartPulseKey?: number;
  wishlistCount: number;
  isSignedIn: boolean;
  searchQuery: string;
  minPrice: string;
  maxPrice: string;
  availabilityFilter: AvailabilityFilter;
  liveResults: Product[];
  categoryLabels?: Record<string, string>;
  newsTickerEnabled?: boolean;
  newsTickerItems?: string[];
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
  cartPulseKey = 0,
  wishlistCount,
  isSignedIn,
  searchQuery,
  minPrice,
  maxPrice,
  availabilityFilter,
  liveResults,
  categoryLabels,
  newsTickerEnabled = true,
  newsTickerItems,
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cartPulsing, setCartPulsing] = useState(false);
  const [barHeight, setBarHeight] = useState<number | null>(null);
  const prevPulseKeyRef = useRef(cartPulseKey);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const visibleCategories = categories.filter((c) => c.active !== false);
  const resolvedTickerItems = (
    newsTickerItems !== undefined
      ? newsTickerItems
      : DEFAULT_SITE_SETTINGS.newsTickerItems || []
  )
    .map((item) => item.trim())
    .filter(Boolean);
  const showNewsTicker = newsTickerEnabled && resolvedTickerItems.length > 0;

  useEffect(() => {
    if (cartPulseKey <= prevPulseKeyRef.current) {
      prevPulseKeyRef.current = cartPulseKey;
      return;
    }
    prevPulseKeyRef.current = cartPulseKey;
    let raf1 = 0;
    let raf2 = 0;
    setCartPulsing(false);
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setCartPulsing(true);
      });
    });
    const timer = window.setTimeout(() => {
      setCartPulsing(false);
    }, 620);
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(timer);
    };
  }, [cartPulseKey]);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      setScrollProgress(Math.min(1, Math.max(0, y / maxScroll)));
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const measure = () => {
      const nextHeight = Math.round(el.getBoundingClientRect().height);
      if (nextHeight > 0) {
        setBarHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      }
    };
    measure();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    window.addEventListener('resize', measure, { passive: true });
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [showNewsTicker]);

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
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-[background-color,box-shadow] duration-200 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-[0_6px_24px_-16px_rgba(7,26,61,0.14)]'
            : 'bg-white/90 backdrop-blur-xl'
        }`}
      >
        <div
          ref={barRef}
          className={`w-full border-b transition-colors duration-200 ${
            scrolled ? 'border-slate-200/90' : 'border-slate-200/75'
          }`}
        >
          <div className="max-w-[1440px] mx-auto px-2.5 sm:px-6 lg:px-10 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4 xl:gap-8">
        {/* Zone 1: Menu Trigger + Clean Architectural Robotera BD Brand Lockup */}
        <div className="flex items-center gap-1 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open department categories menu"
            className="p-1.5 sm:p-2 -ml-0.5 sm:-ml-2 rounded-xl text-[#071A3D] hover:text-[#087BFF] hover:bg-[#F3F7FC] border border-transparent hover:border-slate-200/80 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF]"
          >
            <Menu className="w-5 h-5" />
          </button>

          <a
            href="/"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              onGoHome();
            }}
            className="font-hero text-[13.5px] min-[390px]:text-[15px] sm:text-[18px] font-extrabold tracking-tight text-[#071A3D] whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2.5 group"
          >
            <BrandLogo
              size="sm"
              className="!w-7 !h-7 sm:!w-8 sm:!h-8 shadow-[0_4px_12px_-4px_rgba(7,26,61,0.22)] group-hover:border-[#087BFF]/60 transition-colors"
            />
            <span className="flex items-baseline gap-0.5 sm:gap-1">
              <span>ROBOTERA</span>
              <span className="text-[#087BFF] font-mono text-[11px] min-[390px]:text-[12px] sm:text-[13px] font-bold tracking-wider">
                BD
              </span>
            </span>
          </a>
        </div>

        {/* Zone 2: Clean Single-Line Navigation Links + Interactive Categories Dropdown */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-[13px] font-semibold text-[#334155]">
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setCategoriesOpen((prev) => !prev)}
              aria-expanded={categoriesOpen}
              className={`inline-flex items-center gap-1 py-1.5 whitespace-nowrap shrink-0 transition-colors ${
                categoriesOpen ? 'text-[#087BFF]' : 'hover:text-[#071A3D]'
              }`}
            >
              <span>Categories</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  categoriesOpen ? 'rotate-180 text-[#087BFF]' : ''
                }`}
              />
            </button>

            {categoriesOpen && (
              <div className="animate-slide-down absolute left-0 top-full mt-2.5 w-[560px] max-h-[calc(100dvh-5rem)] overflow-y-auto bg-white rounded-2xl border border-slate-200/90 shadow-[0_24px_56px_-18px_rgba(7,26,61,0.22)] p-4 z-50">
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#64748B]">
                    Hardware Departments
                  </span>
                  <a
                    href="/shop"
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                      e.preventDefault();
                      setCategoriesOpen(false);
                      onSelectCategory?.('all');
                    }}
                    className="text-xs font-semibold text-[#087BFF] hover:underline inline-flex items-center gap-1"
                  >
                    <span>View All Hardware</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {visibleCategories.map((cat) => (
                    <a
                      key={cat.id}
                      href={`/category/${encodeURIComponent(cat.id)}`}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                        e.preventDefault();
                        setCategoriesOpen(false);
                        if (onSelectCategory) {
                          onSelectCategory(cat.id);
                        } else {
                          onNavigateSection('categories');
                        }
                      }}
                      className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F3F7FC] border border-transparent hover:border-slate-200/90 text-left transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#F5F8FC] border border-slate-200/80 p-1 flex items-center justify-center shrink-0">
                        <HardwareArtwork
                          kind={cat.artwork}
                          imageUrl={cat.imageUrl}
                          alt={cat.name}
                          fit="contain"
                          className="w-full h-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#071A3D] group-hover:text-[#087BFF] truncate transition-colors">
                          {cat.name}
                        </p>
                        <p className="text-[11px] font-mono text-[#64748B] truncate">
                          {cat.countLabel}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {[
            { label: 'Shop Hardware', href: '/shop', action: () => onNavigateSection('best-selling'), active: false },
            { label: 'New Arrivals', href: '/just-arrived', action: () => onNavigateSection('just-arrived'), active: false },
            { label: 'Robotics Kits', href: '/bundles', action: () => onNavigateSection('bundles'), active: false },
            { label: 'Guides', href: '/guides', action: () => onNavigateSection('lab-guides'), active: false },
            { label: 'Track Order', href: '/track-order', action: onOpenTracking, active: activePage === 'track' },
          ].map((navItem) => (
            <a
              key={navItem.label}
              href={navItem.href}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                navItem.action();
              }}
              className={`relative py-1.5 whitespace-nowrap shrink-0 transition-colors after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:rounded-full after:bg-[#087BFF] after:origin-left after:transition-transform after:duration-200 ${
                navItem.active
                  ? 'text-[#087BFF] font-semibold after:scale-x-100'
                  : 'hover:text-[#071A3D] after:scale-x-0 hover:after:scale-x-100'
              }`}
            >
              {navItem.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Install App, Smart Search, Wishlist, Account & Primary Cart Action */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
          <PWAInstallButton variant="header" />

          <button
            type="button"
            onClick={() => {
              playTapSound();
              setSearchOpen((prev) => !prev);
            }}
            aria-label="Toggle product search"
            aria-expanded={searchOpen}
            className={`h-8 sm:h-10 px-2 sm:px-3.5 rounded-xl inline-flex items-center gap-2 border transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] ${
              searchOpen || hasActiveSearchFilters
                ? 'text-[#087BFF] bg-[#EFF6FF] border-[#087BFF]/45'
                : 'bg-[#F3F7FC] hover:bg-[#E7EFFA] border-slate-200/90 text-[#071A3D]'
            }`}
          >
            {searchOpen ? <X className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> : <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
            <span className="hidden xl:inline text-xs font-medium text-[#475569]">
              Search ESP32, LiDAR...
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              onOpenWishlist();
            }}
            aria-label={`Saved items (${wishlistCount})`}
            className="relative p-1.5 sm:p-2.5 rounded-xl text-[#071A3D] hover:text-[#087BFF] hover:bg-[#F3F7FC] transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF]"
          >
            <Heart className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            {wishlistCount > 0 && (
              <span
                key={wishlistCount}
                className="animate-badge-bounce absolute top-0.5 right-0.5 sm:top-1 sm:right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#087BFF] text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums"
              >
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              onOpenAuth();
            }}
            aria-label={isSignedIn ? 'Open account settings' : 'Sign in to Robotera BD'}
            className={`p-1.5 sm:p-2.5 rounded-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] ${
              isSignedIn
                ? 'text-[#087BFF] bg-[#EFF6FF] hover:bg-blue-100/80'
                : 'text-[#071A3D] hover:text-[#087BFF] hover:bg-[#F3F7FC]'
            }`}
          >
            <UserIcon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              onOpenCart();
            }}
            aria-label={`Open shopping cart (${cartCount} items)`}
            className={`cta-sheen inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 h-8 sm:h-10 rounded-xl bg-[#071A3D] hover:bg-[#0D2554] active:scale-[0.97] border text-white text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap shrink-0 shadow-[0_6px_16px_-6px_rgba(7,26,61,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] focus-visible:ring-offset-2 ${
              cartPulsing
                ? 'border-[#00CFFF]/85 shadow-[0_0_18px_rgba(0,207,255,0.32)]'
                : 'border-[#071A3D] hover:border-[#087BFF]/60'
            }`}
          >
            <span className="relative inline-flex items-center justify-center">
              {cartPulsing && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-1.5 rounded-full bg-[#00CFFF]/30 ring-1 ring-[#00CFFF]/60 animate-cart-pulse-ring"
                />
              )}
              <ShoppingBag
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-200 ${
                  cartPulsing ? 'animate-cart-pulse text-[#00CFFF]' : ''
                }`}
              />
            </span>
            <span className="hidden sm:inline">Cart</span>
            <span
              key={cartCount}
              className={`animate-badge-bounce font-mono text-[11px] px-1.5 py-0.5 rounded-md tabular-nums ${
                cartCount > 0 ? 'bg-[#087BFF] text-white' : 'bg-white/15 text-white'
              }`}
            >
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Scroll Reading Progress Hairline Beam */}
      <div
        aria-hidden="true"
        className="pointer-events-none w-full h-[2px] bg-transparent overflow-hidden"
      >
        <div
          className="h-full w-full origin-left bg-gradient-to-r from-[#1677FF] via-[#00C8FF] to-[#1677FF] transition-transform duration-75 ease-out"
          style={{ transform: `scaleX(${scrollProgress})` }}
        />
      </div>

      {/* Attached Scrolling News & Announcements Ticker Bar */}
      {showNewsTicker && (
        <div
          aria-label="Store news and hardware updates"
          className="ticker-container relative w-full h-8 sm:h-9 bg-[#071A3D] text-[#F5F8FF] border-t border-[#16346B]/80 border-b border-[rgba(100,150,255,0.2)] overflow-hidden"
        >
          <div className="max-w-[1440px] mx-auto h-full flex items-center relative">
            <div className="relative z-10 h-full px-3 sm:px-4 bg-[#0A1428] border-r border-[rgba(100,150,255,0.22)] flex items-center gap-1.5 shrink-0">
              <Radio className="w-3 h-3 text-[#00C8FF] shrink-0" aria-hidden="true" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#00C8FF] whitespace-nowrap">
                Updates
              </span>
            </div>

            <div className="flex-1 min-w-0 overflow-hidden relative h-full flex items-center">
              <div className="animate-ticker-marquee flex items-center w-max will-change-transform">
                {[0, 1].map((dupIndex) => (
                  <div
                    key={dupIndex}
                    aria-hidden={dupIndex === 1}
                    className="flex items-center shrink-0"
                  >
                    {resolvedTickerItems.map((item, idx) => (
                      <span
                        key={`${dupIndex}-${idx}`}
                        className="inline-flex items-center gap-3.5 px-4 py-0.5 font-sans text-[12px] sm:text-[12.5px] leading-[1.6] font-medium text-[#E2ECFF] whitespace-nowrap"
                      >
                        <span>{item}</span>
                        <span className="text-[#00C8FF] font-bold" aria-hidden="true">
                          ·
                        </span>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#071A3D] to-transparent"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#071A3D] to-transparent"
              />
            </div>
          </div>
        </div>
      )}
        </div>

      {/* Expandable Live Technical Catalog Search Panel */}
      {searchOpen && (
        <div
          className={`animate-slide-down border-b border-slate-200/90 bg-white/98 backdrop-blur-xl shadow-[0_24px_48px_-16px_rgba(7,26,61,0.16)] overflow-y-auto overscroll-contain ${
            showNewsTicker ? 'max-h-[calc(100dvh-6.5rem)]' : 'max-h-[calc(100dvh-4.25rem)]'
          }`}
        >
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-4 space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-2.5">
              <div className="relative flex-1 flex items-center bg-[#F5F8FC] border border-slate-200/90 rounded-xl px-3.5 h-10 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#087BFF] focus-within:border-[#087BFF] transition-colors">
                <Search className="w-4 h-4 text-[#64748B] shrink-0 mr-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search hardware model, SKU, or specs (3.3V UART, LiDAR)..."
                  autoFocus
                  className="w-full bg-transparent text-base sm:text-sm text-[#071A3D] placeholder:text-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    aria-label="Clear search query"
                    className="text-slate-400 hover:text-[#071A3D] p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Price Range & Availability Controls */}
              <div className="grid grid-cols-2 sm:flex sm:flex-nowrap items-center gap-2">
                <div className="col-span-2 sm:col-span-1 flex items-center gap-1 bg-[#F5F8FC] border border-slate-200/90 rounded-xl px-2.5 h-10">
                  <span className="text-[11px] font-semibold text-[#64748B]">৳</span>
                  <input
                    type="number"
                    min={0}
                    value={minPrice}
                    onChange={(e) => onMinPriceChange(e.target.value)}
                    placeholder="Min"
                    aria-label="Minimum price BDT"
                    className="flex-1 min-w-0 sm:w-16 text-base sm:text-xs font-mono text-[#071A3D] bg-transparent focus:outline-none"
                  />
                  <span className="text-slate-300">–</span>
                  <input
                    type="number"
                    min={0}
                    value={maxPrice}
                    onChange={(e) => onMaxPriceChange(e.target.value)}
                    placeholder="Max"
                    aria-label="Maximum price BDT"
                    className="flex-1 min-w-0 sm:w-16 text-base sm:text-xs font-mono text-[#071A3D] bg-transparent focus:outline-none"
                  />
                </div>

                <select
                  value={availabilityFilter}
                  onChange={(e) => onAvailabilityChange(e.target.value as AvailabilityFilter)}
                  aria-label="Filter by availability"
                  className="h-10 px-3 rounded-xl bg-[#F5F8FC] border border-slate-200/90 text-xs font-semibold text-[#071A3D] focus:outline-none focus:ring-2 focus:ring-[#087BFF]"
                >
                  <option value="all">All Stock</option>
                  <option value="in-stock">In Stock Only</option>
                  <option value="low-stock">Low Stock (1–5)</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-[#087BFF] hover:bg-[#0669DB] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
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
                  <Cpu className="w-3.5 h-3.5 text-[#087BFF]" />
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
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[#087BFF] border-[#087BFF] text-white'
                          : 'bg-[#F5F8FC] border-slate-200 text-[#071A3D] hover:border-[#087BFF]/60'
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
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#087BFF] hover:underline whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Real-Time Instant Search Suggestions */}
            {hasActiveSearchFilters && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-[#F5F8FC] border-b border-slate-100 flex items-center justify-between text-xs text-[#64748B]">
                  <span>
                    Real-time matches:{' '}
                    <strong className="font-mono text-[#071A3D] tabular-nums">
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
                      className="font-semibold text-[#087BFF] hover:underline inline-flex items-center gap-1"
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
                          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#F5F8FC] transition-colors text-left"
                        >
                          <div className="w-11 h-11 rounded-lg bg-[#F3F7FC] border border-slate-200/70 p-1 flex items-center justify-center shrink-0">
                            <HardwareArtwork
                              kind={product.artwork}
                              imageUrl={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs sm:text-sm font-semibold text-[#071A3D] truncate">
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
                                  <span className="font-mono text-[#087BFF] truncate max-w-[220px]">
                                    {specSnippet}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-mono text-xs sm:text-sm font-bold text-[#071A3D] tabular-nums">
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

      <div
        aria-hidden="true"
        className={`w-full shrink-0 ${showNewsTicker ? 'h-[91px] sm:h-[103px]' : 'h-[59px] sm:h-[67px]'}`}
        style={barHeight !== null ? { height: `${barHeight}px` } : undefined}
      />
    </>
  );
};
