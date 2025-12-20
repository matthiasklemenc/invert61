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

// --- GRAPH COMPONENT ---
interface SessionGraphProps {
    data: SessionDataPoint[];
    selectedIndices: Set<number>;
    onTogglePoint: (index: number) => void;
}

const SessionGraph: React.FC<SessionGraphProps> = ({ data, selectedIndices, onTogglePoint }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 200 });

    const maxTime = useMemo(() => data.length > 0 ? Math.max(data[data.length - 1].timestamp, 0.1) : 1, [data]);
    const maxIntensity = useMemo(() => Math.max(...data.map(d => d.intensity), 3.0), [data]);

    useEffect(() => {
        const updateSize = () => {
            if (wrapperRef.current) {
                setContainerSize({ 
                    width: wrapperRef.current.clientWidth, 
                    height: 200 
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const pointCoords = useMemo(() => {
        if (!containerSize.width) return [];
        const padding = 20;
        const w = containerSize.width - padding * 2;
        const h = containerSize.height - 40;
        return data.map((d, i) => ({
            x: padding + (d.timestamp / maxTime) * w,
            y: (containerSize.height - 20) - (d.intensity / maxIntensity) * h,
            index: i,
            data: d
        }));
    }, [data, containerSize, maxTime, maxIntensity]);

    return (
        <div className="relative w-full bg-gray-900 rounded-xl mb-4 border border-gray-700 overflow-hidden shadow-inner h-52">
            <div className="absolute top-2 left-3 z-10">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Motion Timeline</span>
            </div>
            <div ref={wrapperRef} className="w-full h-full">
                <svg width="100%" height="100%" className="overflow-visible">
                    <line x1="0" y1={containerSize.height - 20} x2="100%" y2={containerSize.height - 20} stroke="#1f2937" strokeWidth="1" />
                    <polyline fill="none" stroke="#374151" strokeWidth="2" points={pointCoords.map(p => `${p.x},${p.y}`).join(' ')} />
                    {pointCoords.map((pt) => {
                        const isTurn = pt.data.turnAngle !== undefined && Math.abs(pt.data.turnAngle) > 0;
                        const isImpact = pt.data.intensity > 1.8;
                        const isSelected = selectedIndices.has(pt.index);
                        const isLabeled = !!pt.data.label;
                        if (!isTurn && !isImpact && !isSelected && !isLabeled) return null;
                        let color = isTurn ? (pt.data.turnAngle! > 0 ? "#06b6d4" : "#f43f5e") : "#f59e0b";
                        if (isLabeled) color = stringToColor(pt.data.label!);
                        if (isSelected) color = "#ffffff";
                        return (
                            <g key={pt.index} className="cursor-pointer" onClick={() => onTogglePoint(pt.index)}>
                                <circle cx={pt.x} cy={pt.y} r={isSelected ? 10 : 6} fill={color} stroke="#000" strokeWidth="2" className="transition-all" />
                                {isTurn && !isSelected && !isLabeled && (
                                    <text x={pt.x} y={pt.y - 12} textAnchor="middle" fill={color} fontSize="10" fontWeight="bold">{Math.abs(pt.data.turnAngle!)}°</text>
                                )}
                                {isLabeled && pt.data.isGroupStart && (
                                    <text x={pt.x} y={pt.y - 15} textAnchor="middle" fill={color} fontSize="10" fontWeight="black" className="uppercase">{pt.data.label}</text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

const Calendar: React.FC<{ sessions: Session[], selectedDate: Date, onDateSelect: (d: Date) => void }> = ({ sessions, selectedDate, onDateSelect }) => {
    const [viewMonth, setViewMonth] = useState(new Date());
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const startDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
    const sessionDays = useMemo(() => new Set(sessions.map(s => new Date(s.date).toDateString())), [sessions]);
    return (
        <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 shadow-xl mb-6">
            <div className="flex justify-between items-center mb-4 px-2">
                <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} className="text-cyan-400 font-bold">◀</button>
                <h3 className="font-black text-white uppercase italic tracking-widest">{viewMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}</h3>
                <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} className="text-cyan-400 font-bold">▶</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[9px] font-black text-gray-600 uppercase text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array(startDay).fill(null).map((_, i) => <div key={`b-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const hasSession = sessionDays.has(date.toDateString());
                    return (
                        <button key={day} onClick={() => onDateSelect(date)} className={`p-2 rounded-lg text-xs transition-all relative ${isSelected ? 'bg-cyan-500 text-gray-900 font-black' : 'hover:bg-gray-700 text-gray-400'}`}>
                            {day}
                            {hasSession && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full"></span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const TagModal: React.FC<{ onSave: (label: string) => void, onClose: () => void, motions: Motion[], onAddMotion: (n: string) => void }> = ({ onSave, onClose, motions, onAddMotion }) => {
    const [custom, setCustom] = useState("");
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-6">
            <div className="bg-gray-800 p-6 rounded-3xl border border-cyan-500/50 w-full max-w-sm shadow-2xl">
                <h4 className="text-xl font-black text-white italic uppercase mb-4">Tag Move</h4>
                <div className="grid grid-cols-2 gap-2 mb-6 max-h-48 overflow-y-auto pr-2">
                    {motions.map(m => (
                        <button key={m.id} onClick={() => onSave(m.name)} className="bg-gray-700 hover:bg-cyan-600 hover:text-white p-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-300 transition-colors">{m.name}</button>
                    ))}
                </div>
                <div className="flex gap-2 mb-6">
                    <input type="text" value={custom} onChange={e => setCustom(e.target.value)} placeholder="Custom move..." className="flex-1 bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white outline-none focus:border-cyan-500" />
                    <button onClick={() => { if(custom.trim()) { onAddMotion(custom.trim()); onSave(custom.trim()); } }} className="bg-green-600 text-white px-4 rounded-xl font-bold">Add</button>
                </div>
                <button onClick={onClose} className="w-full py-3 bg-gray-700 text-gray-400 font-black rounded-xl uppercase tracking-widest text-xs">Cancel</button>
            </div>
        </div>
    );
};

const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions, navigate, onSessionUpdate, onDeleteSession, motions, onAddMotion, onDeleteMotion, onBack }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isTagging, setIsTagging] = useState(false);
  const dailySessions = useMemo(() => sessions.filter(s => new Date(s.date).toDateString() === selectedDate.toDateString()), [sessions, selectedDate]);
  const handleTogglePoint = (idx: number) => {
      setSelectedIndices(prev => {
          const next = new Set(prev);
          if (next.has(idx)) next.delete(idx); else next.add(idx);
          return next;
      });
  };
  const saveTag = (label: string) => {
      if (!expandedSessionId) return;
      const session = sessions.find(s => s.id === expandedSessionId);
      if (!session) return;
      const updated = JSON.parse(JSON.stringify(session)) as Session;
      const sorted = Array.from(selectedIndices).sort((a, b) => a - b);
      sorted.forEach((idx, i) => {
          updated.timelineData[idx].label = label;
          updated.timelineData[idx].isGroupStart = i === 0;
      });
      updated.trickSummary[label] = (updated.trickSummary[label] || 0) + 1;
      updated.totalTricks = Object.values(updated.trickSummary).reduce((a, b) => a + b, 0);
      onSessionUpdate(updated);
      setSelectedIndices(new Set());
      setIsTagging(false);
  };
  return (
    <div className="w-full max-w-lg pb-10">
        <Calendar sessions={sessions} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        <div className="space-y-4">
            {dailySessions.length === 0 && <p className="text-center text-gray-600 text-sm font-bold uppercase py-10 tracking-widest">No recordings today.</p>}
            {dailySessions.map((s, i) => {
                const isExpanded = expandedSessionId === s.id;
                return (
                    <div key={s.id} className="bg-gray-800 rounded-3xl border-l-4 border-cyan-500 overflow-hidden shadow-xl transition-all">
                        <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-750" onClick={() => setExpandedSessionId(isExpanded ? null : s.id)}>
                            <div className="flex items-center gap-4">
                                <div className="text-[10px] font-black text-cyan-500 bg-cyan-500/10 w-8 h-8 rounded-full flex items-center justify-center">#{i+1}</div>
                                <div>
                                    <h4 className="text-white font-black uppercase italic tracking-tight">Session {new Date(s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</h4>
                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{s.totalTricks} Landed Moves</span>
                                </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }} className="text-gray-600 hover:text-red-500 p-2">🗑</button>
                        </div>
                        {isExpanded && (
                            <div className="p-5 border-t border-gray-700 bg-gray-800/40">
                                <SessionGraph data={s.timelineData} selectedIndices={selectedIndices} onTogglePoint={handleTogglePoint} />
                                <div className="flex justify-between items-center mb-6">
                                    <p className="text-[9px] text-gray-500 italic uppercase">Tap graph markers to group & tag</p>
                                    <button disabled={selectedIndices.size === 0} onClick={() => setIsTagging(true)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedIndices.size > 0 ? 'bg-cyan-500 text-gray-900 shadow-lg scale-105' : 'bg-gray-700 text-gray-500 opacity-50'}`}>Tag ({selectedIndices.size})</button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-6 bg-gray-900/50 p-4 rounded-2xl border border-gray-700">
                                    <div><p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Max Speed</p><p className="text-xl font-black text-white">{s.maxSpeed}<span className="text-[10px] opacity-40 ml-1">kmh</span></p></div>
                                    <div><p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Moves</p><p className="text-xl font-black text-green-400">{s.totalTricks}</p></div>
                                </div>
                                {Object.keys(s.trickSummary).length > 0 && (
                                    <div className="mb-6 flex flex-wrap gap-2">
                                        {Object.entries(s.trickSummary).map(([name, count]) => (
                                            <div key={name} className="px-3 py-1.5 rounded-full bg-gray-900 border border-white/10 text-[10px] font-black uppercase text-white flex gap-2 items-center" style={{borderColor: stringToColor(name)}}>{name} <span className="bg-white/10 px-2 rounded-full opacity-60">{count}</span></div>
                                        ))}
                                    </div>
                                )}
                                {s.path && <div className="rounded-2xl overflow-hidden border border-gray-700 mb-2 shadow-2xl"><SkateMap path={s.path} className="h-48 w-full" /></div>}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
        {isTagging && <TagModal onSave={saveTag} onClose={() => setIsTagging(false)} motions={motions} onAddMotion={onAddMotion} />}
        <div className="mt-12 flex flex-col gap-3 px-4">
            <button onClick={() => navigate(Page.SessionTracker)} className="w-full bg-green-500 text-gray-900 font-black py-5 rounded-2xl hover:bg-green-400 shadow-2xl flex items-center justify-center gap-2 uppercase tracking-widest italic active:scale-95 transition-transform"><span>●</span> Record Session</button>
            <button onClick={onBack} className="w-full py-4 text-gray-600 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors">Exit Tracker</button>
        </div>
    </div>
  );
};

export default SessionHistory;