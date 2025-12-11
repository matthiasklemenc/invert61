import React, { useRef, useState, useEffect } from 'react';
import type { PathPoint, TrickMarker } from '../planner/LineContext';

interface PathEditorProps {
    path: PathPoint[];
    onPathChange: (pts: PathPoint[]) => void;
    markers: TrickMarker[];
    onAddMarker: (t: number, trickId: string) => void;
}

type Mode = 'draw' | 'rotate';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function flatten(strokes: PathPoint[][]): PathPoint[] {
    const out: PathPoint[] = [];
    for (const s of strokes) out.push(...s);
    return out;
}

function getPoint(path: PathPoint[], t: number): PathPoint {
    if (!path.length) return { x: 0.5, y: 0.5 };
    if (path.length === 1) return path[0];

    const lengths: number[] = [];
    let total = 0;

    for (let i = 0; i < path.length - 1; i++) {
        const dx = path[i + 1].x - path[i].x;
        const dy = path[i + 1].y - path[i].y;
        const len = Math.hypot(dx, dy);
        lengths.push(len);
        total += len;
    }

    let dist = t * total;
    for (let i = 0; i < lengths.length; i++) {
        const L = lengths[i];
        if (dist <= L) {
            const a = dist / L;
            return {
                x: path[i].x + (path[i + 1].x - path[i].x) * a,
                y: path[i].y + (path[i + 1].y - path[i].y) * a,
            };
        }
        dist -= L;
    }
    return path[path.length - 1];
}

function findClosest(path: PathPoint[], p: PathPoint): number {
    if (path.length < 2) return 0;

    let total = 0;
    const lengths: number[] = [];

    for (let i = 0; i < path.length - 1; i++) {
        const dx = path[i + 1].x - path[i].x;
        const dy = path[i + 1].y - path[i].y;
        const len = Math.hypot(dx, dy);
        lengths.push(len);
        total += len;
    }

    let bestT = 0;
    let bestDist = Infinity;
    let acc = 0;

    for (let i = 0; i < path.length - 1; i++) {
        const p0 = path[i];
        const p1 = path[i + 1];
        const L = lengths[i];
        if (L === 0) continue;

        const vx = p1.x - p0.x;
        const vy = p1.y - p0.y;
        const wx = p.x - p0.x;
        const wy = p.y - p0.y;

        const proj = (vx * wx + vy * wy) / (L * L);
        const u = proj < 0 ? 0 : proj > 1 ? 1 : proj;

        const cx = p0.x + vx * u;
        const cy = p0.y + vy * u;

        const d = Math.hypot(p.x - cx, p.y - cy);
        if (d < bestDist) {
            bestDist = d;
            bestT = (acc + L * u) / total;
        }

        acc += L;
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
    const [rotation, setRotation] = useState(0);

    const [strokes, setStrokes] = useState<PathPoint[][]>([]);
    const [currentStroke, setCurrentStroke] = useState<PathPoint[] | null>(null);

    const ignoreParentSync = useRef(false);
    const lastX = useRef<number | null>(null);

    // sync path → strokes unless undo triggered it
    useEffect(() => {
        if (ignoreParentSync.current) {
            ignoreParentSync.current = false;
            return;
        }
        if (path.length) setStrokes([path]);
        else setStrokes([]);
    }, [path]);

    function pointerToXY(clientX: number, clientY: number): PathPoint | null {
        if (!svgRef.current) return null;
        const rect = svgRef.current.getBoundingClientRect();

        const x = clamp01((clientX - rect.left) / rect.width);
        const y = clamp01((clientY - rect.top) / rect.height);

        return { x, y };
    }

    function startStroke(e: React.PointerEvent) {
        const p = pointerToXY(e.clientX, e.clientY);
        if (!p) return;
        setCurrentStroke([p]);
    }

    function extendStroke(e: React.PointerEvent) {
        if (!currentStroke) return;
        const p = pointerToXY(e.clientX, e.clientY);
        if (!p) return;

        const last = currentStroke[currentStroke.length - 1];
        const dx = p.x - last.x;
        const dy = p.y - last.y;
        if (dx * dx + dy * dy < 0.00004) return; // spacing

        setCurrentStroke([...currentStroke, p]);
    }

    function finishStroke() {
        if (!currentStroke || currentStroke.length < 2) {
            setCurrentStroke(null);
            return;
        }
        const newStrokes = [...strokes, currentStroke];
        const newPath = flatten(newStrokes);

        ignoreParentSync.current = true;
        onPathChange(newPath);

        setStrokes(newStrokes);
        setCurrentStroke(null);
    }

    function undo() {
        if (strokes.length === 0) return;

        const newStrokes = strokes.slice(0, -1);
        const newPath = flatten(newStrokes);

        ignoreParentSync.current = true;
        onPathChange(newPath);

        setStrokes(newStrokes);
    }

    function reset() {
        ignoreParentSync.current = true;
        onPathChange([]);

        setStrokes([]);
        setCurrentStroke(null);
    }

    // 3D rotation
    function startRotate(e: React.PointerEvent) {
        lastX.current = e.clientX;
    }
    function rotateMove(e: React.PointerEvent) {
        if (lastX.current == null) return;
        const dx = e.clientX - lastX.current;
        lastX.current = e.clientX;
        setRotation((prev) => prev + dx * 0.4);
    }
    function stopRotate() {
        lastX.current = null;
    }

    // drag+drop of trick blocks
    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        const trickId = e.dataTransfer.getData('text/plain');
        if (!trickId || path.length === 0) return;

        const p = pointerToXY(e.clientX, e.clientY);
        if (!p) return;

        const t = findClosest(path, p);
        onAddMarker(t, trickId);
    }

    const fullPath = (() => {
        const pts = flatten(strokes);
        if (currentStroke) return [...pts, ...currentStroke];
        return pts;
    })();

    const polyline =
        fullPath.length > 0
            ? fullPath.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')
            : null;

    return (
        <div className="space-y-3">

            {/* Mode toggle + Undo/Reset */}
            <div className="flex items-center justify-between">
                <div className="inline-flex bg-black/40 border border-white/10 rounded-full p-1">
                    <button
                        onClick={() => setMode('draw')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            mode === 'draw' ? 'bg-white text-black' : 'text-gray-300'
                        }`}
                    >
                        Line zeichnen
                    </button>
                    <button
                        onClick={() => setMode('rotate')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            mode === 'rotate' ? 'bg-white text-black' : 'text-gray-300'
                        }`}
                    >
                        Rampe drehen
                    </button>
                </div>

                <div className="flex gap-2">
                    <button onClick={undo} className="px-3 py-1 text-xs bg-white/10 rounded">
                        Undo
                    </button>
                    <button onClick={reset} className="px-3 py-1 text-xs bg-red-600 rounded">
                        Reset
                    </button>
                </div>
            </div>

            {/* Canvas container */}
            <div className="relative w-full rounded-xl border border-white/10 overflow-hidden"
                 style={{ height: "260px", background: "linear-gradient(#00000080,#000000cc)" }}>

                {/* 3D Ramp */}
                <div className="absolute inset-0" style={{
                    transformStyle: 'preserve-3d',
                    transform: `rotateX(55deg) rotateY(${rotation}deg)`,
                    transformOrigin: '50% 65%',
                    pointerEvents: 'none'
                }}>
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60">
                        <defs>
                            <linearGradient id="deck" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4b5563" />
                                <stop offset="100%" stopColor="#111827" />
                            </linearGradient>
                        </defs>
                        <path d="5 95 L5 55 Q50 5 95 55 L95 95 Z"
                            fill="url(#deck)" stroke="#374151" strokeWidth="0.7" />
                        <path d="5 55 Q50 5 95 55"
                            fill="none" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="3 3" />
                    </svg>
                </div>

                {/* DRAWING + MARKERS */}
                <svg
                    ref={svgRef}
                    viewBox="0 0 100 100"
                    className="absolute inset-0 w-full h-full"
                    onPointerDown={(e) =>
                        mode === 'draw' ? startStroke(e) : startRotate(e)
                    }
                    onPointerMove={(e) =>
                        mode === 'draw' ? extendStroke(e) : rotateMove(e)
                    }
                    onPointerUp={() => (mode === 'draw' ? finishStroke() : stopRotate())}
                    onPointerLeave={() => (mode === 'draw' ? finishStroke() : stopRotate())}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                >
                    {polyline && (
                        <polyline
                            points={polyline}
                            fill="none"
                            stroke="#f87171"
                            strokeWidth={4}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    {markers.map((m) => {
                        const p = getPoint(path, m.t);
                        return (
                            <circle
                                key={m.id}
                                cx={p.x * 100}
                                cy={p.y * 100}
                                r={4}
                                fill="#22c55e"
                                stroke="black"
                                strokeWidth={1}
                            />
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default PathEditor;
