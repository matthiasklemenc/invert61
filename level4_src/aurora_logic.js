// =====================================================================
//  AURORA 61 – Abu, Flappy, the flying elephants, the big elephant at the pipe
// =====================================================================
S.flappy = { x: START_X - 80, y: FLOOR - 150, t: 0 };
S.eles = ELES.map((e, i) => ({ i, x: e.x, home: e.x, fx: e.x, fy: FLOOR, state: SAVE['ele' + i] ? 'happy' : 'sad', t: 0 }));
S.big = { state: SAVE.items.fedBig ? 'done' : 'sad', t: 0, x: BIG_ELE_X, y: FLOOR, lid: SAVE.items.fedBig ? 1 : 0 };
function worldInit() {
  // coins in the air over the two gorges (for the elephant flights) and mangos for the elephants
  for (const e of ELES) for (let x = e.g1 + 80; x < e.g2 - 40; x += 70) S.objects.push({ type: 'coin', x, y: 150 + Math.sin(x * 0.01) * 50, r: 11, p: rand(0, 6) });
  for (const [x, y] of [[620, FLOOR - 40], [775, 170], [1050, FLOOR - 40], [1960, 170], [2600, FLOOR - 40], [2870, 170], [3300, FLOOR - 40], [3500, FLOOR - 40],
    [5060, 170], [5900, FLOOR - 40], [6560, FLOOR - 40], [6960, 110], [7000, FLOOR - 40], [8470, 170]]) S.objects.push({ type: 'fruit', x, y, r: 14, p: rand(0, 6) });
}
function worldReset() { S.fly = null; for (const e of S.eles) { e.fx = e.home; e.fy = FLOOR; } }
function worldBegin() {
  if (!SAVE.items.paint) { SAVE.items.paint = true; SAVE.flappy = true; writeSave(); flash(isTouchDev() ? 'Abu schenkt dir FARBKUGELN! Schuss-Taste rechts unten.' : 'Abu schenkt dir FARBKUGELN! Schießen: X oder rechte Maustaste.', 220); Audio.play('chest'); }
  else flash('AURORA 61', 110);
  S.flappy.x = S.kai.x - 80; S.flappy.y = FLOOR - 150;
  if (QUERY.get('from') === 'unter') S.noBoss = true;
  Audio.play('trumpet');
}

// ---------------- Flappy: flies behind Kai and collects coins nearby ----------------
function updateFlappy(dt) {
  const f = S.flappy, k = S.kai; f.t += dt;
  const tx0 = k.x - k.face * 70, ty0 = (S.fly ? k.y - 150 : k.y - 150) + Math.sin(f.t * 0.08) * 12;
  f.x += (tx0 - f.x) * Math.min(1, 0.06 * dt); f.y += (ty0 - f.y) * Math.min(1, 0.06 * dt);
  f.face = Math.sign(k.x - f.x) || 1;
  if (!SAVE.flappy) return;
  for (const o of S.objects) if (!o.done && o.type === 'coin' && Math.abs(o.x - f.x) < 60 && Math.abs(o.y - f.y) < 60) { collect(o); burst(o.x, o.y, '#9fd8ff', 4, 2); }
}

// ---------------- the sad / happy elephants at the gorges ----------------
function updateEles(dt) {
  const k = S.kai;
  for (const e of S.eles) {
    e.t += dt;
    if (S.fly && S.fly.e === e) continue;
    // back home after a flight
    e.fx += (e.home - e.fx) * Math.min(1, 0.03 * dt); e.fy += (FLOOR - e.fy) * Math.min(1, 0.05 * dt);
    if (!playing() || S.fly || !k.ground) continue;
    const id = 'ele' + e.i, back = 'eleBack' + e.i, ga = ELES[e.i];
    // riding right towards the elephant on the left cliff
    if (Math.abs(k.x - e.home) > 260) S.asked[id] = false;
    if (!S.asked[id] && k.x > e.home - 40 && k.x < ga.g1 && k.dir >= 0 && Math.abs(k.x - e.home) < 90) {
      S.asked[id] = true;
      if (!SAVE['ele' + e.i] && S.fruits < 3) { flash('Der Elefant ist traurig. Sammle 3 Mangos für ihn! ({n} / 3)', 150, { n: S.fruits }); Audio.play('denied'); continue; }
      S.ask = id; S.phase = 'ask'; k.vx = 0; k.dir = 0; Audio.play('trumpet'); return;
    }
    // on the right side of the gorge, riding left: fly back
    if (k.x > ga.g2 + 200) S.asked[back] = false;
    if (!S.asked[back] && SAVE['ele' + e.i] && k.dir < 0 && k.x > ga.g2 && k.x < ga.g2 + 90) {
      S.asked[back] = true; S.ask = back; S.phase = 'ask'; k.vx = 0; k.dir = 0; Audio.play('trumpet'); return;
    }
  }
}
function startFly(e, dir) {
  const k = S.kai, ga = ELES[e.i];
  S.fly = { e, dir, x1: dir > 0 ? ga.g2 + 110 : e.home + 60, vy: 0, up: false, t: 0, land: false };
  e.state = 'happy'; k.x = dir > 0 ? e.home : ga.g2 + 40; k.y = FLOOR - 40; k.vx = 0; k.dir = 0; k.face = dir; k.ground = false; k.platform = null;
  Audio.play('trumpet'); Audio.play('flap');
  flash(isTouchDev() ? 'SPRUNG halten = höher fliegen!' : 'Leertaste halten = höher fliegen!', 120);
}
function updateFly(dt) {
  const F = S.fly, k = S.kai, e = F.e; F.t += dt;
  if (k.shootT > 0) k.shootT -= dt;
  k.faceAnim += (k.face - k.faceAnim) * Math.min(1, 0.7 * dt);
  if (!F.land) {
    k.x += F.dir * 4.4 * dt;
    // take off first, then SPRUNG = up, let go = down a little
    const lift = F.t < 40 ? -0.5 : F.up ? -0.42 : 0.24;
    F.vy = clamp(F.vy + lift * dt, -4.5, 3.5); k.y += F.vy * dt;
    if (k.y < -DY + 170) { k.y = -DY + 170; F.vy = Math.max(0, F.vy); }
    if (k.y > FLOOR - 30) { k.y = FLOOR - 30; F.vy = Math.min(0, F.vy) - 1; }
    if ((F.dir > 0 && k.x >= F.x1) || (F.dir < 0 && k.x <= F.x1)) { F.land = true; F.vy = 0; }
  } else {
    k.y += (FLOOR - k.y) * Math.min(1, 0.12 * dt);
    if (Math.abs(k.y - FLOOR) < 2) {
      k.y = FLOOR; k.vy = 0; k.ground = true; k.platform = null; k.safeX = k.x; k.landT = 8; S.fly = null; Audio.play('land'); Audio.play('trumpet');
      e.fx = k.x - F.dir * 30; e.fy = FLOOR - 40;
      return;
    }
  }
  e.fx = k.x; e.fy = k.y + 34;
  updatePickups();
}

// ---------------- the big elephant at the pipe ----------------
function updateBig(dt) {
  const b = S.big; b.t += dt;
  if (b.state === 'eat' && b.t > 90) { b.state = 'wings'; b.t = 0; Audio.play('sparkle'); Audio.play('trumpet'); }
  else if (b.state === 'wings' && b.t > 60) { b.state = 'lift'; b.t = 0; Audio.play('flap'); }
  else if (b.state === 'lift') {
    const u = Math.min(1, b.t / 150);
    b.x = BIG_ELE_X + (PIPE_X + PIPE_W / 2 - BIG_ELE_X) * Math.min(1, u * 2); b.y = FLOOR - Math.sin(Math.min(1, u * 1.4) * Math.PI / 2) * 130;
    b.lid = clamp((u - 0.5) * 2, 0, 1);
    if (u >= 1) { b.state = 'done'; b.t = 0; SAVE.items.fedBig = true; writeSave(); Audio.play('chime'); flash('Der Deckel ist offen! Ab in die Röhre!', 140); S.asked.pipe = false; S.near.pipe = false; }
  } else if (b.state === 'done') { b.x = PIPE_X - 150 + Math.sin(b.t * 0.02) * 80; b.y = FLOOR - 150 + Math.sin(b.t * 0.05) * 20; b.lid = 1; }
}
function worldUpdate(dt) {
  updateFlappy(dt); updateEles(dt); updateBig(dt);
  if (S.kai.x < BOSS_X) S.noBoss = false;
}
function siteReached(id) {
  if (id === 'bigele') {
    if (!SAVE.done.aurora || SAVE.items.fedBig || S.big.state !== 'sad') return false;
    if (!SAVE.items.cake) { flash('Der große Elefant hat Hunger: hol den Mega-Mango-Kuchen bei Abu!', 170); Audio.play('denied'); return false; }
    S.ask = 'feed'; S.phase = 'ask'; S.kai.vx = 0; S.kai.dir = 0; Audio.play('trumpet'); return false;
  }
  if (id === 'pipe') {
    if (!SAVE.items.fedBig) { if (SAVE.done.aurora) { flash('Der Deckel ist zu schwer! Der große Elefant kann ihn heben.', 150); Audio.play('denied'); } return false; }
    return true;
  }
  return true;
}
function afterShop() { if (!SAVE.items.cake) flash('Ohne Mega-Mango-Kuchen kommst du nicht in die Unterwelt!', 150); }
function worldAsk(id, yes) {
  if (!yes) return;
  if (id === 'exit') { saveProgress(); S.phase = 'leaving'; Audio.play('rocket'); goToWorld('mond.html', 'from=aurora'); return; }
  if (id === 'oxxo') { openShop(); return; }
  if (id === 'foto') { startFoto(); return; }
  if (id === 'feed') { S.big.state = 'eat'; S.big.t = 0; SAVE.items.cake = true; Audio.play('chomp'); saveProgress(); return; }
  if (id === 'pipe') { saveProgress(); S.phase = 'leaving'; Audio.play('pipe'); goToWorld('unter.html', 'from=aurora'); return; }
  if (id.startsWith('eleBack')) { const e = S.eles[+id.slice(7)]; startFly(e, -1); return; }
  if (id.startsWith('ele')) {
    const e = S.eles[+id.slice(3)];
    if (!SAVE['ele' + e.i]) { S.fruits -= 3; SAVE['ele' + e.i] = true; saveProgress(); Audio.play('chomp'); burst(e.home, FLOOR - 80, '#ffb02e', 16, 4); burst(e.home, FLOOR - 80, '#ff9ad0', 16, 4); Audio.play('sparkle'); }
    startFly(e, 1);
  }
}
function worldPhase(dt) {
  if (S.phase === 'game') { updateFoto(dt); return true; }
  if (S.phase === 'won' || S.phase === 'start' || S.phase === 'ask' || S.phase === 'shop') { updateFlappy(dt); updateBig(dt); if (S.boss) updateBossAnim(dt); }
  return false;
}
function worldPointer(p, e) {
  if (S.phase === 'game') { fotoPointer(p); return true; }
  if (S.phase === 'won') {
    if (inRect(p, BTN.won1)) { S.phase = 'play'; S.boss = null; S.noBoss = true; Audio.setBoss(false); Audio.play('tink'); }
    else if (inRect(p, BTN.won2)) toMainMenu();
    return true;
  }
  return false;
}
function worldKey(e) {
  if (S.phase === 'game' && S.game) { if (S.game.result && (e.code === 'Space' || e.code === 'Enter')) endFoto(); return true; }
  return false;
}
function gameDir() {}
function gameShoot() {}
TEST.fly = i => { TEST.setX(ELES[i].x); };
TEST.foto = () => startFoto();
TEST.big = () => { TEST.setX(BIG_ELE_X - 200); };
