export type RssVideo = {
  videoId: string;
  title: string;
  channelTitle?: string;
  thumbnailUrl: string;
  publishedAt?: string;
  embeddable: boolean;
};

type Options = { count?: number };

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

const API_BASE = 'https://www.googleapis.com/youtube/v3';

function getApiKey(): string {
  const key = (import.meta as any).env?.VITE_YOUTUBE_API_KEY;

  if (!key || !key.trim()) {
    throw new Error(
      'YouTube API key is missing. Add VITE_YOUTUBE_API_KEY to your .env.local file.'
    );
  }

  return key.trim();
}

async function youtubeRequest<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const url = new URL(`${API_BASE}/${endpoint}`);

  Object.entries({ ...params, key: getApiKey() }).forEach(([name, value]) => {
    url.searchParams.set(name, value);
  });

  const response = await fetch(url.toString());
  let data: T | ApiErrorResponse;

  try {
    data = await response.json();
  } catch {
    throw new Error(`YouTube API returned HTTP ${response.status}.`);
  }

  if (!response.ok) {
    const message = (data as ApiErrorResponse).error?.message;
    throw new Error(message || `YouTube API error (HTTP ${response.status}).`);
  }

  return data as T;
}

type ChannelResponse = {
  items?: Array<{
    id?: string;
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }>;
};

type PlaylistItemsResponse = {
  items?: Array<{
    snippet?: {
      title?: string;
      channelTitle?: string;
      publishedAt?: string;
      thumbnails?: {
        default?: { url?: string };
        medium?: { url?: string };
        high?: { url?: string };
      };
      resourceId?: {
        videoId?: string;
      };
    };
    status?: {
      privacyStatus?: string;
    };
  }>;
};

export async function getNewestUploadsFromChannel(
  channelId: string,
  _apiKey: string,
  opts: Options = {}
): Promise<RssVideo[]> {
  if (!channelId || !channelId.startsWith('UC')) {
    throw new Error('A valid YouTube Channel ID (starting with UC) is required.');
  }

  const count = Math.max(1, Math.min(15, opts.count ?? 1));

  const channelData = await youtubeRequest<ChannelResponse>('channels', {
    part: 'contentDetails',
    id: channelId,
  });

  const uploadsPlaylistId =
    channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    throw new Error('Could not find the uploads playlist for this channel.');
  }

  const data = await youtubeRequest<PlaylistItemsResponse>('playlistItems', {
    part: 'snippet,status',
    playlistId: uploadsPlaylistId,
    maxResults: String(count),
  });

  const videos: RssVideo[] = (data.items || [])
    .filter(
      item =>
        item.status?.privacyStatus !== 'private' &&
        !!item.snippet?.resourceId?.videoId
    )
    .map(item => {
      const snippet = item.snippet!;
      const thumbnails = snippet.thumbnails;

      return {
        videoId: snippet.resourceId!.videoId!,
        title: snippet.title || 'Untitled',
        channelTitle: snippet.channelTitle || undefined,
        thumbnailUrl:
          thumbnails?.high?.url ||
          thumbnails?.medium?.url ||
          thumbnails?.default?.url ||
          '',
        publishedAt: snippet.publishedAt || undefined,
        embeddable: true,
      };
    });

  if (videos.length === 0) {
    throw new Error('No public videos found for this channel.');
  }

  return videos;
}
