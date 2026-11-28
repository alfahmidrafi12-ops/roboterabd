import React from 'react';

interface AnimatedCartIconProps {
  className?: string;
  active?: boolean;
  pulsing?: boolean;
  hasItems?: boolean;
  accentColor?: string;
}

export const AnimatedCartIcon: React.FC<AnimatedCartIconProps> = ({
  className = 'w-4 h-4',
  active = false,
  pulsing = false,
  hasItems = false,
  accentColor = '#00CFFF',
}) => {
  const highlighted = active || hasItems;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`${className} overflow-visible ${pulsing ? 'animate-cart-pulse' : ''}`}
    >
      {/* Subtle Loaded Tray Tint When Cart Has Items */}
      {highlighted && (
        <path
          d="M5.9 7.1H20.35L18.92 13.75C18.76 14.48 18.12 15 17.37 15H8.78C8.02 15 7.37 14.47 7.22 13.72L5.9 7.1Z"
          fill={accentColor}
          fillOpacity={pulsing ? 0.28 : 0.16}
        />
      )}

      {/* Ergonomic Handle & Basket Chassis */}
      <path
        d="M2.4 4.25H4.95L7.18 14.18C7.35 14.95 8.03 15.5 8.82 15.5H17.92C18.7 15.5 19.37 14.97 19.56 14.21L21.18 7.82C21.33 7.24 20.89 6.68 20.29 6.68H5.65"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Precision Basket Strut / Payload Rail */}
      <path
        d="M9.4 10.95H17.55"
        stroke={highlighted ? accentColor : 'currentColor'}
        strokeOpacity={highlighted ? 0.95 : 0.45}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Precision Hollow-Hub Wheels */}
      <g className={pulsing ? 'animate-cart-wheel origin-[9.35px_19.35px]' : ''}>
        <circle
          cx="9.35"
          cy="19.35"
          r="1.55"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle cx="9.35" cy="19.35" r="0.45" fill="currentColor" />
      </g>

      <g className={pulsing ? 'animate-cart-wheel origin-[17.55px_19.35px]' : ''}>
        <circle
          cx="17.55"
          cy="19.35"
          r="1.55"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle cx="17.55" cy="19.35" r="0.45" fill="currentColor" />
      </g>
    </svg>
  );
};
