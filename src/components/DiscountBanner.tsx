import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { CheckCircle2, Copy, Lock, LogIn, ShieldCheck } from 'lucide-react';
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
        'This 15% welcome offer is only valid on your 1st order. This account already has a completed order.'
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
        'Please enter the exact email address tied to your signed-in account to claim the 1st-order offer.'
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
    <section className="py-10 sm:py-12 bg-white">
      <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10">
        <Reveal direction="up">
          {/* Compact First-Order Offer Banner */}
          <div className="relative overflow-hidden rounded-[22px] sm:rounded-[24px] bg-[#071A3B] bg-gradient-to-br from-[#071A3B] via-[#0B2859] to-[#0866F5] text-white border border-[#1B3E78]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.22)_0%,rgba(6,182,212,0.08)_45%,transparent_72%)]"
            />

            {bannerImageUrl && bannerImageUrl.trim().length > 0 && (
              <div className="relative z-10 w-full bg-[#F5F8FC] border-b border-slate-200/80">
                <img
                  src={bannerImageUrl.trim()}
                  alt="Promotional Lab Discount Banner"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[360px] object-contain block mx-auto"
                />
              </div>
            )}

            <div className="relative z-10 p-5 sm:p-9 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 lg:gap-10 items-center">
              <div className="lg:col-span-6 space-y-3">
                <p className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-300">
                  First-Order Engineering Benefit
                </p>
                <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white leading-tight [text-wrap:balance]">
                  Save 15% on Your First Hardware Order
                </h2>
                <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed max-w-xl">
                  Sign in with your maker or university account and confirm your account email to
                  unlock your 1st-order 15% discount code.
                </p>
              </div>

              <div className="lg:col-span-6">
                {!user ? (
                  <div className="bg-white/[0.08] backdrop-blur-md border border-white/15 rounded-2xl p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5 text-[#60A5FA]" />
                      </div>
                      <div>
                        <h3 className="font-display text-base sm:text-lg font-bold text-white">
                          Sign In to Claim 15% Welcome Offer
                        </h3>
                        <p className="text-xs sm:text-sm text-blue-100/85 mt-1 leading-relaxed">
                          Available exclusively once per verified member account on first checkout.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenAuth}
                      className="w-full h-11 rounded-xl bg-white hover:bg-white/90 border border-white/60 hover:border-white text-[#071A3B] text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <LogIn className="w-4 h-4 text-[#0866F5]" />
                      <span>Sign In to Claim 15% Off</span>
                    </button>
                  </div>
                ) : hasPlacedOrderBefore ? (
                  <div className="bg-white/[0.08] backdrop-blur-md border border-white/15 rounded-2xl p-6 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                      <span className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded bg-white/10 text-slate-200 mb-2">
                        Offer Already Claimed
                      </span>
                      <h3 className="font-display text-lg font-bold text-white">
                        Welcome Benefit Used on Previous Order
                      </h3>
                      <p className="text-xs sm:text-sm text-blue-100/80 mt-1 leading-relaxed">
                        Your account already has a completed order on record. First-order welcome
                        pricing applies strictly to initial orders.
                      </p>
                    </div>
                  </div>
                ) : unlocked ? (
                  <div className="animate-pop-in bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0 mt-0.5" />
                      <div>
                        <span className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200 mb-1.5">
                          Offer Active
                        </span>
                        <h3 className="font-display text-lg font-bold text-white">
                          Ready for Checkout, {name}!
                        </h3>
                        <p className="text-sm text-blue-100 mt-1">
                          Code <strong className="font-mono text-white">ROBOTERA15</strong> has been
                          verified for your account and applied to your cart.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <span className="font-mono text-sm font-bold tracking-wider bg-white text-[#071A3B] px-3.5 py-2 rounded-xl">
                            ROBOTERA15
                          </span>
                          <button
                            type="button"
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0866F5] hover:bg-[#0866F5]/90 border border-[#1685FF]/40 hover:border-white/50 text-white text-xs font-semibold transition-colors"
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
                    className="bg-white/[0.08] backdrop-blur-md border border-white/15 rounded-2xl p-5 sm:p-6 space-y-3.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="discount-name" className="block text-xs font-medium text-blue-100 mb-1.5">
                          Name or University Club
                        </label>
                        <input
                          id="discount-name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. BUET Robotics Team"
                          className="w-full h-10 px-3.5 rounded-xl bg-white text-[#101828] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1685FF]"
                        />
                      </div>
                      <div>
                        <label htmlFor="discount-email" className="block text-xs font-medium text-blue-100 mb-1.5">
                          Verify Signed-In Email
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
                          placeholder="Enter your account email"
                          className="w-full h-10 px-3.5 rounded-xl bg-white text-[#101828] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1685FF]"
                        />
                      </div>
                    </div>
                    {formError && (
                      <p className="text-xs text-red-100 bg-red-500/25 border border-red-300/40 rounded-xl px-3 py-2">
                        {formError}
                      </p>
                    )}
                    <button
                      type="submit"
                      className="w-full h-11 rounded-xl bg-[#071A3B] hover:bg-[#071A3B]/90 text-white border border-white/20 hover:border-white/45 text-sm font-semibold transition-colors"
                    >
                      Claim 15% First-Order Discount
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
