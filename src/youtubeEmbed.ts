// /build/youtubeEmbed.ts

/**
 * Detects if the app is running in a restrictive sandboxed environment
 * like the AI Studio, which uses non-http origins (e.g., 'null' or 'blob:').
 */
export function isSandboxed(): boolean {
  try {
    // In sandboxed iframes, window.location.origin can be "null" (a string)
    // or not have an http/https protocol.
    return !(/^https?:$/.test(window.location.protocol));
  } catch (e) {
    // Accessing location might be blocked in very strict sandboxes.
    return true;
  }
}

/**
 * Builds the official YouTube embed URL. This should be used when NOT in a sandbox.
 */
export function buildYouTubeEmbedSrc(videoId: string): string {
  const params = new URLSearchParams({
    playsinline: '1',
    modestbranding: '1',
    rel: '0',
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
