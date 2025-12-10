// C:\Users\user\Desktop\invert\build\VideoEditor.tsx

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getFFmpeg } from "./ffmpegClient";
import VideoTimeline from "./VideoTimeline";
import VideoCameraIcon from "./VideoCameraIcon";
import { RecentClip } from "./types";
import { PlayArrowIcon, TrashIcon, PlayIcon, PauseIcon } from "./Icons";
import SpeedometerIcon from "./SpeedometerIcon";
import MusicNoteIcon from "./MusicNoteIcon";
import AudioTimeline from "./AudioTimeline";
import { hasWebCodecsSupport } from "./webcodecsSupport";
import Logo from "./Logo";

const RECENT_CLIPS_LIMIT = 4;
const MAX_RECENT_CLIP_SIZE_MB = 10;
const MAX_RECENT_CLIP_SIZE_BYTES = MAX_RECENT_CLIP_SIZE_MB * 1024 * 1024;

// Helper functions for recent clips feature
const generateThumbnail = (videoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(videoFile);
    video.src = url;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration / 2); // Seek to 1s or halfway
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      const aspectRatio = video.videoWidth / video.videoHeight;
      canvas.width = 160;
      canvas.height = 160 / (aspectRatio || 1.77);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context not available"));

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video for thumbnail generation."));
    };
  });
};

const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
};

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

type SpeedEffect = {
  id: number;
  start: number;
  end: number;
  factor: number;
  color: string;
};

type WebCodecsExportOptions = {
  file: File;
  inStart: number;
  inEnd: number;
  duration: number;
  speedEffects: SpeedEffect[];
  audioFile: File | null;
  audioOffset: number;
  musicVolume: number;
  videoVolume: number;
  previewAudioBuffer: AudioBuffer | null;
  onProgress?: (value: number, stage?: string) => void;
  onLog?: (message: string) => void;
};

/**
 * Fast hardware-accelerated export using:
 *  - Hidden <video> element for playback
 *  - <canvas> downscaled to max 1080p height
 *  - canvas.captureStream(30) for video
 *  - Web Audio to mix original video audio + overlay music
 *
 * Speed ramps are applied by changing video.playbackRate while recording:
 *  - factor < 1.0 => slomo (longer runtime, lower pitch)
 *  - factor > 1.0 => fast (shorter runtime, higher pitch)
 *
 * NOTE: This path now also mixes in the overlay music using Web Audio.
 */
async function exportWithWebCodecs(
  options: WebCodecsExportOptions
): Promise<Blob> {
  const {
    file,
    inStart,
    inEnd,
    duration,
    speedEffects,
    audioFile,
    audioOffset,
    musicVolume,
    videoVolume,
    previewAudioBuffer,
    onProgress,
    onLog,
  } = options;

  const log = (msg: string) => {
    if (onLog) {
      onLog(msg);
    } else {
      console.log("[WebCodecs]", msg);
    }
  };

  if (!file) {
    throw new Error("No input file for WebCodecs export");
  }

  const safeStart = Math.max(0, Math.min(inStart, duration || 0));
  const safeEnd = Math.max(
    safeStart,
    Math.min(inEnd || duration || 0, duration || 0)
  );

  if (!(safeEnd > safeStart)) {
    throw new Error("Invalid trim range for WebCodecs export");
  }

  type Segment = { start: number; end: number; factor: number };

  // Build simple segments from current speedEffects + trim region
  const sortedEffects = Array.isArray(speedEffects)
    ? [...speedEffects].sort((a, b) => a.start - b.start)
    : [];

  const segments: Segment[] = [];
  let cursor = safeStart;

  for (const eff of sortedEffects) {
    const effStart = Math.max(safeStart, eff.start);
    const effEnd = Math.min(safeEnd, eff.end);
    if (effEnd <= effStart) continue;

    // gap before effect: normal speed
    if (cursor < effStart) {
      segments.push({ start: cursor, end: effStart, factor: 1.0 });
    }

    const factor =
      typeof eff.factor === "number" && eff.factor > 0 ? eff.factor : 1.0;
    segments.push({ start: effStart, end: effEnd, factor });
    cursor = effEnd;
  }

  if (cursor < safeEnd) {
    segments.push({ start: cursor, end: safeEnd, factor: 1.0 });
  }

  if (segments.length === 0) {
    segments.push({ start: safeStart, end: safeEnd, factor: 1.0 });
  }

  // Estimate output duration in *real time* based on playbackRate
  const estimatedDurationSeconds = segments.reduce((acc, seg) => {
    const span = seg.end - seg.start;
    const f = seg.factor || 1.0;
    if (!isFinite(span) || span <= 0) return acc;
    return acc + span / f;
  }, 0);

  if (!Number.isFinite(estimatedDurationSeconds) || estimatedDurationSeconds <= 0) {
    throw new Error("Invalid estimated export duration");
  }

  log(
    `Starting fast 1080p WebCodecs export: ${safeStart.toFixed(
      2
    )}s → ${safeEnd.toFixed(2)}s (approx ${estimatedDurationSeconds.toFixed(
      2
    )}s runtime)…`
  );
  if (onProgress) {
    onProgress(0, "Preparing hardware encoder…");
  }

  const srcUrl = URL.createObjectURL(file);
  const videoEl = document.createElement("video");
  videoEl.src = srcUrl;
  videoEl.crossOrigin = "anonymous";

  // Let the element output audio normally; we tap raw audio via Web Audio.
  // Muting here can also mute the MediaElementSource on some mobile browsers.
  videoEl.muted = false;
  videoEl.volume = 1.0;
  (videoEl as any).playsInline = true;

  // Hide off-screen
  videoEl.style.position = "fixed";
  videoEl.style.left = "-9999px";
  videoEl.style.top = "-9999px";
  videoEl.style.width = "1px";
  videoEl.style.height = "1px";
  document.body.appendChild(videoEl);

  // Wait for metadata
  await new Promise<void>((resolve, reject) => {
    const onLoaded = () => {
      videoEl.removeEventListener("loadedmetadata", onLoaded);
      resolve();
    };
    const onError = () => {
      videoEl.removeEventListener("loadedmetadata", onLoaded);
      reject(new Error("Failed to load video metadata for export"));
    };
    videoEl.addEventListener("loadedmetadata", onLoaded);
    videoEl.addEventListener("error", onError, { once: true });
  });

  const naturalW = (videoEl as HTMLVideoElement).videoWidth || 1920;
  const naturalH = (videoEl as HTMLVideoElement).videoHeight || 1080;
  let targetH = naturalH;
  let targetW = naturalW;

  if (naturalH > 1080) {
    targetH = 1080;
    targetW = Math.round((naturalW / naturalH) * targetH);
  }

  if (!targetW || !targetH || targetW <= 0 || targetH <= 0) {
    targetW = 1920;
    targetH = 1080;
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    document.body.removeChild(videoEl);
    URL.revokeObjectURL(srcUrl);
    throw new Error("Could not get 2D canvas context for export");
  }

  // --- Web Audio: mix original video audio + overlay music into single stream ---
  const audioCtx = new (window.AudioContext ||
    (window as any).webkitAudioContext)();
  const destination = audioCtx.createMediaStreamDestination();

  // Original video audio
  const videoSource = audioCtx.createMediaElementSource(videoEl);
  const videoGainNode = audioCtx.createGain();
  videoGainNode.gain.value =
    typeof videoVolume === "number" && videoVolume >= 0 && videoVolume <= 1
      ? videoVolume
      : 1.0;
  videoSource.connect(videoGainNode).connect(destination);

  // Optional music overlay
  let musicSource: AudioBufferSourceNode | null = null;
  if (previewAudioBuffer && previewAudioBuffer.duration > 0 && musicVolume > 0) {
    const musicGainNode = audioCtx.createGain();
    musicGainNode.gain.value =
      typeof musicVolume === "number" && musicVolume >= 0 && musicVolume <= 1
        ? musicVolume
        : 0.5;

    musicSource = audioCtx.createBufferSource();
    musicSource.buffer = previewAudioBuffer;
    musicSource.connect(musicGainNode).connect(destination);

    // Align the overlay music with the video timeline using the same offset
    // logic as the live preview: when the video timeline is at `safeStart`,
    // the song should be at `safeStart - audioOffset`.
    const initialOffsetInMusic = safeStart - audioOffset;
    const startBase = audioCtx.currentTime + 0.1; // slight delay to ensure everything is ready

    if (
      initialOffsetInMusic >= 0 &&
      initialOffsetInMusic < previewAudioBuffer.duration
    ) {
      musicSource.start(startBase, initialOffsetInMusic);
    } else if (initialOffsetInMusic < 0) {
      const delay = -initialOffsetInMusic;
      musicSource.start(startBase + delay, 0);
    } else {
      // music would have fully finished before this region; don't start it
      musicSource = null;
    }
  }

  // We never connect destination to audioCtx.destination, so nothing is heard
  // locally – it only feeds the recorder.
  const audioStream = destination.stream;

  // Canvas stream for video (30 fps)
  const canvasStream: MediaStream =
    (canvas as any).captureStream?.(30) ||
    (canvas as any).captureStream?.() ||
    (canvas as any).mozCaptureStream?.(30) ||
    (canvas as any).mozCaptureStream?.();

  if (!canvasStream) {
    document.body.removeChild(videoEl);
    URL.revokeObjectURL(srcUrl);
    audioCtx.close().catch(() => {});
    throw new Error("canvas.captureStream() not supported in this browser");
  }

  const finalStream = new MediaStream();

  // Add video track from canvas
  canvasStream.getVideoTracks().forEach((t) => finalStream.addTrack(t));

  // Add mixed audio track(s) from Web Audio
  audioStream.getAudioTracks().forEach((t) => finalStream.addTrack(t));

  if (finalStream.getVideoTracks().length === 0) {
    document.body.removeChild(videoEl);
    URL.revokeObjectURL(srcUrl);
    audioCtx.close().catch(() => {});
    throw new Error("No video track available for export");
  }

  // Choose mime type for MediaRecorder
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  let chosenMime: string | null = null;

  if (typeof MediaRecorder !== "undefined") {
    for (const cand of candidates) {
      if (MediaRecorder.isTypeSupported(cand)) {
        chosenMime = cand;
        break;
      }
    }
  }

  if (!chosenMime) {
    document.body.removeChild(videoEl);
    URL.revokeObjectURL(srcUrl);
    audioCtx.close().catch(() => {});
    throw new Error("No supported MediaRecorder mime type found for export");
  }

  log(`Using MediaRecorder mime type: ${chosenMime}`);
  if (onProgress) {
    onProgress(0.01, "Initializing recorder…");
  }

  const recorder = new MediaRecorder(finalStream, {
    mimeType: chosenMime,
    videoBitsPerSecond: 6_000_000,
  });

  const chunks: BlobPart[] = [];
  let stopped = false;

  recorder.ondataavailable = (ev: BlobEvent) => {
    if (ev.data && ev.data.size > 0) {
      chunks.push(ev.data);
    }
  };

  const blobPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = (event: Event) => {
      if (!stopped) {
        stopped = true;
        reject((event as any).error || new Error("MediaRecorder error during export"));
      }
    };

    recorder.onstop = () => {
      if (stopped) return;
      stopped = true;
      try {
        const outBlob = new Blob(chunks, { type: chosenMime! });
        resolve(outBlob);
      } catch (e) {
        reject(e);
      }
    };
  });

  // Seek to trim start
  videoEl.currentTime = safeStart;
  await new Promise<void>((resolve, reject) => {
    const onSeeked = () => {
      videoEl.removeEventListener("seeked", onSeeked);
      resolve();
    };
    const onError = () => {
      videoEl.removeEventListener("seeked", onSeeked);
      reject(new Error("Failed to seek video to start position"));
    };
    videoEl.addEventListener("seeked", onSeeked);
    videoEl.addEventListener("error", onError, { once: true });
  });

  // Helper: set playbackRate based on currentTime and segments
  const updatePlaybackRate = () => {
    const t = videoEl.currentTime;
    let rate = 1.0;
    for (const seg of segments) {
      if (t >= seg.start && t < seg.end) {
        rate = seg.factor || 1.0;
        break;
      }
    }
    if (!isFinite(rate) || rate <= 0) rate = 1.0;
    if (videoEl.playbackRate !== rate) {
      videoEl.playbackRate = rate;
    }
    if (musicSource && musicSource.playbackRate && musicSource.playbackRate.value !== rate) {
      musicSource.playbackRate.value = rate;
    }
  };

  updatePlaybackRate();

  // Draw loop
  const drawFrame = () => {
    if (stopped) return;
    try {
      ctx.drawImage(videoEl, 0, 0, targetW, targetH);
    } catch {
      // ignore draw errors (e.g. if frame not ready yet)
    }
    requestAnimationFrame(drawFrame);
  };
  requestAnimationFrame(drawFrame);

  const startTime = performance.now();

  // Progress updater based on elapsed time vs estimatedDurationSeconds
  if (onProgress) {
    const tick = () => {
      if (stopped) return;
      const elapsedSec = (performance.now() - startTime) / 1000;
      const ratio =
        estimatedDurationSeconds > 0
          ? Math.min(0.99, Math.max(0, elapsedSec / estimatedDurationSeconds))
          : 0;
      onProgress(ratio, "Encoding with hardware video encoder…");
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const onTimeUpdate = () => {
    if (stopped) return;
    updatePlaybackRate();
    if (videoEl.currentTime >= safeEnd - 0.01) {
      try {
        recorder.stop();
        videoEl.pause();
      } catch {
        // ignore
      }
    }
  };

  videoEl.addEventListener("timeupdate", onTimeUpdate);

  // Hard safety timeout in case timeupdate fails
  const hardTimeoutMs = (estimatedDurationSeconds + 2) * 1000;
  const timeoutId = window.setTimeout(() => {
    if (!stopped) {
      log("Hard timeout reached, stopping recorder.");
      try {
        recorder.stop();
        videoEl.pause();
      } catch {
        // ignore
      }
    }
  }, hardTimeoutMs);

  log("Starting MediaRecorder and video playback…");
  recorder.start();

  // Start the video element playback *after* recorder has started
  await videoEl.play();

  const resultBlob = await blobPromise;

  window.clearTimeout(timeoutId);
  videoEl.removeEventListener("timeupdate", onTimeUpdate);
  document.body.removeChild(videoEl);
  URL.revokeObjectURL(srcUrl);
  audioCtx.close().catch(() => {});

  if (onProgress) {
    onProgress(1, "Export complete");
  }
  log("WebCodecs export finished.");

  return resultBlob;
}

const SpeedSlider: React.FC<{ value: number; onChange: (v: number) => void }> = ({
  value,
  onChange,
}) => {
  const minSpeed = 0.25;
  const maxSpeed = 4.0;
  const defaultSpeed = 1.0;

  const sliderValue = useMemo(() => {
    if (value >= defaultSpeed) {
      return (value - defaultSpeed) / (maxSpeed - defaultSpeed);
    } else {
      return (value - defaultSpeed) / (defaultSpeed - minSpeed);
    }
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    let newSpeed;
    if (v >= 0) {
      newSpeed = defaultSpeed + v * (maxSpeed - defaultSpeed);
    } else {
      newSpeed = defaultSpeed + v * (defaultSpeed - minSpeed);
    }
    onChange(Math.round(newSpeed * 100) / 100);
  };

  const fillStyle = useMemo(() => {
    const center = 50;
    const extent = Math.abs(sliderValue * 50);
    const left = sliderValue > 0 ? center : center - extent;
    const width = extent;
    const color = sliderValue > 0 ? "#c52323" : "#3b82f6";
    return { left: `${left}%`, width: `${width}%`, backgroundColor: color };
  }, [sliderValue]);

  return (
    <div className="relative flex items-center h-6 flex-grow">
      <div className="absolute left-0 right-0 h-1 bg-neutral-700 rounded-full top-1/2 -translate-y-1/2">
        <div className="absolute h-full rounded-full" style={fillStyle} />
      </div>
      <input
        type="range"
        min="-1"
        max="1"
        step="0.01"
        value={sliderValue}
        onChange={handleSliderChange}
        className="w-full h-full relative z-10 speed-slider"
        aria-label="Speed factor slider"
      />
      <style>{`
        .speed-slider, .speed-slider::-webkit-slider-thumb, .speed-slider::-moz-range-thumb {
          -webkit-appearance: none; appearance: none; background: transparent;
        }
        .speed-slider::-webkit-slider-runnable-track, .speed-slider::-moz-range-track {
          background: transparent;
        }
        .speed-slider::-webkit-slider-thumb {
            width: 16px; height: 16px; background: white; border-radius: 99px;
            cursor: pointer; margin-top: -5px; border: 2px solid #171717;
        }
        .speed-slider::-moz-range-thumb {
            width: 16px; height: 16px; background: white; border-radius: 99px;
            cursor: pointer; border: 2px solid #171717;
        }
      `}</style>
    </div>
  );
};

const DeleteEffectIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="#ef4444"
      className="group-hover:fill-red-400 transition-colors"
    />
    <path
      d="M15 9L9 15M9 9L15 15"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function VideoEditor({
  onClose,
  recentClips,
  onSetRecentClips,
  videoVolume,
  onVideoVolumeChange,
}: {
  onClose: () => void;
  recentClips: RecentClip[];
  onSetRecentClips: React.Dispatch<React.SetStateAction<RecentClip[]>>;
  videoVolume: number;
  onVideoVolumeChange: (v: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);

  const [videoAspect, setVideoAspect] = useState<number | null>(null);

  const [inStart, setInStart] = useState(0);
  const [inEnd, setInEnd] = useState(0);
  const [speedEffects, setSpeedEffects] = useState<SpeedEffect[]>([]);

  const [showSpeedControl, setShowSpeedControl] = useState(false);

  const [playhead, setPlayhead] = useState(0);

  const [busy, setBusy] = useState(false);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [log, setLog] = useState("");
  const [progress, setProgress] = useState(0); // For export progress

  // New audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioOffset, setAudioOffset] = useState(0); // seconds
  const [musicVolume, setMusicVolume] = useState(0.5);

  // Web Audio API state for live preview
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const musicGainNodeRef = useRef<GainNode | null>(null);
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const [audioEngineSetup, setAudioEngineSetup] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const musicShouldBePlaying = useRef(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);

  const blobUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(
    () => () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    },
    [blobUrl]
  );

  const resetStateForNewVideo = useCallback(() => {
    setOutUrl(null);
    setLog("");
    setProgress(0);
    setShowSpeedControl(false);
    setSpeedEffects([]);
    setPlayhead(0);
    setInStart(0);
    setInEnd(0);
    setIsPlaying(false);

    // Stop any overlay music, but keep chosen audio + engine
    if (musicSourceNodeRef.current) {
      try {
        musicSourceNodeRef.current.stop();
      } catch (e) {
        // ignore
      }
      musicSourceNodeRef.current = null;
    }
    musicShouldBePlaying.current = false;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    // Allow re-selecting the exact same video again
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Prefer back camera
        audio: true,
      });
      streamRef.current = stream;
      setIsRecording(true);

      const options = { mimeType: 'video/webm; codecs=vp9' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      });

      mediaRecorder.addEventListener('stop', () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const fileName = `invert-recording-${Date.now()}.webm`;
        const recordedFile = new File([blob], fileName, { type: 'video/webm' });

        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        setIsRecording(false);
        resetStateForNewVideo();
        setFile(recordedFile);
      });

      mediaRecorder.start();
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions and try again.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };
  
  useEffect(() => {
    if (isRecording && liveVideoRef.current && streamRef.current) {
        liveVideoRef.current.srcObject = streamRef.current;
    }
  }, [isRecording]);

  const setupAudioEngine = useCallback(async (): Promise<boolean> => {
    if (audioEngineSetup) return true;

    try {
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      const musicGain = audioCtx.createGain();
      musicGainNodeRef.current = musicGain;

      const masterGain = audioCtx.createGain();
      masterGainNodeRef.current = masterGain;

      musicGain.connect(masterGain);
      masterGain.connect(audioCtx.destination);

      setAudioEngineSetup(true);
      return true;
    } catch (e) {
      console.error("Failed to setup audio engine:", e);
      alert(
        "Could not initialize audio preview for music. Your browser might not be supported."
      );
      return false;
    }
  }, [audioEngineSetup]);

  useEffect(() => {
    if (musicGainNodeRef.current) {
      musicGainNodeRef.current.gain.value = musicVolume;
    }

    if (videoRef.current) {
      if (Math.abs(videoRef.current.volume - videoVolume) > 0.01) {
        videoRef.current.volume = videoVolume;
      }
    }
  }, [videoVolume, musicVolume, audioEngineSetup]);

  // Sync native video player volume control back to the app state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVolumeChange = () => {
      if (Math.abs(video.volume - videoVolume) > 0.01) {
        onVideoVolumeChange(video.volume);
      }
    };

    video.addEventListener("volumechange", handleVolumeChange);

    return () => {
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [blobUrl, onVideoVolumeChange, videoVolume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !blobUrl) return;

    const handleMetadata = () => {
      const d = video.duration || 0;
      setDuration(d);
      setInStart(0);
      setInEnd(d);
      setPlayhead(0);

      // Capture aspect ratio so we can make vertical videos taller / padded
      const vw = (video as HTMLVideoElement).videoWidth || 0;
      const vh = (video as HTMLVideoElement).videoHeight || 0;
      if (vw > 0 && vh > 0) {
        setVideoAspect(vw / vh);
      } else {
        setVideoAspect(null);
      }
    };

    video.addEventListener("loadedmetadata", handleMetadata, { once: true });
    return () => {
      video.removeEventListener("loadedmetadata", handleMetadata);
    };
  }, [blobUrl]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const f = input.files?.[0];

    // Clear so picking the same video again still fires onChange
    input.value = "";

    if (!f) return;
    resetStateForNewVideo();
    setFile(f);
  }

  async function onAudioPick(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const f = input.files?.[0];

    // Clear so picking the same audio again still fires onChange
    input.value = "";

    if (!f || !videoRef.current) return;

    if (!audioEngineSetup) {
      const success = await setupAudioEngine();
      if (!success) return;
    }

    setAudioFile(f);
    setAudioOffset(0);

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (!audioCtxRef.current) return;
      try {
        const buffer = await audioCtxRef.current.decodeAudioData(
          event.target!.result as ArrayBuffer
        );
        setAudioBuffer(buffer);
        if (isPlaying) {
          // restart music with new buffer if we're already playing
          await playMusic();
        }
      } catch (err) {
        console.error("Error decoding audio file:", err);
        alert("Could not process this audio file. Please try a different one.");
        setAudioFile(null);
        setAudioBuffer(null);
      }
    };
    reader.readAsArrayBuffer(f);
  }

  const disabled = !file || busy || duration <= 0;

  const stopMusic = useCallback(() => {
    if (musicSourceNodeRef.current) {
      musicSourceNodeRef.current.onended = null;
      try {
        musicSourceNodeRef.current.stop();
      } catch (e) {
        /* ignore */
      }
      musicSourceNodeRef.current = null;
    }
    musicShouldBePlaying.current = false;
  }, []);

  const playMusic = useCallback(async () => {
    stopMusic();
    if (
      !audioBuffer ||
      !audioCtxRef.current ||
      !videoRef.current ||
      !musicGainNodeRef.current
    ) {
      musicShouldBePlaying.current = false;
      return;
    }

    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(musicGainNodeRef.current);

    const videoTime = videoRef.current.currentTime;
    const offsetInMusicBuffer = videoTime - audioOffset;

    let started = false;
    if (offsetInMusicBuffer >= 0 && offsetInMusicBuffer < audioBuffer.duration) {
      source.start(0, offsetInMusicBuffer);
      musicSourceNodeRef.current = source;
      started = true;
    } else if (offsetInMusicBuffer < 0) {
      const delay = -offsetInMusicBuffer;
      source.start(audioCtxRef.current.currentTime + delay, 0);
      musicSourceNodeRef.current = source;
      started = true;
    }

    musicShouldBePlaying.current = started;
    if (started) {
      source.onended = () => {
        if (musicSourceNodeRef.current === source) {
          musicSourceNodeRef.current = null;
          musicShouldBePlaying.current = false;
        }
      };
    }
  }, [audioBuffer, audioOffset, stopMusic]);

  const handleSeeked = useCallback(async () => {
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }
    if (isPlaying && audioEngineSetup) {
      await playMusic();
    }
  }, [isPlaying, playMusic, audioEngineSetup]);

  const togglePlayPause = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    // If currently paused → start video + audio
    if (video.paused || video.ended) {
      let engineReady = audioEngineSetup;

      if (!engineReady && audioFile) {
        const success = await setupAudioEngine();
        if (!success) return;
        engineReady = true;
      }

      if (
        engineReady &&
        audioCtxRef.current &&
        audioCtxRef.current.state === "suspended"
      ) {
        await audioCtxRef.current.resume();
      }

      try {
        await video.play();
      } catch (err) {
        console.error("Failed to start video playback:", err);
        return;
      }

      setIsPlaying(true);

      if (engineReady) {
        await playMusic();
      }
    } else {
      // Currently playing → pause video + audio
      video.pause();
      setIsPlaying(false);
      if (audioEngineSetup) {
        stopMusic();
      }
    }
  }, [audioEngineSetup, audioFile, playMusic, setupAudioEngine, stopMusic]);

  const handleAudioDragEnd = useCallback(async () => {
    // After moving the frequency bar, if playback is active,
    // make sure both video and music are running together.
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }

    if (isPlaying && audioEngineSetup) {
      const video = videoRef.current;
      if (video && video.paused) {
        try {
          await video.play();
        } catch (err) {
          console.error("Failed to resume video after audio drag:", err);
        }
      }
      await playMusic();
    }
  }, [isPlaying, playMusic, audioEngineSetup]);

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(console.error);
    };
  }, []);

  // EXPORT FUNCTION START

  async function exportVideo() {
    if (!file) return;

    // Make sure the visible preview does NOT start playing when export begins
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = playhead; // keep position but don't play
    }
    setIsPlaying(false);
    stopMusic();

    const webCodecsAvailable = hasWebCodecsSupport();
    setBusy(true);
    setOutUrl(null);
    setProgress(0);
    setLog("");

    let resultBlob: Blob | null = null;
    let usedWebCodecs = false;

    try {
      // Decide if we can use the fast path:
      // We now support trims, speed ramps, and overlay music with WebCodecs.
      const canUseHardwareFast = webCodecsAvailable;

      if (canUseHardwareFast) {
        setLog("Using fast WebCodecs export (downscaled to max 1080p)...");
        try {
          const blob = await exportWithWebCodecs({
            file,
            inStart,
            inEnd,
            duration,
            speedEffects,
            audioFile,
            audioOffset,
            musicVolume,
            videoVolume,
            previewAudioBuffer: audioBuffer,
            onProgress: (value, stage) => {
              setProgress(value);
              if (stage) {
                setLog(stage);
              }
            },
            onLog: (msg) => {
              setLog((prev) => `${prev}\n${msg}`.slice(-1000));
            },
          });
          resultBlob = blob;
          usedWebCodecs = true;
        } catch (fastErr) {
          console.warn(
            "[INVERT CLIPS] Fast WebCodecs export failed, falling back to FFmpeg.",
            fastErr
          );
          setLog(
            "Fast WebCodecs export failed, falling back to classic export (slower)…"
          );
          usedWebCodecs = false;
          resultBlob = null;
        }
      }

      // Fallback: FFmpeg (slow but robust) – same as your previous working path
      if (!resultBlob) {
        setLog((prev) =>
          (prev ? prev + "\n" : "") + "Loading FFmpeg (slow path)…"
        );
        const ffmpeg = await getFFmpeg();

        const outName = "output.mp4";
        const A = Math.max(0, inStart);
        const B = Math.min(duration, inEnd);

        // --- Progress + log hooks ---
        ffmpeg.on("progress", ({ progress }) => {
          const p = typeof progress === "number" ? progress : 0;
          setProgress(Math.max(0, Math.min(1, p)));
        });

        ffmpeg.on("log", ({ message }) => {
          setLog((prev) => `${prev}\n${message}`.slice(-1000));
        });

        setLog((prev) =>
          (prev ? prev + "\n" : "") + "Writing input file(s) to memory…"
        );

        // Write main video file
        const videoBuffer = await file.arrayBuffer();
        await ffmpeg.writeFile("input.mp4", new Uint8Array(videoBuffer));

        // Optional extra audio to mix on top
        const hasExtraAudio = !!audioFile;
        if (audioFile) {
          const audioBuffer2 = await audioFile.arrayBuffer();
          await ffmpeg.writeFile("input.m4a", new Uint8Array(audioBuffer2));
        }

        setLog((prev) =>
          (prev ? prev + "\n" : "") +
          "Building FFmpeg command (segments + speed ramps)…"
        );

        type Segment = { start: number; end: number; factor: number };

        const effects = Array.isArray(speedEffects)
          ? [...speedEffects].sort((a, b) => a.start - b.start)
          : [];

        const segments: Segment[] = [];
        let cursor = A;

        for (const eff of effects) {
          const effStart = Math.max(A, eff.start);
          const effEnd = Math.min(B, eff.end);
          if (effEnd <= effStart) continue;

          if (cursor < effStart) {
            segments.push({ start: cursor, end: effStart, factor: 1.0 });
          }

          const factor =
            typeof eff.factor === "number" && eff.factor > 0 ? eff.factor : 1.0;
          segments.push({ start: effStart, end: effEnd, factor });
          cursor = effEnd;
        }

        if (cursor < B) {
          segments.push({ start: cursor, end: B, factor: 1.0 });
        }

        if (segments.length === 0) {
          segments.push({ start: A, end: B, factor: 1.0 });
        }

        const buildAtTempoChain = (factor: number): string => {
          let remaining = factor || 1.0;
          const parts: string[] = [];

          while (remaining > 2.0 + 1e-3) {
            parts.push("atempo=2.0");
            remaining /= 2.0;
          }

          while (remaining < 0.5 - 1e-3) {
            parts.push("atempo=0.5");
            remaining /= 0.5;
          }

          const final = Math.min(2.0, Math.max(0.5, remaining));
          if (Math.abs(final - 1.0) > 1e-3) {
            parts.push(`atempo=${final.toFixed(3)}`);
          }

          return parts.join(",");
        };

        const filterParts: string[] = [];
        const videoLabels: string[] = [];
        const audioLabels: string[] = [];

        segments.forEach((seg, idx) => {
          const vLabel = `v${idx}`;
          const aLabel = `a${idx}`;
          videoLabels.push(`[${vLabel}]`);
          audioLabels.push(`[${aLabel}]`);

          const vFactor = seg.factor || 1.0;

          filterParts.push(
            `[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS,setpts=PTS/${vFactor.toFixed(
              6
            )}[${vLabel}]`
          );

          const tempoChain = buildAtTempoChain(seg.factor || 1.0);
          let audioChain = `atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS`;
          if (tempoChain) {
            audioChain += `,${tempoChain}`;
          }
          filterParts.push(`[0:a]${audioChain}[${aLabel}]`);
        });

        filterParts.push(
          `${videoLabels.join("")}concat=n=${segments.length}:v=1:a=0[vcat]`
        );
        filterParts.push(
          `${audioLabels.join("")}concat=n=${segments.length}:v=0:a=1[acat]`
        );

        if (hasExtraAudio) {
          filterParts.push(
            `[acat][1:a]amix=inputs=2:duration=first:dropout_transition=0[aout]`
          );
        } else {
          filterParts.push("[acat]anull[aout]");
        }

        // Fix: Define `filterComplex` by joining `filterParts`
        const filterComplex = filterParts.join(';');

        const args: string[] = [];
        args.push("-i", "input.mp4");
        if (hasExtraAudio) {
          args.push("-i", "input.m4a");
        }

        args.push(
          "-filter_complex",
          filterComplex,
          "-map",
          "[vcat]",
          "-map",
          "[aout]",
          "-c:v",
          "libx264",
          "-c:a",
          "aac",
          "-preset",
          "veryfast",
          "-movflags",
          "faststart",
          outName
        );

        setLog((prev) =>
          (prev ? prev + "\n" : "") + `Executing: ffmpeg ${args.join(" ")}`
        );
        await ffmpeg.exec(args);

        setLog((prev) =>
          (prev ? prev + "\n" : "") + "Done! Reading file from memory..."
        );
        const data = await ffmpeg.readFile(outName);
        resultBlob = new Blob(
          [data instanceof Uint8Array ? data : new Uint8Array(data as any)],
          { type: "video/mp4" }
        );
        usedWebCodecs = false;
      }

      if (!resultBlob) {
        throw new Error("Export failed (no result blob).");
      }

      const url = URL.createObjectURL(resultBlob);
      setOutUrl(url);

      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = "invert-edit.webm";
        if (!usedWebCodecs) {
          a.download = "invert-edit.mp4";
        }
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (downloadErr) {
        console.warn(
          "Automatic download failed, user can tap the Download button instead.",
          downloadErr
        );
      }

      setProgress(1);
      setLog(
        usedWebCodecs
          ? "Export complete (fast WebCodecs, 1080p)."
          : "Export complete (FFmpeg fallback, slower)."
      );

      // Save original clip (not the export) to recent clips – now without size limit
      try {
        const [thumbnailUrl, dataUrl] = await Promise.all([
          generateThumbnail(file),
          fileToDataUrl(file),
        ]);
        const newClip: RecentClip = {
          id: Date.now().toString(),
          name: file.name,
          dataUrl,
          thumbnailUrl,
        };
        onSetRecentClips((prev) =>
          [newClip, ...prev.filter((c) => c.id !== newClip.id)].slice(
            0,
            RECENT_CLIPS_LIMIT
          )
        );
      } catch (clipError) {
        console.error("Could not save to recent clips:", clipError);
      }
    } catch (err: any) {
      console.error(err);
      setLog(`Error: ${err?.message || "Export failed."}`);
      alert(err?.message || "Export failed.");
    } finally {
      setBusy(false);
      // Extra safety: make sure preview video stays paused after export
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setIsPlaying(false);
    }
  }
  // EXPORT FUNCTION END

  const handleLoadRecent = async (clip: RecentClip) => {
    try {
      const loadedFile = await dataUrlToFile(clip.dataUrl, clip.name);
      resetStateForNewVideo();
      setFile(loadedFile);
    } catch (error) {
      console.error("Failed to load recent clip:", error);
      alert("Could not load the selected clip.");
    }
  };

  const addSpeedEffect = () => {
    if (speedEffects.length >= 2 || duration <= 0) return;

    const newColor = "#f97316"; // Orange

    const sortedEffects = [...speedEffects].sort((a, b) => a.start - b.start);
    let newStart = inStart;
    let newEnd = inStart + duration * 0.2;

    if (sortedEffects.length > 0) {
      const lastEffect = sortedEffects[sortedEffects.length - 1];
      newStart = Math.min(inEnd - 0.2, lastEffect.end + 0.1);
      newEnd = Math.min(inEnd, newStart + duration * 0.2);
    }

    if (newStart >= newEnd && sortedEffects.length > 0) {
      const firstEffect = sortedEffects[0];
      newEnd = Math.max(inStart, firstEffect.start - 0.1);
      newStart = Math.max(inStart, newEnd - duration * 0.2);
    }

    if (newStart >= newEnd) return;

    const newEffect = {
      id: Date.now(),
      start: newStart,
      end: newEnd,
      factor: 1.0,
      color: newColor,
    };
    setSpeedEffects((prev) =>
      [...prev, newEffect].sort((a, b) => a.start - b.start)
    );
  };

  const deleteSpeedEffect = (idToDelete: number) => {
    setSpeedEffects((prev) => {
      const newEffects = prev.filter((e) => e.id !== idToDelete);
      if (newEffects.length === 0) {
        setShowSpeedControl(false);
      }
      return newEffects;
    });
  };

  const RecordingUI = (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <video ref={liveVideoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
      <div className="absolute bottom-10">
          <button
              onClick={stopRecording}
              className="w-20 h-20 bg-red-600 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Stop recording"
          >
            <div className="w-8 h-8 bg-white rounded-md"></div> {/* Stop icon */}
          </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
      {isRecording && RecordingUI}
      <div className="w-full max-w-4xl mx-auto">
        <header className="w-full my-8 relative">
          <div className="w-full max-w-4xl mx-auto relative flex items-center justify-center">
            <button
              onClick={onClose}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 p-2 -ml-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="logo-block text-left leading-none">
              <Logo variant="tv" className="text-[70px] md:text-[80px]" />
            </div>
          </div>
        </header>

        {!file ? (
          <div className="flex flex-col items-center justify-center pt-8 pb-4">
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={onPick}
            />

            <p className="text-neutral-400 text-center max-w-xs mt-1 mb-6">
              Record a new clip or choose an existing one to start editing.
            </p>
            <button
              onClick={startRecording}
              className="w-28 h-28 rounded-full bg-[#c52323] flex items-center justify-center mb-6 shadow-lg transition-transform transform hover:scale-105"
              aria-label="Start recording"
            >
              <VideoCameraIcon className="w-14 h-14 text-white" />
            </button>

            <div className="w-full max-w-xs text-center">
              <div className="relative flex items-center my-4">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
                <div className="flex-grow border-t border-gray-600"></div>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full px-6 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 font-bold transition"
              >
                Choose Existing File
              </button>
            </div>

            {recentClips.length > 0 && (
              <div className="w-full max-w-xs mt-4 flex justify-center gap-2">
                {recentClips.slice(0, 4).map((clip) => (
                  <button
                    key={clip.id}
                    onClick={() => handleLoadRecent(clip)}
                    className="group w-16 h-16 rounded-md bg-neutral-800 overflow-hidden relative focus:outline-none focus:ring-2 focus:ring-[#c52323]"
                  >
                    <img
                      src={clip.thumbnailUrl}
                      alt={clip.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayArrowIcon className="w-5 h-5 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div
              className={`max-w-3xl mx-auto mb-0 ${
                videoAspect !== null && videoAspect < 1 ? "px-5" : ""
              }`}
            >
              <video
                ref={videoRef}
                src={blobUrl}
                className={`w-full rounded-xl bg-black ${
                  videoAspect !== null && videoAspect < 1
                    ? "aspect-[9/16]"
                    : "aspect-video"
                }`}
                onSeeked={handleSeeked}
                onEnded={() => {
                  setIsPlaying(false);
                  if (audioEngineSetup) {
                    stopMusic();
                  }
                }}
                onTimeUpdate={(e) => {
                  const video = e.target as HTMLVideoElement;
                  const currentTime = video.currentTime;
                  setPlayhead(currentTime);

                  // Live speed-ramp preview: adjust playbackRate based on current time
                  let targetRate = 1.0;
                  for (const effect of speedEffects) {
                    if (
                      currentTime >= effect.start &&
                      currentTime < effect.end
                    ) {
                      targetRate = effect.factor || 1.0;
                      break;
                    }
                  }
                  if (!isFinite(targetRate) || targetRate <= 0) {
                    targetRate = 1.0;
                  }
                  if (video.playbackRate !== targetRate) {
                    video.playbackRate = targetRate;
                  }

                  // Only auto-start music if the video is actually playing
                  if (!video.paused && audioBuffer && !busy) {
                    const shouldBeAudible =
                      currentTime >= audioOffset &&
                      currentTime <
                        audioOffset + audioBuffer.duration;
                    if (shouldBeAudible && !musicShouldBePlaying.current) {
                      playMusic();
                    }
                  }
                }}
                onClick={togglePlayPause}
              />
              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg.white text-black shadow-md bg-white hover:bg-gray-200 active:scale-[0.96] transition"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  {isPlaying ? (
                    <PauseIcon className="w-5 h-5" />
                  ) : (
                    <PlayIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {duration > 0 && (
                  <div className="bg-neutral-800 rounded-xl p-4">
                    {audioFile && audioBuffer && (
                      <div className="mb-3">
                        <div className="flex items.end gap-4 mb-3">
                          <div className="flex-grow grid grid-cols-2 gap-x-4">
                            <div>
                              <label className="text-xs text-neutral-400">
                                Video Audio
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={videoVolume}
                                onChange={(e) =>
                                  onVideoVolumeChange(
                                    parseFloat(e.target.value)
                                  )
                                }
                                className="w-full h-1 bg-neutral-600 rounded-full appearance-none accent-white/70"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-neutral-400">
                                Music Volume
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={musicVolume}
                                onChange={(e) =>
                                  setMusicVolume(
                                    parseFloat(e.target.value)
                                  )
                                }
                                className="w-full h-1 bg-neutral-600 rounded-full appearance-none accent-white/70"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setAudioFile(null);
                              setAudioBuffer(null);
                              stopMusic();
                              // Clear the hidden audio input so the same song can be picked again
                              if (audioFileRef.current) {
                                audioFileRef.current.value = "";
                              }
                            }}
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 shrink-0"
                          >
                            <TrashIcon /> Remove
                          </button>
                        </div>
                        <AudioTimeline
                          audioBuffer={audioBuffer}
                          videoDuration={duration}
                          trimStart={inStart}
                          trimEnd={inEnd}
                          offset={audioOffset}
                          onOffsetChange={setAudioOffset}
                          onDragEnd={handleAudioDragEnd}
                        />
                        <style>{`
                          input[type="range"].accent-white\\/70::-webkit-slider-thumb {
                              -webkit-appearance: none; appearance: none;
                              width: 8px; height: 16px; background: #d4d4d4;
                              border-radius: 2px; cursor: pointer; margin-top: -7px;
                          }
                          input[type="range"].accent-white\\/70::-moz-range-thumb {
                              width: 8px; height: 16px; background: #d4d4d4;
                              border: none; border-radius: 2px; cursor: pointer;
                          }
                        `}</style>
                      </div>
                    )}
                    <VideoTimeline
                      file={file}
                      duration={duration}
                      inStart={inStart}
                      inEnd={inEnd}
                      effects={speedEffects}
                      playhead={playhead}
                      onTrimChange={({ inStart, inEnd }) => {
                        setInStart(inStart);
                        setInEnd(inEnd);
                      }}
                      onEffectChange={setSpeedEffects}
                      onPlayheadChange={(t) => {
                        setPlayhead(t);
                        if (videoRef.current) {
                          videoRef.current.currentTime = t;
                        }
                      }}
                      height={84}
                      thumbs={12}
                      showEffectHandles={showSpeedControl}
                    />
                    <div className="flex justify-end mt-1 text-xs text-neutral-300">
                      <span>
                        Length: {(inEnd - inStart).toFixed(2)}s
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {showSpeedControl && (
                <div className="bg-neutral-800 rounded-xl p-4 mt-2">
                  {speedEffects.map((effect, index) => (
                    <div
                      key={effect.id}
                      className="flex items-center gap-3 text-white mb-2"
                    >
                      <div className="font-semibold shrink-0 flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-sm"
                          style={{ backgroundColor: effect.color }}
                        ></div>
                        <span className="text-sm">
                          Speed {index + 1}
                        </span>
                      </div>
                      <SpeedSlider
                        value={effect.factor}
                        onChange={(newFactor) => {
                          setSpeedEffects((prev) =>
                            prev.map((e) =>
                              e.id === effect.id
                                ? { ...e, factor: newFactor }
                                : e
                            )
                          );
                        }}
                      />
                      <span className="text-sm font-mono w-16 text-center">
                        {effect.factor.toFixed(2)}x
                      </span>
                      <button
                        onClick={() => deleteSpeedEffect(effect.id)}
                        title="Remove speed ramp"
                        className="group shrink-0"
                      >
                        <DeleteEffectIcon />
                      </button>
                    </div>
                  ))}

                  {speedEffects.length > 0 &&
                    speedEffects.length < 2 && (
                      <div className="mt-3 text-center">
                        <button
                          onClick={addSpeedEffect}
                          className="text-sm text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          + Add another speed ramp
                        </button>
                      </div>
                    )}
                </div>
              )}

              <div className="flex justify-center items-end gap-10 mt-8">
                <button
                  onClick={() => audioFileRef.current?.click()}
                  className="flex flex-col items-center gap-1 text-white"
                >
                  <input
                    ref={audioFileRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={onAudioPick}
                  />
               

                  <div className="h-12 w-12 flex items-center justify-center">
                    <MusicNoteIcon
                      className={`w-9 h-9 transition-colors ${
                        audioFile
                          ? "text-[#c52323]"
                          : "text-white"
                      }`}
                      style={{ transform: "translateY(5px)" }}
                    />
                  </div>
                  <span className="text-xs font-semibold tracking-wide">
                    Add Music
                  </span>
                </button>
                <button
                  onClick={() => {
                    if (
                      !showSpeedControl &&
                      speedEffects.length === 0 &&
                      duration > 0
                    ) {
                      const newStart = duration * 0.2;
                      const newEnd = duration * 0.4;
                      const newEffect = {
                        id: Date.now(),
                        start: newStart,
                        end: newEnd,
                        factor: 1.0,
                        color: "#eab308",
                      }; // Yellow
                      setSpeedEffects([newEffect]);
                    }
                    setShowSpeedControl((prev) => !prev);
                  }}
                  className="relative flex flex-col items-center gap-1 transition-colors textWhite"
                >
                  <div className="h-12 w-12 flex items-center justify-center">
                    <SpeedometerIcon
                      className={`w-11 h-11 transition-colors ${
                        showSpeedControl
                          ? "text-[#c52323]"
                          : "text-white"
                      }`}
                      style={{ transform: "translateY(12px)" }}
                    />
                  </div>
                  <span className="text-xs font-semibold tracking-wide">
                    Speed Control
                  </span>
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center gap-1 transition-colors text-white hover:text-neutral-300"
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={onPick}
                  />
                  <div className="h-12 w-12 flex items-center justify-center">
                    <VideoCameraIcon
                      className="w-11 h-11"
                      style={{ transform: "translateY(8px)" }}
                    />
                  </div>
                  <span className="text-xs font-semibold tracking-wide">
                    Change Video
                  </span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                <button
                  disabled={disabled}
                  onClick={exportVideo}
                  className="px-6 py-2 rounded-lg bg-[#c52323] disabled:bg-gray-600 text-white hover:bg-[#a91f1f] active:scale-[0.98] font-bold text-base transition"
                >
                  {busy ? "Exporting…" : "Export Video"}
                </button>
              </div>

              {busy && (
                <div className="space-y-2 mt-4">
                  <div className="w-full bg-neutral-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full"
                      style={{ width: `${progress * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs font-mono opacity-70 text-white truncate">
                    {log}
                  </div>
                </div>
              )}

              {!busy && log && (
                <div className="text-xs font-mono opacity-70 text-white mt-4">
                  {log}
                </div>
              )}

              {outUrl && (
                <div className="space-y-3 mt-6">
                  <h2 className="text-lg font-semibold">Result</h2>
                  <video
                    controls
                    className="w-full max-w-2xl mx-auto rounded-xl"
                    src={outUrl}
                  />
                  <a
                    download={`invert-edit.mp4`}
                    href={outUrl}
                    className="inline-block px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-neutral-200"
                  >
                    Download Video
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
