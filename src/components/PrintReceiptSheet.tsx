import React from 'react';
import { createPortal } from 'react-dom';
import { formatReceiptDateTime, buildOrderTrackingUrl } from '../lib/receiptPdf';
import { OrderReceipt } from '../types/store';
import { BrandLogo } from './BrandLogo';
import { HardwareArtwork } from './HardwareArtwork';

interface PrintReceiptSheetProps {
  receipt: OrderReceipt | null;
  qrDataUrl?: string;
}

export const PrintReceiptSheet: React.FC<PrintReceiptSheetProps> = ({ receipt, qrDataUrl }) => {
  if (!receipt || typeof document === 'undefined') return null;

  const ts = formatReceiptDateTime(receipt.createdAtIso || receipt.createdAt);
  const trackingUrl = buildOrderTrackingUrl(receipt.orderId);
  const promoGiftDiscount = Math.max(0, receipt.discount - (receipt.rewardDiscount ?? 0));
  const totalUnits = receipt.items.reduce((sum, item) => sum + item.quantity, 0);

  return createPortal(
    <div
      id="robotera-a4-print-root"
      aria-hidden="true"
      className="hidden print:block bg-white text-[#071A3B] font-sans text-[11px] leading-snug"
    >
      {/* Top Structural Accent Bar */}
      <div className="h-1.5 w-full flex mb-3">
        <div className="w-2/3 bg-[#071A3B]" />
        <div className="w-1/3 bg-[#0866F5]" />
      </div>

      {/* Row 1: Letterhead Grid */}
      <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-300">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <BrandLogo size="lg" className="border-slate-300 shrink-0" />
          <div className="min-w-0">
            <h1 className="font-hero text-xl font-extrabold tracking-tight text-[#071A3B]">
              ROBOTERA BD
            </h1>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#0866F5]">
              Robotics &amp; Embedded Electronics Store · Bangladesh
            </p>
            <p className="text-[9.5px] text-slate-600 mt-1">
              Multiplan &amp; Mirpur-10 Robotics Hub, Dhaka 1216
            </p>
            <p className="text-[9.5px] text-slate-600">
              Hotline: +880 1624-987366 · Web: roboterabd.vercel.app
            </p>
          </div>
        </div>

        <div className="border border-[#071A3B] rounded-md overflow-hidden min-w-[54mm] shrink-0 text-center">
          <div className="bg-[#071A3B] text-white text-[9px] font-bold uppercase tracking-wider py-1 px-2">
            Official A4 Order Receipt
          </div>
          <div className="px-3 py-1.5 bg-slate-50">
            <p className="font-mono text-sm font-extrabold text-[#0866F5]">#{receipt.orderId}</p>
            <p className="font-mono text-[9.5px] font-semibold text-slate-700 mt-0.5">
              {ts.fullDateTime}
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: 3-Column Architectural Metadata & QR Grid */}
      <div className="mt-3 grid grid-cols-12 border border-slate-300 rounded-md overflow-hidden">
        {/* Cell 1: Recipient & Payment */}
        <div className="col-span-4 border-r border-slate-300 flex flex-col">
          <div className="bg-slate-100 border-b border-slate-300 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#071A3B]">
            01 · Recipient &amp; Payment
          </div>
          <div className="p-2.5 space-y-1.5 flex-1">
            <div>
              <p className="text-[8.5px] font-bold uppercase text-slate-500">Customer Name</p>
              <p className="font-bold text-xs text-[#071A3B]">{receipt.customerName}</p>
            </div>
            <div>
              <p className="text-[8.5px] font-bold uppercase text-slate-500">Contact Phone</p>
              <p className="font-mono font-bold text-[10.5px]">{receipt.phone}</p>
            </div>
            <div>
              <p className="text-[8.5px] font-bold uppercase text-slate-500">Payment Method</p>
              <p className="font-semibold text-[10.5px]">{receipt.paymentMethod}</p>
            </div>
          </div>
        </div>

        {/* Cell 2: Delivery & Precision Timestamp */}
        <div className="col-span-5 border-r border-slate-300 flex flex-col">
          <div className="bg-slate-100 border-b border-slate-300 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#071A3B]">
            02 · Delivery &amp; Exact Timestamp
          </div>
          <div className="p-2.5 space-y-2 flex-1">
            <div>
              <p className="text-[8.5px] font-bold uppercase text-slate-500">Shipping Address</p>
              <p className="text-[10.5px] text-slate-800 break-words">
                {receipt.address}, {receipt.district}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200">
              <div>
                <p className="text-[8.5px] font-bold uppercase text-slate-500">Order Date</p>
                <p className="font-mono font-bold text-[10.5px] text-[#071A3B]">{ts.dateLabel}</p>
              </div>
              <div>
                <p className="text-[8.5px] font-bold uppercase text-slate-500">
                  Exact Time (Hr:Min:Sec)
                </p>
                <p className="font-mono font-bold text-[10.5px] text-[#0866F5]">{ts.timeLabel}</p>
              </div>
            </div>
            <p className="text-[9.5px] text-slate-600">
              Dispatch SLA:{' '}
              {receipt.district === 'Dhaka Metro'
                ? '2–3 Days (Dhaka Metro)'
                : '2–4 Days (Steadfast / Pathao Courier)'}
            </p>
          </div>
        </div>

        {/* Cell 3: QR Code for Live Order Tracking */}
        <div className="col-span-3 flex flex-col">
          <div className="bg-slate-100 border-b border-slate-300 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#071A3B] text-center">
            03 · Tracking QR
          </div>
          <div className="p-2 flex-1 flex flex-col items-center justify-center text-center">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt={`Order tracking QR code for ${receipt.orderId}`}
                className="w-[24mm] h-[24mm] border border-slate-200 rounded p-0.5 bg-white"
              />
            )}
            <p className="font-mono text-[8.5px] font-bold text-[#071A3B] mt-1">
              SCAN TO TRACK LIVE
            </p>
            <p className="font-mono text-[8px] text-[#0866F5]">#{receipt.orderId}</p>
          </div>
        </div>
      </div>

      {/* Row 3: Grid-Based Hardware Product Table */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-[#071A3B]">
            04 · Ordered Hardware &amp; Product Grid
          </h2>
          <span className="font-mono text-[9.5px] font-bold text-slate-600">
            {receipt.items.length} SKU{receipt.items.length === 1 ? '' : 's'} | {totalUnits} UNIT
            {totalUnits === 1 ? '' : 'S'}
          </span>
        </div>

        <table className="w-full border-collapse border border-slate-300">
          <thead>
            <tr className="bg-[#071A3B] text-white text-[9px] font-bold uppercase">
              <th className="border border-slate-300 py-1.5 px-2 text-center w-8">#</th>
              <th className="border border-slate-300 py-1.5 px-2 text-center w-16">Image</th>
              <th className="border border-slate-300 py-1.5 px-2.5 text-left">
                Product Details &amp; SKU
              </th>
              <th className="border border-slate-300 py-1.5 px-2 text-center w-14">Qty</th>
              <th className="border border-slate-300 py-1.5 px-2 text-right w-24">Unit Price</th>
              <th className="border border-slate-300 py-1.5 px-2.5 text-right w-28">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item, idx) => (
              <tr
                key={`${item.product.id}-${item.variant ?? ''}`}
                className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}
              >
                <td className="border border-slate-300 py-2 px-2 text-center font-mono font-bold text-slate-500">
                  {String(idx + 1).padStart(2, '0')}
                </td>
                <td className="border border-slate-300 py-1.5 px-2 text-center">
                  <div className="w-11 h-11 mx-auto rounded border border-slate-200 bg-white p-0.5 flex items-center justify-center overflow-hidden">
                    <HardwareArtwork
                      kind={item.product.artwork}
                      imageUrl={item.product.imageUrl}
                      alt={item.product.name}
                      fit="contain"
                      className="w-full h-full"
                    />
                  </div>
                </td>
                <td className="border border-slate-300 py-2 px-2.5">
                  <p className="font-bold text-[#071A3B] text-[11px]">{item.product.name}</p>
                  <p className="font-mono text-[9px] font-bold text-[#0866F5]">
                    SKU: {item.product.sku}
                    {item.variant ? ` · Variant: ${item.variant}` : ''}
                    {item.product.categoryLabel ? ` · ${item.product.categoryLabel}` : ''}
                  </p>
                  {item.product.shortDesc && (
                    <p className="text-[9px] text-slate-600 line-clamp-1 mt-0.5">
                      {item.product.shortDesc}
                    </p>
                  )}
                </td>
                <td className="border border-slate-300 py-2 px-2 text-center font-mono font-bold">
                  x{item.quantity}
                </td>
                <td className="border border-slate-300 py-2 px-2 text-right font-mono text-slate-700 tabular-nums">
                  BDT {item.product.price.toLocaleString('en-IN')}
                </td>
                <td className="border border-slate-300 py-2 px-2.5 text-right font-mono font-bold text-[#071A3B] tabular-nums">
                  BDT {(item.product.price * item.quantity).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row 4: Bottom Verification & Totals Grid */}
      <div className="mt-4 grid grid-cols-12 gap-3 items-stretch">
        <div className="col-span-7 border border-slate-300 rounded-md p-3 flex flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#071A3B]">
              05 · Dispatch Verification &amp; Warranty
            </p>
            <p className="text-[9.5px] text-slate-600 mt-1.5">
              {receipt.notes
                ? `Note: ${receipt.notes} · `
                : ''}
              All silicon &amp; robotics components are ESD bench-tested in Dhaka with a 7-day
              replacement warranty.
            </p>
          </div>
          <p className="font-mono text-[9px] font-bold text-[#0866F5] mt-2 break-all">
            Live Order Tracking: {trackingUrl}
          </p>
        </div>

        <div className="col-span-5 border border-slate-300 rounded-md overflow-hidden flex flex-col justify-between">
          <div className="bg-slate-100 border-b border-slate-300 px-3 py-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-[#071A3B]">
            <span>06 · Payment Summary</span>
            <span className="font-mono text-slate-500">Currency: BDT</span>
          </div>
          <div className="p-2.5 space-y-1.5 text-[10px] flex-1">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-mono font-bold tabular-nums">
                BDT {receipt.subtotal.toLocaleString('en-IN')}
              </span>
            </div>
            {promoGiftDiscount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount ({receipt.couponCode || 'Promo'})</span>
                <span className="font-mono font-bold tabular-nums">
                  - BDT {promoGiftDiscount.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            {(receipt.rewardDiscount ?? 0) > 0 && (
              <div className="flex justify-between text-[#0866F5] font-semibold">
                <span>Reward Points (-{receipt.rewardPointsRedeemed ?? 0} pts)</span>
                <span className="font-mono font-bold tabular-nums">
                  - BDT {(receipt.rewardDiscount ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Delivery ({receipt.district})</span>
              <span className="font-mono font-bold tabular-nums">
                BDT {receipt.deliveryFee}
              </span>
            </div>
          </div>

          <div className="bg-[#071A3B] text-white px-3 py-2 flex items-center justify-between">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-sky-200">
              Total Payable
            </span>
            <span className="font-mono text-sm font-extrabold tabular-nums">
              BDT {receipt.total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-2 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
        <span>Robotera BD · Print-Ready A4 Customer Receipt · Issued {ts.fullDateTime}</span>
        <span className="font-mono font-bold">#{receipt.orderId}</span>
      </div>
    </div>,
    document.body
  );
};
