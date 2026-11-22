import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  PackageCheck,
  Radio,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import { subscribeOrderTracking } from '../lib/firebase';
import { playErrorSound, playSuccessSound, playTapSound } from '../lib/sound';
import { OrderStatus, OrderTrackingInfo, StoredOrder } from '../types/store';

interface OrderTrackingSectionProps {
  recentOrderIds: string[];
  userOrders?: StoredOrder[];
  isSignedIn?: boolean;
  autoTrackOrderId?: string | null;
  onBackToStore?: () => void;
}

const STEPS: {
  status: Exclude<OrderStatus, 'Cancelled'>;
  label: string;
  shortLabel: string;
  desc: string;
  pct: number;
}[] = [
  {
    status: 'Pending',
    label: 'Order Placed',
    shortLabel: 'Placed',
    desc: 'Received by Dhaka dispatch desk',
    pct: 9,
  },
  {
    status: 'Confirmed',
    label: 'Lab Verified',
    shortLabel: 'Lab QC',
    desc: 'Hardware tested & ESD packed',
    pct: 37,
  },
  {
    status: 'Shipped',
    label: 'In Transit',
    shortLabel: 'On Road',
    desc: 'Courier car en route to destination',
    pct: 69,
  },
  {
    status: 'Delivered',
    label: 'Delivered',
    shortLabel: 'Arrived',
    desc: 'Signed & completed',
    pct: 92,
  },
];

const STATUS_BADGE_STYLE: Record<OrderStatus, string> = {
  Pending: 'bg-amber-50 border-amber-200 text-amber-800',
  Confirmed: 'bg-blue-50 border-blue-200 text-[#0866F5]',
  Shipped: 'bg-teal-50 border-teal-200 text-[#0F766E]',
  Delivered: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  Cancelled: 'bg-red-50 border-red-200 text-red-700',
};

function parseTimestampDate(ts: unknown): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === 'object') {
    if ('toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
      return (ts as { toDate: () => Date }).toDate();
    }
    if ('seconds' in ts && typeof (ts as { seconds: number }).seconds === 'number') {
      return new Date((ts as { seconds: number }).seconds * 1000);
    }
  }
  return null;
}

function formatFirestoreTimestamp(ts: unknown): string {
  const date = parseTimestampDate(ts);
  if (!date) return 'Just now';
  return date.toLocaleString('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatEstimatedEta(createdAt: unknown, district: string, status: OrderStatus): string {
  if (status === 'Delivered') return 'Completed & Delivered';
  if (status === 'Cancelled') return 'Order Cancelled';

  const base = parseTimestampDate(createdAt) ?? new Date();
  const isDhaka = district === 'Dhaka Metro';
  const minDays = isDhaka ? 2 : 2;
  const maxDays = isDhaka ? 3 : 4;

  const etaStart = new Date(base.getTime() + minDays * 86400000);
  const etaEnd = new Date(base.getTime() + maxDays * 86400000);

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-BD', {
      month: 'short',
      day: 'numeric',
    });

  return `${fmt(etaStart)} – ${fmt(etaEnd)}`;
}

const DeliveryCarSvg: React.FC<{
  status: OrderStatus;
  moving: boolean;
}> = ({ status, moving }) => {
  const isShipped = status === 'Shipped';
  const isDelivered = status === 'Delivered';
  const isCancelled = status === 'Cancelled';

  const beaconColor = isCancelled
    ? '#F87171'
    : isDelivered
    ? '#34D399'
    : isShipped
    ? '#00C8FF'
    : '#38BDF8';

  return (
    <div className="relative select-none">
      {/* Speed wind streaks behind the car when actively on road */}
      {isShipped && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col gap-1"
        >
          <span className="animate-speed-streak block w-5 h-[2px] rounded-full bg-gradient-to-r from-transparent to-[#00C8FF]" />
          <span
            className="animate-speed-streak block w-4 h-[1.5px] rounded-full bg-gradient-to-r from-transparent to-[#38BDF8]"
            style={{ animationDelay: '0.25s' }}
          />
        </div>
      )}

      {/* Subtle warm headlight cone in transit / dispatch */}
      {(isShipped || status === 'Confirmed') && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[84%] bottom-2 w-12 h-6 bg-gradient-to-r from-[#FDE68A]/50 via-[#FEF3C7]/20 to-transparent blur-[2px] [clip-path:polygon(0_35%,100%_0%,100%_100%,0_75%)]"
        />
      )}

      <svg
        viewBox="0 0 96 46"
        className={`w-[74px] h-[36px] sm:w-[88px] sm:h-[42px] drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)] ${
          moving ? 'animate-car-drive' : ''
        }`}
        fill="none"
        aria-hidden="true"
      >
        {/* Ground shadow */}
        <ellipse cx="47" cy="42" rx="36" ry="3" fill="rgba(0,0,0,0.45)" />

        {/* Roof GPS Beacon */}
        <rect x="40" y="3" width="9" height="4" rx="2" fill={beaconColor} />
        {!isCancelled && (
          <circle cx="44.5" cy="5" r="5" fill={beaconColor} opacity="0.22" />
        )}

        {/* Cargo Box Body */}
        <path
          d="M8 10C8 7.79086 9.79086 6 12 6H56C58.2091 6 60 7.79086 60 10V33H8V10Z"
          fill="#F8FAFC"
          stroke="#CBD5E1"
          strokeWidth="1.5"
        />
        {/* Electric Blue Hardware Brand Band */}
        <path d="M8 22H60V28H8V22Z" fill="#1677FF" />
        <path d="M8 20H60V21.5H8V20Z" fill="#00C8FF" />
        {/* Tiny PCB / Box emblem on side */}
        <rect x="14" y="10.5" width="22" height="6" rx="1.5" fill="#071A3D" />
        <circle cx="17.5" cy="13.5" r="1.4" fill="#00C8FF" />
        <rect x="21" y="12.6" width="12" height="1.8" rx="0.9" fill="#E2E8F0" />

        {/* Aero Cab */}
        <path
          d="M59 13H72.5C75.5 13 78.2 14.7 79.6 17.3L84.4 25.5C85.1 26.7 85.5 28.1 85.5 29.5V33H59V13Z"
          fill="#0B224D"
          stroke="#38BDF8"
          strokeWidth="1.4"
        />
        {/* Cab Windshield */}
        <path
          d="M63 15.8H71.8C73.6 15.8 75.2 16.8 76.1 18.4L79.3 24H63V15.8Z"
          fill="#38BDF8"
          fillOpacity="0.82"
        />
        <path
          d="M64.5 17.2H68.5L65.5 22.8H64.5V17.2Z"
          fill="#FFFFFF"
          fillOpacity="0.45"
        />

        {/* Lower Chassis & Bumpers */}
        <rect x="6" y="31.5" width="81" height="4.5" rx="2.2" fill="#0F172A" />
        {/* Tail & Head Lights */}
        <rect x="6.5" y="27" width="2.8" height="4" rx="1" fill="#EF4444" />
        <rect
          x="83.5"
          y="27"
          width="3.2"
          height="3.8"
          rx="1.2"
          fill={isShipped || status === 'Confirmed' ? '#FDE68A' : '#94A3B8'}
        />

        {/* Rear Wheel */}
        <g transform="translate(24, 36)">
          <g className={moving ? 'animate-wheel-spin' : ''}>
            <circle cx="0" cy="0" r="6.8" fill="#0F172A" stroke="#475569" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="3.4" fill="#E2E8F0" />
            <path d="M-2.5 0H2.5M0 -2.5V2.5" stroke="#071A3D" strokeWidth="1.3" strokeLinecap="round" />
          </g>
        </g>

        {/* Front Wheel */}
        <g transform="translate(71, 36)">
          <g className={moving ? 'animate-wheel-spin' : ''}>
            <circle cx="0" cy="0" r="6.8" fill="#0F172A" stroke="#475569" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="3.4" fill="#E2E8F0" />
            <path d="M-2.5 0H2.5M0 -2.5V2.5" stroke="#071A3D" strokeWidth="1.3" strokeLinecap="round" />
          </g>
        </g>
      </svg>
    </div>
  );
};

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
  const [carDisplayPct, setCarDisplayPct] = useState(9);

  const prevSnapshotRef = useRef<{ status?: OrderStatus; courierNote?: string } | null>(null);
  const prevNotFoundIdRef = useRef<string | null>(null);

  const startLiveTracking = (idToTrack: string, pushUrl = true) => {
    const clean = idToTrack.trim().replace(/^#/, '');
    if (!clean) return;
    setQueryId(clean);
    setErrorMsg('');
    setLoading(true);
    prevSnapshotRef.current = null;
    prevNotFoundIdRef.current = null;
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

  // Auto-load the user's most recent order when opening Track Order without an explicit ID
  useEffect(() => {
    if (!activeTrackId && !autoTrackOrderId && quickTrackOrders.length > 0) {
      startLiveTracking(quickTrackOrders[0].orderId, false);
    }
  }, [activeTrackId, autoTrackOrderId, quickTrackOrders]);

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

        if (!data && prevNotFoundIdRef.current !== activeTrackId) {
          prevNotFoundIdRef.current = activeTrackId;
          playErrorSound();
        }

        if (data) {
          const prev = prevSnapshotRef.current;
          if (
            prev &&
            (prev.status !== data.status || prev.courierNote !== data.courierNote)
          ) {
            playSuccessSound();
            setLiveUpdateFlash(true);
            window.setTimeout(() => setLiveUpdateFlash(false), 3200);
          }
          prevSnapshotRef.current = {
            status: data.status,
            courierNote: data.courierNote,
          };
        }
      },
      () => {
        setLoading(false);
        playErrorSound();
        setErrorMsg('Unable to sync live shipment status right now. Please check your connection.');
        setTrackingResult(null);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeTrackId]);

  const activeStepIndex = trackingResult
    ? STEPS.findIndex((s) => s.status === trackingResult.status)
    : -1;

  const targetCarPct = useMemo(() => {
    if (!trackingResult) return 9;
    if (trackingResult.status === 'Cancelled') return 14;
    const step = STEPS.find((s) => s.status === trackingResult.status);
    return step ? step.pct : 9;
  }, [trackingResult]);

  // Animate the delivery car smoothly driving into its checkpoint whenever trackingResult updates
  useEffect(() => {
    if (!trackingResult) {
      setCarDisplayPct(9);
      return;
    }
    setCarDisplayPct((prev) => (prev > targetCarPct ? Math.max(6, targetCarPct - 18) : prev));
    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setCarDisplayPct(targetCarPct);
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [trackingResult?.orderId, targetCarPct]);

  // Match full order details when the signed-in owner tracks their own order
  const ownedOrderDetail = useMemo(() => {
    if (!trackingResult) return null;
    return (
      userOrders.find(
        (o) => o.orderId.toUpperCase() === trackingResult.orderId.toUpperCase()
      ) ?? null
    );
  }, [userOrders, trackingResult]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    startLiveTracking(queryId, true);
  };

  const handleCopyTrackingLink = (orderId: string) => {
    if (typeof window === 'undefined') return;
    playTapSound();
    const shareUrl = `${window.location.origin}${window.location.pathname}#track=${encodeURIComponent(orderId)}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1800);
  };

  const whatsappTrackUrl = `https://wa.me/8801624987366?text=${encodeURIComponent(
    trackingResult
      ? `Hello Robotera BD, I am checking shipment status for Order #${trackingResult.orderId}.`
      : activeTrackId
      ? `Hello Robotera BD, I need help tracking Order #${activeTrackId}.`
      : 'Hello Robotera BD, I need help tracking my order.'
  )}`;

  const courierPartnerLabel = trackingResult
    ? trackingResult.district === 'Dhaka Metro'
      ? 'Dhaka Express Courier Van (2–3 days)'
      : `Steadfast / Pathao Cargo (${trackingResult.district}, 2–4 days)`
    : '';

  const isCarMoving =
    trackingResult?.status === 'Shipped' || trackingResult?.status === 'Confirmed';

  const carStatusTag = trackingResult
    ? trackingResult.status === 'Pending'
      ? 'At Dhaka Depot'
      : trackingResult.status === 'Confirmed'
      ? 'Loading QC Van'
      : trackingResult.status === 'Shipped'
      ? 'En Route Now'
      : trackingResult.status === 'Delivered'
      ? 'Delivered'
      : 'Dispatched Stopped'
    : 'Ready';

  const etaWindowLabel = trackingResult
    ? formatEstimatedEta(trackingResult.createdAt, trackingResult.district, trackingResult.status)
    : '2–4 Days Nationwide';

  const milestoneTimeline = useMemo(() => {
    if (!trackingResult) return [];
    const createdStr = formatFirestoreTimestamp(trackingResult.createdAt);
    const updatedStr = formatFirestoreTimestamp(trackingResult.updatedAt);

    if (trackingResult.status === 'Cancelled') {
      return [
        {
          title: `Order #${trackingResult.orderId} Cancelled`,
          detail:
            trackingResult.courierNote ||
            'Shipment halted before courier handoff. Contact WhatsApp support for assistance.',
          time: updatedStr,
          state: 'cancelled' as const,
        },
        {
          title: 'Order Registered at Dhaka Desk',
          detail: `${trackingResult.itemCount} item${trackingResult.itemCount > 1 ? 's' : ''} · ${trackingResult.district}`,
          time: createdStr,
          state: 'done' as const,
        },
      ];
    }

    const events: {
      title: string;
      detail: string;
      time: string;
      state: 'done' | 'active';
    }[] = [];

    if (activeStepIndex >= 3) {
      events.push({
        title: `Delivered to ${trackingResult.district}`,
        detail: `Hardware consignment signed & handed over (${trackingResult.paymentMethod}).`,
        time: updatedStr,
        state: 'done',
      });
    }
    if (activeStepIndex >= 2) {
      events.push({
        title: `In Transit via ${trackingResult.district === 'Dhaka Metro' ? 'Dhaka Express Rider' : 'Steadfast / Pathao'}`,
        detail:
          trackingResult.courierNote ||
          `Parcel dispatched from Mirpur Lab Hub heading toward ${trackingResult.district}.`,
        time: activeStepIndex === 2 ? updatedStr : 'Completed',
        state: activeStepIndex === 2 ? 'active' : 'done',
      });
    }
    if (activeStepIndex >= 1) {
      events.push({
        title: 'ESD Packing & Bench QC Passed',
        detail: 'Sensors, boards & modules verified on Robotera BD bench before sealing.',
        time: activeStepIndex === 1 ? updatedStr : 'Completed',
        state: activeStepIndex === 1 ? 'active' : 'done',
      });
    }
    events.push({
      title: `Order #${trackingResult.orderId} Placed`,
      detail: `${trackingResult.itemCount} item${trackingResult.itemCount > 1 ? 's' : ''} · ৳${trackingResult.total.toLocaleString('en-IN')} (${trackingResult.paymentMethod})`,
      time: createdStr,
      state: activeStepIndex === 0 ? 'active' : 'done',
    });

    return events;
  }, [trackingResult, activeStepIndex]);

  return (
    <section
      id="order-tracking"
      className="bg-[#F5F8FC] min-[1500px]:bg-transparent min-[1500px]:pointer-events-none min-h-[calc(100dvh-14rem)]"
    >
      <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-[#F5F8FC] min-[1500px]:border-x min-[1500px]:border-slate-200/90 px-4 sm:px-6 lg:px-10 py-6 sm:py-10 lg:py-12 space-y-6">
        {/* Top Page Breadcrumb & Return to Storefront */}
        <div className="animate-fade-in flex flex-wrap items-center justify-between gap-3">
          {onBackToStore && (
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onBackToStore();
              }}
              className="active:scale-95 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-[#071A3D] border border-slate-200/90 hover:border-[#071A3D] text-xs sm:text-sm font-semibold text-[#071A3D] hover:text-white transition-all"
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
                <Radio className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Live Real-Time Firestore Tracking</span>
              </p>
              <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-[#071A3B] tracking-tight">
                Track Your Order
              </h1>
              <p className="text-sm text-[#334155] leading-relaxed">
                Enter your Robotera BD Order ID or pick a recent order to watch your delivery van
                advance in real time from our Dhaka Lab to your doorstep.
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
                className="cta-sheen active:scale-[0.98] h-11 px-6 rounded-lg bg-[#0866F5] hover:bg-[#0654CC] border border-[#0866F5] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0"
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
                    ? 'Your Account Orders (Live Stream)'
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
                        onClick={() => {
                          playTapSound();
                          startLiveTracking(item.orderId, true);
                        }}
                        style={{ animationDelay: `${idx * 45}ms` }}
                        className={`animate-cart-enter active:scale-[0.99] w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
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
                              {item.itemCount
                                ? ` · ${item.itemCount} item${item.itemCount > 1 ? 's' : ''}`
                                : ''}
                              {item.total !== undefined
                                ? ` · ৳${item.total.toLocaleString('en-IN')}`
                                : ''}
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
              <div className="py-14 flex flex-col items-center justify-center gap-3 text-center">
                <div className="relative w-12 h-12 rounded-2xl bg-[#071A3B] text-[#38BDF8] flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                  <span
                    aria-hidden="true"
                    className="animate-ring-expand absolute inset-0 rounded-2xl border border-[#0866F5]"
                  />
                </div>
                <p className="text-sm font-medium text-[#334155]">
                  Connecting live stream for{' '}
                  <span className="font-mono font-bold text-[#071A3B]">#{activeTrackId}</span>...
                </p>
              </div>
            ) : activeTrackId && !trackingResult ? (
              <div className="animate-pop-in py-10 text-center space-y-2.5">
                <p className="font-display text-base font-bold text-[#071A3B]">
                  Order #{activeTrackId} Not Found
                </p>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Please double-check your Order ID (for example{' '}
                  <span className="font-mono font-semibold">RBD-XXXX-XXXX</span>) from your
                  checkout confirmation receipt.
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
                        className="active:scale-95 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-300 text-[11px] font-semibold text-[#334155] hover:text-[#0866F5] hover:border-[#0866F5]/60 transition-all"
                      >
                        {copiedLink ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
                      </button>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-700">
                        <Radio className="w-3 h-3 text-emerald-600" />
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

                {/* Live Animated Delivery Car & Highway Route Map */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#061530] via-[#09204A] to-[#0A295E] border border-[#1677FF]/35 text-white p-4 sm:p-5 shadow-[0_18px_40px_-18px_rgba(7,26,61,0.55)]">
                  <div
                    aria-hidden="true"
                    className="animate-signal-sweep pointer-events-none absolute top-0 left-0 right-0 h-px z-10"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-45"
                  />

                  <div className="relative z-10 space-y-4">
                    {/* Route Telemetry Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-[#1677FF]/25 border border-[#00C8FF]/40 flex items-center justify-center shrink-0">
                          <Navigation className="w-3.5 h-3.5 text-[#00C8FF]" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#00C8FF]">
                            Live Courier Route
                          </p>
                          <p className="font-display text-xs sm:text-sm font-bold text-white truncate">
                            Dhaka Central Lab → {trackingResult.district}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 font-mono text-[11px] text-slate-200">
                          <CalendarClock className="w-3.5 h-3.5 text-[#00C8FF]" />
                          <span>ETA: {etaWindowLabel}</span>
                        </span>
                      </div>
                    </div>

                    {/* Road Highway + Moving Delivery Car */}
                    <div className="relative pt-11 pb-7 px-2 sm:px-4">
                      {/* Moving Delivery Van anchored above road */}
                      <div
                        className="absolute top-1 z-20 -translate-x-1/2 transition-[left] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{ left: `${carDisplayPct}%` }}
                      >
                        <div className="flex flex-col items-center">
                          <span
                            className={`mb-0.5 px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap ${
                              trackingResult.status === 'Cancelled'
                                ? 'bg-red-950/90 border-red-400/50 text-red-200'
                                : trackingResult.status === 'Delivered'
                                ? 'bg-emerald-950/90 border-emerald-400/50 text-emerald-200'
                                : 'bg-[#050B18]/90 border-[#00C8FF]/45 text-[#00C8FF]'
                            }`}
                          >
                            {carStatusTag}
                          </span>
                          <DeliveryCarSvg
                            status={trackingResult.status}
                            moving={isCarMoving}
                          />
                        </div>
                      </div>

                      {/* Asphalt Road Lane */}
                      <div className="relative h-3.5 rounded-full bg-[#040B18] border border-white/15 overflow-hidden shadow-inner">
                        {/* Completed Highway Route Glow */}
                        {trackingResult.status !== 'Cancelled' && (
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1677FF] via-[#0EA5E9] to-[#00C8FF] transition-[width] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
                            style={{ width: `${carDisplayPct}%` }}
                          />
                        )}

                        {/* Animated Center Road Lane Dashes */}
                        <div
                          aria-hidden="true"
                          className={`absolute inset-y-0 left-0 right-[-32px] flex items-center opacity-50 ${
                            isCarMoving ? 'animate-road-scroll' : ''
                          }`}
                          style={{
                            backgroundImage:
                              'repeating-linear-gradient(to right, rgba(255,255,255,0.7) 0px, rgba(255,255,255,0.7) 14px, transparent 14px, transparent 32px)',
                            height: '2px',
                            top: '50%',
                            marginTop: '-1px',
                          }}
                        />
                      </div>

                      {/* 4 Highway Checkpoints */}
                      {STEPS.map((step, idx) => {
                        const reached =
                          trackingResult.status !== 'Cancelled' && idx <= activeStepIndex;
                        return (
                          <div
                            key={step.status}
                            className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center"
                            style={{ left: `${step.pct}%` }}
                          >
                            <span
                              className={`w-3 h-3 rounded-full border-2 -mt-4 mb-1.5 transition-colors ${
                                reached
                                  ? 'bg-[#00C8FF] border-white shadow-[0_0_10px_rgba(0,200,255,0.85)]'
                                  : 'bg-[#09204A] border-slate-500'
                              }`}
                            />
                            <span
                              className={`text-[10px] font-mono font-semibold whitespace-nowrap ${
                                reached ? 'text-white' : 'text-slate-400'
                              }`}
                            >
                              {step.shortLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                )}

                {/* Real Timestamp Telemetry, Dispatch Notes & Chronological Activity Log */}
                <div className="rounded-xl bg-white border border-slate-300/80 p-4 space-y-3 text-xs">
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

                  <div className="pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[#334155]">
                    <span>
                      Logistics:{' '}
                      <strong className="text-[#071A3B]">{courierPartnerLabel}</strong>
                    </span>
                    {trackingResult.courierNote && (
                      <span className="font-semibold text-[#0866F5] bg-[#EFF6FF] border border-blue-200 px-2.5 py-1 rounded-lg">
                        Dispatch Update: {trackingResult.courierNote}
                      </span>
                    )}
                  </div>

                  {/* Chronological Live Shipment Log */}
                  <div className="pt-2.5 border-t border-slate-200/80 space-y-2.5">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                      Shipment Event Log
                    </p>
                    <div className="space-y-2">
                      {milestoneTimeline.map((evt, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <span
                            className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                              evt.state === 'cancelled'
                                ? 'bg-red-500'
                                : evt.state === 'active'
                                ? 'bg-[#0866F5] ring-4 ring-blue-100'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="font-semibold text-[#071A3B]">{evt.title}</p>
                              <span className="font-mono text-[10px] text-[#64748B]">
                                {evt.time}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#475569] mt-0.5 leading-snug">
                              {evt.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Signed-In Owner Full Package Manifest */}
                {ownedOrderDetail && (
                  <div className="rounded-xl bg-white border border-slate-300/80 p-4 space-y-2.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                      <span className="font-display font-bold text-[#071A3B]">
                        Verified Order Manifest
                      </span>
                      <span className="text-[11px] text-[#475569]">
                        {ownedOrderDetail.customerName} · {ownedOrderDetail.address}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {ownedOrderDetail.items.map((item, idx) => (
                        <div
                          key={`${item.productId}-${idx}`}
                          className="py-1.5 flex items-center justify-between gap-3"
                        >
                          <span className="text-[#334155] truncate">
                            <strong className="font-mono text-[#071A3B]">
                              {item.quantity}×
                            </strong>{' '}
                            {item.name}
                            {item.variant ? ` (${item.variant})` : ''}
                          </span>
                          <span className="font-mono font-semibold text-[#071A3B] shrink-0 tabular-nums">
                            ৳{(item.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Interactive Preview Route with Parked Delivery Van before Search */
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#061530] via-[#09204A] to-[#0A295E] border border-[#1677FF]/30 text-white p-4 sm:p-5">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-lab-grid-dark opacity-45"
                  />
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#00C8FF]">
                          Dispatch Standby
                        </p>
                        <p className="font-display text-sm font-bold text-white">
                          Robotera BD Fleet Ready — Enter an Order ID
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-slate-300">
                        Dhaka → 64 Districts
                      </span>
                    </div>

                    <div className="relative pt-10 pb-6 px-2">
                      <div className="absolute top-1 left-[10%] -translate-x-1/2">
                        <DeliveryCarSvg status="Pending" moving={false} />
                      </div>
                      <div className="relative h-3 rounded-full bg-[#040B18] border border-white/15 overflow-hidden">
                        <div
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0 right-0 opacity-40"
                          style={{
                            backgroundImage:
                              'repeating-linear-gradient(to right, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 14px, transparent 14px, transparent 32px)',
                            height: '2px',
                            top: '50%',
                            marginTop: '-1px',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

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
                onClick={() => playTapSound()}
                className="active:scale-95 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] border border-[#16A34A] text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-all"
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
