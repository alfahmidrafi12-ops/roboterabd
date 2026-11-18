export type ResolvedVideoSource =
  | { kind: 'iframe'; embedUrl: string; provider: 'YouTube' | 'Vimeo' | 'Google Drive'; originalUrl: string }
  | { kind: 'video'; src: string; provider: 'Direct Video'; originalUrl: string }
  | { kind: 'external'; originalUrl: string };

const SAFE_URL_PATTERN = /^https?:\/\//i;
const DIRECT_VIDEO_EXT_PATTERN = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;

export function isValidHttpUrl(raw?: string | null): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!SAFE_URL_PATTERN.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function resolveProductVideo(rawUrl?: string | null): ResolvedVideoSource | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!isValidHttpUrl(trimmed)) return null;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');

    // YouTube (watch, shorts, live, embed, youtu.be)
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      if (id && /^[a-zA-Z0-9_-]{6,20}$/.test(id)) {
        return {
          kind: 'iframe',
          embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`,
          provider: 'YouTube',
          originalUrl: trimmed,
        };
      }
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      let videoId = url.searchParams.get('v');
      if (!videoId) {
        const parts = url.pathname.split('/').filter(Boolean);
        if (
          (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') &&
          parts[1]
        ) {
          videoId = parts[1];
        }
      }
      if (videoId && /^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
        return {
          kind: 'iframe',
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
          provider: 'YouTube',
          originalUrl: trimmed,
        };
      }
    }

    // Vimeo
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      const numericPart = [...parts].reverse().find((seg) => /^\d{5,15}$/.test(seg));
      if (numericPart) {
        return {
          kind: 'iframe',
          embedUrl: `https://player.vimeo.com/video/${numericPart}`,
          provider: 'Vimeo',
          originalUrl: trimmed,
        };
      }
    }

    // Google Drive video preview
    if (host === 'drive.google.com') {
      const match = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match?.[1]) {
        return {
          kind: 'iframe',
          embedUrl: `https://drive.google.com/file/d/${match[1]}/preview`,
          provider: 'Google Drive',
          originalUrl: trimmed,
        };
      }
    }

    // Direct HTML5 video files or Firebase Storage / CDN media URLs
    if (
      DIRECT_VIDEO_EXT_PATTERN.test(url.pathname) ||
      host.includes('firebasestorage.googleapis.com')
    ) {
      return {
        kind: 'video',
        src: trimmed,
        provider: 'Direct Video',
        originalUrl: trimmed,
      };
    }

    // Fallback to native video element or external watch link if provider unknown
    return {
      kind: 'external',
      originalUrl: trimmed,
    };
  } catch {
    return null;
  }
}
