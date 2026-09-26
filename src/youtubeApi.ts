export type YouTubeVideo = {
  videoId: string;
  title: string;
  channelTitle?: string;
  thumbnailUrl: string;
  publishedAt?: string;
  embeddable: boolean;
};

export type YouTubeChannel = {
  channelId: string;
  channelName: string;
  thumbnailUrl?: string;
};

export type YouTubeSearchResult =
  | ({ kind: 'channel' } & YouTubeChannel)
  | ({ kind: 'video' } & YouTubeVideo);

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

    if (response.status === 403) {
      throw new Error(
        message ||
        'YouTube API access was denied. Check that YouTube Data API v3 is enabled and that the API key is valid.'
      );
    }

    throw new Error(message || `YouTube API error (HTTP ${response.status}).`);
  }

  return data as T;
}

type SearchResponse = {
  items?: Array<{
    id?: {
      channelId?: string;
      videoId?: string;
    };
    snippet?: {
      title?: string;
      channelTitle?: string;
      publishedAt?: string;
      thumbnails?: {
        default?: { url?: string };
        medium?: { url?: string };
        high?: { url?: string };
      };
    };
  }>;
};

export async function searchYouTube(
  query: string,
  type: 'channel' | 'video',
  maxResults = 10
): Promise<YouTubeSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const data = await youtubeRequest<SearchResponse>('search', {
    part: 'snippet',
    q,
    type,
    maxResults: String(Math.max(1, Math.min(25, maxResults))),
    order: 'relevance',
  });

  return (data.items || [])
    .map((item): YouTubeSearchResult | null => {
      const snippet = item.snippet;
      if (!snippet) return null;

      const thumbnails = snippet.thumbnails;
      const thumbnailUrl =
        thumbnails?.high?.url ||
        thumbnails?.medium?.url ||
        thumbnails?.default?.url ||
        '';

      if (type === 'channel') {
        const channelId = item.id?.channelId;
        if (!channelId) return null;

        return {
          kind: 'channel',
          channelId,
          channelName: snippet.title || 'Untitled channel',
          thumbnailUrl,
        };
      }

      const videoId = item.id?.videoId;
      if (!videoId) return null;

      return {
        kind: 'video',
        videoId,
        title: snippet.title || 'Untitled video',
        channelTitle: snippet.channelTitle,
        thumbnailUrl,
        publishedAt: snippet.publishedAt,
        embeddable: true,
      };
    })
    .filter((item): item is YouTubeSearchResult => item !== null);
}

type ChannelResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      thumbnails?: {
        default?: { url?: string };
        medium?: { url?: string };
        high?: { url?: string };
      };
    };
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }>;
};

export async function getChannelDetails(channelId: string): Promise<{
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  uploadsPlaylistId: string | null;
}> {
  const data = await youtubeRequest<ChannelResponse>('channels', {
    part: 'snippet,contentDetails',
    id: channelId,
  });

  const item = data.items?.[0];

  if (!item?.id) {
    throw new Error('Could not find that YouTube channel.');
  }

  const thumbnails = item.snippet?.thumbnails;

  return {
    channelId: item.id,
    channelName: item.snippet?.title || 'Untitled channel',
    thumbnailUrl:
      thumbnails?.high?.url ||
      thumbnails?.medium?.url ||
      thumbnails?.default?.url ||
      '',
    uploadsPlaylistId:
      item.contentDetails?.relatedPlaylists?.uploads || null,
  };
}

type VideoDetailsResponse = {
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
    };
    status?: {
      embeddable?: boolean;
    };
  }>;
};

export async function getVideoDetails(videoId: string): Promise<YouTubeVideo> {
  const data = await youtubeRequest<VideoDetailsResponse>('videos', {
    part: 'snippet,status',
    id: videoId,
  });

  const item = data.items?.[0];

  if (!item) {
    throw new Error('Could not find that YouTube video.');
  }

  const snippet = item.snippet;
  const thumbnails = snippet?.thumbnails;

  return {
    videoId,
    title: snippet?.title || 'Untitled video',
    channelTitle: snippet?.channelTitle,
    thumbnailUrl:
      thumbnails?.high?.url ||
      thumbnails?.medium?.url ||
      thumbnails?.default?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    publishedAt: snippet?.publishedAt,
    embeddable: item.status?.embeddable !== false,
  };
}

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
  uploadsPlaylistId?: string | null
): Promise<YouTubeVideo[]> {
  let playlistId = uploadsPlaylistId || null;

  // Backward compatibility for the old saved channel slots.
  if (!playlistId) {
    const channel = await getChannelDetails(channelId);
    playlistId = channel.uploadsPlaylistId;
  }

  if (!playlistId) {
    throw new Error('Could not find the uploads playlist for this channel.');
  }

  const data = await youtubeRequest<PlaylistItemsResponse>('playlistItems', {
    part: 'snippet,status',
    playlistId,
    maxResults: '1',
  });

  const item = data.items?.find(
    entry =>
      entry.status?.privacyStatus !== 'private' &&
      !!entry.snippet?.resourceId?.videoId
  );

  if (!item?.snippet?.resourceId?.videoId) {
    throw new Error('No public videos found for this channel.');
  }

  const snippet = item.snippet;
  const thumbnails = snippet.thumbnails;

  return [
    {
      videoId: snippet.resourceId!.videoId!,
      title: snippet.title || 'Untitled video',
      channelTitle: snippet.channelTitle,
      thumbnailUrl:
        thumbnails?.high?.url ||
        thumbnails?.medium?.url ||
        thumbnails?.default?.url ||
        '',
      publishedAt: snippet.publishedAt,
      embeddable: true,
    },
  ];
}
