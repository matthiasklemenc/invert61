// =====================================================================
//  LEVEL 4 · WORLD 1 – DIE MONDBASIS (Oberwelt)
//  Kai lands with the rocket from Dinoland. Low gravity: high, long jumps on the hoverboard.
//  Blue gravity zones: the gravity turns around – Kai rides upside down on the ceiling.
//  Laser barriers switch on and off, meteorites fall, satellite debris rolls along the ground.
//  Weapon: LASER-BLASTER. Mini game: ALIEN-ATTACKE (arcade machine). End boss: the STERNENFRESSER.
// =====================================================================
const WKEY = 'mond';
const SPEED = 5.4, ACC = 0.22, BRAKE = 0.75, GRAV = 0.3, JUMP_V = -10.4, JUMP_CUT = -4.2, JUMP_LIFT = 1.4;
const BOSS_X = 9300, MAP_END = BOSS_X + W;
const START_X = 360;
// moon ground – between the pieces are deep craters (falling in costs a heart)
const GROUND = [[0, 1250], [1500, 2560], [3480, 4900], [5150, 6000], [7150, 8000], [8240, MAP_END]];
// gravity zones: above the big craters there is a station ceiling – inside the zone Kai rides on it upside down
const FLIP_ZONES = [[2560, 3480], [6000, 7150]];
const CEIL = 110;                                  // where Kai's board touches the ceiling (y)
const CEIL_GAPS = [[2960, 3080], [6340, 6460], [6740, 6860]];
const PLATS = [
  { x: 560, y: 205, w: 150, kind: 'rock' }, { x: 800, y: 130, w: 130, kind: 'rock' },
  { x: 1310, y: 240, w: 120, kind: 'move', ax: 0, ay: 60, sp: 0.025 },
  { x: 1750, y: 200, w: 160, kind: 'rock' },
  { x: 3700, y: 200, w: 150, kind: 'crumble' }, { x: 3900, y: 150, w: 140, kind: 'rock' },
  { x: 4920, y: 240, w: 110, kind: 'move', ax: 120, ay: 0, sp: 0.02 },
  { x: 5450, y: 190, w: 160, kind: 'rock' },
  { x: 7420, y: 210, w: 130, kind: 'crumble' }, { x: 7620, y: 150, w: 130, kind: 'crumble' },
  { x: 8030, y: 245, w: 110, kind: 'move', ax: 0, ay: 70, sp: 0.03 },
  { x: 8500, y: 200, w: 160, kind: 'rock' },
];
const WALKERS = [[400, 1200], [1600, 2450], [3600, 4000], [4350, 4850], [5200, 5950], [7200, 7950], [8300, 9150]];
const FLYERS = [[900, 1400, 120], [1800, 2400, 100], [3700, 4400, 110], [5300, 5900, 90], [7300, 7900, 100], [8400, 9200, 110]];
const DROP_ZONES = [[1600, 2400], [7250, 7900]];      // meteorite showers
const DROP_G = 0.24, DROP_COLOR = '#b8a890', DROP_SOUND = 'land';
const HAZ = [], HAZ_TEXT = '';
const CHECKPOINTS = [3700, 7300];
const SITES = { arcade: 4100 };                     // the ALIEN-ATTACKE arcade machine in a little dome (gate = x + 120)
const HEARTS = [[1100, 140], [3250, CEIL + 70], [4500, 100], [7700, 110]];
const ARRIVE = { aurora: START_X };
const EXIT_LEFT = { x: 230, when: () => !!SAVE.done.mond };   // the rocket: back to Aurora 61 (once it was found)
const MID = null, MID_NAME = '';
const BOSS_NAME = 'STERNENFRESSER', BOSS_SHORT = 'BOSS', BOSS_COL = '#b48cff';
const WEAPON = { item: 'laser', super: null, icon: 'laser', look: 'laser', speed: 12, vy: 0, grav: 0, reload: 16, reload2: 16, sound: 'laser', colors: ['#36f4a0'] };
const WALK_SPEED = 1.7, WALK_COLOR = '#9aa8ff', FLY_COLOR = '#c9d3dc', FLY_SOUND = 'beep';
const FALL_TEXT = 'In den Krater gefallen!', PLAT_DUST = '#c9ccd4';
const SHOP = [], SHOP_HELLO = '', SHOP_TITLE = () => 'OXXO', SHOW_FRUITS = false, SPACE_HELMET = true, SIGN_POLE = '#8b96a1';
// laser barriers: on – warning – off, again and again. ceil = hanging from the station ceiling
const LASERS = [{ x: 2150, ph: 0 }, { x: 4700, ph: 60 }, { x: 6600, ph: 20, ceil: true }, { x: 7560, ph: 100 }, { x: 8780, ph: 40 }];
const LASER_T = 220, LASER_ON = 100, LASER_WARN = 30;
// satellite debris rolls in from the right in these zones
const ROLL_ZONES = [[5200, 5950], [8300, 9150]];
const HOOKS = { worldInit, worldBegin, worldUpdate, worldPhase, worldPointer, worldKey, worldAsk, shotHitsExtra, updateBoss, worldReset, siteReached, gameDir, gameShoot,
  drawSpecial, drawWorldMid, drawWorldFront, startPanel, needStart };
function WAY_ICONS() { return [['rocket', 150], ['flip', FLIP_ZONES[0][0]], ['arcade', SITES.arcade], ['flip', FLIP_ZONES[1][0]]]; }
function askInfo(id) {
  if (id === 'exit') return { title: tx('ZURÜCK NACH AURORA 61?'), lines: [tx('Mit der Rakete fliegst du zurück zu Abu auf Aurora 61.')], yes: '🚀 ' + tx('JA, LOSFLIEGEN'), no: tx('NEIN, HIERBLEIBEN'), color: '#7dffa0' };
  return { title: tx('ALIEN-ATTACKE'), lines: [tx('Ein Spielautomat! Willst du ALIEN-ATTACKE spielen?'), tx('◀ ▶ = fahren · SCHUSS = schießen. Erst die Aliens, dann das Mutterschiff!'), tx('Belohnung: 20 Münzen und ein Pokal-Stern.')], yes: tx('JA, SPIELEN!'), color: '#b48cff' };
}
function wonInfo() {
  return { title: tx('STERNENFRESSER BESIEGT!'), lines: [tx('Der Löwe zeigt den Weg: Aurora 61 ist sichtbar! +30 Münzen'), ...summaryLines(S.summary), tx('Fahr hinunter zu Abu und Flappy auf Aurora 61!')],
    b1: '▼ ' + tx('NACH AURORA 61'), b2: tx('ZUM MENÜ') };
}
