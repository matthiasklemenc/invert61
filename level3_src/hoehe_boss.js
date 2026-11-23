// =====================================================================
//  END BOSS: DIE RIESEN-FLUGSAURIER-MAMA
//  She circles high above and drops stones (shadow = where), swoops down low across the arena
//  (jump over her or get out of the way), and after two swoops she lands, tired and panting.
//  ONLY while she sits on the ground the slingshot hurts her. 3 hits → she falls over.
//  In the air the stones just bounce off.
// =====================================================================
function startBoss() {
  S.boss = { x: MAP_END + 200, y: 60, face: -1, hp: 3, state: 'enter', t: 0, flap: 0, flash: 0, swoops: 0, drop: 80, rot: 0, sx: 0, sy: 0, tx: 0, hint: 0 };
  S.phase = 'boss'; S.stones = [];
  Audio.setBoss(true); Audio.play('bark'); S.shake = 8;
  flash('Die FLUGSAURIER-MAMA! Triff sie mit der Schleuder, wenn sie landet!', 220);
}
const mamaBox = b => b.state === 'landed' || b.state === 'hit'
  ? { x1: b.x - 70, x2: b.x + 70, y1: FLOOR - 120, y2: FLOOR - 4 }
  : { x1: b.x - 80, x2: b.x + 80, y1: b.y - 26, y2: b.y + 34 };
function updateBoss(dt) {
  if (!S.boss) { startBoss(); return; }
  const b = S.boss, k = S.kai, lo = BOSS_X + 140, hi = MAP_END - 140, fast = 3 - b.hp;
  b.t += dt; b.flap += dt; if (b.flash > 0) b.flash -= dt; if (b.hint > 0) b.hint -= dt;
  switch (b.state) {
    case 'enter':
      b.x -= 4 * dt; b.y += (80 - b.y) * 0.05 * dt;
      if (b.x <= hi) { b.state = 'circle'; b.t = 0; }
      break;
    case 'circle': {
      // high up: a wide figure of eight over the arena, dropping stones at Kai now and then
      const u = b.t * (0.018 + fast * 0.004), cx = BOSS_X + W / 2;
      const nx = cx + Math.sin(u) * (W / 2 - 170), ny = 78 + Math.sin(u * 2) * 26;
      b.face = Math.sign(nx - b.x) || b.face; b.x = nx; b.y += (ny - b.y) * Math.min(1, 0.1 * dt);
      b.drop -= dt;
      if (b.drop <= 0) {
        b.drop = rand(70, 110) - fast * 12;
        S.stones.push({ x: clamp(k.x + k.vx * 30 + rand(-50, 50), BOSS_X + 40, MAP_END - 40), y: b.y + 30, vy: 1, r: 16, rot: 0, done: false, fromMama: true });
        Audio.play('swish');
      }
      if (b.t > 200 - fast * 30) { b.state = 'swoop'; b.t = 0; b.sx = b.x; b.sy = b.y; b.tx = k.x; Audio.play('bark'); }
      break;
    }
    case 'swoop': {
      // down to the ground through where Kai stood, and up again on the other side
      const T = 86 - fast * 10, u = Math.min(1, b.t / T), dirX = Math.sign(b.tx - b.sx) || -1;
      const ex = clamp(b.tx + dirX * 420, BOSS_X + 120, MAP_END - 120);
      b.x = b.sx + (ex - b.sx) * u; b.y = b.sy + (FLOOR - 52 - b.sy) * Math.sin(u * Math.PI);
      b.face = dirX;
      if (u >= 1) {
        b.swoops++; b.t = 0;
        if (b.swoops >= 2) { b.state = 'land'; b.swoops = 0; b.sx = b.x; b.sy = b.y; b.tx = k.x < BOSS_X + W / 2 ? hi - 60 : lo + 60; }
        else b.state = 'circle';
      }
      break;
    }
    case 'land': {
      // glides down far away from Kai and lands
      const u = Math.min(1, b.t / 70);
      b.x = b.sx + (b.tx - b.sx) * u; b.y = b.sy + (FLOOR - 60 - b.sy) * (u * u);
      b.face = Math.sign(b.tx - b.sx) || b.face;
      if (u >= 1) { b.state = 'landed'; b.t = 0; b.face = Math.sign(k.x - b.x) || -1; Audio.play('land'); S.shake = 6; burst(b.x, FLOOR - 4, '#a9744a', 16, 4); flash('Sie ist gelandet – JETZT schießen!', 100); }
      break;
    }
    case 'landed':
      b.face = Math.sign(k.x - b.x) || b.face;
      if (b.t > 230 - fast * 30) takeOff(b);
      break;
    case 'hit':
      if (b.t > 50) { if (b.hp <= 0) { b.state = 'dead'; b.t = 0; Audio.play('bossDie'); } else takeOff(b); }
      break;
    case 'takeoff':
      b.y -= 3.4 * dt;
      if (b.y < 90) { b.state = 'circle'; b.t = 0; }
      break;
    case 'dead':
      b.rot = Math.min(1.5, b.rot + 0.03 * dt);
      if (b.t > 110) winHeights();
      return;
  }
  // touching her hurts (also when she sits – she snaps)
  if (b.state !== 'hit' && b.state !== 'dead' && overlap(kaiBox(), mamaBox(b))) hurt(b.x);
}
function takeOff(b) { b.state = 'takeoff'; b.t = 0; b.y = FLOOR - 60; Audio.play('flap'); Audio.play('bark'); }
// a slingshot stone reaches her
function shotHitsBoss(s) {
  const b = S.boss; if (!b || b.state === 'dead' || b.state === 'hit') return;
  const box = mamaBox(b);
  if (!overlap({ x1: s.x - 6, x2: s.x + 6, y1: s.y - 6, y2: s.y + 6 }, box)) return;
  s.life = 0;
  if (b.state === 'landed') {
    b.hp--; b.state = 'hit'; b.t = 0; b.flash = 50; S.shake = 10;
    burst(s.x, s.y, '#ffd23a', 18, 5); Audio.play('bossHit');
    flash(b.hp > 0 ? tx('TREFFER! Noch {n}×', { n: b.hp }) : 'FLUGSAURIER-MAMA BESIEGT!', 100);
  } else {
    // in the air: the stone bounces off
    s.life = 0; burst(s.x, s.y, '#cfd6de', 5, 2); Audio.play('tink');
    if (b.hint <= 0) { b.hint = 200; flash('In der Luft prallt der Stein ab – warte, bis sie landet!', 110); }
  }
}
function winHeights() {
  if (S.phase === 'won') return;
  S.phase = 'won'; Audio.setBoss(false); Audio.play('win'); Audio.play('cheer');
  S.coins += 30; SAVE.done.hoehe = true; saveProgress();
  burst(S.kai.x, S.kai.y - 60, '#ffd23a', 40, 6);
}
function updateBossDead(dt) { if (S.boss) S.boss.t += dt; }
