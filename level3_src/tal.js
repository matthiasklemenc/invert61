// =====================================================================
//  LEVEL 3 · WORLD 1 – DAS DINO-TAL
//  Free movement like Super Mario: the board keeps rolling in the chosen direction,
//  hold ◀ / ▶ (or the arrow keys) = ride, let go = stop, jump button / Space jumps.
//  The valley is a fixed map (not random): Kai rides through it, the camera follows.
//  Dinos walk back and forth (do not touch!), volcanoes in the back throw fireballs
//  that come closer in an arc (a shadow shows where they land), tar pits swallow you.
//  Mini games: Dino-Rodeo and Fossilien ausgraben. End boss: the T-Rex.
// =====================================================================
const SPEED = 5.4, ACC = 0.24, BRAKE = 0.8, GRAV = 0.62, JUMP_V = -12.6, JUMP_CUT = -5.2;
const BOSS_X = 12600, ARENA_W = W, MAP_END = BOSS_X + ARENA_W;   // the boss arena is exactly one screen wide

// ---------------- the map ----------------
// ground: everything is ground except the tar pits
const TAR = [[1720, 1890], [3900, 4040], [5600, 5800], [6650, 6800], [9050, 9260], [10900, 11080]];
// one-way ledges (rock ledges and fallen tree trunks): land on them from above
const LEDGES = [
  { x: 1650, y: 210, w: 300, kind: 'rock' }, { x: 2350, y: 220, w: 160, kind: 'log' }, { x: 2560, y: 160, w: 160, kind: 'log' },
  { x: 3850, y: 215, w: 240, kind: 'rock' }, { x: 5100, y: 225, w: 180, kind: 'log' }, { x: 5560, y: 205, w: 280, kind: 'rock' },
  { x: 6600, y: 210, w: 250, kind: 'rock' }, { x: 7480, y: 220, w: 170, kind: 'log' }, { x: 7700, y: 165, w: 170, kind: 'log' },
  { x: 7920, y: 115, w: 200, kind: 'rock' }, { x: 9000, y: 205, w: 300, kind: 'rock' }, { x: 10120, y: 220, w: 180, kind: 'log' },
  { x: 10850, y: 210, w: 270, kind: 'rock' }, { x: 11700, y: 225, w: 160, kind: 'log' },
];
// boulders: solid – jump over or onto them
const ROCKS = [{ x: 1180, w: 70, h: 44 }, { x: 3050, w: 90, h: 58 }, { x: 4700, w: 70, h: 44 }, { x: 6250, w: 110, h: 70 }, { x: 8700, w: 80, h: 50 }, { x: 11420, w: 90, h: 56 }];
// dinos: patrol between x1 and x2
const DINO_PLAN = [
  { type: 'raptor', x1: 900, x2: 1500 },
  { type: 'trike', x1: 2100, x2: 2900 },
  { type: 'brachio', x1: 3150, x2: 3700 },
  { type: 'stego', x1: 4300, x2: 4900 },
  { type: 'raptor', x1: 5000, x2: 5500 }, { type: 'raptor', x1: 5050, x2: 5500 },
  { type: 'trike', x1: 6000, x2: 6550 },
  { type: 'brachio', x1: 7050, x2: 7450 },
  { type: 'stego', x1: 8250, x2: 8950 },
  { type: 'raptor', x1: 9400, x2: 10050 }, { type: 'raptor', x1: 9500, x2: 10050 },
  { type: 'trike', x1: 10250, x2: 10800 },
  { type: 'stego', x1: 11150, x2: 11650 },
  { type: 'raptor', x1: 11900, x2: 12400 },
];
const VOLCANOES = [700, 1500, 2350, 3300, 4300];   // in the volcano layer (moves at 0.35 × camera)
const VOLC_PAR = 0.35;
const CHECKPOINTS = [3500, 7000, 10300];
const SITES = { rodeo: 4400 - 0, fossil: 8100 };     // mini-game places (start of the corral / dig site)
// lianas hanging from the cliffs above: jump up, grab one and climb to the Felsenhöhe
const LIANAS = [2830, 8480], LIANA_BOTTOM = 120;

const S = {
  phase: 'start', t: 0, cam: 0, hearts: SAVE.hearts || LIFE_HEARTS, coins: SAVE.coins || 0,
  kai: { x: 160, y: FLOOR, vx: 0, vy: 0, dir: 0, face: 1, faceAnim: 1, ground: true, platform: null, inv: 0, pushT: 0, landT: 0, safeX: 160, jumpHeld: false, hurtT: 0 },
  objects: [], dinos: [], fireballs: [], particles: [], waves: [],
  volcT: VOLCANOES.map((_, i) => 80 + i * 70),
  cpX: 160, msg: '', msgTimer: 0, heartFlash: 0, shake: 0,
  ask: null, asked: {}, boss: null, noHud: false, hideKai: false,
};
window.__S = S; window.__T = () => TEST; window.__V = () => [VH, DY, SAVE];
// back down from the Felsenhöhe: Kai arrives at the foot of the liana
if (QUERY.get('from') === 'hoehe') { S.kai.x = LIANAS[0]; S.kai.safeX = LIANAS[0]; S.cam = clamp(LIANAS[0] - W * 0.4, 0, BOSS_X); S.lianaCool = 60; }

function resetDinos() {
  S.dinos = DINO_PLAN.map((d, i) => {
    const base = { trike: { w: 150, h: 78, sp: 1.1 }, stego: { w: 176, h: 96, sp: 0.7 }, raptor: { w: 74, h: 60, sp: 2.6 }, brachio: { w: 230, h: 120, sp: 0.55 } }[d.type];
    const o = Object.assign({ x: (d.x1 + d.x2) / 2 + (i % 2 ? 60 : -60), dir: i % 2 ? 1 : -1, vx: 0, state: 'walk', t: rand(0, 100), hop: 0,
      hp: d.type === 'raptor' ? 1 : 2, stun: 0, dead: false, deadT: 0 }, d, base);
    rockBlock(o);
    return o;
  });
}
// boulders are walls for the dinos too (like the Goombas in Super Mario): they bump into them and turn around
function rockBlock(d) {
  const hw = d.w / 2 - 10;
  for (const r of ROCKS) {
    if (d.x + hw > r.x && d.x - hw < r.x + r.w) {
      if (d.x < r.x + r.w / 2) { d.x = r.x - hw; d.dir = -1; } else { d.x = r.x + r.w + hw; d.dir = 1; }
      if (d.state === 'charge') d.state = 'walk';
      return true;
    }
  }
  return false;
}
// Kai lands on a dino from above: raptors are gone after 1 hit, the big ones after 2
function stomp(d) {
  const k = S.kai, top = dinoBox(d).y1;
  d.hp--; d.state = 'walk';
  k.y = top; k.vy = k.jumpHeld ? JUMP_V * 0.95 : -9; k.ground = false; k.platform = null; k.coyote = 0;
  burst(k.x, top, '#ffd23a', 10, 3.5);
  S.shake = Math.max(S.shake, 3);
  if (d.hp <= 0) { d.dead = true; d.deadT = 0; d.stun = 0; Audio.play('stomp'); burst(d.x, top + 10, '#fbf3df', 12, 4); }
  else { d.stun = 75; Audio.play('boing'); }
}
function buildObjects() {
  const o = [];
  const coin = (x, y) => o.push({ type: 'coin', x, y, r: 11, p: rand(0, 6) });
  const arc = (x, y, n, gap = 34, lift = 30) => { for (let i = 0; i < n; i++) coin(x + i * gap, y - Math.sin(i / Math.max(1, n - 1) * Math.PI) * lift); };
  // coins: on the ground, over gaps (jump arcs), on ledges
  for (let x = 500; x < BOSS_X - 200; x += 520) arc(x, FLOOR - 40, 5);
  for (const [a, b] of TAR) arc(a - 30, FLOOR - 90, 6, (b - a + 60) / 5, 60);
  for (const l of LEDGES) arc(l.x + 20, l.y - 34, Math.max(3, Math.floor(l.w / 50)), 40, 0);
  // hearts (a juicy fruit) – a few, some only up high
  for (const [x, y] of [[2640, 120], [6720, 170], [8020, 75], [11000, 170]]) o.push({ type: 'heart', x, y, r: 14, p: 0 });
  S.objects = o;
}
resetDinos(); buildObjects();

// ---------------- helpers ----------------
const isTarAt = x => TAR.some(([a, b]) => x > a + 6 && x < b - 6);
function burst(x, y, color, n, speed = 4) { for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), v = rand(1, speed); S.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, r: rand(2, 4.5), color, life: 1, g: 0.18 }); } }
function flash(text, f = 80) { S.msg = tx(text); S.msgTimer = f; }
const kaiBox = () => { const k = S.kai; return { x1: k.x - 26, x2: k.x + 26, y1: k.y - 108, y2: k.y - 4 }; };
const overlap = (a, b) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
function dinoBox(d) {
  if (d.type === 'brachio') return { x1: d.x - 70, x2: d.x + 70, y1: FLOOR - 70, y2: FLOOR };   // only the legs/belly – the back is a platform
  return { x1: d.x - d.w / 2 + 8, x2: d.x + d.w / 2 - 8, y1: FLOOR - d.h - d.hop, y2: FLOOR - d.hop };
}
const brachioTop = d => FLOOR - 118;

// ---------------- control (called by the controller) ----------------
function steerDir(d) {
  const k = S.kai; if (!playing()) return;
  k.dir = d;
  // turning around: no sliding on like on ice – the old speed is gone at once, then he pushes off in the new direction
  if (k.hurtT <= 0 && Math.sign(k.vx) === -d) k.vx = 0;
  if (d !== k.face) { k.face = d; Audio.play('flip'); }
}
function steerBrake() { const k = S.kai; if (!playing()) return; k.dir = 0; Audio.play('swish'); }
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
    if (k.vy < JUMP_CUT) k.vy = JUMP_CUT;          // short tap = small hop, hold = big jump
  }
}
const playing = () => S.phase === 'play' || S.phase === 'boss';
const CTL = {
  steer: true,
  active: playing,
  showJump: playing,
  canShoot: () => false, shoot: () => {}, auto: false, icon: 'arrow',
  dir: steerDir, brake: steerBrake, jump: steerJump, stop: steerStop,
};

// keyboard: ← → ride, ↓ brake, Space / ↑ jump
window.addEventListener('keydown', e => {
  if (CUR !== ME || TRANS || PAUSE.on || INV.open || MENU.open) return;
  if (S.phase === 'start' && (e.code === 'Space' || e.code === 'Enter')) { beginWorld(); return; }
  if (!playing()) { gameKey(e); return; }
  if (e.repeat) return;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') steerBrake();
  else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); steerJump(true); }
});
window.addEventListener('keyup', e => {
  if (CUR !== ME) return;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') steerJump(false);
});

// ---------------- start / checkpoints ----------------
function beginWorld() {
  const cont = QUERY.get('from') === 'continue' && SAVE.cpX, fromH = QUERY.get('from') === 'hoehe' && !S.begun;
  S.phase = 'play'; S.noHud = false; SAVE.started = true;
  S.hearts = SAVE.hearts || LIFE_HEARTS; S.coins = SAVE.coins || 0;
  const k = S.kai; k.x = fromH ? LIANAS[0] : cont ? SAVE.cpX : 160; k.y = FLOOR; k.vy = 0; k.vx = 0; k.dir = 0; k.face = 1; k.ground = true; k.safeX = k.x;
  S.cpX = fromH ? Math.max(SAVE.cpX || 160, 160) : k.x; S.cam = clamp(k.x - W * (fromH ? 0.4 : 0.38), 0, BOSS_X); S.begun = true;
  if (fromH) { useCheckpoint('tal'); writeSave(); Audio.init(); Audio.setTheme('dino'); flash('Zurück im Dino-Tal!', 110); return; }
  if (!cont) setCheckpoint('tal');
  writeSave(); Audio.init(); Audio.setTheme('dino');
  flash(isTouchDev() ? 'Halte ▶ gedrückt – los geht\'s!' : 'Halte den Pfeil nach rechts – los geht\'s!', 150);
}
const isTouchDev = () => CTRL.touch;
function saveProgress() { SAVE.hearts = S.hearts; SAVE.coins = S.coins; writeSave(); }
function reachCheckpoint(x) {
  if (x <= S.cpX) return;
  S.cpX = x; SAVE.cpX = x; saveProgress(); setCheckpoint('tal');
  flash('CHECKPOINT!', 70); Audio.play('chime');
}

// ---------------- getting hurt ----------------
function hurt(srcX) {
  const k = S.kai;
  if (k.inv > 0 || !playing()) return false;
  S.hearts--; S.heartFlash = 30; k.inv = 100; k.hurtT = 24; S.shake = 8;
  k.vy = -6; k.vx = (k.x < srcX ? -1 : 1) * 5; k.ground = false; k.platform = null;
  Audio.play('crash');
  if (S.hearts <= 0) {
    if (loseLife()) { S.hearts = LIFE_HEARTS; flash('Ein Leben weniger! Weiter geht\'s.', 120); Audio.play('warn'); }
    else { S.hearts = 0; S.phase = 'gameover'; Audio.play('gameover'); Audio.setBoss(false); }
  }
  saveProgress();
  return true;
}
function fallInTar() {
  const k = S.kai;
  burst(k.x, FLOOR + 6, '#1b1b22', 18, 4); Audio.play('chomp');
  S.hearts--; S.heartFlash = 30; S.shake = 6;
  if (S.hearts <= 0) {
    if (loseLife()) { S.hearts = LIFE_HEARTS; flash('Ein Leben weniger! Weiter geht\'s.', 120); }
    else { S.hearts = 0; S.phase = 'gameover'; Audio.play('gameover'); saveProgress(); return; }
  } else flash('Igitt, Teer!', 70);
  // back to the last safe spot
  k.x = k.safeX; k.y = FLOOR; k.vy = 0; k.vx = 0; k.dir = 0; k.ground = true; k.platform = null; k.inv = 80;
  saveProgress();
}
function resetGame() {
  restartWorldSave();
  S.hearts = SAVE.hearts || LIFE_HEARTS; S.coins = SAVE.coins || 0;
  resetDinos(); buildObjects(); S.fireballs = []; S.waves = []; S.boss = null; Audio.setBoss(false);
  const k = S.kai; k.x = SAVE.cpX || 160; k.y = FLOOR; k.vx = 0; k.vy = 0; k.dir = 0; k.face = 1; k.inv = 60; k.ground = true; k.platform = null; k.safeX = k.x;
  S.phase = 'play';
}

// ---------------- update ----------------
function update(dt) {
  S.t += dt;
  if (S.msgTimer > 0) S.msgTimer -= dt;
  if (S.heartFlash > 0) S.heartFlash -= dt;
  if (S.shake > 0) S.shake = Math.max(0, S.shake - 0.5 * dt);
  updateParticles(dt);
  for (const o of S.objects) o.p += 0.05 * dt;
  if (S.phase === 'rodeo' || S.phase === 'fossil') { updateGame(dt); return; }
  if (S.phase === 'climb') {
    // climbing up the liana: Kai pulls himself up and out of the picture, then the camera follows him up
    S.climbT += dt; S.kai.y -= 2.6 * dt;
    if (S.climbT > 46 && !S.leaving) { S.leaving = true; saveProgress(); goToWorld('hoehe.html', 'from=tal'); }
    return;
  }
  if (!playing()) { if (S.phase === 'won') updateBossDead(dt); return; }
  updateKai(dt);
  updateLianas(dt);
  updateDinos(dt);
  updateVolcanoes(dt);
  updatePickups();
  updateSites();
  if (S.phase === 'boss' || (!S.boss && S.kai.x > BOSS_X + 260)) updateBoss(dt);
  for (const x of CHECKPOINTS) if (S.kai.x > x) reachCheckpoint(x);
  // camera: Kai a bit behind the middle in the direction he rides
  const k = S.kai;
  if (S.boss) S.cam += (BOSS_X - S.cam) * Math.min(1, 0.08 * dt);
  else {
    // like Super Mario: Kai moves freely inside a middle zone of the screen, the camera only follows
    // when he pushes against its edge – turning around never makes the whole screen slide
    const L = W * 0.32, R = W * 0.5, sx = k.x - S.cam;
    let target = S.cam;
    if (sx > R) target = k.x - R; else if (sx < L) target = k.x - L;
    target = clamp(target, 0, BOSS_X);
    if (Math.abs(target - S.cam) > 40) S.cam += (target - S.cam) * Math.min(1, 0.12 * dt);   // after a jump back (tar, checkpoint)
    else S.cam = target;
  }
}
function updateKai(dt) {
  const k = S.kai, prevY = k.y; k.prevY = prevY;
  if (k.inv > 0) k.inv -= dt;
  if (k.hurtT > 0) k.hurtT -= dt;
  if (k.landT > 0) k.landT -= dt;
  k.faceAnim += (k.face - k.faceAnim) * Math.min(1, 0.7 * dt);   // quick turn, no long squeeze
  // speed: rolls towards the chosen direction, brakes when stopped
  const target = k.dir * SPEED * (S.phase === 'boss' ? 1.05 : 1);
  if (k.hurtT <= 0) {
    if (k.dir === 0) { const s = Math.sign(k.vx); k.vx -= s * Math.min(Math.abs(k.vx), BRAKE * dt); }
    else k.vx += clamp(target - k.vx, -ACC * dt * (k.ground ? 1 : 0.7), ACC * dt * (k.ground ? 1 : 0.7));
  }
  // riding on a brachiosaurus: carried along
  if (k.platform && k.platform.dino) k.x += k.platform.dino.vx * dt;
  let nx = k.x + k.vx * dt;
  // boulders block from the side
  for (const r of ROCKS) {
    const top = FLOOR - r.h;
    if (k.y > top + 4 && nx + 20 > r.x && nx - 20 < r.x + r.w) {
      if (k.x <= r.x + r.w / 2) nx = r.x - 20; else nx = r.x + r.w + 20;
      k.vx = 0;
    }
  }
  // map edges and the boss arena walls
  const minX = S.boss ? BOSS_X + 40 : 40, maxX = S.boss ? MAP_END - 40 : MAP_END - 40;
  if (nx < minX) { nx = minX; k.vx = 0; } if (nx > maxX) { nx = maxX; k.vx = 0; }
  k.x = nx;
  // pushing animation while speeding up on the ground
  if (k.ground && Math.abs(k.vx) < Math.abs(target) - 0.3) k.pushT = (k.pushT + dt) % 40; else if (k.pushT > 0 && k.pushT < 34) k.pushT += dt; else k.pushT = 0;
  // gravity
  if (k.ground && k.platform) {
    // still on the ledge / rock / dino?
    const pl = k.platform;
    if (k.x < pl.x1() - 18 || k.x > pl.x2() + 18) { k.ground = false; k.platform = null; k.coyote = 6; }
    else k.y = pl.top();
  } else if (k.ground) {
    if (isTarAt(k.x)) { k.ground = false; k.coyote = 4; }
  }
  if (!k.ground) {
    if (k.coyote > 0) k.coyote -= dt;
    if (k.vy >= 0) k.jumpHeld = false;
    k.vy += GRAV * dt * (k.vy < 0 && !k.jumpHeld ? 1.6 : 1); k.y += k.vy * dt;
    if (k.vy > 0) {
      // landing on ledges, rocks, the brachiosaurus' back
      for (const pl of platformsNear(k.x)) {
        const top = pl.top();
        if (prevY <= top + 2 && k.y >= top && k.x > pl.x1() - 14 && k.x < pl.x2() + 14) { landOn(pl, top); break; }
      }
      if (!k.ground && k.y >= FLOOR) {
        if (isTarAt(k.x)) { if (k.y > FLOOR + 40) fallInTar(); }
        else landOn(null, FLOOR);
      }
    }
  }
  if (k.ground && !k.platform && !isTarAt(k.x - 70) && !isTarAt(k.x + 70)) k.safeX = k.x;
}
function landOn(pl, top) {
  const k = S.kai;
  k.y = top; k.vy = 0; k.ground = true; k.platform = pl; k.landT = 8;
  Audio.play('land');
}
// everything Kai can stand on (besides the ground)
function platformsNear(x) {
  const list = [];
  for (const l of LEDGES) if (x > l.x - 60 && x < l.x + l.w + 60) list.push({ x1: () => l.x, x2: () => l.x + l.w, top: () => l.y });
  for (const r of ROCKS) if (x > r.x - 60 && x < r.x + r.w + 60) list.push({ x1: () => r.x, x2: () => r.x + r.w, top: () => FLOOR - r.h });
  for (const d of S.dinos) if (d.type === 'brachio' && Math.abs(x - d.x) < 160) list.push({ dino: d, x1: () => d.x - 80, x2: () => d.x + 80, top: () => brachioTop(d) });
  return list;
}

function updateDinos(dt) {
  const k = S.kai, kb = kaiBox();
  for (const d of S.dinos) {
    if (d.dead) { d.deadT += dt; continue; }
    if (Math.abs(d.x - k.x) > 1500) continue;     // far away: asleep
    if (d.stun > 0) {                              // dizzy after the first hit: stands still
      d.stun -= dt; d.vx = 0;
      collideDino(d, kb);
      continue;
    }
    d.t += dt;
    let sp = d.sp;
    if (d.type === 'trike') {
      // charges when Kai is in front of it on the ground
      const ahead = (k.x - d.x) * d.dir;
      if (d.state === 'walk' && ahead > 0 && ahead < 420 && k.y > FLOOR - 60 && Math.random() < 0.03 * dt) { d.state = 'charge'; Audio.play('roar'); }
      if (d.state === 'charge') sp = 4.6;
    }
    if (d.type === 'raptor') { d.hop = Math.max(0, Math.sin(d.t * 0.12) * 10); }
    d.vx = d.dir * sp;
    d.x += d.vx * dt;
    if (d.x < d.x1) { d.x = d.x1; d.dir = 1; d.state = 'walk'; }
    if (d.x > d.x2) { d.x = d.x2; d.dir = -1; d.state = 'walk'; }
    rockBlock(d);
    collideDino(d, kb);
  }
}
function collideDino(d, kb) {
  if (d.type === 'brachio') return;                // the brachiosaurus is friendly
  const db = dinoBox(d), k = S.kai;
  if (!overlap(kb, db)) return;
  if (k.vy > 0 && (k.prevY ?? k.y) <= db.y1 + 18) stomp(d);   // coming down from above = jump on it
  else hurt(d.x);
}

// ---------------- volcanoes: fireballs come from the back in an arc ----------------
function volcScreenX(vx) { return vx - S.cam * VOLC_PAR; }
function updateVolcanoes(dt) {
  const k = S.kai;
  if (S.phase === 'boss') { S.volcT.fill(200); }
  VOLCANOES.forEach((vx, i) => {
    const sx = volcScreenX(vx);
    if (sx < 60 || sx > W - 60) return;
    S.volcT[i] -= dt;
    if (S.volcT[i] <= 0 && S.phase === 'play') {
      S.volcT[i] = rand(150, 240);
      // aim at where Kai will be, a little scattered – only at solid ground
      let tx = k.x + k.vx * 70 + rand(-90, 90);
      if (isTarAt(tx)) tx += 140;
      S.fireballs.push({ vi: i, tx, t: 0, T: 118, done: false });
      Audio.play('swish');
    }
  });
  for (const f of S.fireballs) {
    f.t += dt;
    if (!f.done && f.t >= f.T) {
      f.done = true;
      burst(f.tx, FLOOR - 6, '#ff7a1a', 22, 5); burst(f.tx, FLOOR - 6, '#ffd23a', 10, 3); S.shake = Math.max(S.shake, 5);
      Audio.play('lavahit');
      if (Math.abs(k.x - f.tx) < 52 && k.y > FLOOR - 70) hurt(f.tx);
    }
  }
  S.fireballs = S.fireballs.filter(f => !f.done);
}
// where a fireball is on the SCREEN (it comes from the volcano in the back towards the path)
function fireballPos(f) {
  const u = clamp(f.t / f.T, 0, 1), sx0 = volcScreenX(VOLCANOES[f.vi]), sy0 = FLOOR - 176;
  const sx1 = f.tx - S.cam, sy1 = FLOOR - 8;
  const x = sx0 + (sx1 - sx0) * u, y = sy0 + (sy1 - sy0) * u - Math.sin(u * Math.PI) * 220;
  return { x, y, s: 0.22 + u * 1.05, u };
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
  for (const w of S.waves) { w.x += w.vx * dt; w.life -= dt; }
  S.waves = S.waves.filter(w => w.life > 0 && w.x > BOSS_X - 40 && w.x < MAP_END + 40);
}

// ---------------- lianas up to the Felsenhöhe ----------------
function updateLianas(dt) {
  const k = S.kai;
  if (S.lianaCool > 0) { S.lianaCool -= dt; return; }
  if (S.phase !== 'play' || k.ground) return;
  for (const lx of LIANAS) {
    // hands reach the end of the liana while jumping → Kai grabs it and hangs there
    if (Math.abs(k.x - lx) < 32 && k.y - 112 < LIANA_BOTTOM) {
      k.x = lx; k.y = LIANA_BOTTOM + 112; k.vx = 0; k.vy = 0; k.dir = 0;
      S.ask = 'liana'; S.phase = 'ask'; Audio.play('swish');
      return;
    }
  }
}
function climbUp() { S.phase = 'climb'; S.climbT = 0; Audio.play('swish'); }
function letGo() { const k = S.kai; S.phase = 'play'; k.ground = false; k.platform = null; k.vy = 0; S.lianaCool = 70; Audio.play('tink'); }

// ---------------- mini-game places: ask on the way ----------------
function updateSites() {
  const k = S.kai;
  for (const [id, x] of Object.entries(SITES)) {
    const gate = x + 120;
    if (Math.abs(k.x - gate) > 400) S.asked[id] = false;            // re-arm when Kai has left
    if (!S.asked[id] && Math.abs(k.x - gate) < 30 && k.ground) {
      S.asked[id] = true; S.ask = id; S.phase = 'ask';
      k.vx = 0; k.dir = 0; Audio.play('chime');
    }
  }
}

// ---------------- panel buttons (start, ask, game over, won) ----------------
const BTN = {
  start: { x: W / 2 - 110, y: 236, w: 220, h: 46 },
  yes: { x: W / 2 - 215, y: 228, w: 200, h: 44 }, no: { x: W / 2 + 15, y: 228, w: 200, h: 44 },
  goYes: { x: W / 2 - 215, y: 228, w: 210, h: 40 }, goNo: { x: W / 2 + 5, y: 228, w: 210, h: 40 },
  menu: { x: W / 2 - 120, y: 236, w: 240, h: 44 }, up: { x: W / 2 - 250, y: 236, w: 240, h: 44 }, menu2: { x: W / 2 + 10, y: 236, w: 240, h: 44 },
  music: { x: W - 252, y: 10, w: 34, h: 30 }, sfx: { x: W - 212, y: 10, w: 34, h: 30 },
};
const inRect = (p, b) => b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
function toLogical(e) { const r = canvas.getBoundingClientRect(), sc = Math.min(r.width / W, r.height / VH); return { x: (e.clientX - r.left - (r.width - W * sc) / 2) / sc, y: (e.clientY - r.top - (r.height - VH * sc) / 2) / sc - DY }; }
canvas.addEventListener('pointerdown', e => {
  if (CUR !== ME || TRANS || MENU.open || CONFIRM.open) return;
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
    if (inRect(p, BTN.yes)) { const id = S.ask; S.ask = null; if (id === 'liana') climbUp(); else startGame(id); }
    else if (inRect(p, BTN.no)) { const id = S.ask; S.ask = null; if (id === 'liana') letGo(); else { S.phase = 'play'; Audio.play('tink'); } }
    return;
  }
  if (S.phase === 'rodeo' || S.phase === 'fossil') { gamePointer(p); return; }
  if (S.phase === 'gameover') { if (inRect(p, BTN.goYes)) resetGame(); else if (inRect(p, BTN.goNo)) { resetGame(); toMainMenu(); } return; }
  if (S.phase === 'won') { if (inRect(p, BTN.up)) { saveProgress(); goToWorld('hoehe.html', 'from=tal'); } else if (inRect(p, BTN.menu2)) toMainMenu(); return; }
});

function enter() { beginWorld(); }
function enterFromMenu() { S.noHud = S.phase === 'start'; }   // the start panel with the controls stays until tapped
const TEST = {
  setX(x) { const k = S.kai; k.x = x; k.safeX = x; S.cam = clamp(x - W * 0.36, 0, BOSS_X); },
  startBoss() { TEST.setX(BOSS_X + 300); },
  liana(i = 0) { const k = S.kai; TEST.setX(LIANAS[i]); k.ground = false; k.y = LIANA_BOTTOM + 100; k.vy = -1; },
  startGame(id) { startGame(id); },
};
