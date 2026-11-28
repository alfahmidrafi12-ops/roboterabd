import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Heart,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { playErrorSound, playRestockBellSound, playTapSound } from '../lib/sound';
import { LocalRestockWatch, Product } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';

interface WishlistDrawerProps {
  isOpen: boolean;
  products: Product[];
  restockWatches?: LocalRestockWatch[];
  justRestockedIds?: string[];
  defaultEmail?: string | null;
  onClose: () => void;
  onRemove: (productId: string) => void;
  onMoveToCart: (product: Product) => void;
  onOpenDetail?: (product: Product) => void;
  onSubscribeRestock?: (product: Product, email: string) => Promise<void>;
}

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  products,
  restockWatches = [],
  justRestockedIds = [],
  defaultEmail,
  onClose,
  onRemove,
  onMoveToCart,
  onOpenDetail,
  onSubscribeRestock,
}) => {
  const [editingRestockId, setEditingRestockId] = useState<string | null>(null);
  const [restockEmailInput, setRestockEmailInput] = useState('');
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string>('');

  if (!isOpen) return null;

  const restockAlertsCount = products.filter(
    (p) => p.stock > 0 && justRestockedIds.includes(p.id)
  ).length;

  const handleOpenAlertForm = (productId: string, existingEmail?: string) => {
    playTapSound();
    setRowError('');
    if (editingRestockId === productId) {
      setEditingRestockId(null);
      return;
    }
    setEditingRestockId(productId);
    setRestockEmailInput(existingEmail || defaultEmail || '');
  };

  const handleQuickSubscribe = async (product: Product, e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubscribeRestock || busyProductId) return;
    const trimmed = restockEmailInput.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      playErrorSound();
      setRowError('Enter a valid email address.');
      return;
    }
    setBusyProductId(product.id);
    setRowError('');
    try {
      await onSubscribeRestock(product, trimmed);
      playRestockBellSound();
      setEditingRestockId(null);
    } catch {
      playErrorSound();
      setRowError('Could not save restock alert. Please try again.');
    } finally {
      setBusyProductId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="animate-fade-in fixed inset-0 bg-[#071A3B]/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Saved hardware wishlist"
        className="animate-drawer-in relative z-10 w-full max-w-md bg-white h-dvh shadow-2xl flex flex-col border-l border-slate-200 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-[#071A3B] tabular-nums truncate">
              Saved Hardware ({products.length})
            </h2>
            {restockAlertsCount > 0 && (
              <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                <BellRing className="w-3 h-3 animate-bell-ring" />
                <span>
                  {restockAlertsCount} saved {restockAlertsCount === 1 ? 'item' : 'items'} back in stock!
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close saved items"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {products.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pop-in">
            <div className="animate-float-slow w-14 h-14 rounded-2xl bg-[#F1F5F9] border border-slate-200 flex items-center justify-center text-[#087BFF] mb-4 shadow-xs">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-display text-base font-bold text-[#071A3B]">No saved components</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              Click the heart icon on any microcontroller, sensor, or kit to save it for your build BOM.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {products.map((product, idx) => {
              const outOfStock = product.stock <= 0;
              const isJustRestocked = !outOfStock && justRestockedIds.includes(product.id);
              const existingWatch = restockWatches.find((w) => w.productId === product.id);
              const isEditingRow = editingRestockId === product.id;

              return (
                <div
                  key={product.id}
                  style={{ animationDelay: `${Math.min(idx * 35, 240)}ms` }}
                  className={`animate-cart-enter group/row pb-4 border-b border-slate-100 space-y-2.5 ${
                    isJustRestocked ? 'rounded-xl bg-emerald-50/50 p-3 border border-emerald-200' : ''
                  }`}
                >
                  <div className="flex gap-3.5 items-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenDetail) {
                          onClose();
                          onOpenDetail(product);
                        }
                      }}
                      aria-label={`View ${product.name}`}
                      className="w-16 h-16 rounded-lg bg-[#F1F5F9] border border-slate-200 p-1.5 shrink-0 flex items-center justify-center overflow-hidden"
                    >
                      <HardwareArtwork
                        kind={product.artwork}
                        imageUrl={product.imageUrl}
                        alt={product.name}
                        className="thumb-hover-zoom w-full h-full"
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenDetail) {
                            onClose();
                            onOpenDetail(product);
                          }
                        }}
                        className="text-left w-full"
                      >
                        <h3 className="font-display text-sm font-semibold text-[#071A3B] hover:text-[#0866F5] transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                      </button>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                        <span className="font-mono font-bold text-[#0866F5] tabular-nums">
                          ৳{product.price.toLocaleString('en-IN')}
                        </span>
                        {outOfStock ? (
                          <span className="text-red-600 font-semibold">Out of Stock</span>
                        ) : isJustRestocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10.5px] font-bold">
                            <BellRing className="w-3 h-3 animate-bell-ring" />
                            <span>Back in Stock!</span>
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium text-[11px]">
                            In Stock ({product.stock})
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {outOfStock && onSubscribeRestock ? (
                          <button
                            type="button"
                            onClick={() => handleOpenAlertForm(product.id, existingWatch?.email)}
                            className={`motion-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                              existingWatch
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                                : 'bg-[#071A3D] border-[#071A3D] hover:bg-[#087BFF] hover:border-[#087BFF] text-white'
                            }`}
                          >
                            {existingWatch ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Alert Set</span>
                              </>
                            ) : (
                              <>
                                <Bell className="w-3.5 h-3.5 text-[#00CFFF]" />
                                <span>Notify When Restocked</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={outOfStock}
                            onClick={() => onMoveToCart(product)}
                            className="cta-sheen motion-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0866F5] hover:bg-[#0866F5]/90 border border-[#0866F5] hover:border-[#1685FF] text-white transition-colors disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-xs font-semibold"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>{outOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemove(product.id)}
                          aria-label={`Remove ${product.name}`}
                          className="group/del motion-press p-1.5 rounded-md text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="animate-trash-nudge w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {outOfStock && isEditingRow && onSubscribeRestock && (
                    <form
                      onSubmit={(e) => handleQuickSubscribe(product, e)}
                      className="p-2.5 rounded-xl bg-[#F5F8FC] border border-slate-200 space-y-2"
                    >
                      <p className="text-[11px] font-semibold text-[#071A3D]">
                        Get dashboard &amp; email alert when restocked:
                      </p>
                      <div className="flex gap-1.5">
                        <input
                          type="email"
                          required
                          maxLength={120}
                          value={restockEmailInput}
                          onChange={(e) => setRestockEmailInput(e.target.value)}
                          placeholder="you@example.com"
                          className="flex-1 min-w-0 h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-xs text-[#071A3D] focus:outline-none focus:ring-2 focus:ring-[#087BFF]"
                        />
                        <button
                          type="submit"
                          disabled={busyProductId === product.id}
                          className="h-9 px-3 rounded-lg bg-[#087BFF] hover:bg-[#0669DB] disabled:opacity-60 text-white text-[11px] font-bold shrink-0"
                        >
                          {busyProductId === product.id ? 'Saving...' : 'Save Alert'}
                        </button>
                      </div>
                      {rowError && (
                        <p className="text-[11px] text-red-600 font-medium">{rowError}</p>
                      )}
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </div>
  );
};

