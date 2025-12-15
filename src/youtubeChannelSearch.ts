// /build/youtubeChannelSearch.ts

const CORS_PROXY = 'https://corsproxy.io/?';

function extractChannelIdFromUrl(url: string): string | null {
  if (!url) return null;
  // Match /channel/UC... or a direct UC... ID
  const match = url.match(/(?:channel\/(UC[\w-]+)|^(UC[\w-]+))/);
  if (match) {
    return match[1] || match[2];
  }
  return null;
}

/**
 * Resolves a channel URL to its ID and name by fetching its public RSS feed.
 * This method does NOT require an API key.
 */
export async function resolveChannelUrl(url: string, _apiKey: string): Promise<{ id: string; name: string }> {
  const channelId = extractChannelIdFromUrl(url);

  if (!channelId) {
    throw new Error("Please use a full YouTube channel URL with a Channel ID (e.g., .../channel/UC...). Handles are not supported.");
  }

  const feedUrl = `${CORS_PROXY}${encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)}`;

  try {
    const res = await fetch(feedUrl);
    if (!res.ok) {
       // A 404 here is a strong indicator the channel ID is wrong.
      if (res.status === 404) {
        throw new Error("Could not find a channel with this URL. Please check the Channel ID.");
      }
      throw new Error(`Could not verify channel URL (Status: ${res.status})`);
    }
    const xmlText = await res.text();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");

    const channelName = doc.querySelector("feed > author > name")?.textContent;

    if (channelName) {
      return { id: channelId, name: channelName };
    } else {
      throw new Error("Could not parse channel information from the provided URL.");
    }
  } catch (e: any) {
    console.error("Channel URL resolution error:", e);
    // Forward the specific error message if available, otherwise provide a generic one.
    throw new Error(e.message || "Could not verify the channel URL. The service may be temporarily down.");
  }
}