import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  LogOut,
  Mail,
  Package,
  RefreshCw,
  ShieldCheck,
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
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
  Confirmed: 'bg-blue-50 text-blue-800 border-blue-200',
  Shipped: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  Delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Order History state for signed-in user
  const [userOrders, setUserOrders] = useState<StoredOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [ordersReloadKey, setOrdersReloadKey] = useState(0);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-fade-in fixed inset-0 bg-[#071A3B]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={user ? 'Your Robotera BD Account' : 'Account Sign In'}
        className={`animate-pop-in relative z-10 w-full ${
          user ? 'max-w-lg' : 'max-w-md'
        } max-h-[92dvh] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col`}
      >
        <div className="px-6 py-4 bg-[#071A3B] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-300" />
            <h2 className="font-display text-lg font-bold">
              {user ? 'Your Robotera BD Account' : 'Account Sign In'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account dialog"
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {user && (
          <div className="px-6 pt-3 pb-2 bg-[#F1F5F9] border-b border-slate-200 shrink-0">
            <div className="grid grid-cols-2 gap-1 p-1 bg-white rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setProfileTab('account')}
                className={`py-2 px-3 rounded-md border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  profileTab === 'account'
                    ? 'bg-[#071A3B] border-[#071A3B] text-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Profile</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('orders')}
                className={`py-2 px-3 rounded-md border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  profileTab === 'orders'
                    ? 'bg-[#071A3B] border-[#071A3B] text-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Order History</span>
                {userOrders.length > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${
                      profileTab === 'orders'
                        ? 'bg-white/20 text-white'
                        : 'bg-[#EFF6FF] text-[#0866F5]'
                    }`}
                  >
                    {userOrders.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {user ? (
            profileTab === 'account' ? (
              <div className="space-y-5">
                <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 p-4 space-y-1.5">
                  <p className="text-xs text-slate-500">Signed in as</p>
                  <p className="font-display text-base font-bold text-[#071A3B]">
                    {user.displayName || 'Robotera BD Member'}
                  </p>
                  <p className="font-mono text-xs text-slate-600">{user.email}</p>
                  <div className="pt-1 flex items-center gap-1.5 text-xs">
                    {user.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-[#0D9488] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Account
                      </span>
                    ) : (
                      <div className="space-y-2 w-full">
                        <span className="text-amber-700 font-semibold block">
                          Email verification pending
                        </span>
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Resend Verification Link
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setProfileTab('orders')}
                  className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-[#0866F5]/50 bg-white hover:bg-[#F8FAFC] flex items-center justify-between gap-3 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#0866F5] flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#071A3B]">View Order History</p>
                      <p className="text-[11px] text-slate-500">
                        {ordersLoading
                          ? 'Checking past purchases...'
                          : `${userOrders.length} ${userOrders.length === 1 ? 'order' : 'orders'} linked to your account`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#0866F5]">Open →</span>
                </button>

                {info && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    {info}
                  </p>
                )}
                {error && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                    {error}
                  </p>
                )}

                {(isAdmin || user.email?.toLowerCase() === ADMIN_EMAIL) && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdmin();
                    }}
                    className="w-full h-11 rounded-lg bg-[#0866F5] hover:bg-[#0866F5]/90 border border-[#0866F5] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Open Admin Console</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => signOutAdmin()}
                  className="w-full h-10 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
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
                    <p className="text-[11px] text-slate-500">
                      Synced with Firestore for {user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrdersReloadKey((k) => k + 1)}
                    disabled={ordersLoading}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
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
                    <p className="text-xs font-medium text-slate-600">
                      Loading your order history...
                    </p>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="py-10 px-4 bg-[#F1F5F9] rounded-xl border border-slate-200 text-center space-y-2.5">
                    <div className="w-11 h-11 mx-auto rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <Package className="w-5 h-5" />
                    </div>
                    <p className="font-display text-sm font-bold text-[#071A3B]">
                      No orders found yet
                    </p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
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
                          className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-mono text-xs font-bold text-[#0866F5] truncate">
                                #{order.orderId}
                              </p>
                              <p className="text-[11px] text-slate-500 inline-flex items-center gap-1 mt-0.5">
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

                          <div className="bg-[#F8FAFC] rounded-lg p-2.5 space-y-1 text-xs text-slate-700 border border-slate-100">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <div
                                key={`${order.orderId}-${item.productId}-${idx}`}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="truncate">
                                  {item.quantity}× {item.name}
                                  {item.variant ? ` (${item.variant})` : ''}
                                </span>
                                <span className="font-mono tabular-nums text-slate-600 shrink-0">
                                  ৳{(item.price * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-[11px] text-slate-500 pt-0.5">
                                + {order.items.length - 3} more{' '}
                                {order.items.length - 3 === 1 ? 'item' : 'items'}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
                            <div className="text-[11px] text-slate-500">
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
            )
          ) : (
            <div className="space-y-4">
              {/* Mode Switch Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#F1F5F9] rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setInfo('');
                  }}
                  className={`py-2 rounded-md border text-xs font-semibold transition-colors ${
                    mode === 'login'
                      ? 'bg-white border-slate-200/90 text-[#071A3B]'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                    setInfo('');
                  }}
                  className={`py-2 rounded-md border text-xs font-semibold transition-colors ${
                    mode === 'signup'
                      ? 'bg-white border-slate-200/90 text-[#071A3B]'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'signup' && (
                  <div>
                    <label htmlFor="auth-name" className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Md. Rafi"
                      className="w-full h-10 px-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-10 px-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {mode !== 'reset' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="auth-pass" className="block text-xs font-semibold text-slate-700">
                        Password
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('reset');
                            setError('');
                            setInfo('');
                          }}
                          className="text-[11px] font-semibold text-[#0866F5] hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      id="auth-pass"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-10 px-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                {error && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 leading-relaxed">
                    {error}
                  </p>
                )}
                {info && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 leading-relaxed">
                    {info}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-[#0866F5] hover:bg-[#0654CC] text-white transition-colors disabled:opacity-60 text-sm font-semibold"
                >
                  {loading
                    ? 'Please wait...'
                    : mode === 'login'
                    ? 'Sign In with Email'
                    : mode === 'signup'
                    ? 'Create Account'
                    : 'Send Password Reset Email'}
                </button>

                {mode === 'reset' && (
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-xs font-semibold text-slate-600 hover:text-slate-900 py-1"
                  >
                    Back to Sign In
                  </button>
                )}
              </form>

              <div className="relative py-1">
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
                disabled={loading}
                className="w-full h-10 rounded-xl bg-white hover:bg-[#F5F8FC] text-[#071A3B] border border-slate-200 hover:border-slate-300 text-xs font-semibold transition-colors"
              >
                Continue with Google
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
