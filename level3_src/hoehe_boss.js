// =====================================================================
//  END BOSS: DIE RIESEN-FLUGSAURIER-MAMA
//  She circles above the arena. Whenever she flies over Kai she drops something from her claws:
//  a stone, or eggs – baby pterosaurs hatch from them and attack. The weaker she gets, the more eggs.
//  She swoops down low across the arena (jump over her or get away), and after two swoops she lands, tired.
//  EVERY slingshot hit takes energy off her (energy bar green → yellow → red); while she sits on the
//  ground a hit counts double. Energy 0 → she falls out of the sky / tips over.
// =====================================================================
const MAMA_HP = 100, HIT_AIR = 8, HIT_LANDED = 16;
function startBoss() {
  S.boss = { x: MAP_END + 200, y: 60, face: -1, hp: MAMA_HP, bar: 1, state: 'enter', t: 0, flap: 0, flash: 0, swoops: 0, drop: 60, rot: 0, sx: 0, sy: 0, tx: 0 };
  S.phase = 'boss'; S.stones = []; S.eggs = [];
  Audio.setBoss(true); Audio.play('bark'); S.shake = 8;
  flash('Die FLUGSAURIER-MAMA! Triff sie mit der Schleuder!', 200);
}
const mamaBox = b => b.state === 'landed' || b.state === 'dead'
  ? { x1: b.x - 70, x2: b.x + 70, y1: FLOOR - 120, y2: FLOOR - 4 }
  : { x1: b.x - 80, x2: b.x + 80, y1: b.y - 26, y2: b.y + 34 };
const weak = b => 1 - b.hp / MAMA_HP;          // 0 = full energy … 1 = almost beaten
function updateBoss(dt) {
  if (!S.boss) { startBoss(); return; }
  const b = S.boss, k = S.kai, lo = BOSS_X + 140, hi = MAP_END - 140, fast = weak(b);
  b.t += dt; b.flap += dt; if (b.flash > 0) b.flash -= dt;
  b.bar += (b.hp / MAMA_HP - b.bar) * Math.min(1, 0.1 * dt);
  updateEggs(dt);
  switch (b.state) {
    case 'enter':
      b.x -= 4 * dt; b.y += (80 - b.y) * 0.05 * dt;
      if (b.x <= hi) backToCircle(b);
      break;
    case 'circle': {
      // high up: a wide figure of eight over the arena
      b.ph += (0.018 + fast * 0.012) * dt; const u = b.ph, cx = BOSS_X + W / 2;
      const nx = cx + Math.sin(u) * (W / 2 - 170), ny = 78 + Math.sin(u * 2) * 26;
      b.face = Math.sign(nx - b.x) || b.face; b.x = nx; b.y += (ny - b.y) * Math.min(1, 0.1 * dt);
      // right above Kai: she lets something fall from her claws
      b.drop -= dt;
      if (b.drop <= 0 && Math.abs(b.x - k.x) < 70) {
        b.drop = 44 - fast * 14;
        if (Math.random() < 0.35 + fast * 0.35) dropEggs(b);
        else { S.stones.push({ x: b.x, y: b.y + 30, vy: 0.5, r: 16, rot: 0, done: false, fromMama: true }); Audio.play('swish'); }
      }
      if (b.t > 260 - fast * 60) { b.state = 'swoop'; b.t = 0; b.sx = b.x; b.sy = b.y; b.tx = k.x; Audio.play('bark'); }
      break;
    }
    case 'swoop': {
      // down to the ground through where Kai stood, and up again on the other side
      const T = 86 - fast * 20, u = Math.min(1, b.t / T), dirX = Math.sign(b.tx - b.sx) || -1;
      const ex = clamp(b.tx + dirX * 420, BOSS_X + 120, MAP_END - 120);
      b.x = b.sx + (ex - b.sx) * u; b.y = b.sy + (FLOOR - 52 - b.sy) * Math.sin(u * Math.PI);
      b.face = dirX;
      if (u >= 1) {
        b.swoops++; b.t = 0;
        if (b.swoops >= 2) { b.state = 'land'; b.swoops = 0; b.sx = b.x; b.sy = b.y; b.tx = k.x < BOSS_X + W / 2 ? hi - 60 : lo + 60; }
        else backToCircle(b);
      }
      break;
    }
    case 'land': {
      // glides down far away from Kai and lands
      const u = Math.min(1, b.t / 70);
      b.x = b.sx + (b.tx - b.sx) * u; b.y = b.sy + (FLOOR - 60 - b.sy) * (u * u);
      b.face = Math.sign(b.tx - b.sx) || b.face;
      if (u >= 1) { b.state = 'landed'; b.t = 0; b.face = Math.sign(k.x - b.x) || -1; Audio.play('land'); S.shake = 6; burst(b.x, FLOOR - 4, '#a9744a', 16, 4); flash('Sie ist gelandet – jetzt zählt jeder Treffer doppelt!', 100); }
      break;
    }
    case 'landed':
      b.face = Math.sign(k.x - b.x) || b.face;
      if (b.t > 230 - fast * 60) takeOff(b);
      break;
    case 'takeoff':
      b.y -= 3.4 * dt;
      if (b.y < 90) backToCircle(b);
      break;
    case 'falling':
      // beaten in the air: she tumbles down
      b.y += 5 * dt; b.x += b.face * 1.5 * dt;
      if (b.y >= FLOOR - 60) { b.y = FLOOR - 60; b.state = 'dead'; b.t = 0; S.shake = 10; burst(b.x, FLOOR - 4, '#a9744a', 20, 5); Audio.play('land'); }
      break;
    case 'dead':
      b.rot = Math.min(1.5, b.rot + 0.03 * dt);
      if (b.t > 110) winHeights();
      return;
  }
  // touching her hurts (also when she sits – she snaps)
  if (b.state !== 'dead' && b.state !== 'falling' && overlap(kaiBox(), mamaBox(b))) hurt(b.x);
}
// back up to circling: continue the figure of eight from where she is now (no jump)
function backToCircle(b) {
  b.state = 'circle'; b.t = 0;
  const s = clamp((b.x - (BOSS_X + W / 2)) / (W / 2 - 170), -1, 1); b.ph = b.face < 0 ? Math.PI - Math.asin(s) : Math.asin(s);
}
function takeOff(b) { b.state = 'takeoff'; b.t = 0; b.y = FLOOR - 60; Audio.play('flap'); Audio.play('bark'); }
// eggs from her claws: 1 at full energy, 2 when she is weaker, 3 at the end
function dropEggs(b) {
  const n = b.hp > MAMA_HP * 0.66 ? 1 : b.hp > MAMA_HP * 0.33 ? 2 : 3;
  for (let i = 0; i < n; i++) S.eggs.push({ x: b.x, y: b.y + 30, vx: (i - (n - 1) / 2) * 1.6, vy: 0.5, rot: 0, landed: false, t: 0 });
  Audio.play('pop');
}
function updateEggs(dt) {
  const k = S.kai;
  for (const e of S.eggs) {
    if (!e.landed) {
      e.vy += 0.3 * dt; e.y += e.vy * dt; e.x += e.vx * dt; e.rot += 0.08 * dt;
      // lands on Kai's head: ouch – and it breaks open
      if (Math.abs(e.x - k.x) < 30 && e.y > k.y - 112 && e.y - 22 < k.y - 4) { hurt(e.x); hatch(e); continue; }
      if (e.y >= FLOOR) { e.y = FLOOR; e.landed = true; e.t = 0; Audio.play('land'); }
    } else {
      e.t += dt;
      if (e.t > 50) hatch(e);
    }
  }
  S.eggs = S.eggs.filter(e => !e.done);
}
// a baby pterosaur flies out of the egg and attacks Kai
function hatch(e) {
  e.done = true; burst(e.x, e.y - 10, '#f6efd8', 10, 3); Audio.play('pop');
  S.pteros.push({ x: e.x, y: e.y - 20, x1: BOSS_X + 60, x2: MAP_END - 60, hy: rand(110, 160), dir: Math.sign(S.kai.x - e.x) || 1, t: 0, state: 'fly', st: 0, dead: false, deadT: 0, vy: 0, cool: rand(30, 90), baby: true });
}
// a slingshot stone reaches her: every hit counts, double while she sits on the ground
function shotHitsBoss(s) {
  const b = S.boss; if (!b || b.state === 'dead' || b.state === 'falling' || b.state === 'enter') return;
  if (!overlap({ x1: s.x - 6, x2: s.x + 6, y1: s.y - 6, y2: s.y + 6 }, mamaBox(b))) return;
  s.life = 0;
  const dmg = b.state === 'landed' ? HIT_LANDED : HIT_AIR;
  b.hp = Math.max(0, b.hp - dmg); b.flash = 14; S.shake = Math.max(S.shake, 4);
  burst(s.x, s.y, '#ffd23a', 12, 4); Audio.play('bossHit');
  if (b.hp <= 0) {
    // beaten: the babies fly away, she falls down (or tips over where she sits)
    for (const p of S.pteros) if (p.baby && !p.dead) { p.dead = true; p.deadT = 0; p.vy = -4; }
    S.eggs = [];
    flash('FLUGSAURIER-MAMA BESIEGT!', 100); Audio.play('bossDie');
    if (b.state === 'landed') { b.state = 'dead'; b.t = 0; } else { b.state = 'falling'; b.t = 0; }
  }
}
function winHeights() {
  if (S.phase === 'won') return;
  S.phase = 'won'; Audio.setBoss(false); Audio.play('win'); Audio.play('cheer');
  S.coins += 30; SAVE.done.hoehe = true; bossSummary('hoehe'); saveProgress();
  burst(S.kai.x, S.kai.y - 60, '#ffd23a', 40, 6);
}
function updateBossDead(dt) { if (S.boss) S.boss.t += dt; }
