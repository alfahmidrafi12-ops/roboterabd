import React, { useRef, useState } from 'react';
import { Award, Banknote, Check, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Truck } from 'lucide-react';
import { QUICK_SEARCH_TAGS } from '../data/catalog';
import { CategoryId, CategoryItem } from '../types/store';
import { BrandLogo } from './BrandLogo';
import { Reveal } from './Reveal';
import { WHATSAPP_URL } from './WhatsAppButton';

interface FooterSectionProps {
  categories: CategoryItem[];
  onQuickSearch: (term: string) => void;
  onSelectCategory: (id: CategoryId) => void;
  onNavigateSection: (sectionId: string) => void;
  onOpenTracking: () => void;
  onSecretAdminTrigger?: () => void;
}

export const FooterSection: React.FC<FooterSectionProps> = ({
  categories,
  onQuickSearch,
  onSelectCategory,
  onNavigateSection,
  onOpenTracking,
  onSecretAdminTrigger,
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const tapCounterRef = useRef<{ count: number; timer: number | null }>({ count: 0, timer: null });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribed(true);
    setNewsletterEmail('');
  };

  const handleSecretTap = () => {
    if (!onSecretAdminTrigger) return;
    const state = tapCounterRef.current;
    state.count += 1;
    if (state.timer) window.clearTimeout(state.timer);
    if (state.count >= 3) {
      state.count = 0;
      onSecretAdminTrigger();
      return;
    }
    state.timer = window.setTimeout(() => {
      state.count = 0;
    }, 900);
  };

  return (
    <footer className="bg-white min-[1500px]:bg-transparent min-[1500px]:pointer-events-none border-t border-slate-200/90 min-[1500px]:border-t-0">
      {/* Popular Engineering Queries & Store Guarantees */}
      <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-white min-[1500px]:border-x min-[1500px]:border-t min-[1500px]:border-slate-200/90 px-4 sm:px-6 lg:px-10 py-11 border-b border-slate-200/80">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="font-hero text-lg sm:text-xl font-extrabold text-[#071A3D] tracking-tight">
              Popular Hardware Searches
            </h2>
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748B]">
              Quick Catalog Filters
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_SEARCH_TAGS.map((term) => (
              <a
                key={term}
                href={`/shop?q=${encodeURIComponent(term)}`}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  onQuickSearch(term);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#F3F7FC] hover:bg-[#087BFF] text-[#071A3D] hover:text-white text-xs sm:text-sm font-medium border border-slate-200/90 hover:border-[#087BFF] transition-colors whitespace-nowrap"
              >
                {term}
              </a>
            ))}
          </div>
        </Reveal>

        {/* Store Guarantees */}
        <div className="mt-10 pt-10 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-slate-200/80">
          {[
            {
              icon: Truck,
              title: 'Nationwide Delivery',
              desc: 'Inside Dhaka: 2–3 days (৳80) · Outside Dhaka: 2–4 days (৳150).',
            },
            {
              icon: ShieldCheck,
              title: '100% Authentic Hardware',
              desc: 'Direct-sourced MCUs, LiDAR, and power ICs with ESD-safe packaging.',
            },
            {
              icon: Award,
              title: '7-Day Lab Replacement',
              desc: 'Instant hardware replacement for verified manufacturing defects.',
            },
            {
              icon: Banknote,
              title: 'bKash, Nagad & COD',
              desc: 'Pay securely via mobile banking, SSLCommerz cards, or Cash on Delivery.',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delayMs={idx * 55}>
                <div className={`group flex items-start gap-3.5 ${idx === 0 ? 'lg:pr-6' : 'lg:px-6'}`}>
                  <div className="w-10 h-10 rounded-xl bg-[#F3F7FC] border border-slate-200/80 group-hover:border-[#087BFF]/40 group-hover:bg-[#087BFF]/10 flex items-center justify-center shrink-0 transition-colors">
                    <Icon className="w-5 h-5 text-[#087BFF]" strokeWidth={1.85} />
                  </div>
                  <div>
                    <h3 className="font-hero text-sm font-bold text-[#071A3D]">{item.title}</h3>
                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Multi-Column Deep Navy Footer */}
      <div className="relative z-20 pointer-events-auto bg-gradient-to-b from-[#071A3D] to-[#05122B] text-slate-300 border-t border-[#087BFF]/20">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <div className="font-hero text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <BrandLogo
                size="sm"
                className="border-white/20 shadow-[0_6px_16px_-4px_rgba(8,123,255,0.45)]"
              />
              <span className="tracking-tight">
                ROBOTERA <span className="text-[#00CFFF]">BD</span>
              </span>
            </div>
            <p className="text-sm text-slate-300/90 leading-relaxed max-w-sm">
              Bangladesh&apos;s flagship engineering marketplace for university robotics labs, R&amp;D
              teams, and embedded hardware developers.
            </p>
            <div className="space-y-2.5 text-xs text-slate-300 pt-1">
              <p className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#00CFFF] shrink-0" />
                <span>Level 4, Multiplan &amp; Mirpur-10 Robotics Hub, Dhaka 1216</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#00CFFF] shrink-0" />
                <a href="tel:+8801624987366" className="font-mono hover:text-white transition-colors">
                  +880 1624-987366
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp Engineering Support (+880 1624-987366)
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#00CFFF] shrink-0" />
                <span>support@roboterabd.com</span>
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-hero text-sm font-bold text-white mb-4">Hardware Categories</h3>
            <ul className="space-y-2.5 text-sm text-slate-300/90">
              {categories
                .filter((c) => c.active !== false)
                .slice(0, 8)
                .map((cat) => (
                  <li key={cat.id}>
                    <a
                      href={`/category/${encodeURIComponent(cat.id)}`}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                        e.preventDefault();
                        onSelectCategory(cat.id);
                      }}
                      className="hover:text-[#00CFFF] transition-colors text-left inline-block"
                    >
                      {cat.name}
                    </a>
                  </li>
                ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-hero text-sm font-bold text-white mb-4">Customer Support</h3>
            <ul className="space-y-2.5 text-sm text-slate-300/90">
              <li>
                <a
                  href="/shop"
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                    e.preventDefault();
                    onNavigateSection('best-selling');
                  }}
                  className="hover:text-[#00CFFF] transition-colors inline-block"
                >
                  Shop Hardware
                </a>
              </li>
              <li>
                <a
                  href="/just-arrived"
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                    e.preventDefault();
                    onNavigateSection('just-arrived');
                  }}
                  className="hover:text-[#00CFFF] transition-colors inline-block"
                >
                  New Arrivals
                </a>
              </li>
              <li>
                <a
                  href="/bundles"
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                    e.preventDefault();
                    onNavigateSection('bundles');
                  }}
                  className="hover:text-[#00CFFF] transition-colors inline-block"
                >
                  Robotics Kits
                </a>
              </li>
              <li>
                <a
                  href="/track-order"
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                    e.preventDefault();
                    onOpenTracking();
                  }}
                  className="hover:text-[#00CFFF] transition-colors inline-block"
                >
                  Track Order
                </a>
              </li>
              <li>
                <a
                  href="/guides"
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                    e.preventDefault();
                    onNavigateSection('lab-guides');
                  }}
                  className="hover:text-[#00CFFF] transition-colors inline-block"
                >
                  Engineering Guides
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4 space-y-5">
            <div>
              <h3 className="font-hero text-sm font-bold text-white mb-2">
                Stock &amp; Datasheet Alerts
              </h3>
              <p className="text-xs text-slate-300/85 leading-relaxed mb-3.5">
                Get notified when new STM32, Jetson, and LiDAR shipments arrive at our Dhaka hub.
              </p>
              {subscribed ? (
                <div className="flex items-center gap-2 text-xs text-[#00CFFF] bg-white/[0.06] border border-[#00CFFF]/25 rounded-xl px-4 py-3">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Subscribed to Robotera BD shipment alerts.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 min-w-0 h-10 px-3.5 rounded-xl bg-white/[0.08] border border-white/15 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00CFFF]"
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-xl bg-[#087BFF] hover:bg-[#0066DB] text-white text-xs font-semibold shadow-[0_10px_24px_-8px_rgba(8,123,255,0.55)] transition-colors whitespace-nowrap shrink-0"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>

            <div className="pt-2">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5">
                Accepted Payment Channels
              </p>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono font-semibold text-white">
                {['bKash', 'Nagad', 'SSLCommerz', 'Cash on Delivery'].map((ch) => (
                  <span
                    key={ch}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.07] border border-white/10"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p onClick={handleSecretTap} className="select-none cursor-default">
              © {new Date().getFullYear()} Robotera BD. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <span>Shipping: Dhaka 2–3d (৳80) · Outside 2–4d (৳150) · 7-Day Returns</span>
              {onSecretAdminTrigger && (
                <button
                  type="button"
                  onClick={onSecretAdminTrigger}
                  className="text-slate-300 hover:text-white font-semibold underline underline-offset-4 transition-colors whitespace-nowrap"
                >
                  Admin Panel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
