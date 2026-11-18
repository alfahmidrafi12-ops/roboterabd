import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { CheckCircle2, Copy, Lock, LogIn } from 'lucide-react';
import { Reveal } from './Reveal';

interface DiscountBannerProps {
  bannerImageUrl?: string;
  user: User | null;
  hasPlacedOrderBefore: boolean;
  onOpenAuth: () => void;
  onApplyCoupon: (code: string) => void;
}

export const DiscountBanner: React.FC<DiscountBannerProps> = ({
  bannerImageUrl,
  user,
  hasPlacedOrderBefore,
  onOpenAuth,
  onApplyCoupon,
}) => {
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setFormError('');
    if (!user) {
      setUnlocked(false);
      setEmail('');
    } else if (user.displayName && !name) {
      setName(user.displayName);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!user || !user.email) {
      onOpenAuth();
      return;
    }

    if (hasPlacedOrderBefore) {
      setFormError(
        'This 15% welcome offer is only valid on your 1st order. Your account already has a previous order.'
      );
      return;
    }

    const trimmedName = name.trim();
    const enteredEmail = email.trim().toLowerCase();
    const signedInEmail = user.email.trim().toLowerCase();

    if (!trimmedName) {
      setFormError('Please enter your full name or university club.');
      return;
    }

    if (!enteredEmail || enteredEmail !== signedInEmail) {
      setFormError(
        `Only your signed-in account email (${user.email}) can unlock the 1st-order 15% discount.`
      );
      return;
    }

    setUnlocked(true);
    onApplyCoupon('ROBOTERA15');
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText('ROBOTERA15').catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="py-8 sm:py-12 bg-white">
      <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10">
        <Reveal direction="up">
          {/* Flagship Lab Membership & First-Order Discount Card */}
          <div className="relative overflow-hidden rounded-[24px] bg-[#060D1C] bg-gradient-to-br from-[#060D1C] via-[#0C1D42] to-[#0057E7] text-white border border-[#183164] shadow-[0_24px_54px_-24px_rgba(7,13,25,0.5)]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-400/18 blur-3xl animate-float-drift"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-cyan-400/10 blur-3xl animate-ambient-pulse"
            />

            {bannerImageUrl && bannerImageUrl.trim().length > 0 && (
              <div className="relative z-10 w-full bg-[#F8FAFD] border-b border-slate-200/80">
                <img
                  src={bannerImageUrl.trim()}
                  alt="Promotional Lab Discount Banner"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[400px] object-contain block mx-auto"
                />
              </div>
            )}

            <div className="relative z-10 p-6 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-6">
                <p className="text-xs font-mono font-semibold text-blue-300 mb-2">
                  Maker &amp; University Lab Offer · First Order Only
                </p>
                <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white leading-tight [text-wrap:balance]">
                  Get 15% Discount on Your First Lab Order
                </h2>
                <p className="mt-4 text-sm sm:text-base text-blue-100/90 leading-relaxed max-w-xl">
                  Sign in with your account and verify using your signed-in email address to
                  unlock 15% off your very first Robotera BD order.
                </p>
              </div>

              <div className="lg:col-span-6">
                {!user ? (
                  <div className="bg-white/[0.08] backdrop-blur-md border border-white/15 rounded-2xl p-6 sm:p-7 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5 text-blue-300" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-bold text-white">
                          Sign In Required for 15% Welcome Offer
                        </h3>
                        <p className="text-xs sm:text-sm text-blue-100/85 mt-1 leading-relaxed">
                          To prevent duplicate coupon claims, the 1st-order 15% discount only
                          activates for signed-in accounts using their verified login email.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenAuth}
                      className="btn-liquid-glass w-full h-12 rounded-2xl text-sm font-bold inline-flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4 text-[#0057E7]" />
                      <span>Sign In / Create Account to Claim 15%</span>
                    </button>
                  </div>
                ) : hasPlacedOrderBefore ? (
                  <div className="bg-white/[0.08] backdrop-blur-md border border-white/15 rounded-2xl p-6 space-y-2">
                    <h3 className="font-display text-lg font-bold text-white">
                      1st-Order Welcome Discount Already Used
                    </h3>
                    <p className="text-sm text-blue-100/85 leading-relaxed">
                      Signed in as <strong className="font-mono text-white">{user.email}</strong>.
                      This account already has an order on record, and the 15% offer applies
                      exclusively to first-time orders.
                    </p>
                  </div>
                ) : unlocked ? (
                  <div className="animate-pop-in bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-display text-lg font-bold text-white">
                          Welcome aboard, {name}!
                        </h3>
                        <p className="text-sm text-blue-100 mt-1">
                          Coupon <strong className="font-mono text-white">ROBOTERA15</strong> is
                          verified for <strong className="font-mono text-white">{user.email}</strong> and
                          applied to your cart.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <span className="font-mono text-sm font-bold tracking-wider bg-white text-[#070D19] px-3.5 py-2 rounded-xl">
                            ROBOTERA15
                          </span>
                          <button
                            type="button"
                            onClick={handleCopy}
                            className="btn-glossy-blue inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copied ? 'Copied' : 'Copy Code'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="bg-white/[0.08] backdrop-blur-md border border-white/15 rounded-2xl p-5 sm:p-6 space-y-4"
                  >
                    <div>
                      <label htmlFor="discount-name" className="block text-xs font-medium text-blue-100 mb-1.5">
                        Full Name or University Club
                      </label>
                      <input
                        id="discount-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Tariqul Islam · BUET Robotics Club"
                        className="w-full h-11 px-4 rounded-xl bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                    <div>
                      <label htmlFor="discount-email" className="block text-xs font-medium text-blue-100 mb-1.5">
                        Confirm Your Signed-In Email
                      </label>
                      <input
                        id="discount-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (formError) setFormError('');
                        }}
                        placeholder={user.email || 'Enter your signed-in email'}
                        className="w-full h-11 px-4 rounded-xl bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <p className="mt-1.5 text-[11px] text-blue-200/85">
                        Must match your signed-in account email ({user.email}).
                      </p>
                    </div>
                    {formError && (
                      <p className="text-xs text-red-100 bg-red-500/25 border border-red-300/40 rounded-xl px-3 py-2">
                        {formError}
                      </p>
                    )}
                    <button
                      type="submit"
                      className="btn-glossy-dark w-full h-12 rounded-2xl text-sm font-semibold"
                    >
                      Unlock 15% First-Order Discount
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
