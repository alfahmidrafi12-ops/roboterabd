import { GiftCardReward, OrderReceipt } from '../types/store';

export const LEGACY_GIFT_CARDS_KEY = 'robotera_bd_gift_cards_v1';
export const STORAGE_GIFT_CARDS_PREFIX = 'robotera_bd_gift_cards_v2_';
export const MIN_GIFT_CARD_SPEND = 500;
export const GIFT_CARD_RATE_PER_100 = 3;

export interface GiftCardCalculation {
  eligible: boolean;
  eligibleSpend: number;
  value: number;
  remainingToUnlock: number;
  tierLabel: string;
}

export function clearLegacyGlobalGiftCards(): void {
  try {
    localStorage.removeItem(LEGACY_GIFT_CARDS_KEY);
  } catch {
    // Ignore storage errors
  }
}

function getScopedStorageKey(userId?: string | null): string | null {
  const cleanUid = userId?.trim();
  if (!cleanUid) return null;
  return `${STORAGE_GIFT_CARDS_PREFIX}${cleanUid}`;
}

export function calculateGiftCardDiscount(eligibleSpend: number): GiftCardCalculation {
  const safeSpend = Math.max(0, Math.round(Number.isFinite(eligibleSpend) ? eligibleSpend : 0));
  if (safeSpend < MIN_GIFT_CARD_SPEND) {
    return {
      eligible: false,
      eligibleSpend: safeSpend,
      value: 0,
      remainingToUnlock: MIN_GIFT_CARD_SPEND - safeSpend,
      tierLabel: 'Minimum ৳500 Order Required',
    };
  }

  const value = Math.floor((safeSpend * GIFT_CARD_RATE_PER_100) / 100);
  const tierLabel =
    safeSpend >= 5000
      ? 'Pro Lab 3% Gift Credit'
      : safeSpend >= 2000
      ? 'Builder 3% Gift Credit'
      : 'Maker 3% Gift Credit';

  return {
    eligible: value > 0,
    eligibleSpend: safeSpend,
    value,
    remainingToUnlock: 0,
    tierLabel,
  };
}

function randomBlock(len = 4): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function generateGiftCardReward(
  receipt: OrderReceipt,
  userId?: string | null
): GiftCardReward | null {
  const cleanUid = userId?.trim();
  if (!cleanUid) {
    return null;
  }
  const eligibleSpend = Math.max(0, receipt.subtotal - receipt.discount);
  const calc = calculateGiftCardDiscount(eligibleSpend);
  if (!calc.eligible || calc.value <= 0) {
    return null;
  }
  const code = `RBDG-${randomBlock(4)}-${randomBlock(4)}`;
  return {
    code,
    userId: cleanUid,
    value: calc.value,
    orderId: receipt.orderId,
    recipientName: receipt.customerName,
    issuedAt: receipt.createdAt || new Date().toLocaleDateString('en-BD'),
    tierLabel: calc.tierLabel,
    redeemed: false,
  };
}

export function loadGiftCards(userId?: string | null): GiftCardReward[] {
  clearLegacyGlobalGiftCards();
  const key = getScopedStorageKey(userId);
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GiftCardReward[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c) =>
        typeof c?.code === 'string' &&
        typeof c?.value === 'number' &&
        c.value > 0 &&
        c.userId === userId
    );
  } catch {
    return [];
  }
}

export function saveGiftCard(
  card: GiftCardReward,
  userId?: string | null
): GiftCardReward[] {
  const ownerUid = userId || card.userId;
  const key = getScopedStorageKey(ownerUid);
  if (!key || !ownerUid) return [];
  const normalizedCard: GiftCardReward = { ...card, userId: ownerUid };
  const current = loadGiftCards(ownerUid);
  const next = [normalizedCard, ...current.filter((c) => c.code !== card.code)].slice(0, 30);
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function markGiftCardRedeemed(
  code: string,
  orderId: string,
  userId?: string | null
): GiftCardReward[] {
  const key = getScopedStorageKey(userId);
  if (!key || !userId) return [];
  const cleanCode = code.trim().toUpperCase();
  const current = loadGiftCards(userId);
  const next = current.map((c) =>
    c.code.toUpperCase() === cleanCode
      ? {
          ...c,
          redeemed: true,
          redeemedOrderId: orderId,
          redeemedAt: new Date().toLocaleString('en-BD', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        }
      : c
  );
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
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

export function downloadGiftCardPng(card: GiftCardReward): void {
  if (typeof document === 'undefined') return;
  const width = 1000;
  const height = 580;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Obsidian-to-Sapphire Hardware Pass Chassis
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#030814');
  bg.addColorStop(0.52, '#061A3E');
  bg.addColorStop(1, '#0B306E');
  ctx.fillStyle = bg;
  drawRoundedRect(ctx, 0, 0, width, height, 36);
  ctx.fill();

  // Prismatic Holographic Ambient Flares
  const glow1 = ctx.createRadialGradient(840, 100, 20, 840, 100, 410);
  glow1.addColorStop(0, 'rgba(0, 207, 255, 0.34)');
  glow1.addColorStop(0.5, 'rgba(8, 123, 255, 0.16)');
  glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, width, height);

  const glow2 = ctx.createRadialGradient(160, 500, 10, 160, 500, 340);
  glow2.addColorStop(0, 'rgba(45, 212, 191, 0.25)');
  glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  // Subtle Engineering Grid Lines
  ctx.strokeStyle = 'rgba(148, 197, 255, 0.07)';
  ctx.lineWidth = 1;
  for (let gx = 40; gx < width; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
    ctx.stroke();
  }
  for (let gy = 40; gy < height; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
    ctx.stroke();
  }

  // PCB Traces & Solder Vias
  ctx.strokeStyle = 'rgba(0, 207, 255, 0.38)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(width, 152);
  ctx.lineTo(800, 152);
  ctx.lineTo(756, 196);
  ctx.lineTo(618, 196);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(45, 212, 191, 0.34)';
  ctx.beginPath();
  ctx.moveTo(width, 186);
  ctx.lineTo(830, 186);
  ctx.lineTo(786, 230);
  ctx.lineTo(682, 230);
  ctx.stroke();

  ctx.fillStyle = '#00CFFF';
  ctx.beginPath();
  ctx.arc(618, 196, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2DD4BF';
  ctx.beginPath();
  ctx.arc(682, 230, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Inner Metallic Prismatic Rim
  const rimGrad = ctx.createLinearGradient(20, 20, width - 20, height - 20);
  rimGrad.addColorStop(0, 'rgba(0, 207, 255, 0.6)');
  rimGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.28)');
  rimGrad.addColorStop(1, 'rgba(45, 212, 191, 0.6)');
  ctx.strokeStyle = rimGrad;
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 20, 20, width - 40, height - 40, 26);
  ctx.stroke();

  // Corner Precision Crosshairs
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
  ctx.lineWidth = 2;
  const ticks = [
    [40, 56, 40, 40, 56, 40],
    [width - 40, 56, width - 40, 40, width - 56, 40],
    [40, height - 56, 40, height - 40, 56, height - 40],
    [width - 40, height - 56, width - 40, height - 40, width - 56, height - 40],
  ];
  for (const [x1, y1, x2, y2, x3, y3] of ticks) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
  }

  // Top Brand Emblem
  ctx.fillStyle = 'rgba(8, 123, 255, 0.28)';
  drawRoundedRect(ctx, 64, 58, 56, 56, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 207, 255, 0.65)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 64, 58, 56, 56, 14);
  ctx.stroke();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.6;
  drawRoundedRect(ctx, 80, 74, 24, 24, 5);
  ctx.stroke();
  ctx.fillStyle = '#00CFFF';
  ctx.beginPath();
  ctx.arc(92, 86, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 30px system-ui, -apple-system, sans-serif';
  ctx.fillText('ROBOTERA BD', 138, 90);
  ctx.fillStyle = '#00CFFF';
  ctx.font = '700 14px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText('OFFICIAL DIGITAL HARDWARE PASS', 138, 114);

  // Value Bezel Top-Right
  ctx.fillStyle = 'rgba(0, 207, 255, 0.16)';
  drawRoundedRect(ctx, 720, 56, 216, 92, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 207, 255, 0.58)';
  ctx.lineWidth = 1.8;
  drawRoundedRect(ctx, 720, 56, 216, 92, 18);
  ctx.stroke();

  ctx.fillStyle = '#BAE6FD';
  ctx.font = '700 13px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText('৳3 / ৳100 HARDWARE PASS', 738, 84);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 42px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(`BDT ${card.value}`, 738, 130);

  // Brushed-Gold EMV Silicon Chip + Contactless RF Waves
  const chipGrad = ctx.createLinearGradient(64, 178, 152, 242);
  chipGrad.addColorStop(0, '#FDE68A');
  chipGrad.addColorStop(0.5, '#F59E0B');
  chipGrad.addColorStop(1, '#B45309');
  ctx.fillStyle = chipGrad;
  drawRoundedRect(ctx, 64, 178, 86, 60, 12);
  ctx.fill();
  ctx.strokeStyle = '#FEF3C7';
  ctx.lineWidth = 1.6;
  drawRoundedRect(ctx, 64, 178, 86, 60, 12);
  ctx.stroke();

  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 1.8;
  drawRoundedRect(ctx, 88, 192, 38, 32, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(64, 200);
  ctx.lineTo(88, 200);
  ctx.moveTo(64, 216);
  ctx.lineTo(88, 216);
  ctx.moveTo(126, 200);
  ctx.lineTo(150, 200);
  ctx.moveTo(126, 216);
  ctx.lineTo(150, 216);
  ctx.moveTo(107, 178);
  ctx.lineTo(107, 192);
  ctx.moveTo(107, 224);
  ctx.lineTo(107, 238);
  ctx.stroke();

  // RF Contactless Arcs next to EMV Chip
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.78)';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  for (let r = 10; r <= 24; r += 7) {
    ctx.beginPath();
    ctx.arc(170, 208, r, -0.55, 0.55);
    ctx.stroke();
  }

  // Tier & Cardholder Block
  ctx.fillStyle = '#2DD4BF';
  ctx.font = '700 15px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(card.tierLabel.toUpperCase(), 218, 198);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 38px system-ui, -apple-system, sans-serif';
  ctx.fillText(card.recipientName.slice(0, 24), 218, 244);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '500 18px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    `Source Order #${card.orderId}  ·  Redeemable at Robotera BD Cart Checkout`,
    64,
    298
  );

  // Recessed Laser-Engraved Serial Plate
  ctx.fillStyle = 'rgba(2, 8, 20, 0.78)';
  drawRoundedRect(ctx, 64, 344, width - 128, 118, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 207, 255, 0.35)';
  ctx.lineWidth = 1.6;
  drawRoundedRect(ctx, 64, 344, width - 128, 118, 20);
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 14px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText('LASER-VERIFIED SERIAL KEY', 96, 384);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 44px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(card.code, 96, 438);

  ctx.fillStyle = card.redeemed ? '#94A3B8' : '#2DD4BF';
  ctx.font = '700 18px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(card.redeemed ? 'REDEEMED' : 'ACTIVE · VALID ONCE', 688, 424);

  // Footer Bar
  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 16px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(`Issued: ${card.issuedAt}`, 64, 522);
  ctx.fillText('roboterabd · Dhaka Robotics & Embedded Supply', 494, 522);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `robotera-bd-gift-card-${card.code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }, 'image/png');
}
