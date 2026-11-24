import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { CheckCircle2, Copy, Lock, LogIn, ShieldCheck } from 'lucide-react';
import { DEFAULT_PROMO_CODES } from '../data/catalog';
import { checkUserPromoRedemption } from '../lib/firebase';
import { playErrorSound, playSuccessSound, playTapSound } from '../lib/sound';
import { PromoCode } from '../types/store';
import { Reveal } from './Reveal';

interface DiscountBannerProps {
  bannerImageUrl?: string;
  promoCodes?: PromoCode[];
  user: User | null;
  hasPlacedOrderBefore: boolean;
  onOpenAuth: () => void;
  onApplyCoupon: (code: string) => void;
}

export const DiscountBanner: React.FC<DiscountBannerProps> = ({
  bannerImageUrl,
  promoCodes = DEFAULT_PROMO_CODES,
  user,
  hasPlacedOrderBefore,
  onOpenAuth,
  onApplyCoupon,
}) => {
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [alreadyRedeemed, setAlreadyRedeemed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  const featuredPromo =
    promoCodes.find((p) => p.active && p.firstOrderOnly) ??
    promoCodes.find((p) => p.active && p.code === 'ROBOTERA15') ??
    DEFAULT_PROMO_CODES[0];

  const promoLabel =
    featuredPromo.discountType === 'percent'
      ? `${featuredPromo.discountValue}%`
      : `৳${featuredPromo.discountValue.toLocaleString('en-IN')}`;

  useEffect(() => {
    setFormError('');
    if (!user) {
      setUnlocked(false);
      setAlreadyRedeemed(false);
      setEmail('');
      return;
    }
    if (user.displayName && !name) {
      setName(user.displayName);
    }
    let active = true;
    checkUserPromoRedemption(featuredPromo.code, user.uid, user.email).then((used) => {
      if (active) setAlreadyRedeemed(used);
    });
    return () => {
      active = false;
    };
  }, [user, featuredPromo.code]);

  const isOfferBlocked =
    alreadyRedeemed || (Boolean(featuredPromo.firstOrderOnly) && hasPlacedOrderBefore);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checking) return;
    setFormError('');

    if (!user || (!user.email && !user.phoneNumber)) {
      playTapSound();
      onOpenAuth();
      return;
    }

    if (isOfferBlocked) {
      playErrorSound();
      setFormError(
        `Promo code ${featuredPromo.code} is limited to 1 use per verified account.`
      );
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      playErrorSound();
      setFormError('Please enter your full name or university club.');
      return;
    }

    if (user.email) {
      const enteredEmail = email.trim().toLowerCase();
      const signedInEmail = user.email.trim().toLowerCase();
      if (!enteredEmail || enteredEmail !== signedInEmail) {
        playErrorSound();
        setFormError(
          'Please enter the exact email address tied to your signed-in account to claim the welcome offer.'
        );
        return;
      }
    }

    setChecking(true);
    try {
      const used = await checkUserPromoRedemption(featuredPromo.code, user.uid, user.email);
      if (used) {
        playErrorSound();
        setAlreadyRedeemed(true);
        setFormError(
          `Promo code ${featuredPromo.code} has already been used by this account or Gmail address.`
        );
        return;
      }
      playSuccessSound();
      setUnlocked(true);
      onApplyCoupon(featuredPromo.code);
    } finally {
      setChecking(false);
    }
  };

  const handleCopy = () => {
    playTapSound();
    navigator.clipboard?.writeText(featuredPromo.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section id="first-order" className="scroll-mt-[108px] bg-white min-[1500px]:bg-transparent min-[1500px]:pointer-events-none">
      <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-white min-[1500px]:border-x min-[1500px]:border-slate-200/90 px-4 sm:px-6 lg:px-10 py-11 sm:py-14">
        <Reveal direction="up">
          {/* Flagship First-Order Engineering Benefit Card */}
          <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#061530] via-[#09204A] to-[#0A295E] text-white border border-[#087BFF]/30 shadow-[0_24px_60px_-24px_rgba(7,26,61,0.45)]">
            <div aria-hidden="true" className="animate-signal-sweep pointer-events-none absolute top-0 left-0 right-0 h-px z-10" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-50" />
            <div
              aria-hidden="true"
              className="animate-float-drift pointer-events-none absolute -top-24 -right-20 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(0,207,255,0.20)_0%,rgba(8,123,255,0.12)_42%,transparent_72%)]"
            />
            <div
              aria-hidden="true"
              className="animate-ambient-pulse pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(8,123,255,0.22)_0%,transparent_68%)]"
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

            <div className="relative z-10 p-6 sm:p-9 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center">
              <div className="lg:col-span-6 space-y-3.5">
                <p className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[#00CFFF]">
                  First-Order Engineering Benefit
                </p>
                <h2 className="font-hero text-2xl sm:text-4xl font-extrabold text-white leading-[1.12] tracking-tight [text-wrap:balance]">
                  Save {promoLabel} on Your First Hardware Order
                </h2>
                <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed max-w-xl">
                  Sign in with your maker Gmail or account and verify your email to unlock your
                  single-use {promoLabel} discount code at checkout.
                </p>
              </div>

              <div className="lg:col-span-6">
                {!user ? (
                  <div className="bg-white/[0.06] backdrop-blur-md border border-white/15 rounded-2xl p-6 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#087BFF]/20 border border-[#00CFFF]/30 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5 text-[#00CFFF]" />
                      </div>
                      <div>
                        <h3 className="font-hero text-base sm:text-lg font-bold text-white">
                          Sign In to Claim {promoLabel} Welcome Offer
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                          Strictly limited to once per verified account &amp; Gmail address.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        onOpenAuth();
                      }}
                      className="cta-sheen active:scale-[0.98] w-full h-11 rounded-xl bg-white hover:bg-[#F3F7FC] text-[#071A3D] text-sm font-bold inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(255,255,255,0.25)] transition-all"
                    >
                      <LogIn className="w-4 h-4 text-[#087BFF]" />
                      <span>Sign In to Claim {promoLabel} Off</span>
                    </button>
                  </div>
                ) : isOfferBlocked ? (
                  <div className="bg-white/[0.06] backdrop-blur-md border border-white/15 rounded-2xl p-6 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                      <span className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded bg-white/10 text-slate-200 mb-2">
                        Offer Already Claimed
                      </span>
                      <h3 className="font-hero text-lg font-bold text-white">
                        Welcome Benefit Used on Previous Order
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                        Your account or Gmail address already redeemed this offer on record. Promo codes apply strictly once per Gmail and account.
                      </p>
                    </div>
                  </div>
                ) : unlocked ? (
                  <div className="animate-pop-in bg-white/[0.08] backdrop-blur-md border border-[#00CFFF]/30 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-[#00CFFF] shrink-0 mt-0.5" />
                      <div>
                        <span className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#00CFFF]/15 text-[#00CFFF] mb-1.5">
                          Offer Active
                        </span>
                        <h3 className="font-hero text-lg font-bold text-white">
                          Ready for Checkout, {name}!
                        </h3>
                        <p className="text-sm text-slate-200 mt-1">
                          Code <strong className="font-mono text-white">{featuredPromo.code}</strong> has been
                          verified for your account and applied to your cart.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <span className="font-mono text-sm font-bold tracking-wider bg-white text-[#071A3D] px-3.5 py-2 rounded-xl">
                            {featuredPromo.code}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopy}
                            className="cta-sheen active:scale-95 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#087BFF] hover:bg-[#0066DB] text-white text-xs font-semibold shadow-[0_8px_20px_-6px_rgba(8,123,255,0.5)] transition-all"
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
                    className="bg-white/[0.06] backdrop-blur-md border border-white/15 rounded-2xl p-5 sm:p-6 space-y-3.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="discount-name" className="block text-xs font-medium text-slate-200 mb-1.5">
                          Name or University Club
                        </label>
                        <input
                          id="discount-name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. BUET Robotics Team"
                          className="w-full h-10 px-3.5 rounded-xl bg-white text-[#071A3D] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00CFFF]"
                        />
                      </div>
                      <div>
                        {user.email ? (
                          <>
                            <label htmlFor="discount-email" className="block text-xs font-medium text-slate-200 mb-1.5">
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
                              className="w-full h-10 px-3.5 rounded-xl bg-white text-[#071A3D] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00CFFF]"
                            />
                          </>
                        ) : (
                          <>
                            <span className="block text-xs font-medium text-slate-200 mb-1.5">
                              Verified Mobile Account
                            </span>
                            <div className="w-full h-10 px-3.5 rounded-xl bg-white/10 border border-white/25 text-white text-sm font-mono flex items-center">
                              {user.phoneNumber}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {formError && (
                      <p className="text-xs text-red-100 bg-red-500/25 border border-red-300/40 rounded-xl px-3 py-2">
                        {formError}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={checking}
                      className="cta-sheen active:scale-[0.98] w-full h-11 rounded-xl bg-[#087BFF] hover:bg-[#0066DB] disabled:opacity-60 text-white text-sm font-semibold shadow-[0_12px_28px_-8px_rgba(8,123,255,0.55)] transition-all"
                    >
                      {checking ? 'Verifying Eligibility...' : `Claim ${promoLabel} First-Order Discount`}
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
