import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Activity,
  ArrowRight,
  Bell,
  BellRing,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Download,
  Edit3,
  ExternalLink,
  FolderTree,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  Link2,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  Package,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  ShoppingBag,
  Smartphone,
  Ticket,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { BLOG_POSTS, DEFAULT_SITE_SETTINGS } from '../data/catalog';
import {
  BrowserGpsSnapshot,
  getBrowserGpsSnapshot,
  subscribeBrowserGpsSnapshot,
  trackVisitorVisit,
} from '../lib/visitorTracker';
import { isValidHttpUrl, resolveProductVideo } from '../lib/video';
import {
  ADMIN_EMAIL,
  clearVisitorLogs,
  deleteOrderInFirestore,
  deletePriceAlert,
  deleteRestockAlert,
  deleteVisitorLog,
  isVerifiedAdminUser,
  markPriceAlertNotified,
  markRestockAlertNotified,
  normalizePromoCodeString,
  removeBanner,
  removeCategory,
  removeProduct,
  removePromoCode,
  resendVerificationEmail,
  saveBanner,
  saveCategory,
  saveProduct,
  savePromoCode,
  saveSiteSettings,
  seedCatalogIfEmpty,
  signInAdminWithGoogle,
  signInWithEmail,
  signOutAdmin,
  subscribeOrders,
  subscribePriceAlerts,
  subscribeRestockAlerts,
  subscribeVisitorLogs,
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
  PromoCode,
  PromoDiscountType,
  RestockAlert,
  SiteImagesConfig,
  StoredOrder,
  VisitorLog,
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
  promoCodes: PromoCode[];
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
  promoCodes,
  siteSettings,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'visitors'
    | 'orders'
    | 'products'
    | 'categories'
    | 'banners'
    | 'promo-codes'
    | 'updates'
    | 'site-images'
    | 'alerts'
  >('dashboard');
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [restockAlerts, setRestockAlerts] = useState<RestockAlert[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [visitorSearch, setVisitorSearch] = useState('');
  const [visitorFilter, setVisitorFilter] = useState<'all' | 'Web' | 'PWA App' | 'Bangladesh' | 'GPS'>('all');
  const [copiedIpId, setCopiedIpId] = useState<string | null>(null);
  const [capturingVisit, setCapturingVisit] = useState(false);
  const [gpsSnapshot, setGpsSnapshot] = useState<BrowserGpsSnapshot>(() => getBrowserGpsSnapshot());
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

  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);

  const [draftSiteSettings, setDraftSiteSettings] = useState<SiteImagesConfig>(siteSettings);
  const [newUpdateText, setNewUpdateText] = useState('');
  const [editingUpdateIndex, setEditingUpdateIndex] = useState<number | null>(null);
  const [editingUpdateText, setEditingUpdateText] = useState('');
  const [savingUpdates, setSavingUpdates] = useState(false);

  useEffect(() => {
    setDraftSiteSettings(siteSettings);
  }, [siteSettings]);

  useEffect(() => {
    return subscribeBrowserGpsSnapshot(setGpsSnapshot);
  }, []);

  const isAdmin = isVerifiedAdminUser(user);

  useEffect(() => {
    if (!isOpen || !isAdmin) {
      setOrders([]);
      setPriceAlerts([]);
      setRestockAlerts([]);
      setVisitorLogs([]);
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

    const unsubRestockAlerts = subscribeRestockAlerts(
      (list) => setRestockAlerts(list),
      (err) => {
        console.error('Failed to load restock alerts:', err);
      }
    );

    const unsubVisitors = subscribeVisitorLogs(
      (list) => setVisitorLogs(list),
      (err) => {
        console.error('Failed to load visitor logs:', err);
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
      unsubRestockAlerts();
      unsubVisitors();
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
      displayOrder: undefined,
      tag: '',
      isBestSeller: true,
      isJustArrived: true,
      artwork: firstCat?.artwork && firstCat.artwork !== 'none' ? firstCat.artwork : 'esp32',
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

    const rawOrder = editingProduct.displayOrder;
    const parsedDisplayOrder =
      typeof rawOrder === 'number' && Number.isFinite(rawOrder)
        ? Math.max(0, Math.min(100000, Math.round(rawOrder)))
        : undefined;

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
      displayOrder: parsedDisplayOrder,
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

      let restockNotifiedCount = 0;
      if (previousProduct && previousProduct.stock <= 0 && payload.stock > 0) {
        const matchingRestocks = restockAlerts.filter(
          (a) => a.productId === payload.id && a.status === 'Active'
        );
        await Promise.all(matchingRestocks.map((a) => markRestockAlertNotified(a.id)));
        restockNotifiedCount = matchingRestocks.length;
      }

      setEditingProduct(null);
      if (restockNotifiedCount > 0 && notifiedCount > 0) {
        showBusyToast(
          `Product saved. Notified ${restockNotifiedCount} restock & ${notifiedCount} price subscribers!`,
          3400
        );
      } else if (restockNotifiedCount > 0) {
        showBusyToast(
          `Product restocked! Notified ${restockNotifiedCount} back-in-stock subscriber(s).`,
          3200
        );
      } else if (notifiedCount > 0) {
        showBusyToast(`Product saved. Flagged ${notifiedCount} price-drop subscriber(s)!`, 3000);
      } else {
        showBusyToast('Product saved.', 2500);
      }
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not save product.'));
    }
  };

  const handleQuickStockChange = async (product: Product, nextStock: number) => {
    setAdminError('');
    setBusyMessage(nextStock > 0 ? `Restocking ${product.sku}...` : `Marking ${product.sku} OOS...`);
    try {
      const updatedTag =
        nextStock <= 0
          ? 'Restocking Soon'
          : product.tag === 'Restocking Soon'
          ? undefined
          : product.tag;
      await saveProduct({
        ...product,
        stock: nextStock,
        tag: updatedTag,
      });

      let notified = 0;
      if (product.stock <= 0 && nextStock > 0) {
        const matching = restockAlerts.filter(
          (a) => a.productId === product.id && a.status === 'Active'
        );
        await Promise.all(matching.map((a) => markRestockAlertNotified(a.id)));
        notified = matching.length;
      }

      showBusyToast(
        nextStock > 0
          ? notified > 0
            ? `Restocked ${product.sku} (+${nextStock}). Alerted ${notified} subscriber(s)!`
            : `Restocked ${product.sku} (+${nextStock}).`
          : `Marked ${product.sku} as Out of Stock.`,
        2800
      );
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not update product stock.'));
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
      artwork: 'none',
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

  // --- Navbar Updates / Bangla News Ticker Helpers ---
  const currentTickerItems =
    draftSiteSettings.newsTickerItems ?? DEFAULT_SITE_SETTINGS.newsTickerItems ?? [];

  const persistTickerSettings = async (nextSettings: SiteImagesConfig, toastMsg: string) => {
    setAdminError('');
    setSavingUpdates(true);
    setBusyMessage('Saving updates...');
    try {
      await saveSiteSettings(nextSettings);
      setDraftSiteSettings(nextSettings);
      showBusyToast(toastMsg, 2500);
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not save updates.'));
    } finally {
      setSavingUpdates(false);
    }
  };

  const handleToggleTickerEnabled = async (enabled: boolean) => {
    const nextSettings: SiteImagesConfig = {
      ...draftSiteSettings,
      newsTickerEnabled: enabled,
    };
    await persistTickerSettings(
      nextSettings,
      enabled ? 'Updates bar enabled live.' : 'Updates bar hidden from navbar.'
    );
  };

  const handleAddUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newUpdateText.trim().slice(0, 260);
    if (!cleaned) {
      setAdminError('Please write an update message in English or বাংলা before saving.');
      return;
    }
    if (currentTickerItems.length >= 15) {
      setAdminError('Maximum 15 update items allowed. Edit or delete an existing line first.');
      return;
    }
    const nextItems = [...currentTickerItems.map((item) => item.trim()).filter(Boolean), cleaned];
    setNewUpdateText('');
    setEditingUpdateIndex(null);
    setEditingUpdateText('');
    await persistTickerSettings(
      {
        ...draftSiteSettings,
        newsTickerEnabled: draftSiteSettings.newsTickerEnabled ?? true,
        newsTickerItems: nextItems,
      },
      'New update added & published live.'
    );
  };

  const handleStartEditUpdate = (index: number, currentText: string) => {
    setAdminError('');
    setConfirmKey(null);
    setEditingUpdateIndex(index);
    setEditingUpdateText(currentText);
  };

  const handleSaveEditedUpdate = async (index: number) => {
    const cleaned = editingUpdateText.trim().slice(0, 260);
    if (!cleaned) {
      setAdminError('Update text cannot be empty. Click Delete to remove it instead.');
      return;
    }
    const nextItems = currentTickerItems
      .map((item, i) => (i === index ? cleaned : item.trim()))
      .filter(Boolean);
    setEditingUpdateIndex(null);
    setEditingUpdateText('');
    await persistTickerSettings(
      {
        ...draftSiteSettings,
        newsTickerItems: nextItems,
      },
      'Update saved & published live.'
    );
  };

  const handleDeleteUpdateItem = async (index: number) => {
    const nextItems = currentTickerItems
      .filter((_, i) => i !== index)
      .map((item) => item.trim())
      .filter(Boolean);
    setConfirmKey(null);
    if (editingUpdateIndex === index) {
      setEditingUpdateIndex(null);
      setEditingUpdateText('');
    } else if (editingUpdateIndex !== null && editingUpdateIndex > index) {
      setEditingUpdateIndex(editingUpdateIndex - 1);
    }
    await persistTickerSettings(
      {
        ...draftSiteSettings,
        newsTickerItems: nextItems,
      },
      'Update deleted.'
    );
  };

  const handleRestoreDefaultUpdates = async () => {
    setConfirmKey(null);
    setEditingUpdateIndex(null);
    setEditingUpdateText('');
    await persistTickerSettings(
      {
        ...draftSiteSettings,
        newsTickerEnabled: true,
        newsTickerItems: [...(DEFAULT_SITE_SETTINGS.newsTickerItems || [])],
      },
      'Default updates restored & published.'
    );
  };

  const handleSaveAllUpdates = async () => {
    const nextItems = currentTickerItems
      .map((item, i) => (i === editingUpdateIndex ? editingUpdateText.trim() : item.trim()))
      .map((item) => item.slice(0, 260))
      .filter(Boolean);
    setEditingUpdateIndex(null);
    setEditingUpdateText('');
    await persistTickerSettings(
      {
        ...draftSiteSettings,
        newsTickerEnabled: draftSiteSettings.newsTickerEnabled ?? true,
        newsTickerItems: nextItems,
      },
      'All updates saved & published live.'
    );
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
      linkUrl: '',
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
    const rawLink = editingBanner.linkUrl?.trim() || '';
    let normalizedLink: string | undefined;
    if (rawLink) {
      if (/^(javascript|data|vbscript):/i.test(rawLink)) {
        setAdminError('Please enter a valid http(s) URL, relative path (/...), or section link (#...).');
        return;
      }
      if (/^(https?:\/\/|\/|#)/i.test(rawLink)) {
        normalizedLink = rawLink;
      } else if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(rawLink)) {
        normalizedLink = `https://${rawLink}`;
      } else {
        setAdminError('Banner link must start with https://, http://, /, or #.');
        return;
      }
    }

    const sanitizedId = editingBanner.id.replace(/[^a-zA-Z0-9_-]/g, '-');
    setAdminError('');
    setBusyMessage('Saving banner...');
    try {
      await saveBanner({
        ...editingBanner,
        id: sanitizedId,
        linkUrl: normalizedLink,
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

  // --- Promo Code Form Helpers ---
  const openNewPromo = () => {
    setAdminError('');
    setIsCreatingPromo(true);
    setEditingPromo({
      id: '',
      code: '',
      discountType: 'percent',
      discountValue: 10,
      minOrderAmount: undefined,
      maxDiscountAmount: undefined,
      firstOrderOnly: false,
      description: '',
      active: true,
    });
  };

  const openEditPromo = (promo: PromoCode) => {
    setAdminError('');
    setIsCreatingPromo(false);
    setEditingPromo({ ...promo });
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;
    const cleanCode = normalizePromoCodeString(editingPromo.code || editingPromo.id);
    if (cleanCode.length < 3) {
      setAdminError('Promo code must be at least 3 characters (letters, numbers, - or _).');
      return;
    }
    const val = Number(editingPromo.discountValue);
    if (editingPromo.discountType === 'percent' && (val < 1 || val > 90 || !Number.isFinite(val))) {
      setAdminError('Percentage discount must be between 1% and 90%.');
      return;
    }
    if (editingPromo.discountType === 'flat' && (val < 1 || val > 500000 || !Number.isFinite(val))) {
      setAdminError('Flat discount must be between ৳1 and ৳500,000.');
      return;
    }

    setAdminError('');
    setBusyMessage(`Saving promo ${cleanCode}...`);
    try {
      await savePromoCode({
        ...editingPromo,
        id: cleanCode,
        code: cleanCode,
        discountValue: Math.round(val),
        description:
          editingPromo.description.trim() ||
          (editingPromo.discountType === 'percent'
            ? `${Math.round(val)}% hardware discount (1 use per Gmail & account)`
            : `৳${Math.round(val)} off hardware order (1 use per Gmail & account)`),
      });
      setEditingPromo(null);
      showBusyToast(`Promo code ${cleanCode} saved.`, 2200);
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not save promo code.'));
    }
  };

  const handleTogglePromoActive = async (promo: PromoCode) => {
    setAdminError('');
    setBusyMessage(`${promo.active ? 'Pausing' : 'Activating'} ${promo.code}...`);
    try {
      await savePromoCode({ ...promo, active: !promo.active });
      showBusyToast(`${promo.code} ${promo.active ? 'paused' : 'activated'}.`, 2000);
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not update promo status.'));
    }
  };

  const handleDeletePromo = async (code: string) => {
    setAdminError('');
    setBusyMessage(`Deleting ${code}...`);
    setConfirmKey(null);
    try {
      await removePromoCode(code);
      showBusyToast(`Promo code ${code} deleted.`, 2000);
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Could not delete promo code.'));
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

  const filteredProducts = products
    .filter((p) => {
      const q = productSearch.trim().toLowerCase();
      return (
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q)
      );
    })
    .sort(
      (a, b) =>
        (typeof a.displayOrder === 'number' ? a.displayOrder : Number.MAX_SAFE_INTEGER) -
        (typeof b.displayOrder === 'number' ? b.displayOrder : Number.MAX_SAFE_INTEGER)
    );

  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const getVisitorMillis = (ts: unknown): number => {
    if (!ts || typeof ts !== 'object') return 0;
    if ('toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
      return (ts as { toMillis: () => number }).toMillis();
    }
    if ('seconds' in ts && typeof (ts as { seconds: number }).seconds === 'number') {
      return (ts as { seconds: number }).seconds * 1000;
    }
    return 0;
  };

  const formatVisitorDhakaTime = (ts: unknown, fallbackLocal?: string): string => {
    const ms = getVisitorMillis(ts);
    if (!ms) return fallbackLocal || 'Just now';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      dateStyle: 'medium',
      timeStyle: 'medium',
      hour12: true,
    }).format(new Date(ms));
  };

  const formatVisitorRelativeTime = (ts: unknown): string => {
    const ms = getVisitorMillis(ts);
    if (!ms) return 'Live';
    const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  const dedupedVisitorLogs = (() => {
    const gpsSessionIds = new Set(
      visitorLogs
        .filter((v) => v.locationAccuracy === 'GPS' && v.sessionId)
        .map((v) => v.sessionId)
    );
    const seenGpsSessions = new Set<string>();
    return visitorLogs.filter((v) => {
      if (v.sessionId && gpsSessionIds.has(v.sessionId)) {
        if (v.locationAccuracy !== 'GPS') return false;
        if (seenGpsSessions.has(v.sessionId)) return false;
        seenGpsSessions.add(v.sessionId);
      }
      return true;
    });
  })();

  const uniqueVisitorIps = new Set(
    dedupedVisitorLogs.map((v) => v.ip).filter((ip) => ip && ip !== 'Unavailable')
  ).size;
  const pwaVisitsCount = dedupedVisitorLogs.filter((v) => v.platform === 'PWA App').length;
  const webVisitsCount = dedupedVisitorLogs.length - pwaVisitsCount;
  const gpsVerifiedCount = dedupedVisitorLogs.filter((v) => v.locationAccuracy === 'GPS').length;

  const topAreaEntry = (() => {
    const counts = new Map<string, number>();
    for (const v of dedupedVisitorLogs) {
      const label = (v.area || v.operatorArea || '').trim();
      if (!label || label === 'Unknown Area' || label === 'Location Pending') continue;
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    let bestLabel = '—';
    let bestCount = 0;
    for (const [label, count] of counts.entries()) {
      if (count > bestCount) {
        bestLabel = label;
        bestCount = count;
      }
    }
    return { label: bestLabel, count: bestCount };
  })();

  const areaBreakdown = (() => {
    const counts = new Map<string, number>();
    for (const v of dedupedVisitorLogs) {
      const label =
        v.area?.trim() || v.operatorArea?.trim() || v.city?.trim() || v.country || 'Unknown';
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  })();

  const deviceBreakdown = (() => {
    const mobile = dedupedVisitorLogs.filter((v) => v.deviceType === 'Mobile').length;
    const desktop = dedupedVisitorLogs.filter((v) => v.deviceType === 'Desktop').length;
    const tablet = dedupedVisitorLogs.filter((v) => v.deviceType === 'Tablet').length;
    return [
      { label: 'Mobile', count: mobile },
      { label: 'Desktop', count: desktop },
      { label: 'Tablet', count: tablet },
    ];
  })();

  const browserBreakdown = (() => {
    const counts = new Map<string, number>();
    for (const v of dedupedVisitorLogs) {
      const label = v.browser?.trim() || 'Other';
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  })();

  const todayDhakaDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
  }).format(new Date());

  const todayVisitsCount = dedupedVisitorLogs.filter((v) => {
    const ms = getVisitorMillis(v.createdAt);
    if (!ms) return false;
    return (
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date(ms)) ===
      todayDhakaDate
    );
  }).length;

  const handleCaptureLiveVisitNow = async () => {
    setAdminError('');
    setCapturingVisit(true);
    try {
      const res = await trackVisitorVisit(
        user
          ? {
              uid: user.uid,
              email: user.email,
              phoneNumber: user.phoneNumber,
              displayName: user.displayName,
            }
          : null,
        { force: true, requestGps: true }
      );
      if (res.recorded) {
        const modeLabel =
          res.accuracy === 'GPS'
            ? `User GPS Granted${typeof res.gpsAccuracyMeters === 'number' ? ` (±${res.gpsAccuracyMeters}m)` : ''}`
            : res.blockedByPolicy || res.isEmbeddedIframe
            ? 'Blocked by preview iframe — open direct tab to grant GPS'
            : `Operator Geo only${res.gpsReason ? ` (${res.gpsReason})` : ''}`;
        showBusyToast(
          `Captured ${res.ip || 'IP'} · ${res.area || res.operatorArea || 'Area'} · ${modeLabel}`,
          4500
        );
      } else {
        setAdminError('Could not record live visit right now. Please check connection.');
      }
    } catch (err) {
      setAdminError(formatAdminErr(err, 'Failed to capture live visit.'));
    } finally {
      setCapturingVisit(false);
    }
  };

  const filteredVisitorLogs = dedupedVisitorLogs.filter((log) => {
    if (visitorFilter === 'Web' && log.platform !== 'Web') return false;
    if (visitorFilter === 'PWA App' && log.platform !== 'PWA App') return false;
    if (
      visitorFilter === 'Bangladesh' &&
      log.countryCode?.toUpperCase() !== 'BD' &&
      !log.country.toLowerCase().includes('bangladesh')
    ) {
      return false;
    }
    if (visitorFilter === 'GPS' && log.locationAccuracy !== 'GPS') return false;

    const q = visitorSearch.trim().toLowerCase();
    if (!q) return true;
    return [
      log.ip,
      log.area,
      log.operatorArea,
      log.city,
      log.region,
      log.country,
      log.postal,
      log.isp,
      log.browser,
      log.os,
      log.deviceType,
      log.platform,
      log.userEmail,
      log.userPhone,
      log.userName,
      log.pagePath,
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q));
  });

  const handleCopyVisitorIp = async (logId: string, ip: string) => {
    try {
      await navigator.clipboard.writeText(ip);
      setCopiedIpId(logId);
      window.setTimeout(() => {
        setCopiedIpId((prev) => (prev === logId ? null : prev));
      }, 1500);
    } catch {
      showBusyToast(`IP: ${ip}`, 2000);
    }
  };

  const handleExportVisitorsCsv = () => {
    const csvEscape = (val: unknown) => {
      const str = val === undefined || val === null ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };
    const headers = [
      'Dhaka Time (BDT)',
      'Visitor Local Time',
      'Timezone',
      'IP Address',
      'IP Type',
      'Accuracy Mode',
      'User Location (GPS Elaka)',
      'GPS Accuracy (m)',
      'User Latitude',
      'User Longitude',
      'Operator / ISP Area',
      'Operator Latitude',
      'Operator Longitude',
      'City',
      'Region',
      'Country',
      'Postal',
      'ISP / Network',
      'Platform',
      'Device',
      'Browser',
      'OS',
      'Screen',
      'Page Path',
      'Referrer',
      'User Email',
      'User Phone',
      'User Name',
    ];
    const rows = filteredVisitorLogs.map((v) =>
      [
        formatVisitorDhakaTime(v.createdAt, v.localTime),
        v.localTime || '',
        v.timezone || '',
        v.ip,
        v.ipType || '',
        v.locationAccuracy,
        v.locationAccuracy === 'GPS' ? v.area : '',
        v.gpsAccuracyMeters ?? '',
        v.locationAccuracy === 'GPS' ? (v.latitude ?? '') : '',
        v.locationAccuracy === 'GPS' ? (v.longitude ?? '') : '',
        v.operatorArea || v.area,
        v.operatorLatitude ?? v.latitude ?? '',
        v.operatorLongitude ?? v.longitude ?? '',
        v.city || '',
        v.region || '',
        v.country,
        v.postal || '',
        v.isp || '',
        v.platform,
        v.deviceType,
        v.browser || '',
        v.os || '',
        v.screenSize || '',
        v.pagePath,
        v.referrer || '',
        v.userEmail || '',
        v.userPhone || '',
        v.userName || '',
      ]
        .map(csvEscape)
        .join(',')
    );
    const csvContent = [headers.map(csvEscape).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `robotera-bd-visitors-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showBusyToast(`Exported ${filteredVisitorLogs.length} visitor logs to CSV.`, 2200);
  };

  const handleClearAllVisitors = async () => {
    if (visitorLogs.length === 0) return;
    setAdminError('');
    setConfirmKey(null);
    setBusyMessage('Clearing visitor logs...');
    try {
      await clearVisitorLogs(visitorLogs.map((v) => v.id));
      showBusyToast('All visitor logs cleared.', 2200);
    } catch (err) {
      setBusyMessage('');
      setAdminError(formatAdminErr(err, 'Failed to clear visitor logs.'));
    }
  };

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
            <div className="px-4 sm:px-7 py-3 bg-[#F6F8FB] border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 lg:pb-0 flex-nowrap lg:flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'dashboard'
                      ? 'bg-[#06142E] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('visitors')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'visitors'
                      ? 'bg-[#0057E7] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Visitor IPs ({dedupedVisitorLogs.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
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
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
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
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
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
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
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
                  onClick={() => setActiveTab('promo-codes')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'promo-codes'
                      ? 'bg-[#0057E7] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Promo Codes ({promoCodes.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('updates')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'updates'
                      ? 'bg-[#0057E7] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>
                    Updates ({currentTickerItems.filter((item) => item.trim()).length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('site-images')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'site-images'
                      ? 'bg-[#0057E7] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span>Site Images</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('alerts')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'alerts'
                      ? 'bg-[#0057E7] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Alerts ({priceAlerts.length + restockAlerts.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600 shrink-0">
                <span>
                  Revenue:{' '}
                  <strong className="font-mono text-[#06142E] tabular-nums">
                    ৳{totalRevenue.toLocaleString('en-IN')}
                  </strong>
                </span>
                <span className="hidden xl:inline font-mono text-slate-400">{user.email}</span>
              </div>
            </div>

            {/* Tab Workspace Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
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

              {/* TAB 0: ADMIN OVERVIEW & LIVE VISITOR IP DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Dashboard Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#06142E]">
                        Store &amp; Live Visitor Telemetry Dashboard
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Real-time visitor IP addresses, Elaka/area detection, platform split (Web &amp; PWA App), and store order health.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {gpsSnapshot.state !== 'granted' && (
                        gpsSnapshot.blockedByPolicy ||
                        (gpsSnapshot.state === 'denied' && gpsSnapshot.isEmbeddedIframe) ? (
                          <a
                            href={typeof window !== 'undefined' ? window.location.href : '/'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open Direct Tab for GPS</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={handleCaptureLiveVisitNow}
                            disabled={capturingVisit}
                            className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>
                              {capturingVisit
                                ? 'Requesting GPS...'
                                : gpsSnapshot.state === 'denied'
                                ? 'Retry Browser GPS'
                                : 'Grant Browser GPS'}
                            </span>
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        onClick={handleCaptureLiveVisitNow}
                        disabled={capturingVisit}
                        className="h-9 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 text-[#06142E] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Activity className={`w-3.5 h-3.5 text-[#0057E7] ${capturingVisit ? 'animate-spin' : ''}`} />
                        <span>{capturingVisit ? 'Capturing...' : 'Capture Live Visit'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('visitors')}
                        className="h-9 px-3.5 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>All Visitor IPs ({dedupedVisitorLogs.length})</span>
                      </button>
                    </div>
                  </div>

                  {gpsSnapshot.state !== 'granted' && (
                    <div className="rounded-xl border border-slate-200 bg-[#F6F8FB] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
                      <span className="leading-snug">
                        {gpsSnapshot.blockedByPolicy ||
                        (gpsSnapshot.state === 'denied' && gpsSnapshot.isEmbeddedIframe)
                          ? 'Embedded preview iframe blocks geolocation permission. Open the direct app URL in a browser tab to grant Browser GPS.'
                          : gpsSnapshot.state === 'denied'
                          ? 'Browser GPS permission is blocked in this browser. Click the lock/site-settings icon beside your address bar, allow Location, then click Retry Browser GPS.'
                          : 'Click "Grant Browser GPS" to allow your browser to capture exact User Location alongside Operator Geo-IP.'}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-500 uppercase">
                        Status: {gpsSnapshot.blockedByPolicy ? 'Iframe Blocked' : gpsSnapshot.state}
                      </span>
                    </div>
                  )}

                  {/* 5-Column KPI Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-3.5">
                      <p className="text-[11px] font-medium text-slate-500">Total Logged Visits</p>
                      <p className="font-display text-2xl font-bold text-[#06142E] tabular-nums mt-1">
                        {dedupedVisitorLogs.length}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                        {todayVisitsCount} today (BDT)
                      </p>
                    </div>

                    <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-3.5">
                      <p className="text-[11px] font-medium text-slate-500">Unique IPs</p>
                      <p className="font-display text-2xl font-bold text-[#0057E7] tabular-nums mt-1">
                        {uniqueVisitorIps}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                        {gpsVerifiedCount} User GPS · {Math.max(0, dedupedVisitorLogs.length - gpsVerifiedCount)} Operator only
                      </p>
                    </div>

                    <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-3.5">
                      <p className="text-[11px] font-medium text-slate-500">Web vs App (PWA)</p>
                      <p className="font-display text-2xl font-bold text-[#06142E] tabular-nums mt-1">
                        {webVisitsCount} <span className="text-sm font-normal text-slate-400">/</span> {pwaVisitsCount}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">Browser vs Installed App</p>
                    </div>

                    <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-3.5">
                      <p className="text-[11px] font-medium text-slate-500">Top Area (Elaka)</p>
                      <p
                        className="font-display text-sm font-bold text-[#06142E] mt-1.5 truncate"
                        title={topAreaEntry.label}
                      >
                        {topAreaEntry.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1.5 font-mono tabular-nums">
                        {topAreaEntry.count > 0 ? `${topAreaEntry.count} visits` : 'No visits yet'}
                      </p>
                    </div>

                    <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-3.5 col-span-2 md:col-span-1">
                      <p className="text-[11px] font-medium text-slate-500">Active Revenue</p>
                      <p className="font-display text-2xl font-bold text-[#06142E] tabular-nums mt-1">
                        ৳{totalRevenue.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                        {orders.filter((o) => o.status === 'Pending' || o.status === 'Confirmed').length} pending · {products.filter((p) => p.stock <= 5).length} low stock
                      </p>
                    </div>
                  </div>

                  {/* Analytics Split: Top Areas (Elaka) + Device & Platform Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-7 border border-slate-200 rounded-xl bg-white p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <h4 className="font-display text-sm font-bold text-[#06142E]">
                          Top Visitor Areas (Elaka &amp; Cities)
                        </h4>
                        <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                          {areaBreakdown.length} active zones
                        </span>
                      </div>
                      {areaBreakdown.length === 0 ? (
                        <p className="text-xs text-slate-500 py-8 text-center">
                          Area statistics will appear as visitors browse the storefront or app.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2.5">
                          {areaBreakdown.map(([areaLabel, count]) => {
                            const pct =
                              dedupedVisitorLogs.length > 0
                                ? Math.round((count / dedupedVisitorLogs.length) * 100)
                                : 0;
                            return (
                              <div key={areaLabel} className="space-y-1">
                                <div className="flex items-center justify-between gap-3 text-xs">
                                  <span className="font-medium text-[#06142E] truncate">{areaLabel}</span>
                                  <span className="font-mono text-slate-600 tabular-nums shrink-0">
                                    {count} ({pct}%)
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-[#0057E7]"
                                    style={{ width: `${Math.max(6, pct)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-5 border border-slate-200 rounded-xl bg-white p-4 sm:p-5 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <h4 className="font-display text-sm font-bold text-[#06142E]">
                            Device &amp; Browser Share
                          </h4>
                          <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                            {dedupedVisitorLogs.length} sessions
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {deviceBreakdown.map((item) => {
                            const pct =
                              dedupedVisitorLogs.length > 0
                                ? Math.round((item.count / dedupedVisitorLogs.length) * 100)
                                : 0;
                            return (
                              <div
                                key={item.label}
                                className="border border-slate-200 rounded-lg p-2.5 bg-[#F6F8FB]"
                              >
                                <p className="text-[11px] text-slate-500">{item.label}</p>
                                <p className="font-mono text-base font-bold text-[#06142E] tabular-nums mt-0.5">
                                  {item.count}
                                </p>
                                <p className="font-mono text-[10px] text-slate-500 tabular-nums">{pct}%</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          Top Browsers
                        </p>
                        {browserBreakdown.length === 0 ? (
                          <p className="text-xs text-slate-400">No browser sessions yet.</p>
                        ) : (
                          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                            {browserBreakdown.map(([browserName, count]) => (
                              <div
                                key={browserName}
                                className="px-3 py-1.5 flex items-center justify-between text-xs"
                              >
                                <span className="font-medium text-slate-700">{browserName}</span>
                                <span className="font-mono text-slate-600 tabular-nums">{count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* High-Density Live Visitor IP Feed Table */}
                  <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                    <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-[#F6F8FB]">
                      <div>
                        <h4 className="font-display text-sm font-bold text-[#06142E]">
                          Recent Live Visitor IPs (Latest 12)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Displays both exact User Location (GPS) and Operator / ISP Location side-by-side with Dhaka time (BDT).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('visitors')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0057E7] hover:underline whitespace-nowrap"
                      >
                        <span>Open Full Visitor IP Console</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {dedupedVisitorLogs.length === 0 ? (
                      <div className="p-8 text-center space-y-3">
                        <p className="text-xs text-slate-500">
                          No visitor IP telemetry recorded yet. Click below to capture your current visit or browse the storefront.
                        </p>
                        <button
                          type="button"
                          onClick={handleCaptureLiveVisitNow}
                          disabled={capturingVisit}
                          className="h-9 px-4 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>{capturingVisit ? 'Capturing Live Visit...' : 'Log My Live IP & Elaka Now'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[840px]">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                              <th className="py-2.5 px-4">IP Address</th>
                              <th className="py-2.5 px-3">User Location (GPS)</th>
                              <th className="py-2.5 px-3">Operator / ISP Location</th>
                              <th className="py-2.5 px-3">Dhaka Time (BDT)</th>
                              <th className="py-2.5 px-4">Platform &amp; Device</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {dedupedVisitorLogs.slice(0, 12).map((log) => {
                              const isGps = log.locationAccuracy === 'GPS';
                              const hasUserCoords =
                                isGps &&
                                typeof log.latitude === 'number' &&
                                typeof log.longitude === 'number';
                              const opLat = log.operatorLatitude ?? (!isGps ? log.latitude : undefined);
                              const opLon = log.operatorLongitude ?? (!isGps ? log.longitude : undefined);
                              const hasOpCoords =
                                typeof opLat === 'number' && typeof opLon === 'number';
                              const operatorLabel =
                                log.operatorArea ||
                                (!isGps ? log.area : [log.city, log.region, log.country].filter(Boolean).join(', ')) ||
                                'Unavailable';

                              return (
                                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-2.5 px-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-[#06142E] tabular-nums">
                                        {log.ip}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyVisitorIp(log.id, log.ip)}
                                        aria-label={`Copy IP ${log.ip}`}
                                        className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-[#06142E]"
                                      >
                                        {copiedIpId === log.id ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                    <div className="text-[11px] text-slate-500 tabular-nums">
                                      {log.ipType || 'IP'} ·{' '}
                                      {isGps
                                        ? `GPS Exact${typeof log.gpsAccuracyMeters === 'number' ? ` ±${log.gpsAccuracyMeters}m` : ''}`
                                        : 'Operator Geo'}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 max-w-[230px]">
                                    {isGps ? (
                                      <>
                                        <p className="font-semibold text-[#06142E] truncate" title={log.area}>
                                          {log.area}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 truncate">
                                          <span>
                                            GPS Exact
                                            {typeof log.gpsAccuracyMeters === 'number'
                                              ? ` (±${log.gpsAccuracyMeters}m)`
                                              : ''}
                                          </span>
                                          {hasUserCoords && (
                                            <>
                                              <span aria-hidden="true">·</span>
                                              <a
                                                href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#0057E7] hover:underline font-medium shrink-0"
                                              >
                                                User Map
                                              </a>
                                            </>
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <p className="font-medium text-slate-400">GPS not granted</p>
                                        <p className="text-[11px] text-slate-500 truncate">
                                          Using Operator IP location
                                        </p>
                                      </>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 max-w-[230px]">
                                    <p className="font-semibold text-[#06142E] truncate" title={operatorLabel}>
                                      {operatorLabel}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                                      <span className="truncate" title={log.isp || log.country}>
                                        {log.isp || log.country}
                                      </span>
                                      {hasOpCoords && (
                                        <>
                                          <span aria-hidden="true">·</span>
                                          <a
                                            href={`https://www.google.com/maps?q=${opLat},${opLon}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#0057E7] hover:underline font-medium shrink-0"
                                          >
                                            ISP Map
                                          </a>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <p className="font-mono text-[#06142E] tabular-nums">
                                      {formatVisitorDhakaTime(log.createdAt, log.localTime)}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                      {formatVisitorRelativeTime(log.createdAt)}
                                    </p>
                                  </td>
                                  <td className="py-2.5 px-4 whitespace-nowrap">
                                    <p className="font-medium text-[#06142E]">
                                      {log.platform} · {log.deviceType}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                      {[log.os, log.browser].filter(Boolean).join(' · ') || 'Browser'}
                                    </p>
                                    {(log.userEmail || log.userPhone) && (
                                      <p className="text-[11px] text-[#0057E7] truncate max-w-[190px]">
                                        {[log.userEmail, log.userPhone].filter(Boolean).join(' · ')}
                                      </p>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Recent Orders Snapshot */}
                  <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-2 bg-[#F6F8FB]">
                      <h4 className="font-display text-sm font-bold text-[#06142E]">
                        Recent Orders ({orders.length})
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveTab('orders')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0057E7] hover:underline whitespace-nowrap"
                      >
                        <span>Manage All Orders</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {orders.length === 0 ? (
                      <p className="text-xs text-slate-500 p-6 text-center">No customer orders yet.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {orders.slice(0, 5).map((order) => (
                          <div
                            key={order.orderId}
                            className="px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs hover:bg-slate-50/70"
                          >
                            <div className="min-w-0">
                              <span className="font-mono font-bold text-[#06142E]">#{order.orderId}</span>
                              <span className="mx-2 text-slate-300">·</span>
                              <span className="font-medium text-slate-700">{order.customerName}</span>
                              <span className="mx-2 text-slate-300">·</span>
                              <span className="text-slate-500">{order.district}</span>
                            </div>
                            <div className="flex items-center gap-3 font-mono tabular-nums">
                              <span className="text-slate-600">{order.status}</span>
                              <span className="font-bold text-[#06142E]">
                                ৳{order.total.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                              {(order.couponCode || (order.rewardPointsRedeemed ?? 0) > 0) && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] font-mono">
                                  {order.couponCode && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                                      Promo: {order.couponCode}
                                    </span>
                                  )}
                                  {(order.rewardPointsRedeemed ?? 0) > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[#0057E7] font-semibold">
                                      Reward: -{order.rewardPointsRedeemed} pts (-৳
                                      {order.rewardDiscount ??
                                        Math.round(((order.rewardPointsRedeemed ?? 0) / 100) * 8)}
                                      )
                                    </span>
                                  )}
                                </div>
                              )}
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
                          <th className="py-3 px-3">Show #</th>
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
                            <td className="py-3 px-3 font-mono whitespace-nowrap">
                              {typeof product.displayOrder === 'number' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#EDF4FF] text-[#0057E7] border border-blue-200 font-bold tabular-nums">
                                  #{product.displayOrder}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">Auto</span>
                              )}
                            </td>
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
                            <td className="py-3 px-3 font-mono text-right tabular-nums whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${
                                  product.stock <= 0
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : product.stock <= 5
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'text-slate-700'
                                }`}
                              >
                                {product.stock <= 0 ? '0 (OOS)' : product.stock}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                {product.stock <= 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickStockChange(product, 10)}
                                    className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                  >
                                    +10 Restock
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickStockChange(product, 0)}
                                    className="px-2 py-1.5 rounded-md border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold"
                                  >
                                    Set 0
                                  </button>
                                )}
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
                      Manage banners shown in the dual-screen 16:9 display wall. Recommended banner size: <strong className="font-mono text-[#071A3B]">1280 × 720 px (16:9)</strong> — rendered completely uncropped.
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
                            {banner.linkUrl && (
                              <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-mono text-[#0057E7] max-w-full truncate">
                                <Link2 className="w-3 h-3 shrink-0" />
                                <span className="truncate">{banner.linkUrl}</span>
                              </p>
                            )}
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

              {/* TAB: PROMO CODES */}
              {activeTab === 'promo-codes' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-bold text-[#06142E]">
                        Promo Codes &amp; Single-Use Controls
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Create percentage or flat ৳ promo codes. Each promo code is strictly limited to 1 use per signed-in account and 1 use per Gmail address.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openNewPromo}
                      className="h-9 px-4 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Promo Code</span>
                    </button>
                  </div>

                  {promoCodes.length === 0 ? (
                    <div className="border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
                      No promo codes created yet. Click &ldquo;Add Promo Code&rdquo; to publish a new coupon.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {promoCodes.map((promo) => (
                        <div
                          key={promo.code}
                          className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col justify-between gap-3"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-bold tracking-wider px-2.5 py-1 rounded-md bg-[#06142E] text-white">
                                  {promo.code}
                                </span>
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0057E7] border border-blue-200">
                                  {promo.discountType === 'percent'
                                    ? `${promo.discountValue}% OFF`
                                    : `৳${promo.discountValue.toLocaleString('en-IN')} OFF`}
                                </span>
                                <span
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                                    promo.active
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}
                                >
                                  {promo.active ? 'Active' : 'Paused'}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed">
                              {promo.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-slate-500">
                              <span>1x per account &amp; Gmail</span>
                              {promo.firstOrderOnly && (
                                <span className="text-amber-700 font-semibold">· 1st Order Only</span>
                              )}
                              {promo.minOrderAmount ? (
                                <span>
                                  · Min Order ৳{promo.minOrderAmount.toLocaleString('en-IN')}
                                </span>
                              ) : null}
                              {promo.discountType === 'percent' && promo.maxDiscountAmount ? (
                                <span>
                                  · Max Save ৳{promo.maxDiscountAmount.toLocaleString('en-IN')}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleTogglePromoActive(promo)}
                              className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                            >
                              {promo.active ? 'Pause Code' : 'Activate'}
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditPromo(promo)}
                                className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              {confirmKey === `promo:${promo.code}` ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePromo(promo.code)}
                                    className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-xs font-semibold text-white"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmKey(null)}
                                    className="px-2 py-1 rounded-md border border-slate-200 text-xs text-slate-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmKey(`promo:${promo.code}`)}
                                  className="px-2.5 py-1 rounded-md border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-600"
                                >
                                  Delete
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

              {/* TAB 5: NAVBAR UPDATES & BANGLA TICKER */}
              {activeTab === 'updates' && (
                <div className="space-y-5 max-w-4xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-bold text-[#06142E]">
                        Top Navbar Updates &amp; Scrolling News (English / বাংলা)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Write updates in Bangla (বাংলা) or English. Edit any line and click Save to publish instantly to the top scrolling bar.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {confirmKey === 'reset-updates' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={savingUpdates}
                            onClick={handleRestoreDefaultUpdates}
                            className="h-9 px-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-semibold"
                          >
                            Confirm Restore
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
                          onClick={() => setConfirmKey('reset-updates')}
                          className="h-9 px-3.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                        >
                          Restore Defaults
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={savingUpdates}
                        onClick={handleSaveAllUpdates}
                        className="h-9 px-4 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{savingUpdates ? 'Saving...' : 'Save & Publish Updates'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Visibility Switch & Live Preview */}
                  <div className="rounded-xl border border-slate-200 bg-[#F6F8FB] p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2.5 text-xs font-semibold text-[#06142E] cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={savingUpdates}
                          checked={draftSiteSettings.newsTickerEnabled ?? true}
                          onChange={(e) => handleToggleTickerEnabled(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0057E7] focus:ring-[#0057E7]"
                        />
                        <span>Show scrolling Updates bar below the main header</span>
                      </label>
                      <span className="font-mono text-[11px] font-semibold text-slate-500">
                        বাংলা &amp; English UTF-8 Supported
                      </span>
                    </div>

                    {/* Live Navbar Ticker Preview */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                        Live Navbar Preview
                      </p>
                      {(draftSiteSettings.newsTickerEnabled ?? true) &&
                      currentTickerItems.some((item) => item.trim()) ? (
                        <div className="ticker-container relative w-full h-9 rounded-lg bg-[#071A3D] text-[#F5F8FF] border border-[rgba(100,150,255,0.28)] overflow-hidden flex items-center">
                          <div className="relative z-10 h-full px-3 bg-[#0A1428] border-r border-[rgba(100,150,255,0.22)] flex items-center gap-1.5 shrink-0">
                            <Radio className="w-3 h-3 text-[#00C8FF] shrink-0" aria-hidden="true" />
                            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#00C8FF]">
                              Updates
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden relative h-full flex items-center">
                            <div className="animate-ticker-marquee flex items-center w-max will-change-transform">
                              {[0, 1].map((dupIndex) => (
                                <div key={dupIndex} aria-hidden={dupIndex === 1} className="flex items-center shrink-0">
                                  {currentTickerItems
                                    .map((s, i) => (i === editingUpdateIndex ? editingUpdateText : s))
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                    .map((item, idx) => (
                                      <span
                                        key={`${dupIndex}-${idx}`}
                                        className="inline-flex items-center gap-3 px-4 py-0.5 font-sans text-[12px] leading-[1.6] font-medium text-[#E2ECFF] whitespace-nowrap"
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
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-500">
                          Updates bar is currently hidden or empty. Enable the checkbox above and add an update line.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add New Update Form (English / বাংলা) */}
                  <form
                    onSubmit={handleAddUpdateItem}
                    className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="new-update-input" className="text-xs font-bold text-[#06142E]">
                        Add New Update (English বা বাংলায় লিখুন)
                      </label>
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                        {newUpdateText.length}/260 · {currentTickerItems.length}/15 items
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        id="new-update-input"
                        type="text"
                        lang="bn"
                        maxLength={260}
                        value={newUpdateText}
                        onChange={(e) => setNewUpdateText(e.target.value)}
                        placeholder="যেমন: নতুন স্টক! ESP32-S3 ও Raspberry Pi 5 এখন ঢাকায় পাওয়া যাচ্ছে · অথবা English update..."
                        className="flex-1 h-10 px-3.5 rounded-lg border border-slate-200 bg-[#F6F8FB] focus:bg-white font-sans text-sm text-[#06142E] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0057E7]"
                      />
                      <button
                        type="submit"
                        disabled={savingUpdates || currentTickerItems.length >= 15}
                        className="h-10 px-4 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add &amp; Save Update</span>
                      </button>
                    </div>
                  </form>

                  {/* Existing Updates List with Inline Edit & Save */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                        Published Updates ({currentTickerItems.length})
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Click <strong>Edit</strong> to modify any line, then <strong>Save</strong> to publish live.
                      </span>
                    </div>

                    {currentTickerItems.length === 0 ? (
                      <div className="border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500 bg-white">
                        No updates added yet. Write an announcement in English or বাংলা above and click &ldquo;Add &amp; Save Update&rdquo;.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {currentTickerItems.map((line, index) => {
                          const isEditingRow = editingUpdateIndex === index;
                          return (
                            <div
                              key={index}
                              className={`rounded-xl border p-3.5 sm:p-4 transition-colors ${
                                isEditingRow
                                  ? 'border-[#0057E7] bg-[#F4F8FF]'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              {isEditingRow ? (
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-mono font-bold text-[#0057E7]">
                                      Editing Update #{String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="font-mono text-slate-400 tabular-nums">
                                      {editingUpdateText.length}/260
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    lang="bn"
                                    autoFocus
                                    maxLength={260}
                                    value={editingUpdateText}
                                    onChange={(e) => setEditingUpdateText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSaveEditedUpdate(index);
                                      } else if (e.key === 'Escape') {
                                        setEditingUpdateIndex(null);
                                        setEditingUpdateText('');
                                      }
                                    }}
                                    placeholder="বাংলা বা ইংরেজিতে আপডেট লিখুন..."
                                    className="w-full h-10 px-3.5 rounded-lg border border-[#0057E7]/50 bg-white font-sans text-sm text-[#06142E] focus:outline-none focus:ring-2 focus:ring-[#0057E7]"
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingUpdateIndex(null);
                                        setEditingUpdateText('');
                                      }}
                                      className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      disabled={savingUpdates}
                                      onClick={() => handleSaveEditedUpdate(index)}
                                      className="h-8 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Save</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-start gap-3 min-w-0">
                                    <span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#F6F8FB] border border-slate-200 font-mono text-[11px] font-bold text-[#06142E] shrink-0 tabular-nums">
                                      {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <p className="font-sans text-sm leading-relaxed text-[#06142E] break-words">
                                      {line}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditUpdate(index, line)}
                                      className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>Edit</span>
                                    </button>

                                    {confirmKey === `update:${index}` ? (
                                      <div className="inline-flex items-center gap-1">
                                        <button
                                          type="button"
                                          disabled={savingUpdates}
                                          onClick={() => handleDeleteUpdateItem(index)}
                                          className="h-8 px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white"
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmKey(null)}
                                          className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-600"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setConfirmKey(`update:${index}`)}
                                        className="h-8 px-2.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-semibold text-red-600 inline-flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: SITE IMAGES & HERO */}
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

                  {/* Top Scrolling Updates Shortcut Card */}
                  <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-[#0057E7]" />
                        <h4 className="font-display text-sm font-bold text-[#06142E]">
                          2. Top Header Scrolling Updates (English / বাংলা)
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600">
                        {currentTickerItems.filter((item) => item.trim()).length} update line(s) configured · Bar is{' '}
                        <strong>{(draftSiteSettings.newsTickerEnabled ?? true) ? 'Visible' : 'Hidden'}</strong>. Use the Updates tab to edit, save, or write announcements in Bangla.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('updates')}
                      className="h-9 px-4 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-xs font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit &amp; Save Updates</span>
                    </button>
                  </div>

                  {/* Promo Grid & Discount Banner Images */}
                  <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-5 space-y-4">
                    <h4 className="font-display text-sm font-bold text-[#06142E]">
                      3. Promo Bundles Grid &amp; Discount Section Images
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
                      4. Engineering Lab Guide Thumbnails
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

              {/* TAB 7: BACK-IN-STOCK & PRICE DROP ALERTS */}
              {activeTab === 'alerts' && (
                <div className="space-y-8">
                  {/* Back-in-Stock Subscribers */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-display text-base font-bold text-[#06142E] flex items-center gap-2">
                          <BellRing className="w-4 h-4 text-[#0057E7]" />
                          <span>Back-in-Stock Alerts (Wishlist &amp; Product Subscribers)</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Customers waiting for out-of-stock hardware. Restocking any item automatically flags active subscribers and alerts their wishlist dashboard.
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#F6F8FB] border border-slate-200 text-[#06142E] tabular-nums">
                        {restockAlerts.filter((a) => a.status === 'Active').length} Active ·{' '}
                        {restockAlerts.length} Total
                      </span>
                    </div>

                    {restockAlerts.length === 0 ? (
                      <div className="border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
                        No back-in-stock restock alert subscriptions yet.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {restockAlerts.map((alert) => {
                          const liveProd = products.find((p) => p.id === alert.productId);
                          const liveStock = liveProd?.stock ?? 0;
                          const isBackInStock = liveStock > 0;
                          const mailSubject = encodeURIComponent(
                            `Back in Stock: ${alert.productName} is ready to order at Robotera BD`
                          );
                          const mailBody = encodeURIComponent(
                            `Hello,\n\nGreat news! ${alert.productName} from your Robotera BD restock watchlist is back in stock (${liveStock} units available at ৳${(liveProd?.price ?? 0).toLocaleString('en-IN')}).\n\nOrder now while Dhaka lab inventory lasts.\n\nRegards,\nRobotera BD`
                          );

                          return (
                            <div
                              key={alert.id}
                              className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-3"
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
                                        : isBackInStock
                                        ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}
                                  >
                                    {alert.status === 'Notified'
                                      ? 'Notified'
                                      : isBackInStock
                                      ? 'Restocked — Send Email'
                                      : 'Watching Restock'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 font-mono truncate">
                                  {alert.email}
                                </p>
                                <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                                  Live Stock:{' '}
                                  <strong className={isBackInStock ? 'text-emerald-700' : 'text-red-600'}>
                                    {liveStock > 0 ? `${liveStock} units` : '0 (Out of Stock)'}
                                  </strong>
                                  {liveProd ? ` · ৳${liveProd.price.toLocaleString('en-IN')}` : ''}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                {liveProd && liveStock <= 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickStockChange(liveProd, 10)}
                                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1"
                                  >
                                    <span>+10 Restock Now</span>
                                  </button>
                                )}
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
                                        await markRestockAlertNotified(alert.id);
                                        showBusyToast('Restock alert marked as notified.', 1800);
                                      } catch (err) {
                                        setAdminError(
                                          formatAdminErr(err, 'Failed to update restock alert.')
                                        );
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
                                      await deleteRestockAlert(alert.id);
                                      showBusyToast('Restock alert removed.', 1500);
                                    } catch (err) {
                                      setAdminError(
                                        formatAdminErr(err, 'Failed to delete restock alert.')
                                      );
                                    }
                                  }}
                                  aria-label={`Delete restock alert for ${alert.email}`}
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

                  {/* Customer Price Drop Alerts */}
                  <div className="space-y-4 pt-6 border-t border-slate-200">
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
                </div>
              )}

              {/* TAB 8: VISITOR ANALYTICS (IP, LOCATION, AREA / ELAKA, TIME, PLATFORM) */}
              {activeTab === 'visitors' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-bold text-[#06142E] flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#0057E7]" />
                        <span>Live App &amp; Web Visitor Telemetry (IP · Elaka · Time)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Real-time visitor telemetry from Web browsers and PWA App showing both exact User Location (GPS) and Operator / ISP Location.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {gpsSnapshot.state !== 'granted' && (
                        gpsSnapshot.blockedByPolicy ||
                        (gpsSnapshot.state === 'denied' && gpsSnapshot.isEmbeddedIframe) ? (
                          <a
                            href={typeof window !== 'undefined' ? window.location.href : '/'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open Direct Tab for GPS</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={handleCaptureLiveVisitNow}
                            disabled={capturingVisit}
                            className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>
                              {capturingVisit
                                ? 'Requesting GPS...'
                                : gpsSnapshot.state === 'denied'
                                ? 'Retry Browser GPS'
                                : 'Grant Browser GPS'}
                            </span>
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        onClick={handleCaptureLiveVisitNow}
                        disabled={capturingVisit}
                        className="h-9 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 text-[#06142E] text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Activity className={`w-3.5 h-3.5 text-[#0057E7] ${capturingVisit ? 'animate-spin' : ''}`} />
                        <span>{capturingVisit ? 'Capturing...' : 'Capture Live Visit'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportVisitorsCsv}
                        disabled={filteredVisitorLogs.length === 0}
                        className="h-9 px-3.5 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </button>
                      {visitorLogs.length > 0 && (
                        confirmKey === 'clear-visitors' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleClearAllVisitors}
                              className="h-9 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                            >
                              Confirm Clear ({visitorLogs.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmKey(null)}
                              className="h-9 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmKey('clear-visitors')}
                            className="h-9 px-3 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold inline-flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Clear All</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Visitor KPI Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-3.5">
                      <p className="text-[11px] font-medium text-slate-500">Logged Visits</p>
                      <p className="font-display text-xl font-bold text-[#06142E] tabular-nums mt-0.5">
                        {dedupedVisitorLogs.length}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                        {gpsVerifiedCount} User GPS · {Math.max(0, dedupedVisitorLogs.length - gpsVerifiedCount)} Operator Geo
                      </p>
                    </div>
                    <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-3.5">
                      <p className="text-[11px] font-medium text-slate-500">Unique IP Addresses</p>
                      <p className="font-display text-xl font-bold text-[#0057E7] tabular-nums mt-0.5">
                        {uniqueVisitorIps}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Distinct network endpoints</p>
                    </div>
                    <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-3.5">
                      <p className="text-[11px] font-medium text-slate-500">App (PWA) vs Web</p>
                      <p className="font-display text-xl font-bold text-[#06142E] tabular-nums mt-0.5">
                        {pwaVisitsCount} <span className="text-sm font-normal text-slate-400">App</span> · {webVisitsCount}{' '}
                        <span className="text-sm font-normal text-slate-400">Web</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Platform distribution</p>
                    </div>
                    <div className="bg-[#F6F8FB] border border-slate-200 rounded-xl p-3.5">
                      <p className="text-[11px] font-medium text-slate-500">Top Elaka / Area</p>
                      <p
                        className="font-display text-sm font-bold text-[#06142E] mt-1 truncate"
                        title={topAreaEntry.label}
                      >
                        {topAreaEntry.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                        {topAreaEntry.count > 0 ? `${topAreaEntry.count} visits recorded` : 'Waiting for traffic'}
                      </p>
                    </div>
                  </div>

                  {/* Search & Filter Controls */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={visitorSearch}
                        onChange={(e) => setVisitorSearch(e.target.value)}
                        placeholder="Search IP, user elaka, operator area, ISP, browser, email..."
                        className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#0057E7]"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {(
                        [
                          { id: 'all', label: 'All' },
                          { id: 'Web', label: 'Web' },
                          { id: 'PWA App', label: 'PWA App' },
                          { id: 'Bangladesh', label: 'Bangladesh' },
                          { id: 'GPS', label: 'User GPS Exact' },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setVisitorFilter(f.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                            visitorFilter === f.id
                              ? 'bg-[#06142E] text-white'
                              : 'bg-[#F6F8FB] text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visitor Log List */}
                  {filteredVisitorLogs.length === 0 ? (
                    <div className="border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
                      {dedupedVisitorLogs.length === 0
                        ? 'No visitor sessions recorded yet. Open the storefront or installed app to see live visitor telemetry.'
                        : 'No visitor records match your current search or filter.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredVisitorLogs.map((log) => {
                        const isGps = log.locationAccuracy === 'GPS';
                        const hasUserCoords =
                          isGps &&
                          typeof log.latitude === 'number' &&
                          typeof log.longitude === 'number';
                        const userMapHref = hasUserCoords
                          ? `https://www.google.com/maps?q=${log.latitude},${log.longitude}`
                          : undefined;

                        const opLat = log.operatorLatitude ?? (!isGps ? log.latitude : undefined);
                        const opLon = log.operatorLongitude ?? (!isGps ? log.longitude : undefined);
                        const hasOpCoords =
                          typeof opLat === 'number' && typeof opLon === 'number';
                        const operatorMapHref = hasOpCoords
                          ? `https://www.google.com/maps?q=${opLat},${opLon}`
                          : undefined;
                        const operatorAreaText =
                          log.operatorArea ||
                          (!isGps ? log.area : [log.city, log.region, log.country].filter(Boolean).join(', ')) ||
                          'Unavailable';

                        return (
                          <div
                            key={log.id}
                            className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-colors"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                              {/* Left: IP, Both User & Operator Locations, ISP, Device */}
                              <div className="space-y-2.5 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-sm font-bold text-[#06142E] tabular-nums">
                                    {log.ip}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyVisitorIp(log.id, log.ip)}
                                    title="Copy IP address"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                                  >
                                    {copiedIpId === log.id ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span className="text-emerald-700">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy IP</span>
                                      </>
                                    )}
                                  </button>
                                  {log.ipType && (
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-semibold">
                                      {log.ipType}
                                    </span>
                                  )}
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                      log.platform === 'PWA App'
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                        : 'bg-blue-50 text-[#0057E7] border-blue-200'
                                    }`}
                                  >
                                    {log.platform === 'PWA App' ? (
                                      <Smartphone className="w-3 h-3" />
                                    ) : (
                                      <Monitor className="w-3 h-3" />
                                    )}
                                    <span>{log.platform}</span>
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border tabular-nums ${
                                      isGps
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}
                                  >
                                    {isGps
                                      ? `User GPS${typeof log.gpsAccuracyMeters === 'number' ? ` ±${log.gpsAccuracyMeters}m` : ''}`
                                      : 'Operator Geo Only'}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-600">
                                    {formatVisitorRelativeTime(log.createdAt)}
                                  </span>
                                </div>

                                {/* Side-by-Side User Exact Location vs Operator / ISP Location (flat hairline divider, zero nested cards) */}
                                <div className="pt-2.5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* User Exact GPS Location */}
                                  <div className="min-w-0 space-y-1">
                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${isGps ? 'text-emerald-600' : 'text-slate-400'}`} />
                                      <span>User Exact Location (Browser / PWA GPS)</span>
                                    </div>
                                    {isGps ? (
                                      <>
                                        <p className="text-xs font-bold text-[#06142E] break-words">
                                          {log.area}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-600">
                                          <span>
                                            {[log.city, log.region, log.country, log.postal ? `Postal ${log.postal}` : null]
                                              .filter(Boolean)
                                              .join(' · ')}
                                          </span>
                                          {userMapHref && (
                                            <a
                                              href={userMapHref}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 text-[#0057E7] hover:underline font-semibold font-mono tabular-nums"
                                            >
                                              <span>
                                                {log.latitude?.toFixed(4)}, {log.longitude?.toFixed(4)}
                                              </span>
                                              <ExternalLink className="w-3 h-3" />
                                            </a>
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <p className="text-xs font-semibold text-slate-500">
                                          Browser GPS not granted
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                          Visitor has not allowed browser/app location permission yet; Operator Geo shown beside.
                                        </p>
                                      </>
                                    )}
                                  </div>

                                  {/* Operator / ISP Network Location */}
                                  <div className="min-w-0 space-y-1 md:border-l md:border-slate-100 md:pl-3">
                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                      <Globe className="w-3.5 h-3.5 shrink-0 text-[#0057E7]" />
                                      <span>Operator / ISP Location</span>
                                    </div>
                                    <p className="text-xs font-bold text-[#06142E] break-words">
                                      {operatorAreaText}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-600">
                                      <span>
                                        {log.isp ? `${log.isp} · ` : ''}
                                        {log.country}
                                        {log.countryCode ? ` (${log.countryCode})` : ''}
                                      </span>
                                      {operatorMapHref && (
                                        <a
                                          href={operatorMapHref}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-[#0057E7] hover:underline font-semibold font-mono tabular-nums"
                                        >
                                          <span>
                                            {opLat?.toFixed(4)}, {opLon?.toFixed(4)}
                                          </span>
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Meta Info Row: Device, OS, Browser, Screen, Page, Signed-in Account */}
                                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
                                  <span>
                                    Device:{' '}
                                    <strong className="text-[#06142E]">
                                      {log.deviceType}
                                      {log.os ? ` · ${log.os}` : ''}
                                      {log.browser ? ` · ${log.browser}` : ''}
                                    </strong>
                                  </span>
                                  {log.screenSize && (
                                    <span className="font-mono text-slate-500">{log.screenSize}</span>
                                  )}
                                  <span className="font-mono text-slate-500">Path: {log.pagePath}</span>
                                  {(log.userEmail || log.userPhone) && (
                                    <span className="text-[#0057E7] font-medium">
                                      User:{' '}
                                      {log.userName
                                        ? `${log.userName} (${[log.userEmail, log.userPhone]
                                            .filter(Boolean)
                                            .join(' · ')})`
                                        : [log.userEmail, log.userPhone].filter(Boolean).join(' · ')}
                                    </span>
                                  )}
                                </div>
                                {log.referrer && (
                                  <p className="text-[11px] text-slate-400 truncate">
                                    Referrer: {log.referrer}
                                  </p>
                                )}
                              </div>

                              {/* Right: Exact Times + Delete Action */}
                              <div className="flex lg:flex-col items-start lg:items-end justify-between gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100">
                                <div className="lg:text-right space-y-0.5">
                                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#06142E] tabular-nums">
                                    <Clock className="w-3.5 h-3.5 text-[#0057E7]" />
                                    <span>{formatVisitorDhakaTime(log.createdAt, log.localTime)}</span>
                                  </div>
                                  <p className="text-[10px] font-mono text-slate-500">
                                    BDT (Asia/Dhaka)
                                  </p>
                                  {log.timezone && (
                                    <p className="text-[10px] text-slate-500">
                                      Visitor TZ: {log.timezone}
                                      {log.localTime ? ` · ${log.localTime}` : ''}
                                    </p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const siblingIds = log.sessionId
                                        ? visitorLogs
                                            .filter((v) => v.sessionId === log.sessionId)
                                            .map((v) => v.id)
                                        : [log.id];
                                      if (siblingIds.length > 1) {
                                        await clearVisitorLogs(siblingIds);
                                      } else {
                                        await deleteVisitorLog(log.id);
                                      }
                                      showBusyToast('Visitor log deleted.', 1500);
                                    } catch (err) {
                                      setAdminError(
                                        formatAdminErr(err, 'Failed to delete visitor log.')
                                      );
                                    }
                                  }}
                                  aria-label={`Delete visitor log ${log.ip}`}
                                  className="h-8 px-2.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
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
                <label className="block font-semibold text-slate-700 mb-1">
                  Courier Tracking / Dispatch Note (Live on Order Tracking)
                </label>
                <input
                  type="text"
                  value={editingOrder.notes ?? ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, notes: e.target.value })}
                  placeholder="e.g. Steadfast Consignment #SF-9021 · Rider: Karim (017XX)"
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
                <label className="block font-semibold text-slate-700 mb-1">
                  Show Number (Serial Order)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={editingProduct.displayOrder ?? ''}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setEditingProduct({
                      ...editingProduct,
                      displayOrder: val === '' ? undefined : Number(val),
                    });
                  }}
                  placeholder="e.g. 1, 2, 3 (Optional)"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
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

              <div className="sm:col-span-2 bg-[#F6F8FB] border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="admin-banner-link-url"
                    className="font-semibold text-[#06142E] inline-flex items-center gap-1.5"
                  >
                    <Link2 className="w-3.5 h-3.5 text-[#0057E7]" />
                    <span>Add Link (Optional — Banner Click URL)</span>
                  </label>
                  {editingBanner.linkUrl && (
                    <button
                      type="button"
                      onClick={() => setEditingBanner({ ...editingBanner, linkUrl: '' })}
                      className="text-[11px] font-semibold text-red-600 hover:underline"
                    >
                      Remove link
                    </button>
                  )}
                </div>
                <input
                  id="admin-banner-link-url"
                  type="text"
                  maxLength={500}
                  value={editingBanner.linkUrl ?? ''}
                  onChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      linkUrl: e.target.value,
                    })
                  }
                  placeholder="https://... or #best-selling or #track"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  If you add a link here, clicking this banner opens that link directly. Leave empty to use the Target Category above.
                </p>
              </div>

              <div className="sm:col-span-2">
                <ImageSourceField
                  label="Custom Banner Image (Recommended: 1280 × 720 px / 16:9 — zero crop)"
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
                <label className="block font-semibold text-slate-700 mb-1">
                  Fallback Icon (Optional — &quot;None&quot; uses uploaded image)
                </label>
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
                  <option value="none">None — Use Uploaded Image Only</option>
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
                  helperText="Leave Fallback Icon as None to display your uploaded image directly on this category card."
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

      {/* Sub-Modal: Add / Edit Promo Code */}
      {editingPromo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditingPromo(null)} />
          <form
            onSubmit={handleSavePromo}
            className="relative z-10 w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 sm:p-6 space-y-4 max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-display text-lg font-bold text-[#06142E]">
                {isCreatingPromo ? 'Create New Promo Code' : `Edit Promo ${editingPromo.code}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPromo(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Promo Code (Uppercase Letters, Numbers, - or _)
                </label>
                <input
                  type="text"
                  required
                  disabled={!isCreatingPromo}
                  maxLength={32}
                  value={editingPromo.code}
                  onChange={(e) => {
                    const cleaned = normalizePromoCodeString(e.target.value);
                    setEditingPromo({ ...editingPromo, id: cleaned, code: cleaned });
                  }}
                  placeholder="e.g. BUET20 or LAB500"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 font-mono uppercase disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
                <select
                  value={editingPromo.discountType}
                  onChange={(e) =>
                    setEditingPromo({
                      ...editingPromo,
                      discountType: e.target.value as PromoDiscountType,
                      discountValue: e.target.value === 'percent' ? 15 : 200,
                    })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Amount (৳)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {editingPromo.discountType === 'percent' ? 'Discount Percentage (%)' : 'Discount Amount (৳)'}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={editingPromo.discountType === 'percent' ? 90 : 500000}
                  value={editingPromo.discountValue}
                  onChange={(e) =>
                    setEditingPromo({ ...editingPromo, discountValue: Number(e.target.value) })
                  }
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Min Order Subtotal (Optional ৳)
                </label>
                <input
                  type="number"
                  min={0}
                  max={5000000}
                  value={editingPromo.minOrderAmount ?? ''}
                  onChange={(e) =>
                    setEditingPromo({
                      ...editingPromo,
                      minOrderAmount: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="e.g. 1500"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 font-mono"
                />
              </div>

              {editingPromo.discountType === 'percent' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Max Discount Cap (Optional ৳)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5000000}
                    value={editingPromo.maxDiscountAmount ?? ''}
                    onChange={(e) =>
                      setEditingPromo({
                        ...editingPromo,
                        maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="e.g. 1000"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  maxLength={160}
                  value={editingPromo.description}
                  onChange={(e) =>
                    setEditingPromo({ ...editingPromo, description: e.target.value })
                  }
                  placeholder="e.g. University Robotics Club 20% Hardware Offer"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200"
                />
              </div>

              <div className="sm:col-span-2 space-y-2 pt-1">
                <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingPromo.firstOrderOnly)}
                    onChange={(e) =>
                      setEditingPromo({ ...editingPromo, firstOrderOnly: e.target.checked })
                    }
                  />
                  First-order accounts only (rejects accounts with previous orders)
                </label>
                <br />
                <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPromo.active}
                    onChange={(e) =>
                      setEditingPromo({ ...editingPromo, active: e.target.checked })
                    }
                  />
                  Active (immediately redeemable at checkout — 1 use per Gmail &amp; account)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingPromo(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-xs font-semibold"
              >
                {isCreatingPromo ? 'Create Promo Code' : 'Save Promo Code'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
