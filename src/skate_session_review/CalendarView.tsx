
import React, { useMemo } from 'react';
import type { SkateSession } from './types';

interface CalendarViewProps {
    sessions: SkateSession[];
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    currentDisplayMonth: Date;
    onDisplayMonthChange: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
    sessions, 
    selectedDate, 
    onDateSelect,
    currentDisplayMonth,
    onDisplayMonthChange 
}) => {
    const daysInMonth = new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth(), 1).getDay();
    
    const sessionDates = useMemo(() => {
        const map = new Map<string, number>(); // Date string -> count
        sessions.forEach(s => {
            const d = new Date(s.startTime).toDateString();
            map.set(d, (map.get(d) || 0) + 1);
        });
        return map;
    }, [sessions]);

    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const changeMonth = (offset: number) => {
        onDisplayMonthChange(new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth() + offset, 1));
    };

    return (
        <div className="bg-neutral-800 p-4 rounded-xl border border-white/5 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <button 
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-neutral-700 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                <h3 className="font-bold text-lg text-white tracking-wide uppercase">
                    {currentDisplayMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <button 
                    onClick={() => changeMonth(1)}
                    className="p-2 hover:bg-neutral-700 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-500 font-bold uppercase mb-2 tracking-wider">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
                {blanks.map((_, i) => <div key={`blank-${i}`} className="aspect-square"></div>)}
                {days.map(day => {
                    const date = new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth(), day);
                    const dateStr = date.toDateString();
                    const sessionCount = sessionDates.get(dateStr) || 0;
                    const isSelected = selectedDate.toDateString() === dateStr;
                    const isToday = new Date().toDateString() === dateStr;

                    return (
                        <button 
                            key={day} 
                            onClick={() => onDateSelect(date)} 
                            className={`
                                aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all duration-200
                                ${isSelected ? 'bg-[#c52323] text-white shadow-lg scale-105 z-10' : 'bg-neutral-900/50 text-gray-400 hover:bg-neutral-700'}
                                ${isToday && !isSelected ? 'border border-[#c52323] text-white' : 'border border-transparent'}
                            `}
                        >
                            <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>{day}</span>
                            
                            {/* Dot indicators for sessions */}
                            <div className="flex gap-0.5 mt-1 h-1.5 justify-center">
                                {sessionCount > 0 && (
                                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#c52323]'}`}></span>
                                )}
                                {sessionCount > 1 && (
                                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : 'bg-[#c52323]/70'}`}></span>
                                )}
                                {sessionCount > 2 && (
                                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/40' : 'bg-[#c52323]/40'}`}></span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;
