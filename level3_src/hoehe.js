// =====================================================================
//  LEVEL 3 · WORLD 2 – DIE FELSENHÖHE (the upper world above the dino valley)
//  Reached by climbing a liana in the valley. Super-Mario-style rocks over deep gorges:
//  fixed ledges, moving rocks, crumbling rocks that fall away, small ground dinos (Kompsos),
//  flying pterosaurs and falling stones from the cliffs above.
//  Weapon: the STEINSCHLEUDER (shoot button on the right / X / right mouse button).
//  In the middle: the OXXO in a tree house (Magma-Board for the lava caves!) and the
//  Flugsaurier-Ritt mini game. End boss: the giant Flugsaurier-Mama.
// =====================================================================
const SPEED = 5.4, ACC = 0.24, BRAKE = 0.8, GRAV = 0.62, JUMP_V = -12.6, JUMP_CUT = -5.2;
const BOSS_X = 9400, MAP_END = BOSS_X + W;      // the boss arena is exactly one screen wide

// ---------------- the map ----------------
// solid ground of the plateau – between the pieces are deep gorges (falling in costs a heart)
const GROUND = [[0, 1080], [1250, 1900], [2300, 2950], [3350, 5300], [5550, 6150], [6450, 7000], [7500, 8300], [8600, MAP_END]];
// rocks Kai can stand on (one-way: jump through them from below, land on them from above)
//   kind 'rock'   = fixed
//   kind 'move'   = moves back and forth (ax = how far sideways, ay = how far up/down)
//   kind 'crumble'= starts to shake when Kai stands on it and then falls into the gorge (comes back later)
const PLATS = [
  { x: 600, y: 210, w: 160, kind: 'rock' }, { x: 830, y: 150, w: 130, kind: 'rock' },
  { x: 1480, y: 215, w: 170, kind: 'rock' },
  { x: 1960, y: 250, w: 110, kind: 'crumble' }, { x: 2140, y: 232, w: 110, kind: 'crumble' },
  { x: 2480, y: 212, w: 150, kind: 'rock' }, { x: 2690, y: 150, w: 130, kind: 'rock' },
  { x: 2975, y: 250, w: 120, kind: 'move', ax: 250, ay: 0, sp: 0.016 },
  { x: 3620, y: 210, w: 190, kind: 'rock' }, { x: 3860, y: 150, w: 120, kind: 'move', ax: 0, ay: 50, sp: 0.03 },
  { x: 4880, y: 205, w: 170, kind: 'rock' },
  { x: 5375, y: 255, w: 100, kind: 'move', ax: 0, ay: 70, sp: 0.024 },
  { x: 5680, y: 212, w: 150, kind: 'rock' }, { x: 5880, y: 150, w: 120, kind: 'rock' },
  { x: 6190, y: 248, w: 95, kind: 'crumble' }, { x: 6335, y: 228, w: 95, kind: 'crumble' },
  { x: 6680, y: 205, w: 170, kind: 'rock' },
  { x: 7030, y: 248, w: 115, kind: 'move', ax: 330, ay: 0, sp: 0.012 },
  { x: 8000, y: 212, w: 150, kind: 'rock' }, { x: 8170, y: 150, w: 120, kind: 'rock' },
  { x: 8335, y: 250, w: 90, kind: 'crumble' }, { x: 8460, y: 230, w: 90, kind: 'crumble' },
  { x: 8820, y: 210, w: 160, kind: 'rock' },
];
// small ground dinos (Kompsos): run back and forth, turn at gorges – jump on them or shoot them
const COMPY_PLAN = [[650, 1050], [1300, 1850], [2350, 2900], [3400, 4150], [4600, 5250], [5600, 6100], [6500, 6950], [7900, 8280], [8650, 9300]];
// pterosaurs: hover in the air and swoop down at Kai – jump on them or shoot them
const PTERO_PLAN = [[1300, 1850, 110], [2350, 2950, 90], [3400, 4050, 100], [4650, 5250, 105], [5600, 6150, 90], [6450, 7000, 100], [7050, 7500, 80], [7900, 8550, 110], [8700, 9300, 95]];
// overhanging cliffs: stones fall down while Kai rides underneath (a shadow shows where)
const STONE_ZONES = [[2350, 2900], [3700, 4150], [5600, 6100], [8650, 9250]];
const CHECKPOINTS = [3450, 6500];
const SITES = { oxxo: 4300, ptero: 7600 };      // tree house shop / pterosaur ride (gate = x + 120)
const LIANA_DOWN = 70;                           // the liana back down into the valley (left edge)

const S = {
  phase: 'start', t: 0, cam: 0, hearts: SAVE.hearts || LIFE_HEARTS, coins: SAVE.coins || 0,
  kai: { x: 200, y: FLOOR, vx: 0, vy: 0, dir: 0, face: 1, faceAnim: 1, ground: true, platform: null, inv: 0, pushT: 0, landT: 0, safeX: 200, jumpHeld: false, hurtT: 0, shootT: 0, climb: 0 },
  plats: [], objects: [], compys: [], pteros: [], stones: [], shots: [], particles: [],
  stoneT: 60, reload: 0,
  cpX: 200, msg: '', msgTimer: 0, heartFlash: 0, shake: 0,
  ask: null, asked: {}, boss: null, noHud: false, hideKai: false, game: null, shopMsg: '', shopMsgT: 0,
};
window.__S = S; window.__T = () => TEST; window.__V = () => [VH, DY, SAVE];

function buildWorld() {
  S.plats = PLATS.map(p => Object.assign({ x0: p.x, y0: p.y, ph: 0, state: 'idle', st: 0, vy: 0, dx: 0, dy: 0 }, p));
  S.compys = COMPY_PLAN.map(([a, b], i) => ({ x: (a + b) / 2, x1: a, x2: b, dir: i % 2 ? 1 : -1, t: rand(0, 100), dead: false, deadT: 0 }));
  S.pteros = PTERO_PLAN.map(([a, b, y], i) => ({ x: (a + b) / 2, x1: a, x2: b, hy: y, y, dir: i % 2 ? 1 : -1, t: rand(0, 200), state: 'fly', st: 0, dead: false, deadT: 0, vy: 0, cool: rand(60, 160) }));
  const o = [];
  const coin = (x, y) => o.push({ type: 'coin', x, y, r: 11, p: rand(0, 6) });
  const arc = (x, y, n, gap = 34, lift = 30) => { for (let i = 0; i < n; i++) coin(x + i * gap, y - Math.sin(i / Math.max(1, n - 1) * Math.PI) * lift); };
  for (const [a, b] of GROUND) for (let x = a + 140; x < Math.min(b, BOSS_X) - 160; x += 560) arc(x, FLOOR - 40, 5);
  for (let i = 0; i < GROUND.length - 1; i++) { const a = GROUND[i][1], b = GROUND[i + 1][0]; arc(a - 20, FLOOR - 120, 6, (b - a + 40) / 5, 50); }
  for (const p of PLATS) if (p.kind === 'rock') arc(p.x + 20, p.y - 34, Math.max(3, Math.floor(p.w / 45)), 38, 0);
  for (const [x, y] of [[895, 108], [3920, 60], [5940, 108], [8230, 108]]) o.push({ type: 'heart', x, y, r: 14, p: 0 });
  S.objects = o;
}
buildWorld();
// coming up the liana from the valley: Kai arrives at the start, on top of the cliff
if (QUERY.get('from') === 'tal') { S.kai.x = 200; S.cam = 0; }

// ---------------- helpers ----------------
const groundAt = x => GROUND.some(([a, b]) => x > a + 4 && x < b - 4);
function burst(x, y, color, n, speed = 4) { for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), v = rand(1, speed); S.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, r: rand(2, 4.5), color, life: 1, g: 0.18 }); } }
function flash(text, f = 80) { S.msg = tx(text); S.msgTimer = f; }
const kaiBox = () => { const k = S.kai; return { x1: k.x - 26, x2: k.x + 26, y1: k.y - 108, y2: k.y - 4 }; };
const overlap = (a, b) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
const compyBox = c => ({ x1: c.x - 28, x2: c.x + 28, y1: FLOOR - 50, y2: FLOOR });
const pteroBox = p => ({ x1: p.x - 40, x2: p.x + 40, y1: p.y - 18, y2: p.y + 20 });
const playing = () => S.phase === 'play' || S.phase === 'boss';
const isTouchDev = () => CTRL.touch;

// ---------------- control (called by the controller) ----------------
function steerDir(d) {
  const k = S.kai; if (!playing()) return;
  k.dir = d;
  if (k.hurtT <= 0 && Math.sign(k.vx) === -d) k.vx = 0;      // turn at once, no sliding
  if (d !== k.face) { k.face = d; Audio.play('flip'); }
}
function steerBrake() {
  const k = S.kai; if (!playing()) return;
  k.dir = 0; Audio.play('swish');
  // at the liana on the left edge: ↓ = climb back down into the valley
  if (S.phase === 'play' && k.ground && Math.abs(k.x - LIANA_DOWN) < 50) climbDown();
}
// arrow let go: Kai stops (a short roll-out of a few pixels, no sliding like on ice)
function steerStop() { const k = S.kai; if (!playing()) return; k.dir = 0; }
function steerJump(down) {
  const k = S.kai;
  if (!playing()) return;
  if (down) {
    k.jumpHeld = true;
    if (k.ground || k.coyote > 0) { k.vy = JUMP_V; k.ground = false; k.platform = null; k.coyote = 0; Audio.play('jump'); }
  } else {
    k.jumpHeld = false;
    if (k.vy < JUMP_CUT) k.vy = JUMP_CUT;
  }
}
// the slingshot: a stone flies in an arc in the direction Kai looks. The Super-Schleuder shoots two at once, faster.
const superSling = () => !!SAVE.items.sling2 && SAVE.weapon.hoehe !== 'sling';
function shoot() {
  const k = S.kai;
  if (!playing() || !SAVE.items.slingshot || S.reload > 0) return;
  S.reload = superSling() ? 13 : 24; k.shootT = 14;
  // a flat shot at hip height: it hits the small Kompsos on the ground as well as a landed Mama
  const x = k.x + k.face * 30, y = k.y - 48, vx = k.face * 11 + k.vx * 0.5;
  S.shots.push({ x, y, vx, vy: -0.8, life: 90 });
  if (superSling()) S.shots.push({ x, y: y - 6, vx: vx * 0.95, vy: -3.6, life: 90 });
  Audio.play('throwit');
}
const CTL = {
  steer: true,
  active: playing,
  showJump: playing,
  canShoot: () => playing() && !!SAVE.items.slingshot, shoot, auto: true, icon: 'sling',
  dir: steerDir, brake: steerBrake, jump: steerJump, stop: steerStop,
};

// keyboard: ← → ride, ↓ brake (at the liana: climb down), Space / ↑ jump, X shoot
window.addEventListener('keydown', e => {
  if (CUR !== ME || TRANS || PAUSE.on || INV.open || MENU.open) return;
  if (S.phase === 'start' && (e.code === 'Space' || e.code === 'Enter')) { beginWorld(); return; }
  if (!playing()) { gameKey(e); return; }
  if (e.code === 'KeyX') { shoot(); return; }
  if (e.repeat) return;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') steerBrake();
  else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); steerJump(true); }
});
window.addEventListener('keyup', e => {
  if (CUR !== ME) return;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { steerJump(false); gameKeyUp(e); }
});

// ---------------- start / checkpoints ----------------
function beginWorld() {
  const cont = QUERY.get('from') === 'continue' && SAVE.cpH;
  S.phase = 'play'; S.noHud = false; SAVE.started = true; SAVE.seenHoehe = true;
  S.hearts = SAVE.hearts || LIFE_HEARTS; S.coins = SAVE.coins || 0;
  const k = S.kai;
  if (QUERY.get('from') !== 'tal' || S.begun) { k.x = cont ? SAVE.cpH : 200; }
  k.y = FLOOR; k.vy = 0; k.vx = 0; k.dir = 0; k.face = 1; k.ground = true; k.platform = null; k.safeX = k.x;
  S.cpX = k.x; S.cam = clamp(k.x - W * 0.32, 0, BOSS_X); S.begun = true;
  if (QUERY.get('from') === 'tal' || !(SAVE.cps && SAVE.cps.hoehe)) setCheckpoint('hoehe'); else useCheckpoint('hoehe');
  writeSave(); Audio.init(); Audio.setTheme('hoehe');
  if (!SAVE.items.slingshot) {
    SAVE.items.slingshot = true; writeSave();
    flash(isTouchDev() ? 'Du hast eine STEINSCHLEUDER! Schuss-Taste rechts unten.' : 'Du hast eine STEINSCHLEUDER! Schießen: X oder rechte Maustaste.', 220);
    Audio.play('chest');
  } else flash('DIE FELSENHÖHE', 110);
}
function saveProgress() { SAVE.hearts = S.hearts; SAVE.coins = S.coins; writeSave(); }
function reachCheckpoint(x) {
  if (x <= S.cpX) return;
  S.cpX = x; SAVE.cpH = x; saveProgress(); setCheckpoint('hoehe');
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
  k.vy = -6; k.vx = (k.x < srcX ? -1 : 1) * 5; k.ground = false; k.platform = null;
  Audio.play('crash');
  loseHeart();
  saveProgress();
  return true;
}
function fallInGorge() {
  const k = S.kai;
  Audio.play('crash'); S.shake = 6;
  if (!loseHeart()) return;
  flash('Abgestürzt!', 70);
  k.x = k.safeX; k.y = FLOOR; k.vy = 0; k.vx = 0; k.dir = 0; k.ground = true; k.platform = null; k.inv = 80;
  saveProgress();
}
function resetGame() {
  restartWorldSave();
  S.hearts = SAVE.hearts || LIFE_HEARTS; S.coins = SAVE.coins || 0;
  buildWorld(); S.stones = []; S.shots = []; S.boss = null; Audio.setBoss(false);
  const k = S.kai; k.x = SAVE.cpH || 200; k.y = FLOOR; k.vx = 0; k.vy = 0; k.dir = 0; k.face = 1; k.inv = 60; k.ground = true; k.platform = null; k.safeX = k.x;
  S.cpX = k.x; S.cam = clamp(k.x - W * 0.32, 0, BOSS_X);
  S.phase = 'play';
}
// the liana back down into the valley
function climbDown() {
  const k = S.kai;
  k.x = LIANA_DOWN; k.vx = 0; k.dir = 0; S.phase = 'climb'; S.climbT = 0; Audio.play('swish');
}

// ---------------- update ----------------
function update(dt) {
  S.t += dt;
  if (S.msgTimer > 0) S.msgTimer -= dt;
  if (S.heartFlash > 0) S.heartFlash -= dt;
  if (S.shopMsgT > 0) S.shopMsgT -= dt;
  if (S.shake > 0) S.shake = Math.max(0, S.shake - 0.5 * dt);
  updateParticles(dt);
  for (const o of S.objects) o.p += 0.05 * dt;
  if (S.phase === 'ride') { updateRide(dt); return; }
  if (S.phase === 'shop' || S.phase === 'ask') return;
  if (S.phase === 'climb') {
    // climbing down the liana: Kai sinks over the edge, then the camera follows him down into the valley
    S.climbT += dt; S.kai.y += 2.2 * dt;
    if (S.climbT > 40 && !S.leaving) { S.leaving = true; saveProgress(); goToWorld('tal.html', 'from=hoehe'); }
    return;
  }
  if (!playing()) { if (S.phase === 'won') updateBossDead(dt); return; }
  if (S.reload > 0) S.reload -= dt;
  updatePlats(dt);
  updateKai(dt);
  updateCompys(dt);
  updatePteros(dt);
  updateStones(dt);
  updateShots(dt);
  updatePickups();
  updateSites();
  if (S.phase === 'boss' || (!S.boss && S.kai.x > BOSS_X + 240)) updateBoss(dt);
  for (const x of CHECKPOINTS) if (S.kai.x > x) reachCheckpoint(x);
  const k = S.kai;
  if (S.boss) S.cam += (BOSS_X - S.cam) * Math.min(1, 0.08 * dt);
  else {
    // like Super Mario: Kai rides freely in the middle, the camera only follows at the edges of that zone
    const L = W * 0.32, R = W * 0.5, sx = k.x - S.cam;
    let target = S.cam;
    if (sx > R) target = k.x - R; else if (sx < L) target = k.x - L;
    target = clamp(target, 0, BOSS_X);
    if (Math.abs(target - S.cam) > 40) S.cam += (target - S.cam) * Math.min(1, 0.12 * dt);
    else S.cam = target;
  }
}

// rocks: moving ones swing back and forth, crumbling ones shake and then fall
function updatePlats(dt) {
  for (const p of S.plats) {
    const ox = p.x, oy = p.y;
    if (p.kind === 'move') {
      p.ph += p.sp * dt;
      p.x = p.x0 + (1 - Math.cos(p.ph)) / 2 * p.ax;
      p.y = p.y0 - (1 - Math.cos(p.ph)) / 2 * p.ay;
    } else if (p.kind === 'crumble') {
      if (p.state === 'shake') { p.st += dt; if (p.st > 34) { p.state = 'fall'; p.vy = 1; Audio.play('clank'); burst(p.x + p.w / 2, p.y, '#9c8466', 8, 3); } }
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
  const target = k.dir * SPEED * (S.phase === 'boss' ? 1.05 : 1);
  if (k.hurtT <= 0) {
    if (k.dir === 0) { const s = Math.sign(k.vx); k.vx -= s * Math.min(Math.abs(k.vx), BRAKE * dt); }
    else k.vx += clamp(target - k.vx, -ACC * dt * (k.ground ? 1 : 0.7), ACC * dt * (k.ground ? 1 : 0.7));
  }
  // standing on a moving rock: carried along
  if (k.platform) k.x += k.platform.dx;
  let nx = k.x + k.vx * dt;
  const minX = S.boss ? BOSS_X + 40 : 30, maxX = MAP_END - 40;
  if (nx < minX) { nx = minX; k.vx = 0; } if (nx > maxX) { nx = maxX; k.vx = 0; }
  if (k.y > FLOOR + 6 && groundAt(nx) && !groundAt(k.x)) { nx = k.x; k.vx = 0; }   // fallen into a gorge: the cliff walls are solid
  k.x = nx;
  if (k.ground && Math.abs(k.vx) < Math.abs(target) - 0.3) k.pushT = (k.pushT + dt) % 40; else if (k.pushT > 0 && k.pushT < 34) k.pushT += dt; else k.pushT = 0;
  if (k.ground && k.platform) {
    const pl = k.platform;
    if (!platSolid(pl) || k.x < pl.x - 18 || k.x > pl.x + pl.w + 18) { k.ground = false; k.platform = null; k.coyote = 6; }
    else {
      k.y = pl.y;
      if (pl.kind === 'crumble' && pl.state === 'idle') { pl.state = 'shake'; pl.st = 0; Audio.play('tink'); }
    }
  } else if (k.ground) {
    if (!groundAt(k.x)) { k.ground = false; k.coyote = 6; }
  }
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
      if (!k.ground && k.y >= FLOOR && prevY <= FLOOR + 2 && groundAt(k.x)) landOn(null, FLOOR);
      if (!k.ground && k.y > FLOOR + 260) fallInGorge();
    }
  }
  // a safe spot to come back to after a fall: firm ground, not right at a gorge
  if (k.ground && !k.platform && groundAt(k.x - 80) && groundAt(k.x + 80)) k.safeX = k.x;
}
function landOn(pl, top) {
  const k = S.kai;
  k.y = top; k.vy = 0; k.ground = true; k.platform = pl; k.landT = 8;
  Audio.play('land');
}

// ---------------- enemies ----------------
function stompBounce(top) {
  const k = S.kai;
  k.y = top; k.vy = k.jumpHeld ? JUMP_V * 0.95 : -9; k.ground = false; k.platform = null; k.coyote = 0;
  S.shake = Math.max(S.shake, 3);
}
function updateCompys(dt) {
  const k = S.kai, kb = kaiBox();
  for (const c of S.compys) {
    if (c.dead) { c.deadT += dt; continue; }
    if (Math.abs(c.x - k.x) > 1400) continue;
    c.t += dt;
    c.x += c.dir * 1.9 * dt;
    // turn at the bounds and before a gorge (they never fall in)
    if (c.x < c.x1 || !groundAt(c.x - 30)) { c.x = Math.max(c.x, c.x1); c.dir = 1; }
    if (c.x > c.x2 || !groundAt(c.x + 30)) { c.x = Math.min(c.x, c.x2); c.dir = -1; }
    const cb = compyBox(c);
    if (!overlap(kb, cb)) continue;
    if (k.vy > 0 && (k.prevY ?? k.y) <= cb.y1 + 16) { killCompy(c); stompBounce(cb.y1); }
    else hurt(c.x);
  }
}
function killCompy(c) { c.dead = true; c.deadT = 0; Audio.play('stomp'); burst(c.x, FLOOR - 24, '#f0c64a', 12, 4); }
function updatePteros(dt) {
  const k = S.kai, kb = kaiBox();
  for (const p of S.pteros) {
    if (p.dead) { p.deadT += dt; p.vy += 0.4 * dt; p.y += p.vy * dt; continue; }
    if (Math.abs(p.x - k.x) > 1400) continue;
    p.t += dt;
    if (p.state === 'fly') {
      p.x += p.dir * 1.6 * dt;
      if (p.x < p.x1) { p.x = p.x1; p.dir = 1; } if (p.x > p.x2) { p.x = p.x2; p.dir = -1; }
      p.y += ((p.hy + Math.sin(p.t * 0.05) * 16) - p.y) * Math.min(1, 0.08 * dt);
      p.cool -= dt;
      // Kai below and in front of it: it screeches and swoops down
      const dx = k.x - p.x;
      if (p.cool <= 0 && Math.abs(dx) < 330 && Math.abs(dx) > 60 && S.phase === 'play') {
        p.state = 'warn'; p.st = 0; p.dir = Math.sign(dx); Audio.play('bark');
      }
    } else if (p.state === 'warn') {
      p.st += dt; p.y -= 0.6 * dt;                                // pulls up a little, then dives
      if (p.st > 30) { p.state = 'dive'; p.st = 0; p.sx = p.x; p.sy = p.y; p.tx = k.x + k.vx * 26; }
    } else if (p.state === 'dive') {
      // a curve down to about Kai's head height and up again on the other side
      p.st += dt; const u = Math.min(1, p.st / 70), ex = p.sx + (p.tx - p.sx) * 2;
      p.x = p.sx + (ex - p.sx) * u;
      p.y = p.sy + (FLOOR - 66 - p.sy) * Math.sin(u * Math.PI);
      p.dir = Math.sign(ex - p.sx) || p.dir;
      if (u >= 1) { p.state = 'fly'; p.cool = rand(150, 260); p.x1 = Math.min(p.x1, p.x - 200); p.x2 = Math.max(p.x2, p.x + 200); }
    }
    const pb = pteroBox(p);
    if (!overlap(kb, pb)) continue;
    if (k.vy > 0 && (k.prevY ?? k.y) <= pb.y1 + 18) { killPtero(p); stompBounce(pb.y1); }
    else hurt(p.x);
  }
}
function killPtero(p) { p.dead = true; p.deadT = 0; p.vy = -3; Audio.play('stomp'); burst(p.x, p.y, '#e9a0c8', 12, 4); }

// ---------------- falling stones from the cliffs above ----------------
function updateStones(dt) {
  const k = S.kai;
  const zone = STONE_ZONES.find(([a, b]) => k.x > a - 100 && k.x < b + 100);
  if (zone && S.phase === 'play') {
    S.stoneT -= dt;
    if (S.stoneT <= 0) {
      S.stoneT = rand(70, 120);
      const x = clamp(k.x + k.vx * 34 + rand(-90, 90), zone[0], zone[1]);
      S.stones.push({ x, y: -DY - 40, vy: 1.5, r: rand(14, 20), rot: 0, done: false });
      Audio.play('swish');
    }
  } else S.stoneT = Math.max(S.stoneT, 40);
  for (const s of S.stones) {
    s.vy += 0.32 * dt; s.y += s.vy * dt; s.rot += 0.12 * dt;
    // hits Kai?
    if (!s.done && Math.abs(s.x - k.x) < 26 + s.r * 0.6 && s.y + s.r > k.y - 108 && s.y - s.r < k.y - 4) { s.done = true; burst(s.x, s.y, '#8a7a66', 12, 4); hurt(s.x); }
    // lands on the ground / a rock and breaks
    if (!s.done && s.y + s.r >= FLOOR && groundAt(s.x)) { s.done = true; burst(s.x, FLOOR - 6, '#9c8466', 14, 4); Audio.play('land'); S.shake = Math.max(S.shake, 3); }
    if (s.y > FLOOR + 500) s.done = true;
  }
  S.stones = S.stones.filter(s => !s.done);
}

// ---------------- slingshot stones ----------------
function updateShots(dt) {
  for (const s of S.shots) {
    s.vy += 0.09 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.y > FLOOR && groundAt(s.x)) { s.life = 0; burst(s.x, FLOOR - 3, '#9c8466', 4, 2); continue; }
    for (const c of S.compys) if (!c.dead && overlap({ x1: s.x - 6, x2: s.x + 6, y1: s.y - 6, y2: s.y + 6 }, compyBox(c))) { killCompy(c); s.life = 0; break; }
    if (s.life <= 0) continue;
    for (const p of S.pteros) if (!p.dead && overlap({ x1: s.x - 6, x2: s.x + 6, y1: s.y - 6, y2: s.y + 6 }, pteroBox(p))) { killPtero(p); s.life = 0; break; }
    if (s.life > 0 && S.boss) shotHitsBoss(s);
  }
  S.shots = S.shots.filter(s => s.life > 0);
}

// ---------------- pickups ----------------
function updatePickups() {
  const k = S.kai, kb = kaiBox();
  for (const o of S.objects) {
    if (o.done) continue;
    if (Math.abs(o.x - k.x) > 90) continue;
    if (kb.x1 - o.r < o.x && kb.x2 + o.r > o.x && kb.y1 - o.r < o.y && kb.y2 + 8 > o.y) {
      o.done = true;
      if (o.type === 'coin') { S.coins++; burst(o.x, o.y, '#ffd23a', 6, 2.5); Audio.play('coin'); }
      if (o.type === 'heart') { S.hearts++; S.heartFlash = -30; burst(o.x, o.y, '#ff3b5c', 14, 3); Audio.play('chest'); flash('+1 HERZ', 50); }
    }
  }
}
function updateParticles(dt) {
  for (const p of S.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g ?? 0.18) * dt; p.life -= 0.03 * dt; }
  S.particles = S.particles.filter(p => p.life > 0);
}

// ---------------- the OXXO and the pterosaur ride: ask on the way ----------------
function updateSites() {
  const k = S.kai;
  // riding left against the liana at the cliff edge: ask whether Kai wants to climb down
  if (k.x > 260) S.asked.down = false;
  if (!S.asked.down && k.x < LIANA_DOWN + 10 && k.dir < 0 && k.ground && !k.platform) {
    S.asked.down = true; S.ask = 'down'; S.phase = 'ask'; k.vx = 0; k.dir = 0; Audio.play('chime'); return;
  }
  for (const [id, x] of Object.entries(SITES)) {
    const gate = x + 120;
    if (Math.abs(k.x - gate) > 400) S.asked[id] = false;
    if (!S.asked[id] && Math.abs(k.x - gate) < 30 && k.ground && !k.platform) {
      S.asked[id] = true; S.ask = id; S.phase = 'ask';
      k.vx = 0; k.dir = 0; Audio.play('chime');
    }
  }
}

// ---------------- panel buttons ----------------
const BTN = {
  start: { x: W / 2 - 110, y: 250, w: 220, h: 46 },
  yes: { x: W / 2 - 215, y: 228, w: 200, h: 44 }, no: { x: W / 2 + 15, y: 228, w: 200, h: 44 },
  goYes: { x: W / 2 - 215, y: 228, w: 210, h: 40 }, goNo: { x: W / 2 + 5, y: 228, w: 210, h: 40 },
  down: { x: W / 2 - 250, y: 236, w: 240, h: 44 }, menu: { x: W / 2 + 10, y: 236, w: 240, h: 44 },
  music: { x: W - 252, y: 10, w: 34, h: 30 }, sfx: { x: W - 212, y: 10, w: 34, h: 30 },
  shopDone: { x: W / 2 - 90, y: H - 46, w: 180, h: 34 },
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
    if (inRect(p, BTN.yes)) { const id = S.ask; S.ask = null; if (id === 'oxxo') openShop(); else if (id === 'down') { S.phase = 'play'; climbDown(); } else startRide(); }
    else if (inRect(p, BTN.no)) { S.ask = null; S.phase = 'play'; Audio.play('tink'); }
    return;
  }
  if (S.phase === 'shop') { shopClick(p); return; }
  if (S.phase === 'ride') { ridePointer(p, e.pointerId); return; }
  if (S.phase === 'gameover') { if (inRect(p, BTN.goYes)) resetGame(); else if (inRect(p, BTN.goNo)) { resetGame(); toMainMenu(); } return; }
  if (S.phase === 'won') { if (inRect(p, BTN.down)) { saveProgress(); goToWorld('tal.html', 'from=hoehe'); } else if (inRect(p, BTN.menu)) toMainMenu(); return; }
});

// first time up here: the start panel explains the new things; afterwards straight into the game
function enter() { if (!SAVE.seenHoehe) { S.phase = 'start'; S.noHud = true; } else beginWorld(); }
function enterFromMenu() { S.noHud = S.phase === 'start'; }
const TEST = {
  setX(x) { const k = S.kai; k.x = x; k.safeX = x; k.y = FLOOR; k.ground = groundAt(x); k.platform = null; S.cam = clamp(x - W * 0.32, 0, BOSS_X); },
  startBoss() { TEST.setX(BOSS_X + 300); },
  ride() { startRide(); }, shop() { openShop(); },
};
