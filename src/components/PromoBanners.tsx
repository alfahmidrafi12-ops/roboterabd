import React, { useRef, useState } from 'react';
import { ArrowRight, Cpu, Layers, Radar, Wrench } from 'lucide-react';
import { BRAND_STUDIO_MEDIA, isWatermarkedUrl } from '../data/brandMedia';
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
  const mainCardRef = useRef<HTMLDivElement>(null);

  const handleMainPointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const el = mainCardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({
      x: Number((nx * -8).toFixed(2)),
      y: Number((ny * -6).toFixed(2)),
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
      className="relative z-20 overflow-hidden scroll-mt-20 py-14 sm:py-18 lg:py-22 bg-gradient-to-b from-[#071A3B] via-[#061735] to-[#071A3B] text-white"
    >
      {/* Subtle Drifting Dark Blueprint Grid */}
      <div
        aria-hidden="true"
        className="animate-blueprint-drift pointer-events-none absolute -inset-6 bg-lab-grid-dark opacity-70"
      />

      {/* Minimal Technical Circuit & Engineering Schematic Backdrop */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.22]"
        viewBox="0 0 1440 860"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {/* Left schematic routing */}
        <path
          d="M0 130H165L210 175H360"
          stroke="#087BFF"
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        <circle cx="360" cy="175" r="3" fill="#00D5FF" fillOpacity="0.65" />
        <path
          d="M0 710H220L265 665H420"
          stroke="#00D5FF"
          strokeOpacity="0.3"
          strokeWidth="1"
        />
        <circle cx="420" cy="665" r="2.5" stroke="#00D5FF" strokeOpacity="0.55" strokeWidth="1" />

        {/* Right schematic bus & engineering rings */}
        <path
          d="M1440 145H1220L1170 195H990"
          stroke="#00D5FF"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        <circle cx="990" cy="195" r="3" fill="#087BFF" fillOpacity="0.7" />
        <path
          d="M1440 620H1260L1215 575H1080"
          stroke="#087BFF"
          strokeOpacity="0.4"
          strokeWidth="1"
        />
        <circle cx="1215" cy="575" r="18" stroke="#087BFF" strokeOpacity="0.16" strokeWidth="1" />
        <circle cx="1080" cy="575" r="3" fill="#00D5FF" fillOpacity="0.5" />

        {/* Subtle geometric crosshair */}
        <path d="M1320 92H1340M1330 82V102" stroke="#00D5FF" strokeOpacity="0.35" strokeWidth="1" />
      </svg>

      {/* Soft Localized Ambient Illumination */}
      <div
        aria-hidden="true"
        className="animate-ambient-pulse pointer-events-none absolute -top-24 left-1/4 w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,rgba(8,123,255,0.16)_0%,rgba(0,213,255,0.06)_45%,transparent_72%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 right-10 w-[480px] h-[480px] rounded-full bg-[radial-gradient(circle,rgba(0,213,255,0.10)_0%,rgba(8,123,255,0.05)_48%,transparent_72%)]"
      />

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 space-y-8 sm:space-y-10">
        {/* Editorial Section Header */}
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-2">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2.5 mb-2">
                <span className="h-[2px] w-6 bg-[#00D5FF]" aria-hidden="true" />
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00D5FF]">
                  Engineering Ecosystem
                </p>
              </div>
              <h2 className="font-hero text-[26px] sm:text-[34px] lg:text-[40px] font-extrabold text-white tracking-[-0.025em] leading-[1.12] [text-wrap:balance]">
                Built for University Labs, R&amp;D Teams &amp; Autonomous Systems
              </h2>
            </div>

            <p className="text-sm sm:text-[15px] text-[#AFC2DF] max-w-md leading-relaxed">
              Integrated hardware platforms spanning ROS2 LiDAR navigation stacks, Edge AI
              compute, multi-axis robotic arms, and industrial power electronics.
            </p>
          </div>
        </Reveal>

        {/* Three-Part Asymmetric Dark Robotics Bento Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
          {/* LEFT: Main Flagship Robotics Showcase (Unobstructed Visual Stage + Crisp Editorial Deck) */}
          <Reveal direction="up" className="lg:col-span-7 flex">
            <div
              ref={mainCardRef}
              onMouseMove={handleMainPointerMove}
              onMouseLeave={handleMainPointerLeave}
              className="group relative w-full rounded-[24px] overflow-hidden bg-gradient-to-br from-[#0A2045] via-[#091D3F] to-[#061735] border border-[#087BFF]/25 hover:border-[#00D5FF]/55 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.65),0_0_0_1px_rgba(8,123,255,0.08)] transition-all duration-300 flex flex-col justify-between"
            >
              {/* Animated Top Accent Line on Hover */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[2px] z-20 bg-gradient-to-r from-transparent via-[#00D5FF] to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-300"
              />

              {/* Dedicated Cinematic Robotics Arm Stage (No Text Overlapping the Arm) */}
              <div className="relative h-[250px] sm:h-[310px] lg:h-[330px] w-full overflow-hidden bg-[#081733]">
                {/* Soft Cyan/Blue Backlight Rim Behind Arm */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_52%_45%,rgba(8,123,255,0.22)_0%,rgba(0,213,255,0.08)_40%,transparent_72%)]"
                />

                <img
                  src={resolvedLeftImg}
                  alt="6-DOF CNC Aluminum Robotic Arm Studio Showcase"
                  referrerPolicy="no-referrer"
                  style={{
                    transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0) scale(1.02)`,
                    transition: 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className="w-full h-full object-contain sm:object-cover object-center block"
                />

                {/* Subtle Bottom Blend Seam into Editorial Content */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#091D3F] via-[#091D3F]/65 to-transparent"
                />
              </div>

              {/* Uncluttered Editorial Deck */}
              <div className="relative z-10 px-6 pb-6 pt-3 sm:px-8 sm:pb-8 sm:pt-4 bg-gradient-to-b from-[#091D3F] to-[#061735] flex-1 flex flex-col justify-between">
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#00D5FF]">
                    University &amp; Lab Bundles
                  </p>
                  <h3 className="mt-2 font-hero text-[22px] sm:text-[27px] lg:text-[30px] font-extrabold text-white leading-[1.16] tracking-[-0.02em] [text-wrap:balance]">
                    6-DOF Robotic Arm &amp; Autonomous SLAM Rover Kits
                  </h3>
                  <p className="mt-2.5 text-sm sm:text-[15px] text-[#AFC2DF] leading-relaxed max-w-xl">
                    Build advanced robotic systems with precision hardware, motion control and
                    autonomous navigation technologies.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => onSelectCategory('robotics-kits')}
                    className="group/btn inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#087BFF] hover:bg-[#1987FF] text-white text-xs sm:text-[13px] font-bold tracking-[0.06em] uppercase shadow-[0_12px_28px_-8px_rgba(8,123,255,0.55)] hover:shadow-[0_16px_34px_-8px_rgba(0,213,255,0.38)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D5FF]"
                  >
                    <span>Explore Robotics Kits</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </Reveal>

          {/* RIGHT: Two Equal-Height Horizontal Technology Feature Cards */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-5 lg:gap-6">
            {/* CARD 01 — Embedded AI & Compute */}
            <Reveal delayMs={70} direction="up" className="flex">
              <div className="group relative w-full rounded-[22px] overflow-hidden bg-[#10294F]/85 backdrop-blur-md border border-[#087BFF]/25 hover:border-[#00D5FF]/60 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.55)] hover:shadow-[0_20px_44px_-18px_rgba(8,123,255,0.28)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col sm:flex-row items-stretch">
                {/* Text Column */}
                <div className="relative z-10 p-5 sm:p-6 flex-1 min-w-0 flex flex-col justify-between order-2 sm:order-1">
                  <div>
                    <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#00D5FF]">
                      Embedded AI &amp; Compute
                    </p>
                    <h3 className="mt-1.5 font-hero text-lg sm:text-[20px] font-extrabold text-white tracking-[-0.015em] leading-snug">
                      Raspberry Pi 5 &amp; ESP32-S3
                    </h3>
                    <p className="mt-2 text-xs sm:text-[13px] text-[#AFC2DF] leading-relaxed">
                      Dual-core Wi-Fi/BLE MCUs and Linux SBC vision compute boards stocked in Dhaka.
                    </p>
                  </div>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => onSelectCategory('microcontrollers')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-[#087BFF] text-white border border-white/15 hover:border-[#087BFF] text-xs font-bold tracking-[0.04em] uppercase transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D5FF]"
                    >
                      <span>Explore Boards</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>

                {/* Large Prominent Product Photography Column */}
                <div className="relative w-full h-44 sm:h-auto sm:w-[46%] lg:w-[48%] shrink-0 overflow-hidden bg-[#091D3F] border-b sm:border-b-0 sm:border-l border-white/10 order-1 sm:order-2">
                  <img
                    src={resolvedTopRightImg}
                    alt="Raspberry Pi 5 and ESP32-S3 Embedded Development Boards"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover object-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#10294F]/45 via-transparent to-transparent hidden sm:block"
                  />
                </div>
              </div>
            </Reveal>

            {/* CARD 02 — SLAM & Telemetry */}
            <Reveal delayMs={130} direction="up" className="flex">
              <div className="group relative w-full rounded-[22px] overflow-hidden bg-[#10294F]/85 backdrop-blur-md border border-[#087BFF]/25 hover:border-[#00D5FF]/60 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.55)] hover:shadow-[0_20px_44px_-18px_rgba(0,213,255,0.24)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col sm:flex-row items-stretch">
                {/* Text Column */}
                <div className="relative z-10 p-5 sm:p-6 flex-1 min-w-0 flex flex-col justify-between order-2 sm:order-1">
                  <div>
                    <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#00D5FF]">
                      SLAM &amp; Telemetry
                    </p>
                    <h3 className="mt-1.5 font-hero text-lg sm:text-[20px] font-extrabold text-white tracking-[-0.015em] leading-snug">
                      360° LiDAR &amp; 9-Axis IMU Modules
                    </h3>
                    <p className="mt-2 text-xs sm:text-[13px] text-[#AFC2DF] leading-relaxed">
                      Optical laser scanners, ultrasonic rangefinders, and precision inertial sensors.
                    </p>
                  </div>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => onSelectCategory('sensors')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-[#087BFF] text-white border border-white/15 hover:border-[#087BFF] text-xs font-bold tracking-[0.04em] uppercase transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D5FF]"
                    >
                      <span>Explore Sensors</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>

                {/* Large Prominent Product Photography Column */}
                <div className="relative w-full h-44 sm:h-auto sm:w-[46%] lg:w-[48%] shrink-0 overflow-hidden bg-[#091D3F] border-b sm:border-b-0 sm:border-l border-white/10 order-1 sm:order-2">
                  <img
                    src={resolvedBottomRightImg}
                    alt="360 Degree Optical LiDAR Scanner and 9-Axis IMU Telemetry Module"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover object-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#10294F]/45 via-transparent to-transparent hidden sm:block"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* BOTTOM: 4 Technology Capability Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 pt-2">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <Reveal key={cap.title} delayMs={idx * 65} direction="up" className="flex">
                <button
                  type="button"
                  onClick={() => onSelectCategory(cap.cat)}
                  className="group relative w-full h-full text-left rounded-2xl overflow-hidden bg-[#10294F]/70 hover:bg-[#10294F] border border-[#087BFF]/20 hover:border-[#00D5FF]/55 p-5 sm:p-6 shadow-[0_10px_28px_-14px_rgba(0,0,0,0.45)] hover:shadow-[0_18px_36px_-14px_rgba(8,123,255,0.28)] hover:-translate-y-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D5FF]"
                >
                  {/* Animated Top Accent Line on Hover */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#087BFF] to-[#00D5FF] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                  />

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#087BFF]/15 border border-[#087BFF]/30 text-[#00D5FF] group-hover:bg-[#087BFF] group-hover:border-[#087BFF] group-hover:text-white transition-colors duration-250">
                        <Icon className="w-5 h-5" strokeWidth={1.75} />
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-[#AFC2DF]/75 tabular-nums">
                        {cap.index}
                      </span>
                    </div>

                    <h3 className="font-hero text-[15px] sm:text-base font-bold text-white group-hover:text-[#00D5FF] transition-colors leading-snug">
                      {cap.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-[13px] text-[#AFC2DF] leading-relaxed">
                      {cap.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-[0.08em] text-[#AFC2DF] group-hover:text-white transition-colors">
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#00D5FF] transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
