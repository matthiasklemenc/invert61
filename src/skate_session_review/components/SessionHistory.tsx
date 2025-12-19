import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Session, Page, SessionDataPoint, SessionHistoryProps, Motion } from '../types';
import SkateMap from '../../maptiler/SkateMap';

// --- UTILS ---
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}

// --- VISUALIZATION COMPONENT ---
interface SessionGraphProps {
    data: SessionDataPoint[];
    selectedIndices: Set<number>;
    onTogglePoint: (index: number) => void;
}

const SessionGraph: React.FC<SessionGraphProps> = ({ data, selectedIndices, onTogglePoint }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    const [containerSize, setContainerSize] = useState({ width: 0, height: 250 });

    const contentWidth = useMemo(() => {
        if (!data.length) return containerSize.width || 300;
        const minPxPerPoint = 14; 
        const calcWidth = data.length * minPxPerPoint;
        return Math.max(containerSize.width || 300, calcWidth);
    }, [data.length, containerSize.width]);

    const maxTime = useMemo(() => data.length > 0 ? Math.max(data[data.length - 1].timestamp, 0.1) : 1, [data]);
    const maxIntensity = useMemo(() => Math.max(...data.map(d => d.intensity), 3.0), [data]);

    useEffect(() => {
        const updateSize = () => {
            if (wrapperRef.current) {
                const { clientWidth, clientHeight } = wrapperRef.current;
                setContainerSize({ 
                    width: clientWidth || 300, 
                    height: clientHeight || 250 
                });
            }
        };
        
        updateSize();
        const observer = new ResizeObserver(updateSize);
        if (wrapperRef.current) observer.observe(wrapperRef.current);
        return () => observer.disconnect();
    }, []);

    const pointCoords = useMemo(() => {
        if (!contentWidth || !containerSize.height) return [];
        
        const paddingX = 20;
        const paddingTop = 40; 
        const paddingBottom = 20;
        const graphHeight = containerSize.height - paddingTop - paddingBottom;
        const graphWidth = contentWidth - paddingX * 2;

        return data.map((d, i) => {
            const x = paddingX + (d.timestamp / maxTime) * graphWidth;
            const y = (paddingTop + graphHeight) - (d.intensity / maxIntensity) * graphHeight;
            
            return { x, y, index: i, data: d };
        });
    }, [data, contentWidth, containerSize.height, maxTime, maxIntensity]);

    const svgPathD = useMemo(() => {
        if (pointCoords.length === 0) return "";
        let d = `M ${pointCoords[0].x} ${pointCoords[0].y}`;
        for(let i=1; i<pointCoords.length; i++) {
            d += ` L ${pointCoords[i].x} ${pointCoords[i].y}`;
        }
        return d;
    }, [pointCoords]);

    if (data.length === 0) {
        return <div className="text-gray-500 text-center py-8 text-xs font-mono uppercase">No movement logs found.</div>;
    }

    return (
        <div className="relative w-full bg-gray-900 rounded-lg mb-4 border border-gray-700 overflow-hidden shadow-inner">
            <div className="flex justify-between items-center bg-gray-800/50 p-2 border-b border-gray-700 relative z-20">
                <h5 className="text-xs text-gray-400 font-mono uppercase ml-2 tracking-tighter font-bold">Motion Timeline</h5>
                <div className="text-[9px] text-gray-500 mr-2 uppercase font-bold">Tap markers to name tricks</div>
            </div>

            <div ref={wrapperRef} className="relative w-full h-64">
                <div ref={scrollContainerRef} className="w-full h-full overflow-x-auto overflow-y-hidden" style={{ scrollBehavior: 'smooth' }}>
                    <div style={{ width: contentWidth, height: '100%' }} className="relative">
                        <svg width={contentWidth} height={containerSize.height} className="absolute inset-0">
                            {/* Horizontal grid lines */}
                            {(() => {
                                const graphHeight = containerSize.height - 60; 
                                const y1g = (40 + graphHeight) - (1.0 / maxIntensity) * graphHeight;
                                return <line x1="0" y1={y1g} x2={contentWidth} y2={y1g} stroke="#374151" strokeDasharray="4" strokeWidth="1" />;
                            })()}

                            <path d={svgPathD} fill="none" stroke="#4b5563" strokeWidth="1.5" strokeLinejoin="round" />

                            {pointCoords.map((pt) => {
                                const isSelected = selectedIndices.has(pt.index);
                                const isLabeled = !!pt.data.label;
                                const isTurn = pt.data.turnAngle !== undefined && Math.abs(pt.data.turnAngle) > 0;
                                const isImpact = pt.data.intensity > 1.8; 

                                // Only render markers for significant events or selections
                                if (!isTurn && !isLabeled && !isImpact && !isSelected) return null;

                                let dotColor = isTurn ? (pt.data.turnAngle! > 0 ? "#22d3ee" : "#ef4444") : (isImpact ? "#f59e0b" : "#4b5563"); 
                                let dotRadius = isImpact ? 5 : 4;
                                let strokeColor = "#fff";
                                let strokeWidth = 1;

                                if (isLabeled) {
                                    dotColor = stringToColor(pt.data.label!);
                                    if (pt.data.isGroupStart) dotRadius = 6;
                                }

                                if (isSelected) {
                                    dotColor = "#ef4444"; 
                                    dotRadius = 7;
                                    strokeColor = "#fff";
                                    strokeWidth = 2;
                                }

                                return (
                                    <g key={pt.index} style={{cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); onTogglePoint(pt.index); }}>
                                        {/* Hit area */}
                                        <circle cx={pt.x} cy={pt.y} r={22} fill="transparent" />
                                        
                                        {isSelected && (
                                            <circle cx={pt.x} cy={pt.y} r={14} fill="#ef4444" fillOpacity="0.3">
                                                <animate attributeName="r" values="12;14;12" dur="2s" repeatCount="indefinite" />
                                            </circle>
                                        )}
                                        
                                        <circle cx={pt.x} cy={pt.y} r={dotRadius} fill={dotColor} stroke={strokeColor} strokeWidth={strokeWidth} />
                                        
                                        {isTurn && !isSelected && (
                                            <g>
                                                <text x={pt.x} y={pt.y - 24} textAnchor="middle" fill={pt.data.turnAngle! > 0 ? "#22d3ee" : "#ef4444"} fontSize="9" fontWeight="900" style={{textShadow: '0px 1px 2px black', textTransform: 'uppercase'}}>{pt.data.turnAngle! > 0 ? 'R' : 'L'}</text>
                                                <text x={pt.x} y={pt.y - 12} textAnchor="middle" fill={pt.data.turnAngle! > 0 ? "#22d3ee" : "#ef4444"} fontSize="10" fontWeight="bold" fontFamily="monospace" style={{textShadow: '0px 1px 2px black'}}>{Math.abs(pt.data.turnAngle!)}°</text>
                                            </g>
                                        )}
                                        
                                        {isLabeled && pt.data.isGroupStart && !isSelected && (
                                            <g pointerEvents="none">
                                                <line x1={pt.x} y1={pt.y} x2={pt.x} y2={pt.y + 15} stroke={dotColor} strokeWidth="1" />
                                                <text x={pt.x} y={pt.y + 25} textAnchor="middle" fill={dotColor} fontSize="10" fontWeight="bold" style={{textShadow: '0px 1px 2px black'}}>{pt.data.label}</text>
                                            </g>
                                        )}
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

// --- CALENDAR COMPONENT ---
interface CalendarProps {
    sessions: Session[];
    onDateSelect: (date: Date) => void;
    selectedDate: Date | null;
    currentMonth: Date;
    setCurrentMonth: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ sessions, onDateSelect, selectedDate, currentMonth, setCurrentMonth }) => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    
    const sessionDates = useMemo(() => new Set(sessions.map(s => new Date(s.date).toDateString())), [sessions]);

    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const changeMonth = (offset: number) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
    };

    return (
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-700 rounded-full transition-colors text-cyan-400">◀</button>
                <h3 className="font-black text-white uppercase tracking-widest">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-700 rounded-full transition-colors text-cyan-400">▶</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-gray-500 mb-2 uppercase tracking-tighter">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                {days.map(day => {
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const hasSession = sessionDates.has(date.toDateString());
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    return (
                        <div key={day} onClick={() => onDateSelect(date)} className={`p-2 rounded-lg cursor-pointer transition-all text-center relative ${isSelected ? 'bg-cyan-500 text-gray-900 font-black' : 'hover:bg-gray-700 text-gray-400'}`}>
                            {day}
                            {hasSession && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-400 rounded-full"></span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- TRICK EDIT MODAL ---
interface EditModalProps {
    onSave: (label: string) => void;
    onClose: () => void;
    motions: Motion[];
    onAddMotion: (name: string) => void;
    onDeleteMotion: (id: string) => void;
    selectionCount: number;
}

const TrickEditModal: React.FC<EditModalProps> = ({ onSave, onClose, motions, onAddMotion, onDeleteMotion, selectionCount }) => {
    const [selectedMotion, setSelectedMotion] = useState<string>("");
    const [isAdding, setIsAdding] = useState(false);
    const [newTrickName, setNewTrickName] = useState("");

    const handleSave = () => {
        if (selectedMotion) {
            onSave(selectedMotion);
            onClose();
        }
    };

    const handleAddNew = () => {
        if(newTrickName.trim()) {
            onAddMotion(newTrickName.trim());
            setNewTrickName("");
            setIsAdding(false);
        }
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(confirm("Delete this trick definition?")) {
            onDeleteMotion(id);
            if (selectedMotion === motions.find(m => m.id === id)?.name) {
                setSelectedMotion("");
            }
        }
    }

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-cyan-500 shadow-2xl flex flex-col max-h-[90vh]">
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter italic">Tag Move</h3>
                <p className="text-gray-400 text-[10px] uppercase font-bold mb-4 tracking-widest">Grouping <span className="text-cyan-400">{selectionCount}</span> data points</p>
                <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-2">
                        {motions.map(m => (
                            <div key={m.id} className="flex gap-1">
                                <button
                                    onClick={() => setSelectedMotion(m.name)}
                                    className={`flex-1 text-left px-4 py-3 rounded-xl border transition-all text-sm font-black uppercase tracking-widest ${selectedMotion === m.name ? 'bg-cyan-900 border-cyan-400 text-cyan-400' : 'bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600'}`}
                                >{m.name}</button>
                                <button onClick={(e) => handleDelete(e, m.id)} className="px-4 rounded-xl border border-gray-600 bg-gray-800 text-gray-500 hover:text-red-400 hover:border-red-400 transition-colors">🗑</button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        {isAdding ? (
                             <div className="flex flex-col gap-2">
                                <input type="text" value={newTrickName} onChange={(e) => setNewTrickName(e.target.value)} placeholder="New trick name..." className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white focus:border-cyan-400 outline-none font-bold" autoFocus />
                                <div className="flex gap-2">
                                    <button onClick={() => setIsAdding(false)} className="flex-1 py-2 text-gray-500 text-xs font-bold uppercase">Cancel</button>
                                    <button onClick={handleAddNew} className="flex-1 py-2 bg-green-600 text-white rounded-xl text-xs font-black uppercase">Add</button>
                                </div>
                             </div>
                        ) : (
                            <button onClick={() => setIsAdding(true)} className="w-full py-3 border-2 border-dashed border-gray-600 text-gray-500 hover:text-cyan-400 hover:border-cyan-400 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">+ Create New Label</button>
                        )}
                    </div>
                </div>
                <div className="flex gap-3 mt-auto pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="flex-1 bg-gray-700 py-4 rounded-xl text-gray-300 font-black uppercase tracking-widest">Back</button>
                    <button onClick={handleSave} disabled={!selectedMotion} className="flex-1 bg-cyan-500 py-4 rounded-xl text-gray-900 font-black uppercase tracking-widest hover:bg-cyan-400 disabled:opacity-50 shadow-lg">Save</button>
                </div>
            </div>
        </div>
    );
};

// --- SESSION DETAILS ---
interface SessionDetailsProps {
    sessions: Session[];
    onSessionUpdate: (s: Session) => void;
    onDeleteSession: (id: string) => void;
    motions: Motion[];
    onAddMotion: (name: string) => void;
    onDeleteMotion: (id: string) => void;
}

const SessionDetails: React.FC<SessionDetailsProps> = ({sessions, onSessionUpdate, onDeleteSession, motions, onAddMotion, onDeleteMotion}) => {
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [selectedPointIndices, setSelectedPointIndices] = useState<Set<number>>(new Set());
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

    const toggleExpansion = (sessionId: string) => {
        setExpandedSessions(prev => ({...prev, [sessionId]: !prev[sessionId]}));
    };

    if (sessions.length === 0) return <p className="text-gray-500 mt-10 text-center font-bold uppercase tracking-widest text-xs">No sessions recorded for this date.</p>;

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
    };

    const handleTogglePoint = (sessionId: string, index: number) => {
        if (editingSessionId !== sessionId) {
            setEditingSessionId(sessionId);
            setSelectedPointIndices(new Set([index]));
        } else {
            const newSet = new Set(selectedPointIndices);
            if (newSet.has(index)) newSet.delete(index);
            else newSet.add(index);
            setSelectedPointIndices(newSet);
        }
    };

    const saveGroupLabel = (newLabel: string) => {
        if (!editingSessionId || selectedPointIndices.size === 0) return;
        const session = sessions.find(s => s.id === editingSessionId);
        if (!session) return;

        const updatedSession = JSON.parse(JSON.stringify(session)) as Session;
        const groupId = `group-${Date.now()}`;
        const sortedIndices = Array.from<number>(selectedPointIndices).sort((a, b) => a - b);
        
        sortedIndices.forEach((idx) => {
            const point = updatedSession.timelineData[idx];
            if (point.label && point.isGroupStart) {
                 const currentCount = updatedSession.trickSummary[point.label] || 0;
                 if (currentCount > 0) updatedSession.trickSummary[point.label] = (currentCount as number) - 1;
                 if ((updatedSession.trickSummary[point.label] as number) <= 0) delete updatedSession.trickSummary[point.label];
            }
            point.label = newLabel;
            point.groupId = groupId;
            point.isGroupStart = false;
        });

        if (sortedIndices.length > 0) updatedSession.timelineData[sortedIndices[0]].isGroupStart = true;
        updatedSession.trickSummary[newLabel] = ((updatedSession.trickSummary[newLabel] as number) || 0) + 1;
        updatedSession.totalTricks = Object.values(updatedSession.trickSummary).reduce((acc, val) => (acc as number) + (val as number), 0) as number;

        onSessionUpdate(updatedSession);
        setShowGroupModal(false);
        setSelectedPointIndices(new Set());
    };

    return (
        <div className="mt-6 space-y-4">
            {showGroupModal && <TrickEditModal onSave={saveGroupLabel} onClose={() => setShowGroupModal(false)} motions={motions} onAddMotion={onAddMotion} onDeleteMotion={onDeleteMotion} selectionCount={selectedPointIndices.size} />}
            {sessions.map((s, i) => {
                const isExpanded = !!expandedSessions[s.id];
                const isThisSessionEditing = editingSessionId === s.id;
                const hasSelection = isThisSessionEditing && selectedPointIndices.size > 0;
                let buttonLabel = hasSelection && selectedPointIndices.size > 1 ? `Group (${selectedPointIndices.size})` : "Tag Selection";

                return (
                    <div key={s.id} className="bg-gray-800 rounded-2xl border-l-4 border-cyan-500 overflow-hidden shadow-xl mb-4">
                        <div className="flex">
                            <div className="flex-grow flex justify-between items-center p-5 cursor-pointer hover:bg-gray-700/50 transition-colors" onClick={() => toggleExpansion(s.id)}>
                                 <div className="flex items-center gap-4">
                                    <span className={`text-cyan-500 text-xs transform transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>▶</span>
                                    <div>
                                        <h4 className="font-black text-white text-lg uppercase tracking-tighter italic">Session {i + 1}</h4>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{new Date(s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                 </div>
                                 {!isExpanded && <span className="text-[9px] font-black text-gray-400 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-700 uppercase tracking-widest"><span className="text-green-400">{s.totalTricks}</span> Tricks</span>}
                            </div>
                            <button onClick={() => onDeleteSession(s.id)} className="px-5 text-gray-600 hover:text-red-500 transition-colors border-l border-gray-700">🗑</button>
                        </div>
                        {isExpanded && (
                            <div className="p-4 border-t border-gray-700 bg-gray-800">
                                <SessionGraph data={s.timelineData} selectedIndices={isThisSessionEditing ? selectedPointIndices : new Set()} onTogglePoint={(idx) => handleTogglePoint(s.id, idx)} />
                                <div className="flex justify-end mb-6">
                                    <button 
                                        onClick={() => setShowGroupModal(true)} 
                                        disabled={!hasSelection} 
                                        className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${hasSelection ? 'bg-cyan-500 text-gray-900 shadow-lg' : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'}`}
                                    >
                                        {buttonLabel}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4 bg-gray-900 p-4 rounded-xl border border-gray-700">
                                    <div><p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-1">Duration</p><p className="font-mono font-bold text-cyan-400 text-lg">{formatTime(s.duration)}</p></div>
                                    <div><p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-1">Tricks</p><p className="font-mono font-bold text-green-400 text-lg">{s.totalTricks}</p></div>
                                    <div><p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-1">Max Speed</p><p className="font-mono font-bold text-white text-lg">{s.maxSpeed || 0} <span className="text-[10px]">km/h</span></p></div>
                                    <div><p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-1">Avg Speed</p><p className="font-mono font-bold text-white text-lg">{s.avgSpeed || 0} <span className="text-[10px]">km/h</span></p></div>
                                </div>
                                <div className="mt-6">
                                    <p className="text-gray-400 text-[10px] font-black mb-3 uppercase tracking-widest">Move Breakdown</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(s.trickSummary).length > 0 ? Object.entries(s.trickSummary).map(([trick, count]) => (
                                            (count as number) > 0 && <span key={trick} className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-white border border-white/10 shadow-sm flex items-center gap-2" style={{backgroundColor: stringToColor(trick)}}>{trick} <span className="bg-black/30 px-2 py-0.5 rounded-full text-[9px]">{count}</span></span>
                                        )) : <p className="text-gray-600 text-[10px] font-bold uppercase italic">No tricks tagged yet.</p>}
                                    </div>
                                </div>
                                {s.path && s.path.length > 0 && <div className="mt-8"><p className="text-gray-400 text-[10px] font-black mb-3 uppercase tracking-widest">Session Path</p><div className="rounded-2xl overflow-hidden border border-gray-700 bg-gray-900 shadow-2xl"><SkateMap path={s.path} className="h-60 w-full" /></div></div>}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// --- MAIN SESSION HISTORY COMPONENT ---
const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions, navigate, onSessionUpdate, onDeleteSession, motions, onAddMotion, onDeleteMotion, onBack }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const sessionsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return sessions.filter(s => new Date(s.date).toDateString() === selectedDate.toDateString());
  }, [sessions, selectedDate]);
  
  const handleDateSelect = (date: Date) => setSelectedDate(date);

  return (
    <div className="w-full">
        <Calendar sessions={sessions} onDateSelect={handleDateSelect} selectedDate={selectedDate} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
        {selectedDate && <SessionDetails sessions={sessionsOnSelectedDate} onSessionUpdate={onSessionUpdate} onDeleteSession={onDeleteSession} motions={motions} onAddMotion={onAddMotion} onDeleteMotion={onDeleteMotion} />}
         <div className="mt-10 flex flex-col gap-3">
             <button onClick={() => navigate(Page.SessionTracker)} className="w-full bg-green-500 text-gray-900 font-black py-5 rounded-2xl hover:bg-green-400 transition-all shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest italic"><span>●</span> Start Tracking</button>
            <button onClick={onBack} className="w-full bg-gray-800 text-gray-500 font-black py-3 rounded-2xl hover:bg-gray-700 hover:text-gray-300 transition-all uppercase tracking-widest text-xs">Exit</button>
         </div>
    </div>
  );
};

export default SessionHistory;