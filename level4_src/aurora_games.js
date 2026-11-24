// =====================================================================
//  FOTOSAFARI – with Abu's camera: photograph the funny animals of Aurora 61
//  Animals run, hop, fly and jump across the meadow. A task says which ones (e.g. "3 Regenbogen-Vögel").
//  Tap on the right animal = photo. 3 tasks in 45 seconds. Wrong animal: no problem, just no point.
// =====================================================================
const ANIMALS = {
  vogel: { name: 'Regenbogen-Vogel', plural: 'Regenbogen-Vögel' },
  frosch: { name: 'Propeller-Frosch', plural: 'Propeller-Frösche' },
  schnecke: { name: 'Kuppel-Schnecke', plural: 'Kuppel-Schnecken' },
  fisch: { name: 'Flatter-Fisch', plural: 'Flatter-Fische' },
  elefant: { name: 'Mini-Elefant', plural: 'Mini-Elefanten' },
};
const FOTO_T = 45 * 60;
function startFoto() {
  const k = S.kai; k.vx = 0; k.dir = 0;
  const kinds = Object.keys(ANIMALS).sort(() => Math.random() - 0.5).slice(0, 3);
  S.game = { id: 'foto', t: 0, tasks: kinds.map((kind, i) => ({ kind, need: [3, 2, 2][i], got: 0 })), task: 0, animals: [], spawn: 20, photos: [], flash: 0, aim: null, msg: '', msgT: 0, result: null };
  S.phase = 'game'; Audio.play('camera');
}
const fieldTop = () => -DY + 110;
function spawnAnimal(kind) {
  const g = S.game, left = Math.random() < 0.5, dir = left ? 1 : -1, x = left ? -60 : W + 60;
  const a = { kind, x, y: 0, dir, t: 0, done: false, ph: rand(0, 6) };
  if (kind === 'vogel') { a.y = rand(fieldTop() + 20, 150); a.vx = rand(2.6, 3.6); }
  if (kind === 'frosch') { a.y = FLOOR - 20; a.vx = rand(2.2, 3); }
  if (kind === 'schnecke') { a.y = FLOOR - 16; a.vx = rand(1.1, 1.6); }
  if (kind === 'fisch') { a.x = rand(380, 900); a.y = FLOOR + 10; a.vx = rand(1.5, 2.5) * (Math.random() < 0.5 ? 1 : -1); a.dir = Math.sign(a.vx); a.vy = -rand(9.5, 11.5); }
  if (kind === 'elefant') { a.y = rand(fieldTop() + 40, 170); a.vx = rand(1.8, 2.6); }
  a.vx = Math.abs(a.vx) * a.dir;
  g.animals.push(a);
}
function updateFoto(dt) {
  const g = S.game; if (!g) return;
  for (const p of g.photos) p.t += dt; if (g.flash > 0) g.flash -= dt; if (g.msgT > 0) g.msgT -= dt;
  if (g.result) return;
  g.t += dt;
  // new animals: the wanted kind comes more often
  g.spawn -= dt;
  if (g.spawn <= 0) {
    g.spawn = rand(28, 50);
    const want = g.tasks[g.task].kind, kinds = Object.keys(ANIMALS);
    spawnAnimal(Math.random() < 0.45 ? want : kinds[Math.floor(Math.random() * kinds.length)]);
  }
  for (const a of g.animals) {
    a.t += dt;
    if (a.kind === 'fisch') { a.x += a.vx * dt; a.vy += 0.24 * dt; a.y += a.vy * dt; if (a.y > FLOOR + 30 && a.vy > 0) a.gone = true; }
    else if (a.kind === 'frosch') { a.x += a.vx * dt * (Math.sin(a.t * 0.12) > 0 ? 1.6 : 0.2); a.y = FLOOR - 20 - Math.max(0, Math.sin(a.t * 0.12)) * 70; }
    else { a.x += a.vx * dt; if (a.kind === 'vogel' || a.kind === 'elefant') a.y += Math.sin(a.t * 0.08 + a.ph) * 0.8 * dt; }
    if (a.x < -120 || a.x > W + 120) a.gone = true;
  }
  g.animals = g.animals.filter(a => !a.gone);
  if (g.t >= FOTO_T) { g.result = 'lose'; Audio.play('nomatch'); saveProgress(); }
}
function fotoPointer(p) {
  const g = S.game; if (!g) return;
  if (g.result) {
    if (g.result === 'lose' && inRect(p, GBTN.again)) { startFoto(); return; }
    if (inRect(p, g.result === 'lose' ? GBTN.next2 : GBTN.next)) endFoto();
    return;
  }
  g.aim = { x: p.x, y: p.y, t: 0 }; g.flash = 10; Audio.play('camera');
  let best = null, bd = 60;
  for (const a of g.animals) { if (a.done) continue; const d = Math.hypot(a.x - p.x, a.y - 10 - p.y); if (d < bd) { bd = d; best = a; } }
  if (!best) return;
  best.done = true;
  const task = g.tasks[g.task];
  g.photos.push({ kind: best.kind, t: 0, ok: best.kind === task.kind });
  if (best.kind === task.kind) {
    task.got++; Audio.play('coin');
    if (task.got >= task.need) {
      g.task++; Audio.play('chime');
      if (g.task >= g.tasks.length) { g.task = g.tasks.length - 1; fotoWin(); return; }
      g.msg = tx('Super! Nächste Aufgabe!'); g.msgT = 80;
    }
  } else { g.msg = tx('Das ist ein {a} – gesucht sind {b}!', { a: tx(ANIMALS[best.kind].name), b: tx(ANIMALS[task.kind].plural) }); g.msgT = 110; }
}
function fotoWin() {
  const g = S.game; g.result = 'win'; S.coins += 20; SAVE.mini.foto = true;
  g.pts = !SAVE.pts.mini_foto; if (g.pts) { SAVE.pts.mini_foto = true; S.score += PTS.mini; }
  saveProgress(); Audio.play('win'); Audio.play('cheer');
}
function endFoto() {
  const k = S.kai;
  S.game = null; S.phase = 'play'; saveProgress();
  k.x = SITES.foto + 340; k.y = FLOOR; k.vy = 0; k.ground = true; k.platform = null; k.dir = 0; k.face = 1;
  Audio.play('tink');
}
// ---------------- drawing ----------------
function drawAnimal(kind, x, y, dir, t, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  if (kind === 'vogel') {
    const f = Math.sin(t * 0.35);
    ['#ff5a5a', '#ffb02e', '#ffe14d', '#7dd35a', '#36c6f4', '#b48cff'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(-18 - i * 3, 2 + i * 2, 12, 4, 0.5 + i * 0.12, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff9ad0'; ctx.beginPath(); ctx.moveTo(-4, -2); ctx.quadraticCurveTo(-12, -24 * f - 6, -24, -16 * f - 4); ctx.quadraticCurveTo(-10, 2, -4, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffb02e'; ctx.beginPath(); ctx.moveTo(16, -2); ctx.lineTo(26, 2); ctx.lineTo(16, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(10, -3, 2, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'frosch') {
    ctx.fillStyle = '#7dd35a'; ctx.beginPath(); ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (const ex of [-7, 7]) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex, -13, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(ex + 1.5, -13, 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.beginPath(); ctx.arc(4, 2, 7, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.strokeStyle = OUT; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, -28); ctx.stroke();
    const pr = Math.cos(t * 0.8) * 18; ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.ellipse(0, -29, Math.abs(pr) + 2, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (kind === 'schnecke') {
    ctx.fillStyle = '#ffd9a8'; ctx.beginPath(); ctx.moveTo(-24, 10); ctx.quadraticCurveTo(10, 14, 26, 6); ctx.quadraticCurveTo(28, -10, 20, -10); ctx.lineTo(14, 6); ctx.lineTo(-24, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22, -8); ctx.lineTo(24, -20); ctx.moveTo(18, -8); ctx.lineTo(16, -18); ctx.stroke();
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(24, -21, 2.5, 0, Math.PI * 2); ctx.arc(16, -19, 2.5, 0, Math.PI * 2); ctx.fill();
    // a little white dome house like on Aurora 61 as shell
    ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.arc(-4, 4, 18, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.arc(-4, -4, 6, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#36c6f4'; ctx.fillRect(-20, 0, 32, 3);
  } else if (kind === 'fisch') {
    const f = Math.sin(t * 0.5);
    ctx.fillStyle = '#b48cff'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-26, -9 - f * 3); ctx.lineTo(-26, 9 + f * 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#36c6f4'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-2, -6); ctx.quadraticCurveTo(-8, -26 - f * 6, -18, -20); ctx.quadraticCurveTo(-8, -10, -2, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(9, -3, 2.2, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'elefant') {
    drawElephant(0, 12, 0.5, t, true, 1);
  }
  ctx.restore();
}
function drawFoto() {
  const g = S.game;
  drawAuroraSky(0); drawAuroraHills(0);
  // meadow with a pond
  ctx.fillStyle = '#5fc46a'; ctx.fillRect(0, FLOOR - 10, W, H - FLOOR + 20);
  ctx.fillStyle = '#36c6f4'; ctx.beginPath(); ctx.ellipse(640, FLOOR + 14, 300, 20, 0, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 24; i++) drawFlower(30 + i * 54, FLOOR - 6 + (i % 2) * 6, ['#ff5a8a', '#ffd23a', '#b48cff', '#ffffff'][i % 4], 0.8);
  for (const a of g.animals) {
    ctx.globalAlpha = a.done ? 0.4 : 1;
    drawAnimal(a.kind, a.x, a.y, a.dir, a.t, 1.3);
  }
  ctx.globalAlpha = 1;
  if (g.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${g.flash / 14})`; ctx.fillRect(0, -DY, W, H + DY); }
  if (g.aim) {
    const a = g.aim; ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.beginPath(); ctx.moveTo(a.x + sx * 40, a.y + sy * 26); ctx.lineTo(a.x + sx * 40, a.y + sy * 12); ctx.moveTo(a.x + sx * 40, a.y + sy * 26); ctx.lineTo(a.x + sx * 26, a.y + sy * 26); ctx.stroke(); }
    ctx.restore();
  }
  // the task bar
  const task = g.tasks[g.task];
  ctx.save(); ctx.textBaseline = 'middle';
  const ty = -DY + 82;
  ctx.fillStyle = 'rgba(20,30,50,0.72)'; ctx.beginPath(); ctx.roundRect(W / 2 - 330, ty - 22, 660, 44, 14); ctx.fill();
  drawAnimal(task.kind, W / 2 - 290, ty + 6, 1, S.t, 0.8);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'left';
  ctx.fillText(tx('Fotografiere {n} {a}!', { n: task.need, a: tx(task.need > 1 ? ANIMALS[task.kind].plural : ANIMALS[task.kind].name) }) + '   ' + task.got + ' / ' + task.need, W / 2 - 250, ty + 1);
  ctx.textAlign = 'right'; ctx.fillStyle = '#ffd23a';
  ctx.fillText('⏱ ' + Math.max(0, Math.ceil((FOTO_T - g.t) / 60)) + ' s', W / 2 + 316, ty + 1);
  ctx.fillStyle = '#bfe6ff'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center';
  ctx.fillText(tx('Aufgabe {a} von {b}', { a: g.task + 1, b: g.tasks.length }), W / 2, ty + 34);
  if (g.msgT > 0) { ctx.globalAlpha = Math.min(1, g.msgT / 20); ctx.font = 'bold 20px Arial'; ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.fillStyle = '#ffffff'; ctx.strokeText(g.msg, W / 2, ty + 64); ctx.fillText(g.msg, W / 2, ty + 64); ctx.globalAlpha = 1; }
  // the little photos (polaroids) along the bottom
  g.photos.slice(-8).forEach((p, i) => {
    const px = 70 + i * 74, py = H - 56 + Math.max(0, 20 - p.t) * 3;
    ctx.save(); ctx.translate(px, py); ctx.rotate((i % 2 ? 1 : -1) * 0.08);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.fillRect(-28, -30, 56, 62); ctx.strokeRect(-28, -30, 56, 62);
    ctx.fillStyle = '#bfefff'; ctx.fillRect(-23, -25, 46, 40);
    ctx.save(); ctx.beginPath(); ctx.rect(-23, -25, 46, 40); ctx.clip(); drawAnimal(p.kind, 0, -2, 1, S.t, 0.75); ctx.restore();
    ctx.fillStyle = p.ok ? '#34c759' : '#9aa0a8'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.fillText(p.ok ? '✓' : '·', 0, 24);
    ctx.restore();
  });
  ctx.restore();
  if (g.result) resultPanel(g.result === 'win' ? tx('Tolle Fotos! Abu ist begeistert!') : tx('Die Zeit ist um! Versuch es nochmal.'), g.result === 'win', g.result === 'win' ? tx('+20 Münzen · Pokal-Stern!') + (g.pts ? '  ·  +' + fmtNum(PTS.mini) + ' ' + tx('Punkte') : '') : null);
}
