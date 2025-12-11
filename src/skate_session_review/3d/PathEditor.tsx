import React, { useRef, useState } from 'react';
import type { PathPoint, TrickMarker } from '../planner/LineContext';

interface PathEditorProps {
    path: PathPoint[];
    onPathChange: (pts: PathPoint[]) => void;
    markers: TrickMarker[];
    onAddMarker: (t: number, trickId: string) => void;
}

/**
 * Simple 2D editor that works like a "fake 3D" top view:
 * - User draws a line with the finger/mouse
 * - We normalize coordinates to 0..1
 * - Trick blocks can be gedroppt und snappen dann zur nächsten Stelle auf der Line.
 */
const PathEditor: React.FC<PathEditorProps> = ({ path, onPathChange, markers, onAddMarker }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const viewWidth = 400;
    const viewHeight = 260;

    const toNormalized = (clientX: number, clientY: number, rect: DOMRect): PathPoint => {
        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height,
        };
    };

    const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
        if (e.button !== 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const p = toNormalized(e.clientX, e.clientY, rect);
        const pts: PathPoint[] = [p];
        onPathChange(pts);
        setIsDrawing(true);
    };

    const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
        if (!isDrawing) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const p = toNormalized(e.clientX, e.clientY, rect);
        onPathChange([...path, p]);
    };

    const handlePointerUp = () => {
        setIsDrawing(false);
    };

    /**
     * Snap a dropped trick block to the closest point along the current path.
     * t = 0..1 über alle Punkte verteilt.
     */
    const handleDrop = (e: React.DragEvent<SVGSVGElement>) => {
        e.preventDefault();
        if (!svgRef.current || path.length === 0) return;

        const trickId = e.dataTransfer.getData('text/plain');
        if (!trickId) return;

        const rect = svgRef.current.getBoundingClientRect();
        const dropNorm = toNormalized(e.clientX, e.clientY, rect);

        // Finde den Pfadpunkt mit minimaler Distanz
        let bestIdx = 0;
        let bestDist = Number.POSITIVE_INFINITY;

        path.forEach((p, idx) => {
            const dx = p.x - dropNorm.x;
            const dy = p.y - dropNorm.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestDist) {
                bestDist = d2;
                bestIdx = idx;
            }
        });

        if (path.length === 1) {
            onAddMarker(0, trickId);
        } else {
            const t = bestIdx / (path.length - 1);
            onAddMarker(t, trickId);
        }
    };

    const handleDragOver = (e: React.DragEvent<SVGSVGElement>) => {
        // Notwendig, damit onDrop feuert
        e.preventDefault();
    };

    const pathD =
        path.length > 0
            ? path
                  .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x * viewWidth} ${p.y * viewHeight}`)
                  .join(' ')
            : '';

    return (
        <div className="w-full h-full">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm font-bold">Fahrspur einzeichnen</h2>
                <p className="text-[11px] text-gray-500">
                    Mit dem Finger / der Maus einmal deine Line nachziehen und dann Trick-Blöcke auf die Line ziehen.
                </p>
            </div>
            <div className="border border-white/10 rounded-lg bg-gradient-to-b from-slate-900 to-slate-800">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                    className="w-full h-64 touch-none"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    {/* Simple ramp background placeholder */}
                    <rect x={0} y={0} width={viewWidth} height={viewHeight} fill="url(#bg)" />
                    <defs>
                        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#020617" />
                            <stop offset="100%" stopColor="#111827" />
                        </linearGradient>
                    </defs>

                    {/* Path */}
                    {pathD && (
                        <path
                            d={pathD}
                            stroke="#c52323"
                            strokeWidth={4}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    {/* Markers */}
                    {markers.map(m => {
                        if (path.length === 0) return null;
                        const idx = Math.min(path.length - 1, Math.max(0, Math.round(m.t * (path.length - 1))));
                        const p = path[idx];
                        const x = p.x * viewWidth;
                        const y = p.y * viewHeight;
                        return (
                            <g key={m.id} transform={`translate(${x},${y})`}>
                                {/* Magnet/Bounce/Glow Effekt */}
                                <circle r={14} className="text-yellow-300 opacity-60 animate-ping" />
                                <circle r={9} fill="#facc15" className="drop-shadow" />
                                <circle r={4} fill="#000" />
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default PathEditor;
