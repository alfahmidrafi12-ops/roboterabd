import React from 'react';
import { ArrowRight, Cpu, Layers, Radar, Wrench } from 'lucide-react';
import { BRAND_STUDIO_MEDIA } from '../data/brandMedia';
import { CategoryId, SiteImagesConfig } from '../types/store';
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
      className="relative z-20 overflow-hidden scroll-mt-20 py-12 sm:py-16 lg:py-20 bg-[#071A3B] text-white"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-70" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -right-20 w-[440px] h-[440px] rounded-full bg-[radial-gradient(circle,rgba(8,102,245,0.16)_0%,rgba(13,148,136,0.08)_44%,transparent_72%)]"
      />

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 space-y-8 sm:space-y-10">
        {/* Section Header */}
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-[#2DD4BF] mb-1.5">
                Engineering Ecosystem
              </p>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight [text-wrap:balance] max-w-2xl">
                Built for University Labs, R&amp;D Teams &amp; Autonomous Systems
              </h2>
            </div>
            <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
              Integrated hardware platforms spanning ROS2 LiDAR navigation stacks, Edge AI
              vision compute, multi-axis robotic arms, and industrial power electronics.
            </p>
          </div>
        </Reveal>

        {/* Flagship Bento Showcase with Real Studio Photography */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
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
              <div className="group relative w-full rounded-2xl overflow-hidden border border-white/15 hover:border-[#1685FF]/60 bg-[#0A224B] flex flex-col justify-end min-h-[340px] sm:min-h-[400px] transition-colors">
                <img
                  src={BRAND_STUDIO_MEDIA.roboticsArm}
                  alt="6-DOF CNC Aluminum Robotic Arm Studio Showcase"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071A3B] via-[#071A3B]/65 to-[#071A3B]/15"
                />
                <div className="relative z-10 p-6 sm:p-8 lg:p-10 max-w-xl">
                  <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#38BDF8] mb-2">
                    University &amp; Lab Bundles
                  </p>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight [text-wrap:balance]">
                    6-DOF Robotic Arm &amp; Autonomous SLAM Rover Kits
                  </h3>
                  <p className="text-sm text-slate-200 mt-2.5 leading-relaxed">
                    Complete CNC aluminum mechanical frames with metal-gear servos, quadrature
                    encoders, and ROS2 kinematics documentation.
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectCategory('robotics-kits')}
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0866F5] hover:bg-[#0866F5]/90 border border-[#1685FF]/40 hover:border-white/50 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FB923C]" aria-hidden="true" />
                    <span>Explore Robotics Kits</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            )}
          </Reveal>

          {/* Right Stacked 2 Studio Spotlights */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-5">
            <Reveal delayMs={80} direction="up" className="flex">
              {siteSettings?.promoTopRightImageUrl?.trim() ? (
                <button
                  type="button"
                  onClick={() => onSelectCategory('microcontrollers')}
                  aria-label="Explore AI & IoT Boards"
                  className="w-full bg-white border border-white/20 hover:border-[#1685FF] rounded-2xl overflow-hidden flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1685FF]"
                >
                  <img
                    src={siteSettings.promoTopRightImageUrl.trim()}
                    alt="Edge AI Boards Showcase"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-[260px] object-contain block"
                  />
                </button>
              ) : (
                <div className="group relative w-full bg-[#0A224B] border border-white/15 hover:border-[#38BDF8]/55 rounded-2xl overflow-hidden flex items-stretch transition-colors duration-200 min-h-[185px]">
                  <div className="relative z-10 p-5 sm:p-6 flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#38BDF8] mb-1">
                        Embedded AI &amp; Compute
                      </p>
                      <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                        Raspberry Pi 5 &amp; ESP32-S3
                      </h3>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                        Stocked in Dhaka with verified USB-C PD power &amp; PSRAM modules.
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectCategory('microcontrollers')}
                        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/45 text-xs font-semibold transition-colors"
                      >
                        <span>Explore Boards</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                  <div className="w-32 sm:w-44 shrink-0 relative overflow-hidden border-l border-white/10">
                    <img
                      src={BRAND_STUDIO_MEDIA.edgeAiBoards}
                      alt="Edge AI Microcontroller Boards"
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                </div>
              )}
            </Reveal>

            <Reveal delayMs={140} direction="up" className="flex">
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
                <div className="group relative w-full bg-[#0A224B] border border-white/15 hover:border-[#2DD4BF]/55 rounded-2xl overflow-hidden flex items-stretch transition-colors duration-200 min-h-[185px]">
                  <div className="relative z-10 p-5 sm:p-6 flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#2DD4BF] mb-1">
                        SLAM &amp; Telemetry
                      </p>
                      <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                        360° LiDAR &amp; 9-Axis IMU Modules
                      </h3>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                        SLAMTEC laser scanners, ToF arrays, and calibrated IMU sensors.
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectCategory('sensors')}
                        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/45 text-xs font-semibold transition-colors"
                      >
                        <span>Explore Sensors</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                  <div className="w-32 sm:w-44 shrink-0 relative overflow-hidden border-l border-white/10">
                    <img
                      src={BRAND_STUDIO_MEDIA.lidarSensor}
                      alt="360 LiDAR Scanner and IMU Telemetry Sensor"
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                </div>
              )}
            </Reveal>
          </div>
        </div>

        {/* 4 Clean Engineering Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[
            {
              icon: Cpu,
              title: 'Embedded Dev Platforms',
              desc: 'ARM Cortex-M, ESP32-S3 Wi-Fi/BLE, and Linux SBCs ready for rapid prototyping.',
              cat: 'microcontrollers' as CategoryId,
              iconColor: 'text-[#38BDF8]',
            },
            {
              icon: Radar,
              title: 'LiDAR & Perception',
              desc: 'Laser rangefinders, ultrasonic arrays, and sensor fusion IMUs for autonomy.',
              cat: 'sensors' as CategoryId,
              iconColor: 'text-[#2DD4BF]',
            },
            {
              icon: Layers,
              title: 'University Lab Bundles',
              desc: 'Multi-unit robotics lab packages for EEE, CSE, and Mechatronics departments.',
              cat: 'robotics-kits' as CategoryId,
              iconColor: 'text-[#60A5FA]',
            },
            {
              icon: Wrench,
              title: 'Bench & Lab Instruments',
              desc: 'USB-C PD soldering stations, 24MHz logic analyzers, and power bench gear.',
              cat: 'tools' as CategoryId,
              iconColor: 'text-[#FB923C]',
            },
          ].map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <Reveal key={pillar.title} delayMs={idx * 65} direction="up" className="flex">
                <button
                  type="button"
                  onClick={() => onSelectCategory(pillar.cat)}
                  className="group w-full text-left bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-[#38BDF8]/40 rounded-2xl p-5 transition-colors"
                >
                  <Icon
                    className={`w-5 h-5 ${pillar.iconColor} mb-3 transition-transform duration-200 group-hover:scale-110`}
                    strokeWidth={1.75}
                  />
                  <h3 className="font-display text-sm font-bold text-white group-hover:text-[#38BDF8] transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{pillar.desc}</p>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
