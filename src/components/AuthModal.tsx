import React, { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Gift,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  Truck,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  ADMIN_EMAIL,
  isPrimaryAdminUser,
  resendVerificationEmail,
  resetUserPassword,
  signInAdminWithGoogle,
  signInWithEmail,
  signOutAdmin,
  signUpWithEmail,
  subscribeMyAdminRecord,
  subscribeUserOrders,
} from '../lib/firebase';
import { downloadGiftCardPng } from '../lib/giftCard';
import {
  buildOrderReceiptPdf,
  storedOrderToReceipt,
  triggerPdfDownload,
} from '../lib/receiptPdf';
import { playErrorSound, playTapSound, playVoucherCopySound } from '../lib/sound';
import { AdminUser, GiftCardReward, OrderStatus, Product, StoredOrder } from '../types/store';
import { DigitalGiftCard } from './DigitalGiftCard';
import { RewardDashboard } from './RewardDashboard';
import { BrandLogo } from './BrandLogo';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthModalProps {
  isOpen: boolean;
  user: User | null;
  giftCards?: GiftCardReward[];
  products?: Product[];
  onClose: () => void;
  onOpenAdmin: () => void;
  onTrackOrder?: (orderId: string) => void;
}

const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  Pending: 'bg-amber-100 text-amber-900 border-amber-300',
  Confirmed: 'bg-blue-100 text-[#071A3B] border-blue-300',
  Shipped: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  Delivered: 'bg-teal-100 text-[#0F766E] border-teal-300',
  Cancelled: 'bg-red-100 text-red-800 border-red-300',
};

function formatOrderDate(ts: unknown): string {
  if (!ts) return 'Processing date...';
  if (typeof ts === 'object' && ts !== null) {
    if ('toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
      return (ts as { toDate: () => Date }).toDate().toLocaleString('en-BD', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
    }
    if ('seconds' in ts && typeof (ts as { seconds: number }).seconds === 'number') {
      return new Date((ts as { seconds: number }).seconds * 1000).toLocaleString('en-BD', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
    }
  }
  return 'Recent order';
}

export function formatAuthErrorMessage(err: unknown): string {
  const rawCode =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code || '')
      : '';
  const msg = `${rawCode} ${err instanceof Error ? err.message : String(err)}`;
  const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
  const projectId = firebaseConfig.projectId || 'your Firebase project';

  if (msg.includes('auth/unauthorized-domain')) {
    return `Domain "${host}" is not authorized yet. In Firebase Console (${projectId}) → Authentication → Settings → Authorized domains, add "${host}".`;
  }
  if (msg.includes('auth/popup-blocked')) {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
  }
  if (msg.includes('auth/popup-closed-by-user') || msg.includes('auth/cancelled-popup-request')) {
    return 'Google sign-in popup was closed before finishing. Please try again.';
  }
  if (msg.includes('auth/network-request-failed')) {
    return 'Network error while connecting to authentication service. Check your connection and try again.';
  }
  if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (msg.includes('auth/user-not-found')) {
    return 'No account found with this email. Switch to Create Account to register.';
  }
  if (msg.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (msg.includes('auth/weak-password')) {
    return 'Password should be at least 6 characters.';
  }
  if (msg.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (msg.includes('auth/too-many-requests')) {
    return 'Too many login attempts. Please wait a few minutes and try again.';
  }
  return err instanceof Error ? err.message : String(err);
}

function getUserInitials(user: User): string {
  const source =
    user.displayName?.trim() ||
    user.email?.split('@')[0] ||
    user.phoneNumber?.replace(/\D/g, '').slice(-2) ||
    'RB';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  user,
  giftCards,
  products = [],
  onClose,
  onOpenAdmin,
  onTrackOrder,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [profileTab, setProfileTab] = useState<'account' | 'rewards' | 'orders' | 'gifts'>('account');
  const [localGiftCards, setLocalGiftCards] = useState<GiftCardReward[]>(() =>
    user ? (giftCards ?? []) : []
  );
  const [copiedGiftCode, setCopiedGiftCode] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const copiedGiftTimerRef = useRef<number | null>(null);

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsExpanded, setTermsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Order History state for signed-in user
  const [userOrders, setUserOrders] = useState<StoredOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [ordersReloadKey, setOrdersReloadKey] = useState(0);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);
  const [myAdminRecord, setMyAdminRecord] = useState<AdminUser | null>(null);

  useEffect(() => {
    return () => {
      if (copiedGiftTimerRef.current) window.clearTimeout(copiedGiftTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setLocalGiftCards([]);
      return;
    }
    setLocalGiftCards(giftCards ?? []);
  }, [isOpen, giftCards, user?.uid]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !user?.uid) {
      setUserOrders([]);
      setOrdersLoading(false);
      setOrdersError('');
      return;
    }

    setOrdersLoading(true);
    setOrdersError('');

    const unsub = subscribeUserOrders(
      user.uid,
      (orders) => {
        setUserOrders(orders);
        setOrdersLoading(false);
      },
      (err) => {
        console.error('Failed to fetch user order history:', err);
        setOrdersError('Unable to load your order history right now. Please try again.');
        setOrdersLoading(false);
      }
    );

    return () => unsub();
  }, [isOpen, user?.uid, ordersReloadKey]);

  useEffect(() => {
    if (!isOpen || !user?.uid || isPrimaryAdminUser(user)) {
      setMyAdminRecord(null);
      return;
    }
    return subscribeMyAdminRecord(user, setMyAdminRecord);
  }, [isOpen, user?.uid, user?.email]);

  if (!isOpen) return null;

  const isAdmin =
    isPrimaryAdminUser(user) ||
    Boolean(
      user?.email &&
        myAdminRecord?.active === true &&
        myAdminRecord.email.toLowerCase() === user.email.toLowerCase()
    );
  const activeGiftCardsCount = localGiftCards.filter((c) => !c.redeemed).length;

  const handleCopyGiftCode = (code: string) => {
    playVoucherCopySound();
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedGiftCode(code);
    if (copiedGiftTimerRef.current) window.clearTimeout(copiedGiftTimerRef.current);
    copiedGiftTimerRef.current = window.setTimeout(() => setCopiedGiftCode(null), 1800);
  };

  const handleDownloadOrderPdf = async (order: StoredOrder) => {
    playTapSound();
    setDownloadingReceiptId(order.orderId);
    try {
      const receiptModel = storedOrderToReceipt(order, products);
      const { blob, filename } = await buildOrderReceiptPdf(receiptModel);
      triggerPdfDownload(blob, filename);
    } catch (pdfErr) {
      console.error('Failed to build A4 PDF receipt:', pdfErr);
      playErrorSound();
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (mode === 'signup' && !agreedToTerms) {
      playErrorSound();
      setError(
        'Please read and agree to the Terms & Policies (including GPS, location, and telemetry permissions) before creating an account.'
      );
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
        setPassword('');
      } else if (mode === 'signup') {
        await signUpWithEmail(fullName, email, password);
        setPassword('');
        setInfo('Account created! A verification link has been sent to your email.');
      } else {
        await resetUserPassword(email);
        setInfo('Password reset link sent to your email address.');
      }
    } catch (err) {
      setError(formatAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setInfo('');
    if (mode === 'signup' && !agreedToTerms) {
      playErrorSound();
      setError(
        'Please agree to the Terms & Policies (including GPS, location, and telemetry permissions) before creating an account with Google.'
      );
      return;
    }
    setLoading(true);
    try {
      await signInAdminWithGoogle();
    } catch (err) {
      setError(formatAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setInfo('');
    try {
      await resendVerificationEmail();
      setInfo('Verification email sent. Check your inbox and refresh after confirming.');
    } catch (err) {
      setError(formatAuthErrorMessage(err));
    }
  };

  const switchMode = (nextMode: 'login' | 'signup' | 'reset') => {
    playTapSound();
    setMode(nextMode);
    setError('');
    setInfo('');
    setShowPassword(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div
        className="animate-fade-in fixed inset-0 bg-[#040D1E]/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {user ? (
        /* ================= SIGNED-IN MEMBER PORTAL ================= */
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Your Robotera BD Account"
          className="animate-pop-in relative z-10 w-full max-w-xl max-h-[92dvh] bg-white rounded-2xl border border-slate-300/90 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Deep Navy Member Header */}
          <div className="relative overflow-hidden px-6 py-5 bg-[#071A3B] bg-gradient-to-r from-[#06142E] via-[#071A3B] to-[#0C2B5E] text-white shrink-0">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-70" />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Member avatar'}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-xl border border-white/25 object-cover shrink-0 bg-[#0A224B]"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[#0866F5] border border-white/25 flex items-center justify-center font-display text-sm font-bold text-white shrink-0">
                    {getUserInitials(user)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2DD4BF]">
                    Robotera BD Member
                  </p>
                  <h2 className="font-display text-lg font-bold text-white truncate">
                    {user.displayName || (user.phoneNumber ? 'Verified Mobile Member' : 'Engineering Account')}
                  </h2>
                  <p className="font-mono text-xs text-slate-300 truncate">
                    {[user.email, user.phoneNumber].filter(Boolean).join(' · ') || 'Signed-in Member'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close account dialog"
                className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.14] border border-white/15 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Profile / Rewards / Order History / Digital Gift Cards Tabs */}
          <div className="px-6 py-3 bg-[#EDF2F8] border-b border-slate-300/80 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-white rounded-xl border border-slate-300/85">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setProfileTab('account');
                }}
                className={`motion-press py-2 px-2 sm:px-3 rounded-lg border text-[11px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  profileTab === 'account'
                    ? 'bg-[#071A3B] border-[#071A3B] text-white'
                    : 'border-transparent text-[#334155] hover:text-[#071A3B] hover:bg-[#EDF2F8]'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Profile</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setProfileTab('rewards');
                }}
                className={`motion-press py-2 px-2 sm:px-3 rounded-lg border text-[11px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  profileTab === 'rewards'
                    ? 'bg-[#071A3B] border-[#071A3B] text-white'
                    : 'border-transparent text-[#334155] hover:text-[#071A3B] hover:bg-[#EDF2F8]'
                }`}
              >
                <Award className="w-3.5 h-3.5 shrink-0 text-[#087BFF]" />
                <span className="truncate">Rewards</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setProfileTab('orders');
                }}
                className={`motion-press py-2 px-2 sm:px-3 rounded-lg border text-[11px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  profileTab === 'orders'
                    ? 'bg-[#071A3B] border-[#071A3B] text-white'
                    : 'border-transparent text-[#334155] hover:text-[#071A3B] hover:bg-[#EDF2F8]'
                }`}
              >
                <Package className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Orders</span>
                {userOrders.length > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums ${
                      profileTab === 'orders'
                        ? 'bg-[#0866F5] text-white'
                        : 'bg-[#EDF2F8] text-[#0866F5]'
                    }`}
                  >
                    {userOrders.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setProfileTab('gifts');
                }}
                className={`motion-press py-2 px-2 sm:px-3 rounded-lg border text-[11px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  profileTab === 'gifts'
                    ? 'bg-[#071A3B] border-[#071A3B] text-white'
                    : 'border-transparent text-[#334155] hover:text-[#071A3B] hover:bg-[#EDF2F8]'
                }`}
              >
                <Gift className="w-3.5 h-3.5 shrink-0 text-[#087BFF]" />
                <span className="truncate">Gift Cards</span>
                {activeGiftCardsCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums ${
                      profileTab === 'gifts'
                        ? 'bg-[#00CFFF] text-[#071A3B] font-bold'
                        : 'bg-sky-100 text-[#0866F5] font-bold'
                    }`}
                  >
                    {activeGiftCardsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {profileTab === 'account' ? (
              <div className="space-y-4 animate-tab-enter">
                <div className="bg-[#EDF2F8] rounded-2xl border border-slate-300/85 p-4 sm:p-5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#475569]">
                      Verification Status
                    </span>
                    {user.emailVerified || user.phoneNumber ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {user.phoneNumber && !user.email
                          ? 'Verified Mobile Account'
                          : 'Verified Account'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C2410C]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Pending Verification
                      </span>
                    )}
                  </div>
                  {Boolean(user.email && !user.emailVerified) && (
                    <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-slate-300/70">
                      <p className="text-xs text-[#334155]">
                        Verify your inbox link to secure checkout and welcome benefits.
                      </p>
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#071A3B] hover:text-white border border-slate-300 hover:border-[#071A3B] text-[#071A3B] text-xs font-semibold transition-colors shrink-0"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Resend Link</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setProfileTab('rewards');
                  }}
                  className="motion-card motion-press group w-full p-4 rounded-2xl border border-slate-300/85 hover:border-[#0866F5] bg-gradient-to-r from-[#071A3B] to-[#0B2D63] text-white flex items-center justify-between gap-3 transition-all hover:shadow-[0_10px_24px_-12px_rgba(8,102,245,0.45)] text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#00CFFF]/15 border border-[#00CFFF]/35 text-[#00CFFF] flex items-center justify-center shrink-0">
                      <Award className="motion-icon-tilt w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold text-white">
                        Robotera Loyalty &amp; Reward Points
                      </p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        View available BDT value, pending points &amp; milestone progress
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#00CFFF] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setProfileTab('orders');
                  }}
                  className="motion-card motion-press group w-full p-4 rounded-2xl border border-slate-300/85 hover:border-[#0866F5] bg-white hover:bg-[#EDF2F8]/60 flex items-center justify-between gap-3 transition-colors text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#EDF2F8] border border-slate-300/80 text-[#0866F5] flex items-center justify-center shrink-0">
                      <Package className="motion-icon-tilt w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold text-[#071A3B]">
                        View Order History
                      </p>
                      <p className="text-xs text-[#475569] mt-0.5">
                        {ordersLoading
                          ? 'Checking past purchases...'
                          : `${userOrders.length} ${userOrders.length === 1 ? 'order' : 'orders'} synced to your account`}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#0866F5] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>

                {info && (
                  <p className="text-xs text-[#0F766E] bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{info}</span>
                  </p>
                )}
                {error && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </p>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdmin();
                    }}
                    className="motion-press cta-sheen group w-full h-11 rounded-xl bg-[#0866F5] hover:bg-[#0654CC] border border-[#0866F5] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShieldCheck className="motion-icon-tilt w-4 h-4" />
                    <span>Open Admin Console</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => signOutAdmin()}
                  className="motion-press group w-full h-11 rounded-xl bg-[#EDF2F8] hover:bg-[#071A3B] border border-slate-300 hover:border-[#071A3B] text-[#071A3B] hover:text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="motion-icon-tilt w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : profileTab === 'rewards' ? (
              <RewardDashboard user={user} />
            ) : profileTab === 'orders' ? (
              <div className="space-y-4 animate-tab-enter">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#071A3B]">
                      Past Purchases
                    </h3>
                    <p className="text-[11px] text-[#475569]">
                      Synced live for {user.email || user.phoneNumber || 'your account'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrdersReloadKey((k) => k + 1)}
                    disabled={ordersLoading}
                    className="motion-press h-9 px-3 rounded-xl border border-slate-300 bg-[#EDF2F8] hover:bg-[#071A3B] hover:text-white hover:border-[#071A3B] text-[#071A3B] text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {ordersError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <p>{ordersError}</p>
                      <button
                        type="button"
                        onClick={() => setOrdersReloadKey((k) => k + 1)}
                        className="font-semibold underline hover:no-underline"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                )}

                {ordersLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-6 h-6 text-[#0866F5] animate-spin mb-2.5" />
                    <p className="text-xs font-medium text-[#475569]">
                      Loading your order history...
                    </p>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="py-10 px-4 bg-[#EDF2F8] rounded-2xl border border-slate-300/85 text-center space-y-2.5">
                    <div className="w-11 h-11 mx-auto rounded-xl bg-white border border-slate-300 flex items-center justify-center text-[#475569]">
                      <Package className="w-5 h-5" />
                    </div>
                    <p className="font-display text-sm font-bold text-[#071A3B]">
                      No orders found yet
                    </p>
                    <p className="text-xs text-[#475569] max-w-xs mx-auto leading-relaxed">
                      Purchases completed while signed in to this account are automatically saved
                      here with live dispatch status.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userOrders.map((order, orderIdx) => {
                      const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
                      return (
                        <div
                          key={order.orderId}
                          style={{ animationDelay: `${Math.min(orderIdx, 8) * 45}ms` }}
                          className="animate-cart-enter motion-card rounded-2xl border border-slate-300/85 bg-white p-4 space-y-3 hover:border-[#0866F5] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-mono text-xs font-bold text-[#0866F5] truncate">
                                #{order.orderId}
                              </p>
                              <p className="text-[11px] text-[#475569] inline-flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>{formatOrderDate(order.createdAt)}</span>
                              </p>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-md border text-[11px] font-semibold shrink-0 ${
                                ORDER_STATUS_BADGE[order.status] || ORDER_STATUS_BADGE.Pending
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <div className="bg-[#EDF2F8] rounded-xl p-2.5 space-y-1 text-xs text-[#0F172A] border border-slate-300/70">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <div
                                key={`${order.orderId}-${item.productId}-${idx}`}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="truncate">
                                  {item.quantity}× {item.name}
                                  {item.variant ? ` (${item.variant})` : ''}
                                </span>
                                <span className="font-mono tabular-nums text-[#334155] shrink-0">
                                  ৳{(item.price * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-[11px] text-[#475569] pt-0.5">
                                + {order.items.length - 3} more{' '}
                                {order.items.length - 3 === 1 ? 'item' : 'items'}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1.5 border-t border-slate-200">
                            <div className="text-[11px] text-[#475569]">
                              <span>
                                {itemCount} {itemCount === 1 ? 'unit' : 'units'} · {order.district}
                              </span>
                              <span className="mx-1">·</span>
                              <span>{order.paymentMethod}</span>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              {(order.rewardPointsRedeemed ?? 0) > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 font-mono text-[10px] font-bold text-[#0866F5] tabular-nums">
                                  -{order.rewardPointsRedeemed} pts (-৳{order.rewardDiscount ?? 0})
                                </span>
                              )}
                              <span className="font-mono text-sm font-bold text-[#071A3B] tabular-nums">
                                ৳{order.total.toLocaleString()}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDownloadOrderPdf(order)}
                                disabled={downloadingReceiptId === order.orderId}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-300 bg-[#F8FAFC] hover:bg-white hover:border-[#0866F5] text-[11px] font-semibold text-[#071A3B] disabled:opacity-50 transition-colors"
                              >
                                {downloadingReceiptId === order.orderId ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-[#0866F5]" />
                                ) : (
                                  <Download className="w-3 h-3 text-[#0866F5]" />
                                )}
                                <span>A4 PDF</span>
                              </button>
                              {onTrackOrder && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onTrackOrder(order.orderId);
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0866F5] hover:underline"
                                >
                                  <span>Track</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 animate-tab-enter">
                <div>
                  <h3 className="font-display text-sm font-bold text-[#071A3B]">
                    Digital Hardware Gift Cards
                  </h3>
                  <p className="text-[11px] text-[#475569] mt-0.5">
                    Orders of ৳500+ award a gift card worth ৳3 per ৳100 spent, redeemable in your cart.
                  </p>
                </div>

                {localGiftCards.length === 0 ? (
                  <div className="py-10 px-4 bg-[#EDF2F8] rounded-2xl border border-slate-300/85 text-center space-y-2.5">
                    <div className="w-11 h-11 mx-auto rounded-xl bg-white border border-slate-300 flex items-center justify-center text-[#087BFF]">
                      <Gift className="w-5 h-5" />
                    </div>
                    <p className="font-display text-sm font-bold text-[#071A3B]">
                      No gift cards earned yet
                    </p>
                    <p className="text-xs text-[#475569] max-w-xs mx-auto leading-relaxed">
                      Place orders of ৳500 or more on Robotera BD to unlock a downloadable
                      holographic digital gift card worth ৳3 per ৳100 spent.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {localGiftCards.map((card) => (
                      <DigitalGiftCard
                        key={card.code}
                        card={card}
                        copied={copiedGiftCode === card.code}
                        onCopy={handleCopyGiftCode}
                        onDownload={downloadGiftCardPng}
                        variant="vault"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= CLEAN ARCHITECTURAL LOGIN / SIGNUP PORTAL ================= */
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Account Sign In"
          className="animate-auth-modal relative z-10 w-full max-w-[52rem] max-h-[92dvh] bg-white rounded-2xl border border-slate-200/90 shadow-[0_28px_64px_-16px_rgba(3,10,24,0.48)] overflow-hidden flex flex-col md:flex-row font-sans"
        >
          {/* Left Architectural Navy Wing (Desktop & Tablet) */}
          <div className="hidden md:flex md:w-[40%] relative overflow-hidden bg-[#06142E] bg-gradient-to-b from-[#06142E] via-[#071A3D] to-[#0B285C] text-white p-8 flex-col justify-between shrink-0 border-r border-white/10">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-45" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(8,123,255,0.28)_0%,transparent_70%)]"
            />

            <div className="relative z-10 space-y-7">
              {/* Brand Lockup */}
              <div className="flex items-center gap-2.5 animate-form-stagger">
                <BrandLogo
                  size="sm"
                  className="border-white/25 shadow-[0_6px_16px_-4px_rgba(8,123,255,0.45)]"
                />
                <span className="font-display text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>ROBOTERA</span>
                  <span className="bg-white/15 text-[#7DD3FC] text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                    BD
                  </span>
                </span>
              </div>

              {/* Crisp Editorial Headline */}
              <div
                key={`wing-copy-${mode}`}
                className="space-y-3 animate-form-stagger"
                style={{ '--stagger-delay': '40ms' } as React.CSSProperties}
              >
                <h2 className="font-display text-[25px] font-bold leading-[1.18] tracking-[-0.02em] text-white [text-wrap:balance]">
                  {mode === 'signup'
                    ? 'Join Bangladesh’s Robotics Engineering Hub.'
                    : mode === 'reset'
                    ? 'Recover Your Member Account.'
                    : 'Welcome Back to Robotera BD.'}
                </h2>
                <p className="text-[13px] text-slate-300/95 leading-relaxed">
                  Manage live courier tracking, earn loyalty reward points, and redeem digital gift cards across 64 districts.
                </p>
              </div>
            </div>

            {/* Minimal Unboxed Value Checklist */}
            <div className="relative z-10 space-y-3 pt-6 border-t border-white/12">
              {[
                {
                  icon: Truck,
                  title: 'Live Steadfast & Pathao Tracking',
                },
                {
                  icon: Award,
                  title: '100 Reward Points per ৳1,000+ Order',
                },
                {
                  icon: Gift,
                  title: 'Digital Gift Cards on ৳500+ Orders',
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    style={{ '--stagger-delay': `${90 + idx * 45}ms` } as React.CSSProperties}
                    className="group animate-form-stagger flex items-center gap-2.5 text-[12.5px] text-slate-200 font-medium"
                  >
                    <Icon className="motion-icon-tilt w-4 h-4 text-[#38BDF8] shrink-0" />
                    <span>{item.title}</span>
                  </div>
                );
              })}

              <p className="pt-3 border-t border-white/10 font-mono text-[10.5px] text-slate-400 tracking-wide">
                ESD-Verified Dhaka Warehouse · 64 Districts
              </p>
            </div>
          </div>

          {/* Mobile Compact Header (< md) */}
          <div className="md:hidden px-5 py-4 bg-[#071A3D] text-white flex items-center justify-between shrink-0 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <BrandLogo size="xs" className="border-white/20" />
              <span className="font-display text-sm font-bold tracking-tight">ROBOTERA BD</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close account dialog"
              className="p-1.5 rounded-lg text-slate-200 hover:text-white bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Right Clean Form Surface */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto flex flex-col justify-between bg-white">
            <div className="space-y-5">
              {/* Top Heading + Desktop Close */}
              <div className="flex items-start justify-between gap-4">
                <div
                  key={`header-${mode}`}
                  className="animate-form-stagger"
                  style={{ '--stagger-delay': '0ms' } as React.CSSProperties}
                >
                  <h3 className="font-display text-[22px] sm:text-2xl font-bold text-[#071A3B] tracking-[-0.02em]">
                    {mode === 'login'
                      ? 'Sign In'
                      : mode === 'signup'
                      ? 'Create Account'
                      : 'Reset Password'}
                  </h3>
                  <p className="text-[13px] text-[#64748B] mt-1">
                    {mode === 'login'
                      ? 'Access your orders, reward points & gift cards.'
                      : mode === 'signup'
                      ? 'Create your customer or university club account.'
                      : 'Enter your registered email to receive a reset link.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close account dialog"
                  className="hidden md:flex p-2 rounded-lg text-slate-400 hover:text-[#071A3B] hover:bg-slate-100 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Switch */}
              {mode !== 'reset' && (
                <div className="relative grid grid-cols-2 p-1 bg-[#F1F5F9] rounded-xl">
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-white shadow-xs transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      mode === 'signup' ? 'translate-x-full' : 'translate-x-0'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`relative z-10 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors ${
                      mode === 'login' ? 'text-[#071A3B]' : 'text-[#64748B] hover:text-[#071A3B]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className={`relative z-10 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors ${
                      mode === 'signup' ? 'text-[#071A3B]' : 'text-[#64748B] hover:text-[#071A3B]'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              <form
                key={mode}
                onSubmit={handleSubmit}
                className="space-y-3.5"
              >
                {mode === 'signup' && (
                  <div
                    className="animate-form-stagger"
                    style={{ '--stagger-delay': '35ms' } as React.CSSProperties}
                  >
                    <label
                      htmlFor="auth-name"
                      className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="group flex items-center gap-2.5 h-11 px-3.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 focus-within:border-[#0866F5] focus-within:ring-3 focus-within:ring-[#0866F5]/12 transition-all">
                      <UserIcon className="w-4 h-4 text-slate-400 group-focus-within:text-[#0866F5] transition-colors shrink-0" />
                      <input
                        id="auth-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Md. Rafi / BUET Robotics"
                        className="w-full h-full bg-transparent text-base sm:text-[14px] text-[#0F172A] placeholder:text-slate-400 focus:outline-none"
                      />
                      {fullName && (
                        <button
                          type="button"
                          onClick={() => setFullName('')}
                          aria-label="Clear full name"
                          className="p-1 rounded-md text-slate-400 hover:text-[#071A3B] transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <>
                    <div
                      className="animate-form-stagger"
                      style={{ '--stagger-delay': '55ms' } as React.CSSProperties}
                    >
                      <label
                        htmlFor="auth-email"
                        className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                      >
                        Email Address
                      </label>
                      <div className="group flex items-center gap-2.5 h-11 px-3.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 focus-within:border-[#0866F5] focus-within:ring-3 focus-within:ring-[#0866F5]/12 transition-all">
                        <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-[#0866F5] transition-colors shrink-0" />
                        <input
                          id="auth-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full h-full bg-transparent text-base sm:text-[14px] text-[#0F172A] placeholder:text-slate-400 focus:outline-none"
                        />
                        {email && (
                          <button
                            type="button"
                            onClick={() => setEmail('')}
                            aria-label="Clear email address"
                            className="p-1 rounded-md text-slate-400 hover:text-[#071A3B] transition-colors shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {mode !== 'reset' && (
                      <div
                        className="animate-form-stagger"
                        style={{ '--stagger-delay': '90ms' } as React.CSSProperties}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="auth-pass"
                            className="block text-xs font-semibold text-[#0F172A]"
                          >
                            Password
                          </label>
                          {mode === 'login' && (
                            <button
                              type="button"
                              onClick={() => switchMode('reset')}
                              className="text-xs font-semibold text-[#0866F5] hover:underline transition-colors"
                            >
                              Forgot password?
                            </button>
                          )}
                        </div>
                        <div className="group flex items-center gap-2.5 h-11 px-3.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 focus-within:border-[#0866F5] focus-within:ring-3 focus-within:ring-[#0866F5]/12 transition-all">
                          <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-[#0866F5] transition-colors shrink-0" />
                          <input
                            id="auth-pass"
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimum 6 characters"
                            className="w-full h-full bg-transparent text-base sm:text-[14px] text-[#0F172A] placeholder:text-slate-400 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="p-1 rounded-md text-slate-400 hover:text-[#071A3B] transition-colors shrink-0"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {mode === 'signup' && password.length > 0 && (() => {
                          const hasMix = /[A-Z]/.test(password) && /[0-9!@#$%^&*]/.test(password);
                          const score =
                            password.length >= 10 && hasMix
                              ? 3
                              : password.length >= 6
                              ? 2
                              : 1;
                          const strengthLabel =
                            score === 3 ? 'Strong password' : score === 2 ? 'Good length' : 'Too short (min 6)';
                          const barColor =
                            score === 3 ? 'bg-emerald-500' : score === 2 ? 'bg-[#0866F5]' : 'bg-amber-500';
                          return (
                            <div className="mt-2 flex items-center justify-between gap-3 animate-slide-down">
                              <div className="flex-1 grid grid-cols-3 gap-1.5">
                                {[1, 2, 3].map((step) => (
                                  <span
                                    key={step}
                                    className={`h-1 rounded-full transition-all duration-300 ${
                                      step <= score ? barColor : 'bg-slate-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-mono text-[10.5px] font-semibold text-[#64748B] shrink-0">
                                {strengthLabel}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </>

                {/* Terms & Policies shown strictly ONLY during Create Account */}
                {mode === 'signup' && (
                  <div
                    className="animate-form-stagger rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5 space-y-2.5"
                    style={{ '--stagger-delay': '125ms' } as React.CSSProperties}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#071A3B]">
                        <FileText className="w-3.5 h-3.5 text-[#0866F5] shrink-0" />
                        <span>Terms of Service &amp; Privacy</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setTermsExpanded((prev) => !prev);
                        }}
                        aria-expanded={termsExpanded}
                        className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#0866F5] hover:underline shrink-0"
                      >
                        <span>{termsExpanded ? 'See less' : 'See more'}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            termsExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {!termsExpanded ? (
                      <p className="text-[11.5px] text-[#475569] leading-relaxed line-clamp-1">
                        By creating a Robotera BD account, you grant browser GPS, IP/area
                        location &amp; device permissions viewable by Admin for order security and
                        delivery verification.
                      </p>
                    ) : (
                      <div className="animate-accordion-reveal max-h-40 overflow-y-auto pr-1 space-y-2.5 text-[11.5px] text-[#475569] leading-relaxed border-t border-slate-200 pt-2.5">
                        <div className="space-y-1">
                          <p className="font-semibold text-[#071A3B] inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#0866F5] shrink-0" />
                            <span>1. GPS Location, IP Telemetry &amp; Admin Visibility</span>
                          </p>
                          <p>
                            When you register or place orders on Robotera BD, you consent
                            to providing browser GPS coordinates (when permitted by your device),
                            public IP address, ISP/network operator details, estimated area/elaka,
                            timezone, browser/OS platform, screen size, and session timestamps.
                            Authorized Robotera BD Admins may inspect these telemetry &amp;
                            location logs inside the Admin Console to verify delivery districts,
                            prevent duplicate-promo abuse, and speed up nationwide courier
                            dispatch.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="font-semibold text-[#071A3B]">
                            2. Account Integrity &amp; Single-Use Promotions
                          </p>
                          <p>
                            Each verified customer account and Gmail address is eligible once for
                            first-order promo campaigns (such as ROBOTERA15). Misuse, automated
                            multi-account farming, or falsified delivery details may lead to order
                            cancellation or reward reversal.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="font-semibold text-[#071A3B]">
                            3. Delivery Zones, Payments &amp; 7-Day Hardware Warranty
                          </p>
                          <p>
                            Inside Dhaka Metro orders deliver in 2–3 days (৳80) and Outside Dhaka in
                            2–4 days (৳150). Components are bench-tested under ESD protocols and
                            carry a 7-day replacement warranty for manufacturing defects (excluding
                            physical damage, reverse polarity, or over-voltage burns).
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="font-semibold text-[#071A3B]">
                            4. Digital Gift Cards &amp; Loyalty Reward Points
                          </p>
                          <p>
                            Orders of ৳500 or more (after discounts) earn a Digital Gift Card at ৳3
                            per ৳100 spent. Orders of ৳1,000 or more earn Loyalty Reward Points at
                            100 points per ৳1,000 spent (100 points = ৳8 checkout discount), stay
                            Pending during processing/shipping, credit upon delivery, and
                            automatically reverse on cancelled or refunded orders.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="font-semibold text-[#071A3B]">
                            5. Data Retention &amp; Contact
                          </p>
                          <p>
                            Account and order records are retained securely on Google Firebase. You
                            may revoke browser GPS permission anytime via browser settings or request
                            account/telemetry review at {ADMIN_EMAIL}.
                          </p>
                        </div>
                      </div>
                    )}

                    <label
                      htmlFor="auth-terms-agree"
                      className="flex items-start gap-2.5 pt-1 cursor-pointer select-none"
                    >
                      <input
                        id="auth-terms-agree"
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => {
                          playTapSound();
                          setAgreedToTerms(e.target.checked);
                          if (e.target.checked && error.toLowerCase().includes('terms')) {
                            setError('');
                          }
                        }}
                        className="mt-0.5 w-4 h-4 rounded border-slate-400 text-[#0866F5] focus:ring-[#0866F5] shrink-0 cursor-pointer"
                      />
                      <span className="text-[11.5px] font-medium text-[#0F172A] leading-snug">
                        I agree to the Robotera BD Terms &amp; Policies, including GPS, location,
                        and telemetry permissions viewable by Admin.
                      </span>
                    </label>
                  </div>
                )}

                {error && (
                  <div className="animate-slide-down text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p>{error}</p>
                      {mode === 'login' && error.toLowerCase().includes('incorrect email or password') && (
                        <p className="text-[11px] text-red-700/90">
                          Already used Google Sign-In or added by an admin? Click{' '}
                          <button
                            type="button"
                            onClick={() => switchMode('reset')}
                            className="font-semibold underline hover:text-red-950"
                          >
                            Forgot password?
                          </button>{' '}
                          to set a password, or use Continue with Google below.
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {info && (
                  <div className="animate-slide-down text-xs text-[#0F766E] bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-start gap-2 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>{info}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (mode === 'signup' && !agreedToTerms)}
                  style={{ '--stagger-delay': '140ms' } as React.CSSProperties}
                  className="animate-form-stagger cta-sheen motion-press group w-full h-11 rounded-xl bg-[#0866F5] hover:bg-[#0654CC] text-white shadow-[0_10px_20px_-8px_rgba(8,102,245,0.45)] transition-all disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed text-[14px] font-semibold inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Please wait...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {mode === 'reset'
                          ? 'Send Reset Link'
                          : mode === 'login'
                          ? 'Sign In'
                          : 'Create Account'}
                      </span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                {mode === 'reset' && (
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="motion-press w-full h-11 rounded-xl border border-slate-200 bg-[#F8FAFC] hover:bg-slate-100 text-xs font-semibold text-[#071A3B] inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                )}
              </form>

              <div className="relative py-0.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-white px-3 text-slate-400 font-medium">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || (mode === 'signup' && !agreedToTerms)}
                className="motion-press w-full h-11 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-slate-300 hover:border-slate-400 text-[13.5px] font-semibold inline-flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            <p className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
              Secured by Firebase Authentication · Robotera BD
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
