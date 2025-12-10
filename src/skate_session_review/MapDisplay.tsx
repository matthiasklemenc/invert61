import React from 'react';
import { GpsPoint } from './types';

const MapDisplay: React.FC<{ path: GpsPoint[] }> = ({ path }) => {
    if (path.length < 2) {
        return <div className="aspect-video w-full bg-neutral-700 flex items-center justify-center text-neutral-400">Not enough GPS data to draw a map.</div>;
    }

    // Find bounding box
    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
    for (const point of path) {
        if (point.lat < minLat) minLat = point.lat;
        if (point.lat > maxLat) maxLat = point.lat;
        if (point.lon < minLon) minLon = point.lon;
        if (point.lon > maxLon) maxLon = point.lon;
    }

    const latRange = maxLat - minLat;
    const lonRange = maxLon - minLon;
    
    // Add padding to prevent clipping
    const padding = 0.0001;
    minLat -= padding;
    maxLat += padding;
    minLon -= padding;
    maxLon += padding;

    const viewBoxWidth = lonRange + padding * 2;
    const viewBoxHeight = latRange + padding * 2;


    const points = path.map(p => {
        const x = (p.lon - minLon);
        const y = (maxLat - p.lat);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg
            className="w-full h-auto"
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            preserveAspectRatio="xMidYMid meet"
        >
            <polyline
                points={points}
                fill="none"
                stroke="#c52323"
                strokeWidth={viewBoxHeight * 0.02} // Responsive stroke width
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default MapDisplay;
