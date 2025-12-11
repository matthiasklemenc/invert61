export type RampDiscipline = 'transition' | 'street';

export interface RampType {
    id: string;
    label: string;
    discipline: RampDiscipline;
}

export const RAMP_TYPES: RampType[] = [
    // Transition
    { id: 'MINIRAMP', label: 'Miniramp', discipline: 'transition' },
    { id: 'QUARTER_LOW', label: 'Quarter (Low)', discipline: 'transition' },
    { id: 'QUARTER_MEDIUM', label: 'Quarter (Medium)', discipline: 'transition' },
    { id: 'QUARTER_VERT', label: 'Quarter (Vert)', discipline: 'transition' },
    { id: 'HALFPIPE', label: 'Halfpipe', discipline: 'transition' },
    { id: 'BOWL_ROUND', label: 'Bowl (Round)', discipline: 'transition' },
    { id: 'BOWL_OVAL', label: 'Bowl (Oval)', discipline: 'transition' },
    { id: 'BOWL_KIDNEY', label: 'Bowl (Kidney)', discipline: 'transition' },

    // Street
    { id: 'STAIRS', label: 'Stairs', discipline: 'street' },
    { id: 'STAIRS_RAIL', label: 'Stairs + Rail', discipline: 'street' },
    { id: 'FLATBAR', label: 'Flatbar', discipline: 'street' },
    { id: 'LEDGE', label: 'Ledge', discipline: 'street' },
    { id: 'MANUAL_PAD', label: 'Manual Pad', discipline: 'street' },
    { id: 'KICKER', label: 'Kicker', discipline: 'street' },
];

export interface RampConfig {
    typeId: string;
    heightFt: number;
    widthLevel: 'narrow' | 'medium' | 'wide';
}

export const DEFAULT_RAMP_CONFIG: RampConfig = {
    typeId: 'MINIRAMP',
    heightFt: 4,
    widthLevel: 'medium',
};
