import React, { useEffect, useRef, useState } from 'react';
import { Home, LayoutGrid, PackageSearch, User as UserIcon } from 'lucide-react';
import { AnimatedCartIcon } from './AnimatedCartIcon';

interface MobileBottomNavProps {
  activePage?: 'shop' | 'track' | 'ai';
  cartCount: number;
  cartPulseKey?: number;
  isSignedIn: boolean;
  onGoHome: () => void;
  onOpenDepartments: () => void;
  onTrackOrder: () => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activePage = 'shop',
  cartCount,
  cartPulseKey = 0,
  isSignedIn,
  onGoHome,
  onOpenDepartments,
  onTrackOrder,
  onOpenCart,
  onOpenAuth,
}) => {
  const [cartPulsing, setCartPulsing] = useState(false);
  const prevPulseKeyRef = useRef(cartPulseKey);

  useEffect(() => {
    if (cartPulseKey <= prevPulseKeyRef.current) {
      prevPulseKeyRef.current = cartPulseKey;
      return;
    }
    prevPulseKeyRef.current = cartPulseKey;
    let raf1 = 0;
    let raf2 = 0;
    setCartPulsing(false);
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setCartPulsing(true);
      });
    });
    const timer = window.setTimeout(() => {
      setCartPulsing(false);
    }, 620);
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(timer);
    };
  }, [cartPulseKey]);

  return (
    <nav
      aria-label="Mobile app navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(6,20,46,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-16">
        <button
          type="button"
          onClick={onGoHome}
          className={`group motion-press relative flex flex-col items-center justify-center gap-1 transition-colors ${
            activePage === 'shop' ? 'text-[#0866F5]' : 'text-slate-600 hover:text-[#0866F5]'
          }`}
        >
          {activePage === 'shop' && (
            <span className="animate-spring-pop absolute top-0 w-7 h-[2.5px] rounded-b-full bg-[#0866F5]" aria-hidden="true" />
          )}
          <Home className="motion-icon-tilt w-5 h-5" />
          <span className="text-[10px] font-semibold">Shop</span>
        </button>

        <button
          type="button"
          onClick={onOpenDepartments}
          className="group motion-press flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-[#0866F5] active:text-[#0866F5] transition-colors"
        >
          <LayoutGrid className="motion-icon-tilt w-5 h-5" />
          <span className="text-[10px] font-semibold">Depts</span>
        </button>

        <button
          type="button"
          onClick={onTrackOrder}
          className={`group motion-press relative flex flex-col items-center justify-center gap-1 transition-colors ${
            activePage === 'track' ? 'text-[#0866F5]' : 'text-slate-600 hover:text-[#0866F5]'
          }`}
        >
          {activePage === 'track' && (
            <span className="animate-spring-pop absolute top-0 w-7 h-[2.5px] rounded-b-full bg-[#0866F5]" aria-hidden="true" />
          )}
          <PackageSearch className="motion-icon-tilt w-5 h-5" />
          <span className="text-[10px] font-semibold">Track</span>
        </button>

        <button
          type="button"
          onClick={onOpenCart}
          className={`group motion-press relative flex flex-col items-center justify-center gap-1 transition-colors ${
            cartPulsing
              ? 'text-[#087BFF]'
              : cartCount > 0
              ? 'text-[#071A3D]'
              : 'text-slate-600 hover:text-[#0866F5] active:text-[#0866F5]'
          }`}
        >
          <div className="relative transition-transform duration-200 group-hover:scale-105">
            {cartPulsing && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-2 rounded-full bg-[#087BFF]/25 ring-1 ring-[#087BFF]/50 animate-cart-pulse-ring"
              />
            )}
            <AnimatedCartIcon
              className="w-5 h-5"
              pulsing={cartPulsing}
              hasItems={cartCount > 0}
              accentColor="#087BFF"
            />
            {cartCount > 0 && (
              <span
                key={cartCount}
                className="animate-badge-bounce absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-gradient-to-r from-[#087BFF] to-[#00B8F4] text-white text-[9px] font-mono font-bold flex items-center justify-center tabular-nums shadow-[0_2px_6px_rgba(8,123,255,0.45)]"
              >
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold">Cart</span>
        </button>

        <button
          type="button"
          onClick={onOpenAuth}
          className={`group motion-press flex flex-col items-center justify-center gap-1 transition-colors ${
            isSignedIn ? 'text-[#0D9488]' : 'text-slate-600 hover:text-[#0866F5]'
          }`}
        >
          <UserIcon className="motion-icon-tilt w-5 h-5" />
          <span className="text-[10px] font-semibold">
            {isSignedIn ? 'Orders' : 'Account'}
          </span>
        </button>
      </div>
    </nav>
  );
};
