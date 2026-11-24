
// ================= GAME CONSTANTS =================
// 1.5× faster than before; the course is 1.5× longer, so the deep sea still lasts about as long. Turbo = double speed.
const SEA_SCALE = 1.5;
const BASE_SPEED = 3.2 * SEA_SCALE, TURBO_SPEED = BASE_SPEED * 2, TURBO_FRAMES = 12 * 60; // turbo lasts 12 seconds
const LEVEL_LENGTH = 16000 * SEA_SCALE;          // distance until the giant squid
const START_HEARTS = 5;              // lives at the start – there is NO upper limit
const NO_AIR_HEART_FRAMES = 120;     // without air Kai loses one heart every 2 seconds
const EVENTS = [
  { at: 2200, type: 'turbo' },
  { at: 3400, type: 'chest' },
  { at: 4600, type: 'wreck' },          // the first wreck carries a treasure chest on deck
  { at: 7000, type: 'whale' },
  { at: 9800, type: 'turbo' },
  { at: 12600, type: 'wreck' },
  { at: 15300, type: 'chest' },         // last chest right before the giant squid
];
for (const ev of EVENTS) ev.at = Math.round(ev.at * SEA_SCALE);

// ================= GAME STATE =================
function newState() {
  return {
    phase: 'start',                 // start | play | whaleAsk | memory | boss | ascent | victory | gameover
    t: 0, scroll: 0, speed: BASE_SPEED,
    kai: { x: 250, y: 210, vy: 0, thrust: false, hitTimer: 0, prop: 0, platform: null, grind: 0 },
    oxygen: 100, hearts: SAVE.hearts, noAir: 0, lostBy: '', wrecks: 0, stars: 0, pearls: 0,
    // coming from the city the harpoon must have been bought; opened directly (testing) Kai has it
    hasHarpoon: QUERY.get('from') === 'stadt' ? SAVE.items.harpoon : true,
    objects: [], nextSpawn: 500, lastAir: 0,
    particles: [], bubbles: [], explosions: [], harpoons: [], speedLines: [], inkBlobs: [],
    msg: '', msgTimer: 0, shake: 0, turbo: 0, shootCooldown: 0, ink: 0,
    dist: 0, eventIdx: 0,
    whale: null, memory: null, boss: null, phaseTimer: 0,
  };
}
const S = newState();
// ---- the big final screen (all three bosses beaten) ----
function showFinal() {
  S.phase = 'victory'; S.hideKai = false;
  S.bonus = SAVE.pearls * 5 + SAVE.starfish;
  if (!SAVE.level3Unlocked) { SAVE.coins += S.bonus; SAVE.level3Unlocked = true; writeSave(); Audio.play('win'); }
  // 100 % trophy: all four little games won → golden trophy, +50 coins and a golden cap (once)
  if (miniCount() === 4 && !SAVE.trophy) {
    SAVE.trophy = true; SAVE.coins += 50; SAVE.owned.capGold = true; writeSave();
    S.trophyNew = 300; Audio.play('cheer'); setTimeout(() => Audio.play('win'), 400);
  }
}
const miniCount = () => ['pinata', 'whale', 'football', 'harp'].filter(k => SAVE.mini[k] === true).length;
if (QUERY.get('final') === '1') showFinal();
// whale memory straight from the final screen
if (QUERY.get('mini') === 'memory') { S.mini = true; S.phase = 'memoryPick'; }
S.snow = []; S.fish = [];
for (let i = 0; i < 70; i++) S.snow.push({ x: rand(0, W), y: rand(0, H), r: rand(0.6, 1.8), v: rand(0.1, 0.35), p: rand(0, 6) });
for (let i = 0; i < 9; i++) S.fish.push({ x: rand(0, W), y: rand(60, 170), s: rand(0.5, 0.9), v: rand(0.3, 0.7), p: rand(0, 6) });

function backToCity() { goToWorld('stadt.html', 'from=tiefsee'); }   // swim up, the city comes in from above
function beginWorld() { SAVE.started = true; setCheckpoint('sea'); S.hearts = SAVE.hearts; S.phase = 'play'; }
function resetGame() {
  if (S.phase === 'victory') { askNewGame(); return; }   // NEW GAME – asks first
  restartWorldSave();
  const keep = { snow: S.snow, fish: S.fish };
  Object.assign(S, newState(), keep);
  S.phase = 'play'; S.kai.y = 150;
  Audio.setFast(false);
}

// ================= INPUT =================
const BTN = {
  music: { x: W - 252, y: 10, w: 34, h: 30 },
  sfx:   { x: W - 212, y: 10, w: 34, h: 30 },
  shoot: { x: W - 92, y: H - 92, r: 40 },
  yes:   { x: 0, y: 0, w: 70, h: 30 },
  no:    { x: 0, y: 0, w: 70, h: 30 },
  again: { x: W / 2 - 100, y: 228, w: 200, h: 40 },
  goYes: { x: W / 2 - 215, y: 228, w: 210, h: 40 }, goNo: { x: W / 2 + 5, y: 228, w: 210, h: 40 },
  // final screen: play a world again without losing anything
  newGame: { x: W / 2 - 210, y: 190, w: 200, h: 38 }, level3: { x: W / 2 + 10, y: 190, w: 200, h: 38 },
  replay: [['stadt', 'STADT NOCHMAL'], ['himmel', 'HIMMEL NOCHMAL'], ['tiefsee', 'TIEFSEE NOCHMAL']].map(([world, label], i) => ({ world, label, x: W / 2 - 290 + i * 200, y: 254, w: 180, h: 32 })),
  // the little games directly: piñata (city), penalty (sky), whale memory (sea)
  minis: [['stadt', 'pinata', 'Piñata'], ['himmel', 'football', 'Elfmeter'], ['tiefsee', 'memory', 'Wal-Memory']].map(([world, game, label], i) => ({ world, game, label, x: W / 2 - 290 + i * 200, y: 292, w: 180, h: 32 })),
};
const thrustPointers = new Set(), shootPointers = new Set();
let keyThrust = false, keyShoot = false;

function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  const sc = Math.min(r.width / W, r.height / VH);
  const ox = r.left + (r.width - W * sc) / 2, oy = r.top + (r.height - VH * sc) / 2;
  return { x: (e.clientX - ox) / sc, y: (e.clientY - oy) / sc - DY };
}
const inRect = (p, b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
const inCircle = (p, b) => Math.hypot(p.x - b.x, p.y - b.y) <= b.r;
// with the harpoon Kai can always shoot while swimming (X key / swipe right)
const canShoot = () => S.hasHarpoon && (S.phase === 'play' || S.phase === 'turbo' || (S.phase === 'boss' && S.boss && S.boss.state === 'fight'));

// controls: hold = propeller (Kai rises); quick swipe to the right = shoot the harpoon
// on the computer: mouse / Space = propeller, X = shoot
let isTouch = false;
const gest = new Map();
const SWIPE_PX = 28, DECIDE_MS = 90;
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  Audio.init();
  if (e.pointerType === 'touch') isTouch = true;
  const p = toLogical(e);
  const hp = { x: p.x, y: p.y + DY };          // the HUD sits at the very top of the screen
  if (pauseClick(hp)) return;                  // PAUSE / WEITER
  if (invClick(hp)) return;                    // ITEMS drop-down (weapons + outfit)
  if (inRect(hp, BTN.music)) { Audio.toggleMusic(); return; }
  if (inRect(hp, BTN.sfx)) { Audio.toggleSfx(); return; }
  const mp = { x: p.x, y: p.y + DY / 2 };      // menus are drawn centred on the tall screen
  if (S.phase === 'start') { if (!langPickerClick(mp)) beginWorld(); return; }
  if (S.phase === 'seaDone') { if (inRect(mp, BTN.again)) backToCity(); return; }
  if (S.phase === 'victory') {
    for (const b of BTN.replay) if (inRect(mp, b)) { goToWorld(b.world + '.html', 'from=replay'); return; }
    for (const b of BTN.minis) if (inRect(mp, b)) { goToWorld(b.world + '.html', 'from=replay&mini=' + b.game); return; }
    if (inRect(mp, BTN.newGame)) resetGame();
    if (inRect(mp, BTN.level3)) { Audio.play('tink'); location.href = 'level3.html'; }   // on to Level 3: Dinoland
    return;
  }
  if (S.phase === 'gameover') { if (inRect(mp, BTN.goYes)) resetGame(); else if (inRect(mp, BTN.goNo)) { resetGame(); toMainMenu(); } return; }
  if (S.phase === 'whaleAsk') { if (inRect(p, BTN.yes)) { S.phase = 'memoryPick'; Audio.play('tink'); } else if (inRect(p, BTN.no)) { whaleLeaves(false); } return; }
  if (S.phase === 'memoryPick') { memoryPickClick(p); return; }
  if (S.phase === 'memoryEnd') { memoryEndClick(p); return; }
  if (S.phase === 'memory') { memoryClick(p); return; }
  if (S.phase === 'play' || S.phase === 'boss') tapHop();
  gest.set(e.pointerId, { x0: e.clientX, y0: e.clientY, t0: performance.now(), decided: false });
});
// on-screen buttons (controller): JUMP button left = push / hold = propeller, SHOOT button right = harpoon
const CTL = {
  showJump: () => S.phase === 'play' || S.phase === 'boss',
  canShoot: () => canShoot() && S.phase !== 'memory',
  shoot: () => fireHarpoon(), auto: true, icon: 'harpoon',
};
function decideGestures() {
  const now = performance.now();
  for (const [id, g] of gest) if (!g.decided && now - g.t0 > DECIDE_MS) { g.decided = true; thrustPointers.add(id); }
}
const release = e => {
  // a quick tap = a little push upwards (then Kai floats on)
  gest.delete(e.pointerId); thrustPointers.delete(e.pointerId); shootPointers.delete(e.pointerId); };
window.addEventListener('pointerup', release);
window.addEventListener('pointercancel', release);
window.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault(); Audio.init();
    if (S.phase === 'start') beginWorld();
    else if (S.phase === 'seaDone' && !e.repeat) backToCity();
    else if ((S.phase === 'gameover' || S.phase === 'victory') && !e.repeat) resetGame();
    if (!e.repeat && (S.phase === 'play' || S.phase === 'boss')) tapHop();
    keyThrust = true;
  }
  if (e.code === 'KeyX' || e.code === 'Enter') { e.preventDefault(); Audio.init(); if (!keyShoot) fireHarpoon(); keyShoot = true; }
  if (e.code === 'KeyM') Audio.toggleMusic();
});
window.addEventListener('keyup', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') keyThrust = false;
  if (e.code === 'KeyX' || e.code === 'Enter') keyShoot = false;
});

// ================= SPAWNING =================
function pickType() {
  const p = S.dist / LEVEL_LENGTH;
  const table = [['mine', 3], ['jelly', 3], ['urchin', 2], ['star', 3], ['clam', 1.5], ['air', S.oxygen < 50 ? 4 : 2]];
  if (p > 0.12) table.push(['puffer', 2]);
  if (p > 0.2) table.push(['octopus', 1.3]);
  if (p > 0.3) table.push(['shark', 1.6 + p * 2]);
  const total = table.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [t, w] of table) { r -= w; if (r <= 0) return t; }
  return 'star';
}
function spawn() {
  if (S.turbo > 0) { spawnTurboWave(); return; }
  let type = pickType();
  if (S.dist - S.lastAir > 1300) type = 'air';      // there is always air within reach
  if (type === 'air') S.lastAir = S.dist;
  addObject(type, W + 80);
  const p = S.dist / LEVEL_LENGTH;
  S.nextSpawn = rand(220, 360) * (1 - p * 0.25);
}
function addObject(type, x, y) {
  const o = { type, x, y: 0, p: rand(0, 6), done: false };
  if (type === 'mine') { o.baseY = y ?? rand(110, 230); o.r = 22; }
  if (type === 'jelly' || type === 'minijelly') { o.baseY = y ?? rand(70, 200); o.r = type === 'jelly' ? 20 : 13; }
  if (type === 'urchin') { o.y = FLOOR - 12; o.r = 16; }
  if (type === 'air') { o.baseY = y ?? rand(70, 240); o.r = 16; }
  if (type === 'star') { o.baseY = y ?? rand(60, 260); o.r = 14; }
  if (type === 'pearl') { o.baseY = y ?? rand(60, 260); o.r = 9; }
  if (type === 'clam') { o.y = FLOOR - 6; o.r = 16; }
  if (type === 'turbo') { o.baseY = y ?? 150; o.r = 22; }
  if (type === 'puffer') { o.baseY = y ?? rand(90, 250); o.r = 13; o.inflate = 0; }
  if (type === 'shark') { o.baseY = y ?? rand(90, 240); o.r = 24; o.x = W + 420; o.vx = rand(2.5, 3.5); }
  if (type === 'octopus') { o.y = FLOOR - 16; o.r = 16; o.squirted = false; }
  if (type === 'minisquid') { o.baseY = y; o.r = 13; o.vx = rand(2.2, 3.2); }
  if (type === 'chest') { o.y = y ?? FLOOR + 2; o.r = 24; o.open = 0; }
  if (type === 'wreck') { o.w = 560; o.deckY = FLOOR - 74; o.railY = FLOOR - 172; o.railX1 = 250; o.railX2 = 420; }
  o.y = o.y || o.baseY;
  S.objects.push(o);
  return o;
}
function spawnTurboWave() {
  const pattern = Math.floor(Math.random() * 3);
  const x0 = W + 60, cy = rand(110, 220);
  for (let i = 0; i < 8; i++) {
    const y = pattern === 0 ? cy + Math.sin(i / 7 * Math.PI) * -60 : pattern === 1 ? cy + (i - 3.5) * 14 : cy + Math.sin(i * 0.9) * 40;
    addObject(i % 3 === 2 ? 'pearl' : 'star', x0 + i * 42, clamp(y, 60, 270));
  }
  if (Math.random() < 0.85) addObject(['mine', 'jelly', 'puffer'][Math.floor(Math.random() * 3)], x0 + 420, rand(90, 230));
  S.nextSpawn = rand(420, 520);
}

// ================= HARPOON =================
// one kick upwards per tap / click / Space – fast taps keep climbing
// ---- touching Kai / Bali: the WHOLE body counts (helmet + head, chest, legs, the board from tail to nose, air tank) ----
const BODY = [
  { x: 4, y: -92, r: 26 },     // head in the diving helmet
  { x: 2, y: -64, r: 20 },     // chest / t-shirt
  { x: 2, y: -38, r: 18 },     // hips and legs
  { x: -21, y: -66, r: 12 },   // air tank on the back
];
function bodyHit(px, py, r) {
  const k = S.kai;
  for (const b of BODY) if (Math.hypot(px - (k.x + b.x), py - (k.y + b.y)) < b.r + r) return true;
  // the board: a capsule from the tail (x -42) to the nose (x +43), feet included
  const bx = clamp(px, k.x - 42, k.x + 43);
  return Math.hypot(px - bx, py - (k.y - 12)) < 11 + r;
}
function tapHop() { const k = S.kai; k.platform = null; k.onRail = false; k.vy = Math.max(-7.5, Math.min(k.vy, 0) - 5); k.tapT = 20; for (let i = 0; i < 4; i++) S.bubbles.push({ x: k.x - 30 + rand(-8, 8), y: k.y - 20, vx: rand(-1, 0), vy: rand(-0.5, 0.5), r: rand(2, 4), life: 1 }); }
const harpoonTip = (h, d) => ({ x: h.x + Math.cos(h.rot || 0) * d, y: h.y + Math.sin(h.rot || 0) * d });
function fireHarpoon() {
  if (!canShoot() || S.shootCooldown > 0) return;
  const k = S.kai;
  if (SAVE.items.star && SAVE.weapon.sea === 'star') {
    // all-round shot: 8 harpoons in every direction
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; S.harpoons.push({ x: k.x + 10, y: k.y - 56, vx: Math.cos(a) * 13, vy: Math.sin(a) * 13, rot: a, life: 1 }); }
  } else S.harpoons.push({ x: k.x + 40, y: k.y - 56, vx: 15, vy: 0, rot: 0, life: 1 });
  S.shootCooldown = 12;
  Audio.play('shoot');
}

// ================= EFFECTS =================
function burst(x, y, color, n, speed = 4) {
  for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), v = rand(1, speed); S.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(1.5, 4), color, life: 1 }); }
}
function explode(x, y) {
  S.explosions.push({ x, y, t: 0 });
  S.shake = 16;
  for (let i = 0; i < 16; i++) { const a = rand(0, Math.PI * 2), v = rand(3, 9); S.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(2, 4.5), color: i % 2 ? '#3b4652' : '#6b7884', life: 1.3, shard: true, rot: rand(0, 6) }); }
  burst(x, y, '#ffd25a', 24, 8);
  for (let i = 0; i < 30; i++) S.bubbles.push({ x: x + rand(-30, 30), y: y + rand(-25, 25), vx: rand(-1.5, 1.5), vy: rand(-3, -0.8), r: rand(2, 7), life: 1.6 });
  Audio.play('explosion');
}
function flash(text, frames = 90) { S.msg = tx(text); S.msgTimer = frames; }
function squirtInk(x, y) {
  S.ink = 220;
  for (let i = 0; i < 7; i++) S.inkBlobs.push({ x: rand(150, W - 150), y: rand(40, H - 40), r: rand(60, 130), seed: rand(0, 100) });
  for (let i = 0; i < 26; i++) { const a = rand(-2.6, -0.6), v = rand(2, 6); S.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(5, 12), color: '#0b0b14', life: 1.4 }); }
  Audio.play('ink');
  flash(tx('Tinte! Du siehst kaum noch was!'));
}

function loseHeart(reason) {
  S.hearts--;
  S.heartFlash = 40;
  if (S.hearts <= 0 && loseLife()) {
    // a life is gone – Kai carries on right here with full hearts and full air
    S.hearts = LIFE_HEARTS; S.oxygen = 100; S.noAir = 0; S.heartFlash = -40; S.kai.hitTimer = 150;
    flash(SAVE.lives === 1 ? tx('LEBEN VERLOREN! Letztes Leben!') : tx('LEBEN VERLOREN! Noch {n} Leben', { n: SAVE.lives }), 120);
    Audio.play('gameover');
  } else if (S.hearts <= 0) {
    S.hearts = 0; S.lostBy = reason; S.phase = 'gameover'; Audio.grindLoop(false);
    Audio.setFast(false); Audio.setBoss(false); Audio.play('gameover');
    thrustPointers.clear(); shootPointers.clear(); keyThrust = false; keyShoot = false;
  }
}
// Kai gets hit: costs one heart, short invincibility
function hurt(kind, x, y) {
  const k = S.kai;
  if (k.hitTimer > 0) return false;
  k.hitTimer = 70;
  k.platform = null;
  loseHeart('hit');
  k.vy = kind === 'urchin' ? -4 : 2;
  if (kind === 'mine') { explode(x, y); flash(tx('BOOM! Seemine!')); }
  else if (kind === 'jelly' || kind === 'minijelly') { burst(x, y, '#f0a3ff', 18); Audio.play('jelly'); flash(tx('Bzzzt! Qualle!')); }
  else if (kind === 'urchin') { burst(x, y - 10, '#c9a0ff', 14); Audio.play('urchin'); flash(tx('Au! Seeigel!')); }
  else if (kind === 'shark') { burst(x, y, '#ffffff', 16); Audio.play('chomp'); flash(tx('Hai-Biss!')); S.shake = 8; }
  else if (kind === 'puffer') { burst(x, y, '#ffe08a', 14); Audio.play('urchin'); flash(tx('Autsch! Kugelfisch!')); }
  else if (kind === 'tentacle' || kind === 'minisquid') { burst(x, y, '#ff7aa8', 16); Audio.play('slap'); flash(tx('Erwischt!')); S.shake = 10; }
  else { burst(x, y, '#ffffff', 12); Audio.play('urchin'); }
  return true;
}

// ================= WHALE + MEMORY =================
const MEM_ICONS = ['star', 'jelly', 'fish', 'pearl', 'crab', 'seahorse', 'shell', 'turtle', 'octo', 'anchor', 'coral', 'whale'];
const MEM_SIZES = [2, 3, 4];                       // rows of 6 cards: 2×6 = standard, 3×6, 4×6
const MEM_COLS = 6;
const SKIP_BTN = { x: W / 2 - 70, y: H - 38, w: 140, h: 28 };
// card size so that every size fits on the screen (uses the open space above the world too)
function memLayout(rows) {
  const top = 92 - Math.min(DY * 0.85, 40 + DY * 0.6), bottom = H - 48, gap = 10;
  const ch = Math.min(96, (bottom - top - (rows - 1) * gap) / rows), cw = Math.min(80, ch * 0.85);
  const gridW = MEM_COLS * cw + (MEM_COLS - 1) * gap;
  return { rows, cols: MEM_COLS, cw, ch, gap, x0: (W - gridW) / 2, y0: top, scale: ch / 96 };
}
const memRect = (L, i) => ({ x: L.x0 + (i % L.cols) * (L.cw + L.gap), y: L.y0 + Math.floor(i / L.cols) * (L.ch + L.gap), w: L.cw, h: L.ch });
// choose the size (after JA at the whale, and again after every game)
const MEM_PICK = { y: 0 };
function memPickBtns() { return MEM_SIZES.map((r, i) => ({ r, x: W / 2 - 330 + i * 230, y: 150, w: 200, h: 64 })); }
const MEM_END = { again: { x: W / 2 - 220, y: 200, w: 200, h: 44 }, done: { x: W / 2 + 20, y: 200, w: 200, h: 44 } };
function startMemory(rows = 2) {
  const n = rows * MEM_COLS / 2;
  const pool = MEM_ICONS.slice().sort(() => Math.random() - 0.5).slice(0, n);
  const icons = [...pool, ...pool].sort(() => Math.random() - 0.5);          // always a new order
  S.memory = { rows, n, L: memLayout(rows), cards: icons.map(icon => ({ icon, open: false, found: false, flip: 0 })), sel: [], wait: 0, moves: 0, pairs: 0, done: 0 };
  S.phase = 'memory';
  Audio.play('whale');
}
function memoryPickClick(p) { for (const b of memPickBtns()) if (inRect(p, b)) { startMemory(b.r); return; } }
function memoryEndClick(p) {
  if (inRect(p, MEM_END.again)) { S.phase = 'memoryPick'; Audio.play('tink'); }
  else if (inRect(p, MEM_END.done) && S.mini) { SAVE.mini.whale = SAVE.mini.whale === true || !!S.memWon; writeSave(); goToWorld('tiefsee.html', 'final=1'); }
  else if (inRect(p, MEM_END.done)) { const won = !!S.memWon; S.memWon = false; SAVE.mini.whale = won || SAVE.mini.whale === true; writeSave(); whaleLeaves(won); }
}
function memoryClick(p) {
  const m = S.memory;
  if (!m || m.done) return;
  if (inRect(p, SKIP_BTN)) { endMemory(false); return; }
  if (m.wait > 0 || m.sel.length >= 2) return;
  for (let i = 0; i < m.cards.length; i++) {
    const c = m.cards[i];
    if (inRect(p, memRect(m.L, i)) && !c.open && !c.found) {
      c.open = true; m.sel.push(i); Audio.play('flip');
      if (m.sel.length === 2) {
        m.moves++;
        const [a, b] = m.sel;
        if (m.cards[a].icon === m.cards[b].icon) {
          m.cards[a].found = m.cards[b].found = true; m.sel = []; m.pairs++;
          S.stars += 2; Audio.play('match');
          if (m.pairs === m.n) {
            // bonus: more pairs and fewer moves = more
            const bonusStars = 10 + Math.max(0, m.n * 2 + 2 - m.moves) * 2, bonusPearls = 5 + Math.max(0, m.n * 2 - m.moves);
            S.stars += bonusStars; S.pearls += bonusPearls; m.done = 150; miniPts('whale');
            SAVE.mini.whale = true; writeSave();   // won once = stays green on the final screen
            m.result = tx('GESCHAFFT! +{s} Seesterne · +{p} Perlen', { s: bonusStars + m.n * 2, p: bonusPearls });
            Audio.play('win');
          }
        } else { m.wait = 50; Audio.play('nomatch'); }
      }
      break;
    }
  }
}
function updateMemory(dt) {
  const m = S.memory;
  for (const c of m.cards) c.flip += ((c.open || c.found ? 1 : 0) - c.flip) * Math.min(1, 0.25 * dt);
  if (m.wait > 0) { m.wait -= dt; if (m.wait <= 0) { for (const i of m.sel) m.cards[i].open = false; m.sel = []; } }
  if (m.done > 0) { m.done -= dt; if (m.done <= 0) endMemory(true); }
}
// after a game: play again (any size) or go on – as often as the player likes
function endMemory(won) { S.memWon = S.memWon || won; S.memLast = S.memory ? S.memory.result : ''; S.memory = null; S.phase = 'memoryEnd'; }
function whaleLeaves(won) {
  S.phase = 'play';
  if (S.whale) S.whale.leaving = true;
  flash(won ? tx('Danke Kai! Gute Reise!') : tx('Der Wal schwimmt weiter...'));
  Audio.play('whale');
}

function updateWhale(dt, move) {
  const wh = S.whale;
  if (!wh) return;
  wh.p += 0.04 * dt;
  if (wh.leaving) {
    wh.x -= (2 + move * 0.5) * dt; wh.y -= 0.35 * dt; wh.stopping = false;
    if (wh.x < -420) S.whale = null;
    return;
  }
  wh.x -= move;
  if (wh.x < 1040) wh.stopping = true;
  if (wh.stopping && S.speed < 0.15 && S.phase === 'play') { S.speed = 0; S.phase = 'whaleAsk'; Audio.play('whale'); }
}

// ================= GIANT SQUID (boss) =================
function startBoss() {
  S.phase = 'boss';
  S.boss = { x: W + 320, y: 165, hp: 3, eye: 0, eyeTimer: 120, eyeOpen: false, hurt: 0, spawnTimer: 150, slamTimer: 420, slam: null, state: 'enter', t: 0, fade: 1 };
  Audio.play('roar');
  Audio.setBoss(true);
  flash(tx('DER RIESENKALMAR!'), 150);
}
function bossEye(b) { return { x: b.x - 30, y: b.y - 6 }; }
function updateBoss(dt) {
  const b = S.boss; b.t += dt;
  if (b.state === 'enter') {
    b.x += (1010 - b.x) * Math.min(1, 0.02 * dt);
    if (b.x < 1020) { b.state = 'fight'; flash(tx('Schieß ihm 3× ins Auge!'), 140); }
    return;
  }
  if (b.state === 'dying') {
    b.fade -= 0.006 * dt; b.y += 0.6 * dt;
    if (Math.random() < 0.3 * dt) S.bubbles.push({ x: b.x + rand(-90, 90), y: b.y + rand(-80, 80), vx: rand(-1, 1), vy: rand(-3, -1), r: rand(3, 8), life: 1.6 });
    if (b.fade <= 0) { S.boss = null; S.phase = 'ascent'; S.phaseTimer = 0; flash(tx('Zurück an die Oberfläche!'), 160); Audio.play('turbo'); }
    return;
  }
  // eye cycle: open (vulnerable) → closed
  b.eyeTimer -= dt;
  if (b.eyeTimer <= 0) { b.eyeOpen = !b.eyeOpen; b.eyeTimer = b.eyeOpen ? 160 : 110 - (3 - b.hp) * 15; }
  b.eye += ((b.eyeOpen ? 1 : 0) - b.eye) * Math.min(1, 0.15 * dt);
  if (b.hurt > 0) b.hurt -= dt;
  // minions from the tentacles
  b.spawnTimer -= dt;
  if (b.spawnTimer <= 0) {
    const n = 4 - b.hp;   // more minions as it gets angrier
    for (let i = 0; i < n; i++) {
      const ty = clamp(b.y + rand(-40, 110), 70, 270);
      addObject(Math.random() < 0.5 ? 'minisquid' : 'minijelly', b.x - 150 - i * 30, ty).fromBoss = true;
    }
    b.spawnTimer = 150 - (3 - b.hp) * 25;
    Audio.play('spawn');
  }
  // tentacle slam attack
  b.slamTimer -= dt;
  if (!b.slam && b.slamTimer <= 0) { b.slam = { y: clamp(S.kai.y - 46, 80, 270), t: 0 }; Audio.play('warn'); }
  if (b.slam) {
    const s = b.slam; s.t += dt;
    // 0–60 warning, 60–85 strike, 85–105 hold, 105–135 retract
    if (s.t >= 60 && s.t < 105 && S.kai.hitTimer <= 0) {
      const reach = s.t < 85 ? (s.t - 60) / 25 : 1;
      const tipX = b.x - 120 - reach * (b.x - 180);
      const k = S.kai, ky = k.y - 46;
      if (k.x + 45 > tipX && s.y > k.y - 120 && s.y < k.y + 4) hurt('tentacle', k.x + 20, s.y);   // the tentacle hits wherever it touches the body
    }
    if (s.t === 60 || (s.t > 60 && s.t - dt <= 60)) Audio.play('slap');
    if (s.t > 135) { b.slam = null; b.slamTimer = rand(300, 420) - (3 - b.hp) * 50; }
  }
  // regular air supply from the sea floor
  if (Math.random() < 0.004 * dt) { const o = addObject('air', rand(120, 650), FLOOR - 10); o.rise = true; }
  // air bubbles drifting from right to left at different heights – Kai catches them by swimming up or down
  S.bossAirT = (S.bossAirT || 0) - dt;
  if (S.bossAirT <= 0) { S.bossAirT = S.oxygen < 40 ? rand(90, 140) : rand(160, 240); const o = addObject('air', W * 0.62, rand(Math.min(95, 150 - DY) + 40, FLOOR - 40)); o.drift = 1.8; }
}
function hitBoss(h) {
  const b = S.boss; if (!b || b.state !== 'fight') return false;
  const e = bossEye(b);
  const tip = harpoonTip(h, 44);
  if (Math.hypot(tip.x - e.x, tip.y - e.y) < 26) {
    if (b.eye > 0.6 && b.hurt <= 0) {
      b.hp--; b.hurt = 60; b.eyeOpen = false; b.eye = 0; b.eyeTimer = 170; S.shake = 14;
      burst(e.x, e.y, '#ff6a8a', 26, 7); burst(e.x, e.y, '#ffffff', 12, 5);
      Audio.play('bossHit');
      S.stars += 5; gainPts(PTS.bossHit, e.x, e.y - 40, true);
      S.oxygen = Math.min(100, S.oxygen + 30); flash(tx('TREFFER! + LUFT'), 60);   // a hit into the eye = fresh air
      if (b.hp <= 0) {
        b.state = 'dying'; b.slam = null; Audio.play('bossDie'); Audio.setBoss(false);
        squirtInkBig(e.x, e.y);
        for (const o of S.objects) if (o.fromBoss && !o.done) { o.done = true; burst(o.x, o.y, '#ffb0d0', 8); }
        flash(tx('VOLLTREFFER! Der Kalmar ist besiegt!'), 160);
        S.stars += 20; S.pearls += 10; bossPts('tiefsee');
      } else flash(tx('TREFFER! Noch {n}×', { n: b.hp }), 100);
    } else { Audio.play('tink'); burst(e.x, e.y, '#cfd8e8', 8); flash(tx('Das Auge ist zu!'), 60); }
    return true;
  }
  // body hit: no damage
  if (tip.x > b.x - 20 && Math.abs(tip.y - (b.y - 40)) < 120) { Audio.play('tink'); burst(tip.x, tip.y, '#cfd8e8', 6); return true; }
  return false;
}
function squirtInkBig(x, y) {
  for (let i = 0; i < 40; i++) { const a = rand(0, Math.PI * 2), v = rand(2, 7); S.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(6, 16), color: '#120a1a', life: 1.6 }); }
}

// ================= UPDATE =================
function update(dt) {
  S.t += dt;
  decideGestures();
  if (S.shake > 0) S.shake = Math.max(0, S.shake - dt);
  const k = S.kai;
  k.thrust = thrustPointers.size > 0 || keyThrust;

  if (S.trophyNew > 0) S.trophyNew -= dt;
  if (S.phase === 'start' || S.phase === 'gameover' || S.phase === 'victory' || S.phase === 'seaDone') {
    k.prop += 0.3 * dt; k.y = clamp(k.y + Math.sin(S.t * 0.03) * 0.15, 120, FLOOR);
    updateFx(dt, S.phase === 'start' ? 1.2 : 0); return;
  }
  if (S.phase === 'memory') { updateMemory(dt); updateWhale(dt, 0); updateFx(dt, 0); return; }
  if (S.phase === 'memoryPick' || S.phase === 'memoryEnd') { updateWhale(dt, 0); updateFx(dt, 0); return; }
  if (S.phase === 'whaleAsk') { updateWhale(dt, 0); updateFx(dt, 0); k.prop += 0.3 * dt; return; }
  if (S.phase === 'ascent') { updateAscent(dt); return; }

  // ----- speed -----
  const stop = (S.whale && S.whale.stopping) || S.phase === 'boss';
  const target = stop ? 0 : S.turbo > 0 ? TURBO_SPEED : BASE_SPEED;
  S.speed += (target - S.speed) * Math.min(1, 0.05 * dt);
  if (stop && S.speed < 0.05) S.speed = 0;
  const move = S.speed * dt;
  S.scroll += move;
  if (S.phase === 'play') S.dist += move;

  if (S.turbo > 0) { S.turbo -= dt; if (S.turbo <= 0) { S.turbo = 0; Audio.setFast(false); flash(tx('Turbo vorbei')); } }
  if (S.shootCooldown > 0) S.shootCooldown -= dt;
  if ((shootPointers.size > 0 || keyShoot) && S.shootCooldown <= 0) fireHarpoon();
  if (S.ink > 0) { S.ink -= dt; if (S.ink <= 0) S.inkBlobs = []; }

  // ----- Kai physics -----
  if (k.platform) {
    const o = k.platform, onRail = k.onRail;
    const left = onRail ? o.x + o.railX1 : o.x + 20, right = onRail ? o.x + o.railX2 : o.x + o.w - 30;
    if (k.thrust || k.x < left - 10 || k.x > right + 10 || o.done) { k.platform = null; k.onRail = false; k.vy = k.thrust ? -1 : 0; }
    else {
      k.y = onRail ? o.railY : o.deckY; k.vy = 0;
      if (onRail) {
        k.grind += dt;
        if (Math.random() < 0.6 * dt) burst(k.x + rand(-25, 25), k.y - 4, '#ffd25a', 1, 2);
        if (k.grind > 18) { k.grind = 0; S.stars++; Audio.play('star'); }
      }
    }
  }
  if (!k.platform) {
    if (k.thrust) k.vy -= 0.32 * dt; else k.vy += 0.10 * dt;
    k.vy *= Math.pow(0.97, dt);
    if (k.tapT > 0) k.tapT -= dt;
    k.vy = clamp(k.vy, k.tapT > 0 ? -7.5 : -4.2, 2.4);
    const prevY = k.y;
    k.y += k.vy * dt;
    // land on wreck deck or rail
    for (const o of S.objects) {
      if (o.type !== 'wreck' || k.vy < 0) continue;
      if (k.x > o.x + o.railX1 && k.x < o.x + o.railX2 && prevY <= o.railY && k.y >= o.railY) { k.y = o.railY; k.platform = o; k.onRail = true; k.grind = 0; flash(tx('GRIND!'), 50); break; }
      if (k.x > o.x + 20 && k.x < o.x + o.w - 30 && prevY <= o.deckY + 2 && k.y >= o.deckY) { k.y = o.deckY; k.platform = o; k.onRail = false; break; }
    }
    if (k.y > FLOOR) { k.y = FLOOR; k.vy = 0; }
    const top = Math.min(95, 150 - DY);
    if (k.y < top) { k.y = top; k.vy = Math.max(0, k.vy); }
  }
  Audio.grindLoop(!!(k.platform && k.onRail));
  k.prop += (S.turbo > 0 ? 1.6 : k.thrust ? 0.9 : 0.35) * dt;
  if (k.hitTimer > 0) k.hitTimer -= dt;

  if (Math.random() < (S.turbo > 0 ? 1 : k.thrust ? 0.6 : 0.18) * dt)
    S.bubbles.push({ x: k.x - 52, y: k.y - 4 + rand(-3, 3), vx: rand(-2.2, -1.2) - (S.turbo > 0 ? 3 : 0), vy: rand(-0.8, -0.2), r: rand(1.5, 3.8), life: 1 });
  if (Math.random() < 0.03 * dt) S.bubbles.push({ x: k.x + 6, y: k.y - 92, vx: rand(-0.4, 0.2), vy: rand(-1.2, -0.7), r: rand(2, 4), life: 1.4 });

  // ----- oxygen -----
  S.oxygen = Math.max(0, S.oxygen - 0.045 * dt);
  if (S.heartFlash > 0) S.heartFlash = Math.max(0, S.heartFlash - dt); else if (S.heartFlash < 0) S.heartFlash = Math.min(0, S.heartFlash + dt);
  if (S.oxygen <= 0) {
    S.noAir += dt;
    if (S.noAir >= NO_AIR_HEART_FRAMES) { S.noAir = 0; Audio.play('alarm'); flash(tx('KEINE LUFT! Schnell eine Luftblase!'), 80); loseHeart('air'); }
  } else S.noAir = 0;
  if (S.phase === 'gameover') return;

  // ----- level events -----
  if (S.phase === 'play') {
    const ev = EVENTS[S.eventIdx];
    if (ev && S.dist >= ev.at && !S.whale) {
      S.eventIdx++;
      if (ev.type === 'turbo') addObject('turbo', W + 60, rand(110, 200));
      if (ev.type === 'wreck') {
        const w = addObject('wreck', W + 40); S.nextSpawn = 700; S.wrecks++;
        if (S.wrecks === 1) addObject('chest', w.x + 470, w.deckY);
      }
      if (ev.type === 'chest') { addObject('chest', W + 60, FLOOR + 2); S.nextSpawn = Math.max(S.nextSpawn, 300); }
      if (ev.type === 'whale') { S.whale = { x: W + 160, y: 175, p: 0, stopping: false, leaving: false }; Audio.play('whale'); }
    }
    if (S.dist >= LEVEL_LENGTH && !S.whale) startBoss();
    else if (!S.whale) { S.nextSpawn -= move; if (S.nextSpawn <= 0) spawn(); }
  }
  if (S.phase === 'boss') updateBoss(dt);

  // ----- objects -----
  const kx = k.x + 4, ky = k.y - 46, kr = 28;
  for (const o of S.objects) {
    o.x -= move; o.p += 0.03 * dt;
    if (o.type === 'mine') o.y = o.baseY + Math.sin(o.p) * 14;
    if (o.type === 'jelly') o.y = o.baseY + Math.sin(o.p * 0.8) * 30;
    if (o.type === 'minijelly') { o.x -= 1.2 * dt; o.y = o.baseY + Math.sin(o.p * 2) * 18; }
    if (o.type === 'minisquid') { o.x -= o.vx * dt; o.baseY += clamp(ky - o.baseY, -0.6, 0.6) * dt; o.y = o.baseY + Math.sin(o.p * 3) * 6; }
    if (o.type === 'air' && o.drift) o.x -= o.drift * dt;
    if (o.type === 'air') { if (o.rise) { o.baseY -= 0.7 * dt; if (o.baseY < 40) o.done = true; } o.y = o.baseY + Math.sin(o.p) * 8; }
    if (o.type === 'star' || o.type === 'pearl' || o.type === 'turbo') o.y = o.baseY + Math.sin(o.p) * 8;
    if (o.type === 'shark') { o.x -= o.vx * dt; o.y = o.baseY + Math.sin(o.p * 1.5) * 10; if (o.x > W && o.x < W + 400 && !o.warned) { o.warned = true; Audio.play('warn'); } }
    if (o.type === 'puffer') {
      o.x -= 0.4 * dt; o.y = o.baseY + Math.sin(o.p * 1.2) * 10;
      const near = Math.hypot(o.x - kx, o.y - ky) < 170;
      if (near && o.inflate < 0.05) Audio.play('puff');
      o.inflate += ((near ? 1 : 0) - o.inflate) * Math.min(1, 0.08 * dt);
      o.r = 13 + o.inflate * 13;
    }
    if (o.type === 'octopus' && !o.squirted && !o.done && Math.abs(o.x - k.x) < 70 && ky < FLOOR - 20) { o.squirted = true; squirtInk(o.x, o.y - 10); }
    if (o.type === 'chest' && o.opened) o.open = Math.min(1, o.open + 0.06 * dt);
    if (o.done || o.type === 'wreck') continue;

    // harpoon hits
    if (['mine', 'jelly', 'minijelly', 'minisquid', 'shark', 'puffer', 'octopus'].includes(o.type)) {
      for (const h of S.harpoons) {
        const tp = harpoonTip(h, 22);
        if (h.life > 0 && Math.abs(tp.x - o.x) < o.r + 16 && Math.abs(tp.y - o.y) < o.r + 8) {
          h.life = 0; o.done = true;
          if (o.type === 'mine') { explode(o.x, o.y); S.stars += 2; flash(tx('TREFFER! +2')); gainPts(PTS.enemy, o.x, o.y - 30); }
          else { burst(o.x, o.y, o.type === 'shark' ? '#9fb3c8' : o.type === 'puffer' ? '#ffe08a' : '#f0a3ff', 22, 5); Audio.play('pop'); S.stars += o.type === 'shark' ? 3 : 1; gainPts(o.type === 'shark' ? PTS.shark : PTS.enemy, o.x, o.y - 30); }
        }
      }
      if (o.done) continue;
    }
    if (bodyHit(o.x, o.y, o.r)) {
      if (['mine', 'jelly', 'minijelly', 'urchin', 'shark', 'puffer', 'octopus', 'minisquid'].includes(o.type)) {
        if (hurt(o.type, o.x, o.y) && (o.type === 'mine' || o.type === 'minisquid' || o.type === 'minijelly')) o.done = true;
      } else {
        o.done = true;
        if (o.type === 'chest') {
          o.done = true; o.opened = true; S.hearts += 2; S.pearls += 3; S.heartFlash = -40; gainPts(PTS.chest, o.x, o.y - 50);
          burst(o.x, o.y - 20, '#ffd25a', 30, 6); burst(o.x, o.y - 20, '#ff5a7a', 10, 4);
          Audio.play('chest'); flash(tx('SCHATZTRUHE! +2 Herzen · +3 Perlen'), 110);
        }
        if (o.type === 'air') { S.oxygen = Math.min(100, S.oxygen + 35); burst(o.x, o.y, '#bff4ff', 14); Audio.play('air'); flash(tx('+ LUFT'), 50); }
        if (o.type === 'star') { S.stars++; gainPts(PTS.star); burst(o.x, o.y, '#ffb35c', 12); Audio.play('star'); }
        if (o.type === 'pearl' || o.type === 'clam') { S.pearls++; gainPts(PTS.pearl); burst(o.x, o.y - 6, '#ffffff', 12); Audio.play('pearl'); }
        if (o.type === 'turbo') {
          S.turbo = TURBO_FRAMES; Audio.setFast(true); Audio.play('turbo'); burst(o.x, o.y, '#ffe14d', 30, 7);
          flash(tx('TURBO! Doppelt schnell – jetzt schießen!'));
          S.nextSpawn = 200;
        }
      }
    }
  }
  S.objects = S.objects.filter(o => o.x > (o.type === 'wreck' ? -o.w - 50 : -140) && !(o.done && o.type === 'air' && o.rise));

  // ----- harpoons -----
  for (const h of S.harpoons) { h.x += h.vx * dt; h.y += (h.vy || 0) * dt; if (h.x > W + 60 || h.x < -80 || h.y < -DY - 60 || h.y > H + 60) h.life = 0; if (S.boss && h.life > 0 && hitBoss(h)) h.life = 0; }
  S.harpoons = S.harpoons.filter(h => h.life > 0);

  updateWhale(dt, move);
  updateFx(dt, move);
}

function updateAscent(dt) {
  // Kai rides up to the surface – back to the normal world
  const k = S.kai;
  S.phaseTimer += dt;
  k.platform = null;
  k.y -= 2.2 * dt; k.prop += 1.4 * dt;
  if (Math.random() < 0.8 * dt) S.bubbles.push({ x: k.x - 30 + rand(-10, 10), y: k.y, vx: rand(-1, 1), vy: rand(0.5, 1.5), r: rand(2, 5), life: 1 });
  updateFx(dt, 0);
  if (S.phaseTimer > 200) {
    // LEVEL 2 COMPLETE: pearls and starfish become coins
    // squid beaten: keep pearls + starfish, then either the final screen or back to the city
    SAVE.pearls += S.pearls; SAVE.starfish += S.stars; SAVE.hearts = S.hearts; SAVE.done.sea = true; writeSave();
    if (allBossesDone()) showFinal();
    else { S.phase = 'seaDone'; Audio.play('win'); }
  }
}

function updateFx(dt, move) {
  for (const b of S.bubbles) { b.x += b.vx * dt - move * 0.3; b.y += b.vy * dt; b.vy -= 0.02 * dt; b.life -= 0.012 * dt; }
  S.bubbles = S.bubbles.filter(b => b.life > 0 && b.y > -DY - 10);
  for (const p of S.particles) { p.x += p.vx * dt - (p.shard ? move * 0.5 : 0); p.y += p.vy * dt; p.vx *= Math.pow(0.95, dt); p.vy *= Math.pow(0.95, dt); if (p.shard) { p.vy += 0.08 * dt; p.rot += 0.2 * dt; } p.life -= 0.03 * dt; }
  S.particles = S.particles.filter(p => p.life > 0);
  for (const e of S.explosions) { e.t += dt; e.x -= move; }
  S.explosions = S.explosions.filter(e => e.t < 70);
  for (const s of S.snow) { s.y += s.v * 0.3 * dt; s.x -= (s.v * 0.5 + move * 0.12); if (s.x < 0) s.x += W; if (s.y > H) s.y -= H; }
  for (const f of S.fish) { f.x -= (f.v + move * 0.18); f.p += 0.08 * dt; if (f.x < -40) { f.x = W + rand(20, 300); f.y = rand(60, 170); } }
  if (S.turbo > 0 && Math.random() < 0.7 * dt) S.speedLines.push({ x: W + 10, y: rand(40, H - 40), len: rand(60, 180), v: rand(18, 30) });
  for (const l of S.speedLines) l.x -= l.v * dt;
  S.speedLines = S.speedLines.filter(l => l.x + l.len > 0);
  if (S.msgTimer > 0) S.msgTimer -= dt;
}

// ZURÜCK inside the sea: from the memory size choice back to the whale's question
function worldCanBack() { return S.phase === 'memoryPick' && !S.mini; }
function worldBack() { S.phase = 'whaleAsk'; Audio.play('tink'); }
