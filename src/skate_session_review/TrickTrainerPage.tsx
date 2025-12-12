// C:\Users\user\Desktop\invert61\src\skate_session_review\TrickTrainerPage.tsx

import React, { useMemo, useState, useEffect } from 'react';
import Logo from '../Logo';
import type { SkateSession } from './types';
import { useSkateTracker } from './useSkateTracker';
import { LineProvider, useLine } from './planner/LineContext';
import RampPicker from './3d/RampPicker';

// NEW 3D EDITOR (correct)
import PathEditor3D from './3d/PathEditor3D';

import TrickBlocksPanel from './3d/TrickBlocksPanel';

interface TrickTrainerPageProps {
    onBack: () => void;
    onAddSession?: (session: SkateSession) => void;
}

const LoopSelector: React.FC = () => {
    const { loopCount, setLoopCount } = useLine();

    const options: Array<{ label: string; value: number | 'infinite' }> = useMemo(
        () => [
            { label: '1×', value: 1 },
            { label: '2×', value: 2 },
            { label: '3×', value: 3 },
            { label: '5×', value: 5 },
            { label: '∞', value: 'infinite' },
        ],
        []
    );

    return (
        <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase text-gray-400 mb-1">
                Wie oft willst du die Line fahren?
            </h3>
            <div className="flex gap-2">
                {options.map(opt => (
                    <button
                        key={opt.label}
                        type="button"
                        onClick={() => setLoopCount(opt.value)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold
                            ${loopCount === opt.value ? 'bg-white text-black' : 'bg-white/10 text-gray-200'}`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

type Mode = 'idle' | 'training' | 'live';

const TrainerContent: React.FC<TrickTrainerPageProps> = ({ onBack, onAddSession }) => {
    const { ramp, setRamp, path, setPath, markers, setMarkers } = useLine();
    const { trackerState, error, startTracking, stopTracking } = useSkateTracker(session => {
        if (onAddSession) onAddSession(session);
    });

    const [stance, setStance] = useState<'REGULAR' | 'GOOFY'>('REGULAR');
    const [mode, setMode] = useState<Mode>('idle');
    const [wakeLockSentinel, setWakeLockSentinel] = useState<any>(null);

    const isTracking = trackerState.status === 'tracking';

    const ensureBasicsBeforeRun = () => {
        if (path.length < 5) {
            alert('Bitte zeichne zuerst deine Line auf der Rampe.');
            return false;
        }
        if (markers.length === 0) {
            alert('Bitte füge mindestens einen Trick-Block auf der Line hinzu.');
            return false;
        }
        return true;
    };

    const requestWakeLock = async () => {
        try {
            const navAny = navigator as any;
            if (navAny.wakeLock && typeof navAny.wakeLock.request === 'function') {
                const sentinel = await navAny.wakeLock.request('system');
                setWakeLockSentinel(sentinel);
                sentinel.addEventListener('release', () => setWakeLockSentinel(null));
            }
        } catch (err) {
            console.warn('WakeLock request failed', err);
        }
    };

    const releaseWakeLock = async () => {
        try {
            if (wakeLockSentinel && typeof wakeLockSentinel.release === 'function') {
                await wakeLockSentinel.release();
            }
        } catch (err) {
            console.warn('WakeLock release failed', err);
        } finally {
            setWakeLockSentinel(null);
        }
    };

    const handleStartRun = async (nextMode: Mode) => {
        if (!ensureBasicsBeforeRun()) return;
        setMode(nextMode);
        await requestWakeLock();
        startTracking(stance);
    };

    const handleStopRun = async () => {
        stopTracking();
        await releaseWakeLock();
        setMode('idle');
    };

    useEffect(() => {
        return () => {
            stopTracking();
            if (wakeLockSentinel) {
                (wakeLockSentinel.release?.() ?? Promise.resolve());
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 flex flex-col relative">

            {isTracking && (
                <div className="fixed inset-0 bg-black z-40 flex flex-col items-center justify-center">
                    <div className="text-center mb-6">
                        <div className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2">
                            Invert SK8
                        </div>
                        <div className="text-xl font-bold mb-2">Recording…</div>
                        <p className="text-xs text-gray-400 max-w-xs mx-auto">
                            Handy in die Tasche, fahren. Wenn du fertig bist oder eine Pause brauchst,
                            entsperre dein Handy und tipp auf STOP.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleStopRun}
                        className="px-6 py-3 rounded-full bg-red-600 text-white font-bold text-sm uppercase tracking-wide shadow-lg"
                    >
                        STOP
                    </button>
                </div>
            )}

            <header className="w-full my-6">
                <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="text-gray-300 hover:text-white transition-colors flex items-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                            className="w-5 h-5" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                        <span className="text-xs font-semibold uppercase tracking-wide">Back</span>
                    </button>

                    <div className="text-right">
                        <Logo variant="sk8" className="text-[40px] sm:text-[56px]" />
                        <div className="text-[10px] uppercase tracking-[0.25em] text-gray-400">
                            Trick Planner
                        </div>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-5xl mx-auto flex-1 flex flex-col gap-4">

                <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_minmax(0,0.9fr)] gap-6">

                    {/* LEFT COLUMN */}
                    <div>
                        <RampPicker config={ramp} onChange={setRamp} />
                        <LoopSelector />

                        <div className="mt-6">
                            <h3 className="text-xs font-semibold uppercase text-gray-400 mb-1">Stance</h3>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStance('REGULAR')}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                        stance === 'REGULAR'
                                            ? 'bg-white text-black border-white'
                                            : 'bg-transparent text-gray-300 border-gray-600'
                                    }`}
                                >
                                    REGULAR
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStance('GOOFY')}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                        stance === 'GOOFY'
                                            ? 'bg-white text-black border-white'
                                            : 'bg-transparent text-gray-300 border-gray-600'
                                    }`}
                                >
                                    GOOFY
                                </button>
                            </div>

                            {error && <div className="mt-3 text-xs text-red-400">{error}</div>}
                        </div>
                    </div>

                    {/* CENTER COLUMN — FIXED HEIGHT ADDED */}
                    <div className="h-[60vh] min-h-[380px]">
                        <PathEditor3D
                            config={ramp}
                            onPathChange={setPath}
                        />

                        <div className="mt-3 flex flex-wrap gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => handleStartRun('training')}
                                disabled={isTracking}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide ${
                                    isTracking
                                        ? 'bg-indigo-900 text-gray-500 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            >
                                Training Run
                            </button>

                            <button
                                type="button"
                                onClick={() => handleStartRun('live')}
                                disabled={isTracking}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide ${
                                    isTracking
                                        ? 'bg-red-900 text-gray-500 cursor-not-allowed'
                                        : 'bg-[#c52323] hover:bg-red-700'
                                }`}
                            >
                                Live Recording
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div>
                        <TrickBlocksPanel />

                        <div className="mt-6 text-[11px] text-gray-500 space-y-2">
                            <p>Zieh deine Tricks auf die Line. Sie snappen automatisch magnetisch auf die Fahrspur.</p>
                            <p>Training und Live-Recording nutzen bereits den Motion-Tracker im Hintergrund.</p>
                        </div>
                    </div>

                </section>
            </main>
        </div>
    );
};

const TrickTrainerPage: React.FC<TrickTrainerPageProps> = (props) => (
    <LineProvider>
        <TrainerContent {...props} />
    </LineProvider>
);

export default TrickTrainerPage;
