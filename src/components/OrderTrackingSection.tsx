import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  MessageCircle,
  PackageCheck,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import { fetchOrderTracking } from '../lib/firebase';
import { OrderStatus, OrderTrackingInfo } from '../types/store';

interface OrderTrackingSectionProps {
  recentOrderIds: string[];
  autoTrackOrderId?: string | null;
  onBackToStore?: () => void;
}

const STEPS: { status: Exclude<OrderStatus, 'Cancelled'>; label: string; desc: string }[] = [
  { status: 'Pending', label: 'Order Placed', desc: 'Received by Dhaka dispatch desk' },
  { status: 'Confirmed', label: 'Lab Verified', desc: 'Hardware tested & ESD packed' },
  { status: 'Shipped', label: 'In Transit', desc: 'Handed to Dhaka / Steadfast rider' },
  { status: 'Delivered', label: 'Delivered', desc: 'Signed & completed' },
];

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
  autoTrackOrderId,
  onBackToStore,
}) => {
  const [queryId, setQueryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchedId, setSearchedId] = useState<string | null>(null);
  const [trackingResult, setTrackingResult] = useState<OrderTrackingInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const runLookup = async (idToTrack: string) => {
    const clean = idToTrack.trim().replace(/^#/, '');
    if (!clean) return;
    setLoading(true);
    setErrorMsg('');
    setSearchedId(clean);

    try {
      const result = await fetchOrderTracking(clean);
      setTrackingResult(result);
    } catch {
      setErrorMsg('Unable to check shipment status right now. Please try again.');
      setTrackingResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoTrackOrderId) {
      setQueryId(autoTrackOrderId);
      void runLookup(autoTrackOrderId);
    }
  }, [autoTrackOrderId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = queryId.trim().replace(/^#/, '');
    if (!clean) return;
    if (typeof window !== 'undefined') {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#track=${encodeURIComponent(clean)}`
      );
    }
    void runLookup(clean);
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

  const whatsappTrackUrl = `https://wa.me/8801624987366?text=${encodeURIComponent(
    trackingResult
      ? `Hello Robotera BD, I am checking shipment status for Order #${trackingResult.orderId}.`
      : searchedId
      ? `Hello Robotera BD, I need help tracking Order #${searchedId}.`
      : 'Hello Robotera BD, I need help tracking my order.'
  )}`;

  return (
    <section
      id="order-tracking"
      className="py-6 sm:py-10 lg:py-12 bg-[#F4F7FB] min-h-[calc(100dvh-14rem)]"
    >
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
        {/* Top Page Breadcrumb & Return to Storefront */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {onBackToStore && (
            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-[#0057E7] text-xs sm:text-sm font-semibold text-[#06142E] hover:text-[#0057E7] transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Storefront</span>
            </button>
          )}
          <span className="text-xs font-mono text-slate-500">
            Dhaka Dispatch &amp; Steadfast / Pathao Courier Lookup
          </span>
        </div>

        {/* Dedicated Full-Page Order Tracker Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-9 items-start shadow-xs">
          {/* Left Lookup Form */}
          <div className="lg:col-span-5 space-y-4">
            <p className="text-xs font-semibold text-[#0057E7] tracking-wide">
              Real-Time Shipment Status
            </p>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-[#06142E] tracking-tight">
              Track Your Order
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Enter your Robotera BD Order ID from your checkout confirmation to view live
              bench-testing, courier dispatch, and delivery progress across Bangladesh.
            </p>

            <form onSubmit={handleSubmit} className="pt-1 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={queryId}
                  onChange={(e) => setQueryId(e.target.value)}
                  placeholder="e.g. RBD-4821-9034"
                  aria-label="Order ID"
                  className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-slate-200 bg-[#F9FBFD] text-base sm:text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-11 px-6 rounded-lg bg-[#0057E7] hover:bg-[#0044BB] disabled:opacity-60 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                {loading ? 'Checking...' : 'Track Order'}
              </button>
            </form>

            {recentOrderIds.length > 0 && (
              <div className="pt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-slate-600">
                <span>Your recent orders:</span>
                {recentOrderIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setQueryId(id);
                      void runLookup(id);
                    }}
                    className="px-2 py-0.5 rounded bg-[#EEF4FF] border border-blue-100 font-mono font-semibold text-[#0057E7] hover:bg-blue-100 transition-colors"
                  >
                    #{id}
                  </button>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#0057E7] shrink-0" />
                <span>Inside Dhaka: 2–3 days delivery (৳80 charge)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0057E7] shrink-0" />
                <span>Outside Dhaka: 2–4 days delivery via Steadfast &amp; Pathao (৳150 charge)</span>
              </div>
            </div>
          </div>

          {/* Right Live Status Panel */}
          <div className="lg:col-span-7 bg-[#F9FBFD] rounded-xl border border-slate-200 p-4 sm:p-6">
            {errorMsg ? (
              <div className="py-8 text-center text-sm text-red-600">{errorMsg}</div>
            ) : loading ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Fetching shipment status for <span className="font-mono">#{searchedId}</span>...
              </div>
            ) : searchedId && !trackingResult ? (
              <div className="py-8 text-center space-y-2.5">
                <p className="font-display text-base font-bold text-[#06142E]">
                  Order #{searchedId} Not Found
                </p>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Please double-check your Order ID (for example <span className="font-mono">RBD-XXXX-XXXX</span>)
                  from your checkout confirmation receipt.
                </p>
              </div>
            ) : trackingResult ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs font-semibold text-[#0057E7]">
                        Order #{trackingResult.orderId}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopyTrackingLink(trackingResult.orderId)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 hover:text-[#0057E7]"
                      >
                        {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
                      </button>
                    </div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-[#06142E] mt-1">
                      Status: {trackingResult.status}
                    </h2>
                  </div>

                  <div className="text-left sm:text-right text-xs text-slate-600 space-y-0.5">
                    <p>
                      Destination: <strong className="text-[#06142E]">{trackingResult.district}</strong>
                    </p>
                    <p className="font-mono tabular-nums">
                      {trackingResult.itemCount} item{trackingResult.itemCount > 1 ? 's' : ''} · ৳
                      {trackingResult.total.toLocaleString('en-IN')} ({trackingResult.paymentMethod})
                    </p>
                  </div>
                </div>

                {trackingResult.status === 'Cancelled' ? (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3 text-xs text-red-800">
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <p className="font-semibold">This order has been cancelled.</p>
                      {trackingResult.courierNote && (
                        <p className="mt-1 text-red-700">{trackingResult.courierNote}</p>
                      )}
                    </div>
                  </div>
                ) : (
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
                          className={`rounded-xl p-3.5 border transition-colors ${
                            isCurrent
                              ? 'bg-[#06142E] border-[#06142E] text-white'
                              : completed
                              ? 'bg-white border-blue-200 text-[#06142E]'
                              : 'bg-white/60 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <StepIcon
                              className={`w-4 h-4 ${
                                isCurrent
                                  ? 'text-blue-300'
                                  : completed
                                  ? 'text-[#0057E7]'
                                  : 'text-slate-300'
                              }`}
                            />
                            <span className="font-mono text-[10px]">0{idx + 1}</span>
                          </div>
                          <p className="font-display text-xs font-bold">{step.label}</p>
                          <p
                            className={`text-[11px] mt-1 leading-snug ${
                              isCurrent
                                ? 'text-slate-300'
                                : completed
                                ? 'text-slate-500'
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

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                  <span>
                    Last updated:{' '}
                    <strong className="text-slate-700">
                      {formatFirestoreTimestamp(trackingResult.updatedAt)}
                    </strong>
                  </span>
                  {trackingResult.courierNote && (
                    <span className="font-medium text-[#0057E7]">
                      Dispatch Note: {trackingResult.courierNote}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Clean 4-Step Fulfillment Preview before search */
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-500">
                  How Robotera BD Fulfillment Works
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {STEPS.map((step, idx) => (
                    <div
                      key={step.status}
                      className="rounded-xl p-3.5 bg-white border border-slate-200"
                    >
                      <span className="font-mono text-[11px] font-semibold text-[#0057E7]">
                        Step 0{idx + 1}
                      </span>
                      <p className="font-display text-xs font-bold text-[#06142E] mt-1">
                        {step.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-600">
                Need urgent courier updates or campus gate delivery coordination?
              </p>
              <a
                href={whatsappTrackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
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
