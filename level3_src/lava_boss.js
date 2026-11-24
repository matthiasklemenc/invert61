// =====================================================================
//  LAVAHÖHLEN – THE TWO BOSSES
//  MIDDLE BOSS: MAGMA-ANKYLOSAURUS (arena in the middle of the cave, camera locked)
//    walks at Kai → curls up and rolls through the arena as a ball of fire (jump over it, it bounces off
//    the walls) → stops, glowing hot. A water bomb cools him down: his armour turns grey and soft – now
//    jump on him! Every water bomb also takes a little energy off him.
//  END BOSS: DER RIESENVULKAN (fills the right side of the last screen)
//    throws lava rocks in an arc (shadow = where they land), rolls lava waves over the floor (jump),
//    sends fire salamanders. When his crater glows wide open: a water bomb into it = a big hit.
//    Bombs on his slopes count a little too. Energy 0 → the fire goes out, he turns into a green hill.
// =====================================================================
const ANKY_HP = 100, VOLC_HP = 100;
const VOLC = { cx: BOSS_X + W - 230, craterY: 118, baseL: BOSS_X + W - 470 };   // crater centre, foot of the mountain
function updateFights(dt) {
  const k = S.kai;
  if (!S.fight && !S.ankyDone && k.x > MID_X + 200 && k.x < MID_X + W - 200) startAnky();
  if (!S.fight && k.x > BOSS_X + 240 && S.phase === 'play') startVolcano();
  if (S.fight === 'anky') updateAnky(dt);
  if (S.fight === 'volcano') updateVolcano(dt);
}

// ================= MAGMA-ANKYLOSAURUS =================
function startAnky() {
  S.fight = 'anky'; S.phase = 'boss';
  S.anky = { x: MID_X + W - 220, face: -1, hp: ANKY_HP, bar: 1, state: 'enter', t: 0, bounces: 0, flash: 0, rot: 0, walkT: 0 };
  Audio.setBoss(true); Audio.play('roar'); S.shake = 8;
  flash('Der MAGMA-ANKYLOSAURUS! Kühl ihn mit Wasserbomben ab und spring auf ihn drauf!', 220);
}
const ankyBox = a => a.state === 'roll' || a.state === 'curl'
  ? { x1: a.x - 44, x2: a.x + 44, y1: FLOOR - 88, y2: FLOOR }
  : { x1: a.x - 78, x2: a.x + 78, y1: FLOOR - 74, y2: FLOOR };
function updateAnky(dt) {
  const a = S.anky, k = S.kai, lo = MID_X + 90, hi = MID_X + W - 90;
  a.t += dt; if (a.flash > 0) a.flash -= dt;
  a.bar += (a.hp / ANKY_HP - a.bar) * Math.min(1, 0.1 * dt);
  const weak = 1 - a.hp / ANKY_HP;
  switch (a.state) {
    case 'enter': if (a.t > 60) { a.state = 'walk'; a.t = 0; } break;
    case 'walk':
      a.face = Math.sign(k.x - a.x) || a.face;
      a.x = clamp(a.x + a.face * (1.3 + weak) * dt, lo, hi); a.walkT += dt;
      if (a.t > 130 - weak * 40) { a.state = 'curl'; a.t = 0; Audio.play('roar'); }
      break;
    case 'curl': if (a.t > 30) { a.state = 'roll'; a.t = 0; a.bounces = 0; a.face = Math.sign(k.x - a.x) || a.face; Audio.play('grind'); } break;
    case 'roll':
      // a ball of fire: rolls fast, bounces off the walls twice
      a.x += a.face * (8 + weak * 3) * dt; a.rot += a.face * 0.3 * dt;
      if (Math.random() < 0.6 * dt) S.particles.push({ x: a.x + rand(-30, 30), y: FLOOR - rand(0, 20), vx: -a.face * rand(0.5, 2), vy: rand(-2, -0.5), r: rand(3, 6), color: Math.random() < 0.5 ? '#ff7a1a' : '#ffd23a', life: 0.9, g: 0.05 });
      if (a.x < lo) { a.x = lo; a.face = 1; a.bounces++; S.shake = 6; Audio.play('clank'); }
      if (a.x > hi) { a.x = hi; a.face = -1; a.bounces++; S.shake = 6; Audio.play('clank'); }
      if (a.bounces >= 2 && Math.abs(a.x - (lo + hi) / 2) < 200) { a.state = 'hot'; a.t = 0; a.rot = 0; }
      break;
    case 'hot':
      // stopped and glowing: NOW cool him with a water bomb
      if (Math.random() < 0.3 * dt) S.particles.push({ x: a.x + rand(-50, 50), y: FLOOR - 70, vx: rand(-0.4, 0.4), vy: rand(-2, -1), r: rand(4, 8), color: 'rgba(255,140,60,0.6)', life: 1, g: -0.02 });
      if (a.t > 170) { a.state = 'walk'; a.t = 0; }
      break;
    case 'cool':
      // grey and soft: jump on him
      if (a.t > 220) { a.state = 'walk'; a.t = 0; flash('Er glüht wieder!', 60); }
      break;
    case 'dead':
      a.rot = Math.min(Math.PI, a.rot + 0.08 * dt);
      if (a.t > 120) endAnky();
      return;
  }
  // touching him: on his cool back = a hit, everything else hurts
  const kb = kaiBox(), ab = ankyBox(a);
  if (overlap(kb, ab)) {
    if (a.state === 'cool' && k.vy > 0 && (k.prevY ?? k.y) <= ab.y1 + 18) { damageAnky(25, k.x, ab.y1); stompBounce(ab.y1); }
    else if (a.state !== 'cool') hurt(a.x);
  }
}
function damageAnky(n, x, y) {
  const a = S.anky; if (!a || a.state === 'dead') return;
  a.hp = Math.max(0, a.hp - n); a.flash = 14; S.shake = Math.max(S.shake, n > 10 ? 10 : 4);
  burst(x, y, '#ffd23a', n > 10 ? 18 : 8, 4); Audio.play(n > 10 ? 'bossHit' : 'whack');
  if (n > 10) S.pops.push({ x, y: y - 20, text: tx('TREFFER!'), t: 0, big: true });
  if (a.hp <= 0) { a.state = 'dead'; a.t = 0; Audio.play('bossDie'); flash('MAGMA-ANKYLOSAURUS BESIEGT!', 120); }
}
function endAnky() {
  S.fight = null; S.phase = 'play'; S.ankyDone = true; S.anky = null; Audio.setBoss(false); Audio.play('win');
  S.coins += 15;
  if (!SAVE.pts.boss_anky) { SAVE.pts.boss_anky = true; addScore(PTS.miniboss, S.kai.x, S.kai.y - 140, true); flash(tx('Der Weg ist frei! +{n} Punkte', { n: fmtNum(PTS.miniboss) }), 140); }
  else flash('Der Weg ist frei!', 120);
  reachCheckpoint(MID_X + W + 120);
  saveProgress();
}

// ================= DER RIESENVULKAN =================
function startVolcano() {
  S.fight = 'volcano'; S.phase = 'boss'; S.blobs = []; S.bubbles = [];
  S.boss = { hp: VOLC_HP, bar: 1, state: 'wake', t: 0, crater: 0, cyc: 0, rockT: 90, waveT: 200, salaT: 300, flash: 0, green: 0, steam: 0 };
  Audio.setBoss(true); Audio.play('roar'); S.shake = 12;
  flash('Der RIESENVULKAN! Wirf eine Wasserbombe in den glühenden Krater!', 220);
}
const volcBody = () => ({ x1: VOLC.baseL + 40, x2: BOSS_X + W + 40, y1: VOLC.craterY + 10, y2: FLOOR });
function updateVolcano(dt) {
  const b = S.boss, k = S.kai, weak = 1 - b.hp / VOLC_HP;
  b.t += dt; if (b.flash > 0) b.flash -= dt; if (b.steam > 0) b.steam -= dt;
  b.bar += (b.hp / VOLC_HP - b.bar) * Math.min(1, 0.1 * dt);
  if (b.state === 'wake') { if (b.t > 80) { b.state = 'fight'; b.t = 0; } return; }
  if (b.state === 'dead') {
    b.green = Math.min(1, b.green + 0.012 * dt);
    if (b.t > 150) winLava();
    return;
  }
  // crater: closed for a while, then glowing wide open (the moment to throw a bomb into it)
  b.cyc += dt;
  const closed = 230 - weak * 60, open = 190;
  if (b.cyc < closed) b.crater = Math.max(0, b.crater - 0.05 * dt);
  else if (b.cyc < closed + open) { if (b.crater < 0.05) Audio.play('roar'); b.crater = Math.min(1, b.crater + 0.06 * dt); }
  else b.cyc = 0;
  // lava rocks in an arc at Kai (the shadow shows where)
  b.rockT -= dt;
  if (b.rockT <= 0) {
    b.rockT = rand(80, 120) - weak * 30;
    const n = weak > 0.6 ? 2 : 1;
    for (let i = 0; i < n; i++) S.rocks.push({ sx: VOLC.cx, sy: VOLC.craterY - 10, tx: clamp(k.x + k.vx * 60 + rand(-90, 90) + i * 140, BOSS_X + 60, VOLC.baseL - 20), t: 0, T: 100 });
    Audio.play('explosion');
  }
  // lava waves rolling over the floor to the left
  b.waveT -= dt;
  if (b.waveT <= 0) { b.waveT = rand(190, 260) - weak * 60; S.waves.push({ x: VOLC.baseL, vx: -(5 + weak * 2) }); Audio.play('swish'); }
  // fire salamanders come out at his foot
  b.salaT -= dt;
  if (b.salaT <= 0) { b.salaT = rand(300, 420) - weak * 120; S.salas.push({ x: VOLC.baseL - 30, x1: BOSS_X + 60, x2: VOLC.baseL - 30, dir: -1, t: 0, dead: false, deadT: 0 }); }
  updateVolcRocks(dt);
  // the mountain itself is a wall – touching his hot slope hurts
  if (k.x > VOLC.baseL - 20) hurt(VOLC.baseL + 40);
}
function updateVolcRocks(dt) {
  const k = S.kai;
  for (const r of S.rocks) {
    r.t += dt;
    if (r.t >= r.T && !r.done) {
      r.done = true; burst(r.tx, FLOOR - 6, '#ff7a1a', 20, 5); burst(r.tx, FLOOR - 6, '#ffd23a', 8, 3); S.shake = Math.max(S.shake, 5); Audio.play('lavahit');
      if (Math.abs(k.x - r.tx) < 50 && k.y > FLOOR - 70) hurt(r.tx);
    }
  }
  S.rocks = S.rocks.filter(r => !r.done);
  for (const w of S.waves) {
    w.x += w.vx * dt;
    if (Math.abs(w.x - k.x) < 30 && k.y > FLOOR - 26) hurt(w.x);
  }
  S.waves = S.waves.filter(w => w.x > BOSS_X - 40);
}
const rockPos = r => { const u = clamp(r.t / r.T, 0, 1); return { x: r.sx + (r.tx - r.sx) * u, y: r.sy + (FLOOR - 10 - r.sy) * u - Math.sin(u * Math.PI) * 180, u }; };
function damageVolcano(n, x, y) {
  const b = S.boss; if (!b || b.state !== 'fight') return;
  b.hp = Math.max(0, b.hp - n); b.flash = 14; S.shake = Math.max(S.shake, n > 10 ? 12 : 4);
  for (let i = 0; i < (n > 10 ? 16 : 5); i++) S.particles.push({ x: x + rand(-30, 30), y: y + rand(-10, 10), vx: rand(-1, 1), vy: rand(-3, -1), r: rand(6, 12), color: 'rgba(235,240,250,0.7)', life: 1.3, g: -0.03 });
  Audio.play(n > 10 ? 'bossHit' : 'whack');
  if (n > 10) { b.steam = 60; b.cyc = 0; S.pops.push({ x, y: y - 30, text: tx('VOLLTREFFER!'), t: 0, big: true }); }
  if (b.hp <= 0) {
    b.state = 'dead'; b.t = 0; b.crater = 0; S.rocks = []; S.waves = [];
    for (const c of S.salas) if (!c.dead && c.x > BOSS_X) { c.dead = true; c.deadT = 0; }
    Audio.play('bossDie'); flash('DER RIESENVULKAN IST AUS!', 150);
  }
}
// a water bomb reaches a boss? (returns true when it was used up there)
function bombHitsFight(bm) {
  const p = { x1: bm.x - 8, x2: bm.x + 8, y1: bm.y - 8, y2: bm.y + 8 };
  if (S.fight === 'anky' && S.anky && S.anky.state !== 'dead' && overlap(p, ankyBox(S.anky))) {
    const a = S.anky;
    if (a.state === 'hot') { a.state = 'cool'; a.t = 0; Audio.play('air'); flash('Abgekühlt! JETZT draufspringen!', 90); }
    damageAnky(6, bm.x, bm.y);
    return true;
  }
  if (S.fight === 'volcano' && S.boss && S.boss.state === 'fight') {
    const b = S.boss;
    if (b.crater > 0.6 && Math.abs(bm.x - VOLC.cx) < 75 && bm.y > VOLC.craterY - 50 && bm.y < VOLC.craterY + 30) { damageVolcano(15, VOLC.cx, VOLC.craterY); return true; }
    if (overlap(p, volcBody()) && bm.x > VOLC.baseL + 60) { damageVolcano(3, bm.x, bm.y); return true; }
  }
  return false;
}
function winLava() {
  if (S.phase === 'won') return;
  S.phase = 'won'; Audio.setBoss(false); Audio.play('win'); Audio.play('cheer');
  S.coins += 30; SAVE.done.lava = true; bossSummary('lava'); saveProgress();
  burst(S.kai.x, S.kai.y - 60, '#ffd23a', 40, 6);
}
function updateBossDead(dt) { if (S.boss) S.boss.t += dt; }
