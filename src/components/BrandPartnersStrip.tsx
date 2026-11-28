import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { playTapSound } from '../lib/sound';
import { Reveal } from './Reveal';

interface BrandPartnersStripProps {
  onSelectBrand: (searchTerm: string) => void;
}

interface HardwareBrandItem {
  id: string;
  name: string;
  specialty: string;
  searchTerm: string;
  accent: string;
  renderMark: () => React.ReactNode;
}

const HARDWARE_BRANDS: HardwareBrandItem[] = [
  {
    id: 'espressif',
    name: 'Espressif',
    specialty: 'ESP32-S3 & Wi-Fi',
    searchTerm: 'ESP32',
    accent: '#E7352C',
    renderMark: () => (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="12.5" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M10.5 20.5A8 8 0 0 1 20.5 10.5M13 22a5.2 5.2 0 0 1 7-7"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
        />
        <circle cx="19.5" cy="19.5" r="2.2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'raspberry-pi',
    name: 'Raspberry Pi',
    specialty: 'Pi 5 Edge Compute',
    searchTerm: 'Raspberry Pi',
    accent: '#C51A4A',
    renderMark: () => (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
        <path
          d="M12.2 8.2c1.2-.9 2.6-.7 3.8.5 1.2-1.2 2.6-1.4 3.8-.5.9.7.9 2.1-.3 2.8H12.5c-1.2-.7-1.2-2.1-.3-2.8Z"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="18.2" r="7.4" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="13.7" cy="16.4" r="1.4" fill="currentColor" />
        <circle cx="18.3" cy="16.4" r="1.4" fill="currentColor" />
        <circle cx="16" cy="20.4" r="1.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'arduino',
    name: 'Arduino',
    specialty: 'Mega & AVR MCUs',
    searchTerm: 'Arduino',
    accent: '#00979D',
    renderMark: () => (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
        <path
          d="M10.2 20.5a4.5 4.5 0 1 1 3.7-7l4.2 5a4.5 4.5 0 1 0 3.7-7 4.5 4.5 0 0 0-3.7 2l-4.2 5a4.5 4.5 0 0 1-3.7 2Z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8.8 16h2.8M20.4 16h2.8M21.8 14.6v2.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'nvidia',
    name: 'NVIDIA',
    specialty: 'Jetson Orin AI',
    searchTerm: 'NVIDIA',
    accent: '#76B900',
    renderMark: () => (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
        <rect x="4.5" y="7" width="23" height="18" rx="3" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M9 17.5c2.2-4.2 6.8-6.2 11.5-4.3 2.3.9 3.6 3.1 2.7 5-.8 1.7-3.1 2.4-5 1.5-1.5-.7-2-2.2-1.2-3.4.7-1.1 2.1-1.3 3.1-.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'stmicro',
    name: 'STMicro',
    specialty: 'STM32 Cortex-M',
    searchTerm: 'STM32',
    accent: '#03234B',
    renderMark: () => (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
        <path
          d="M6.5 21.5 11.2 10.5h7.6M13.5 16h6M22.5 10.5l-4.7 11"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M18.5 10.5h7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'slamtec',
    name: 'SLAMTEC',
    specialty: 'RPLIDAR Scanners',
    searchTerm: 'RPLIDAR',
    accent: '#0077E6',
    renderMark: () => (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="10.5" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="16" cy="16" r="5.2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2.5" />
        <path d="M16 16 23.2 9.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        <circle cx="16" cy="16" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'bosch',
    name: 'Bosch',
    specialty: 'BNO085 9-Axis IMU',
    searchTerm: 'BNO085',
    accent: '#E20015',
    renderMark: () => (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M11 11.5v9M21 11.5v9M11 13.5h10M11 18.5h10"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'infineon',
    name: 'Infineon',
    specialty: 'BTS7960 43A Bridge',
    searchTerm: 'BTS7960',
    accent: '#008B8B',
    renderMark: () => (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
        <ellipse cx="16" cy="16" rx="11.5" ry="7.2" transform="rotate(-14 16 16)" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12.5 21V11.5l7 9.5V11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'towerpro',
    name: 'TowerPro',
    specialty: 'MG996R Servos',
    searchTerm: 'MG996R',
    accent: '#0866F5',
    renderMark: () => (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="4.5" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M16 5.5v3M16 23.5v3M5.5 16h3M23.5 16h3M8.6 8.6l2.1 2.1M21.3 21.3l2.1 2.1M23.4 8.6l-2.1 2.1M10.7 21.3l-2.1 2.1"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'miniware',
    name: 'Miniware',
    specialty: 'TS101 PD Soldering',
    searchTerm: 'TS101',
    accent: '#F97316',
    renderMark: () => (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
        <path
          d="M7 22 11.5 10 16 18l4.5-8L25 22"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M7 24.5h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'ai-thinker',
    name: 'Ai-Thinker',
    specialty: 'Ra-02 LoRa 433MHz',
    searchTerm: 'LoRa',
    accent: '#0EA5E9',
    renderMark: () => (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
        <polygon points="16,5.5 25,10.7 25,21.3 16,26.5 7,21.3 7,10.7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M12.2 19.5 16 11.5l3.8 8M13.5 17h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'zop-power',
    name: 'ZOP Power',
    specialty: '3S XT60 LiPo Packs',
    searchTerm: 'LiPo',
    accent: '#16A34A',
    renderMark: () => (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
        <rect x="6.5" y="9" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
        <path d="M17 11.5 13 16.5h3.8l-1.8 4 4-5h-3.8l1.8-4Z" fill="currentColor" />
      </svg>
    ),
  },
];

export const BrandPartnersStrip: React.FC<BrandPartnersStripProps> = ({ onSelectBrand }) => {
  return (
    <section
      id="brands"
      aria-label="Component Brands We Supply"
      className="cv-section bg-white min-[1500px]:bg-transparent min-[1500px]:pointer-events-none"
    >
      <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-white min-[1500px]:border-x min-[1500px]:border-slate-200/90 border-t border-slate-200/80 px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5 sm:mb-6">
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[#087BFF] mb-1">
                Authorized Component Lineup
              </p>
              <h2 className="font-hero text-lg sm:text-xl font-extrabold text-[#071A3D] tracking-tight [text-wrap:balance]">
                Brands &amp; Silicon Manufacturers We Stock
              </h2>
            </div>
            <p className="text-xs text-[#64748B]">
              Click any brand to filter its modules in our catalog
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3">
            {HARDWARE_BRANDS.map((brand) => (
              <button
                key={brand.id}
                type="button"
                onClick={() => {
                  playTapSound();
                  onSelectBrand(brand.searchTerm);
                }}
                className="motion-press group relative flex flex-col items-center justify-center text-center rounded-xl bg-[#F8FAFD] hover:bg-white border border-slate-200/85 hover:border-[#0866F5]/45 px-3 py-3.5 sm:py-4 transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-14px_rgba(7,26,61,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0866F5]"
              >
                <span
                  aria-hidden="true"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[#0866F5]"
                >
                  <ArrowUpRight className="w-3 h-3" />
                </span>

                <div
                  className="w-10 h-10 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-[#1E293B] group-hover:text-[var(--brand-accent)] group-hover:border-slate-300 transition-colors mb-2"
                  style={{ '--brand-accent': brand.accent } as React.CSSProperties}
                >
                  <span className="transition-transform duration-200 group-hover:scale-105">
                    {brand.renderMark()}
                  </span>
                </div>

                <span className="font-display text-[13px] font-bold text-[#071A3D] group-hover:text-[#0866F5] transition-colors leading-tight whitespace-nowrap">
                  {brand.name}
                </span>
                <span className="text-[10.5px] text-[#64748B] mt-0.5 leading-tight truncate max-w-full">
                  {brand.specialty}
                </span>
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};
