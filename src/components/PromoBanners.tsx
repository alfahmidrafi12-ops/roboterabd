import React, { useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Cpu, Layers, Radar, Wrench } from 'lucide-react';
import { BRAND_STUDIO_MEDIA, isWatermarkedUrl } from '../data/brandMedia';
import { playTapSound } from '../lib/sound';
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
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const mainStageRef = useRef<HTMLDivElement>(null);

  const handleMainPointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const el = mainStageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({
      x: Number((nx * -6).toFixed(2)),
      y: Number((ny * -4).toFixed(2)),
    });
  };

  const handleMainPointerLeave = () => {
    setParallax({ x: 0, y: 0 });
  };

  const customLeftImg = siteSettings?.promoLeftImageUrl?.trim();
  const resolvedLeftImg =
    customLeftImg && !isWatermarkedUrl(customLeftImg)
      ? customLeftImg
      : BRAND_STUDIO_MEDIA.roboticsArm;

  const customTopRightImg = siteSettings?.promoTopRightImageUrl?.trim();
  const resolvedTopRightImg =
    customTopRightImg && !isWatermarkedUrl(customTopRightImg)
      ? customTopRightImg
      : BRAND_STUDIO_MEDIA.edgeAiBoards;

  const customBottomRightImg = siteSettings?.promoBottomRightImageUrl?.trim();
  const resolvedBottomRightImg =
    customBottomRightImg && !isWatermarkedUrl(customBottomRightImg)
      ? customBottomRightImg
      : BRAND_STUDIO_MEDIA.lidarSensor;

  const capabilities = [
    {
      index: '01',
      icon: Cpu,
      title: 'Embedded Dev Platforms',
      desc: 'ESP32-S3, ARM Cortex-M, and Linux SBC compute platforms ready for prototyping.',
      cat: 'microcontrollers' as CategoryId,
    },
    {
      index: '02',
      icon: Radar,
      title: 'LiDAR & Perception',
      desc: '360° laser scanners, ultrasonic arrays, and sensor-fusion IMUs for autonomy.',
      cat: 'sensors' as CategoryId,
    },
    {
      index: '03',
      icon: Layers,
      title: 'University Lab Bundles',
      desc: 'Structured robotics lab kits built for EEE, CSE, and Mechatronics teams.',
      cat: 'robotics-kits' as CategoryId,
    },
    {
      index: '04',
      icon: Wrench,
      title: 'Bench & Lab Instruments',
      desc: 'USB-C PD smart soldering tools, logic analyzers, and bench diagnostics.',
      cat: 'tools' as CategoryId,
    },
  ];

  return (
    <section
      id="bundles"
      className="scroll-mt-[108px] bg-[#050B18] min-[1500px]:bg-transparent min-[1500px]:pointer-events-none"
    >
      <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto overflow-hidden bg-[#050B18] text-[#F5F8FF] min-[1500px]:border-x min-[1500px]:border-[#1E3A6E]/60 px-5 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
        {/* Ultra-Subtle Architectural Grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-55"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(100, 150, 255, 0.036) 1px, transparent 1px), linear-gradient(to bottom, rgba(100, 150, 255, 0.036) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div
          aria-hidden="true"
          className="animate-signal-sweep pointer-events-none absolute top-0 left-0 h-[1.5px] w-48 bg-gradient-to-r from-transparent via-[#00C8FF]/70 to-transparent"
        />

        <div className="relative z-10 space-y-8 lg:space-y-10">
          {/* Editorial Section Header */}
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 lg:items-end gap-5 lg:gap-10 pb-7 border-b border-[rgba(100,150,255,0.16)]">
              <div className="lg:col-span-7">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[#00C8FF] mb-3">
                  Engineering Ecosystem
                </p>
                <h2 className="font-hero text-[28px] sm:text-[36px] lg:text-[44px] font-extrabold text-[#F5F8FF] tracking-[-0.03em] leading-[1.08] [text-wrap:balance]">
                  Built for University Labs, R&amp;D Teams &amp;{' '}
                  <span className="text-[#1677FF]">Autonomous Systems</span>
                </h2>
              </div>

              <div className="lg:col-span-5 lg:border-l lg:border-[rgba(100,150,255,0.18)] lg:pl-7">
                <p className="text-sm sm:text-[15px] text-[#A8B6CC] leading-[1.68]">
                  Integrated hardware platforms spanning ROS2 LiDAR navigation stacks, Edge AI
                  compute, multi-axis robotic arms, and industrial power electronics.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Unified Hairline-Framed Hardware Showcase Chassis */}
          <Reveal direction="up">
            <div className="rounded-2xl border border-[rgba(100,150,255,0.18)] bg-[rgba(100,150,255,0.14)] overflow-hidden shadow-[0_32px_80px_-32px_rgba(0,0,0,0.9)]">
              {/* Top Asymmetric Feature Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-px">
                {/* LEFT: Flagship 6-DOF Robotic Arm Stage */}
                <div
                  ref={mainStageRef}
                  onMouseMove={handleMainPointerMove}
                  onMouseLeave={handleMainPointerLeave}
                  className="group lg:col-span-7 bg-[#0A1428] flex flex-col justify-between"
                >
                  <div className="relative h-[260px] sm:h-[330px] lg:h-[370px] w-full overflow-hidden bg-[#060E1F]">
                    {/* Single Quiet Studio Keylight Behind Hardware */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,rgba(22,119,255,0.18)_0%,rgba(0,200,255,0.05)_42%,transparent_72%)]"
                    />

                    <img
                      src={resolvedLeftImg}
                      alt="6-DOF CNC Aluminum Robotic Arm Studio Showcase"
                      referrerPolicy="no-referrer"
                      style={{
                        transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0) scale(1.03)`,
                        transition: 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      className="w-full h-full object-contain sm:object-cover object-center block"
                    />

                    {/* Edge & Bottom Studio Vignette Melting Smoothly Into Deck */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_54%,rgba(6,14,31,0.72)_100%)]"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0A1428] via-[#0A1428]/80 to-transparent"
                    />
                  </div>

                  {/* Clean Editorial Hardware Deck */}
                  <div className="relative z-10 px-6 pb-7 pt-2 sm:px-8 sm:pb-8 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-[#00C8FF]">
                        University &amp; Lab Bundles
                      </p>
                      <h3 className="mt-2 font-hero text-[22px] sm:text-[26px] lg:text-[28px] font-extrabold text-[#F5F8FF] leading-[1.14] tracking-[-0.02em] [text-wrap:balance]">
                        6-DOF Robotic Arm &amp; Autonomous SLAM Rover Kits
                      </h3>
                      <p className="mt-2.5 text-sm sm:text-[15px] text-[#A8B6CC] leading-[1.65] max-w-xl">
                        Build advanced robotic systems with precision hardware, motion control and
                        autonomous navigation technologies.
                      </p>
                    </div>

                    <div className="mt-6 pt-5 border-t border-[rgba(100,150,255,0.14)] flex flex-wrap items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          onSelectCategory('robotics-kits');
                        }}
                        className="cta-sheen group/btn inline-flex items-center justify-center gap-2.5 px-6 h-11 rounded-xl bg-[#1677FF] hover:bg-[#2684FF] text-white text-xs sm:text-[13px] font-semibold tracking-tight shadow-[0_12px_28px_-10px_rgba(22,119,255,0.65)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C8FF]"
                      >
                        <span>Explore Robotics Kits</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          onSelectCategory('motors');
                        }}
                        className="group/sub inline-flex items-center gap-1.5 text-xs font-medium text-[#A8B6CC] hover:text-[#F5F8FF] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C8FF] rounded"
                      >
                        <span>Motors &amp; Servo Drivers</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#00C8FF] transition-transform duration-200 group-hover/sub:translate-x-0.5 group-hover/sub:-translate-y-0.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Stacked Dual Compute & Perception Plates */}
                <div className="lg:col-span-5 grid grid-cols-1 gap-px bg-[rgba(100,150,255,0.14)]">
                  {/* PLATE 02 — Embedded AI & Compute */}
                  <div className="group bg-[#0A1428] hover:bg-[#0E1A33] transition-colors duration-300 flex flex-col sm:flex-row items-stretch">
                    <div className="p-6 sm:p-7 flex-1 min-w-0 flex flex-col justify-between order-2 sm:order-1">
                      <div>
                        <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-[#00C8FF]">
                          Embedded AI &amp; Compute
                        </p>
                        <h3 className="mt-2 font-hero text-lg sm:text-[21px] font-bold text-[#F5F8FF] tracking-[-0.018em] leading-snug">
                          Raspberry Pi 5 &amp; ESP32-S3
                        </h3>
                        <p className="mt-2 text-xs sm:text-[13.5px] text-[#A8B6CC] leading-[1.6]">
                          Dual-core Wi-Fi/BLE MCUs and Linux SBC vision compute boards stocked in
                          Dhaka.
                        </p>
                      </div>

                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={() => {
                            playTapSound();
                            onSelectCategory('microcontrollers');
                          }}
                          className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-[#101D33] hover:bg-[#1677FF] text-[#F5F8FF] border border-[rgba(100,150,255,0.22)] hover:border-[#1677FF] active:scale-[0.97] text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C8FF]"
                        >
                          <span>Explore Boards</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>

                    <div className="relative w-full h-44 sm:h-auto sm:w-[46%] shrink-0 overflow-hidden bg-[#060E1F] order-1 sm:order-2">
                      <img
                        src={resolvedTopRightImg}
                        alt="Raspberry Pi 5 and ESP32-S3 Embedded Development Boards"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover object-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0A1428] via-[#0A1428]/70 to-transparent hidden sm:block group-hover:from-[#0E1A33] group-hover:via-[#0E1A33]/70 transition-colors"
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#0A1428] via-[#0A1428]/65 to-transparent sm:hidden"
                      />
                    </div>
                  </div>

                  {/* PLATE 03 — SLAM & Telemetry */}
                  <div className="group bg-[#0A1428] hover:bg-[#0E1A33] transition-colors duration-300 flex flex-col sm:flex-row items-stretch">
                    <div className="p-6 sm:p-7 flex-1 min-w-0 flex flex-col justify-between order-2 sm:order-1">
                      <div>
                        <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-[#00C8FF]">
                          SLAM &amp; Telemetry
                        </p>
                        <h3 className="mt-2 font-hero text-lg sm:text-[21px] font-bold text-[#F5F8FF] tracking-[-0.018em] leading-snug">
                          360° LiDAR &amp; 9-Axis IMU Modules
                        </h3>
                        <p className="mt-2 text-xs sm:text-[13.5px] text-[#A8B6CC] leading-[1.6]">
                          Optical laser scanners, ultrasonic rangefinders, and precision inertial
                          sensors.
                        </p>
                      </div>

                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={() => {
                            playTapSound();
                            onSelectCategory('sensors');
                          }}
                          className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-[#101D33] hover:bg-[#1677FF] text-[#F5F8FF] border border-[rgba(100,150,255,0.22)] hover:border-[#1677FF] active:scale-[0.97] text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C8FF]"
                        >
                          <span>Explore Sensors</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>

                    <div className="relative w-full h-44 sm:h-auto sm:w-[46%] shrink-0 overflow-hidden bg-[#060E1F] order-1 sm:order-2">
                      <img
                        src={resolvedBottomRightImg}
                        alt="360 Degree Optical LiDAR Scanner and 9-Axis IMU Telemetry Module"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover object-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0A1428] via-[#0A1428]/70 to-transparent hidden sm:block group-hover:from-[#0E1A33] group-hover:via-[#0E1A33]/70 transition-colors"
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#0A1428] via-[#0A1428]/65 to-transparent sm:hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom 4-Column Architectural Department Index Rail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[rgba(100,150,255,0.14)] border-t border-[rgba(100,150,255,0.16)]">
                {capabilities.map((cap) => {
                  const Icon = cap.icon;
                  return (
                    <button
                      key={cap.title}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        onSelectCategory(cap.cat);
                      }}
                      className="group text-left bg-[#071022] hover:bg-[#0D1930] px-6 py-5 sm:py-6 transition-colors duration-200 flex flex-col justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00C8FF]"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className="w-4 h-4 text-[#00C8FF] shrink-0 transition-colors"
                            strokeWidth={1.75}
                          />
                          <span className="font-mono text-[11px] font-medium text-[#7D94BA] tabular-nums">
                            {cap.index}
                          </span>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#7D94BA] group-hover:text-[#00C8FF] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>

                      <div>
                        <h3 className="font-hero text-[15px] font-bold text-[#F5F8FF] group-hover:text-[#00C8FF] transition-colors leading-snug">
                          {cap.title}
                        </h3>
                        <p className="mt-1.5 text-xs sm:text-[13px] text-[#A8B6CC] leading-relaxed">
                          {cap.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
