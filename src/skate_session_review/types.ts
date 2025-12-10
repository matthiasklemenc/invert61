// C:\Users\user\Desktop\invert\build\src\skate_session_review\types.ts

export type GpsPoint = {
    lat: number;
    lon: number;
    timestamp: number;
    speed: number | null;
};

export type HighlightType = 
    | 'OLLIE' 
    | 'AIR' 
    | 'PUMP' 
    | 'FS_GRIND' 
    | 'BS_GRIND' 
    | 'STALL' 
    | 'SLAM' 
    | 'IMPACT';

export type Highlight = {
    id: string;
    type: HighlightType;
    timestamp: number;
    duration: number; // For airtime, grind, carve
    value: number; // For impact G-force, etc.
};

export type TrickCounts = {
    pumps: number;
    ollies: number;
    airs: number;
    fsGrinds: number;
    bsGrinds: number;
    stalls: number;
    slams: number;
};

export type SkateSession = {
    id: string;
    startTime: number;
    endTime: number;
    stance: 'REGULAR' | 'GOOFY';
    totalDistance: number; // meters
    activeTime: number; // seconds (total session duration)
    timeOnBoard: number; // seconds (actually skating)
    timeOffBoard: number; // seconds (walking/standing)
    topSpeed: number; // m/s
    path: GpsPoint[];
    highlights: Highlight[];
    counts: TrickCounts;
    // New detailed metrics
    bestTrick: Highlight | null;
    longestGrind: number; // in seconds
};

export type TrackerState = {
    status: 'idle' | 'tracking' | 'denied' | 'error';
    stance: 'REGULAR' | 'GOOFY';
    startTime: number | null;
    totalDistance: number;
    duration: number;
    timeOnBoard: number;
    timeOffBoard: number;
    currentSpeed: number;
    topSpeed: number;
    isRolling: boolean;
    debugMessage?: string;
    counts: TrickCounts;
};

export type PositionUpdatePayload = {
    coords: {
        latitude: number;
        longitude: number;
        speed: number | null;
    };
    timestamp: number;
};

export type WorkerCommand = 
    | { type: 'START', payload: { stance: 'REGULAR' | 'GOOFY' } }
    | { type: 'STOP' }
    | { type: 'POSITION_UPDATE', payload: PositionUpdatePayload }
    | { type: 'MOTION', payload: any };

export type WorkerMessage =
    | { type: 'UPDATE'; payload: TrackerState }
    | { type: 'HIGHLIGHT'; payload: Highlight }
    | { type: 'SESSION_END'; payload: SkateSession }
    | { type: 'ERROR'; payload: { message: string }};