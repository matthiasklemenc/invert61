
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Session, Page, SessionDataPoint, SessionHistoryProps, Motion } from '../types';

// --- VISUALIZATION COMPONENT ---
interface SessionGraphProps {
    data: SessionDataPoint[];
    onPointClick: (index: number) => void;
}

const SessionGraph: React.FC<SessionGraphProps> = ({ data, onPointClick }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [tooltip, setTooltip] = useState<{x:number, y:number, text: string} | null>(null);

    if (!data || data.length === 0) return <div className="h-32 bg-gray-900 flex items-center justify-center text-gray-500 text-sm">No detailed data available</div>;

    const width = 600;
    const height = 150;
    const padding = 20;

    // Scales
    const maxTime = data[data.length - 1].timestamp;
    const maxIntensity = Math.max(...data.map(d => d.intensity), 2); // At least 2G scale

    const getX = (t: number) => padding + (t / maxTime) * (width - padding * 2);
    
    // Inverted Y-axis for G-forces:
    // Low G (Weightless/Air) -> Top of graph (Small Y coord)
    // High G (Impact/Compression) -> Bottom of graph (Large Y coord)
    const getY = (v: number) => padding + (v / maxIntensity) * (height - padding * 2);

    // Generate Path
    let pathD = `M ${getX(data[0].timestamp)} ${getY(data[0].intensity)}`;
    data.forEach(d => {
        pathD += ` L ${getX(d.timestamp)} ${getY(d.intensity)}`;
    });

    const handlePointInteraction = (e: React.MouseEvent, d: SessionDataPoint, i: number, x: number, y: number) => {
        e.stopPropagation();
        setTooltip({ x, y, text: `Click to Edit: ${d.label || 'Unknown Spike'}` });
        onPointClick(i);
        setTimeout(() => setTooltip(null), 3000);
    };

    return (
        <div className="w-full overflow-x-auto bg-gray-900 rounded-lg p-2 mb-4 border border-gray-700 relative">
            <h5 className="text-xs text-gray-400 mb-2 font-mono uppercase flex justify-between">
                <span>Energy Signature</span>
                <span className="text-cyan-500 text-[10px]">TAP DOTS TO LABEL TRICKS</span>
            </h5>
            <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px] h-32">
                {/* Grid Lines */}
                <line x1={padding} y1={getY(1)} x2={width-padding} y2={getY(1)} stroke="#374151" strokeDasharray="4" strokeWidth="1" />
                <text x={padding} y={getY(1) - 5} fill="#6b7280" fontSize="10">1G (Gravity)</text>

                {/* Main Data Line */}
                <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" />

                {/* Event Markers */}
                {data.map((d, i) => {
                    // Only show markers for significant events or labeled items
                    if (!d.label && d.intensity < 1.5) return null; 

                    const x = getX(d.timestamp);
                    const y = getY(d.intensity);
                    return (
                        <g key={i} onClick={(e) => handlePointInteraction(e, d, i, x, y)} className="cursor-pointer hover:opacity-80 group">
                            {/* Hit area */}
                            <circle cx={x} cy={y} r="10" fill="transparent" />
                            {/* Visual dot */}
                            <circle cx={x} cy={y} r="4" fill={d.label ? "#10b981" : "#f59e0b"} stroke="#fff" strokeWidth="1" />
                            {d.label && <line x1={x} y1={y} x2={x} y2={y - 15} stroke="#10b981" strokeWidth="1" />}
                            {d.label && <text x={x} y={y - 20} textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="bold">{d.label}</text>}
                        </g>
                    );
                })}
            </svg>
            
            {/* Tooltip Overlay */}
            {tooltip && (
                <div 
                    className="absolute bg-black text-white text-xs px-2 py-1 rounded border border-gray-600 pointer-events-none transform -translate-x-1/2 -translate-y-full z-10"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    {tooltip.text}
                </div>
            )}
        </div>
    );
};


const Calendar: React.FC<{
    sessions: Session[],
    onDateSelect: (date: Date) => void,
    selectedDate: Date | null,
    currentMonth: Date,
    setCurrentMonth: (date: Date) => void
}> = ({ sessions, onDateSelect, selectedDate, currentMonth, setCurrentMonth }) => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    
    const sessionDates = useMemo(() => new Set(sessions.map(s => new Date(s.date).toDateString())), [sessions]);

    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const changeMonth = (offset: number) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-700 rounded">&lt;</button>
                <h3 className="font-bold text-lg">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-700 rounded">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                {days.map(day => {
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const hasSession = sessionDates.has(date.toDateString());
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    return (
                        <div key={day} onClick={() => onDateSelect(date)} className={`p-2 rounded-full cursor-pointer transition-colors text-center ${isSelected ? 'bg-cyan-500 text-gray-900 font-bold' : 'hover:bg-gray-700'} relative`}>
                            {day}
                            {hasSession && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-400 rounded-full"></span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface EditModalProps {
    currentLabel: string | undefined;
    onSave: (label: string | undefined) => void;
    onClose: () => void;
    motions: Motion[];
    onAddMotion: (name: string) => void;
    onDeleteMotion: (id: string) => void;
}

const TrickEditModal: React.FC<EditModalProps> = ({ currentLabel, onSave, onClose, motions, onAddMotion, onDeleteMotion }) => {
    const [selectedMotion, setSelectedMotion] = useState<string>(currentLabel || "");
    const [isAdding, setIsAdding] = useState(false);
    const [newTrickName, setNewTrickName] = useState("");

    const handleSave = () => {
        onSave(selectedMotion === "" ? undefined : selectedMotion);
        onClose();
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
        if(confirm("Delete this trick from the list?")) {
            onDeleteMotion(id);
            if (selectedMotion === motions.find(m => m.id === id)?.name) {
                setSelectedMotion("");
            }
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-cyan-500 shadow-2xl flex flex-col max-h-[90vh]">
                <h3 className="text-xl font-bold text-white mb-2">Identify Trick</h3>
                <p className="text-gray-400 text-sm mb-4">Select the trick performed at this energy spike.</p>
                
                <div className="flex-1 overflow-y-auto mb-6 pr-2">
                     <button 
                         onClick={() => setSelectedMotion("")}
                         className={`w-full text-left px-4 py-3 mb-2 rounded border font-bold ${selectedMotion === "" ? 'bg-red-900 border-red-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-400'}`}
                    >
                        [ Clear Label ]
                    </button>
                    
                    <div className="grid grid-cols-1 gap-2">
                        {motions.map(m => (
                            <div key={m.id} className="flex gap-1">
                                <button
                                    onClick={() => setSelectedMotion(m.name)}
                                    className={`flex-1 text-left px-3 py-3 rounded border transition-colors text-sm font-medium ${
                                        selectedMotion === m.name 
                                        ? 'bg-cyan-900 border-cyan-400 text-cyan-400 font-bold' 
                                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {m.name}
                                </button>
                                <button 
                                    onClick={(e) => handleDelete(e, m.id)}
                                    className="px-3 rounded border border-gray-600 bg-gray-800 text-gray-500 hover:text-red-400 hover:border-red-400 transition-colors"
                                    title="Delete Trick"
                                >
                                    🗑
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add New Section */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        {isAdding ? (
                             <div className="flex flex-col gap-2">
                                <input 
                                    type="text" 
                                    value={newTrickName}
                                    onChange={(e) => setNewTrickName(e.target.value)}
                                    placeholder="Enter trick name..."
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-cyan-400 outline-none"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => setIsAdding(false)} className="flex-1 py-1 text-gray-400 text-xs">Cancel</button>
                                    <button onClick={handleAddNew} className="flex-1 py-1 bg-green-600 text-white rounded text-xs font-bold">Confirm Add</button>
                                </div>
                             </div>
                        ) : (
                            <button 
                                onClick={() => setIsAdding(true)}
                                className="w-full py-2 border border-dashed border-gray-500 text-gray-400 hover:text-cyan-400 hover:border-cyan-400 rounded text-sm transition-colors"
                            >
                                + Add New Trick
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="flex-1 bg-gray-600 py-3 rounded text-gray-200 font-bold">Cancel</button>
                    <button onClick={handleSave} className="flex-1 bg-cyan-500 py-3 rounded text-gray-900 font-bold hover:bg-cyan-400">Save</button>
                </div>
            </div>
        </div>
    );
};

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
    const [editingPointIndex, setEditingPointIndex] = useState<number | null>(null);
    
    // Tracks which sessions are expanded. Default empty {} means all collapsed.
    const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

    const toggleExpansion = (sessionId: string) => {
        setExpandedSessions(prev => ({...prev, [sessionId]: !prev[sessionId]}));
    };

    if (sessions.length === 0) return <p className="text-gray-400 mt-4 text-center">No sessions recorded on this day.</p>;

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
    };

    const handlePointClick = (sessionId: string, index: number) => {
        setEditingSessionId(sessionId);
        setEditingPointIndex(index);
    };

    const savePointLabel = (newLabel: string | undefined) => {
        if (!editingSessionId || editingPointIndex === null) return;
        
        const session = sessions.find(s => s.id === editingSessionId);
        if (!session) return;

        // 1. Clone Session
        const updatedSession = JSON.parse(JSON.stringify(session)) as Session;
        
        // 2. Get Old Label
        const oldLabel = updatedSession.timelineData[editingPointIndex].label;

        // 3. Update Timeline Point
        updatedSession.timelineData[editingPointIndex].label = newLabel;

        // 4. Update Summary Stats
        const summary = updatedSession.trickSummary;
        
        // Remove old count
        if (oldLabel && summary[oldLabel]) {
            summary[oldLabel]--;
            if (summary[oldLabel] <= 0) delete summary[oldLabel];
        }

        // Add new count
        if (newLabel) {
            summary[newLabel] = (summary[newLabel] || 0) + 1;
        }

        // Recalculate Total
        updatedSession.totalTricks = Object.values(summary).reduce((a: number, b: number) => a + b, 0);

        // 5. Propagate Update
        onSessionUpdate(updatedSession);
        
        // 6. Close Modal
        setEditingSessionId(null);
        setEditingPointIndex(null);
    };

    const activeSession = sessions.find(s => s.id === editingSessionId);
    const activePointLabel = (activeSession && editingPointIndex !== null) 
        ? activeSession.timelineData[editingPointIndex].label 
        : undefined;

    return (
        <div className="mt-4 space-y-4">
            {editingSessionId && (
                <TrickEditModal 
                    currentLabel={activePointLabel} 
                    onSave={savePointLabel} 
                    onClose={() => setEditingSessionId(null)}
                    motions={motions}
                    onAddMotion={onAddMotion}
                    onDeleteMotion={onDeleteMotion}
                />
            )}

            {sessions.map((s, i) => {
                const isExpanded = !!expandedSessions[s.id];
                return (
                    <div key={s.id} className="bg-gray-800 rounded-lg border-l-4 border-cyan-500 overflow-hidden shadow-sm mb-4">
                        {/* 
                            Physically separated Clickable Area vs Action Area using Flexbox 
                            This prevents click propagation issues by keeping the delete button out of the expand container.
                        */}
                        <div className="flex">
                            {/* Clickable Header Area (Expands Row) */}
                            <div 
                                className="flex-grow flex justify-between items-center p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                                onClick={() => toggleExpansion(s.id)}
                            >
                                 <div className="flex items-center gap-3">
                                    <span className={`text-cyan-500 text-xs font-bold transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>
                                        ▶
                                    </span>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">Session {i + 1}</h4>
                                        <span className="text-sm text-gray-400">{new Date(s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-3">
                                    {!isExpanded && (
                                        <span className="hidden sm:inline-block text-xs text-gray-400 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-700">
                                            <span className="text-green-400 font-bold">{s.totalTricks}</span> Tricks • <span className="text-cyan-400 font-bold">{formatTime(s.duration)}</span>
                                        </span>
                                    )}
                                 </div>
                            </div>

                            {/* Separated Action Area (Delete Button) */}
                            <div className="flex items-center px-2 border-l border-gray-700 bg-gray-800">
                                <button 
                                    type="button"
                                    onClick={(e) => { 
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDeleteSession(s.id); 
                                    }}
                                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-900/30 rounded-full transition-all active:scale-95"
                                    title="Delete Session"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>

                        {/* Collapsible Content */}
                        {isExpanded && (
                            <div className="p-4 border-t border-gray-700 bg-gray-800 animate-fade-in">
                                {s.timelineData && (
                                    <SessionGraph 
                                        data={s.timelineData} 
                                        onPointClick={(idx) => handlePointClick(s.id, idx)}
                                    />
                                )}
                                
                                <div className="grid grid-cols-2 gap-4 text-sm mt-4 bg-gray-900 p-3 rounded">
                                    <div>
                                        <p className="text-gray-500 text-xs">DURATION</p>
                                        <p className="font-mono font-bold text-cyan-400 text-lg">{formatTime(s.duration)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">TOTAL TRICKS</p>
                                        <p className="font-mono font-bold text-green-400 text-lg">{s.totalTricks}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">MAX SPEED</p>
                                        <p className="font-mono font-bold text-white text-lg">{s.maxSpeed || 0} <span className="text-xs text-gray-500">km/h</span></p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">AVG SPEED</p>
                                        <p className="font-mono font-bold text-white text-lg">{s.avgSpeed || 0} <span className="text-xs text-gray-500">km/h</span></p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className="text-gray-400 text-xs font-bold mb-2 uppercase">Detected Tricks</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(s.trickSummary).length > 0 ? Object.entries(s.trickSummary).map(([trick, count]) => {
                                            if ((count as number) <= 0) return null;
                                            return (
                                                <span key={trick} className="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-200 border border-gray-600 flex items-center gap-2">
                                                    {trick}
                                                    <span className="bg-gray-900 px-1.5 rounded-full text-[10px] text-cyan-400 font-mono">{count as number}</span>
                                                </span>
                                            );
                                        }) : (
                                            <span className="text-gray-500 text-xs italic">No tricks detected yet.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};


const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions, navigate, onSessionUpdate, onDeleteSession, motions, onAddMotion, onDeleteMotion, onBack }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const sessionsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return sessions.filter(s => new Date(s.date).toDateString() === selectedDate.toDateString());
  }, [sessions, selectedDate]);
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="w-full">
        <Calendar 
            sessions={sessions}
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
        />
        {selectedDate && (
            <SessionDetails 
                sessions={sessionsOnSelectedDate} 
                onSessionUpdate={onSessionUpdate} 
                onDeleteSession={onDeleteSession}
                motions={motions}
                onAddMotion={onAddMotion}
                onDeleteMotion={onDeleteMotion}
            />
        )}
         <div className="mt-8 flex flex-col gap-3">
             <button 
                onClick={() => navigate(Page.SessionTracker)}
                className="w-full bg-green-500 text-gray-900 font-bold py-4 rounded-lg hover:bg-green-400 transition-colors duration-200 shadow-lg flex items-center justify-center gap-2"
            >
                <span>●</span> START NEW SESSION
            </button>
            <button 
                onClick={onBack}
                className="w-full bg-gray-700 text-gray-300 font-bold py-3 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
                BACK
            </button>
         </div>
    </div>
  );
};

export default SessionHistory;
