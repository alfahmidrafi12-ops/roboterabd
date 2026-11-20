import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Truck,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  ADMIN_EMAIL,
  isVerifiedAdminUser,
  resendVerificationEmail,
  resetUserPassword,
  signInAdminWithGoogle,
  signInWithEmail,
  signOutAdmin,
  signUpWithEmail,
  subscribeUserOrders,
} from '../lib/firebase';
import { OrderStatus, StoredOrder } from '../types/store';

interface AuthModalProps {
  isOpen: boolean;
  user: User | null;
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
        timeStyle: 'short',
      });
    }
    if ('seconds' in ts && typeof (ts as { seconds: number }).seconds === 'number') {
      return new Date((ts as { seconds: number }).seconds * 1000).toLocaleString('en-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
  }
  return 'Recent order';
}

export function formatAuthErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
  if (msg.includes('auth/unauthorized-domain')) {
    return `This domain (${host}) is not authorized for sign-in yet. Add "${host}" in Firebase Console → Authentication → Settings → Authorized domains.`;
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
  if (msg.includes('auth/operation-not-allowed')) {
    return 'This sign-in method is not enabled yet in Firebase Console (Authentication → Sign-in method). Please enable it first.';
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
  return msg;
}

function getUserInitials(user: User): string {
  const source = user.displayName?.trim() || user.email?.split('@')[0] || 'RB';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  user,
  onClose,
  onOpenAdmin,
  onTrackOrder,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [profileTab, setProfileTab] = useState<'account' | 'orders'>('account');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Order History state for signed-in user
  const [userOrders, setUserOrders] = useState<StoredOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [ordersReloadKey, setOrdersReloadKey] = useState(0);

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

  if (!isOpen) return null;

  const isAdmin = isVerifiedAdminUser(user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
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
                    {user.displayName || 'Engineering Account'}
                  </h2>
                  <p className="font-mono text-xs text-slate-300 truncate">{user.email}</p>
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

          {/* Profile / Order History Tabs */}
          <div className="px-6 py-3 bg-[#EDF2F8] border-b border-slate-300/80 shrink-0">
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-slate-300/85">
              <button
                type="button"
                onClick={() => setProfileTab('account')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  profileTab === 'account'
                    ? 'bg-[#071A3B] border-[#071A3B] text-white'
                    : 'border-transparent text-[#334155] hover:text-[#071A3B] hover:bg-[#EDF2F8]'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Account Profile</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('orders')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  profileTab === 'orders'
                    ? 'bg-[#071A3B] border-[#071A3B] text-white'
                    : 'border-transparent text-[#334155] hover:text-[#071A3B] hover:bg-[#EDF2F8]'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Order History</span>
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
            </div>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {profileTab === 'account' ? (
              <div className="space-y-4">
                <div className="bg-[#EDF2F8] rounded-2xl border border-slate-300/85 p-4 sm:p-5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#475569]">
                      Verification Status
                    </span>
                    {user.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Account
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C2410C]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Pending Verification
                      </span>
                    )}
                  </div>
                  {!user.emailVerified && (
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
                  onClick={() => setProfileTab('orders')}
                  className="w-full p-4 rounded-2xl border border-slate-300/85 hover:border-[#0866F5] bg-white hover:bg-[#EDF2F8]/60 flex items-center justify-between gap-3 transition-colors text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#EDF2F8] border border-slate-300/80 text-[#0866F5] flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4" />
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
                  <ArrowRight className="w-4 h-4 text-[#0866F5] shrink-0" />
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

                {(isAdmin || user.email?.toLowerCase() === ADMIN_EMAIL) && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdmin();
                    }}
                    className="w-full h-11 rounded-xl bg-[#0866F5] hover:bg-[#0654CC] border border-[#0866F5] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Open Admin Console</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => signOutAdmin()}
                  className="w-full h-11 rounded-xl bg-[#EDF2F8] hover:bg-[#071A3B] border border-slate-300 hover:border-[#071A3B] text-[#071A3B] hover:text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#071A3B]">
                      Past Purchases
                    </h3>
                    <p className="text-[11px] text-[#475569]">
                      Synced live for {user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrdersReloadKey((k) => k + 1)}
                    disabled={ordersLoading}
                    className="h-9 px-3 rounded-xl border border-slate-300 bg-[#EDF2F8] hover:bg-[#071A3B] hover:text-white hover:border-[#071A3B] text-[#071A3B] text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors"
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
                    {userOrders.map((order) => {
                      const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
                      return (
                        <div
                          key={order.orderId}
                          className="rounded-2xl border border-slate-300/85 bg-white p-4 space-y-3 hover:border-[#0866F5] transition-colors"
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
                              <span className="font-mono text-sm font-bold text-[#071A3B] tabular-nums">
                                ৳{order.total.toLocaleString()}
                              </span>
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
            )}
          </div>
        </div>
      ) : (
        /* ================= FLAGSHIP SPLIT-LAYOUT LOGIN / SIGNUP PORTAL ================= */
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Account Sign In"
          className="animate-pop-in relative z-10 w-full max-w-3xl max-h-[94dvh] bg-white rounded-3xl border border-slate-300/90 shadow-2xl overflow-hidden flex flex-col md:flex-row"
        >
          {/* Left Deep Navy Brand Showcase Wing (Desktop & Tablet) */}
          <div className="hidden md:flex md:w-[44%] relative overflow-hidden bg-[#071A3B] bg-gradient-to-br from-[#06142E] via-[#071A3B] to-[#0C2B5E] text-white p-7 flex-col justify-between shrink-0 border-r border-white/10">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-75" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(8,102,245,0.28)_0%,rgba(15,118,110,0.14)_52%,transparent_72%)]"
            />

            {/* Subtle Engineering Circuit Trace Graphic */}
            <svg
              aria-hidden="true"
              viewBox="0 0 260 180"
              className="pointer-events-none absolute bottom-10 right-0 w-56 h-40 opacity-20"
              fill="none"
            >
              <path d="M 260 36 H 172 L 146 62 H 48" stroke="#38BDF8" strokeWidth="1.4" />
              <path d="M 260 56 H 184 L 158 82 H 86" stroke="#2DD4BF" strokeWidth="1.4" />
              <circle cx="48" cy="62" r="4" stroke="#38BDF8" strokeWidth="1.5" />
              <circle cx="86" cy="82" r="4" stroke="#2DD4BF" strokeWidth="1.5" />
              <circle cx="195" cy="132" r="24" stroke="#60A5FA" strokeWidth="1.2" strokeDasharray="4 4" />
              <circle cx="195" cy="132" r="9" stroke="#FB923C" strokeWidth="1.4" />
            </svg>

            {/* Brand Lockup */}
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#0866F5] flex items-center justify-center border border-white/20">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" aria-hidden="true">
                    <rect x="6" y="6" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" />
                  </svg>
                </span>
                <span className="font-display text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  <span>ROBOTERA</span>
                  <span className="bg-[#0866F5] text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                    BD
                  </span>
                </span>
              </div>

              <div className="space-y-2.5">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2DD4BF]">
                  Maker &amp; Lab Member Access
                </p>
                <h2 className="font-display text-2xl font-bold leading-snug text-white [text-wrap:balance]">
                  {mode === 'signup'
                    ? 'Build Faster with Verified Robotics Hardware.'
                    : mode === 'reset'
                    ? 'Recover Your Engineering Account.'
                    : 'Welcome Back to Your Hardware Bench.'}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Manage active builds, unlock member pricing, and monitor live Steadfast &amp;
                  Pathao courier tracking from our Dhaka dispatch hub.
                </p>
              </div>
            </div>

            {/* Clean Unboxed Engineering Benefits */}
            <div className="relative z-10 space-y-3.5 pt-6 border-t border-white/15">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#FB923C] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">15% First-Order Welcome Offer</p>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Claim code ROBOTERA15 on your first verified checkout.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">Saved Order &amp; Courier Sync</p>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Instant tracking across Dhaka &amp; all 64 districts.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#2DD4BF] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">ESD-Safe Lab Replacement</p>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    7-day bench-tested warranty on every component.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Compact Dark Header (< md) */}
          <div className="md:hidden relative overflow-hidden px-5 py-4 bg-[#071A3B] text-white flex items-center justify-between shrink-0">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-70" />
            <div className="relative z-10 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-[#0866F5] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" aria-hidden="true">
                  <rect x="6" y="6" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" />
                </svg>
              </span>
              <div>
                <p className="font-display text-sm font-bold leading-none">ROBOTERA BD</p>
                <p className="font-mono text-[10px] text-[#2DD4BF] mt-0.5">
                  {mode === 'signup'
                    ? 'Create Member Account'
                    : mode === 'reset'
                    ? 'Password Recovery'
                    : 'Member Sign In'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close account dialog"
              className="relative z-10 p-1.5 rounded-lg text-slate-300 hover:text-white bg-white/[0.08] border border-white/15"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Right Form Surface */}
          <div className="flex-1 p-5 sm:p-8 overflow-y-auto flex flex-col justify-between bg-white">
            <div className="space-y-5">
              {/* Desktop Form Top Header + Close Button */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#071A3B] tracking-tight">
                    {mode === 'login'
                      ? 'Sign In'
                      : mode === 'signup'
                      ? 'Create Account'
                      : 'Reset Password'}
                  </h3>
                  <p className="text-xs text-[#475569] mt-1">
                    {mode === 'login'
                      ? 'Enter your credentials or continue with Google.'
                      : mode === 'signup'
                      ? 'Register your maker or university club profile.'
                      : 'Enter your registered email to receive a reset link.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close account dialog"
                  className="hidden md:flex p-2 rounded-xl text-[#475569] hover:text-[#071A3B] bg-[#EDF2F8] hover:bg-slate-200/80 border border-slate-300/80 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Switch Segmented Tabs */}
              {mode !== 'reset' && (
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#EDF2F8] rounded-xl border border-slate-300/85">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                      mode === 'login'
                        ? 'bg-[#071A3B] border-[#071A3B] text-white'
                        : 'border-transparent text-[#334155] hover:text-[#071A3B] hover:bg-white/70'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className={`py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                      mode === 'signup'
                        ? 'bg-[#071A3B] border-[#071A3B] text-white'
                        : 'border-transparent text-[#334155] hover:text-[#071A3B] hover:bg-white/70'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'signup' && (
                  <div>
                    <label htmlFor="auth-name" className="block text-xs font-semibold text-[#071A3B] mb-1.5">
                      Full Name or Robotics Club
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Md. Rafi / BUET Robotics"
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#EDF2F8] border border-slate-300 text-base sm:text-sm text-[#0F172A] placeholder:text-[#64748B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0866F5] transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className="block text-xs font-semibold text-[#071A3B] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#EDF2F8] border border-slate-300 text-base sm:text-sm text-[#0F172A] placeholder:text-[#64748B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0866F5] transition-colors"
                    />
                  </div>
                </div>

                {mode !== 'reset' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="auth-pass" className="block text-xs font-semibold text-[#071A3B]">
                        Password
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => switchMode('reset')}
                          className="text-[11px] font-semibold text-[#0866F5] hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-pass"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full h-11 pl-10 pr-11 rounded-xl bg-[#EDF2F8] border border-slate-300 text-base sm:text-sm text-[#0F172A] placeholder:text-[#64748B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0866F5] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#475569] hover:text-[#071A3B] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                {info && (
                  <div className="text-xs text-[#0F766E] bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-start gap-2 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>{info}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-[#0866F5] hover:bg-[#0654CC] border border-[#0866F5] text-white transition-colors disabled:opacity-60 text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Please wait...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {mode === 'login'
                          ? 'Sign In with Email'
                          : mode === 'signup'
                          ? 'Create Account'
                          : 'Send Reset Link'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {mode === 'reset' && (
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full h-10 rounded-xl border border-slate-300 bg-[#EDF2F8] hover:bg-[#071A3B] hover:text-white hover:border-[#071A3B] text-xs font-semibold text-[#071A3B] inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                )}
              </form>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300/80" />
                </div>
                <div className="relative flex justify-center text-[11px] font-mono uppercase tracking-wider">
                  <span className="bg-white px-3 text-[#475569]">or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-11 rounded-xl bg-white hover:bg-[#EDF2F8] text-[#071A3B] border border-slate-300 hover:border-[#071A3B] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60"
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

            <p className="mt-5 pt-3 border-t border-slate-200 text-[11px] text-[#64748B] text-center">
              Protected by Firebase Authentication · Robotera BD Dhaka Hub
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
