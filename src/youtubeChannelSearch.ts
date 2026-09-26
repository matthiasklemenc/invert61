import { getChannelDetails, getVideoDetails } from './youtubeApi';

export type ResolvedYouTubeSource =
  | {
      kind: 'channel';
      channelId: string;
      channelName: string;
      channelUrl: string;
      thumbnailUrl?: string;
      uploadsPlaylistId?: string | null;
    }
  | {
      kind: 'video';
      videoId: string;
      title: string;
      channelTitle?: string;
      thumbnailUrl: string;
      publishedAt?: string;
    };

function normalizeUrl(value: string): URL {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Please enter a YouTube URL.');

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error('Please enter a valid YouTube URL.');
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname !== 'youtube.com' &&
    hostname !== 'www.youtube.com' &&
    !hostname.endsWith('.youtube.com') &&
    hostname !== 'youtu.be'
  ) {
    throw new Error('Please enter a YouTube channel or video URL.');
  }

  return url;
}

function extractVideoId(url: URL): string | null {
  const hostname = url.hostname.toLowerCase();

  if (hostname === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id || null;
  }

  if (url.pathname === '/watch') {
    return url.searchParams.get('v');
  }

  const shorts = url.pathname.match(/^\/shorts\/([\w-]{6,})/);
  if (shorts) return shorts[1];

  const embed = url.pathname.match(/^\/embed\/([\w-]{6,})/);
  if (embed) return embed[1];

  return null;
}

function getHandle(url: URL): string | null {
  const match = url.pathname.match(/^\/@([^/?#]+)/);
  return match?.[1] || null;
}

function getChannelIdFromPath(url: URL): string | null {
  return url.pathname.match(/^\/channel\/(UC[\w-]+)/i)?.[1] || null;
}

async function resolveChannelUrl(url: URL): Promise<ResolvedYouTubeSource> {
  const directId = getChannelIdFromPath(url);

  if (directId) {
    const channel = await getChannelDetails(directId);
    return {
      kind: 'channel',
      channelId: channel.channelId,
      channelName: channel.channelName,
      channelUrl: url.toString(),
      thumbnailUrl: channel.thumbnailUrl,
      uploadsPlaylistId: channel.uploadsPlaylistId,
    };
  }

  const handle = getHandle(url);
  if (!handle) {
    throw new Error(
      'Please paste a full YouTube channel URL, such as https://www.youtube.com/@Skateiq.'
    );
  }

  const apiKey = (import.meta as any).env?.VITE_YOUTUBE_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error(
      'YouTube API key is missing. Add VITE_YOUTUBE_API_KEY to your .env.local file.'
    );
  }

  const apiUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
  apiUrl.searchParams.set('part', 'snippet,contentDetails');
  apiUrl.searchParams.set('forHandle', `@${handle}`);
  apiUrl.searchParams.set('key', apiKey.trim());

  const response = await fetch(apiUrl.toString());
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message;
    throw new Error(
      message || `YouTube API error (HTTP ${response.status}).`
    );
  }

  const item = data?.items?.[0];
  if (!item?.id) {
    throw new Error('Could not find the YouTube channel. Please check the channel URL.');
  }

  const thumbnails = item.snippet?.thumbnails;

  return {
    kind: 'channel',
    channelId: item.id,
    channelName: item.snippet?.title || 'YouTube Channel',
    channelUrl: url.toString(),
    thumbnailUrl:
      thumbnails?.high?.url ||
      thumbnails?.medium?.url ||
      thumbnails?.default?.url ||
      '',
    uploadsPlaylistId:
      item.contentDetails?.relatedPlaylists?.uploads || null,
  };
}

async function resolveVideoUrl(
  url: URL,
  videoId: string
): Promise<ResolvedYouTubeSource> {
  const video = await getVideoDetails(videoId);

  return {
    kind: 'video',
    videoId: video.videoId,
    title: video.title,
    channelTitle: video.channelTitle,
    thumbnailUrl: video.thumbnailUrl,
    publishedAt: video.publishedAt,
  };
}

export async function resolveYouTubeSourceUrl(
  value: string
): Promise<ResolvedYouTubeSource> {
  const url = normalizeUrl(value);
  const videoId = extractVideoId(url);

  if (videoId) {
    return resolveVideoUrl(url, videoId);
  }

  return resolveChannelUrl(url);
}
