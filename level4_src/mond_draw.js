// =====================================================================
//  DRAWING – DIE MONDBASIS (flat cartoon style like the other levels)
//  Black space with stars, grey moon ground with craters, white station domes, blue gravity zones.
// =====================================================================
const MOON = '#c9ccd4', MOON_D = '#9aa0ab', MOON_L = '#e3e6ec';
const STARS = Array.from({ length: 120 }, (_, i) => ({ x: (i * 211.7) % 1, y: (i * 97.3) % 1, r: i % 7 === 0 ? 1.8 : i % 3 === 0 ? 1.2 : 0.8, tw: i * 1.7 }));

function drawSpace(par = 0.02) {
  const g = ctx.createLinearGradient(0, -DY, 0, H); g.addColorStop(0, '#03040c'); g.addColorStop(0.7, '#0b1030'); g.addColorStop(1, '#1a1f45');
  ctx.fillStyle = g; ctx.fillRect(0, -DY, W, H + DY);
  for (const s of STARS) {
    const x = ((s.x * (W + 200) - S.cam * par) % (W + 200) + W + 200) % (W + 200) - 100, y = -DY + s.y * (H + DY - 60);
    ctx.globalAlpha = 0.5 + Math.sin(S.t * 0.05 + s.tw) * 0.35; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function drawBackground() {
  drawSpace();
  // Dinoland (the planet Kai came from) far away, and a little ringed planet
  const px = W * 0.78 - S.cam * 0.015, py = 60 - DY * 0.55;
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  const pg = ctx.createRadialGradient(px - 14, py - 14, 4, px, py, 46); pg.addColorStop(0, '#9be07a'); pg.addColorStop(0.6, '#4f9e5a'); pg.addColorStop(1, '#2f6f8a');
  ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, 44, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(242,166,90,0.8)'; ctx.beginPath(); ctx.ellipse(px - 12, py + 8, 16, 9, 0.4, 0, Math.PI * 2); ctx.ellipse(px + 16, py - 14, 10, 6, -0.3, 0, Math.PI * 2); ctx.fill();
  const rx = W * 0.25 - S.cam * 0.01, ry = 40 - DY * 0.3;
  ctx.fillStyle = '#e7b86a'; ctx.beginPath(); ctx.arc(rx, ry, 16, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f4dcae'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(rx, ry, 28, 7, -0.3, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  // far moon hills
  const off = S.cam * 0.12, span = 1600;
  ctx.fillStyle = '#5a5f6e';
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W + 40; x += 40) { const wx = x + off; ctx.lineTo(x, 200 + Math.sin(wx * 0.004) * 30 + Math.sin(wx * 0.011) * 14); }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  // station domes in the middle distance
  const off2 = S.cam * 0.3;
  for (let i = 0; i < 6; i++) {
    const x = ((i * 380 - off2) % 2280 + 2280) % 2280 - 200, r = 50 + (i * 23) % 30;
    ctx.fillStyle = '#7d8494'; ctx.fillRect(x - r - 10, 240, r * 2 + 20, 60);
    ctx.fillStyle = 'rgba(160,220,255,0.35)'; ctx.beginPath(); ctx.arc(x, 240, r, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(220,240,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, 240, r, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 3, 270, 6, 6);
  }
}
function drawGround() {
  const x0 = S.cam - 40, x1 = S.cam + W + 40;
  for (const [a, b] of GROUND) {
    if (b < x0 || a > x1) continue;
    const l = Math.max(a, x0), r = Math.min(b, x1);
    const g = ctx.createLinearGradient(0, FLOOR, 0, H + 40); g.addColorStop(0, MOON); g.addColorStop(1, MOON_D);
    ctx.fillStyle = g; ctx.fillRect(l, FLOOR - 4, r - l, H - FLOOR + 44);
    // small craters in the ground
    for (let x = Math.floor(l / 90) * 90; x < r; x += 90) {
      const cx = x + 40 + (x / 90 % 3) * 12, w = 16 + (x / 90 % 2) * 10;
      ctx.fillStyle = MOON_D; ctx.beginPath(); ctx.ellipse(cx, FLOOR + 14 + (x / 90 % 2) * 10, w, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = MOON_L; ctx.beginPath(); ctx.ellipse(cx, FLOOR + 12 + (x / 90 % 2) * 10, w, 2, 0, Math.PI, 0); ctx.fill();
    }
    ctx.fillStyle = MOON_L; ctx.fillRect(l, FLOOR - 6, r - l, 5);
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(l, FLOOR - 6); ctx.lineTo(r, FLOOR - 6); ctx.stroke();
    ctx.fillStyle = MOON_D;
    if (a > x0) { ctx.beginPath(); ctx.moveTo(a, FLOOR - 6); ctx.lineTo(a + 12, H + 40); ctx.lineTo(a, H + 40); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(a, FLOOR - 6); ctx.lineTo(a, H + 40); ctx.stroke(); }
    if (b < x1) { ctx.beginPath(); ctx.moveTo(b, FLOOR - 6); ctx.lineTo(b - 12, H + 40); ctx.lineTo(b, H + 40); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(b, FLOOR - 6); ctx.lineTo(b, H + 40); ctx.stroke(); }
  }
  // the deep craters: dark, with stars glittering far down
  for (let i = 0; i < GROUND.length - 1; i++) {
    const a = GROUND[i][1], b = GROUND[i + 1][0];
    if (b < x0 || a > x1) continue;
    const g = ctx.createLinearGradient(0, FLOOR, 0, H + 40); g.addColorStop(0, 'rgba(10,12,30,0.0)'); g.addColorStop(1, 'rgba(5,6,16,0.95)');
    ctx.fillStyle = g; ctx.fillRect(a, FLOOR - 6, b - a, H - FLOOR + 46);
  }
  drawFlipZones();
}
// the gravity zones: a station ceiling with blue glowing arrows
function drawFlipZones() {
  for (const [a, b] of FLIP_ZONES) {
    if (!onScreen(a - 60, b - a + 120)) continue;
    ctx.save();
    // the blue gravity field
    const pulse = 0.12 + Math.sin(S.t * 0.06) * 0.05;
    ctx.fillStyle = `rgba(54,198,244,${pulse})`; ctx.fillRect(a, CEIL - 10, b - a, FLOOR - CEIL + 10);
    ctx.strokeStyle = 'rgba(120,220,255,0.35)'; ctx.lineWidth = 3;
    for (let x = a + 60; x < b - 30; x += 140) {
      const y = 120 + ((S.t * 1.2 + x) % 140);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 30); ctx.moveTo(x - 10, y - 20); ctx.lineTo(x, y - 30); ctx.lineTo(x + 10, y - 20); ctx.stroke();
    }
    // the ceiling (Kai rides on its underside)
    let x = a - 40;
    const segs = []; let start = a - 40;
    for (const [ga, gb] of CEIL_GAPS) if (ga > a && gb < b) { segs.push([start, ga]); start = gb; }
    segs.push([start, b + 40]);
    for (const [l, r] of segs) {
      ctx.fillStyle = '#8b96a1'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.rect(l, -DY - 20, r - l, CEIL + DY + 20); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c9d3dc'; ctx.fillRect(l, CEIL - 6, r - l, 6);
      ctx.fillStyle = '#36c6f4'; for (let lx = l + 30; lx < r - 20; lx += 70) { ctx.fillRect(lx, CEIL - 22, 26, 6); }
      ctx.strokeStyle = 'rgba(20,32,46,0.4)'; ctx.lineWidth = 1.5; for (let lx = l + 50; lx < r; lx += 100) { ctx.beginPath(); ctx.moveTo(lx, -DY); ctx.lineTo(lx, CEIL - 6); ctx.stroke(); }
    }
    // signs at the entrance
    drawGravSign(a - 70);
    ctx.restore();
  }
}
function drawGravSign(x) {
  if (!onScreen(x - 60, 120)) return;
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.fillStyle = '#8b96a1'; ctx.fillRect(x - 3, FLOOR - 90, 6, 90); ctx.strokeRect(x - 3, FLOOR - 90, 6, 90);
  ctx.fillStyle = '#36c6f4'; ctx.beginPath(); ctx.roundRect(x - 34, FLOOR - 140, 68, 52, 8); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, FLOOR - 98); ctx.lineTo(x, FLOOR - 130); ctx.moveTo(x - 10, FLOOR - 120); ctx.lineTo(x, FLOOR - 130); ctx.lineTo(x + 10, FLOOR - 120); ctx.stroke();
  ctx.restore();
}
function drawPlat(p) {
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  let x = p.x, y = p.y;
  if (p.kind === 'crumble' && p.state === 'shake') x += Math.sin(S.t * 1.7) * 2.5;
  if (p.kind === 'move') {
    // a floating metal platform with two little jets
    ctx.fillStyle = '#8b96a1'; ctx.beginPath(); ctx.roundRect(x, y - 4, p.w, 16, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; for (let i = 0; i < 4; i++) ctx.fillRect(x + 12 + i * (p.w - 24) / 3 - 3, y + 1, 6, 4);
    for (const jx of [x + 22, x + p.w - 22]) { const fl = 0.7 + Math.sin(S.t * 0.6 + jx) * 0.3; ctx.fillStyle = `rgba(120,220,255,${0.7 * fl})`; ctx.beginPath(); ctx.moveTo(jx - 7, y + 12); ctx.lineTo(jx, y + 12 + 18 * fl); ctx.lineTo(jx + 7, y + 12); ctx.closePath(); ctx.fill(); }
  } else {
    ctx.fillStyle = p.kind === 'crumble' ? '#b2b6c0' : MOON;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + p.w, y); ctx.lineTo(x + p.w - 14, y + 24); ctx.lineTo(x + p.w * 0.55, y + 34); ctx.lineTo(x + 18, y + 26); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = MOON_D; ctx.beginPath(); ctx.ellipse(x + p.w * 0.35, y + 14, 10, 4, 0, 0, Math.PI * 2); ctx.ellipse(x + p.w * 0.7, y + 10, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
    if (p.kind === 'crumble') { ctx.strokeStyle = 'rgba(40,40,60,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + p.w * 0.3, y + 2); ctx.lineTo(x + p.w * 0.38, y + 14); ctx.lineTo(x + p.w * 0.3, y + 24); ctx.moveTo(x + p.w * 0.68, y + 2); ctx.lineTo(x + p.w * 0.62, y + 16); ctx.stroke(); }
    ctx.fillStyle = MOON_L; ctx.fillRect(x + 3, y - 2, p.w - 6, 4);
  }
  ctx.restore();
}
// Mondkäfer: a round blue moon beetle with antennae
function drawWalker(c) {
  ctx.save(); ctx.translate(c.x, FLOOR);
  if (c.dead) { const u = Math.min(1, c.deadT / 14); ctx.globalAlpha = Math.max(0, 1 - c.deadT / 60); ctx.translate(0, -Math.sin(u * Math.PI) * 24 - 16); ctx.rotate(-c.dir * Math.PI * u); ctx.translate(0, 16); }
  ctx.scale(c.dir, 1); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  const run = c.dead ? 0 : Math.sin(c.t * 0.5) * 4;
  for (const lx of [-12, 0, 12]) { ctx.beginPath(); ctx.moveTo(lx, -10); ctx.lineTo(lx + run * (lx === 0 ? -1 : 1), -1); ctx.stroke(); }
  ctx.fillStyle = '#6a7bff'; ctx.beginPath(); ctx.ellipse(0, -20, 24, 16, 0, Math.PI, 0); ctx.lineTo(24, -12); ctx.lineTo(-24, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(20,32,46,0.5)'; ctx.beginPath(); ctx.moveTo(-2, -36); ctx.lineTo(-2, -13); ctx.stroke(); ctx.strokeStyle = OUT;
  ctx.fillStyle = '#c4ccff'; for (const [sx, sy] of [[-12, -24], [10, -26], [-4, -18], [14, -18]]) { ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#4a5ad8'; ctx.beginPath(); ctx.arc(24, -18, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(27, -20, 3.4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(28, -20, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(26, -26); ctx.quadraticCurveTo(30, -38, 36, -40); ctx.moveTo(22, -26); ctx.quadraticCurveTo(22, -40, 26, -44); ctx.stroke();
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(36, -40, 3, 0, Math.PI * 2); ctx.arc(26, -44, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}
// a little UFO drone with a blinking light
function drawFlyer(p) {
  ctx.save(); ctx.translate(p.x, p.y); if (p.dead) ctx.rotate(p.deadT * 0.2);
  const angry = p.state === 'warn' || p.state === 'dive', s = p.baby ? 0.65 : 1; ctx.scale(s, s);
  ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(160,220,255,0.6)'; ctx.beginPath(); ctx.arc(0, -6, 14, Math.PI, 0); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7dff6a'; ctx.beginPath(); ctx.arc(0, -8, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -9, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(p.dir * 1, -9, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = angry ? '#ff6a5a' : '#c9d3dc'; ctx.beginPath(); ctx.ellipse(0, 0, 34, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  for (let i = -2; i <= 2; i++) { ctx.fillStyle = (Math.floor(S.t / 8) + i) % 2 ? '#ffd23a' : '#ff5ad1'; ctx.beginPath(); ctx.arc(i * 12, 1, 2.6, 0, Math.PI * 2); ctx.fill(); }
  if (angry) { ctx.fillStyle = 'rgba(255,90,90,0.3)'; ctx.beginPath(); ctx.moveTo(-16, 8); ctx.lineTo(16, 8); ctx.lineTo(24, 40); ctx.lineTo(-24, 40); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
// a meteorite with a fire tail
function drawDrop(s) {
  ctx.save(); ctx.translate(s.x, s.y);
  const g = ctx.createLinearGradient(0, -s.r * 4, 0, 0); g.addColorStop(0, 'rgba(255,160,40,0)'); g.addColorStop(1, 'rgba(255,200,80,0.85)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-s.r * 0.8, 0); ctx.lineTo(0, -s.r * 4.5); ctx.lineTo(s.r * 0.8, 0); ctx.closePath(); ctx.fill();
  ctx.rotate(s.rot); ctx.fillStyle = '#8a7a6a'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-s.r, 0); ctx.lineTo(-s.r * 0.5, -s.r * 0.85); ctx.lineTo(s.r * 0.6, -s.r * 0.8); ctx.lineTo(s.r, 0.1 * s.r); ctx.lineTo(s.r * 0.4, s.r * 0.85); ctx.lineTo(-s.r * 0.6, s.r * 0.75); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff9a1a'; ctx.beginPath(); ctx.arc(-s.r * 0.2, -s.r * 0.2, s.r * 0.25, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawPuddle() {}

// ---------------- the rocket (from Matt's colouring book – now in colour) ----------------
// (x, y) = the bottom of the fins, s = size. flame 0..1, face = Kai's face in the window
function drawRocket(x, y, s, flame, face) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 3 / Math.max(0.6, s);
  if (flame > 0) {
    const f = flame * (0.85 + Math.sin(performance.now() / 40) * 0.15);
    for (const [fx, sc] of [[-26, 0.7], [26, 0.7], [0, 1]]) {
      const g = ctx.createLinearGradient(0, 0, 0, 120 * f * sc); g.addColorStop(0, '#fff6b0'); g.addColorStop(0.4, '#ffb02e'); g.addColorStop(1, 'rgba(255,80,40,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx - 14 * sc, -4); ctx.quadraticCurveTo(fx, 140 * f * sc, fx + 14 * sc, -4); ctx.closePath(); ctx.fill();
    }
  }
  // three nozzles
  ctx.fillStyle = '#5a6270';
  for (const nx of [-26, 0, 26]) { ctx.beginPath(); ctx.moveTo(nx - 12, -2); ctx.lineTo(nx - 8, -18); ctx.lineTo(nx + 8, -18); ctx.lineTo(nx + 12, -2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // fins (red)
  ctx.fillStyle = '#e8463c';
  ctx.beginPath(); ctx.moveTo(-34, -60); ctx.quadraticCurveTo(-70, -40, -66, 0); ctx.lineTo(-38, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(34, -60); ctx.quadraticCurveTo(70, -40, 66, 0); ctx.lineTo(38, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
  // body (white) with a round nose (red)
  ctx.fillStyle = '#f4f6fa';
  ctx.beginPath(); ctx.moveTo(-40, -18); ctx.lineTo(-44, -180); ctx.quadraticCurveTo(-44, -290, 0, -330); ctx.quadraticCurveTo(44, -290, 44, -180); ctx.lineTo(40, -18); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.fillStyle = '#e8463c'; ctx.beginPath(); ctx.moveTo(-60, -262); ctx.quadraticCurveTo(0, -282, 60, -262); ctx.lineTo(60, -340); ctx.lineTo(-60, -340); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2f6fd6'; ctx.fillRect(-60, -240, 120, 12); ctx.fillRect(-60, -86, 120, 12); ctx.fillRect(-60, -64, 120, 6);
  ctx.fillStyle = 'rgba(20,32,46,0.08)'; ctx.fillRect(16, -340, 40, 340);
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(-60, -262); ctx.quadraticCurveTo(0, -282, 60, -262); ctx.stroke();
  // the round window with Kai (or Bali) looking out
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(0, -170, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.arc(0, -170, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (face) {
    ctx.save(); ctx.beginPath(); ctx.arc(0, -170, 21, 0, Math.PI * 2); ctx.clip();
    const bali = SAVE.char === 'bali';
    if (bali) { ctx.fillStyle = '#e8cd8e'; ctx.beginPath(); ctx.ellipse(0, -166, 15, 18, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = bali ? '#f6d3b8' : '#f2c79e'; ctx.beginPath(); ctx.arc(0, -164, 12, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    if (!bali || SAVE.outfit.cap) { ctx.fillStyle = SAVE.outfit.cap || '#1e4fa3'; ctx.beginPath(); ctx.arc(0, -170, 13, Math.PI, 0); ctx.lineTo(18, -170); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { ctx.fillStyle = '#e8cd8e'; ctx.beginPath(); ctx.arc(0, -168, 12.5, Math.PI, 0); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(-4, -163, 1.6, 0, Math.PI * 2); ctx.arc(4, -163, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, -159, 4, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-8, -180, 6, 3, -0.7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ---------------- things on the way ----------------
function drawWorldMid() {
  // the rocket Kai landed with (left) – later the way back to Aurora 61
  if (onScreen(60, 200)) {
    ctx.save(); ctx.fillStyle = '#8b96a1'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.fillRect(60, FLOOR - 12, 180, 12); ctx.strokeRect(60, FLOOR - 12, 180, 12); ctx.restore();
    drawRocket(150, FLOOR - 12, 0.62, 0, false);
    if (SAVE.done.mond) drawSign(300, FLOOR - 70, '◀ 🚀 ' + tx('AURORA 61'), '#7dffa0');
  }
  // the arcade dome
  const ax = SITES.arcade;
  if (onScreen(ax - 60, 420)) {
    ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    const cx = ax + 120;
    ctx.fillStyle = '#7d8494'; ctx.fillRect(cx - 150, FLOOR - 90, 300, 90); ctx.strokeRect(cx - 150, FLOOR - 90, 300, 90);
    ctx.fillStyle = 'rgba(160,220,255,0.35)'; ctx.beginPath(); ctx.arc(cx, FLOOR - 90, 150, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(220,240,255,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, FLOOR - 90, 150, Math.PI, 0); ctx.stroke();
    // the arcade machine inside
    ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.fillStyle = '#5a3fd8'; ctx.beginPath(); ctx.roundRect(cx - 40, FLOOR - 190, 80, 190, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#05060c'; ctx.fillRect(cx - 30, FLOOR - 170, 60, 50); ctx.strokeRect(cx - 30, FLOOR - 170, 60, 50);
    pixelArt(ALIENS[Math.floor(S.t / 30) % 3].f[Math.floor(S.t / 15) % 2], cx - 22, FLOOR - 158, 4, ALIENS[Math.floor(S.t / 30) % 3].col);
    ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center'; ctx.fillText('ALIEN', cx, FLOOR - 178);
    ctx.fillStyle = '#ff5a4f'; ctx.beginPath(); ctx.arc(cx - 12, FLOOR - 100, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(cx + 12, FLOOR - 100, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    drawSign(cx + 200, FLOOR - 70, tx('ALIEN-ATTACKE'), '#b48cff');
  }
  // meteorite warning signs
  for (const [a] of DROP_ZONES) if (onScreen(a - 60, 120)) drawSign(a + 40, FLOOR - 60, '☄ ' + tx('METEORITEN'), '#ffb02e');
  // laser barriers
  for (const L of LASERS) if (onScreen(L.x - 40, 80)) drawLaser(L);
}
function drawLaser(L) {
  const st = laserState(L), top = laserTop(L), bot = laserBot(L);
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  // two emitters
  ctx.fillStyle = '#5a6270';
  if (L.ceil) { ctx.fillRect(L.x - 10, top - 4, 20, 14); ctx.strokeRect(L.x - 10, top - 4, 20, 14); ctx.fillRect(L.x - 10, bot - 6, 20, 12); ctx.strokeRect(L.x - 10, bot - 6, 20, 12); }
  else { ctx.fillRect(L.x - 6, top, 12, bot - top); ctx.globalAlpha = 0; ctx.globalAlpha = 1; ctx.fillStyle = '#5a6270'; ctx.fillRect(L.x - 12, top - 8, 24, 16); ctx.strokeRect(L.x - 12, top - 8, 24, 16); ctx.fillRect(L.x - 12, bot - 14, 24, 14); ctx.strokeRect(L.x - 12, bot - 14, 24, 14); }
  if (!L.ceil) { ctx.fillStyle = '#05060c'; ctx.fillRect(L.x - 4, top + 8, 8, bot - top - 22); }
  if (st === 'on') {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255,60,80,0.35)'; ctx.fillRect(L.x - 9, top + 6, 18, bot - top - 12);
    ctx.fillStyle = '#ffd0d8'; ctx.fillRect(L.x - 2.5, top + 6, 5, bot - top - 12);
  } else if (st === 'warn' && Math.floor(S.t / 5) % 2 === 0) {
    ctx.fillStyle = 'rgba(255,80,80,0.5)'; ctx.fillRect(L.x - 2, top + 6, 4, bot - top - 12);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = st === 'off' ? '#34c759' : '#ff3b30'; ctx.beginPath(); ctx.arc(L.x, L.ceil ? bot : top, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawWorldFront() {
  for (const r of S.rollers) if (onScreen(r.x - 40, 80)) drawRoller(r);
  if (S.boss && S.boss.state !== 'gone') drawStarEater(S.boss.x, S.boss.y, 1, S.boss);
}
function drawRoller(r) {
  ctx.save(); ctx.translate(r.x, r.y); if (r.dead) ctx.globalAlpha = Math.max(0, 1 - (r.deadT || 0) / 30); ctx.rotate(r.rot); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  if (r.kind === 0) {
    // a broken satellite: a ball with solar panels
    ctx.fillStyle = '#2f6fd6'; ctx.fillRect(-r.r * 1.4, -5, r.r * 0.8, 10); ctx.strokeRect(-r.r * 1.4, -5, r.r * 0.8, 10); ctx.fillRect(r.r * 0.6, -5, r.r * 0.8, 10); ctx.strokeRect(r.r * 0.6, -5, r.r * 0.8, 10);
    ctx.fillStyle = '#c9d3dc'; ctx.beginPath(); ctx.arc(0, 0, r.r * 0.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(0, 0, r.r * 0.25, 0, Math.PI * 2); ctx.fill();
  } else {
    // a rolling metal barrel with rivets
    ctx.fillStyle = '#8b96a1'; ctx.beginPath(); ctx.arc(0, 0, r.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#5a6270'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-r.r, 0); ctx.lineTo(r.r, 0); ctx.moveTo(0, -r.r); ctx.lineTo(0, r.r); ctx.stroke();
    ctx.fillStyle = '#e8463c'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ---------------- the STERNENFRESSER ----------------
function drawStarEater(x, y, s, b) {
  ctx.save(); ctx.translate(x, y + Math.sin(S.t * 0.05) * 8); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  if (b && b.flash > 0 && Math.floor(b.flash / 4) % 2 === 0) ctx.globalAlpha = 0.55;
  const hurtFace = b && b.flash > 0, beaten = b && b.hp <= 0;
  // little jets underneath
  for (const jx of [-40, 40]) { const fl = 0.7 + Math.sin(S.t * 0.5 + jx) * 0.3; ctx.fillStyle = `rgba(180,140,255,${fl * 0.7})`; ctx.beginPath(); ctx.moveTo(jx - 10, 78); ctx.lineTo(jx, 78 + 34 * fl); ctx.lineTo(jx + 10, 78); ctx.closePath(); ctx.fill(); }
  // antennas with stars
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 30, -70); ctx.quadraticCurveTo(sd * 50, -110, sd * 40, -128); ctx.stroke(); drawStar5(sd * 40, -132, 10, '#ffd23a'); }
  // the round body
  const g = ctx.createRadialGradient(-30, -30, 10, 0, 0, 100); g.addColorStop(0, '#6f4ad8'); g.addColorStop(1, '#2c1b66');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 90, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // the belly full of eaten stars (fewer the more he gives back)
  ctx.fillStyle = 'rgba(20,10,50,0.6)'; ctx.beginPath(); ctx.ellipse(0, 36, 56, 40, 0, 0, Math.PI * 2); ctx.fill();
  const n = b ? Math.max(1, b.hp * 3) : 15;
  for (let i = 0; i < n; i++) drawStar5(-36 + (i * 37) % 72, 20 + (i * 23) % 40, 4 + (i % 3), ['#ffd23a', '#ffffff', '#9fd8ff'][i % 3]);
  // arms
  ctx.fillStyle = '#4a33a8';
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 92, 14 + Math.sin(S.t * 0.1 + sd) * 6, 18, 10, sd * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  // eyes
  for (const sd of [-1, 1]) {
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(sd * 30, -32, 20, beaten ? 4 : 24, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (!beaten) { ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(sd * 30 - 4, -28, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(sd * 30 - 4, -28, 4.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(sd * 12, hurtFace ? -66 : -58); ctx.lineTo(sd * 48, hurtFace ? -58 : -66); ctx.stroke(); ctx.lineWidth = 3;
  }
  // the big mouth with two teeth – chewing, coughing or open wide
  const open = hurtFace ? 1 : 0.35 + Math.abs(Math.sin(S.t * 0.12)) * 0.4;
  ctx.fillStyle = '#1a0a30'; ctx.beginPath(); ctx.ellipse(0, 6, 40, 8 + 22 * open, 0, 0, Math.PI); ctx.lineTo(-40, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; for (const tx0 of [-16, 10]) { ctx.beginPath(); ctx.moveTo(tx0, 6); ctx.lineTo(tx0 + 6, 18); ctx.lineTo(tx0 + 12, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (hurtFace) for (let i = 0; i < 5; i++) drawStar5(-30 + i * 15 + Math.sin(S.t * 0.4 + i) * 4, 30 + ((S.t * 2 + i * 20) % 60), 6, '#ffd23a');
  ctx.restore();
}
function drawStar5(x, y, r, col) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, a = i * Math.PI / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

// ---------------- special screens: rocket intro, arcade, star quiz ----------------
function drawSpecial() {
  if (S.phase === 'intro') { drawIntro(); return true; }
  if (S.phase === 'game' && S.game) { drawArcade(); return true; }
  if (S.phase === 'stars' && S.quiz) { drawQuiz(); return true; }
  return false;
}
function drawIntro() {
  const I = S.intro || { t: 0 }, t = I.t, top = -DY;
  const lift = clamp((t - 180) / 150, 0, 1), cruise = clamp((t - 330) / 140, 0, 1), land = clamp((t - 470) / 100, 0, 1);
  // sky: Dinoland orange → deep blue → black space
  const g = ctx.createLinearGradient(0, top, 0, H);
  if (t < 330) { const u = lift; g.addColorStop(0, mixCol('#f2a65a', '#03040c', u)); g.addColorStop(1, mixCol('#f7c47e', '#1a1f45', u)); }
  else { g.addColorStop(0, '#03040c'); g.addColorStop(1, '#1a1f45'); }
  ctx.fillStyle = g; ctx.fillRect(0, top, W, H + DY);
  // stars (appear when it gets dark), streaming down while flying
  ctx.fillStyle = '#ffffff';
  for (const s of STARS) { const a = t < 330 ? lift : 1; if (a < 0.3) break; const y = ((top + s.y * (H + DY) + (t - 180) * 3 * (1 + s.r)) % (H + DY + 20) + H + DY + 20) % (H + DY + 20) + top - 10; ctx.globalAlpha = a; ctx.fillRect((s.x * W), y, s.r * 1.6, s.r * (t > 330 && t < 470 ? 8 : 1.6)); }
  ctx.globalAlpha = 1;
  const groundY = FLOOR + lift * lift * 900;        // the launch pad drops away below
  if (t < 340) {
    // Dinoland: volcano, palms, green ground, the launch pad
    ctx.fillStyle = '#c96a3a'; ctx.beginPath(); ctx.moveTo(840, groundY); ctx.lineTo(980, groundY - 210); ctx.lineTo(1040, groundY - 210); ctx.lineTo(1200, groundY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.ellipse(1010, groundY - 212, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
    for (const px of [120, 260, 380, 1120]) { ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(px, groundY); ctx.quadraticCurveTo(px + 10, groundY - 70, px + 4, groundY - 130); ctx.stroke(); ctx.fillStyle = '#3f8a3a'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(px + 4 + Math.cos(i * 1.25) * 30, groundY - 130 + Math.sin(i * 1.25) * 10, 34, 9, i * 1.25, 0, Math.PI * 2); ctx.fill(); } }
    ctx.fillStyle = '#6fbf4a'; ctx.fillRect(0, groundY, W, 400); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
    ctx.fillStyle = '#8b96a1'; ctx.fillRect(W / 2 - 110, groundY - 14, 220, 14); ctx.strokeRect(W / 2 - 110, groundY - 14, 220, 14);
    ctx.fillStyle = '#5a6270'; ctx.fillRect(W / 2 + 90, groundY - 230, 14, 216); ctx.strokeRect(W / 2 + 90, groundY - 230, 14, 216);
    // clouds flying past (going down)
    if (lift > 0.2) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 6; i++) { const cy = top + ((i * 130 + (t - 200) * 6) % (H + DY + 200)) - 100, cx = (i * 263) % W; ctx.beginPath(); ctx.ellipse(cx, cy, 90, 22, 0, 0, Math.PI * 2); ctx.ellipse(cx + 50, cy - 14, 50, 20, 0, 0, Math.PI * 2); ctx.fill(); } }
  }
  if (t >= 330 && t < 480) {
    // the green Dinoland planet sinks away, the moon comes closer
    const u = cruise;
    ctx.fillStyle = '#4f9e5a'; ctx.beginPath(); ctx.arc(W * 0.3, H + 200 + u * 500, 360 - u * 200, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(242,166,90,0.7)'; ctx.beginPath(); ctx.ellipse(W * 0.3 - 60, H + 120 + u * 500, 80, 30, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = MOON; ctx.beginPath(); ctx.arc(W * 0.72, top + 40 - 200 + u * 260, 60 + u * 140, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = MOON_D; ctx.beginPath(); ctx.arc(W * 0.72 - 30 * (1 + u), top + 40 - 200 + u * 260 - 10, 14 * (1 + u * 2), 0, Math.PI * 2); ctx.arc(W * 0.72 + 40 * (1 + u), top + 40 - 200 + u * 260 + 30, 10 * (1 + u * 2), 0, Math.PI * 2); ctx.fill();
  }
  // the rocket: standing → rising (camera follows) → flying → landing on the moon
  let ry = FLOOR - 14, flame = 0, rx = W / 2, rs = 0.8, rot = 0;
  if (t < 180) { flame = t > 150 ? (t - 150) / 30 * 0.4 : 0; ry += Math.sin(t * 0.8) * (t > 120 ? 1.5 : 0); }
  else if (t < 330) { ry = FLOOR - 14 - lift * 80; flame = 1; ry += Math.sin(t) * 1.5; }
  else if (t < 470) { ry = FLOOR - 94 + Math.sin(t * 0.05) * 10; flame = 1; rot = Math.sin(t * 0.03) * 0.05; }
  else {
    // the moon surface rises; the rocket comes down gently with small flames
    const mg = H + 300 - land * (H + 300 - FLOOR);
    ctx.fillStyle = MOON; ctx.fillRect(0, mg, W, 500); ctx.fillStyle = MOON_L; ctx.fillRect(0, mg - 6, W, 6);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = MOON_D; ctx.beginPath(); ctx.ellipse(i * 170 + 40, mg + 24, 30, 7, 0, 0, Math.PI * 2); ctx.fill(); }
    ry = Math.min(mg - 14, FLOOR - 94 + land * 80); flame = land < 0.95 ? 0.5 : 0;
    if (land >= 0.95 && !I.dust) { I.dust = true; S.shake = 6; }
  }
  ctx.save(); ctx.translate(rx, ry); ctx.rotate(rot); drawRocket(0, 0, rs, flame, true); ctx.restore();
  if (t < 180 && t > 120) { ctx.fillStyle = 'rgba(230,230,230,0.8)'; for (let i = 0; i < 8; i++) { const u = ((t + i * 10) % 40) / 40; ctx.beginPath(); ctx.arc(rx + (i - 3.5) * 30 * (1 + u), FLOOR - 10 - u * 20, 18 + u * 20, 0, Math.PI * 2); ctx.fill(); } }
  // countdown and texts
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.strokeStyle = OUT; ctx.lineJoin = 'round';
  if (t < 180) {
    const n = 3 - Math.floor(t / 60), u = (t % 60) / 60;
    ctx.font = `bold ${110 + (1 - u) * 40}px Arial`; ctx.lineWidth = 10; ctx.fillStyle = '#ffd23a'; ctx.globalAlpha = 1 - u * 0.6;
    ctx.strokeText(String(n), W / 2 - 330, H / 2 - 20); ctx.fillText(String(n), W / 2 - 330, H / 2 - 20); ctx.globalAlpha = 1;
    ctx.font = 'bold 26px Arial'; ctx.lineWidth = 6; ctx.fillStyle = '#ffffff'; ctx.strokeText(tx('Countdown!'), W / 2 - 330, H / 2 + 60); ctx.fillText(tx('Countdown!'), W / 2 - 330, H / 2 + 60);
  } else if (t < 260) { ctx.font = 'bold 54px Arial'; ctx.lineWidth = 8; ctx.fillStyle = '#ff7a2a'; ctx.strokeText(tx('START!'), W / 2 - 330, H / 2); ctx.fillText(tx('START!'), W / 2 - 330, H / 2); }
  else if (t < 470) { ctx.font = 'bold 34px Arial'; ctx.lineWidth = 7; ctx.fillStyle = '#9fd8ff'; ctx.strokeText(tx('Auf zum Mond!'), W / 2 - 330, top + 90); ctx.fillText(tx('Auf zum Mond!'), W / 2 - 330, top + 90); }
  else if (t > 540) { ctx.font = 'bold 44px Arial'; ctx.lineWidth = 8; ctx.fillStyle = '#ffffff'; ctx.strokeText(tx('DIE MONDBASIS'), W / 2 - 330, H / 2 - 40); ctx.fillText(tx('DIE MONDBASIS'), W / 2 - 330, H / 2 - 40); }
  ctx.restore();
  button(SKIP_BTN, tx('Überspringen') + ' ▶▶', '#4a6fa5', '#2c4a78');
  sayBtn(W / 2 - 330 - 17, H / 2 + 84, tx(t < 180 ? 'Countdown!' : t < 260 ? 'START!' : t < 470 ? 'Auf zum Mond!' : 'DIE MONDBASIS'), 34);
}
function mixCol(a, b, u) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) * (1 - u)) + ((pb >> 16) * u)), g = Math.round((((pa >> 8) & 255) * (1 - u)) + (((pb >> 8) & 255) * u)), bl = Math.round(((pa & 255) * (1 - u)) + ((pb & 255) * u));
  return `rgb(${r},${g},${bl})`;
}
function drawQuiz() {
  const q = S.quiz, c = q.cur, b = S.boss;
  drawSpace(0);
  for (const p of QS) { p.t += 1; p.x += p.vx; p.y += p.vy; } for (let i = QS.length - 1; i >= 0; i--) if (QS[i].t > 30) QS.splice(i, 1);
  // the Sternenfresser on the right
  if (b) drawStarEater(1180, H - 110, 0.62, b);
  if (!c) return;
  const C = c.C, bx = quizBox();
  ctx.save();
  ctx.fillStyle = 'rgba(80,100,200,0.10)'; ctx.strokeStyle = 'rgba(160,190,255,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(bx.x, bx.y, bx.w, bx.h, 18); ctx.fill(); ctx.stroke();
  const full = c.state === 'show' || c.state === 'picture' || c.state === 'ask' || c.state === 'answered' || c.state === 'aurora';
  const showA = c.state === 'show' ? clamp(1 - (c.t - 130) / 40, 0, 1) : 1;
  // the picture behind (big and soft)
  if (c.state !== 'trace' && c.state !== 'show') {
    ctx.globalAlpha = clamp(c.state === 'picture' ? c.t / 40 : 1, 0, 1) * 0.85;
    ctx.font = `${Math.min(bx.w, bx.h) * 0.7}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(C.pic, bx.x + bx.w / 2, bx.y + bx.h / 2 + 10);
    ctx.globalAlpha = 1;
  }
  // lines
  const line = (i, j) => { const a = starPos(C, i), z = starPos(C, j); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(z.x, z.y); ctx.stroke(); };
  ctx.lineCap = 'round';
  if (c.state === 'show') {
    ctx.globalAlpha = showA; ctx.strokeStyle = 'rgba(255,230,140,0.9)'; ctx.lineWidth = 4; ctx.shadowColor = '#ffe14d'; ctx.shadowBlur = 12;
    for (let k = 1; k < C.path.length; k++) if (C.path[k] != null && C.path[k - 1] != null) line(C.path[k - 1], C.path[k]);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  } else {
    ctx.strokeStyle = full ? 'rgba(255,230,140,0.95)' : '#ffe68a'; ctx.lineWidth = 4; ctx.shadowColor = '#ffe14d'; ctx.shadowBlur = full ? 14 : 8;
    if (full) { for (let k = 1; k < C.path.length; k++) if (C.path[k] != null && C.path[k - 1] != null) line(C.path[k - 1], C.path[k]); }
    else for (const [i, j] of c.lines) line(i, j);
    ctx.shadowBlur = 0;
  }
  // stars
  const want = c.state === 'trace' ? C.path[c.step] : -1;
  C.stars.forEach((s, i) => {
    const p = starPos(C, i); let r = 7;
    let dx = 0; if (c.wrongT > 0 && c.shakeStar === i) dx = Math.sin(c.wrongT * 1.5) * 4;
    if (i === want) {
      const blink = 0.5 + Math.abs(Math.sin(S.t * 0.12)) * 0.5; r = 9 + blink * 4;
      ctx.fillStyle = `rgba(255,230,120,${0.25 * blink})`; ctx.beginPath(); ctx.arc(p.x, p.y, 26 + (c.wrong >= 2 ? Math.sin(S.t * 0.2) * 8 + 10 : 0), 0, Math.PI * 2); ctx.fill();
      if (c.wrong >= 2 && c.prev != null) { const a = starPos(C, c.prev); ctx.setLineDash([6, 8]); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.setLineDash([]); }
    }
    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10; drawStar5(p.x + dx, p.y, r, i === want ? '#ffe14d' : '#ffffff'); ctx.shadowBlur = 0;
  });
  if (c.state === 'aurora') {
    // the invisible planet appears inside the lion
    const u = clamp(c.t / 120, 0, 1), p = starPos(C, 7), q2 = starPos(C, 2), cx = (p.x + q2.x) / 2, cy = (p.y + q2.y) / 2;
    const r = 10 + u * 60;
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 2, cx, cy, r); g.addColorStop(0, '#9ff5e0'); g.addColorStop(0.6, '#36c9a5'); g.addColorStop(1, '#1f7a6a');
    ctx.globalAlpha = u; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.ellipse(cx - r * 0.2, cy + r * 0.1, r * 0.35, r * 0.2, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.4, r * 0.35, -0.3, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  }
  for (const p of QS) { ctx.globalAlpha = 1 - p.t / 30; drawStar5(p.x, p.y, 4, '#ffe68a'); } ctx.globalAlpha = 1;
  ctx.restore();
  // text on the right
  ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.strokeStyle = OUT; ctx.lineJoin = 'round';
  const head = c.state === 'show' ? tx('Schau gut hin – so sieht das Sternbild aus!')
    : c.state === 'trace' ? tx('Zeichne das Sternbild nach: tippe Stern für Stern!')
    : c.state === 'picture' ? tx('Super! Das Sternbild ist zurück!')
    : c.state === 'aurora' ? tx('Im Löwen erscheint der Planet AURORA 61!') : tx('Wie heißt dieses Sternbild?');
  ctx.font = 'bold 18px Arial'; ctx.lineWidth = 5; ctx.fillStyle = '#ffe68a';
  const hx = 760 + (canSpeak() ? 42 : 0);
  wrapStroke(head, hx, -DY + 104, 470, 22);
  sayBtn(760, -DY + 88, head, 34);
  if (c.state === 'trace' && c.wrong >= 2) { sayBtn(700, -DY + 140, tx('Tipp: der gelb blinkende Stern ist der nächste.'), 30); ctx.font = 'bold 15px Arial'; ctx.fillStyle = '#9fd8ff'; ctx.lineWidth = 4; ctx.strokeText(tx('Tipp: der gelb blinkende Stern ist der nächste.'), 740, -DY + 156); ctx.fillText(tx('Tipp: der gelb blinkende Stern ist der nächste.'), 740, -DY + 156); }
  ctx.font = 'bold 14px Arial'; ctx.fillStyle = '#bfe6ff'; ctx.lineWidth = 4;
  const rd = tx('Sternbild {n}', { n: q.round + 1 }) + '   ·   ' + tx('Noch {n} Treffer', { n: b ? b.hp : 0 });
  ctx.strokeText(rd, 740, H - 14); ctx.fillText(rd, 740, H - 14);
  ctx.restore();
  if (c.state === 'ask' || c.state === 'answered') {
    for (let i = 0; i < 5; i++) {
      const r = optRect(i), id = c.opts[i], picked = c.picked === i, isRight = id === c.id;
      let col1 = '#3a4a8a', col2 = '#23306a';
      if (c.state === 'answered' && isRight) { col1 = '#34c759'; col2 = '#1f8f3c'; }
      else if (c.state === 'answered' && picked) { col1 = '#ff5a4f'; col2 = '#c0352c'; }
      ctx.save(); const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h); g.addColorStop(0, col1); g.addColorStop(1, col2);
      ctx.fillStyle = g; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText((i + 1) + '.  ' + tx(CONSTELLATIONS[id].name), r.x + 14, r.y + r.h / 2 + 1);
      ctx.restore();
      const sr = sayRect(i); sayBtn(sr.x, sr.y, tx(CONSTELLATIONS[id].name), sr.h);
    }
    if (c.state === 'answered') {
      ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 26px Arial'; ctx.lineWidth = 6; ctx.strokeStyle = OUT;
      ctx.fillStyle = c.right ? '#7dffa0' : '#ffb0a0';
      const t = c.right ? tx('RICHTIG! Treffer!') : tx('Leider falsch – es ist: {n}', { n: tx(C.name) });
      ctx.strokeText(t, bx.x + bx.w / 2, bx.y + bx.h - 24); ctx.fillText(t, bx.x + bx.w / 2, bx.y + bx.h - 24);
      sayBtn(bx.x + bx.w / 2 + ctx.measureText(t).width / 2 + 10, bx.y + bx.h - 42, t, 34);
      ctx.restore();
    }
  }
}
function sayButton(r) {
  ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 10); ctx.fill(); ctx.stroke();
  ctx.font = `${Math.round(r.h * 0.55)}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔊', r.x + r.w / 2, r.y + r.h / 2 + 1);
  ctx.restore();
}
function wrapStroke(t, x, y, maxW, lh) {
  const words = t.split(' '); let line = '', yy = y;
  const out = l => { ctx.strokeText(l, x, yy); ctx.fillText(l, x, yy); yy += lh; };
  for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { out(line); line = w; } else line = test; }
  if (line) out(line);
}

// ---------------- start panel ----------------
function startPanel() {
  const touch = CTRL.touch;
  panel(tx('DIE MONDBASIS'), [
    touch ? tx('◀ ▶ links gedrückt halten = fahren · SPRUNG rechts = springen') : tx('Pfeil ← / → halten = fahren · Leertaste / Klick = springen'),
    tx('Auf dem Mond gibt es wenig Schwerkraft: du springst hoch und weit!'),
    tx('In den blauen Zonen dreht sich die Schwerkraft um – du fährst an der Decke!'),
    tx('Laser-Schranken gehen an und aus: warte, bis sie grün sind.'),
    tx('Im Spielautomaten wartet ALIEN-ATTACKE. Am Ende: der STERNENFRESSER.'),
  ], '#9fd8ff');
  button(BTN.start, '▶  ' + tx('LOS GEHT\'S'), '#34c759', '#1f8f3c');
}
