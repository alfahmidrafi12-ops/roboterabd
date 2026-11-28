import React, { useEffect, useState } from 'react';
import { isWatermarkedUrl } from '../data/brandMedia';
import { ArtworkKind } from '../types/store';

interface HardwareArtworkProps {
  kind: ArtworkKind;
  imageUrl?: string;
  alt?: string;
  fit?: 'contain' | 'cover';
  className?: string;
}

export const HardwareArtwork: React.FC<HardwareArtworkProps> = ({
  kind,
  imageUrl,
  alt,
  fit = 'contain',
  className = 'w-full h-full',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [imageUrl]);

  if (imageUrl && imageUrl.trim().length > 0 && !isWatermarkedUrl(imageUrl) && !imgFailed) {
    return (
      <img
        src={imageUrl}
        alt={alt || kind}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${className} ${
          fit === 'cover'
            ? 'object-cover rounded-lg'
            : 'object-contain min-w-0 min-h-0 max-w-full max-h-full'
        }`}
      />
    );
  }

  switch (kind) {
    case 'esp32':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="64" y="22" width="112" height="136" rx="8" fill="#0B192E" stroke="#1E3A5F" strokeWidth="2" />
          {/* Gold Pin Headers Left & Right */}
          {Array.from({ length: 12 }).map((_, i) => (
            <g key={i}>
              <circle cx="74" cy={34 + i * 10} r="2.6" fill="#F59E0B" />
              <circle cx="74" cy={34 + i * 10} r="1" fill="#1E293B" />
              <circle cx="166" cy={34 + i * 10} r="2.6" fill="#F59E0B" />
              <circle cx="166" cy={34 + i * 10} r="1" fill="#1E293B" />
            </g>
          ))}
          {/* RF Shield Can */}
          <rect x="88" y="34" width="64" height="54" rx="4" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="93" y="39" width="54" height="44" rx="2" fill="#E2E8F0" />
          <text x="120" y="60" textAnchor="middle" fill="#0F172A" fontSize="8" fontWeight="700" fontFamily="monospace">ESP32-S3</text>
          <text x="120" y="71" textAnchor="middle" fill="#475569" fontSize="6" fontFamily="monospace">N16R8</text>
          {/* PCB Meander Antenna */}
          <path d="M96 34V26H104V32H112V26H120V32H128V26H136V32H144V26" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
          {/* USB-C Dual Ports */}
          <rect x="92" y="140" width="20" height="16" rx="3" fill="#94A3B8" stroke="#64748B" />
          <rect x="128" y="140" width="20" height="16" rx="3" fill="#94A3B8" stroke="#64748B" />
          {/* Boot / Reset Tactile Switches */}
          <rect x="86" y="106" width="12" height="12" rx="2" fill="#E2E8F0" />
          <circle cx="92" cy="112" r="3" fill="#0057E7" />
          <rect x="142" y="106" width="12" height="12" rx="2" fill="#E2E8F0" />
          <circle cx="148" cy="112" r="3" fill="#334155" />
          {/* RGB LED + Traces */}
          <rect x="115" y="104" width="10" height="10" rx="1.5" fill="#38BDF8" />
          <path d="M120 90V104M120 114V135" stroke="#1D4ED8" strokeWidth="1.5" />
        </svg>
      );

    case 'arduino':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="34" y="34" width="172" height="112" rx="6" fill="#005792" stroke="#003D66" strokeWidth="2" />
          {/* USB-B Port & Barrel Jack */}
          <rect x="26" y="48" width="28" height="24" rx="2" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
          <rect x="26" y="104" width="30" height="26" rx="2" fill="#0F172A" />
          {/* ATmega2560 QFP100 Chip */}
          <rect x="98" y="64" width="44" height="44" rx="2" fill="#1E293B" stroke="#475569" />
          <rect x="104" y="70" width="32" height="32" fill="#0F172A" />
          <text x="120" y="88" textAnchor="middle" fill="#94A3B8" fontSize="6" fontFamily="monospace">ATMEGA2560</text>
          {/* Top & Bottom Female Pin Headers */}
          <rect x="74" y="40" width="112" height="9" rx="1" fill="#0F172A" />
          <rect x="74" y="131" width="112" height="9" rx="1" fill="#0F172A" />
          <rect x="188" y="54" width="10" height="72" rx="1" fill="#0F172A" />
          {Array.from({ length: 14 }).map((_, i) => (
            <g key={i}>
              <rect x={78 + i * 7.5} y="42.5" width="3.5" height="4" fill="#F59E0B" />
              <rect x={78 + i * 7.5} y="133.5" width="3.5" height="4" fill="#F59E0B" />
            </g>
          ))}
          {/* Reset Button & Crystal */}
          <circle cx="64" cy="48" r="5" fill="#E2E8F0" />
          <circle cx="64" cy="48" r="2.5" fill="#EF4444" />
          <rect x="72" y="80" width="14" height="8" rx="3" fill="#CBD5E1" />
        </svg>
      );

    case 'raspberry-pi':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="42" y="34" width="156" height="112" rx="8" fill="#0F5132" stroke="#0B3B24" strokeWidth="2" />
          {/* 40-Pin GPIO Header */}
          <rect x="54" y="40" width="94" height="14" rx="2" fill="#1E293B" />
          {Array.from({ length: 16 }).map((_, i) => (
            <g key={i}>
              <circle cx={59 + i * 5.6} cy="44" r="1.4" fill="#FBBF24" />
              <circle cx={59 + i * 5.6} cy="50" r="1.4" fill="#FBBF24" />
            </g>
          ))}
          {/* Broadcom SoC + RAM */}
          <rect x="86" y="72" width="34" height="34" rx="2" fill="#CBD5E1" stroke="#64748B" />
          <text x="103" y="91" textAnchor="middle" fill="#0F172A" fontSize="6.5" fontWeight="700" fontFamily="monospace">BCM2712</text>
          <rect x="126" y="76" width="22" height="26" rx="2" fill="#1E293B" />
          {/* Ethernet + USB 3.0 Stack */}
          <rect x="172" y="42" width="32" height="28" rx="2" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
          <rect x="174" y="76" width="30" height="26" rx="2" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.5" />
          <rect x="174" y="108" width="30" height="26" rx="2" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
          {/* Micro HDMI + USB-C Power */}
          <rect x="64" y="136" width="18" height="12" rx="2" fill="#94A3B8" />
          <rect x="90" y="136" width="16" height="12" rx="2" fill="#94A3B8" />
          <rect x="114" y="136" width="16" height="12" rx="2" fill="#94A3B8" />
          {/* PCIe FFC Ribbon Port */}
          <rect x="46" y="74" width="10" height="36" rx="1" fill="#F8FAFC" stroke="#94A3B8" />
        </svg>
      );

    case 'stm32':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="52" y="32" width="136" height="116" rx="6" fill="#0F172A" stroke="#334155" strokeWidth="2" />
          <rect x="92" y="62" width="56" height="56" rx="3" fill="#1E293B" stroke="#64748B" />
          <text x="120" y="88" textAnchor="middle" fill="#E2E8F0" fontSize="7" fontWeight="700" fontFamily="monospace">STM32F4</text>
          <text x="120" y="99" textAnchor="middle" fill="#38BDF8" fontSize="5.5" fontFamily="monospace">168MHz M4</text>
          {Array.from({ length: 14 }).map((_, i) => (
            <g key={i}>
              <circle cx="62" cy={42 + i * 7.5} r="2" fill="#F59E0B" />
              <circle cx="178" cy={42 + i * 7.5} r="2" fill="#F59E0B" />
            </g>
          ))}
          <rect x="108" y="134" width="24" height="16" rx="3" fill="#CBD5E1" />
          <rect x="76" y="42" width="28" height="20" rx="2" fill="#475569" />
        </svg>
      );

    case 'lidar':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Base Mount Plate */}
          <rect x="64" y="116" width="112" height="24" rx="5" fill="#1E293B" />
          <rect x="74" y="106" width="92" height="14" rx="2" fill="#334155" />
          {/* Rotating Optical Turret */}
          <ellipse cx="120" cy="64" rx="46" ry="18" fill="#0F172A" stroke="#334155" strokeWidth="2" />
          <rect x="74" y="64" width="92" height="42" fill="#0F172A" />
          <ellipse cx="120" cy="106" rx="46" ry="14" fill="#09111E" />
          {/* Laser Emitter & Receiver Lenses */}
          <circle cx="102" cy="84" r="11" fill="#0057E7" stroke="#60A5FA" strokeWidth="2" />
          <circle cx="102" cy="84" r="5" fill="#020617" />
          <circle cx="138" cy="84" r="11" fill="#0057E7" stroke="#60A5FA" strokeWidth="2" />
          <circle cx="138" cy="84" r="5" fill="#020617" />
          {/* 360 Laser Scan Arcs */}
          <path d="M52 72C40 80 40 94 52 102" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
          <path d="M188 72C200 80 200 94 188 102" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
          <text x="120" y="67" textAnchor="middle" fill="#94A3B8" fontSize="6.5" fontWeight="700" fontFamily="monospace">360° LIDAR</text>
        </svg>
      );

    case 'ultrasonic':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="44" y="50" width="152" height="72" rx="6" fill="#0044BB" stroke="#002D7A" strokeWidth="2" />
          {/* Left & Right Transducers */}
          <circle cx="84" cy="86" r="28" fill="#CBD5E1" stroke="#64748B" strokeWidth="3" />
          <circle cx="84" cy="86" r="20" fill="#1E293B" />
          <circle cx="84" cy="86" r="10" fill="#475569" stroke="#94A3B8" strokeWidth="1.5" />
          <circle cx="156" cy="86" r="28" fill="#CBD5E1" stroke="#64748B" strokeWidth="3" />
          <circle cx="156" cy="86" r="20" fill="#1E293B" />
          <circle cx="156" cy="86" r="10" fill="#475569" stroke="#94A3B8" strokeWidth="1.5" />
          {/* Crystal Oscillator */}
          <rect x="111" y="54" width="18" height="8" rx="4" fill="#E2E8F0" />
          {/* 4 Pins Bottom */}
          {[108, 116, 124, 132].map((x, idx) => (
            <rect key={idx} x={x} y="122" width="3" height="16" fill="#F59E0B" />
          ))}
          <text x="120" y="114" textAnchor="middle" fill="#E2E8F0" fontSize="6.5" fontFamily="monospace">HC-SR04P</text>
        </svg>
      );

    case 'imu':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="64" y="38" width="112" height="104" rx="8" fill="#1D4ED8" stroke="#1E3A8A" strokeWidth="2" />
          <rect x="102" y="72" width="36" height="36" rx="3" fill="#0F172A" stroke="#60A5FA" strokeWidth="1.5" />
          <text x="120" y="93" textAnchor="middle" fill="#E2E8F0" fontSize="6.5" fontFamily="monospace">BNO085</text>
          {/* Axis Arrows */}
          <path d="M120 50V66M120 50L116 55M120 50L124 55" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
          <path d="M160 90H144M160 90L155 86M160 90L155 94" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
          {Array.from({ length: 6 }).map((_, i) => (
            <circle key={i} cx={82 + i * 15} cy="130" r="3" fill="#F59E0B" />
          ))}
        </svg>
      );

    case 'servo':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Mounting Ears */}
          <rect x="44" y="66" width="152" height="12" rx="2" fill="#0F172A" />
          {/* Main Body */}
          <rect x="64" y="54" width="112" height="86" rx="5" fill="#1E293B" stroke="#334155" strokeWidth="2" />
          {/* Top Gear Housing */}
          <rect x="64" y="42" width="112" height="22" rx="4" fill="#334155" />
          {/* Brass Output Spline + White Servo Horn */}
          <circle cx="144" cy="36" r="14" fill="#D97706" stroke="#F59E0B" strokeWidth="2" />
          <rect x="134" y="22" width="52" height="12" rx="6" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
          <circle cx="144" cy="28" r="4" fill="#475569" />
          {/* Blue Spec Label */}
          <rect x="76" y="84" width="88" height="38" rx="3" fill="#0057E7" />
          <text x="120" y="102" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="700" fontFamily="sans-serif">MG996R</text>
          <text x="120" y="114" textAnchor="middle" fill="#DBEAFE" fontSize="6" fontFamily="monospace">METAL GEAR 11KG</text>
          {/* 3-Wire Ribbon */}
          <path d="M64 128H34" stroke="#EA580C" strokeWidth="4" />
          <path d="M64 132H34" stroke="#EF4444" strokeWidth="4" />
          <path d="M64 136H34" stroke="#78350F" strokeWidth="4" />
        </svg>
      );

    case 'stepper':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Stepper Body */}
          <rect x="68" y="48" width="104" height="96" rx="8" fill="#1E293B" stroke="#475569" strokeWidth="2" />
          <rect x="68" y="48" width="104" height="18" rx="4" fill="#94A3B8" />
          <rect x="68" y="126" width="104" height="18" rx="4" fill="#94A3B8" />
          {/* Steel Shaft */}
          <rect x="114" y="20" width="12" height="28" rx="2" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
          {/* Stator Ribs */}
          <rect x="74" y="74" width="92" height="44" fill="#0F172A" />
          <text x="120" y="95" textAnchor="middle" fill="#E2E8F0" fontSize="9" fontWeight="700" fontFamily="monospace">NEMA 17</text>
          <text x="120" y="108" textAnchor="middle" fill="#60A5FA" fontSize="6.5" fontFamily="monospace">1.7A · 0.45Nm</text>
          {/* JST Connector */}
          <rect x="104" y="138" width="32" height="12" rx="2" fill="#F8FAFC" />
        </svg>
      );

    case 'brushless':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Stator Bell */}
          <ellipse cx="120" cy="70" rx="52" ry="18" fill="#0057E7" stroke="#1E40AF" strokeWidth="2" />
          <rect x="68" y="70" width="104" height="44" fill="#0F172A" />
          {/* Copper Windings */}
          {[78, 92, 106, 120, 134, 148].map((x, idx) => (
            <rect key={idx} x={x} y="82" width="10" height="22" rx="3" fill="#D97706" />
          ))}
          <ellipse cx="120" cy="114" rx="52" ry="16" fill="#334155" />
          {/* Hollow Shaft */}
          <circle cx="120" cy="68" r="14" fill="#CBD5E1" />
          <circle cx="120" cy="68" r="6" fill="#0F172A" />
          <text x="120" y="146" textAnchor="middle" fill="#475569" fontSize="7" fontWeight="700" fontFamily="monospace">2804 BLDC + ENCODER</text>
        </svg>
      );

    case 'driver':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="52" y="34" width="136" height="112" rx="6" fill="#0B192E" stroke="#1E3A5F" strokeWidth="2" />
          {/* Aluminum Finned Heatsink */}
          <rect x="66" y="44" width="108" height="44" rx="3" fill="#CBD5E1" stroke="#94A3B8" />
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={i} x1={76 + i * 11} y1="44" x2={76 + i * 11} y2="88" stroke="#64748B" strokeWidth="2" />
          ))}
          {/* Green/Blue Screw Terminals */}
          <rect x="70" y="106" width="44" height="26" rx="2" fill="#0057E7" />
          <rect x="126" y="106" width="44" height="26" rx="2" fill="#0057E7" />
          {[80, 102, 136, 158].map((cx, i) => (
            <circle key={i} cx={cx} cy="119" r="5" fill="#CBD5E1" stroke="#334155" />
          ))}
        </svg>
      );

    case 'arm':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Base Pedestal */}
          <rect x="68" y="140" width="104" height="16" rx="4" fill="#0F172A" />
          <rect x="86" y="122" width="44" height="20" rx="3" fill="#334155" />
          {/* Lower Arm Link */}
          <path d="M106 124L78 72L94 64L122 116Z" fill="#1E293B" stroke="#0057E7" strokeWidth="2" />
          {/* Upper Arm Link */}
          <path d="M84 68L142 40L150 56L92 84Z" fill="#334155" stroke="#60A5FA" strokeWidth="2" />
          {/* Joint Servos */}
          <circle cx="108" cy="124" r="10" fill="#0057E7" stroke="#F8FAFC" strokeWidth="2" />
          <circle cx="86" cy="70" r="10" fill="#0057E7" stroke="#F8FAFC" strokeWidth="2" />
          <circle cx="146" cy="48" r="8" fill="#0057E7" stroke="#F8FAFC" strokeWidth="2" />
          {/* Parallel Claw Gripper */}
          <path d="M154 48L178 36L186 44L168 54" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M154 54L178 68L186 60L168 50" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'rover':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Aluminum Chassis Deck */}
          <rect x="52" y="74" width="136" height="22" rx="4" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" />
          <rect x="74" y="54" width="92" height="20" rx="3" fill="#0057E7" />
          {/* 4 Mecanum Wheels */}
          {[66, 174].map((x) => (
            <g key={x}>
              <rect x={x - 16} y="92" width="32" height="44" rx="6" fill="#0F172A" stroke="#475569" strokeWidth="2" />
              <line x1={x - 10} y1="102" x2={x + 10} y2="112" stroke="#60A5FA" strokeWidth="2.5" />
              <line x1={x - 10} y1="116" x2={x + 10} y2="126" stroke="#60A5FA" strokeWidth="2.5" />
            </g>
          ))}
          <text x="120" y="67" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="700" fontFamily="monospace">4WD MECANUM</text>
        </svg>
      );

    case 'lipo':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="48" y="54" width="132" height="72" rx="8" fill="#0057E7" stroke="#1E3A8A" strokeWidth="2" />
          <rect x="58" y="64" width="112" height="52" rx="4" fill="#0B192E" />
          <text x="114" y="88" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800" fontFamily="sans-serif">11.1V 3S</text>
          <text x="114" y="104" textAnchor="middle" fill="#60A5FA" fontSize="7.5" fontFamily="monospace">2200mAh 35C LIPO</text>
          {/* XT60 Plug */}
          <path d="M180 78H200" stroke="#EF4444" strokeWidth="5" />
          <path d="M180 90H200" stroke="#0F172A" strokeWidth="5" />
          <rect x="196" y="72" width="18" height="24" rx="3" fill="#F59E0B" stroke="#B45309" />
        </svg>
      );

    case 'bms':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="52" y="42" width="136" height="96" rx="6" fill="#064E3B" stroke="#047857" strokeWidth="2" />
          {/* Silver Solder Pads */}
          {['B-', 'B1', 'B2', 'B3', 'B+'].map((lbl, idx) => (
            <g key={lbl}>
              <rect x={64 + idx * 24} y="50" width="14" height="18" rx="2" fill="#E2E8F0" />
              <text x={71 + idx * 24} y="79" textAnchor="middle" fill="#A7F3D0" fontSize="6" fontFamily="monospace">{lbl}</text>
            </g>
          ))}
          {/* Power MOSFET Bank */}
          {[72, 98, 124, 150].map((x) => (
            <rect key={x} x={x} y="96" width="18" height="24" rx="2" fill="#0F172A" stroke="#334155" />
          ))}
        </svg>
      );

    case 'buck':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="48" y="44" width="144" height="92" rx="6" fill="#0044BB" stroke="#1E3A8A" strokeWidth="2" />
          {/* 7-Segment Voltage Readout */}
          <rect x="64" y="56" width="62" height="30" rx="3" fill="#0F172A" />
          <text x="95" y="76" textAnchor="middle" fill="#EF4444" fontSize="13" fontWeight="700" fontFamily="monospace">12.0V</text>
          {/* Inductor Toroid / Choke */}
          <rect x="138" y="56" width="38" height="38" rx="4" fill="#334155" stroke="#94A3B8" />
          <text x="157" y="78" textAnchor="middle" fill="#E2E8F0" fontSize="8" fontFamily="monospace">470</text>
          {/* Blue Trimpots */}
          <rect x="68" y="102" width="18" height="18" rx="2" fill="#38BDF8" />
          <circle cx="77" cy="111" r="4" fill="#F59E0B" />
          <rect x="96" y="102" width="18" height="18" rx="2" fill="#38BDF8" />
          <circle cx="105" cy="111" r="4" fill="#F59E0B" />
        </svg>
      );

    case 'oled':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="56" y="34" width="128" height="112" rx="6" fill="#005792" stroke="#003D66" strokeWidth="2" />
          <rect x="66" y="54" width="108" height="68" rx="3" fill="#020617" stroke="#334155" strokeWidth="1.5" />
          <text x="120" y="82" textAnchor="middle" fill="#38BDF8" fontSize="9" fontWeight="700" fontFamily="monospace">128x64 OLED</text>
          <text x="120" y="98" textAnchor="middle" fill="#F8FAFC" fontSize="7" fontFamily="monospace">I2C · SSD1306</text>
          {[96, 112, 128, 144].map((cx) => (
            <circle key={cx} cx={cx} cy="44" r="3" fill="#F59E0B" />
          ))}
        </svg>
      );

    case 'lora':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="66" y="50" width="96" height="92" rx="6" fill="#0F172A" stroke="#334155" strokeWidth="2" />
          <rect x="80" y="64" width="68" height="62" rx="3" fill="#CBD5E1" />
          <text x="114" y="92" textAnchor="middle" fill="#0F172A" fontSize="8.5" fontWeight="700" fontFamily="monospace">LoRa Ra-02</text>
          <text x="114" y="105" textAnchor="middle" fill="#0057E7" fontSize="6.5" fontWeight="700" fontFamily="monospace">433 MHz</text>
          {/* Helical Antenna */}
          <path d="M162 72H184C190 72 190 54 190 36" stroke="#D97706" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'soldering':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="34" y="76" width="102" height="28" rx="6" fill="#1E293B" stroke="#475569" strokeWidth="2" />
          <rect x="52" y="82" width="44" height="16" rx="2" fill="#020617" />
          <text x="74" y="93" textAnchor="middle" fill="#38BDF8" fontSize="8" fontWeight="700" fontFamily="monospace">350°C</text>
          <rect x="136" y="84" width="52" height="12" rx="2" fill="#CBD5E1" />
          <path d="M188 86L212 90L188 94Z" fill="#94A3B8" />
          <circle cx="114" cy="90" r="4" fill="#0057E7" />
        </svg>
      );

    case 'analyzer':
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="56" y="48" width="128" height="84" rx="8" fill="#0F172A" stroke="#334155" strokeWidth="2" />
          <rect x="72" y="64" width="96" height="36" rx="3" fill="#0B192E" />
          <path d="M80 88H92V72H106V88H120V72H136V88H156" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="120" y="116" textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="monospace">8CH · 24MHz LOGIC</text>
        </svg>
      );

    case 'none':
    default:
      return (
        <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="44" y="34" width="152" height="112" rx="10" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="5 4" />
          <rect x="86" y="60" width="68" height="50" rx="6" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.6" />
          <circle cx="105" cy="77" r="5" fill="#CBD5E1" />
          <path d="M92 103L109 87L122 98L133 88L148 103H92Z" fill="#CBD5E1" />
          <text x="120" y="130" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="600" fontFamily="monospace">UPLOADED IMAGE</text>
        </svg>
      );
  }
};
