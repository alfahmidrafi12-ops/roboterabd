import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Bell,
  CheckCircle2,
  Database,
  Edit3,
  FolderTree,
  Image as ImageIcon,
  LayoutTemplate,
  LogOut,
  Mail,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShoppingBag,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { BLOG_POSTS, DEFAULT_SITE_SETTINGS } from '../data/catalog';
import { isValidHttpUrl, resolveProductVideo } from '../lib/video';
import {
  ADMIN_EMAIL,
  deleteOrderInFirestore,
  deletePriceAlert,
  isVerifiedAdminUser,
  markPriceAlertNotified,
  removeBanner,
  removeCategory,
  removeProduct,
  resendVerificationEmail,
  saveBanner,
  saveCategory,
  saveProduct,
  saveSiteSettings,
  seedCatalogIfEmpty,
  signInAdminWithGoogle,
  signInWithEmail,
  signOutAdmin,
  subscribeOrders,
  subscribePriceAlerts,
  updateOrderInFirestore,
} from '../lib/firebase';
import {
  ArtworkKind,
  BannerItem,
  BannerTheme,
  CategoryId,
  CategoryItem,
  OrderStatus,
  PriceAlert,
  Product,
  SiteImagesConfig,
  StoredOrder,
} from '../types/store';
import { formatAuthErrorMessage } from './AuthModal';
import { HardwareArtwork } from './HardwareArtwork';
import { ImageSourceField } from './ImageSourceField';

interface AdminPanelProps {
  isOpen: boolean;
  user: User | null;
  products: Product[];
  categories: CategoryItem[];
  banners: BannerItem[];
  siteSettings: SiteImagesConfig;
  onClose: () => void;
}

const ARTWORK_OPTIONS: ArtworkKind[] = [
  'esp32',
  'arduino',
  'raspberry-pi',
  'stm32',
  'lidar',
  'ultrasonic',
  'imu',
  'servo',
  'stepper',
  'brushless',
  'driver',
  'arm',
  'rover',
  'lipo',
  'bms',
  'buck',
  'oled',
  'lora',
  'soldering',
  'analyzer',
];

const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Shipped',
  'Delivered',
  'Cancelled',
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  user,
  products,
  categories,
  banners,
  siteSettings,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'orders' | 'products' | 'categories' | 'banners' | 'site-images' | 'alerts'
  >('orders');
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const [authError, setAuthError] = useState('');
  const [authInfo, setAuthInfo] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [busyMessage, setBusyMessage] = useState('');
  const [adminError, setAdminError] = useState('');
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [seedingDone, setSeedingDone] = useState(false);

  // Editing States
  const [editingOrder, setEditingOrder] = useState<StoredOrder | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [variantsText, setVariantsText] = useState('');
  const [specsText, setSpecsText] = useState('');

  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [isCreatingBanner, setIsCreatingBanner] = useState(false);

  const [draftSiteSettings, setDraftSiteSettings] = useState<SiteImagesConfig>(siteSettings);

  useEffect(() => {
    setDraftSiteSettings(siteSettings);
  }, [siteSettings]);

  const isAdmin = isVerifiedAdminUser(user);

  useEffect(() => {
    if (!isOpen || !isAdmin) {
      setOrders([]);
      setPriceAlerts([]);
      return;
    }

    const unsubOrders = subscribeOrders(
      (list) => setOrders(list),
      (err) => {
        console.error('Failed to load orders:', err);
      }
    );

    const unsubAlerts = subscribePriceAlerts(
      (list) => setPriceAlerts(list),
      (err) => {
        console.error('Failed to load price alerts:', err);
      }
    );

    if (!seedingDone) {
      seedCatalogIfEmpty()
        .then(() => setSeedingDone(true))
        .catch(() => {});
    }

    return () => {
      unsubOrders();
      unsubAlerts();
    };
  }, [isOpen, isAdmin, seedingDone]);

  if (!isOpen) return null;

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthInfo('');
    setAuthBusy(true);
    try {
      await signInWithEmail(loginEmail, loginPassword);
      setLoginPassword('');
    } catch (err) {
      setAuthError(formatAuthErrorMessage(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthInfo('');
    setAuthBusy(true);
    try {
      await signInAdminWithGoogle();
    } catch (err) {
      setAuthError(formatAuthErrorMessage(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleResendVerification = async () => {
    setAuthError('');
    setAuthInfo('');
    setAuthBusy(true);
    try {
      await resendVerificationEmail();
      setAuthInfo('Verification link sent to your inbox. Confirm it, then click Refresh Status.');
    } catch (err) {
      setAuthError(formatAuthErrorMessage(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleRefreshAuth = async () => {
    if (!user) return;
    setAuthError('');
    setAuthInfo('');
    setAuthBusy(true);
    try {
      await user.reload();
      await user.getIdToken(true);
      if (user.emailVerified) {
        window.location.reload();
      } else {
        setAuthInfo('Email is still unverified. Click the link in your inbox or use Google Sign-In.');
      }
    } catch (err) {
      setAuthError(formatAuthErrorMessage(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const showBusyToast = (msg: string, ms = 2500) => {
    setBusyMessage(msg);
    window.setTimeout(() => setBusyMessage(''), ms);
  };

  const formatAdminErr = (err: unknown, fallback: string) => {
    const raw = err instanceof Error ? err.message : String(err);
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      if (parsed.error) return parsed.error;
    } catch {
      // ignore
    }
    return raw || fallback;
  };

  const handleSyncDefaults = async () => {
    setAdminError('');
    setBusyMessage('Syncing catalog...');
    try {
      const res = await seedCatalogIfEmpty();
      showBusyToast(
        res.productsSeeded > 0 || res.bannersSeeded > 0 || res.categoriesSeeded > 0
          ? `Synced ${res.categoriesSeeded} categories, ${res.productsSeeded} products, and ${res.bannersSeeded} banners.`
          : 'Catalog already present in Firestore.'
      );
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Failed to sync default catalog.'));
    }
  };

  // --- Product Form Helpers ---
  const openNewProduct = () => {
    const firstCat = categories[0];
    const newId = `rbd-item-${Date.now()}`;
    setAdminError('');
    setIsCreatingProduct(true);
    setEditingProduct({
      id: newId,
      sku: `RBD-${Math.floor(100 + Math.random() * 899)}`,
      name: '',
      category: firstCat?.id ?? 'microcontrollers',
      categoryLabel: firstCat?.name ?? 'Microcontrollers',
      price: 500,
      originalPrice: undefined,
      rating: 4.9,
      reviews: 0,
      stock: 20,
      tag: '',
      isBestSeller: true,
      isJustArrived: true,
      artwork: firstCat?.artwork ?? 'esp32',
      imageUrl: undefined,
      videoUrl: undefined,
      shortDesc: '',
      specs: [{ label: 'Voltage', value: '5V DC' }],
      variants: [],
    });
    setVariantsText('');
    setSpecsText('Voltage: 5V DC');
  };

  const openEditProduct = (product: Product) => {
    setAdminError('');
    setIsCreatingProduct(false);
    setEditingProduct({ ...product });
    setVariantsText((product.variants || []).join(', '));
    setSpecsText(product.specs.map((s) => `${s.label}: ${s.value}`).join('\n'));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const categoryLabel =
      categories.find((c) => c.id === editingProduct.category)?.name ??
      editingProduct.categoryLabel;

    const parsedVariants = variantsText
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    const parsedSpecs = specsText
      .split('\n')
      .map((line) => {
        const idx = line.indexOf(':');
        if (idx === -1) return null;
        const label = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        return label && value ? { label, value } : null;
      })
      .filter((s): s is { label: string; value: string } => s !== null);

    const sanitizedId = editingProduct.id.replace(/[^a-zA-Z0-9_-]/g, '-');
    const trimmedVideoUrl = editingProduct.videoUrl?.trim() || '';
    if (trimmedVideoUrl && !isValidHttpUrl(trimmedVideoUrl)) {
      setAdminError('Product Demo Video URL must start with https:// or http://.');
      return;
    }

    const payload: Product = {
      ...editingProduct,
      id: sanitizedId,
      categoryLabel,
      price: Number(editingProduct.price) || 0,
      originalPrice:
        editingProduct.originalPrice && Number(editingProduct.originalPrice) > 0
          ? Number(editingProduct.originalPrice)
          : undefined,
      stock: Number(editingProduct.stock) || 0,
      rating: Number(editingProduct.rating) || 4.8,
      reviews: Number(editingProduct.reviews) || 0,
      tag: editingProduct.tag?.trim() ? editingProduct.tag.trim() : undefined,
      videoUrl: trimmedVideoUrl ? trimmedVideoUrl.slice(0, 500) : undefined,
      variants: parsedVariants.length > 0 ? parsedVariants : undefined,
      specs: parsedSpecs,
    };

    setAdminError('');
    setBusyMessage('Saving product...');
    try {
      const previousProduct = products.find((p) => p.id === payload.id);
      await saveProduct(payload);

      let notifiedCount = 0;
      if (previousProduct && payload.price < previousProduct.price) {
        const matchingAlerts = priceAlerts.filter(
          (a) =>
            a.productId === payload.id &&
            a.status === 'Active' &&
            payload.price < a.baselinePrice
        );
        await Promise.all(
          matchingAlerts.map((a) => markPriceAlertNotified(a.id, payload.price))
        );
        notifiedCount = matchingAlerts.length;
      }

      setEditingProduct(null);
      showBusyToast(
        notifiedCount > 0
          ? `Product saved. Flagged ${notifiedCount} price-drop subscriber(s)!`
          : 'Product saved.',
        3000
      );
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not save product.'));
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setAdminError('');
    setBusyMessage('Deleting product...');
    setConfirmKey(null);
    try {
      await removeProduct(productId);
      showBusyToast('Product deleted.', 2000);
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not delete product.'));
    }
  };

  // --- Category Form Helpers ---
  const openNewCategory = () => {
    setAdminError('');
    setIsCreatingCategory(true);
    setEditingCategory({
      id: '',
      name: '',
      countLabel: '0 Items',
      artwork: 'esp32',
      imageUrl: undefined,
      order: categories.length + 1,
      active: true,
    });
  };

  const openEditCategory = (cat: CategoryItem) => {
    setAdminError('');
    setIsCreatingCategory(false);
    setEditingCategory({ ...cat });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const rawSlug = (editingCategory.id || editingCategory.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const sanitizedId = rawSlug && rawSlug !== 'all' ? rawSlug : `cat-${Date.now()}`;

    setAdminError('');
    setBusyMessage('Saving category...');
    try {
      await saveCategory({
        ...editingCategory,
        id: sanitizedId,
        name: editingCategory.name.trim(),
        countLabel: editingCategory.countLabel.trim() || '0 Items',
        imageUrl: editingCategory.imageUrl?.trim() ? editingCategory.imageUrl.trim() : undefined,
        order: Number(editingCategory.order) || 1,
        active: editingCategory.active ?? true,
      });
      setEditingCategory(null);
      showBusyToast('Category saved.', 2000);
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not save category.'));
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setAdminError('');
    setBusyMessage('Deleting category...');
    setConfirmKey(null);
    try {
      await removeCategory(categoryId);
      showBusyToast('Category deleted.', 2000);
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not delete category.'));
    }
  };

  // --- Site Images Helpers ---
  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setBusyMessage('Saving website images & hero...');
    try {
      await saveSiteSettings(draftSiteSettings);
      showBusyToast('Website images updated live.', 2500);
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not save site images.'));
    }
  };

  const handleResetSiteSettings = async () => {
    setAdminError('');
    setBusyMessage('Resetting site images...');
    setConfirmKey(null);
    try {
      setDraftSiteSettings(DEFAULT_SITE_SETTINGS);
      await saveSiteSettings(DEFAULT_SITE_SETTINGS);
      showBusyToast('Site images reset.', 2500);
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not reset site images.'));
    }
  };

  // --- Banner Form Helpers ---
  const openNewBanner = () => {
    setAdminError('');
    setIsCreatingBanner(true);
    setEditingBanner({
      id: `banner-${Date.now()}`,
      kicker: 'Featured Offer',
      title: '',
      subtitle: '',
      ctaLabel: 'Shop Now',
      targetCategory: 'all',
      theme: 'navy',
      artwork: 'lidar',
      order: banners.length + 1,
      active: true,
    });
  };

  const openEditBanner = (banner: BannerItem) => {
    setAdminError('');
    setIsCreatingBanner(false);
    setEditingBanner({ ...banner });
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    const sanitizedId = editingBanner.id.replace(/[^a-zA-Z0-9_-]/g, '-');
    setAdminError('');
    setBusyMessage('Saving banner...');
    try {
      await saveBanner({
        ...editingBanner,
        id: sanitizedId,
        order: Number(editingBanner.order) || 1,
      });
      setEditingBanner(null);
      showBusyToast('Banner saved.', 2000);
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not save banner.'));
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    setAdminError('');
    setBusyMessage('Deleting banner...');
    setConfirmKey(null);
    try {
      await removeBanner(bannerId);
      showBusyToast('Banner deleted.', 2000);
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not delete banner.'));
    }
  };

  // --- Order Helpers ---
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setAdminError('');
    setBusyMessage('Updating order...');
    try {
      await updateOrderInFirestore(editingOrder);
      setEditingOrder(null);
      showBusyToast('Order updated.', 2000);
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not update order.'));
    }
  };

  const handleQuickOrderStatus = async (order: StoredOrder, status: OrderStatus) => {
    setAdminError('');
    setBusyMessage(`Updating #${order.orderId}...`);
    try {
      await updateOrderInFirestore({ ...order, status });
      showBusyToast(`Order #${order.orderId} marked ${status}.`, 2000);
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not update order status.'));
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setAdminError('');
    setBusyMessage(`Deleting #${orderId}...`);
    setConfirmKey(null);
    try {
      await deleteOrderInFirestore(orderId);
      showBusyToast('Order deleted.', 2000);
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not delete order.'));
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
    const q = orderSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      o.orderId.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q) ||
      o.district.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const filteredProducts = products.filter((p) => {
    const q = productSearch.trim().toLowerCase();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q)
    );
  });

  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-5">
      <div
        className="fixed inset-0 bg-[#06142E]/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-6xl h-[94dvh] bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Top Admin Bar */}
        <div className="px-3.5 sm:px-7 py-3 sm:py-4 bg-[#06142E] text-white flex items-center justify-between gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="font-display text-sm sm:text-lg font-bold tracking-tight truncate">
              Robotera BD Admin Console
            </span>
            {busyMessage && (
              <span className="text-[11px] sm:text-xs font-mono text-emerald-300 truncate">{busyMessage}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={handleSyncDefaults}
                  aria-label="Sync default catalog"
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sync Defaults</span>
                </button>
                <button
                  type="button"
                  onClick={signOutAdmin}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline sm:inline">Sign Out</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close admin panel"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate */}
        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 bg-[#F6F8FB] overflow-y-auto">
            <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h3 className="font-display text-2xl font-bold text-[#06142E] text-center">
                Admin Access Required
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed text-center">
                Sign in with your authorized store owner account (
                <span className="font-mono text-xs text-slate-800">{ADMIN_EMAIL}</span>) to manage
                orders, products, and scrolling banners.
              </p>

              <form onSubmit={handleEmailSignIn} className="mt-5 space-y-3">
                <div>
                  <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-700 mb-1">
                    Admin Email
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={ADMIN_EMAIL}
                    className="w-full h-10 px-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 px-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {authError && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5 leading-relaxed">
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={authBusy}
                  className="w-full h-11 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  {authBusy ? 'Signing in...' : 'Sign In with Email'}
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="bg-white px-2.5 text-slate-400">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authBusy}
                className="w-full h-10 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors"
              >
                Continue with Google
              </button>
            </div>
          </div>
        ) : !isAdmin ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-[#F6F8FB]">
            <div className="max-w-md w-full bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 shadow-sm">
              <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto mb-3" />
              {user.email?.toLowerCase() === ADMIN_EMAIL && !user.emailVerified ? (
                <>
                  <h3 className="font-display text-xl font-bold text-[#06142E]">
                    Email Verification Required
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Signed in as <span className="font-mono text-xs">{user.email}</span>. For
                    database security, please verify your email address or sign in with Google to
                    unlock admin tools.
                  </p>
                  {authInfo && (
                    <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                      {authInfo}
                    </p>
                  )}
                  {authError && (
                    <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
                      {authError}
                    </p>
                  )}
                  <div className="mt-5 space-y-2.5">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={authBusy}
                      className="w-full h-10 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Resend Verification Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRefreshAuth}
                      disabled={authBusy}
                      className="w-full h-10 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>I&apos;ve Verified — Refresh Status</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={authBusy}
                      className="w-full h-10 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                    >
                      Sign In with Google Instead
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-display text-xl font-bold text-[#06142E]">
                    Unauthorized Account
                  </h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Signed in as <span className="font-mono text-xs">{user.email}</span>. Only
                    verified store admin <span className="font-mono text-xs">{ADMIN_EMAIL}</span>{' '}
                    can access this console.
                  </p>
                </>
              )}
              <button
                type="button"
                onClick={signOutAdmin}
                className="mt-4 px-5 py-2 rounded-lg bg-[#06142E] text-white text-xs font-semibold hover:bg-slate-800"
              >
                Switch Account
              </button>
            </div>
          </div>
        ) : (
          /* Authenticated Admin Workspace */
          <>
            {/* Summary Strip + Tabs */}
            <div className="px-5 sm:px-7 py-3 bg-[#F6F8FB] border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'orders'
                      ? 'bg-[#0057E7] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Orders ({orders.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'products'
                      ? 'bg-[#0057E7] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Products ({products.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('categories')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'categories'
                      ? 'bg-[#0057E7] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>Categories ({categories.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('banners')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'banners'
                      ? 'bg-[#0057E7] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Banners ({banners.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('site-images')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'site-images'
                      ? 'bg-[#0057E7] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span>Site Images &amp; Hero</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('alerts')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'alerts'
                      ? 'bg-[#0057E7] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Price Alerts ({priceAlerts.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span>
                  Active Revenue:{' '}
                  <strong className="font-mono text-[#06142E] tabular-nums">
                    ৳{totalRevenue.toLocaleString('en-IN')}
                  </strong>
                </span>
                <span className="hidden md:inline font-mono text-slate-400">{user.email}</span>
              </div>
            </div>

            {/* Tab Workspace Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
              {adminError && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
                  <span>{adminError}</span>
                  <button
                    type="button"
                    onClick={() => setAdminError('')}
                    aria-label="Dismiss error"
                    className="p-1 text-red-500 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Quick Operations KPI Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-3.5">
                  <p className="text-[11px] font-medium text-slate-500">Total Orders</p>
                  <p className="font-display text-xl font-bold text-[#06142E] tabular-nums mt-0.5">
                    {orders.length}
                  </p>
                </div>
                <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-3.5">
                  <p className="text-[11px] font-medium text-slate-500">Pending Dispatch</p>
                  <p className="font-display text-xl font-bold text-[#0057E7] tabular-nums mt-0.5">
                    {orders.filter((o) => o.status === 'Pending' || o.status === 'Confirmed').length}
                  </p>
                </div>
                <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-3.5">
                  <p className="text-[11px] font-medium text-slate-500">Low / Out of Stock</p>
                  <p className="font-display text-xl font-bold text-amber-700 tabular-nums mt-0.5">
                    {products.filter((p) => p.stock <= 5).length}
                  </p>
                </div>
                <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-3.5">
                  <p className="text-[11px] font-medium text-slate-500">Active Revenue</p>
                  <p className="font-display text-xl font-bold text-[#06142E] tabular-nums mt-0.5">
                    ৳{totalRevenue.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* TAB 1: ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      {(['All', ...ORDER_STATUSES] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setOrderStatusFilter(st)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                            orderStatusFilter === st
                              ? 'bg-[#06142E] text-white'
                              : 'bg-[#F6F8FB] text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search Order ID, phone, name..."
                        className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
                      No orders found matching this filter yet. Orders placed by customers at checkout appear here in real time.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredOrders.map((order) => (
                        <div
                          key={order.orderId}
                          className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white hover:border-slate-300 transition-colors"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-mono font-bold text-[#06142E]">
                                  #{order.orderId}
                                </span>
                                <span aria-hidden="true" className="text-slate-300">·</span>
                                <span className="font-semibold text-slate-800">{order.customerName}</span>
                                <span aria-hidden="true" className="text-slate-300">·</span>
                                <span className="font-mono text-slate-600">{order.phone}</span>
                                <span aria-hidden="true" className="text-slate-300">·</span>
                                <span className="text-slate-600">{order.paymentMethod}</span>
                              </div>
                              <p className="text-xs text-slate-500">
                                {order.address}, {order.district}
                              </p>
                              {order.notes && (
                                <p className="text-xs text-blue-700">Note: {order.notes}</p>
                              )}

                              {/* Ordered Line Items */}
                              <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700">
                                {order.items.map((item, idx) => (
                                  <span key={idx} className="font-mono">
                                    {item.quantity}× {item.name}
                                    {item.variant ? ` (${item.variant})` : ''} — ৳
                                    {(item.price * item.quantity).toLocaleString('en-IN')}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                              <span className="font-mono text-base font-bold text-[#06142E] tabular-nums mr-1">
                                ৳{order.total.toLocaleString('en-IN')}
                              </span>

                              <select
                                value={order.status}
                                onChange={(e) =>
                                  handleQuickOrderStatus(order, e.target.value as OrderStatus)
                                }
                                aria-label={`Status for order ${order.orderId}`}
                                className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold bg-[#F6F8FB] text-[#06142E]"
                              >
                                {ORDER_STATUSES.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => setEditingOrder({ ...order })}
                                aria-label={`Edit order ${order.orderId}`}
                                className="h-9 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              {confirmKey === `order:${order.orderId}` ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOrder(order.orderId)}
                                    className="h-9 px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmKey(null)}
                                    className="h-9 px-2 rounded-lg border border-slate-200 text-xs text-slate-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmKey(`order:${order.orderId}`)}
                                  aria-label={`Delete order ${order.orderId}`}
                                  className="h-9 px-2.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 inline-flex items-center"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PRODUCTS */}
              {activeTab === 'products' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products or SKU..."
                        className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={openNewProduct}
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F6F8FB] border-b border-slate-200 text-slate-500 font-semibold">
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-3">SKU</th>
                          <th className="py-3 px-3">Category</th>
                          <th className="py-3 px-3 text-right">Price</th>
                          <th className="py-3 px-3 text-right">Stock</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#F6F8FB] border border-slate-200 p-1 shrink-0 overflow-hidden">
                                  <HardwareArtwork
                                    kind={product.artwork}
                                    imageUrl={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-[#06142E] line-clamp-1 max-w-xs block">
                                    {product.name}
                                  </span>
                                  {product.videoUrl && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0057E7] mt-0.5">
                                      <Video className="w-3 h-3" />
                                      Demo video
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                              {product.sku}
                            </td>
                            <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                              {product.categoryLabel}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-right text-[#06142E] tabular-nums whitespace-nowrap">
                              ৳{product.price.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 font-mono text-right tabular-nums">
                              {product.stock}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditProduct(product)}
                                  className="px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100 font-semibold text-slate-700"
                                >
                                  Edit
                                </button>
                                {confirmKey === `product:${product.id}` ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteProduct(product.id)}
                                      className="px-2 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmKey(null)}
                                      className="px-2 py-1 rounded-md border border-slate-200 text-slate-600"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmKey(`product:${product.id}`)}
                                    aria-label={`Delete ${product.name}`}
                                    className="p-1.5 rounded-md border border-red-200 hover:bg-red-50 text-red-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: SCROLLING BANNERS */}
              {activeTab === 'banners' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-slate-600">
                      Manage banners shown in the auto-scrolling promotional carousel on the homepage.
                    </p>
                    <button
                      type="button"
                      onClick={openNewBanner}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Banner</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {banners.map((banner) => (
                      <div
                        key={banner.id}
                        className="border border-slate-200 rounded-xl p-4 bg-white flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-20 h-14 rounded-lg bg-[#F6F8FB] border border-slate-200 p-1 shrink-0 overflow-hidden">
                            <HardwareArtwork
                              kind={banner.artwork}
                              imageUrl={banner.imageUrl}
                              alt={banner.title}
                              fit="contain"
                              className="w-full h-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span className="font-mono font-semibold text-[#0057E7]">
                                #{banner.order}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{banner.kicker}</span>
                              <span aria-hidden="true">·</span>
                              <span className={banner.active ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                                {banner.active ? 'Active' : 'Hidden'}
                              </span>
                            </div>
                            <h4 className="font-display text-sm font-bold text-[#06142E] mt-0.5 line-clamp-1">
                              {banner.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {banner.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditBanner(banner)}
                            className="px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                          >
                            Edit
                          </button>
                          {confirmKey === `banner:${banner.id}` ? (
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteBanner(banner.id)}
                                className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-xs font-semibold text-white"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmKey(null)}
                                className="px-2.5 py-1 rounded-md border border-slate-200 text-xs text-slate-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmKey(`banner:${banner.id}`)}
                              aria-label={`Delete banner ${banner.title}`}
                              className="px-2.5 py-1.5 rounded-md border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-600"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: CATEGORIES */}
              {activeTab === 'categories' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-slate-600">
                      Add, rename, reorder, hide, or upload custom images for all storefront departments &amp; category tabs.
                    </p>
                    <button
                      type="button"
                      onClick={openNewCategory}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Category</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="border border-slate-200 rounded-xl p-4 bg-white flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-lg bg-[#F6F8FB] border border-slate-200 p-1.5 shrink-0 overflow-hidden">
                            <HardwareArtwork
                              kind={cat.artwork}
                              imageUrl={cat.imageUrl}
                              alt={cat.name}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <span className="font-mono font-semibold text-[#0057E7]">
                                #{cat.order ?? 1}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono truncate">{cat.id}</span>
                            </div>
                            <h4 className="font-display text-sm font-bold text-[#06142E] mt-0.5 line-clamp-1">
                              {cat.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                              <span className="font-mono text-slate-500">{cat.countLabel}</span>
                              <span aria-hidden="true" className="text-slate-300">·</span>
                              <span className={cat.active !== false ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                                {cat.active !== false ? 'Active' : 'Hidden'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditCategory(cat)}
                            className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                          >
                            Edit
                          </button>
                          {confirmKey === `category:${cat.id}` ? (
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-xs font-semibold text-white"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmKey(null)}
                                className="px-2.5 py-1 rounded-md border border-slate-200 text-xs text-slate-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmKey(`category:${cat.id}`)}
                              aria-label={`Delete category ${cat.name}`}
                              className="px-2.5 py-1 rounded-md border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-600"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: SITE IMAGES & HERO */}
              {activeTab === 'site-images' && (
                <form onSubmit={handleSaveSiteSettings} className="space-y-6 max-w-4xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-bold text-[#06142E]">
                        Website Images &amp; Homepage Sections
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Upload files or paste image links for the hero banner, promo grids, discount section, and lab guides.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {confirmKey === 'reset-site' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleResetSiteSettings}
                            className="h-9 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                          >
                            Confirm Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmKey(null)}
                            className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmKey('reset-site')}
                          className="h-9 px-3.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                        >
                          Reset Defaults
                        </button>
                      )}
                      <button
                        type="submit"
                        className="h-9 px-5 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save All Site Images</span>
                      </button>
                    </div>
                  </div>

                  {/* Hero Section Card */}
                  <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-5 space-y-4">
                    <h4 className="font-display text-sm font-bold text-[#06142E]">
                      1. Main Hero Banner &amp; Text
                    </h4>
                    <ImageSourceField
                      label="Main Hero Showcase Image"
                      value={draftSiteSettings.heroImageUrl}
                      defaultValue={DEFAULT_SITE_SETTINGS.heroImageUrl}
                      maxDimension={900}
                      maxChars={160000}
                      onChange={(url) =>
                        setDraftSiteSettings({
                          ...draftSiteSettings,
                          heroImageUrl: url || DEFAULT_SITE_SETTINGS.heroImageUrl,
                        })
                      }
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Hero Kicker</label>
                        <input
                          type="text"
                          value={draftSiteSettings.heroKicker ?? ''}
                          onChange={(e) =>
                            setDraftSiteSettings({ ...draftSiteSettings, heroKicker: e.target.value })
                          }
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Hero Badge Tagline</label>
                        <input
                          type="text"
                          value={draftSiteSettings.heroTagline ?? ''}
                          onChange={(e) =>
                            setDraftSiteSettings({ ...draftSiteSettings, heroTagline: e.target.value })
                          }
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">Hero Headline</label>
                        <input
                          type="text"
                          value={draftSiteSettings.heroTitle ?? ''}
                          onChange={(e) =>
                            setDraftSiteSettings({ ...draftSiteSettings, heroTitle: e.target.value })
                          }
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">Hero Subtitle</label>
                        <textarea
                          rows={2}
                          value={draftSiteSettings.heroSubtitle ?? ''}
                          onChange={(e) =>
                            setDraftSiteSettings({ ...draftSiteSettings, heroSubtitle: e.target.value })
                          }
                          className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">Hero Dispatch Notice</label>
                        <input
                          type="text"
                          value={draftSiteSettings.heroDispatchText ?? ''}
                          onChange={(e) =>
                            setDraftSiteSettings({ ...draftSiteSettings, heroDispatchText: e.target.value })
                          }
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Promo Grid & Discount Banner Images */}
                  <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-5 space-y-4">
                    <h4 className="font-display text-sm font-bold text-[#06142E]">
                      2. Promo Bundles Grid &amp; Discount Section Images
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ImageSourceField
                        label="Promo Left Banner (Full Image)"
                        value={draftSiteSettings.promoLeftImageUrl}
                        maxDimension={1200}
                        maxChars={150000}
                        onChange={(url) =>
                          setDraftSiteSettings({ ...draftSiteSettings, promoLeftImageUrl: url })
                        }
                      />
                      <ImageSourceField
                        label="Promo Top-Right Banner (Full Image)"
                        value={draftSiteSettings.promoTopRightImageUrl}
                        maxDimension={1000}
                        maxChars={140000}
                        onChange={(url) =>
                          setDraftSiteSettings({ ...draftSiteSettings, promoTopRightImageUrl: url })
                        }
                      />
                      <ImageSourceField
                        label="Promo Bottom-Right Banner (Full Image)"
                        value={draftSiteSettings.promoBottomRightImageUrl}
                        maxDimension={1000}
                        maxChars={140000}
                        onChange={(url) =>
                          setDraftSiteSettings({ ...draftSiteSettings, promoBottomRightImageUrl: url })
                        }
                      />
                      <ImageSourceField
                        label="Discount Full Banner Image"
                        value={draftSiteSettings.discountBannerImageUrl}
                        maxDimension={1280}
                        maxChars={150000}
                        onChange={(url) =>
                          setDraftSiteSettings({ ...draftSiteSettings, discountBannerImageUrl: url })
                        }
                      />
                    </div>
                  </div>

                  {/* Lab Guides Blog Images */}
                  <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-5 space-y-4">
                    <h4 className="font-display text-sm font-bold text-[#06142E]">
                      3. Engineering Lab Guide Thumbnails
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {BLOG_POSTS.map((post) => (
                        <ImageSourceField
                          key={post.id}
                          label={post.title}
                          value={draftSiteSettings.blogImages?.[post.id]}
                          maxDimension={640}
                          maxChars={90000}
                          onChange={(url) =>
                            setDraftSiteSettings({
                              ...draftSiteSettings,
                              blogImages: {
                                ...(draftSiteSettings.blogImages || {}),
                                [post.id]: url || '',
                              },
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 6: PRICE DROP ALERTS */}
              {activeTab === 'alerts' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#06142E]">
                      Customer Price Drop Alerts
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Shoppers who subscribed for email notifications when a product&apos;s price drops. Lowering a product price automatically flags matching alerts.
                    </p>
                  </div>

                  {priceAlerts.length === 0 ? (
                    <div className="border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
                      No price drop alert subscriptions yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {priceAlerts.map((alert) => {
                        const liveProd = products.find((p) => p.id === alert.productId);
                        const currentPrice = liveProd?.price ?? alert.baselinePrice;
                        const priceDropped = currentPrice < alert.baselinePrice;
                        const mailSubject = encodeURIComponent(
                          `Price Drop Alert: ${alert.productName} is now ৳${currentPrice.toLocaleString('en-IN')} at Robotera BD`
                        );
                        const mailBody = encodeURIComponent(
                          `Hello,\n\nGood news! The price of ${alert.productName} just dropped from ৳${alert.baselinePrice.toLocaleString('en-IN')} to ৳${currentPrice.toLocaleString('en-IN')} at Robotera BD.\n\nOrder now while Dhaka stock lasts!\n\nRegards,\nRobotera BD`
                        );

                        return (
                          <div
                            key={alert.id}
                            className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-bold text-[#06142E] truncate">
                                  {alert.productName}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                    alert.status === 'Notified'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : priceDropped
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-blue-50 text-[#0057E7] border-blue-200'
                                  }`}
                                >
                                  {alert.status === 'Notified'
                                    ? 'Notified'
                                    : priceDropped
                                    ? 'Price Dropped — Ready'
                                    : 'Watching'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-mono truncate">
                                {alert.email}
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                                Subscribed at: ৳{alert.baselinePrice.toLocaleString('en-IN')} · Live Price: ৳
                                {currentPrice.toLocaleString('en-IN')}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={`mailto:${alert.email}?subject=${mailSubject}&body=${mailBody}`}
                                className="h-8 px-3 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                <span>Email Buyer</span>
                              </a>
                              {alert.status !== 'Notified' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await markPriceAlertNotified(alert.id, currentPrice);
                                      showBusyToast('Alert marked as notified.', 1800);
                                    } catch (err) {
                                      setAdminError(formatAdminErr(err, 'Failed to update alert.'));
                                    }
                                  }}
                                  className="h-8 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                                >
                                  Mark Sent
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await deletePriceAlert(alert.id);
                                    showBusyToast('Price alert removed.', 1500);
                                  } catch (err) {
                                    setAdminError(formatAdminErr(err, 'Failed to delete alert.'));
                                  }
                                }}
                                aria-label={`Delete price alert for ${alert.email}`}
                                className="h-8 px-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 inline-flex items-center"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sub-Modal: Edit Order */}
      {editingOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditingOrder(null)} />
          <form
            onSubmit={handleSaveOrder}
            className="relative z-10 w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 sm:p-6 space-y-4 max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-display text-lg font-bold text-[#06142E]">
                Edit Order #{editingOrder.orderId}
              </h3>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editingOrder.status}
                  onChange={(e) =>
                    setEditingOrder({ ...editingOrder, status: e.target.value as OrderStatus })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white"
                >
                  {ORDER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <input
                  type="text"
                  required
                  value={editingOrder.paymentMethod}
                  onChange={(e) =>
                    setEditingOrder({ ...editingOrder, paymentMethod: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={editingOrder.customerName}
                  onChange={(e) =>
                    setEditingOrder({ ...editingOrder, customerName: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  required
                  value={editingOrder.phone}
                  onChange={(e) => setEditingOrder({ ...editingOrder, phone: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  required
                  value={editingOrder.district}
                  onChange={(e) => setEditingOrder({ ...editingOrder, district: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Delivery Address</label>
                <textarea
                  rows={2}
                  required
                  value={editingOrder.address}
                  onChange={(e) => setEditingOrder({ ...editingOrder, address: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Admin Notes</label>
                <input
                  type="text"
                  value={editingOrder.notes ?? ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, notes: e.target.value })}
                  placeholder="Courier tracking ID or packing note..."
                  className="w-full h-9 px-3 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Order Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Modal: Add / Edit Product */}
      {editingProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditingProduct(null)} />
          <form
            onSubmit={handleSaveProduct}
            className="relative z-10 w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 sm:p-6 space-y-4 max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-display text-lg font-bold text-[#06142E]">
                {isCreatingProduct ? 'Add New Hardware Product' : `Edit ${editingProduct.sku}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="e.g. ESP32-C6 Wi-Fi 6 Zigbee DevKit"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SKU</label>
                <input
                  type="text"
                  required
                  value={editingProduct.sku}
                  onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={editingProduct.category}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      category: e.target.value,
                    })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white"
                >
                  {!categories.some((c) => c.id === editingProduct.category) && (
                    <option value={editingProduct.category}>
                      {editingProduct.categoryLabel || editingProduct.category}
                    </option>
                  )}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Price (৳)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Original Price (Optional ৳)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editingProduct.originalPrice ?? ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      originalPrice: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stock Count</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editingProduct.stock}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fallback Vector Icon</label>
                <select
                  value={editingProduct.artwork}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      artwork: e.target.value as ArtworkKind,
                    })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-mono"
                >
                  {ARTWORK_OPTIONS.map((art) => (
                    <option key={art} value={art}>
                      {art}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <ImageSourceField
                  label="Custom Product Image (Shows full photo without cropping)"
                  value={editingProduct.imageUrl}
                  maxDimension={1000}
                  maxChars={180000}
                  onChange={(url) => setEditingProduct({ ...editingProduct, imageUrl: url })}
                />
              </div>

              <div className="sm:col-span-2 bg-[#F6F8FB] border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="admin-product-video-url"
                    className="font-semibold text-[#06142E] inline-flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5 text-[#0057E7]" />
                    <span>Product Demo Video URL (Optional)</span>
                  </label>
                  {editingProduct.videoUrl && (
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, videoUrl: undefined })}
                      className="text-[11px] font-semibold text-red-600 hover:underline"
                    >
                      Remove video
                    </button>
                  )}
                </div>
                <input
                  id="admin-product-video-url"
                  type="url"
                  maxLength={500}
                  value={editingProduct.videoUrl ?? ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      videoUrl: e.target.value || undefined,
                    })
                  }
                  placeholder="https://www.youtube.com/watch?v=... or https://.../demo.mp4"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                />
                <p className="text-[11px] text-slate-500">
                  Supports YouTube, YouTube Shorts, Vimeo, Google Drive share links, or direct MP4/WebM video URLs.
                </p>
                {(() => {
                  const preview = resolveProductVideo(editingProduct.videoUrl);
                  if (!preview) return null;
                  if (preview.kind === 'iframe') {
                    return (
                      <div className="aspect-video w-full max-w-sm rounded-lg overflow-hidden border border-slate-200 bg-black">
                        <iframe
                          src={preview.embedUrl}
                          title="Admin video preview"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      </div>
                    );
                  }
                  if (preview.kind === 'video') {
                    return (
                      <div className="aspect-video w-full max-w-sm rounded-lg overflow-hidden border border-slate-200 bg-black">
                        <video
                          src={preview.src}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  required
                  value={editingProduct.shortDesc}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, shortDesc: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Variants (comma-separated)
                </label>
                <input
                  type="text"
                  value={variantsText}
                  onChange={(e) => setVariantsText(e.target.value)}
                  placeholder="Standard, Pre-Soldered"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center gap-4 pt-5">
                <label className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.isBestSeller)}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })
                    }
                  />
                  Best Seller
                </label>
                <label className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.isJustArrived)}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, isJustArrived: e.target.checked })
                    }
                  />
                  Just Arrived
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Specs (one per line: Label: Value)
                </label>
                <textarea
                  rows={3}
                  value={specsText}
                  onChange={(e) => setSpecsText(e.target.value)}
                  placeholder={'Voltage: 3.3V - 5V\nInterface: I2C / SPI'}
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-xs font-semibold"
              >
                {isCreatingProduct ? 'Create Product' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Modal: Add / Edit Banner */}
      {editingBanner && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditingBanner(null)} />
          <form
            onSubmit={handleSaveBanner}
            className="relative z-10 w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 sm:p-6 space-y-4 max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-display text-lg font-bold text-[#06142E]">
                {isCreatingBanner ? 'Add Scrolling Banner' : 'Edit Scrolling Banner'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingBanner(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kicker</label>
                <input
                  type="text"
                  required
                  value={editingBanner.kicker}
                  onChange={(e) => setEditingBanner({ ...editingBanner, kicker: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Order</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editingBanner.order}
                  onChange={(e) =>
                    setEditingBanner({ ...editingBanner, order: Number(e.target.value) })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Banner Title</label>
                <input
                  type="text"
                  required
                  value={editingBanner.title}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Subtitle</label>
                <textarea
                  rows={2}
                  required
                  value={editingBanner.subtitle}
                  onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Button Label</label>
                <input
                  type="text"
                  required
                  value={editingBanner.ctaLabel}
                  onChange={(e) =>
                    setEditingBanner({ ...editingBanner, ctaLabel: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Category</label>
                <select
                  value={editingBanner.targetCategory}
                  onChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      targetCategory: e.target.value as CategoryId,
                    })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="all">All Hardware</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Color Theme</label>
                <select
                  value={editingBanner.theme}
                  onChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      theme: e.target.value as BannerTheme,
                    })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="navy">Deep Navy</option>
                  <option value="cobalt">Cobalt Blue</option>
                  <option value="slate">Clean Steel</option>
                  <option value="emerald">Emerald Lab</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fallback Vector Icon</label>
                <select
                  value={editingBanner.artwork}
                  onChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      artwork: e.target.value as ArtworkKind,
                    })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-mono"
                >
                  {ARTWORK_OPTIONS.map((art) => (
                    <option key={art} value={art}>
                      {art}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <ImageSourceField
                  label="Custom Banner Image (Shows full banner without cropping or text overlay)"
                  value={editingBanner.imageUrl}
                  maxDimension={1280}
                  maxChars={180000}
                  onChange={(url) => setEditingBanner({ ...editingBanner, imageUrl: url })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingBanner.active}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, active: e.target.checked })
                    }
                  />
                  Active (visible in homepage scrolling section)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingBanner(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-xs font-semibold"
              >
                {isCreatingBanner ? 'Create Banner' : 'Save Banner'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Modal: Add / Edit Category */}
      {editingCategory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditingCategory(null)} />
          <form
            onSubmit={handleSaveCategory}
            className="relative z-10 w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 sm:p-6 space-y-4 max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-display text-lg font-bold text-[#06142E]">
                {isCreatingCategory ? 'Add Department Category' : `Edit ${editingCategory.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, name: e.target.value })
                  }
                  placeholder="e.g. Drones & FPV Frames"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200"
                />
              </div>

              {isCreatingCategory && (
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Slug ID (Optional URL-safe key)
                  </label>
                  <input
                    type="text"
                    value={editingCategory.id}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, id: e.target.value })
                    }
                    placeholder="e.g. drones-fpv"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Count Label</label>
                <input
                  type="text"
                  required
                  value={editingCategory.countLabel}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, countLabel: e.target.value })
                  }
                  placeholder="12 Items"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Order</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editingCategory.order ?? 1}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, order: Number(e.target.value) })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Fallback Vector Icon</label>
                <select
                  value={editingCategory.artwork}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      artwork: e.target.value as ArtworkKind,
                    })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-mono"
                >
                  {ARTWORK_OPTIONS.map((art) => (
                    <option key={art} value={art}>
                      {art}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <ImageSourceField
                  label="Custom Category Image (Upload or URL)"
                  value={editingCategory.imageUrl}
                  maxDimension={560}
                  maxChars={140000}
                  onChange={(url) =>
                    setEditingCategory({ ...editingCategory, imageUrl: url })
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingCategory.active !== false}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, active: e.target.checked })
                    }
                  />
                  Active (visible in storefront menus and filter tabs)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-xs font-semibold"
              >
                {isCreatingCategory ? 'Create Category' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
