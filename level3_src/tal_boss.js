// =====================================================================
//  END BOSS: T-REX
//  He walks at Kai, roars, stomps three times (shock waves run along the ground → jump!),
//  then he is dizzy and lowers his head: jump ON his head. 3 hits → he falls over.
//  When not dizzy he sometimes charges through the arena.
// =====================================================================
function startBoss() {
  S.boss = { x: MAP_END + 220, face: -1, hp: 3, state: 'enter', t: 0, speed: 1.7, head: 0, flash: 0, stomps: 0, rot: 0, step: 0 };
  S.phase = 'boss'; S.fireballs = [];
  Audio.setBoss(true); Audio.play('roar'); S.shake = 10;
  flash('DER T-REX! Spring ihm auf den Kopf, wenn er benommen ist!', 200);
}
const rexHead = b => b.head > 0.5
  ? { x: b.x + b.face * 150, y: FLOOR - 64, w: 100, h: 58 }     // lowered (dizzy)
  : { x: b.x + b.face * 128, y: FLOOR - 176, w: 92, h: 62 };
function rexBodyBox(b) { return { x1: b.x - 112, x2: b.x + 112, y1: FLOOR - 176, y2: FLOOR - 4 }; }
function updateBoss(dt) {
  if (!S.boss) { startBoss(); return; }
  const b = S.boss, k = S.kai;
  b.t += dt; if (b.flash > 0) b.flash -= dt;
  const toward = Math.sign(k.x - b.x) || -1;
  const lo = BOSS_X + 170, hi = MAP_END - 170;
  b.head += ((b.state === 'dizzy' ? 1 : 0) - b.head) * Math.min(1, 0.12 * dt);
  const walk = v => { b.x = clamp(b.x + v * dt, lo, hi); b.step += Math.abs(v) * dt; };
  switch (b.state) {
    case 'enter':
      walk(-3); if (b.x <= hi) { b.state = 'walk'; b.t = 0; }
      break;
    case 'walk':
      b.face = toward; walk(b.face * b.speed);
      if (Math.abs(k.x - b.x) < 300 || b.t > 150) { b.state = 'roar'; b.t = 0; Audio.play('roar'); S.shake = 9; }
      break;
    case 'roar':
      b.face = toward;
      if (b.t > 55) { b.state = 'stomp'; b.t = 0; b.stomps = 0; }
      break;
    case 'stomp':
      if (b.t > 38) {
        b.t = 0; b.stomps++;
        // shock waves run to both sides along the ground
        for (const d of [-1, 1]) S.waves.push({ x: b.x + d * 100, vx: d * (6.2 + (3 - b.hp) * 0.6), life: 220 });
        Audio.play('stomp'); S.shake = 10; burst(b.x + 70, FLOOR - 4, '#a9744a', 14, 4); burst(b.x - 70, FLOOR - 4, '#a9744a', 14, 4);
        if (b.stomps >= 3) { b.state = 'dizzy'; b.t = 0; Audio.play('boing'); flash('Er ist benommen – JETZT auf den Kopf springen!', 120); }
      }
      break;
    case 'dizzy':
      if (b.t > 175 - (3 - b.hp) * 25) { b.state = 'charge'; b.t = 0; b.face = toward; Audio.play('roar'); }
      break;
    case 'charge':
      walk(b.face * (6.5 + (3 - b.hp) * 0.7));
      if ((b.face < 0 && b.x <= lo + 2) || (b.face > 0 && b.x >= hi - 2)) { b.state = 'walk'; b.t = 0; b.face = -b.face; }
      break;
    case 'hit':
      if (b.t > 60) { if (b.hp <= 0) { b.state = 'dead'; b.t = 0; Audio.play('bossDie'); } else { b.state = 'charge'; b.t = 0; b.face = toward; b.speed += 0.4; } }
      break;
    case 'dead':
      b.rot = Math.min(1.45, b.rot + 0.03 * dt);
      if (b.t > 100) winValley();
      return;
  }
  // shock waves hurt when Kai is on the ground where they pass
  for (const w of S.waves) if (Math.abs(w.x - k.x) < 26 && k.y > FLOOR - 22) hurt(w.x);
  // jumping on the lowered head = hit
  const h = rexHead(b);
  if (b.state === 'dizzy' && k.vy > 0 && Math.abs(k.x - h.x) < h.w / 2 + 6) {
    const top = h.y - h.h / 2;
    if ((k.prevY ?? k.y) <= top + 8 && k.y >= top - 2) {
      b.hp--; b.state = 'hit'; b.t = 0; b.flash = 60; S.shake = 12;
      k.y = top; k.vy = -13.5; k.ground = false; k.platform = null; k.inv = Math.max(k.inv, 40);
      burst(h.x, top, '#ffd23a', 20, 5); Audio.play('bossHit'); Audio.play('boing');
      flash(b.hp > 0 ? tx('TREFFER! Noch {n}×', { n: b.hp }) : 'T-REX BESIEGT!', 100);
      return;
    }
  }
  // touching the T-Rex hurts (his lowered head does not – he is dizzy)
  const kb = kaiBox();
  if (b.state !== 'hit' && overlap(kb, rexBodyBox(b))) {
    const hb = { x1: h.x - h.w / 2, x2: h.x + h.w / 2, y1: h.y - h.h / 2, y2: h.y + h.h / 2 };
    if (!(b.state === 'dizzy' && overlap(kb, hb) && !overlap(kb, { x1: b.x - 95, x2: b.x + 95, y1: FLOOR - 176, y2: FLOOR }))) hurt(b.x);
  } else if (b.state !== 'dizzy' && b.state !== 'hit') {
    const hb = { x1: h.x - h.w / 2, x2: h.x + h.w / 2, y1: h.y - h.h / 2, y2: h.y + h.h / 2 };
    if (overlap(kb, hb)) hurt(b.x);
  }
}
function winValley() {
  if (S.phase === 'won') return;
  S.phase = 'won'; Audio.setBoss(false); Audio.play('win'); Audio.play('cheer');
  S.coins += 30; SAVE.done.tal = true; saveProgress();
  burst(S.kai.x, S.kai.y - 60, '#ffd23a', 40, 6);
}
function updateBossDead(dt) { if (S.boss) S.boss.t += dt; }
