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

  const isCustomHeroImg =
    Boolean(siteSettings.heroImageUrl?.trim()) &&
    siteSettings.heroImageUrl?.trim() !== DEFAULT_SITE_SETTINGS.heroImageUrl &&
    heroSrc !== DEFAULT_SITE_SETTINGS.heroImageUrl;

  return (
    <section id="top" className="bg-gradient-to-b from-[#F5F8FC] to-white border-b border-slate-200/70">
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-9 lg:py-11">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* Left Narrative Column */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0057E7] mb-2">
              {siteSettings.heroKicker || DEFAULT_SITE_SETTINGS.heroKicker}
            </p>
            <h1 className="font-display text-2xl sm:text-4xl lg:text-[46px] font-extrabold text-[#06142E] leading-[1.1] tracking-[-0.025em] [text-wrap:balance]">
              {siteSettings.heroTitle || DEFAULT_SITE_SETTINGS.heroTitle}
            </h1>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed">
              {siteSettings.heroSubtitle || DEFAULT_SITE_SETTINGS.heroSubtitle}
            </p>

            {/* Primary Store Actions */}
            <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onShopNow}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-[#0057E7] hover:bg-[#0044BB] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span>Shop Hardware</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onExploreKits}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-[#06142E] border border-slate-200 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                <span>Robotics Kits</span>
              </button>
            </div>

            {/* Quiet Single-Line Store Assurance */}
            <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#0057E7]" />
                Lab-tested components
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#0057E7]" />
                Free shipping over ৳3,000
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0057E7]" />
                7-day replacement
              </span>
            </div>
          </div>

          {/* Right Clean Product / Banner Showcase */}
          <div className="lg:col-span-6">
            <div className="w-full rounded-2xl overflow-hidden bg-[#F8FAFD] border border-slate-200/90 shadow-xs flex items-center justify-center">
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
                    ? 'w-full h-auto max-h-[420px] object-contain block'
                    : 'w-full aspect-[16/10] object-cover object-center block'
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
