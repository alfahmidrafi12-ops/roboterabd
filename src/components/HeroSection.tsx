import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
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

  const isCustomHeroImg =
    Boolean(siteSettings.heroImageUrl?.trim()) &&
    siteSettings.heroImageUrl?.trim() !== DEFAULT_SITE_SETTINGS.heroImageUrl &&
    heroSrc !== DEFAULT_SITE_SETTINGS.heroImageUrl;

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-[#F7F9FC] border-b border-slate-200/80"
    >
      {/* Dedicated non-overriding background grid & ambient spotlight layers */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -right-24 w-[540px] h-[540px] rounded-full bg-[radial-gradient(circle,rgba(0,87,231,0.13)_0%,rgba(0,87,231,0)_70%)] animate-float-drift"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 w-[440px] h-[440px] rounded-full bg-[radial-gradient(circle,rgba(7,13,25,0.06)_0%,rgba(7,13,25,0)_70%)] animate-ambient-pulse"
      />

      <div className="relative z-10 w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10 py-7 sm:py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-12 items-center">
          {/* Left Narrative Column */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="animate-hero-rise flex items-center gap-2.5 mb-3">
              <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#0057E7] to-blue-400" aria-hidden="true" />
              <p className="text-xs font-mono font-semibold tracking-wider text-[#0057E7]">
                {siteSettings.heroKicker || DEFAULT_SITE_SETTINGS.heroKicker}
              </p>
            </div>

            <h1 className="animate-hero-rise-delay-1 font-display text-[28px] sm:text-4xl lg:text-[50px] font-extrabold text-[#070D19] leading-[1.08] tracking-[-0.03em] [text-wrap:balance]">
              {siteSettings.heroTitle || DEFAULT_SITE_SETTINGS.heroTitle}
            </h1>

            <p className="animate-hero-rise-delay-2 mt-3.5 sm:mt-4 text-sm sm:text-[16px] text-slate-600 max-w-2xl leading-relaxed">
              {siteSettings.heroSubtitle || DEFAULT_SITE_SETTINGS.heroSubtitle}
            </p>

            {/* Primary Store Actions — Glossy Primary & Liquid Glass Secondary */}
            <div className="animate-hero-rise-delay-2 mt-6 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={onShopNow}
                className="btn-glossy-blue group inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span>Shop Hardware</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={onExploreKits}
                className="btn-liquid-glass group inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span>Robotics Kits</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#0057E7] transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>

            {/* Clean Single-Line Store Assurance */}
            <div className="animate-hero-rise-delay-3 mt-6 pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-slate-500">
              <span>Inside Dhaka 2–3 days (৳80)</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Outside Dhaka 2–4 days (৳150)</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Free courier over ৳3,000</span>
            </div>
          </div>

          {/* Right Gallery-Grade Hardware Frame */}
          <div className="lg:col-span-6 animate-hero-rise-delay-2">
            <div className="group animate-float-slow relative p-2 sm:p-3 rounded-[26px] bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-[0_28px_64px_-24px_rgba(7,13,25,0.24)] hover:shadow-[0_34px_74px_-22px_rgba(0,87,231,0.24)] transition-shadow duration-500">
              <div className="w-full rounded-[18px] overflow-hidden bg-[#F8FAFD] flex items-center justify-center relative">
                <img
                  src={heroSrc}
                  alt="Robotera BD — Robotics and Embedded Electronics"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    if (heroSrc !== DEFAULT_SITE_SETTINGS.heroImageUrl) {
                      setHeroSrc(DEFAULT_SITE_SETTINGS.heroImageUrl);
                    }
                  }}
                  className={
                    isCustomHeroImg
                      ? 'w-full h-auto max-h-[440px] object-contain block transition-transform duration-500 group-hover:scale-[1.02]'
                      : 'w-full aspect-[16/10] object-cover object-center block transition-transform duration-500 group-hover:scale-[1.02]'
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
