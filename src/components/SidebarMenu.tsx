import React from 'react';
import { ChevronRight, MessageCircle, PackageSearch, ShieldCheck, Sparkles, User as UserIcon, X } from 'lucide-react';
import { CategoryId, CategoryItem } from '../types/store';
import { BrandLogo } from './BrandLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { WHATSAPP_URL } from './WhatsAppButton';

interface SidebarMenuProps {
  isOpen: boolean;
  categories: CategoryItem[];
  activeCategory: CategoryId;
  isSignedIn?: boolean;
  userEmail?: string | null;
  userPhone?: string | null;
  onClose: () => void;
  onSelectCategory: (categoryId: CategoryId) => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenTracking: () => void;
  onOpenAiBuilder?: () => void;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  isOpen,
  categories,
  activeCategory,
  isSignedIn,
  userEmail,
  userPhone,
  onClose,
  onSelectCategory,
  onOpenAuth,
  onOpenAdmin,
  onOpenTracking,
  onOpenAiBuilder,
}) => {
  if (!isOpen) return null;

  const visibleCategories = categories.filter((c) => c.active !== false);

  const handlePick = (id: CategoryId) => {
    onSelectCategory(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="animate-fade-in fixed inset-0 bg-[#071A3B]/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="animate-drawer-in-left relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 border-r border-slate-200">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="group flex items-center gap-2.5 min-w-0">
            <BrandLogo size="sm" className="motion-icon-tilt" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Robotera BD</p>
              <h2 className="font-display text-lg font-bold text-[#071A3B] truncate">All Departments</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close departments menu"
            className="motion-press p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          <button
            type="button"
            onClick={() => handlePick('all')}
            className={`motion-row group w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-[#0866F5] text-white'
                : 'text-slate-700 hover:bg-[#F1F5F9]'
            }`}
          >
            <span>All Robotics &amp; Electronics</span>
            <ChevronRight className="w-4 h-4 opacity-70 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>

          {visibleCategories.map((cat, idx) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handlePick(cat.id)}
                style={{ '--stagger-delay': `${Math.min(idx * 22, 220)}ms` } as React.CSSProperties}
                className={`animate-form-stagger motion-row w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#0866F5] text-white'
                    : 'text-slate-700 hover:bg-[#F1F5F9]'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                <span
                  className={`text-xs font-mono tabular-nums ${
                    isActive ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {cat.countLabel.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 bg-[#F1F5F9] space-y-2.5">
          <PWAInstallButton variant="sidebar" />

          {onOpenAiBuilder && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAiBuilder();
              }}
              className="cta-sheen motion-press group w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#071A3B] hover:bg-[#0866F5] border border-[#00C8FF]/40 text-xs font-semibold text-white transition-colors"
            >
              <span className="inline-flex items-center gap-2.5">
                <Sparkles className="motion-icon-tilt w-4 h-4 text-[#00C8FF] shrink-0" />
                <span>AI Project Architect</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#00C8FF]" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTracking();
            }}
            className="motion-press group w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 hover:border-[#0866F5]/60 text-xs font-semibold text-[#071A3B] transition-colors"
          >
            <PackageSearch className="motion-icon-tilt w-4 h-4 text-[#0D9488] shrink-0" />
            <span>Track Your Order</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAuth();
            }}
            className="motion-press group w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 hover:border-[#0866F5]/60 text-xs font-semibold text-[#071A3B] transition-colors"
          >
            <UserIcon className="motion-icon-tilt w-4 h-4 text-[#0866F5] shrink-0" />
            <span className="truncate">
              {isSignedIn ? userEmail || userPhone || 'My Account' : 'Sign In / Create Account'}
            </span>
          </button>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-sheen motion-press group w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#16A34A] hover:bg-[#16A34A]/90 border border-emerald-400/40 text-white text-xs font-semibold transition-colors"
          >
            <MessageCircle className="motion-icon-tilt w-4 h-4 shrink-0" />
            <span>WhatsApp: +880 1624-987366</span>
          </a>

          <div className="pt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="truncate">Mirpur-10 &amp; Elephant Rd</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="motion-press inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-[#0866F5] whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
