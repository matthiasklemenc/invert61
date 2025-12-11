import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { RampConfig } from './rampTypes';
import { DEFAULT_RAMP_CONFIG } from './rampTypes';

export interface PathPoint {
    x: number; // 0..1 normalized in view
    y: number; // 0..1 normalized in view
}

export interface TrickMarker {
    id: string;
    trickId: string;
        // position along the drawn path, 0..1 (used later for mapping to real-world timing/position)
    t: number;
}

interface LineState {
    ramp: RampConfig;
    setRamp: (cfg: RampConfig) => void;
    path: PathPoint[];
    setPath: (pts: PathPoint[]) => void;
    markers: TrickMarker[];
    setMarkers: (m: TrickMarker[]) => void;
    loopCount: number | 'infinite';
    setLoopCount: (v: number | 'infinite') => void;
}

const LineContext = createContext<LineState | undefined>(undefined);

export const LineProvider = ({ children }: { children: ReactNode }) => {
    const [ramp, setRamp] = useState<RampConfig>(DEFAULT_RAMP_CONFIG);
    const [path, setPath] = useState<PathPoint[]>([]);
    const [markers, setMarkers] = useState<TrickMarker[]>([]);
    const [loopCount, setLoopCount] = useState<number | 'infinite'>(1);

    const value: LineState = {
        ramp,
        setRamp,
        path,
        setPath,
        markers,
        setMarkers,
        loopCount,
        setLoopCount,
    };

    return (
        <LineContext.Provider value={value}>
            {children}
        </LineContext.Provider>
    );
};

export const useLine = () => {
    const ctx = useContext(LineContext);
    if (!ctx) {
        throw new Error('useLine must be used within a LineProvider');
    }
    return ctx;
};
