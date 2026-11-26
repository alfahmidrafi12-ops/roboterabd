import React, { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Gift,
  Loader2,
  LocateFixed,
  Lock,
  LogIn,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  Printer,
  Radio,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { trackVisitorVisit } from '../lib/visitorTracker';
import {
  calculateOrderRewardPoints,
  calculateRewardValueBdt,
  checkUserPromoRedemption,
  createOrderInFirestore,
  formatPhoneForCheckoutInput,
  MIN_ORDER_FOR_REWARD_BDT,
  MIN_REWARD_REDEEM_POINTS,
  normalizePromoCodeString,
  REWARD_BDT_PER_100_POINTS,
} from '../lib/firebase';
import {
  calculateGiftCardDiscount,
  downloadGiftCardPng,
  generateGiftCardReward,
  markGiftCardRedeemed,
  MIN_GIFT_CARD_SPEND,
  saveGiftCard,
} from '../lib/giftCard';
import {
  buildOrderReceiptPdf,
  formatReceiptDateTime,
  generateOrderTrackingQrDataUrl,
  triggerPdfDownload,
} from '../lib/receiptPdf';
import {
  playErrorSound,
  playGiftCardRevealSound,
  playSuccessSound,
  playTapSound,
  playVoucherCopySound,
} from '../lib/sound';
import {
  CartItem,
  CustomerRewardBalance,
  GiftCardReward,
  OrderReceipt,
  Product,
  PromoCode,
  StoredOrder,
} from '../types/store';
import { BrandLogo } from './BrandLogo';
import { DigitalGiftCard } from './DigitalGiftCard';
import { HardwareArtwork } from './HardwareArtwork';
import { PrintReceiptSheet } from './PrintReceiptSheet';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  cartPulseKey?: number;
  recommendedProducts?: Product[];
  promoCodes?: PromoCode[];
  userOrders?: StoredOrder[];
  availableGiftCards?: GiftCardReward[];
  rewardBalance?: CustomerRewardBalance | null;
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
  onGiftCardIssued?: (
    card: GiftCardReward | null,
    redeemedCode?: string,
    orderId?: string
  ) => void;
  onTrackOrder?: (orderId: string) => void;
}

function isValidBdPhone(raw: string): boolean {
  const digits = raw.replace(/[\s\-()]/g, '');
  return /^(\+?880|0)1[3-9]\d{8}$/.test(digits);
}

const DISPATCH_STAGES = [
  'Verifying Dhaka inventory & stock count',
  'Assigning ESD packaging & lab QC slot',
  'Generating live Firestore tracking waybill',
];

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  items,
  cartPulseKey = 0,
  recommendedProducts = [],
  promoCodes = [],
  userOrders = [],
  availableGiftCards = [],
  rewardBalance = null,
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
  onGiftCardIssued,
  onTrackOrder,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'receipt'>('cart');
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [selectedGiftCardCode, setSelectedGiftCardCode] = useState<string | null>(null);
  const [redeemedRewardPoints, setRedeemedRewardPoints] = useState(0);
  const [cartPulsing, setCartPulsing] = useState(false);
  const prevPulseKeyRef = useRef(cartPulseKey);
  const prevUserUidRef = useRef<string | null>(user?.uid ?? null);

  // Checkout Form State
  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(
    user?.phoneNumber ? formatPhoneForCheckoutInput(user.phoneNumber) : ''
  );
  const [district, setDistrict] = useState('Dhaka Metro');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dispatchStageIdx, setDispatchStageIdx] = useState(0);
  const [pendingOrderId, setPendingOrderId] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [receiptPdf, setReceiptPdf] = useState<{
    blob: Blob;
    url: string;
    filename: string;
  } | null>(null);
  const [receiptQrUrl, setReceiptQrUrl] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [issuedGiftCard, setIssuedGiftCard] = useState<GiftCardReward | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedGiftCode, setCopiedGiftCode] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationNote, setLocationNote] = useState('');

  const wasOpenRef = useRef(isOpen);
  const prefilledNameUidRef = useRef<string | null>(null);
  const prefilledPhoneUidRef = useRef<string | null>(null);
  const copiedIdTimerRef = useRef<number | null>(null);
  const copiedGiftTimerRef = useRef<number | null>(null);
  const giftRevealTimerRef = useRef<number | null>(null);
  const pdfBuildSeqRef = useRef(0);

  useEffect(() => {
    return () => {
      if (copiedIdTimerRef.current) window.clearTimeout(copiedIdTimerRef.current);
      if (copiedGiftTimerRef.current) window.clearTimeout(copiedGiftTimerRef.current);
      if (giftRevealTimerRef.current) window.clearTimeout(giftRevealTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const activeUrl = receiptPdf?.url;
    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [receiptPdf?.url]);

  useEffect(() => {
    if (cartPulseKey <= prevPulseKeyRef.current) {
      prevPulseKeyRef.current = cartPulseKey;
      return;
    }
    prevPulseKeyRef.current = cartPulseKey;
    if (!isOpen) return;

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
  }, [cartPulseKey, isOpen]);

  // Reset user-specific state on account switch/sign-out and prefill verified details once per UID
  useEffect(() => {
    const currentUid = user?.uid ?? null;
    if (prevUserUidRef.current !== currentUid) {
      prevUserUidRef.current = currentUid;
      prefilledNameUidRef.current = null;
      prefilledPhoneUidRef.current = null;
      setSelectedGiftCardCode(null);
      setRedeemedRewardPoints(0);
      setReceipt(null);
      setReceiptPdf(null);
      setReceiptQrUrl('');
      setGeneratingPdf(false);
      setIssuedGiftCard(null);
      setCheckoutError('');
      setCouponError('');
      setStep((prevStep) => (prevStep === 'receipt' ? 'cart' : prevStep));
      setCustomerName(user?.displayName || '');
      setPhone(user?.phoneNumber ? formatPhoneForCheckoutInput(user.phoneNumber) : '');
      if (currentUid && user?.displayName) prefilledNameUidRef.current = currentUid;
      if (currentUid && user?.phoneNumber) prefilledPhoneUidRef.current = currentUid;
      return;
    }

    if (currentUid && user?.displayName && prefilledNameUidRef.current !== currentUid) {
      prefilledNameUidRef.current = currentUid;
      setCustomerName((prev) => prev || user.displayName || '');
    }
    if (currentUid && user?.phoneNumber && prefilledPhoneUidRef.current !== currentUid) {
      prefilledPhoneUidRef.current = currentUid;
      setPhone((prev) =>
        prev || (user.phoneNumber ? formatPhoneForCheckoutInput(user.phoneNumber) : '')
      );
    }
  }, [user?.uid, user?.displayName, user?.phoneNumber]);

  useEffect(() => {
    if (items.length === 0 && step === 'checkout') {
      setStep('cart');
    }
  }, [items.length, step]);

  // Only route to checkout / clear stale receipt on drawer open transitions so "Back to Cart" stays usable
  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;

    if (!isOpen) return;

    if (justOpened) {
      setCouponError('');
      setCheckoutError('');
      setCopiedId(false);
      if (items.length > 0 && step === 'receipt') {
        setStep(startInCheckout ? 'checkout' : 'cart');
        setReceipt(null);
        setReceiptPdf(null);
        setReceiptQrUrl('');
        setGeneratingPdf(false);
        setIssuedGiftCard(null);
      } else if (startInCheckout && items.length > 0) {
        setStep('checkout');
      }
    }
  }, [isOpen, startInCheckout, items.length, step]);

  useEffect(() => {
    if (!isOpen || !appliedCoupon || !user?.uid) return;
    let active = true;
    checkUserPromoRedemption(appliedCoupon, user.uid, user.email).then((alreadyUsed) => {
      if (active && alreadyUsed) {
        onApplyCoupon(null);
        setCouponError(
          `Promo code ${appliedCoupon} was already redeemed with this account or Gmail address.`
        );
      }
    });
    return () => {
      active = false;
    };
  }, [isOpen, appliedCoupon, user?.uid, user?.email, onApplyCoupon]);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const matchedPromo = appliedCoupon
    ? promoCodes.find(
        (p) => p.code.toUpperCase() === appliedCoupon.toUpperCase() && p.active
      ) ?? null
    : null;

  const isPromoLocallyUsed = matchedPromo
    ? userOrders.some(
        (o) => o.couponCode?.toUpperCase() === matchedPromo.code.toUpperCase()
      )
    : false;

  const isPromoEligible = Boolean(
    user &&
      matchedPromo &&
      !isPromoLocallyUsed &&
      (!matchedPromo.firstOrderOnly || !hasPlacedOrderBefore) &&
      (!matchedPromo.minOrderAmount || subtotal >= matchedPromo.minOrderAmount)
  );

  const effectivePromo = isPromoEligible ? matchedPromo : null;
  const effectiveCoupon = effectivePromo?.code ?? null;

  const unredeemedGiftCards = user
    ? availableGiftCards.filter((c) => !c.redeemed && c.userId === user.uid)
    : [];
  const activeGiftCard =
    !effectivePromo && selectedGiftCardCode
      ? unredeemedGiftCards.find(
          (c) => c.code.toUpperCase() === selectedGiftCardCode.toUpperCase()
        ) ?? null
      : null;

  let promoOrGiftDiscount = 0;
  if (effectivePromo) {
    if (effectivePromo.discountType === 'percent') {
      const rawDiscount = Math.round((subtotal * effectivePromo.discountValue) / 100);
      promoOrGiftDiscount =
        effectivePromo.maxDiscountAmount && effectivePromo.maxDiscountAmount > 0
          ? Math.min(rawDiscount, effectivePromo.maxDiscountAmount)
          : rawDiscount;
    } else {
      promoOrGiftDiscount = Math.round(effectivePromo.discountValue);
    }
    promoOrGiftDiscount = Math.min(subtotal, Math.max(0, promoOrGiftDiscount));
  } else if (activeGiftCard) {
    promoOrGiftDiscount = Math.min(subtotal, Math.max(0, Math.round(activeGiftCard.value)));
  }

  const subtotalAfterPromoOrGift = Math.max(0, subtotal - promoOrGiftDiscount);
  const availableRewardPoints = user
    ? Math.max(0, Math.floor(rewardBalance?.availablePoints ?? 0))
    : 0;
  const maxByBalance = Math.floor(availableRewardPoints / 100) * 100;
  const maxBySubtotal =
    Math.floor(subtotalAfterPromoOrGift / REWARD_BDT_PER_100_POINTS) * 100;
  const maxRedeemableRewardPoints = Math.max(0, Math.min(maxByBalance, maxBySubtotal));

  useEffect(() => {
    if (!user) {
      if (redeemedRewardPoints !== 0) setRedeemedRewardPoints(0);
      return;
    }
    if (redeemedRewardPoints > maxRedeemableRewardPoints) {
      setRedeemedRewardPoints(maxRedeemableRewardPoints);
    }
  }, [user, redeemedRewardPoints, maxRedeemableRewardPoints]);

  if (!isOpen) return null;

  const appliedRewardPoints =
    user &&
    redeemedRewardPoints >= MIN_REWARD_REDEEM_POINTS &&
    redeemedRewardPoints % 100 === 0
      ? Math.min(redeemedRewardPoints, maxRedeemableRewardPoints)
      : 0;
  const rewardDiscount =
    appliedRewardPoints > 0
      ? Math.round((appliedRewardPoints / 100) * REWARD_BDT_PER_100_POINTS)
      : 0;

  const discount = Math.min(subtotal, promoOrGiftDiscount + rewardDiscount);
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const giftCardPreview = calculateGiftCardDiscount(discountedSubtotal);
  const earnedPointsPreview = calculateOrderRewardPoints({
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
  });
  const remainingForReward = Math.max(0, MIN_ORDER_FOR_REWARD_BDT - discountedSubtotal);
  const isInsideDhaka = district === 'Dhaka Metro';
  const estimatedDeliveryWindow = isInsideDhaka ? '2–3 days' : '2–4 days';
  const deliveryFee = items.length > 0 ? (isInsideDhaka ? 80 : 150) : 0;
  const total = discountedSubtotal + deliveryFee;

  const hasOutOfStockInCart = items.some((item) => item.product.stock <= 0);

  const stepIndex = step === 'cart' ? 0 : step === 'checkout' ? 1 : 2;
  const stepBarPct = step === 'cart' ? 33 : step === 'checkout' ? 68 : 100;

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkingCoupon) return;
    const cleaned = normalizePromoCodeString(couponInput);
    if (!cleaned) {
      playErrorSound();
      setCouponError('Please enter a promo code.');
      return;
    }

    if (!user) {
      playErrorSound();
      setCouponError('Please sign in with your account / Gmail first to apply a promo code.');
      return;
    }

    const promo = promoCodes.find((p) => p.code.toUpperCase() === cleaned);
    if (!promo || !promo.active) {
      playErrorSound();
      setCouponError('Invalid or inactive promo code.');
      return;
    }

    if (promo.firstOrderOnly && hasPlacedOrderBefore) {
      playErrorSound();
      setCouponError(`${promo.code} is valid only on your 1st order.`);
      return;
    }

    if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
      playErrorSound();
      setCouponError(
        `${promo.code} requires a minimum order of ৳${promo.minOrderAmount.toLocaleString('en-IN')}.`
      );
      return;
    }

    if (userOrders.some((o) => o.couponCode?.toUpperCase() === promo.code.toUpperCase())) {
      playErrorSound();
      setCouponError(
        `Promo code ${promo.code} has already been used by your account (1 use per account & Gmail).`
      );
      return;
    }

    setCheckingCoupon(true);
    setCouponError('');
    try {
      const alreadyRedeemed = await checkUserPromoRedemption(
        promo.code,
        user.uid,
        user.email
      );
      if (alreadyRedeemed) {
        playErrorSound();
        setCouponError(
          `Promo code ${promo.code} has already been used by this account or Gmail address (1 use limit).`
        );
        return;
      }
      playSuccessSound();
      setSelectedGiftCardCode(null);
      onApplyCoupon(promo.code);
      setCouponError('');
      setCouponInput('');
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || items.length === 0) return;

    if (!user) {
      playErrorSound();
      setCheckoutError('Please sign in or create an account before placing an order.');
      onOpenAuth();
      return;
    }

    const trimmedName = customerName.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();

    if (trimmedName.length < 2) {
      playErrorSound();
      setCheckoutError('Please enter your full name.');
      return;
    }
    if (!isValidBdPhone(trimmedPhone)) {
      playErrorSound();
      setCheckoutError('Please enter a valid 11-digit Bangladesh mobile number (e.g. 017XXXXXXXX).');
      return;
    }
    if (trimmedAddress.length < 5) {
      playErrorSound();
      setCheckoutError('Please provide your full street / campus delivery address.');
      return;
    }
    if (hasOutOfStockInCart) {
      playErrorSound();
      setCheckoutError('Please remove out-of-stock items before placing your order.');
      return;
    }

    const orderNumber = `RBD-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
    setPendingOrderId(orderNumber);
    setDispatchStageIdx(0);
    setSubmitting(true);
    setCheckoutError('');

    const stageTimer1 = window.setTimeout(() => setDispatchStageIdx(1), 240);
    const stageTimer2 = window.setTimeout(() => setDispatchStageIdx(2), 480);

    try {
      const giftNote = activeGiftCard
        ? `Gift Card Redeemed: ${activeGiftCard.code} (-৳${promoOrGiftDiscount})`
        : '';
      const rewardNote =
        appliedRewardPoints > 0
          ? `Reward Redeemed: -${appliedRewardPoints} pts (-৳${rewardDiscount})`
          : '';
      const combinedNotes = [orderNotes.trim(), giftNote, rewardNote]
        .filter(Boolean)
        .join(' · ')
        .slice(0, 300);

      const orderPlacedAt = new Date();
      const formattedTs = formatReceiptDateTime(orderPlacedAt);

      const newReceipt: OrderReceipt = {
        orderId: orderNumber,
        customerName: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress,
        district,
        paymentMethod,
        status: 'Pending',
        items: [...items],
        subtotal,
        discount,
        couponCode: effectiveCoupon ?? activeGiftCard?.code ?? undefined,
        rewardPointsRedeemed: appliedRewardPoints > 0 ? appliedRewardPoints : undefined,
        rewardDiscount: rewardDiscount > 0 ? rewardDiscount : undefined,
        deliveryFee,
        total,
        notes: combinedNotes || undefined,
        createdAt: formattedTs.fullDateTime,
        createdAtIso: formattedTs.isoString,
      };

      const rewardCard = generateGiftCardReward(newReceipt, user.uid);

      const minAnimPromise = new Promise<void>((resolve) => window.setTimeout(resolve, 750));
      const writePromise = createOrderInFirestore(
        {
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
          rewardPointsRedeemed: appliedRewardPoints > 0 ? appliedRewardPoints : undefined,
          rewardDiscount: rewardDiscount > 0 ? rewardDiscount : undefined,
          notes: combinedNotes || undefined,
        },
        {
          earnedGiftCard: rewardCard,
          redeemedGiftCardCode: activeGiftCard?.code,
        }
      );

      await Promise.all([writePromise, minAnimPromise]);

      if (rewardCard) {
        saveGiftCard(rewardCard, user.uid);
      }
      if (activeGiftCard) {
        markGiftCardRedeemed(activeGiftCard.code, orderNumber, user.uid);
      }
      onGiftCardIssued?.(rewardCard, activeGiftCard?.code, orderNumber);

      playSuccessSound();
      if (rewardCard) {
        if (giftRevealTimerRef.current) window.clearTimeout(giftRevealTimerRef.current);
        giftRevealTimerRef.current = window.setTimeout(() => playGiftCardRevealSound(), 240);
      }
      setReceipt(newReceipt);
      setIssuedGiftCard(rewardCard);
      setCopiedGiftCode(false);
      setSelectedGiftCardCode(null);
      setRedeemedRewardPoints(0);
      setStep('receipt');
      setOrderNotes('');
      if (effectiveCoupon) {
        onApplyCoupon(null);
      }
      onOrderCreated?.(orderNumber);
      onClearCart();

      // Auto-prepare A4 PDF receipt + scannable QR immediately and trigger automatic download
      const seq = ++pdfBuildSeqRef.current;
      setGeneratingPdf(true);
      setReceiptPdf(null);
      setReceiptQrUrl('');
      void Promise.all([
        buildOrderReceiptPdf(newReceipt),
        generateOrderTrackingQrDataUrl(newReceipt.orderId),
      ])
        .then(([{ blob, filename }, qrUrl]) => {
          if (pdfBuildSeqRef.current !== seq) return;
          const url = URL.createObjectURL(blob);
          setReceiptPdf({ blob, url, filename });
          setReceiptQrUrl(qrUrl);
          setGeneratingPdf(false);
          triggerPdfDownload(blob, filename);
        })
        .catch((pdfErr) => {
          console.error('Automatic A4 PDF generation error:', pdfErr);
          if (pdfBuildSeqRef.current === seq) {
            setGeneratingPdf(false);
          }
        });
    } catch (err) {
      console.error('Order submission error:', err);
      playErrorSound();
      const errMsg = err instanceof Error ? err.message : String(err);
      if (effectiveCoupon && errMsg.toLowerCase().includes('permission')) {
        setCheckoutError(
          `Promo code ${effectiveCoupon} has already been used by this account or Gmail address (1 use limit). Please remove the promo code or switch accounts.`
        );
      } else {
        setCheckoutError('Could not submit order. Please check your details and try again.');
      }
    } finally {
      window.clearTimeout(stageTimer1);
      window.clearTimeout(stageTimer2);
      setSubmitting(false);
    }
  };

  const handleDownloadReceiptPdf = async () => {
    if (!receipt) return;
    playTapSound();
    if (receiptPdf) {
      triggerPdfDownload(receiptPdf.blob, receiptPdf.filename);
      return;
    }
    setGeneratingPdf(true);
    try {
      const { blob, filename } = await buildOrderReceiptPdf(receipt);
      const url = URL.createObjectURL(blob);
      setReceiptPdf({ blob, url, filename });
      triggerPdfDownload(blob, filename);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrintA4Sheet = () => {
    if (!receipt) return;
    playTapSound();
    document.body.classList.add('printing-a4-receipt');
    const cleanup = () => {
      document.body.classList.remove('printing-a4-receipt');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.setTimeout(() => {
      window.print();
      window.setTimeout(cleanup, 1500);
    }, 60);
  };

  const handleResetAndClose = () => {
    if (submitting) return;
    pdfBuildSeqRef.current += 1;
    setStep('cart');
    setReceipt(null);
    setReceiptPdf(null);
    setReceiptQrUrl('');
    setGeneratingPdf(false);
    setIssuedGiftCard(null);
    setCopiedGiftCode(false);
    setCheckoutError('');
    setCouponError('');
    onClose();
  };

  const handleCopyOrderId = (id: string) => {
    playTapSound();
    navigator.clipboard?.writeText(id).catch(() => {});
    setCopiedId(true);
    if (copiedIdTimerRef.current) window.clearTimeout(copiedIdTimerRef.current);
    copiedIdTimerRef.current = window.setTimeout(() => setCopiedId(false), 1800);
  };

  const handleCopyGiftCode = (code: string) => {
    playVoucherCopySound();
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedGiftCode(true);
    if (copiedGiftTimerRef.current) window.clearTimeout(copiedGiftTimerRef.current);
    copiedGiftTimerRef.current = window.setTimeout(() => setCopiedGiftCode(false), 1800);
  };

  const emptyRecommendations = recommendedProducts.filter((p) => p.stock > 0).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="animate-fade-in fixed inset-0 bg-[#071A3B]/60 backdrop-blur-[2px]"
        onClick={handleResetAndClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart and checkout"
        className="animate-drawer-in relative z-10 w-full max-w-md bg-white h-dvh shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="bg-[#F1F5F9] border-b border-slate-200 shrink-0">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {step === 'checkout' && !submitting && (
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setStep('cart');
                  }}
                  aria-label="Back to cart"
                  className="p-1.5 -ml-2 rounded-lg text-[#64748B] hover:text-[#101828] hover:bg-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              {step === 'cart' && (
                <span
                  className={`relative w-8 h-8 rounded-lg flex items-center justify-center border transition-colors duration-200 ${
                    cartPulsing
                      ? 'bg-[#071A3B] border-[#00CFFF]/70 text-[#00CFFF]'
                      : 'bg-white border-slate-200 text-[#071A3B]'
                  }`}
                >
                  {cartPulsing && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-1 rounded-lg bg-[#00CFFF]/25 ring-1 ring-[#00CFFF]/55 animate-cart-pulse-ring"
                    />
                  )}
                  <ShoppingBag
                    className={`w-4 h-4 ${cartPulsing ? 'animate-cart-pulse' : ''}`}
                  />
                </span>
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
              disabled={submitting}
              aria-label="Close cart drawer"
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#101828] hover:bg-white transition-colors disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3-Step Animated Order Journey Bar */}
          {(items.length > 0 || step === 'receipt') && (
            <div className="px-6 pb-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider">
                {['01 Cart', '02 Checkout', '03 Confirmed'].map((label, idx) => (
                  <span
                    key={label}
                    className={`transition-colors ${
                      idx === stepIndex
                        ? 'text-[#0866F5]'
                        : idx < stepIndex
                        ? 'text-[#0F766E]'
                        : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="h-1 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0866F5] to-[#0F766E] transition-all duration-500 ease-out"
                  style={{ width: `${stepBarPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Body Content */}
        {step === 'receipt' && receipt ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {/* Heroic Post-Order Animated Confirmation Card */}
            <div className="relative overflow-hidden rounded-2xl bg-[#071A3B] text-white p-5 sm:p-6 border border-[#1B3E78]">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-65" />

              {/* Geometric animated celebratory corner sparks */}
              <span
                aria-hidden="true"
                className="animate-spark-pop pointer-events-none absolute top-4 right-8 w-2 h-2 rounded-full bg-[#38BDF8]"
              />
              <span
                aria-hidden="true"
                className="animate-spark-pop pointer-events-none absolute top-10 right-5 w-1.5 h-1.5 rounded-full bg-[#FB923C]"
                style={{ animationDelay: '0.42s' }}
              />
              <span
                aria-hidden="true"
                className="animate-spark-pop pointer-events-none absolute bottom-5 right-10 w-2 h-2 rounded-sm rotate-45 bg-[#2DD4BF]"
                style={{ animationDelay: '0.5s' }}
              />

              <div className="relative z-10 flex items-start gap-4">
                {/* Animated SVG Circle + Checkmark Draw */}
                <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                  <span
                    aria-hidden="true"
                    className="animate-ring-expand absolute inset-0 rounded-full border border-[#2DD4BF]/60"
                  />
                  <svg viewBox="0 0 56 56" className="w-12 h-12" fill="none" aria-hidden="true">
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      stroke="#2DD4BF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="animate-circle-draw"
                    />
                    <path
                      d="M17.5 28.5L24.5 35.5L38.5 21.5"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-check-draw"
                    />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-xs font-bold text-[#38BDF8] truncate">
                      Order #{receipt.orderId}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopyOrderId(receipt.orderId)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-semibold text-white shrink-0 transition-colors"
                    >
                      {copiedId ? (
                        <Check className="w-3 h-3 text-[#2DD4BF] animate-icon-pop" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
                    </button>
                  </div>
                  <h3 className="font-display text-lg font-bold text-white mt-1 leading-snug">
                    Order Confirmed &amp; Queued
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">{receipt.createdAt}</p>
                </div>
              </div>

              {/* Mini Animated Live Dispatch Strip */}
              <div className="relative z-10 mt-4 pt-3.5 border-t border-white/15 grid grid-cols-4 gap-1.5 text-center">
                {[
                  { icon: ClipboardCheck, label: 'Placed', active: true },
                  { icon: PackageCheck, label: 'Lab QC', active: false },
                  { icon: Truck, label: 'Courier', active: false },
                  { icon: CheckCircle2, label: 'Delivered', active: false },
                ].map((stage) => {
                  const Icon = stage.icon;
                  return (
                    <div
                      key={stage.label}
                      className={`rounded-lg py-1.5 px-1 border text-[10px] font-mono ${
                        stage.active
                          ? 'bg-[#0866F5]/30 border-[#38BDF8]/60 text-white font-bold'
                          : 'bg-white/[0.04] border-white/10 text-slate-400'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 mx-auto mb-0.5 ${
                          stage.active ? 'text-[#2DD4BF]' : 'text-slate-500'
                        }`}
                      />
                      {stage.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Auto-Generated A4 PDF Receipt + Tracking QR Ready Card */}
            <div className="animate-cart-enter rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-[0_8px_24px_-16px_rgba(7,26,61,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <BrandLogo size="sm" className="border-slate-200" />
                  <div className="min-w-0">
                    <p className="font-display text-xs sm:text-sm font-bold text-[#071A3B] truncate inline-flex items-center gap-1.5">
                      {generatingPdf && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0866F5]" />}
                      <span>
                        {generatingPdf ? 'Preparing A4 PDF & QR...' : 'Print-Ready A4 Receipt & QR'}
                      </span>
                    </p>
                    <p className="text-[11px] font-mono text-[#475569] truncate">
                      {receiptPdf
                        ? receiptPdf.filename
                        : `Order #${receipt.orderId} · ${receipt.createdAt}`}
                    </p>
                  </div>
                </div>
                {receiptQrUrl ? (
                  <img
                    src={receiptQrUrl}
                    alt={`Tracking QR for ${receipt.orderId}`}
                    className="w-12 h-12 rounded-lg border border-slate-200 bg-white p-0.5 shrink-0"
                  />
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[#071A3B] border border-slate-200 font-mono text-[10px] font-bold shrink-0">
                    A4 QR
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadReceiptPdf}
                  disabled={generatingPdf}
                  className="h-10 rounded-xl bg-[#071A3B] hover:bg-[#0D2B5E] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  {generatingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-[#00CFFF]" />
                  )}
                  <span>{generatingPdf ? 'Generating...' : 'Download A4 PDF'}</span>
                </button>
                {receiptPdf ? (
                  <a
                    href={receiptPdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 rounded-xl border border-[#0866F5]/30 bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#0866F5] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Preview A4 PDF</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handlePrintA4Sheet}
                    className="h-10 rounded-xl border border-slate-200 bg-white hover:bg-[#F5F8FC] text-[#475569] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print A4 Sheet</span>
                  </button>
                )}
              </div>
            </div>

            {/* Post-Order Holographic Digital Gift Card (Orders >= ৳500 · ৳3 per ৳100) */}
            {issuedGiftCard ? (
              <DigitalGiftCard
                card={issuedGiftCard}
                copied={copiedGiftCode}
                onCopy={handleCopyGiftCode}
                onDownload={downloadGiftCardPng}
                variant="receipt"
              />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 flex items-center gap-3 text-xs text-[#475569]">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#0866F5] shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <p className="leading-snug">
                  Digital Gift Cards (<strong className="text-[#071A3B]">৳3 discount per ৳100</strong>) unlock on orders of{' '}
                  <strong className="font-mono text-[#071A3B]">৳{MIN_GIFT_CARD_SPEND}+</strong> eligible hardware spend.
                </p>
              </div>
            )}

            <div
              className="animate-cart-enter border border-slate-200 rounded-xl p-4 space-y-1.5 text-xs bg-[#F8FAFC]"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-[#071A3B] inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0866F5]" />
                  <span>Recipient &amp; Dispatch Details</span>
                </p>
                <span className="font-mono text-[10px] font-bold text-[#0F766E]">
                  {receipt.district === 'Dhaka Metro' ? '2–3 Days' : '2–4 Days'}
                </span>
              </div>
              <p className="text-[#101828] font-medium">
                {receipt.customerName} · <span className="font-mono">{receipt.phone}</span>
              </p>
              <p className="text-[#475569]">
                {receipt.address}, {receipt.district}
              </p>
              <p className="text-[#475569]">
                Payment: <strong className="text-[#071A3B]">{receipt.paymentMethod}</strong>
              </p>
            </div>

            <div
              className="animate-cart-enter border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden"
              style={{ animationDelay: '180ms' }}
            >
              {receipt.items.map((item) => (
                <div
                  key={`${item.product.id}-${item.variant ?? ''}`}
                  className="p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] border border-slate-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                      <HardwareArtwork
                        kind={item.product.artwork}
                        imageUrl={item.product.imageUrl}
                        alt={item.product.name}
                        fit="contain"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#071A3B] truncate">{item.product.name}</p>
                      <p className="text-[#64748B] font-mono tabular-nums truncate">
                        {item.product.sku} · Qty {item.quantity} × ৳{item.product.price.toLocaleString('en-IN')}
                      </p>
                    </div>
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
                  <>
                    {receipt.discount - (receipt.rewardDiscount ?? 0) > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Discount ({receipt.couponCode || 'Promo'})</span>
                        <span className="font-mono tabular-nums">
                          -৳{(receipt.discount - (receipt.rewardDiscount ?? 0)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    {(receipt.rewardDiscount ?? 0) > 0 && (
                      <div className="flex justify-between text-[#0866F5] font-medium">
                        <span>Reward Points (-{receipt.rewardPointsRedeemed ?? 0} pts)</span>
                        <span className="font-mono tabular-nums">
                          -৳{(receipt.rewardDiscount ?? 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between text-[#64748B]">
                  <span>Delivery ({receipt.district})</span>
                  <span className="font-mono tabular-nums">
                    ৳{receipt.deliveryFee}
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

            <div
              className="animate-cart-enter grid grid-cols-1 sm:grid-cols-2 gap-2.5"
              style={{ animationDelay: '240ms' }}
            >
              {onTrackOrder && (
                <button
                  type="button"
                  onClick={() => {
                    const id = receipt.orderId;
                    handleResetAndClose();
                    onTrackOrder(id);
                  }}
                  className="group w-full h-11 rounded-xl bg-[#0866F5] hover:bg-[#0654CC] border border-[#0866F5] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Radio className="w-4 h-4 text-[#2DD4BF] animate-pulse" />
                  <span>Track Order Live</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full h-11 rounded-xl bg-[#071A3B] hover:bg-[#0D2B5E] border border-[#071A3B] text-white text-sm font-semibold transition-colors"
              >
                Continue Shopping
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrintA4Sheet}
              className="w-full h-9 rounded-xl border border-slate-200 hover:bg-[#F5F8FC] text-xs font-semibold text-[#64748B] inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Receipt Sheet</span>
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between gap-6">
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              {/* Custom Engineering Cart Illustration with Smooth Hover Float */}
              <div className="animate-float-slow w-24 h-24 rounded-3xl bg-[#F5F8FC] border border-slate-200 flex items-center justify-center mb-5">
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
                className="mt-5 px-6 py-2.5 rounded-xl bg-[#0866F5] hover:bg-[#0654CC] border border-[#0866F5] text-white text-sm font-semibold transition-colors"
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
                  {emptyRecommendations.map((prod, idx) => (
                    <div
                      key={prod.id}
                      style={{ animationDelay: `${idx * 65}ms` }}
                      className="animate-cart-enter flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-[#F5F8FC] hover:border-[#0866F5]/50 transition-colors"
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
              {/* Courier Rates + Gift Card Eligibility Progress */}
              <div className="rounded-xl bg-[#F5F8FC] border border-slate-200 px-4 py-3 text-xs text-[#101828] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-[#334155]">
                  <span className="font-semibold text-[#071A3B] inline-flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#0866F5] shrink-0" />
                    <span>Courier Dispatch Rates</span>
                  </span>
                  <span className="font-mono tabular-nums text-[#0F172A]">
                    Dhaka <strong className="text-[#0866F5]">৳80</strong> · Outside{' '}
                    <strong className="text-[#0866F5]">৳150</strong>
                  </span>
                </div>

                <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-[#334155] min-w-0">
                    <Gift className="w-3.5 h-3.5 text-[#0866F5] shrink-0" />
                    {giftCardPreview.eligible ? (
                      <span className="truncate">
                        Earns a{' '}
                        <strong className="font-mono text-[#0F766E] tabular-nums">
                          ৳{giftCardPreview.value} Gift Card
                        </strong>{' '}
                        (৳3/৳100)
                      </span>
                    ) : (
                      <span className="truncate">
                        Spend{' '}
                        <strong className="font-mono text-[#071A3B] tabular-nums">
                          ৳{giftCardPreview.remainingToUnlock.toLocaleString('en-IN')}
                        </strong>{' '}
                        more (min ৳{MIN_GIFT_CARD_SPEND}) for Gift Card
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-[#0866F5] shrink-0 tabular-nums">
                    ৳3 / ৳100
                  </span>
                </div>
              </div>

              {items.map((item, idx) => {
                const outOfStock = item.product.stock <= 0;
                const atStockLimit = item.quantity >= item.product.stock;
                return (
                  <div
                    key={`${item.product.id}-${item.variant ?? ''}`}
                    style={{ animationDelay: `${Math.min(idx * 50, 220)}ms` }}
                    className="animate-cart-enter flex gap-3.5 pb-4 border-b border-slate-100"
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
                          className="text-slate-400 hover:text-red-600 p-1 shrink-0 transition-colors"
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
                {effectivePromo ? (
                  <div className="animate-pop-in flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5 text-xs">
                    <span className="text-emerald-800 font-medium">
                      Promo <strong className="font-mono">{effectivePromo.code}</strong> (
                      {effectivePromo.discountType === 'percent'
                        ? `-${effectivePromo.discountValue}%`
                        : `-৳${effectivePromo.discountValue.toLocaleString('en-IN')}`}
                      ) applied
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
                          ? 'Sign in with Gmail/account to apply promo'
                          : 'Enter promo code (1x per account & Gmail)'
                      }
                      className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs font-mono uppercase placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-[#0866F5]"
                    />
                    <button
                      type="submit"
                      disabled={checkingCoupon}
                      className="h-9 px-3.5 rounded-lg bg-[#071A3B] text-white text-xs font-semibold hover:bg-[#0866F5] disabled:opacity-50 transition-colors"
                    >
                      {checkingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </form>
                )}
                {couponError && <p className="text-xs text-red-600 mt-1.5">{couponError}</p>}

                {/* Redeem Earned Digital Gift Card Credit (Mutually Exclusive with Promo) */}
                {unredeemedGiftCards.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    {activeGiftCard ? (
                      <div className="animate-pop-in flex items-center justify-between bg-[#071A3B] text-white border border-[#00CFFF]/45 rounded-xl px-3.5 py-2.5 text-xs">
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          <Gift className="w-3.5 h-3.5 text-[#00CFFF] shrink-0" />
                          <span className="truncate">
                            Gift Card <strong className="font-mono">{activeGiftCard.code}</strong> (-৳
                            {promoOrGiftDiscount.toLocaleString('en-IN')}) applied
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            playTapSound();
                            setSelectedGiftCardCode(null);
                          }}
                          className="text-sky-300 hover:underline font-semibold shrink-0 ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-[#EFF6FF] border border-blue-200 px-3 py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex items-center gap-2">
                          <Gift className="w-4 h-4 text-[#0866F5] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-[#071A3B] truncate">
                              Use Gift Card {unredeemedGiftCards[0].code}
                            </p>
                            <p className="text-[10.5px] text-[#475569] tabular-nums">
                              ৳{unredeemedGiftCards[0].value.toLocaleString('en-IN')} credit available
                              {effectivePromo ? ' · Remove promo to use' : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            playSuccessSound();
                            if (effectivePromo) onApplyCoupon(null);
                            setSelectedGiftCardCode(unredeemedGiftCards[0].code);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#071A3B] hover:bg-[#087BFF] text-white text-[11px] font-semibold shrink-0 transition-colors"
                        >
                          Apply -৳{unredeemedGiftCards[0].value}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Use Your Robotera Reward Points (100 pts = ৳8) */}
                {user && (
                  <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#071A3B]">
                        <Coins className="w-3.5 h-3.5 text-[#0866F5]" />
                        <span>Use Your Robotera Reward Points</span>
                      </span>
                      <span className="font-mono text-[11px] font-bold text-[#0866F5] tabular-nums">
                        {availableRewardPoints.toLocaleString('en-IN')} pts (৳
                        {calculateRewardValueBdt(availableRewardPoints).toFixed(2)})
                      </span>
                    </div>

                    {maxRedeemableRewardPoints >= MIN_REWARD_REDEEM_POINTS ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={appliedRewardPoints <= 0}
                            onClick={() => {
                              playTapSound();
                              setRedeemedRewardPoints((prev) => Math.max(0, prev - 100));
                            }}
                            aria-label="Decrease redeemed points by 100"
                            className="w-7 h-7 rounded-lg border border-slate-200 bg-[#F5F8FC] hover:bg-slate-200 text-[#071A3B] font-mono text-xs font-bold disabled:opacity-35 transition-colors"
                          >
                            -100
                          </button>
                          <span className="px-2 font-mono text-xs font-bold text-[#071A3B] tabular-nums">
                            {appliedRewardPoints.toLocaleString('en-IN')} pts
                          </span>
                          <button
                            type="button"
                            disabled={appliedRewardPoints + 100 > maxRedeemableRewardPoints}
                            onClick={() => {
                              playTapSound();
                              setRedeemedRewardPoints((prev) =>
                                Math.min(maxRedeemableRewardPoints, prev + 100)
                              );
                            }}
                            aria-label="Increase redeemed points by 100"
                            className="w-7 h-7 rounded-lg border border-slate-200 bg-[#F5F8FC] hover:bg-slate-200 text-[#071A3B] font-mono text-xs font-bold disabled:opacity-35 transition-colors"
                          >
                            +100
                          </button>
                          <button
                            type="button"
                            disabled={appliedRewardPoints === maxRedeemableRewardPoints}
                            onClick={() => {
                              playSuccessSound();
                              setRedeemedRewardPoints(maxRedeemableRewardPoints);
                            }}
                            className="px-2 h-7 rounded-lg bg-[#071A3B] hover:bg-[#0866F5] text-white text-[10.5px] font-semibold disabled:opacity-35 transition-colors"
                          >
                            Max
                          </button>
                          {appliedRewardPoints > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                playTapSound();
                                setRedeemedRewardPoints(0);
                              }}
                              className="text-[11px] font-semibold text-[#64748B] hover:text-red-600 px-1"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <span className="font-mono text-xs font-bold text-emerald-700 tabular-nums">
                          {rewardDiscount > 0 ? `-৳${rewardDiscount}` : '100 pts = ৳8'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[10.5px] text-[#64748B] leading-snug">
                        {availableRewardPoints < MIN_REWARD_REDEEM_POINTS
                          ? `Minimum ${MIN_REWARD_REDEEM_POINTS} pts required to redeem (100 pts = ৳${REWARD_BDT_PER_100_POINTS} off).`
                          : 'Remaining product subtotal is under ৳8 for reward redemption.'}
                      </p>
                    )}
                  </div>
                )}
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
                {promoOrGiftDiscount > 0 && effectivePromo && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>
                      Promo {effectivePromo.code} (
                      {effectivePromo.discountType === 'percent'
                        ? `${effectivePromo.discountValue}%`
                        : `৳${effectivePromo.discountValue.toLocaleString('en-IN')}`}
                      )
                    </span>
                    <span className="font-mono tabular-nums">
                      -৳{promoOrGiftDiscount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {promoOrGiftDiscount > 0 && activeGiftCard && (
                  <div className="flex justify-between text-[#0866F5] font-semibold">
                    <span>Gift Card ({activeGiftCard.code})</span>
                    <span className="font-mono tabular-nums">
                      -৳{promoOrGiftDiscount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {rewardDiscount > 0 && (
                  <div className="flex justify-between text-[#0866F5] font-semibold">
                    <span>Reward Points (-{appliedRewardPoints} pts)</span>
                    <span className="font-mono tabular-nums">
                      -৳{rewardDiscount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] text-[#475569]">
                  <span className="inline-flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-[#0866F5]" />
                    <span>Reward Points (100 pts / ৳1,000)</span>
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#0F766E]">
                    {earnedPointsPreview > 0
                      ? `+${earnedPointsPreview} pts (৳${calculateRewardValueBdt(earnedPointsPreview).toFixed(0)})`
                      : `Need ৳${remainingForReward.toLocaleString('en-IN')} more`}
                  </span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Shipping Estimate ({estimatedDeliveryWindow})</span>
                  <span className="font-mono tabular-nums text-[#101828]">
                    ৳{deliveryFee}
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
                onClick={() => {
                  playTapSound();
                  setStep('checkout');
                }}
                className="cta-sheen active:scale-[0.98] group w-full h-11 rounded-xl bg-[#0866F5] hover:bg-[#0866F5]/90 border border-[#0866F5] hover:border-[#1685FF] text-white transition-all disabled:bg-slate-300 disabled:border-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-sm font-semibold inline-flex items-center justify-center gap-2"
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
                {!hasOutOfStockInCart && (
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                )}
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
          /* Bangladesh Pre-Order Checkout Step + Embedded Verification Sequence Overlay */
          <form onSubmit={handlePlaceOrder} className="relative flex-1 flex flex-col overflow-hidden">
            {submitting && (
              <div className="animate-fade-in absolute inset-0 z-20 bg-[#071A3B]/95 backdrop-blur-sm text-white flex flex-col items-center justify-center p-6 text-center">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-70" />
                <div className="relative z-10 w-full max-w-xs space-y-5">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <span
                      aria-hidden="true"
                      className="animate-spin-slow absolute inset-0 rounded-full border-2 border-dashed border-[#38BDF8]/65"
                    />
                    <span
                      aria-hidden="true"
                      className="animate-spin-reverse-slow absolute inset-2 rounded-full border-2 border-[#2DD4BF]/50 border-t-transparent"
                    />
                    <ShieldCheck className="w-6 h-6 text-[#38BDF8]" />
                  </div>

                  <div>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#2DD4BF]">
                      Preparing Order #{pendingOrderId}
                    </p>
                    <h3 className="font-display text-lg font-bold text-white mt-1">
                      Confirming Dispatch...
                    </h3>
                  </div>

                  <div className="space-y-2 text-left bg-white/[0.06] border border-white/15 rounded-xl p-3.5">
                    {DISPATCH_STAGES.map((stageLabel, idx) => {
                      const done = idx < dispatchStageIdx;
                      const current = idx === dispatchStageIdx;
                      return (
                        <div
                          key={stageLabel}
                          className={`flex items-center gap-2.5 text-xs transition-opacity duration-300 ${
                            done || current ? 'opacity-100' : 'opacity-45'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                              done
                                ? 'bg-[#0F766E] border-[#2DD4BF] text-white'
                                : current
                                ? 'bg-[#0866F5] border-[#38BDF8] text-white animate-pulse'
                                : 'bg-white/10 border-white/20 text-slate-400'
                            }`}
                          >
                            {done ? (
                              <Check className="w-2.5 h-2.5 animate-icon-pop" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            )}
                          </span>
                          <span className={current ? 'font-semibold text-white' : 'text-slate-200'}>
                            {stageLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="animate-slide-down flex-1 overflow-y-auto p-5 space-y-4">
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
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0866F5] transition-colors"
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
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0866F5] transition-colors"
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
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0866F5] transition-colors"
                >
                  <option value="Dhaka Metro">Inside Dhaka — Dhaka Metro (2–3 days · ৳80)</option>
                  <option value="Chattogram">Outside Dhaka — Chattogram (2–4 days · ৳150)</option>
                  <option value="Sylhet">Outside Dhaka — Sylhet (2–4 days · ৳150)</option>
                  <option value="Rajshahi">Outside Dhaka — Rajshahi (2–4 days · ৳150)</option>
                  <option value="Khulna">Outside Dhaka — Khulna (2–4 days · ৳150)</option>
                  <option value="Gazipur / Savar">Outside Dhaka — Gazipur / Savar (2–4 days · ৳150)</option>
                  <option value="Other District">Outside Dhaka — Other District (2–4 days · ৳150)</option>
                </select>
                <p className="mt-1.5 text-[11px] text-[#64748B]">
                  Estimated delivery: <strong className="text-[#101828]">{estimatedDeliveryWindow}</strong> · Charge:{' '}
                  <strong className="font-mono text-[#101828]">৳{deliveryFee}</strong>
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label htmlFor="chk-address" className="block text-xs font-semibold text-[#101828]">
                    Full Delivery Address
                  </label>
                  <button
                    type="button"
                    disabled={detectingLocation}
                    onClick={async () => {
                      playTapSound();
                      setDetectingLocation(true);
                      setLocationNote('');
                      try {
                        const res = await trackVisitorVisit(
                          user
                            ? {
                                uid: user.uid,
                                email: user.email,
                                phoneNumber: user.phoneNumber,
                                displayName: user.displayName,
                              }
                            : null,
                          { force: true, requestGps: true }
                        );
                        if (res.area && res.area !== 'Unknown Area') {
                          const detectedArea = res.area;
                          setAddress((prev) => {
                            const trimmed = prev.trim();
                            if (!trimmed) return detectedArea;
                            if (trimmed.toLowerCase().includes(detectedArea.toLowerCase())) {
                              return trimmed;
                            }
                            return `${trimmed} (${detectedArea})`;
                          });
                          const lower = res.area.toLowerCase();
                          if (lower.includes('dhaka') && !lower.includes('savar') && !lower.includes('gazipur')) {
                            setDistrict('Dhaka Metro');
                          } else if (lower.includes('chattogram') || lower.includes('chittagong')) {
                            setDistrict('Chattogram');
                          } else if (lower.includes('sylhet')) {
                            setDistrict('Sylhet');
                          } else if (lower.includes('rajshahi')) {
                            setDistrict('Rajshahi');
                          } else if (lower.includes('khulna')) {
                            setDistrict('Khulna');
                          } else if (lower.includes('gazipur') || lower.includes('savar')) {
                            setDistrict('Gazipur / Savar');
                          }
                          setLocationNote(
                            res.accuracy === 'GPS'
                              ? `Exact GPS area granted: ${res.area}${
                                  typeof res.gpsAccuracyMeters === 'number'
                                    ? ` (±${res.gpsAccuracyMeters}m)`
                                    : ''
                                }`
                              : res.blockedByPolicy || res.isEmbeddedIframe
                              ? `Operator area: ${res.area} · Embedded frame blocks browser GPS (open direct link for exact GPS).`
                              : res.gpsReason
                              ? `Operator area: ${res.area} · (${res.gpsReason})`
                              : `Detected area: ${res.area} (type house/road if needed)`
                          );
                        } else {
                          setLocationNote('Could not auto-detect area. Please type your address.');
                        }
                      } catch {
                        setLocationNote('Could not auto-detect area. Please type your address.');
                      } finally {
                        setDetectingLocation(false);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0866F5] hover:underline disabled:opacity-60 whitespace-nowrap"
                  >
                    <LocateFixed className={`w-3 h-3 ${detectingLocation ? 'animate-spin' : ''}`} />
                    <span>{detectingLocation ? 'Detecting...' : 'Detect My Area (GPS)'}</span>
                  </button>
                </div>
                <textarea
                  id="chk-address"
                  required
                  rows={2}
                  maxLength={300}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House, Road, Block / Campus Hall"
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0866F5] transition-colors"
                />
                {locationNote && (
                  <p className="mt-1 text-[11px] text-[#0F766E]">{locationNote}</p>
                )}
              </div>

              <div>
                <p className="block text-xs font-semibold text-[#101828] mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Cash on Delivery', 'bKash', 'Nagad', 'Card / SSLCommerz'].map((method) => {
                    const selected = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setPaymentMethod(method);
                        }}
                        className={`active:scale-[0.98] px-3 py-2.5 rounded-lg border text-xs font-semibold text-left transition-all flex items-center justify-between gap-2 ${
                          selected
                            ? 'bg-[#071A3B] border-[#071A3B] text-white'
                            : 'bg-white border-slate-200 text-[#101828] hover:border-[#0866F5]/55'
                        }`}
                      >
                        <span className="truncate">{method}</span>
                        {selected && (
                          <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-icon-pop shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(paymentMethod === 'bKash' || paymentMethod === 'Nagad') && (
                <div className="animate-pop-in rounded-xl bg-[#EFF6FF] border border-blue-200 p-3.5 text-xs text-[#64748B] space-y-1">
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
                <p className="animate-pop-in text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {checkoutError}
                </p>
              )}
              <div className="space-y-1 text-xs">
                {rewardDiscount > 0 && (
                  <div className="flex justify-between text-[#0866F5] font-semibold">
                    <span>Reward Redeemed (-{appliedRewardPoints} pts)</span>
                    <span className="font-mono tabular-nums">-৳{rewardDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#64748B]">
                  <span>Delivery ({isInsideDhaka ? 'Inside Dhaka' : 'Outside Dhaka'} · {estimatedDeliveryWindow})</span>
                  <span className="font-mono tabular-nums text-[#101828]">৳{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#475569]">
                  <span>Order Reward Points (min ৳{MIN_ORDER_FOR_REWARD_BDT.toLocaleString('en-IN')})</span>
                  <span className="font-mono tabular-nums font-semibold text-[#0866F5]">
                    {earnedPointsPreview > 0
                      ? `+${earnedPointsPreview} pts (৳${calculateRewardValueBdt(earnedPointsPreview).toFixed(0)})`
                      : `Need ৳${remainingForReward.toLocaleString('en-IN')} more`}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#475569]">
                  <span>Post-Order Gift Card (৳3 / ৳100 · min ৳{MIN_GIFT_CARD_SPEND})</span>
                  <span className="font-mono tabular-nums font-semibold text-[#0F766E]">
                    {giftCardPreview.eligible
                      ? `Unlocks ৳${giftCardPreview.value}`
                      : `Need ৳${giftCardPreview.remainingToUnlock} more`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#071A3B] pt-1">
                  <span>Total Payable</span>
                  <span className="font-mono tabular-nums">৳{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="cta-sheen active:scale-[0.98] group w-full h-11 rounded-xl bg-[#0866F5] hover:bg-[#0866F5]/90 border border-[#0866F5] hover:border-[#1685FF] text-white transition-all disabled:opacity-60 text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#FB923C]" aria-hidden="true" />
                <span>
                  {submitting
                    ? 'Confirming Order...'
                    : `Confirm Order (৳${total.toLocaleString('en-IN')})`}
                </span>
                {!submitting && (
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                )}
              </button>
            </div>
          </form>
        )}
      </aside>
      <PrintReceiptSheet receipt={receipt} qrDataUrl={receiptQrUrl} />
    </div>
  );
};
