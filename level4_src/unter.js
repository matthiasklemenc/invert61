// =====================================================================
//  LEVEL 4 · WORLD 3 – DIE UNTERWELT (below Aurora 61, reached through the pipe)
//  Dark purple caves with glowing crystals and mushrooms, green acid pools, slime dripping from above,
//  slime worms and cave bats. Weapon: SONNENKUGELN (Abu's sun balls – light in the dark).
//  Middle boss: the RIESEN-MONDWURM (comes out of the holes). End boss: GRUMMEL, der Glücksdieb –
//  he locked up the elephants of Aurora 61. With enough sunshine he laughs again and sets them free.
// =====================================================================
const WKEY = 'unter';
const SPEED = 5.4, ACC = 0.24, BRAKE = 0.8, GRAV = 0.62, JUMP_V = -12.6, JUMP_CUT = -5.2, JUMP_LIFT = 1;
const BOSS_X = 8600, MAP_END = BOSS_X + W;
const START_X = 320;
const GROUND = [[0, 1500], [1720, 2900], [3150, 5800], [6020, 7100], [7350, MAP_END]];
const FLIP_ZONES = [], CEIL = 0, CEIL_GAPS = [];
const PLATS = [
  { x: 600, y: 210, w: 150, kind: 'rock' }, { x: 1180, y: 150, w: 130, kind: 'rock' },
  { x: 1500, y: 240, w: 120, kind: 'move', ax: 100, ay: 0, sp: 0.022 },
  { x: 2050, y: 205, w: 150, kind: 'crumble' }, { x: 2420, y: 150, w: 130, kind: 'rock' },
  { x: 2900, y: 245, w: 110, kind: 'move', ax: 0, ay: 70, sp: 0.03 },
  { x: 3500, y: 200, w: 160, kind: 'rock' },
  { x: 5810, y: 250, w: 100, kind: 'move', ax: 110, ay: 0, sp: 0.024 },
  { x: 6300, y: 205, w: 140, kind: 'crumble' }, { x: 6560, y: 150, w: 140, kind: 'rock' },
  { x: 7110, y: 245, w: 110, kind: 'move', ax: 0, ay: 60, sp: 0.03 },
  { x: 7900, y: 200, w: 160, kind: 'rock' },
];
const WALKERS = [[400, 850], [1100, 1480], [1750, 2280], [2460, 2880], [3200, 3380], [6050, 6380], [6600, 7080], [7380, 7680], [7900, 8500]];
const FLYERS = [[1200, 1700, 110], [2300, 2900, 100], [3300, 4000, 100], [6100, 6900, 95], [7500, 8400, 110]];
const DROP_ZONES = [[1800, 2600], [6100, 6900]];             // slime drips from the cave ceiling
const DROP_G = 0.28, DROP_COLOR = '#7dff6a', DROP_SOUND = 'slime';
const HAZ = [[900, 1060], [2300, 2440], [3400, 3560], [6400, 6560], [7700, 7860]];   // green acid pools
const HAZ_TEXT = 'Autsch, Säure!';
const CHECKPOINTS = [3200, 5900, 7400];
const SITES = {};
const HEARTS = [[1245, 100], [2485, 100], [6625, 100], [7980, 150]];
const ARRIVE = { aurora: START_X };
const EXIT_LEFT = { x: 170 };                                 // the pipe back up to Aurora 61
const MID = { x: 4200, key: 'wurm' }, MID_NAME = 'RIESEN-MONDWURM';
const WURM_HOLES = [MID.x + 260, MID.x + 640, MID.x + 1020];
const BOSS_NAME = 'GRUMMEL', BOSS_SHORT = 'GRUMMEL', BOSS_COL = '#b48cff';
const WEAPON = { item: 'sun', super: null, icon: 'sun', look: 'sun', speed: 10, vy: 0, grav: 0, reload: 18, reload2: 18, sound: 'twinkle', colors: ['#ffd23a'] };
const WALK_SPEED = 1.5, WALK_COLOR = '#7dff6a', FLY_COLOR = '#b48cff', FLY_SOUND = 'bark';
const FALL_TEXT = 'In die Tiefe gefallen!', PLAT_DUST = '#b48cff';
const SHOP = [], SHOP_HELLO = '', SHOP_TITLE = () => 'OXXO', SHOW_FRUITS = false, SPACE_HELMET = false, SIGN_POLE = '#5a4a6a';
const CAGES = [BOSS_X + W - 330, BOSS_X + W - 210, BOSS_X + W - 90];
const HOOKS = { worldInit, worldBegin, worldUpdate, worldPointer, worldAsk, shotHitsExtra, updateMid, updateBoss, worldReset, worldPhase,
  drawWorldMid, drawWorldFront, drawWorldTop, startPanel };
function WAY_ICONS() { return [['pipe', 150], ['wurm', MID.x + 300]]; }
function askInfo(id) {
  return { title: tx('ZURÜCK NACH AURORA 61?'), lines: [tx('Durch die Röhre kommst du wieder hinauf zu Abu.')], yes: '▲ ' + tx('JA, HINAUF'), no: tx('NEIN, HIERBLEIBEN'), color: '#7dffa0' };
}
function wonInfo() {
  const all = allBossesDone();
  return { title: tx('GRUMMEL LACHT WIEDER!'), lines: [tx('Die Elefanten sind frei und fliegen nach Hause! +30 Münzen'), ...summaryLines(S.summary),
    all ? '🏆 ' + tx('LEVEL 4 GESCHAFFT! Alle drei Welten sind gerettet!') : tx('Noch offen:') + ' ' + openBosses().join(' · ')],
    b1: '▲ ' + tx('ZURÜCK NACH AURORA 61'), b2: tx('ZUM MENÜ') };
}
