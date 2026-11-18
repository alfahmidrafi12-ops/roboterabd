import React from 'react';
import { Home, LayoutGrid, PackageSearch, ShoppingBag, User as UserIcon } from 'lucide-react';

interface MobileBottomNavProps {
  activePage?: 'shop' | 'track';
  cartCount: number;
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
  isSignedIn,
  onGoHome,
  onOpenDepartments,
  onTrackOrder,
  onOpenCart,
  onOpenAuth,
}) => {
  return (
    <nav
      aria-label="Mobile app navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(6,20,46,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-16">
        <button
          type="button"
          onClick={onGoHome}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            activePage === 'shop' ? 'text-[#0057E7]' : 'text-slate-600 hover:text-[#0057E7]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Shop</span>
        </button>

        <button
          type="button"
          onClick={onOpenDepartments}
          className="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-[#0057E7] active:text-[#0057E7] transition-colors"
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Depts</span>
        </button>

        <button
          type="button"
          onClick={onTrackOrder}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            activePage === 'track' ? 'text-[#0057E7]' : 'text-slate-600 hover:text-[#0057E7]'
          }`}
        >
          <PackageSearch className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Track</span>
        </button>

        <button
          type="button"
          onClick={onOpenCart}
          className="relative flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-[#0057E7] active:text-[#0057E7] transition-colors"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#0057E7] text-white text-[9px] font-mono font-bold flex items-center justify-center tabular-nums">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold">Cart</span>
        </button>

        <button
          type="button"
          onClick={onOpenAuth}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            isSignedIn ? 'text-[#0057E7]' : 'text-slate-600 hover:text-[#0057E7]'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-semibold">
            {isSignedIn ? 'Orders' : 'Account'}
          </span>
        </button>
      </div>
    </nav>
  );
};
