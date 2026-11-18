import React from 'react';
import { Heart, ShoppingCart, Trash2, X } from 'lucide-react';
import { Product } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';

interface WishlistDrawerProps {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
  onRemove: (productId: string) => void;
  onMoveToCart: (product: Product) => void;
  onOpenDetail?: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  products,
  onClose,
  onRemove,
  onMoveToCart,
  onOpenDetail,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="animate-fade-in fixed inset-0 bg-[#06142E]/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Saved hardware wishlist"
        className="animate-drawer-in relative z-10 w-full max-w-md bg-white h-dvh shadow-2xl flex flex-col border-l border-slate-200 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[#06142E] tabular-nums">
            Saved Hardware ({products.length})
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close saved items"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {products.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F4F7FB] border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-display text-base font-bold text-[#06142E]">No saved components</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              Click the heart icon on any microcontroller, sensor, or kit to save it for your build BOM.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {products.map((product) => {
              const outOfStock = product.stock <= 0;
              return (
                <div
                  key={product.id}
                  className="flex gap-3.5 pb-4 border-b border-slate-100 items-center"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenDetail) {
                        onClose();
                        onOpenDetail(product);
                      }
                    }}
                    aria-label={`View ${product.name}`}
                    className="w-16 h-16 rounded-lg bg-[#F6F8FB] border border-slate-200 p-1.5 shrink-0 flex items-center justify-center overflow-hidden"
                  >
                    <HardwareArtwork
                      kind={product.artwork}
                      imageUrl={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full"
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
                      <h3 className="font-display text-sm font-semibold text-[#06142E] hover:text-[#0057E7] line-clamp-1">
                        {product.name}
                      </h3>
                    </button>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="font-mono font-bold text-[#0057E7] tabular-nums">
                        ৳{product.price.toLocaleString('en-IN')}
                      </span>
                      {outOfStock && (
                        <span className="text-red-600 font-medium">Out of Stock</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={outOfStock}
                        onClick={() => onMoveToCart(product)}
                        className="btn-glossy-blue inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg disabled:bg-slate-200 disabled:text-slate-500 disabled:border-transparent disabled:shadow-none disabled:cursor-not-allowed text-xs font-semibold"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>{outOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(product.id)}
                        aria-label={`Remove ${product.name}`}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </div>
  );
};
