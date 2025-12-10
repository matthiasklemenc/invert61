import React from 'react';
import { SkateSession } from './types';

type Props = {
    sessions: SkateSession[];
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    currentDisplayMonth: Date;
    onDisplayMonthChange: (date: Date) => void;
};

const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

const CalendarView: React.FC<Props> = ({ sessions, selectedDate, onDateSelect, currentDisplayMonth, onDisplayMonthChange }) => {
    const daysInMonth = new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth(), 1).getDay(); // 0=Sun, 1=Mon,...

    const sessionDates = new Set(sessions.map(s => new Date(s.startTime).toDateString()));

    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const handlePrevMonth = () => {
        onDisplayMonthChange(new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        onDisplayMonthChange(new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth() + 1, 1));
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-neutral-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-neutral-700">&lt;</button>
                <h3 className="font-bold text-lg">
                    {currentDisplayMonth.toLocaleString('default', { month: 'long' })} {currentDisplayMonth.getFullYear()}
                </h3>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-neutral-700">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-400 mb-2">
                {weekDays.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 place-items-center">
                {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                {days.map(day => {
                    const date = new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth(), day);
                    const hasSession = sessionDates.has(date.toDateString());
                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());

                    return (
                        <button
                            key={day}
                            onClick={() => onDateSelect(date)}
                            className={`relative h-10 w-10 flex items-center justify-center rounded-full transition-colors
                                ${isSelected ? 'bg-red-600 text-white' : isToday ? 'bg-neutral-700' : 'hover:bg-neutral-600'}
                            `}
                        >
                            {day}
                            {hasSession && <div className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-red-500'}`} />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;
