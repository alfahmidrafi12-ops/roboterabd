import React, { useState } from 'react';
import { CheckCircle2, Copy } from 'lucide-react';

interface DiscountBannerProps {
  bannerImageUrl?: string;
  onApplyCoupon: (code: string) => void;
}

export const DiscountBanner: React.FC<DiscountBannerProps> = ({
  bannerImageUrl,
  onApplyCoupon,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setUnlocked(true);
    onApplyCoupon('ROBOTERA15');
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText('ROBOTERA15').catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="py-10 bg-white">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Organic's Signature Discount Split Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#06142E] via-[#0B224D] to-[#0057E7] text-white p-7 sm:p-11 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {bannerImageUrl && bannerImageUrl.trim().length > 0 && (
            <img
              src={bannerImageUrl}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
            />
          )}
          <div className="relative z-10 lg:col-span-6">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight [text-wrap:balance]">
              Get 15% Discount on Your First Lab Order
            </h2>
            <p className="mt-4 text-sm sm:text-base text-blue-100 leading-relaxed max-w-lg">
              Register your maker profile or university robotics team to unlock 15% off your
              first Robotera BD component checkout plus priority datasheet updates.
            </p>
          </div>

          <div className="relative z-10 lg:col-span-6">
            {unlocked ? (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-display text-lg font-bold">
                      Welcome aboard, {name}!
                    </h3>
                    <p className="text-sm text-blue-100 mt-1">
                      Coupon <strong className="font-mono text-white">ROBOTERA15</strong> has been automatically applied to your cart.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm font-bold tracking-wider bg-white text-[#06142E] px-3.5 py-2 rounded-lg">
                        ROBOTERA15
                      </span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-xs font-semibold transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copied ? 'Copied' : 'Copy Code'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full h-11 px-4 rounded-lg bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label htmlFor="discount-email" className="block text-xs font-medium text-blue-100 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="discount-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="engineer@example.com"
                    className="w-full h-11 px-4 rounded-lg bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-11 rounded-lg bg-[#06142E] hover:bg-slate-900 text-white text-sm font-semibold transition-colors border border-white/15"
                >
                  Unlock 15% Lab Discount
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
