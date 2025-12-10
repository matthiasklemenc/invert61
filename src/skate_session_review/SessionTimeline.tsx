import React from 'react';
import { SkateSession } from './types';

const SessionTimeline: React.FC<{ session: SkateSession }> = ({ session }) => {
    const totalDuration = (session.endTime - session.startTime) / 1000;
    if (totalDuration <= 0) return null;

    const activitySegments = [];
    let lastTime = 0;
    // This is a simplified representation. A real one would use the tracker's active/inactive intervals.
    // For now, let's just show active vs inactive time as a simple ratio.
    const activeRatio = session.activeTime / totalDuration;
    
    return (
        <div className="w-full h-8 bg-neutral-700 rounded-full relative overflow-hidden">
            {/* Active Time */}
            <div
                className="absolute top-0 left-0 h-full bg-green-500"
                style={{ width: `${activeRatio * 100}%` }}
            />
            {/* Inactive Time */}
            <div
                className="absolute top-0 h-full bg-neutral-500"
                style={{ left: `${activeRatio * 100}%`, right: 0 }}
            />

            {/* Highlight Markers */}
            {session.highlights.map(h => {
                const percent = ((h.timestamp - session.startTime) / 1000) / totalDuration * 100;
                let color = 'white';
                if (h.type === 'AIR') color = 'cyan';
                if (h.type === 'IMPACT') color = 'yellow';
                
                return (
                    <div
                        key={h.id}
                        className="absolute top-0 bottom-0 w-0.5"
                        style={{ left: `${percent}%`, backgroundColor: color }}
                        title={`${h.type} at ${new Date(h.timestamp).toLocaleTimeString()}`}
                    />
                );
            })}
        </div>
    );
};

export default SessionTimeline;