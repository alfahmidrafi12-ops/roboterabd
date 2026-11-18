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
    <footer className="bg-white border-t border-slate-200">
      {/* Organic's "People are also looking for" Quick Search Bar */}
      <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10 py-10 border-b border-slate-200">
        <Reveal>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#06142E] mb-4">
            People are also looking for
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {QUICK_SEARCH_TAGS.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onQuickSearch(term)}
                className="px-3.5 py-2 rounded-xl bg-[#F4F7FB] hover:bg-[#0057E7] text-slate-700 hover:text-white text-xs sm:text-sm font-medium border border-slate-200/80 hover:border-[#0057E7] hover:-translate-y-0.5 active:scale-[0.97] transition-all whitespace-nowrap"
              >
                {term}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Store Guarantees */}
        <div className="mt-10 pt-10 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Truck,
              title: 'Nationwide Delivery',
              desc: 'Inside Dhaka: 2–3 days (৳80) · Outside Dhaka: 2–4 days (৳150). Free over ৳3,000.',
            },
            {
              icon: ShieldCheck,
              title: '100% Genuine Components',
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
              desc: 'Pay securely via mobile banking or Cash on Delivery at your doorstep.',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delayMs={idx * 65}>
                <div className="group flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] text-[#0057E7] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#06142E]">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Multi-Column Store Footer */}
      <div className="bg-[#070D19] text-slate-300">
        <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <div className="font-display text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <span>ROBOTERA</span>
              <span className="bg-[#0057E7] text-white text-xs font-bold px-1.5 py-0.5 rounded">BD</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Bangladesh&apos;s trusted supply partner for university robotics teams, R&amp;D labs,
              and embedded hardware engineers.
            </p>
            <div className="space-y-2 text-xs text-slate-400 pt-1">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Level 4, Multiplan &amp; Mirpur-10 Robotics Hub, Dhaka 1216</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
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
                  WhatsApp Support (+880 1624-987366)
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>support@roboterabd.com</span>
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-display text-sm font-bold text-white mb-4">Departments</h3>
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
            <h3 className="font-display text-sm font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button type="button" onClick={() => onNavigateSection('best-selling')} className="hover:text-white transition-colors">
                  Best Sellers
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigateSection('just-arrived')} className="hover:text-white transition-colors">
                  New Arrivals
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigateSection('bundles')} className="hover:text-white transition-colors">
                  Lab Bundles
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

          <div className="lg:col-span-4">
            <h3 className="font-display text-sm font-bold text-white mb-2">Stock &amp; Datasheet Alerts</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Get notified when new STM32, Jetson, and LiDAR shipments arrive at our Dhaka warehouse.
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
                  className="flex-1 min-w-0 h-10 px-3.5 rounded-lg bg-white/10 border border-white/15 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="btn-glossy-blue h-10 px-4 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p onClick={handleSecretTap} className="select-none cursor-default">
              © {new Date().getFullYear()} Robotera BD. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <p>Dhaka, Bangladesh · Robotics, IoT &amp; Embedded Electronics</p>
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
