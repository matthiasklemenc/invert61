// =====================================================================
//  END BOSS: DER STERNENFRESSER
//  He has eaten all the constellations. Each round one comes back for a moment (stars + lines),
//  then only the stars stay: the first star blinks – trace it star by star (tap). Then the picture
//  appears and the question: "Wie heißt dieses Sternbild?" – 5 answers, each with 🔊.
//  Right = a hit on the Sternenfresser (5 hits), wrong = −1 heart and the right one is shown.
//  The last one is always the LÖWE: in it the invisible planet AURORA 61 appears.
// =====================================================================
// stars: [x, y] in a 0..1 box, path: the order to trace (null = lift the pen)
const CONSTELLATIONS = {
  wagen: { name: 'Großer Wagen', pic: '🐻', stars: [[0.0, 0.25], [0.17, 0.12], [0.32, 0.15], [0.47, 0.24], [0.5, 0.5], [0.83, 0.56], [0.87, 0.25]], path: [0, 1, 2, 3, 4, 5, 6, 3] },
  orion: { name: 'Orion', pic: '🏹', stars: [[0.22, 0.05], [0.76, 0.12], [0.38, 0.5], [0.5, 0.47], [0.62, 0.44], [0.3, 0.95], [0.84, 0.88]], path: [2, 0, 1, 4, 6, 5, 2, 3, 4] },
  kassiopeia: { name: 'Kassiopeia', pic: '👑', stars: [[0.0, 0.3], [0.25, 0.72], [0.5, 0.42], [0.75, 0.78], [1.0, 0.22]], path: [0, 1, 2, 3, 4] },
  skorpion: { name: 'Skorpion', pic: '🦂', stars: [[0.12, 0.0], [0.18, 0.18], [0.14, 0.36], [0.32, 0.28], [0.42, 0.38], [0.5, 0.52], [0.54, 0.7], [0.62, 0.86], [0.78, 0.96], [0.92, 0.86], [0.96, 0.68]], path: [0, 1, 2, null, 1, 3, 4, 5, 6, 7, 8, 9, 10] },
  loewe: { name: 'Löwe', pic: '🦁', stars: [[0.15, 0.78], [0.14, 0.52], [0.25, 0.35], [0.22, 0.18], [0.34, 0.06], [0.68, 0.36], [0.95, 0.62], [0.66, 0.62]], path: [4, 3, 2, 1, 0, 7, 6, 5, 2] },
  schwan: { name: 'Schwan', pic: '🦢', stars: [[0.5, 0.0], [0.5, 0.35], [0.5, 1.0], [0.24, 0.28], [0.0, 0.45], [0.5, 0.65], [0.76, 0.3], [1.0, 0.52]], path: [0, 1, 5, 2, null, 4, 3, 1, 6, 7] },
  kreuz: { name: 'Kreuz des Südens', pic: '✨', stars: [[0.5, 0.0], [0.5, 1.0], [0.12, 0.45], [0.88, 0.38], [0.64, 0.62]], path: [0, 1, null, 2, 3] },
  zwillinge: { name: 'Zwillinge', pic: '👯', stars: [[0.25, 0.02], [0.58, 0.06], [0.22, 0.36], [0.15, 0.68], [0.06, 0.98], [0.56, 0.38], [0.62, 0.7], [0.74, 0.98]], path: [0, 2, 3, 4, null, 1, 5, 6, 7, null, 2, 5] },
};
const QUIZ_ROUNDS = 5, STAR_HP = 5;
function startBoss() {
  S.boss = { x: BOSS_X + W - 260, y: -DY - 200, hp: STAR_HP, bar: 1, state: 'enter', t: 0, flash: 0, chew: 0, noJump: true };
  S.phase = 'boss'; S.kai.dir = 0; S.kai.vx = 0;
  Audio.setBoss(true); Audio.play('roar'); S.shake = 8;
  flash('Der STERNENFRESSER! Er hat alle Sternbilder gefressen!', 200);
}
function updateBoss(dt) {
  if (!S.boss) { startBoss(); return; }
  const b = S.boss; b.t += dt; if (b.flash > 0) b.flash -= dt;
  b.bar += (b.hp / STAR_HP - b.bar) * Math.min(1, 0.1 * dt);
  if (b.state === 'enter') {
    b.y += (110 - b.y) * Math.min(1, 0.04 * dt); b.chew += dt;
    // he swallows the last stars of the sky
    if (b.t > 220) { b.state = 'quiz'; startQuiz(); }
  }
}
// ---------------- the quiz ----------------
function startQuiz() {
  S.quiz = { pool: [], round: 0, cur: null, t: 0, last: null };
  S.phase = 'stars'; S.kai.dir = 0;
  nextConstellation();
}
function nextConstellation() {
  // 4 different constellations, then always the LÖWE (when he has only one energy left)
  const q = S.quiz;
  if (!q.pool.length) q.pool = Object.keys(CONSTELLATIONS).filter(k => k !== 'loewe' && k !== q.last).sort(() => Math.random() - 0.5);
  const id = S.boss.hp <= 1 ? 'loewe' : q.pool.shift(), C = CONSTELLATIONS[id]; q.last = id;
  const opts = [id, ...Object.keys(CONSTELLATIONS).filter(k => k !== id).sort(() => Math.random() - 0.5).slice(0, 4)].sort(() => Math.random() - 0.5);
  q.cur = { id, C, state: 'show', t: 0, step: 0, prev: null, lines: [], wrong: 0, wrongT: 0, opts, picked: null, right: false, shakeStar: -1 };
  skipPenUps(q.cur);
  Audio.play('twinkle');
}
function skipPenUps(c) { while (c.step < c.C.path.length && c.C.path[c.step] === null) { c.step++; c.prev = null; } }
// where the stars are on the screen (the box gets bigger on tall phone screens)
function quizBox() {
  const top = -DY + 84, bot = H - 26, h = Math.min(bot - top, 520), w = Math.min(560, h * 1.5);
  return { x: 70 + (600 - w) / 2, y: top + (bot - top - h) / 2, w, h };
}
const starPos = (C, i) => { const b = quizBox(); return { x: b.x + 20 + C.stars[i][0] * (b.w - 40), y: b.y + 20 + C.stars[i][1] * (b.h - 40) }; };
function optRect(i) { const top = -DY + 132, h = Math.min(48, (H - 34 - top) / 5 - 7); return { x: 760, y: top + i * (h + 7), w: 330, h }; }
function sayRect(i) { const r = optRect(i); return { x: r.x + r.w + 8, y: r.y, w: r.h + 6, h: r.h }; }
function updateQuiz(dt) {
  const q = S.quiz; if (!q) return;
  const b = S.boss; if (b) { b.t += dt; if (b.flash > 0) b.flash -= dt; b.bar += (b.hp / STAR_HP - b.bar) * Math.min(1, 0.1 * dt); }
  q.t += dt; const c = q.cur; if (!c) return;
  c.t += dt; if (c.wrongT > 0) c.wrongT -= dt;
  if (c.state === 'show' && c.t > 170) { c.state = 'trace'; c.t = 0; }
  else if (c.state === 'picture' && c.t > 110) { c.state = 'ask'; c.t = 0; }
  else if (c.state === 'answered' && c.t > 150) {
    if (S.phase !== 'stars') return;
    if (b.hp <= 0) { c.state = 'aurora'; c.t = 0; Audio.play('chime'); Audio.play('sparkle'); }
    else { q.round++; nextConstellation(); }
  } else if (c.state === 'aurora' && c.t > 260) winMoon();
}
function quizTap(p) {
  const q = S.quiz; if (!q || !q.cur) return;
  const c = q.cur;
  if (c.state === 'show') { c.state = 'trace'; c.t = 0; return; }
  if (c.state === 'trace') {
    const want = c.C.path[c.step];
    let best = -1, bd = 46;
    c.C.stars.forEach((s, i) => { const sp = starPos(c.C, i), d = Math.hypot(sp.x - p.x, sp.y - p.y); if (d < bd) { bd = d; best = i; } });
    if (best < 0) return;
    if (best === want) {
      if (c.prev != null) c.lines.push([c.prev, want]);
      c.prev = want; c.step++; skipPenUps(c);
      Audio.play('twinkle'); burstScreen(starPos(c.C, want));
      if (c.step >= c.C.path.length) { c.state = 'picture'; c.t = 0; Audio.play('sparkle'); }
    } else { c.wrong++; c.wrongT = 24; c.shakeStar = best; Audio.play('denied'); }
    return;
  }
  if (c.state === 'ask') {
    for (let i = 0; i < 5; i++) {
      if (canSpeak() && inRect(p, sayRect(i))) { speak(tx(CONSTELLATIONS[c.opts[i]].name)); return; }
      if (inRect(p, optRect(i))) { answer(i); return; }
    }
  }
}
function answer(i) {
  const q = S.quiz, c = q.cur, b = S.boss;
  c.picked = i; c.right = c.opts[i] === c.id; c.state = 'answered'; c.t = 0;
  speak(tx(c.C.name));
  if (c.right) {
    b.hp = Math.max(0, b.hp - 1); b.flash = 30; S.shake = 6; Audio.play('bossHit'); Audio.play('sparkle');
    addScore(500, S.cam + W / 2, 120);
    if (b.hp <= 0) Audio.play('bossDie');
  } else {
    Audio.play('crash'); S.shake = 6; S.heartFlash = 30;
    S.hearts--; if (S.hearts <= 0) { if (loseLife()) { S.hearts = LIFE_HEARTS; flash('Ein Leben weniger! Weiter geht\'s.', 120); } else { S.hearts = 0; S.phase = 'gameover'; S.quiz = null; S.boss = null; Audio.setBoss(false); Audio.play('gameover'); saveProgress(); return; } }
    saveProgress();
  }
}
function quizKey(e) {
  const q = S.quiz; if (!q || !q.cur) return;
  const n = parseInt(e.key, 10);
  if (q.cur.state === 'ask' && n >= 1 && n <= 5) answer(n - 1);
}
const QS = [];
function burstScreen(p) { for (let i = 0; i < 10; i++) { const a = rand(0, Math.PI * 2), v = rand(1, 3.5); QS.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0 }); } }
function winMoon() {
  if (S.phase === 'won') return;
  S.phase = 'won'; Audio.setBoss(false); Audio.play('win'); Audio.play('cheer');
  S.coins += 30; SAVE.done.mond = true; bossSummary('mond'); saveProgress();
  S.quiz = null; if (S.boss) S.boss.state = 'gone';
}
window.__sp = () => { const c = S.quiz && S.quiz.cur; if (!c) return null; const p = starPos(c.C, c.C.path[c.step]); return [p.x, p.y]; };
