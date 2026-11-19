import React from 'react';
import { ArrowRight, Cpu, Layers, Radar, Wrench } from 'lucide-react';
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
    <section
      id="bundles"
      className="relative overflow-hidden scroll-mt-20 py-12 sm:py-16 lg:py-20 bg-[#071A3B] text-white"
    >
      {/* Dedicated non-overriding background technical grid layer */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -right-20 w-[460px] h-[460px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.18)_0%,rgba(8,102,245,0.1)_42%,rgba(8,102,245,0)_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-20 w-[380px] h-[380px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.12)_0%,rgba(7,26,59,0)_70%)]"
      />

      <div className="relative z-10 w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10 space-y-8 sm:space-y-10">
        {/* Section Header */}
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-widest text-[#22D3EE] mb-1.5">
                Engineering Ecosystem
              </p>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight [text-wrap:balance]">
                Built for University Labs, R&amp;D Teams &amp; Autonomous Systems
              </h2>
            </div>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Integrated hardware platforms spanning ROS2 LiDAR navigation stacks, Edge AI
              vision compute, multi-axis robotic arms, and industrial power electronics.
            </p>
          </div>
        </Reveal>

        {/* Flagship Bento Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Large Left Spotlight */}
          <Reveal direction="up" className="lg:col-span-7 flex">
            {siteSettings?.promoLeftImageUrl?.trim() ? (
              <button
                type="button"
                onClick={() => onSelectCategory('robotics-kits')}
                aria-label="Shop Robotics Kits"
                className="w-full bg-white hover:bg-white/95 rounded-2xl border border-white/20 overflow-hidden flex items-center justify-center hover:border-[#1685FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1685FF]"
              >
                <img
                  src={siteSettings.promoLeftImageUrl.trim()}
                  alt="Robotics Kits Engineering Showcase"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[420px] object-contain block"
                />
              </button>
            ) : (
              <div className="group relative w-full bg-[#0A224B] bg-gradient-to-br from-[#0A224B] via-[#0D2B5E] to-[#12397A] rounded-2xl p-5 sm:p-9 lg:p-11 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden border border-white/15">
                <div className="relative z-10 max-w-md">
                  <p className="text-xs font-mono font-semibold text-[#38BDF8] mb-2">
                    University &amp; Lab Bundles
                  </p>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight [text-wrap:balance]">
                    6-DOF Robotic Arm &amp; Autonomous SLAM Rover Kits
                  </h3>
                  <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                    Complete CNC aluminum mechanical frames with metal-gear servos, quadrature
                    encoders, and ROS2 kinematics documentation.
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectCategory('robotics-kits')}
                    className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0866F5] hover:bg-[#0866F5]/90 border border-[#1685FF]/40 hover:border-white/50 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    <span>Explore Robotics Kits</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
                <div className="relative z-10 w-full max-w-[220px] aspect-[4/3] sm:w-56 sm:h-48 sm:aspect-auto shrink-0 bg-white/[0.08] rounded-2xl p-3 border border-white/15 overflow-hidden flex items-center justify-center">
                  <HardwareArtwork
                    kind="arm"
                    alt="Robotics Kits Showcase"
                    fit="contain"
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </Reveal>

          {/* Right Stacked 2 Spotlights */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-5">
            <Reveal delayMs={80} direction="up">
              {siteSettings?.promoTopRightImageUrl?.trim() ? (
                <button
                  type="button"
                  onClick={() => onSelectCategory('microcontrollers')}
                  aria-label="Explore AI & IoT Boards"
                  className="w-full bg-white border border-white/20 hover:border-[#1685FF] rounded-2xl overflow-hidden flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1685FF]"
                >
                  <img
                    src={siteSettings.promoTopRightImageUrl.trim()}
                    alt="Edge AI Boards Showcase"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-[260px] object-contain block"
                  />
                </button>
              ) : (
                <div className="group bg-[#0B244E] border border-white/15 hover:border-[#22D3EE]/55 rounded-2xl p-5 sm:p-6 flex items-center justify-between gap-4 transition-colors duration-200">
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-semibold text-[#A5B4FC] mb-1">
                      Embedded AI &amp; Compute
                    </p>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                      Raspberry Pi 5 &amp; ESP32-S3
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Stocked in Dhaka with verified USB-C PD power &amp; PSRAM configurations.
                    </p>
                    <button
                      type="button"
                      onClick={() => onSelectCategory('microcontrollers')}
                      className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/45 text-xs font-bold transition-colors"
                    >
                      <span>Explore Boards</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </div>
                  <div className="w-20 h-20 sm:w-28 sm:h-24 shrink-0 bg-white/[0.08] rounded-xl p-2 border border-white/15 overflow-hidden">
                    <HardwareArtwork
                      kind="raspberry-pi"
                      alt="Edge AI Boards"
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
                  onClick={() => onSelectCategory('sensors')}
                  aria-label="Explore LiDAR & Precision Sensors"
                  className="w-full bg-white hover:bg-white/95 border border-white/20 hover:border-[#1685FF] rounded-2xl overflow-hidden flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1685FF]"
                >
                  <img
                    src={siteSettings.promoBottomRightImageUrl.trim()}
                    alt="Sensors and LiDAR Showcase"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-[260px] object-contain block"
                  />
                </button>
              ) : (
                <div className="group bg-[#0B244E] border border-white/15 hover:border-[#34D399]/55 rounded-2xl p-5 sm:p-6 flex items-center justify-between gap-4 transition-colors duration-200">
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-semibold text-[#34D399] mb-1">
                      SLAM &amp; Telemetry
                    </p>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                      360° LiDAR &amp; 9-Axis IMU Modules
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      SLAMTEC laser scanners, ToF distance arrays, and calibrated IMUs.
                    </p>
                    <button
                      type="button"
                      onClick={() => onSelectCategory('sensors')}
                      className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/45 text-xs font-bold transition-colors"
                    >
                      <span>Explore Sensors</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </div>
                  <div className="w-20 h-20 sm:w-28 sm:h-24 shrink-0 bg-white/[0.08] rounded-xl p-2 border border-white/15 overflow-hidden">
                    <HardwareArtwork
                      kind="lidar"
                      alt="LiDAR Scanner Showcase"
                      fit="contain"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}
            </Reveal>
          </div>
        </div>

        {/* 4 Engineering Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[
            {
              icon: Cpu,
              title: 'Embedded Dev Platforms',
              desc: 'ARM Cortex-M, ESP32-S3 Wi-Fi/BLE, and Linux SBCs ready for rapid prototyping.',
              cat: 'microcontrollers' as CategoryId,
              iconBox: 'bg-[#0866F5]/20 border-[#1685FF]/35 text-[#60A5FA]',
              hoverBorder: 'hover:border-[#1685FF]/55',
            },
            {
              icon: Radar,
              title: 'LiDAR & Perception',
              desc: 'Laser rangefinders, ultrasonic arrays, and sensor fusion IMUs for autonomy.',
              cat: 'sensors' as CategoryId,
              iconBox: 'bg-[#06B6D4]/20 border-[#22D3EE]/35 text-[#22D3EE]',
              hoverBorder: 'hover:border-[#22D3EE]/55',
            },
            {
              icon: Layers,
              title: 'University Lab Bundles',
              desc: 'Multi-unit robotics lab packages for EEE, CSE, and Mechatronics departments.',
              cat: 'robotics-kits' as CategoryId,
              iconBox: 'bg-[#10B981]/20 border-[#34D399]/35 text-[#34D399]',
              hoverBorder: 'hover:border-[#34D399]/55',
            },
            {
              icon: Wrench,
              title: 'Bench & Lab Instruments',
              desc: 'USB-C PD soldering stations, 24MHz logic analyzers, and power bench gear.',
              cat: 'tools' as CategoryId,
              iconBox: 'bg-[#F59E0B]/20 border-[#FBBF24]/35 text-[#FBBF24]',
              hoverBorder: 'hover:border-[#FBBF24]/55',
            },
          ].map((pillar) => {
            const Icon = pillar.icon;
            return (
              <button
                key={pillar.title}
                type="button"
                onClick={() => onSelectCategory(pillar.cat)}
                className={`group text-left bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 ${pillar.hoverBorder} rounded-2xl p-4 sm:p-5 transition-all`}
              >
                <div className={`w-9 h-9 rounded-xl border ${pillar.iconBox} flex items-center justify-center mb-3`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-display text-sm font-bold text-white group-hover:text-[#38BDF8] transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{pillar.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
