import React, { useEffect, useState } from 'react';
import { ArrowRight, Cpu, ShieldCheck, Truck } from 'lucide-react';
import { DEFAULT_SITE_SETTINGS } from '../data/catalog';
import { SiteImagesConfig } from '../types/store';

interface HeroSectionProps {
  siteSettings?: SiteImagesConfig;
  onShopNow: () => void;
  onExploreKits: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  siteSettings = DEFAULT_SITE_SETTINGS,
  onShopNow,
  onExploreKits,
}) => {
  const configuredHeroImg = siteSettings.heroImageUrl?.trim() || DEFAULT_SITE_SETTINGS.heroImageUrl;
  const [heroSrc, setHeroSrc] = useState(configuredHeroImg);

  useEffect(() => {
    setHeroSrc(configuredHeroImg);
  }, [configuredHeroImg]);

  return (
    <section id="top" className="bg-[#F4F7FB] border-b border-slate-200/80">
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 pt-6 pb-9 lg:pt-12 lg:pb-14">
        {/* Main Split Hero Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-stretch">
          {/* Left Narrative Column */}
          <div className="lg:col-span-6 flex flex-col justify-center py-1 sm:py-2">
            <p className="text-xs sm:text-sm font-semibold text-[#0057E7] mb-2.5 tracking-wide">
              {siteSettings.heroKicker || DEFAULT_SITE_SETTINGS.heroKicker}
            </p>
            <h1 className="font-display text-3xl sm:text-5xl lg:text-[54px] font-extrabold text-[#06142E] leading-[1.1] tracking-tight [text-wrap:balance]">
              {siteSettings.heroTitle || DEFAULT_SITE_SETTINGS.heroTitle}
            </h1>
            <p className="mt-4 sm:mt-5 text-sm sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              {siteSettings.heroSubtitle || DEFAULT_SITE_SETTINGS.heroSubtitle}
            </p>

            {/* Key Store Metrics */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 sm:gap-x-8 gap-y-2.5 text-xs sm:text-sm text-slate-700 border-y border-slate-200/90 py-3.5 sm:py-4">
              <div>
                <span className="font-display text-lg sm:text-xl font-bold text-[#06142E] tabular-nums">
                  1,200+
                </span>
                <span className="ml-1.5 sm:ml-2 text-slate-500">Active SKUs</span>
              </div>
              <div className="h-4 w-px bg-slate-300 hidden sm:block" aria-hidden="true" />
              <div>
                <span className="font-display text-lg sm:text-xl font-bold text-[#06142E] tabular-nums">
                  64
                </span>
                <span className="ml-1.5 sm:ml-2 text-slate-500">Districts Delivery</span>
              </div>
              <div className="h-4 w-px bg-slate-300 hidden sm:block" aria-hidden="true" />
              <div>
                <span className="font-display text-lg sm:text-xl font-bold text-[#06142E] tabular-nums">
                  100%
                </span>
                <span className="ml-1.5 sm:ml-2 text-slate-500">Lab Tested Boards</span>
              </div>
            </div>

            {/* Hero Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onShopNow}
                className="inline-flex items-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span>Shop Components</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onExploreKits}
                className="inline-flex items-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 rounded-lg bg-[#06142E] hover:bg-slate-800 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                <span>Explore Robotics Kits</span>
              </button>
            </div>
          </div>

          {/* Right Brand Showcase Column */}
          <div className="lg:col-span-6 flex">
            <div className="relative w-full rounded-2xl overflow-hidden bg-[#06142E] border border-slate-200 shadow-sm flex flex-col justify-between aspect-video lg:aspect-auto lg:min-h-[360px]">
              <img
                src={heroSrc}
                alt="Robotera BD — Robotics and Embedded Electronics Brand"
                referrerPolicy="no-referrer"
                onError={() => {
                  if (heroSrc !== DEFAULT_SITE_SETTINGS.heroImageUrl) {
                    setHeroSrc(DEFAULT_SITE_SETTINGS.heroImageUrl);
                  }
                }}
                className="w-full h-full object-cover object-center lg:h-full"
              />
              <div className="flex absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#06142E]/95 via-[#06142E]/65 to-transparent p-4 sm:p-6 items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-mono text-blue-300 truncate">
                    {siteSettings.heroTagline || DEFAULT_SITE_SETTINGS.heroTagline}
                  </p>
                  <p className="text-xs sm:text-base font-semibold text-white mt-0.5 truncate">
                    {siteSettings.heroDispatchText || DEFAULT_SITE_SETTINGS.heroDispatchText}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onShopNow}
                  className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-white text-[#06142E] text-xs font-bold hover:bg-blue-50 transition-colors whitespace-nowrap shrink-0"
                >
                  Browse Stock
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Card Value Bar at Hero Base */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#06142E] text-white rounded-xl p-5 flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-[#0057E7] flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold">Authentic &amp; Bench-Tested</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Every MCU, LiDAR, and driver IC is verified on our Dhaka test rig prior to dispatch.
              </p>
            </div>
          </div>

          <div className="bg-[#0057E7] text-white rounded-xl p-5 flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold">Free Delivery Over ৳3,000</h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 leading-relaxed">
                Same-day rider inside Dhaka Metro and 24–48 hour Steadfast / Pathao nationwide shipping.
              </p>
            </div>
          </div>

          <div className="bg-white text-[#06142E] rounded-xl p-5 border border-slate-200 flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-[#F4F7FB] border border-slate-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#0057E7]" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold">7-Day Replacement Warranty</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Hassle-free DOA swap plus direct wiring &amp; firmware guidance from mechatronics engineers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
