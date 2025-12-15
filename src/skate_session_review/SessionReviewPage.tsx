
import React from 'react';
import { SkateSession } from './types';
import SkateMap from '../maptiler/SkateMap';

type Props = {
    session: SkateSession;
    onClose: () => void;
};

const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters.toFixed(0)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
};

const SessionReviewPage: React.FC<Props> = ({ session, onClose }) => {
    const dateStr = new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 flex flex-col">
            <header className="flex items-center justify-between mb-6 relative h-10">
                <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors z-10 p-2 -ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="text-center w-full absolute left-1/2 -translate-x-1/2 pointer-events-none">
                    <h1 className="text-xl font-bold tracking-wider text-gray-100">SESSION REVIEW</h1>
                </div>
            </header>

            <main className="w-full max-w-4xl mx-auto space-y-6">
                <div className="bg-neutral-800 rounded-xl p-4 border border-white/5">
                    <div className="text-center mb-4">
                        <div className="text-gray-400 text-sm uppercase tracking-widest">{dateStr}</div>
                        <div className="text-3xl font-black text-white">{timeStr}</div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-neutral-900/50 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold font-mono">{formatTime(session.activeTime)}</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold">Duration</div>
                        </div>
                        <div className="bg-neutral-900/50 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold font-mono text-green-400">{formatDistance(session.totalDistance)}</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold">Distance</div>
                        </div>
                        <div className="bg-neutral-900/50 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold font-mono text-blue-400">{(session.topSpeed * 3.6).toFixed(1)} <span className="text-sm">km/h</span></div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold">Top Speed</div>
                        </div>
                        <div className="bg-neutral-900/50 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold font-mono text-yellow-400">{session.counts.slams}</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold">Slams</div>
                        </div>
                    </div>

                    <div className="h-64 rounded-lg overflow-hidden border border-white/10 mb-4">
                        <SkateMap path={session.path} />
                    </div>

                    <div className="bg-neutral-900/40 p-4 rounded-lg">
                        <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Tricks Landed</h3>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm">
                            <div className="flex justify-between border-b border-gray-800 pb-1">
                                <span>Ollies</span>
                                <span className="font-mono font-bold text-white">{session.counts.ollies}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-800 pb-1">
                                <span>FS Grinds</span>
                                <span className="font-mono font-bold text-white">{session.counts.fsGrinds}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-800 pb-1">
                                <span>BS Grinds</span>
                                <span className="font-mono font-bold text-white">{session.counts.bsGrinds}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-800 pb-1">
                                <span>Pumps</span>
                                <span className="font-mono font-bold text-white">{session.counts.pumps}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-800 pb-1">
                                <span>Airs</span>
                                <span className="font-mono font-bold text-white">{session.counts.airs}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-800 pb-1">
                                <span>Stalls</span>
                                <span className="font-mono font-bold text-white">{session.counts.stalls}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SessionReviewPage;
