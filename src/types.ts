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
  name:string;
  songs: Song[];
}

export interface YouTubeChannelSlot {
  id: number; // 0-3
  channelId: string | null;
  channelName: string | null;
}

export type RecentClip = {
    id: string;
    name: string;
    dataUrl: string; // The original video file as a base64 data URL
    thumbnailUrl: string; // A base64 data URL for the thumbnail image
};

// Add SkateSession to global types
export type { SkateSession };

// --- New types for Trick Training ---

export type MotionDataPoint = {
  ax: number; ay: number; az: number; // accelerometer
  gx: number; gy: number; gz: number; // gyroscope
  timestamp: number;
};

export type TrickTake = MotionDataPoint[];

export type TrainedTricks = {
  // e.g., "Ollie": [ [take1_datapoints], [take2_datapoints] ]
  [trickName: string]: TrickTake[];
};
