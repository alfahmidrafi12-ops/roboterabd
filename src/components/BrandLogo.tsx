import React, { useState } from 'react';

export const ROBOTERA_LOGO_PATH = '/assets/aistudio/robotera_bd_logo_500x500_041558b0.jpg';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark-hud';
  className?: string;
  alt?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandLogoProps['size']>, string> = {
  xs: 'w-6 h-6 rounded-md',
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-14 h-14 rounded-2xl',
  xl: 'w-20 h-20 rounded-2xl',
};

const HUD_SIZE_CLASSES: Record<NonNullable<BrandLogoProps['size']>, string> = {
  xs: 'w-6 h-6 rounded-full',
  sm: 'w-8 h-8 rounded-full',
  md: 'w-10 h-10 rounded-full',
  lg: 'w-14 h-14 rounded-full',
  xl: 'w-[86px] h-[86px] sm:w-[92px] sm:h-[92px] rounded-full',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'sm',
  variant = 'light',
  className = '',
  alt = 'Robotera BD Logo',
}) => {
  const [imgError, setImgError] = useState(false);

  if (variant === 'dark-hud') {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`relative inline-flex items-center justify-center overflow-hidden shrink-0 select-none bg-[radial-gradient(circle_at_32%_28%,#103169_0%,#061838_58%,#030B1D_100%)] border border-[#00CFFF]/55 shadow-[0_0_34px_-4px_rgba(0,207,255,0.55),inset_0_1px_14px_rgba(0,207,255,0.24)] ${HUD_SIZE_CLASSES[size]} ${className}`}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[3px] rounded-full border border-white/10"
        />
        <svg viewBox="0 0 500 500" className="w-[82%] h-[82%] drop-shadow-[0_2px_10px_rgba(0,207,255,0.28)]" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="roboteraHudBody" x1="116" y1="144" x2="434" y2="356" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#D6E4FA" />
            </linearGradient>
            <linearGradient id="roboteraHudSlash" x1="68" y1="356" x2="206" y2="264" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#087BFF" />
              <stop offset="100%" stopColor="#00E1FF" />
            </linearGradient>
          </defs>
          {/* Main geometric R body matching official Robotera BD emblem */}
          <path
            d="M116 144H322C392 144 422 178 422 212C422 246 394 268 342 268L434 356H348L180 228H320A21 21 0 0 0 320 186H158L116 144Z"
            fill="url(#roboteraHudBody)"
          />
          {/* Robotic eye node inside upper slot */}
          <circle cx="320" cy="207" r="10.5" fill="#00D4FF" />
          {/* Electric blue-cyan diagonal speed slash */}
          <path
            d="M68 356L154 270Q160 264 168 264H204Q208 264 204 269L114 356H68Z"
            fill="url(#roboteraHudSlash)"
          />
          {/* Secondary structural wedge */}
          <path
            d="M136 356L190 300L234 356H136Z"
            fill="url(#roboteraHudBody)"
          />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center bg-white border border-slate-200/90 overflow-hidden shrink-0 select-none ${SIZE_CLASSES[size]} ${className}`}
    >
      {!imgError ? (
        <img
          src={ROBOTERA_LOGO_PATH}
          alt={alt}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain scale-[1.12] block"
        />
      ) : (
        <svg viewBox="0 0 500 500" className="w-full h-full" fill="none" aria-hidden="true">
          <path
            d="M116 144H322C392 144 422 178 422 212C422 246 394 268 342 268L434 356H348L180 228H320A21 21 0 0 0 320 186H158L116 144Z"
            fill="#0C1B33"
          />
          <circle cx="320" cy="207" r="10.5" fill="#0C1B33" />
          <path d="M68 356L154 270Q160 264 168 264H204Q208 264 204 269L114 356H68Z" fill="#0866F5" />
          <path d="M136 356L190 300L226 356H136Z" fill="#0C1B33" />
        </svg>
      )}
    </span>
  );
};
