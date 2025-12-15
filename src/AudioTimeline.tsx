// C:\Users\user\Desktop\invert\build\AudioTimeline.tsx

import React, { useEffect, useRef, useState, useCallback } from "react";

type Props = {
  audioBuffer: AudioBuffer;
  videoDuration: number;
  trimStart: number;
  trimEnd: number;
  offset: number;
  onOffsetChange: (offset: number) => void;
  onDragEnd: () => void;
};

const AudioTimeline: React.FC<Props> = ({
  audioBuffer,
  videoDuration,
  trimStart,
  trimEnd,
  offset,
  onOffsetChange,
  onDragEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [timelineWidth, setTimelineWidth] = useState<number>(0);

  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setTimelineWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const pxPerSec = videoDuration > 0 ? timelineWidth / videoDuration : 0;

  // Fully detached audio: waveform length is proportional to audio duration vs full video
  const waveformWidth =
    audioBuffer && videoDuration > 0
      ? (audioBuffer.duration / videoDuration) * timelineWidth
      : 0;

  const leftPosition = pxPerSec * offset;

  // Draw waveform on canvas – rerun when buffer OR sizes change
  useEffect(() => {
    if (!canvasRef.current || !audioBuffer || !timelineWidth || !waveformWidth) return;

    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;

    const displayWidth = Math.max(1, Math.round(waveformWidth));
    const displayHeight = 64;

    // Set canvas size in device pixels for crisp rendering
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = displayWidth;
    const height = displayHeight;

    ctx.clearRect(0, 0, width, height);

    const channelData = audioBuffer.getChannelData(0);
    const samplesPerPixel = Math.max(1, Math.floor(channelData.length / width));

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Waveform color (dark grey)
    ctx.strokeStyle = "#4b5563"; // neutral-600
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      const start = x * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, channelData.length);
      let min = 1.0;
      let max = -1.0;

      for (let i = start; i < end; i++) {
        const v = channelData[i];
        if (v < min) min = v;
        if (v > max) max = v;
      }

      const y1 = ((1 - min) * 0.5) * height;
      const y2 = ((1 - max) * 0.5) * height;

      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
    }

    ctx.stroke();
  }, [audioBuffer, timelineWidth, waveformWidth]);

  // Clamp offset: completely independent of trimStart / trimEnd
  const clampOffset = useCallback(
    (rawOffset: number) => {
      if (!audioBuffer || videoDuration <= 0) return 0;
      const audioDuration = audioBuffer.duration;

      // music can start fully before the video and end fully after
      const minOffset = -audioDuration;
      const maxOffset = videoDuration;

      return Math.min(Math.max(rawOffset, minOffset), maxOffset);
    },
    [audioBuffer, videoDuration]
  );

  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!timelineWidth || !audioBuffer) return;

    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offset;

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !timelineWidth || !audioBuffer) return;

    const dx = e.clientX - dragStartXRef.current;
    const deltaSeconds = pxPerSec > 0 ? dx / pxPerSec : 0;
    const newOffset = clampOffset(dragStartOffsetRef.current + deltaSeconds);

    onOffsetChange(newOffset);
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    onDragEnd();
  };

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative h-16 bg-white rounded-lg overflow-hidden border border-neutral-800"
      >
        {/* Slight darkening outside trim just as a visual hint, but NOT affecting drag logic */}
        {videoDuration > 0 && (
          <>
            <div
              className="absolute top-0 bottom-0 left-0 bg-black/10 pointer-events-none"
              style={{
                width: `${(trimStart / (videoDuration || 1)) * 100}%`,
              }}
            />
            <div
              className="absolute top-0 bottom-0 right-0 bg-black/10 pointer-events-none"
              style={{
                width: `${((videoDuration - trimEnd) / (videoDuration || 1)) * 100}%`,
              }}
            />
          </>
        )}

        {/* Central axis line */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-neutral-300" />
        </div>

        {/* Waveform strip – draggable, independent from video playhead */}
        {audioBuffer && waveformWidth > 0 && (
          <div
            className="absolute top-0 h-full cursor-grab active:cursor-grabbing z-10"
            style={{
              width: `${waveformWidth}px`,
              transform: `translateX(${leftPosition}px)`,
              touchAction: "none",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onPointerLeave={finishDrag}
          >
            <canvas ref={canvasRef} />
          </div>
        )}
      </div>
      <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
        <span>Music start: {offset.toFixed(2)}s</span>
        <span>Length: {audioBuffer?.duration.toFixed(2) ?? "0.00"}s</span>
      </div>
    </div>
  );
};

export default AudioTimeline;
