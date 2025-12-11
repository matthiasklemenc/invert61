import React, { useRef, useState, useEffect } from 'react';
import type { PathPoint, TrickMarker } from '../planner/LineContext';

interface PathEditorProps {
    path: PathPoint[];
    onPathChange: (pts: PathPoint[]) => void;
    markers: TrickMarker[];
    onAddMarker: (t: number, trickId: string) => void;
}

type Mode = 'draw' | 'rotate';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function flattenStrokes(strokes: PathPoint[][]): PathPoint[] {
    const out: PathPoint[] = [];
    for (const s of strokes) out.push(...s);
    return out;
}

function getPointAlongPath(path: PathPoint[], t: number): PathPoint {
    if (!path.length) return { x: 0.5, y: 0.5 };
    if (path.length === 1) return path[0];

    const segLengths: number[] = [];
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const dx = path[i + 1].x - path[i].x;
        const dy = path[i + 1].y - path[i].y;
        const len = Math.hypot(dx, dy);
        segLengths.push(len);
        total += len;
    }
    if (total === 0) return path[path.length - 1];

    let target = clamp01(t) * total;
    for (let i = 0; i < segLengths.length; i++) {
        const segLen = segLengths[i];
        if (target <= segLen || i === segLengths.length - 1) {
            const localT = segLen === 0 ? 0 : target / segLen;
            const p0 = path[i];
            const p1 = path[i + 1];
            return {
                x: p0.x + (p1.x - p0.x) * localT,
                y: p0.y + (p1.y - p0.y) * localT,
            };
        }
        target -= segLen;
    }
    return path[path.length - 1];
}

function findClosestTOnPath(path: PathPoint[], target: PathPoint): number {
    if (path.length < 2) return 0;
    const segLengths: number[] = [];
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const dx = path[i + 1].x - path[i].x;
        const dy = path[i + 1].y - path[i].y;
        const len = Math.hypot(dx, dy);
        segLengths.push(len);
        total += len;
    }
    if (total === 0) return 0;

    let bestDist = Infinity;
    let bestT = 0;
    let accLength = 0;

    for (let i = 0; i < path.length - 1; i++) {
        const p0 = path[i];
        const p1 = path[i + 1];
        const segLen = segLengths[i];
        if (segLen === 0) continue;

        const vx = p1.x - p0.x;
        const vy = p1.y - p0.y;
        const wx = target.x - p0.x;
        const wy = target.y - p0.y;

        const proj = (vx * wx + vy * wy) / (segLen * segLen);
        const u = proj < 0 ? 0 : proj > 1 ? 1 : proj;

        const closestX = p0.x + vx * u;
        const closestY = p0.y + vy * u;
        const dx = target.x - closestX;
        const dy = target.y - closestY;
        const dist = Math.hypot(dx, dy);

        if (dist < bestDist) {
            bestDist = dist;
            bestT = (accLength + segLen * u) / total;
        }

        accLength += segLen;
    }

    return clamp01(bestT);
}

const PathEditor: React.FC<PathEditorProps> = ({
    path,
    onPathChange,
    markers,
    onAddMarker,
}) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [mode, setMode] = useState<Mode>('draw');
    const [rotation, setRotation] = useState(0); // visual, degrees
    const [isDrawing, setIsDrawing] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const [strokes, setStrokes] = useState<PathPoint[][]>(() =>
        path && path.length ? [path] : []
    );
    const [currentStroke, setCurrentStroke] = useState<PathPoint[] | null>(null);
    const lastPointerX = useRef<number | null>(null);

    // keep internal strokes in sync with parent when not drawing/rotating
    useEffect(() => {
        if (isDrawing || isRotating) return;
        if (!path || !path.length) {
            setStrokes([]);
            return;
        }
        setStrokes([path]);
    }, [path, isDrawing, isRotating]);

    const startStroke = (clientX: number, clientY: number) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = clamp01((clientX - rect.left) / rect.width);
        const y = clamp01((clientY - rect.top) / rect.height);
        const pt: PathPoint = { x, y };
        setCurrentStroke([pt]);
        setIsDrawing(true);
    };

    const extendStroke = (clientX: number, clientY: number) => {
        if (!isDrawing || !svgRef.current || !currentStroke) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = clamp01((clientX - rect.left) / rect.width);
        const y = clamp01((clientY - rect.top) / rect.height);
        const last = currentStroke[currentStroke.length - 1];
        const dx = x - last.x;
        const dy = y - last.y;
        const minDist = 0.003; // spacing in normalized space
        if (Math.hypot(dx, dy) < minDist) return;

        const newStroke = [...currentStroke, { x, y }];
        setCurrentStroke(newStroke);
    };

    const finishStroke = () => {
        if (!isDrawing || !currentStroke || currentStroke.length < 2) {
            setIsDrawing(false);
            setCurrentStroke(null);
            return;
        }
        const newStrokes = [...strokes, currentStroke];
        const newPath = flattenStrokes(newStrokes);
        setStrokes(newStrokes);
        setIsDrawing(false);
        setCurrentStroke(null);
        onPathChange(newPath);
    };

    const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        if (mode === 'draw') {
            startStroke(e.clientX, e.clientY);
        } else {
            setIsRotating(true);
            lastPointerX.current = e.clientX;
        }
    };

    const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
        if (mode === 'draw') {
            extendStroke(e.clientX, e.clientY);
        } else if (isRotating && lastPointerX.current != null) {
            const deltaX = e.clientX - lastPointerX.current;
            lastPointerX.current = e.clientX;
            setRotation((prev) => {
                let next = prev + deltaX * 0.4;
                if (next < -180) next += 360;
                if (next > 180) next -= 360;
                return next;
            });
        }
    };

    const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
        if (mode === 'draw') {
            finishStroke();
        }
        setIsDrawing(false);
        setIsRotating(false);
        lastPointerX.current = null;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const handlePointerLeave = () => {
        if (mode === 'draw') {
            finishStroke();
        }
        setIsDrawing(false);
        setIsRotating(false);
        lastPointerX.current = null;
    };

    const handleDrop = (e: React.DragEvent<SVGSVGElement>) => {
        e.preventDefault();
        if (!svgRef.current || path.length === 0) return;

        const trickId = e.dataTransfer.getData('text/plain');
        if (!trickId) return;

        const rect = svgRef.current.getBoundingClientRect();
        const x = clamp01((e.clientX - rect.left) / rect.width);
        const y = clamp01((e.clientY - rect.top) / rect.height);
        const t = findClosestTOnPath(path, { x, y });
        onAddMarker(t, trickId);
    };

    const handleDragOver = (e: React.DragEvent<SVGSVGElement>) => {
        if (!path.length) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleReset = () => {
        setStrokes([]);
        setCurrentStroke(null);
        onPathChange([]);
    };

    const handleUndo = () => {
        if (!strokes.length) return;
        const newStrokes = strokes.slice(0, -1);
        const newPath = flattenStrokes(newStrokes);
        setStrokes(newStrokes);
        onPathChange(newPath);
    };

    // Path for rendering (includes active stroke)
    const renderPath = (): string | null => {
        const allPoints: PathPoint[] = [];
        strokes.forEach((s) => allPoints.push(...s));
        if (currentStroke) allPoints.push(...currentStroke);
        if (allPoints.length === 0) return null;
        return allPoints.map((p) => `${p.x * 100} ${p.y * 100}`).join(' ');
    };

    const pathD = renderPath();

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="inline-flex rounded-full bg-black/40 p-1 border border-white/10">
                    <button
                        type="button"
                        onClick={() => setMode('draw')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            mode === 'draw'
                                ? 'bg-white text-black'
                                : 'text-gray-300 hover:text-white'
                        }`}
                    >
                        Line zeichnen
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('rotate')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            mode === 'rotate'
                                ? 'bg-white text-black'
                                : 'text-gray-300 hover:text-white'
                        }`}
                    >
                        Rampe drehen
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleUndo}
                        className="px-3 py-1 rounded text-[11px] bg-white/10 hover:bg-white/20 text-gray-100"
                    >
                        Undo
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-3 py-1 rounded text-[11px] bg-red-600/80 hover:bg-red-500 text-white"
                    >
                        Reset
                    </button>
                </div>
            </div>

            <div className="mt-2 text-[11px] text-gray-400 flex justify-between">
                <span>Fahrspur einzeichnen</span>
                <span>Mit dem Finger zeichnen – Modus wechseln für Rotation.</span>
            </div>

            <div className="mt-2 rounded-xl border border-white/10 bg-gradient-to-b from-black/60 to-black/90 overflow-hidden">
                <div
                    className="relative w-full"
                    style={{ paddingBottom: '40%', perspective: 900 }}
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            transformStyle: 'preserve-3d',
                            transform: `rotateX(55deg) rotateZ(0deg) rotateY(${rotation}deg)`,
                            transformOrigin: '50% 60%',
                        }}
                    >
                        {/* simple ramp preview */}
                        <svg
                            className="absolute inset-0 w-full h-full"
                            viewBox="0 0 100 100"
                        >
                            <defs>
                                <linearGradient id="rampDeck" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4b5563" />
                                    <stop offset="100%" stopColor="#111827" />
                                </linearGradient>
                            </defs>
                            <path
                                d="5 95 L5 55 Q50 5 95 55 L95 95 Z"
                                fill="url(#rampDeck)"
                                stroke="#374151"
                                strokeWidth="0.7"
                            />
                            <path
                                d="5 55 Q50 5 95 55"
                                fill="none"
                                stroke="#9ca3af"
                                strokeWidth="0.5"
                                strokeDasharray="2 2"
                            />
                        </svg>

                        {/* drawing + markers */}
                        <svg
                            ref={svgRef}
                            className="absolute inset-0 w-full h-full"
                            viewBox="0 0 100 100"
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={handlePointerLeave}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                        >
                            {pathD && (
                                <polyline
                                    points={pathD}
                                    fill="none"
                                    stroke="#f87171"
                                    strokeWidth={4}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}

                            {markers.map((m) => {
                                const p = getPointAlongPath(path, m.t);
                                return (
                                    <g
                                        key={m.id}
                                        transform={`translate(${p.x * 100} ${p.y * 100})`}
                                    >
                                        <circle
                                            r={4}
                                            fill="#22c55e"
                                            stroke="#022c22"
                                            strokeWidth={1}
                                        />
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PathEditor;
