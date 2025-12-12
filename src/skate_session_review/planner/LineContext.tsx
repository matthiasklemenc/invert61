// C:\Users\user\Desktop\invert61\src\skate_session_review\planner\LineContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { RampConfig } from './rampTypes';
import { DEFAULT_RAMP_CONFIG } from './rampTypes';

/* =========================
   CORE DATA TYPES
========================= */

export interface PathPoint3D {
    x: number;
    y: number;
    z: number;
}

export interface TrickMarker {
    id: string;
    trickId: string;
    /** normalized distance along path 0..1 */
    t: number;
}

interface LineState {
    ramp: RampConfig;
    setRamp: (cfg: RampConfig) => void;

    /** Authoritative 3D path */
    path3D: PathPoint3D[];
    setPath3D: (pts: PathPoint3D[]) => void;

    markers: TrickMarker[];
    setMarkers: (m: TrickMarker[]) => void;

    loopCount: number | 'infinite';
    setLoopCount: (v: number | 'infinite') => void;
}

const LineContext = createContext<LineState | undefined>(undefined);

/* =========================
   PROVIDER
========================= */

export const LineProvider = ({ children }: { children: ReactNode }) => {
    const [ramp, setRamp] = useState<RampConfig>(DEFAULT_RAMP_CONFIG);
    const [path3D, setPath3D] = useState<PathPoint3D[]>([]);
    const [markers, setMarkers] = useState<TrickMarker[]>([]);
    const [loopCount, setLoopCount] = useState<number | 'infinite'>(1);

    const value: LineState = {
        ramp,
        setRamp,
        path3D,
        setPath3D,
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
