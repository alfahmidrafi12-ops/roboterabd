import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  CATEGORIES,
  DEFAULT_BANNERS,
  DEFAULT_PROMO_CODES,
  DEFAULT_SITE_SETTINGS,
  PRODUCTS,
} from '../data/catalog';
import {
  BannerItem,
  CategoryItem,
  OrderTrackingInfo,
  PriceAlert,
  Product,
  PromoCode,
  RestockAlert,
  SiteImagesConfig,
  StoredOrder,
  VisitorLog,
} from '../types/store';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
auth.useDeviceLanguage();
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const ADMIN_EMAIL = 'alfahmidrafi03@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export function isVerifiedAdminUser(user: User | null): boolean {
  if (!user) return false;
  return Boolean(user.emailVerified && user.email?.toLowerCase() === ADMIN_EMAIL);
}

export async function signInAdminWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function signUpWithEmail(
  fullName: string,
  email: string,
  password: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (fullName.trim()) {
    await updateProfile(result.user, { displayName: fullName.trim() });
  }
  try {
    await sendEmailVerification(result.user);
  } catch (err) {
    console.warn('Email verification could not be sent immediately:', err);
  }
  return result.user;
}

export async function resendVerificationEmail(): Promise<void> {
  if (auth.currentUser && !auth.currentUser.emailVerified) {
    await sendEmailVerification(auth.currentUser);
  }
}

export async function resetUserPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export function subscribeProducts(
  onData: (products: Product[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'products';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (snapshot.empty) {
        onData([]);
        return;
      }
      const list = snapshot.docs.map((d) => d.data() as Product);
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeBanners(
  onData: (banners: BannerItem[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'banners';
  const q = query(collection(db, path), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData([]);
        return;
      }
      const list = snapshot.docs.map((d) => d.data() as BannerItem);
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeCategories(
  onData: (categories: CategoryItem[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'categories';
  const q = query(collection(db, path), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData([]);
        return;
      }
      const list = snapshot.docs.map((d) => d.data() as CategoryItem);
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeSiteSettings(
  onData: (settings: SiteImagesConfig | null) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'site_settings/branding';
  return onSnapshot(
    doc(db, 'site_settings', 'branding'),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      onData(snapshot.data() as SiteImagesConfig);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeOrders(
  onData: (orders: StoredOrder[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'orders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as StoredOrder);
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

function getTimestampMillis(ts: unknown): number {
  if (!ts || typeof ts !== 'object') return 0;
  if ('toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  if ('seconds' in ts && typeof (ts as { seconds: number }).seconds === 'number') {
    return (ts as { seconds: number }).seconds * 1000;
  }
  return 0;
}

export function subscribeUserOrders(
  userId: string,
  onData: (orders: StoredOrder[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'orders';
  const q = query(collection(db, path), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as StoredOrder);
      list.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function normalizePromoCodeString(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32);
}

export function canonicalizeEmailForPromo(rawEmail: string): string {
  const trimmed = rawEmail.trim().toLowerCase();
  const atIdx = trimmed.indexOf('@');
  if (atIdx <= 0) return trimmed;
  let local = trimmed.slice(0, atIdx);
  let domain = trimmed.slice(atIdx + 1);
  if (domain === 'googlemail.com') {
    domain = 'gmail.com';
  }
  if (domain === 'gmail.com') {
    const plusIdx = local.indexOf('+');
    if (plusIdx !== -1) {
      local = local.slice(0, plusIdx);
    }
    local = local.replace(/\./g, '');
  }
  return `${local}@${domain}`;
}

async function sha256HexLower(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getEmailRedemptionDocId(code: string, rawEmail: string): Promise<string> {
  const cleanCode = normalizePromoCodeString(code);
  const canonical = canonicalizeEmailForPromo(rawEmail);
  const digest = await sha256HexLower(canonical);
  return `${cleanCode}__e__${digest}`;
}

export function subscribePromoCodes(
  onData: (promos: PromoCode[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'promo_codes';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (snapshot.empty) {
        onData([]);
        return;
      }
      const list = snapshot.docs.map((d) => d.data() as PromoCode);
      list.sort((a, b) => Number(b.active) - Number(a.active) || a.code.localeCompare(b.code));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function savePromoCode(promo: PromoCode): Promise<void> {
  const cleanCode = normalizePromoCodeString(promo.code || promo.id);
  if (cleanCode.length < 3) {
    throw new Error('Promo code must be at least 3 characters (letters, numbers, - or _).');
  }
  const path = `promo_codes/${cleanCode}`;
  try {
    const discountType = promo.discountType === 'flat' ? 'flat' : 'percent';
    const discountValue =
      discountType === 'percent'
        ? clampNum(Math.round(Number(promo.discountValue) || 10), 1, 90)
        : clampNum(Math.round(Number(promo.discountValue) || 100), 1, 500000);

    const payload = stripUndefined({
      id: cleanCode,
      code: cleanCode,
      discountType,
      discountValue,
      minOrderAmount:
        promo.minOrderAmount !== undefined && Number(promo.minOrderAmount) > 0
          ? clampNum(Math.round(Number(promo.minOrderAmount)), 0, 5000000)
          : undefined,
      maxDiscountAmount:
        discountType === 'percent' &&
        promo.maxDiscountAmount !== undefined &&
        Number(promo.maxDiscountAmount) > 0
          ? clampNum(Math.round(Number(promo.maxDiscountAmount)), 1, 5000000)
          : undefined,
      firstOrderOnly: Boolean(promo.firstOrderOnly),
      description:
        truncateStr(promo.description, 160) ||
        (discountType === 'percent'
          ? `${discountValue}% off hardware order (1 use per account & Gmail)`
          : `৳${discountValue} off hardware order (1 use per account & Gmail)`),
      active: promo.active ?? true,
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'promo_codes', cleanCode), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removePromoCode(code: string): Promise<void> {
  const cleanCode = normalizePromoCodeString(code);
  const path = `promo_codes/${cleanCode}`;
  try {
    await deleteDoc(doc(db, 'promo_codes', cleanCode));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function checkUserPromoRedemption(
  code: string,
  userId: string,
  userEmail?: string | null
): Promise<boolean> {
  const cleanCode = normalizePromoCodeString(code);
  if (!cleanCode || !userId) return false;

  try {
    const uidSnap = await getDoc(doc(db, 'promo_redemptions', `${cleanCode}__u__${userId}`));
    if (uidSnap.exists()) return true;

    if (userEmail && userEmail.includes('@')) {
      const emailDocId = await getEmailRedemptionDocId(cleanCode, userEmail);
      const emailSnap = await getDoc(doc(db, 'promo_redemptions', emailDocId));
      if (emailSnap.exists()) return true;
    }

    return false;
  } catch (error) {
    console.warn('Promo redemption pre-check warning:', error);
    return false;
  }
}

export async function seedCatalogIfEmpty(): Promise<{
  productsSeeded: number;
  bannersSeeded: number;
  categoriesSeeded: number;
}> {
  let productsSeeded = 0;
  let bannersSeeded = 0;
  let categoriesSeeded = 0;

  try {
    const catSnap = await getDocs(collection(db, 'categories'));
    if (catSnap.empty) {
      const batch = writeBatch(db);
      for (const category of CATEGORIES) {
        const payload = stripUndefined({
          ...category,
          order: category.order ?? 1,
          active: category.active ?? true,
          updatedAt: serverTimestamp(),
        });
        batch.set(doc(db, 'categories', category.id), payload);
      }
      await batch.commit();
      categoriesSeeded = CATEGORIES.length;
    }

    const prodSnap = await getDocs(collection(db, 'products'));
    if (prodSnap.empty) {
      const batch = writeBatch(db);
      for (const product of PRODUCTS) {
        const payload = stripUndefined({
          ...product,
          updatedAt: serverTimestamp(),
        });
        batch.set(doc(db, 'products', product.id), payload);
      }
      await batch.commit();
      productsSeeded = PRODUCTS.length;
    }

    const bannerSnap = await getDocs(collection(db, 'banners'));
    if (bannerSnap.empty) {
      const batch = writeBatch(db);
      for (const banner of DEFAULT_BANNERS) {
        const payload = stripUndefined({
          ...banner,
          updatedAt: serverTimestamp(),
        });
        batch.set(doc(db, 'banners', banner.id), payload);
      }
      await batch.commit();
      bannersSeeded = DEFAULT_BANNERS.length;
    }

    const promoSnap = await getDocs(collection(db, 'promo_codes'));
    if (promoSnap.empty) {
      const batch = writeBatch(db);
      for (const promo of DEFAULT_PROMO_CODES) {
        const payload = stripUndefined({
          ...promo,
          updatedAt: serverTimestamp(),
        });
        batch.set(doc(db, 'promo_codes', promo.id), payload);
      }
      await batch.commit();
    }

    const siteSnap = await getDoc(doc(db, 'site_settings', 'branding'));
    if (!siteSnap.exists()) {
      await saveSiteSettings(DEFAULT_SITE_SETTINGS);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products');
  }

  return { productsSeeded, bannersSeeded, categoriesSeeded };
}

function truncateStr(val: string | undefined, max: number): string | undefined {
  if (val === undefined) return undefined;
  const trimmed = val.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function clampNum(val: number, min: number, max: number): number {
  const num = Number.isFinite(val) ? val : min;
  return Math.min(max, Math.max(min, num));
}

export async function saveCategory(category: CategoryItem): Promise<void> {
  const safeId = category.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64) || `cat-${Date.now()}`;
  const path = `categories/${safeId}`;
  try {
    const payload = stripUndefined({
      ...category,
      id: safeId,
      name: truncateStr(category.name, 80) || 'Hardware',
      countLabel: truncateStr(category.countLabel, 40) || '0 Items',
      artwork: category.artwork,
      imageUrl: category.imageUrl?.trim() ? category.imageUrl.trim().slice(0, 300000) : undefined,
      order: clampNum(Number(category.order) || 1, 0, 1000),
      active: category.active ?? true,
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'categories', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeCategory(categoryId: string): Promise<void> {
  const path = `categories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSiteSettings(settings: SiteImagesConfig): Promise<void> {
  const path = 'site_settings/branding';
  try {
    const cleanedBlogImages = settings.blogImages
      ? stripUndefined({
          'ros2-lidar-esp32-rover': settings.blogImages['ros2-lidar-esp32-rover']?.slice(0, 300000) || undefined,
          'motor-driver-comparison': settings.blogImages['motor-driver-comparison']?.slice(0, 300000) || undefined,
          'lipo-bms-safety-bd': settings.blogImages['lipo-bms-safety-bd']?.slice(0, 300000) || undefined,
        })
      : undefined;

    const cleanedTickerItems = Array.isArray(settings.newsTickerItems)
      ? settings.newsTickerItems
          .map((item) => (typeof item === 'string' ? item.trim().slice(0, 260) : ''))
          .filter(Boolean)
          .slice(0, 15)
      : undefined;

    const payload = stripUndefined({
      id: 'branding',
      heroImageUrl: (settings.heroImageUrl || DEFAULT_SITE_SETTINGS.heroImageUrl).slice(0, 300000),
      heroKicker: truncateStr(settings.heroKicker, 80),
      heroTitle: truncateStr(settings.heroTitle, 160),
      heroSubtitle: truncateStr(settings.heroSubtitle, 320),
      heroTagline: truncateStr(settings.heroTagline, 120),
      heroDispatchText: truncateStr(settings.heroDispatchText, 120),
      newsTickerEnabled:
        typeof settings.newsTickerEnabled === 'boolean' ? settings.newsTickerEnabled : true,
      newsTickerItems: cleanedTickerItems,
      promoLeftImageUrl: settings.promoLeftImageUrl?.trim().slice(0, 300000) || undefined,
      promoTopRightImageUrl: settings.promoTopRightImageUrl?.trim().slice(0, 300000) || undefined,
      promoBottomRightImageUrl: settings.promoBottomRightImageUrl?.trim().slice(0, 300000) || undefined,
      discountBannerImageUrl: settings.discountBannerImageUrl?.trim().slice(0, 300000) || undefined,
      blogImages: cleanedBlogImages && Object.keys(cleanedBlogImages).length > 0 ? cleanedBlogImages : undefined,
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'site_settings', 'branding'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveProduct(product: Product): Promise<void> {
  const safeId = product.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64) || `rbd-${Date.now()}`;
  const path = `products/${safeId}`;
  try {
    const payload = stripUndefined({
      ...product,
      id: safeId,
      sku: truncateStr(product.sku, 40) || `RBD-${Date.now().toString().slice(-4)}`,
      name: truncateStr(product.name, 160) || 'Robotics Component',
      category: product.category.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64) || 'microcontrollers',
      categoryLabel: truncateStr(product.categoryLabel, 80) || 'Hardware',
      price: clampNum(Number(product.price) || 0, 0, 5000000),
      originalPrice:
        product.originalPrice !== undefined && Number(product.originalPrice) > 0
          ? clampNum(Number(product.originalPrice), 0, 5000000)
          : undefined,
      rating: clampNum(Number(product.rating) || 4.8, 0, 5),
      reviews: clampNum(Math.round(Number(product.reviews) || 0), 0, 1000000),
      stock: clampNum(Math.round(Number(product.stock) || 0), 0, 100000),
      tag: truncateStr(product.tag, 40) || undefined,
      imageUrl: product.imageUrl?.trim() ? product.imageUrl.trim().slice(0, 300000) : undefined,
      videoUrl:
        product.videoUrl?.trim() && /^https?:\/\//i.test(product.videoUrl.trim())
          ? product.videoUrl.trim().slice(0, 500)
          : undefined,
      shortDesc: truncateStr(product.shortDesc, 600) || 'Bench-tested robotics hardware component.',
      specs: (product.specs || []).slice(0, 12),
      variants: product.variants && product.variants.length > 0 ? product.variants.slice(0, 10) : undefined,
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'products', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeProduct(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

function sanitizeBannerLinkUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  let trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return undefined;
  if (
    !/^(https?:\/\/|\/|#)/i.test(trimmed) &&
    /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)
  ) {
    trimmed = `https://${trimmed}`;
  }
  if (!/^(https?:\/\/|\/|#)/i.test(trimmed)) return undefined;
  return trimmed.slice(0, 500);
}

export async function saveBanner(banner: BannerItem): Promise<void> {
  const safeId = banner.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64) || `banner-${Date.now()}`;
  const path = `banners/${safeId}`;
  try {
    const cleanLinkUrl = sanitizeBannerLinkUrl(banner.linkUrl);
    const payload = stripUndefined({
      ...banner,
      id: safeId,
      kicker: truncateStr(banner.kicker, 60) || 'Featured',
      title: truncateStr(banner.title, 140) || 'Special Offer',
      subtitle: truncateStr(banner.subtitle, 240) || 'Explore stocked robotics components.',
      ctaLabel: truncateStr(banner.ctaLabel, 40) || 'Shop Now',
      targetCategory: (banner.targetCategory || 'all').slice(0, 64),
      linkUrl: cleanLinkUrl,
      imageUrl: banner.imageUrl?.trim() ? banner.imageUrl.trim().slice(0, 300000) : undefined,
      order: clampNum(Number(banner.order) || 1, 0, 1000),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'banners', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeBanner(bannerId: string): Promise<void> {
  const path = `banners/${bannerId}`;
  try {
    await deleteDoc(doc(db, 'banners', bannerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createOrderInFirestore(
  order: Omit<StoredOrder, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const safeOrderId = order.orderId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40);
  const path = `orders/${safeOrderId}`;
  try {
    const batch = writeBatch(db);
    const safeItems = order.items.slice(0, 50).map((item) =>
      stripUndefined({
        ...item,
        name: truncateStr(item.name, 160) || item.name,
        quantity: clampNum(Math.round(item.quantity), 1, 500),
        price: clampNum(item.price, 0, 5000000),
      })
    );
    const safeDistrict = truncateStr(order.district, 80) || 'Dhaka Metro';
    const safePayment = truncateStr(order.paymentMethod, 60) || 'Cash on Delivery';
    const safeNotes = truncateStr(order.notes, 300);
    const safeTotal = clampNum(order.total, 0, 50000000);

    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      throw new Error('Authentication required to place an order.');
    }
    const normalizedCoupon = order.couponCode
      ? normalizePromoCodeString(order.couponCode)
      : '';

    const orderPayload = stripUndefined({
      orderId: safeOrderId,
      userId: truncateStr(currentUid, 128),
      customerName: truncateStr(order.customerName, 120) || 'Customer',
      phone: truncateStr(order.phone, 30) || '',
      address: truncateStr(order.address, 300) || '',
      district: safeDistrict,
      paymentMethod: safePayment,
      status: 'Pending',
      items: safeItems,
      subtotal: clampNum(order.subtotal, 0, 50000000),
      discount: clampNum(order.discount, 0, 50000000),
      deliveryFee: clampNum(order.deliveryFee, 0, 50000),
      total: safeTotal,
      couponCode: normalizedCoupon || undefined,
      notes: safeNotes || undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const trackingPayload = stripUndefined({
      orderId: safeOrderId,
      status: 'Pending',
      district: safeDistrict,
      paymentMethod: safePayment,
      itemCount: clampNum(itemCount, 1, 500),
      total: safeTotal,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'orders', safeOrderId), orderPayload);
    batch.set(doc(db, 'order_tracking', safeOrderId), trackingPayload);

    if (normalizedCoupon.length >= 3) {
      const uidRedemptionId = `${normalizedCoupon}__u__${currentUid}`;
      const rawEmailLower = auth.currentUser?.email?.trim().toLowerCase() || undefined;
      const canonicalEmail = rawEmailLower
        ? canonicalizeEmailForPromo(rawEmailLower)
        : undefined;

      batch.set(
        doc(db, 'promo_redemptions', uidRedemptionId),
        stripUndefined({
          id: uidRedemptionId,
          code: normalizedCoupon,
          redemptionType: 'uid',
          userId: truncateStr(currentUid, 128),
          emailLower: rawEmailLower ? truncateStr(rawEmailLower, 120) : undefined,
          canonicalEmail: canonicalEmail ? truncateStr(canonicalEmail, 120) : undefined,
          orderId: safeOrderId,
          createdAt: serverTimestamp(),
        })
      );

      if (rawEmailLower && canonicalEmail) {
        const emailRedemptionId = await getEmailRedemptionDocId(normalizedCoupon, rawEmailLower);
        batch.set(doc(db, 'promo_redemptions', emailRedemptionId), {
          id: emailRedemptionId,
          code: normalizedCoupon,
          redemptionType: 'email',
          userId: truncateStr(currentUid, 128),
          emailLower: truncateStr(rawEmailLower, 120),
          canonicalEmail: truncateStr(canonicalEmail, 120),
          orderId: safeOrderId,
          createdAt: serverTimestamp(),
        });
      }
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOrderInFirestore(order: StoredOrder): Promise<void> {
  const path = `orders/${order.orderId}`;
  try {
    const batch = writeBatch(db);
    const orderRef = doc(db, 'orders', order.orderId);
    const trackingRef = doc(db, 'order_tracking', order.orderId);

    const safeDistrict = truncateStr(order.district, 80) || order.district;
    const safePayment = truncateStr(order.paymentMethod, 60) || order.paymentMethod;
    const safeNotes = truncateStr(order.notes, 300);

    const orderPayload = stripUndefined({
      customerName: truncateStr(order.customerName, 120) || order.customerName,
      phone: truncateStr(order.phone, 30) || order.phone,
      address: truncateStr(order.address, 300) || order.address,
      district: safeDistrict,
      paymentMethod: safePayment,
      status: order.status,
      items: order.items.slice(0, 50).map((item) => stripUndefined({ ...item })),
      subtotal: clampNum(order.subtotal, 0, 50000000),
      discount: clampNum(order.discount, 0, 50000000),
      deliveryFee: clampNum(order.deliveryFee, 0, 50000),
      total: clampNum(order.total, 0, 50000000),
      couponCode: truncateStr(order.couponCode, 40) || undefined,
      notes: safeNotes || undefined,
      updatedAt: serverTimestamp(),
    });

    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const trackingSnap = await getDoc(trackingRef);

    batch.update(orderRef, orderPayload);
    if (trackingSnap.exists()) {
      batch.update(
        trackingRef,
        stripUndefined({
          status: order.status,
          district: safeDistrict,
          paymentMethod: safePayment,
          itemCount: clampNum(itemCount, 1, 500),
          total: clampNum(order.total, 0, 50000000),
          courierNote: safeNotes || undefined,
          updatedAt: serverTimestamp(),
        })
      );
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrderInFirestore(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'orders', orderId));
    batch.delete(doc(db, 'order_tracking', orderId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchOrderTracking(orderId: string): Promise<OrderTrackingInfo | null> {
  const cleanId = orderId.trim().replace(/^#/, '');
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(cleanId)) {
    return null;
  }
  const path = `order_tracking/${cleanId}`;
  try {
    const snap = await getDoc(doc(db, 'order_tracking', cleanId));
    if (snap.exists()) {
      return snap.data() as OrderTrackingInfo;
    }
    const upperId = cleanId.toUpperCase();
    if (upperId !== cleanId) {
      const upperSnap = await getDoc(doc(db, 'order_tracking', upperId));
      if (upperSnap.exists()) {
        return upperSnap.data() as OrderTrackingInfo;
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeOrderTracking(
  orderId: string,
  onData: (tracking: OrderTrackingInfo | null) => void,
  onError?: (err: unknown) => void
): () => void {
  const cleanId = orderId.trim().replace(/^#/, '');
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(cleanId)) {
    onData(null);
    return () => {};
  }

  const upperId = cleanId.toUpperCase();
  let unsubFallback: (() => void) | null = null;
  let active = true;

  const primaryPath = `order_tracking/${cleanId}`;
  const unsubPrimary = onSnapshot(
    doc(db, 'order_tracking', cleanId),
    (snapshot) => {
      if (!active) return;
      if (snapshot.exists()) {
        if (unsubFallback) {
          unsubFallback();
          unsubFallback = null;
        }
        onData(snapshot.data() as OrderTrackingInfo);
        return;
      }

      if (upperId !== cleanId && !unsubFallback) {
        const fallbackPath = `order_tracking/${upperId}`;
        unsubFallback = onSnapshot(
          doc(db, 'order_tracking', upperId),
          (fallbackSnap) => {
            if (!active) return;
            onData(fallbackSnap.exists() ? (fallbackSnap.data() as OrderTrackingInfo) : null);
          },
          (error) => {
            if (!active) return;
            if (onError) onError(error);
            else handleFirestoreError(error, OperationType.GET, fallbackPath);
          }
        );
      } else if (upperId === cleanId) {
        onData(null);
      }
    },
    (error) => {
      if (!active) return;
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.GET, primaryPath);
    }
  );

  return () => {
    active = false;
    unsubPrimary();
    if (unsubFallback) unsubFallback();
  };
}

export async function createPriceAlert(params: {
  productId: string;
  productName: string;
  email: string;
  baselinePrice: number;
}): Promise<string> {
  const safeId = `pa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.slice(0, 64);
  const safeProductId = params.productId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64);
  const path = `price_alerts/${safeId}`;
  try {
    const currentUid = auth.currentUser?.uid;
    const payload = stripUndefined({
      id: safeId,
      productId: safeProductId,
      productName: truncateStr(params.productName, 160) || 'Robotics Component',
      email: truncateStr(params.email.toLowerCase(), 120) || '',
      userId: currentUid ? truncateStr(currentUid, 128) : undefined,
      baselinePrice: clampNum(Number(params.baselinePrice) || 0, 0, 5000000),
      status: 'Active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'price_alerts', safeId), payload);
    return safeId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribePriceAlerts(
  onData: (alerts: PriceAlert[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'price_alerts';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as PriceAlert);
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function markPriceAlertNotified(alertId: string, newPrice: number): Promise<void> {
  const path = `price_alerts/${alertId}`;
  try {
    await updateDoc(doc(db, 'price_alerts', alertId), {
      status: 'Notified',
      notifiedPrice: clampNum(Number(newPrice) || 0, 0, 5000000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePriceAlert(alertId: string): Promise<void> {
  const path = `price_alerts/${alertId}`;
  try {
    await deleteDoc(doc(db, 'price_alerts', alertId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createRestockAlert(params: {
  productId: string;
  productName: string;
  email: string;
}): Promise<string> {
  const safeId = `ra-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.slice(0, 64);
  const safeProductId = params.productId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64);
  const path = `restock_alerts/${safeId}`;
  try {
    const currentUid = auth.currentUser?.uid;
    const payload = stripUndefined({
      id: safeId,
      productId: safeProductId,
      productName: truncateStr(params.productName, 160) || 'Robotics Component',
      email: truncateStr(params.email.trim().toLowerCase(), 120) || '',
      userId: currentUid ? truncateStr(currentUid, 128) : undefined,
      status: 'Active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'restock_alerts', safeId), payload);
    return safeId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeRestockAlerts(
  onData: (alerts: RestockAlert[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'restock_alerts';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as RestockAlert);
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function markRestockAlertNotified(alertId: string): Promise<void> {
  const path = `restock_alerts/${alertId}`;
  try {
    await updateDoc(doc(db, 'restock_alerts', alertId), {
      status: 'Notified',
      notifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteRestockAlert(alertId: string): Promise<void> {
  const path = `restock_alerts/${alertId}`;
  try {
    await deleteDoc(doc(db, 'restock_alerts', alertId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function recordVisitorLog(
  entry: Omit<VisitorLog, 'id' | 'createdAt'> & { id?: string }
): Promise<string> {
  const rawId =
    entry.id ||
    `vis-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64);
  const safeSessionId =
    (entry.sessionId || `sid-${Date.now().toString(36)}`)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 64) || `sid-${Date.now().toString(36)}`;
  const path = `visitor_logs/${safeId}`;

  try {
    const currentUid = auth.currentUser?.uid;
    const validLat =
      typeof entry.latitude === 'number' &&
      Number.isFinite(entry.latitude) &&
      entry.latitude >= -90 &&
      entry.latitude <= 90
        ? Number(entry.latitude.toFixed(6))
        : undefined;
    const validLon =
      typeof entry.longitude === 'number' &&
      Number.isFinite(entry.longitude) &&
      entry.longitude >= -180 &&
      entry.longitude <= 180
        ? Number(entry.longitude.toFixed(6))
        : undefined;
    const validOpLat =
      typeof entry.operatorLatitude === 'number' &&
      Number.isFinite(entry.operatorLatitude) &&
      entry.operatorLatitude >= -90 &&
      entry.operatorLatitude <= 90
        ? Number(entry.operatorLatitude.toFixed(6))
        : undefined;
    const validOpLon =
      typeof entry.operatorLongitude === 'number' &&
      Number.isFinite(entry.operatorLongitude) &&
      entry.operatorLongitude >= -180 &&
      entry.operatorLongitude <= 180
        ? Number(entry.operatorLongitude.toFixed(6))
        : undefined;
    const validGpsAccuracy =
      typeof entry.gpsAccuracyMeters === 'number' &&
      Number.isFinite(entry.gpsAccuracyMeters) &&
      entry.gpsAccuracyMeters >= 0 &&
      entry.gpsAccuracyMeters <= 100000
        ? Math.round(entry.gpsAccuracyMeters)
        : undefined;

    const payload = stripUndefined({
      id: safeId,
      sessionId: safeSessionId,
      ip: truncateStr(entry.ip, 64) || 'Unavailable',
      ipType: truncateStr(entry.ipType, 16) || undefined,
      area: truncateStr(entry.area, 160) || 'Location Pending',
      city: truncateStr(entry.city, 100) || undefined,
      region: truncateStr(entry.region, 100) || undefined,
      country: truncateStr(entry.country, 100) || 'Unknown',
      countryCode: truncateStr(entry.countryCode, 8) || undefined,
      postal: truncateStr(entry.postal, 24) || undefined,
      isp: truncateStr(entry.isp, 140) || undefined,
      operatorArea: truncateStr(entry.operatorArea, 160) || undefined,
      operatorLatitude: validOpLat,
      operatorLongitude: validOpLon,
      latitude: validLat,
      longitude: validLon,
      gpsAccuracyMeters: validGpsAccuracy,
      locationAccuracy: entry.locationAccuracy === 'GPS' ? 'GPS' : 'IP',
      timezone: truncateStr(entry.timezone, 80) || undefined,
      localTime: truncateStr(entry.localTime, 80) || undefined,
      platform: entry.platform === 'PWA App' ? 'PWA App' : 'Web',
      deviceType:
        entry.deviceType === 'Mobile' || entry.deviceType === 'Tablet'
          ? entry.deviceType
          : 'Desktop',
      browser: truncateStr(entry.browser, 60) || undefined,
      os: truncateStr(entry.os, 60) || undefined,
      screenSize: truncateStr(entry.screenSize, 32) || undefined,
      pagePath: truncateStr(entry.pagePath, 200) || '/',
      referrer: truncateStr(entry.referrer, 240) || undefined,
      userId: currentUid ? truncateStr(currentUid, 128) : undefined,
      userEmail: currentUid && entry.userEmail ? truncateStr(entry.userEmail, 120) : undefined,
      userName: currentUid && entry.userName ? truncateStr(entry.userName, 120) : undefined,
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'visitor_logs', safeId), payload);
    return safeId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeVisitorLogs(
  onData: (logs: VisitorLog[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'visitor_logs';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(250));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as VisitorLog);
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function deleteVisitorLog(logId: string): Promise<void> {
  const path = `visitor_logs/${logId}`;
  try {
    await deleteDoc(doc(db, 'visitor_logs', logId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearVisitorLogs(logIds: string[]): Promise<void> {
  if (logIds.length === 0) return;
  const path = 'visitor_logs';
  try {
    const chunkSize = 400;
    for (let i = 0; i < logIds.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = logIds.slice(i, i + chunkSize);
      for (const id of chunk) {
        batch.delete(doc(db, 'visitor_logs', id));
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
