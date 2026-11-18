import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Minus,
  Plus,
  Printer,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { createOrderInFirestore } from '../lib/firebase';
import { CartItem, OrderReceipt } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  appliedCoupon: string | null;
  startInCheckout?: boolean;
  onClose: () => void;
  onUpdateQty: (productId: string, variant: string | undefined, delta: number) => void;
  onRemoveItem: (productId: string, variant: string | undefined) => void;
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
  appliedCoupon,
  startInCheckout = false,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onApplyCoupon,
  onClearCart,
  onOrderCreated,
  onTrackOrder,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'receipt'>('cart');
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
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

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = appliedCoupon === 'ROBOTERA15' ? Math.round(subtotal * 0.15) : 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const freeShippingThreshold = 3000;
  const freeShipping = discountedSubtotal >= freeShippingThreshold || discountedSubtotal === 0;
  const shippingProgress = Math.min(
    100,
    Math.round((discountedSubtotal / freeShippingThreshold) * 100)
  );
  const deliveryFee = freeShipping ? 0 : district === 'Dhaka Metro' ? 60 : 120;
  const total = discountedSubtotal + deliveryFee;

  const hasOutOfStockInCart = items.some((item) => item.product.stock <= 0);

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = couponInput.trim().toUpperCase();
    if (cleaned === 'ROBOTERA15') {
      onApplyCoupon('ROBOTERA15');
      setCouponError('');
      setCouponInput('');
    } else {
      setCouponError('Invalid code. Use ROBOTERA15 for 15% off.');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || items.length === 0) return;

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
        couponCode: appliedCoupon ?? undefined,
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-[#06142E]/50 backdrop-blur-[2px]"
        onClick={handleResetAndClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart and checkout"
        className="relative z-10 w-full max-w-md bg-white h-dvh shadow-2xl flex flex-col border-l border-slate-200"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => setStep('cart')}
                aria-label="Back to cart"
                className="p-1.5 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="font-display text-lg font-bold text-[#06142E]">
              {step === 'cart' && 'Your Hardware Cart'}
              {step === 'checkout' && 'Delivery & Payment'}
              {step === 'receipt' && 'Order Confirmed'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Close cart drawer"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        {step === 'receipt' && receipt ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="bg-[#EEF4FF] border border-blue-200 rounded-xl p-5 flex items-start gap-3.5">
              <CheckCircle2 className="w-6 h-6 text-[#0057E7] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs font-semibold text-[#0057E7] truncate">
                    Order #{receipt.orderId}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopyOrderId(receipt.orderId)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0057E7] hover:underline shrink-0"
                  >
                    {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
                  </button>
                </div>
                <h3 className="font-display text-lg font-bold text-[#06142E] mt-0.5">
                  Preparing Shipment from Dhaka Lab
                </h3>
                <p className="text-xs text-slate-600 mt-1">{receipt.createdAt}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-1.5 text-xs">
              <p className="font-semibold text-[#06142E]">Recipient Details</p>
              <p className="text-slate-700">
                {receipt.customerName} · <span className="font-mono">{receipt.phone}</span>
              </p>
              <p className="text-slate-600">
                {receipt.address}, {receipt.district}
              </p>
              <p className="text-slate-600">
                Payment: <strong>{receipt.paymentMethod}</strong>
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
              {receipt.items.map((item) => (
                <div
                  key={`${item.product.id}-${item.variant ?? ''}`}
                  className="p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#06142E] truncate">{item.product.name}</p>
                    <p className="text-slate-500 font-mono tabular-nums">
                      Qty {item.quantity} × ৳{item.product.price.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-[#06142E] shrink-0 tabular-nums">
                    ৳{(item.product.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              <div className="p-3.5 bg-[#F6F8FB] space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
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
                <div className="flex justify-between text-slate-600">
                  <span>Delivery ({receipt.district})</span>
                  <span className="font-mono tabular-nums">
                    {receipt.deliveryFee === 0 ? 'Free' : `৳${receipt.deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#06142E] pt-1.5 border-t border-slate-200">
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
                  className="w-full h-11 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] text-white text-sm font-semibold transition-colors"
                >
                  Track This Order
                </button>
              )}
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full h-11 rounded-lg bg-[#06142E] hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
              >
                Continue Shopping
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full h-9 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Order Receipt</span>
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F4F7FB] border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#06142E]">Your cart is empty</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              Add microcontrollers, LiDAR sensors, motors, or robotics kits to get started.
            </p>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="mt-6 px-6 py-2.5 rounded-lg bg-[#0057E7] text-white text-sm font-semibold hover:bg-[#0044BB] transition-colors"
            >
              Browse Hardware
            </button>
          </div>
        ) : step === 'cart' ? (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Free Delivery Progress Bar */}
              <div className="rounded-xl bg-[#F6F8FB] border border-slate-200 px-4 py-3 text-xs text-slate-700 space-y-2">
                {freeShipping ? (
                  <p className="font-semibold text-emerald-700">
                    Unlocked Free Nationwide Courier (Orders ≥ ৳3,000)
                  </p>
                ) : (
                  <p>
                    Add{' '}
                    <strong className="font-mono text-[#0057E7] tabular-nums">
                      ৳{(freeShippingThreshold - discountedSubtotal).toLocaleString('en-IN')}
                    </strong>{' '}
                    more for free nationwide delivery.
                  </p>
                )}
                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      freeShipping ? 'bg-emerald-600' : 'bg-[#0057E7]'
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
                    <div className="w-20 h-20 rounded-lg bg-[#F6F8FB] border border-slate-200 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                      <HardwareArtwork
                        kind={item.product.artwork}
                        imageUrl={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-sm font-semibold text-[#06142E] leading-snug line-clamp-2">
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
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.variant}</p>
                      )}
                      {outOfStock && (
                        <p className="text-[11px] text-red-600 font-semibold mt-0.5">
                          Currently out of stock — remove to checkout
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center border border-slate-200 rounded-md bg-[#F6F8FB] h-8">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.product.id, item.variant, -1)}
                            aria-label="Decrease item quantity"
                            className="w-7 h-full flex items-center justify-center text-slate-600 hover:text-slate-900"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-mono font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={atStockLimit}
                            onClick={() => onUpdateQty(item.product.id, item.variant, 1)}
                            aria-label="Increase item quantity"
                            className="w-7 h-full flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-mono text-sm font-bold text-[#06142E] tabular-nums">
                          ৳{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Promo Code Input */}
              <div className="pt-1">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5 text-xs">
                    <span className="text-emerald-800 font-medium">
                      Coupon <strong className="font-mono">{appliedCoupon}</strong> (-15%) applied
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
                      placeholder="Promo code (try ROBOTERA15)"
                      className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="submit"
                      className="h-9 px-3.5 rounded-lg bg-[#06142E] text-white text-xs font-semibold hover:bg-slate-800"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponError && <p className="text-xs text-red-600 mt-1.5">{couponError}</p>}
              </div>
            </div>

            {/* Cart Footer Summary */}
            <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-slate-200 bg-[#F9FBFD] space-y-3 shrink-0">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">
                    ৳{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Lab Discount (15%)</span>
                    <span className="font-mono tabular-nums">
                      -৳{discount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Estimated Courier</span>
                  <span className="font-mono tabular-nums">
                    {freeShipping ? 'Free' : `৳${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#06142E] pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span className="font-mono tabular-nums">৳{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={hasOutOfStockInCart}
                onClick={() => setStep('checkout')}
                className="w-full h-11 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                {hasOutOfStockInCart ? 'Remove Unavailable Items First' : 'Proceed to Checkout'}
              </button>
            </div>
          </>
        ) : (
          /* Bangladesh Checkout Step */
          <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label htmlFor="chk-name" className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label htmlFor="chk-phone" className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label htmlFor="chk-district" className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Zone
                </label>
                <select
                  id="chk-district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Dhaka Metro">Dhaka Metro (Same-Day · {freeShipping ? 'Free' : '৳60'})</option>
                  <option value="Chattogram">Chattogram (24–48h · {freeShipping ? 'Free' : '৳120'})</option>
                  <option value="Sylhet">Sylhet (24–48h · {freeShipping ? 'Free' : '৳120'})</option>
                  <option value="Rajshahi">Rajshahi (24–48h · {freeShipping ? 'Free' : '৳120'})</option>
                  <option value="Khulna">Khulna (24–48h · {freeShipping ? 'Free' : '৳120'})</option>
                  <option value="Gazipur / Savar">Gazipur / Savar ({freeShipping ? 'Free' : '৳120'})</option>
                  <option value="Other District">Other District (Steadfast · {freeShipping ? 'Free' : '৳120'})</option>
                </select>
              </div>

              <div>
                <label htmlFor="chk-address" className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <p className="block text-xs font-semibold text-slate-700 mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Cash on Delivery', 'bKash', 'Nagad', 'Card / SSLCommerz'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-semibold text-left transition-colors ${
                        paymentMethod === method
                          ? 'bg-[#06142E] border-[#06142E] text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {(paymentMethod === 'bKash' || paymentMethod === 'Nagad') && (
                <div className="rounded-xl bg-[#EEF4FF] border border-blue-200 p-3.5 text-xs text-slate-700 space-y-1">
                  <p className="font-semibold text-[#06142E]">
                    {paymentMethod} Send Money / Payment Instructions
                  </p>
                  <p>
                    Send <strong className="font-mono">৳{total.toLocaleString('en-IN')}</strong> to{' '}
                    <strong className="font-mono text-[#0057E7]">+880 1624-987366</strong> and
                    paste your Transaction ID below (or pay on confirmation call).
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="chk-notes" className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-slate-200 bg-[#F9FBFD] space-y-3 shrink-0">
              {checkoutError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {checkoutError}
                </p>
              )}
              <div className="flex justify-between text-sm font-bold text-[#06142E]">
                <span>Total Payable</span>
                <span className="font-mono tabular-nums">৳{total.toLocaleString('en-IN')}</span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {submitting
                  ? 'Placing Order...'
                  : `Confirm Order (৳${total.toLocaleString('en-IN')})`}
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
};
