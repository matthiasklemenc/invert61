// C:\Users\user\Desktop\invert\build\webcodecsSupport.ts

export function hasWebCodecsSupport(): boolean {
  const globalAny: any = globalThis as any;

  const hasVideoEncoder = typeof globalAny.VideoEncoder === "function";
  const hasVideoDecoder = typeof globalAny.VideoDecoder === "function";
  const hasAudioData = typeof globalAny.AudioData === "function";
  const hasEncodedVideoChunk = typeof globalAny.EncodedVideoChunk === "function";

  return hasVideoEncoder && hasVideoDecoder && hasAudioData && hasEncodedVideoChunk;
}
