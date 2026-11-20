import React, { useRef, useState } from 'react';
import { Award, Banknote, Check, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Truck } from 'lucide-react';
import { QUICK_SEARCH_TAGS } from '../data/catalog';
import { CategoryId, CategoryItem } from '../types/store';
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
    <footer className="bg-white min-[1500px]:bg-transparent min-[1500px]:pointer-events-none border-t border-slate-300 min-[1500px]:border-t-0">
      {/* Popular Engineering Queries & Store Guarantees */}
      <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-white min-[1500px]:border-x min-[1500px]:border-t min-[1500px]:border-slate-300/90 px-4 sm:px-6 lg:px-10 py-10 border-b border-slate-300/80">
        <Reveal>
          <h2 className="font-display text-lg sm:text-xl font-bold text-[#071A3B] mb-4">
            Popular Hardware Searches
          </h2>
          <div className="flex flex-wrap gap-2">
            {QUICK_SEARCH_TAGS.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onQuickSearch(term)}
                className="px-3.5 py-2 rounded-xl bg-[#EDF2F8] hover:bg-[#0866F5] text-[#0F172A] hover:text-white text-xs sm:text-sm font-medium border border-slate-300/90 hover:border-[#0866F5] transition-colors whitespace-nowrap"
              >
                {term}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Store Guarantees */}
        <div className="mt-10 pt-10 border-t border-slate-300/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-slate-300/85">
          {[
            {
              icon: Truck,
              title: 'Nationwide Delivery',
              desc: 'Inside Dhaka: 2–3 days (৳80) · Outside Dhaka: 2–4 days (৳150). Free over ৳3,000.',
              iconColor: 'text-[#0F766E]',
            },
            {
              icon: ShieldCheck,
              title: '100% Authentic Hardware',
              desc: 'Direct-sourced MCUs, LiDAR, and power ICs with ESD-safe packaging.',
              iconColor: 'text-[#0866F5]',
            },
            {
              icon: Award,
              title: '7-Day Lab Replacement',
              desc: 'Instant hardware replacement for verified manufacturing defects.',
              iconColor: 'text-[#C2410C]',
            },
            {
              icon: Banknote,
              title: 'bKash, Nagad & COD',
              desc: 'Pay securely via mobile banking, SSLCommerz cards, or Cash on Delivery.',
              iconColor: 'text-[#0F766E]',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delayMs={idx * 55}>
                <div className={`group flex items-start gap-3 ${idx === 0 ? 'lg:pr-6' : 'lg:px-6'}`}>
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${item.iconColor}`} strokeWidth={1.75} />
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#071A3B]">{item.title}</h3>
                    <p className="text-xs text-[#475569] mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Multi-Column Deep Navy Footer */}
      <div className="relative z-20 pointer-events-auto bg-[#071A3B] text-slate-300">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <div className="font-display text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#0866F5] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" aria-hidden="true">
                  <rect x="6" y="6" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" />
                </svg>
              </span>
              <span className="flex items-center gap-1.5">
                <span>ROBOTERA</span>
                <span className="bg-[#0866F5] text-white text-xs font-mono font-bold px-1.5 py-0.5 rounded">
                  BD
                </span>
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Bangladesh&apos;s flagship engineering marketplace for university robotics labs, R&amp;D
              teams, and embedded hardware developers.
            </p>
            <div className="space-y-2 text-xs text-slate-300 pt-1">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#1685FF] shrink-0" />
                <span>Level 4, Multiplan &amp; Mirpur-10 Robotics Hub, Dhaka 1216</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#1685FF] shrink-0" />
                <a href="tel:+8801624987366" className="font-mono hover:text-white transition-colors">
                  +880 1624-987366
                </a>
              </p>
              <p className="flex items-center gap-2">
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
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#1685FF] shrink-0" />
                <span>support@roboterabd.com</span>
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-display text-sm font-bold text-white mb-4">Hardware Categories</h3>
            <ul className="space-y-2.5 text-sm">
              {categories
                .filter((c) => c.active !== false)
                .slice(0, 6)
                .map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => onSelectCategory(cat.id)}
                      className="hover:text-white transition-colors text-left"
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-display text-sm font-bold text-white mb-4">Customer Support</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button type="button" onClick={() => onNavigateSection('best-selling')} className="hover:text-white transition-colors">
                  Shop Hardware
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigateSection('just-arrived')} className="hover:text-white transition-colors">
                  New Arrivals
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigateSection('bundles')} className="hover:text-white transition-colors">
                  Robotics Kits
                </button>
              </li>
              <li>
                <button type="button" onClick={onOpenTracking} className="hover:text-white transition-colors">
                  Track Order
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigateSection('lab-guides')} className="hover:text-white transition-colors">
                  Engineering Guides
                </button>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4 space-y-5">
            <div>
              <h3 className="font-display text-sm font-bold text-white mb-2">
                Stock &amp; Datasheet Alerts
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-3.5">
                Get notified when new STM32, Jetson, and LiDAR shipments arrive at our Dhaka hub.
              </p>
              {subscribed ? (
                <div className="flex items-center gap-2 text-xs text-emerald-300 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
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
                    className="flex-1 min-w-0 h-10 px-3.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1685FF]"
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-xl bg-[#0866F5] hover:bg-[#1685FF] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>

            <div className="pt-2">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                Accepted Payment Channels
              </p>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono font-semibold text-white">
                {['bKash', 'Nagad', 'SSLCommerz', 'Cash on Delivery'].map((ch) => (
                  <span
                    key={ch}
                    className="px-2.5 py-1 rounded-md bg-white/[0.08] border border-white/10"
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
