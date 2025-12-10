import React from 'react';
import { SkateSession, Highlight } from './types';
import SkateMap from '../maptiler/SkateMap';
import SessionTimeline from './SessionTimeline';

const formatDistance = (meters: number) => (meters / 1000).toFixed(2);
const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
};
const formatSpeed = (mps: number) => (mps * 3.6).toFixed(1);

const StatCard: React.FC<{ label: string; value: string; unit: string; color?: string }> = ({ label, value, unit, color="text-white" }) => (
    <div className="bg-neutral-800 p-4 rounded-lg text-center border border-white/5">
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-xs text-neutral-400 uppercase">{label} <span className="opacity-50">({unit})</span></div>
    </div>
);

const HighlightRow: React.FC<{ label: string; count: number; icon: string }> = ({ label, count, icon }) => (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
        <div className="flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <span className="text-gray-300 font-medium">{label}</span>
        </div>
        <span className="font-mono font-bold text-white text-lg">{count}</span>
    </div>
);

const BestTrickDisplay: React.FC<{ trick: Highlight | null }> = ({ trick }) => {
    if (!trick) return null;
    
    // Fix: Explicitly type `label` as a string to allow assigning custom string values.
    let label: string = trick.type;
    let value = "";

    if (trick.type === "AIR" || trick.type === "OLLIE") {
        label = "Longest Air";
        value = `${trick.duration.toFixed(2)}s`;
    } else if (trick.type.includes("GRIND") || trick.type === "STALL") {
        label = "Best Grind";
        value = `${trick.duration.toFixed(2)}s`;
    } else {
        return null; // Don't show for slams etc.
    }

    return (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg text-center">
            <div className="text-xs uppercase text-yellow-400 font-bold tracking-wider">Best Trick</div>
            <div className="text-2xl font-bold text-white mt-1">{label}</div>
            <div className="text-3xl font-mono font-black text-yellow-300">{value}</div>
        </div>
    );
};

const SessionReviewPage: React.FC<{
    session: SkateSession;
    onClose: () => void;
}> = ({ session, onClose }) => {
    
    const timeOn = session.timeOnBoard ?? session.activeTime;
    const timeOff = session.timeOffBoard ?? 0;
    const avgSpeed = timeOn > 0 ? (session.totalDistance / timeOn) : 0;
    const counts = session.counts || { pumps: 0, ollies: 0, airs: 0, fsGrinds: 0, bsGrinds: 0, stalls: 0, slams: 0 };
    const longestGrind = session.longestGrind || 0;
    const bestTrick = session.bestTrick || null;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <header className="flex items-center justify-between mb-6 relative h-10">
                <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors z-10 p-2 -ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-lg font-bold text-gray-100 text-center w-full absolute left-1/2 -translate-x-1/2 pointer-events-none">
                    Session Review
                </h1>
            </header>

            <main className="max-w-4xl mx-auto space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Distance" value={formatDistance(session.totalDistance)} unit="km" />
                    <StatCard label="Top Speed" value={formatSpeed(session.topSpeed)} unit="km/h" />
                    <StatCard label="Avg. Speed" value={formatSpeed(avgSpeed)} unit="km/h" />
                    <StatCard label="Stance" value={session.stance || '-'} unit="" color="text-yellow-400" />
                </div>

                <div className="bg-neutral-800 p-4 rounded-lg border border-white/5">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4">Time Analysis</h3>
                    <div className="flex gap-4">
                        <div className="flex-1 bg-neutral-900/50 p-3 rounded text-center">
                            <div className="text-green-400 text-xl font-bold font-mono">{formatTime(timeOn)}</div>
                            <div className="text-[10px] text-gray-400 uppercase mt-1">On Board (Skating)</div>
                        </div>
                        <div className="flex-1 bg-neutral-900/50 p-3 rounded text-center">
                            <div className="text-yellow-400 text-xl font-bold font-mono">{formatTime(timeOff)}</div>
                            <div className="text-[10px] text-gray-400 uppercase mt-1">Off Board (Chilling)</div>
                        </div>
                    </div>
                </div>
                
                {session.path.length > 1 && (
                     <div className="bg-neutral-800 p-2 rounded-lg border border-white/5">
                        <SkateMap path={session.path} className="h-72 w-full rounded-lg" />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-neutral-800 p-6 rounded-lg border border-white/5">
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Session Highlights</h3>
                        <div className="space-y-1">
                            <HighlightRow label="Ollies" count={counts.ollies} icon="🛹" />
                            <HighlightRow label="Airs / Jumps" count={counts.airs} icon="✈️" />
                            <HighlightRow label="FS Grinds" count={counts.fsGrinds} icon="➡️" />
                            <HighlightRow label="BS Grinds" count={counts.bsGrinds} icon="⬅️" />
                            <HighlightRow label="Stalls" count={counts.stalls} icon="⏸️" />
                            <HighlightRow label="Pumps" count={counts.pumps} icon="🌊" />
                            <HighlightRow label="Slams / Bails" count={counts.slams} icon="💥" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {bestTrick && <BestTrickDisplay trick={bestTrick} />}
                        {longestGrind > 0 && (
                             <div className="bg-neutral-800 p-4 rounded-lg text-center border border-white/5">
                                <div className="text-xs uppercase text-neutral-400 font-bold">Longest Grind</div>
                                <div className="text-3xl font-mono font-black text-white mt-1">{longestGrind.toFixed(2)}s</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-neutral-800 p-4 rounded-lg border border-white/5">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-3">Timeline</h3>
                    <SessionTimeline session={session} />
                </div>
            </main>
        </div>
    );
};

export default SessionReviewPage;