// C:\Users\user\Desktop\invert\build\EqualizerModal.tsx

import React, { useMemo, useState } from 'react';

type EqKey = '60' | '230' | '910' | '3000' | '14000';

export default function EqualizerModal(props: {
  bands: { freq: number; key: EqKey; label: string; gain: number }[];
  onChangeGain: (k: EqKey, gainDb: number) => void;
  onClose: () => void;

  presets: { id: string; name: string; gains: Record<EqKey, number> }[];
  onSavePreset: (name: string) => void;
  onLoadPreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
}) {
  const { bands, onChangeGain, onClose, presets, onSavePreset, onLoadPreset, onDeletePreset } = props;
  const [presetName, setPresetName] = useState('');

  // Visual slider height (px). Because the input is rotated -90°, its WIDTH = visual height.
  const SLIDER_PX = 150;

  // Rail (colored fill) width
  const RAIL_W = 6;

  // Tick visuals
  const CENTER_GAP = 8;
  const CENTER_TICK = 12;
  const HALF_TICK = 4;
  const TICK_COUNT = 6;
  const STEP_PX = SLIDER_PX / (TICK_COUNT * 2);

  const upDownTops = useMemo(() => {
    // Center of the slider in pixels
    const center = SLIDER_PX / 2;

    // Safety: if something ever passes 0 or NaN for SLIDER_PX,
    // fall back to 0 to avoid Infinity/NaN layout bugs.
    const safeCenter = Number.isFinite(center) ? center : 0;

    const ups: number[] = [];
    const downs: number[] = [];
    for (let i = 1; i <= TICK_COUNT; i++) {
      ups.push(safeCenter - i * STEP_PX);
      downs.push(safeCenter + i * STEP_PX);
    }
    return { ups, downs, center: safeCenter };
  }, [SLIDER_PX]);

  // Helper to compute the colored fill rect for a given gain
  const fillForGain = (gain: number) => {
    const half = SLIDER_PX / 2; // 0 dB center
    const extent = Math.min(half, (Math.abs(gain) / 12) * half); // px from center
    const top = gain > 0 ? half - extent : half;
    const height = gain === 0 ? 0 : extent;
    const color = gain > 0 ? '#c52323' : gain < 0 ? '#265c7e' : 'transparent';
    return { top, height, color, half };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-3xl rounded-xl overflow-hidden bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
          <h2 className="text-gray-100 font-semibold">Equalizer</h2>
          <button
            className="px-3 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Equalizer body with brushed metal background */}
        <div className="p-4 metal-bg">
          {/* 5-column grid so all sliders fit on mobile */}
          <div
            className="grid grid-cols-5 gap-1 sm:gap-2 md:gap-3 justify-items-center items-end w-full"
            style={{ minHeight: SLIDER_PX }}
          >
            {bands.map(({ key, label, gain }) => {
              const { top, height, color } = fillForGain(gain);

              return (
                <div key={key} className="flex flex-col items-center gap-2">
                  {/* Slider rail wrapper (relative for tick marks and fill) */}
                  <div className="relative flex items-center" style={{ height: SLIDER_PX }}>
                    {/* Center (0 dB) ticks */}
                    <div
                      className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-[2px] bg-gray-300 rounded"
                      style={{ width: CENTER_TICK, left: `calc(50% - ${CENTER_GAP}px - ${CENTER_TICK}px)` }}
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-[2px] bg-gray-300 rounded"
                      style={{ width: CENTER_TICK, left: `calc(50% + ${CENTER_GAP}px)` }}
                      aria-hidden
                    />

                    {/* 6 up + 6 down ticks (shorter) */}
                    {upDownTops.ups.map((t, i) => (
                      <React.Fragment key={`up-${i}`}>
                        <div
                          className="pointer-events-none absolute h-[2px] bg-gray-400/80 rounded"
                          style={{
                            width: HALF_TICK,
                            top: t,
                            left: `calc(50% - ${CENTER_GAP}px - ${HALF_TICK}px)`,
                            transform: 'translateY(-50%)',
                          }}
                          aria-hidden
                        />
                        <div
                          className="pointer-events-none absolute h-[2px] bg-gray-400/80 rounded"
                          style={{
                            width: HALF_TICK,
                            top: t,
                            left: `calc(50% + ${CENTER_GAP}px)`,
                            transform: 'translateY(-50%)',
                          }}
                          aria-hidden
                        />
                      </React.Fragment>
                    ))}
                    {upDownTops.downs.map((t, i) => (
                      <React.Fragment key={`down-${i}`}>
                        <div
                          className="pointer-events-none absolute h-[2px] bg-gray-400/80 rounded"
                          style={{
                            width: HALF_TICK,
                            top: t,
                            left: `calc(50% - ${CENTER_GAP}px - ${HALF_TICK}px)`,
                            transform: 'translateY(-50%)',
                          }}
                          aria-hidden
                        />
                        <div
                          className="pointer-events-none absolute h-[2px] bg-gray-400/80 rounded"
                          style={{
                            width: HALF_TICK,
                            top: t,
                            left: `calc(50% + ${CENTER_GAP}px)`,
                            transform: 'translateY(-50%)',
                          }}
                          aria-hidden
                        />
                      </React.Fragment>
                    ))}

                    {/* ===== Colored fill from center to the thumb ===== */}
                    <div
                      className="pointer-events-none absolute rounded-full"
                      style={{
                        left: `calc(50% - ${RAIL_W / 2}px)`,
                        width: `${RAIL_W}px`,
                        top,
                        height,
                        backgroundColor: color,
                        boxShadow:
                          color === 'transparent' ? 'none' : '0 0 6px rgba(0,0,0,0.25) inset',
                      }}
                      aria-hidden
                    />

                    {/* Rotated range (thumb) */}
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={0.5}
                      value={gain}
                      onChange={(e) => onChangeGain(key, Number(e.currentTarget.value))}
                      style={{
                        width: SLIDER_PX,
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%) rotate(-90deg)',
                        transformOrigin: 'center',
                      }}
                      className="eq-vert relative z-10 block appearance-none bg-transparent"
                      aria-label={`${label} gain`}
                    />
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-gray-100">{Math.round(gain)} dB</div>
                    <div className="text-xs text-gray-400">{label}</div>
                  </div>

                  <button
                    type="button"
                    className="relative z-20 text-xs text-gray-300 hover:text-white underline"
                    onClick={() => onChangeGain(key, 0)}
                  >
                    Reset
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t border-gray-700 pt-4">
            {/* Responsive row: Save button wraps under the input on narrow screens */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name (e.g., Bass Boost)"
                className="flex-1 min-w-[0] px-3 py-2 rounded bg-gray-800 text-gray-100 placeholder-gray-500"
              />
              <button
                className="px-4 py-2 rounded bg-emerald-700 text-white hover:bg-emerald-600 flex-shrink-0 w-full sm:w-auto"
                onClick={() => {
                  onSavePreset(presetName);
                  setPresetName('');
                }}
              >
                Save
              </button>
            </div>

            {presets.length > 0 && (
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {presets.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded bg-gray-800 px-3 py-2"
                  >
                    <div className="text-sm text-gray-100">{p.name}</div>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 text-xs"
                        onClick={() => onLoadPreset(p.id)}
                      >
                        Load
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-rose-700 text-white hover:bg-rose-600 text-xs"
                        onClick={() => onDeletePreset(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-3 text-xs text-gray-400">
              You can save up to 5 presets. Saving a new one will keep the 5 most recent.
            </p>
          </div>
        </div>
      </div>

      {/* Track spans full width (after rotation, width = vertical height) + Brushed metal CSS */}
      <style>{`
        .eq-vert::-webkit-slider-runnable-track { width: 100%; }
        .eq-vert::-moz-range-track { width: 100%; }

        /* Smoother metal background (lines removed) */
        .metal-bg {
          background-color: #2a2d31;
        }
      `}</style>
    </div>
  );
}
