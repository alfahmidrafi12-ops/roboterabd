import { deleteApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  ConfirmationResult,
  GoogleAuthProvider,
  RecaptchaVerifier,
  User,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
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
  initializeFirestore,
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
  AdminUser,
  BannerItem,
  CategoryItem,
  CustomerRewardBalance,
  GiftCardReward,
  OrderTrackingInfo,
  PriceAlert,
  Product,
  PromoCode,
  RestockAlert,
  RewardTransaction,
  SiteImagesConfig,
  StoredOrder,
  UserProfile,
  VisitorLog,
} from '../types/store';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
function createFirestoreClient() {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}
export const db = createFirestoreClient();
export const auth = getAuth(app);
auth.useDeviceLanguage();
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Auth local persistence setup fallback:', err);
});
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

export function isPrimaryAdminUser(user: User | null): boolean {
  if (!user) return false;
  return Boolean(user.emailVerified && user.email?.toLowerCase() === ADMIN_EMAIL);
}

export function isVerifiedAdminUser(user: User | null): boolean {
  return isPrimaryAdminUser(user);
}

export function subscribeMyAdminRecord(
  user: User | null,
  onData: (record: AdminUser | null) => void
): () => void {
  if (!user?.uid || !user.email) {
    onData(null);
    return () => {};
  }
  if (isPrimaryAdminUser(user)) {
    onData(null);
    return () => {};
  }
  const safeUid = user.uid.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  return onSnapshot(
    doc(db, 'admins', safeUid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      onData(snapshot.data() as AdminUser);
    },
    (error) => {
      console.warn('Delegated admin check warning:', error);
      onData(null);
    }
  );
}

export function subscribeAdmins(
  onData: (admins: AdminUser[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'admins';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as AdminUser);
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createDelegatedAdminAccess(params: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<{
  uid: string;
  email: string;
  existingAccountReused: boolean;
}> {
  const currentOwner = auth.currentUser;
  if (!isPrimaryAdminUser(currentOwner) || !currentOwner?.email) {
    throw new Error('Only the verified primary store owner can grant admin access.');
  }

  const cleanEmail = params.email.trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }
  if (cleanEmail === ADMIN_EMAIL) {
    throw new Error('The primary owner email already holds full admin access.');
  }
  if (!params.password || params.password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const cleanName = truncateStr(params.displayName?.trim(), 120);
  let targetUid = '';
  let existingAccountReused = false;

  const secondaryAppName = `admin-provisioner-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = initializeAuth(secondaryApp, {
    persistence: inMemoryPersistence,
  });

  try {
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, params.password);
      targetUid = cred.user.uid;
      if (cleanName) {
        await updateProfile(cred.user, { displayName: cleanName }).catch(() => {});
      }
      await sendEmailVerification(cred.user).catch(() => {});
    } catch (authErr) {
      const errCode =
        typeof authErr === 'object' && authErr !== null && 'code' in authErr
          ? String((authErr as { code?: unknown }).code || '')
          : '';
      if (errCode !== 'auth/email-already-in-use') {
        throw authErr;
      }

      existingAccountReused = true;
      try {
        const existingCred = await signInWithEmailAndPassword(
          secondaryAuth,
          cleanEmail,
          params.password
        );
        targetUid = existingCred.user.uid;
      } catch {
        // Account exists (e.g. Google login or different password): look up UID from /users collection
        const directSnap = await getDocs(
          query(collection(db, 'users'), where('email', '==', cleanEmail))
        );
        if (!directSnap.empty) {
          targetUid = directSnap.docs[0].id;
        } else {
          const allUsersSnap = await getDocs(collection(db, 'users'));
          const matchedDoc = allUsersSnap.docs.find((d) => {
            const data = d.data() as UserProfile;
            return data.email?.trim().toLowerCase() === cleanEmail;
          });
          if (matchedDoc) {
            targetUid = matchedDoc.id;
          }
        }
      }

      if (!targetUid) {
        throw new Error(
          'An account with this email already exists with a different sign-in method or password. Ask them to sign in once first or click "Reset Password" after they log in.'
        );
      }
    }
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }

  const safeUid = targetUid.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  const path = `admins/${safeUid}`;
  try {
    const ref = doc(db, 'admins', safeUid);
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      await updateDoc(
        ref,
        stripUndefined({
          displayName: cleanName || (existingSnap.data() as AdminUser).displayName,
          active: true,
          updatedAt: serverTimestamp(),
        })
      );
    } else {
      await setDoc(
        ref,
        stripUndefined({
          uid: safeUid,
          email: cleanEmail,
          displayName: cleanName,
          role: 'admin',
          active: true,
          addedBy: currentOwner.email.toLowerCase(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    }
    return {
      uid: safeUid,
      email: cleanEmail,
      existingAccountReused,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function setDelegatedAdminActive(uid: string, active: boolean): Promise<void> {
  const path = `admins/${uid}`;
  try {
    await updateDoc(doc(db, 'admins', uid), {
      active,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeDelegatedAdmin(uid: string): Promise<void> {
  const path = `admins/${uid}`;
  try {
    await deleteDoc(doc(db, 'admins', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function normalizeBdPhoneToE164(rawPhone: string): string {
  const cleaned = rawPhone.replace(/[\s\-()]/g, '').trim();
  const extraZeroBd = cleaned.match(/^\+?8800(1\d{9})$/);
  if (extraZeroBd) {
    return `+880${extraZeroBd[1]}`;
  }
  if (/^\+[1-9]\d{7,14}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^01\d{9}$/.test(cleaned)) {
    return `+88${cleaned}`;
  }
  if (/^8801\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  if (/^1\d{9}$/.test(cleaned)) {
    return `+880${cleaned}`;
  }
  throw new Error(
    'Enter a valid Bangladesh mobile number (e.g. 017XXXXXXXX or +88017XXXXXXXX).'
  );
}

export function formatPhoneForCheckoutInput(phone?: string | null): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s\-()]/g, '').trim();
  if (/^\+8801\d{9}$/.test(cleaned)) {
    return cleaned.slice(3);
  }
  if (/^8801\d{9}$/.test(cleaned)) {
    return cleaned.slice(2);
  }
  return cleaned;
}

export async function syncUserProfile(
  user: User,
  displayNameOverride?: string
): Promise<void> {
  const safeUid = user.uid.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  if (!safeUid || auth.currentUser?.uid !== user.uid) return;
  const path = `users/${safeUid}`;
  try {
    const ref = doc(db, 'users', safeUid);
    const snap = await getDoc(ref);
    const resolvedName = truncateStr(
      displayNameOverride?.trim() || user.displayName || undefined,
      120
    );
    const resolvedEmail = truncateStr(user.email || undefined, 120);
    const resolvedPhone = truncateStr(user.phoneNumber || undefined, 32);
    const providerId = truncateStr(user.providerData?.[0]?.providerId || 'firebase', 40);

    if (snap.exists()) {
      await updateDoc(
        ref,
        stripUndefined({
          displayName: resolvedName,
          email: resolvedEmail,
          phoneNumber: resolvedPhone,
          providerId,
          emailVerified: Boolean(user.emailVerified || user.phoneNumber),
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    } else {
      await setDoc(
        ref,
        stripUndefined({
          uid: safeUid,
          displayName: resolvedName,
          email: resolvedEmail,
          phoneNumber: resolvedPhone,
          providerId,
          emailVerified: Boolean(user.emailVerified || user.phoneNumber),
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    }
  } catch (error) {
    console.warn(`User profile sync warning (${path}):`, error);
  }
}

export async function signInAdminWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await syncUserProfile(result.user);
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  await syncUserProfile(result.user);
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
  await syncUserProfile(result.user, fullName.trim() || undefined);
  try {
    await sendEmailVerification(result.user);
  } catch (err) {
    console.warn('Email verification could not be sent immediately:', err);
  }
  return result.user;
}

export function createPhoneRecaptchaVerifier(
  containerId: string,
  onExpired?: () => void
): RecaptchaVerifier {
  const host = document.getElementById(containerId);
  if (!host) {
    throw new Error('reCAPTCHA container is not ready. Please close and reopen Sign In.');
  }
  host.innerHTML = '';
  const slot = document.createElement('div');
  slot.id = `${containerId}-slot-${Date.now()}`;
  host.appendChild(slot);

  return new RecaptchaVerifier(auth, slot, {
    size: 'invisible',
    'expired-callback': () => {
      onExpired?.();
    },
  });
}

export async function sendPhoneOtpCode(
  rawPhone: string,
  verifier: RecaptchaVerifier
): Promise<{ confirmationResult: ConfirmationResult; formattedPhone: string }> {
  const e164Phone = normalizeBdPhoneToE164(rawPhone);
  await verifier.render();
  const confirmationResult = await signInWithPhoneNumber(auth, e164Phone, verifier);
  return { confirmationResult, formattedPhone: e164Phone };
}

export async function confirmPhoneOtpCode(
  confirmationResult: ConfirmationResult,
  otpCode: string,
  fullName?: string
): Promise<User> {
  const cleanCode = otpCode.replace(/\D/g, '').trim();
  if (cleanCode.length < 6) {
    throw new Error('Enter the 6-digit OTP verification code sent to your mobile.');
  }
  const result = await confirmationResult.confirm(cleanCode);
  const trimmedName = fullName?.trim();
  if (trimmedName && !result.user.displayName) {
    await updateProfile(result.user, { displayName: trimmedName });
  }
  await syncUserProfile(result.user, trimmedName || undefined);
  return result.user;
}

export async function updateUserDisplayName(fullName: string): Promise<void> {
  if (!auth.currentUser) return;
  const trimmed = fullName.trim();
  if (!trimmed) return;
  await updateProfile(auth.currentUser, { displayName: trimmed });
  await syncUserProfile(auth.currentUser, trimmed);
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
      list.sort((a, b) => {
        const ao = typeof a.displayOrder === 'number' ? a.displayOrder : Number.MAX_SAFE_INTEGER;
        const bo = typeof b.displayOrder === 'number' ? b.displayOrder : Number.MAX_SAFE_INTEGER;
        if (ao !== bo) return ao - bo;
        return 0;
      });
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
    const parsedDisplayOrder =
      product.displayOrder !== undefined &&
      product.displayOrder !== null &&
      String(product.displayOrder).trim() !== '' &&
      Number.isFinite(Number(product.displayOrder))
        ? clampNum(Math.round(Number(product.displayOrder)), 0, 100000)
        : undefined;

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
      displayOrder: parsedDisplayOrder,
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

export interface CreateOrderExtras {
  earnedGiftCard?: GiftCardReward | null;
  redeemedGiftCardCode?: string;
}

export async function createOrderInFirestore(
  order: Omit<StoredOrder, 'createdAt' | 'updatedAt'>,
  extras?: CreateOrderExtras
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
    const safeSubtotal = clampNum(order.subtotal, 0, 50000000);
    const safeDiscount = clampNum(order.discount, 0, 50000000);
    const safeDelivery = clampNum(order.deliveryFee, 0, 50000);
    const safeTotal = clampNum(order.total, 0, 50000000);

    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      throw new Error('Authentication required to place an order.');
    }
    const normalizedCoupon = order.couponCode
      ? normalizePromoCodeString(order.couponCode)
      : '';

    const rawRedeemPts = Math.max(0, Math.round(Number(order.rewardPointsRedeemed) || 0));
    const rewardPtsToRedeem =
      rawRedeemPts >= MIN_REWARD_REDEEM_POINTS && rawRedeemPts % 100 === 0
        ? rawRedeemPts
        : 0;
    const rewardDiscountValue =
      rewardPtsToRedeem > 0 ? Math.round((rewardPtsToRedeem / 100) * REWARD_BDT_PER_100_POINTS) : 0;

    if (rewardPtsToRedeem > 0) {
      if (rewardDiscountValue > safeSubtotal) {
        throw new Error('Reward discount cannot exceed product subtotal.');
      }
      const balRef = doc(db, 'customer_reward_balances', currentUid);
      const balSnap = await getDoc(balRef);
      if (!balSnap.exists()) {
        throw new Error('No reward balance wallet found for your account.');
      }
      const balData = balSnap.data() as CustomerRewardBalance;
      const currentAvail = Math.max(0, Number(balData.availablePoints) || 0);
      const currentRedeemed = Math.max(0, Number(balData.lifetimeRedeemed) || 0);
      if (currentAvail < rewardPtsToRedeem) {
        throw new Error(
          `Insufficient reward points. Available: ${currentAvail}, requested: ${rewardPtsToRedeem}.`
        );
      }
      batch.update(balRef, {
        availablePoints: currentAvail - rewardPtsToRedeem,
        lifetimeRedeemed: currentRedeemed + rewardPtsToRedeem,
        updatedAt: serverTimestamp(),
      });

      const redeemTxId = `redeem_${safeOrderId}`;
      batch.set(doc(db, 'reward_transactions', redeemTxId), {
        id: redeemTxId,
        userId: truncateStr(currentUid, 128),
        orderId: safeOrderId,
        transactionType: 'redeemed',
        points: rewardPtsToRedeem,
        status: 'Redeemed',
        description: `Redeemed ${rewardPtsToRedeem} Reward Points for ৳${rewardDiscountValue} discount on Order #${safeOrderId}`,
        createdAt: serverTimestamp(),
      });
    }

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
      subtotal: safeSubtotal,
      discount: safeDiscount,
      deliveryFee: safeDelivery,
      total: safeTotal,
      couponCode: normalizedCoupon || undefined,
      rewardPointsRedeemed: rewardPtsToRedeem > 0 ? rewardPtsToRedeem : undefined,
      rewardDiscount: rewardDiscountValue > 0 ? rewardDiscountValue : undefined,
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

    if (extras?.redeemedGiftCardCode) {
      const cleanGiftCode = extras.redeemedGiftCardCode
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, '')
        .slice(0, 32);
      if (cleanGiftCode) {
        const giftRef = doc(db, 'gift_cards', cleanGiftCode);
        const giftSnap = await getDoc(giftRef);
        if (giftSnap.exists()) {
          const giftData = giftSnap.data() as GiftCardReward;
          if (giftData.userId === currentUid && !giftData.redeemed) {
            batch.update(giftRef, {
              redeemed: true,
              redeemedOrderId: safeOrderId,
              redeemedAt: new Date().toLocaleString('en-BD', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
            });
          }
        }
      }
    }

    if (extras?.earnedGiftCard && safeSubtotal - safeDiscount >= 500) {
      const cardCode = extras.earnedGiftCard.code
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, '')
        .slice(0, 32);
      if (cardCode.length >= 4 && extras.earnedGiftCard.value > 0) {
        batch.set(doc(db, 'gift_cards', cardCode), {
          code: cardCode,
          userId: truncateStr(currentUid, 128),
          value: clampNum(Math.round(extras.earnedGiftCard.value), 1, 150000),
          orderId: safeOrderId,
          recipientName: truncateStr(extras.earnedGiftCard.recipientName, 120) || 'Customer',
          issuedAt: truncateStr(extras.earnedGiftCard.issuedAt, 60) || 'Today',
          tierLabel: truncateStr(extras.earnedGiftCard.tierLabel, 80) || 'Hardware Gift Credit',
          redeemed: false,
          createdAt: serverTimestamp(),
        });
      }
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export const MIN_ORDER_FOR_REWARD_BDT = 1000;
export const REWARD_POINTS_PER_1000_BDT = 100;
export const REWARD_BDT_PER_100_POINTS = 8;
export const MIN_REWARD_REDEEM_POINTS = 100;
export const CONVERSION_POINTS_PER_BDT = 12.5; // 100 pts = ৳8

export function calculateRewardValueBdt(points: number): number {
  const safePts = Math.max(0, Number(points) || 0);
  return Number(((safePts * REWARD_BDT_PER_100_POINTS) / 100).toFixed(2));
}

export function getRewardTierName(lifetimeEarned: number): string {
  if (lifetimeEarned >= 10000) return 'Autonomous Pioneer';
  if (lifetimeEarned >= 5000) return 'Robotics Pro';
  if (lifetimeEarned >= 1000) return 'Lab Builder';
  return 'Circuit Starter';
}

export function calculateOrderRewardPoints(
  order: Pick<StoredOrder, 'items' | 'subtotal' | 'discount'>
): number {
  const subtotal = Math.max(0, Number(order.subtotal) || 0);
  if (subtotal <= 0 || !Array.isArray(order.items) || order.items.length === 0) return 0;
  const eligibleSubtotal = Math.max(0, subtotal - Math.max(0, Number(order.discount) || 0));
  if (eligibleSubtotal < MIN_ORDER_FOR_REWARD_BDT) return 0;

  return Math.max(0, Math.floor((eligibleSubtotal * REWARD_POINTS_PER_1000_BDT) / 1000));
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

    // Sync customer reward points & ledger transaction atomically on Admin status updates
    if (order.userId && /^[a-zA-Z0-9_-]{1,128}$/.test(order.userId)) {
      const safeUid = order.userId;
      const safeEarnTxId = `earn_${order.orderId}`.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
      const safeRestoreTxId = `restore_${order.orderId}`
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .slice(0, 120);
      const balRef = doc(db, 'customer_reward_balances', safeUid);
      const earnTxRef = doc(db, 'reward_transactions', safeEarnTxId);
      const restoreTxRef = doc(db, 'reward_transactions', safeRestoreTxId);

      const [balSnap, earnTxSnap, restoreTxSnap] = await Promise.all([
        getDoc(balRef),
        getDoc(earnTxRef),
        getDoc(restoreTxRef),
      ]);
      const existingBal = balSnap.exists()
        ? (balSnap.data() as CustomerRewardBalance)
        : null;
      const existingEarnTx = earnTxSnap.exists()
        ? (earnTxSnap.data() as RewardTransaction)
        : null;
      const existingRestoreTx = restoreTxSnap.exists()
        ? (restoreTxSnap.data() as RewardTransaction)
        : null;

      const computedPts = calculateOrderRewardPoints(order);
      let nextAvail = Math.max(0, existingBal?.availablePoints ?? 0);
      let nextPending = Math.max(0, existingBal?.pendingPoints ?? 0);
      let nextEarned = Math.max(0, existingBal?.lifetimeEarned ?? 0);
      let nextRedeemed = Math.max(0, existingBal?.lifetimeRedeemed ?? 0);
      let shouldUpdateBalance = false;

      if ((order.status === 'Confirmed' || order.status === 'Shipped') && computedPts > 0) {
        if (!existingEarnTx) {
          nextPending += computedPts;
          shouldUpdateBalance = true;
          batch.set(earnTxRef, {
            id: safeEarnTxId,
            userId: safeUid,
            orderId: order.orderId,
            transactionType: 'earned',
            points: computedPts,
            status: 'Pending',
            description: `Pending reward points for Order #${order.orderId} (${order.status})`,
            createdAt: serverTimestamp(),
          });
        }
      } else if (order.status === 'Delivered') {
        if (!existingEarnTx && computedPts > 0) {
          nextAvail += computedPts;
          nextEarned += computedPts;
          shouldUpdateBalance = true;
          batch.set(earnTxRef, {
            id: safeEarnTxId,
            userId: safeUid,
            orderId: order.orderId,
            transactionType: 'earned',
            points: computedPts,
            status: 'Earned',
            description: `Earned ${computedPts} Reward Points from delivered Order #${order.orderId}`,
            createdAt: serverTimestamp(),
          });
        } else if (existingEarnTx && existingEarnTx.status === 'Pending') {
          const creditPts = Math.max(0, existingEarnTx.points);
          nextPending = Math.max(0, nextPending - creditPts);
          nextAvail += creditPts;
          nextEarned += creditPts;
          shouldUpdateBalance = true;
          batch.update(earnTxRef, {
            status: 'Earned',
            description: `Credited ${creditPts} Reward Points after delivery of Order #${order.orderId}`,
          });
        }
      } else if (order.status === 'Cancelled') {
        if (existingEarnTx) {
          const txPts = Math.max(0, existingEarnTx.points);
          if (existingEarnTx.status === 'Pending') {
            nextPending = Math.max(0, nextPending - txPts);
            shouldUpdateBalance = true;
            batch.update(earnTxRef, {
              transactionType: 'reversed',
              status: 'Reversed',
              description: `Pending reward points cancelled for Order #${order.orderId}`,
            });
          } else if (existingEarnTx.status === 'Earned') {
            nextAvail = Math.max(0, nextAvail - txPts);
            nextEarned = Math.max(0, nextEarned - txPts);
            shouldUpdateBalance = true;
            batch.update(earnTxRef, {
              transactionType: 'reversed',
              status: 'Reversed',
              description: `Reversed ${txPts} Reward Points due to cancellation of Order #${order.orderId}`,
            });
          }
        }

        const redeemedToRestore = Math.max(0, Math.round(Number(order.rewardPointsRedeemed) || 0));
        if (redeemedToRestore > 0 && !existingRestoreTx) {
          nextAvail += redeemedToRestore;
          nextRedeemed = Math.max(0, nextRedeemed - redeemedToRestore);
          shouldUpdateBalance = true;
          batch.set(restoreTxRef, {
            id: safeRestoreTxId,
            userId: safeUid,
            orderId: order.orderId,
            transactionType: 'reversed',
            points: redeemedToRestore,
            status: 'Reversed',
            description: `Restored ${redeemedToRestore} redeemed Reward Points after cancellation of Order #${order.orderId}`,
            createdAt: serverTimestamp(),
          });
        }
      }

      if (shouldUpdateBalance) {
        if (balSnap.exists()) {
          batch.update(balRef, {
            availablePoints: nextAvail,
            pendingPoints: nextPending,
            lifetimeEarned: nextEarned,
            lifetimeRedeemed: nextRedeemed,
            conversionPointsPerBdt: CONVERSION_POINTS_PER_BDT,
            tierName: getRewardTierName(nextEarned),
            updatedAt: serverTimestamp(),
          });
        } else {
          batch.set(balRef, {
            userId: safeUid,
            availablePoints: nextAvail,
            pendingPoints: nextPending,
            lifetimeEarned: nextEarned,
            lifetimeRedeemed: nextRedeemed,
            conversionPointsPerBdt: CONVERSION_POINTS_PER_BDT,
            tierName: getRewardTierName(nextEarned),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
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
      userPhone: currentUid && entry.userPhone ? truncateStr(entry.userPhone, 40) : undefined,
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

export function subscribeUserGiftCards(
  userId: string,
  onData: (cards: GiftCardReward[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const safeUid = userId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  const path = 'gift_cards';
  const q = query(collection(db, path), where('userId', '==', safeUid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as GiftCardReward);
      list.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function ensureCustomerRewardBalance(userId: string): Promise<void> {
  const safeUid = userId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  if (!safeUid || auth.currentUser?.uid !== safeUid) return;
  const path = `customer_reward_balances/${safeUid}`;
  try {
    const ref = doc(db, 'customer_reward_balances', safeUid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        userId: safeUid,
        availablePoints: 0,
        pendingPoints: 0,
        lifetimeEarned: 0,
        lifetimeRedeemed: 0,
        conversionPointsPerBdt: CONVERSION_POINTS_PER_BDT,
        tierName: 'Circuit Starter',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.warn('Reward wallet bootstrap skipped:', error);
  }
}

export function subscribeCustomerRewardBalance(
  userId: string,
  onData: (balance: CustomerRewardBalance | null) => void,
  onError?: (err: unknown) => void
): () => void {
  const safeUid = userId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  const path = `customer_reward_balances/${safeUid}`;
  return onSnapshot(
    doc(db, 'customer_reward_balances', safeUid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      onData(snapshot.data() as CustomerRewardBalance);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeCustomerRewardTransactions(
  userId: string,
  onData: (txs: RewardTransaction[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const safeUid = userId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  const path = 'reward_transactions';
  const q = query(collection(db, path), where('userId', '==', safeUid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as RewardTransaction);
      list.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
