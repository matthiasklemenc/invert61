// C:\Users\user\Desktop\invert\build\ffmpegClient.ts

import { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegInstance: FFmpeg | null = null;

/**
 * Returns a singleton FFmpeg instance for @ffmpeg/ffmpeg 0.12+.
 */
export async function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
  }

  // Make sure we only call load() once.
  if (!(ffmpegInstance as any).loaded) {
    await ffmpegInstance.load();
    (ffmpegInstance as any).loaded = true;
  }

  return ffmpegInstance;
}
