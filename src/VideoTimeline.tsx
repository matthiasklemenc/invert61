// C:\Users\user\Desktop\invert\build\VideoTimeline.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";

export type SpeedEffect = {
  id: number;
  start: number;
  end: number;
  factor: number;
  color: string;
};

type Props = {
  file: File;
  duration: number;
  inStart: number;
  inEnd: number;
  effects: SpeedEffect[];
  playhead: number;
  onTrimChange: (t: { inStart: number; inEnd: number }) => void;
  onEffectChange: (effects: SpeedEffect[]) => void;
  onPlayheadChange: (t: number) => void;
  height?: number;
  thumbs?: number;
  showEffectHandles?: boolean;
};

type DragKey =
  | "inStart"
  | "inEnd"
  | "playhead"
  | `effectStart-${number}`
  | `effectEnd-${number}`
  | null;

function TrimHandle({
  x,
  color,
  label,
  onPointerDown,
  position = "bottom",
}: {
  x: number;
  color: string;
  label: string;
  onPointerDown: (e: React.PointerEvent) => void;
  position?: "top" | "bottom";
}) {
  const isOut = label === "OUT"; // red handle
  const circleLeft = isOut ? -4 : 1;  // red 5px further left than green
  const circleBottom = -4;            // moved 8px up from previous -12

  return (
    <div
      className="absolute -top-1 bottom-[-4px] cursor-ew-resize"
      style={{ left: x - 6, width: 12, zIndex: 20 }}
      onPointerDown={onPointerDown}
      title={label}
    >
      {/* vertical bar */}
      <div
        className="absolute top-0 h-full rounded-sm shadow"
        style={{ left: 4, width: 4, background: color, opacity: 0.95 }}
      />
      {/* label bubble */}
      <div className="absolute -top-5 px-1 py-0.5 text-[10px] rounded bg-black/80 text-white">
        {label}
      </div>
      {/* circle handle */}
      <div
        className="absolute w-5 h-5 rounded-full shadow-md ring-2 ring-white/80"
        style={{ left: circleLeft, bottom: circleBottom, background: color }}
      />
    </div>
  );
}

function EffectHandle({
  x,
  color,
  onPointerDown,
  position,
}: {
  x: number;
  color: string;
  onPointerDown: (e: React.PointerEvent) => void;
  position: "top" | "bottom";
}) {
  const isTop = position === "top";
  return (
    <div
      className="absolute top-0 bottom-0 cursor-ew-resize group"
      style={{ left: x - 8, width: 16, zIndex: 10 }}
      onPointerDown={onPointerDown}
      title={isTop ? "Effect Start" : "Effect End"}
    >
      {/* small bar */}
      <div
        className="absolute w-[3px] rounded-sm"
        style={{
          left: 6,
          height: 16,
          backgroundColor: color,
          ...(isTop ? { top: 2 } : { bottom: 2 }),
        }}
      />
      {/* tiny circle */}
      <div
        className="absolute w-3 h-3 rounded-full shadow-md"
        style={{
          left: 5,
          backgroundColor: color,
          ...(isTop ? { top: 0 } : { bottom: 0 }),
        }}
      />
    </div>
  );
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export default function VideoTimeline({
  file,
  duration,
  inStart,
  inEnd,
  effects,
  playhead,
  onTrimChange,
  onEffectChange,
  onPlayheadChange,
  height = 84,
  thumbs = 20,
  showEffectHandles = false,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [thumbUrls, setThumbUrls] = useState<string[]>([]);
  const [drag, setDrag] = useState<DragKey>(null);

  const url = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);

  // Generate thumbnails from the video
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const v = document.createElement("video");
        v.src = url;
        v.muted = true;
        (v as any).playsInline = true;

        await new Promise<void>((resolve, reject) => {
          v.onloadedmetadata = () => resolve();
          v.onerror = () => reject(new Error("Failed to load video metadata"));
        });

        const d = Math.max(0.001, v.duration || duration || 1);
        const W = Math.round((height * 16) / 9);
        const H = height;
        const c = document.createElement("canvas");
        c.width = W;
        c.height = H;
        const ctx = c.getContext("2d");
        if (!ctx) return;

        const urls: string[] = [];

        for (let i = 0; i < thumbs; i++) {
          const t = (d * (i + 0.5)) / thumbs;
          v.currentTime = t;
          await new Promise<void>((resolve) => {
            v.onseeked = () => resolve();
          });
          ctx.drawImage(v, 0, 0, W, H);
          urls.push(c.toDataURL("image/jpeg", 0.7));
        }

        if (!cancelled) {
          setThumbUrls(urls);
        }
      } catch (err) {
        console.error("Failed generating thumbnails:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, duration, height, thumbs]);

  const timeToPx = (t: number) => {
    if (!wrapRef.current) return 0;
    const rect = wrapRef.current.getBoundingClientRect();
    const d = Math.max(0.0001, duration || 0.0001);
    return (clamp(t, 0, d) / d) * rect.width;
  };

  const pxToTime = (x: number) => {
    if (!wrapRef.current) return 0;
    const rect = wrapRef.current.getBoundingClientRect();
    const d = Math.max(0.0001, duration || 0.0001);
    const ratio = clamp(x, 0, rect.width) / rect.width;
    return ratio * d;
  };

  function onHandlePointerDown(e: React.PointerEvent, key: DragKey) {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    setDrag(key);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag || !wrapRef.current) return;

    const rect = wrapRef.current.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    const t = pxToTime(x);

    if (drag === "playhead") {
      onPlayheadChange(t);
      return;
    }

    if (drag === "inStart") {
      const newInStart = clamp(t, 0, inEnd - 0.05);
      onTrimChange({ inStart: newInStart, inEnd });
      if (playhead < newInStart) {
        onPlayheadChange(newInStart);
      }
      return;
    }

    if (drag === "inEnd") {
      const newInEnd = clamp(t, inStart + 0.05, duration);
      onTrimChange({ inStart, inEnd: newInEnd });
      if (playhead > newInEnd) {
        onPlayheadChange(newInEnd);
      }
      return;
    }

    if (typeof drag === "string" && drag.startsWith("effectStart-")) {
      const id = parseInt(drag.split("-")[1], 10);
      const sortedEffects = [...effects].sort((a, b) => a.start - b.start);
      const draggedIndex = sortedEffects.findIndex((eff) => eff.id === id);
      if (draggedIndex === -1) return;

      const lowerBound =
        draggedIndex > 0
          ? sortedEffects[draggedIndex - 1].end + 0.01
          : inStart;
      const newStart = clamp(
        t,
        lowerBound,
        sortedEffects[draggedIndex].end - 0.01
      );

      const newEffects = effects.map((eff) =>
        eff.id === id ? { ...eff, start: newStart } : eff
      );
      onEffectChange(newEffects);
      return;
    }

    if (typeof drag === "string" && drag.startsWith("effectEnd-")) {
      const id = parseInt(drag.split("-")[1], 10);
      const sortedEffects = [...effects].sort((a, b) => a.start - b.start);
      const draggedIndex = sortedEffects.findIndex((eff) => eff.id === id);
      if (draggedIndex === -1) return;

      const upperBound =
        draggedIndex < sortedEffects.length - 1
          ? sortedEffects[draggedIndex + 1].start - 0.01
          : inEnd;
      const newEnd = clamp(
        t,
        sortedEffects[draggedIndex].start + 0.01,
        upperBound
      );

      const newEffects = effects.map((eff) =>
        eff.id === id ? { ...eff, end: newEnd } : eff
      );
      onEffectChange(newEffects);
      return;
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    setDrag(null);
  }

  function onContainerPointerDown(e: React.PointerEvent) {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = pxToTime(x);
    onPlayheadChange(t);
    setDrag("playhead");
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }

  return (
    <div className="space-y-2 select-none">
      <div
        ref={wrapRef}
        className="relative w-full rounded-lg overflow-hidden touch-none"
        style={{ height }}
        onPointerDown={onContainerPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Thumbnail strip */}
        <div className="absolute inset-0 flex">
          {thumbUrls.length > 0 ? (
            thumbUrls.map((u, i) => (
              <img
                key={i}
                src={u}
                alt=""
                className="h-full object-cover flex-1"
              />
            ))
          ) : (
            <div className="w-full h-full animate-pulse bg-neutral-700" />
          )}
        </div>

        {/* Outside trim masks */}
        <div
          className="absolute top-0 bottom-0 bg-black/60"
          style={{ left: 0, width: timeToPx(inStart) }}
        />
        <div
          className="absolute top-0 bottom-0 bg-black/60"
          style={{ left: timeToPx(inEnd), right: 0 }}
        />

        {/* Effect highlights */}
        {showEffectHandles &&
          effects.map((effect) => (
            <div
              key={effect.id}
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: timeToPx(effect.start),
                width: timeToPx(effect.end) - timeToPx(effect.start),
                backgroundColor: `${effect.color}40`,
              }}
            />
          ))}

        {/* IN / OUT handles with adjusted circles */}
        <TrimHandle
          x={timeToPx(inStart)}
          color="#22c55e"
          label="IN"
          position="bottom"
          onPointerDown={(e) => onHandlePointerDown(e, "inStart")}
        />
        <TrimHandle
          x={timeToPx(inEnd)}
          color="#ef4444"
          label="OUT"
          position="top"
          onPointerDown={(e) => onHandlePointerDown(e, "inEnd")}
        />

        {/* Effect handles */}
        {showEffectHandles &&
          effects.map((effect) => (
            <React.Fragment key={effect.id}>
              <EffectHandle
                x={timeToPx(effect.start)}
                color={effect.color}
                onPointerDown={(e) =>
                  onHandlePointerDown(e, `effectStart-${effect.id}`)
                }
                position="top"
              />
              <EffectHandle
                x={timeToPx(effect.end)}
                color={effect.color}
                onPointerDown={(e) =>
                  onHandlePointerDown(e, `effectEnd-${effect.id}`)
                }
                position="bottom"
              />
            </React.Fragment>
          ))}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 cursor-ew-resize group"
          style={{ left: timeToPx(playhead) - 10, width: 20, zIndex: 21 }}
          onPointerDown={(e) => onHandlePointerDown(e, "playhead")}
        >
          {/* Circle handle */}
          <div className="absolute w-5 h-5 rounded-full bg-blue-400 left-1/2 -translate-x-1/2 -top-[10px] group-hover:scale-110 transition-transform ring-2 ring-white/75 shadow-lg" />
          {/* Vertical line */}
          <div className="absolute top-0 bottom-0 w-1 left-1/2 -translate-x-1/2 bg-blue-400" />
        </div>

        {/* Playhead time label */}
        <div
          className="absolute -top-6 px-1 py-0.5 text-[10px] rounded bg-black/80 text-white pointer-events-none"
          style={{ left: timeToPx(playhead) - 12 }}
        >
          {playhead.toFixed(2)}s
        </div>
      </div>

      {/* Text summary */}
      <div className="text-xs text-neutral-300 flex gap-4 flex-wrap">
        <span>IN {inStart.toFixed(2)}s</span>
        <span>OUT {inEnd.toFixed(2)}s</span>
        {showEffectHandles &&
          effects.map((eff, idx) => (
            <span key={eff.id}>
              FX-{idx + 1} {eff.start.toFixed(2)}–{eff.end.toFixed(2)}s
            </span>
          ))}
      </div>
    </div>
  );
}
