
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
    
    // Dimensions
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Determine content width based on data density
    const contentWidth = useMemo(() => {
        if (!data.length) return containerSize.width;
        // 12px per point ensures they are clickable
        const minPxPerPoint = 12; 
        const calcWidth = data.length * minPxPerPoint;
        return Math.max(containerSize.width, calcWidth);
    }, [data.length, containerSize.width]);

    // Scales
    const maxTime = useMemo(() => data.length > 0 ? Math.max(data[data.length - 1].timestamp, 0.1) : 1, [data]);
    const maxIntensity = useMemo(() => Math.max(...data.map(d => d.intensity), 3.0), [data]);

    // Resize Observer
    useEffect(() => {
        const updateSize = () => {
            if (wrapperRef.current) {
                const { clientWidth, clientHeight } = wrapperRef.current;
                setContainerSize({ width: clientWidth || 300, height: clientHeight || 250 });
            }
        };
        
        updateSize();
        const observer = new ResizeObserver(updateSize);
        if (wrapperRef.current) observer.observe(wrapperRef.current);
        return () => observer.disconnect();
    }, []);

    // Point Coordinates relative to the CONTENT
    const pointCoords = useMemo(() => {
        if (contentWidth === 0 || containerSize.height === 0) return [];
        
        const paddingX = 20;
        const paddingTop = 40; 
        const paddingBottom = 20;
        const graphHeight = containerSize.height - paddingTop - paddingBottom;
        const graphWidth = contentWidth - paddingX * 2;

        return data.map((d, i) => {
            const x = paddingX + (d.timestamp / maxTime) * graphWidth;
            const y = (paddingTop + graphHeight) - (d.intensity / maxIntensity) * graphHeight;
            
            return {
                x,
                y,
                index: i,
                data: d
            };
        });
    }, [data, contentWidth, containerSize.height, maxTime, maxIntensity]);

    // SVG Path for the line
    const svgPathD = useMemo(() => {
        if (pointCoords.length === 0) return "";
        let d = `M ${pointCoords[0].x} ${pointCoords[0].y}`;
        for(let i=1; i<pointCoords.length; i++) {
            d += ` L ${pointCoords[i].x} ${pointCoords[i].y}`;
        }
        return d;
    }, [pointCoords]);

    if (data.length === 0) {
        return <div className="text-gray-500 text-center py-8 text-xs">No motion data recorded for this session.</div>;
    }

    return (
        <div className="relative w-full bg-gray-900 rounded-lg mb-4 border border-gray-700 overflow-hidden shadow-inner">
            {/* Header / Info */}
            <div className="flex justify-between items-center bg-gray-800/50 p-2 border-b border-gray-700 relative z-20">
                <h5 className="text-xs text-gray-400 font-mono uppercase ml-2">
                    Motion Sequence
                </h5>
                <div className="text-[10px] text-gray-500 mr-2">
                    Click points to select • Use Group to combine
                </div>
            </div>

            {/* Viewport Wrapper */}
            <div ref={wrapperRef} className="relative w-full h-64">
                {/* Scrollable Container */}
                <div 
                    ref={scrollContainerRef}
                    className="w-full h-full overflow-x-auto overflow-y-hidden"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {/* Content */}
                    <div style={{ width: contentWidth, height: '100%' }} className="relative">
                        <svg width={contentWidth} height={containerSize.height} className="absolute inset-0">
                            {/* 1G Line */}
                            {(() => {
                                const graphHeight = containerSize.height - 60; 
                                const y1g = (40 + graphHeight) - (1.0 / maxIntensity) * graphHeight;
                                return (
                                    <line x1="0" y1={y1g} x2={contentWidth} y2={y1g} stroke="#374151" strokeDasharray="4" strokeWidth="1" />
                                );
                            })()}

                            {/* Data Line */}
                            <path d={svgPathD} fill="none" stroke="#4b5563" strokeWidth="1.5" strokeLinejoin="round" />

                            {/* Points - Render circles ONLY for significant events (Turns > 15 deg or High G) */}
                            {pointCoords.map((pt) => {
                                const isSelected = selectedIndices.has(pt.index);
                                const isLabeled = !!pt.data.label;
                                // Significant events: High Impact OR Significant Turn (>15deg)
                                const isSignificant = pt.data.intensity > 1.5 || pt.data.intensity < 0.8 || (pt.data.turnAngle && Math.abs(pt.data.turnAngle) > 15);

                                // If not significant and not selected/labeled, don't draw the circle clutter
                                if (!isSignificant && !isSelected && !isLabeled) return null;

                                let dotColor = isSignificant ? "#f59e0b" : "#4b5563"; // Orange for significant
                                let dotRadius = isSignificant ? 5 : 3;
                                let strokeColor = "#fff";
                                let strokeWidth = 1;

                                if (isLabeled) {
                                    dotColor = stringToColor(pt.data.label!);
                                    if (pt.data.isGroupStart) dotRadius = 7;
                                }

                                if (isSelected) {
                                    dotColor = "#22d3ee"; // Cyan
                                    dotRadius = 8;
                                    strokeColor = "#fff";
                                    strokeWidth = 2;
                                }

                                return (
                                    <g key={pt.index} style={{cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); onTogglePoint(pt.index); }}>
                                        {/* Hit Area (Invisible larger circle for easier tapping) */}
                                        <circle cx={pt.x} cy={pt.y} r={20} fill="transparent" />
                                        
                                        {/* Selection Halo */}
                                        {isSelected && (
                                            <circle cx={pt.x} cy={pt.y} r={14} fill="#22d3ee" fillOpacity="0.3">
                                                <animate attributeName="r" values="12;14;12" dur="2s" repeatCount="indefinite" />
                                            </circle>
                                        )}
                                        
                                        {/* Visible Dot */}
                                        <circle 
                                            cx={pt.x} 
                                            cy={pt.y} 
                                            r={dotRadius} 
                                            fill={dotColor} 
                                            stroke={strokeColor} 
                                            strokeWidth={strokeWidth} 
                                            opacity={1}
                                        />

                                        {/* Turn Angle Annotation - Only if significant turn */}
                                        {pt.data.turnAngle !== undefined && Math.abs(pt.data.turnAngle) > 15 && !isSelected && (
                                            <text 
                                                x={pt.x + 10} 
                                                y={pt.y + 4} 
                                                textAnchor="start" 
                                                fill={pt.data.turnAngle > 0 ? "#22d3ee" : "#ef4444"} 
                                                fontSize="9" 
                                                fontFamily="monospace"
                                                style={{textShadow: '0px 1px 1px black'}}
                                            >
                                                {pt.data.turnAngle > 0 ? '+' : ''}{pt.data.turnAngle}°
                                            </text>
                                        )}

                                        {/* Labels */}
                                        {isLabeled && pt.data.isGroupStart && !isSelected && (
                                            <g pointerEvents="none">
                                                <line x1={pt.x} y1={pt.y} x2={pt.x} y2={pt.y - 20} stroke={dotColor} strokeWidth="1" />
                                                <text x={pt.x} y={pt.y - 25} textAnchor="middle" fill={dotColor} fontSize="10" fontWeight="bold" style={{textShadow: '0px 1px 2px black'}}>
                                                    {pt.data.label}
                                                </text>
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
    const [selectedPointIndices, setSelectedPointIndices] = useState<Set<number>>(new Set());
    const [showGroupModal, setShowGroupModal] = useState(false);
    
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

    const handleTogglePoint = (sessionId: string, index: number) => {
        // If we switch sessions, clear selection
        if (editingSessionId !== sessionId) {
            setEditingSessionId(sessionId);
            setSelectedPointIndices(new Set([index]));
        } else {
            const newSet = new Set(selectedPointIndices);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            setSelectedPointIndices(newSet);
        }
    };

    const handleGroupClick = () => {
        if (selectedPointIndices.size > 0) {
            setShowGroupModal(true);
        }
    };

    const saveGroupLabel = (newLabel: string) => {
        if (!editingSessionId || selectedPointIndices.size === 0) return;
        
        const session = sessions.find(s => s.id === editingSessionId);
        if (!session) return;

        // 1. Clone Session
        const updatedSession = JSON.parse(JSON.stringify(session)) as Session;
        
        const groupId = `group-${Date.now()}`;
        
        // 2. Iterate selected indices and update
        // Use array for sorting
        const sortedIndices = Array.from(selectedPointIndices).sort((a,b) => a - b);
        
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
        
        // 5. Close Modal & Clear Selection
        setShowGroupModal(false);
        setSelectedPointIndices(new Set());
    };

    return (
        <div className="mt-4 space-y-4">
            
            {showGroupModal && (
                <TrickEditModal 
                    onSave={saveGroupLabel} 
                    onClose={() => setShowGroupModal(false)}
                    motions={motions}
                    onAddMotion={onAddMotion}
                    onDeleteMotion={onDeleteMotion}
                    selectionCount={selectedPointIndices.size}
                />
            )}

            {sessions.map((s, i) => {
                const isExpanded = !!expandedSessions[s.id];
                const isThisSessionEditing = editingSessionId === s.id;
                const hasSelection = isThisSessionEditing && selectedPointIndices.size > 0;
                
                // Determine button label based on selection count
                let buttonLabel = "SELECT";
                if (hasSelection && selectedPointIndices.size > 1) {
                    buttonLabel = `GROUP SELECTION (${selectedPointIndices.size})`;
                }

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
                                    <>
                                        <SessionGraph 
                                            data={s.timelineData} 
                                            selectedIndices={isThisSessionEditing ? selectedPointIndices : new Set()}
                                            onTogglePoint={(idx) => handleTogglePoint(s.id, idx)}
                                        />
                                        
                                        {/* GROUP/SELECT BUTTON */}
                                        <div className="flex justify-end mb-4">
                                            <button
                                                onClick={handleGroupClick}
                                                disabled={!hasSelection}
                                                className={`
                                                    flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200
                                                    ${hasSelection 
                                                        ? 'bg-cyan-500 text-gray-900 hover:bg-cyan-400 shadow-lg transform active:scale-95' 
                                                        : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'}
                                                `}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="8.5" cy="7" r="4"></circle>
                                                    <line x1="20" y1="8" x2="20" y2="14"></line>
                                                    <line x1="23" y1="11" x2="17" y2="11"></line>
                                                </svg>
                                                {buttonLabel}
                                            </button>
                                        </div>
                                    </>
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
                                            <div className="w-full bg-cyan-900/30 border border-cyan-800/50 rounded-lg p-3 text-cyan-300 text-xs flex gap-2 items-start">
                                                <span className="text-lg">ℹ️</span>
                                                <div>
                                                    <p className="font-bold mb-1">No tricks detected yet.</p>
                                                    <p>Select points on the graph above to group movements and name your first trick. The app will learn from your labels!</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* MAP */}
                                {s.path && s.path.length > 1 && (
                                    <div className="mt-4 h-48 rounded-lg overflow-hidden border border-gray-700">
                                        <SkateMap path={s.path} />
                                    </div>
                                )}
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
