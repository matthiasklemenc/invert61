
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Session, Page, SessionDataPoint, SessionHistoryProps, Motion } from '../types';

// --- UTILS ---
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}

// Point in Polygon Algorithm (Ray Casting)
const isPointInPolygon = (point: {x: number, y: number}, vs: {x: number, y: number}[]) => {
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i].x, yi = vs[i].y;
        let xj = vs[j].x, yj = vs[j].y;
        
        let intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

// --- VISUALIZATION COMPONENT ---
interface SessionGraphProps {
    data: SessionDataPoint[];
    onSelectionComplete: (indices: number[]) => void;
}

const SessionGraph: React.FC<SessionGraphProps> = ({ data, onSelectionComplete }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lassoPath, setLassoPath] = useState<{x: number, y: number}[]>([]);
    
    // Graph Dimensions
    const width = 600;
    const height = 200; 
    const paddingX = 20;
    const paddingTop = 50; 
    const paddingBottom = 20;
    const graphHeight = height - paddingTop - paddingBottom;

    // Scales
    const maxTime = data[data.length - 1].timestamp;
    const maxIntensity = Math.max(...data.map(d => d.intensity), 3.0); 

    const getX = (t: number) => paddingX + (t / maxTime) * (width - paddingX * 2);
    // Inverted Y: 0G is Top, MaxG is Bottom
    const getY = (v: number) => paddingTop + (v / maxIntensity) * graphHeight;

    // Cache point coordinates for hit testing
    const pointCoords = useMemo(() => {
        return data.map((d, i) => ({
            x: getX(d.timestamp),
            y: getY(d.intensity),
            index: i,
            data: d
        }));
    }, [data, maxTime, maxIntensity]);

    // Path for SVG line
    let pathD = `M ${pointCoords[0].x} ${pointCoords[0].y}`;
    for(let i=1; i<pointCoords.length; i++) {
        pathD += ` L ${pointCoords[i].x} ${pointCoords[i].y}`;
    }

    // --- DRAWING HANDLERS ---
    const getCanvasCoords = (e: React.PointerEvent | React.TouchEvent) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.PointerEvent).clientX;
            clientY = (e as React.PointerEvent).clientY;
        }

        // Scale coordinates to SVG viewBox (600x200)
        const scaleX = width / rect.width;
        const scaleY = height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.PointerEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const coords = getCanvasCoords(e);
        setLassoPath([coords]);
    };

    const draw = (e: React.PointerEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        // Prevent scrolling on touch devices while drawing
        if (e.cancelable && 'preventDefault' in e) e.preventDefault();
        
        const coords = getCanvasCoords(e);
        setLassoPath(prev => [...prev, coords]);
    };

    const endDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (lassoPath.length > 2) {
            // Check points inside polygon
            const selectedIndices: number[] = [];
            pointCoords.forEach(pt => {
                if (isPointInPolygon({x: pt.x, y: pt.y}, lassoPath)) {
                    selectedIndices.push(pt.index);
                }
            });

            if (selectedIndices.length > 0) {
                onSelectionComplete(selectedIndices);
            }
        }
        setLassoPath([]);
    };

    // Draw Lasso on Canvas
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, width, height);
            if (lassoPath.length > 0) {
                ctx.strokeStyle = '#22d3ee'; // Cyan
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 3]);
                ctx.beginPath();
                ctx.moveTo(lassoPath[0].x, lassoPath[0].y);
                for (let i = 1; i < lassoPath.length; i++) {
                    ctx.lineTo(lassoPath[i].x, lassoPath[i].y);
                }
                ctx.stroke();
                
                // Draw closing line hint
                ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
                ctx.beginPath();
                ctx.moveTo(lassoPath[lassoPath.length-1].x, lassoPath[lassoPath.length-1].y);
                ctx.lineTo(lassoPath[0].x, lassoPath[0].y);
                ctx.stroke();
            }
        }
    }, [lassoPath]);

    return (
        <div 
            ref={containerRef}
            className="w-full overflow-hidden bg-gray-900 rounded-lg p-0 mb-4 border border-gray-700 relative select-none"
            style={{ touchAction: 'none' }} // Critical: Disables browser scrolling
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={endDrawing}
            onPointerLeave={endDrawing}
            // Add Touch events for better mobile support if Pointer events fail on some browsers
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
        >
            <div className="absolute top-2 left-2 right-2 pointer-events-none z-20 flex justify-between">
                <h5 className="text-xs text-gray-400 font-mono uppercase">
                    Motion Sequence
                </h5>
                <span className="text-cyan-500 text-[10px] font-mono uppercase animate-pulse">
                    DRAW CIRCLE TO GROUP
                </span>
            </div>

            {/* Canvas for Lasso Drawing */}
            <canvas 
                ref={canvasRef}
                width={width}
                height={height}
                className="absolute inset-0 z-10 pointer-events-none"
            />

            {/* SVG for Data Visualization */}
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 pointer-events-none">
                {/* 1G Reference Line */}
                <line x1={paddingX} y1={getY(1)} x2={width-paddingX} y2={getY(1)} stroke="#374151" strokeDasharray="4" strokeWidth="1" />
                <text x={paddingX} y={getY(1) - 5} fill="#6b7280" fontSize="10">1G</text>

                {/* Main Data Line */}
                <path d={pathD} fill="none" stroke="#4b5563" strokeWidth="1.5" strokeLinejoin="round" />

                {/* Event Markers */}
                {pointCoords.map((pt, i) => {
                    const d = pt.data;
                    const isSignificant = d.intensity > 1.5 || d.intensity < 0.8 || (d.rotation && d.rotation > 10);
                    
                    if (!isSignificant && !d.label) return null; 

                    let dotColor = "#f59e0b"; // Default orange
                    let dotRadius = 4;
                    
                    if (d.label) {
                        dotColor = stringToColor(d.label);
                        if (d.isGroupStart) {
                            dotRadius = 8;
                        } else if (d.groupId) {
                            dotColor = stringToColor(d.label);
                            dotRadius = 3;
                        }
                    }

                    return (
                        <g key={i}>
                            <circle cx={pt.x} cy={pt.y} r={dotRadius} fill={dotColor} stroke="#fff" strokeWidth="1" />
                            {d.label && d.isGroupStart && (
                                <g>
                                    <line x1={pt.x} y1={pt.y} x2={pt.x} y2={pt.y - 20} stroke={dotColor} strokeWidth="1" />
                                    <text x={pt.x} y={pt.y - 25} textAnchor="middle" fill={dotColor} fontSize="12" fontWeight="bold" style={{textShadow: '0px 1px 2px black'}}>
                                        {d.label}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>
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

// --- GROUP TRICK EDIT MODAL ---
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
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-cyan-500 shadow-2xl flex flex-col max-h-[90vh]">
                <h3 className="text-xl font-bold text-white mb-2">Define Trick</h3>
                <p className="text-gray-400 text-sm mb-4">
                    Grouping <span className="text-cyan-400 font-bold">{selectionCount}</span> motion points. 
                    Name this sequence:
                </p>
                
                <div className="flex-1 overflow-y-auto mb-6 pr-2">
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
                                    placeholder="Enter new trick name..."
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
                                + Add New Trick Name
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="flex-1 bg-gray-600 py-3 rounded text-gray-200 font-bold">Cancel</button>
                    <button onClick={handleSave} disabled={!selectedMotion} className="flex-1 bg-cyan-500 py-3 rounded text-gray-900 font-bold hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed">Save Group</button>
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
    const [selectedPointIndices, setSelectedPointIndices] = useState<number[]>([]);
    
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

    const handleSelectionComplete = (sessionId: string, indices: number[]) => {
        setEditingSessionId(sessionId);
        setSelectedPointIndices(indices);
    };

    const saveGroupLabel = (newLabel: string) => {
        if (!editingSessionId || selectedPointIndices.length === 0) return;
        
        const session = sessions.find(s => s.id === editingSessionId);
        if (!session) return;

        // 1. Clone Session
        const updatedSession = JSON.parse(JSON.stringify(session)) as Session;
        
        const groupId = `group-${Date.now()}`;
        
        // 2. Iterate selected indices and update
        // We need to be careful not to double count if modifying existing tricks
        
        // First sort indices to find the "start" of the group visually
        const sortedIndices = [...selectedPointIndices].sort((a,b) => a - b);
        
        sortedIndices.forEach((idx, i) => {
            const oldLabel = updatedSession.timelineData[idx].label;
            const wasGroupStart = updatedSession.timelineData[idx].isGroupStart;

            // If overwriting a previous trick start, decrement count
            if (oldLabel && wasGroupStart) {
                 if (updatedSession.trickSummary[oldLabel]) updatedSession.trickSummary[oldLabel]--;
                 if (updatedSession.trickSummary[oldLabel] <= 0) delete updatedSession.trickSummary[oldLabel];
            }

            updatedSession.timelineData[idx].label = newLabel;
            updatedSession.timelineData[idx].groupId = groupId;
            // Only the first point in the selection gets the visual label text
            updatedSession.timelineData[idx].isGroupStart = (i === 0);
        });

        // 3. Update Summary Stats (Increment for the new trick group)
        const summary = updatedSession.trickSummary;
        summary[newLabel] = (summary[newLabel] || 0) + 1;

        // Recalculate Total
        updatedSession.totalTricks = Object.values(summary).reduce((a: number, b: number) => a + b, 0);

        // 4. Propagate Update
        onSessionUpdate(updatedSession);
        
        // 5. Close Modal
        setEditingSessionId(null);
        setSelectedPointIndices([]);
    };

    return (
        <div className="mt-4 space-y-4">
            
            {editingSessionId && selectedPointIndices.length > 0 && (
                <TrickEditModal 
                    onSave={saveGroupLabel} 
                    onClose={() => { setEditingSessionId(null); setSelectedPointIndices([]); }}
                    motions={motions}
                    onAddMotion={onAddMotion}
                    onDeleteMotion={onDeleteMotion}
                    selectionCount={selectedPointIndices.length}
                />
            )}

            {sessions.map((s, i) => {
                const isExpanded = !!expandedSessions[s.id];
                return (
                    <div key={s.id} className="bg-gray-800 rounded-lg border-l-4 border-cyan-500 overflow-hidden shadow-sm mb-4">
                        <div className="flex">
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

                        {isExpanded && (
                            <div className="p-4 border-t border-gray-700 bg-gray-800 animate-fade-in">
                                {s.timelineData && (
                                    <SessionGraph 
                                        data={s.timelineData} 
                                        onSelectionComplete={(indices) => handleSelectionComplete(s.id, indices)}
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
                                                <span key={trick} className="px-3 py-1 rounded-full text-xs text-white border border-gray-600 flex items-center gap-2" style={{backgroundColor: stringToColor(trick)}}>
                                                    <span style={{textShadow: '0 1px 2px black'}}>{trick}</span>
                                                    <span className="bg-black/40 px-1.5 rounded-full text-[10px] text-white font-mono">{count as number}</span>
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
