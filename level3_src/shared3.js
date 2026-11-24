
// =====================================================================
//  LEVEL 3 (DINOLAND) – shared game state (valley / rocks / lava caves), languages, progress box
// =====================================================================
const SAVE_KEY = 'invert61-level3';
const SAVE_DEFAULT = {
  lang: 'de', hearts: 5, lives: 3, coins: 0, pearls: 0, starfish: 0,
  items: { magmaBoard: false, slingshot: false, sling2: false, bombs: false },
  weapon: {},
  outfit: { char: 'kai', tee: '#1f3c6e', cap: '#1e4fa3', beanie: false, backpack: false, shoes: '#1b1b22', halo: false },
  // two playable characters, each with her / his own clothes. SAVE.outfit is always the one being played.
  char: 'kai',
  outfitKai: null,
  outfitBali: { char: 'bali', tee: '#f6a3c4', cap: null, beanie: false, backpack: false, shoes: '#ffffff', halo: false, bottom: 'jeans' },
  owned: {},                                   // bought clothes
  done: { tal: false, hoehe: false, lava: false },
  mini: { rodeo: null, fossil: null, ptero: null, lore: null },
  checkpoint: null,                            // snapshot at the start of the current world
  score: 0, best: 0,                           // points of this game / personal record on this device
  pts: {},                                     // what already gave its one-time points (mini games, bosses)
  wtime: { tal: 0, hoehe: 0, lava: 0 },        // frames played in each world (for the time bonus)
};
function loadSave() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (raw) return Object.assign({}, SAVE_DEFAULT, raw, { pts: Object.assign({}, raw.pts), wtime: Object.assign({}, SAVE_DEFAULT.wtime, raw.wtime), items: Object.assign({}, SAVE_DEFAULT.items, raw.items), outfit: Object.assign({}, SAVE_DEFAULT.outfit, raw.outfit), outfitBali: Object.assign({}, SAVE_DEFAULT.outfitBali, raw.outfitBali), done: Object.assign({}, SAVE_DEFAULT.done, raw.done), mini: Object.assign({}, SAVE_DEFAULT.mini, raw.mini) });
  } catch (e) {}
  return JSON.parse(JSON.stringify(SAVE_DEFAULT));
}
const SAVE = loadSave();
// first start of Level 3: take over who rides, the clothes and the language from Level 2
if (!SAVE.importedL2) {
  try {
    const l2 = JSON.parse(localStorage.getItem('invert61-level2') || 'null');
    if (l2) for (const k of ['char', 'outfit', 'outfitKai', 'outfitBali', 'owned', 'lang']) if (l2[k] != null) SAVE[k] = l2[k];
  } catch (e) {}
  SAVE.importedL2 = true;
}
SAVE.weapon = SAVE.weapon || {}; SAVE.owned = SAVE.owned || {}; if (SAVE.outfit.halo) SAVE.owned.halo = true;
SAVE.char = SAVE.char === 'bali' ? 'bali' : 'kai'; SAVE.outfit.char = SAVE.char;
// switch between Kai and Bali: the clothes of the one who leaves are kept, the other one's clothes come back
function setCharacter(c) {
  if (c !== 'kai' && c !== 'bali') return;
  if (SAVE.char === c) return;
  if (SAVE.char === 'bali') SAVE.outfitBali = SAVE.outfit; else SAVE.outfitKai = SAVE.outfit;
  SAVE.char = c;
  SAVE.outfit = c === 'bali' ? Object.assign({}, SAVE_DEFAULT.outfitBali, SAVE.outfitBali) : Object.assign({}, SAVE_DEFAULT.outfit, SAVE.outfitKai || {});
  SAVE.outfit.char = c;
  writeSave();
}
const forChar = it => !it.who || it.who === SAVE.char;   // items only one of the two can wear
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {} }
function resetSave(keepLang = true) { const lang = SAVE.lang; Object.assign(SAVE, JSON.parse(JSON.stringify(SAVE_DEFAULT))); if (keepLang) SAVE.lang = lang; writeSave(); }
// remember the state at the start of a world, so a game over only restarts that world
function setCheckpoint(world) {
  SAVE.checkpoint = { world, hearts: SAVE.hearts, coins: SAVE.coins, score: SAVE.score || 0, pearls: SAVE.pearls, starfish: SAVE.starfish, items: Object.assign({}, SAVE.items) };
  SAVE.cps = Object.assign({}, SAVE.cps, { [world]: SAVE.checkpoint }); writeSave();
}
// back in a world that was already started (e.g. the city after the sky): use that world's own checkpoint again
function useCheckpoint(world) { if (SAVE.cps && SAVE.cps[world]) { SAVE.checkpoint = SAVE.cps[world]; writeSave(); } else setCheckpoint(world); }
// world restart (all lives lost): hearts, coins, pearls and starfish go back to the world start –
// but bought things STAY, and coins spent on them stay spent (see spendCoins)
function restoreCheckpoint() { const c = SAVE.checkpoint; if (!c) return; Object.assign(SAVE, { hearts: c.hearts, coins: Math.max(0, c.coins), score: c.score ?? SAVE.score, pearls: c.pearls, starfish: c.starfish }); writeSave(); }
// a purchase also lowers the coins the checkpoint would give back
function spendCoins(n) { for (const c of new Set([SAVE.checkpoint, ...Object.values(SAVE.cps || {})])) if (c) c.coins = Math.max(0, c.coins - n); writeSave(); }
// ---------------- points ----------------
// Points are for comparing (coins are money for the OXXO). Defeated dinos stay gone, mini games and bosses
// give their big points only once per game – so nobody can farm millions. A boss can be fought again and again.
const PTS = { coin: 10, raptor: 100, compy: 100, salamander: 100, baby: 50, bat: 150, ptero: 200, trike: 300, stego: 300, mini: 1000, miniboss: 2000, boss: 5000 };
// time bonus: starts at 10'000 and shrinks by 25 per second played in that world – never below 0 (no countdown!)
const TIME_BONUS_MAX = 10000, TIME_BONUS_PER_S = 25;
const timeBonus = sec => Math.max(0, Math.round((TIME_BONUS_MAX - sec * TIME_BONUS_PER_S) / 10) * 10);
const fmtNum = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
const fmtTime = sec => Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
function bumpBest() { if ((SAVE.score || 0) > (SAVE.best || 0)) { SAVE.best = SAVE.score; return true; } return false; }
// the score box in the HUD (below the coins)
function drawScoreBox(score) {
  ctx.save(); ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(20,30,50,0.6)'; ctx.beginPath(); ctx.roundRect(W - 168, 46, 156, 26, 10); ctx.fill();
  ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'left'; ctx.fillText(tx('PUNKTE'), W - 158, 59);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'right'; ctx.fillText(fmtNum(score), W - 20, 60);
  ctx.restore();
}
// "+100" floating up where it happened (world coordinates)
function drawPops(pops) {
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  for (const p of pops) {
    const u = p.t / 60; ctx.globalAlpha = Math.max(0, 1 - u * u);
    ctx.font = `bold ${p.big ? 22 : 16}px Arial`; ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.fillStyle = p.col || '#ffe14d';
    ctx.strokeText(p.text, p.x, p.y - u * 40); ctx.fillText(p.text, p.x, p.y - u * 40);
  }
  ctx.restore();
}
// the boss energy bar: green → yellow → red
function drawBossBar(name, frac) {
  const bw = 300, bx = W / 2 - bw / 2 + 40, f = clamp(frac, 0, 1);
  ctx.save(); ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(30,20,30,0.78)'; ctx.beginPath(); ctx.roundRect(W / 2 - 230, 6, 460, 32, 12); ctx.fill();
  ctx.fillStyle = '#ffe0f0'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'right'; ctx.fillText(name, bx - 10, 23);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.roundRect(bx, 14, bw, 16, 8); ctx.fill();
  const col = f > 0.6 ? '#34c759' : f > 0.3 ? '#ffcc2e' : '#ff3b30';
  if (f > 0) { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(bx, 14, Math.max(8, bw * f), 16, 8); ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(bx, 14, bw, 16, 8); ctx.stroke();
  ctx.restore();
}
// little symbols in the way bar at the top: where the lianas, pipes, mini games, shop and middle boss are
function drawBarIcon(type, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const col = { liana: '#4caf50', pipe: '#ff7a2a', rodeo: '#ffb02e', fossil: '#e3c88f', oxxo: '#d8231f', ride: '#ff9ad0', lore: '#9aa0a8', anky: '#e2541c' }[type] || '#fff';
  ctx.fillStyle = col; ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.fillStyle = OUT; ctx.lineWidth = 1.8;
  if (type === 'liana') { ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(0, -5); ctx.moveTo(-4, -1); ctx.lineTo(0, -5); ctx.lineTo(4, -1); ctx.stroke(); }
  else if (type === 'pipe') { ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.moveTo(-4, 1); ctx.lineTo(0, 5); ctx.lineTo(4, 1); ctx.stroke(); }
  else if (type === 'rodeo') { ctx.beginPath(); ctx.arc(0, 0, 4.5, Math.PI * 0.15, Math.PI * 0.85, true); ctx.stroke(); }
  else if (type === 'fossil') { ctx.beginPath(); ctx.moveTo(-4, 3); ctx.lineTo(4, -3); ctx.stroke(); for (const [bx, by] of [[-4, 3], [4, -3]]) { ctx.beginPath(); ctx.arc(bx, by, 1.8, 0, Math.PI * 2); ctx.fill(); } }
  else if (type === 'oxxo') { ctx.fillStyle = '#ffd23a'; ctx.fillRect(-6, -2, 12, 4); }
  else if (type === 'ride') { ctx.beginPath(); ctx.moveTo(-6, -2); ctx.quadraticCurveTo(-3, 2, 0, -1); ctx.quadraticCurveTo(3, 2, 6, -2); ctx.stroke(); }
  else if (type === 'lore') { ctx.fillRect(-5, -4, 10, 5); ctx.beginPath(); ctx.arc(-3, 3, 1.8, 0, Math.PI * 2); ctx.arc(3, 3, 1.8, 0, Math.PI * 2); ctx.fill(); }
  else if (type === 'anky') { ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 0, 1); }
  ctx.restore();
}
// the way bar (top middle): progress to the boss, checkpoints, and the symbols of the places on the way
function drawWayBar(kx, bossX, cps, cpX, icons, label, labelCol) {
  ctx.save(); ctx.textBaseline = 'middle';
  const bx = W / 2 - 170, bw = 340, u = clamp(kx / bossX, 0, 1);
  ctx.fillStyle = 'rgba(20,30,50,0.55)'; ctx.beginPath(); ctx.roundRect(bx - 14, 4, bw + 90, 34, 12); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.roundRect(bx, 17, bw, 8, 4); ctx.fill();
  ctx.fillStyle = '#7dd35a'; ctx.beginPath(); ctx.roundRect(bx, 17, bw * u, 8, 4); ctx.fill();
  for (const c of cps) { ctx.fillStyle = cpX >= c ? '#34c759' : '#d8352c'; ctx.fillRect(bx + bw * c / bossX - 1, 13, 3, 16); }
  for (const [type, x] of icons) drawBarIcon(type, bx + bw * clamp(x / bossX, 0, 1), 21);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(bx + bw * u, 21, 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.font = 'bold 12px Arial'; ctx.fillStyle = labelCol; ctx.textAlign = 'left'; ctx.fillText(label, bx + bw + 10, 21);
  ctx.restore();
}
// the end-of-world summary lines (boss beaten)
function summaryLines(sm) {
  if (!sm) return [];
  if (sm.repeat) return [tx('Schon einmal besiegt – diesmal gibt es keine Punkte, nur den Spaß.'), tx('Punkte: {p}   ·   Rekord: {r}', { p: fmtNum(SAVE.score), r: fmtNum(SAVE.best || 0) })];
  return [tx('Boss besiegt: +{b}   ·   Zeitbonus ({t}): +{z}', { b: fmtNum(sm.boss), t: fmtTime(sm.sec), z: fmtNum(sm.time) }),
    (sm.record ? tx('NEUER REKORD!') + '  ' : '') + tx('Punkte: {p}   ·   Rekord: {r}', { p: fmtNum(SAVE.score), r: fmtNum(SAVE.best || 0) })];
}
// ---------------- lives ----------------
// 3 lives: when all hearts are gone one life is lost and Kai simply carries on right there with full hearts.
// Only when all 3 lives are gone the current world starts again (from its checkpoint).
const LIVES_MAX = 3, LIFE_HEARTS = 5;
// Level 3 only opens when all three bosses are beaten: garbage truck (city), harp finale (sky), giant squid (sea)
const allBossesDone = () => !!(SAVE.done.tal && SAVE.done.hoehe && SAVE.done.lava);
function openBosses() {
  const l = [];
  if (!SAVE.done.tal) l.push(tx('T-Rex im Dino-Tal besiegen'));
  if (!SAVE.done.hoehe) l.push(tx('Flugsaurier-Mama auf der Felsenhöhe besiegen'));
  if (!SAVE.done.lava) l.push(tx('Riesenvulkan in den Lavahöhlen besiegen'));
  return l;
}
function loseLife() { SAVE.lives = Math.max(0, (SAVE.lives ?? LIVES_MAX) - 1); writeSave(); return SAVE.lives > 0; }
function restartWorldSave() { restoreCheckpoint(); SAVE.lives = LIVES_MAX; writeSave(); }
// ======================================================================
// INVENTORY (top left): weapons + outfit Kai owns, opened as a drop-down. The game pauses while it is open.
// ======================================================================
const INV = { open: false, btn: null, panel: null, chips: [] };
// Level 3 weapons: the slingshot on the Felsenhöhe (water bombs for the lava caves come later)
const INV_WEAPONS = [
  { id: 'sling', name: 'Steinschleuder', where: 'Felsenhöhe', world: 'hoehe', owned: () => !!SAVE.items.slingshot, worn: () => !(SAVE.items.sling2 && SAVE.weapon.hoehe !== 'sling'), pick: () => { SAVE.weapon.hoehe = 'sling'; } },
  { id: 'sling2', name: 'Super-Schleuder', where: 'Felsenhöhe', world: 'hoehe', owned: () => !!SAVE.items.sling2, worn: () => !!SAVE.items.sling2 && SAVE.weapon.hoehe !== 'sling', pick: () => { SAVE.weapon.hoehe = 'sling2'; } },
  { id: 'magma', name: 'Magma-Board', where: 'Lavahöhlen', world: 'lava', owned: () => !!SAVE.items.magmaBoard, worn: () => true, pick: () => {} },
  { id: 'bombs', name: 'Wasserbomben', where: 'Lavahöhlen', world: 'lava', owned: () => !!SAVE.items.bombs, worn: () => true, pick: () => {} },
];
const OUTFIT_GROUPS = [
  { label: 'Kopf', opts: [
    { id: 'capBlue', who: 'kai', name: 'Blaue Kappe', sw: '#1e4fa3', owned: () => true, worn: o => !o.beanie && (o.cap || '#1e4fa3') === '#1e4fa3', apply: o => { o.cap = '#1e4fa3'; o.beanie = false; } },
    { id: 'capRed', who: 'kai', name: 'Rote Kappe', sw: '#d8352c', worn: o => !o.beanie && o.cap === '#d8352c', apply: o => { o.cap = '#d8352c'; o.beanie = false; } },
    { id: 'capGreen', who: 'kai', name: 'Grüne Kappe', sw: '#2f8a5f', worn: o => !o.beanie && o.cap === '#2f8a5f', apply: o => { o.cap = '#2f8a5f'; o.beanie = false; } },
    { id: 'hairFree', who: 'bali', name: 'Ohne Mütze', sw: '#e8cd8e', owned: () => true, worn: o => !o.beanie && !o.cap, apply: o => { o.cap = null; o.beanie = false; } },
    { id: 'capBali', who: 'bali', name: 'Schildkappe', sw: '#f48fb8', worn: o => !o.beanie && o.cap === '#f48fb8', apply: o => { o.cap = '#f48fb8'; o.beanie = false; } },
    { id: 'capGold', name: 'Goldene Kappe', sw: '#e8b923', worn: o => !o.beanie && o.cap === '#e8b923', apply: o => { o.cap = '#e8b923'; o.beanie = false; } },
    { id: 'beanie', name: 'Beanie', sw: '#7a3fb8', worn: o => !!o.beanie, apply: o => { o.beanie = true; } },
  ] },
  { label: 'T-Shirt', opts: [
    { id: 'teeBlue', who: 'kai', name: 'Blaues T-Shirt', sw: '#1f3c6e', owned: () => true, worn: o => (o.tee || '#1f3c6e') === '#1f3c6e', apply: o => { o.tee = '#1f3c6e'; } },
    { id: 'teePink', who: 'bali', name: 'Rosa T-Shirt', sw: '#f6a3c4', owned: () => true, worn: o => (o.tee || '#f6a3c4') === '#f6a3c4', apply: o => { o.tee = '#f6a3c4'; } },
    { id: 'teeRed', name: 'Rotes T-Shirt', sw: '#c8352c', worn: o => o.tee === '#c8352c', apply: o => { o.tee = '#c8352c'; } },
    { id: 'teeYellow', name: 'Gelbes T-Shirt', sw: '#e0a81e', worn: o => o.tee === '#e0a81e', apply: o => { o.tee = '#e0a81e'; } },
  ] },
  { label: 'Hose', opts: [
    { id: 'jeans', who: 'bali', name: 'Jeans', sw: '#4a78b8', owned: () => true, worn: o => (o.bottom || 'jeans') === 'jeans', apply: o => { o.bottom = 'jeans'; } },
    { id: 'shorts', who: 'bali', name: 'Kurze Hose', sw: '#4a78b8', worn: o => o.bottom === 'shorts', apply: o => { o.bottom = 'shorts'; } },
    { id: 'skirt', who: 'bali', name: 'Rock', sw: '#d94f7c', worn: o => o.bottom === 'skirt', apply: o => { o.bottom = 'skirt'; } },
  ] },
  { label: 'Schuhe', opts: [
    { id: 'shoesDark', who: 'kai', name: 'Schwarze Schuhe', sw: '#1b1b22', owned: () => true, worn: o => (o.shoes || '#1b1b22') === '#1b1b22', apply: o => { o.shoes = '#1b1b22'; } },
    { id: 'shoesWhite', who: 'bali', name: 'Weisse Schuhe', sw: '#ffffff', owned: () => true, worn: o => (o.shoes || '#ffffff') === '#ffffff', apply: o => { o.shoes = '#ffffff'; } },
    { id: 'shoesRed', name: 'Rote Schuhe', sw: '#d8352c', worn: o => o.shoes === '#d8352c', apply: o => { o.shoes = '#d8352c'; } },
  ] },
  { label: 'Extras', toggle: true, opts: [
    { id: 'backpack', name: 'Rucksack', sw: '#e0702b', worn: o => !!o.backpack, apply: o => { o.backpack = !o.backpack; } },
    { id: 'halo', name: 'Heiligenschein', sw: '#ffd23a', worn: o => !!o.halo, apply: o => { o.halo = !o.halo; } },
  ] },
];
// the two characters (first row in ITEMS)
const INV_CHARS = [
  { id: 'kai', name: 'Kai', worn: () => SAVE.char === 'kai' },
  { id: 'bali', name: 'Bali', worn: () => SAVE.char === 'bali' },
];
const optOwned = it => it.owned ? it.owned() : !!SAVE.owned[it.id];
function invCount() { return INV_WEAPONS.filter(w => w.owned() && w.id !== 'sling').length + OUTFIT_GROUPS.reduce((n, g) => n + g.opts.filter(o => forChar(o) && !o.owned && optOwned(o)).length, 0); }
function drawInvButton(x, y) {
  const b = { x, y, w: 92, h: 26 }; INV.btn = b;
  ctx.save(); ctx.fillStyle = INV.open ? 'rgba(255,210,58,0.95)' : 'rgba(10,20,40,0.6)'; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 10); ctx.fill();
  // little backpack icon
  ctx.translate(b.x + 15, b.y + 13); ctx.fillStyle = '#e0702b'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.roundRect(-6, -7, 12, 14, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c2551a'; ctx.fillRect(-4, 0, 8, 4);
  ctx.beginPath(); ctx.arc(0, -7, 3, Math.PI, 0); ctx.stroke();
  ctx.translate(-b.x - 15, -b.y - 13);
  ctx.fillStyle = INV.open ? OUT : '#ffffff'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(tx('ITEMS') + ' ' + (INV.open ? '▴' : '▾'), b.x + 27, b.y + 13);
  const n = invCount();
  if (n > 0) { ctx.fillStyle = '#ff5a4f'; ctx.beginPath(); ctx.arc(b.x + b.w - 4, b.y + 3, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.fillText(String(n), b.x + b.w - 4, b.y + 3.5); }
  ctx.restore();
}
function drawInvSwatch(id, sw, cx, cy) {
  ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = OUT; ctx.lineWidth = 1.3; ctx.fillStyle = sw;
  if (id === 'sling' || id === 'sling2') { ctx.strokeStyle = '#7a4f2c'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, 1); ctx.lineTo(-5, -7); ctx.moveTo(0, 1); ctx.lineTo(5, -7); ctx.stroke(); ctx.strokeStyle = '#d8352c'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-5, -7); ctx.lineTo(0, -3); ctx.lineTo(5, -7); ctx.stroke(); if (id === 'sling2') { ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 8px Arial'; ctx.fillText('2', 5, 6); } }
  else if (id === 'bombs') { ctx.fillStyle = '#3aa0f0'; ctx.beginPath(); ctx.ellipse(0, -1, 6, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(-2, -3, 1.6, 0, Math.PI * 2); ctx.fill(); }
  else if (id === 'magma') { ctx.rotate(-0.3); ctx.fillStyle = '#3a2a26'; ctx.beginPath(); ctx.roundRect(-10, -3, 20, 6, 3); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#ff7a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke(); }
  else if (id === 'arrow') { ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(7, 0); ctx.stroke(); ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(3, -4); ctx.lineTo(3, 4); ctx.closePath(); ctx.fill(); }
  else if (id === 'starSea') { ctx.strokeStyle = '#c9d3dc'; ctx.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 3, Math.sin(a) * 3); ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9); ctx.stroke(); } }
  else if (id === 'star') { ctx.fillStyle = '#ffd23a'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 3.5 : 8, a = i * Math.PI / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (id === 'harpoon') { ctx.strokeStyle = '#c9d3dc'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(6, 0); ctx.stroke(); ctx.fillStyle = '#c9d3dc'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(4, -4); ctx.lineTo(4, 4); ctx.closePath(); ctx.fill(); }
  else if (id.startsWith('cap')) { ctx.beginPath(); ctx.arc(0, 2, 7, Math.PI, 0); ctx.lineTo(11, 2); ctx.lineTo(-7, 2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (id === 'beanie') { ctx.beginPath(); ctx.arc(0, 3, 7, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -5, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  else if (id.startsWith('tee')) { ctx.beginPath(); ctx.moveTo(-8, -5); ctx.lineTo(-3, -7); ctx.lineTo(3, -7); ctx.lineTo(8, -5); ctx.lineTo(6, -1); ctx.lineTo(4, -2); ctx.lineTo(4, 7); ctx.lineTo(-4, 7); ctx.lineTo(-4, -2); ctx.lineTo(-6, -1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (id.startsWith('shoes')) { ctx.beginPath(); ctx.moveTo(-8, 3); ctx.lineTo(-8, -3); ctx.lineTo(-1, -3); ctx.quadraticCurveTo(8, -1, 9, 4); ctx.lineTo(-8, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (id === 'kai' || id === 'bali') {
    // little head: Kai with his blue cap, Bali with blond hair
    if (id === 'bali') { ctx.fillStyle = '#e8cd8e'; ctx.beginPath(); ctx.moveTo(-8, -3); ctx.quadraticCurveTo(-8, -10, 0, -10); ctx.quadraticCurveTo(8, -10, 8, -3); ctx.lineTo(8, 7); ctx.lineTo(-8, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = id === 'bali' ? '#f6d3b8' : '#f6cfa6'; ctx.beginPath(); ctx.arc(1, 1, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (id === 'kai') { ctx.fillStyle = '#f2c14e'; ctx.fillRect(-8, -1, 4, 7); ctx.fillStyle = '#1e4fa3'; ctx.beginPath(); ctx.arc(1, -2, 6.5, Math.PI, 0); ctx.lineTo(11, -2); ctx.lineTo(-6, -2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { ctx.fillStyle = '#e8cd8e'; ctx.beginPath(); ctx.arc(1, -2, 6.5, Math.PI, 0); ctx.quadraticCurveTo(3, -4, -5, -1); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(4, 1, 1, 0, Math.PI * 2); ctx.fill();
  }
  else if (id === 'hairFree') { ctx.beginPath(); ctx.moveTo(-7, 6); ctx.quadraticCurveTo(-8, -8, 0, -8); ctx.quadraticCurveTo(8, -8, 7, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (id === 'jeans') { ctx.beginPath(); ctx.moveTo(-6, -7); ctx.lineTo(6, -7); ctx.lineTo(7, 8); ctx.lineTo(2, 8); ctx.lineTo(0, -1); ctx.lineTo(-2, 8); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (id === 'shorts') { ctx.beginPath(); ctx.moveTo(-7, -5); ctx.lineTo(7, -5); ctx.lineTo(8, 4); ctx.lineTo(1, 4); ctx.lineTo(0, 0); ctx.lineTo(-1, 4); ctx.lineTo(-8, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (id === 'skirt') { ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(5, -6); ctx.lineTo(9, 7); ctx.quadraticCurveTo(0, 9, -9, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (id === 'halo') { ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2); ctx.stroke(); }
  else { ctx.beginPath(); ctx.roundRect(-6, -7, 12, 14, 3); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
// panel layout (screen coordinates, right under the button)
function drawInventoryPanel() {
  if (!INV.open || !INV.btn) return;
  const chipW = 150, chipH = 30, gap = 6, labelW = 74, cols = 4;
  const x = 12, y0 = INV.btn.y + INV.btn.h + 6, w = labelW + cols * (chipW + gap) + 12;
  const rows = [];
  rows.push({ head: tx('FIGUR') });
  rows.push({ label: '', items: INV_CHARS.map(it => ({ it, figure: true })) });
  const wps = INV_WEAPONS.filter(it => it.owned());
  if (wps.length) { rows.push({ head: tx('WAFFEN') }); rows.push({ label: '', items: wps.map(it => ({ it, weapon: true })) }); }
  rows.push({ head: tx('OUTFIT') });
  for (const g of OUTFIT_GROUPS) { const items = g.opts.filter(it => forChar(it) && optOwned(it)).map(it => ({ it, g })); if (items.length) rows.push({ label: tx(g.label), items }); }
  let h = 10; for (const r of rows) h += r.head ? 24 : chipH + gap; h += 6;
  INV.panel = { x, y: y0, w, h }; INV.chips = [];
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, VH);
  ctx.fillStyle = 'rgba(12,24,48,0.96)'; ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(x, y0, w, h, 14); ctx.fill(); ctx.stroke();
  let y = y0 + 10;
  ctx.textBaseline = 'middle';
  for (const r of rows) {
    if (r.head) { ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'left'; ctx.fillText(r.head, x + 14, y + 11); ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(x + 14 + ctx.measureText(r.head).width + 8, y + 11, w - 40 - ctx.measureText(r.head).width, 1); y += 24; continue; }
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'left'; ctx.fillText(r.label, x + 14, y + chipH / 2);
    r.items.forEach((c, i) => {
      // a weapon only counts in its own world: there it is green when chosen; elsewhere it is greyed out
      const here = !c.weapon || (typeof CUR !== 'undefined' && CUR && CUR.key === c.it.world);
      const cx = x + labelW + i * (chipW + gap), on = c.weapon ? here && c.it.worn() : c.figure ? c.it.worn() : c.it.worn(SAVE.outfit);
      ctx.globalAlpha = here ? 1 : 0.4;
      const rect = { x: cx, y, w: chipW, h: chipH }; INV.chips.push(Object.assign({ rect }, c));
      ctx.fillStyle = on ? 'rgba(52,199,89,0.9)' : 'rgba(255,255,255,0.1)'; ctx.strokeStyle = on ? '#bff5cc' : 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.roundRect(cx, y, chipW, chipH, 9); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(cx + 16, y + chipH / 2, 12, 0, Math.PI * 2); ctx.fill();
      drawInvSwatch(c.it.id, c.it.sw, cx + 16, y + chipH / 2);
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left';
      let fs = 11; ctx.font = `bold ${fs}px Arial`; const nm = c.figure ? c.it.name : tx(c.it.name);   // the names Kai / Bali are never swapped
      while (ctx.measureText(nm).width > chipW - 40 && fs > 8) { fs--; ctx.font = `bold ${fs}px Arial`; }
      ctx.fillText(nm, cx + 32, y + (c.weapon ? 11 : chipH / 2));
      if (c.weapon) { ctx.font = '9px Arial'; ctx.fillStyle = on ? '#eafff0' : 'rgba(255,255,255,0.6)'; ctx.fillText(here ? tx(c.it.where) : tx(c.it.world === 'hoehe' ? 'nur auf der Felsenhöhe' : 'nur in den Lavahöhlen'), cx + 32, y + 22); }
      if (on) { ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'right'; ctx.fillText('✓', cx + chipW - 8, y + chipH / 2 + 1); }
      ctx.globalAlpha = 1;
    });
    y += chipH + gap;
  }
  ctx.restore();
}
// a click in screen coordinates; returns true when the inventory used it
function invClick(hp) {
  const inR = (p, b) => b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  if (inR(hp, INV.btn)) { INV.open = !INV.open; Audio.play('tink'); return true; }
  if (!INV.open) return false;
  for (const c of INV.chips) if (inR(hp, c.rect)) {
    if (c.weapon) { if (CUR.key !== c.it.world) { Audio.play('denied'); return true; } c.it.pick(); } else if (c.figure) setCharacter(c.it.id); else c.it.apply(SAVE.outfit);
    writeSave(); Audio.play('flip'); return true;
  }
  if (!inR(hp, INV.panel)) INV.open = false;
  return true;
}
// ======================================================================
// PAUSE button (top right, next to music/sound) – also the P key
// ======================================================================
const PAUSE = { on: false, btn: { x: W - 346, y: 10, w: 86, h: 30 } };
function setPause(on) { PAUSE.on = on; INV.open = false; Audio.pauseBg(on); Audio.play('tink'); }
function drawPauseButton() {
  const b = PAUSE.btn, label = PAUSE.on ? tx('WEITER') : tx('PAUSE');
  ctx.save(); ctx.font = 'bold 13px Arial';
  b.w = 46 + ctx.measureText(label).width; b.x = W - 262 - b.w;          // right edge stays next to the music button
  ctx.fillStyle = PAUSE.on ? '#34c759' : 'rgba(10,20,40,0.6)'; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 9); ctx.fill();
  ctx.fillStyle = '#ffffff';
  if (PAUSE.on) { ctx.beginPath(); ctx.moveTo(b.x + 14, b.y + 8); ctx.lineTo(b.x + 27, b.y + 15); ctx.lineTo(b.x + 14, b.y + 22); ctx.closePath(); ctx.fill(); }
  else { ctx.fillRect(b.x + 13, b.y + 8, 4.5, 14); ctx.fillRect(b.x + 21, b.y + 8, 4.5, 14); }
  ctx.font = 'bold 13px Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(label, b.x + 34, b.y + 16);
  ctx.restore();
}
function drawPauseOverlay() {
  if (!PAUSE.on) return;
  ctx.save(); ctx.fillStyle = 'rgba(8,16,32,0.55)'; ctx.fillRect(0, 0, W, VH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 6;
  ctx.font = 'bold 54px Arial'; ctx.strokeText(tx('PAUSE'), W / 2, VH / 2 - 14); ctx.fillText(tx('PAUSE'), W / 2, VH / 2 - 14);
  ctx.font = 'bold 16px Arial'; ctx.fillStyle = '#bfe6ff'; ctx.fillText(tx('Tippe auf WEITER oder drücke P'), W / 2, VH / 2 + 30);
  ctx.restore();
  drawPauseButton();
}
// click in screen coordinates; returns true when used (while paused every click is used)
function pauseClick(hp) {
  const b = PAUSE.btn;
  if (hp.x >= b.x && hp.x <= b.x + b.w && hp.y >= b.y && hp.y <= b.y + b.h) { setPause(!PAUSE.on); return true; }
  return PAUSE.on;
}
function goToWorld(file, query = '') { writeSave(); beginTransition(file, query); }   // one page: the camera moves between the worlds
const QUERY = new URLSearchParams(location.search);

// ---------------- languages ----------------
// German text is the key; English and Spanish translations below. {n} = placeholder.
const LANGS = ['de', 'en', 'es'];
const TR = {
  // ---------- LEVEL 3 · LAVAHÖHLEN ----------
  'DIE LAVAHÖHLEN': ['THE LAVA CAVES', 'LAS CUEVAS DE LAVA'], 'LAVAHÖHLEN': ['LAVA CAVES', 'CUEVAS DE LAVA'], 'VULKAN': ['VOLCANO', 'VOLCÁN'],
  'Wasserbomben': ['Water bombs', 'Bombas de agua'], 'nur in den Lavahöhlen': ['only in the lava caves', 'solo en las cuevas de lava'], 'WURF': ['THROW', 'LANZAR'],
  'Du hast WASSERBOMBEN! Wurf-Taste rechts unten.': ['You got WATER BOMBS! Throw button at the bottom right.', '¡Tienes BOMBAS DE AGUA! Botón de lanzar abajo a la derecha.'],
  'Du hast WASSERBOMBEN! Werfen: X oder rechte Maustaste.': ['You got WATER BOMBS! Throw: X or right mouse button.', '¡Tienes BOMBAS DE AGUA! Lanzar: X o botón derecho del ratón.'],
  'Neu: WASSERBOMBEN – Wurf-Taste rechts unten': ['New: WATER BOMBS – throw button at the bottom right', 'Nuevo: BOMBAS DE AGUA – botón de lanzar abajo a la derecha'],
  'Neu: WASSERBOMBEN – X oder rechte Maustaste': ['New: WATER BOMBS – X or right mouse button', 'Nuevo: BOMBAS DE AGUA – X o botón derecho del ratón'],
  'Das Magma-Board fährt kurz über Lava – aber nicht zu lange, sonst wird es zu heiß!': ['The Magma Board can ride over lava for a moment – not too long, or it gets too hot!', 'La Tabla de Magma rueda un momento sobre la lava – ¡no mucho, o se calienta demasiado!'],
  'Eine Wasserbombe auf Lava macht für kurze Zeit einen Stein-Weg.': ['A water bomb on lava makes a stone path for a short time.', 'Una bomba de agua en la lava hace un camino de piedra por un rato.'],
  'In der Mitte: der MAGMA-ANKYLOSAURUS. Am Ende: der RIESENVULKAN.': ['In the middle: the MAGMA ANKYLOSAURUS. At the end: the GIANT VOLCANO.', 'En medio: el ANQUILOSAURIO DE MAGMA. Al final: el VOLCÁN GIGANTE.'],
  'Zu heiß! Nicht so lange auf der Lava fahren.': ['Too hot! Don\'t ride on the lava so long.', '¡Demasiado caliente! No ruedes tanto sobre la lava.'],
  'Weiter nach links = zurück ins Tal': ['Keep riding left = back to the valley', 'Sigue a la izquierda = volver al valle'],
  'Durch die Röhre kommst du wieder hinauf ins Tal.': ['Through the pipe you get back up into the valley.', 'Por el tubo vuelves a subir al valle.'], 'JA, HINAUF': ['YES, UP', 'SÍ, SUBIR'],
  'LORE-FAHRT': ['MINE CART RIDE', 'VIAJE EN VAGONETA'],
  'Rase 25 Sekunden mit der Lore durch die Mine!': ['Race through the mine in the cart for 25 seconds!', '¡Corre 25 segundos en la vagoneta por la mina!'],
  'Tippen / Leertaste = springen: über Löcher und Steine, aber nicht in die Fledermäuse.': ['Tap / Space = jump: over holes and rocks, but not into the bats.', 'Toca / Espacio = saltar: sobre hoyos y piedras, pero no contra los murciélagos.'],
  'Tippen = mit der Lore springen!': ['Tap = jump with the cart!', '¡Toca = saltar con la vagoneta!'], 'Leertaste / Klick = mit der Lore springen!': ['Space / click = jump with the cart!', '¡Espacio / clic = saltar con la vagoneta!'],
  'Unfälle: {n} / 3': ['Crashes: {n} / 3', 'Choques: {n} / 3'], 'Super gefahren!': ['Great ride!', '¡Gran viaje!'], 'Zu viele Unfälle! Versuch es nochmal.': ['Too many crashes! Try again.', '¡Demasiados choques! Inténtalo otra vez.'],
  'MAGMA-ANKYLOSAURUS': ['MAGMA ANKYLOSAURUS', 'ANQUILOSAURIO DE MAGMA'], 'RIESENVULKAN': ['GIANT VOLCANO', 'VOLCÁN GIGANTE'],
  'Der MAGMA-ANKYLOSAURUS! Kühl ihn mit Wasserbomben ab und spring auf ihn drauf!': ['The MAGMA ANKYLOSAURUS! Cool him with water bombs and jump on him!', '¡El ANQUILOSAURIO DE MAGMA! ¡Enfríalo con bombas de agua y salta encima!'],
  'Er glüht wieder!': ['He is glowing again!', '¡Vuelve a brillar!'], 'Abgekühlt! JETZT draufspringen!': ['Cooled down! Jump on him NOW!', '¡Enfriado! ¡Salta encima AHORA!'],
  'MAGMA-ANKYLOSAURUS BESIEGT!': ['MAGMA ANKYLOSAURUS DEFEATED!', '¡ANQUILOSAURIO DE MAGMA VENCIDO!'],
  'Der Weg ist frei! +{n} Punkte': ['The way is free! +{n} points', '¡El camino está libre! +{n} puntos'], 'Der Weg ist frei!': ['The way is free!', '¡El camino está libre!'],
  'Der RIESENVULKAN! Wirf eine Wasserbombe in den glühenden Krater!': ['The GIANT VOLCANO! Throw a water bomb into the glowing crater!', '¡El VOLCÁN GIGANTE! ¡Lanza una bomba de agua al cráter brillante!'],
  'VOLLTREFFER!': ['BULLSEYE!', '¡EN EL BLANCO!'], 'DER RIESENVULKAN IST AUS!': ['THE GIANT VOLCANO IS OUT!', '¡EL VOLCÁN GIGANTE SE APAGÓ!'],
  'Die Lavahöhlen sind geschafft! +30 Münzen': ['The lava caves are done! +30 coins', '¡Cuevas de lava superadas! +30 monedas'],
  'Alle drei Bosse besiegt – Level 3 ist geschafft!': ['All three bosses beaten – Level 3 is done!', '¡Los tres jefes vencidos – Nivel 3 superado!'], 'Noch offen:': ['Still to do:', 'Aún falta:'],
  '100 % – POKAL! Alles geschafft!': ['100 % – TROPHY! Everything done!', '100 % – ¡TROFEO! ¡Todo superado!'],
  'Du brauchst das Magma-Board aus dem OXXO auf der Felsenhöhe!': ['You need the Magma Board from the OXXO on the Rocky Heights!', '¡Necesitas la Tabla de Magma del OXXO en las Alturas Rocosas!'],
  'HINUNTER IN DIE LAVAHÖHLEN?': ['DOWN INTO THE LAVA CAVES?', '¿BAJAR A LAS CUEVAS DE LAVA?'],
  'Mit dem Magma-Board durch die Röhre nach unten.': ['Down through the pipe with the Magma Board.', 'Baja por el tubo con la Tabla de Magma.'],
  'Unten warten Lava, Feuer-Salamander, der Magma-Ankylosaurus und der Riesenvulkan.': ['Down there: lava, fire salamanders, the Magma Ankylosaurus and the Giant Volcano.', 'Abajo esperan lava, salamandras de fuego, el Anquilosaurio de Magma y el Volcán Gigante.'],
  // ---------- LEVEL 3 · FELSENHÖHE ----------
  'PUNKTE': ['POINTS', 'PUNTOS'], 'Punkte': ['points', 'puntos'], 'NOCHMAL': ['AGAIN', 'OTRA VEZ'], 'NEUER REKORD!': ['NEW RECORD!', '¡NUEVO RÉCORD!'],
  'Punkte: {p}   ·   Rekord: {r}': ['Points: {p}   ·   Record: {r}', 'Puntos: {p}   ·   Récord: {r}'],
  'Boss besiegt: +{b}   ·   Zeitbonus ({t}): +{z}': ['Boss beaten: +{b}   ·   Time bonus ({t}): +{z}', 'Jefe vencido: +{b}   ·   Bono de tiempo ({t}): +{z}'],
  'Schon einmal besiegt – diesmal gibt es keine Punkte, nur den Spaß.': ['Beaten before – no points this time, just the fun.', 'Ya lo venciste antes – esta vez no hay puntos, solo la diversión.'],
  'TREFFER!': ['HIT!', '¡GOLPE!'],
  'Die FLUGSAURIER-MAMA! Triff sie mit der Schleuder!': ['The PTEROSAUR MOM! Hit her with the slingshot!', '¡La MAMÁ PTEROSAURIO! ¡Dale con la resortera!'],
  'Sie ist gelandet – jetzt zählt jeder Treffer doppelt!': ['She landed – every hit counts double now!', '¡Aterrizó – ahora cada golpe cuenta doble!'],
  'Halte ▶ gedrückt – los geht\'s!': ['Hold ▶ – let\'s go!', '¡Mantén ▶ – vamos!'],
  'Halte den Pfeil nach rechts – los geht\'s!': ['Hold the right arrow – let\'s go!', '¡Mantén la flecha derecha – vamos!'],
  '◀ ▶ links gedrückt halten = fahren · loslassen = stehen bleiben': ['Hold ◀ ▶ on the left = ride · let go = stop', 'Mantén ◀ ▶ a la izquierda = rodar · suelta = parar'],
  'Pfeil ← / → gedrückt halten = fahren · loslassen = stehen bleiben': ['Hold arrow ← / → = ride · let go = stop', 'Mantén flecha ← / → = rodar · suelta = parar'],
  'SPRUNG rechts = springen – lange halten = höher': ['JUMP on the right = jump – hold = higher', 'SALTO a la derecha = saltar – mantén = más alto'],
  '◀ ▶ links gedrückt halten = fahren · SPRUNG rechts = springen': ['Hold ◀ ▶ on the left = ride · JUMP on the right = jump', 'Mantén ◀ ▶ a la izquierda = rodar · SALTO a la derecha = saltar'],
  'Pfeil ← / → halten = fahren · Leertaste / Klick = springen': ['Hold arrow ← / → = ride · Space / click = jump', 'Mantén flecha ← / → = rodar · Espacio / clic = saltar'],
  'ZURÜCK INS DINO-TAL?': ['BACK TO DINO VALLEY?', '¿VOLVER AL VALLE DINO?'],
  'An der Liane kannst du hinunter ins Tal klettern.': ['You can climb down the liana into the valley.', 'Puedes bajar por la liana al valle.'],
  'Später kommst du an der Liane im Tal wieder herauf.': ['Later you can climb back up the liana in the valley.', 'Luego puedes volver a subir por la liana del valle.'],
  'JA, HINUNTER': ['YES, CLIMB DOWN', 'SÍ, BAJAR'], 'NEIN, HIERBLEIBEN': ['NO, STAY HERE', 'NO, QUEDARME'],
  'Weiter nach links = hinunterklettern': ['Keep riding left = climb down', 'Sigue a la izquierda = bajar'],
  'DIE FELSENHÖHE': ['THE ROCKY HEIGHTS', 'LAS ALTURAS ROCOSAS'], 'FELSENHÖHE': ['ROCKY HEIGHTS', 'ALTURAS ROCOSAS'], 'Felsenhöhe': ['Rocky Heights', 'Alturas Rocosas'],
  'DINO-TAL': ['DINO VALLEY', 'VALLE DINO'], 'Lavahöhlen': ['Lava Caves', 'Cuevas de Lava'],
  'Abgestürzt!': ['You fell!', '¡Te caíste!'],
  'Du hast eine STEINSCHLEUDER! Schuss-Taste rechts unten.': ['You got a SLINGSHOT! Shoot button at the bottom right.', '¡Tienes una RESORTERA! Botón de disparo abajo a la derecha.'],
  'Du hast eine STEINSCHLEUDER! Schießen: X oder rechte Maustaste.': ['You got a SLINGSHOT! Shoot: X or right mouse button.', '¡Tienes una RESORTERA! Disparar: X o botón derecho del ratón.'],
  'Wischen = fahren / bremsen · Sprung-Taste = springen': ['Swipe = ride / brake · Jump button = jump', 'Desliza = rodar / frenar · Botón de salto = saltar'],
  'Pfeile = fahren / bremsen · Leertaste / Klick = springen': ['Arrows = ride / brake · Space / click = jump', 'Flechas = rodar / frenar · Espacio / clic = saltar'],
  'Neu: die STEINSCHLEUDER – Schuss-Taste rechts unten': ['New: the SLINGSHOT – shoot button at the bottom right', 'Nuevo: la RESORTERA – botón de disparo abajo a la derecha'],
  'Neu: die STEINSCHLEUDER – X oder rechte Maustaste': ['New: the SLINGSHOT – X or right mouse button', 'Nuevo: la RESORTERA – X o botón derecho del ratón'],
  'Bröckelnde Felsen fallen weg! Achte auf Steinschlag und Flugsaurier.': ['Crumbling rocks fall away! Watch out for falling stones and pterosaurs.', '¡Las rocas que se desmoronan se caen! Cuidado con las piedras y los pterosaurios.'],
  'Im OXXO im Baumhaus gibt es das Magma-Board für die Lavahöhlen.': ['The OXXO in the tree house sells the Magma Board for the lava caves.', 'En el OXXO de la casa del árbol está la Tabla de Magma para las cuevas de lava.'],
  'Am Ende wartet die FLUGSAURIER-MAMA.': ['At the end the PTEROSAUR MOM is waiting.', 'Al final te espera la MAMÁ PTEROSAURIO.'],
  'OXXO IM BAUMHAUS': ['OXXO IN THE TREE HOUSE', 'OXXO EN LA CASA DEL ÁRBOL'], 'BAUMHAUS': ['TREE HOUSE', 'CASA DEL ÁRBOL'],
  'Das OXXO im Baumhaus! Willst du reingehen?': ['The OXXO in the tree house! Want to go in?', '¡El OXXO en la casa del árbol! ¿Quieres entrar?'],
  'Hier gibt es das Magma-Board, die Super-Schleuder, Herzen und Kleider.': ['Here you get the Magma Board, the Super Slingshot, hearts and clothes.', 'Aquí hay Tabla de Magma, Súper Resortera, corazones y ropa.'],
  'JA, REINGEHEN!': ['YES, GO IN!', '¡SÍ, ENTRAR!'], 'FERTIG': ['DONE', 'LISTO'], 'Gekauft ✓': ['Bought ✓', 'Comprado ✓'],
  'Magma-Board': ['Magma Board', 'Tabla de Magma'], 'Pflicht für die Lavahöhlen!': ['A must for the lava caves!', '¡Obligatoria para las cuevas de lava!'],
  'Super-Schleuder': ['Super Slingshot', 'Súper Resortera'], 'Schießt doppelt und schneller': ['Shoots double and faster', 'Dispara doble y más rápido'],
  'Steinschleuder': ['Slingshot', 'Resortera'], 'nur auf der Felsenhöhe': ['only on the Rocky Heights', 'solo en las Alturas Rocosas'], 'für die Lavahöhlen': ['for the lava caves', 'para las cuevas de lava'],
  'Ohne Magma-Board kommst du nicht in die Lavahöhlen!': ['Without the Magma Board you can\'t get into the lava caves!', '¡Sin la Tabla de Magma no entras a las cuevas de lava!'],
  'FLUGSAURIER-RITT': ['PTEROSAUR RIDE', 'VUELO EN PTEROSAURIO'],
  'Flieg 25 Sekunden auf einem Flugsaurier durch die Felsen!': ['Fly through the rocks on a pterosaur for 25 seconds!', '¡Vuela 25 segundos en un pterosaurio entre las rocas!'],
  'Tippen / Leertaste = mit den Flügeln schlagen. 3 Zusammenstöße und du fällst runter.': ['Tap / Space = flap the wings. Bump 3 times and you fall off.', 'Toca / Espacio = aletear. 3 choques y te caes.'],
  'Tippen = mit den Flügeln schlagen!': ['Tap = flap the wings!', '¡Toca = aletear!'], 'Leertaste / Klick = mit den Flügeln schlagen!': ['Space / click = flap the wings!', '¡Espacio / clic = aletear!'],
  'Zusammenstöße: {n} / 3': ['Bumps: {n} / 3', 'Choques: {n} / 3'], 'Super geflogen!': ['Great flying!', '¡Gran vuelo!'],
  'STEINSCHLAG': ['FALLING ROCKS', 'CAÍDA DE PIEDRAS'],
  'Nach unten wischen = hinunterklettern': ['Swipe down = climb down', 'Desliza hacia abajo = bajar'], 'Pfeil ↓ = hinunterklettern': ['Arrow ↓ = climb down', 'Flecha ↓ = bajar'],
  'MAMA': ['MOM', 'MAMÁ'], 'FLUGSAURIER-MAMA': ['PTEROSAUR MOM', 'MAMÁ PTEROSAURIO'], 'FLUGSAURIER-MAMA BESIEGT!': ['PTEROSAUR MOM DEFEATED!', '¡MAMÁ PTEROSAURIO VENCIDA!'],
  'Die FLUGSAURIER-MAMA! Triff sie mit der Schleuder, wenn sie landet!': ['The PTEROSAUR MOM! Hit her with the slingshot when she lands!', '¡La MAMÁ PTEROSAURIO! ¡Dale con la resortera cuando aterrice!'],
  'Sie ist gelandet – JETZT schießen!': ['She landed – SHOOT now!', '¡Aterrizó – DISPARA ahora!'],
  'In der Luft prallt der Stein ab – warte, bis sie landet!': ['In the air the stone bounces off – wait until she lands!', 'En el aire la piedra rebota – ¡espera a que aterrice!'],
  'Die Felsenhöhe ist geschafft! +30 Münzen': ['The Rocky Heights are done! +30 coins', '¡Alturas Rocosas superadas! +30 monedas'],
  'Mit dem Magma-Board geht es durch die Röhre im Tal in die Lavahöhlen.': ['With the Magma Board you go through the pipe in the valley into the lava caves.', 'Con la Tabla de Magma bajas por el tubo del valle a las cuevas de lava.'],
  'Hol dir noch das Magma-Board im OXXO – ohne kommst du nicht in die Lavahöhlen.': ['Still get the Magma Board at the OXXO – without it you can\'t enter the lava caves.', 'Consigue la Tabla de Magma en el OXXO – sin ella no entras a las cuevas de lava.'],
  'ZURÜCK INS TAL': ['BACK TO THE VALLEY', 'VOLVER AL VALLE'], 'ZUR FELSENHÖHE': ['TO THE ROCKY HEIGHTS', 'A LAS ALTURAS ROCOSAS'],
  'HINAUF ZUR FELSENHÖHE?': ['UP TO THE ROCKY HEIGHTS?', '¿SUBIR A LAS ALTURAS ROCOSAS?'],
  'Kai hält sich an der Liane fest.': ['Kai is holding on to the liana.', 'Kai se agarra de la liana.'],
  'Oben warten Flugsaurier, bröckelnde Felsen, das OXXO im Baumhaus und die Flugsaurier-Mama.': ['Up there: pterosaurs, crumbling rocks, the OXXO in the tree house and the Pterosaur Mom.', 'Arriba esperan pterosaurios, rocas que se desmoronan, el OXXO del árbol y la Mamá Pterosaurio.'],
  'JA, HOCHKLETTERN!': ['YES, CLIMB UP!', '¡SÍ, SUBIR!'], 'NEIN, LOSLASSEN': ['NO, LET GO', 'NO, SOLTAR'],
  'Die Lavahöhlen kommen bald – dafür brauchst du das Magma-Board.': ['The lava caves are coming soon – you need the Magma Board for them.', 'Las cuevas de lava llegan pronto – necesitas la Tabla de Magma.'],
  'Weiter geht es an den Lianen hinauf zur Felsenhöhe!': ['Next: climb the lianas up to the Rocky Heights!', '¡Sigue: sube por las lianas a las Alturas Rocosas!'],
  'Zurück im Dino-Tal!': ['Back in Dino Valley!', '¡De vuelta en el Valle Dino!'],
  // ---------- LEVEL 3 · DINOLAND ----------
  'INVERT – LEVEL 3': ['INVERT – LEVEL 3', 'INVERT – NIVEL 3'], 'DINOLAND': ['DINOLAND', 'DINOLANDIA'],
  'T-Rex im Dino-Tal besiegen': ['Beat the T-Rex in Dino Valley', 'Vence al T-Rex en el Valle Dino'],
  'Flugsaurier-Mama auf der Felsenhöhe besiegen': ['Beat Mama Pterosaur on Rock Heights', 'Vence a Mamá Pterosaurio en las Alturas'],
  'Riesenvulkan in den Lavahöhlen besiegen': ['Beat the giant volcano in the Lava Caves', 'Vence al volcán gigante en las Cuevas de Lava'],
  'DAS DINO-TAL': ['DINO VALLEY', 'EL VALLE DINO'], 'ZUM MENÜ': ['MAIN MENU', 'AL MENÚ'],
  'Wisch nach rechts oder links = losrollen · Wisch nach unten = bremsen': ['Swipe right or left = roll · Swipe down = brake', 'Desliza a la derecha o izquierda = rodar · Desliza abajo = frenar'],
  'Pfeil → / ← = losrollen · Pfeil ↓ = bremsen': ['Arrow → / ← = roll · Arrow ↓ = brake', 'Flecha → / ← = rodar · Flecha ↓ = frenar'],
  'Sprung-Taste (oder nach oben wischen) = springen – lange halten = höher': ['Jump button (or swipe up) = jump – hold longer = higher', 'Botón de salto (o desliza arriba) = saltar – mantén = más alto'],
  'Leertaste / Klick = springen – lange halten = höher': ['Space / click = jump – hold longer = higher', 'Espacio / clic = saltar – mantén = más alto'],
  'Dinos nicht berühren! Feuerbälle: auf den Schatten achten. Teer meiden!': ["Don't touch the dinos! Fireballs: watch the shadow. Avoid the tar!", '¡No toques a los dinos! Bolas de fuego: mira la sombra. ¡Evita el alquitrán!'],
  'Am Ende wartet der T-REX.': ['The T-REX is waiting at the end.', 'Al final te espera el T-REX.'],
  "LOS GEHT'S": ["LET'S GO", '¡VAMOS!'],
  "Wisch nach rechts – los geht's!": ["Swipe right – let's go!", '¡Desliza a la derecha – vamos!'],
  "Pfeil nach rechts – los geht's!": ["Arrow right – let's go!", '¡Flecha derecha – vamos!'],
  'CHECKPOINT!': ['CHECKPOINT!', '¡PUNTO DE CONTROL!'],
  "Ein Leben weniger! Weiter geht's.": ['One life less! Keep going.', '¡Una vida menos! Sigue adelante.'],
  'Igitt, Teer!': ['Yuck, tar!', '¡Puaj, alquitrán!'], '+1 HERZ': ['+1 HEART', '+1 CORAZÓN'],
  'Du startest beim letzten Checkpoint.': ['You start at the last checkpoint.', 'Empiezas en el último punto de control.'],
  'DER T-REX! Spring ihm auf den Kopf, wenn er benommen ist!': ['THE T-REX! Jump on his head when he is dizzy!', '¡EL T-REX! ¡Salta sobre su cabeza cuando esté mareado!'],
  'Er ist benommen – JETZT auf den Kopf springen!': ["He's dizzy – jump on his head NOW!", '¡Está mareado – salta AHORA sobre su cabeza!'],
  'T-REX BESIEGT!': ['T-REX DEFEATED!', '¡T-REX VENCIDO!'],
  'Das Dino-Tal ist geschafft! +30 Münzen': ['Dino Valley done! +30 coins', '¡Valle Dino superado! +30 monedas'],
  'Bald geht es weiter: an den Lianen hinauf zur Felsenhöhe': ['Coming soon: up the vines to Rock Heights', 'Muy pronto: sube por las lianas a las Alturas'],
  'und durch die Röhre hinunter in die Lavahöhlen.': ['and down the pipe into the Lava Caves.', 'y baja por el tubo a las Cuevas de Lava.'],
  'DINO-RODEO': ['DINO RODEO', 'RODEO DINO'], 'FOSSILIEN': ['FOSSILS', 'FÓSILES'], 'FOSSILIEN AUSGRABEN': ['DIG UP FOSSILS', 'EXCAVA FÓSILES'],
  'Kannst du dich 15 Sekunden auf dem wilden Triceratops halten?': ['Can you stay on the wild triceratops for 15 seconds?', '¿Aguantas 15 segundos sobre el triceratops salvaje?'],
  'Belohnung: 20 Münzen und ein Pokal-Stern.': ['Reward: 20 coins and a trophy star.', 'Premio: 20 monedas y una estrella de trofeo.'],
  'Finde alle 6 Knochen eines Dino-Skeletts im Sand.': ['Find all 6 bones of a dino skeleton in the sand.', 'Encuentra los 6 huesos de un esqueleto de dino en la arena.'],
  'Ein leeres Loch zeigt, wie viele Knochen direkt daneben liegen.': ['An empty hole shows how many bones lie right next to it.', 'Un hoyo vacío muestra cuántos huesos hay justo al lado.'],
  'JA, SPIELEN!': ['YES, PLAY!', '¡SÍ, JUGAR!'], 'NEIN, WEITER': ['NO, MOVE ON', 'NO, SEGUIR'],
  'Links / rechts antippen und halten = lehnen!': ['Tap and hold left / right = lean!', '¡Toca y mantén izquierda / derecha = inclinarte!'],
  'Pfeil links / rechts = lehnen!': ['Arrow left / right = lean!', '¡Flecha izquierda / derecha = inclinarte!'],
  'Noch {s} s': ['{s} s left', 'Quedan {s} s'],
  'YEEHAW! Du hast es geschafft!': ['YEEHAW! You made it!', '¡YIIJAA! ¡Lo lograste!'],
  'Abgeworfen! Versuch es beim nächsten Mal.': ['Thrown off! Try again next time.', '¡Te tiró! Inténtalo la próxima vez.'],
  '+20 Münzen · Pokal-Stern!': ['+20 coins · trophy star!', '+20 monedas · ¡estrella de trofeo!'],
  'Knochen: {f} / 6   ·   Grabungen übrig: {d}': ['Bones: {f} / 6   ·   Digs left: {d}', 'Huesos: {f} / 6   ·   Excavaciones: {d}'],
  'Ein ganzes Dino-Skelett! Super gegraben!': ['A whole dino skeleton! Great digging!', '¡Un esqueleto de dino entero! ¡Gran excavación!'],
  'Keine Grabungen mehr. Versuch es nochmal!': ['No digs left. Try again!', 'No quedan excavaciones. ¡Inténtalo de nuevo!'],
  // ---------- general ----------
  'JA': ['YES', 'SÍ'], 'NEIN': ['NO', 'NO'],
  // ---------- on-screen buttons · exit · main menu ----------
  'NEIN – ZUM MENÜ': ['NO – MAIN MENU', 'NO – AL MENÚ'],
  'FIGUR': ['CHARACTER', 'PERSONAJE'], 'Wer fährt?': ['Who rides?', '¿Quién patina?'], 'Hose': ['Pants', 'Pantalón'],
  'Ohne Mütze': ['No cap', 'Sin gorra'], 'Schildkappe': ['Cap', 'Gorra'], 'Rosa T-Shirt': ['Pink T-shirt', 'Camiseta rosa'],
  'Jeans': ['Jeans', 'Jeans'], 'Kurze Hose': ['Shorts', 'Shorts'], 'Rock': ['Skirt', 'Falda'], 'Weisse Schuhe': ['White shoes', 'Tenis blancos'],
  'Rock bis zu den Knien': ['Knee-length skirt', 'Falda hasta las rodillas'], 'Jeans-Shorts für den Sommer': ['Denim shorts for summer', 'Shorts de mezclilla'],
  'Kappe für Bali': ['Cap for Bali', 'Gorra para Bali'],
  'SEGEL-BOING! +20': ['SAIL BOING! +20', '¡BOING EN LA VELA! +20'], '{n}× SEGEL-BOING! +20': ['{n}× SAIL BOING! +20', '¡{n}× BOING EN LA VELA! +20'],
  'Ahoi, Kapitän Kai!': ['Ahoy, Captain Kai!', '¡Ahoy, capitán Kai!'],
  'HAFEN-SPRUNG! +10': ['HARBOR JUMP! +10', '¡SALTO DEL MUELLE! +10'], 'Ab in die Tiefsee!': ['Into the deep sea!', '¡Al mar profundo!'],
  'Alle Bosse besiegt!': ['All bosses beaten!', '¡Todos los jefes vencidos!'],
  'Alle Bosse besiegt! Ab zum Hafen – spring ins Wasser!': ['All bosses beaten! On to the harbor – jump into the water!', '¡Todos los jefes vencidos! Al puerto – ¡salta al agua!'],
  'Alle 3 Leben sind weg. Nochmal versuchen?': ['All 3 lives are gone. Try again?', 'Se acabaron las 3 vidas. ¿Intentar de nuevo?'],
  'SPRUNG': ['JUMP', 'SALTO'], 'SCHUSS': ['SHOOT', 'DISPARO'], 'SCHLAG': ['HIT', 'GOLPE'],
  'MENÜ': ['MENU', 'MENÚ'], 'SPIELEN': ['PLAY', 'JUGAR'],
  'Zurück zur Invert-App': ['Back to the Invert app', 'Volver a la app Invert'],
  'Rechtsklick / X = schießen': ['Right-click / X = shoot', 'Clic derecho / X = disparar'],
  '¡Dale! Linke Taste = springen · rechte Taste = schlagen': ['¡Dale! Left button = jump · right button = hit', '¡Dale! Botón izquierdo = saltar · botón derecho = pegar'],
  '¡Dale! Klick = springen · Rechtsklick / X = schlagen': ['¡Dale! Click = jump · right-click / X = hit', '¡Dale! Clic = saltar · clic derecho / X = pegar'],
  'Linke Taste = springen  ·  rechte Taste = schlagen': ['Left button = jump  ·  right button = hit', 'Botón izquierdo = saltar  ·  botón derecho = pegar'],
  'Klick / Leertaste = springen  ·  Rechtsklick / X = schlagen': ['Click / Space = jump  ·  right-click / X = hit', 'Clic / Espacio = saltar  ·  clic derecho / X = pegar'],
  'Lichtpfeile: Schuss-Taste rechts (am PC Rechtsklick oder X). Schieß die Teufelchen ab!': ['Light arrows: shoot button on the right (on a computer right-click or X). Shoot the little devils!', 'Flechas de luz: botón de disparo a la derecha (en el PC clic derecho o X). ¡Dispara a los diablitos!'],
  'Sprung-Taste links: tippen / halten = mit den Flügeln schlagen → Kai steigt. Loslassen = Kai gleitet nach unten.': ['Jump button on the left: tap / hold = flap the wings → Kai rises. Let go = Kai glides down.', 'Botón de salto a la izquierda: toca / mantén = aletear → Kai sube. Suelta = Kai planea hacia abajo.'],
  'Schießen mit der Harpune: Schuss-Taste rechts, am PC Rechtsklick oder X (im Turbo und beim Kalmar).': ['Shoot the harpoon: shoot button on the right, on a computer right-click or X (in turbo and against the squid).', 'Dispara el arpón: botón de disparo a la derecha, en el PC clic derecho o X (en turbo y contra el calamar).'],
  'NOCHMAL VERSUCHEN': ['TRY AGAIN', 'INTENTAR DE NUEVO'], 'NOCHMAL SPIELEN': ['PLAY AGAIN', 'JUGAR DE NUEVO'],
  'GESCHAFFT!': ['YOU DID IT!', '¡LO LOGRASTE!'], 'WEITER': ['CONTINUE', 'CONTINUAR'],
  'KEINE HERZEN MEHR!': ['NO HEARTS LEFT!', '¡SIN CORAZONES!'], 'KEINE LUFT MEHR!': ['OUT OF AIR!', '¡SIN AIRE!'],
  'Sprache': ['Language', 'Idioma'], 'Überspringen': ['Skip', 'Saltar'],
  'Strecke: {p}%   ·   Münzen: {c}': ['Distance: {p}%   ·   Coins: {c}', 'Recorrido: {p}%   ·   Monedas: {c}'],
  'Münzen: {c}   ·   Herzen: {h}': ['Coins: {c}   ·   Hearts: {h}', 'Monedas: {c}   ·   Corazones: {h}'],
  'Welten': ['Worlds', 'Mundos'], 'Stadt': ['City', 'Ciudad'], 'Himmel': ['Sky', 'Cielo'], 'Tiefsee': ['Deep sea', 'Mar profundo'],
  'Harpune': ['Harpoon', 'Arpón'], 'Gegenstände': ['Items', 'Objetos'],
  'Du startest diese Welt neu.': ['You restart this world.', 'Reinicias este mundo.'],
  'LEBEN VERLOREN! Noch {n} Leben': ['LIFE LOST! {n} lives left', '¡VIDA PERDIDA! Quedan {n} vidas'],
  'LEBEN VERLOREN! Letztes Leben!': ['LIFE LOST! Last life!', '¡VIDA PERDIDA! ¡Última vida!'],
  'KEINE LEBEN MEHR!': ['NO LIVES LEFT!', '¡SIN VIDAS!'],
  'Alle 3 Leben sind weg – diese Welt startet neu.': ['All 3 lives are gone – this world starts again.', 'Se acabaron las 3 vidas – este mundo empieza de nuevo.'],
  'Runtergefallen! Zurück in der Stadt.': ['You fell down! Back in the city.', '¡Te caíste! De vuelta en la ciudad.'],
  'Weiter dort, wo du abgesprungen bist.': ['Carry on where you took off.', 'Sigue donde despegaste.'],
  'Engelsflügel-Rampe! Ab in den Himmel!': ['Angel wing ramp! Up into the sky!', '¡Rampa de alas de ángel! ¡Al cielo!'],
  'Zu tief! Nicht die Wolken berühren!': ['Too low! Don\'t touch the clouds!', '¡Muy bajo! ¡No toques las nubes!'],
  'Kai fällt durch die Wolken…': ['Kai falls through the clouds…', 'Kai cae entre las nubes…'],
  'Tippen = schießen. Der Pfeil zeigt, wohin.': ['Tap = shoot. The arrow shows where.', 'Toca = tirar. La flecha muestra a dónde.'],
  'Engelsrampe': ['Angel ramp', 'Rampa de ángel'],
  'Müllwagen in der Stadt besiegen': ['Beat the garbage truck in the city', 'Vence al camión de basura en la ciudad'],
  'Himmel bis zur Harfe schaffen': ['Finish the sky up to the harp', 'Termina el cielo hasta el arpa'],
  'Riesenkalmar in der Tiefsee besiegen': ['Beat the giant squid in the deep sea', 'Vence al calamar gigante en el mar profundo'],
  'Noch offen für Level 3:': ['Still to do for Level 3:', 'Falta para el nivel 3:'],
  'DER RIESENKALMAR IST BESIEGT!': ['THE GIANT SQUID IS BEATEN!', '¡EL CALAMAR GIGANTE ESTÁ VENCIDO!'],
  'WEITER': ['CONTINUE', 'SEGUIR'],
  'Weiter dort, wo du in die Tiefe gerutscht bist.': ['Carry on where you slid down.', 'Sigue donde bajaste por el tubo.'],
  'EIS! +1 Herz': ['ICE CREAM! +1 heart', '¡HELADO! +1 corazón'],
  'WEITERSPIELEN': ['CONTINUE', 'CONTINUAR'], 'Komplett neu anfangen': ['Start all over', 'Empezar de cero'],
  'Wirklich alles löschen?': ['Really delete everything?', '¿De verdad borrar todo?'],
  'Gekaufte Sachen, Münzen und geschaffte Welten sind dann weg.': ['Bought items, coins and finished worlds will be gone.', 'Se pierden los objetos comprados, las monedas y los mundos superados.'],
  'JA, LÖSCHEN': ['YES, DELETE', 'SÍ, BORRAR'], 'NEIN': ['NO', 'NO'],
  'Dein Spielstand ist gespeichert.': ['Your progress is saved.', 'Tu progreso está guardado.'],
  'INVERT – LEVEL 2': ['INVERT – LEVEL 2', 'INVERT – NIVEL 2'],
  'Finde alle Paare!   Paare: {p}/{n}   ·   Züge: {m}   ·   jedes Paar = +2 Seesterne': ['Find all pairs!   Pairs: {p}/{n}   ·   Moves: {m}   ·   each pair = +2 starfish', '¡Encuentra todas las parejas!   Parejas: {p}/{n}   ·   Jugadas: {m}   ·   cada pareja = +2 estrellas de mar'],
  'Wie viele Karten?': ['How many cards?', '¿Cuántas cartas?'], 'Standard': ['Standard', 'Normal'], '{n} Paare': ['{n} pairs', '{n} parejas'],
  'NOCHMAL SPIELEN': ['PLAY AGAIN', 'JUGAR OTRA VEZ'], 'Noch einmal?': ['Again?', '¿Otra vez?'],
  'Rundum-Harpunen': ['All-round harpoons', 'Arpones en todas direcciones'], 'TREFFER! + LUFT': ['HIT! + AIR', '¡IMPACTO! + AIRE'],
  'STADT NOCHMAL': ['CITY AGAIN', 'CIUDAD OTRA VEZ'], 'HIMMEL NOCHMAL': ['SKY AGAIN', 'CIELO OTRA VEZ'], 'TIEFSEE NOCHMAL': ['DEEP SEA AGAIN', 'MAR OTRA VEZ'],
  'Oder eine Welt nochmal spielen (du verlierst nichts):': ['Or play one world again (you keep everything):', 'O juega un mundo otra vez (no pierdes nada):'],
  'ZURÜCK': ['BACK', 'ATRÁS'], 'Goldene Kappe': ['Golden cap', 'Gorra dorada'],
  '100 %-POKAL! Alle Minispiele geschafft · +50 Münzen · Goldene Kappe': ['100 % TROPHY! All little games won · +50 coins · Golden cap', '¡TROFEO 100 %! Todos los minijuegos ganados · +50 monedas · Gorra dorada'],
  'Minispiele {n}/4 – alle 4 = 100 %-Pokal': ['Little games {n}/4 – all 4 = 100 % trophy', 'Minijuegos {n}/4 – los 4 = trofeo 100 %'], 'nur im Himmel': ['sky only', 'solo en el cielo'], 'nur in der Tiefsee': ['deep sea only', 'solo en el mar'],
  'PAUSE': ['PAUSE', 'PAUSA'], 'Tippe auf WEITER oder drücke P': ['Tap CONTINUE or press P', 'Toca SEGUIR o pulsa P'],
  'ITEMS': ['ITEMS', 'OBJETOS'], 'WAFFEN': ['WEAPONS', 'ARMAS'], 'OUTFIT': ['OUTFIT', 'ROPA'],
  'Kopf': ['Head', 'Cabeza'], 'T-Shirt': ['T-shirt', 'Camiseta'], 'Schuhe': ['Shoes', 'Zapatos'], 'Extras': ['Extras', 'Extras'],
  'Lichtpfeile': ['Light arrows', 'Flechas de luz'], 'Blaue Kappe': ['Blue cap', 'Gorra azul'], 'Blaues T-Shirt': ['Blue T-shirt', 'Camiseta azul'],
  'Schwarze Schuhe': ['Black shoes', 'Zapatos negros'], 'Heiligenschein': ['Halo', 'Aureola'],
  'Ab durchs Rohr in die Tiefsee!': ['Down the tube into the deep sea!', '¡Por el tubo al mar profundo!'],
  'Rohr!': ['Tube!', '¡Tubo!'],
  // ---------- city ----------
  'DIE STADT': ['THE CITY', 'LA CIUDAD'], 'LEVEL 2 · NORMALE WELT': ['LEVEL 2 · NORMAL WORLD', 'NIVEL 2 · MUNDO NORMAL'],
  'Tippen / Leertaste = Springen (Ollie). Länger halten = höher springen.': ['Tap / Space = jump (ollie). Hold longer = jump higher.', 'Toca / Espacio = saltar (ollie). Mantén = saltar más alto.'],
  'In der Luft nochmal tippen = Kickflip (+3 Münzen). Auf Bänken und Geländern landen = Grinden.': ['Tap again in the air = kickflip (+3 coins). Land on benches and rails = grind.', 'Toca otra vez en el aire = kickflip (+3 monedas). Cae en bancas y barandales = grind.'],
  'Auf einem Hydranten landen = Spin! Weiter tippen = mehr Drehungen (+3 Münzen je Drehung, 3 Drehungen = +1 Herz).': ['Land on a hydrant = spin! Keep tapping = more spins (+3 coins each, 3 spins = +1 heart).', '¡Cae en un hidrante = giro! Sigue tocando = más giros (+3 monedas cada uno, 3 giros = +1 corazón).'],
  'Jeder Zusammenstoß kostet ein Herz. Tacos schenken dir +2 Herzen.': ['Every crash costs a heart. Tacos give you +2 hearts.', 'Cada choque cuesta un corazón. Los tacos te dan +2 corazones.'],
  'Auf Rampen tippen = großer Sprung. Am Ende: Über die Rampe des Müllwagens aufs Dach springen – 3×!': ['Tap on ramps = big jump. At the end: jump over the garbage truck\'s ramp onto its roof – 3×!', 'Toca en las rampas = gran salto. Al final: ¡salta por la rampa del camión de basura a su techo – 3×!'],
  'Tippen oder Leertaste zum Losfahren': ['Tap or press Space to start', 'Toca o pulsa Espacio para empezar'],
  'Tipp: Tacos geben +2 Herzen!': ['Tip: tacos give +2 hearts!', 'Consejo: ¡los tacos dan +2 corazones!'],
  'Der Müllwagen ist erledigt!': ['The garbage truck is done for!', '¡El camión de basura está acabado!'],
  'STADT': ['CITY', 'CIUDAD'], 'MÜLLWAGEN': ['GARBAGE TRUCK', 'CAMIÓN'],
  'Pylone!': ['Cone!', '¡Cono!'], 'Hydrant!': ['Hydrant!', '¡Hidrante!'], 'Mülltonne!': ['Trash can!', '¡Bote de basura!'], 'Bank!': ['Bench!', '¡Banca!'],
  'Auto!': ['Car!', '¡Coche!'], 'Eiswagen!': ['Ice cream truck!', '¡Carrito de helados!'], 'Taco-Stand!': ['Taco stand!', '¡Puesto de tacos!'],
  'Wau! Der Hund!': ['Woof! The dog!', '¡Guau! ¡El perro!'], 'Autsch!': ['Ouch!', '¡Ay!'], 'Schlagloch!': ['Pothole!', '¡Bache!'],
  'Müllsack!': ['Trash bag!', '¡Bolsa de basura!'], 'Dosen!': ['Cans!', '¡Latas!'],
  'BUSTED! −3 Herzen': ['BUSTED! −3 hearts', '¡ATRAPADO! −3 corazones'],
  'KICKFLIP! +{n}': ['KICKFLIP! +{n}', '¡KICKFLIP! +{n}'], '{k}× KICKFLIP! +{n}': ['{k}× KICKFLIP! +{n}', '{k}× ¡KICKFLIP! +{n}'],
  'GRIND!': ['GRIND!', '¡GRIND!'], 'BIG AIR!': ['BIG AIR!', '¡GRAN SALTO!'],
  'TACO! +2 Herzen': ['TACO! +2 hearts', '¡TACO! +2 corazones'],
  'SPIN! Tippen = weiterdrehen': ['SPIN! Tap = keep spinning', '¡GIRO! Toca = seguir girando'],
  '3 SPINS! +1 Herz': ['3 SPINS! +1 heart', '¡3 GIROS! +1 corazón'], '{n}× SPIN! +3': ['{n}× SPIN! +3', '{n}× ¡GIRO! +3'],
  'DER MÜLLWAGEN!': ['THE GARBAGE TRUCK!', '¡EL CAMIÓN DE BASURA!'],
  'Spring über die Rampe auf sein Dach! 3×': ['Jump over the ramp onto its roof! 3×', '¡Salta por la rampa a su techo! 3×'],
  'Rampe! Fahr drüber – aufs Dach!': ['Ramp! Tap on it – onto the roof!', '¡Rampa! ¡Toca en ella – al techo!'],
  'VOLLTREFFER! Noch {n}×': ['DIRECT HIT! {n} more', '¡GOLPE DIRECTO! Faltan {n}'],
  'DER MÜLLWAGEN IST ERLEDIGT!': ['THE GARBAGE TRUCK IS DONE FOR!', '¡EL CAMIÓN ESTÁ ACABADO!'],
  'RAMPE': ['RAMP', 'RAMPA'], 'WAU!': ['WOOF!', '¡GUAU!'], 'TACOS': ['TACOS', 'TACOS'], 'HELADOS': ['HELADOS', 'HELADOS'], 'POLICÍA': ['POLICE', 'POLICÍA'],
  'HAFEN': ['HARBOR', 'MUELLE'], 'Weiter zum Hafen!': ['On to the harbor!', '¡Al muelle!'],
  'Du brauchst zuerst die Harpune aus dem OXXO im Himmel!': ['First you need the harpoon from the OXXO in the sky!', '¡Primero necesitas el arpón del OXXO en el cielo!'],
  'Engelsflügel-Rampe! Tippen = ab in den Himmel!': ['Angel wing ramp! Tap = up into the sky!', '¡Rampa de alas! ¡Toca = al cielo!'],
  'Mit der Harpune ab in die Tiefsee!': ['With the harpoon into the deep sea!', '¡Con el arpón al mar profundo!'],
  // piñata
  '¡Kai! Hilfst du uns mit der Piñata?': ['Kai! Will you help us with the piñata?', '¡Kai! ¿Nos ayudas con la piñata?'],
  'Welche Piñata?': ['Which piñata?', '¿Qué piñata?'], 'Stern': ['Star', 'Estrella'], 'T-Rex': ['T-Rex', 'T-Rex'], 'Rakete': ['Rocket', 'Cohete'],
  '¡Dale! Tippen = springen · nach rechts wischen = schlagen': ['¡Dale! Tap = jump · swipe right = hit', '¡Dale! Toca = saltar · desliza a la derecha = pegar'],
  '¡Dale! Klick = springen · X = schlagen': ['¡Dale! Click = jump · X = hit', '¡Dale! Clic = saltar · X = pegar'],
  'Tippen = springen  ·  → wischen = schlagen': ['Tap = jump  ·  → swipe = hit', 'Toca = saltar  ·  → desliza = pegar'],
  'Klick / Leertaste = springen  ·  X = schlagen': ['Click / Space = jump  ·  X = hit', 'Clic / Espacio = saltar  ·  X = pegar'],
  'Hochgezogen! Spring hoch und schlag zu!': ['Pulled up! Jump and hit it!', '¡La subieron! ¡Salta y pégale!'],
  '¡Se acabó el tiempo! Keine Geschenke…': ['¡Se acabó el tiempo! No presents…', '¡Se acabó el tiempo! Sin regalos…'],
  '¡PIÑATA! +15 Münzen · +1 Herz': ['¡PIÑATA! +15 coins · +1 heart', '¡PIÑATA! +15 monedas · +1 corazón'],
  'Viel Spaß noch!': ['Have fun!', '¡Diviértanse!'], 'Strophe {a} / {b}': ['Verse {a} / {b}', 'Estrofa {a} / {b}'],
  '¡FIESTA!': ['¡FIESTA!', '¡FIESTA!'], 'PIÑATA': ['PIÑATA', 'PIÑATA'],
  // ---------- sea ----------
  'DIE TIEFSEE': ['THE DEEP SEA', 'EL MAR PROFUNDO'], 'LEVEL 2 · UNTERWASSERWELT': ['LEVEL 2 · UNDERWATER WORLD', 'NIVEL 2 · MUNDO SUBMARINO'],
  'Gedrückt halten (Tippen / Leertaste) = Propeller → Kai steigt. Loslassen = Kai sinkt.': ['Hold (tap / Space) = propeller → Kai rises. Let go = Kai sinks.', 'Mantén (toca / Espacio) = hélice → Kai sube. Suelta = Kai baja.'],
  'Die Luft wird immer weniger – sammle Luftblasen! Ohne Luft verlierst du alle 2 Sek. ein Herz.': ['Your air keeps running out – collect air bubbles! Without air you lose a heart every 2 s.', 'El aire se acaba – ¡junta burbujas! Sin aire pierdes un corazón cada 2 s.'],
  'Jeder Treffer kostet ein Herz. Schatztruhen schenken dir +2 Herzen.': ['Every hit costs a heart. Treasure chests give you +2 hearts.', 'Cada golpe cuesta un corazón. Los cofres te dan +2 corazones.'],
  'Schießen mit der Harpune: X-Taste oder am Handy kurz nach rechts wischen (im Turbo und beim Kalmar).': ['Shoot the harpoon: X key, or swipe right on the phone (in turbo and against the squid).', 'Dispara el arpón: tecla X o desliza a la derecha en el móvil (en turbo y contra el calamar).'],
  'Am Ende wartet der Riesenkalmar – triff sein Auge 3× mit der Harpune.': ['At the end the giant squid is waiting – hit its eye 3× with the harpoon.', 'Al final te espera el calamar gigante – dale 3× en el ojo con el arpón.'],
  'Tippen oder Leertaste zum Abtauchen': ['Tap or press Space to dive', 'Toca o pulsa Espacio para bucear'],
  'Strecke: {p}%   ·   Seesterne: {s}   ·   Perlen: {pe}': ['Distance: {p}%   ·   Starfish: {s}   ·   Pearls: {pe}', 'Recorrido: {p}%   ·   Estrellas de mar: {s}   ·   Perlas: {pe}'],
  'Tipp: Achte auf die O₂-Luftblasen!': ['Tip: watch for the O₂ air bubbles!', 'Consejo: ¡fíjate en las burbujas de O₂!'],
  'Tipp: Schatztruhen geben +2 Herzen!': ['Tip: treasure chests give +2 hearts!', 'Consejo: ¡los cofres dan +2 corazones!'],
  'TIEFSEE': ['DEEP SEA', 'PROFUNDO'], 'KALMAR': ['SQUID', 'CALAMAR'], 'RIESENKALMAR': ['GIANT SQUID', 'CALAMAR GIGANTE'],
  'BOOM! Seemine!': ['BOOM! Sea mine!', '¡BUM! ¡Mina marina!'], 'Bzzzt! Qualle!': ['Bzzzt! Jellyfish!', '¡Bzzzt! ¡Medusa!'], 'Au! Seeigel!': ['Ouch! Sea urchin!', '¡Ay! ¡Erizo de mar!'],
  'Hai-Biss!': ['Shark bite!', '¡Mordida de tiburón!'], 'Autsch! Kugelfisch!': ['Ouch! Pufferfish!', '¡Ay! ¡Pez globo!'], 'Erwischt!': ['Got you!', '¡Te atrapó!'],
  '+ LUFT': ['+ AIR', '+ AIRE'], 'KEINE LUFT! Schnell eine Luftblase!': ['NO AIR! Quick, grab a bubble!', '¡SIN AIRE! ¡Rápido, una burbuja!'],
  'Tinte! Du siehst kaum noch was!': ['Ink! You can hardly see!', '¡Tinta! ¡Casi no ves nada!'],
  'TREFFER! +2': ['HIT! +2', '¡IMPACTO! +2'], 'TURBO! Doppelt schnell – jetzt schießen!': ['TURBO! Double speed – shoot now!', '¡TURBO! Doble velocidad – ¡dispara!'],
  'Turbo vorbei': ['Turbo over', 'Se acabó el turbo'], 'GRIND ↓': ['GRIND ↓', 'GRIND ↓'],
  'SCHATZTRUHE! +2 Herzen · +3 Perlen': ['TREASURE CHEST! +2 hearts · +3 pearls', '¡COFRE! +2 corazones · +3 perlas'],
  'Hallo Kai! Spielen wir Memory?': ['Hi Kai! Shall we play memory?', '¡Hola Kai! ¿Jugamos memorama?'],
  'WAL-MEMORY': ['WHALE MEMORY', 'MEMORAMA DE LA BALLENA'],
  'Finde alle Paare!   Paare: {p}/6   ·   Züge: {m}   ·   jedes Paar = +2 Seesterne': ['Find all pairs!   Pairs: {p}/6   ·   Moves: {m}   ·   each pair = +2 starfish', '¡Encuentra los pares!   Pares: {p}/6   ·   Jugadas: {m}   ·   cada par = +2 estrellas'],
  'GESCHAFFT! +{s} Seesterne · +{p} Perlen': ['DONE! +{s} starfish · +{p} pearls', '¡LISTO! +{s} estrellas · +{p} perlas'],
  'Danke Kai! Gute Reise!': ['Thanks Kai! Safe travels!', '¡Gracias Kai! ¡Buen viaje!'], 'Der Wal schwimmt weiter...': ['The whale swims on...', 'La ballena sigue nadando...'],
  'DER RIESENKALMAR!': ['THE GIANT SQUID!', '¡EL CALAMAR GIGANTE!'], 'Schieß ihm 3× ins Auge!': ['Shoot it in the eye 3 times!', '¡Dispárale 3× en el ojo!'],
  'TREFFER! Noch {n}×': ['HIT! {n} more', '¡IMPACTO! Faltan {n}'], 'Das Auge ist zu!': ['The eye is closed!', '¡El ojo está cerrado!'],
  'VOLLTREFFER! Der Kalmar ist besiegt!': ['DIRECT HIT! The squid is defeated!', '¡GOLPE DIRECTO! ¡El calamar está vencido!'],
  'Zurück an die Oberfläche!': ['Back to the surface!', '¡De vuelta a la superficie!'],
  'X = schießen': ['X = shoot', 'X = disparar'], '→ nach rechts wischen = schießen': ['→ swipe right = shoot', '→ desliza a la derecha = disparar'],
  // ---------- sky ----------
  'DER HIMMEL': ['THE SKY', 'EL CIELO'], 'LEVEL 2 · HIMMELSWELT': ['LEVEL 2 · SKY WORLD', 'NIVEL 2 · MUNDO DEL CIELO'],
  'Tippen / halten = mit den Flügeln schlagen → Kai steigt. Loslassen = Kai gleitet nach unten.': ['Tap / hold = flap the wings → Kai rises. Let go = Kai glides down.', 'Toca / mantén = aletear → Kai sube. Suelta = Kai planea hacia abajo.'],
  'Lichtpfeile: X-Taste oder am Handy kurz nach rechts wischen. Schieß die Teufelchen ab!': ['Light arrows: X key, or swipe right on the phone. Shoot the little devils!', 'Flechas de luz: tecla X o desliza a la derecha en el móvil. ¡Dispara a los diablitos!'],
  'Im OXXO auf der Wolke kaufst du die Harpune – ohne sie kommst du nicht in die Tiefsee.': ['In the OXXO on the cloud you buy the harpoon – without it you can\'t enter the deep sea.', 'En el OXXO de la nube compras el arpón – sin él no entras al mar profundo.'],
  'Am Ende spielt der Engel eine Melodie – spiel sie auf dem Klavier nach.': ['At the end the angel plays a melody – play it back on the piano.', 'Al final el ángel toca una melodía – repítela en el piano.'],
  'Tippen oder Leertaste zum Losfliegen': ['Tap or press Space to fly', 'Toca o pulsa Espacio para volar'],
  'HIMMEL': ['SKY', 'CIELO'], 'HARFE': ['HARP', 'ARPA'],
  'Teufelchen!': ['Little devil!', '¡Diablito!'], 'Dreizack!': ['Pitchfork!', '¡Tridente!'], 'Blitz!': ['Lightning!', '¡Rayo!'], 'Gewitterwolke!': ['Storm cloud!', '¡Nube de tormenta!'],
  'TREFFER! +3': ['HIT! +3', '¡IMPACTO! +3'], 'Die Wolke löst sich auf!': ['The cloud is dissolving!', '¡La nube se deshace!'],
  'REGENBOGEN-GRIND!': ['RAINBOW GRIND!', '¡GRIND DE ARCOÍRIS!'],
  'Willkommen im OXXO!': ['Welcome to OXXO!', '¡Bienvenido a OXXO!'], 'Zu wenig Münzen!': ['Not enough coins!', '¡No tienes suficientes monedas!'],
  'Gekauft!': ['Bought!', '¡Comprado!'], 'Schon gekauft': ['Already bought', 'Ya comprado'], 'Kaufen': ['Buy', 'Comprar'], 'Anziehen': ['Wear', 'Ponerse'], 'Angezogen': ['Wearing', 'Puesto'],
  'Pflicht für die Tiefsee!': ['Needed for the deep sea!', '¡Necesario para el mar profundo!'],
  'Turbo': ['Turbo', 'Turbo'], 'Doppelt schnell, doppelt so viel zu sammeln': ['Double speed, twice as much to collect', 'Doble velocidad, el doble para juntar'],
  'Sternen-Rundumschuss': ['Star blast', 'Disparo de estrellas'], '8 Sterne in alle Richtungen': ['8 stars in all directions', '8 estrellas en todas direcciones'],
  'Herz': ['Heart', 'Corazón'], '+1 Herz': ['+1 heart', '+1 corazón'],
  'Rote Kappe': ['Red cap', 'Gorra roja'], 'Grüne Kappe': ['Green cap', 'Gorra verde'], 'Beanie': ['Beanie', 'Gorro'], 'Rucksack': ['Backpack', 'Mochila'],
  'Rotes T-Shirt': ['Red T-shirt', 'Playera roja'], 'Gelbes T-Shirt': ['Yellow T-shirt', 'Playera amarilla'], 'Rote Schuhe': ['Red shoes', 'Tenis rojos'],
  'Kleidung': ['Clothes', 'Ropa'], 'Münzen': ['Coins', 'Monedas'],
  'Das OXXO auf der Wolke! Willst du reingehen?': ['The OXXO on the cloud! Want to go in?', '¡El OXXO en la nube! ¿Quieres entrar?'],
  'Sternen-Rundumschuss aktiv!': ['Star blast active!', '¡Disparo de estrellas activo!'],
  'Kai, ein Elfmeter-Duell gegen mich?': ['Kai, a penalty duel against me?', 'Kai, ¿un duelo de penales contra mí?'],
  'ENGEL-ELFMETER': ['ANGEL PENALTIES', 'PENALES DEL ÁNGEL'],
  'Tore: {g} / 3   ·   Schüsse: {s} / 5': ['Goals: {g} / 3   ·   Shots: {s} / 5', 'Goles: {g} / 3   ·   Tiros: {s} / 5'],
  'Tippen / X = schießen, wenn der Pfeil richtig zeigt': ['Tap / X = shoot when the arrow points right', 'Toca / X = tirar cuando la flecha apunte bien'],
  'TOR!': ['GOAL!', '¡GOOOL!'], 'Gehalten!': ['Saved!', '¡Atajada!'], 'Daneben!': ['Missed!', '¡Fuera!'],
  'GEWONNEN! +15 Münzen · +1 Herz': ['YOU WON! +15 coins · +1 heart', '¡GANASTE! +15 monedas · +1 corazón'],
  'Knapp verloren – weiter geht\'s!': ['Close one – let\'s go on!', 'Casi – ¡sigamos!'],
  'Hör gut zu und spiel die Melodie nach!': ['Listen carefully and play the melody back!', '¡Escucha bien y repite la melodía!'],
  'Hör zu…': ['Listen…', 'Escucha…'], 'Du bist dran!': ['Your turn!', '¡Te toca!'], 'Falsch – hör nochmal zu!': ['Wrong – listen again!', 'Incorrecto – ¡escucha otra vez!'],
  'Versuch {a} / {b}': ['Try {a} / {b}', 'Intento {a} / {b}'],
  'WUNDERSCHÖN! Der goldene Heiligenschein gehört dir!': ['BEAUTIFUL! The golden halo is yours!', '¡HERMOSO! ¡La aureola dorada es tuya!'],
  'Wir üben nächstes Mal weiter!': ['We\'ll practise again next time!', '¡Practicamos la próxima vez!'],
  'Die Himmelstreppe führt zurück in die Stadt…': ['The stairway leads back to the city…', 'La escalera te lleva de vuelta a la ciudad…'],
  'Ich spiele langsamer…': ['I\'ll play slower…', 'Toco más despacio…'], 'Ich helfe dir ein bisschen…': ['I\'ll help you a little…', 'Te ayudo un poquito…'],
  // ---------- level end ----------
  'LEVEL 2 GESCHAFFT!': ['LEVEL 2 COMPLETE!', '¡NIVEL 2 COMPLETADO!'], 'LEVEL 3 FREIGESCHALTET': ['LEVEL 3 UNLOCKED', 'NIVEL 3 DESBLOQUEADO'],
  'LEVEL 3: UNDER CONSTRUCTION': ['LEVEL 3: UNDER CONSTRUCTION', 'NIVEL 3: EN CONSTRUCCIÓN'],
  'Perlen {p} × 5 + Seesterne {s} = {c} Münzen': ['Pearls {p} × 5 + starfish {s} = {c} coins', 'Perlas {p} × 5 + estrellas {s} = {c} monedas'],
  'Münzen gesamt: {c}   ·   Herzen: {h}': ['Total coins: {c}   ·   Hearts: {h}', 'Monedas totales: {c}   ·   Corazones: {h}'],
  'Piñata': ['Piñata', 'Piñata'], 'Wal-Memory': ['Whale memory', 'Memorama'], 'Elfmeter': ['Penalties', 'Penales'], 'Harfe': ['Harp', 'Arpa'],
  'NEUES SPIEL': ['NEW GAME', 'NUEVO JUEGO'],
  'ZURÜCK IN DER STADT': ['BACK IN THE CITY', 'DE VUELTA EN LA CIUDAD'],
  'Ab zum Hafen – mit der Harpune in die Tiefsee!': ['Off to the harbor – into the deep sea with the harpoon!', '¡Al muelle – con el arpón al mar profundo!'],
  'Tippen oder Leertaste zum Weiterfahren': ['Tap or press Space to continue', 'Toca o pulsa Espacio para continuar'],
  'Der Riesenkalmar ist besiegt – Kai taucht zurück in die Stadt.': ['The giant squid is defeated – Kai swims back to the city.', 'El calamar gigante está vencido – Kai vuelve a la ciudad.'],
};
function tx(key, params) {
  let s = key;
  const i = LANGS.indexOf(SAVE.lang);
  if (i > 0 && TR[key]) s = TR[key][i - 1];
  if (params) for (const k in params) s = s.split('{' + k + '}').join(params[k]);
  // whoever is riding is greeted by name: "Hallo Bali!", "Ahoi, Kapitän Bali!" …
  if (SAVE.char === 'bali') s = s.replace(/\bKai\b/g, 'Bali');
  return s;
}

// ---------------- language picker (start screens) ----------------
const LANG_BTNS = LANGS.map((l, i) => ({ l, x: W - 150 + i * 46, y: H - 40, w: 40, h: 28 }));
function drawLangPicker() {
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = 'bold 11px Arial'; ctx.fillText(tx('Sprache'), W - 82, H - 50);
  for (const b of LANG_BTNS) {
    const on = SAVE.lang === b.l;
    ctx.fillStyle = on ? '#ffd23a' : 'rgba(255,255,255,0.15)'; ctx.strokeStyle = on ? '#ffffff' : 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = on ? OUT : '#ffffff'; ctx.font = 'bold 13px Arial'; ctx.fillText(b.l.toUpperCase(), b.x + b.w / 2, b.y + b.h / 2 + 1);
  }
  ctx.restore();
}
function langPickerClick(p) {
  for (const b of LANG_BTNS) if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { SAVE.lang = b.l; writeSave(); return true; }
  return false;
}

// ---------------- progress box (top left, like Level 1) ----------------
function drawWorldIcon(type, cx, cy, done) {
  ctx.save(); ctx.translate(cx, cy); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.3;
  ctx.fillStyle = done ? '#2f8a5f' : 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = done ? '#ffffff' : 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2;
  if (type === 'city') { ctx.fillStyle = '#f6c94c'; ctx.fillRect(-6, -3, 5, 9); ctx.strokeRect(-6, -3, 5, 9); ctx.fillStyle = '#f28ab2'; ctx.fillRect(0, -6, 6, 12); ctx.strokeRect(0, -6, 6, 12); }
  if (type === 'heaven') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-3, 2, 4, 0, Math.PI * 2); ctx.arc(2, 0, 5, 0, Math.PI * 2); ctx.arc(5, 3, 3, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(1, -6, 4, 1.5, 0, 0, Math.PI * 2); ctx.stroke(); }
  if (type === 'sea') { ctx.fillStyle = '#36c6f4'; ctx.beginPath(); ctx.moveTo(-7, 2); ctx.quadraticCurveTo(-3, -4, 0, 2); ctx.quadraticCurveTo(3, -4, 7, 2); ctx.lineTo(7, 6); ctx.lineTo(-7, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (type === 'harpoon') { ctx.strokeStyle = '#a0703a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(4, -4); ctx.stroke(); ctx.fillStyle = '#d8dee6'; ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(7, -7); ctx.lineTo(1, -5); ctx.lineTo(5, -1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (type === 'tal') { ctx.fillStyle = '#6fbf4a'; ctx.beginPath(); ctx.ellipse(0, 2, 6, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(7, -7, 3, -7); ctx.stroke(); ctx.fillStyle = '#6fbf4a'; ctx.beginPath(); ctx.arc(3, -7, 2.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  if (type === 'hoehe') { ctx.fillStyle = '#a58a6a'; ctx.beginPath(); ctx.moveTo(-7, 6); ctx.lineTo(-2, -6); ctx.lineTo(2, 0); ctx.lineTo(4, -3); ctx.lineTo(8, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (type === 'lava') { ctx.fillStyle = '#ff6a2b'; ctx.beginPath(); ctx.moveTo(-7, 6); ctx.lineTo(-3, -4); ctx.lineTo(3, -4); ctx.lineTo(7, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(0, -6, 2.2, 0, Math.PI * 2); ctx.fill(); }
  if (done && type !== 'harpoon') { ctx.fillStyle = '#ffffff'; ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center'; ctx.fillText('✓', 7, 9); }
  ctx.restore();
}
function drawLifeIcon(cx, cy, on) {
  ctx.save(); ctx.translate(cx, cy); ctx.globalAlpha = on ? 1 : 0.3; ctx.strokeStyle = OUT; ctx.lineWidth = 1.2;
  ctx.fillStyle = '#f2c26b'; ctx.beginPath(); ctx.moveTo(-7, 0); ctx.quadraticCurveTo(-8, 8, -5, 8); ctx.lineTo(5, 8); ctx.quadraticCurveTo(8, 8, 7, 0); ctx.closePath(); ctx.fill(); // hair
  ctx.fillStyle = '#ffd9b8'; ctx.beginPath(); ctx.arc(0, 1, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (SAVE.char === 'bali' && !SAVE.outfit.cap) { ctx.fillStyle = on ? '#e8cd8e' : '#888'; ctx.beginPath(); ctx.arc(0, -1, 6.2, Math.PI, 0); ctx.quadraticCurveTo(2, -3, -6, 1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else { ctx.fillStyle = on ? SAVE.outfit.cap || '#1e4fa3' : '#888'; ctx.beginPath(); ctx.arc(0, -1, 6, Math.PI, 0); ctx.lineTo(10, -1); ctx.lineTo(6, 1); ctx.lineTo(-6, 1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
function drawProgressBox(x, y) {
  ctx.save();
  // lives (3 little Kai heads) – box to the right of the world icons
  const lw = 76, w0 = 92;
  ctx.fillStyle = 'rgba(10,20,40,0.6)'; ctx.beginPath(); ctx.roundRect(x + w0 + 6, y, lw, 26, 10); ctx.fill();
  for (let i = 0; i < LIVES_MAX; i++) drawLifeIcon(x + w0 + 22 + i * 22, y + 12, i < (SAVE.lives ?? LIVES_MAX));
  const w = w0;
  ctx.fillStyle = 'rgba(10,20,40,0.6)'; ctx.beginPath(); ctx.roundRect(x, y, w, 26, 10); ctx.fill();
  drawWorldIcon('tal', x + 15, y + 13, SAVE.done.tal);
  drawWorldIcon('hoehe', x + 39, y + 13, SAVE.done.hoehe);
  drawWorldIcon('lava', x + 63, y + 13, SAVE.done.lava);
  ctx.restore();
  drawInvButton(x + w0 + 6 + lw + 6, y);
}
