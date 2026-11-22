let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!audioCtx) {
    try {
      audioCtx = new AudioCtx();
    } catch {
      return null;
    }
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

interface ToneOptions {
  type?: OscillatorType;
  freqStart: number;
  freqEnd?: number;
  duration: number;
  delay?: number;
  volume?: number;
}

function scheduleTone({
  type = 'sine',
  freqStart,
  freqEnd,
  duration,
  delay = 0,
  volume = 0.05,
}: ToneOptions): void {
  const ctx = getContext();
  if (!ctx) return;

  try {
    const startTime = ctx.currentTime + delay;
    const stopTime = startTime + duration;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, startTime);
    if (freqEnd !== undefined && freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), stopTime);
    }

    // Smooth micro-envelope prevents digital pop/click artifacts
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + Math.min(0.012, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(stopTime + 0.01);
  } catch {
    // Ignore transient Web Audio errors
  }
}

/** Crisp tactile micro-switch click for tabs, filters, drawers, and navigation */
export function playTapSound(): void {
  scheduleTone({
    type: 'triangle',
    freqStart: 780,
    freqEnd: 460,
    duration: 0.038,
    volume: 0.032,
  });
}

/** Mechanical encoder detent click for quantity steppers & carousel slides */
export function playStepTickSound(up = true): void {
  scheduleTone({
    type: 'sine',
    freqStart: up ? 980 : 720,
    freqEnd: up ? 1140 : 590,
    duration: 0.032,
    volume: 0.028,
  });
}

/** Bright electric dual-tone chime when adding hardware to cart */
export function playAddToCartSound(): void {
  scheduleTone({
    type: 'sine',
    freqStart: 523.25, // C5
    duration: 0.095,
    delay: 0,
    volume: 0.055,
  });
  scheduleTone({
    type: 'triangle',
    freqStart: 783.99, // G5
    freqEnd: 880,
    duration: 0.14,
    delay: 0.055,
    volume: 0.05,
  });
}

/** Soft harmonic pop when saving or removing wishlist items */
export function playWishlistSound(added: boolean): void {
  if (added) {
    scheduleTone({
      type: 'sine',
      freqStart: 659.25, // E5
      freqEnd: 987.77, // B5
      duration: 0.12,
      volume: 0.048,
    });
  } else {
    scheduleTone({
      type: 'sine',
      freqStart: 587.33,
      freqEnd: 440,
      duration: 0.09,
      volume: 0.038,
    });
  }
}

/** Warm ascending lab chord for promo claims, price alerts, and order confirmation */
export function playSuccessSound(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6
  notes.forEach((freq, idx) => {
    scheduleTone({
      type: idx === notes.length - 1 ? 'triangle' : 'sine',
      freqStart: freq,
      duration: idx === notes.length - 1 ? 0.24 : 0.12,
      delay: idx * 0.065,
      volume: idx === notes.length - 1 ? 0.055 : 0.045,
    });
  });
}

/** Gentle low dual-pulse feedback for invalid coupons or form errors */
export function playErrorSound(): void {
  scheduleTone({
    type: 'triangle',
    freqStart: 220,
    freqEnd: 175,
    duration: 0.09,
    delay: 0,
    volume: 0.05,
  });
  scheduleTone({
    type: 'triangle',
    freqStart: 185,
    freqEnd: 145,
    duration: 0.12,
    delay: 0.095,
    volume: 0.045,
  });
}

/** Subtle futuristic calibration chime when dismissing boot loader */
export function playBootChime(): void {
  scheduleTone({
    type: 'sine',
    freqStart: 440,
    duration: 0.11,
    delay: 0,
    volume: 0.04,
  });
  scheduleTone({
    type: 'sine',
    freqStart: 659.25,
    duration: 0.13,
    delay: 0.06,
    volume: 0.042,
  });
  scheduleTone({
    type: 'triangle',
    freqStart: 880,
    duration: 0.2,
    delay: 0.12,
    volume: 0.045,
  });
}
