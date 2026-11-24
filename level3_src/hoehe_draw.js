// =====================================================================
//  DRAWING – DIE FELSENHÖHE (same flat cartoon style as the valley)
//  High up: light blue sky, the valley far below in the haze, rocky plateau with gorges.
// =====================================================================
const GRASS = '#7cc456', GRASS_D = '#5a9e3c', ROCK = '#a58a6a', ROCK_D = '#7e6650', ROCK_L = '#c2a988';

function draw() {
  ctx.save();
  if (S.shake > 0) ctx.translate(rand(-S.shake, S.shake) * 0.6, rand(-S.shake, S.shake) * 0.4);
  if (S.phase === 'ride') { drawRideScene(); ctx.restore(); if (!S.noHud) drawHUD(); drawScreens(); return; }
  drawSkyHigh();
  drawFarPeaks();
  drawNearCliffs();
  ctx.save(); ctx.translate(-S.cam, 0);
  drawOverhangs();
  drawGround();
  drawLianaDown();
  drawSites();
  drawCheckpoints();
  for (const p of S.plats) if (p.state !== 'gone' && onScreen(p.x - 20, p.w + 40)) drawPlat(p);
  drawStoneShadows();
  for (const o of S.objects) if (!o.done && onScreen(o.x - 20, 40)) { if (o.type === 'coin') drawCoin(o); else drawFruitHeart(o); }
  for (const c of S.compys) if (onScreen(c.x - 60, 120) && !(c.dead && c.deadT > 60)) drawCompy(c);
  for (const p of S.pteros) if (onScreen(p.x - 80, 160) && !(p.dead && p.y > FLOOR + 400)) drawPtero(p.x, p.y, p.dir, p.t, p.baby ? 0.58 : 1, p.state === 'warn' || p.state === 'dive', p.dead);
  for (const e of S.eggs) drawEgg(e);
  if (S.boss) drawMama(S.boss);
  for (const s of S.stones) drawStone(s);
  for (const s of S.shots) { ctx.fillStyle = '#8f8a84'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(s.x, s.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  for (const p of S.particles) { ctx.globalAlpha = Math.max(0, Math.min(1, p.life)); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
  drawPops(S.pops);
  ctx.restore();
  if (!S.hideKai) drawKai();
  ctx.restore();
  if (!S.noHud) drawHUD();
  if (!MENU.open) drawScreens();
}
const onScreen = (x, w) => x + w > S.cam - 60 && x < S.cam + W + 60;

// ---------------- background ----------------
function drawSkyHigh() {
  const g = ctx.createLinearGradient(0, -DY, 0, H);
  g.addColorStop(0, '#5fb3ea'); g.addColorStop(0.55, '#a9dcf6'); g.addColorStop(1, '#e4f4fb');
  ctx.fillStyle = g; ctx.fillRect(0, -DY, W, H + DY);
  ctx.fillStyle = 'rgba(255,252,220,0.95)'; ctx.beginPath(); ctx.arc(W * 0.2 - S.cam * 0.02, 50 - DY * 0.4, 38, 0, Math.PI * 2); ctx.fill();
  // drifting clouds (some of them below us – we are very high up)
  for (let i = 0; i < 7; i++) {
    const span = W + 400, x = ((i * 330 - S.cam * (0.08 + (i % 3) * 0.03) - S.t * 0.15) % span + span) % span - 200, y = (i % 2 ? 60 : 170) - DY * (i % 2 ? 0.5 : 0) + (i * 23) % 40;
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.ellipse(x, y, 70, 18, 0, 0, Math.PI * 2); ctx.ellipse(x + 40, y - 12, 40, 18, 0, 0, Math.PI * 2); ctx.ellipse(x - 34, y - 6, 34, 14, 0, 0, Math.PI * 2); ctx.fill();
  }
}
function drawFarPeaks() {
  // a row of far, snowy mountain peaks
  const off = S.cam * 0.08, span = 1560, step = 260;
  for (let i = 0; i < 6; i++) {
    const x = ((i * step - off) % span + span) % span - 200, h = 120 + (i * 53) % 70, w = 170 + (i * 37) % 70, top = H - 40 - h - 60;
    ctx.fillStyle = i % 2 ? '#aebdd0' : '#bccadb';
    ctx.beginPath(); ctx.moveTo(x - w, H); ctx.lineTo(x, top); ctx.lineTo(x + w, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x - w * 0.22, top + h * 0.26); ctx.lineTo(x - w * 0.08, top + h * 0.2); ctx.lineTo(x + w * 0.04, top + h * 0.28); ctx.lineTo(x + w * 0.22, top + h * 0.26); ctx.closePath(); ctx.fill();
  }
}
function drawNearCliffs() {
  // rocky towers with green tops in the middle distance
  const off = S.cam * 0.35, span = 1900;
  for (let i = 0; i < 8; i++) {
    const x = ((i * 260 - off) % span + span) % span - 150;
    if (x < -120 || x > W + 120) continue;
    const top = 120 + (i * 41) % 60, w = 70 + (i * 29) % 40;
    ctx.fillStyle = '#b8a084'; ctx.beginPath(); ctx.moveTo(x - w / 2, H); ctx.lineTo(x - w / 2 + 8, top + 10); ctx.quadraticCurveTo(x, top - 6, x + w / 2 - 6, top + 8); ctx.lineTo(x + w / 2, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8fc56a'; ctx.beginPath(); ctx.ellipse(x, top + 4, w / 2 - 2, 10, 0, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------------- the plateau ----------------
function drawGround() {
  const x0 = S.cam - 40, x1 = S.cam + W + 40;
  for (const [a, b] of GROUND) {
    if (b < x0 || a > x1) continue;
    const l = Math.max(a, x0), r = Math.min(b, x1);
    // rock body going down into the depth
    const g = ctx.createLinearGradient(0, FLOOR, 0, H + 40); g.addColorStop(0, ROCK); g.addColorStop(1, ROCK_D);
    ctx.fillStyle = g; ctx.fillRect(l, FLOOR, r - l, H - FLOOR + 40);
    ctx.fillStyle = 'rgba(80,60,40,0.25)';
    for (let x = Math.floor(l / 70) * 70; x < r; x += 70) { ctx.beginPath(); ctx.ellipse(x + 30, FLOOR + 20 + (x / 70 % 2) * 10, 14, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    // grass on top
    ctx.fillStyle = GRASS; ctx.fillRect(l, FLOOR - 6, r - l, 10);
    ctx.strokeStyle = GRASS_D; ctx.lineWidth = 2;
    for (let x = Math.floor(l / 22) * 22; x < r; x += 22) { ctx.beginPath(); ctx.moveTo(x, FLOOR - 4); ctx.lineTo(x + 4, FLOOR - 12); ctx.lineTo(x + 8, FLOOR - 4); ctx.stroke(); }
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(l, FLOOR - 6); ctx.lineTo(r, FLOOR - 6); ctx.stroke();
    // cliff edges at the gorges
    ctx.fillStyle = ROCK_D;
    if (a > x0) { ctx.beginPath(); ctx.moveTo(a, FLOOR - 6); ctx.lineTo(a + 10, H + 40); ctx.lineTo(a, H + 40); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(a, FLOOR - 6); ctx.lineTo(a, H + 40); ctx.stroke(); }
    if (b < x1) { ctx.beginPath(); ctx.moveTo(b, FLOOR - 6); ctx.lineTo(b - 10, H + 40); ctx.lineTo(b, H + 40); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(b, FLOOR - 6); ctx.lineTo(b, H + 40); ctx.stroke(); }
  }
  // the gorges: haze far down
  for (let i = 0; i < GROUND.length - 1; i++) {
    const a = GROUND[i][1], b = GROUND[i + 1][0];
    if (b < x0 || a > x1) continue;
    const g = ctx.createLinearGradient(0, FLOOR, 0, H + 40); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(230,244,252,0.9)');
    ctx.fillStyle = g; ctx.fillRect(a, FLOOR, b - a, H - FLOOR + 40);
  }
}
function drawPlat(p) {
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  let x = p.x, y = p.y;
  if (p.kind === 'crumble' && p.state === 'shake') x += Math.sin(S.t * 1.7) * 2.5;
  const col = p.kind === 'crumble' ? '#b59a78' : p.kind === 'move' ? '#9c8f86' : ROCK;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + p.w, y); ctx.lineTo(x + p.w - 14, y + 24); ctx.lineTo(x + p.w * 0.55, y + 36); ctx.lineTo(x + 18, y + 26); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (p.kind === 'crumble') {
    // cracks
    ctx.strokeStyle = 'rgba(60,40,20,0.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x + p.w * 0.3, y + 2); ctx.lineTo(x + p.w * 0.38, y + 14); ctx.lineTo(x + p.w * 0.3, y + 24); ctx.moveTo(x + p.w * 0.68, y + 2); ctx.lineTo(x + p.w * 0.62, y + 16); ctx.stroke();
    ctx.fillStyle = '#c9b18f'; ctx.fillRect(x + 2, y - 3, p.w - 4, 5); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.strokeRect(x + 2, y - 3, p.w - 4, 5);
  } else if (p.kind === 'move') {
    // a flat rock floating on a puff of wind (little arrows show the way it moves)
    ctx.fillStyle = '#b9aea6'; ctx.fillRect(x + 2, y - 3, p.w - 4, 6); ctx.lineWidth = 1.5; ctx.strokeRect(x + 2, y - 3, p.w - 4, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 3; i++) { const u = (S.t * 0.04 + i / 3) % 1; ctx.beginPath(); ctx.ellipse(x + p.w * (0.25 + i * 0.25), y + 40 + u * 18, 10 * (1 - u) + 3, 4 * (1 - u) + 1, 0, 0, Math.PI * 2); ctx.fill(); }
  } else {
    ctx.fillStyle = GRASS; ctx.fillRect(x + 2, y - 3, p.w - 4, 6); ctx.lineWidth = 1.5; ctx.strokeRect(x + 2, y - 3, p.w - 4, 6);
  }
  ctx.restore();
}
function drawOverhangs() {
  // the overhanging rocks above the stone-fall zones (at the top of the screen)
  const top = -DY - 4;
  for (const [a, b] of STONE_ZONES) {
    if (!onScreen(a - 40, b - a + 80)) continue;
    ctx.save(); ctx.fillStyle = ROCK_D; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(a - 60, top);
    for (let x = a - 60; x <= b + 60; x += 40) ctx.lineTo(x, top + 34 + Math.sin(x * 0.07) * 10 + ((x / 40) % 2) * 12);
    ctx.lineTo(b + 60, top); ctx.closePath(); ctx.fill(); ctx.stroke();
    // little stalactite points
    ctx.fillStyle = ROCK;
    for (let x = a; x < b; x += 90) { ctx.beginPath(); ctx.moveTo(x - 10, top + 40); ctx.lineTo(x, top + 62); ctx.lineTo(x + 10, top + 40); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    // a warning sign on the ground
    drawSign(a + 40, FLOOR - 60, '⚠ ' + tx('STEINSCHLAG'), '#ffd23a');
    ctx.restore();
  }
}
function drawLianaDown() {
  const x = LIANA_DOWN;
  if (!onScreen(x - 60, 120)) return;
  ctx.save(); ctx.strokeStyle = '#3f7d3a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  // the liana is tied to a stake at the cliff edge and hangs down over it
  ctx.beginPath(); ctx.moveTo(x, FLOOR - 30); ctx.quadraticCurveTo(x - 30, FLOOR + 10, x - 36, H + 40); ctx.stroke();
  ctx.fillStyle = '#4d9a35'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x - 20 - i * 4, FLOOR + 4 + i * 12, 7, 3, 0.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#6b4a2e'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.fillRect(x - 4, FLOOR - 40, 8, 36); ctx.strokeRect(x - 4, FLOOR - 40, 8, 36);
  drawSign(x + 46, FLOOR - 64, '▼ ' + tx('DINO-TAL'), '#9fe07a');
  if (Math.abs(S.kai.x - x) < 50 && S.phase === 'play') {
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center';
    const t = tx('Weiter nach links = hinunterklettern');
    ctx.strokeText(t, x + 120, FLOOR - 150); ctx.fillText(t, x + 120, FLOOR - 150);
  }
  ctx.restore();
}
function drawCheckpoints() {
  for (const x of CHECKPOINTS) {
    if (!onScreen(x - 30, 60)) continue;
    const on = S.cpX >= x;
    ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.fillStyle = '#8c8178'; ctx.beginPath(); ctx.roundRect(x - 14, FLOOR - 40, 28, 36, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6b4a2e'; ctx.fillRect(x - 2, FLOOR - 150, 4, 112);
    const wave = Math.sin(S.t * 0.12) * 4;
    ctx.fillStyle = on ? '#34c759' : '#d8352c';
    ctx.beginPath(); ctx.moveTo(x + 2, FLOOR - 150); ctx.quadraticCurveTo(x + 22, FLOOR - 146 + wave, x + 40, FLOOR - 140); ctx.lineTo(x + 2, FLOOR - 126); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}
function drawSites() {
  // the OXXO tree house
  let x = SITES.oxxo;
  if (onScreen(x - 120, 420)) {
    ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    const tx0 = x + 120;
    // trunk + branches
    ctx.fillStyle = '#7a4f2c'; ctx.beginPath(); ctx.moveTo(tx0 - 26, FLOOR); ctx.lineTo(tx0 - 18, FLOOR - 150); ctx.lineTo(tx0 + 18, FLOOR - 150); ctx.lineTo(tx0 + 28, FLOOR); ctx.closePath(); ctx.fill(); ctx.stroke();
    // crown
    ctx.fillStyle = '#3f8a3a';
    for (const [cx, cy, r] of [[tx0 - 90, FLOOR - 250, 60], [tx0 + 90, FLOOR - 250, 60], [tx0, FLOOR - 290, 74], [tx0 - 40, FLOOR - 230, 50], [tx0 + 50, FLOOR - 230, 50]]) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); }
    // the house on a wooden floor
    ctx.fillStyle = '#a0703a'; ctx.fillRect(tx0 - 110, FLOOR - 154, 220, 14); ctx.strokeRect(tx0 - 110, FLOOR - 154, 220, 14);
    ctx.fillStyle = '#c99a5f'; ctx.fillRect(tx0 - 90, FLOOR - 230, 180, 76); ctx.strokeRect(tx0 - 90, FLOOR - 230, 180, 76);
    ctx.fillStyle = '#8a5a32'; ctx.beginPath(); ctx.moveTo(tx0 - 104, FLOOR - 228); ctx.lineTo(tx0, FLOOR - 268); ctx.lineTo(tx0 + 104, FLOOR - 228); ctx.closePath(); ctx.fill(); ctx.stroke();
    // OXXO sign (red with yellow stripes)
    ctx.fillStyle = '#d8231f'; ctx.beginPath(); ctx.roundRect(tx0 - 62, FLOOR - 222, 124, 34, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(tx0 - 60, FLOOR - 220, 120, 4); ctx.fillRect(tx0 - 60, FLOOR - 194, 120, 4);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OXXO', tx0, FLOOR - 205);
    // window + door
    ctx.fillStyle = '#fff3c4'; ctx.fillRect(tx0 - 76, FLOOR - 184, 34, 24); ctx.strokeRect(tx0 - 76, FLOOR - 184, 34, 24);
    ctx.fillStyle = '#6b4a2e'; ctx.fillRect(tx0 + 30, FLOOR - 186, 34, 32); ctx.strokeRect(tx0 + 30, FLOOR - 186, 34, 32);
    // rope ladder down to the ground
    ctx.strokeStyle = '#c9a26a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(tx0 + 40, FLOOR - 140); ctx.lineTo(tx0 + 40, FLOOR); ctx.moveTo(tx0 + 62, FLOOR - 140); ctx.lineTo(tx0 + 62, FLOOR); ctx.stroke();
    for (let y = FLOOR - 128; y < FLOOR; y += 18) { ctx.beginPath(); ctx.moveTo(tx0 + 40, y); ctx.lineTo(tx0 + 62, y); ctx.stroke(); }
    ctx.restore();
  }
  // pterosaur nest for the ride
  x = SITES.ptero;
  if (onScreen(x - 60, 360)) {
    ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    ctx.fillStyle = '#b48a52'; ctx.beginPath(); ctx.ellipse(x + 110, FLOOR - 10, 90, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#7a5530'; ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.moveTo(x + 30 + i * 17, FLOOR - 26); ctx.lineTo(x + 46 + i * 17, FLOOR - 2); ctx.stroke(); }
    drawPtero(x + 110, FLOOR - 50 + Math.sin(S.t * 0.08) * 3, 1, S.t * 0.4, 0.95, false, false, true);
    drawSign(x + 230, FLOOR - 70, tx('FLUGSAURIER-RITT'), '#ff9ad0');
    ctx.restore();
  }
}
function drawSign(x, y, text, col) {
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.fillStyle = '#6b4a2e'; ctx.fillRect(x - 3, y, 6, FLOOR - y); ctx.strokeRect(x - 3, y, 6, FLOOR - y);
  ctx.font = 'bold 14px Arial'; const w = ctx.measureText(text).width + 22;
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - w / 2, y - 26, w, 26, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y - 12);
  ctx.restore();
}
function drawCoin(o) {
  const s = Math.abs(Math.cos(o.p * 1.5));
  ctx.save(); ctx.translate(o.x, o.y + Math.sin(o.p) * 2); ctx.scale(Math.max(0.15, s), 1);
  ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#c98f10'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
function drawFruitHeart(o) { drawHeart(o.x, o.y + Math.sin(o.p * 1.3) * 4, 12, true); }
function drawHeart(cx, cy, r, full) {
  ctx.save(); ctx.translate(cx, cy); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, r * 0.9);
  ctx.bezierCurveTo(-r * 1.3, -r * 0.1, -r * 0.9, -r * 1.1, 0, -r * 0.45);
  ctx.bezierCurveTo(r * 0.9, -r * 1.1, r * 1.3, -r * 0.1, 0, r * 0.9); ctx.closePath();
  ctx.fillStyle = full ? '#ff3b5c' : 'rgba(255,255,255,0.15)'; ctx.fill();
  ctx.strokeStyle = full ? OUT : 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.8; ctx.stroke();
  if (full) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.35, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

// ---------------- stones ----------------
function drawStoneShadows() {
  for (const s of S.stones) {
    if (!groundAt(s.x)) continue;
    const u = clamp((s.y + DY + 40) / (FLOOR + DY + 40), 0, 1);
    ctx.fillStyle = `rgba(40,30,20,${0.12 + u * 0.4})`; ctx.beginPath(); ctx.ellipse(s.x, FLOOR - 3, 8 + u * 18, 2 + u * 4, 0, 0, Math.PI * 2); ctx.fill();
  }
}
function drawStone(s) {
  ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.fillStyle = '#8c8178'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-s.r, 0); ctx.lineTo(-s.r * 0.5, -s.r * 0.85); ctx.lineTo(s.r * 0.6, -s.r * 0.8); ctx.lineTo(s.r, 0.1 * s.r); ctx.lineTo(s.r * 0.4, s.r * 0.85); ctx.lineTo(-s.r * 0.6, s.r * 0.75); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.ellipse(-s.r * 0.25, -s.r * 0.35, s.r * 0.3, s.r * 0.15, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ---------------- the Mama's eggs ----------------
function drawEgg(e) {
  ctx.save(); ctx.translate(e.x, e.y); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  const wob = e.landed ? Math.sin(e.t * 0.6) * (e.t / 45) * 0.25 : e.rot; ctx.rotate(wob);
  ctx.fillStyle = '#f6efd8'; ctx.beginPath(); ctx.ellipse(0, -11, 9, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d29ac0'; for (const [sx, sy] of [[-3, -16], [3, -8], [-2, -4]]) { ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill(); }
  if (e.landed && e.t > 20) { ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(-3, -9); ctx.lineTo(0, -14); ctx.lineTo(4, -9); ctx.lineTo(8, -12); ctx.stroke(); }
  ctx.restore();
}

// ---------------- creatures ----------------
function drawCompy(c) {
  ctx.save(); ctx.translate(c.x, FLOOR);
  if (c.dead) { const u = Math.min(1, c.deadT / 14); ctx.globalAlpha = Math.max(0, 1 - c.deadT / 60); ctx.translate(0, -Math.sin(u * Math.PI) * 20 - 16); ctx.rotate(-c.dir * Math.PI * u); ctx.translate(0, 16); }
  ctx.scale(c.dir, 1); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
  const run = c.dead ? 0 : Math.sin(c.t * 0.45) * 7;
  ctx.strokeStyle = '#c08a2a'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-4, -20); ctx.lineTo(-6 + run, -8); ctx.lineTo(-2 + run, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, -20); ctx.lineTo(6 - run, -8); ctx.lineTo(10 - run, 0); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 2.2; ctx.fillStyle = '#f0c64a';
  ctx.beginPath(); ctx.moveTo(-8, -28); ctx.quadraticCurveTo(-32, -34, -44, -30 + Math.sin(c.t * 0.3) * 3); ctx.quadraticCurveTo(-30, -22, -6, -18); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(2, -25, 14, 9, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, -30); ctx.quadraticCurveTo(16, -42, 24, -42); ctx.lineTo(34, -38); ctx.quadraticCurveTo(34, -32, 26, -32); ctx.quadraticCurveTo(18, -26, 14, -22); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c08a2a'; ctx.beginPath(); ctx.ellipse(0, -29, 7, 2.5, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(25, -38, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(26, -38, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// a pterosaur (also used big for the Mama): body at (x, y), wings flap
function drawPtero(x, y, dir, t, sc, angry, dead, calm) {
  ctx.save(); ctx.translate(x, y);
  if (dead) ctx.rotate(dir * 2.6);
  ctx.scale(dir * sc, sc); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.4 / Math.max(1, sc * 0.6);
  const f = calm ? Math.sin(t * 0.1) * 0.15 : Math.sin(t * (angry ? 0.32 : 0.2)), body = angry ? '#d9708f' : '#c27ea3', wing = angry ? '#f0a0b8' : '#e2b0cf';
  // far wing
  ctx.fillStyle = wing; ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.moveTo(-6, -4); ctx.quadraticCurveTo(-20, -30 - f * 26, -54, -22 - f * 34); ctx.quadraticCurveTo(-30, -8, -10, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 1;
  // body + tail
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(0, 0, 22, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-18, 2); ctx.lineTo(-40, 6); ctx.lineTo(-18, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  // head with long beak and crest
  ctx.beginPath(); ctx.moveTo(16, -6); ctx.quadraticCurveTo(26, -16, 34, -12); ctx.lineTo(62, -4); ctx.lineTo(34, -2); ctx.quadraticCurveTo(24, 2, 18, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(28, -12); ctx.lineTo(14, -26); ctx.lineTo(34, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(32, -8, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(33, -8, 1.4, 0, Math.PI * 2); ctx.fill();
  if (angry) { ctx.beginPath(); ctx.moveTo(28, -14); ctx.lineTo(36, -11); ctx.stroke(); }
  // near wing
  ctx.fillStyle = wing;
  ctx.beginPath(); ctx.moveTo(4, -4); ctx.quadraticCurveTo(-4, -34 - f * 30, -40, -30 - f * 40); ctx.quadraticCurveTo(-16, -10, 0, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,40,80,0.4)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(2, -2); ctx.lineTo(-30, -26 - f * 34); ctx.stroke();
  // little feet
  ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-2, 9); ctx.lineTo(-6, 16); ctx.moveTo(6, 9); ctx.lineTo(4, 16); ctx.stroke();
  ctx.restore();
}
function drawMama(b) {
  if (b.state === 'dead' && b.t > 140) return;
  const sitting = b.state === 'landed' || b.state === 'hit' || b.state === 'dead';
  if (b.state === 'falling') { drawPtero(b.x, b.y, b.face, b.flap * 0.2, 2.6, false, false); return; }
  ctx.save();
  if (b.flash > 0 && Math.floor(b.flash / 5) % 2 === 0) ctx.globalAlpha = 0.45;
  if (sitting) {
    // standing on the ground: big folded wings, head low and panting
    ctx.translate(b.x, FLOOR); if (b.state === 'dead') { ctx.rotate(-b.face * b.rot * 0.9); }
    ctx.scale(b.face * 2.3, 2.3); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.2;
    const pant = Math.sin(b.t * 0.25) * 1.5;
    ctx.fillStyle = '#8f5a9e';
    ctx.beginPath(); ctx.moveTo(-26, -20); ctx.quadraticCurveTo(-40, -50, -10, -44); ctx.lineTo(10, -30); ctx.quadraticCurveTo(0, -14, -26, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a56fb3'; ctx.beginPath(); ctx.ellipse(0, -24, 22, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(-8, 0); ctx.moveTo(8, -14); ctx.lineTo(10, 0); ctx.stroke(); ctx.lineWidth = 1.2;
    ctx.fillStyle = '#a56fb3';
    ctx.beginPath(); ctx.moveTo(16, -30); ctx.quadraticCurveTo(28, -30 + pant, 34, -24 + pant); ctx.lineTo(60, -14 + pant); ctx.lineTo(34, -16 + pant); ctx.quadraticCurveTo(24, -16, 16, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.moveTo(28, -28 + pant); ctx.lineTo(8, -48 + pant); ctx.lineTo(34, -26 + pant); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(31, -23 + pant, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(32, -23 + pant, 1.1, 0, Math.PI * 2); ctx.fill();
    // sweat drops: she is tired
    if (b.state === 'landed') { ctx.fillStyle = '#7fd0ff'; for (let i = 0; i < 2; i++) { const u = (b.t * 0.03 + i * 0.5) % 1; ctx.beginPath(); ctx.arc(20 - i * 8, -40 - u * 10, 1.8, 0, Math.PI * 2); ctx.fill(); } }
    ctx.restore();
  } else {
    // in the air: her shadow on the ground, then the big pterosaur
    ctx.fillStyle = `rgba(40,30,20,${0.12 + clamp((b.y - 40) / 260, 0, 1) * 0.3})`; ctx.beginPath(); ctx.ellipse(b.x, FLOOR - 3, 60, 6, 0, 0, Math.PI * 2); ctx.fill();
    drawPtero(b.x, b.y, b.face, b.flap, 2.6, b.state === 'swoop', false);
    ctx.restore();
  }
}

// ---------------- Kai / Bali ----------------
function drawKai() {
  const k = S.kai, sx = k.x - S.cam;
  if (k.inv > 0 && Math.floor(k.inv / 5) % 2 === 0 && S.phase !== 'climb') return;
  const air = !k.ground, push = k.ground && k.pushT > 0 && k.pushT < 34 ? k.pushT / 34 : 0;
  let fa = k.faceAnim; if (Math.abs(fa) < 0.14) fa = 0.14 * (Math.sign(fa) || 1);
  ctx.save(); ctx.translate(sx, 0); ctx.scale(fa, 1);
  if (S.phase === 'climb') {
    drawKaiFigure({ x: 0, y: k.y, tilt: 0, crouch: 4, push: 0, flip: 0, armsUp: true, wind: 0, outfit: SAVE.outfit });
    ctx.restore(); return;
  }
  drawKaiFigure({ x: 0, y: k.y, tilt: air ? (k.vy < 0 ? -0.06 : 0.06) : 0, crouch: air ? (k.vy < 0 ? 6 : 4) : k.landT > 0 ? 3 + k.landT * 0.6 : push ? 3 : 0,
    push, flip: 0, armsUp: air && k.shootT <= 0, ouch: k.hurtT > 0, wind: Math.min(1, Math.abs(k.vx) / SPEED), outfit: SAVE.outfit });
  if (k.shootT > 0) drawSling(26, k.y - 52, k.shootT / 14);
  ctx.restore();
}
// the slingshot in Kai's hand (in Kai's own coordinates, facing right)
function drawSling(x, y, u) { drawSlingIcon(x, y, 0.62); }

// ---------------- the pterosaur ride (screen space) ----------------
function drawRideScene() {
  const g = S.game;
  drawSkyHigh();
  // canyon walls far behind, scrolling
  const off = g ? g.scroll * 0.3 : 0;
  ctx.fillStyle = '#c3ab8d';
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = -40; x <= W + 40; x += 30) ctx.lineTo(x, 200 + Math.sin((x + off) * 0.01) * 30 + Math.sin((x + off) * 0.031) * 10);
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#a58a6a'; ctx.fillRect(0, FLOOR, W, H - FLOOR + 10);
  ctx.fillStyle = GRASS; ctx.fillRect(0, FLOOR - 4, W, 8);
  if (!g) return;
  // rock pillars
  for (const pl of g.pillars) {
    ctx.save(); ctx.fillStyle = ROCK; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(pl.x, -DY - 10, pl.w, pl.top + DY + 10, [0, 0, 14, 14]); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(pl.x, pl.bot, pl.w, H - pl.bot + 20, [14, 14, 0, 0]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = GRASS; ctx.fillRect(pl.x + 3, pl.bot - 3, pl.w - 6, 6);
    ctx.fillStyle = 'rgba(80,60,40,0.25)'; ctx.fillRect(pl.x + 10, -DY, 8, pl.top + DY - 10); ctx.fillRect(pl.x + 10, pl.bot + 10, 8, H - pl.bot);
    ctx.restore();
  }
  for (const c of g.coins) if (!c.done) drawCoin({ x: c.x, y: c.y, p: S.t * 0.05 });
  // Kai on the pterosaur
  if (g.result !== 'lose' && !(g.inv > 0 && Math.floor(g.inv / 5) % 2 === 0)) {
    const tilt = clamp(g.vy * 0.05, -0.35, 0.4);
    ctx.save(); ctx.translate(RIDE_X, g.y); ctx.rotate(tilt);
    drawPtero(0, 6, 1, g.wing > 0 ? 6 + (12 - g.wing) * 2 : S.t * 0.25, 1.35, false, false);
    drawKaiFigure({ x: -4, y: -6, tilt: 0, crouch: 6, push: 0, flip: 0, armsUp: false, wind: 0.8, outfit: SAVE.outfit });
    ctx.restore();
  }
  // bumps left
  ctx.save(); ctx.translate(0, -DY);
  ctx.fillStyle = 'rgba(20,30,50,0.6)'; ctx.beginPath(); ctx.roundRect(W / 2 - 170, 8, 340, 30, 12); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(tx('Noch {s} s', { s: Math.max(0, Math.ceil((RIDE_T - g.t) / 60)) }) + '   ·   ' + tx('Zusammenstöße: {n} / 3', { n: g.bumps }), W / 2, 24);
  ctx.restore();
}

// ---------------- HUD ----------------
function drawHUD() {
  ctx.save(); ctx.translate(0, -DY); ctx.textBaseline = 'middle';
  const x = 18, hy = 18, n = S.hearts, show = Math.min(n, 8);
  const boxW = n > 8 ? 120 : Math.max(60, show * 22 + 16);
  ctx.fillStyle = S.heartFlash > 0 ? 'rgba(120,10,20,0.8)' : S.heartFlash < 0 ? 'rgba(120,90,10,0.8)' : 'rgba(20,30,50,0.6)';
  ctx.beginPath(); ctx.roundRect(x - 6, hy - 6, boxW, 26, 10); ctx.fill();
  if (n > 8) { drawHeart(x + 10, hy + 7, 9, true); ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.fillText('× ' + n, x + 26, hy + 8); }
  else for (let i = 0; i < Math.max(show, 1); i++) drawHeart(x + 10 + i * 22, hy + 7, 9, i < n);
  ctx.fillStyle = 'rgba(20,30,50,0.6)'; ctx.beginPath(); ctx.roundRect(W - 168, 10, 156, 30, 10); ctx.fill();
  drawCoin({ x: W - 148, y: 25, p: 0 });
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.fillText('× ' + S.coins, W - 132, 26);
  for (const [b, on, icon] of [[BTN.music, Audio.musicOn, drawNoteIcon], [BTN.sfx, Audio.sfxOn, drawSpeakerIcon]]) {
    ctx.fillStyle = on ? 'rgba(20,30,50,0.6)' : 'rgba(80,10,10,0.7)'; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 9); ctx.fill();
    icon(b.x + b.w / 2 - 1, b.y + b.h / 2, on);
  }
  drawProgressBox(12, 44);
  if (S.phase === 'play') drawWayBar(S.kai.x, BOSS_X, CHECKPOINTS, S.cpX, [['liana', 0], ['oxxo', SITES.oxxo], ['ride', SITES.ptero]], tx('MAMA'), '#ff9ad0');
  if (S.boss && S.phase === 'boss') drawBossBar(tx('FLUGSAURIER-MAMA'), S.boss.bar ?? 1);
  drawScoreBox(S.score);
  if (S.msgTimer > 0) {
    ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, S.msgTimer / 20);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.font = 'bold 24px Arial';
    ctx.strokeText(S.msg, W / 2, 84); ctx.fillText(S.msg, W / 2, 84); ctx.globalAlpha = 1;
  }
  ctx.restore();
}
function drawNoteIcon(x, y, on) {
  ctx.save(); ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x - 3, y + 5, 4, 3, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 1, y + 5); ctx.lineTo(x + 1, y - 8); ctx.lineTo(x + 7, y - 5); ctx.stroke();
  if (!on) { ctx.strokeStyle = '#ff6a5a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9); ctx.stroke(); }
  ctx.restore();
}
function drawSpeakerIcon(x, y, on) {
  ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 8, y - 3); ctx.lineTo(x - 4, y - 3); ctx.lineTo(x + 1, y - 8); ctx.lineTo(x + 1, y + 8); ctx.lineTo(x - 4, y + 3); ctx.lineTo(x - 8, y + 3); ctx.closePath(); ctx.fill();
  if (on) { ctx.beginPath(); ctx.arc(x + 3, y, 6, -0.8, 0.8); ctx.stroke(); }
  else { ctx.strokeStyle = '#ff6a5a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 4, y - 5); ctx.lineTo(x + 10, y + 5); ctx.moveTo(x + 10, y - 5); ctx.lineTo(x + 4, y + 5); ctx.stroke(); }
  ctx.restore();
}

// ---------------- panels ----------------
function panel(title, lines, titleColor, ty = 78) {
  ctx.save(); ctx.fillStyle = 'rgba(16,26,44,0.74)'; ctx.fillRect(0, -VH, W, 3 * VH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = titleColor; ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.font = 'bold 40px Arial';
  ctx.strokeText(title, W / 2, ty); ctx.fillText(title, W / 2, ty);
  ctx.fillStyle = '#f2f8ff'; ctx.font = 'bold 15px Arial';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 120 + i * (lines.length > 4 ? 21 : 24)));
  ctx.restore();
}
function button(b, label, c1, c2) {
  ctx.save(); const pulse = 1 + Math.sin(S.t * 0.08) * 0.03;
  ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(pulse, pulse);
  const g = ctx.createLinearGradient(0, -b.h / 2, 0, b.h / 2); g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 1);
  ctx.restore();
}
function drawScreens() {
  const touch = CTRL.touch;
  if (S.phase === 'start') {
    panel(tx('DIE FELSENHÖHE'), [
      touch ? tx('◀ ▶ links gedrückt halten = fahren · SPRUNG rechts = springen') : tx('Pfeil ← / → halten = fahren · Leertaste / Klick = springen'),
      touch ? tx('Neu: die STEINSCHLEUDER – Schuss-Taste rechts unten') : tx('Neu: die STEINSCHLEUDER – X oder rechte Maustaste'),
      tx('Bröckelnde Felsen fallen weg! Achte auf Steinschlag und Flugsaurier.'),
      tx('Im OXXO im Baumhaus gibt es das Magma-Board für die Lavahöhlen.'),
      tx('Am Ende wartet die FLUGSAURIER-MAMA.'),
    ], '#9fe07a');
    button(BTN.start, '▶  ' + tx('LOS GEHT\'S'), '#34c759', '#1f8f3c');
  }
  if (S.phase === 'ask' && S.ask === 'down') {
    panel(tx('ZURÜCK INS DINO-TAL?'), [tx('An der Liane kannst du hinunter ins Tal klettern.'), tx('Später kommst du an der Liane im Tal wieder herauf.')], '#9fe07a');
    button(BTN.yes, '▼ ' + tx('JA, HINUNTER'), '#34c759', '#1f8f3c'); button(BTN.no, tx('NEIN, HIERBLEIBEN'), '#8a96a8', '#5d6878');
  } else if (S.phase === 'ask') {
    const o = S.ask === 'oxxo';
    panel(o ? tx('OXXO IM BAUMHAUS') : tx('FLUGSAURIER-RITT'), o
      ? [tx('Das OXXO im Baumhaus! Willst du reingehen?'), tx('Hier gibt es das Magma-Board, die Super-Schleuder, Herzen und Kleider.')]
      : [tx('Flieg 25 Sekunden auf einem Flugsaurier durch die Felsen!'), tx('Tippen / Leertaste = mit den Flügeln schlagen. 3 Zusammenstöße und du fällst runter.'), tx('Belohnung: 20 Münzen und ein Pokal-Stern.')], o ? '#ff6a5a' : '#ff9ad0');
    button(BTN.yes, o ? tx('JA, REINGEHEN!') : tx('JA, SPIELEN!'), '#34c759', '#1f8f3c'); button(BTN.no, tx('NEIN, WEITER'), '#8a96a8', '#5d6878');
  }
  if (S.phase === 'shop') drawShop();
  if (S.phase === 'ride' && S.game && S.game.result) {
    ctx.save(); ctx.fillStyle = 'rgba(16,26,44,0.55)'; ctx.fillRect(0, -VH, W, 3 * VH); ctx.restore();
    resultPanel(S.game.result === 'win' ? tx('Super geflogen!') : tx('Abgeworfen! Versuch es beim nächsten Mal.'), S.game.result === 'win');
  }
  if (S.phase === 'gameover') {
    panel(tx('KEINE LEBEN MEHR!'), [tx('Alle 3 Leben sind weg. Nochmal versuchen?'), tx('Du startest beim letzten Checkpoint.')], '#ff7a6a');
    button(BTN.goYes, tx('NOCHMAL VERSUCHEN'), '#36c6f4', '#1677a8'); button(BTN.goNo, tx('NEIN – ZUM MENÜ'), '#8a96a8', '#5d6878');
  }
  if (S.phase === 'won') {
    panel(tx('FLUGSAURIER-MAMA BESIEGT!'), [tx('Die Felsenhöhe ist geschafft! +30 Münzen'), ...summaryLines(S.summary),
      SAVE.items.magmaBoard ? tx('Mit dem Magma-Board geht es durch die Röhre im Tal in die Lavahöhlen.') : tx('Hol dir noch das Magma-Board im OXXO – ohne kommst du nicht in die Lavahöhlen.')], '#7dffa0');
    button(BTN.down, '▼ ' + tx('ZURÜCK INS TAL'), '#34c759', '#1f8f3c'); button(BTN.menu, tx('ZUM MENÜ'), '#8a96a8', '#5d6878');
  }
}
function resultPanel(text, win) {
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = win ? '#7dffa0' : '#ffb0a0'; ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.font = 'bold 26px Arial';
  ctx.strokeText(text, W / 2, 190); ctx.fillText(text, W / 2, 190);
  if (win) { const t = tx('+20 Münzen · Pokal-Stern!') + (S.game && S.game.pts ? '  ·  +' + fmtNum(PTS.mini) + ' ' + tx('Punkte') : ''); ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 18px Arial'; ctx.strokeText(t, W / 2, 222); ctx.fillText(t, W / 2, 222); }
  ctx.restore();
  if (win) button(GBTN.next, tx('WEITER'), '#34c759', '#1f8f3c');
  else { button(GBTN.again, '↻ ' + tx('NOCHMAL'), '#36c6f4', '#1677a8'); button(GBTN.next2, tx('WEITER'), '#8a96a8', '#5d6878'); }
}

// ---------------- the shop ----------------
function drawShop() {
  ctx.save(); ctx.fillStyle = 'rgba(40,14,10,0.86)'; ctx.fillRect(0, -VH, W, 3 * VH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#d8231f'; ctx.beginPath(); ctx.roundRect(W / 2 - 160, 6, 320, 36, 8); ctx.fill();
  ctx.fillStyle = '#ffd23a'; ctx.fillRect(W / 2 - 156, 9, 312, 3); ctx.fillRect(W / 2 - 156, 36, 312, 3);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Arial'; ctx.fillText('OXXO · ' + tx('BAUMHAUS'), W / 2, 25);
  ctx.textAlign = 'right'; ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 16px Arial'; ctx.fillText('● ' + S.coins, W - 30, 25);
  shopList().forEach((it, i) => {
    const r = shopCardRect(i), owned = shopOwned(it), afford = S.coins >= it.price;
    ctx.fillStyle = owned ? 'rgba(52,199,89,0.3)' : 'rgba(255,255,255,0.1)'; ctx.strokeStyle = it.id === 'magma' ? '#ff8a3a' : 'rgba(255,255,255,0.35)'; ctx.lineWidth = it.id === 'magma' ? 3 : 1.5;
    ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 12); ctx.fill(); ctx.stroke();
    drawShopIcon(it, r.x + 34, r.y + 40);
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; let fs = 14; ctx.font = `bold ${fs}px Arial`;
    const nm = tx(it.name); while (ctx.measureText(nm).width > r.w - 70 && fs > 9) { fs--; ctx.font = `bold ${fs}px Arial`; }
    ctx.fillText(nm, r.x + 64, r.y + 24);
    if (it.desc) { ctx.font = '10px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.75)'; wrapText(tx(it.desc), r.x + 64, r.y + 44, r.w - 70, 12); }
    ctx.textAlign = 'center'; ctx.font = 'bold 14px Arial';
    if (owned) { ctx.fillStyle = '#9ff5b5'; ctx.fillText(it.kind === 'cloth' ? tx('Anziehen') : tx('Gekauft ✓'), r.x + r.w / 2, r.y + r.h - 16); }
    else { ctx.fillStyle = afford ? '#ffd23a' : '#ff8a7a'; ctx.fillText('● ' + it.price, r.x + r.w / 2, r.y + r.h - 16); }
  });
  if (S.shopMsgT > 0) { ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.font = 'bold 20px Arial'; ctx.globalAlpha = Math.min(1, S.shopMsgT / 20); ctx.strokeText(S.shopMsg, W / 2, H - 64); ctx.fillText(S.shopMsg, W / 2, H - 64); ctx.globalAlpha = 1; }
  ctx.restore();
  button(BTN.shopDone, tx('FERTIG'), '#34c759', '#1f8f3c');
}
function wrapText(t, x, y, maxW, lh) {
  const words = t.split(' '); let line = '';
  for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); line = w; y += lh; } else line = test; }
  if (line) ctx.fillText(line, x, y);
}
function drawShopIcon(it, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  if (it.id === 'magma') {
    const glow = 0.5 + Math.sin(S.t * 0.1) * 0.3;
    ctx.fillStyle = `rgba(255,120,30,${glow * 0.5})`; ctx.beginPath(); ctx.ellipse(0, 0, 30, 14, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(-0.2); ctx.fillStyle = '#3a2a26'; ctx.beginPath(); ctx.roundRect(-26, -6, 52, 12, 6); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#ff7a1a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-6, -2); ctx.lineTo(4, 2); ctx.lineTo(18, -1); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; for (const wx of [-16, 16]) { ctx.beginPath(); ctx.arc(wx, 8, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  } else if (it.id === 'sling2') {
    drawSlingIcon(-4, 0, 0.95); ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.strokeText('×2', 18, 16); ctx.fillText('×2', 18, 16);
  } else if (it.id === 'heart') drawHeart(0, 0, 16, true);
  else {
    const col = { capRed: '#d8352c', capGreen: '#2f8a5f', capBali: '#f48fb8', capGold: '#e8b923', beanie: '#7a3fb8', backpack: '#e0702b', teeRed: '#c8352c', teeYellow: '#e0a81e', shoesRed: '#d8352c', shorts: '#4a78b8', skirt: '#d94f7c' }[it.id] || '#888';
    ctx.fillStyle = col;
    if (it.id.startsWith('cap')) { ctx.beginPath(); ctx.arc(0, 4, 16, Math.PI, 0); ctx.lineTo(24, 4); ctx.lineTo(16, 9); ctx.lineTo(-16, 9); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (it.id === 'beanie') { ctx.beginPath(); ctx.arc(0, 6, 16, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -12, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else if (it.id.startsWith('tee')) { ctx.beginPath(); ctx.moveTo(-10, -14); ctx.lineTo(-22, -6); ctx.lineTo(-16, 2); ctx.lineTo(-11, -2); ctx.lineTo(-11, 16); ctx.lineTo(11, 16); ctx.lineTo(11, -2); ctx.lineTo(16, 2); ctx.lineTo(22, -6); ctx.lineTo(10, -14); ctx.quadraticCurveTo(0, -8, -10, -14); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (it.id.startsWith('shoes')) { ctx.beginPath(); ctx.moveTo(-18, 8); ctx.lineTo(-18, -4); ctx.lineTo(-4, -4); ctx.quadraticCurveTo(4, 2, 18, 2); ctx.lineTo(18, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-18, 6, 36, 3); }
    else if (it.id === 'backpack') { ctx.beginPath(); ctx.roundRect(-14, -16, 28, 32, 8); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(-9, 0, 18, 12, 4); ctx.stroke(); }
    else if (it.id === 'shorts') { ctx.beginPath(); ctx.moveTo(-16, -10); ctx.lineTo(16, -10); ctx.lineTo(18, 12); ctx.lineTo(3, 12); ctx.lineTo(0, 0); ctx.lineTo(-3, 12); ctx.lineTo(-18, 12); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (it.id === 'skirt') { ctx.beginPath(); ctx.moveTo(-10, -12); ctx.lineTo(10, -12); ctx.lineTo(20, 14); ctx.lineTo(-20, 14); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
}
