
export interface GpsPoint {
    lat: number;
    lon: number;
    timestamp: number;
    speed: number | null;
}

export interface Highlight {
    id: string;
    type: string;
    timestamp: number;
    duration: number;
    value: number;
}

export interface TrickCounts {
    pumps: number;
    ollies: number;
    airs: number;
    fsGrinds: number;
    bsGrinds: number;
    stalls: number;
    slams: number;
}

export interface SkateSession {
    id: string;
    startTime: number;
    endTime: number;
    stance: 'REGULAR' | 'GOOFY';
    totalDistance: number;
    activeTime: number;
    timeOnBoard: number;
    timeOffBoard: number;
    topSpeed: number;
    path: GpsPoint[];
    highlights: Highlight[];
    counts: TrickCounts;
    bestTrick?: Highlight | null;
    longestGrind?: number;
}

export enum Stance {
  Regular = 'regular',
  Goofy = 'goofy',
}

export interface UserSettings {
  stance: Stance;
}

export enum Page {
  Onboarding,
  SessionTracker,
  SessionHistory,
}

// --- Session Review Specific Types ---

export interface SessionDataPoint {
  timestamp: number;
  intensity: number; // G-Force
  rotation?: number; // Rotation magnitude (rad/s)
  turnAngle?: number; // Specific rotation change in degrees (signed)
  label?: string;
  isGroupStart?: boolean; // If true, show the label
  groupId?: string; // Links multiple points into one "Trick"
}

export interface Session {
  id: string;
  date: string;
  duration: number;
  trickSummary: Record<string, number>;
  totalTricks: number;
  maxSpeed: number;
  avgSpeed: number;
  timelineData: SessionDataPoint[];
  path?: GpsPoint[];
}

export interface Motion {
  id: string;
  name: string;
}

export interface AppState {
  page: Page;
  userSettings: UserSettings | null;
  sessions: Session[];
}

export interface SessionHistoryProps {
    navigate: (page: Page) => void;
    sessions: Session[];
    onSessionUpdate: (s: Session) => void;
    onDeleteSession: (id: string) => void;
    motions: Motion[];
    onAddMotion: (name: string) => void;
    onDeleteMotion: (id: string) => void;
    onBack: () => void;
}
