// =====================================================================
//  DRAWING – DIE LAVAHÖHLEN (same flat cartoon style, dark cave lit by glowing lava)
// =====================================================================
const BASALT = '#4a3a38', BASALT_D = '#33282a', BASALT_L = '#6a5652', LAVA = '#ff6a1a', LAVA_L = '#ffb02e';

function draw() {
  ctx.save();
  if (S.shake > 0) ctx.translate(rand(-S.shake, S.shake) * 0.6, rand(-S.shake, S.shake) * 0.4);
  if (S.phase === 'lore') { drawLoreScene(); ctx.restore(); if (!S.noHud) drawHUD(); drawScreens(); return; }
  drawCaveBack();
  ctx.save(); ctx.translate(-S.cam, 0);
  drawVolcano();
  drawLavaPools();
  drawGround();
  drawCeiling();
  drawPipeUp();
  drawSites();
  drawCheckpoints();
  for (const p of S.plats) if (onScreen(p.x - 20, p.w + 40)) drawPlat(p);
  for (const lf of LAVAFALLS) if (onScreen(lf[0] - 40, 80)) drawLavafall(lf);
  for (const s of S.stalac) if (onScreen(s.x - 30, 60)) drawStalactite(s);
  for (const o of S.objects) if (!o.done && onScreen(o.x - 20, 40)) { if (o.type === 'coin') drawCoin(o); else drawFruitHeart(o); }
  for (const c of S.salas) if (onScreen(c.x - 60, 120) && !(c.dead && c.deadT > 60)) drawSala(c);
  for (const p of S.bats) if (onScreen(p.x - 60, 120) && !(p.dead && p.y > FLOOR + 300)) drawBat(p.x, p.y, p.dir, p.t, 1, p.dead);
  if (S.anky) drawAnky(S.anky);
  drawVolcRocks();
  for (const o of S.blobs) drawLavaBall(o.x, o.y, 9);
  for (const b of S.bombs) drawBomb(b.x, b.y, b.rot, 1);
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

// ---------------- the cave ----------------
function drawCaveBack() {
  const g = ctx.createLinearGradient(0, -DY, 0, H);
  g.addColorStop(0, '#1a0f10'); g.addColorStop(0.6, '#3a1c14'); g.addColorStop(1, '#6a2a12');
  ctx.fillStyle = g; ctx.fillRect(0, -DY, W, H + DY);
  // far cave walls with glowing cracks (slow parallax)
  const off = S.cam * 0.2, span = 1600;
  for (let i = 0; i < 7; i++) {
    const x = ((i * 240 - off) % span + span) % span - 150, top = 60 + (i * 47) % 70;
    ctx.fillStyle = i % 2 ? '#2c1a18' : '#33201c';
    ctx.beginPath(); ctx.moveTo(x - 110, H); ctx.lineTo(x - 70, top + 30); ctx.lineTo(x - 20, top); ctx.lineTo(x + 40, top + 20); ctx.lineTo(x + 110, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(255,110,30,${0.25 + Math.sin(S.t * 0.04 + i) * 0.12})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 30, top + 40); ctx.lineTo(x - 10, top + 90); ctx.lineTo(x - 26, top + 140); ctx.stroke();
  }
  // a warm glow from below
  const gl = ctx.createLinearGradient(0, FLOOR - 120, 0, H); gl.addColorStop(0, 'rgba(255,100,20,0)'); gl.addColorStop(1, 'rgba(255,100,20,0.25)');
  ctx.fillStyle = gl; ctx.fillRect(0, FLOOR - 120, W, H - FLOOR + 120);
}
function drawCeiling() {
  const x0 = Math.floor((S.cam - 60) / 60) * 60, x1 = S.cam + W + 60, top = -DY - 4;
  ctx.save(); ctx.fillStyle = BASALT_D; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, top);
  for (let x = x0; x <= x1; x += 60) ctx.lineTo(x, top + 22 + Math.abs(Math.sin(x * 0.013)) * 18);
  ctx.lineTo(x1, top); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawLavaPools() {
  const x0 = S.cam - 40, x1 = S.cam + W + 40;
  // the lava lies under everything – the rock floor is drawn on top of it
  const g = ctx.createLinearGradient(0, LAVA_Y, 0, H + 40); g.addColorStop(0, LAVA_L); g.addColorStop(0.3, LAVA); g.addColorStop(1, '#c2300e');
  ctx.fillStyle = g; ctx.fillRect(x0, LAVA_Y, x1 - x0, H - LAVA_Y + 40);
  ctx.strokeStyle = '#fff0a0'; ctx.lineWidth = 2; ctx.beginPath();
  for (let x = Math.floor(x0 / 12) * 12; x < x1; x += 12) ctx.lineTo(x, LAVA_Y + Math.sin(x * 0.05 + S.t * 0.08) * 2);
  ctx.stroke();
  // bubbles = warning: a lava ball will jump out here
  for (const b of S.bubbles) { const u = b.t / 50; ctx.fillStyle = `rgba(255,220,120,${0.5 + u * 0.4})`; ctx.strokeStyle = '#ff4a0a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, LAVA_Y, 6 + u * 14, Math.PI, 0); ctx.fill(); ctx.stroke(); }
  // stone crusts left by water bombs (they glow again before they melt)
  for (const c of S.cools) {
    const melt = c.t < 60 && Math.floor(c.t / 6) % 2 === 0;
    ctx.fillStyle = melt ? '#8a5a44' : '#6e6a6a'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(c.x1, FLOOR - 4, c.x2 - c.x1, LAVA_Y - FLOOR + 14, 8); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,30,30,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(c.x1 + 30, FLOOR); ctx.lineTo(c.x1 + 50, FLOOR + 10); ctx.moveTo(c.x2 - 40, FLOOR + 2); ctx.lineTo(c.x2 - 54, FLOOR + 12); ctx.stroke();
  }
}
function drawGround() {
  const x0 = S.cam - 40, x1 = S.cam + W + 40;
  for (const [a, b] of GROUND) {
    if (b < x0 || a > x1) continue;
    const l = Math.max(a, x0), r = Math.min(b, x1);
    const g = ctx.createLinearGradient(0, FLOOR, 0, H + 40); g.addColorStop(0, BASALT); g.addColorStop(1, BASALT_D);
    ctx.fillStyle = g; ctx.fillRect(l, FLOOR - 4, r - l, H - FLOOR + 44);
    ctx.fillStyle = BASALT_L; ctx.fillRect(l, FLOOR - 6, r - l, 6);
    ctx.strokeStyle = 'rgba(255,110,30,0.45)'; ctx.lineWidth = 1.5;
    for (let x = Math.floor(l / 110) * 110; x < r; x += 110) { ctx.beginPath(); ctx.moveTo(x + 20, FLOOR + 6); ctx.lineTo(x + 34, FLOOR + 20); ctx.lineTo(x + 26, FLOOR + 34); ctx.stroke(); }
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(l, FLOOR - 6); ctx.lineTo(r, FLOOR - 6); ctx.stroke();
    // glowing edge where rock meets lava
    ctx.fillStyle = LAVA_L;
    if (a > x0) { ctx.fillRect(a - 3, FLOOR, 4, H - FLOOR + 40); }
    if (b < x1) { ctx.fillRect(b - 1, FLOOR, 4, H - FLOOR + 40); }
  }
}
function drawPlat(p) {
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  const x = p.x, y = p.y;
  ctx.fillStyle = p.kind === 'sink' ? '#5a3a30' : p.kind === 'move' ? '#5e4e4c' : BASALT;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + p.w, y); ctx.lineTo(x + p.w - 14, y + 24); ctx.lineTo(x + p.w * 0.55, y + 34); ctx.lineTo(x + 18, y + 26); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = BASALT_L; ctx.fillRect(x + 2, y - 3, p.w - 4, 5); ctx.lineWidth = 1.5; ctx.strokeRect(x + 2, y - 3, p.w - 4, 5);
  if (p.kind === 'sink') { ctx.strokeStyle = 'rgba(255,120,30,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 10, y + 20); ctx.lineTo(x + p.w - 20, y + 22); ctx.stroke(); }
  if (p.kind === 'move') { ctx.fillStyle = 'rgba(255,160,60,0.5)'; for (let i = 0; i < 3; i++) { const u = (S.t * 0.05 + i / 3) % 1; ctx.beginPath(); ctx.arc(x + p.w * (0.25 + i * 0.25), y + 40 + u * 16, 6 * (1 - u) + 2, 0, Math.PI * 2); ctx.fill(); } }
  ctx.restore();
}
function drawLavafall(lf) {
  const x = lf[0], on = lavafallOn(lf, S.t), warn = lavafallWarn(lf, S.t), top = -DY + 20;
  ctx.save();
  // the opening in the ceiling
  ctx.fillStyle = '#1a0f10'; ctx.beginPath(); ctx.ellipse(x, top, 34, 10, 0, 0, Math.PI * 2); ctx.fill();
  if (on) {
    const g = ctx.createLinearGradient(x - 26, 0, x + 26, 0); g.addColorStop(0, '#d8400e'); g.addColorStop(0.5, LAVA_L); g.addColorStop(1, '#d8400e');
    ctx.fillStyle = g; ctx.fillRect(x - 26, top, 52, FLOOR - top);
    ctx.strokeStyle = 'rgba(255,240,170,0.8)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { const yy = ((S.t * 6 + i * 70) % (FLOOR - top)) + top; ctx.beginPath(); ctx.moveTo(x - 12 + i * 12, yy); ctx.lineTo(x - 12 + i * 12, yy + 30); ctx.stroke(); }
    ctx.fillStyle = LAVA_L; ctx.beginPath(); ctx.ellipse(x, FLOOR - 2, 44, 10, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    if (warn) { ctx.fillStyle = 'rgba(255,170,60,0.8)'; ctx.fillRect(x - 3, top, 6, FLOOR - top); }
    ctx.fillStyle = 'rgba(255,120,30,0.7)'; const d = (S.t * 4) % (FLOOR - top); ctx.beginPath(); ctx.arc(x, top + d, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function drawStalactite(s) {
  if (s.state === 'gone') return;
  const top = -DY + 14;
  let x = s.x, y = s.state === 'fall' ? s.y : top;
  if (s.state === 'shake') x += Math.sin(S.t * 2) * 2.5;
  ctx.save(); ctx.fillStyle = BASALT_L; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x + 16, y); ctx.lineTo(x + 3, y + 46); ctx.lineTo(x - 2, y + 46); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.moveTo(x - 8, y + 4); ctx.lineTo(x - 2, y + 30); ctx.lineTo(x - 2, y + 4); ctx.closePath(); ctx.fill();
  ctx.restore();
  if (s.state === 'fall' || s.state === 'shake') {
    const fy = groundAt(s.x) ? FLOOR : LAVA_Y;
    ctx.fillStyle = 'rgba(20,10,10,0.4)'; ctx.beginPath(); ctx.ellipse(s.x, fy - 3, 14, 3, 0, 0, Math.PI * 2); ctx.fill();
  }
}
function drawPipeUp() {
  const x = PIPE_UP;
  if (!onScreen(x - 80, 200)) return;
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  const g = ctx.createLinearGradient(x - 40, 0, x + 40, 0); g.addColorStop(0, '#6a5a58'); g.addColorStop(0.4, '#a8968e'); g.addColorStop(1, '#4a3c3a');
  ctx.fillStyle = g; ctx.fillRect(x - 36, -DY, 72, FLOOR - 70 + DY); ctx.strokeRect(x - 36, -DY - 4, 72, FLOOR - 70 + DY + 4);
  ctx.fillStyle = '#8a7a74'; ctx.beginPath(); ctx.roundRect(x - 46, FLOOR - 86, 92, 18, 4); ctx.fill(); ctx.stroke();
  ctx.restore();
  drawSign(x + 110, FLOOR - 64, '▲ ' + tx('DINO-TAL'), '#9fe07a');
  if (Math.abs(S.kai.x - x) < 70 && S.phase === 'play') {
    ctx.save(); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center';
    const t = tx('Weiter nach links = zurück ins Tal'); ctx.strokeText(t, x + 140, FLOOR - 150); ctx.fillText(t, x + 140, FLOOR - 150); ctx.restore();
  }
}
function drawCheckpoints() {
  for (const x of CHECKPOINTS) {
    if (!onScreen(x - 30, 60)) continue;
    const on = S.cpX >= x;
    ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.fillStyle = BASALT_L; ctx.beginPath(); ctx.roundRect(x - 14, FLOOR - 40, 28, 36, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6b4a2e'; ctx.fillRect(x - 2, FLOOR - 150, 4, 112);
    const wave = Math.sin(S.t * 0.12) * 4;
    ctx.fillStyle = on ? '#34c759' : '#d8352c';
    ctx.beginPath(); ctx.moveTo(x + 2, FLOOR - 150); ctx.quadraticCurveTo(x + 22, FLOOR - 146 + wave, x + 40, FLOOR - 140); ctx.lineTo(x + 2, FLOOR - 126); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}
function drawSites() {
  const x = SITES.lore;
  if (!onScreen(x - 60, 380)) return;
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  // mine entrance with wooden beams, rails going in
  ctx.fillStyle = '#1a0f10'; ctx.beginPath(); ctx.moveTo(x + 40, FLOOR); ctx.lineTo(x + 40, FLOOR - 110); ctx.quadraticCurveTo(x + 110, FLOOR - 150, x + 180, FLOOR - 110); ctx.lineTo(x + 180, FLOOR); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8a5a32'; ctx.fillRect(x + 30, FLOOR - 120, 14, 120); ctx.strokeRect(x + 30, FLOOR - 120, 14, 120); ctx.fillRect(x + 176, FLOOR - 120, 14, 120); ctx.strokeRect(x + 176, FLOOR - 120, 14, 120);
  ctx.fillRect(x + 22, FLOOR - 132, 176, 14); ctx.strokeRect(x + 22, FLOOR - 132, 176, 14);
  ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 40, FLOOR - 6); ctx.lineTo(x + 300, FLOOR - 6); ctx.stroke();
  drawCart(x + 250, FLOOR - 8, 0.8, false);
  ctx.restore();
  drawSign(x + 120, FLOOR - 150, tx('LORE-FAHRT'), '#ffb02e');
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
function drawLavaBall(x, y, r) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
  g.addColorStop(0, '#fff3a0'); g.addColorStop(0.5, '#ff9a2a'); g.addColorStop(1, '#d8351a');
  ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}
// a water bomb (blue balloon with a knot)
function drawBomb(x, y, rot, s) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot * 0.3); ctx.scale(s, s); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.fillStyle = '#3aa0f0'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.beginPath(); ctx.ellipse(-3.5, -4.5, 3, 4, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1f6fb8'; ctx.beginPath(); ctx.moveTo(-3, 11); ctx.lineTo(3, 11); ctx.lineTo(0, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ---------------- creatures ----------------
function drawSala(c) {
  ctx.save(); ctx.translate(c.x, FLOOR);
  if (c.dead) { ctx.globalAlpha = Math.max(0, 1 - c.deadT / 60); ctx.translate(0, -8); ctx.scale(1, -1); ctx.translate(0, 8); }
  ctx.scale(c.dir, 1); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  const w = c.dead ? 0 : Math.sin(c.t * 0.35) * 5;
  ctx.fillStyle = '#d8401a';
  for (const [lx, sw] of [[-14, w], [12, -w]]) { ctx.beginPath(); ctx.ellipse(lx + sw, -4, 6, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-20, -14); ctx.quadraticCurveTo(-44, -16 + w, -52, -8); ctx.quadraticCurveTo(-40, -8, -18, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff6a2a'; ctx.beginPath(); ctx.ellipse(0, -14, 24, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(26, -18, 12, 8, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd23a'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-14 + i * 9, -21, 2.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(30, -21, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(31, -21, 1.2, 0, Math.PI * 2); ctx.fill();
  // little flames on the back
  if (!c.dead) { ctx.fillStyle = 'rgba(255,200,60,0.8)'; for (let i = 0; i < 3; i++) { const f = Math.sin(S.t * 0.3 + i) * 3; ctx.beginPath(); ctx.moveTo(-10 + i * 10, -22); ctx.quadraticCurveTo(-8 + i * 10, -32 - f, -4 + i * 10, -22); ctx.fill(); } }
  ctx.restore();
}
function drawBat(x, y, dir, t, sc, dead) {
  ctx.save(); ctx.translate(x, y); if (dead) ctx.rotate(dir * 2.6); ctx.scale(dir * sc, sc); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  const f = Math.sin(t * 0.45) * 12;
  ctx.fillStyle = '#4a2a5a';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(s * 18, -16 - f, s * 32, -6 - f); ctx.lineTo(s * 26, 2 - f * 0.3); ctx.lineTo(s * 18, -2); ctx.lineTo(s * 10, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#5e3a70'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(-4, -14); ctx.lineTo(-1, -7); ctx.moveTo(6, -6); ctx.lineTo(4, -14); ctx.lineTo(1, -7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffb02e'; ctx.beginPath(); ctx.arc(-3.5, -1, 2.2, 0, Math.PI * 2); ctx.arc(3.5, -1, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawAnky(a) {
  const cool = a.state === 'cool', hot = a.state === 'hot' || a.state === 'roll' || a.state === 'curl';
  ctx.save();
  if (a.flash > 0 && Math.floor(a.flash / 4) % 2 === 0) ctx.globalAlpha = 0.55;
  const shell = cool ? '#8a8c90' : hot ? '#e2541c' : '#b0562a', spike = cool ? '#cfd3d8' : '#ffd23a';
  if (a.state === 'roll' || a.state === 'curl') {
    // curled up into a spiky ball of fire
    const r = a.state === 'curl' ? 34 + Math.min(1, a.t / 30) * 10 : 44;
    ctx.translate(a.x, FLOOR - r); ctx.rotate(a.rot); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.fillStyle = spike; for (let i = 0; i < 10; i++) { const an = i / 10 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(an - 0.15) * r, Math.sin(an - 0.15) * r); ctx.lineTo(Math.cos(an) * (r + 14), Math.sin(an) * (r + 14)); ctx.lineTo(Math.cos(an + 0.15) * r, Math.sin(an + 0.15) * r); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = shell; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,120,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, Math.PI * 1.4); ctx.stroke();
    ctx.restore(); return;
  }
  ctx.translate(a.x, FLOOR); if (a.state === 'dead') { ctx.translate(0, -40); ctx.rotate(-a.face * a.rot); ctx.translate(0, 40); }
  ctx.scale(a.face, 1); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  const step = a.state === 'walk' ? Math.sin(a.walkT * 0.2) * 5 : 0;
  ctx.fillStyle = cool ? '#7a7c80' : '#8a4a2a';
  for (const [lx, s] of [[-50, step], [-22, -step], [24, step], [50, -step]]) { ctx.beginPath(); ctx.roundRect(lx - 9 + s, -30, 18, 30, 6); ctx.fill(); ctx.stroke(); }
  // tail with club
  ctx.fillStyle = shell; ctx.beginPath(); ctx.moveTo(-70, -40); ctx.quadraticCurveTo(-110, -36, -124, -28); ctx.lineTo(-120, -20); ctx.quadraticCurveTo(-100, -26, -66, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = spike; ctx.beginPath(); ctx.ellipse(-130, -24, 14, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // armoured body
  ctx.fillStyle = shell; ctx.beginPath(); ctx.moveTo(-74, -28); ctx.quadraticCurveTo(-70, -86, 0, -84); ctx.quadraticCurveTo(70, -84, 76, -28); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = spike;
  for (let i = 0; i < 6; i++) { const px = -56 + i * 22, py = -78 - Math.sin((i + 0.5) / 6 * Math.PI) * 8; ctx.beginPath(); ctx.moveTo(px - 7, py + 8); ctx.lineTo(px, py - 8); ctx.lineTo(px + 7, py + 8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (!cool) { ctx.strokeStyle = 'rgba(255,230,120,0.85)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-40, -60); ctx.lineTo(-20, -50); ctx.lineTo(0, -64); ctx.lineTo(24, -52); ctx.lineTo(44, -62); ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; }
  // head
  ctx.fillStyle = cool ? '#9a9ca0' : '#a8562e'; ctx.beginPath(); ctx.moveTo(70, -48); ctx.quadraticCurveTo(100, -52, 108, -34); ctx.quadraticCurveTo(100, -22, 72, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(94, -40, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(95.5, -40, 2, 0, Math.PI * 2); ctx.fill();
  if (cool) { ctx.fillStyle = '#7fd0ff'; ctx.beginPath(); ctx.arc(80, -66, 3, 0, Math.PI * 2); ctx.arc(-10, -96, 3, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
// ---------------- the Riesenvulkan ----------------
const mix = (a, b, u) => { const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16)); return 'rgb(' + pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(',') + ')'; };
function drawVolcano() {
  if (!onScreen(VOLC.baseL - 40, 600)) return;
  const b = S.boss, gr = b ? b.green : 0, cr = b ? b.crater : 0, cx = VOLC.cx, ty = VOLC.craterY;
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  if (b && b.flash > 0 && Math.floor(b.flash / 4) % 2 === 0) ctx.globalAlpha = 0.7;
  // the mountain
  ctx.fillStyle = mix('#5a3a32', '#5aa04a', gr);
  ctx.beginPath(); ctx.moveTo(VOLC.baseL, FLOOR + 4); ctx.lineTo(cx - 70, ty); ctx.lineTo(cx + 70, ty); ctx.lineTo(BOSS_X + W + 120, FLOOR + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  // lava streams down the slopes (they go out when he is beaten)
  if (gr < 0.5) {
    ctx.strokeStyle = LAVA; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.globalAlpha *= 1 - gr * 2;
    ctx.beginPath(); ctx.moveTo(cx - 40, ty + 6); ctx.quadraticCurveTo(cx - 90, ty + 80, cx - 150, FLOOR - 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 30, ty + 6); ctx.quadraticCurveTo(cx + 70, ty + 70, cx + 110, FLOOR - 60); ctx.stroke();
    ctx.globalAlpha = 1; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  }
  // flowers when he is green again
  if (gr > 0.5) { for (let i = 0; i < 9; i++) { const fx = VOLC.baseL + 80 + i * 50, fy = FLOOR - 20 - ((i * 37) % 60); ctx.fillStyle = ['#ff6a8a', '#ffd23a', '#ffffff'][i % 3]; ctx.beginPath(); ctx.arc(fx, fy, 5, 0, Math.PI * 2); ctx.fill(); } }
  // the crater: dim when closed, glowing wide open
  ctx.fillStyle = gr > 0.5 ? '#4a8a3a' : mix('#4a1a10', '#fff0a0', cr);
  ctx.beginPath(); ctx.ellipse(cx, ty, 70, 12 + cr * 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (cr > 0.5 && gr < 0.5) { ctx.fillStyle = `rgba(255,180,60,${(cr - 0.5) * 1.2})`; ctx.beginPath(); ctx.ellipse(cx, ty - 20, 60, 30, 0, 0, Math.PI * 2); ctx.fill(); }
  // the face
  const ey = ty + 60, angry = b && b.state === 'fight';
  ctx.fillStyle = '#fff'; for (const ex of [cx - 40, cx + 40]) { ctx.beginPath(); ctx.ellipse(ex, ey, 16, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = gr > 0.5 ? OUT : '#ff4a0a'; for (const ex of [cx - 42, cx + 38]) { ctx.beginPath(); ctx.arc(ex, ey + 2, 6, 0, Math.PI * 2); ctx.fill(); }
  if (angry) { ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx - 60, ey - 22); ctx.lineTo(cx - 24, ey - 12); ctx.moveTo(cx + 60, ey - 22); ctx.lineTo(cx + 24, ey - 12); ctx.stroke(); ctx.lineWidth = 3; }
  if (gr > 0.5) { ctx.beginPath(); ctx.arc(cx, ey + 34, 26, 0.2, Math.PI - 0.2); ctx.stroke(); }
  else { ctx.fillStyle = '#2a0e08'; ctx.beginPath(); ctx.ellipse(cx, ey + 44, 34, 10 + cr * 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = LAVA; ctx.beginPath(); ctx.ellipse(cx, ey + 48 + cr * 4, 22, 4 + cr * 6, 0, 0, Math.PI * 2); ctx.fill(); }
  // steam after a hit into the crater
  if (b && b.steam > 0) { ctx.fillStyle = `rgba(240,244,250,${b.steam / 60 * 0.8})`; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(cx - 40 + i * 20, ty - 30 - (60 - b.steam) * 1.2 - i * 6, 18, 0, Math.PI * 2); ctx.fill(); } }
  ctx.restore();
}
function drawVolcRocks() {
  for (const r of S.rocks) {
    const u = clamp(r.t / r.T, 0, 1);
    ctx.fillStyle = `rgba(20,5,0,${0.15 + u * 0.45})`; ctx.beginPath(); ctx.ellipse(r.tx, FLOOR - 4, 12 + u * 34, 3 + u * 5, 0, 0, Math.PI * 2); ctx.fill();
    if (u > 0.55) { ctx.strokeStyle = `rgba(255,80,20,${(u - 0.55) * 1.8})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(r.tx, FLOOR - 4, 12 + u * 34, 3 + u * 5, 0, 0, Math.PI * 2); ctx.stroke(); }
    const p = rockPos(r); drawLavaBall(p.x, p.y, 14);
  }
  for (const w of S.waves) {
    ctx.save(); ctx.fillStyle = LAVA; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w.x - 36, FLOOR); ctx.quadraticCurveTo(w.x - 20, FLOOR - 34, w.x, FLOOR - 26); ctx.quadraticCurveTo(w.x + 22, FLOOR - 18, w.x + 30, FLOOR); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = LAVA_L; ctx.beginPath(); ctx.arc(w.x - 10, FLOOR - 22, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ---------------- Kai / Bali ----------------
function drawKai() {
  const k = S.kai, sx = k.x - S.cam;
  if (k.inv > 0 && Math.floor(k.inv / 5) % 2 === 0) return;
  const air = !k.ground, push = k.ground && k.pushT > 0 && k.pushT < 34 ? k.pushT / 34 : 0;
  let fa = k.faceAnim; if (Math.abs(fa) < 0.14) fa = 0.14 * (Math.sign(fa) || 1);
  ctx.save(); ctx.translate(sx, 0);
  // the Magma-Board glows on lava
  if (k.onLava && k.ground) { ctx.fillStyle = `rgba(255,140,40,${0.4 + Math.sin(S.t * 0.4) * 0.2})`; ctx.beginPath(); ctx.ellipse(0, k.y - 4, 50, 10, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.save(); ctx.scale(fa, 1);
  drawKaiFigure({ x: 0, y: k.y, tilt: air ? (k.vy < 0 ? -0.06 : 0.06) : 0, crouch: air ? (k.vy < 0 ? 6 : 4) : k.chargeAt ? chargeCrouch(k) : k.landT > 0 ? 3 + k.landT * 0.6 : push ? 3 : 0,
    push, flip: 0, armsUp: air && k.shootT <= 0, ouch: k.hurtT > 0, wind: Math.min(1, Math.abs(k.vx) / SPEED), outfit: SAVE.outfit });
  if (k.shootT > 0) drawBomb(24, k.y - 64 - (14 - k.shootT) * 0.8, 0, 0.7);
  ctx.restore();
  // heat bar above Kai while he rides on the lava
  if (k.heat > 1) {
    const f = clamp(k.heat / HEAT_MAX, 0, 1);
    ctx.fillStyle = 'rgba(20,10,10,0.7)'; ctx.beginPath(); ctx.roundRect(-30, k.y - 140, 60, 10, 5); ctx.fill();
    ctx.fillStyle = f > 0.66 ? '#ff3b30' : f > 0.33 ? '#ff9a2a' : '#ffd23a'; ctx.beginPath(); ctx.roundRect(-29, k.y - 139, 58 * f, 8, 4); ctx.fill();
  }
  ctx.restore();
}

// ---------------- the mine cart ride (screen space) ----------------
function drawCart(x, y, s, front, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.fillStyle = col || '#6e6a66'; ctx.beginPath(); ctx.moveTo(-46, -46); ctx.lineTo(46, -46); ctx.lineTo(38, -8); ctx.lineTo(-38, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a8680'; ctx.fillRect(-46, -50, 92, 8); ctx.strokeRect(-46, -50, 92, 8);
  ctx.strokeStyle = 'rgba(30,20,20,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-20, -40); ctx.lineTo(-18, -14); ctx.moveTo(20, -40); ctx.lineTo(18, -14); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.fillStyle = '#3a3a40';
  for (const wx of [-26, 26]) { ctx.beginPath(); ctx.arc(wx, -4, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
function drawLoreScene() {
  const g = S.game;
  drawCaveBack();
  if (!g) return;
  const off = g.scroll;
  // three tracks above each other, on wooden scaffolding
  for (let lane = 0; lane < 3; lane++) {
    const ly = laneY(lane), gaps = g.obs.filter(o => o.type === 'gap' && o.lane === lane);
    const isGap = x => gaps.some(o => x > o.x && x < o.x + o.w);
    // scaffold posts (not under the holes)
    ctx.fillStyle = '#5a3a22';
    for (let x = -((off) % 160); x < W + 20; x += 160) if (!isGap(x + 6)) { ctx.fillRect(x, ly + 6, 12, lane === 0 ? H - ly : loreGap() - 8); }
    ctx.fillStyle = '#7a5a3a';
    ctx.beginPath(); let on = false;
    for (let x = -((off) % 40); x < W; x += 40) if (!isGap(x + 8)) ctx.fillRect(x, ly + 2, 18, 7);
    ctx.strokeStyle = '#c4cad2'; ctx.lineWidth = 4; ctx.beginPath(); on = false;
    for (let x = 0; x <= W; x += 6) { if (isGap(x)) { on = false; continue; } if (!on) { ctx.moveTo(x, ly + 2); on = true; } else ctx.lineTo(x, ly + 2); }
    ctx.stroke();
    // holes: glowing lava far below
    for (const o of gaps) { ctx.fillStyle = 'rgba(255,110,30,0.35)'; ctx.fillRect(o.x, ly + 4, o.w, 10); }
  }
  ctx.fillStyle = LAVA; ctx.fillRect(0, H - 8, W, 20);
  // obstacles
  for (const o of g.obs) {
    const ly = laneY(o.lane);
    if (o.type === 'rock') { ctx.fillStyle = BASALT_L; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(o.x, ly + 2); ctx.lineTo(o.x + 6, ly - o.h + 4); ctx.lineTo(o.x + o.w * 0.6, ly - o.h); ctx.lineTo(o.x + o.w, ly + 2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    if (o.type === 'beam') {
      // a low wooden beam hanging down to head height – duck under it
      ctx.fillStyle = '#8a5a32'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
      ctx.fillRect(o.x + o.w / 2 - 5, ly - loreGap() + 8, 10, loreGap() - 100); ctx.strokeRect(o.x + o.w / 2 - 5, ly - loreGap() + 8, 10, loreGap() - 100);
      ctx.fillRect(o.x - 6, ly - 92, o.w + 12, 18); ctx.strokeRect(o.x - 6, ly - 92, o.w + 12, 18);
      ctx.fillStyle = '#ffd23a'; ctx.fillRect(o.x, ly - 86, o.w, 5);
    }
    if (o.type === 'bat') drawBat(o.x + o.w / 2, ly - 85 + Math.sin(o.t * 0.2) * 4, -1, o.t, 1.1, false);
    if (o.type === 'cart') {
      if (o.warn > 0) {
        // warning at the right edge: an oncoming cart on this track!
        if (Math.floor(o.warn / 8) % 2 === 0) { ctx.fillStyle = '#ff3b30'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W - 60, ly - 44, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = 'bold 28px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', W - 60, ly - 43); }
      } else {
        ctx.save(); ctx.translate(o.x + o.w / 2, 0); ctx.scale(-1, 1); drawCart(0, ly + 4, 1, false, '#b8352c'); ctx.restore();
        ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.arc(o.x + 6, ly - 30, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8a8680'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(o.x + 20, ly - 66, 50, 22, 6); ctx.fill(); ctx.stroke();
      }
    }
  }
  for (const gm of g.gems) if (!gm.done) { ctx.save(); ctx.translate(gm.x, laneY(gm.lane) - gm.dy); ctx.fillStyle = '#5ae0ff'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(9, -2); ctx.lineTo(0, 10); ctx.lineTo(-9, -2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  // the cart with Kai (ducking = squeezed down into the cart)
  if (g.result !== 'lose' && !(g.inv > 0 && Math.floor(g.inv / 5) % 2 === 0)) {
    const cy = g.y + g.jy;
    ctx.save(); ctx.translate(CART_X, cy - 30); if (g.duck) ctx.scale(1, 0.55); ctx.translate(-CART_X, -(cy - 30));
    drawKaiFigure({ x: CART_X - 4, y: cy - 30, tilt: g.air ? -0.08 : 0, crouch: g.duck ? 8 : 6, push: 0, flip: 0, armsUp: g.air, wind: 0.9, outfit: SAVE.outfit });
    ctx.restore();
    drawCart(CART_X, cy + 4, 1, true);
  }
  // buttons: ▲ ▼ left, SPRUNG and DUCKEN right
  const b = loreBtn(), R = LBTN.R;
  const btn = (c, label, icon, on, col) => {
    ctx.save(); ctx.globalAlpha = on ? 0.95 : 0.75; ctx.fillStyle = on ? '#ffd23a' : col; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(c.x, c.y, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = OUT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (icon === 'up' || icon === 'down') { const d = icon === 'up' ? -1 : 1; ctx.beginPath(); ctx.moveTo(c.x, c.y + d * 16); ctx.lineTo(c.x - 18, c.y - d * 10); ctx.lineTo(c.x + 18, c.y - d * 10); ctx.closePath(); ctx.fill(); }
    else if (icon === 'jump') { ctx.beginPath(); ctx.moveTo(c.x, c.y - 24); ctx.lineTo(c.x + 16, c.y - 6); ctx.lineTo(c.x + 7, c.y - 6); ctx.lineTo(c.x + 7, c.y + 6); ctx.lineTo(c.x - 7, c.y + 6); ctx.lineTo(c.x - 7, c.y - 6); ctx.lineTo(c.x - 16, c.y - 6); ctx.closePath(); ctx.fill(); }
    else { ctx.fillRect(c.x - 18, c.y - 4, 36, 8); ctx.beginPath(); ctx.moveTo(c.x - 8, c.y - 22); ctx.lineTo(c.x + 8, c.y - 22); ctx.lineTo(c.x, c.y - 10); ctx.closePath(); ctx.fill(); }
    if (label) { ctx.font = 'bold 11px Arial'; ctx.fillText(label, c.x, c.y + 24); }
    ctx.restore();
  };
  btn(b.up, '', 'up', false, '#e6ecf2'); btn(b.down, '', 'down', false, '#e6ecf2');
  btn(b.jump, tx('SPRUNG'), 'jump', g.air, '#7fd0f4'); btn(b.duck, tx('DUCKEN'), 'duck', g.duck, '#f6b98a');
  if (!isTouchDev()) { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText(tx('Tasten: ↑ ↓ = Gleis · Leertaste = springen · X halten = ducken'), W / 2, H - 14); ctx.restore(); }
  // time and crashes
  ctx.save(); ctx.translate(0, -DY);
  ctx.fillStyle = 'rgba(20,10,10,0.6)'; ctx.beginPath(); ctx.roundRect(W / 2 - 170, 8, 340, 30, 12); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(tx('Noch {s} s', { s: Math.max(0, Math.ceil((LORE_T - g.t) / 60)) }) + '   ·   ' + tx('Unfälle: {n} / 3', { n: g.crashes }), W / 2, 24);
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
  if (S.phase === 'play') drawWayBar(S.kai.x, BOSS_X, CHECKPOINTS, S.cpX, [['lore', SITES.lore], ['anky', MID_X + 200]], tx('VULKAN'), '#ff9a2a');
  if (S.fight === 'anky' && S.anky) drawBossBar(tx('MAGMA-ANKYLOSAURUS'), S.anky.bar);
  if (S.fight === 'volcano' && S.boss) drawBossBar(tx('RIESENVULKAN'), S.boss.bar);
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
  ctx.save(); ctx.fillStyle = 'rgba(30,10,6,0.78)'; ctx.fillRect(0, -VH, W, 3 * VH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = titleColor; ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.font = 'bold 40px Arial';
  ctx.strokeText(title, W / 2, ty); ctx.fillText(title, W / 2, ty);
  ctx.fillStyle = '#fff2e6'; ctx.font = 'bold 15px Arial';
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
    panel(tx('DIE LAVAHÖHLEN'), [
      touch ? tx('◀ ▶ links gedrückt halten = fahren · SPRUNG rechts = springen') : tx('Pfeil ← / → halten = fahren · Leertaste / Klick = springen'),
      touch ? tx('Neu: WASSERBOMBEN – Wurf-Taste rechts unten') : tx('Neu: WASSERBOMBEN – X oder rechte Maustaste'),
      tx('Das Magma-Board fährt kurz über Lava – aber nicht zu lange, sonst wird es zu heiß!'),
      tx('Eine Wasserbombe auf Lava macht für kurze Zeit einen Stein-Weg.'),
      tx('In der Mitte: der MAGMA-ANKYLOSAURUS. Am Ende: der RIESENVULKAN.'),
    ], '#ffb02e');
    button(BTN.start, '▶  ' + tx('LOS GEHT\'S'), '#34c759', '#1f8f3c');
  }
  if (S.phase === 'ask' && S.ask === 'up') {
    panel(tx('ZURÜCK INS DINO-TAL?'), [tx('Durch die Röhre kommst du wieder hinauf ins Tal.')], '#9fe07a');
    button(BTN.yes, '▲ ' + tx('JA, HINAUF'), '#34c759', '#1f8f3c'); button(BTN.no, tx('NEIN, HIERBLEIBEN'), '#8a96a8', '#5d6878');
  } else if (S.phase === 'ask') {
    panel(tx('LORE-FAHRT'), [tx('Rase 30 Sekunden mit der Lore über drei Gleise – immer schneller!'), tx('▲ ▼ = Gleis wechseln · SPRUNG = über Löcher und Felsen · DUCKEN = unter Balken und Fledermäusen'), tx('Kommt eine Lore entgegen (rotes !), wechsle schnell das Gleis.'), tx('Belohnung: 20 Münzen und ein Pokal-Stern.')], '#ffb02e');
    button(BTN.yes, tx('JA, SPIELEN!'), '#34c759', '#1f8f3c'); button(BTN.no, tx('NEIN, WEITER'), '#8a96a8', '#5d6878');
  }
  if (S.phase === 'lore' && S.game && S.game.result) {
    ctx.save(); ctx.fillStyle = 'rgba(30,10,6,0.55)'; ctx.fillRect(0, -VH, W, 3 * VH); ctx.restore();
    resultPanel(S.game.result === 'win' ? tx('Super gefahren!') : tx('Zu viele Unfälle! Versuch es nochmal.'), S.game.result === 'win');
  }
  if (S.phase === 'gameover') {
    panel(tx('KEINE LEBEN MEHR!'), [tx('Alle 3 Leben sind weg. Nochmal versuchen?'), tx('Du startest beim letzten Checkpoint.')], '#ff7a6a');
    button(BTN.goYes, tx('NOCHMAL VERSUCHEN'), '#36c6f4', '#1677a8'); button(BTN.goNo, tx('NEIN – ZUM MENÜ'), '#8a96a8', '#5d6878');
  }
  if (S.phase === 'won') {
    const all = SAVE.done.tal && SAVE.done.hoehe && SAVE.done.lava;
    panel(tx('DER RIESENVULKAN IST AUS!'), [tx('Die Lavahöhlen sind geschafft! +30 Münzen'), ...summaryLines(S.summary),
      all ? tx('Alle drei Bosse besiegt – Level 3 ist geschafft!') : tx('Noch offen:') + ' ' + openBosses().join(' · ')], '#7dffa0');
    button(BTN.up, '▲ ' + tx('ZURÜCK INS TAL'), '#34c759', '#1f8f3c'); button(BTN.menu, tx('ZUM MENÜ'), '#8a96a8', '#5d6878');
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
