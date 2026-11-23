// =====================================================================
//  DRAWING – DINO VALLEY (flat cartoon style with dark outlines, like Level 2)
// =====================================================================
const GRASS = '#6fbf4a', GRASS_D = '#4d9a35', DIRT = '#b07a4c', DIRT_D = '#8a5b35';

function draw() {
  ctx.save();
  if (S.shake > 0) ctx.translate(rand(-S.shake, S.shake) * 0.6, rand(-S.shake, S.shake) * 0.4);
  drawSkyBack();
  drawMountains();
  drawVolcanoLayer();
  drawJungle();
  ctx.save(); ctx.translate(-S.cam, 0);
  drawGround();
  drawSites();
  drawCheckpoints();
  for (const l of LEDGES) if (onScreen(l.x, l.w)) drawLedge(l);
  for (const r of ROCKS) if (onScreen(r.x, r.w)) drawBoulder(r);
  drawFireShadows();
  for (const o of S.objects) if (!o.done && onScreen(o.x - 20, 40)) { if (o.type === 'coin') drawCoin(o); else drawFruitHeart(o); }
  for (const d of S.dinos) if (onScreen(d.x - 200, 400)) drawDino(d);
  if (S.boss) drawRex(S.boss);
  drawWaves();
  for (const p of S.particles) { ctx.globalAlpha = Math.max(0, Math.min(1, p.life)); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
  ctx.restore();
  drawFireballs();
  if (!S.hideKai && S.phase !== 'rodeo') drawKai();
  drawForeground();
  ctx.restore();
  if (!S.noHud) drawHUD();
  if (!MENU.open) drawScreens();
}
const onScreen = (x, w) => x + w > S.cam - 60 && x < S.cam + W + 60;

// ---------------- background ----------------
function drawSkyBack() {
  const g = ctx.createLinearGradient(0, -DY, 0, FLOOR);
  g.addColorStop(0, '#f2a65a'); g.addColorStop(0.45, '#f9cf8e'); g.addColorStop(1, '#fde7b8');
  ctx.fillStyle = g; ctx.fillRect(0, -DY, W, FLOOR + DY);
  // big warm sun
  ctx.fillStyle = 'rgba(255,240,190,0.9)'; ctx.beginPath(); ctx.arc(W * 0.78 - S.cam * 0.02, 60 - DY * 0.3, 46, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,190,0.25)'; ctx.beginPath(); ctx.arc(W * 0.78 - S.cam * 0.02, 60 - DY * 0.3, 80, 0, Math.PI * 2); ctx.fill();
  // flying pterosaurs far away (just silhouettes)
  ctx.strokeStyle = 'rgba(80,50,40,0.45)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const x = ((i * 520 + S.t * 0.5 - S.cam * 0.05) % (W + 200)) - 100, y = 40 + i * 24 - DY * 0.5, f = Math.sin(S.t * 0.12 + i) * 5;
    ctx.beginPath(); ctx.moveTo(x - 14, y - f); ctx.quadraticCurveTo(x - 6, y - 4, x, y); ctx.quadraticCurveTo(x + 6, y - 4, x + 14, y - f); ctx.stroke();
  }
}
function drawMountains() {
  const off = S.cam * 0.12;
  ctx.fillStyle = '#c98a78';
  ctx.beginPath(); ctx.moveTo(0, FLOOR);
  for (let x = -40; x <= W + 40; x += 40) { const wx = x + off; ctx.lineTo(x, 150 + Math.sin(wx * 0.004) * 40 + Math.sin(wx * 0.011) * 18); }
  ctx.lineTo(W, FLOOR); ctx.closePath(); ctx.fill();
}
function drawVolcanoLayer() {
  VOLCANOES.forEach((vx, i) => {
    const x = volcScreenX(vx);
    if (x < -260 || x > W + 260) return;
    drawVolcano(x, i);
  });
}
function drawVolcano(x, i) {
  const base = FLOOR - 20, top = FLOOR - 176, hw = 170, cw = 34;
  // smoke
  for (let j = 0; j < 4; j++) {
    const u = ((S.t * 0.006 + j * 0.25 + i * 0.13) % 1), r = 14 + u * 34;
    ctx.fillStyle = `rgba(90,80,80,${0.45 * (1 - u)})`; ctx.beginPath(); ctx.arc(x + Math.sin(u * 4 + j) * 12, top - 10 - u * 120, r, 0, Math.PI * 2); ctx.fill();
  }
  const g = ctx.createLinearGradient(0, top, 0, base); g.addColorStop(0, '#6a4a40'); g.addColorStop(1, '#8a6250');
  ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x - hw, base); ctx.lineTo(x - cw, top); ctx.lineTo(x + cw, top); ctx.lineTo(x + hw, base); ctx.closePath(); ctx.fill(); ctx.stroke();
  // glowing crater + lava streams
  const glow = 0.6 + Math.sin(S.t * 0.1 + i) * 0.25;
  ctx.fillStyle = `rgba(255,120,30,${glow})`; ctx.beginPath(); ctx.ellipse(x, top, cw, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#ff7a1a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 12, top + 4); ctx.quadraticCurveTo(x - 30, top + 50, x - 52, top + 96); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 14, top + 4); ctx.quadraticCurveTo(x + 26, top + 40, x + 40, top + 70); ctx.stroke();
  ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 12, top + 4); ctx.quadraticCurveTo(x - 30, top + 50, x - 52, top + 96); ctx.stroke();
}
function drawJungle() {
  const off = S.cam * 0.6, span = 1700;
  ctx.fillStyle = '#5c8f4a';
  ctx.beginPath(); ctx.moveTo(0, FLOOR);
  for (let x = -40; x <= W + 40; x += 30) { const wx = x + off; ctx.lineTo(x, FLOOR - 50 - Math.abs(Math.sin(wx * 0.013)) * 30 - Math.sin(wx * 0.004) * 10); }
  ctx.lineTo(W, FLOOR); ctx.closePath(); ctx.fill();
  // palm trees
  for (let i = 0; i < 9; i++) {
    const x = ((i * 233 - off) % span + span) % span - 120;
    if (x < -80 || x > W + 80) continue;
    const h = 110 + (i * 37) % 50;
    ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, FLOOR - 30); ctx.quadraticCurveTo(x + 14, FLOOR - h / 2, x + 6, FLOOR - h); ctx.stroke();
    ctx.fillStyle = '#3f7d3a';
    for (let a = 0; a < 5; a++) {
      const ang = -Math.PI / 2 + (a - 2) * 0.62;
      ctx.beginPath(); ctx.moveTo(x + 6, FLOOR - h);
      ctx.quadraticCurveTo(x + 6 + Math.cos(ang - 0.3) * 40, FLOOR - h + Math.sin(ang - 0.3) * 30, x + 6 + Math.cos(ang) * 62, FLOOR - h + Math.sin(ang) * 30 + 18);
      ctx.quadraticCurveTo(x + 6 + Math.cos(ang + 0.3) * 40, FLOOR - h + Math.sin(ang + 0.3) * 30, x + 6, FLOOR - h); ctx.fill();
    }
  }
}
// ---------------- ground, tar pits ----------------
function drawGround() {
  const x0 = S.cam - 40, x1 = S.cam + W + 40;
  ctx.fillStyle = DIRT; ctx.fillRect(x0, FLOOR, x1 - x0, H - FLOOR + 10);
  ctx.fillStyle = DIRT_D;
  for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) { ctx.beginPath(); ctx.ellipse(x + 30, FLOOR + 22 + (x / 90 % 2) * 8, 10, 5, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = GRASS; ctx.fillRect(x0, FLOOR - 6, x1 - x0, 10);
  ctx.strokeStyle = GRASS_D; ctx.lineWidth = 2;
  for (let x = Math.floor(x0 / 22) * 22; x < x1; x += 22) { ctx.beginPath(); ctx.moveTo(x, FLOOR - 4); ctx.lineTo(x + 4, FLOOR - 12); ctx.lineTo(x + 8, FLOOR - 4); ctx.stroke(); }
  ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, FLOOR - 6); ctx.lineTo(x1, FLOOR - 6); ctx.stroke();
  // tar pits: black, glossy, bubbling
  for (const [a, b] of TAR) {
    if (b < x0 || a > x1) continue;
    ctx.fillStyle = '#16131a'; ctx.fillRect(a, FLOOR - 6, b - a, H - FLOOR + 16);
    ctx.fillStyle = '#2a2430'; ctx.fillRect(a, FLOOR + 4, b - a, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse((a + b) / 2, FLOOR + 6, (b - a) * 0.3, 2, 0, 0, Math.PI * 2); ctx.fill();
    for (let j = 0; j < 3; j++) {
      const u = (S.t * 0.02 + j * 0.33) % 1, bx = a + (b - a) * (0.2 + j * 0.3);
      ctx.strokeStyle = 'rgba(120,110,140,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bx, FLOOR + 4 - u * 6, 3 + u * 5, Math.PI, 0); ctx.stroke();
    }
    ctx.fillStyle = DIRT_D; ctx.fillRect(a - 6, FLOOR - 6, 8, H - FLOOR + 16); ctx.fillRect(b - 2, FLOOR - 6, 8, H - FLOOR + 16);
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.strokeRect(a - 6, FLOOR - 6, 8, H - FLOOR + 16); ctx.strokeRect(b - 2, FLOOR - 6, 8, H - FLOOR + 16);
  }
}
function drawLedge(l) {
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  if (l.kind === 'log') {
    ctx.fillStyle = '#8a5a32'; ctx.beginPath(); ctx.roundRect(l.x, l.y, l.w, 20, 10); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,30,10,0.5)'; ctx.lineWidth = 1.5;
    for (let x = l.x + 24; x < l.x + l.w - 20; x += 36) { ctx.beginPath(); ctx.moveTo(x, l.y + 5); ctx.lineTo(x + 14, l.y + 5); ctx.stroke(); }
    ctx.fillStyle = '#d9a86c'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(l.x + l.w, l.y + 10, 6, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(l.x + l.w, l.y + 10, 3, 5, 0, 0, Math.PI * 2); ctx.stroke();
    // little green leaves on the trunk
    ctx.fillStyle = '#4d9a35'; ctx.beginPath(); ctx.ellipse(l.x + 20, l.y - 2, 8, 4, -0.4, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#9b8a7a'; ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x + l.w, l.y); ctx.lineTo(l.x + l.w - 18, l.y + 26); ctx.lineTo(l.x + 30, l.y + 34); ctx.lineTo(l.x + 8, l.y + 22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = GRASS; ctx.fillRect(l.x + 2, l.y - 3, l.w - 4, 6); ctx.strokeRect(l.x + 2, l.y - 3, l.w - 4, 6);
    ctx.fillStyle = 'rgba(60,40,30,0.25)'; ctx.beginPath(); ctx.ellipse(l.x + l.w * 0.5, l.y + 16, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function drawBoulder(r) {
  const top = FLOOR - r.h;
  ctx.save(); ctx.fillStyle = '#8c8178'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(r.x, FLOOR); ctx.quadraticCurveTo(r.x - 4, top + 6, r.x + r.w * 0.3, top); ctx.lineTo(r.x + r.w * 0.75, top + 2); ctx.quadraticCurveTo(r.x + r.w + 4, top + 10, r.x + r.w, FLOOR); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(r.x + r.w * 0.38, top + 10, r.w * 0.18, 4, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7aa65a'; ctx.beginPath(); ctx.ellipse(r.x + r.w * 0.7, top + 4, 9, 4, 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawCheckpoints() {
  for (const x of CHECKPOINTS) {
    if (!onScreen(x - 30, 60)) continue;
    const on = S.cpX >= x;
    ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    // a carved totem with a flag
    ctx.fillStyle = '#a0703a'; ctx.beginPath(); ctx.roundRect(x - 12, FLOOR - 96, 24, 92, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 4, FLOOR - 80, 3, 0, Math.PI * 2); ctx.arc(x + 4, FLOOR - 80, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = OUT; ctx.fillRect(x - 6, FLOOR - 66, 12, 3);
    ctx.fillStyle = '#6b4a2e'; ctx.fillRect(x - 2, FLOOR - 150, 4, 56);
    const wave = Math.sin(S.t * 0.12) * 4;
    ctx.fillStyle = on ? '#34c759' : '#d8352c';
    ctx.beginPath(); ctx.moveTo(x + 2, FLOOR - 150); ctx.quadraticCurveTo(x + 22, FLOOR - 146 + wave, x + 40, FLOOR - 140); ctx.lineTo(x + 2, FLOOR - 126); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}
function drawSites() {
  // DINO-RODEO corral
  let x = SITES.rodeo;
  if (onScreen(x - 40, 340)) {
    ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    ctx.fillStyle = '#a0703a';
    for (let i = 0; i < 6; i++) { ctx.fillRect(x + i * 50, FLOOR - 52, 8, 50); ctx.strokeRect(x + i * 50, FLOOR - 52, 8, 50); }
    ctx.fillRect(x, FLOOR - 46, 258, 7); ctx.strokeRect(x, FLOOR - 46, 258, 7); ctx.fillRect(x, FLOOR - 26, 258, 7); ctx.strokeRect(x, FLOOR - 26, 258, 7);
    drawSign(x + 120, FLOOR - 70, tx('DINO-RODEO'), '#ffb02e');
    drawTrike(x + 200, 0.6, 1, 0);           // a young triceratops waiting
    ctx.restore();
  }
  // FOSSIL dig site
  x = SITES.fossil;
  if (onScreen(x - 40, 340)) {
    ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    ctx.fillStyle = '#e3c88f'; ctx.beginPath(); ctx.ellipse(x + 150, FLOOR - 2, 140, 14, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fbf3df'; ctx.lineWidth = 1.5;
    for (const [bx, a] of [[x + 70, -0.4], [x + 190, 0.3], [x + 240, -0.2]]) { ctx.save(); ctx.translate(bx, FLOOR - 10); ctx.rotate(a); ctx.beginPath(); ctx.roundRect(-14, -3, 28, 6, 3); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(-14, -3, 4, 0, Math.PI * 2); ctx.arc(-14, 3, 4, 0, Math.PI * 2); ctx.arc(14, -3, 4, 0, Math.PI * 2); ctx.arc(14, 3, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    // shovel
    ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 280, FLOOR - 70); ctx.lineTo(x + 268, FLOOR - 16); ctx.stroke();
    ctx.fillStyle = '#9aa6b1'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 262, FLOOR - 22); ctx.lineTo(x + 276, FLOOR - 19); ctx.lineTo(x + 270, FLOOR - 4); ctx.lineTo(x + 258, FLOOR - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    drawSign(x + 120, FLOOR - 70, tx('FOSSILIEN'), '#e3c88f');
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
function drawForeground() {
  // a few big ferns in front (they move faster than the ground)
  const off = S.cam * 1.25, span = 2300;
  for (let i = 0; i < 5; i++) {
    const x = ((i * 470 - off) % span + span) % span - 150;
    if (x < -100 || x > W + 100) continue;
    ctx.save(); ctx.translate(x, H + 6); ctx.fillStyle = '#2f6e2e';
    for (let a = 0; a < 6; a++) { ctx.save(); ctx.rotate(-1.3 + a * 0.5); ctx.beginPath(); ctx.ellipse(0, -34, 9, 36, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }
}

// ---------------- fireballs (screen space: they come from the volcano in the back) ----------------
function drawFireShadows() {
  for (const f of S.fireballs) {
    const u = clamp(f.t / f.T, 0, 1);
    ctx.fillStyle = `rgba(40,10,0,${0.15 + u * 0.4})`;
    ctx.beginPath(); ctx.ellipse(f.tx, FLOOR - 4, 14 + u * 40, 3 + u * 6, 0, 0, Math.PI * 2); ctx.fill();
    if (u > 0.55) { ctx.strokeStyle = `rgba(255,80,20,${(u - 0.55) * 1.6})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(f.tx, FLOOR - 4, 14 + u * 40, 3 + u * 6, 0, 0, Math.PI * 2); ctx.stroke(); }
  }
}
function drawFireballs() {
  for (const f of S.fireballs) {
    const p = fireballPos(f), r = 14 * p.s;
    // tail
    for (let j = 1; j <= 5; j++) {
      const q = fireballPos({ vi: f.vi, tx: f.tx, t: Math.max(0, f.t - j * 4), T: f.T });
      ctx.fillStyle = `rgba(255,${120 + j * 20},40,${0.35 - j * 0.05})`; ctx.beginPath(); ctx.arc(q.x, q.y, r * (1 - j * 0.12), 0, Math.PI * 2); ctx.fill();
    }
    const g = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, 1, p.x, p.y, r);
    g.addColorStop(0, '#fff3a0'); g.addColorStop(0.5, '#ff9a2a'); g.addColorStop(1, '#d8351a');
    ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 1 + p.s * 1.5;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
}

// ---------------- Kai / Bali ----------------
function drawKai() {
  const k = S.kai, sx = k.x - S.cam;
  if (k.inv > 0 && Math.floor(k.inv / 5) % 2 === 0) return;      // blinking after a hit
  const air = !k.ground, push = k.ground && k.pushT > 0 && k.pushT < 34 ? k.pushT / 34 : 0;
  let fa = k.faceAnim; if (Math.abs(fa) < 0.14) fa = 0.14 * (Math.sign(fa) || 1);
  ctx.save(); ctx.translate(sx, 0); ctx.scale(fa, 1);
  drawKaiFigure({ x: 0, y: k.y, tilt: air ? (k.vy < 0 ? -0.06 : 0.06) : 0, crouch: air ? (k.vy < 0 ? 6 : 4) : k.landT > 0 ? 3 + k.landT * 0.6 : push ? 3 : 0,
    push, flip: 0, armsUp: air, ouch: k.hurtT > 0, wind: Math.min(1, Math.abs(k.vx) / SPEED), outfit: SAVE.outfit });
  ctx.restore();
}

// ---------------- dinosaurs (all drawn facing RIGHT, mirrored for left) ----------------
function drawDino(d) {
  if (d.type === 'trike') drawTrike(d.x, 1, d.dir, d.t, d.state === 'charge');
  if (d.type === 'stego') drawStego(d.x, d.dir, d.t);
  if (d.type === 'raptor') drawRaptor(d.x, d.dir, d.t, d.hop);
  if (d.type === 'brachio') drawBrachio(d.x, d.dir, d.t);
}
function legs(xs, y0, len, t, col, w = 14, speed = 0.18) {
  ctx.fillStyle = col; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  xs.forEach((lx, i) => { const sw = Math.sin(t * speed + i * Math.PI) * 6; ctx.beginPath(); ctx.roundRect(lx + sw - w / 2, y0, w, len, 5); ctx.fill(); ctx.stroke(); });
}
function eye(x, y, r = 4) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(x + r * 0.3, y, r * 0.5, 0, Math.PI * 2); ctx.fill(); }
function drawTrike(x, sc, dir, t, angry) {
  ctx.save(); ctx.translate(x, FLOOR); ctx.scale(dir * sc, sc); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  const bob = Math.abs(Math.sin(t * (angry ? 0.35 : 0.18))) * 3;
  legs([-44, -20, 22, 44], -30 - bob, 30, t * (angry ? 2 : 1), '#6f9a4e', 16);
  ctx.translate(0, -bob);
  // tail + body
  ctx.fillStyle = '#86b562';
  ctx.beginPath(); ctx.moveTo(-60, -44); ctx.quadraticCurveTo(-96, -40, -108, -30); ctx.quadraticCurveTo(-90, -30, -58, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-4, -48, 64, 30, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6f9a4e'; ctx.beginPath(); ctx.ellipse(-10, -60, 40, 10, 0, 0, Math.PI * 2); ctx.fill();
  // frill
  ctx.fillStyle = angry ? '#ff6a3a' : '#f2a03a';
  ctx.beginPath(); ctx.ellipse(54, -66, 22, 34, 0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd23a'; for (let i = 0; i < 5; i++) { const a = -1.4 + i * 0.6; ctx.beginPath(); ctx.arc(54 + Math.cos(a) * 26, -66 + Math.sin(a) * 30, 3, 0, Math.PI * 2); ctx.fill(); }
  // head
  ctx.fillStyle = '#86b562'; ctx.beginPath(); ctx.moveTo(52, -66); ctx.quadraticCurveTo(84, -66, 96, -42); ctx.lineTo(88, -30); ctx.quadraticCurveTo(66, -28, 52, -36); ctx.closePath(); ctx.fill(); ctx.stroke();
  // horns
  ctx.fillStyle = '#fbf3df';
  for (const [hx, hy, len] of [[66, -62, 26], [78, -60, 24]]) { ctx.beginPath(); ctx.moveTo(hx - 4, hy); ctx.lineTo(hx + len, hy - 14); ctx.lineTo(hx + 4, hy + 2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(90, -46); ctx.lineTo(104, -52); ctx.lineTo(94, -40); ctx.closePath(); ctx.fill(); ctx.stroke();
  eye(72, -50, 4);
  if (angry) { ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(66, -58); ctx.lineTo(78, -54); ctx.stroke(); }
  ctx.restore();
}
function drawStego(x, dir, t) {
  ctx.save(); ctx.translate(x, FLOOR); ctx.scale(dir, 1); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  legs([-48, -24, 26, 50], -34, 34, t, '#4f8c7f', 18, 0.12);
  // plates on the back
  ctx.fillStyle = '#e0613a';
  for (let i = 0; i < 6; i++) { const px = -56 + i * 22, py = -80 - Math.sin((i + 0.5) / 6 * Math.PI) * 18, s = 14 + Math.sin((i + 0.5) / 6 * Math.PI) * 8; ctx.beginPath(); ctx.moveTo(px - s * 0.6, py + 14); ctx.lineTo(px, py - s); ctx.lineTo(px + s * 0.6, py + 14); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // tail with spikes
  ctx.fillStyle = '#5fa596';
  ctx.beginPath(); ctx.moveTo(-60, -60); ctx.quadraticCurveTo(-110, -60, -124, -44); ctx.quadraticCurveTo(-100, -40, -62, -38); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fbf3df';
  for (const [sx, sy, a] of [[-112, -54, -0.9], [-120, -50, -0.5]]) { ctx.beginPath(); ctx.moveTo(sx - 3, sy); ctx.lineTo(sx - 3 + Math.cos(a - 1.3) * 18, sy + Math.sin(a - 1.3) * 18); ctx.lineTo(sx + 4, sy); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // body (high arched back)
  ctx.fillStyle = '#5fa596'; ctx.beginPath(); ctx.moveTo(-66, -40); ctx.quadraticCurveTo(-60, -100, 0, -96); ctx.quadraticCurveTo(56, -92, 66, -42); ctx.closePath(); ctx.fill(); ctx.stroke();
  // small head down in front
  ctx.beginPath(); ctx.moveTo(60, -54); ctx.quadraticCurveTo(84, -56, 96, -38); ctx.quadraticCurveTo(84, -30, 62, -38); ctx.closePath(); ctx.fill(); ctx.stroke();
  eye(84, -45, 3);
  ctx.restore();
}
function drawRaptor(x, dir, t, hop) {
  ctx.save(); ctx.translate(x, FLOOR - hop); ctx.scale(dir, 1); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  const run = Math.sin(t * 0.4) * 10;
  ctx.strokeStyle = '#6f5fa0'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(-6, -32); ctx.lineTo(-10 + run, -14); ctx.lineTo(-4 + run, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, -32); ctx.lineTo(8 - run, -14); ctx.lineTo(14 - run, 0); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  // tail + body
  ctx.fillStyle = '#8a7bc0';
  ctx.beginPath(); ctx.moveTo(-14, -44); ctx.quadraticCurveTo(-50, -54, -70, -50 + Math.sin(t * 0.3) * 4); ctx.quadraticCurveTo(-48, -40, -12, -32); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(4, -40, 22, 13, -0.25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // neck + head with teeth
  ctx.beginPath(); ctx.moveTo(14, -48); ctx.quadraticCurveTo(22, -64, 32, -66); ctx.lineTo(54, -62); ctx.quadraticCurveTo(56, -54, 50, -52); ctx.lineTo(34, -52); ctx.quadraticCurveTo(26, -44, 22, -38); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(38 + i * 5, -52); ctx.lineTo(40 + i * 5, -48); ctx.lineTo(42 + i * 5, -52); ctx.fill(); }
  ctx.fillStyle = '#5a4b90'; ctx.beginPath(); ctx.ellipse(2, -46, 12, 4, -0.3, 0, Math.PI * 2); ctx.fill();
  eye(40, -60, 3);
  ctx.strokeStyle = '#6f5fa0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(18, -40); ctx.lineTo(26, -34); ctx.stroke();
  ctx.restore();
}
function drawBrachio(x, dir, t) {
  ctx.save(); ctx.translate(x, FLOOR); ctx.scale(dir, 1); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  legs([-56, -30, 34, 60], -70, 70, t, '#6e93b4', 22, 0.08);
  // tail
  ctx.fillStyle = '#86a9c8';
  ctx.beginPath(); ctx.moveTo(-80, -100); ctx.quadraticCurveTo(-150, -96, -176, -70); ctx.quadraticCurveTo(-140, -76, -80, -78); ctx.closePath(); ctx.fill(); ctx.stroke();
  // body (its back is the platform at FLOOR-118)
  ctx.beginPath(); ctx.moveTo(-92, -76); ctx.quadraticCurveTo(-90, -122, -20, -120); ctx.lineTo(40, -120); ctx.quadraticCurveTo(96, -118, 92, -76); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6e93b4'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(-50 + i * 24, -104 + (i % 2) * 6, 7, 4, 0, 0, Math.PI * 2); ctx.fill(); }
  // long neck and small head, nodding
  const nod = Math.sin(t * 0.04) * 6;
  ctx.fillStyle = '#86a9c8';
  ctx.beginPath(); ctx.moveTo(60, -112); ctx.quadraticCurveTo(110, -170, 112, -236 + nod); ctx.lineTo(134, -236 + nod); ctx.quadraticCurveTo(128, -160, 86, -94); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(132, -244 + nod, 24, 13, 0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  eye(140, -248 + nod, 3.5);
  ctx.beginPath(); ctx.arc(146, -240 + nod, 5, 0.2, 1.4); ctx.stroke();      // friendly smile
  ctx.restore();
}
// ---------------- T-REX ----------------
function drawRex(b) {
  ctx.save(); ctx.translate(b.x, FLOOR); ctx.scale(b.face, 1);
  if (b.state === 'dead') { ctx.translate(60, 0); ctx.rotate(b.rot * 0.24); ctx.translate(-60, 0); ctx.globalAlpha = clamp(1.6 - b.rot, 0.35, 1); }   // tips over forward, dizzy
  if (b.state !== 'dead' && b.flash > 0 && Math.floor(b.flash / 4) % 2 === 0) ctx.globalAlpha = 0.55;
  ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  const step = Math.sin(b.step * 0.05) * 8, H2 = b.state === 'dead' ? 1 : b.head;    // 0 = head up, 1 = head down (dizzy)
  const body = '#7d9c46', dark = '#5f7d33';
  // back leg
  ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(-30 - step, -60, 28, 44, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-46 - step, -24, 34, 24, 6); ctx.fill(); ctx.stroke();
  // tail
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.moveTo(-60, -130); ctx.quadraticCurveTo(-160, -120, -220, -60 + Math.sin(b.t * 0.08) * 6); ctx.quadraticCurveTo(-150, -86, -60, -80); ctx.closePath(); ctx.fill(); ctx.stroke();
  // body (tilts forward when the head goes down)
  ctx.save(); ctx.rotate(H2 * 0.28);
  ctx.beginPath(); ctx.ellipse(0, -112, 86, 52, -0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c8d98a'; ctx.beginPath(); ctx.ellipse(20, -92, 54, 26, -0.15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = dark; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(-50 + i * 22, -150 + i * 2, 8, 4, 0, 0, Math.PI * 2); ctx.fill(); }
  // tiny arms
  ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.fillStyle = body;
  ctx.beginPath(); ctx.moveTo(58, -100); ctx.quadraticCurveTo(76, -96, 78, -84); ctx.lineTo(72, -82); ctx.quadraticCurveTo(68, -90, 56, -92); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  // neck + head (up when walking, down near the ground when dizzy)
  const hx = 128 + H2 * 22, hy = -176 + H2 * 112, ang = H2 * 0.5;
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.moveTo(50, -150 + H2 * 30); ctx.quadraticCurveTo(hx - 40, hy - 10, hx - 30, hy); ctx.lineTo(hx - 24, hy + 30); ctx.quadraticCurveTo(70, -110 + H2 * 40, 60, -100); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang);
  const roar = b.state === 'roar' ? 0.35 : b.state === 'hit' ? 0.25 : 0.08;
  // lower jaw
  ctx.save(); ctx.rotate(roar);
  ctx.beginPath(); ctx.moveTo(-36, 6); ctx.lineTo(44, 10); ctx.quadraticCurveTo(46, 22, 30, 24); ctx.lineTo(-30, 20); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-20 + i * 11, 9); ctx.lineTo(-16 + i * 11, 2); ctx.lineTo(-12 + i * 11, 9); ctx.fill(); }
  ctx.restore();
  // upper head
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.moveTo(-44, -6); ctx.quadraticCurveTo(-40, -34, 0, -34); ctx.lineTo(40, -28); ctx.quadraticCurveTo(56, -20, 52, 4); ctx.lineTo(-36, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(-22 + i * 11, 4); ctx.lineTo(-18 + i * 11, 12); ctx.lineTo(-14 + i * 11, 4); ctx.fill(); }
  // eye + angry brow / dizzy swirl
  if (b.state === 'dizzy' || b.state === 'dead') {
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath();
    for (let a = 0; a < 10; a++) { const r = a * 0.7; ctx.lineTo(8 + Math.cos(a * 1.2) * r, -18 + Math.sin(a * 1.2) * r); } ctx.stroke();
  } else {
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(8, -18, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.ellipse(10, -18, 1.8, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-4, -30); ctx.lineTo(18, -24); ctx.stroke();
  }
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(40, -20, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // front leg
  ctx.fillStyle = body; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(26 + step, -58, 26, 42, -0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(12 + step, -24, 36, 24, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(40 + step + i * 4, -2); ctx.lineTo(46 + step + i * 4, 0); ctx.lineTo(40 + step + i * 4, 2); ctx.fill(); }
  ctx.globalAlpha = 1;
  ctx.restore();
  // dizzy stars over the lowered head
  if (b.state === 'dizzy') {
    const h = rexHead(b);
    for (let i = 0; i < 3; i++) { const a = S.t * 0.12 + i * 2.1; drawStar(h.x + Math.cos(a) * 34, h.y - 46 + Math.sin(a) * 8, 7); }
    // a soft hint arrow above the head
    ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(S.t * 0.2) * 0.4; ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(h.x, h.y - 64); ctx.lineTo(h.x - 12, h.y - 84); ctx.lineTo(h.x + 12, h.y - 84); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
}
function drawStar(x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
function drawWaves() {
  for (const w of S.waves) {
    const a = Math.min(1, w.life / 40);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(w.x, FLOOR - 4); ctx.scale(Math.sign(w.vx), 1);
    ctx.fillStyle = '#c8955e'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(-6, -26, 14, -18); ctx.quadraticCurveTo(26, -10, 26, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a9744a'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-14 + i * 12, -18 - (i % 2) * 6, 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
}

// ---------------- HUD ----------------
function drawNoteIcon(x, y, on) {
  ctx.save(); ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x - 4, y + 5, 4, 3, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x, y + 5); ctx.lineTo(x, y - 8); ctx.lineTo(x + 7, y - 5); ctx.stroke();
  if (!on) { ctx.strokeStyle = '#ff5a4f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9); ctx.stroke(); }
  ctx.restore();
}
function drawSpeakerIcon(x, y, on) {
  ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 8, y - 3); ctx.lineTo(x - 4, y - 3); ctx.lineTo(x + 2, y - 8); ctx.lineTo(x + 2, y + 8); ctx.lineTo(x - 4, y + 3); ctx.lineTo(x - 8, y + 3); ctx.closePath(); ctx.fill();
  if (on) { ctx.beginPath(); ctx.arc(x + 3, y, 6, -0.8, 0.8); ctx.stroke(); }
  else { ctx.strokeStyle = '#ff5a4f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9); ctx.stroke(); }
  ctx.restore();
}
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
  // way to the T-Rex
  if (S.phase === 'play') {
    const bx = W / 2 - 160, bw = 320, u = clamp(S.kai.x / BOSS_X, 0, 1);
    ctx.fillStyle = 'rgba(20,30,50,0.55)'; ctx.beginPath(); ctx.roundRect(bx - 10, 8, bw + 54, 26, 12); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.roundRect(bx, 17, bw, 8, 4); ctx.fill();
    ctx.fillStyle = '#7dd35a'; ctx.beginPath(); ctx.roundRect(bx, 17, bw * u, 8, 4); ctx.fill();
    for (const c of CHECKPOINTS) { ctx.fillStyle = S.cpX >= c ? '#34c759' : '#d8352c'; ctx.fillRect(bx + bw * c / BOSS_X - 1, 13, 3, 16); }
    ctx.font = 'bold 12px Arial'; ctx.fillStyle = '#ffd23a'; ctx.textAlign = 'left'; ctx.fillText('T-REX', bx + bw + 6, 21);
  }
  if (S.boss && S.phase === 'boss') {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(40,20,10,0.75)'; ctx.beginPath(); ctx.roundRect(W / 2 - 110, 8, 220, 28, 12); ctx.fill();
    ctx.fillStyle = '#ffe0b0'; ctx.font = 'bold 13px Arial'; ctx.fillText('T-REX', W / 2 - 40, 22);
    for (let i = 0; i < 3; i++) drawHeart(W / 2 + 14 + i * 26, 21, 8, i < S.boss.hp);
  }
  if (S.msgTimer > 0) {
    ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, S.msgTimer / 20);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.font = 'bold 24px Arial';
    ctx.strokeText(S.msg, W / 2, 84); ctx.fillText(S.msg, W / 2, 84); ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ---------------- panels ----------------
function panel(title, lines, titleColor, ty = 78) {
  ctx.save(); ctx.fillStyle = 'rgba(30,18,10,0.72)'; ctx.fillRect(0, -VH, W, 3 * VH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = titleColor; ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.font = 'bold 40px Arial';
  ctx.strokeText(title, W / 2, ty); ctx.fillText(title, W / 2, ty);
  ctx.fillStyle = '#fff6e8'; ctx.font = 'bold 15px Arial';
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
    panel(tx('DAS DINO-TAL'), [
      touch ? tx('Wisch nach rechts oder links = losrollen · Wisch nach unten = bremsen') : tx('Pfeil → / ← = losrollen · Pfeil ↓ = bremsen'),
      touch ? tx('Sprung-Taste (oder nach oben wischen) = springen – lange halten = höher') : tx('Leertaste / Klick = springen – lange halten = höher'),
      tx('Dinos nicht berühren! Feuerbälle: auf den Schatten achten. Teer meiden!'),
      tx('Am Ende wartet der T-REX.'),
    ], '#ffb25a');
    button(BTN.start, '▶  ' + tx('LOS GEHT\'S'), '#34c759', '#1f8f3c');
  }
  if (S.phase === 'ask') {
    const r = S.ask === 'rodeo';
    panel(r ? tx('DINO-RODEO') : tx('FOSSILIEN AUSGRABEN'), r
      ? [tx('Kannst du dich 15 Sekunden auf dem wilden Triceratops halten?'), tx('Belohnung: 20 Münzen und ein Pokal-Stern.')]
      : [tx('Finde alle 6 Knochen eines Dino-Skeletts im Sand.'), tx('Ein leeres Loch zeigt, wie viele Knochen direkt daneben liegen.'), tx('Belohnung: 20 Münzen und ein Pokal-Stern.')], '#ffd23a');
    button(BTN.yes, tx('JA, SPIELEN!'), '#34c759', '#1f8f3c'); button(BTN.no, tx('NEIN, WEITER'), '#8a96a8', '#5d6878');
  }
  if (S.phase === 'rodeo') drawRodeo();
  if (S.phase === 'fossil') drawFossil();
  if (S.phase === 'gameover') {
    panel(tx('KEINE LEBEN MEHR!'), [tx('Alle 3 Leben sind weg. Nochmal versuchen?'), tx('Du startest beim letzten Checkpoint.')], '#ff7a6a');
    button(BTN.goYes, tx('NOCHMAL VERSUCHEN'), '#36c6f4', '#1677a8'); button(BTN.goNo, tx('NEIN – ZUM MENÜ'), '#8a96a8', '#5d6878');
  }
  if (S.phase === 'won') {
    panel(tx('T-REX BESIEGT!'), [tx('Das Dino-Tal ist geschafft! +30 Münzen'), tx('Bald geht es weiter: an den Lianen hinauf zur Felsenhöhe'), tx('und durch die Röhre hinunter in die Lavahöhlen.')], '#7dffa0');
    button(BTN.menu, tx('ZUM MENÜ'), '#34c759', '#1f8f3c');
  }
}

// ---------------- mini games ----------------
function drawRodeo() {
  const g = S.game; if (!g) return;
  ctx.save(); ctx.fillStyle = 'rgba(30,18,10,0.35)'; ctx.fillRect(0, -VH, W, 3 * VH); ctx.restore();
  // the bucking triceratops with Kai / Bali on its back (centre of the screen)
  const cx = W / 2, tilt = g.bal * 0.5, buck = Math.abs(Math.sin(g.t * 0.18)) * 10 * (g.result ? 0 : 1);
  ctx.save(); ctx.translate(cx, FLOOR - buck); ctx.rotate(tilt * 0.4); ctx.translate(-cx, -FLOOR);
  drawTrike(cx, 1.5, 1, g.t * 1.5, true);
  if (g.result !== 'lose') {
    ctx.save(); ctx.translate(cx - 10, FLOOR - 110); ctx.rotate(tilt);
    drawKaiFigure({ x: 0, y: 0, tilt: 0, crouch: 5, push: 0, flip: 0, armsUp: true, wind: 0.6, outfit: SAVE.outfit, ouch: Math.abs(g.bal) > 0.75 });
    ctx.restore();
  }
  ctx.restore();
  if (g.result === 'lose') drawKaiFigure({ x: cx + 220, y: FLOOR, tilt: 0.5, crouch: 7, push: 0, flip: 0, wind: 0, outfit: SAVE.outfit, ouch: true });
  // balance bar
  const bx = W / 2 - 200, by = 40;
  ctx.save(); ctx.fillStyle = 'rgba(20,30,50,0.7)'; ctx.beginPath(); ctx.roundRect(bx - 14, by - 14, 428, 44, 14); ctx.fill();
  const gr = ctx.createLinearGradient(bx, 0, bx + 400, 0); gr.addColorStop(0, '#d8352c'); gr.addColorStop(0.3, '#ffd23a'); gr.addColorStop(0.5, '#34c759'); gr.addColorStop(0.7, '#ffd23a'); gr.addColorStop(1, '#d8352c');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(bx, by, 400, 16, 8); ctx.fill();
  const nx = bx + 200 + clamp(g.bal, -1, 1) * 200;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(nx, by - 6); ctx.lineTo(nx - 8, by - 14); ctx.lineTo(nx + 8, by - 14); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillRect(nx - 2, by - 6, 4, 26);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 16px Arial'; ctx.fillStyle = '#fff';
  ctx.fillText(tx('Noch {s} s', { s: Math.max(0, Math.ceil((RODEO_T - g.t) / 60)) }), W / 2, by + 30 + 10);
  if (!g.result && CTRL.touch) { ctx.font = 'bold 40px Arial'; ctx.globalAlpha = 0.35; ctx.fillText('◀', 70, FLOOR - 80); ctx.fillText('▶', W - 70, FLOOR - 80); }
  ctx.restore();
  if (g.result) resultPanel(g.result === 'win' ? tx('YEEHAW! Du hast es geschafft!') : tx('Abgeworfen! Versuch es beim nächsten Mal.'), g.result === 'win');
}
function drawFossil() {
  const g = S.game; if (!g) return;
  panel(tx('FOSSILIEN AUSGRABEN'), [], '#ffd23a', 22);
  ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.fillStyle = '#fff6e8'; ctx.font = 'bold 15px Arial';
  ctx.fillText(tx('Knochen: {f} / 6   ·   Grabungen übrig: {d}', { f: g.found, d: g.digs }), W / 2, FOS.y - 26);
  for (const cl of g.cells) {
    const x = FOS.x + cl.c * FOS.cw, y = FOS.y + cl.r * FOS.ch;
    ctx.fillStyle = cl.dug ? (cl.bone ? '#f3e2b5' : '#b58a55') : '#e3c88f';
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x + 3, y + 3, FOS.cw - 6, FOS.ch - 6, 8); ctx.fill(); ctx.stroke();
    if (!cl.dug) { ctx.fillStyle = 'rgba(150,110,60,0.35)'; ctx.beginPath(); ctx.arc(x + 20, y + 18, 3, 0, Math.PI * 2); ctx.arc(x + 54, y + 30, 2.5, 0, Math.PI * 2); ctx.fill(); }
    else if (cl.bone) {
      ctx.save(); ctx.translate(x + FOS.cw / 2, y + FOS.ch / 2); ctx.rotate(-0.3); ctx.fillStyle = '#fffdf4'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(-18, -4, 36, 8, 4); ctx.fill(); ctx.stroke();
      for (const [bx, by] of [[-18, -4], [-18, 4], [18, -4], [18, 4]]) { ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    } else { ctx.fillStyle = cl.n ? '#fff' : 'rgba(255,255,255,0.5)'; ctx.font = 'bold 20px Arial'; ctx.fillText(cl.n ? String(cl.n) : '·', x + FOS.cw / 2, y + FOS.ch / 2 + 1); }
  }
  ctx.restore();
  if (g.result) { ctx.save(); ctx.fillStyle = 'rgba(30,18,10,0.7)'; ctx.fillRect(0, -VH, W, 3 * VH); ctx.restore(); }
  if (g.result === 'win') drawSkeleton(W / 2, 150);   // the skeleton, assembled
  if (g.result) resultPanel(g.result === 'win' ? tx('Ein ganzes Dino-Skelett! Super gegraben!') : tx('Keine Grabungen mehr. Versuch es nochmal!'), g.result === 'win');
}
function drawSkeleton(x, y) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = '#fffdf4'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-120, -10); ctx.quadraticCurveTo(-40, -50, 40, -40); ctx.quadraticCurveTo(80, -60, 100, -80); ctx.stroke();
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-20 + i * 12, -44 + i); ctx.lineTo(-24 + i * 12, -14 + i); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-30, -30); ctx.lineTo(-40, 20); ctx.moveTo(30, -36); ctx.lineTo(36, 20); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(116, -86, 24, 13, 0.2, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fffdf4'; ctx.beginPath(); ctx.arc(118, -90, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function resultPanel(text, win) {
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = win ? '#7dffa0' : '#ffb0a0'; ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.font = 'bold 26px Arial';
  ctx.strokeText(text, W / 2, 214); ctx.fillText(text, W / 2, 214);
  if (win) { ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 18px Arial'; ctx.strokeText(tx('+20 Münzen · Pokal-Stern!'), W / 2, 238 - 4); ctx.fillText(tx('+20 Münzen · Pokal-Stern!'), W / 2, 238 - 4); }
  ctx.restore();
  button(GBTN.next, tx('WEITER'), '#34c759', '#1f8f3c');
}
