import React, { useEffect, useRef, useState } from 'react';
import { ConfirmationResult, RecaptchaVerifier, User } from 'firebase/auth';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Gift,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Truck,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  ADMIN_EMAIL,
  confirmPhoneOtpCode,
  createPhoneRecaptchaVerifier,
  isVerifiedAdminUser,
  resendVerificationEmail,
  resetUserPassword,
  sendPhoneOtpCode,
  signInAdminWithGoogle,
  signInWithEmail,
  signOutAdmin,
  signUpWithEmail,
  subscribeUserOrders,
} from '../lib/firebase';
import { downloadGiftCardPng } from '../lib/giftCard';
import { playErrorSound, playTapSound, playVoucherCopySound } from '../lib/sound';
import { GiftCardReward, OrderStatus, StoredOrder } from '../types/store';
import { DigitalGiftCard } from './DigitalGiftCard';
import { RewardDashboard } from './RewardDashboard';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthModalProps {
  isOpen: boolean;
  user: User | null;
  giftCards?: GiftCardReward[];
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
  const rawCode =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code || '')
      : '';
  const msg = `${rawCode} ${err instanceof Error ? err.message : String(err)}`;
  const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
  const projectId = firebaseConfig.projectId || 'your Firebase project';

  if (msg.includes('auth/billing-not-enabled')) {
    return `Firebase Phone SMS requires the Blaze (pay-as-you-go) billing plan on project "${projectId}". Enable Blaze in Firebase Console (10 free SMS/day included) OR add a test number under Authentication → Sign-in method → Phone → Phone numbers for testing.`;
  }
  if (msg.includes('auth/unauthorized-domain')) {
    return `Domain "${host}" is not authorized yet. In Firebase Console (${projectId}) → Authentication → Settings → Authorized domains, add "${host}".`;
  }
  if (
    msg.includes('auth/invalid-app-credential') ||
    msg.includes('auth/app-not-authorized') ||
    msg.includes('auth/missing-client-identifier')
  ) {
    return `Phone verification credential check failed on "${host}". Ensure "${host}" is added in Firebase Console (${projectId}) → Authorized domains, Identity Toolkit API is enabled, and no ad-blocker/cookie blocker is blocking Google reCAPTCHA.`;
  }
  if (msg.includes('auth/operation-not-allowed')) {
    if (msg.toLowerCase().includes('region')) {
      return `SMS to Bangladesh (+880) is blocked in Firebase SMS Region Policy for project "${projectId}". Open Firebase Console (${projectId}) → Authentication → Settings → SMS region policy and allow Bangladesh (+880).`;
    }
    return `Phone Sign-in is NOT enabled on the connected Firebase project "${projectId}" (make sure you enabled Phone inside "${projectId}" and clicked Save, not in a different project). If it is already enabled, check Authentication → Settings → SMS region policy for Bangladesh (+880).`;
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
  if (msg.includes('auth/invalid-phone-number') || msg.includes('auth/missing-phone-number')) {
    return 'Enter a valid Bangladesh mobile number (e.g. 017XXXXXXXX or +88017XXXXXXXX).';
  }
  if (msg.includes('auth/invalid-verification-code')) {
    return 'Incorrect 6-digit OTP code. Please check your SMS and try again.';
  }
  if (msg.includes('auth/code-expired')) {
    return 'That OTP code has expired. Please request a new code.';
  }
  if (msg.includes('auth/too-many-requests')) {
    return 'Too many verification attempts or SMS blocked for this number. Wait a few minutes or check Firebase SMS region policy for +880.';
  }
  if (msg.includes('auth/captcha-check-failed') || msg.includes('already been rendered')) {
    return 'reCAPTCHA verification failed or expired. Please click Send OTP Code again (disable ad-blockers if this repeats).';
  }
  if (msg.includes('auth/quota-exceeded')) {
    return 'Daily SMS quota exceeded in Firebase. Try again tomorrow or sign in with Google / Email.';
  }
  if (msg.includes('auth/web-storage-unsupported') || msg.includes('auth/internal-error')) {
    return `Browser/iframe blocked Firebase reCAPTCHA storage on "${host}". Allow third-party cookies for Google/Firebase or open the site in a full browser tab and check Authorized domains (${projectId}).`;
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

const RECAPTCHA_CONTAINER_ID = 'robotera-phone-recaptcha';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  user,
  giftCards,
  onClose,
  onOpenAdmin,
  onTrackOrder,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [profileTab, setProfileTab] = useState<'account' | 'rewards' | 'orders' | 'gifts'>('account');
  const [localGiftCards, setLocalGiftCards] = useState<GiftCardReward[]>(() =>
    user ? (giftCards ?? []) : []
  );
  const [copiedGiftCode, setCopiedGiftCode] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Mobile Phone OTP State
  const [phoneInput, setPhoneInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpConfirmation, setOtpConfirmation] = useState<ConfirmationResult | null>(null);
  const [sentPhoneDisplay, setSentPhoneDisplay] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

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

  const clearRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch {
        // Ignore cleanup errors if DOM already unmounted
      }
      recaptchaVerifierRef.current = null;
    }
    const container = document.getElementById(RECAPTCHA_CONTAINER_ID);
    if (container) {
      container.innerHTML = '';
    }
  };

  useEffect(() => {
    if (!user?.uid) {
      setLocalGiftCards([]);
      return;
    }
    setLocalGiftCards(giftCards ?? []);
  }, [isOpen, giftCards, user?.uid]);

  useEffect(() => {
    if (!isOpen || user) {
      clearRecaptcha();
      setOtpConfirmation(null);
      setOtpCode('');
      setResendSeconds(0);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

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
  const activeGiftCardsCount = localGiftCards.filter((c) => !c.redeemed).length;

  const handleCopyGiftCode = (code: string) => {
    playVoucherCopySound();
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedGiftCode(code);
    window.setTimeout(() => setCopiedGiftCode(null), 1800);
  };

  const handleSendPhoneOtp = async () => {
    setError('');
    setInfo('');
    if (mode === 'signup' && !agreedToTerms) {
      playErrorSound();
      setError(
        'Please read and agree to the Terms & Policies (including GPS, location, and telemetry permissions) before creating an account.'
      );
      return;
    }
    if (!phoneInput.trim()) {
      playErrorSound();
      setError('Please enter your Bangladesh mobile number.');
      return;
    }

    setLoading(true);
    try {
      clearRecaptcha();
      const verifier = createPhoneRecaptchaVerifier(RECAPTCHA_CONTAINER_ID, () => {
        clearRecaptcha();
      });
      recaptchaVerifierRef.current = verifier;
      const { confirmationResult, formattedPhone } = await sendPhoneOtpCode(
        phoneInput,
        verifier
      );
      setOtpConfirmation(confirmationResult);
      setSentPhoneDisplay(formattedPhone);
      setOtpCode('');
      setResendSeconds(45);
      setInfo(`6-digit OTP sent via SMS to ${formattedPhone}.`);
      window.setTimeout(() => otpRefs.current[0]?.focus(), 80);
    } catch (err) {
      console.error('Firebase Phone OTP send error:', err);
      clearRecaptcha();
      playErrorSound();
      setError(formatAuthErrorMessage(err));
    } finally {
      setLoading(false);
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

    if (mode !== 'reset' && authMethod === 'phone') {
      if (!otpConfirmation) {
        await handleSendPhoneOtp();
        return;
      }
      setLoading(true);
      try {
        await confirmPhoneOtpCode(
          otpConfirmation,
          otpCode,
          mode === 'signup' ? fullName : undefined
        );
        clearRecaptcha();
        setOtpConfirmation(null);
        setOtpCode('');
      } catch (err) {
        playErrorSound();
        setError(formatAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
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
    if (nextMode === 'reset') {
      clearRecaptcha();
      setOtpConfirmation(null);
      setOtpCode('');
    }
  };

  const switchAuthMethod = (nextMethod: 'email' | 'phone') => {
    playTapSound();
    setAuthMethod(nextMethod);
    setError('');
    setInfo('');
    if (nextMethod === 'email') {
      clearRecaptcha();
      setOtpConfirmation(null);
      setOtpCode('');
    }
  };

  const handleOtpDigitChange = (index: number, rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (digitsOnly.length > 1) {
      const next = digitsOnly.slice(0, 6);
      setOtpCode(next);
      const focusIdx = Math.min(5, next.length);
      otpRefs.current[focusIdx]?.focus();
      return;
    }
    const chars = Array.from({ length: 6 }, (_, i) => otpCode[i] || '');
    chars[index] = digitsOnly;
    const joined = chars.join('').replace(/\s/g, '');
    setOtpCode(joined);
    if (digitsOnly && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpCode[index] && index > 0) {
        e.preventDefault();
        const chars = Array.from({ length: 6 }, (_, i) => otpCode[i] || '');
        chars[index - 1] = '';
        setOtpCode(chars.join(''));
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    setOtpCode(pasted);
    otpRefs.current[Math.min(5, pasted.length)]?.focus();
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
                className={`py-2 px-2 sm:px-3 rounded-lg border text-[11px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
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
                className={`py-2 px-2 sm:px-3 rounded-lg border text-[11px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
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
                className={`py-2 px-2 sm:px-3 rounded-lg border text-[11px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
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
                className={`py-2 px-2 sm:px-3 rounded-lg border text-[11px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
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
                  className="w-full p-4 rounded-2xl border border-slate-300/85 hover:border-[#0866F5] bg-gradient-to-r from-[#071A3B] to-[#0B2D63] text-white flex items-center justify-between gap-3 transition-all hover:shadow-[0_10px_24px_-12px_rgba(8,102,245,0.45)] text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#00CFFF]/15 border border-[#00CFFF]/35 text-[#00CFFF] flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
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
                  <ArrowRight className="w-4 h-4 text-[#00CFFF] shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setProfileTab('orders');
                  }}
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

                {isAdmin && (
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
                              {(order.rewardPointsRedeemed ?? 0) > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 font-mono text-[10px] font-bold text-[#0866F5] tabular-nums">
                                  -{order.rewardPointsRedeemed} pts (-৳{order.rewardDiscount ?? 0})
                                </span>
                              )}
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
        /* ================= FLAGSHIP SPLIT-LAYOUT LOGIN / SIGNUP PORTAL ================= */
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Account Sign In"
          className="animate-auth-modal relative z-10 w-full max-w-[56rem] max-h-[94dvh] bg-white rounded-[26px] border border-slate-300/90 shadow-[0_32px_70px_-18px_rgba(3,10,24,0.58)] overflow-hidden flex flex-col md:flex-row font-sans"
        >
          {/* Left Obsidian-Navy Architectural Brand Showcase Wing (Desktop & Tablet) */}
          <div className="hidden md:flex md:w-[43%] relative overflow-hidden bg-[#040B1B] bg-gradient-to-br from-[#030A18] via-[#071A3D] to-[#0B2D66] text-white p-8 flex-col justify-between shrink-0 border-r border-white/10">
            <div aria-hidden="true" className="animate-blueprint-drift pointer-events-none absolute -inset-6 bg-lab-grid-dark opacity-70" />
            <div
              aria-hidden="true"
              className="animate-float-drift pointer-events-none absolute -top-24 -left-20 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(0,207,255,0.22)_0%,transparent_70%)]"
            />
            <div
              aria-hidden="true"
              className="animate-ambient-pulse pointer-events-none absolute -bottom-24 -right-20 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(8,102,245,0.34)_0%,rgba(45,212,191,0.16)_52%,transparent_72%)]"
            />

            {/* Precision Engineering Circuit & Animated Signal Trace */}
            <svg
              aria-hidden="true"
              viewBox="0 0 280 180"
              className="pointer-events-none absolute bottom-10 right-0 w-72 h-48 opacity-40"
              fill="none"
            >
              <path d="M 280 34 H 186 L 158 62 H 54" stroke="#38BDF8" strokeWidth="1.4" strokeOpacity="0.35" />
              <path d="M 280 34 H 186 L 158 62 H 54" stroke="#38BDF8" strokeWidth="1.8" className="animate-circuit-flow" />
              <path d="M 280 56 H 198 L 170 84 H 96" stroke="#2DD4BF" strokeWidth="1.4" strokeOpacity="0.35" />
              <path
                d="M 280 56 H 198 L 170 84 H 96"
                stroke="#2DD4BF"
                strokeWidth="1.8"
                className="animate-circuit-flow"
                style={{ animationDelay: '-2.2s' }}
              />
              <circle cx="54" cy="62" r="4" stroke="#38BDF8" strokeWidth="1.5" />
              <circle cx="96" cy="84" r="4" stroke="#2DD4BF" strokeWidth="1.5" />
              <g style={{ transformOrigin: '206px 134px' }} className="animate-spin-slow">
                <circle cx="206" cy="134" r="28" stroke="#60A5FA" strokeWidth="1.2" strokeDasharray="4 4" />
              </g>
              <circle cx="206" cy="134" r="11" stroke="#00CFFF" strokeWidth="1.5" />
              <path
                d="M 18 148 H 48 L 58 128 L 70 162 L 82 138 L 92 148 H 136"
                stroke="#00CFFF"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-circuit-flow"
              />
            </svg>

            {/* Brand Lockup + Telemetry Coordinate Eyebrow */}
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2.5 animate-form-stagger">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#087BFF] to-[#0057E7] flex items-center justify-center border border-sky-300/35 shadow-[0_6px_16px_-4px_rgba(8,123,255,0.65)]">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" aria-hidden="true">
                    <rect x="6" y="6" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" />
                  </svg>
                </span>
                <span className="font-display text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>ROBOTERA</span>
                  <span className="bg-[#087BFF] text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                    BD
                  </span>
                </span>
              </div>

              <div
                key={`wing-copy-${mode}`}
                className="space-y-2.5 animate-form-stagger"
                style={{ '--stagger-delay': '40ms' } as React.CSSProperties}
              >
                <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#2DD4BF]">
                  Dhaka Engineering Portal
                </p>
                <h2 className="font-display text-[26px] font-bold leading-[1.16] tracking-[-0.02em] text-white [text-wrap:balance]">
                  {mode === 'signup'
                    ? 'Build Faster with Verified Robotics Hardware.'
                    : mode === 'reset'
                    ? 'Recover Your Engineering Account.'
                    : 'Welcome Back to Your Hardware Bench.'}
                </h2>
                <p className="text-[13px] text-slate-300 leading-relaxed tracking-[0.01em]">
                  Track Steadfast &amp; Pathao couriers, redeem loyalty points, and unlock collector
                  digital gift passes on qualifying hardware orders.
                </p>
              </div>

              {/* Clean Unboxed 3-Metric Hairline Strip */}
              <div
                className="grid grid-cols-3 pt-4 border-t border-white/12 divide-x divide-white/12 animate-form-stagger"
                style={{ '--stagger-delay': '90ms' } as React.CSSProperties}
              >
                <div className="pr-2.5">
                  <p className="font-mono text-sm font-bold text-white tabular-nums">64</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Districts</p>
                </div>
                <div className="px-2.5">
                  <p className="font-mono text-sm font-bold text-[#00CFFF] tabular-nums">100 pts</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Per ৳1,000</p>
                </div>
                <div className="pl-2.5">
                  <p className="font-mono text-sm font-bold text-[#2DD4BF] tabular-nums">৳3/100</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Gift Pass</p>
                </div>
              </div>
            </div>

            {/* Clean Unboxed Engineering Benefits */}
            <div className="relative z-10 space-y-3.5 pt-5 border-t border-white/15">
              {[
                {
                  icon: Sparkles,
                  color: 'text-[#FB923C]',
                  title: '15% First-Order Welcome Offer',
                  desc: 'Use promo code ROBOTERA15 on your first verified checkout.',
                  delay: '120ms',
                },
                {
                  icon: Truck,
                  color: 'text-[#38BDF8]',
                  title: 'Live Courier & Reward Vault',
                  desc: 'Earn 100 pts per ৳1,000+ spent and save digital gift passes.',
                  delay: '170ms',
                },
                {
                  icon: ShieldCheck,
                  color: 'text-[#2DD4BF]',
                  title: 'Verified Multi-Method Sign In',
                  desc: 'Sign in fast via Email, Bangladesh SMS OTP, or Google.',
                  delay: '220ms',
                },
              ].map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    style={{ '--stagger-delay': benefit.delay } as React.CSSProperties}
                    className="animate-form-stagger flex items-start gap-2.5 transition-transform duration-200 hover:translate-x-1"
                  >
                    <Icon className={`w-4 h-4 ${benefit.color} shrink-0 mt-0.5`} />
                    <div>
                      <p className="text-xs font-semibold text-white">{benefit.title}</p>
                      <p className="text-[11.5px] text-slate-300 leading-snug">{benefit.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Compact Obsidian Header (< md) */}
          <div className="md:hidden relative overflow-hidden px-5 py-4 bg-gradient-to-r from-[#040B1B] via-[#071A3D] to-[#0B2D66] text-white flex items-center justify-between shrink-0 border-b border-white/10">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-70" />
            <div className="relative z-10 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#087BFF] to-[#0057E7] flex items-center justify-center border border-sky-300/35">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" aria-hidden="true">
                  <rect x="6" y="6" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" />
                </svg>
              </span>
              <div>
                <p className="font-display text-sm font-bold tracking-tight leading-none">
                  ROBOTERA BD
                </p>
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
              className="relative z-10 p-2 rounded-xl text-slate-200 hover:text-white bg-white/10 border border-white/15"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Right Form Surface */}
          <div className="flex-1 p-5 sm:p-7 overflow-y-auto flex flex-col justify-between bg-white">
            <div className="space-y-4">
              {/* Desktop Form Top Header + Close Button */}
              <div className="flex items-start justify-between gap-4">
                <div
                  key={`header-${mode}`}
                  className="animate-form-stagger"
                  style={{ '--stagger-delay': '0ms' } as React.CSSProperties}
                >
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0866F5]">
                    {mode === 'login'
                      ? 'Account Access'
                      : mode === 'signup'
                      ? 'New Maker Registration'
                      : 'Credential Recovery'}
                  </p>
                  <h3 className="font-display text-2xl font-bold text-[#071A3B] tracking-[-0.02em] mt-0.5">
                    {mode === 'login'
                      ? 'Sign In'
                      : mode === 'signup'
                      ? 'Create Account'
                      : 'Reset Password'}
                  </h3>
                  <p className="text-[13px] text-[#475569] mt-1 leading-snug">
                    {mode === 'login'
                      ? 'Sign in with email, Bangladesh mobile OTP, or Google.'
                      : mode === 'signup'
                      ? 'Set up your personal or university robotics club profile.'
                      : 'Enter your registered email to receive a reset link.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close account dialog"
                  className="hidden md:flex p-2 rounded-xl text-[#475569] hover:text-[#071A3B] bg-[#EEF2F7] hover:bg-slate-200/80 border border-slate-200 transition-all hover:rotate-90 duration-200 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sliding Mode Switch Segmented Tabs */}
              {mode !== 'reset' && (
                <div className="space-y-2.5">
                  <div className="relative grid grid-cols-2 p-1 bg-[#EEF2F7] rounded-xl border border-slate-200/90">
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-[#071A3B] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        mode === 'signup' ? 'translate-x-full' : 'translate-x-0'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className={`relative z-10 py-2.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors duration-200 ${
                        mode === 'login' ? 'text-white' : 'text-[#334155] hover:text-[#071A3B]'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className={`relative z-10 py-2.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors duration-200 ${
                        mode === 'signup' ? 'text-white' : 'text-[#334155] hover:text-[#071A3B]'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  {/* Sliding Email vs Mobile Number OTP Method Toggle */}
                  <div className="relative grid grid-cols-2 p-1 bg-[#F5F8FC] rounded-xl border border-slate-200/90">
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-white border border-blue-200/80 shadow-xs transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        authMethod === 'phone' ? 'translate-x-full' : 'translate-x-0'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => switchAuthMethod('email')}
                      className={`relative z-10 py-2 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors duration-200 ${
                        authMethod === 'email'
                          ? 'text-[#0866F5]'
                          : 'text-[#475569] hover:text-[#071A3B]'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span>Email &amp; Password</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => switchAuthMethod('phone')}
                      className={`relative z-10 py-2 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors duration-200 ${
                        authMethod === 'phone'
                          ? 'text-[#0866F5]'
                          : 'text-[#475569] hover:text-[#071A3B]'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>Mobile Number (OTP)</span>
                    </button>
                  </div>
                </div>
              )}

              <form
                key={`${mode}-${authMethod}`}
                onSubmit={handleSubmit}
                className="space-y-3.5"
              >
                {mode === 'signup' && !(authMethod === 'phone' && otpConfirmation) && (
                  <div
                    className="animate-form-stagger"
                    style={{ '--stagger-delay': '35ms' } as React.CSSProperties}
                  >
                    <label
                      htmlFor="auth-name"
                      className="block text-xs font-semibold text-[#071A3B] mb-1.5 tracking-[0.01em]"
                    >
                      Full Name or Robotics Club
                    </label>
                    <div className="group flex items-center gap-2.5 h-12 px-2.5 rounded-xl bg-[#F6F8FC] border border-slate-300/90 hover:border-slate-400 focus-within:bg-white focus-within:border-[#0866F5] focus-within:ring-4 focus-within:ring-[#0866F5]/12 transition-all duration-200">
                      <span className="w-8 h-8 rounded-lg bg-white border border-slate-200/90 flex items-center justify-center text-[#475569] group-focus-within:border-[#0866F5]/40 group-focus-within:text-[#0866F5] group-focus-within:scale-105 transition-all duration-200 shrink-0">
                        <UserIcon className="w-4 h-4" />
                      </span>
                      <input
                        id="auth-name"
                        type="text"
                        required={authMethod === 'email'}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Md. Rafi / BUET Robotics"
                        className="w-full h-full bg-transparent text-base sm:text-[14px] font-medium text-[#0F172A] placeholder:font-normal placeholder:text-[#64748B] focus:outline-none"
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

                {mode !== 'reset' && authMethod === 'phone' ? (
                  otpConfirmation ? (
                    <div
                      className="space-y-3.5 animate-form-stagger"
                      style={{ '--stagger-delay': '40ms' } as React.CSSProperties}
                    >
                      <div className="rounded-xl bg-[#EFF6FF] border border-blue-200 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[#071A3B] font-medium truncate">
                          OTP sent to{' '}
                          <strong className="font-mono tabular-nums">{sentPhoneDisplay}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            clearRecaptcha();
                            setOtpConfirmation(null);
                            setOtpCode('');
                            setError('');
                            setInfo('');
                          }}
                          className="text-[11px] font-semibold text-[#0866F5] hover:underline shrink-0"
                        >
                          Change Number
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label
                            htmlFor="auth-otp-0"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#071A3B]"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-[#0866F5]" />
                            <span>6-Digit SMS Verification Code</span>
                          </label>
                          <span className="font-mono text-[11px] font-semibold text-[#475569] tabular-nums">
                            {otpCode.length}/6
                          </span>
                        </div>

                        <div className="grid grid-cols-6 gap-2">
                          {[0, 1, 2, 3, 4, 5].map((idx) => {
                            const char = otpCode[idx] || '';
                            return (
                              <input
                                key={idx}
                                id={idx === 0 ? 'auth-otp-0' : undefined}
                                ref={(el) => {
                                  otpRefs.current[idx] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                                maxLength={6}
                                aria-label={`OTP digit ${idx + 1}`}
                                value={char}
                                onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                onPaste={handleOtpPaste}
                                className={`h-12 w-full rounded-xl border text-center font-mono text-lg font-bold tabular-nums transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#0866F5]/14 ${
                                  char
                                    ? 'animate-otp-pop bg-white border-[#0866F5] text-[#071A3B] shadow-xs'
                                    : 'bg-[#F6F8FC] border-slate-300/90 text-[#0F172A] hover:border-slate-400 focus:bg-white focus:border-[#0866F5]'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-[#475569]">Didn&apos;t receive SMS?</span>
                        <button
                          type="button"
                          disabled={loading || resendSeconds > 0}
                          onClick={() => {
                            clearRecaptcha();
                            setOtpConfirmation(null);
                            setOtpCode('');
                          }}
                          className="font-semibold text-[#0866F5] hover:underline disabled:opacity-50 tabular-nums"
                        >
                          {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Send Again'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="space-y-3 animate-form-stagger"
                      style={{ '--stagger-delay': '65ms' } as React.CSSProperties}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="auth-phone"
                            className="block text-xs font-semibold text-[#071A3B] tracking-[0.01em]"
                          >
                            Bangladesh Mobile Number
                          </label>
                          <span className="font-mono text-[11px] font-medium text-[#475569]">
                            SMS OTP
                          </span>
                        </div>
                        <div className="group flex items-center gap-2 h-12 px-2.5 rounded-xl bg-[#F6F8FC] border border-slate-300/90 hover:border-slate-400 focus-within:bg-white focus-within:border-[#0866F5] focus-within:ring-4 focus-within:ring-[#0866F5]/12 transition-all duration-200">
                          <span className="h-8 px-2.5 rounded-lg bg-white border border-slate-200/90 inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#071A3B] group-focus-within:border-[#0866F5]/40 group-focus-within:text-[#0866F5] transition-colors shrink-0 tabular-nums">
                            <Phone className="w-3.5 h-3.5" />
                            <span>+880</span>
                          </span>
                          <input
                            id="auth-phone"
                            type="tel"
                            required
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder="017XXXXXXXX"
                            className="w-full h-full bg-transparent font-mono text-base sm:text-[14px] font-semibold text-[#0F172A] tabular-nums placeholder:font-sans placeholder:font-normal placeholder:text-[#64748B] focus:outline-none"
                          />
                          {phoneInput && (
                            <button
                              type="button"
                              onClick={() => setPhoneInput('')}
                              aria-label="Clear mobile number"
                              className="p-1 rounded-md text-slate-400 hover:text-[#071A3B] transition-colors shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="mt-1.5 text-[11.5px] text-[#475569]">
                          We&apos;ll send a 6-digit SMS verification code — no password needed.
                        </p>
                      </div>

                      <div
                        id={RECAPTCHA_CONTAINER_ID}
                        className="min-h-0 flex justify-center"
                      />
                    </div>
                  )
                ) : (
                  <>
                    <div
                      className="animate-form-stagger"
                      style={{ '--stagger-delay': '60ms' } as React.CSSProperties}
                    >
                      <label
                        htmlFor="auth-email"
                        className="block text-xs font-semibold text-[#071A3B] mb-1.5 tracking-[0.01em]"
                      >
                        Email Address
                      </label>
                      <div className="group flex items-center gap-2.5 h-12 px-2.5 rounded-xl bg-[#F6F8FC] border border-slate-300/90 hover:border-slate-400 focus-within:bg-white focus-within:border-[#0866F5] focus-within:ring-4 focus-within:ring-[#0866F5]/12 transition-all duration-200">
                        <span className="w-8 h-8 rounded-lg bg-white border border-slate-200/90 flex items-center justify-center text-[#475569] group-focus-within:border-[#0866F5]/40 group-focus-within:text-[#0866F5] group-focus-within:scale-105 transition-all duration-200 shrink-0">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          id="auth-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full h-full bg-transparent text-base sm:text-[14px] font-medium text-[#0F172A] placeholder:font-normal placeholder:text-[#64748B] focus:outline-none"
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
                        style={{ '--stagger-delay': '100ms' } as React.CSSProperties}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="auth-pass"
                            className="block text-xs font-semibold text-[#071A3B] tracking-[0.01em]"
                          >
                            Password
                          </label>
                          {mode === 'login' && (
                            <button
                              type="button"
                              onClick={() => switchMode('reset')}
                              className="text-xs font-semibold text-[#0866F5] hover:text-[#071A3B] hover:underline transition-colors"
                            >
                              Forgot password?
                            </button>
                          )}
                        </div>
                        <div className="group flex items-center gap-2.5 h-12 px-2.5 rounded-xl bg-[#F6F8FC] border border-slate-300/90 hover:border-slate-400 focus-within:bg-white focus-within:border-[#0866F5] focus-within:ring-4 focus-within:ring-[#0866F5]/12 transition-all duration-200">
                          <span className="w-8 h-8 rounded-lg bg-white border border-slate-200/90 flex items-center justify-center text-[#475569] group-focus-within:border-[#0866F5]/40 group-focus-within:text-[#0866F5] group-focus-within:scale-105 transition-all duration-200 shrink-0">
                            <Lock className="w-4 h-4" />
                          </span>
                          <input
                            id="auth-pass"
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimum 6 characters"
                            className="w-full h-full bg-transparent text-base sm:text-[14px] font-medium text-[#0F172A] placeholder:font-normal placeholder:text-[#64748B] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="p-1.5 rounded-lg text-[#475569] hover:text-[#071A3B] hover:bg-slate-200/60 transition-colors shrink-0"
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
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                      step <= score ? barColor : 'bg-slate-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-mono text-[11px] font-semibold text-[#475569] shrink-0">
                                {strengthLabel}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </>
                )}

                {/* Terms & Policies shown strictly ONLY during Create Account */}
                {mode === 'signup' && (
                  <div
                    className="animate-form-stagger rounded-xl border border-slate-200/90 bg-[#F6F8FC] p-3.5 space-y-2.5"
                    style={{ '--stagger-delay': '135ms' } as React.CSSProperties}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#071A3B]">
                        <FileText className="w-3.5 h-3.5 text-[#0866F5] shrink-0" />
                        <span>Terms of Service, Privacy &amp; Permissions</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setTermsExpanded((prev) => !prev);
                        }}
                        aria-expanded={termsExpanded}
                        className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#0866F5] hover:text-[#071A3B] transition-colors shrink-0"
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
                      <p className="text-[11.5px] text-[#334155] leading-relaxed line-clamp-1">
                        By creating a Robotera BD account, you grant browser GPS, IP/area
                        location &amp; device permissions viewable by Admin for order security and
                        delivery verification.
                      </p>
                    ) : (
                      <div className="animate-accordion-reveal max-h-44 overflow-y-auto pr-1 space-y-2.5 text-[11.5px] text-[#334155] leading-relaxed border-t border-slate-200 pt-2.5">
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
                            prevent duplicate-promo abuse, and speed up Dhaka/nationwide courier
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
                            2–4 days (৳150), with free courier on orders of ৳3,000+. Components are
                            bench-tested under ESD protocols and carry a 7-day replacement warranty
                            for manufacturing defects (excluding physical damage, reverse polarity,
                            or over-voltage burns).
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
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all duration-200 cursor-pointer select-none ${
                        agreedToTerms
                          ? 'bg-white border-[#0866F5]/50 shadow-2xs'
                          : 'bg-white/70 border-slate-200 hover:border-slate-300'
                      }`}
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
                      <span className="text-[11.5px] font-medium text-[#071A3B] leading-snug">
                        I agree to the Robotera BD Terms &amp; Policies, including sharing GPS,
                        location, and telemetry permissions viewable by Admin.
                      </span>
                    </label>
                  </div>
                )}

                {error && (
                  <div className="animate-slide-down text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
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
                  style={{ '--stagger-delay': '155ms' } as React.CSSProperties}
                  className="animate-form-stagger group cta-sheen w-full h-12 rounded-xl bg-gradient-to-r from-[#0866F5] to-[#0057E7] hover:brightness-110 active:scale-[0.99] border border-[#0866F5] text-white shadow-[0_14px_26px_-10px_rgba(8,102,245,0.52)] transition-all duration-200 disabled:bg-none disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed text-[14px] font-semibold inline-flex items-center justify-center gap-2"
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
                          : authMethod === 'phone'
                          ? otpConfirmation
                            ? 'Verify OTP & Sign In'
                            : 'Send OTP Code'
                          : mode === 'login'
                          ? 'Sign In'
                          : 'Create Account'}
                      </span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                {mode === 'reset' && (
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-[#EEF2F7] hover:bg-[#071A3B] hover:text-white hover:border-[#071A3B] text-xs font-semibold text-[#071A3B] inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                )}
              </form>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[11px] font-mono uppercase tracking-wider">
                  <span className="bg-white px-3 text-[#64748B]">or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || (mode === 'signup' && !agreedToTerms)}
                className="group w-full h-11 rounded-xl bg-white hover:bg-[#F6F8FC] text-[#071A3B] border border-slate-300/90 hover:border-[#071A3B] shadow-2xs hover:-translate-y-0.5 active:scale-[0.99] text-[13.5px] font-semibold inline-flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
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
