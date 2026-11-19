import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Lock,
  LogIn,
  Minus,
  Plus,
  Printer,
  Trash2,
  X,
} from 'lucide-react';
import { createOrderInFirestore } from '../lib/firebase';
import { CartItem, OrderReceipt, Product } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  recommendedProducts?: Product[];
  appliedCoupon: string | null;
  startInCheckout?: boolean;
  user: User | null;
  hasPlacedOrderBefore: boolean;
  onOpenAuth: () => void;
  onClose: () => void;
  onUpdateQty: (productId: string, variant: string | undefined, delta: number) => void;
  onRemoveItem: (productId: string, variant: string | undefined) => void;
  onQuickAdd?: (product: Product) => void;
  onApplyCoupon: (code: string | null) => void;
  onClearCart: () => void;
  onOrderCreated?: (orderId: string) => void;
  onTrackOrder?: (orderId: string) => void;
}

function isValidBdPhone(raw: string): boolean {
  const digits = raw.replace(/[\s\-()]/g, '');
  return /^(\+?880|0)1[3-9]\d{8}$/.test(digits);
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  items,
  recommendedProducts = [],
  appliedCoupon,
  startInCheckout = false,
  user,
  hasPlacedOrderBefore,
  onOpenAuth,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onQuickAdd,
  onApplyCoupon,
  onClearCart,
  onOrderCreated,
  onTrackOrder,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'receipt'>('cart');
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  // Checkout Form State
  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Dhaka Metro');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (user?.displayName && !customerName) {
      setCustomerName(user.displayName);
    }
  }, [user?.displayName]);

  useEffect(() => {
    if (isOpen) {
      setCouponError('');
      setCheckoutError('');
      setCopiedId(false);
      if (startInCheckout && items.length > 0 && step === 'cart') {
        setStep('checkout');
      }
    }
  }, [isOpen, startInCheckout, items.length, step]);

  if (!isOpen) return null;

  const isFirstOrderDiscountEligible = Boolean(user && !hasPlacedOrderBefore);
  const effectiveCoupon =
    appliedCoupon === 'ROBOTERA15' && isFirstOrderDiscountEligible ? 'ROBOTERA15' : null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = effectiveCoupon === 'ROBOTERA15' ? Math.round(subtotal * 0.15) : 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const freeShippingThreshold = 3000;
  const freeShipping = discountedSubtotal >= freeShippingThreshold || discountedSubtotal === 0;
  const shippingProgress = Math.min(
    100,
    Math.round((discountedSubtotal / freeShippingThreshold) * 100)
  );
  const isInsideDhaka = district === 'Dhaka Metro';
  const estimatedDeliveryWindow = isInsideDhaka ? '2–3 days' : '2–4 days';
  const deliveryFee = freeShipping ? 0 : isInsideDhaka ? 80 : 150;
  const total = discountedSubtotal + deliveryFee;

  const hasOutOfStockInCart = items.some((item) => item.product.stock <= 0);

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = couponInput.trim().toUpperCase();
    if (cleaned === 'ROBOTERA15') {
      if (!user) {
        setCouponError('Please sign in first to use the 1st-order 15% discount.');
        return;
      }
      if (hasPlacedOrderBefore) {
        setCouponError('ROBOTERA15 is valid only for your 1st order on this account.');
        return;
      }
      onApplyCoupon('ROBOTERA15');
      setCouponError('');
      setCouponInput('');
    } else {
      setCouponError('Invalid code. Use ROBOTERA15 (1st-order signed-in accounts only).');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || items.length === 0) return;

    if (!user) {
      setCheckoutError('Please sign in or create an account before placing an order.');
      onOpenAuth();
      return;
    }

    const trimmedName = customerName.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();

    if (trimmedName.length < 2) {
      setCheckoutError('Please enter your full name.');
      return;
    }
    if (!isValidBdPhone(trimmedPhone)) {
      setCheckoutError('Please enter a valid 11-digit Bangladesh mobile number (e.g. 017XXXXXXXX).');
      return;
    }
    if (trimmedAddress.length < 5) {
      setCheckoutError('Please provide your full street / campus delivery address.');
      return;
    }
    if (hasOutOfStockInCart) {
      setCheckoutError('Please remove out-of-stock items before placing your order.');
      return;
    }

    setSubmitting(true);
    setCheckoutError('');

    const orderNumber = `RBD-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
    try {
      await createOrderInFirestore({
        orderId: orderNumber,
        customerName: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress,
        district,
        paymentMethod,
        status: 'Pending',
        items: items.map((item) => ({
          productId: item.product.id,
          sku: item.product.sku,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          variant: item.variant,
        })),
        subtotal,
        discount,
        deliveryFee,
        total,
        couponCode: effectiveCoupon ?? undefined,
        notes: orderNotes.trim() || undefined,
      });

      const newReceipt: OrderReceipt = {
        orderId: orderNumber,
        customerName: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress,
        district,
        paymentMethod,
        items: [...items],
        subtotal,
        discount,
        deliveryFee,
        total,
        createdAt: new Date().toLocaleString('en-BD', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
      };
      setReceipt(newReceipt);
      setStep('receipt');
      setOrderNotes('');
      onOrderCreated?.(orderNumber);
      onClearCart();
    } catch (err) {
      console.error('Order submission error:', err);
      setCheckoutError('Could not submit order. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setStep('cart');
    setReceipt(null);
    setCheckoutError('');
    setCouponError('');
    onClose();
  };

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard?.writeText(id).catch(() => {});
    setCopiedId(true);
    window.setTimeout(() => setCopiedId(false), 1800);
  };

  const emptyRecommendations = recommendedProducts.filter((p) => p.stock > 0).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="animate-fade-in fixed inset-0 bg-[#071A3B]/55 backdrop-blur-[2px]"
        onClick={handleResetAndClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart and checkout"
        className="animate-drawer-in relative z-10 w-full max-w-md bg-white h-dvh shadow-2xl flex flex-col border-l border-slate-200"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F1F5F9]">
          <div className="flex items-center gap-2">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => setStep('cart')}
                aria-label="Back to cart"
                className="p-1.5 -ml-2 rounded-lg text-[#64748B] hover:text-[#101828] hover:bg-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="font-display text-lg font-bold text-[#071A3B]">
              {step === 'cart' && 'Your Hardware Cart'}
              {step === 'checkout' && 'Delivery & Payment'}
              {step === 'receipt' && 'Order Confirmed'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Close cart drawer"
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#101828] hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        {step === 'receipt' && receipt ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="bg-[#EFF6FF] border border-blue-200 rounded-xl p-5 flex items-start gap-3.5">
              <CheckCircle2 className="w-6 h-6 text-[#0866F5] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs font-semibold text-[#0866F5] truncate">
                    Order #{receipt.orderId}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopyOrderId(receipt.orderId)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0866F5] hover:underline shrink-0"
                  >
                    {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
                  </button>
                </div>
                <h3 className="font-display text-lg font-bold text-[#071A3B] mt-0.5">
                  Preparing Shipment from Dhaka Lab
                </h3>
                <p className="text-xs text-[#64748B] mt-1">{receipt.createdAt}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-1.5 text-xs">
              <p className="font-semibold text-[#071A3B]">Recipient Details</p>
              <p className="text-[#101828]">
                {receipt.customerName} · <span className="font-mono">{receipt.phone}</span>
              </p>
              <p className="text-[#64748B]">
                {receipt.address}, {receipt.district}
              </p>
              <p className="text-[#64748B]">
                Payment: <strong className="text-[#101828]">{receipt.paymentMethod}</strong>
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
              {receipt.items.map((item) => (
                <div
                  key={`${item.product.id}-${item.variant ?? ''}`}
                  className="p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#071A3B] truncate">{item.product.name}</p>
                    <p className="text-[#64748B] font-mono tabular-nums">
                      Qty {item.quantity} × ৳{item.product.price.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-[#071A3B] shrink-0 tabular-nums">
                    ৳{(item.product.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              <div className="p-3.5 bg-[#F5F8FC] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">
                    ৳{receipt.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                {receipt.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount (ROBOTERA15)</span>
                    <span className="font-mono tabular-nums">
                      -৳{receipt.discount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#64748B]">
                  <span>Delivery ({receipt.district})</span>
                  <span className="font-mono tabular-nums">
                    {receipt.deliveryFee === 0 ? 'Free' : `৳${receipt.deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#071A3B] pt-1.5 border-t border-slate-200">
                  <span>Total Payable</span>
                  <span className="font-mono tabular-nums">
                    ৳{receipt.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {onTrackOrder && (
                <button
                  type="button"
                  onClick={() => {
                    const id = receipt.orderId;
                    handleResetAndClose();
                    onTrackOrder(id);
                  }}
                  className="w-full h-11 rounded-xl bg-[#0866F5] hover:bg-[#0654CC] text-white text-sm font-semibold transition-colors"
                >
                  Track This Order
                </button>
              )}
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full h-11 rounded-xl bg-[#071A3B] hover:bg-[#0D2B5E] text-white text-sm font-semibold transition-colors"
              >
                Continue Shopping
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full h-9 rounded-xl border border-slate-200 hover:bg-[#F5F8FC] text-xs font-semibold text-[#64748B] inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Order Receipt</span>
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between gap-6">
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              {/* Custom Engineering Cart Illustration */}
              <div className="w-24 h-24 rounded-3xl bg-[#F5F8FC] border border-slate-200 flex items-center justify-center mb-5 shadow-2xs">
                <svg viewBox="0 0 80 80" className="w-14 h-14" fill="none" aria-hidden="true">
                  <rect x="14" y="20" width="52" height="36" rx="6" fill="#FFFFFF" stroke="#0866F5" strokeWidth="2.5" />
                  <path d="M24 38H56M32 28V48M48 28V48" stroke="#DBEAFE" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="40" cy="38" r="7" fill="#EFF6FF" stroke="#0866F5" strokeWidth="2" />
                  <circle cx="40" cy="38" r="2.5" fill="#071A3B" />
                  <circle cx="28" cy="64" r="4.5" fill="#071A3B" />
                  <circle cx="52" cy="64" r="4.5" fill="#071A3B" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-bold text-[#071A3B]">
                Your Hardware Cart is Empty
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-xs leading-relaxed">
                Start assembling your next prototype with microcontrollers, SLAM LiDAR, servos, or power packs.
              </p>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="mt-5 px-6 py-2.5 rounded-xl bg-[#0866F5] hover:bg-[#0654CC] text-white text-sm font-semibold transition-colors"
              >
                Browse Hardware
              </button>
            </div>

            {emptyRecommendations.length > 0 && (
              <div className="pt-5 border-t border-slate-200 space-y-3">
                <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#64748B]">
                  Recommended for Makers
                </p>
                <div className="space-y-2.5">
                  {emptyRecommendations.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-[#F5F8FC]"
                    >
                      <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 p-1 shrink-0 flex items-center justify-center">
                        <HardwareArtwork
                          kind={prod.artwork}
                          imageUrl={prod.imageUrl}
                          alt={prod.name}
                          fit="contain"
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-xs font-semibold text-[#101828] truncate">
                          {prod.name}
                        </p>
                        <p className="font-mono text-xs font-bold text-[#0866F5] tabular-nums">
                          ৳{prod.price.toLocaleString('en-IN')}
                        </p>
                      </div>
                      {onQuickAdd && (
                        <button
                          type="button"
                          onClick={() => onQuickAdd(prod)}
                          className="px-3 py-1.5 rounded-lg bg-[#071A3B] hover:bg-[#0866F5] text-white text-[11px] font-semibold transition-colors shrink-0"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : step === 'cart' ? (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Free Delivery Progress Bar */}
              <div className="rounded-xl bg-[#F5F8FC] border border-slate-200 px-4 py-3 text-xs text-[#101828] space-y-2">
                {freeShipping ? (
                  <p className="font-semibold text-emerald-700">
                    Unlocked Free Nationwide Courier (Orders ≥ ৳3,000)
                  </p>
                ) : (
                  <p>
                    Add{' '}
                    <strong className="font-mono text-[#0866F5] tabular-nums">
                      ৳{(freeShippingThreshold - discountedSubtotal).toLocaleString('en-IN')}
                    </strong>{' '}
                    more for free nationwide delivery.
                  </p>
                )}
                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      freeShipping ? 'bg-emerald-600' : 'bg-[#0866F5]'
                    }`}
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
              </div>

              {items.map((item) => {
                const outOfStock = item.product.stock <= 0;
                const atStockLimit = item.quantity >= item.product.stock;
                return (
                  <div
                    key={`${item.product.id}-${item.variant ?? ''}`}
                    className="flex gap-3.5 pb-4 border-b border-slate-100"
                  >
                    <div className="w-20 h-20 rounded-xl bg-[#F5F8FC] border border-slate-200 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                      <HardwareArtwork
                        kind={item.product.artwork}
                        imageUrl={item.product.imageUrl}
                        alt={item.product.name}
                        fit="contain"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-sm font-semibold text-[#101828] leading-snug line-clamp-2">
                          {item.product.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.product.id, item.variant)}
                          aria-label={`Remove ${item.product.name}`}
                          className="text-slate-400 hover:text-red-600 p-1 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {item.variant && (
                        <p className="text-[11px] text-[#64748B] mt-0.5">{item.variant}</p>
                      )}
                      {outOfStock && (
                        <p className="text-[11px] text-red-600 font-semibold mt-0.5">
                          Currently out of stock — remove to checkout
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-[#F5F8FC] h-8">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.product.id, item.variant, -1)}
                            aria-label="Decrease item quantity"
                            className="w-7 h-full flex items-center justify-center text-[#64748B] hover:text-[#101828]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-mono font-semibold text-[#101828] tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={atStockLimit}
                            onClick={() => onUpdateQty(item.product.id, item.variant, 1)}
                            aria-label="Increase item quantity"
                            className="w-7 h-full flex items-center justify-center text-[#64748B] hover:text-[#101828] disabled:opacity-35 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-mono text-sm font-bold text-[#071A3B] tabular-nums">
                          ৳{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Promo Code Input */}
              <div className="pt-1">
                {effectiveCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5 text-xs">
                    <span className="text-emerald-800 font-medium">
                      Coupon <strong className="font-mono">{effectiveCoupon}</strong> (-15% 1st order) applied
                    </span>
                    <button
                      type="button"
                      onClick={() => onApplyCoupon(null)}
                      className="text-emerald-800 hover:underline font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCouponSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder={
                        !user
                          ? 'Sign in for 1st-order code ROBOTERA15'
                          : hasPlacedOrderBefore
                          ? 'Promo code (1st-order offer already used)'
                          : 'Promo code (ROBOTERA15 for 1st order)'
                      }
                      className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0866F5]"
                    />
                    <button
                      type="submit"
                      className="h-9 px-3.5 rounded-lg bg-[#071A3B] text-white text-xs font-semibold hover:bg-[#0866F5] transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponError && <p className="text-xs text-red-600 mt-1.5">{couponError}</p>}
              </div>
            </div>

            {/* Cart Footer Summary */}
            <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-slate-200 bg-[#F5F8FC] space-y-3 shrink-0">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums text-[#101828]">
                    ৳{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>First-Order Discount (15%)</span>
                    <span className="font-mono tabular-nums">
                      -৳{discount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#64748B]">
                  <span>Shipping Estimate ({estimatedDeliveryWindow})</span>
                  <span className="font-mono tabular-nums text-[#101828]">
                    {freeShipping ? 'Free' : `৳${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#071A3B] pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span className="font-mono tabular-nums">৳{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {!user && (
                <p className="text-[11px] text-[#071A3B] bg-[#EFF6FF] border border-blue-100 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#0866F5] shrink-0" />
                  <span>Account sign-in is required to place an order.</span>
                </p>
              )}

              <button
                type="button"
                disabled={hasOutOfStockInCart}
                onClick={() => setStep('checkout')}
                className="w-full h-11 rounded-xl bg-[#0866F5] hover:bg-[#0866F5]/90 border border-[#0866F5] hover:border-[#1685FF] text-white transition-colors disabled:bg-slate-300 disabled:border-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                {!hasOutOfStockInCart && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FB923C]" aria-hidden="true" />
                )}
                <span>
                  {hasOutOfStockInCart
                    ? 'Remove Unavailable Items First'
                    : !user
                    ? 'Sign In & Proceed to Checkout'
                    : 'Proceed to Checkout'}
                </span>
              </button>
            </div>
          </>
        ) : !user ? (
          /* Mandatory Account Sign-In Gate Before Ordering */
          <div className="animate-pop-in flex-1 flex flex-col items-center justify-center p-7 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] border border-blue-200 text-[#0866F5] flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-2 max-w-xs">
              <h3 className="font-display text-lg font-bold text-[#071A3B]">
                Sign In Required to Order
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Please sign in or create an account first so your order receipt, shipment
                updates, and 1st-order discount are securely tied to your profile.
              </p>
            </div>
            <div className="w-full max-w-xs space-y-2.5 pt-2">
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full h-11 rounded-xl bg-[#0866F5] hover:bg-[#0654CC] text-white transition-colors text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Create Account</span>
              </button>
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="w-full h-10 rounded-xl bg-white hover:bg-[#F5F8FC] text-[#071A3B] border border-slate-200 transition-colors text-xs font-semibold"
              >
                Back to Cart
              </button>
            </div>
          </div>
        ) : (
          /* Bangladesh Checkout Step */
          <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label htmlFor="chk-name" className="block text-xs font-semibold text-[#101828] mb-1">
                  Full Name
                </label>
                <input
                  id="chk-name"
                  type="text"
                  required
                  maxLength={120}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Md. Fahim Chowdhury"
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0866F5]"
                />
              </div>

              <div>
                <label htmlFor="chk-phone" className="block text-xs font-semibold text-[#101828] mb-1">
                  Mobile Number (Bangladesh)
                </label>
                <input
                  id="chk-phone"
                  type="tel"
                  required
                  maxLength={30}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0866F5]"
                />
              </div>

              <div>
                <label htmlFor="chk-district" className="block text-xs font-semibold text-[#101828] mb-1">
                  Delivery Zone
                </label>
                <select
                  id="chk-district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0866F5]"
                >
                  <option value="Dhaka Metro">Inside Dhaka — Dhaka Metro (2–3 days · {freeShipping ? 'Free' : '৳80'})</option>
                  <option value="Chattogram">Outside Dhaka — Chattogram (2–4 days · {freeShipping ? 'Free' : '৳150'})</option>
                  <option value="Sylhet">Outside Dhaka — Sylhet (2–4 days · {freeShipping ? 'Free' : '৳150'})</option>
                  <option value="Rajshahi">Outside Dhaka — Rajshahi (2–4 days · {freeShipping ? 'Free' : '৳150'})</option>
                  <option value="Khulna">Outside Dhaka — Khulna (2–4 days · {freeShipping ? 'Free' : '৳150'})</option>
                  <option value="Gazipur / Savar">Outside Dhaka — Gazipur / Savar (2–4 days · {freeShipping ? 'Free' : '৳150'})</option>
                  <option value="Other District">Outside Dhaka — Other District (2–4 days · {freeShipping ? 'Free' : '৳150'})</option>
                </select>
                <p className="mt-1.5 text-[11px] text-[#64748B]">
                  Estimated delivery: <strong className="text-[#101828]">{estimatedDeliveryWindow}</strong> · Charge:{' '}
                  <strong className="font-mono text-[#101828]">{freeShipping ? 'Free' : `৳${deliveryFee}`}</strong>
                </p>
              </div>

              <div>
                <label htmlFor="chk-address" className="block text-xs font-semibold text-[#101828] mb-1">
                  Full Delivery Address
                </label>
                <textarea
                  id="chk-address"
                  required
                  rows={2}
                  maxLength={300}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House, Road, Block / Campus Hall"
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0866F5]"
                />
              </div>

              <div>
                <p className="block text-xs font-semibold text-[#101828] mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Cash on Delivery', 'bKash', 'Nagad', 'Card / SSLCommerz'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-semibold text-left transition-colors ${
                        paymentMethod === method
                          ? 'bg-[#071A3B] border-[#071A3B] text-white'
                          : 'bg-white border-slate-200 text-[#101828] hover:border-slate-300'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {(paymentMethod === 'bKash' || paymentMethod === 'Nagad') && (
                <div className="rounded-xl bg-[#EFF6FF] border border-blue-200 p-3.5 text-xs text-[#64748B] space-y-1">
                  <p className="font-semibold text-[#071A3B]">
                    {paymentMethod} Payment Instructions
                  </p>
                  <p>
                    Send <strong className="font-mono text-[#101828]">৳{total.toLocaleString('en-IN')}</strong> to{' '}
                    <strong className="font-mono text-[#0866F5]">+880 1624-987366</strong> and
                    paste your Transaction ID below (or pay on confirmation call).
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="chk-notes" className="block text-xs font-semibold text-[#101828] mb-1">
                  {paymentMethod === 'bKash' || paymentMethod === 'Nagad'
                    ? `${paymentMethod} TxID or Delivery Note (Optional)`
                    : 'Delivery Note / Campus Gate Info (Optional)'}
                </label>
                <input
                  id="chk-notes"
                  type="text"
                  maxLength={300}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder={
                    paymentMethod === 'bKash' || paymentMethod === 'Nagad'
                      ? 'e.g. TrxID: 9AB4K21M · Call before arrival'
                      : 'e.g. Deliver after 3:00 PM at BUET Main Gate'
                  }
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0866F5]"
                />
              </div>
            </div>

            <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-slate-200 bg-[#F1F5F9] space-y-3 shrink-0">
              {checkoutError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {checkoutError}
                </p>
              )}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Delivery ({isInsideDhaka ? 'Inside Dhaka' : 'Outside Dhaka'} · {estimatedDeliveryWindow})</span>
                  <span className="font-mono tabular-nums text-[#101828]">{freeShipping ? 'Free' : `৳${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#071A3B] pt-1">
                  <span>Total Payable</span>
                  <span className="font-mono tabular-nums">৳{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-[#0866F5] hover:bg-[#0866F5]/90 border border-[#0866F5] hover:border-[#1685FF] text-white transition-colors disabled:opacity-60 text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#FB923C]" aria-hidden="true" />
                <span>
                  {submitting
                    ? 'Placing Order...'
                    : `Confirm Order (৳${total.toLocaleString('en-IN')})`}
                </span>
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
};
