import { GiftCardReward, OrderReceipt } from '../types/store';

export const STORAGE_GIFT_CARDS_KEY = 'robotera_bd_gift_cards_v1';

function computeRewardAmount(subtotal: number): { value: number; tierLabel: string } {
  if (subtotal >= 10000) {
    return { value: 350, tierLabel: 'Pro Lab Tier Reward' };
  }
  if (subtotal >= 5000) {
    return { value: 200, tierLabel: 'Maker Gold Reward' };
  }
  if (subtotal >= 2000) {
    return { value: 120, tierLabel: 'Builder Silver Reward' };
  }
  return { value: 75, tierLabel: 'Welcome Hardware Credit' };
}

function randomBlock(len = 4): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function generateGiftCardReward(receipt: OrderReceipt): GiftCardReward {
  const { value, tierLabel } = computeRewardAmount(receipt.subtotal);
  const code = `RBDG-${randomBlock(4)}-${randomBlock(4)}`;
  return {
    code,
    value,
    orderId: receipt.orderId,
    recipientName: receipt.customerName,
    issuedAt: receipt.createdAt || new Date().toLocaleDateString('en-BD'),
    tierLabel,
    redeemed: false,
  };
}

export function loadGiftCards(): GiftCardReward[] {
  try {
    const raw = localStorage.getItem(STORAGE_GIFT_CARDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GiftCardReward[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c) =>
        typeof c?.code === 'string' &&
        typeof c?.value === 'number' &&
        c.value > 0
    );
  } catch {
    return [];
  }
}

export function saveGiftCard(card: GiftCardReward): GiftCardReward[] {
  const current = loadGiftCards();
  const next = [card, ...current.filter((c) => c.code !== card.code)].slice(0, 20);
  try {
    localStorage.setItem(STORAGE_GIFT_CARDS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function markGiftCardRedeemed(code: string, orderId: string): GiftCardReward[] {
  const cleanCode = code.trim().toUpperCase();
  const current = loadGiftCards();
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
    localStorage.setItem(STORAGE_GIFT_CARDS_KEY, JSON.stringify(next));
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

  // Background navy holographic gradient
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#040B1A');
  bg.addColorStop(0.5, '#071E47');
  bg.addColorStop(1, '#0A2E66');
  ctx.fillStyle = bg;
  drawRoundedRect(ctx, 0, 0, width, height, 34);
  ctx.fill();

  // Holographic cyan & cobalt glows
  const glow1 = ctx.createRadialGradient(840, 110, 20, 840, 110, 380);
  glow1.addColorStop(0, 'rgba(0, 207, 255, 0.28)');
  glow1.addColorStop(0.55, 'rgba(8, 123, 255, 0.14)');
  glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, width, height);

  const glow2 = ctx.createRadialGradient(180, 500, 10, 180, 500, 320);
  glow2.addColorStop(0, 'rgba(45, 212, 191, 0.22)');
  glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  // Blueprint grid lines
  ctx.strokeStyle = 'rgba(148, 197, 255, 0.08)';
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

  // Subtle circuit trace artwork on top-right
  ctx.strokeStyle = 'rgba(0, 207, 255, 0.35)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(width, 96);
  ctx.lineTo(790, 96);
  ctx.lineTo(750, 136);
  ctx.lineTo(620, 136);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(45, 212, 191, 0.32)';
  ctx.beginPath();
  ctx.moveTo(width, 136);
  ctx.lineTo(820, 136);
  ctx.lineTo(780, 176);
  ctx.lineTo(690, 176);
  ctx.stroke();

  ctx.fillStyle = '#00CFFF';
  ctx.beginPath();
  ctx.arc(620, 136, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2DD4BF';
  ctx.beginPath();
  ctx.arc(690, 176, 5, 0, Math.PI * 2);
  ctx.fill();

  // Inner metallic border
  ctx.strokeStyle = 'rgba(0, 207, 255, 0.42)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 20, 20, width - 40, height - 40, 24);
  ctx.stroke();

  // Top Header Lockup
  ctx.fillStyle = '#087BFF';
  drawRoundedRect(ctx, 64, 58, 52, 52, 12);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 78, 72, 24, 24, 5);
  ctx.stroke();
  ctx.fillStyle = '#00CFFF';
  ctx.beginPath();
  ctx.arc(90, 84, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 30px system-ui, -apple-system, sans-serif';
  ctx.fillText('ROBOTERA BD', 134, 91);
  ctx.fillStyle = '#00CFFF';
  ctx.font = '700 15px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText('OFFICIAL DIGITAL HARDWARE GIFT CARD', 134, 114);

  // Value Pill Top-Right
  ctx.fillStyle = 'rgba(0, 207, 255, 0.16)';
  drawRoundedRect(ctx, 730, 58, 206, 86, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 207, 255, 0.5)';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, 730, 58, 206, 86, 16);
  ctx.stroke();

  ctx.fillStyle = '#BAE6FD';
  ctx.font = '700 13px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText('GIFT CREDIT', 754, 86);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 40px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(`BDT ${card.value}`, 754, 128);

  // Center Title & Recipient
  ctx.fillStyle = '#2DD4BF';
  ctx.font = '700 15px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(card.tierLabel.toUpperCase(), 64, 214);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 42px system-ui, -apple-system, sans-serif';
  ctx.fillText(`For ${card.recipientName.slice(0, 26)}`, 64, 266);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '500 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    `Issued with Order #${card.orderId} · Redeemable at Robotera BD Cart Checkout`,
    64,
    308
  );

  // Voucher Code Plate
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  drawRoundedRect(ctx, 64, 360, width - 128, 108, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, 64, 360, width - 128, 108, 18);
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 14px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText('GIFT CARD SERIAL CODE', 96, 396);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 42px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(card.code, 96, 444);

  ctx.fillStyle = '#2DD4BF';
  ctx.font = '700 18px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(card.redeemed ? 'REDEEMED' : 'ACTIVE · VALID ONCE', 688, 434);

  // Footer
  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Issued: ${card.issuedAt}`, 64, 526);
  ctx.fillText('roboterabd · Dhaka Robotics & Embedded Supply', 538, 526);

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
