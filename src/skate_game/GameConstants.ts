import { ObstacleType } from './GameTypes';

// Vite expands BASE_URL to the configured deployment prefix ("/invert61/" on
// GitHub Pages, "/" locally).  Keep every public game asset behind this helper
// so a repository rename cannot silently break the game loop.
export const gameAssetUrl = (path: string) =>
    `${import.meta.env.BASE_URL}assets/${path.replace(/^\/+/, '')}`;

export const KAI_IMAGE_URL = gameAssetUrl('kai/kai_intro.png');
export const GAME_LOGO_URL = gameAssetUrl('game/invert_the_game_transpartent_small.png');

export const GRAVITY = 0.6;
export const JUMP_FORCE = -18;
export const BASE_FLOOR_Y = 250;
export const SPEED = 7;

// --- FIXED LOGICAL GAME RESOLUTION ---
// Every absolute-pixel game value (BASE_FLOOR_Y, obstacle widths/heights,
// GRAVITY, JUMP_FORCE, the underworld pipe travel distance, fireball
// heights, etc.) is tuned for one specific canvas size. The <canvas>
// element's drawing-buffer resolution (canvas.width / canvas.height) was
// never actually being set anywhere in the app â€” on both mobile AND
// desktop it was silently falling back to the browser's 300x150 default,
// then displayed with `object-fit: none`, which shows that tiny buffer
// at its native size instead of scaling it â€” hence the small rectangle
// floating in a sea of empty space on every device. Setting the canvas
// to this fixed resolution once, and letting CSS (object-fit: contain)
// scale it uniformly to fit whatever space is available, fixes this for
// every screen size and aspect ratio at once.
// Width is kept at 1280 because several spawn-distance formulas in
// useSkateGame.ts scale off canvas.width (e.g. obstacle spawnAhead
// distance) â€” changing it would change gameplay pacing, not just
// proportions. Height is 480, not a "clean" 16:9 match for that width,
// because BASE_FLOOR_Y is a fixed 250px from the top no matter what
// height is chosen â€” so height only controls how much plain "ground"
// shows below the floor line. 720 left ~470px of mostly-empty ground
// below the floor (65% of the screen); 480 leaves ~230px (48%), which
// looks like an actual street instead of a half-empty void.
export const GAME_LOGICAL_WIDTH = 1280;
export const GAME_LOGICAL_HEIGHT = 340;

// --- KAI SPRITE ASSETS ---
export const KAI_SPRITES = {
    RIDE: [
        new Image(),
        new Image(),
        new Image(),
        new Image()
    ],
    PUSH: [
        new Image(),
        new Image()
    ]
};

KAI_SPRITES.RIDE[0].src = gameAssetUrl('kai/kai_ride_1.png');
KAI_SPRITES.RIDE[1].src = gameAssetUrl('kai/kai_ride_2.png');
KAI_SPRITES.RIDE[2].src = gameAssetUrl('kai/kai_ride_3.png');
KAI_SPRITES.RIDE[3].src = gameAssetUrl('kai/kai_ride_4.png');

KAI_SPRITES.PUSH[0].src = gameAssetUrl('kai/kai_push_1.png');
KAI_SPRITES.PUSH[1].src = gameAssetUrl('kai/kai_push_2.png');

// --- OBSTACLES ---
export const STANDARD_OBSTACLES: {
    type: ObstacleType,
    w: number,
    h: number,
    grind: boolean,
    gap: boolean,
    isPlatform?: boolean,
    yOffset?: number
}[] = [
    { type: 'hydrant', w: 30, h: 40, grind: true, gap: false },
    { type: 'police_car', w: 100, h: 50, grind: false, gap: false },
    { type: 'cybertruck', w: 120, h: 50, grind: true, gap: false },
    { type: 'cart', w: 50, h: 50, grind: false, gap: false },
    { type: 'ledge', w: 150, h: 30, grind: true, gap: false },
    { type: 'curb', w: 40, h: 15, grind: true, gap: false },
    { type: 'rail', w: 100, h: 40, grind: true, gap: false },
    { type: 'flat_rail', w: 120, h: 20, grind: true, gap: false },
    { type: 'bin', w: 40, h: 60, grind: false, gap: false },
    { type: 'grey_bin', w: 40, h: 60, grind: false, gap: false },
    { type: 'ramp', w: 160, h: 40, grind: false, gap: false, isPlatform: true },
    { type: 'gap', w: 100, h: 10, grind: false, gap: true, yOffset: 10 },
];

// --- SCORE FORMATTER ---
export const formatScore = (s: number) => {
    const absScore = Math.floor(Math.abs(s)).toString().padStart(6, '0');
    return s < 0 ? `-${absScore}` : absScore;
};

