// =====================================================================
//  LEVEL 4 · WORLD 2 – AURORA 61 (Mittelwelt)
//  The invisible planet in the sign of Leo (from Matt's book "Bali's Space Adventures"): green, colourful,
//  palms, waterfalls, flowers, white round houses. Abu (the grandfather) lives here and runs the OXXO.
//  His baby elephant FLAPPY flies along with Kai. Elephants on Aurora 61 can fly when they are happy:
//  give a sad elephant 3 mangos and it gets wings and flies Kai over the big gorges.
//  Weapon: FARBKUGELN (paint balls) – they make Grisella's grey creatures colourful and happy again.
//  Mini game: FOTOSAFARI with Abu's camera. End boss: die FARBHEXE GRISELLA.
//  After her: the big elephant at the pipe needs the Mega-Mango-Kuchen – then he lifts the lid (→ Unterwelt).
// =====================================================================
const WKEY = 'aurora';
const SPEED = 5.4, ACC = 0.24, BRAKE = 0.8, GRAV = 0.62, JUMP_V = -12.6, JUMP_CUT = -5.2, JUMP_LIFT = 1;
const BOSS_X = 9000, MAP_END = BOSS_X + W;
const START_X = 360;
const GROUND = [[0, 2200], [2420, 3800], [4700, 6200], [6440, 7300], [8100, MAP_END]];
const FLIP_ZONES = [], CEIL = 0, CEIL_GAPS = [];
const PLATS = [
  { x: 700, y: 210, w: 150, kind: 'rock' }, { x: 920, y: 150, w: 130, kind: 'rock' },
  { x: 1900, y: 205, w: 140, kind: 'rock' },
  { x: 2230, y: 245, w: 110, kind: 'move', ax: 0, ay: 60, sp: 0.03 },
  { x: 2800, y: 210, w: 150, kind: 'rock' }, { x: 3050, y: 150, w: 120, kind: 'crumble' },
  { x: 5000, y: 205, w: 160, kind: 'rock' }, { x: 5180, y: 140, w: 120, kind: 'rock' },
  { x: 6205, y: 250, w: 100, kind: 'move', ax: 130, ay: 0, sp: 0.02 },
  { x: 6700, y: 205, w: 140, kind: 'crumble' }, { x: 6900, y: 150, w: 140, kind: 'rock' },
  { x: 8400, y: 205, w: 160, kind: 'rock' },
];
const WALKERS = [[500, 1200], [1600, 2150], [2500, 3700], [4800, 5300], [5700, 6150], [6500, 7250], [8200, 8900]];
const FLYERS = [[1500, 2100, 110], [2600, 3500, 100], [4900, 5900, 100], [6500, 7200, 90], [8200, 8900, 110]];
const DROP_ZONES = [[2550, 3300], [6500, 7200]];          // coconuts falling from the palms
const DROP_G = 0.3, DROP_COLOR = '#8a5a32', DROP_SOUND = 'whack';
const HAZ = [], HAZ_TEXT = '';
const CHECKPOINTS = [2500, 4900, 6500];
const SITES = { oxxo: 1350, foto: 5600, bigele: BOSS_X + W - 560, pipe: BOSS_X + W - 320 };
const HEARTS = [[985, 100], [3110, 100], [5240, 90], [8480, 150]];
// the sad elephants at the two big gorges (they sit on the left cliff)
const ELES = [{ x: 3690, g1: 3800, g2: 4700 }, { x: 7190, g1: 7300, g2: 8100 }];
const BIG_ELE_X = BOSS_X + W - 440, PIPE_X = BOSS_X + W - 230, PIPE_W = 96, PIPE_H = 74;
const ARRIVE = { mond: START_X, unter: PIPE_X + PIPE_W + 60 };
const EXIT_LEFT = { x: 230 };                              // the rocket back up to the moon
const MID = null, MID_NAME = '';
const BOSS_NAME = 'FARBHEXE GRISELLA', BOSS_SHORT = 'GRISELLA', BOSS_COL = '#c9d3dc';
const WEAPON = { item: 'paint', super: 'paint2', icon: 'paint', look: 'paint', speed: 10.5, vy: -1.2, grav: 0.08, reload: 20, reload2: 12, sound: 'pop', colors: ['#ff5a8a', '#36c6f4', '#ffd23a', '#7dffa0', '#b48cff'] };
const WALK_SPEED = 1.6, WALK_COLOR = '#ff9ad0', FLY_COLOR = '#ffd23a', FLY_SOUND = 'bark';
const FALL_TEXT = 'In die Schlucht gefallen!', PLAT_DUST = '#f7d6ff';
const SHOW_FRUITS = true, SPACE_HELMET = false, SIGN_POLE = '#8a6a4a';
const SHOP_HELLO = 'Hallo Kai! Was darf es sein? Abu hat alles!';
const SHOP_TITLE = () => 'OXXO · ' + tx('BEI ABU');
const SHOP = [
  { id: 'cake', name: 'Mega-Mango-Kuchen', desc: 'Für den großen Elefanten – Pflicht für die Unterwelt!', price: 50, kind: 'item', must: true, thanks: 'Der große Elefant wird sich freuen!' },
  { id: 'mangos', name: '3 Mangos', desc: 'Für die traurigen Elefanten', price: 10, kind: 'power' },
  { id: 'paint2', name: 'Super-Farbkugeln', desc: 'Schießt doppelt und schneller', price: 35, kind: 'item', onBuy: () => { SAVE.weapon.aurora = 'paint2'; } },
  { id: 'heart', name: 'Herz', desc: '+1 Herz', price: 20, kind: 'power' },
  { id: 'capRed', who: 'kai', name: 'Rote Kappe', price: 10, kind: 'cloth', apply: o => { o.cap = '#d8352c'; o.beanie = false; } },
  { id: 'capBali', who: 'bali', name: 'Schildkappe', desc: 'Kappe für Bali', price: 10, kind: 'cloth', apply: o => { o.cap = '#f48fb8'; o.beanie = false; } },
  { id: 'capGold', name: 'Goldene Kappe', price: 30, kind: 'cloth', apply: o => { o.cap = '#e8b923'; o.beanie = false; } },
  { id: 'beanie', name: 'Beanie', price: 15, kind: 'cloth', apply: o => { o.beanie = true; } },
  { id: 'teeYellow', name: 'Gelbes T-Shirt', price: 10, kind: 'cloth', apply: o => { o.tee = '#e0a81e'; } },
  { id: 'shoesRed', name: 'Rote Schuhe', price: 15, kind: 'cloth', apply: o => { o.shoes = '#d8352c'; } },
];
const HOOKS = { worldInit, worldBegin, worldUpdate, worldPhase, worldPointer, worldKey, worldAsk, shotHitsExtra, updateBoss, updateFly, worldReset, siteReached, afterShop, gameDir, gameShoot,
  drawSpecial, drawWorldMid, drawWorldFront, drawWorldTop, drawKaiOverride, startPanel, drawShopClerk };
function WAY_ICONS() { return [['rocket', 150], ['oxxo', SITES.oxxo], ['elefant', ELES[0].x], ['foto', SITES.foto], ['elefant', ELES[1].x]]; }
function askInfo(id) {
  if (id === 'exit') return { title: tx('ZURÜCK ZUM MOND?'), lines: [tx('Mit der Rakete fliegst du zurück zur Mondbasis.')], yes: '🚀 ' + tx('JA, LOSFLIEGEN'), no: tx('NEIN, HIERBLEIBEN'), color: '#9fd8ff' };
  if (id === 'oxxo') return { title: tx('ABUS OXXO'), lines: [tx('Abus OXXO! Willst du reingehen?'), tx('Hier gibt es den Mega-Mango-Kuchen, Mangos, Super-Farbkugeln, Herzen und Kleider.')], yes: tx('JA, REINGEHEN!'), color: '#ff6a5a' };
  if (id === 'foto') return { title: tx('FOTOSAFARI'), lines: [tx('Abu leiht dir seine Kamera: fotografiere die lustigen Tiere von Aurora 61!'), tx('Tippe auf die richtigen Tiere. Du hast 45 Sekunden.'), tx('Belohnung: 20 Münzen und ein Pokal-Stern.')], yes: tx('JA, SPIELEN!'), color: '#ffb02e' };
  if (id === 'feed') return { title: tx('DER GROSSE ELEFANT'), lines: [tx('Der große Elefant ist traurig. Gibst du ihm den Mega-Mango-Kuchen?'), tx('Dann wird er glücklich, bekommt Flügel und hebt den Deckel von der Röhre.')], yes: '🍰 ' + tx('JA, FÜTTERN'), color: '#9fb6d6' };
  if (id === 'pipe') return { title: tx('HINUNTER IN DIE UNTERWELT?'), lines: [tx('Durch die Röhre geht es hinunter in die Unterwelt.'), tx('Dort warten der Riesen-Mondwurm und Grummel, der Glücksdieb.')], yes: '▼ ' + tx('JA, HINUNTER'), color: '#b48cff' };
  if (id.startsWith('eleBack')) return { title: tx('ZURÜCKFLIEGEN?'), lines: [tx('Der Elefant fliegt dich gern wieder zurück über die Schlucht.')], yes: '🐘 ' + tx('JA, ZURÜCK'), color: '#9fb6d6' };
  const i = +id.slice(3), happy = SAVE['ele' + i];
  return happy ? { title: tx('ELEFANTEN-FLUG'), lines: [tx('Der Elefant ist glücklich und fliegt dich über die Schlucht!'), tx('SPRUNG halten = höher fliegen · loslassen = tiefer.')], yes: '🐘 ' + tx('JA, FLIEGEN!'), color: '#9fb6d6' }
    : { title: tx('EIN TRAURIGER ELEFANT'), lines: [tx('Dieser Elefant ist traurig. Gibst du ihm 3 Mangos?'), tx('Dann bekommt er Flügel und fliegt dich über die Schlucht!'), tx('SPRUNG halten = höher fliegen · loslassen = tiefer.')], yes: '🥭 ' + tx('JA, FÜTTERN'), color: '#9fb6d6' };
}
function wonInfo() {
  return { title: tx('GRISELLA IST GEFLOHEN!'), lines: [tx('Aurora 61 ist wieder bunt! +30 Münzen'), ...summaryLines(S.summary),
    SAVE.items.fedBig ? tx('Der Deckel ist offen – ab durch die Röhre in die Unterwelt!') : SAVE.items.cake ? tx('Gib dem großen Elefanten den Mega-Mango-Kuchen – dann hebt er den Deckel!') : tx('Grisella ist in die Röhre geflüchtet. Hol den Mega-Mango-Kuchen bei Abu für den großen Elefanten!')],
    b1: tx('WEITER'), b2: tx('ZUM MENÜ') };
}
