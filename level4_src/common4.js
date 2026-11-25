
// =====================================================================
//  LEVEL 4 – COMMON PLATFORMER ENGINE (built into every world: moon, Aurora 61, underworld)
//  The world file before this one sets the map (GROUND, PLATS, …) and the numbers (SPEED, GRAV, …).
//  Optional hooks a world can define (function declarations): worldInit, worldBegin, worldUpdate,
//  worldPhase, worldPointer, worldKey, worldAsk, shotHitsExtra, updateFly, updateMid, updateBoss, worldReset.
// =====================================================================
const S = {
  phase: 'start', t: 0, cam: 0, hearts: SAVE.hearts || LIFE_HEARTS, coins: SAVE.coins || 0, score: SAVE.score || 0, fruits: SAVE.fruits || 0,
  pops: [], wtime: SAVE.wtime[WKEY] || 0, combo: 0,
  kai: { x: 200, y: FLOOR, vx: 0, vy: 0, dir: 0, face: 1, faceAnim: 1, ground: true, platform: null, inv: 0, pushT: 0, landT: 0, safeX: 200, jumpHeld: false, hurtT: 0, shootT: 0, flip: false, flipAnim: 0, coyote: 0 },
  plats: [], objects: [], walkers: [], flyers: [], shots: [], eshots: [], particles: [], drops: [], puddles: [],
  reload: 0, dropT: 60, cpX: 200, msg: '', msgTimer: 0, heartFlash: 0, shake: 0,
  ask: null, asked: {}, near: {}, boss: null, mid: null, noHud: false, hideKai: false, game: null, fly: null, shopMsg: '', shopMsgT: 0,
};
const hook = (name, ...a) => { const f = HOOKS[name]; return f ? f(...a) : undefined; };
// ---------------- read aloud: every text gets a 🔊 button (Kai can't read yet) – in the chosen language ----------------
const SAY = { list: [] };
const canSpeak = () => !!window.speechSynthesis;
function speak(text) {
  try {
    if (!window.speechSynthesis || !text) return;
    // symbols are not read: arrows, dots, = …
    const clean = text.replace(/[◀▶←→↑↓▲▼·=•|]/g, ', ').replace(/[^\p{L}\p{N}\s.,!?¡¿:;'’"„“()%+–-]/gu, ' ').replace(/\s*,\s*(,\s*)+/g, ', ').replace(/([.!?])\s*\./g, '$1').replace(/\s+/g, ' ').trim();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean); u.lang = { de: 'de-DE', en: 'en-US', es: 'es-ES' }[SAVE.lang] || 'de-DE'; u.rate = 0.92;
    speechSynthesis.speak(u);
  } catch (e) {}
}
// a tap in screen coordinates (from the controller): a 🔊 button hit?
function sayClick(hp) {
  if (!canSpeak()) return false;
  const p = { x: hp.x, y: hp.y - DY };
  for (let i = SAY.list.length - 1; i >= 0; i--) { const b = SAY.list[i]; if (p.x >= b.x - 6 && p.x <= b.x + b.w + 6 && p.y >= b.y - 6 && p.y <= b.y + b.h + 6) { Audio.play('tink'); speak(b.text); return true; } }
  return false;
}

// ---------------- map helpers ----------------
const groundAt = x => GROUND.some(([a, b]) => x > a + 4 && x < b - 4);
const flipZoneAt = x => FLIP_ZONES.find(([a, b]) => x >= a && x <= b);
// the ceiling of a gravity zone (Kai rides on it upside down) – with gaps to jump over
const ceilAt = x => { const z = flipZoneAt(x); return !!z && !CEIL_GAPS.some(([a, b]) => x > a + 4 && x < b - 4); };
const inHaz = x => HAZ.some(([a, b]) => x > a + 10 && x < b - 10);
function burst(x, y, color, n, speed = 4) { for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), v = rand(1, speed); S.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, r: rand(2, 4.5), color, life: 1, g: 0.18 }); } }
function flash(text, f = 80, params) { S.msg = tx(text, params); S.msgTimer = f; }
const kaiBox = () => { const k = S.kai; return k.flip ? { x1: k.x - 26, x2: k.x + 26, y1: k.y + 4, y2: k.y + 108 } : { x1: k.x - 26, x2: k.x + 26, y1: k.y - 108, y2: k.y - 4 }; };
const overlap = (a, b) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
const playing = () => S.phase === 'play' || S.phase === 'boss';
const isTouchDev = () => CTRL.touch;
const arenaX = () => S.mid && S.mid.state !== 'gone' ? MID.x : S.boss ? BOSS_X : null;

function buildWorld() {
  S.plats = PLATS.map(p => Object.assign({ x0: p.x, y0: p.y, ph: 0, state: 'idle', st: 0, vy: 0, dx: 0, dy: 0 }, p));
  S.walkers = WALKERS.map(([a, b], i) => ({ x: (a + b) / 2, x1: a, x2: b, dir: i % 2 ? 1 : -1, t: rand(0, 100), dead: false, deadT: 0, kind: i % 3 }));
  S.flyers = FLYERS.map(([a, b, y], i) => ({ x: (a + b) / 2, x1: a, x2: b, hy: y, y, dir: i % 2 ? 1 : -1, t: rand(0, 200), state: 'fly', st: 0, dead: false, deadT: 0, vy: 0, cool: rand(60, 160) }));
  const o = [];
  const coin = (x, y) => o.push({ type: 'coin', x, y, r: 11, p: rand(0, 6) });
  const arc = (x, y, n, gap = 34, lift = 30) => { for (let i = 0; i < n; i++) coin(x + i * gap, y - Math.sin(i / Math.max(1, n - 1) * Math.PI) * lift); };
  for (const [a, b] of GROUND) for (let x = a + 140; x < Math.min(b, BOSS_X) - 160; x += 560) if (!inHaz(x) && !inHaz(x + 140) && !flipZoneAt(x) && !flipZoneAt(x + 140)) arc(x, FLOOR - 40, 5);
  for (let i = 0; i < GROUND.length - 1; i++) { const a = GROUND[i][1], b = GROUND[i + 1][0]; if (b - a < 420 && !flipZoneAt((a + b) / 2)) arc(a - 20, FLOOR - 120 * JUMP_LIFT, 6, (b - a + 40) / 5, 50 * JUMP_LIFT); }
  for (const p of PLATS) if (p.kind === 'rock') arc(p.x + 20, p.y - 34, Math.max(3, Math.floor(p.w / 45)), 38, 0);
  // coins under the ceiling of the gravity zones (Kai rides upside down there)
  for (const [a, b] of FLIP_ZONES) for (let x = a + 120; x < b - 100; x += 46) if (ceilAt(x - 20) && ceilAt(x + 20)) o.push({ type: 'coin', x, y: CEIL + 40, r: 11, p: rand(0, 6) });
  for (const [x, y] of HEARTS) o.push({ type: 'heart', x, y, r: 14, p: 0 });
  S.objects = o;
  hook('worldInit');
}

// ---------------- control (called by the controller) ----------------
function steerDir(d) {
  if (S.phase === 'game') { hook('gameDir', d); return; }
  const k = S.kai; if (!playing() || S.fly) return;
  k.dir = d;
  if (k.hurtT <= 0 && Math.sign(k.vx) === -d) k.vx = 0;      // turn at once, no sliding
  if (d !== k.face) { k.face = d; Audio.play('flip'); }
}
function steerStop() { if (S.phase === 'game') { hook('gameDir', 0); return; } const k = S.kai; if (!playing()) return; k.dir = 0; }
function steerJump(down) {
  if (S.phase === 'game') { if (down) hook('gameShoot'); return; }
  const k = S.kai;
  if (!down) k.btn = false;
  if (!playing()) { if (!down) k.chargeAt = 0; return; }
  if (S.fly) { S.fly.up = down; return; }
  if (down) {
    k.btn = true; k.jumpHeld = true;
    if ((k.ground || k.coyote > 0) && !k.chargeAt) k.chargeAt = performance.now();   // hold = Kai crouches and charges
  } else if (k.chargeAt) chargeGo();                                                // let go = jump (longer held = higher)
  else {
    k.jumpHeld = false;
    if (!k.flip && k.vy < JUMP_CUT) k.vy = JUMP_CUT;
    if (k.flip && k.vy > -JUMP_CUT) k.vy = -JUMP_CUT;
  }
}
// the charged jump: short tap = small hop, ~0.35 s held = full jump (as high as before, never higher)
function chargeGo() {
  const k = S.kai, f = 0.5 + 0.5 * chargeAmount(k); k.chargeAt = 0;
  if (!(k.ground || k.coyote > 0)) return;
  k.vy = (k.flip ? -JUMP_V : JUMP_V) * f; k.jumpHeld = true; k.ground = false; k.platform = null; k.coyote = 0; Audio.play('jump');
}
const superShot = () => !!(WEAPON.super && SAVE.items[WEAPON.super] && SAVE.weapon[WKEY] !== WEAPON.item);
function shoot() {
  if (S.phase === 'game') { hook('gameShoot'); return; }
  const k = S.kai;
  if (!playing() || !SAVE.items[WEAPON.item] || S.reload > 0) return;
  S.reload = superShot() ? WEAPON.reload2 : WEAPON.reload; k.shootT = 14;
  const x = k.x + k.face * 30, y = k.flip ? k.y + 50 : (S.fly ? k.y - 62 : k.y - 50), vx = k.face * WEAPON.speed + k.vx * 0.5;
  const col = WEAPON.colors[(S.shotN = (S.shotN || 0) + 1) % WEAPON.colors.length];
  S.shots.push({ x, y, vx, vy: WEAPON.vy * (k.flip ? -1 : 1), life: 90, col, g: WEAPON.grav * (k.flip ? -1 : 1) });
  if (superShot()) S.shots.push({ x, y: y + (k.flip ? 8 : -8), vx: vx * 0.95, vy: (WEAPON.vy - 2.6) * (k.flip ? -1 : 1), life: 90, col: WEAPON.colors[(S.shotN + 1) % WEAPON.colors.length], g: WEAPON.grav * (k.flip ? -1 : 1) });
  Audio.play(WEAPON.sound);
}
const CTL = {
  steer: true,
  active: () => playing() || (S.phase === 'game' && !!S.game && !!S.game.steer && !S.game.result),
  showJump: () => (playing() && !(S.boss && S.boss.noJump)) || (S.phase === 'game' && !!S.game && !!S.game.steer && !S.game.result),
  canShoot: () => (playing() && !!SAVE.items[WEAPON.item]) || (S.phase === 'game' && !!S.game && !!S.game.steer && !S.game.result), shoot, auto: true,
  get icon() { return S.phase === 'game' ? 'laser' : WEAPON.icon; },
  dir: steerDir, brake: () => {}, jump: steerJump, stop: steerStop,
};

// keyboard: ← → ride (through the controller), Space / ↑ jump, X shoot
window.addEventListener('keydown', e => {
  if (CUR !== ME || TRANS || PAUSE.on || INV.open || MENU.open) return;
  if (S.phase === 'start' && (e.code === 'Space' || e.code === 'Enter')) { beginWorld(); return; }
  if (hook('worldKey', e)) return;
  if (S.phase === 'shop') { if (e.code === 'Escape' || e.code === 'Enter') leaveShop(); return; }
  if (S.phase === 'game') { if (e.code === 'Space' || e.code === 'KeyX' || e.code === 'ArrowUp') { e.preventDefault(); hook('gameShoot'); } return; }
  if (!playing()) return;
  if (e.code === 'KeyX') { shoot(); return; }
  if (e.repeat) return;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); steerJump(true); }
});
window.addEventListener('keyup', e => {
  if (CUR !== ME) return;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') steerJump(false);
});

// ---------------- start / checkpoints ----------------
function beginWorld() {
  const cont = QUERY.get('from') === 'continue' && SAVE['cp_' + WKEY];
  S.phase = 'play'; S.noHud = false; SAVE.started = true; SAVE['seen_' + WKEY] = true;
  S.hearts = SAVE.hearts || LIFE_HEARTS; S.coins = SAVE.coins || 0; S.score = SAVE.score || 0; S.fruits = SAVE.fruits || 0;
  const k = S.kai, arrive = ARRIVE[QUERY.get('from')];
  if (arrive != null && !S.begun) k.x = arrive; else k.x = cont ? SAVE['cp_' + WKEY] : START_X;
  k.flip = !!flipZoneAt(k.x); k.flipAnim = k.flip ? 1 : 0;
  k.y = k.flip ? CEIL : FLOOR; k.vy = 0; k.vx = 0; k.dir = 0; k.face = 1; k.ground = true; k.platform = null; k.safeX = k.x;
  S.cpX = Math.max(START_X, k.x); S.cam = clamp(k.x - W * 0.32, 0, BOSS_X); S.begun = true;
  if (arrive != null || !(SAVE.cps && SAVE.cps[WKEY])) setCheckpoint(WKEY); else useCheckpoint(WKEY);
  writeSave(); Audio.init(); Audio.setTheme(WKEY);
  hook('worldBegin');
}
function saveProgress() { SAVE.hearts = S.hearts; SAVE.coins = S.coins; SAVE.score = S.score; SAVE.fruits = S.fruits; SAVE.wtime[WKEY] = S.wtime; bumpBest(); writeSave(); }
function addScore(n, x, y, big) { S.score += n; if (x != null) S.pops.push({ x, y, text: '+' + fmtNum(n), t: 0, big }); }
function comboScore(base, x, y) { S.combo++; const m = Math.min(8, 2 ** (S.combo - 1)); addScore(base * m, x, y, m > 1); if (m > 1) S.pops.push({ x, y: y - 24, text: '×' + m, t: 0, col: '#ff9ad0' }); }
function bossSummary(id) {
  if (SAVE.pts['boss_' + id]) { S.summary = { repeat: true }; return; }
  SAVE.pts['boss_' + id] = true;
  const sec = S.wtime / 60, tb = timeBonus(sec);
  S.score += PTS.boss + tb;
  SAVE.score = S.score; const rec = bumpBest();
  S.summary = { boss: PTS.boss, time: tb, sec, record: rec };
}
function reachCheckpoint(x) {
  if (x <= S.cpX) return;
  S.cpX = x; SAVE['cp_' + WKEY] = x; saveProgress(); setCheckpoint(WKEY);
  flash('CHECKPOINT!', 70); Audio.play('chime');
}

// ---------------- getting hurt ----------------
function loseHeart() {
  S.hearts--; S.heartFlash = 30;
  if (S.hearts <= 0) {
    if (loseLife()) { S.hearts = LIFE_HEARTS; flash('Ein Leben weniger! Weiter geht\'s.', 120); Audio.play('warn'); }
    else { S.hearts = 0; S.phase = 'gameover'; S.game = null; S.fly = null; Audio.play('gameover'); Audio.setBoss(false); saveProgress(); return false; }
  }
  return true;
}
function hurt(srcX) {
  const k = S.kai;
  if (k.inv > 0 || !playing() || S.fly) return false;
  k.inv = 100; k.hurtT = 24; S.shake = 8;
  k.vy = k.flip ? 6 : -6; k.vx = (k.x < srcX ? -1 : 1) * 5; k.ground = false; k.platform = null;
  Audio.play('crash');
  loseHeart();
  saveProgress();
  return true;
}
function fallOut(text) {
  const k = S.kai;
  Audio.play('crash'); S.shake = 6;
  if (!loseHeart()) return;
  flash(text || 'Abgestürzt!', 70);
  k.x = k.safeX; k.flip = !!flipZoneAt(k.x); k.flipAnim = k.flip ? 1 : 0; k.y = k.flip ? CEIL : FLOOR;
  k.vy = 0; k.vx = 0; k.dir = 0; k.ground = true; k.platform = null; k.inv = 80;
  saveProgress();
}
function resetGame() {
  restartWorldSave();
  S.hearts = SAVE.hearts || LIFE_HEARTS; S.coins = SAVE.coins || 0; S.score = SAVE.score || 0; S.fruits = SAVE.fruits || 0;
  buildWorld(); S.shots = []; S.eshots = []; S.drops = []; S.puddles = []; S.boss = null; S.fly = null; S.game = null; Audio.setBoss(false);
  if (S.mid && S.mid.state !== 'gone') S.mid = null;
  const k = S.kai; k.x = SAVE['cp_' + WKEY] || START_X; k.flip = !!flipZoneAt(k.x); k.flipAnim = k.flip ? 1 : 0; k.y = k.flip ? CEIL : FLOOR;
  k.vx = 0; k.vy = 0; k.dir = 0; k.face = 1; k.inv = 60; k.ground = true; k.platform = null; k.safeX = k.x;
  S.cpX = k.x; S.cam = clamp(k.x - W * 0.32, 0, BOSS_X);
  S.phase = 'play';
  hook('worldReset');
}

// ---------------- update ----------------
function update(dt) {
  S.t += dt;
  if (S.msgTimer > 0) S.msgTimer -= dt;
  if (S.heartFlash > 0) S.heartFlash -= dt;
  if (S.shopMsgT > 0) S.shopMsgT -= dt;
  if (S.shake > 0) S.shake = Math.max(0, S.shake - 0.5 * dt);
  if (playing()) S.wtime += dt;
  S.saveT = (S.saveT || 0) + dt; if (S.saveT > 120 && playing()) { S.saveT = 0; saveProgress(); }
  for (const p of S.pops) p.t += dt; S.pops = S.pops.filter(p => p.t < 60);
  updateParticles(dt);
  for (const o of S.objects) o.p += 0.05 * dt;
  if (hook('worldPhase', dt)) return;                    // mini games, star quiz, intro …
  if (S.phase === 'shop' || S.phase === 'ask') return;
  if (S.phase === 'leaving') return;
  if (!playing()) { if (S.phase === 'won' && S.boss) S.boss.t += dt; return; }
  if (S.reload > 0) S.reload -= dt;
  updatePlats(dt);
  if (S.fly) hook('updateFly', dt); else updateKai(dt);
  updateWalkers(dt);
  updateFlyers(dt);
  updateDrops(dt);
  updateShots(dt);
  updateEShots(dt);
  updatePuddles(dt);
  updatePickups();
  if (!S.fly) updateSites();
  hook('worldUpdate', dt);
  if (S.mid || (MID && !SAVE.mid[MID.key] && S.kai.x > MID.x + 240 && S.kai.x < MID.x + W)) hook('updateMid', dt);
  if (S.phase === 'boss' || (!S.boss && S.kai.x > BOSS_X + 240)) hook('updateBoss', dt);
  for (const x of CHECKPOINTS) if (S.kai.x > x) reachCheckpoint(x);
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
    } else if (p.kind === 'crumble') {
      if (p.state === 'shake') { p.st += dt; if (p.st > 34) { p.state = 'fall'; p.vy = 1; Audio.play('clank'); burst(p.x + p.w / 2, p.y, PLAT_DUST, 8, 3); } }
      else if (p.state === 'fall') { p.vy += 0.5 * dt; p.y += p.vy * dt; if (p.y > FLOOR + 400) { p.state = 'gone'; p.st = 0; } }
      else if (p.state === 'gone') { p.st += dt; if (p.st > 220 && Math.abs(S.kai.x - (p.x0 + p.w / 2)) > 160) { p.state = 'idle'; p.y = p.y0; p.st = 0; } }
    }
    p.dx = p.x - ox; p.dy = p.y - oy;
  }
}
const platSolid = p => p.state !== 'gone' && p.state !== 'fall';

function updateKai(dt) {
  const k = S.kai, prevY = k.y; k.prevY = prevY;
  if (k.inv > 0) k.inv -= dt;
  if (k.hurtT > 0) k.hurtT -= dt;
  if (k.landT > 0) k.landT -= dt;
  if (k.shootT > 0) k.shootT -= dt;
  k.faceAnim += (k.face - k.faceAnim) * Math.min(1, 0.7 * dt);
  k.flipAnim += ((k.flip ? 1 : 0) - k.flipAnim) * Math.min(1, 0.18 * dt);
  const target = k.dir * SPEED * (S.phase === 'boss' ? 1.05 : 1);
  if (k.hurtT <= 0) {
    if (k.dir === 0) { const s = Math.sign(k.vx); k.vx -= s * Math.min(Math.abs(k.vx), BRAKE * dt); }
    else k.vx += clamp(target - k.vx, -ACC * dt * (k.ground ? 1 : 0.7), ACC * dt * (k.ground ? 1 : 0.7));
  }
  if (k.platform) k.x += k.platform.dx;
  let nx = k.x + k.vx * dt;
  const ax = arenaX(), minX = ax != null ? ax + 40 : 30, maxX = ax != null && S.mid && S.mid.state !== 'gone' ? ax + W - 40 : MAP_END - 40;
  if (nx < minX) { nx = minX; k.vx = 0; } if (nx > maxX) { nx = maxX; k.vx = 0; }
  if (!k.flip && k.y > FLOOR + 6 && groundAt(nx) && !groundAt(k.x)) { nx = k.x; k.vx = 0; }   // inside a gorge: the walls are solid
  k.x = nx;
  if (k.ground && Math.abs(k.vx) < Math.abs(target) - 0.3) k.pushT = (k.pushT + dt) % 40; else if (k.pushT > 0 && k.pushT < 34) k.pushT += dt; else k.pushT = 0;
  // gravity zones: inside one Kai falls UP onto the ceiling, leaving it he falls down again
  const zone = !!flipZoneAt(k.x);
  if (zone !== k.flip) { k.flip = zone; k.ground = false; k.platform = null; k.vy = 0; Audio.play('gravity'); flash(zone ? 'SCHWERKRAFT UMGEDREHT!' : 'Schwerkraft wieder normal', 60); }
  if (k.ground && k.platform) {
    const pl = k.platform;
    if (!platSolid(pl) || k.x < pl.x - 18 || k.x > pl.x + pl.w + 18) { k.ground = false; k.platform = null; k.coyote = 6; }
    else { k.y = pl.y; if (pl.kind === 'crumble' && pl.state === 'idle') { pl.state = 'shake'; pl.st = 0; Audio.play('tink'); } }
  } else if (k.ground) {
    if (k.flip ? !ceilAt(k.x) : !groundAt(k.x)) { k.ground = false; k.coyote = 6; }
  }
  if (k.btn && !k.chargeAt && k.ground) k.chargeAt = performance.now();        // button still held while landing: charge right away
  if (k.chargeAt && !k.ground && k.coyote <= dt) chargeGo();                   // rolled off an edge while charging: jump at the last moment
  if (!k.ground) {
    if (k.coyote > 0) k.coyote -= dt;
    if (k.flip) {
      // upside down: "falling" means going up
      if (k.vy <= 0) k.jumpHeld = false;
      k.vy -= GRAV * dt * (k.vy > 0 && !k.jumpHeld ? 1.6 : 1); k.vy = Math.max(k.vy, -14); k.y += k.vy * dt;
      if (k.vy < 0 && k.y <= CEIL && prevY >= CEIL - 3 && ceilAt(k.x)) landOn(null, CEIL);
      if (!k.ground && k.y < CEIL - 320) fallOut('Ins All gefallen!');
    } else {
      if (k.vy >= 0) k.jumpHeld = false;
      k.vy += GRAV * dt * (k.vy < 0 && !k.jumpHeld ? 1.6 : 1); k.vy = Math.min(k.vy, 14); k.y += k.vy * dt;
      if (k.vy > 0) {
        for (const pl of S.plats) {
          if (!platSolid(pl) || k.x < pl.x - 14 || k.x > pl.x + pl.w + 14) continue;
          const top = pl.y;
          if (prevY <= top + 3 + Math.max(0, -pl.dy) && k.y >= top) { landOn(pl, top); break; }
        }
        if (!k.ground && k.y >= FLOOR && prevY <= FLOOR + 2 && groundAt(k.x)) landOn(null, FLOOR);
        if (!k.ground && k.y > FLOOR + 260) fallOut(FALL_TEXT);
      }
    }
  }
  if (k.ground && !k.platform) {
    if (k.flip ? ceilAt(k.x - 80) && ceilAt(k.x + 80) : groundAt(k.x - 80) && groundAt(k.x + 80) && !inHaz(k.x - 40) && !inHaz(k.x + 40)) k.safeX = k.x;
  }
  // a hazard pool on the ground (acid / grey puddle): ouch
  if (k.ground && !k.platform && !k.flip && inHaz(k.x)) { if (hurt(k.x + k.face * 40)) flash(HAZ_TEXT, 60); }
}
function landOn(pl, top) {
  const k = S.kai;
  k.y = top; k.vy = 0; k.ground = true; k.platform = pl; k.landT = 8; S.combo = 0;
  Audio.play('land');
}

// ---------------- enemies ----------------
const walkerBox = c => ({ x1: c.x - 26, x2: c.x + 26, y1: FLOOR - 46, y2: FLOOR });
const flyerBox = p => { const s = p.baby ? 0.65 : 1; return { x1: p.x - 34 * s, x2: p.x + 34 * s, y1: p.y - 20 * s, y2: p.y + 20 * s }; };
function stompBounce(top) {
  const k = S.kai;
  k.y = top; k.vy = (k.jumpHeld || k.btn) ? JUMP_V * 0.95 : JUMP_V * 0.7; k.ground = false; k.platform = null; k.coyote = 0;
  S.shake = Math.max(S.shake, 3);
}
function updateWalkers(dt) {
  const k = S.kai, kb = kaiBox();
  for (const c of S.walkers) {
    if (c.dead) { c.deadT += dt; continue; }
    if (Math.abs(c.x - k.x) > 1400) continue;
    c.t += dt;
    c.x += c.dir * WALK_SPEED * dt;
    if (c.x < c.x1 || !groundAt(c.x - 30) || inHaz(c.x - 30)) { c.x = Math.max(c.x, c.x1); c.dir = 1; }
    if (c.x > c.x2 || !groundAt(c.x + 30) || inHaz(c.x + 30)) { c.x = Math.min(c.x, c.x2); c.dir = -1; }
    if (k.flip || S.fly) continue;
    const cb = walkerBox(c);
    if (!overlap(kb, cb)) continue;
    if (k.vy > 0 && (k.prevY ?? k.y) <= cb.y1 + 16) { killWalker(c, true); stompBounce(cb.y1); }
    else hurt(c.x);
  }
  S.walkers = S.walkers.filter(c => !(c.dead && c.deadT > 90 && c.summoned));
}
function killWalker(c, stomped) { c.dead = true; c.deadT = 0; Audio.play('stomp'); burst(c.x, FLOOR - 24, WALK_COLOR, 12, 4); if (stomped) comboScore(PTS.walker, c.x, FLOOR - 70); else addScore(PTS.walker, c.x, FLOOR - 70); }
function updateFlyers(dt) {
  const k = S.kai, kb = kaiBox();
  for (const p of S.flyers) {
    if (p.dead) { p.deadT += dt; p.vy += 0.3 * dt; p.y += p.vy * dt; continue; }
    if (Math.abs(p.x - k.x) > 1400) continue;
    p.t += dt;
    if (p.state === 'fly') {
      p.x += p.dir * 1.6 * dt;
      if (p.x < p.x1) { p.x = p.x1; p.dir = 1; } if (p.x > p.x2) { p.x = p.x2; p.dir = -1; }
      p.y += ((p.hy + Math.sin(p.t * 0.05) * 16) - p.y) * Math.min(1, 0.08 * dt);
      p.cool -= dt;
      const dx = k.x - p.x;
      if (p.cool <= 0 && Math.abs(dx) < 330 && Math.abs(dx) > 60 && playing() && !k.flip && !S.fly) { p.state = 'warn'; p.st = 0; p.dir = Math.sign(dx); Audio.play(FLY_SOUND); }
    } else if (p.state === 'warn') {
      p.st += dt; p.y -= 0.6 * dt;
      if (p.st > 30) { p.state = 'dive'; p.st = 0; p.sx = p.x; p.sy = p.y; p.tx = k.x + k.vx * 26; }
    } else if (p.state === 'dive') {
      p.st += dt; const u = Math.min(1, p.st / 70), ax = arenaX(), ex = ax != null ? clamp(p.sx + (p.tx - p.sx) * 2, ax + 50, ax + W - 50) : p.sx + (p.tx - p.sx) * 2;
      p.x = p.sx + (ex - p.sx) * u;
      p.y = p.sy + (FLOOR - 66 - p.sy) * Math.sin(u * Math.PI);
      p.dir = Math.sign(ex - p.sx) || p.dir;
      if (u >= 1) { p.state = 'fly'; p.cool = p.baby ? rand(50, 110) : rand(150, 260); if (!p.baby) { p.x1 = Math.min(p.x1, p.x - 200); p.x2 = Math.max(p.x2, p.x + 200); } }
    }
    if (S.fly) continue;
    const pb = flyerBox(p);
    if (!overlap(kb, pb)) continue;
    if (!k.flip && k.vy > 0 && (k.prevY ?? k.y) <= pb.y1 + 18) { killFlyer(p, true); stompBounce(pb.y1); }
    else hurt(p.x);
  }
  S.flyers = S.flyers.filter(p => !(p.dead && p.y > FLOOR + 600));
}
function killFlyer(p, stomped) { p.dead = true; p.deadT = 0; p.vy = -3; Audio.play('stomp'); burst(p.x, p.y, FLY_COLOR, 12, 4); const n = p.baby ? PTS.baby : PTS.flyer; if (stomped) comboScore(n, p.x, p.y - 30); else addScore(n, p.x, p.y - 30); }

// ---------------- things falling from above (drops) – zones set by the world ----------------
function updateDrops(dt) {
  const k = S.kai;
  const zone = DROP_ZONES.find(([a, b]) => k.x > a - 100 && k.x < b + 100);
  if (zone && S.phase === 'play' && !k.flip) {
    S.dropT -= dt;
    if (S.dropT <= 0) {
      S.dropT = rand(70, 120);
      const x = clamp(k.x + k.vx * 34 + rand(-90, 90), zone[0], zone[1]);
      S.drops.push({ x, y: -DY - 40, vy: 1.5, r: rand(12, 18), rot: 0, done: false });
      Audio.play('swish');
    }
  } else S.dropT = Math.max(S.dropT, 40);
  for (const s of S.drops) {
    s.vy += DROP_G * dt; s.y += s.vy * dt; s.rot += 0.12 * dt;
    if (!s.done && Math.abs(s.x - k.x) < 26 + s.r * 0.6 && s.y + s.r > k.y - 108 && s.y - s.r < k.y - 4) { s.done = true; burst(s.x, s.y, DROP_COLOR, 12, 4); hurt(s.x); }
    if (!s.done && s.y + s.r >= FLOOR && groundAt(s.x)) { s.done = true; burst(s.x, FLOOR - 6, DROP_COLOR, 14, 4); Audio.play(DROP_SOUND); S.shake = Math.max(S.shake, 2); }
    if (s.y > FLOOR + 500) s.done = true;
  }
  S.drops = S.drops.filter(s => !s.done);
}

// ---------------- Kai's shots ----------------
function updateShots(dt) {
  for (const s of S.shots) {
    s.vy += s.g * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.y > FLOOR && groundAt(s.x)) { s.life = 0; burst(s.x, FLOOR - 3, s.col, 4, 2); continue; }
    const sb = { x1: s.x - 7, x2: s.x + 7, y1: s.y - 7, y2: s.y + 7 };
    for (const c of S.walkers) if (!c.dead && overlap(sb, walkerBox(c))) { killWalker(c); s.life = 0; break; }
    if (s.life <= 0) continue;
    for (const p of S.flyers) if (!p.dead && overlap(sb, flyerBox(p))) { killFlyer(p); s.life = 0; break; }
    if (s.life > 0) hook('shotHitsExtra', s, sb);
  }
  S.shots = S.shots.filter(s => s.life > 0);
}
// enemy shots / blobs (bosses): fly with gravity, hurt Kai; some leave a puddle on the ground
function updateEShots(dt) {
  const kb = kaiBox();
  for (const s of S.eshots) {
    s.vy += (s.g ?? 0.2) * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life = (s.life ?? 400) - dt; s.rot = (s.rot || 0) + 0.1 * dt;
    if (overlap(kb, { x1: s.x - s.r, x2: s.x + s.r, y1: s.y - s.r, y2: s.y + s.r })) { s.life = 0; burst(s.x, s.y, s.col || '#888', 10, 3); hurt(s.x); continue; }
    if (s.y >= FLOOR - 2 && groundAt(s.x) && s.vy > 0) {
      s.life = 0; burst(s.x, FLOOR - 4, s.col || '#888', 8, 3); Audio.play('slime');
      if (s.puddle) S.puddles.push({ x: s.x, w: s.puddle, t: 0, life: 260, col: s.col });
    }
  }
  S.eshots = S.eshots.filter(s => s.life > 0 && s.y < FLOOR + 400);
}
function updatePuddles(dt) {
  const k = S.kai;
  for (const p of S.puddles) {
    p.t += dt;
    if (p.t > 20 && p.t < p.life - 20 && k.ground && !k.platform && !k.flip && Math.abs(k.x - p.x) < p.w / 2 + 6) hurt(p.x + (k.x < p.x ? 60 : -60));
  }
  S.puddles = S.puddles.filter(p => p.t < p.life);
}

// ---------------- pickups ----------------
function updatePickups() {
  const k = S.kai, kb = kaiBox();
  for (const o of S.objects) {
    if (o.done) continue;
    if (Math.abs(o.x - k.x) > 100) continue;
    if (kb.x1 - o.r < o.x && kb.x2 + o.r > o.x && kb.y1 - o.r < o.y && kb.y2 + 8 > o.y) collect(o);
  }
}
function collect(o) {
  o.done = true;
  if (o.type === 'coin') { S.coins++; addScore(PTS.coin); burst(o.x, o.y, '#ffd23a', 6, 2.5); Audio.play('coin'); }
  if (o.type === 'heart') { S.hearts++; S.heartFlash = -30; burst(o.x, o.y, '#ff3b5c', 14, 3); Audio.play('chest'); flash('+1 HERZ', 50); }
  if (o.type === 'fruit') { S.fruits++; burst(o.x, o.y, '#ffb02e', 10, 3); Audio.play('chime'); flash('Mango! ({n})', 60, { n: S.fruits }); saveProgress(); }
}
function updateParticles(dt) {
  for (const p of S.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g ?? 0.18) * dt; p.life -= 0.03 * dt; }
  S.particles = S.particles.filter(p => p.life > 0);
}

// ---------------- places on the way: ask when Kai gets there ----------------
function updateSites() {
  const k = S.kai;
  if (EXIT_LEFT) {
    if (k.x > EXIT_LEFT.x + 200) S.asked.exit = false;
    if (!S.asked.exit && k.x < EXIT_LEFT.x + 10 && k.dir < 0 && k.ground && !k.platform && !k.flip && (!EXIT_LEFT.when || EXIT_LEFT.when())) {
      S.asked.exit = true; S.ask = 'exit'; S.phase = 'ask'; k.vx = 0; k.dir = 0; Audio.play('chime'); return;
    }
  }
  for (const [id, x] of Object.entries(SITES)) {
    const gate = x + 120, d = Math.abs(k.x - gate);
    if (d > 300) { S.asked[id] = false; S.near[id] = false; }
    if (d < 60) S.near[id] = true;
    if (!S.asked[id] && S.near[id] && k.ground && !k.flip && d < 300) {
      S.asked[id] = true;
      if (hook('siteReached', id) === false) continue;      // the world can say "not now"
      S.ask = id; S.phase = 'ask';
      k.vx = 0; k.dir = 0; Audio.play('chime');
    }
  }
}

// ---------------- panel buttons ----------------
const BTN = {
  start: { x: W / 2 - 110, y: 262, w: 220, h: 46 },
  yes: { x: W / 2 - 215, y: 238, w: 200, h: 44 }, no: { x: W / 2 + 15, y: 238, w: 200, h: 44 },
  goYes: { x: W / 2 - 215, y: 238, w: 210, h: 40 }, goNo: { x: W / 2 + 5, y: 238, w: 210, h: 40 },
  won1: { x: W / 2 - 250, y: 250, w: 240, h: 44 }, won2: { x: W / 2 + 10, y: 250, w: 240, h: 44 },
  music: { x: W - 252, y: 10, w: 34, h: 30 }, sfx: { x: W - 212, y: 10, w: 34, h: 30 },
  shopDone: { x: W / 2 - 90, y: H - 46, w: 180, h: 34 },
};
const GBTN = { next: { x: W / 2 - 110, y: 262, w: 220, h: 44 }, again: { x: W / 2 - 235, y: 262, w: 220, h: 44 }, next2: { x: W / 2 + 15, y: 262, w: 220, h: 44 } };
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
  if (hook('worldPointer', p, e)) return;
  if (S.phase === 'start') { beginWorld(); return; }
  if (S.phase === 'ask') {
    if (inRect(p, BTN.yes)) { const id = S.ask; S.ask = null; S.phase = 'play'; hook('worldAsk', id, true); }
    else if (inRect(p, BTN.no)) { const id = S.ask; S.ask = null; S.phase = 'play'; Audio.play('tink'); hook('worldAsk', id, false); }
    return;
  }
  if (S.phase === 'shop') { shopClick(p); return; }
  if (S.phase === 'gameover') { if (inRect(p, BTN.goYes)) resetGame(); else if (inRect(p, BTN.goNo)) { resetGame(); toMainMenu(); } return; }
  if (S.phase === 'won') { if (inRect(p, BTN.won1)) hook('wonButton', 1); else if (inRect(p, BTN.won2)) hook('wonButton', 2); return; }
});

// ---------------- the OXXO (only Aurora 61 has one: Abu sells there) ----------------
const shopList = () => SHOP.filter(forChar);
const SHOP_CARD = { cols: 5, w: 176, h: 104, gap: 10 };
SHOP_CARD.x0 = W - 24 - (SHOP_CARD.cols * SHOP_CARD.w + (SHOP_CARD.cols - 1) * SHOP_CARD.gap); SHOP_CARD.y0 = 52;
function shopCardRect(i) { const c = i % SHOP_CARD.cols, r = Math.floor(i / SHOP_CARD.cols); return { x: SHOP_CARD.x0 + c * (SHOP_CARD.w + SHOP_CARD.gap), y: SHOP_CARD.y0 + r * (SHOP_CARD.h + SHOP_CARD.gap), w: SHOP_CARD.w, h: SHOP_CARD.h }; }
function shopOwned(it) {
  if (it.kind === 'item') return !!SAVE.items[it.id];
  if (it.kind === 'cloth') return !!SAVE.owned[it.id];
  return false;
}
function openShop() { S.phase = 'shop'; Audio.play('buy'); S.shopMsg = tx(SHOP_HELLO); S.shopMsgT = 160; const k = S.kai; k.vx = 0; k.dir = 0; }
function shopClick(p) {
  if (inRect(p, BTN.shopDone)) { leaveShop(); return; }
  shopList().forEach((it, i) => {
    if (!inRect(p, shopCardRect(i))) return;
    const owned = shopOwned(it);
    if (owned && it.kind === 'cloth') { it.apply(SAVE.outfit); writeSave(); Audio.play('flip'); S.shopMsg = tx('Angezogen'); S.shopMsgT = 60; return; }
    if (owned) { S.shopMsg = tx('Schon gekauft'); S.shopMsgT = 60; return; }
    if (S.coins < it.price) { Audio.play('denied'); S.shopMsg = tx('Zu wenig Münzen!'); S.shopMsgT = 80; return; }
    S.coins -= it.price; spendCoins(it.price); Audio.play('buy'); S.shopMsg = tx(it.thanks || 'Gekauft!'); S.shopMsgT = 90;
    if (it.kind === 'item') { SAVE.items[it.id] = true; if (it.onBuy) it.onBuy(); }
    if (it.id === 'heart') { S.hearts++; S.heartFlash = -40; }
    if (it.id === 'mangos') { S.fruits += 3; }
    if (it.kind === 'cloth') { SAVE.owned[it.id] = true; it.apply(SAVE.outfit); }
    SAVE.coins = S.coins; SAVE.hearts = S.hearts; SAVE.fruits = S.fruits; writeSave();
  });
}
function leaveShop() {
  S.phase = 'play'; Audio.play('tink');
  const k = S.kai; k.x = SITES.oxxo + 320; k.dir = 0; k.vx = 0; k.face = 1;
  hook('afterShop');
}

function enter() { if (!SAVE['seen_' + WKEY] || hook('needStart')) { S.phase = 'start'; S.noHud = true; } else beginWorld(); }
function enterFromMenu() { S.noHud = S.phase === 'start' || S.phase === 'intro'; }
const TEST = {
  setX(x) { const k = S.kai; k.x = x; k.safeX = x; k.flip = !!flipZoneAt(x); k.y = k.flip ? CEIL : FLOOR; k.ground = k.flip ? ceilAt(x) : groundAt(x); k.platform = null; S.cam = clamp(x - W * 0.32, 0, BOSS_X); },
  startBoss() { TEST.setX(BOSS_X + 300); },
  coins(n) { S.coins = n; saveProgress(); },
  get S() { return S; },
  get say() { return SAY.list; },
};
buildWorld();
