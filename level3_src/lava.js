// =====================================================================
//  LEVEL 3 · WORLD 3 – DIE LAVAHÖHLEN (the underworld below the dino valley)
//  Reached through one of the two pipes in the valley – only with the Magma-Board.
//  A glowing cave: rock floor with streams of lava in between. The Magma-Board can ride on lava,
//  but only for a moment (it heats up – the bar above Kai), then it costs a heart.
//  Dangers: lava bubbles that spit lava balls (blub = warning), stalactites that fall when Kai rides
//  underneath (they shake first), lava falls that switch on and off, sinking rocks.
//  Enemies: fire salamanders on the ground, glow bats in the air.
//  Weapon: WATER BOMBS – thrown in an arc; they put out enemies and turn lava into stone for a while.
//  Mini game: Lore-Fahrt. Middle boss: Magma-Ankylosaurus. End boss: the Riesenvulkan.
// =====================================================================
const SPEED = 5.4, ACC = 0.24, BRAKE = 0.8, GRAV = 0.62, JUMP_V = -12.6, JUMP_CUT = -5.2;
const MID_X = 4800, BOSS_X = 9800, MAP_END = BOSS_X + W;
const LAVA_Y = FLOOR + 14;                       // the lava surface lies a little lower than the rock floor
const HEAT_MAX = 34;                             // frames the Magma-Board can ride on lava
// rock floor – lava in between
const GROUND = [[0, 900], [1100, 1700], [1950, 2600], [2850, 3900], [4150, 6450], [6700, 7300], [7600, 8200], [8450, 9000], [9250, MAP_END]];
const PLATS = [
  { x: 520, y: 212, w: 160, kind: 'rock' },
  { x: 1320, y: 210, w: 150, kind: 'rock' }, { x: 1500, y: 150, w: 120, kind: 'rock' },
  { x: 1745, y: 250, w: 100, kind: 'sink' }, { x: 1860, y: 236, w: 80, kind: 'sink' },
  { x: 2200, y: 205, w: 170, kind: 'rock' },
  { x: 2620, y: 250, w: 110, kind: 'move', ax: 120, ay: 0, sp: 0.02 },
  { x: 3150, y: 210, w: 170, kind: 'rock' }, { x: 3380, y: 150, w: 110, kind: 'move', ax: 0, ay: 50, sp: 0.03 },
  { x: 3950, y: 245, w: 90, kind: 'rock' }, { x: 4060, y: 225, w: 70, kind: 'sink' },
  { x: 6450, y: 250, w: 100, kind: 'move', ax: 140, ay: 0, sp: 0.018 },
  { x: 6900, y: 205, w: 160, kind: 'rock' },
  { x: 7320, y: 250, w: 90, kind: 'sink' }, { x: 7460, y: 232, w: 90, kind: 'sink' },
  { x: 7800, y: 210, w: 150, kind: 'rock' }, { x: 7990, y: 150, w: 110, kind: 'rock' },
  { x: 8220, y: 248, w: 110, kind: 'move', ax: 110, ay: 0, sp: 0.022 },
  { x: 8600, y: 205, w: 160, kind: 'rock' },
  { x: 9030, y: 248, w: 90, kind: 'sink' }, { x: 9140, y: 230, w: 80, kind: 'rock' },
];
const SALA_PLAN = [[300, 880], [1150, 1680], [2000, 2580], [2900, 3880], [6750, 7280], [7650, 8180], [8480, 8980]];
const BAT_PLAN = [[1100, 1700, 120], [2000, 2700, 100], [3300, 3900, 110], [6700, 7400, 100], [7600, 8300, 120], [8400, 9200, 90]];
const STALACTITES = [760, 1420, 2320, 2480, 3600, 3760, 7050, 7900, 8700, 8850];
const LAVAFALLS = [[2450, 0], [3500, 90], [7100, 40], [8780, 120]];        // x, phase offset
const CHECKPOINTS = [2200, MID_X + W + 120, 7700];
const SITES = { lore: 3000 };                       // the mine cart ride (gate = x + 120)
const PIPE_UP = 70;                                 // the way back up into the valley (left edge)

const S = {
  phase: 'start', t: 0, cam: 0, hearts: SAVE.hearts || LIFE_HEARTS, coins: SAVE.coins || 0, score: SAVE.score || 0, pops: [], wtime: SAVE.wtime.lava || 0, combo: 0,
  kai: { x: 200, y: FLOOR, vx: 0, vy: 0, dir: 0, face: 1, faceAnim: 1, ground: true, platform: null, inv: 0, pushT: 0, landT: 0, safeX: 200, jumpHeld: false, hurtT: 0, shootT: 0, heat: 0, onLava: false },
  plats: [], objects: [], salas: [], bats: [], stalac: [], blobs: [], bubbles: [], bombs: [], cools: [], rocks: [], waves: [], particles: [],
  reload: 0, bubbleT: 80,
  cpX: 200, msg: '', msgTimer: 0, heartFlash: 0, shake: 0,
  ask: null, asked: {}, near: {}, anky: null, boss: null, fight: null, noHud: false, hideKai: false, game: null,
};
window.__S = S; window.__T = () => TEST; window.__V = () => [VH, DY, SAVE];

function buildWorld() {
  S.plats = PLATS.map(p => Object.assign({ x0: p.x, y0: p.y, ph: 0, state: 'idle', st: 0, vy: 0, dx: 0, dy: 0 }, p));
  S.salas = SALA_PLAN.map(([a, b], i) => ({ x: (a + b) / 2, x1: a, x2: b, dir: i % 2 ? 1 : -1, t: rand(0, 100), dead: false, deadT: 0 }));
  S.bats = BAT_PLAN.map(([a, b, y], i) => ({ x: (a + b) / 2, x1: a, x2: b, hy: y, y, dir: i % 2 ? 1 : -1, t: rand(0, 200), state: 'fly', st: 0, dead: false, deadT: 0, vy: 0, cool: rand(60, 160) }));
  S.stalac = STALACTITES.map(x => ({ x, state: 'hang', t: 0, y: 0, vy: 0, back: 0 }));
  const o = [];
  const coin = (x, y) => o.push({ type: 'coin', x, y, r: 11, p: rand(0, 6) });
  const arc = (x, y, n, gap = 34, lift = 30) => { for (let i = 0; i < n; i++) coin(x + i * gap, y - Math.sin(i / Math.max(1, n - 1) * Math.PI) * lift); };
  for (const [a, b] of GROUND) for (let x = a + 140; x < Math.min(b, BOSS_X) - 160; x += 560) { if (x > MID_X - 40 && x < MID_X + W + 40) continue; arc(x, FLOOR - 40, 5); }
  for (let i = 0; i < GROUND.length - 1; i++) { const a = GROUND[i][1], b = GROUND[i + 1][0]; arc(a - 20, FLOOR - 120, 6, (b - a + 40) / 5, 50); }
  for (const p of PLATS) if (p.kind === 'rock') arc(p.x + 20, p.y - 34, Math.max(3, Math.floor(p.w / 45)), 38, 0);
  for (const [x, y] of [[1560, 108], [3420, 60], [7050, 160], [8040, 108]]) o.push({ type: 'heart', x, y, r: 14, p: 0 });
  S.objects = o;
}
buildWorld();
if (QUERY.get('from') === 'tal') { S.kai.x = 200; S.cam = 0; }

// ---------------- helpers ----------------
// solid floor: rock, or lava that a water bomb has turned into stone
const groundAt = x => GROUND.some(([a, b]) => x > a + 4 && x < b - 4) || S.cools.some(c => x > c.x1 && x < c.x2);
const lavaAt = x => !groundAt(x);
function burst(x, y, color, n, speed = 4) { for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), v = rand(1, speed); S.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, r: rand(2, 4.5), color, life: 1, g: 0.18 }); } }
function flash(text, f = 80) { S.msg = tx(text); S.msgTimer = f; }
const kaiBox = () => { const k = S.kai; return { x1: k.x - 26, x2: k.x + 26, y1: k.y - 108, y2: k.y - 4 }; };
const overlap = (a, b) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
const salaBox = c => ({ x1: c.x - 32, x2: c.x + 32, y1: FLOOR - 40, y2: FLOOR });
const batBox = p => ({ x1: p.x - 28, x2: p.x + 28, y1: p.y - 16, y2: p.y + 16 });
const playing = () => S.phase === 'play' || S.phase === 'boss';
const isTouchDev = () => CTRL.touch;
// the arena Kai is fighting in (camera locked, walls left and right)
const arenaX = () => S.fight === 'anky' ? MID_X : S.fight === 'volcano' ? BOSS_X : null;

// ---------------- control ----------------
function steerDir(d) {
  const k = S.kai; if (!playing()) return;
  k.dir = d;
  if (k.hurtT <= 0 && Math.sign(k.vx) === -d) k.vx = 0;
  if (d !== k.face) { k.face = d; Audio.play('flip'); }
}
function steerBrake() { const k = S.kai; if (!playing()) return; k.dir = 0; if (S.phase === 'play' && k.ground && Math.abs(k.x - PIPE_UP) < 50) askUp(); }
function steerStop() { const k = S.kai; if (!playing()) return; k.dir = 0; }
function steerJump(down) {
  const k = S.kai;
  if (!down) k.btn = false;
  if (!playing()) { if (!down) k.chargeAt = 0; return; }
  if (down) {
    k.btn = true; k.jumpHeld = true;
    if ((k.ground || k.coyote > 0) && !k.chargeAt) k.chargeAt = performance.now();   // hold = Kai crouches and charges
  } else if (k.chargeAt) chargeGo();                                                // let go = jump (longer held = higher)
  else { k.jumpHeld = false; if (k.vy < JUMP_CUT) k.vy = JUMP_CUT; }
}
// the charged jump: short tap = small hop, ~0.35 s held = full jump (as high as before, never higher)
function chargeGo() {
  const k = S.kai, f = 0.5 + 0.5 * chargeAmount(k); k.chargeAt = 0;
  if (!(k.ground || k.coyote > 0)) return;
  k.vy = JUMP_V * f; k.jumpHeld = true; k.ground = false; k.platform = null; k.coyote = 0; k.onLava = false; Audio.play('jump');
}
// WATER BOMB: thrown in an arc in the direction Kai looks
function throwBomb() {
  const k = S.kai;
  if (!playing() || S.reload > 0) return;
  S.reload = 22; k.shootT = 14;
  S.bombs.push({ x: k.x + k.face * 24, y: k.y - 70, vx: k.face * 7.5 + k.vx * 0.5, vy: -7.2, rot: 0 });
  Audio.play('throwit');
}
const CTL = {
  steer: true, active: playing, showJump: playing,
  canShoot: () => playing(), shoot: throwBomb, auto: true, icon: 'bomb',
  dir: steerDir, brake: steerBrake, jump: steerJump, stop: steerStop,
};
window.addEventListener('keydown', e => {
  if (CUR !== ME || TRANS || PAUSE.on || INV.open || MENU.open) return;
  if (S.phase === 'start' && (e.code === 'Space' || e.code === 'Enter')) { beginWorld(); return; }
  if (!playing()) { gameKey(e); return; }
  if (e.code === 'KeyX') { throwBomb(); return; }
  if (e.repeat) return;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') steerBrake();
  else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); steerJump(true); }
});
window.addEventListener('keyup', e => {
  if (CUR !== ME) return;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { steerJump(false); gameKeyUp(e); }
});

// ---------------- start / checkpoints / points ----------------
function beginWorld() {
  const cont = QUERY.get('from') === 'continue' && SAVE.cpL;
  S.phase = 'play'; S.noHud = false; SAVE.started = true; SAVE.seenLava = true;
  S.hearts = SAVE.hearts || LIFE_HEARTS; S.coins = SAVE.coins || 0; S.score = SAVE.score || 0;
  const k = S.kai;
  if (QUERY.get('from') !== 'tal' || S.begun) k.x = cont ? SAVE.cpL : 200;
  k.y = FLOOR; k.vy = 0; k.vx = 0; k.dir = 0; k.face = 1; k.ground = true; k.platform = null; k.safeX = k.x;
  S.cpX = k.x; S.cam = clamp(k.x - W * 0.32, 0, BOSS_X); S.begun = true;
  if (QUERY.get('from') === 'tal' || !(SAVE.cps && SAVE.cps.lava)) setCheckpoint('lava'); else useCheckpoint('lava');
  writeSave(); Audio.init(); Audio.setTheme('lava');
  if (!SAVE.items.bombs) {
    SAVE.items.bombs = true; writeSave();
    flash(isTouchDev() ? 'Du hast WASSERBOMBEN! Wurf-Taste rechts unten.' : 'Du hast WASSERBOMBEN! Werfen: X oder rechte Maustaste.', 220);
    Audio.play('chest');
  } else flash('DIE LAVAHÖHLEN', 110);
}
function saveProgress() { SAVE.hearts = S.hearts; SAVE.coins = S.coins; SAVE.score = S.score; SAVE.wtime.lava = S.wtime; bumpBest(); writeSave(); }
function addScore(n, x, y, big) { S.score += n; if (x != null) S.pops.push({ x, y, text: '+' + fmtNum(n), t: 0, big }); }
function comboScore(base, x, y) { S.combo++; const m = Math.min(8, 2 ** (S.combo - 1)); addScore(base * m, x, y, m > 1); if (m > 1) S.pops.push({ x, y: y - 24, text: '×' + m, t: 0, col: '#ff9ad0' }); }
function bossSummary(id) {
  if (SAVE.pts['boss_' + id]) { S.summary = { repeat: true }; return; }
  SAVE.pts['boss_' + id] = true;
  const sec = S.wtime / 60, tb = timeBonus(sec);
  S.score += PTS.boss + tb; SAVE.score = S.score; const rec = bumpBest();
  S.summary = { boss: PTS.boss, time: tb, sec, record: rec };
}
function reachCheckpoint(x) {
  if (x <= S.cpX) return;
  S.cpX = x; SAVE.cpL = x; saveProgress(); setCheckpoint('lava');
  flash('CHECKPOINT!', 70); Audio.play('chime');
}

// ---------------- getting hurt ----------------
function loseHeart() {
  S.hearts--; S.heartFlash = 30;
  if (S.hearts <= 0) {
    if (loseLife()) { S.hearts = LIFE_HEARTS; flash('Ein Leben weniger! Weiter geht\'s.', 120); Audio.play('warn'); }
    else { S.hearts = 0; S.phase = 'gameover'; Audio.play('gameover'); Audio.setBoss(false); saveProgress(); return false; }
  }
  return true;
}
function hurt(srcX) {
  const k = S.kai;
  if (k.inv > 0 || !playing()) return false;
  k.inv = 100; k.hurtT = 24; S.shake = 8;
  k.vy = -6; k.vx = (k.x < srcX ? -1 : 1) * 5; k.ground = false; k.platform = null; k.onLava = false;
  Audio.play('crash');
  loseHeart(); saveProgress();
  return true;
}
// stayed too long on the lava: the board gets too hot
function burnOut() {
  const k = S.kai;
  burst(k.x, LAVA_Y - 6, '#ff7a1a', 20, 5); burst(k.x, LAVA_Y - 6, '#ffd23a', 10, 3); Audio.play('lavahit'); S.shake = 6;
  if (!loseHeart()) return;
  flash('Zu heiß! Nicht so lange auf der Lava fahren.', 90);
  k.x = k.safeX; k.y = FLOOR; k.vy = 0; k.vx = 0; k.dir = 0; k.ground = true; k.platform = null; k.onLava = false; k.heat = 0; k.inv = 80;
  saveProgress();
}
function resetGame() {
  restartWorldSave();
  S.hearts = SAVE.hearts || LIFE_HEARTS; S.coins = SAVE.coins || 0; S.score = SAVE.score || 0;
  buildWorld(); S.blobs = []; S.bombs = []; S.cools = []; S.rocks = []; S.waves = []; S.anky = null; S.boss = null; S.fight = null; Audio.setBoss(false);
  const k = S.kai; k.x = SAVE.cpL || 200; k.y = FLOOR; k.vx = 0; k.vy = 0; k.dir = 0; k.face = 1; k.inv = 60; k.ground = true; k.platform = null; k.safeX = k.x; k.heat = 0;
  S.cpX = k.x; S.cam = clamp(k.x - W * 0.32, 0, BOSS_X);
  S.phase = 'play';
}
// up again into the valley (at the left edge)
function askUp() { S.ask = 'up'; S.phase = 'ask'; S.kai.vx = 0; S.kai.dir = 0; Audio.play('chime'); }
function leaveUp() { saveProgress(); S.phase = 'leaving'; goToWorld('tal.html', 'from=lava'); }

// ---------------- update ----------------
function update(dt) {
  S.t += dt;
  if (S.msgTimer > 0) S.msgTimer -= dt;
  if (S.heartFlash > 0) S.heartFlash -= dt;
  if (S.shake > 0) S.shake = Math.max(0, S.shake - 0.5 * dt);
  if (playing()) S.wtime += dt;
  S.saveT = (S.saveT || 0) + dt; if (S.saveT > 120 && playing()) { S.saveT = 0; saveProgress(); }
  for (const p of S.pops) p.t += dt; S.pops = S.pops.filter(p => p.t < 60);
  updateParticles(dt);
  for (const o of S.objects) o.p += 0.05 * dt;
  if (S.phase === 'lore') { updateLore(dt); return; }
  if (!playing()) { if (S.phase === 'won') updateBossDead(dt); return; }
  if (S.reload > 0) S.reload -= dt;
  for (const c of S.cools) c.t -= dt; S.cools = S.cools.filter(c => c.t > 0);
  updatePlats(dt);
  updateKai(dt);
  updateSalas(dt);
  updateBats(dt);
  updateStalactites(dt);
  updateLava(dt);
  updateBombs(dt);
  updatePickups();
  updateSites();
  updateFights(dt);
  for (const x of CHECKPOINTS) if (S.kai.x > x && !S.fight) reachCheckpoint(x);
  const k = S.kai, ax = arenaX();
  if (ax != null) S.cam += (ax - S.cam) * Math.min(1, 0.08 * dt);
  else {
    const L = W * 0.32, R = W * 0.5, sx = k.x - S.cam;
    let target = S.cam;
    if (sx > R) target = k.x - R; else if (sx < L) target = k.x - L;
    target = clamp(target, 0, BOSS_X);
    if (Math.abs(target - S.cam) > 40) S.cam += (target - S.cam) * Math.min(1, 0.12 * dt);
    else S.cam = target;
  }
}
function updatePlats(dt) {
  for (const p of S.plats) {
    const ox = p.x, oy = p.y;
    if (p.kind === 'move') {
      p.ph += p.sp * dt;
      p.x = p.x0 + (1 - Math.cos(p.ph)) / 2 * p.ax;
      p.y = p.y0 - (1 - Math.cos(p.ph)) / 2 * p.ay;
    } else if (p.kind === 'sink') {
      // sinks slowly into the lava while Kai stands on it, comes back up when he is gone
      const on = S.kai.platform === p;
      if (on) p.y = Math.min(LAVA_Y + 30, p.y + 0.45 * dt); else p.y = Math.max(p.y0, p.y - 0.6 * dt);
    }
    p.dx = p.x - ox; p.dy = p.y - oy;
  }
}
const platSolid = p => !(p.kind === 'sink' && p.y > LAVA_Y);
function updateKai(dt) {
  const k = S.kai, prevY = k.y; k.prevY = prevY;
  if (k.inv > 0) k.inv -= dt;
  if (k.hurtT > 0) k.hurtT -= dt;
  if (k.landT > 0) k.landT -= dt;
  if (k.shootT > 0) k.shootT -= dt;
  k.faceAnim += (k.face - k.faceAnim) * Math.min(1, 0.7 * dt);
  const target = k.dir * SPEED * (S.phase === 'boss' ? 1.05 : 1);
  if (k.hurtT <= 0) {
    if (k.dir === 0) { const s = Math.sign(k.vx); k.vx -= s * Math.min(Math.abs(k.vx), BRAKE * dt); }
    else k.vx += clamp(target - k.vx, -ACC * dt * (k.ground ? 1 : 0.7), ACC * dt * (k.ground ? 1 : 0.7));
  }
  if (k.platform) k.x += k.platform.dx;
  let nx = k.x + k.vx * dt;
  const ax = arenaX(), minX = ax != null ? ax + 40 : 30, maxX = S.fight === 'volcano' || S.phase === 'won' ? VOLC.baseL - 30 : ax != null ? ax + W - 40 : VOLC.baseL - 30;
  if (nx < minX) { nx = minX; k.vx = 0; } if (nx > maxX) { nx = maxX; k.vx = 0; }
  k.x = nx;
  if (k.ground && Math.abs(k.vx) < Math.abs(target) - 0.3) k.pushT = (k.pushT + dt) % 40; else if (k.pushT > 0 && k.pushT < 34) k.pushT += dt; else k.pushT = 0;
  if (k.ground && k.platform) {
    const pl = k.platform;
    if (!platSolid(pl) || k.x < pl.x - 18 || k.x > pl.x + pl.w + 18) { k.ground = false; k.platform = null; k.coyote = 6; }
    else k.y = pl.y;
  } else if (k.ground) {
    // riding along the floor: on rock y = FLOOR, on lava a little lower (and the board heats up)
    if (groundAt(k.x)) { k.y = FLOOR; k.onLava = false; }
    else { k.y = LAVA_Y; if (!k.onLava) { k.onLava = true; Audio.play('lavahit'); } }
  }
  if (k.onLava && k.ground && !k.platform) {
    k.heat += dt;
    if (Math.random() < 0.4 * dt) S.particles.push({ x: k.x + rand(-30, 30), y: LAVA_Y - 4, vx: rand(-0.5, 0.5), vy: rand(-2, -1), r: rand(2, 4), color: Math.random() < 0.5 ? '#ff7a1a' : '#ffd23a', life: 0.8, g: -0.02 });
    if (k.heat > HEAT_MAX) burnOut();
  } else k.heat = Math.max(0, k.heat - 1.5 * dt);
  if (k.btn && !k.chargeAt && k.ground) k.chargeAt = performance.now();        // button still held while landing: charge right away
  if (k.chargeAt && !k.ground && k.coyote <= dt) chargeGo();                   // rolled off an edge while charging: jump at the last moment
  if (!k.ground) {
    if (k.coyote > 0) k.coyote -= dt;
    if (k.vy >= 0) k.jumpHeld = false;
    k.vy += GRAV * dt * (k.vy < 0 && !k.jumpHeld ? 1.6 : 1); k.y += k.vy * dt;
    if (k.vy > 0) {
      for (const pl of S.plats) {
        if (!platSolid(pl) || k.x < pl.x - 14 || k.x > pl.x + pl.w + 14) continue;
        const top = pl.y;
        if (prevY <= top + 3 + Math.max(0, -pl.dy) && k.y >= top) { landOn(pl, top); break; }
      }
      if (!k.ground && k.y >= FLOOR && groundAt(k.x)) landOn(null, FLOOR);
      if (!k.ground && k.y >= LAVA_Y && !groundAt(k.x)) { landOn(null, LAVA_Y); k.onLava = true; Audio.play('lavahit'); }
    }
  }
  if (k.ground && !k.platform && !k.onLava && GROUND.some(([a, b]) => k.x > a + 80 && k.x < b - 80)) k.safeX = k.x;
}
function landOn(pl, top) {
  const k = S.kai;
  k.y = top; k.vy = 0; k.ground = true; k.platform = pl; k.landT = 8; S.combo = 0;
  Audio.play('land');
}
function stompBounce(top) {
  const k = S.kai;
  k.y = top; k.vy = (k.jumpHeld || k.btn) ? JUMP_V * 0.95 : -9; k.ground = false; k.platform = null; k.coyote = 0; k.onLava = false;
  S.shake = Math.max(S.shake, 3);
}

// ---------------- enemies ----------------
function updateSalas(dt) {
  const k = S.kai, kb = kaiBox();
  for (const c of S.salas) {
    if (c.dead) { c.deadT += dt; continue; }
    if (Math.abs(c.x - k.x) > 1400) continue;
    c.t += dt; c.x += c.dir * 1.5 * dt;
    if (c.x < c.x1 || !GROUND.some(([a, b]) => c.x - 34 > a && c.x - 34 < b)) { c.x = Math.max(c.x, c.x1); c.dir = 1; }
    if (c.x > c.x2 || !GROUND.some(([a, b]) => c.x + 34 > a && c.x + 34 < b)) { c.x = Math.min(c.x, c.x2); c.dir = -1; }
    const cb = salaBox(c);
    if (!overlap(kb, cb)) continue;
    if (k.vy > 0 && (k.prevY ?? k.y) <= cb.y1 + 16) { killSala(c, true); stompBounce(cb.y1); }
    else hurt(c.x);
  }
}
function killSala(c, stomped) { c.dead = true; c.deadT = 0; Audio.play('stomp'); burst(c.x, FLOOR - 20, '#ff7a3a', 12, 4); if (stomped) comboScore(PTS.salamander, c.x, FLOOR - 60); else addScore(PTS.salamander, c.x, FLOOR - 60); }
function updateBats(dt) {
  const k = S.kai, kb = kaiBox();
  for (const p of S.bats) {
    if (p.dead) { p.deadT += dt; p.vy += 0.4 * dt; p.y += p.vy * dt; continue; }
    if (Math.abs(p.x - k.x) > 1400) continue;
    p.t += dt;
    if (p.state === 'fly') {
      p.x += p.dir * 1.8 * dt;
      if (p.x < p.x1) { p.x = p.x1; p.dir = 1; } if (p.x > p.x2) { p.x = p.x2; p.dir = -1; }
      p.y += ((p.hy + Math.sin(p.t * 0.09) * 20) - p.y) * Math.min(1, 0.1 * dt);
      p.cool -= dt;
      const dx = k.x - p.x;
      if (p.cool <= 0 && Math.abs(dx) < 300 && Math.abs(dx) > 50 && playing()) { p.state = 'dive'; p.st = 0; p.sx = p.x; p.sy = p.y; p.tx = k.x; p.dir = Math.sign(dx); Audio.play('flap'); }
    } else if (p.state === 'dive') {
      p.st += dt; const u = Math.min(1, p.st / 60), ex = p.sx + (p.tx - p.sx) * 2;
      p.x = p.sx + (ex - p.sx) * u; p.y = p.sy + (FLOOR - 70 - p.sy) * Math.sin(u * Math.PI);
      if (u >= 1) { p.state = 'fly'; p.cool = p.baby ? rand(40, 90) : rand(140, 240); if (!p.baby) { p.x1 = Math.min(p.x1, p.x - 150); p.x2 = Math.max(p.x2, p.x + 150); } }
    }
    const pb = batBox(p);
    if (!overlap(kb, pb)) continue;
    if (k.vy > 0 && (k.prevY ?? k.y) <= pb.y1 + 16) { killBat(p, true); stompBounce(pb.y1); }
    else hurt(p.x);
  }
}
function killBat(p, stomped) { p.dead = true; p.deadT = 0; p.vy = -3; Audio.play('stomp'); burst(p.x, p.y, '#ffb347', 12, 4); if (stomped) comboScore(PTS.bat, p.x, p.y - 30); else addScore(PTS.bat, p.x, p.y - 30); }

// ---------------- stalactites: shake, then fall when Kai rides underneath ----------------
function updateStalactites(dt) {
  const k = S.kai;
  for (const s of S.stalac) {
    if (s.state === 'hang') { if (Math.abs(k.x + k.vx * 12 - s.x) < 120 && playing()) { s.state = 'shake'; s.t = 0; Audio.play('tink'); } }
    else if (s.state === 'shake') { s.t += dt; if (Math.random() < 0.3 * dt) S.particles.push({ x: s.x + rand(-8, 8), y: -DY + 30, vx: 0, vy: rand(1, 2), r: 2, color: '#6b4a3a', life: 0.8, g: 0.2 }); if (s.t > 40) { s.state = 'fall'; s.y = -DY + 20; s.vy = 1; } }
    else if (s.state === 'fall') {
      s.vy += 0.5 * dt; s.y += s.vy * dt;
      if (Math.abs(s.x - k.x) < 24 && s.y + 40 > k.y - 108 && s.y < k.y - 4) { hurt(s.x); s.state = 'gone'; s.back = 0; burst(s.x, s.y + 30, '#8a6a5a', 14, 4); }
      else if (s.y + 40 >= (groundAt(s.x) ? FLOOR : LAVA_Y)) { s.state = 'gone'; s.back = 0; burst(s.x, FLOOR - 4, '#8a6a5a', 14, 4); Audio.play('land'); }
    } else if (s.state === 'gone') { s.back += dt; if (s.back > 600 && Math.abs(s.x - k.x) > 500) s.state = 'hang'; }
  }
}

// ---------------- lava: bubbles that spit lava balls, lava falls that switch on and off ----------------
const lavafallOn = (lf, t) => ((t + lf[1]) % 260) < 150;          // on 150 frames, off 110
const lavafallWarn = (lf, t) => { const u = (t + lf[1]) % 260; return u > 230; };
function updateLava(dt) {
  const k = S.kai;
  // a bubble forms in the lava near Kai (warning), then a lava ball jumps out in an arc
  S.bubbleT -= dt;
  if (S.bubbleT <= 0 && playing() && !S.fight) {
    S.bubbleT = rand(70, 130);
    const x = k.x + k.vx * 40 + rand(-260, 260);
    if (lavaAt(x) && !S.cools.some(c => x > c.x1 - 20 && x < c.x2 + 20)) S.bubbles.push({ x, t: 0 });
  }
  for (const b of S.bubbles) {
    b.t += dt;
    if (b.t > 50 && !b.done) { b.done = true; S.blobs.push({ x: b.x, y: LAVA_Y, vx: rand(-1.5, 1.5), vy: -rand(10, 13) }); Audio.play('pop'); }
  }
  S.bubbles = S.bubbles.filter(b => !b.done);
  for (const o of S.blobs) {
    o.vy += 0.4 * dt; o.x += o.vx * dt; o.y += o.vy * dt;
    if (Math.abs(o.x - k.x) < 26 && o.y > k.y - 108 && o.y < k.y) { hurt(o.x); o.done = true; burst(o.x, o.y, '#ff7a1a', 10, 3); }
    if (o.vy > 0 && o.y > LAVA_Y) o.done = true;
  }
  S.blobs = S.blobs.filter(o => !o.done);
  // lava falls: touching one while it pours costs a heart
  for (const lf of LAVAFALLS) if (lavafallOn(lf, S.t) && Math.abs(k.x - lf[0]) < 32) hurt(lf[0]);
}

// ---------------- water bombs ----------------
function updateBombs(dt) {
  for (const b of S.bombs) {
    b.vy += 0.35 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += 0.2 * dt;
    let hit = false;
    for (const c of S.salas) if (!c.dead && overlap({ x1: b.x - 8, x2: b.x + 8, y1: b.y - 8, y2: b.y + 8 }, salaBox(c))) hit = true;
    for (const p of S.bats) if (!p.dead && overlap({ x1: b.x - 8, x2: b.x + 8, y1: b.y - 8, y2: b.y + 8 }, batBox(p))) hit = true;
    if (!hit && bombHitsFight(b)) { b.done = true; splash(b.x, b.y, false); continue; }
    const floorY = groundAt(b.x) ? FLOOR : LAVA_Y;
    if (hit || b.y >= floorY) { b.done = true; splash(b.x, Math.min(b.y, floorY), !hit && floorY === LAVA_Y); }
    if (b.x < S.cam - 100 || b.x > S.cam + W + 100) b.done = true;
  }
  S.bombs = S.bombs.filter(b => !b.done);
}
// the splash puts out every enemy close by; on lava it leaves a stone crust to ride on for a while
function splash(x, y, onLava) {
  burst(x, y, '#7fd0ff', 18, 5); burst(x, y, '#ffffff', 8, 3); Audio.play('pop');
  for (const c of S.salas) if (!c.dead && Math.abs(c.x - x) < 70 && Math.abs(FLOOR - 20 - y) < 80) killSala(c, false);
  for (const p of S.bats) if (!p.dead && Math.abs(p.x - x) < 60 && Math.abs(p.y - y) < 60) killBat(p, false);
  if (onLava) {
    S.cools.push({ x1: x - 70, x2: x + 70, t: 360 });
    for (let i = 0; i < 10; i++) S.particles.push({ x: x + rand(-60, 60), y: LAVA_Y - 4, vx: rand(-0.5, 0.5), vy: rand(-2.5, -1), r: rand(5, 10), color: 'rgba(230,230,240,0.6)', life: 1.2, g: -0.03 });
    Audio.play('air');
  }
}

// ---------------- pickups / particles ----------------
function updatePickups() {
  const k = S.kai, kb = kaiBox();
  for (const o of S.objects) {
    if (o.done || Math.abs(o.x - k.x) > 90) continue;
    if (kb.x1 - o.r < o.x && kb.x2 + o.r > o.x && kb.y1 - o.r < o.y && kb.y2 + 8 > o.y) {
      o.done = true;
      if (o.type === 'coin') { S.coins++; addScore(PTS.coin); burst(o.x, o.y, '#ffd23a', 6, 2.5); Audio.play('coin'); }
      if (o.type === 'heart') { S.hearts++; S.heartFlash = -30; burst(o.x, o.y, '#ff3b5c', 14, 3); Audio.play('chest'); flash('+1 HERZ', 50); }
    }
  }
}
function updateParticles(dt) {
  for (const p of S.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g ?? 0.18) * dt; p.life -= 0.03 * dt; }
  S.particles = S.particles.filter(p => p.life > 0);
}

// ---------------- the mine cart ride: asked on the way (also when Kai comes by in the air) ----------------
function updateSites() {
  const k = S.kai;
  if (k.x > 260) S.asked.up = false;
  if (!S.asked.up && k.x < PIPE_UP + 10 && k.dir < 0 && k.ground) { S.asked.up = true; askUp(); return; }
  for (const [id, x] of Object.entries(SITES)) {
    const gate = x + 120, d = Math.abs(k.x - gate);
    if (d > 300) { S.asked[id] = false; S.near[id] = false; }
    if (d < 60) S.near[id] = true;
    if (!S.asked[id] && S.near[id] && k.ground && d < 300) {
      S.asked[id] = true; S.ask = id; S.phase = 'ask'; k.vx = 0; k.dir = 0; Audio.play('chime');
    }
  }
}

// ---------------- panel buttons ----------------
const BTN = {
  start: { x: W / 2 - 110, y: 250, w: 220, h: 46 },
  yes: { x: W / 2 - 215, y: 228, w: 200, h: 44 }, no: { x: W / 2 + 15, y: 228, w: 200, h: 44 },
  goYes: { x: W / 2 - 215, y: 228, w: 210, h: 40 }, goNo: { x: W / 2 + 5, y: 228, w: 210, h: 40 },
  up: { x: W / 2 - 250, y: 236, w: 240, h: 44 }, menu: { x: W / 2 + 10, y: 236, w: 240, h: 44 },
  music: { x: W - 252, y: 10, w: 34, h: 30 }, sfx: { x: W - 212, y: 10, w: 34, h: 30 },
};
const inRect = (p, b) => b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
function toLogical(e) { const r = canvas.getBoundingClientRect(), sc = Math.min(r.width / W, r.height / VH); return { x: (e.clientX - r.left - (r.width - W * sc) / 2) / sc, y: (e.clientY - r.top - (r.height - VH * sc) / 2) / sc - DY }; }
canvas.addEventListener('pointerdown', e => {
  if (CUR !== ME || TRANS || MENU.open || CONFIRM.open) return;
  if (e.pointerType === 'mouse' && e.button === 2) return;
  const p = toLogical(e), hp = { x: p.x, y: p.y + DY };
  Audio.init();
  if (pauseClick(hp)) return;
  if (PAUSE.on) return;
  if (INV.btn && invClick(hp)) return;
  if (INV.open) return;
  if (inRect(hp, BTN.music)) { Audio.toggleMusic(); return; }
  if (inRect(hp, BTN.sfx)) { Audio.toggleSfx(); return; }
  if (S.phase === 'start') { beginWorld(); return; }
  if (S.phase === 'ask') {
    if (inRect(p, BTN.yes)) { const id = S.ask; S.ask = null; if (id === 'up') leaveUp(); else startLore(); }
    else if (inRect(p, BTN.no)) { S.ask = null; S.phase = 'play'; Audio.play('tink'); }
    return;
  }
  if (S.phase === 'lore') { lorePointer(p, e.pointerId); return; }
  if (S.phase === 'gameover') { if (inRect(p, BTN.goYes)) resetGame(); else if (inRect(p, BTN.goNo)) { resetGame(); toMainMenu(); } return; }
  if (S.phase === 'won') { if (inRect(p, BTN.up)) leaveUp(); else if (inRect(p, BTN.menu)) toMainMenu(); return; }
});

function enter() { if (!SAVE.seenLava) { S.phase = 'start'; S.noHud = true; } else beginWorld(); }
function enterFromMenu() { S.noHud = S.phase === 'start'; }
const TEST = {
  setX(x) { const k = S.kai; k.x = x; k.safeX = x; k.y = FLOOR; k.ground = true; k.platform = null; S.cam = clamp(x - W * 0.32, 0, BOSS_X); },
  mid() { TEST.setX(MID_X + 300); }, boss() { TEST.setX(BOSS_X + 300); }, lore() { startLore(); },
};
