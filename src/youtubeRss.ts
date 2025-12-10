// /build/youtubeRss.ts
export type RssVideo = {
  videoId: string;
  title: string;
  channelTitle?: string;
  thumbnailUrl: string;
  publishedAt?: string;
  embeddable: boolean;
};

type Options = { count?: number };

const CORS_PROXY = 'https://corsproxy.io/?';

/**
 * Fetches the newest videos from a channel's public RSS feed.
 * This method is more reliable than third-party APIs and does not require a key.
 */
export async function getNewestUploadsFromChannel(
  channelId: string,
  _apiKey: string, // Kept for signature compatibility, but ignored.
  opts: Options = {}
): Promise<RssVideo[]> {
  if (!channelId || !channelId.startsWith('UC')) {
    throw new Error("A valid YouTube Channel ID (starting with UC) is required.");
  }
  const count = Math.max(1, Math.min(15, opts.count ?? 1)); // RSS feeds typically have 15 items

  const feedUrl = `${CORS_PROXY}${encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)}`;

  try {
    const res = await fetch(feedUrl);
    if (!res.ok) {
      throw new Error(`Failed to load video feed (Status: ${res.status})`);
    }
    const xmlText = await res.text();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");
    
    const errorNode = doc.querySelector("parsererror");
    if (errorNode) {
      console.error("XML parsing error:", errorNode.textContent);
      throw new Error("Failed to parse the channel's video feed.");
    }
    
    const entries = Array.from(doc.querySelectorAll("entry")).slice(0, count);

    if (entries.length === 0 && doc.querySelector("feed") === null) {
      // This can happen if the proxy returns an HTML error page or the channel ID is wrong
      throw new Error("No videos found. The channel URL may be incorrect or the feed is unavailable.");
    }

    const videos: RssVideo[] = entries.map(entry => {
      const videoId = entry.querySelector("videoId")?.textContent ?? '';
      const title = entry.querySelector("title")?.textContent ?? 'Untitled';
      const channelTitle = entry.querySelector("author > name")?.textContent;
      const thumbnail = entry.querySelector("thumbnail")?.getAttribute('url') ?? '';
      const publishedAt = entry.querySelector("published")?.textContent;

      return {
        videoId,
        title,
        channelTitle: channelTitle || undefined,
        thumbnailUrl: thumbnail,
        publishedAt: publishedAt || undefined,
        embeddable: true, // Assume true; RSS doesn't provide this but it's a safe default.
      };
    });

    return videos;
  } catch (e: any) {
    console.error("YouTube RSS fetch error:", e);
    // Re-throw a cleaner message for the UI
    if (e.message.includes('Status: 404')) {
      throw new Error("Could not find a feed for this channel. Please check the URL.");
    }
    throw new Error(e.message || "An unknown error occurred while fetching videos.");
  }
}