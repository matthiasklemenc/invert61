
import { Motion } from './types';

export const MOTIONS: Motion[] = [
  { id: 'push', name: 'Push' },
  { id: 'drop-in', name: 'Drop In' },
  { id: 'pump', name: 'Pump' },
  { id: 'bs-turn', name: 'BS Turn' },
  { id: 'fs-turn', name: 'FS Turn' },
  { id: 'bs-ollie-180', name: 'BS Ollie 180' },
  { id: 'fs-ollie-180', name: 'FS Ollie 180' },
  { id: 'bs-50-50', name: 'BS 50/50' },
  { id: 'fs-50-50', name: 'FS 50/50' },
  { id: 'tail-tap', name: 'Tail Tap' },
  { id: 'fakie-rock', name: 'Fakie Rock' },
  { id: 'rock-n-roll', name: 'Rock n Roll' },
  { id: 'bs-grind', name: 'BS Grind' },
  { id: 'fs-grind', name: 'FS Grind' },
  { id: 'ollie-to-fakie', name: 'Ollie to Fakie' },
  { id: 'fakie-ollie', name: 'Fakie Ollie' },
  { id: 'fakie-disaster', name: 'Fakie Disaster' },
  { id: 'fs-disaster', name: 'FS Disaster' },
  { id: 'bs-disaster', name: 'BS Disaster' },
  { id: 'nollie-bs-180', name: 'Nollie BS 180' },
];

export const TRICK_MOTIONS = MOTIONS.map(m => m.id);
