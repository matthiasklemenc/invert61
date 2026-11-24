// =====================================================================
//  END BOSS: DIE FARBHEXE GRISELLA
//  She flies on her broom and sucks the colours out of Aurora 61 – the arena turns grey.
//  She drops grey blobs (they leave grey puddles for a while), swoops low across the arena (jump!)
//  and later fires a grey beam along the ground (jump over it!).
//  Every paint ball hit brings colour back. Energy 0 → she flees into the pipe.
// =====================================================================
const GRIS_HP = 100, GRIS_HIT = 6;
function startBoss() {
  S.boss = { x: MAP_END + 160, y: 90, face: -1, hp: GRIS_HP, bar: 1, state: 'enter', t: 0, flash: 0, drop: 80, ph: 0, swoops: 0, grey: 0, sx: 0, sy: 0, tx: 0, beam: 0, sz: 1 };
  S.phase = 'boss'; S.eshots = []; S.puddles = [];
  Audio.setBoss(true); Audio.play('thunder'); S.shake = 6;
  flash('Die FARBHEXE GRISELLA! Triff sie mit den Farbkugeln!', 200);
}
const grisBox = b => ({ x1: b.x - 46, x2: b.x + 46, y1: b.y - 60, y2: b.y + 30 });
function updateBoss(dt) {
  // Grisella can be fought again and again – but not while the big elephant still waits for his cake
  if (!S.boss) { if (S.noBoss || (SAVE.done.aurora && !SAVE.items.fedBig)) return; startBoss(); return; }
  const b = S.boss, k = S.kai, weak = 1 - b.hp / GRIS_HP, cx = BOSS_X + W / 2;
  b.t += dt; if (b.flash > 0) b.flash -= dt;
  b.bar += (b.hp / GRIS_HP - b.bar) * Math.min(1, 0.1 * dt);
  const target = (b.hp / GRIS_HP) * 0.8; b.grey += (target - b.grey) * Math.min(1, 0.03 * dt);
  switch (b.state) {
    case 'enter':
      b.x -= 4 * dt; b.face = -1;
      if (b.x <= MAP_END - 220) { b.state = 'hover'; b.t = 0; b.ph = Math.PI / 2; }
      break;
    case 'hover': {
      b.ph += (0.016 + weak * 0.012) * dt;
      const nx = cx + Math.sin(b.ph) * (W / 2 - 200), ny = 95 + Math.sin(b.ph * 2) * 30;
      b.face = Math.sign(nx - b.x) || b.face; b.x = nx; b.y += (ny - b.y) * Math.min(1, 0.1 * dt);
      b.drop -= dt;
      if (b.drop <= 0 && Math.abs(b.x - k.x) < 120) {
        b.drop = 46 - weak * 16;
        const n = weak > 0.5 ? 2 : 1;
        for (let i = 0; i < n; i++) S.eshots.push({ x: b.x, y: b.y + 20, vx: (i - (n - 1) / 2) * 1.6 + (k.x - b.x) * 0.006, vy: 0.5, r: 13, col: '#8a8a96', g: 0.22, puddle: 70, life: 400 });
        Audio.play('slime');
      }
      if (b.t > 280 - weak * 80) {
        b.t = 0;
        if (weak > 0.35 && b.swoops % 2 === 1) { b.state = 'beamGo'; b.tx = k.x < cx ? MAP_END - 160 : BOSS_X + 160; }
        else { b.state = 'swoop'; b.sx = b.x; b.sy = b.y; b.tx = k.x; Audio.play('swish'); }
        b.swoops++;
      }
      break;
    }
    case 'swoop': {
      const T = 90 - weak * 22, u = Math.min(1, b.t / T), dir = Math.sign(b.tx - b.sx) || -1;
      const ex = clamp(b.tx + dir * 420, BOSS_X + 120, MAP_END - 120);
      b.x = b.sx + (ex - b.sx) * u; b.y = b.sy + (FLOOR - 70 - b.sy) * Math.sin(u * Math.PI); b.face = dir;
      if (u >= 1) { b.state = 'hover'; b.t = 0; b.ph = Math.asin(clamp((b.x - cx) / (W / 2 - 200), -1, 1)); }
      break;
    }
    case 'beamGo':
      // flies down to one side of the arena, then the grey beam rolls along the ground
      b.x += (b.tx - b.x) * Math.min(1, 0.05 * dt); b.y += (FLOOR - 90 - b.y) * Math.min(1, 0.05 * dt); b.face = b.tx > cx ? -1 : 1;
      if (b.t > 70) { b.state = 'beam'; b.t = 0; flash('Achtung, der Grau-Strahl! SPRINGEN!', 90); Audio.play('alarm'); }
      break;
    case 'beam': {
      // warning 50 frames, then the beam sweeps along the floor
      b.beam = b.t < 50 ? 0 : Math.min(1, (b.t - 50) / 40);
      if (b.t > 50 && b.t < 140) {
        const reach = b.x + b.face * (W - 280) * b.beam, x1 = Math.min(b.x, reach), x2 = Math.max(b.x, reach);
        if (overlap(kaiBox(), { x1, x2, y1: FLOOR - 34, y2: FLOOR })) hurt(b.x);
        if (Math.floor(b.t) % 10 === 0) Audio.note(160, 0.1, 'sawtooth', 0.04);
      }
      if (b.t > 150) { b.state = 'hover'; b.t = 0; b.beam = 0; b.ph = Math.asin(clamp((b.x - cx) / (W / 2 - 200), -1, 1)); }
      break;
    }
    case 'flee': {
      // she shrinks and dives into the pipe
      const tx0 = PIPE_X + PIPE_W / 2, ty0 = FLOOR - PIPE_H - 10;
      b.x += (tx0 - b.x) * Math.min(1, 0.05 * dt); b.y += (ty0 - b.y) * Math.min(1, 0.05 * dt); b.face = Math.sign(tx0 - b.x) || 1;
      if (b.t > 70) b.sz = Math.max(0, b.sz - 0.02 * dt);
      if (b.sz <= 0) { b.state = 'gone'; winAurora(); }
      return;
    }
    case 'gone': return;
  }
  if (b.state !== 'enter' && overlap(kaiBox(), grisBox(b))) hurt(b.x);
}
function updateBossAnim(dt) { if (S.boss) { S.boss.t += dt; if (S.boss.flash > 0) S.boss.flash -= dt; S.boss.grey += (0 - S.boss.grey) * Math.min(1, 0.03 * dt); } }
function shotHitsExtra(s, sb) {
  const b = S.boss; if (!b || b.state === 'enter' || b.state === 'flee' || b.state === 'gone') return;
  if (!overlap(sb, grisBox(b))) return;
  s.life = 0;
  b.hp = Math.max(0, b.hp - GRIS_HIT); b.flash = 14; S.shake = Math.max(S.shake, 3);
  burst(s.x, s.y, s.col, 16, 5); Audio.play('bossHit');
  if (b.hp <= 0) {
    b.state = 'flee'; b.t = 0; b.beam = 0; S.eshots = []; S.puddles = [];
    flash('GRISELLA FLÜCHTET IN DIE RÖHRE!', 140); Audio.play('bossDie'); Audio.play('sparkle');
  }
}
function winAurora() {
  if (S.phase === 'won') return;
  S.phase = 'won'; Audio.setBoss(false); Audio.play('win'); Audio.play('cheer'); Audio.play('trumpet');
  S.coins += 30; SAVE.done.aurora = true; bossSummary('aurora'); saveProgress();
  for (let i = 0; i < 6; i++) burst(BOSS_X + 200 + i * 170, 120, ['#ff5a8a', '#ffd23a', '#36c6f4', '#7dffa0', '#b48cff', '#ffb02e'][i], 20, 5);
}
