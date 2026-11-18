import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CategoryId, SiteImagesConfig } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';

interface PromoBannersProps {
  siteSettings?: SiteImagesConfig;
  onSelectCategory: (id: CategoryId) => void;
}

export const PromoBanners: React.FC<PromoBannersProps> = ({
  siteSettings,
  onSelectCategory,
}) => {
  return (
    <section id="bundles" className="scroll-mt-20 py-10 sm:py-12 lg:py-16 bg-white">
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8">
        {/* Organic's Signature 3-Card Asymmetric Promo Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Large Left Banner */}
          <div className="lg:col-span-7 bg-[#06142E] text-white rounded-2xl p-6 sm:p-9 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden">
            <div className="max-w-sm">
              <p className="text-xs font-mono text-blue-300 mb-2">University &amp; Lab Bundles</p>
              <h3 className="font-display text-2xl sm:text-3xl font-bold leading-tight [text-wrap:balance]">
                6-DOF Robotic Arm &amp; Mecanum Rover Kits
              </h3>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                Complete CNC aluminum mechanical frames with metal-gear servos and quadrature encoder drive trains.
              </p>
              <button
                type="button"
                onClick={() => onSelectCategory('robotics-kits')}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <span>Shop Robotics Kits</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="w-48 h-40 sm:w-52 sm:h-44 shrink-0 bg-white/5 rounded-xl p-2 border border-white/10 overflow-hidden">
              <HardwareArtwork
                kind="arm"
                imageUrl={siteSettings?.promoLeftImageUrl}
                alt="Robotics Kits Promo"
                fit={siteSettings?.promoLeftImageUrl ? 'cover' : 'contain'}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Right Stacked 2 Banners */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-4 sm:gap-5">
            <div className="bg-[#EEF4FF] border border-blue-100 rounded-2xl p-5 sm:p-6 flex items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#0057E7] mb-1">Edge AI &amp; IoT</p>
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#06142E]">
                  Raspberry Pi 5 &amp; ESP32-S3
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Stocked in Dhaka with verified USB-C power &amp; PSRAM options.
                </p>
                <button
                  type="button"
                  onClick={() => onSelectCategory('microcontrollers')}
                  className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#06142E] hover:text-[#0057E7] transition-colors"
                >
                  <span>Explore Boards</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="w-24 h-20 sm:w-28 sm:h-24 shrink-0 bg-white rounded-xl p-1.5 border border-blue-100 overflow-hidden">
                <HardwareArtwork
                  kind="raspberry-pi"
                  imageUrl={siteSettings?.promoTopRightImageUrl}
                  alt="Edge AI Boards Promo"
                  fit={siteSettings?.promoTopRightImageUrl ? 'cover' : 'contain'}
                  className="w-full h-full"
                />
              </div>
            </div>

            <div className="bg-[#F4F7FB] border border-slate-200 rounded-2xl p-5 sm:p-6 flex items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#0057E7] mb-1">High-Discharge Packs</p>
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#06142E]">
                  3S LiPo &amp; 40A Smart BMS
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  XT60 packs, balanced protection boards, and CC/CV buck modules.
                </p>
                <button
                  type="button"
                  onClick={() => onSelectCategory('power')}
                  className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#06142E] hover:text-[#0057E7] transition-colors"
                >
                  <span>Shop Power Gear</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="w-24 h-20 sm:w-28 sm:h-24 shrink-0 bg-white rounded-xl p-1.5 border border-slate-200 overflow-hidden">
                <HardwareArtwork
                  kind="lipo"
                  imageUrl={siteSettings?.promoBottomRightImageUrl}
                  alt="Power & LiPo Promo"
                  fit={siteSettings?.promoBottomRightImageUrl ? 'cover' : 'contain'}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
