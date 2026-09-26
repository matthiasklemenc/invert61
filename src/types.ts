import type { SkateSession } from './skate_session_review/types';

export interface Song {
  id: number | string;
  name: string;
  artist_name: string;
  album_image: string;
  audio: string;
  audio_hq?: string;
  audio_nq: string;
  audiodownload_allowed?: boolean;
  genre?: string;
  license?: string;
  artist_url?: string;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
}

export type YouTubeSlotType = 'channel' | 'video';

export interface YouTubeChannelSlot {
  id: number; // 0-3
  type?: YouTubeSlotType; // Old saved slots have no type; they are treated as channels.
  channelId: string | null;
  channelName: string | null;

  // Used when this slot is a specific saved video.
  videoId?: string | null;
  videoTitle?: string | null;
  videoChannelName?: string | null;
  videoThumbnailUrl?: string | null;
  videoPublishedAt?: string | null;
  videoEmbeddable?: boolean;

  // Used for channel slots so the latest upload can be fetched cheaply.
  uploadsPlaylistId?: string | null;
}

export type RecentClip = {
  id: string;
  name: string;
  dataUrl: string;
  thumbnailUrl: string;
};

export type { SkateSession };

export type MotionDataPoint = {
  ax: number; ay: number; az: number;
  gx: number; gy: number; gz: number;
  timestamp: number;
};

export type TrickTake = MotionDataPoint[];

export type TrainedTricks = {
  [trickName: string]: TrickTake[];
};
