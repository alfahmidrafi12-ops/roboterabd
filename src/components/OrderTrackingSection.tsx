import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  Radio,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import { subscribeOrderTracking } from '../lib/firebase';
import { OrderStatus, OrderTrackingInfo, StoredOrder } from '../types/store';

interface OrderTrackingSectionProps {
  recentOrderIds: string[];
  userOrders?: StoredOrder[];
  isSignedIn?: boolean;
  autoTrackOrderId?: string | null;
  onBackToStore?: () => void;
}

const STEPS: { status: Exclude<OrderStatus, 'Cancelled'>; label: string; desc: string }[] = [
  { status: 'Pending', label: 'Order Placed', desc: 'Received by Dhaka dispatch desk' },
  { status: 'Confirmed', label: 'Lab Verified', desc: 'Hardware tested & ESD packed' },
  { status: 'Shipped', label: 'In Transit', desc: 'Handed to Dhaka / Steadfast rider' },
  { status: 'Delivered', label: 'Delivered', desc: 'Signed & completed' },
];

const STATUS_BADGE_STYLE: Record<OrderStatus, string> = {
  Pending: 'bg-amber-50 border-amber-200 text-amber-800',
  Confirmed: 'bg-blue-50 border-blue-200 text-[#0866F5]',
  Shipped: 'bg-teal-50 border-teal-200 text-[#0F766E]',
  Delivered: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  Cancelled: 'bg-red-50 border-red-200 text-red-700',
};

function formatFirestoreTimestamp(ts: unknown): string {
  if (!ts) return 'Just now';
  if (typeof ts === 'object' && ts !== null) {
    if ('toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
      return (ts as { toDate: () => Date }).toDate().toLocaleString('en-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
    if ('seconds' in ts && typeof (ts as { seconds: number }).seconds === 'number') {
      return new Date((ts as { seconds: number }).seconds * 1000).toLocaleString('en-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
  }
  return 'Recently updated';
}

export const OrderTrackingSection: React.FC<OrderTrackingSectionProps> = ({
  recentOrderIds,
  userOrders = [],
  isSignedIn = false,
  autoTrackOrderId,
  onBackToStore,
}) => {
  const [queryId, setQueryId] = useState('');
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<OrderTrackingInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [liveUpdateFlash, setLiveUpdateFlash] = useState(false);

  const prevSnapshotRef = useRef<{ status?: OrderStatus; courierNote?: string } | null>(null);

  const startLiveTracking = (idToTrack: string, pushUrl = true) => {
    const clean = idToTrack.trim().replace(/^#/, '');
    if (!clean) return;
    setQueryId(clean);
    setErrorMsg('');
    setLoading(true);
    prevSnapshotRef.current = null;
    setActiveTrackId(clean);

    if (pushUrl && typeof window !== 'undefined') {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#track=${encodeURIComponent(clean)}`
      );
    }
  };

  useEffect(() => {
    if (autoTrackOrderId) {
      startLiveTracking(autoTrackOrderId, false);
    }
  }, [autoTrackOrderId]);

  // Real-time Firestore onSnapshot subscription for the active tracked order
  useEffect(() => {
    if (!activeTrackId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const unsubscribe = subscribeOrderTracking(
      activeTrackId,
      (data) => {
        setLoading(false);
        setTrackingResult(data);

        if (data) {
          const prev = prevSnapshotRef.current;
          if (
            prev &&
            (prev.status !== data.status || prev.courierNote !== data.courierNote)
          ) {
            setLiveUpdateFlash(true);
            window.setTimeout(() => setLiveUpdateFlash(false), 2800);
          }
          prevSnapshotRef.current = {
            status: data.status,
            courierNote: data.courierNote,
          };
        }
      },
      () => {
        setLoading(false);
        setErrorMsg('Unable to sync live shipment status right now. Please check your connection.');
        setTrackingResult(null);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeTrackId]);

  // Combine signed-in Firestore orders + local recent order IDs cleanly without duplicates
  const quickTrackOrders = useMemo(() => {
    const seen = new Set<string>();
    const list: {
      orderId: string;
      status?: OrderStatus;
      total?: number;
      district?: string;
      itemCount?: number;
      fromAccount: boolean;
    }[] = [];

    for (const o of userOrders.slice(0, 6)) {
      if (!o.orderId || seen.has(o.orderId)) continue;
      seen.add(o.orderId);
      list.push({
        orderId: o.orderId,
        status: o.status,
        total: o.total,
        district: o.district,
        itemCount: o.items?.reduce((sum, item) => sum + item.quantity, 0),
        fromAccount: true,
      });
    }

    for (const id of recentOrderIds) {
      if (!id || seen.has(id)) continue;
      seen.add(id);
      list.push({ orderId: id, fromAccount: false });
    }

    return list;
  }, [userOrders, recentOrderIds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startLiveTracking(queryId, true);
  };

  const handleCopyTrackingLink = (orderId: string) => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#track=${encodeURIComponent(orderId)}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1800);
  };

  const activeStepIndex = trackingResult
    ? STEPS.findIndex((s) => s.status === trackingResult.status)
    : -1;

  const progressPct =
    activeStepIndex >= 0 ? Math.round((activeStepIndex / (STEPS.length - 1)) * 100) : 0;

  const whatsappTrackUrl = `https://wa.me/8801624987366?text=${encodeURIComponent(
    trackingResult
      ? `Hello Robotera BD, I am checking shipment status for Order #${trackingResult.orderId}.`
      : activeTrackId
      ? `Hello Robotera BD, I need help tracking Order #${activeTrackId}.`
      : 'Hello Robotera BD, I need help tracking my order.'
  )}`;

  const courierPartnerLabel = trackingResult
    ? trackingResult.district === 'Dhaka Metro'
      ? 'Dhaka Express Lab Rider (2–3 days)'
      : `Steadfast / Pathao (${trackingResult.district}, 2–4 days)`
    : '';

  return (
    <section
      id="order-tracking"
      className="bg-[#E6ECF4] min-[1500px]:bg-transparent min-[1500px]:pointer-events-none min-h-[calc(100dvh-14rem)]"
    >
      <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-[#E6ECF4] min-[1500px]:border-x min-[1500px]:border-slate-300/90 px-4 sm:px-6 lg:px-10 py-6 sm:py-10 lg:py-12 space-y-6">
        {/* Top Page Breadcrumb & Return to Storefront */}
        <div className="animate-fade-in flex flex-wrap items-center justify-between gap-3">
          {onBackToStore && (
            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-[#071A3B] border border-slate-300 hover:border-[#071A3B] text-xs sm:text-sm font-semibold text-[#071A3B] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Storefront</span>
            </button>
          )}
          <span className="text-xs font-mono text-[#475569]">
            Dhaka Dispatch &amp; Steadfast / Pathao Real-Time Lookup
          </span>
        </div>

        {/* Dedicated Full-Page Order Tracker Card */}
        <div className="animate-pop-in bg-white rounded-2xl border border-slate-300/85 p-5 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-9 items-start">
          {/* Left Lookup Form + User Account Orders */}
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-mono font-semibold text-[#0F766E] tracking-wide inline-flex items-center gap-2">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F766E] opacity-70" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0F766E]" />
                </span>
                <span>Live Real-Time Firestore Tracking</span>
              </p>
              <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-[#071A3B] tracking-tight">
                Track Your Order
              </h1>
              <p className="text-sm text-[#334155] leading-relaxed">
                Enter your Robotera BD Order ID or select one of your orders below to stream live
                bench-testing, courier dispatch, and delivery status updates automatically.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="pt-1 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={queryId}
                  onChange={(e) => setQueryId(e.target.value)}
                  placeholder="e.g. RBD-4821-9034"
                  aria-label="Order ID"
                  className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-slate-300 bg-[#EDF2F8] text-base sm:text-sm font-mono text-[#0F172A] placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#0866F5] focus:bg-white transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-11 px-6 rounded-lg bg-[#0866F5] hover:bg-[#0654CC] border border-[#0866F5] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#FB923C]" aria-hidden="true" />
                <span>{loading ? 'Syncing...' : 'Track Order'}</span>
              </button>
            </form>

            {/* Quick-Track Signed-In Orders & Local Recent Orders */}
            {quickTrackOrders.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#475569]">
                  {isSignedIn && userOrders.length > 0
                    ? 'Your Account Orders (Click for Live Stream)'
                    : 'Recent Checkout Orders'}
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                  {quickTrackOrders.map((item, idx) => {
                    const isSelected =
                      activeTrackId?.toUpperCase() === item.orderId.toUpperCase();
                    return (
                      <button
                        key={item.orderId}
                        type="button"
                        onClick={() => startLiveTracking(item.orderId, true)}
                        style={{ animationDelay: `${idx * 45}ms` }}
                        className={`animate-cart-enter w-full text-left p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#071A3B] border-[#071A3B] text-white'
                            : 'bg-[#EDF2F8] hover:bg-white border-slate-300/85 hover:border-[#0866F5] text-[#071A3B]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Package
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? 'text-[#38BDF8]' : 'text-[#0866F5]'
                              }`}
                            />
                            <span className="font-mono text-xs font-bold truncate">
                              #{item.orderId}
                            </span>
                          </div>
                          {(item.district || item.total !== undefined) && (
                            <p
                              className={`text-[11px] mt-0.5 truncate tabular-nums ${
                                isSelected ? 'text-slate-300' : 'text-[#475569]'
                              }`}
                            >
                              {item.district ?? ''}
                              {item.itemCount ? ` · ${item.itemCount} item${item.itemCount > 1 ? 's' : ''}` : ''}
                              {item.total !== undefined ? ` · ৳${item.total.toLocaleString('en-IN')}` : ''}
                            </p>
                          )}
                        </div>
                        {item.status && (
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                              isSelected
                                ? 'bg-white/15 border-white/25 text-white'
                                : STATUS_BADGE_STYLE[item.status]
                            }`}
                          >
                            {item.status}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-300/70 flex flex-col gap-2 text-xs text-[#334155]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#0866F5] shrink-0" />
                <span>Inside Dhaka: 2–3 days delivery (৳80 charge)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0" />
                <span>Outside Dhaka: 2–4 days delivery via Steadfast &amp; Pathao (৳150 charge)</span>
              </div>
            </div>
          </div>

          {/* Right Live Status Panel */}
          <div className="lg:col-span-7 bg-[#EDF2F8] rounded-2xl border border-slate-300/85 p-4 sm:p-6">
            {errorMsg ? (
              <div className="animate-pop-in py-8 text-center text-sm text-red-600">{errorMsg}</div>
            ) : loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <div className="relative w-12 h-12 rounded-2xl bg-[#071A3B] text-[#38BDF8] flex items-center justify-center">
                  <Radio className="w-5 h-5 animate-pulse" />
                  <span
                    aria-hidden="true"
                    className="animate-ring-expand absolute inset-0 rounded-2xl border border-[#0866F5]"
                  />
                </div>
                <p className="text-sm font-medium text-[#334155]">
                  Connecting live stream for <span className="font-mono font-bold text-[#071A3B]">#{activeTrackId}</span>...
                </p>
              </div>
            ) : activeTrackId && !trackingResult ? (
              <div className="animate-pop-in py-10 text-center space-y-2.5">
                <p className="font-display text-base font-bold text-[#071A3B]">
                  Order #{activeTrackId} Not Found
                </p>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Please double-check your Order ID (for example <span className="font-mono font-semibold">RBD-XXXX-XXXX</span>)
                  from your checkout confirmation receipt.
                </p>
              </div>
            ) : trackingResult ? (
              <div className="animate-pop-in space-y-5">
                {/* Real-time live update notification strip when admin modifies status */}
                {liveUpdateFlash && (
                  <div className="animate-slide-down rounded-xl bg-emerald-600 text-white px-3.5 py-2 text-xs font-semibold flex items-center gap-2">
                    <Radio className="w-4 h-4 shrink-0" />
                    <span>Live status update received from dispatch desk!</span>
                  </div>
                )}

                {/* Order Header & Live Sync Indicator */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-300/75">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs font-bold text-[#0866F5]">
                        Order #{trackingResult.orderId}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopyTrackingLink(trackingResult.orderId)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-300 text-[11px] font-semibold text-[#334155] hover:text-[#0866F5] hover:border-[#0866F5]/60 transition-colors"
                      >
                        {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
                      </button>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" aria-hidden="true" />
                        Live Sync Active
                      </span>
                    </div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-[#071A3B] mt-1.5">
                      Current Stage: {trackingResult.status}
                    </h2>
                  </div>

                  <div className="text-left sm:text-right text-xs text-[#334155] space-y-0.5">
                    <p className="inline-flex sm:justify-end items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#0866F5] shrink-0" />
                      <span>
                        <strong className="text-[#071A3B]">{trackingResult.district}</strong>
                      </span>
                    </p>
                    <p className="font-mono tabular-nums font-semibold">
                      {trackingResult.itemCount} item{trackingResult.itemCount > 1 ? 's' : ''} · ৳
                      {trackingResult.total.toLocaleString('en-IN')} ({trackingResult.paymentMethod})
                    </p>
                  </div>
                </div>

                {trackingResult.status === 'Cancelled' ? (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3 text-xs text-red-800">
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <p className="font-semibold">This order has been cancelled.</p>
                      {trackingResult.courierNote && (
                        <p className="mt-1 text-red-700">{trackingResult.courierNote}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Animated Horizontal Progress Pipeline Connector (Desktop sm+) */}
                    <div className="hidden sm:block px-8 pt-2">
                      <div className="relative h-1.5 rounded-full bg-slate-300/75 overflow-hidden">
                        <div
                          className="relative h-full rounded-full bg-gradient-to-r from-[#0866F5] via-[#0EA5E9] to-[#0F766E] transition-all duration-700 ease-out overflow-hidden"
                          style={{ width: `${Math.max(8, progressPct)}%` }}
                        >
                          {trackingResult.status !== 'Delivered' && (
                            <div className="animate-bar-shimmer absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 4-Stage Pipeline Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      {STEPS.map((step, idx) => {
                        const completed = idx <= activeStepIndex;
                        const isCurrent = idx === activeStepIndex;
                        const StepIcon =
                          idx === 0
                            ? ClipboardCheck
                            : idx === 1
                            ? PackageCheck
                            : idx === 2
                            ? Truck
                            : CheckCircle2;

                        return (
                          <div
                            key={step.status}
                            style={{ animationDelay: `${idx * 65}ms` }}
                            className={`animate-cart-enter relative rounded-xl p-3.5 border transition-colors duration-300 ${
                              isCurrent
                                ? 'bg-[#071A3B] border-[#071A3B] text-white'
                                : completed
                                ? 'bg-white border-[#0866F5]/45 text-[#071A3B]'
                                : 'bg-white/65 border-slate-300/75 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="relative flex items-center justify-center">
                                {isCurrent && trackingResult.status !== 'Delivered' && (
                                  <span
                                    aria-hidden="true"
                                    className="animate-ring-expand absolute -inset-1.5 rounded-full border border-[#38BDF8]"
                                  />
                                )}
                                <StepIcon
                                  className={`relative w-4 h-4 ${
                                    isCurrent
                                      ? 'text-[#38BDF8]'
                                      : completed
                                      ? 'text-[#0866F5]'
                                      : 'text-slate-300'
                                  }`}
                                />
                              </div>
                              <span className="font-mono text-[10px]">0{idx + 1}</span>
                            </div>
                            <p className="font-display text-xs font-bold">{step.label}</p>
                            <p
                              className={`text-[11px] mt-1 leading-snug ${
                                isCurrent
                                  ? 'text-slate-200'
                                  : completed
                                  ? 'text-[#475569]'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Real Timestamp Telemetry & Dispatch Notes */}
                <div className="rounded-xl bg-white border border-slate-300/80 p-3.5 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[#475569]">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#0866F5]" />
                      Placed:{' '}
                      <strong className="text-[#071A3B]">
                        {formatFirestoreTimestamp(trackingResult.createdAt)}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#0F766E]" />
                      Last updated:{' '}
                      <strong className="text-[#071A3B]">
                        {formatFirestoreTimestamp(trackingResult.updatedAt)}
                      </strong>
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[#334155]">
                    <span>
                      Logistics:{' '}
                      <strong className="text-[#071A3B]">{courierPartnerLabel}</strong>
                    </span>
                    {trackingResult.courierNote && (
                      <span className="font-semibold text-[#0866F5]">
                        Dispatch Note: {trackingResult.courierNote}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Clean 4-Step Fulfillment Preview before search */
              <div className="space-y-4">
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#475569]">
                  How Robotera BD Fulfillment Works
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {STEPS.map((step, idx) => (
                    <div
                      key={step.status}
                      style={{ animationDelay: `${idx * 55}ms` }}
                      className="animate-cart-enter rounded-xl p-3.5 bg-white border border-slate-300/80"
                    >
                      <span className="font-mono text-[11px] font-bold text-[#0866F5]">
                        Step 0{idx + 1}
                      </span>
                      <p className="font-display text-xs font-bold text-[#071A3B] mt-1">
                        {step.label}
                      </p>
                      <p className="text-[11px] text-[#475569] mt-1 leading-snug">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-[#334155]">
                Need urgent courier updates or campus gate delivery coordination?
              </p>
              <a
                href={whatsappTrackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] border border-[#16A34A] text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Ask Support on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
