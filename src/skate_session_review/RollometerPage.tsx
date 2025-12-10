import React, { useState, useMemo } from 'react';
import type { SkateSession } from './types';
import { useSkateTracker } from './useSkateTracker';
import SkateboardIcon from './SkateboardIcon';
import CalendarView from './CalendarView';
import { BrainIcon } from '../Icons';
import Logo from '../Logo';

const WelcomeModal = ({ onClose }: { onClose: (dontShowAgain: boolean) => void }) => {
    const [lang, setLang] = useState<'en' | 'es' | 'de'>('en');
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const translations = {
        en: {
            title: "Welcome to your Session Tracker!",
            body: [
                "This is your personal skate logbook. It uses a sophisticated Personal Motion Profiler, powered by machine learning, to help with Trick Recognition.",
                "To get started, you must first train the profiler. Go to the 'Train Tricks' section and record at least 3 clean takes for each trick you want to be recognized.",
                "All your sessions are automatically saved and can be reviewed in the calendar below. The more data you provide, the smarter the system becomes!"
            ],
            checkbox: "Do not show this again",
            button: "Got It"
        },
        es: {
            title: "¡Bienvenido a tu Rastreador de Sesiones!",
            body: [
                "Este es tu diario de skate personal. Utiliza un sofisticado Perfilador de Movimiento Personal, impulsado por aprendizaje automático, para ayudar con el Reconocimiento de Trucos.",
                "Para empezar, primero debes entrenar al perfilador. Ve a la sección 'Entrenar Trucos' y graba al menos 3 tomas limpias de cada truco que quieras que se reconozca.",
                "Todas tus sesiones se guardan automáticamente y se pueden revisar en el calendario a continuación. ¡Cuantos más datos proporciones, más inteligente se vuelve el sistema!"
            ],
            checkbox: "No mostrar de nuevo",
            button: "Entendido"
        },
        de: {
            title: "Willkommen bei deinem Session Tracker!",
            body: [
                "Dies ist dein persönliches Skate-Logbuch. Es verwendet einen hochentwickelten Persönlichen Bewegungsprofiler, der durch maschinelles Lernen unterstützt wird, um bei der Trickerkennung zu helfen.",
                "Um loszulegen, musst du zuerst den Profiler trainieren. Gehe zum Bereich 'Tricks trainieren' und nimm mindestens 3 saubere Versuche für jeden Trick auf, der erkannt werden soll.",
                "Alle deine Sessions werden automatisch gespeichert und können im Kalender unten eingesehen werden. Je mehr Daten du bereitstellst, desto intelligenter wird das System!"
            ],
            checkbox: "Nicht erneut anzeigen",
            button: "Verstanden"
        }
    };
    
    const content = translations[lang];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-indigo-500/30">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-indigo-400">{content.title}</h2>
                    <div className="flex gap-1">
                        <button onClick={() => setLang('en')} className={`px-2 py-0.5 rounded text-xs font-bold ${lang === 'en' ? 'bg-white text-black' : 'bg-gray-700'}`}>E</button>
                        <button onClick={() => setLang('es')} className={`px-2 py-0.5 rounded text-xs font-bold ${lang === 'es' ? 'bg-white text-black' : 'bg-gray-700'}`}>ES</button>
                        <button onClick={() => setLang('de')} className={`px-2 py-0.5 rounded text-xs font-bold ${lang === 'de' ? 'bg-white text-black' : 'bg-gray-700'}`}>D</button>
                    </div>
                </div>
                <div className="text-gray-300 space-y-3 text-sm">
                    {content.body.map((p, i) => <p key={i}>{p}</p>)}
                </div>
                <div className="mt-6 flex flex-col items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                        <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-indigo-500 focus:ring-indigo-500"/>
                        {content.checkbox}
                    </label>
                    <button onClick={() => onClose(dontShowAgain)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-8 rounded-lg w-full">
                        {content.button}
                    </button>
                </div>
            </div>
        </div>
    );
};

const MonthlyResumeModal = ({ sessions, month, onClose }: { sessions: SkateSession[], month: Date, onClose: () => void }) => {
    const monthSessions = useMemo(() => {
        return sessions.filter(s => {
            const sessionDate = new Date(s.startTime);
            return sessionDate.getFullYear() === month.getFullYear() && sessionDate.getMonth() === month.getMonth();
        });
    }, [sessions, month]);

    const stats = useMemo(() => {
        const totalSessions = monthSessions.length;
        const totalTime = monthSessions.reduce((sum, s) => sum + s.activeTime, 0);
        const onBoardTime = monthSessions.reduce((sum, s) => sum + (s.timeOnBoard ?? 0), 0);
        const offBoardTime = monthSessions.reduce((sum, s) => sum + (s.timeOffBoard ?? 0), 0);
        const skateDays = new Set(monthSessions.map(s => new Date(s.startTime).toDateString())).size;
        
        const trickCounts = monthSessions.reduce((acc, s) => {
            for (const key in s.counts) {
                acc[key] = (acc[key] || 0) + s.counts[key as keyof typeof s.counts];
            }
            return acc;
        }, {} as Record<string, number>);

        return { totalSessions, totalTime, onBoardTime, offBoardTime, skateDays, trickCounts };
    }, [monthSessions]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-indigo-500/30">
                <h2 className="text-xl font-bold text-indigo-400 mb-4">Resume of {month.toLocaleString('default', { month: 'long' })}</h2>
                
                <div className="grid grid-cols-2 gap-4 text-center mb-4">
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                        <div className="text-2xl font-bold">{stats.totalSessions}</div>
                        <div className="text-xs text-gray-400">Sessions</div>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                        <div className="text-2xl font-bold">{stats.skateDays}</div>
                        <div className="text-xs text-gray-400">Skate Days</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center mb-4">
                     <div className="bg-gray-700/50 p-3 rounded-lg">
                        <div className="text-lg font-mono font-bold text-green-400">{formatTime(stats.onBoardTime)}</div>
                        <div className="text-xs text-gray-400">On Board</div>
                    </div>
                     <div className="bg-gray-700/50 p-3 rounded-lg">
                        <div className="text-lg font-mono font-bold text-yellow-400">{formatTime(stats.offBoardTime)}</div>
                        <div className="text-xs text-gray-400">Off Board</div>
                    </div>
                </div>

                <div className="bg-gray-900/40 p-3 rounded-lg max-h-48 overflow-y-auto">
                    <h3 className="text-sm font-bold text-gray-300 mb-2">Total Tricks</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-mono">
                        {Object.entries(stats.trickCounts).map(([trick, count]) => (
                            <React.Fragment key={trick}>
                                <span className="capitalize text-gray-400">{trick.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-right text-white font-bold">{count}</span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <button onClick={onClose} className="mt-6 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg w-full">
                    Close
                </button>
            </div>
        </div>
    );
};


const DeleteIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#ef4444" className="group-hover:fill-red-500 transition-colors"/>
        <path d="M15 9L9 15M9 9L15 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters.toFixed(0)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
};

const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const formatSpeed = (mps: number) => {
    const kph = mps * 3.6;
    return `${kph.toFixed(1)} km/h`;
};

const RollometerPage: React.FC<{
    onClose: () => void;
    sessions: SkateSession[];
    onAddSession: (session: SkateSession) => void;
    onDeleteSession: (sessionId: string) => void;
    onViewSession: (session: SkateSession) => void;
    onSetPage: (page: any) => void;
}> = ({ onClose, sessions, onAddSession, onDeleteSession, onViewSession, onSetPage }) => {

    const { trackerState, error, startTracking, stopTracking } = useSkateTracker(onAddSession);
    const [stance, setStance] = useState<'REGULAR' | 'GOOFY'>('REGULAR');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [displayMonth, setDisplayMonth] = useState(new Date());
    const [resumeModalOpen, setResumeModalOpen] = useState(false);

    const [showWelcome, setShowWelcome] = useState(() => {
        try {
            return localStorage.getItem('invert_tracker_welcome_seen') !== 'true';
        } catch {
            return false;
        }
    });

    const handleCloseWelcome = (dontShowAgain: boolean) => {
        if (dontShowAgain) {
            try {
                localStorage.setItem('invert_tracker_welcome_seen', 'true');
            } catch {}
        }
        setShowWelcome(false);
    };

    const filteredSessions = useMemo(() => {
        return sessions.filter(s =>
            new Date(s.startTime).toDateString() === selectedDate.toDateString()
        ).sort((a, b) => b.startTime - a.startTime);
    }, [sessions, selectedDate]);

    const isTracking = trackerState.status === 'tracking';

    const trickCounts = trackerState?.counts || {
        ollies: 0,
        airs: 0,
        fsGrinds: 0,
        bsGrinds: 0,
        stalls: 0,
        pumps: 0,
        slams: 0,
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 flex flex-col">
            
            {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}
            {resumeModalOpen && <MonthlyResumeModal sessions={sessions} month={displayMonth} onClose={() => setResumeModalOpen(false)} />}
            
            <header className="w-full my-8 relative">
                <div className="w-full max-w-4xl mx-auto relative flex items-center justify-center">
                    <button onClick={onClose} className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 p-2 -ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="logo-block text-left leading-none">
                        <Logo variant="sk8" className="text-[70px] md:text-[80px]" />
                    </div>
                </div>
            </header>

            <main className="w-full max-w-4xl mx-auto space-y-8">
                
                <section>
                    <div className="bg-neutral-800 rounded-xl p-6 shadow-xl border border-white/5 mb-6">
                        
                        {!isTracking ? (
                            <div className="text-center">
                                <h2 className="text-3xl font-black mb-2">START SESSION</h2>
                                <p className="text-gray-400 mb-6 text-sm">Choose your stance to begin tracking.</p>
                                
                                <div className="flex justify-center gap-4 mb-8">
                                    <button 
                                        onClick={() => setStance('REGULAR')}
                                        className={`px-6 py-3 rounded-lg font-bold transition-all border-2 ${stance === 'REGULAR' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}`}
                                    >
                                        REGULAR
                                    </button>
                                    <button 
                                        onClick={() => setStance('GOOFY')}
                                        className={`px-6 py-3 rounded-lg font-bold transition-all border-2 ${stance === 'GOOFY' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}`}
                                    >
                                        GOOFY
                                    </button>
                                </div>

                                <button
                                    onClick={() => startTracking(stance)}
                                    className="w-full max-w-sm bg-[#c52323] hover:bg-[#a91f1f] text-white font-black py-4 px-8 rounded-full text-xl shadow-lg transition-transform active:scale-95"
                                >
                                    GO SKATE
                                </button>
                            </div>
                        ) : (
                        
                        <div className="text-center">
                            <div className="animate-pulse mb-6 flex flex-col items-center">
                                <div className="text-[#c52323] font-black text-4xl tracking-widest">RECORDING</div>
                                <div className="text-white/50 text-xs mt-1 tracking-widest uppercase">
                                    {trackerState.isRolling ? "STATUS: SKATING" : "STATUS: CHILLING"}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-neutral-900/50 p-4 rounded-lg">
                                    <div className="text-3xl font-mono font-bold">{formatDistance(trackerState.totalDistance)}</div>
                                    <div className="text-xs text-gray-500 font-bold uppercase">Distance</div>
                                </div>
                                <div className="bg-neutral-900/50 p-4 rounded-lg">
                                    <div className="text-3xl font-mono font-bold">{formatTime(trackerState.duration)}</div>
                                    <div className="text-xs text-gray-500 font-bold uppercase">Duration</div>
                                </div>
                                <div className="bg-neutral-900/50 p-4 rounded-lg">
                                    <div className="text-3xl font-mono font-bold text-green-400">{formatTime(trackerState.timeOnBoard)}</div>
                                    <div className="text-xs text-gray-500 font-bold uppercase">On Board</div>
                                </div>
                                <div className="bg-neutral-900/50 p-4 rounded-lg">
                                    <div className="text-3xl font-mono font-bold text-yellow-400">{formatTime(trackerState.timeOffBoard)}</div>
                                    <div className="text-xs text-gray-500 font-bold uppercase">Off Board</div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/40 p-4 rounded-lg mb-8 border border-white/5">
                                <h3 className="text-xs text-gray-400 font-bold uppercase mb-3 tracking-wider">
                                    Tricks (Live)
                                </h3>

                                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                                    <div>🛹 Ollies</div><div className="text-right">{trickCounts.ollies}</div>
                                    <div>✈️ Airs</div><div className="text-right">{trickCounts.airs}</div>
                                    <div>➡️ FS Grinds</div><div className="text-right">{trickCounts.fsGrinds}</div>
                                    <div>⬅️ BS Grinds</div><div className="text-right">{trickCounts.bsGrinds}</div>
                                    <div>⏸️ Stalls</div><div className="text-right">{trickCounts.stalls}</div>
                                    <div>🌊 Pumps</div><div className="text-right">{trickCounts.pumps}</div>
                                    <div>💥 Slams</div><div className="text-right">{trickCounts.slams}</div>
                                </div>
                            </div>

                            <div className="mb-6 grid grid-cols-3 gap-2 text-xs font-mono text-gray-400">
                                <div>Speed: {formatSpeed(trackerState.currentSpeed)}</div>
                                <div>Max: {formatSpeed(trackerState.topSpeed)}</div>
                                {trackerState.debugMessage && <div>{trackerState.debugMessage}</div>}
                            </div>

                            <button
                                onClick={stopTracking}
                                className="w-full max-w-sm bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-colors"
                            >
                                STOP SESSION
                            </button>
                        </div>

                        )}

                        {error && (
                            <div className="mt-4 p-3 bg-red-900/50 border border-red-500/30 text-red-200 text-sm rounded text-center">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="bg-neutral-800 rounded-xl p-6 shadow-xl border border-white/5">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-white">Trick Recognition</h3>
                                <p className="text-sm text-gray-400">Teach the app to recognize your tricks.</p>
                            </div>
                            <button
                                onClick={() => onSetPage('trick-training')}
                                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                <BrainIcon className="w-5 h-5" />
                                <span>Train Tricks</span>
                            </button>
                        </div>
                    </div>

                    <CalendarView 
                        sessions={sessions}
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        currentDisplayMonth={displayMonth}
                        onDisplayMonthChange={setDisplayMonth}
                    />
                     <button
                        onClick={() => setResumeModalOpen(true)}
                        className="w-full mt-2 bg-indigo-700 text-white font-semibold py-3 rounded-md hover:bg-indigo-600 transition-colors"
                    >
                        Resume of {displayMonth.toLocaleString('default', { month: 'long' })}
                    </button>

                    <div className="space-y-3 mt-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Sessions on {selectedDate.toLocaleDateString()}
                        </h3>
                        
                        {filteredSessions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-neutral-800 rounded-lg border border-white/5">
                                No sessions recorded this day.
                            </div>
                        ) : (
                            filteredSessions.map(session => (
                                <div key={session.id} className="bg-neutral-800 rounded-lg p-4 flex items-center justify-between group hover:bg-neutral-750 transition-colors border border-white/5">
                                    
                                    <div className="flex-grow cursor-pointer" onClick={() => onViewSession(session)}>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-lg font-bold text-white">
                                                {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                            <span className="text-xs bg-[#c52323] px-2 py-0.5 rounded text-white font-bold">
                                                {formatDistance(session.totalDistance)}
                                            </span>
                                        </div>

                                        <div className="text-xs text-gray-400 flex gap-3">
                                            <span>⏱ {formatTime(session.activeTime)}</span>
                                            <span>🚀 {formatSpeed(session.topSpeed)}</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                                        className="p-2 text-gray-600 hover:bg-red-900/20 rounded-full transition-colors group"
                                    >
                                        <DeleteIcon />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default RollometerPage;
