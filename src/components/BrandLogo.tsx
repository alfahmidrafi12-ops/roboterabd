import React, { useState } from 'react';

export const ROBOTERA_LOGO_PATH = '/assets/aistudio/robotera_bd_logo_500x500_041558b0.jpg';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandLogoProps['size']>, string> = {
  xs: 'w-6 h-6 rounded-md p-0.5',
  sm: 'w-8 h-8 rounded-lg p-0.5',
  md: 'w-10 h-10 rounded-xl p-1',
  lg: 'w-14 h-14 rounded-2xl p-1.5',
  xl: 'w-20 h-20 rounded-2xl p-2',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'sm',
  className = '',
  alt = 'Robotera BD Logo',
}) => {
  const [imgError, setImgError] = useState(false);

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
          className="w-full h-full object-contain"
        />
      ) : (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-hidden="true">
          <path
            d="M14 14H41C49 14 54 19 54 27C54 33 50 38 43 40L55 52H44L33 40H26L14 14Z"
            fill="#0C1B33"
          />
          <circle cx="43" cy="24" r="2.8" fill="#0C1B33" />
          <path d="M10 52L24 37H32L18 52H10Z" fill="#0866F5" />
          <path d="M23 52L30 44L34 48L30 52H23Z" fill="#0C1B33" />
        </svg>
      )}
    </span>
  );
};
