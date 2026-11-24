// =====================================================================
//  MONDBASIS – the rocket start, laser barriers, rolling satellite debris, the questions on the way
// =====================================================================
S.rollers = []; S.rollT = 80;
// the very first time: the rocket flies from Dinoland to the moon (with countdown) – can be skipped
if (!SAVE.intro && !QUERY.get('from')) { S.phase = 'intro'; S.intro = { t: 0, beeps: 0 }; S.noHud = true; }
function needStart() { return S.phase === 'intro'; }
function worldInit() { S.rollers = []; }
function worldReset() { S.rollers = []; }
function worldBegin() {
  if (!SAVE.items.laser) {
    SAVE.items.laser = true; writeSave();
    flash(isTouchDev() ? 'Du hast einen LASER-BLASTER! Schuss-Taste rechts unten.' : 'Du hast einen LASER-BLASTER! Schießen: X oder rechte Maustaste.', 220);
    Audio.play('chest');
  } else flash('DIE MONDBASIS', 110);
}
function endIntro() {
  SAVE.intro = true; writeSave();
  S.intro = null; S.noHud = false;
  if (!SAVE.seen_mond) { S.phase = 'start'; S.noHud = true; } else beginWorld();
  Audio.setTheme('mond');
}
const INTRO_T = 600;
const SKIP_BTN = { x: W - 190, y: H - 54, w: 170, h: 38 };

// ---------------- laser barriers ----------------
function laserState(L) {
  const u = (S.t + L.ph) % LASER_T;
  return u < LASER_ON ? 'on' : u > LASER_T - LASER_WARN ? 'warn' : 'off';
}
const laserTop = L => L.ceil ? CEIL : FLOOR - 178, laserBot = L => L.ceil ? CEIL + 178 : FLOOR;
function updateLasers() {
  const k = S.kai, kb = kaiBox();
  for (const L of LASERS) {
    if (Math.abs(L.x - k.x) > 900) continue;
    const st = laserState(L);
    if (st !== L.last) { if (st === 'on' && Math.abs(L.x - k.x) < 700) Audio.note(196, 0.18, 'sawtooth', 0.04); L.last = st; }
    if (st === 'on' && overlap(kb, { x1: L.x - 7, x2: L.x + 7, y1: laserTop(L), y2: laserBot(L) })) { if (hurt(L.x)) flash('Autsch – der Laser! Warte, bis er aus ist.', 90); }
  }
}

// ---------------- satellite debris ----------------
function updateRollers(dt) {
  const k = S.kai, zone = ROLL_ZONES.find(([a, b]) => k.x > a - 200 && k.x < b);
  if (zone && S.phase === 'play' && !k.flip) {
    S.rollT -= dt;
    if (S.rollT <= 0) {
      S.rollT = rand(110, 190);
      const x = Math.min(zone[1] + 200, S.cam + W + 80);
      if (x > k.x + 300) S.rollers.push({ x, y: FLOOR - 22, r: rand(18, 26), vx: -rand(2.6, 3.8), vy: 0, rot: 0, kind: Math.random() < 0.5 ? 0 : 1, dead: false });
    }
  }
  const kb = kaiBox();
  for (const r of S.rollers) {
    if (r.dead) { r.deadT = (r.deadT || 0) + dt; continue; }
    r.x += r.vx * dt; r.rot += r.vx / r.r * dt;
    // low gravity: little hops over the bumps
    r.vy += 0.25 * dt; r.y += r.vy * dt;
    if (r.y >= FLOOR - r.r) { r.y = FLOOR - r.r; r.vy = Math.random() < 0.02 * dt ? -4 : 0; }
    if (!groundAt(r.x)) { r.vy += 0.4 * dt; if (r.y > FLOOR + 300) r.dead = true; }
    if (overlap(kb, { x1: r.x - r.r + 4, x2: r.x + r.r - 4, y1: r.y - r.r + 4, y2: r.y + r.r })) hurt(r.x);
    if (r.x < S.cam - 300) r.dead = true;
  }
  S.rollers = S.rollers.filter(r => !(r.dead && (r.deadT || 0) > 30));
}
function shotHitsExtra(s, sb) {
  for (const r of S.rollers) if (!r.dead && overlap(sb, { x1: r.x - r.r, x2: r.x + r.r, y1: r.y - r.r, y2: r.y + r.r })) {
    r.dead = true; r.deadT = 0; s.life = 0; burst(r.x, r.y, '#c9d3dc', 14, 4); burst(r.x, r.y, '#ffd23a', 6, 3); Audio.play('clank'); addScore(PTS.roller, r.x, r.y - 30); return;
  }
}
function worldUpdate(dt) { updateLasers(); updateRollers(dt); }

// ---------------- questions on the way ----------------
function siteReached(id) { return true; }
function worldAsk(id, yes) {
  if (!yes) return;
  if (id === 'exit') { saveProgress(); S.phase = 'leaving'; Audio.play('rocket'); goToWorld('aurora.html', 'from=mond'); return; }
  if (id === 'arcade') startArcade();
}
// special phases: rocket intro, the arcade game, the star quiz
function worldPhase(dt) {
  if (S.phase === 'intro') { updateIntro(dt); return true; }
  if (S.phase === 'game') { updateArcade(dt); return true; }
  if (S.phase === 'stars') { updateQuiz(dt); return true; }
  return false;
}
function updateIntro(dt) {
  const I = S.intro; if (!I) return;
  I.t += dt;
  // countdown 3 – 2 – 1 – start!
  const beat = Math.floor(I.t / 60);
  if (I.t < 180 && beat >= I.beeps) { I.beeps = beat + 1; Audio.init(); Audio.note(beat < 2 ? 660 : 880, 0.18, 'square', 0.08); }
  if (I.t >= 180 && !I.lift) { I.lift = true; Audio.play('rocket'); Audio.play('explosion'); }
  if (I.t >= 470 && !I.land) { I.land = true; Audio.play('rocket'); }
  if (I.t >= INTRO_T) endIntro();
}
function worldPointer(p, e) {
  if (S.phase === 'intro') { if (inRect(p, SKIP_BTN)) { Audio.play('tink'); endIntro(); } return true; }
  if (S.phase === 'game') { arcadePointer(p); return true; }
  if (S.phase === 'stars') { quizTap(p); return true; }
  if (S.phase === 'won') {
    if (inRect(p, BTN.won1)) { saveProgress(); S.phase = 'leaving'; goToWorld('aurora.html', 'from=mond'); }
    else if (inRect(p, BTN.won2)) toMainMenu();
    return true;
  }
  return false;
}
function worldKey(e) {
  if (S.phase === 'intro') { if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') endIntro(); return true; }
  if (S.phase === 'game' && S.game && S.game.result) { if (e.code === 'Space' || e.code === 'Enter') endArcade(); return true; }
  if (S.phase === 'stars') { quizKey(e); return true; }
  return false;
}
TEST.arcade = () => startArcade();
TEST.quiz = () => { TEST.setX(BOSS_X + 300); };
