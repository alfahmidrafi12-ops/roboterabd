import { useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { BellRing, CheckCircle2, ShoppingBag, X } from 'lucide-react';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { BestSellingSection } from './components/BestSellingSection';
import { BlogSection } from './components/BlogSection';
import { CartDrawer } from './components/CartDrawer';
import { CategoryCarousel } from './components/CategoryCarousel';
import { DiscountBanner } from './components/DiscountBanner';
import { FeaturedCarousel } from './components/FeaturedCarousel';
import { FooterSection } from './components/FooterSection';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { OrderTrackingSection } from './components/OrderTrackingSection';
import { ProductModal } from './components/ProductModal';
import { PromoBanners } from './components/PromoBanners';
import { ScrollingBannerSection } from './components/ScrollingBannerSection';
import { SidebarMenu } from './components/SidebarMenu';
import { WhatsAppButton } from './components/WhatsAppButton';
import { WishlistDrawer } from './components/WishlistDrawer';
import { CATEGORIES, DEFAULT_BANNERS, DEFAULT_SITE_SETTINGS, PRODUCTS } from './data/catalog';
import {
  createPriceAlert,
  subscribeAuth,
  subscribeBanners,
  subscribeCategories,
  subscribeProducts,
  subscribeSiteSettings,
  testConnection,
} from './lib/firebase';
import {
  AvailabilityFilter,
  BannerItem,
  CartItem,
  CategoryId,
  CategoryItem,
  LocalPriceWatch,
  Product,
  SiteImagesConfig,
  SortOption,
} from './types/store';

const STORAGE_CART_KEY = 'robotera_bd_cart_v1';
const STORAGE_WISHLIST_KEY = 'robotera_bd_wishlist_v1';
const STORAGE_LAST_ORDER_KEY = 'robotera_bd_last_order_v1';
const STORAGE_RECENT_ORDERS_KEY = 'robotera_bd_recent_orders_v1';
const STORAGE_PRICE_WATCHES_KEY = 'robotera_bd_price_watches_v1';

function parseTrackingHash(): { isTrack: boolean; orderId: string | null } {
  if (typeof window === 'undefined') return { isTrack: false, orderId: null };
  const hash = window.location.hash;
  if (hash === '#track' || hash.startsWith('#track=')) {
    const rawId = hash.startsWith('#track=') ? decodeURIComponent(hash.slice('#track='.length)) : '';
    return { isTrack: true, orderId: rawId.trim() || null };
  }
  return { isTrack: false, orderId: null };
}

export default function App() {
  const initialTrack = parseTrackingHash();
  const [activePage, setActivePage] = useState<'shop' | 'track'>(
    initialTrack.isTrack ? 'track' : 'shop'
  );
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [startInCheckout, setStartInCheckout] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Live Firestore Data + Store Admin State
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [categories, setCategories] = useState<CategoryItem[]>(CATEGORIES);
  const [banners, setBanners] = useState<BannerItem[]>(DEFAULT_BANNERS);
  const [siteSettings, setSiteSettings] = useState<SiteImagesConfig>(DEFAULT_SITE_SETTINGS);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [recentOrderIds, setRecentOrderIds] = useState<string[]>(() => {
    try {
      const savedList = localStorage.getItem(STORAGE_RECENT_ORDERS_KEY);
      if (savedList) {
        const parsed = JSON.parse(savedList) as string[];
        if (Array.isArray(parsed)) return parsed.slice(0, 5);
      }
      const legacy = localStorage.getItem(STORAGE_LAST_ORDER_KEY);
      return legacy ? [legacy] : [];
    } catch {
      return [];
    }
  });
  const [autoTrackOrderId, setAutoTrackOrderId] = useState<string | null>(initialTrack.orderId);

  // Add-to-cart toast feedback
  const [toastProduct, setToastProduct] = useState<{ name: string; qty: number } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Price-drop watches & live alert banner
  const [priceWatches, setPriceWatches] = useState<LocalPriceWatch[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PRICE_WATCHES_KEY);
      return saved ? (JSON.parse(saved) as LocalPriceWatch[]) : [];
    } catch {
      return [];
    }
  });
  const [priceDropNotice, setPriceDropNotice] = useState<{
    product: Product;
    oldPrice: number;
    email: string;
  } | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CART_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WISHLIST_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  // Connect Firebase Auth, Firestore live streams, and connection check
  useEffect(() => {
    testConnection();

    const unsubAuth = subscribeAuth((user) => setAuthUser(user));
    const unsubProducts = subscribeProducts(
      (cloudProducts) => {
        if (cloudProducts.length > 0) {
          setProducts(cloudProducts);
        }
      },
      (err) => console.error('Products sync error:', err)
    );
    const unsubCategories = subscribeCategories(
      (cloudCategories) => {
        if (cloudCategories.length > 0) {
          setCategories(cloudCategories);
        }
      },
      (err) => console.error('Categories sync error:', err)
    );
    const unsubBanners = subscribeBanners(
      (cloudBanners) => {
        if (cloudBanners.length > 0) {
          setBanners(cloudBanners);
        }
      },
      (err) => console.error('Banners sync error:', err)
    );
    const unsubSite = subscribeSiteSettings(
      (cloudSite) => {
        if (cloudSite) {
          setSiteSettings({ ...DEFAULT_SITE_SETTINGS, ...cloudSite });
        }
      },
      (err) => console.error('Site settings sync error:', err)
    );

    return () => {
      unsubAuth();
      unsubProducts();
      unsubCategories();
      unsubBanners();
      unsubSite();
    };
  }, []);

  // Synchronize persisted cart items with live product prices, images, and stock
  useEffect(() => {
    if (products.length === 0) return;
    setCartItems((prev) => {
      if (prev.length === 0) return prev;
      let changed = false;
      const next = prev.map((item) => {
        const live = products.find((p) => p.id === item.product.id);
        if (!live) return item;
        const clampedQty =
          live.stock > 0 ? Math.min(item.quantity, live.stock) : item.quantity;
        if (
          live.price !== item.product.price ||
          live.stock !== item.product.stock ||
          live.name !== item.product.name ||
          live.imageUrl !== item.product.imageUrl ||
          clampedQty !== item.quantity
        ) {
          changed = true;
          return { ...item, product: live, quantity: clampedQty };
        }
        return item;
      });
      return changed ? next : prev;
    });
  }, [products]);

  // Detect live price drops for watched products
  useEffect(() => {
    if (products.length === 0 || priceWatches.length === 0) return;
    let triggered: { product: Product; oldPrice: number; email: string } | null = null;
    let updated = false;

    const nextWatches = priceWatches.map((watch) => {
      const live = products.find((p) => p.id === watch.productId);
      if (live && live.price < watch.baselinePrice) {
        if (!triggered) {
          triggered = { product: live, oldPrice: watch.baselinePrice, email: watch.email };
        }
        updated = true;
        return { ...watch, baselinePrice: live.price, productName: live.name };
      }
      return watch;
    });

    if (updated) {
      setPriceWatches(nextWatches);
    }
    if (triggered) {
      setPriceDropNotice(triggered);
    }
  }, [products, priceWatches]);

  // Secret Admin Access (#admin or ?admin=1 + Ctrl/Cmd+Shift+A) + Dedicated Tracking Page Hash Sync
  useEffect(() => {
    const handleRouteSync = () => {
      const hashIsAdmin = window.location.hash === '#admin';
      const paramsIsAdmin = new URLSearchParams(window.location.search).get('admin') === '1';
      if (hashIsAdmin || paramsIsAdmin) {
        setAdminOpen(true);
      }
      const trackState = parseTrackingHash();
      if (trackState.isTrack) {
        setActivePage('track');
        if (trackState.orderId) {
          setAutoTrackOrderId(trackState.orderId);
        }
      } else if (!hashIsAdmin) {
        setActivePage('shop');
      }
    };

    handleRouteSync();
    window.addEventListener('hashchange', handleRouteSync);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', handleRouteSync);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Global Escape key + body scroll lock when any overlay/modal is open
  const hasAnyOverlayOpen = Boolean(
    selectedProduct || cartOpen || wishlistOpen || sidebarOpen || authModalOpen || adminOpen
  );

  useEffect(() => {
    if (!hasAnyOverlayOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (adminOpen) {
        setAdminOpen(false);
        if (window.location.hash === '#admin') {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } else if (authModalOpen) {
        setAuthModalOpen(false);
      } else if (selectedProduct) {
        setSelectedProduct(null);
      } else if (cartOpen) {
        setCartOpen(false);
        setStartInCheckout(false);
      } else if (wishlistOpen) {
        setWishlistOpen(false);
      } else if (sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [
    hasAnyOverlayOpen,
    adminOpen,
    authModalOpen,
    selectedProduct,
    cartOpen,
    wishlistOpen,
    sidebarOpen,
  ]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage quota errors
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WISHLIST_KEY, JSON.stringify(wishlistIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [wishlistIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RECENT_ORDERS_KEY, JSON.stringify(recentOrderIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [recentOrderIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PRICE_WATCHES_KEY, JSON.stringify(priceWatches));
    } catch {
      // Ignore storage quota errors
    }
  }, [priceWatches]);

  const openTrackingPage = (orderId?: string) => {
    setActivePage('track');
    if (orderId) {
      setAutoTrackOrderId(orderId);
    }
    const nextHash = orderId ? `#track=${encodeURIComponent(orderId)}` : '#track';
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId?: string) => {
    if (sectionId === 'order-tracking') {
      openTrackingPage();
      return;
    }
    const wasTrackPage = activePage !== 'shop';
    if (wasTrackPage) {
      setActivePage('shop');
      if (window.location.hash.startsWith('#track')) {
        window.history.pushState(null, '', `${window.location.pathname}${window.location.search}`);
      }
    }
    if (!sectionId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const runScroll = () => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    if (wasTrackPage) {
      window.setTimeout(runScroll, 50);
    } else {
      runScroll();
    }
  };

  const handleSelectCategory = (categoryId: CategoryId) => {
    setActiveCategory(categoryId);
    scrollToSection('best-selling');
  };

  const handleQuickSearch = (term: string) => {
    setActiveCategory('all');
    setSearchQuery(term);
    scrollToSection('best-selling');
  };

  const handleClearFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setAvailabilityFilter('all');
    setSortBy('featured');
  };

  const showAddedToast = (name: string, qty: number) => {
    setToastProduct({ name, qty });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastProduct(null);
    }, 3200);
  };

  const handleAddToCart = (
    product: Product,
    quantity: number,
    variant?: string,
    silentToast = false
  ) => {
    if (product.stock <= 0) return;
    const chosenVariant = variant ?? product.variants?.[0];
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.variant === chosenVariant
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          product,
          quantity: Math.min(product.stock, updated[existingIndex].quantity + quantity),
        };
        return updated;
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity), variant: chosenVariant }];
    });
    if (!silentToast) {
      showAddedToast(product.name, quantity);
    }
  };

  const handleBuyNow = (product: Product, quantity: number, variant?: string) => {
    if (product.stock <= 0) return;
    handleAddToCart(product, quantity, variant, true);
    setSelectedProduct(null);
    setStartInCheckout(true);
    setCartOpen(true);
  };

  const handleUpdateCartQty = (productId: string, variant: string | undefined, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.variant === variant) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            const maxCap = Math.max(1, item.product.stock);
            return { ...item, quantity: Math.min(maxCap, nextQty) };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveCartItem = (productId: string, variant: string | undefined) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.variant === variant))
    );
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSubscribePriceDrop = async (product: Product, email: string) => {
    await createPriceAlert({
      productId: product.id,
      productName: product.name,
      email,
      baselinePrice: product.price,
    });
    setPriceWatches((prev) => [
      { productId: product.id, productName: product.name, email, baselinePrice: product.price },
      ...prev.filter((w) => w.productId !== product.id),
    ]);
  };

  const categoryLabels = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const matchesSearchAndFilters = (
    product: Product,
    tokens: string[],
    parsedMin: number | null,
    parsedMax: number | null
  ): boolean => {
    if (parsedMin !== null && product.price < parsedMin) return false;
    if (parsedMax !== null && product.price > parsedMax) return false;

    if (availabilityFilter === 'in-stock' && product.stock <= 0) return false;
    if (availabilityFilter === 'low-stock' && (product.stock <= 0 || product.stock > 5)) {
      return false;
    }
    if (availabilityFilter === 'out-of-stock' && product.stock > 0) return false;

    if (tokens.length === 0) return true;

    const liveCatLabel = categoryLabels[product.category] || product.categoryLabel;
    const specsCorpus = product.specs.map((s) => `${s.label} ${s.value}`).join(' ');
    const variantsCorpus = (product.variants || []).join(' ');
    const searchableCorpus = [
      product.name,
      product.sku,
      liveCatLabel,
      product.shortDesc,
      product.tag || '',
      specsCorpus,
      variantsCorpus,
    ]
      .join(' ')
      .toLowerCase();

    return tokens.every((token) => searchableCorpus.includes(token));
  };

  const liveSearchResults = useMemo(() => {
    const tokens = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const parsedMin = minPrice.trim() !== '' && !Number.isNaN(Number(minPrice)) ? Number(minPrice) : null;
    const parsedMax = maxPrice.trim() !== '' && !Number.isNaN(Number(maxPrice)) ? Number(maxPrice) : null;
    return products.filter((p) => matchesSearchAndFilters(p, tokens, parsedMin, parsedMax));
  }, [products, categoryLabels, searchQuery, minPrice, maxPrice, availabilityFilter]);

  const filteredCatalog = useMemo(() => {
    const tokens = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const parsedMin = minPrice.trim() !== '' && !Number.isNaN(Number(minPrice)) ? Number(minPrice) : null;
    const parsedMax = maxPrice.trim() !== '' && !Number.isNaN(Number(maxPrice)) ? Number(maxPrice) : null;

    const filtered = products.filter((product) => {
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
      return matchesCategory && matchesSearchAndFilters(product, tokens, parsedMin, parsedMax);
    });

    const sorted = [...filtered];
    if (sortBy === 'price-asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      sorted.sort(
        (a, b) => Number(Boolean(b.isJustArrived)) - Number(Boolean(a.isJustArrived))
      );
    }
    return sorted;
  }, [
    products,
    categoryLabels,
    activeCategory,
    searchQuery,
    minPrice,
    maxPrice,
    availabilityFilter,
    sortBy,
  ]);

  const justArrivedProducts = useMemo(
    () => products.filter((product) => product.isJustArrived),
    [products]
  );

  const wishlistedProducts = useMemo(
    () => products.filter((product) => wishlistIds.includes(product.id)),
    [products, wishlistIds]
  );

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header
        activePage={activePage}
        cartCount={totalCartCount}
        wishlistCount={wishlistedProducts.length}
        isSignedIn={Boolean(authUser)}
        searchQuery={searchQuery}
        minPrice={minPrice}
        maxPrice={maxPrice}
        availabilityFilter={availabilityFilter}
        liveResults={liveSearchResults}
        categoryLabels={categoryLabels}
        onSearchChange={setSearchQuery}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        onAvailabilityChange={setAvailabilityFilter}
        onClearFilters={handleClearFilters}
        onSelectProduct={(product) => setSelectedProduct(product)}
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenCart={() => {
          setStartInCheckout(false);
          setCartOpen(true);
        }}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onNavigateSection={scrollToSection}
        onGoHome={() => scrollToSection()}
        onOpenTracking={() => openTrackingPage()}
      />

      <main className="flex-1">
        {activePage === 'track' ? (
          <OrderTrackingSection
            recentOrderIds={recentOrderIds}
            autoTrackOrderId={autoTrackOrderId}
            onBackToStore={() => scrollToSection()}
          />
        ) : (
          <>
            <HeroSection
              siteSettings={siteSettings}
              onShopNow={() => scrollToSection('best-selling')}
              onExploreKits={() => {
                const hasKits = categories.some((c) => c.id === 'robotics-kits');
                handleSelectCategory(hasKits ? 'robotics-kits' : 'all');
              }}
            />

            <ScrollingBannerSection
              banners={banners}
              onSelectCategory={handleSelectCategory}
            />

            <CategoryCarousel
              categories={categories}
              activeCategory={activeCategory}
              onSelectCategory={handleSelectCategory}
            />

            <BestSellingSection
              products={filteredCatalog}
              categories={categories}
              activeCategory={activeCategory}
              searchQuery={searchQuery}
              minPrice={minPrice}
              maxPrice={maxPrice}
              availabilityFilter={availabilityFilter}
              sortBy={sortBy}
              wishlistIds={wishlistIds}
              onSelectCategory={setActiveCategory}
              onSearchChange={setSearchQuery}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              onAvailabilityChange={setAvailabilityFilter}
              onSortChange={setSortBy}
              onClearFilters={handleClearFilters}
              onToggleWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
              onOpenDetail={setSelectedProduct}
            />

            <PromoBanners
              siteSettings={siteSettings}
              onSelectCategory={handleSelectCategory}
            />

            <FeaturedCarousel
              products={justArrivedProducts}
              categoryLabels={categoryLabels}
              wishlistIds={wishlistIds}
              onToggleWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
              onOpenDetail={setSelectedProduct}
            />

            <DiscountBanner
              bannerImageUrl={siteSettings.discountBannerImageUrl}
              onApplyCoupon={(code) => setAppliedCoupon(code)}
            />

            <BlogSection blogImages={siteSettings.blogImages} />
          </>
        )}
      </main>

      <FooterSection
        categories={categories}
        onQuickSearch={handleQuickSearch}
        onSelectCategory={handleSelectCategory}
        onNavigateSection={scrollToSection}
        onOpenTracking={() => openTrackingPage()}
        onSecretAdminTrigger={() => setAdminOpen(true)}
      />

      {/* Interactive Drawers & Modals */}
      <SidebarMenu
        isOpen={sidebarOpen}
        categories={categories}
        activeCategory={activeCategory}
        isSignedIn={Boolean(authUser)}
        userEmail={authUser?.email}
        onClose={() => setSidebarOpen(false)}
        onSelectCategory={handleSelectCategory}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
        onOpenTracking={() => openTrackingPage()}
      />

      <ProductModal
        product={selectedProduct}
        categoryDisplayName={
          selectedProduct
            ? categoryLabels[selectedProduct.category] || selectedProduct.categoryLabel
            : undefined
        }
        isWishlisted={selectedProduct ? wishlistIds.includes(selectedProduct.id) : false}
        defaultEmail={authUser?.email}
        watchedAlert={
          selectedProduct
            ? priceWatches.find((w) => w.productId === selectedProduct.id) ?? null
            : null
        }
        onClose={() => setSelectedProduct(null)}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        onSubscribePriceDrop={handleSubscribePriceDrop}
      />

      <CartDrawer
        isOpen={cartOpen}
        items={cartItems}
        appliedCoupon={appliedCoupon}
        startInCheckout={startInCheckout}
        onClose={() => {
          setCartOpen(false);
          setStartInCheckout(false);
        }}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onApplyCoupon={setAppliedCoupon}
        onClearCart={() => setCartItems([])}
        onOrderCreated={(orderId) => {
          setRecentOrderIds((prev) => [orderId, ...prev.filter((id) => id !== orderId)].slice(0, 5));
          try {
            localStorage.setItem(STORAGE_LAST_ORDER_KEY, orderId);
          } catch {
            // Ignore storage errors
          }
        }}
        onTrackOrder={(orderId) => {
          openTrackingPage(orderId);
        }}
      />

      <WishlistDrawer
        isOpen={wishlistOpen}
        products={wishlistedProducts}
        onClose={() => setWishlistOpen(false)}
        onRemove={handleToggleWishlist}
        onMoveToCart={(product) => {
          handleAddToCart(product, 1, undefined, true);
          setWishlistOpen(false);
          setStartInCheckout(false);
          setCartOpen(true);
        }}
        onOpenDetail={(product) => {
          setWishlistOpen(false);
          setSelectedProduct(product);
        }}
      />

      {/* Account Sign-In / Sign-Up & Order History Modal */}
      <AuthModal
        isOpen={authModalOpen}
        user={authUser}
        onClose={() => setAuthModalOpen(false)}
        onOpenAdmin={() => setAdminOpen(true)}
        onTrackOrder={(orderId) => {
          openTrackingPage(orderId);
        }}
      />

      {/* Secret Store Owner Admin Console */}
      <AdminPanel
        isOpen={adminOpen}
        user={authUser}
        products={products}
        categories={categories}
        banners={banners}
        siteSettings={siteSettings}
        onClose={() => {
          setAdminOpen(false);
          if (window.location.hash === '#admin') {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
      />

      {/* Live Price Drop Notification Toast */}
      {priceDropNotice && !cartOpen && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom))] md:bottom-20 left-3 right-3 sm:right-auto sm:left-6 z-40 sm:max-w-sm bg-emerald-950 text-white rounded-xl shadow-2xl border border-emerald-500/40 p-3.5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <BellRing className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                Price Drop: {priceDropNotice.product.name}
              </p>
              <p className="text-[11px] text-emerald-200 tabular-nums">
                Now ৳{priceDropNotice.product.price.toLocaleString('en-IN')} (was ৳
                {priceDropNotice.oldPrice.toLocaleString('en-IN')})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedProduct(priceDropNotice.product);
                setPriceDropNotice(null);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold whitespace-nowrap"
            >
              View
            </button>
            <button
              type="button"
              onClick={() => setPriceDropNotice(null)}
              aria-label="Dismiss price drop alert"
              className="p-1 text-emerald-300 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add-to-Cart Toast Notification */}
      {toastProduct && !cartOpen && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(8.25rem+env(safe-area-inset-bottom))] md:bottom-6 left-3 right-3 sm:right-auto sm:left-6 z-40 sm:max-w-sm bg-[#06142E] text-white rounded-xl shadow-2xl border border-white/10 p-3.5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{toastProduct.name}</p>
              <p className="text-[11px] text-slate-300">
                Added {toastProduct.qty} {toastProduct.qty === 1 ? 'unit' : 'units'} to cart
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setToastProduct(null);
                setStartInCheckout(false);
                setCartOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>View Cart</span>
            </button>
            <button
              type="button"
              onClick={() => setToastProduct(null)}
              aria-label="Dismiss cart notification"
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Offline Connectivity Status */}
      <OfflineIndicator />

      {/* Native-Style Mobile Bottom Navigation */}
      <MobileBottomNav
        activePage={activePage}
        cartCount={totalCartCount}
        isSignedIn={Boolean(authUser)}
        onGoHome={() => scrollToSection()}
        onOpenDepartments={() => setSidebarOpen(true)}
        onTrackOrder={() => openTrackingPage()}
        onOpenCart={() => {
          setStartInCheckout(false);
          setCartOpen(true);
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Floating WhatsApp Support Button */}
      <WhatsAppButton />
    </div>
  );
}
