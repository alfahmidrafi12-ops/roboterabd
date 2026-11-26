import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { isWatermarkedUrl } from '../data/brandMedia';
import { ArtworkKind, OrderReceipt, Product, StoredOrder } from '../types/store';

export const RECEIPT_BRAND_LOGO_PATH = '/assets/aistudio/robotera_bd_logo_500x500_041558b0.jpg';
export const TRACK_ORDER_BASE_URL = 'https://roboterabd.vercel.app/track-order';

export interface FormattedReceiptTimestamp {
  dateLabel: string;
  timeLabel: string;
  fullDateTime: string;
  isoString: string;
}

let cachedLogoDataUrl: string | null = null;

export function buildOrderTrackingUrl(orderId: string): string {
  const clean = (orderId || '').trim().replace(/^#/, '');
  return `${TRACK_ORDER_BASE_URL}#track=${encodeURIComponent(clean)}`;
}

export async function generateOrderTrackingQrDataUrl(orderId: string): Promise<string> {
  try {
    return await QRCode.toDataURL(buildOrderTrackingUrl(orderId), {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 240,
      color: {
        dark: '#071A3B',
        light: '#FFFFFF',
      },
    });
  } catch {
    return '';
  }
}

function parseUnknownTimestamp(input: unknown): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === 'string') {
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof input === 'number') {
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof input === 'object') {
    if ('toDate' in input && typeof (input as { toDate: () => Date }).toDate === 'function') {
      const d = (input as { toDate: () => Date }).toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if ('seconds' in input && typeof (input as { seconds: number }).seconds === 'number') {
      const d = new Date((input as { seconds: number }).seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

export function formatReceiptDateTime(input?: unknown): FormattedReceiptTimestamp {
  const date = parseUnknownTimestamp(input) ?? new Date();

  const dateLabel = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const hh = String(date.getHours() % 12 || 12).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
  const timeLabel = `${hh}:${mm}:${ss} ${ampm}`;

  return {
    dateLabel,
    timeLabel,
    fullDateTime: `${dateLabel} · ${timeLabel}`,
    isoString: date.toISOString(),
  };
}

export function storedOrderToReceipt(
  order: StoredOrder,
  catalogProducts: Product[] = []
): OrderReceipt {
  const productMap = new Map(catalogProducts.map((p) => [p.id, p]));
  const ts = formatReceiptDateTime(order.createdAt);

  return {
    orderId: order.orderId,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    district: order.district,
    paymentMethod: order.paymentMethod,
    status: order.status,
    items: order.items.map((line) => {
      const matched = productMap.get(line.productId);
      const fallbackProduct: Product = matched
        ? {
            ...matched,
            name: line.name || matched.name,
            sku: line.sku || matched.sku,
            price: line.price,
          }
        : {
            id: line.productId,
            sku: line.sku || 'RBD-HW',
            name: line.name,
            category: 'hardware',
            categoryLabel: 'Robotics Hardware',
            price: line.price,
            rating: 5,
            reviews: 0,
            stock: 1,
            artwork: 'esp32',
            shortDesc: '',
            specs: [],
          };

      return {
        product: fallbackProduct,
        quantity: line.quantity,
        variant: line.variant,
      };
    }),
    subtotal: order.subtotal,
    discount: order.discount,
    couponCode: order.couponCode,
    rewardPointsRedeemed: order.rewardPointsRedeemed,
    rewardDiscount: order.rewardDiscount,
    deliveryFee: order.deliveryFee,
    total: order.total,
    notes: order.notes,
    createdAt: ts.fullDateTime,
    createdAtIso: ts.isoString,
  };
}

function formatBdt(amount: number): string {
  const safe = Math.round(Number.isFinite(amount) ? amount : 0);
  return `BDT ${safe.toLocaleString('en-IN')}`;
}

function roundedCanvasRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawHardwareThumbnailFallback(kind: ArtworkKind, label: string): string {
  const size = 180;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#F8FAFC';
  roundedCanvasRect(ctx, 0, 0, size, size, 18);
  ctx.fill();

  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 3;
  roundedCanvasRect(ctx, 2, 2, size - 4, size - 4, 16);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(7, 26, 61, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 24; i < size; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 8);
    ctx.lineTo(i, size - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, i);
    ctx.lineTo(size - 8, i);
    ctx.stroke();
  }

  switch (kind) {
    case 'lidar': {
      ctx.fillStyle = '#0F172A';
      roundedCanvasRect(ctx, 42, 46, 96, 86, 18);
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(70, 88, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(110, 88, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#087BFF';
      ctx.beginPath();
      ctx.arc(70, 88, 7, 0, Math.PI * 2);
      ctx.arc(110, 88, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'servo':
    case 'stepper':
    case 'brushless': {
      ctx.fillStyle = '#1E293B';
      roundedCanvasRect(ctx, 44, 52, 92, 82, 12);
      ctx.fill();
      ctx.fillStyle = '#087BFF';
      roundedCanvasRect(ctx, 56, 76, 68, 36, 6);
      ctx.fill();
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(114, 46, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      roundedCanvasRect(ctx, 102, 34, 48, 12, 6);
      ctx.fill();
      break;
    }
    case 'arm':
    case 'rover': {
      ctx.fillStyle = '#071A3B';
      roundedCanvasRect(ctx, 36, 124, 108, 18, 6);
      ctx.fill();
      ctx.strokeStyle = '#087BFF';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(70, 124);
      ctx.lineTo(54, 76);
      ctx.lineTo(116, 52);
      ctx.stroke();
      ctx.fillStyle = '#00CFFF';
      ctx.beginPath();
      ctx.arc(70, 124, 9, 0, Math.PI * 2);
      ctx.arc(54, 76, 9, 0, Math.PI * 2);
      ctx.arc(116, 52, 8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'lipo':
    case 'bms':
    case 'buck': {
      ctx.fillStyle = '#0057E7';
      roundedCanvasRect(ctx, 36, 54, 98, 72, 12);
      ctx.fill();
      ctx.fillStyle = '#071A3B';
      roundedCanvasRect(ctx, 46, 64, 78, 52, 6);
      ctx.fill();
      ctx.fillStyle = '#F59E0B';
      roundedCanvasRect(ctx, 134, 72, 18, 34, 5);
      ctx.fill();
      ctx.fillStyle = '#38BDF8';
      ctx.font = '700 18px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PWR', 85, 96);
      break;
    }
    case 'oled': {
      ctx.fillStyle = '#005792';
      roundedCanvasRect(ctx, 44, 38, 92, 104, 10);
      ctx.fill();
      ctx.fillStyle = '#020617';
      roundedCanvasRect(ctx, 54, 58, 72, 62, 6);
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(64, 98);
      ctx.lineTo(80, 78);
      ctx.lineTo(94, 92);
      ctx.lineTo(114, 72);
      ctx.stroke();
      break;
    }
    case 'soldering':
    case 'analyzer': {
      ctx.fillStyle = '#1E293B';
      roundedCanvasRect(ctx, 30, 74, 84, 32, 8);
      ctx.fill();
      ctx.fillStyle = '#94A3B8';
      roundedCanvasRect(ctx, 114, 82, 40, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#38BDF8';
      roundedCanvasRect(ctx, 44, 82, 36, 16, 4);
      ctx.fill();
      break;
    }
    default: {
      ctx.fillStyle = '#071A3B';
      roundedCanvasRect(ctx, 46, 32, 88, 116, 12);
      ctx.fill();
      ctx.strokeStyle = '#087BFF';
      ctx.lineWidth = 3;
      roundedCanvasRect(ctx, 46, 32, 88, 116, 12);
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(56, 48 + i * 16, 3.2, 0, Math.PI * 2);
        ctx.arc(124, 48 + i * 16, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#E2E8F0';
      roundedCanvasRect(ctx, 68, 46, 44, 46, 6);
      ctx.fill();
      ctx.fillStyle = '#00CFFF';
      ctx.beginPath();
      ctx.arc(90, 118, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  const cleanTag = (label || kind || 'HW').toUpperCase().slice(0, 10);
  ctx.fillStyle = 'rgba(7, 26, 61, 0.88)';
  roundedCanvasRect(ctx, 22, size - 28, size - 44, 20, 6);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 10px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cleanTag, size / 2, size - 18);

  return canvas.toDataURL('image/png');
}

async function loadImageViaElement(url: string, timeoutMs = 2600): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const done = (val: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(val);
    };
    const timer = window.setTimeout(() => done(null), timeoutMs);
    if (!url.startsWith('data:') && !url.startsWith('blob:') && !url.startsWith('/')) {
      img.crossOrigin = 'anonymous';
    }
    img.referrerPolicy = 'no-referrer';
    img.onload = () => done(img);
    img.onerror = () => done(null);
    img.src = url;
  });
}

async function resolveBrandLogoDataUrl(): Promise<string> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  if (typeof document === 'undefined') return '';

  const img = await loadImageViaElement(RECEIPT_BRAND_LOGO_PATH, 2500);
  if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
    const size = 240;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      const pad = 8;
      const maxDim = size - pad * 2;
      const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      ctx.drawImage(img, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH);
      cachedLogoDataUrl = canvas.toDataURL('image/png');
      return cachedLogoDataUrl;
    }
  }
  return '';
}

async function resolveProductThumbnailDataUrl(product: Product): Promise<string> {
  if (typeof document === 'undefined') return '';

  const rawUrl = product.imageUrl?.trim();
  if (rawUrl && !isWatermarkedUrl(rawUrl)) {
    try {
      let img = await loadImageViaElement(rawUrl);

      if (!img && /^https?:\/\//i.test(rawUrl)) {
        try {
          const controller = new AbortController();
          const timer = window.setTimeout(() => controller.abort(), 2500);
          const res = await fetch(rawUrl, { signal: controller.signal, mode: 'cors' });
          window.clearTimeout(timer);
          if (res.ok) {
            const blob = await res.blob();
            const objUrl = URL.createObjectURL(blob);
            img = await loadImageViaElement(objUrl);
            URL.revokeObjectURL(objUrl);
          }
        } catch {
          // Ignore CORS fetch error and fall back to vector hardware tile
        }
      }

      if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
        const size = 180;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          roundedCanvasRect(ctx, 0, 0, size, size, 16);
          ctx.fill();

          const pad = 12;
          const maxDim = size - pad * 2;
          const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight);
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          const dx = (size - drawW) / 2;
          const dy = (size - drawH) / 2;
          ctx.drawImage(img, dx, dy, drawW, drawH);

          return canvas.toDataURL('image/png');
        }
      }
    } catch {
      // Fallback below
    }
  }

  return drawHardwareThumbnailFallback(product.artwork, product.sku || product.category);
}

function drawReceiptBrandFallback(doc: jsPDF, x: number, y: number, size: number) {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, size, size, 2, 2, 'FD');

  doc.setTextColor(12, 27, 51);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size * 1.45);
  doc.text('R', x + size / 2, y + size * 0.72, { align: 'center' });
}

function drawVectorQrCode(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  sizeMm: number
): void {
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const count = qr.modules.size;
    const quiet = 1;
    const cell = sizeMm / (count + quiet * 2);

    // Crisp white quiet-zone plate for scanner reliability
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.28);
    doc.roundedRect(x, y, sizeMm, sizeMm, 1.4, 1.4, 'FD');

    doc.setFillColor(7, 26, 61);
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.modules.get(r, c)) {
          doc.rect(
            x + (c + quiet) * cell,
            y + (r + quiet) * cell,
            cell + 0.03,
            cell + 0.03,
            'F'
          );
        }
      }
    }
  } catch {
    // Fallback bordered QR placeholder if encoding ever fails
    doc.setDrawColor(7, 26, 61);
    doc.rect(x, y, sizeMm, sizeMm, 'S');
  }
}

function drawOrderBarcode(
  doc: jsPDF,
  orderId: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const seedStr = orderId || 'RBD-0000-0000';
  doc.setFillColor(7, 26, 61);
  let cursor = x;
  const maxX = x + width;
  let idx = 0;

  while (cursor < maxX - 1.2) {
    const chCode = seedStr.charCodeAt(idx % seedStr.length);
    const barW = (chCode + idx * 3) % 3 === 0 ? 0.9 : (chCode + idx) % 2 === 0 ? 0.55 : 0.35;
    const gapW = (chCode + idx * 5) % 2 === 0 ? 0.52 : 0.82;
    if (cursor + barW <= maxX) {
      doc.rect(cursor, y, barW, height, 'F');
    }
    cursor += barW + gapW;
    idx++;
  }
}

export async function buildOrderReceiptPdf(
  receipt: OrderReceipt
): Promise<{ blob: Blob; filename: string }> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Strict A4 Geometry (210mm x 297mm) with print-safe 13mm margins
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 13;
  const contentWidth = pageWidth - margin * 2; // 184mm

  const ts = formatReceiptDateTime(receipt.createdAtIso || receipt.createdAt);
  const trackingUrl = buildOrderTrackingUrl(receipt.orderId);

  // Load Robotera BD logo + all product images in parallel
  const [brandLogoDataUrl, itemThumbnails] = await Promise.all([
    resolveBrandLogoDataUrl(),
    Promise.all(receipt.items.map((item) => resolveProductThumbnailDataUrl(item.product))),
  ]);

  // Adaptive compact mode when order has 5–7 items to guarantee clean 1-page A4 fit
  const compactRows = receipt.items.length >= 5 && receipt.items.length <= 7;

  // ================= 1. PRINT-FRIENDLY LETTERHEAD BAND =================
  let y = 11.5;

  // Clean top navy + electric-blue structural accent bar
  doc.setFillColor(7, 26, 61);
  doc.rect(margin, y, contentWidth * 0.68, 1.4, 'F');
  doc.setFillColor(8, 102, 245);
  doc.rect(margin + contentWidth * 0.68, y, contentWidth * 0.32, 1.4, 'F');

  y += 3.6;

  // Top-Right Official Order Receipt & Tracking Box (defined first so left column never collides)
  const idBoxW = 58;
  const idBoxH = 20;
  const idBoxX = pageWidth - margin - idBoxW;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(idBoxX, y, idBoxW, idBoxH, 1.8, 1.8, 'F');

  // Top dark navy header inside receipt badge (rounded top + flat bottom)
  doc.setFillColor(7, 26, 61);
  doc.roundedRect(idBoxX, y, idBoxW, 6.2, 1.8, 1.8, 'F');
  doc.rect(idBoxX, y + 3.4, idBoxW, 2.8, 'F');

  // Crisp outer border over the rounded card so corners remain clean
  doc.setDrawColor(7, 26, 61);
  doc.setLineWidth(0.35);
  doc.roundedRect(idBoxX, y, idBoxW, idBoxH, 1.8, 1.8, 'S');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.7);
  doc.text('OFFICIAL A4 ORDER RECEIPT', idBoxX + idBoxW / 2, y + 4.1, { align: 'center' });

  doc.setTextColor(8, 102, 245);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10.8);
  doc.text(`#${receipt.orderId}`, idBoxX + idBoxW / 2, y + 11.8, { align: 'center' });

  doc.setTextColor(51, 65, 85);
  doc.setFont('courier', 'bold');
  doc.setFontSize(6.8);
  doc.text(ts.fullDateTime, idBoxX + idBoxW / 2, y + 16.9, { align: 'center' });

  // Official Robotera BD Logo Frame (left)
  const logoBoxSize = 18;
  if (brandLogoDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.roundedRect(margin, y + 0.5, logoBoxSize, logoBoxSize, 2, 2, 'FD');
    try {
      doc.addImage(
        brandLogoDataUrl,
        'PNG',
        margin + 0.9,
        y + 1.4,
        logoBoxSize - 1.8,
        logoBoxSize - 1.8,
        undefined,
        'FAST'
      );
    } catch {
      drawReceiptBrandFallback(doc, margin, y + 0.5, logoBoxSize);
    }
  } else {
    drawReceiptBrandFallback(doc, margin, y + 0.5, logoBoxSize);
  }

  // Brand Wordmark & Store Info strictly bounded before idBoxX (zero email, zero overlap)
  const brandTextX = margin + logoBoxSize + 4;
  const brandMaxW = idBoxX - brandTextX - 5; // ~99mm safe column width

  doc.setTextColor(7, 26, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16.2);
  doc.text('ROBOTERA BD', brandTextX, y + 5.3, { maxWidth: brandMaxW });

  doc.setTextColor(8, 102, 245);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.1);
  doc.text('ROBOTICS & EMBEDDED ELECTRONICS STORE · BANGLADESH', brandTextX, y + 9.5, {
    maxWidth: brandMaxW,
  });

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.text('Multiplan & Mirpur-10 Robotics Hub, Dhaka 1216', brandTextX, y + 14, {
    maxWidth: brandMaxW,
  });
  doc.text('Hotline: +880 1624-987366  ·  Web: roboterabd.vercel.app', brandTextX, y + 18, {
    maxWidth: brandMaxW,
  });

  y += idBoxH + 4.5;

  // ================= 2. 3-COLUMN METADATA + QR CODE GRID =================
  const metaGridH = 47;
  const col1W = 63;
  const col2W = 76;
  const col3W = contentWidth - col1W - col2W; // 45mm
  const col2X = margin + col1W;
  const col3X = col2X + col2W;

  // Outer card fill & rounded frame
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentWidth, metaGridH, 2, 2, 'F');

  // Grid Header Strip (rounded top corners, square bottom)
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 6.8, 2, 2, 'F');
  doc.rect(margin, y + 3.5, contentWidth, 3.3, 'F');

  // Crisp grid dividers & outer border
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, y, contentWidth, metaGridH, 2, 2, 'S');
  doc.line(margin, y + 6.8, pageWidth - margin, y + 6.8);
  doc.line(col2X, y, col2X, y + metaGridH);
  doc.line(col3X, y, col3X, y + metaGridH);

  // Grid Column Headings
  doc.setTextColor(7, 26, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('01 · RECIPIENT & PAYMENT', margin + 3.5, y + 4.6);
  doc.text('02 · DELIVERY & TIMESTAMP', col2X + 3.5, y + 4.6);
  doc.text('03 · TRACKING QR', col3X + col3W / 2, y + 4.6, { align: 'center' });

  // --- Cell 1: Customer Name, Phone, Payment Method, Status ---
  const c1Y = y + 11.2;
  const c1MaxW = col1W - 7;

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.text('CUSTOMER NAME', margin + 3.5, c1Y);

  doc.setTextColor(7, 26, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.4);
  const wrappedName = doc.splitTextToSize(
    (receipt.customerName || 'Valued Customer').trim(),
    c1MaxW
  ) as string[];
  doc.text(wrappedName.slice(0, 2), margin + 3.5, c1Y + 4.2);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.text('CONTACT PHONE', margin + 3.5, c1Y + 12.2);
  doc.setTextColor(15, 23, 42);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.2);
  doc.text((receipt.phone || 'N/A').slice(0, 24), margin + 3.5, c1Y + 16.3, {
    maxWidth: c1MaxW,
  });

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.text('PAYMENT METHOD', margin + 3.5, c1Y + 22.2);
  doc.setTextColor(7, 26, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.text(receipt.paymentMethod, margin + 3.5, c1Y + 26.6, { maxWidth: c1MaxW });

  // --- Cell 2: Delivery Address + Exact Date & Time (Hour:Min:Sec) ---
  const c2MaxW = col2W - 7;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.text('DELIVERY ADDRESS', col2X + 3.5, c1Y);

  // Set target font BEFORE calling splitTextToSize so wrapping matches exact glyph metrics
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  const fullAddrText = `${receipt.address}, ${receipt.district}`.replace(/\s+,/g, ',').trim();
  const addrLines = (doc.splitTextToSize(fullAddrText, c2MaxW) as string[]).slice(0, 3);
  doc.text(addrLines, col2X + 3.5, c1Y + 4.1);

  // Clean horizontal sub-grid inside Cell 2 for Timestamp Precision
  const timeBoxY = y + 26.8;
  doc.setDrawColor(226, 232, 240);
  doc.line(col2X, timeBoxY, col3X, timeBoxY);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.1);
  doc.text('ORDER DATE', col2X + 3.5, timeBoxY + 4.3);
  doc.text('EXACT TIME (HR:MIN:SEC)', col2X + 32, timeBoxY + 4.3);

  doc.setTextColor(7, 26, 61);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.2);
  doc.text(ts.dateLabel, col2X + 3.5, timeBoxY + 9);

  doc.setTextColor(8, 102, 245);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.4);
  doc.text(ts.timeLabel, col2X + 32, timeBoxY + 9);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.9);
  const slaLabel =
    receipt.district === 'Dhaka Metro'
      ? 'SLA: 2–3 Days (Dhaka Metro Dispatch)'
      : 'SLA: 2–4 Days (Steadfast / Pathao Courier)';
  doc.text(slaLabel, col2X + 3.5, timeBoxY + 15.8, { maxWidth: c2MaxW });

  // --- Cell 3: Scannable Vector QR Code for Live Order Tracking ---
  const qrSize = 25.5;
  const qrX = col3X + (col3W - qrSize) / 2;
  const qrY = y + 9.2;
  drawVectorQrCode(doc, trackingUrl, qrX, qrY, qrSize);

  doc.setTextColor(7, 26, 61);
  doc.setFont('courier', 'bold');
  doc.setFontSize(6.2);
  doc.text('SCAN TO TRACK LIVE', col3X + col3W / 2, y + 39.2, { align: 'center' });
  doc.setTextColor(8, 102, 245);
  doc.setFontSize(6.2);
  doc.text(receipt.orderId, col3X + col3W / 2, y + 43, { align: 'center' });

  // ================= 3. CLEAN GRID-BASED PRODUCT MATRIX =================
  y += metaGridH + 6;

  const totalUnits = receipt.items.reduce((sum, item) => sum + item.quantity, 0);

  doc.setTextColor(7, 26, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.4);
  doc.text('04 · ORDERED HARDWARE & PRODUCT GRID', margin, y);

  doc.setTextColor(71, 85, 105);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.6);
  doc.text(
    `${receipt.items.length} SKU${receipt.items.length === 1 ? '' : 's'}  |  ${totalUnits} UNIT${totalUnits === 1 ? '' : 'S'}`,
    pageWidth - margin,
    y,
    { align: 'right' }
  );

  y += 2.8;

  // Grid Column X Positions across contentWidth (184mm)
  const colIdxW = 9;
  const colImgW = 22;
  const colDescW = 90;
  const colQtyW = 14;
  const colUnitW = 24;
  const colTotalW = contentWidth - colIdxW - colImgW - colDescW - colQtyW - colUnitW; // 25mm

  const xIdx = margin;
  const xImg = xIdx + colIdxW;
  const xDesc = xImg + colImgW;
  const xQty = xDesc + colDescW;
  const xUnit = xQty + colQtyW;
  const xTotal = xUnit + colUnitW;

  const drawGridVerticalLines = (topY: number, height: number) => {
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.28);
    doc.line(xImg, topY, xImg, topY + height);
    doc.line(xDesc, topY, xDesc, topY + height);
    doc.line(xQty, topY, xQty, topY + height);
    doc.line(xUnit, topY, xUnit, topY + height);
    doc.line(xTotal, topY, xTotal, topY + height);
  };

  const drawTableHeader = (startY: number) => {
    const hdrH = 8;
    doc.setFillColor(7, 26, 61);
    doc.rect(margin, startY, contentWidth, hdrH, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.9);
    doc.text('#', xIdx + colIdxW / 2, startY + 5.2, { align: 'center' });
    doc.text('IMAGE', xImg + colImgW / 2, startY + 5.2, { align: 'center' });
    doc.text('PRODUCT DETAILS & SKU', xDesc + 3.2, startY + 5.2);
    doc.text('QTY', xQty + colQtyW / 2, startY + 5.2, { align: 'center' });
    doc.text('UNIT PRICE', xUnit + colUnitW - 2.5, startY + 5.2, { align: 'right' });
    doc.text('TOTAL', pageWidth - margin - 2.5, startY + 5.2, { align: 'right' });
    return startY + hdrH;
  };

  y = drawTableHeader(y);

  for (let idx = 0; idx < receipt.items.length; idx++) {
    const item = receipt.items[idx];
    const thumbDataUrl = itemThumbnails[idx];
    const descMaxW = colDescW - 6.4;

    // Measure title lines with exact title font active
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.6);
    const nameLines = doc.splitTextToSize(item.product.name, descMaxW) as string[];
    const trimmedNameLines = nameLines.slice(0, 2);

    const metaLine = [
      `SKU: ${item.product.sku}`,
      item.variant ? `Variant: ${item.variant}` : null,
      item.product.categoryLabel || null,
    ]
      .filter(Boolean)
      .join(' · ');

    // Measure SKU line with exact font active
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.8);
    const trimmedMetaLine = ((doc.splitTextToSize(metaLine, descMaxW) as string[])[0] || '').trim();

    // Measure short description with exact font active
    let descSnippet = '';
    if (!compactRows && item.product.shortDesc) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.7);
      const descLines = doc.splitTextToSize(item.product.shortDesc.trim(), descMaxW) as string[];
      if (descLines.length > 1) {
        descSnippet = `${descLines[0].slice(0, Math.max(12, descLines[0].length - 3)).trim()}...`;
      } else {
        descSnippet = descLines[0] || '';
      }
    }

    const baseRowH = compactRows ? 19 : 22.5;
    const textBlockH = trimmedNameLines.length * 4.1 + 4.3 + (descSnippet ? 3.8 : 0);
    const rowH = Math.max(baseRowH, textBlockH + 8.5);

    if (y + rowH > pageHeight - 25) {
      doc.addPage();
      doc.setFillColor(7, 26, 61);
      doc.rect(margin, 12, contentWidth, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('ROBOTERA BD — OFFICIAL A4 RECEIPT (CONTINUED)', margin + 4, 18.5);
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.text(`#${receipt.orderId}`, pageWidth - margin - 4, 18.5, { align: 'right' });
      y = drawTableHeader(26);
    }

    // Print-friendly crisp cell fill + outer border
    doc.setFillColor(idx % 2 === 1 ? 248 : 255, idx % 2 === 1 ? 250 : 255, idx % 2 === 1 ? 252 : 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.28);
    doc.rect(margin, y, contentWidth, rowH, 'FD');
    drawGridVerticalLines(y, rowH);

    // Index #
    const midY = y + rowH / 2 + 1;
    doc.setTextColor(100, 116, 139);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.1);
    doc.text(String(idx + 1).padStart(2, '0'), xIdx + colIdxW / 2, midY, { align: 'center' });

    // Product Image Tile inside Grid Cell
    const thumbSize = compactRows ? 14 : 16.5;
    const imgX = xImg + (colImgW - thumbSize) / 2;
    const imgY = y + (rowH - thumbSize) / 2;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.roundedRect(imgX, imgY, thumbSize, thumbSize, 1.5, 1.5, 'FD');
    if (thumbDataUrl) {
      try {
        doc.addImage(
          thumbDataUrl,
          'PNG',
          imgX + 0.5,
          imgY + 0.5,
          thumbSize - 1,
          thumbSize - 1,
          undefined,
          'FAST'
        );
      } catch {
        // Ignore image decoding failure gracefully
      }
    }

    // Vertically balanced Product Name + SKU + Description
    let textY = y + (rowH - textBlockH) / 2 + 3.2;
    doc.setTextColor(7, 26, 61);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.6);
    doc.text(trimmedNameLines, xDesc + 3.2, textY);
    textY += trimmedNameLines.length * 4.1 + 0.4;

    doc.setTextColor(8, 102, 245);
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.8);
    doc.text(trimmedMetaLine, xDesc + 3.2, textY);

    if (descSnippet) {
      textY += 3.8;
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.7);
      doc.text(descSnippet, xDesc + 3.2, textY);
    }

    // Quantity
    doc.setTextColor(7, 26, 61);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.6);
    doc.text(`x${item.quantity}`, xQty + colQtyW / 2, midY, { align: 'center' });

    // Unit Price (crisp slate-700 bold so it reads cleanly next to line total)
    doc.setTextColor(51, 65, 85);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.text(formatBdt(item.product.price), xUnit + colUnitW - 2.5, midY, { align: 'right' });

    // Line Total
    doc.setTextColor(7, 26, 61);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.text(formatBdt(item.product.price * item.quantity), pageWidth - margin - 2.5, midY, {
      align: 'right',
    });

    y += rowH;
  }

  // ================= 4. BOTTOM SUMMARY & VERIFICATION GRID =================
  const promoGiftDiscount = Math.max(0, receipt.discount - (receipt.rewardDiscount ?? 0));
  const summaryLines: Array<{ label: string; value: string; color?: [number, number, number] }> = [
    { label: 'Items Subtotal', value: formatBdt(receipt.subtotal) },
  ];
  if (promoGiftDiscount > 0) {
    summaryLines.push({
      label: `Discount (${receipt.couponCode || 'Promo'})`,
      value: `- ${formatBdt(promoGiftDiscount)}`,
      color: [5, 150, 105],
    });
  }
  if ((receipt.rewardDiscount ?? 0) > 0) {
    summaryLines.push({
      label: `Reward Points (-${receipt.rewardPointsRedeemed ?? 0} pts)`,
      value: `- ${formatBdt(receipt.rewardDiscount ?? 0)}`,
      color: [8, 102, 245],
    });
  }
  summaryLines.push({
    label: `Delivery (${receipt.district})`,
    value: formatBdt(receipt.deliveryFee),
  });

  // Left card warranty/note wrapping (measure with exact font active!)
  const leftGridW = 104;
  const rightGridW = contentWidth - leftGridW - 4; // 76mm
  const rightGridX = margin + leftGridW + 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  const warrantyNote = receipt.notes
    ? `Order Note: ${receipt.notes.slice(0, 95)} · ESD bench-tested with 7-day warranty.`
    : 'All silicon & robotics hardware is ESD bench-tested in Dhaka with 7-day defect replacement.';
  const wrappedNote = (doc.splitTextToSize(warrantyNote, leftGridW - 8) as string[]).slice(0, 2);

  // Clean vertical layout geometry for BOTH cards so heights match symmetrically
  const cardHdrH = 6.4;
  const leftCardMinH = 47 + (wrappedNote.length > 1 ? 2.5 : 0);
  const rightCardMinH = cardHdrH + 5 + summaryLines.length * 6.2 + 5 + 13;
  const summaryH = Math.max(leftCardMinH, rightCardMinH);

  if (y + summaryH + 6 > pageHeight - 19) {
    doc.addPage();
    y = 20;
  } else {
    y += 6;
  }

  // --- Left Grid Box (05): Barcode + Lab QC Seal + Separated Warranty/Tracking Footer ---
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, leftGridW, summaryH, 2, 2, 'F');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, leftGridW, cardHdrH, 2, 2, 'F');
  doc.rect(margin, y + 3.2, leftGridW, cardHdrH - 3.2, 'F');

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, y, leftGridW, summaryH, 2, 2, 'S');
  doc.line(margin, y + cardHdrH, margin + leftGridW, y + cardHdrH);

  doc.setTextColor(7, 26, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('05 · DISPATCH BARCODE & LAB QC VERIFICATION', margin + 3.8, y + 4.3);

  // Upper sub-zone: Barcode on left + Lab QC circular seal on right (strictly above divider)
  drawOrderBarcode(doc, receipt.orderId, margin + 4, y + 9.2, 62, 8.8);

  doc.setTextColor(71, 85, 105);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.text(`WAYBILL ID: ${receipt.orderId}`, margin + 4, y + 22.1);

  const sealX = margin + leftGridW - 14.5;
  const sealY = y + 16.4; // bottom at y + 16.4 + 8 = y + 24.4 (well above y + 26.2 divider!)
  doc.setDrawColor(15, 118, 110);
  doc.setLineWidth(0.45);
  doc.circle(sealX, sealY, 8, 'S');
  doc.setLineWidth(0.2);
  doc.circle(sealX, sealY, 6.4, 'S');
  doc.setTextColor(15, 118, 110);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.8);
  doc.text('VERIFIED', sealX, sealY - 1.3, { align: 'center' });
  doc.text('LAB QC', sealX, sealY + 1.4, { align: 'center' });
  doc.text('DHAKA', sealX, sealY + 3.9, { align: 'center' });

  // Horizontal divider isolating Barcode + Seal from Warranty Note + Live URL
  const leftDividerY = y + 26.4;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.28);
  doc.line(margin + 3.5, leftDividerY, margin + leftGridW - 3.5, leftDividerY);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(wrappedNote, margin + 4, leftDividerY + 4.3);

  doc.setTextColor(8, 102, 245);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.7);
  doc.text(`Live Tracking: ${trackingUrl}`, margin + 4, y + summaryH - 3.8, {
    maxWidth: leftGridW - 8,
  });

  // --- Right Grid Box (06): Matching Header Strip + Accounting Rows + Total Payable Banner ---
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(rightGridX, y, rightGridW, summaryH, 2, 2, 'F');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightGridX, y, rightGridW, cardHdrH, 2, 2, 'F');
  doc.rect(rightGridX, y + 3.2, rightGridW, cardHdrH - 3.2, 'F');

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(rightGridX, y, rightGridW, summaryH, 2, 2, 'S');
  doc.line(rightGridX, y + cardHdrH, rightGridX + rightGridW, y + cardHdrH);

  doc.setTextColor(7, 26, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('06 · PAYMENT SUMMARY', rightGridX + 3.8, y + 4.3);

  doc.setTextColor(100, 116, 139);
  doc.setFont('courier', 'bold');
  doc.setFontSize(6.4);
  doc.text('CURRENCY: BDT', rightGridX + rightGridW - 3.8, y + 4.3, { align: 'right' });

  let sumY = y + cardHdrH + 5.8;
  for (const row of summaryLines) {
    doc.setTextColor(
      row.color ? row.color[0] : 51,
      row.color ? row.color[1] : 65,
      row.color ? row.color[2] : 85
    );
    doc.setFont('helvetica', row.color ? 'bold' : 'normal');
    doc.setFontSize(7.8);
    doc.text(row.label, rightGridX + 3.8, sumY, { maxWidth: rightGridW - 30 });

    doc.setFont('courier', 'bold');
    doc.text(row.value, rightGridX + rightGridW - 3.8, sumY, { align: 'right' });
    sumY += 6.1;
  }

  // Navy Total Payable Banner anchored cleanly at bottom of Totals card (with clean rounded bottom corners)
  const totalBannerH = 12.8;
  const bannerY = y + summaryH - totalBannerH;
  doc.setFillColor(7, 26, 61);
  doc.roundedRect(rightGridX, bannerY, rightGridW, totalBannerH, 2, 2, 'F');
  doc.rect(rightGridX, bannerY, rightGridW, 3.2, 'F');

  doc.setTextColor(186, 230, 253);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.6);
  doc.text('TOTAL PAYABLE', rightGridX + 3.8, bannerY + 7.9);

  doc.setTextColor(255, 255, 255);
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text(formatBdt(receipt.total), rightGridX + rightGridW - 3.8, bannerY + 8.1, {
    align: 'right',
  });

  // ================= 5. A4 PRINT FOOTER ON EVERY PAGE =================
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.28);
    doc.line(margin, pageHeight - 14.5, pageWidth - margin, pageHeight - 14.5);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.9);
    doc.text(
      `Robotera BD · Print-Ready A4 Order Receipt · Issued ${ts.fullDateTime}`,
      margin,
      pageHeight - 9.5
    );
    doc.setFont('courier', 'bold');
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 9.5, {
      align: 'right',
    });
  }

  const blob = doc.output('blob');
  const safeOrderId = receipt.orderId.replace(/[^a-zA-Z0-9_-]/g, '');
  const filename = `RoboteraBD-Receipt-${safeOrderId}.pdf`;
  return { blob, filename };
}

export function triggerPdfDownload(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function openPdfInViewer(blob: Blob, existingUrl?: string | null): void {
  if (typeof document === 'undefined') return;
  const url = existingUrl || URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (!existingUrl) {
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}
