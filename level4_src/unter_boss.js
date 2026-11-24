// =====================================================================
//  MIDDLE BOSS: DER RIESEN-MONDWURM
//  He crawls under the ground from hole to hole (the ground rumbles where he comes up), sticks his
//  head out, sways and spits slime. Sometimes he bursts out right under Kai (watch the shaking hole!).
//  Only while his head is out a sun ball hits him.
// =====================================================================
const WURM_HP = 100, WURM_HIT = 8;
function updateMid(dt) {
  if (!S.mid) {
    S.mid = { state: 'under', hp: WURM_HP, bar: 1, hole: 1, next: 1, t: -40, y: 0, flash: 0, spit: 0, rounds: 0 };
    Audio.setBoss(true); Audio.play('roar'); S.shake = 10;
    flash('Der RIESEN-MONDWURM! Triff ihn, wenn sein Kopf draußen ist!', 200);
    return;
  }
  const m = S.mid, k = S.kai, weak = 1 - m.hp / WURM_HP;
  if (m.state === 'gone') return;
  m.t += dt; if (m.flash > 0) m.flash -= dt;
  m.bar += (m.hp / WURM_HP - m.bar) * Math.min(1, 0.1 * dt);
  const hx = WURM_HOLES[m.hole];
  switch (m.state) {
    case 'under':
      // the ground shakes where he will come up
      if (m.t > 0 && m.t % 12 < dt) { burst(hx + rand(-30, 30), FLOOR - 4, '#6a4a7a', 3, 2); S.shake = Math.max(S.shake, 2); }
      if (m.t > 70 - weak * 25) { m.state = 'rise'; m.t = 0; Audio.play('roar'); burst(hx, FLOOR - 6, '#8a6a9a', 18, 5); if (m.burst && Math.abs(k.x - hx) < 70) hurt(hx); }
      break;
    case 'rise':
      m.y = Math.min(1, m.t / (m.burst ? 10 : 26));
      if (m.y >= 1) { m.state = 'up'; m.t = 0; m.spit = 40; }
      break;
    case 'up':
      m.spit -= dt;
      if (m.spit <= 0) {
        m.spit = 62 - weak * 20;
        const dx = k.x - hx, vx = clamp(dx / 55, -7, 7);
        S.eshots.push({ x: hx, y: FLOOR - 150, vx, vy: -7, r: 11, col: '#7dff6a', g: 0.26, puddle: 60, life: 300 });
        Audio.play('slime');
      }
      if (m.t > 170 - weak * 40) { m.state = 'sink'; m.t = 0; }
      break;
    case 'sink':
      m.y = Math.max(0, 1 - m.t / 24);
      if (m.y <= 0) {
        m.rounds++; m.state = 'under'; m.t = 0;
        // every third time he bursts out right under Kai
        m.burst = m.rounds % 3 === 2;
        if (m.burst) { let best = 0; WURM_HOLES.forEach((h, i) => { if (Math.abs(h - k.x) < Math.abs(WURM_HOLES[best] - k.x)) best = i; }); m.hole = best; flash('Achtung – der Boden wackelt!', 60); }
        else { let n; do n = Math.floor(Math.random() * 3); while (n === m.hole); m.hole = n; }
      }
      break;
    case 'dead':
      m.y = Math.max(0, m.y - 0.01 * dt);
      if (m.t > 140) { m.state = 'gone'; Audio.setBoss(false); }
      return;
  }
  // touching his head hurts
  if (m.y > 0.3 && (m.state === 'up' || m.state === 'rise') && overlap(kaiBox(), wurmBox(m))) hurt(hx);
}
const wurmBox = m => { const hx = WURM_HOLES[m.hole]; return { x1: hx - 46, x2: hx + 46, y1: FLOOR - 190 * m.y - 20, y2: FLOOR - 10 }; };
function wurmHit(s, sb) {
  const m = S.mid; if (!(m.state === 'up' || m.state === 'rise') || m.y < 0.4) return;
  if (!overlap(sb, wurmBox(m))) return;
  s.life = 0; m.hp = Math.max(0, m.hp - WURM_HIT); m.flash = 14; S.shake = Math.max(S.shake, 3);
  burst(s.x, s.y, '#ffd23a', 12, 4); Audio.play('bossHit');
  if (m.hp <= 0) {
    m.state = 'dead'; m.t = 0; S.eshots = [];
    SAVE.mid.wurm = true;
    const first = !SAVE.pts.mid_wurm; if (first) { SAVE.pts.mid_wurm = true; addScore(PTS.miniboss, WURM_HOLES[m.hole], FLOOR - 200, true); }
    flash(first ? 'Der Weg ist frei! +{n} Punkte' : 'Der Weg ist frei!', 160, { n: fmtNum(PTS.miniboss) }); Audio.play('bossDie'); Audio.play('win'); saveProgress();
  }
}

// =====================================================================
//  END BOSS: GRUMMEL, DER GLÜCKSDIEB
//  A grumpy grey-purple fellow on a dark cloud. He stole the happiness of the elephants and locked them
//  in cages. He throws rain clouds, later calls slime worms, and at the end he crashes down onto Kai
//  (the shadow shows where – then he sits on the ground and every hit counts double).
//  Enough sunshine and … he has to laugh! He becomes nice and opens the cages.
// =====================================================================
const GRUM_HP = 100, GRUM_HIT = 7;
function startBoss() {
  S.boss = { x: MAP_END + 120, y: 90, face: -1, hp: GRUM_HP, bar: 1, state: 'enter', t: 0, flash: 0, ph: 0, cloud: 90, summon: 300, slam: 0, sy: 0 };
  S.phase = 'boss'; S.clouds = []; S.eshots = [];
  S.freed = CAGES.map((x, i) => ({ x, y: FLOOR - 40, t: 0, i }));
  Audio.setBoss(true); Audio.play('thunder'); S.shake = 6;
  flash('GRUMMEL, der Glücksdieb! Schick ihm Sonnenschein!', 200);
}
const grumBox = b => ({ x1: b.x - 56, x2: b.x + 56, y1: b.y - 56, y2: b.y + 50 });
function updateBoss(dt) {
  if (!S.boss) { startBoss(); return; }
  const b = S.boss, k = S.kai, weak = 1 - b.hp / GRUM_HP, cx = BOSS_X + 470;
  b.t += dt; if (b.flash > 0) b.flash -= dt;
  b.bar += (b.hp / GRUM_HP - b.bar) * Math.min(1, 0.1 * dt);
  switch (b.state) {
    case 'enter':
      b.x -= 4 * dt; b.face = -1;
      if (b.x <= cx + 300) { b.state = 'float'; b.t = 0; b.ph = Math.PI / 2; }
      break;
    case 'float': {
      b.ph += (0.014 + weak * 0.01) * dt;
      const nx = cx + Math.sin(b.ph) * 360, ny = 100 + Math.sin(b.ph * 2.3) * 24;
      b.face = Math.sign(k.x - b.x) || b.face; b.x += (nx - b.x) * Math.min(1, 0.1 * dt); b.y += (ny - b.y) * Math.min(1, 0.1 * dt);
      // rain clouds
      b.cloud -= dt;
      if (b.cloud <= 0) { b.cloud = 150 - weak * 50; S.clouds.push({ x: b.x, y: -DY * 0.3 + 40, t: 0 }); Audio.play('thunder'); }
      // slime worms (when he is weaker)
      b.summon -= dt;
      if (weak > 0.35 && b.summon <= 0 && S.walkers.filter(w => w.summoned && !w.dead).length < 3) {
        b.summon = 420;
        for (const sx of [BOSS_X + 120, BOSS_X + 700]) S.walkers.push({ x: sx, x1: BOSS_X + 60, x2: BOSS_X + 860, dir: sx < k.x ? 1 : -1, t: 0, dead: false, deadT: 0, kind: 1, summoned: true });
        flash('Grummel ruft die Schleimwürmer!', 90); Audio.play('slime');
      }
      // the crash down (at the end)
      if (weak > 0.6 && b.t > 260) { b.state = 'aim'; b.t = 0; b.tx = k.x; Audio.play('alarm'); }
      break;
    }
    case 'aim':
      b.tx += (k.x - b.tx) * Math.min(1, 0.05 * dt); b.x += (b.tx - b.x) * Math.min(1, 0.08 * dt); b.y += (60 - b.y) * Math.min(1, 0.08 * dt);
      if (b.t > 60) { b.state = 'drop'; b.t = 0; b.vy = 0; }
      break;
    case 'drop':
      b.vy += 1.2 * dt; b.y += b.vy * dt;
      if (b.y >= FLOOR - 52) { b.y = FLOOR - 52; b.state = 'sit'; b.t = 0; S.shake = 12; Audio.play('stomp'); burst(b.x, FLOOR - 4, '#6a4a7a', 24, 6); }
      break;
    case 'sit':
      if (b.t > 110) { b.state = 'up'; b.t = 0; }
      break;
    case 'up':
      b.y += (100 - b.y) * Math.min(1, 0.06 * dt);
      if (b.t > 50) { b.state = 'float'; b.t = 0; b.ph = Math.asin(clamp((b.x - cx) / 360, -1, 1)); }
      break;
    case 'happy':
      // he laughs, turns warm and yellow, and the cages open
      b.y += (110 - b.y) * Math.min(1, 0.04 * dt);
      if (b.t > 60 && !b.opened) { b.opened = true; Audio.play('sparkle'); Audio.play('trumpet'); }
      if (b.t > 60) for (const e of S.freed) e.t += dt;
      if (b.t > 260) winUnter();
      return;
  }
  if (overlap(kaiBox(), grumBox(b))) hurt(b.x);
}
function grummelHit(s, sb) {
  const b = S.boss; if (!b || b.state === 'enter' || b.state === 'happy') return;
  if (!overlap(sb, grumBox(b))) return;
  s.life = 0;
  b.hp = Math.max(0, b.hp - (b.state === 'sit' ? GRUM_HIT * 2 : GRUM_HIT)); b.flash = 14; S.shake = Math.max(S.shake, 3);
  burst(s.x, s.y, '#ffd23a', 14, 4); Audio.play('bossHit');
  if (b.hp <= 0) {
    b.state = 'happy'; b.t = 0; S.clouds = []; S.eshots = [];
    for (const w of S.walkers) if (w.summoned && !w.dead) { w.dead = true; w.deadT = 0; }
    flash('So viel Sonnenschein … GRUMMEL MUSS LACHEN!', 160); Audio.play('bossDie'); Audio.play('cheer');
  }
}
function winUnter() {
  if (S.phase === 'won') return;
  S.phase = 'won'; Audio.setBoss(false); Audio.play('win'); Audio.play('cheer');
  S.coins += 30; SAVE.done.unter = true; bossSummary('unter'); saveProgress();
}
