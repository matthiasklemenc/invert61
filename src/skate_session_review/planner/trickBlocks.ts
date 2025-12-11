export type TrickCategory = 'flat' | 'transition';

export interface TrickBlock {
    id: string;
    label: string;
    category: TrickCategory;
    description?: string;
}

export const FLAT_TRICK_BLOCKS: TrickBlock[] = [
    { id: 'OLLIE', label: 'Ollie', category: 'flat' },
    { id: 'OLLIE_FS_180', label: 'Ollie FS 180', category: 'flat' },
    { id: 'CUSTOM_FLAT', label: 'Custom Block', category: 'flat', description: 'Define your own flatground trick.' },
];

export const TRANSITION_TRICK_BLOCKS: TrickBlock[] = [
    { id: 'DROP_IN', label: 'Drop In', category: 'transition' },
    { id: 'PUSH', label: 'Push', category: 'transition' },
    { id: 'ROCK_TO_FAKIE', label: 'Rock to Fakie', category: 'transition' },
    { id: 'TAIL_TAP', label: 'Tail Tap', category: 'transition' },
    { id: 'FAKIE_ROCK', label: 'Fakie Rock', category: 'transition' },
    { id: 'OLLIE_FS', label: 'Ollie FS', category: 'transition' },
    { id: 'OLLIE_BS', label: 'Ollie BS', category: 'transition' },
    { id: 'CUSTOM_TRANSITION', label: 'Custom Block', category: 'transition', description: 'Define your own transition trick.' },
];
