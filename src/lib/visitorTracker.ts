import { recordVisitorLog } from './firebase';
import {
  VisitorDeviceType,
  VisitorLocationAccuracy,
  VisitorPlatform,
} from '../types/store';

const SESSION_ID_KEY = 'robotera_bd_visitor_sid_v1';
const LAST_LOG_META_KEY = 'robotera_bd_visit_logged_v3';
const GPS_PROMPTED_KEY = 'robotera_bd_gps_prompted_v1';
const SESSION_LOG_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes per tab session

interface GeoIpResult {
  ip: string;
  ipType?: string;
  city?: string;
  region?: string;
  country: string;
  countryCode?: string;
  postal?: string;
  isp?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

interface SignedInVisitorUser {
  uid?: string | null;
  email?: string | null;
  displayName?: string | null;
}

interface LoggedSessionMeta {
  timestamp: number;
  uid: string | null;
  hasGps?: boolean;
}

export interface TrackVisitorOptions {
  force?: boolean;
  requestGps?: boolean;
}

export interface TrackVisitorResult {
  recorded: boolean;
  ip?: string;
  area?: string;
  operatorArea?: string;
  country?: string;
  accuracy?: VisitorLocationAccuracy;
  gpsAccuracyMeters?: number;
  gpsReason?: string;
  blockedByPolicy?: boolean;
  isEmbeddedIframe?: boolean;
}

let inFlightVisitPromise: Promise<TrackVisitorResult> | null = null;
let lastInMemoryLogMeta: LoggedSessionMeta | null = null;
let hasPromptedGpsInMemory = false;
let permissionListenerAttached = false;

function hasPromptedGpsThisSession(): boolean {
  if (hasPromptedGpsInMemory) return true;
  try {
    return sessionStorage.getItem(GPS_PROMPTED_KEY) === '1';
  } catch {
    return false;
  }
}

function markGpsPromptedThisSession(): void {
  hasPromptedGpsInMemory = true;
  try {
    sessionStorage.setItem(GPS_PROMPTED_KEY, '1');
  } catch {
    // Ignore storage issues
  }
}

function getCountryFullName(countryCode?: string): string | undefined {
  if (!countryCode || countryCode.length !== 2) return undefined;
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'region' });
    return dn.of(countryCode.toUpperCase()) || undefined;
  } catch {
    return undefined;
  }
}

function getOrCreateVisitorSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing && /^[a-zA-Z0-9_-]{4,64}$/.test(existing)) {
      return existing;
    }
    const created = `sid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_ID_KEY, created);
    return created;
  } catch {
    return `sid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }
}

function readLoggedSessionMeta(): LoggedSessionMeta | null {
  if (lastInMemoryLogMeta) return lastInMemoryLogMeta;
  try {
    const raw = sessionStorage.getItem(LAST_LOG_META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LoggedSessionMeta;
    if (parsed && typeof parsed.timestamp === 'number') {
      lastInMemoryLogMeta = parsed;
      return parsed;
    }
  } catch {
    // Ignore storage read issues
  }
  return null;
}

function writeLoggedSessionMeta(meta: LoggedSessionMeta): void {
  lastInMemoryLogMeta = meta;
  try {
    sessionStorage.setItem(LAST_LOG_META_KEY, JSON.stringify(meta));
  } catch {
    // Ignore private browsing storage restrictions
  }
}

function detectPlatform(): VisitorPlatform {
  if (typeof window === 'undefined') return 'Web';
  const nav = navigator as Navigator & { standalone?: boolean };
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.matchMedia?.('(display-mode: minimal-ui)')?.matches ||
    nav.standalone === true ||
    document.referrer.startsWith('android-app://');
  return isStandalone ? 'PWA App' : 'Web';
}

function detectDeviceType(ua: string): VisitorDeviceType {
  if (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(ua)) {
    return 'Tablet';
  }
  if (/(mobi|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|iemobile)/i.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
}

function detectBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Microsoft Edge';
  if (/OPR\/|Opera/i.test(ua)) return 'Opera';
  if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet';
  if (/UCBrowser/i.test(ua)) return 'UC Browser';
  if (/Firefox\/|FxiOS/i.test(ua)) return 'Firefox';
  if (/CriOS|Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome';
  if (/Safari\//i.test(ua) && !/Chrome|CriOS/i.test(ua)) return 'Safari';
  return 'Web Browser';
}

function detectOS(ua: string): string {
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Windows NT/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/CrOS/i.test(ua)) return 'ChromeOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown OS';
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 4000): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

async function fetchTextWithTimeout(url: string, timeoutMs = 3500): Promise<string> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.text();
  } finally {
    window.clearTimeout(timer);
  }
}

function isIpv4(ip?: string): ip is string {
  return Boolean(ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip.trim()));
}

async function resolvePublicIpv4AndBase(): Promise<{
  ipv4?: string;
  ipinfoGeo?: Partial<GeoIpResult>;
  fallbackIp?: string;
  fallbackCountryCode?: string;
}> {
  const [ipifyRes, ipinfoRes, cfTraceRes] = await Promise.allSettled([
    fetchJsonWithTimeout<{ ip?: string }>('https://api.ipify.org?format=json', 3500),
    fetchJsonWithTimeout<{
      ip?: string;
      city?: string;
      region?: string;
      country?: string;
      loc?: string;
      org?: string;
      postal?: string;
      timezone?: string;
    }>('https://ipinfo.io/json', 3500),
    fetchTextWithTimeout('https://www.cloudflare.com/cdn-cgi/trace', 3000),
  ]);

  let ipv4: string | undefined;
  let fallbackIp: string | undefined;
  let fallbackCountryCode: string | undefined;
  let ipinfoGeo: Partial<GeoIpResult> | undefined;

  if (ipifyRes.status === 'fulfilled' && ipifyRes.value?.ip) {
    const rawIpify = ipifyRes.value.ip.trim();
    if (isIpv4(rawIpify)) {
      ipv4 = rawIpify;
    } else if (rawIpify) {
      fallbackIp = rawIpify;
    }
  }

  if (ipinfoRes.status === 'fulfilled' && ipinfoRes.value?.ip) {
    const d = ipinfoRes.value;
    const rawInfoIp = d.ip ? d.ip.trim() : '';
    if (rawInfoIp) {
      if (!ipv4 && isIpv4(rawInfoIp)) {
        ipv4 = rawInfoIp;
      } else if (!fallbackIp) {
        fallbackIp = rawInfoIp;
      }
      const [latStr, lonStr] = (d.loc || '').split(',');
      const lat = Number(latStr);
      const lon = Number(lonStr);
      const countryCode = d.country?.trim() || undefined;
      ipinfoGeo = {
        ip: rawInfoIp,
        ipType: isIpv4(rawInfoIp) ? 'IPv4' : 'IPv6',
        city: d.city?.trim() || undefined,
        region: d.region?.trim() || undefined,
        countryCode,
        country: getCountryFullName(countryCode) || countryCode || 'Unknown',
        postal: d.postal?.trim() || undefined,
        isp: d.org ? d.org.replace(/^AS\d+\s+/i, '').trim() : undefined,
        latitude: Number.isFinite(lat) ? lat : undefined,
        longitude: Number.isFinite(lon) ? lon : undefined,
        timezone: d.timezone?.trim() || undefined,
      };
    }
  }

  if (cfTraceRes.status === 'fulfilled' && cfTraceRes.value) {
    const lines = cfTraceRes.value.split('\n');
    for (const line of lines) {
      const [k, v] = line.split('=');
      if (k === 'ip' && v) {
        const clean = v.trim();
        if (!ipv4 && isIpv4(clean)) ipv4 = clean;
        else if (!fallbackIp) fallbackIp = clean;
      } else if (k === 'loc' && v && !fallbackCountryCode) {
        fallbackCountryCode = v.trim();
      }
    }
  }

  return { ipv4, ipinfoGeo, fallbackIp, fallbackCountryCode };
}

async function resolveGeoIp(): Promise<GeoIpResult> {
  // Step 1: Always resolve real public IPv4 first (avoids dual-stack IPv6 tunnel mislocations)
  const base = await resolvePublicIpv4AndBase();
  const targetIp = base.ipv4 || base.fallbackIp;
  const ipSuffix = targetIp ? encodeURIComponent(targetIp) : '';

  // Step 2: Query reliable CORS-enabled Geo-IP APIs specifically for that verified IP
  const [ipwhoRes, freeApiRes, geoJsRes] = await Promise.allSettled([
    fetchJsonWithTimeout<{
      success?: boolean;
      ip?: string;
      type?: string;
      country?: string;
      country_code?: string;
      region?: string;
      city?: string;
      postal?: string;
      latitude?: number;
      longitude?: number;
      connection?: { isp?: string; org?: string };
      timezone?: { id?: string };
    }>(`https://ipwho.is/${ipSuffix}`, 4000),
    fetchJsonWithTimeout<{
      ipAddress?: string;
      ipVersion?: number;
      countryName?: string;
      countryCode?: string;
      regionName?: string;
      cityName?: string;
      zipCode?: string;
      latitude?: number;
      longitude?: number;
      asnOrganization?: string;
      timeZones?: string[];
    }>(
      targetIp
        ? `https://free.freeipapi.com/api/v1/json/${ipSuffix}`
        : 'https://free.freeipapi.com/api/v1/json',
      4000
    ),
    fetchJsonWithTimeout<{
      ip?: string;
      country?: string;
      country_code?: string;
      region?: string;
      city?: string;
      organization_name?: string;
      latitude?: string | number;
      longitude?: string | number;
      timezone?: string;
    }>(
      targetIp
        ? `https://get.geojs.io/v1/ip/geo/${ipSuffix}.json`
        : 'https://get.geojs.io/v1/ip/geo.json',
      4000
    ),
  ]);

  const merged: GeoIpResult = {
    ip: targetIp || 'Unavailable',
    ipType: targetIp ? (isIpv4(targetIp) ? 'IPv4' : 'IPv6') : undefined,
    country:
      base.ipinfoGeo?.country ||
      getCountryFullName(base.fallbackCountryCode) ||
      'Unknown',
    countryCode: base.ipinfoGeo?.countryCode || base.fallbackCountryCode,
    city: base.ipinfoGeo?.city,
    region: base.ipinfoGeo?.region,
    postal: base.ipinfoGeo?.postal,
    isp: base.ipinfoGeo?.isp,
    latitude: base.ipinfoGeo?.latitude,
    longitude: base.ipinfoGeo?.longitude,
    timezone: base.ipinfoGeo?.timezone,
  };

  if (ipwhoRes.status === 'fulfilled' && ipwhoRes.value && ipwhoRes.value.success !== false) {
    const w = ipwhoRes.value;
    if (merged.ip === 'Unavailable' && w.ip) {
      merged.ip = w.ip;
      merged.ipType = w.type || (isIpv4(w.ip) ? 'IPv4' : 'IPv6');
    }
    if (w.country) merged.country = w.country;
    if (w.country_code) merged.countryCode = w.country_code;
    if (w.region) merged.region = w.region;
    if (w.city) merged.city = w.city;
    if (w.postal) merged.postal = w.postal;
    if (w.connection?.isp || w.connection?.org) {
      merged.isp = w.connection.isp || w.connection.org;
    }
    if (typeof w.latitude === 'number' && typeof w.longitude === 'number') {
      merged.latitude = w.latitude;
      merged.longitude = w.longitude;
    }
    if (w.timezone?.id) merged.timezone = w.timezone.id;
  }

  if (freeApiRes.status === 'fulfilled' && freeApiRes.value?.ipAddress) {
    const f = freeApiRes.value;
    const fIp = f.ipAddress;
    if (merged.ip === 'Unavailable' && fIp) {
      merged.ip = fIp;
      merged.ipType = f.ipVersion === 6 || !isIpv4(fIp) ? 'IPv6' : 'IPv4';
    }
    if (merged.country === 'Unknown' && f.countryName && f.countryName !== '-') {
      merged.country = f.countryName;
    }
    if (!merged.countryCode && f.countryCode && f.countryCode !== '-') {
      merged.countryCode = f.countryCode;
    }
    // freeipapi frequently preserves local thana/zone like "Dhaka (Tejgaon)"
    if (f.cityName && f.cityName !== '-') {
      if (!merged.city || f.cityName.length > merged.city.length) {
        merged.city = f.cityName;
      }
    }
    if (!merged.region && f.regionName && f.regionName !== '-') merged.region = f.regionName;
    if (!merged.postal && f.zipCode && f.zipCode !== '-') merged.postal = f.zipCode;
    if (!merged.isp && f.asnOrganization) merged.isp = f.asnOrganization;
    if (
      (merged.latitude === undefined || merged.longitude === undefined) &&
      typeof f.latitude === 'number' &&
      typeof f.longitude === 'number'
    ) {
      merged.latitude = f.latitude;
      merged.longitude = f.longitude;
    }
    if (!merged.timezone && f.timeZones?.[0]) merged.timezone = f.timeZones[0];
  }

  if (geoJsRes.status === 'fulfilled' && geoJsRes.value?.ip) {
    const g = geoJsRes.value;
    const gIp = g.ip;
    if (merged.ip === 'Unavailable' && gIp) {
      merged.ip = gIp;
      merged.ipType = isIpv4(gIp) ? 'IPv4' : 'IPv6';
    }
    if (merged.country === 'Unknown' && g.country) merged.country = g.country;
    if (!merged.countryCode && g.country_code) merged.countryCode = g.country_code;
    if (!merged.city && g.city) merged.city = g.city;
    if (!merged.region && g.region) merged.region = g.region;
    if (!merged.isp && g.organization_name) merged.isp = g.organization_name;
    const gLat = Number(g.latitude);
    const gLon = Number(g.longitude);
    if (
      (merged.latitude === undefined || merged.longitude === undefined) &&
      Number.isFinite(gLat) &&
      Number.isFinite(gLon)
    ) {
      merged.latitude = gLat;
      merged.longitude = gLon;
    }
    if (!merged.timezone && g.timezone) merged.timezone = g.timezone;
  }

  // Last fallback: ipapi.co only if everything else failed to get an IP
  if (merged.ip === 'Unavailable') {
    try {
      const a = await fetchJsonWithTimeout<{
        ip?: string;
        version?: string;
        country_name?: string;
        country_code?: string;
        region?: string;
        city?: string;
        postal?: string;
        org?: string;
        latitude?: number;
        longitude?: number;
        timezone?: string;
      }>('https://ipapi.co/json/', 3000);
      if (a?.ip) {
        merged.ip = a.ip;
        merged.ipType = a.version || (isIpv4(a.ip) ? 'IPv4' : 'IPv6');
        merged.country = a.country_name || merged.country;
        merged.countryCode = a.country_code || merged.countryCode;
        merged.region = a.region || merged.region;
        merged.city = a.city || merged.city;
        merged.postal = a.postal || merged.postal;
        merged.isp = a.org || merged.isp;
        if (typeof a.latitude === 'number' && typeof a.longitude === 'number') {
          merged.latitude = a.latitude;
          merged.longitude = a.longitude;
        }
        merged.timezone = a.timezone || merged.timezone;
      }
    } catch {
      // Rate-limited or blocked
    }
  }

  return merged;
}

function buildOperatorArea(geo: GeoIpResult): string {
  const parts = [
    geo.city,
    geo.region && geo.region !== geo.city ? geo.region : undefined,
  ].filter(Boolean) as string[];
  const base = parts.join(', ');
  if (base && geo.postal) {
    return `${base} (${geo.postal})`;
  }
  if (base) return base;
  if (geo.postal) return `Postal ${geo.postal}`;
  if (geo.country && geo.country !== 'Unknown') return geo.country;
  return 'Unknown Area';
}

const GPS_GESTURE_PROMPTED_KEY = 'robotera_bd_gps_gesture_v1';

export type BrowserGpsState = PermissionState | 'unsupported' | 'unknown';

export interface BrowserGpsSnapshot {
  state: BrowserGpsState;
  isEmbeddedIframe: boolean;
  blockedByPolicy: boolean;
  lastError?: string;
  area?: string;
  accuracyMeters?: number;
}

const GPS_STATUS_EVENT = 'robotera:gps-status';

let lastGpsSnapshot: BrowserGpsSnapshot = {
  state: 'unknown',
  isEmbeddedIframe:
    typeof window !== 'undefined' ? window.self !== window.top : false,
  blockedByPolicy: false,
};

let gesturePromptedInMemory = false;
let gestureListenerAttached = false;

function hasGesturePromptedThisSession(): boolean {
  if (gesturePromptedInMemory) return true;
  try {
    return sessionStorage.getItem(GPS_GESTURE_PROMPTED_KEY) === '1';
  } catch {
    return false;
  }
}

function markGesturePromptedThisSession(): void {
  gesturePromptedInMemory = true;
  try {
    sessionStorage.setItem(GPS_GESTURE_PROMPTED_KEY, '1');
  } catch {
    // Ignore storage restrictions
  }
}

function publishGpsSnapshot(patch: Partial<BrowserGpsSnapshot>): void {
  lastGpsSnapshot = {
    ...lastGpsSnapshot,
    ...patch,
    isEmbeddedIframe:
      typeof window !== 'undefined' ? window.self !== window.top : false,
  };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<BrowserGpsSnapshot>(GPS_STATUS_EVENT, {
        detail: lastGpsSnapshot,
      })
    );
  }
}

export function getBrowserGpsSnapshot(): BrowserGpsSnapshot {
  return lastGpsSnapshot;
}

export async function refreshBrowserGpsSnapshot(): Promise<BrowserGpsSnapshot> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    publishGpsSnapshot({ state: 'unsupported', blockedByPolicy: false });
    return lastGpsSnapshot;
  }
  const perm = await queryGpsPermissionState();
  publishGpsSnapshot({
    state: perm,
    ...(perm === 'granted' ? { blockedByPolicy: false, lastError: undefined } : {}),
  });
  return lastGpsSnapshot;
}

export function subscribeBrowserGpsSnapshot(
  onChange: (snapshot: BrowserGpsSnapshot) => void
): () => void {
  onChange(lastGpsSnapshot);
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<BrowserGpsSnapshot>;
    if (custom.detail) onChange(custom.detail);
  };
  window.addEventListener(GPS_STATUS_EVENT, handler);
  refreshBrowserGpsSnapshot().catch(() => {});
  return () => {
    window.removeEventListener(GPS_STATUS_EVENT, handler);
  };
}

function isPermissionsPolicyMessage(msg?: string): boolean {
  if (!msg) return false;
  return /permissions policy|feature policy|disabled in this document/i.test(msg);
}

/**
 * Invokes navigator.geolocation.getCurrentPosition SYNCHRONOUSLY on the caller's stack frame
 * (zero awaits beforehand) so Safari, Chrome, iOS, and Android preserve the user-gesture token
 * and immediately show the native browser location permission prompt.
 */
function requestGpsSynchronously(timeoutMs = 12000): Promise<{
  coords: { lat: number; lon: number; accuracyMeters?: number } | null;
  permState: PermissionState | 'unknown';
  blockedByPolicy?: boolean;
  reason?: string;
}> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    publishGpsSnapshot({
      state: 'unsupported',
      blockedByPolicy: false,
      lastError: 'Geolocation API not supported',
    });
    return Promise.resolve({
      coords: null,
      permState: 'denied',
      reason: 'Geolocation API not supported',
    });
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (outcome: {
      coords: { lat: number; lon: number; accuracyMeters?: number } | null;
      permState: PermissionState | 'unknown';
      blockedByPolicy?: boolean;
      reason?: string;
    }) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(outcome);
    };

    const timer = window.setTimeout(() => {
      finish({
        coords: null,
        permState: 'unknown',
        reason: 'GPS lookup timed out',
      });
    }, timeoutMs);

    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const accuracyMeters =
            typeof pos.coords.accuracy === 'number' &&
            Number.isFinite(pos.coords.accuracy)
              ? Math.round(pos.coords.accuracy)
              : undefined;
          publishGpsSnapshot({
            state: 'granted',
            blockedByPolicy: false,
            lastError: undefined,
            accuracyMeters,
          });
          finish({
            permState: 'granted',
            coords: {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              accuracyMeters,
            },
          });
        },
        (err) => {
          const msg = err?.message || 'GPS access denied or unavailable';
          const policyBlocked = isPermissionsPolicyMessage(msg);
          const isDenied = err?.code === 1;
          publishGpsSnapshot({
            state: isDenied ? 'denied' : 'unknown',
            blockedByPolicy: policyBlocked,
            lastError: msg,
          });
          finish({
            permState: isDenied ? 'denied' : 'unknown',
            blockedByPolicy: policyBlocked,
            coords: null,
            reason: msg,
          });
        },
        {
          enableHighAccuracy: true,
          maximumAge: 60000,
          timeout: Math.max(5000, timeoutMs - 500),
        }
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to request browser location';
      const policyBlocked = isPermissionsPolicyMessage(msg);
      publishGpsSnapshot({
        state: 'denied',
        blockedByPolicy: policyBlocked,
        lastError: msg,
      });
      finish({
        permState: 'denied',
        blockedByPolicy: policyBlocked,
        coords: null,
        reason: msg,
      });
    }
  });
}

async function queryGpsPermissionState(): Promise<PermissionState | 'unknown'> {
  if (typeof navigator === 'undefined') return 'unknown';
  try {
    if (navigator.permissions?.query) {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return status.state;
    }
  } catch {
    return 'unknown';
  }
  return 'unknown';
}

async function resolveElakaArea(
  lat: number | undefined,
  lon: number | undefined,
  fallbackGeo: GeoIpResult
): Promise<{ area: string; city?: string; region?: string; postal?: string }> {
  const fallbackArea = buildOperatorArea(fallbackGeo);

  if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return {
      area: fallbackArea,
      city: fallbackGeo.city,
      region: fallbackGeo.region,
      postal: fallbackGeo.postal,
    };
  }

  // Primary reverse geocoder: Photon by Komoot (CORS Access-Control-Allow-Origin: * enabled)
  try {
    const photonUrl = `https://photon.komoot.io/reverse?lat=${encodeURIComponent(
      lat.toFixed(5)
    )}&lon=${encodeURIComponent(lon.toFixed(5))}&lang=en`;

    const data = await fetchJsonWithTimeout<{
      features?: Array<{
        properties?: {
          name?: string;
          street?: string;
          locality?: string;
          district?: string;
          city?: string;
          county?: string;
          state?: string;
          postcode?: string;
          country?: string;
        };
      }>;
    }>(photonUrl, 3800);

    const props = data?.features?.[0]?.properties;
    if (props) {
      const localityCandidates = [
        props.locality,
        props.district,
        props.street || props.name,
      ].filter((v): v is string => Boolean(v && v.trim()));

      const cityName = props.city || props.county || fallbackGeo.city;
      const regionName = props.state || fallbackGeo.region;
      const postal = props.postcode || fallbackGeo.postal;

      const uniqueParts: string[] = [];
      for (const part of [...localityCandidates.slice(0, 2), cityName]) {
        if (!part) continue;
        const clean = part.trim();
        if (
          clean &&
          !uniqueParts.some((existing) => existing.toLowerCase() === clean.toLowerCase())
        ) {
          uniqueParts.push(clean);
        }
      }

      let areaLabel = uniqueParts.join(', ') || fallbackArea;
      if (postal && !areaLabel.includes(postal)) {
        areaLabel = `${areaLabel} (${postal})`;
      }

      return {
        area: areaLabel,
        city: cityName || fallbackGeo.city,
        region: regionName || fallbackGeo.region,
        postal: postal || fallbackGeo.postal,
      };
    }
  } catch {
    // Fall back to Geo-IP labels
  }

  return {
    area: fallbackArea,
    city: fallbackGeo.city,
    region: fallbackGeo.region,
    postal: fallbackGeo.postal,
  };
}

function attachGpsUpgradeWatcher(user?: SignedInVisitorUser | null): void {
  if (permissionListenerAttached || typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return;
  }
  permissionListenerAttached = true;
  navigator.permissions
    .query({ name: 'geolocation' })
    .then((status) => {
      publishGpsSnapshot({ state: status.state });
      status.onchange = () => {
        publishGpsSnapshot({
          state: status.state,
          ...(status.state === 'granted'
            ? { blockedByPolicy: false, lastError: undefined }
            : {}),
        });
        if (status.state === 'granted') {
          const meta = readLoggedSessionMeta();
          if (!meta?.hasGps) {
            trackVisitorVisit(user, { force: true, requestGps: true }).catch(() => {});
          }
        }
      };
    })
    .catch(() => {
      // Ignore unsupported permission listeners
    });
}

function attachFirstGestureGpsPrompt(user?: SignedInVisitorUser | null): void {
  if (
    gestureListenerAttached ||
    typeof window === 'undefined' ||
    !navigator?.geolocation ||
    hasGesturePromptedThisSession()
  ) {
    return;
  }
  gestureListenerAttached = true;

  const cleanup = () => {
    window.removeEventListener('click', onFirstGesture, true);
    window.removeEventListener('touchend', onFirstGesture, true);
  };

  const onFirstGesture = () => {
    cleanup();
    const meta = readLoggedSessionMeta();
    if (meta?.hasGps || hasGesturePromptedThisSession() || lastGpsSnapshot.state === 'denied') {
      return;
    }
    markGesturePromptedThisSession();
    // Call geolocation SYNCHRONOUSLY inside this real user tap/click so browsers prompt cleanly
    const gpsPromise = requestGpsSynchronously(15000);
    void gpsPromise.then((outcome) => {
      if (outcome.coords) {
        trackVisitorVisit(user, { force: true, requestGps: false, preResolvedGps: outcome.coords }).catch(() => {});
      }
    });
  };

  window.addEventListener('click', onFirstGesture, { capture: true, passive: true });
  window.addEventListener('touchend', onFirstGesture, { capture: true, passive: true });
}

export async function trackVisitorVisit(
  user?: SignedInVisitorUser | null,
  options?: TrackVisitorOptions & {
    preResolvedGps?: { lat: number; lon: number; accuracyMeters?: number } | null;
  }
): Promise<TrackVisitorResult> {
  if (typeof window === 'undefined') {
    return { recorded: false };
  }

  // IMPORTANT: When triggered by a user click (force && requestGps) without preResolvedGps,
  // initiate geolocation SYNCHRONOUSLY BEFORE any await so the browser retains the user gesture!
  const synchronousGpsPromise =
    options?.force && options?.requestGps && !options?.preResolvedGps
      ? (() => {
          markGpsPromptedThisSession();
          markGesturePromptedThisSession();
          return requestGpsSynchronously(12000);
        })()
      : null;

  attachGpsUpgradeWatcher(user);

  const currentUid = user?.uid || null;
  const now = Date.now();
  const prev = readLoggedSessionMeta();

  if (!options?.force && prev) {
    const withinCooldown = now - prev.timestamp < SESSION_LOG_COOLDOWN_MS;
    const sameUserState =
      prev.uid === currentUid || (prev.uid !== null && currentUid === null);
    if (withinCooldown && sameUserState) {
      if (!prev.hasGps && options?.requestGps) {
        attachFirstGestureGpsPrompt(user);
      }
      return { recorded: false };
    }
  }

  if (inFlightVisitPromise && !options?.force) {
    return inFlightVisitPromise;
  }

  let runPromise!: Promise<TrackVisitorResult>;
  runPromise = (async (): Promise<TrackVisitorResult> => {
    try {
      const sessionId = getOrCreateVisitorSessionId();
      const ua = navigator.userAgent || '';
      const platform = detectPlatform();
      const deviceType = detectDeviceType(ua);
      const browser = detectBrowser(ua);
      const os = detectOS(ua);
      const screenSize = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
      const clientTimezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
      const localTime = new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        hour12: true,
      }).format(new Date());
      const pagePath = `${window.location.pathname || '/'}${window.location.hash || ''}`.slice(
        0,
        200
      );
      const referrer = document.referrer ? document.referrer.slice(0, 240) : undefined;

      const buildPayloadAndSave = async (
        geo: GeoIpResult,
        operatorArea: string,
        gpsCoords: { lat: number; lon: number; accuracyMeters?: number } | null
      ) => {
        const finalLat = gpsCoords ? gpsCoords.lat : geo.latitude;
        const finalLon = gpsCoords ? gpsCoords.lon : geo.longitude;
        const locationAccuracy: VisitorLocationAccuracy = gpsCoords ? 'GPS' : 'IP';
        const areaInfo = gpsCoords
          ? await resolveElakaArea(gpsCoords.lat, gpsCoords.lon, geo)
          : {
              area: operatorArea,
              city: geo.city,
              region: geo.region,
              postal: geo.postal,
            };

        if (locationAccuracy === 'GPS') {
          publishGpsSnapshot({
            state: 'granted',
            blockedByPolicy: false,
            lastError: undefined,
            area: areaInfo.area,
            accuracyMeters: gpsCoords?.accuracyMeters,
          });
        }

        await recordVisitorLog({
          sessionId,
          ip: geo.ip,
          ipType: geo.ipType,
          area: areaInfo.area,
          city: areaInfo.city,
          region: areaInfo.region,
          country: geo.country,
          countryCode: geo.countryCode,
          postal: areaInfo.postal,
          isp: geo.isp,
          operatorArea,
          operatorLatitude: geo.latitude,
          operatorLongitude: geo.longitude,
          latitude: finalLat,
          longitude: finalLon,
          gpsAccuracyMeters: gpsCoords?.accuracyMeters,
          locationAccuracy,
          timezone: clientTimezone || geo.timezone,
          localTime,
          platform,
          deviceType,
          browser,
          os,
          screenSize,
          pagePath: pagePath || '/',
          referrer,
          userId: currentUid || undefined,
          userEmail: user?.email || undefined,
          userName: user?.displayName || undefined,
        });

        writeLoggedSessionMeta({
          timestamp: Date.now(),
          uid: currentUid,
          hasGps: locationAccuracy === 'GPS',
        });

        return { area: areaInfo.area, locationAccuracy };
      };

      // Case 1: Pre-resolved GPS from first-gesture handler
      if (options?.preResolvedGps) {
        const geo = await resolveGeoIp();
        const operatorArea = buildOperatorArea(geo);
        const saved = await buildPayloadAndSave(geo, operatorArea, options.preResolvedGps);
        return {
          recorded: true,
          ip: geo.ip,
          area: saved.area,
          operatorArea,
          country: geo.country,
          accuracy: saved.locationAccuracy,
          gpsAccuracyMeters: options.preResolvedGps.accuracyMeters,
        };
      }

      // Case 2: Forced user-click GPS request (started synchronously above!)
      if (synchronousGpsPromise) {
        const [geo, gpsOutcome] = await Promise.all([
          resolveGeoIp(),
          synchronousGpsPromise,
        ]);
        const operatorArea = buildOperatorArea(geo);
        const saved = await buildPayloadAndSave(geo, operatorArea, gpsOutcome.coords);

        return {
          recorded: true,
          ip: geo.ip,
          area: saved.area,
          operatorArea,
          country: geo.country,
          accuracy: saved.locationAccuracy,
          gpsAccuracyMeters: gpsOutcome.coords?.accuracyMeters,
          gpsReason: gpsOutcome.reason,
          blockedByPolicy: gpsOutcome.blockedByPolicy,
          isEmbeddedIframe: lastGpsSnapshot.isEmbeddedIframe,
        };
      }

      const initialPerm = await queryGpsPermissionState();
      publishGpsSnapshot({ state: initialPerm });

      // Case 3: Permission already granted -> immediately capture both User GPS and Operator Geo
      if (initialPerm === 'granted') {
        const [geo, gpsOutcome] = await Promise.all([
          resolveGeoIp(),
          requestGpsSynchronously(7500),
        ]);
        const operatorArea = buildOperatorArea(geo);
        const saved = await buildPayloadAndSave(geo, operatorArea, gpsOutcome.coords);

        return {
          recorded: true,
          ip: geo.ip,
          area: saved.area,
          operatorArea,
          country: geo.country,
          accuracy: saved.locationAccuracy,
          gpsAccuracyMeters: gpsOutcome.coords?.accuracyMeters,
          gpsReason: gpsOutcome.reason,
          blockedByPolicy: gpsOutcome.blockedByPolicy,
          isEmbeddedIframe: lastGpsSnapshot.isEmbeddedIframe,
        };
      }

      // Case 4: Automatic storefront/PWA visit when permission is 'prompt' or 'unknown'
      // Stage 1: Log IP + Operator Geo immediately so zero visits are lost.
      const geo = await resolveGeoIp();
      const operatorArea = buildOperatorArea(geo);
      const savedStage1 = await buildPayloadAndSave(geo, operatorArea, null);

      // Stage 2: Try prompting now (works on desktop browsers that allow load prompts)
      // AND attach a synchronous first-user-gesture listener for mobile/Safari browsers
      // that require a direct tap/click to show the native GPS permission dialog!
      const shouldAttemptGps = Boolean(options?.requestGps) && initialPerm !== 'denied';
      if (shouldAttemptGps) {
        attachFirstGestureGpsPrompt(user);
        if (!hasPromptedGpsThisSession()) {
          markGpsPromptedThisSession();
          void (async () => {
            const gpsOutcome = await requestGpsSynchronously(12000);
            if (gpsOutcome.coords) {
              await buildPayloadAndSave(geo, operatorArea, gpsOutcome.coords);
            }
          })().catch(() => {});
        }
      }

      return {
        recorded: true,
        ip: geo.ip,
        area: savedStage1.area,
        operatorArea,
        country: geo.country,
        accuracy: savedStage1.locationAccuracy,
      };
    } catch (err) {
      console.warn('Visitor telemetry skipped:', err);
      return { recorded: false };
    } finally {
      if (inFlightVisitPromise === runPromise) {
        inFlightVisitPromise = null;
      }
    }
  })();

  inFlightVisitPromise = runPromise;
  return runPromise;
}
