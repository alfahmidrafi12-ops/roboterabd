import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CategoryId, SiteImagesConfig } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';
import { Reveal } from './Reveal';

interface PromoBannersProps {
  siteSettings?: SiteImagesConfig;
  onSelectCategory: (id: CategoryId) => void;
}

export const PromoBanners: React.FC<PromoBannersProps> = ({
  siteSettings,
  onSelectCategory,
}) => {
  return (
    <section id="bundles" className="scroll-mt-20 py-10 sm:py-14 lg:py-16 bg-white">
      <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Asymmetric Hardware Bento Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Large Left Spotlight */}
          <Reveal direction="up" className="lg:col-span-7 flex">
            {siteSettings?.promoLeftImageUrl?.trim() ? (
              <button
                type="button"
                onClick={() => onSelectCategory('robotics-kits')}
                aria-label="Shop Robotics Kits"
                className="w-full bg-[#F8FAFD] rounded-2xl border border-slate-200/90 overflow-hidden flex items-center justify-center hover:border-[#0057E7] hover:shadow-[0_18px_36px_-18px_rgba(7,13,25,0.2)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <img
                  src={siteSettings.promoLeftImageUrl.trim()}
                  alt="Robotics Kits Promo Banner"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[400px] object-contain block"
                />
              </button>
            ) : (
              <div className="group relative w-full bg-[#070D19] bg-gradient-to-br from-[#070D19] via-[#0B1730] to-[#122750] text-white rounded-2xl p-6 sm:p-9 lg:p-11 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden border border-[#172F5E] shadow-[0_24px_48px_-24px_rgba(7,13,25,0.5)]">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark" />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-24 -right-20 w-72 h-72 rounded-full bg-blue-500/15 blur-3xl animate-ambient-pulse"
                />

                <div className="relative z-10 max-w-md">
                  <p className="text-xs font-mono text-blue-300 mb-2">University &amp; Lab Bundles</p>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight [text-wrap:balance]">
                    6-DOF Robotic Arm &amp; Mecanum Rover Kits
                  </h3>
                  <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                    Complete CNC aluminum mechanical frames with metal-gear servos and quadrature encoder drive trains.
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectCategory('robotics-kits')}
                    className="btn-glossy-blue mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap"
                  >
                    <span>Shop Robotics Kits</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
                <div className="relative z-10 w-48 h-40 sm:w-56 sm:h-48 shrink-0 bg-white/[0.08] backdrop-blur-xs rounded-2xl p-2.5 border border-white/15 overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-hover:-translate-y-1">
                  <HardwareArtwork
                    kind="arm"
                    alt="Robotics Kits Promo"
                    fit="contain"
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </Reveal>

          {/* Right Stacked 2 Spotlights */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-4 sm:gap-5">
            <Reveal delayMs={80} direction="up">
              {siteSettings?.promoTopRightImageUrl?.trim() ? (
                <button
                  type="button"
                  onClick={() => onSelectCategory('microcontrollers')}
                  aria-label="Explore Edge AI & IoT Boards"
                  className="w-full bg-[#F8FAFD] border border-slate-200/90 hover:border-[#0057E7] hover:shadow-md rounded-2xl overflow-hidden flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <img
                    src={siteSettings.promoTopRightImageUrl.trim()}
                    alt="Edge AI Boards Promo Banner"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-[260px] object-contain block"
                  />
                </button>
              ) : (
                <div className="group bg-[#EEF4FF] bg-gradient-to-br from-[#EEF4FF] to-[#E5EEFF] border border-blue-200/80 rounded-2xl p-5 sm:p-6 flex items-center justify-between gap-3 sm:gap-4 hover:-translate-y-1 hover:shadow-[0_18px_36px_-16px_rgba(0,87,231,0.26)] transition-all duration-300">
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-semibold text-[#0057E7] mb-1">Edge AI &amp; IoT</p>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-[#070D19]">
                      Raspberry Pi 5 &amp; ESP32-S3
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Stocked in Dhaka with verified USB-C power &amp; PSRAM options.
                    </p>
                    <button
                      type="button"
                      onClick={() => onSelectCategory('microcontrollers')}
                      className="btn-liquid-glass mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold"
                    >
                      <span>Explore Boards</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#0057E7] transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </div>
                  <div className="w-24 h-20 sm:w-28 sm:h-24 shrink-0 bg-white rounded-xl p-1.5 border border-blue-100 shadow-2xs overflow-hidden transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-1">
                    <HardwareArtwork
                      kind="raspberry-pi"
                      alt="Edge AI Boards Promo"
                      fit="contain"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}
            </Reveal>

            <Reveal delayMs={140} direction="up">
              {siteSettings?.promoBottomRightImageUrl?.trim() ? (
                <button
                  type="button"
                  onClick={() => onSelectCategory('power')}
                  aria-label="Shop Power & LiPo Gear"
                  className="w-full bg-[#F8FAFD] border border-slate-200/90 hover:border-[#0057E7] hover:shadow-md rounded-2xl overflow-hidden flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <img
                    src={siteSettings.promoBottomRightImageUrl.trim()}
                    alt="Power & LiPo Promo Banner"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-[260px] object-contain block"
                  />
                </button>
              ) : (
                <div className="group bg-[#F5F7FA] border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex items-center justify-between gap-3 sm:gap-4 hover:-translate-y-1 hover:shadow-[0_18px_36px_-16px_rgba(7,13,25,0.18)] transition-all duration-300">
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-semibold text-[#0057E7] mb-1">High-Discharge Packs</p>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-[#070D19]">
                      3S LiPo &amp; 40A Smart BMS
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      XT60 packs, balanced protection boards, and CC/CV buck modules.
                    </p>
                    <button
                      type="button"
                      onClick={() => onSelectCategory('power')}
                      className="btn-liquid-glass mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold"
                    >
                      <span>Shop Power Gear</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#0057E7] transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </div>
                  <div className="w-24 h-20 sm:w-28 sm:h-24 shrink-0 bg-white rounded-xl p-1.5 border border-slate-200 shadow-2xs overflow-hidden transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1">
                    <HardwareArtwork
                      kind="lipo"
                      alt="Power & LiPo Promo"
                      fit="contain"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};
