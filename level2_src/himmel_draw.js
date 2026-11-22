
// ================= SKY DRAWING =================
function seeded(n) { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }
function cloudBlob(x, y, s, col = '#ffffff', outline = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = col;
  ctx.beginPath();
  for (const [dx, dy, r] of [[-30, 6, 18], [-12, -6, 22], [10, -10, 24], [30, 0, 20], [44, 8, 14], [-44, 10, 12]]) { ctx.moveTo(dx + r, dy); ctx.arc(dx, dy, r, 0, Math.PI * 2); }
  ctx.fill();
  ctx.fillRect(-46, 6, 92, 16);
  if (outline) { ctx.fillStyle = 'rgba(160,185,220,0.35)'; ctx.fillRect(-46, 16, 92, 6); }
  ctx.restore();
}
function drawSky() {
  const g = ctx.createLinearGradient(0, -DY, 0, H);
  g.addColorStop(0, '#55b3ec'); g.addColorStop(DY / VH * 0.9 || 0.001, '#6cc3f2'); g.addColorStop(1 - 0.45 * H / VH, '#b9e3fb'); g.addColorStop(1, '#ffe3f1');
  ctx.fillStyle = g; ctx.fillRect(0, -DY, W, VH);
  // high clouds in the open sky above
  for (let i = 0; i < 8 && DY > 20; i++) { const x = ((i * 240 - S.scroll * 0.05) % (W + 300) + W + 300) % (W + 300) - 150; cloudBlob(x, -DY + 40 + seeded(i * 11) * Math.max(10, DY - 40), 0.8 + seeded(i) * 0.6, 'rgba(255,255,255,0.6)', false); }
  // soft golden light from the top right
  const sg = ctx.createRadialGradient(1050, -40, 20, 1050, -40, 520);
  sg.addColorStop(0, 'rgba(255,245,190,0.85)'); sg.addColorStop(1, 'rgba(255,245,190,0)');
  ctx.fillStyle = sg; ctx.fillRect(0, -DY, W, VH);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const a = -2.2 + i * 0.16 + Math.sin(S.t * 0.005 + i) * 0.02;
    ctx.fillStyle = 'rgba(255,250,220,0.06)'; ctx.beginPath(); ctx.moveTo(1050, -40); ctx.lineTo(1050 + Math.cos(a) * 900, -40 + Math.sin(-a) * 900); ctx.lineTo(1050 + Math.cos(a + 0.06) * 900, -40 + Math.sin(-a - 0.06) * 900); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // far pillars of the heavenly gate (very faint)
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 4; i++) { const x = ((i * 420 - S.scroll * 0.05) % (W + 420) + W + 420) % (W + 420) - 200; ctx.fillRect(x, 110, 22, 160); ctx.fillRect(x - 6, 104, 34, 10); ctx.fillRect(x + 140, 110, 22, 160); ctx.fillRect(x + 134, 104, 34, 10); ctx.beginPath(); ctx.arc(x + 92, 110, 82, Math.PI, 0); ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke(); }
  // cloud layers (parallax)
  for (const [par, y, s, col, seed] of [[0.08, 150, 1.1, 'rgba(255,255,255,0.55)', 2], [0.2, 210, 1.3, 'rgba(255,255,255,0.75)', 5], [0.45, 250, 1.0, 'rgba(255,255,255,0.9)', 9]]) {
    const seg = 230, off = S.scroll * par, start = Math.floor(off / seg) - 1;
    for (let i = start; i < start + W / seg + 3; i++) cloudBlob(i * seg - off + seeded(i + seed) * 80, y + seeded(i * 3 + seed) * 30, s * (0.7 + seeded(i * 7 + seed) * 0.6), col, false);
  }
}
function drawCloudFloor() {
  const off = S.scroll, seg = 90, start = Math.floor(off / seg) - 1;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, FLOOR + 10, W, H);
  for (let i = start; i < start + W / seg + 3; i++) { const x = i * seg - off; ctx.beginPath(); ctx.arc(x, FLOOR + 12 + seeded(i) * 6, 34 + seeded(i * 2) * 12, Math.PI, 0); ctx.fill(); }
  ctx.fillStyle = 'rgba(170,195,230,0.4)'; ctx.fillRect(0, FLOOR + 28, W, H);
  // danger: red / orange flicker on the clouds when Kai flies too low
  const fw = S.phase === 'play' && !S.stop ? (S.floorWarn || 0) : 0;
  if (fw > 0) {
    const fl = 0.5 + 0.5 * Math.sin(S.t * 0.55);
    const g = ctx.createLinearGradient(0, FLOOR - 50, 0, H);
    g.addColorStop(0, 'rgba(255,90,40,0)'); g.addColorStop(0.45, `rgba(255,${Math.round(60 + fl * 90)},30,${0.65 * fw})`); g.addColorStop(1, `rgba(230,40,30,${0.8 * fw})`);
    ctx.fillStyle = g; ctx.fillRect(0, FLOOR - 50, W, H - FLOOR + 50);
  }
}

// ---------- objects ----------
function drawCoin(o) {
  const s = Math.abs(Math.cos(o.p * 1.5));
  ctx.save(); ctx.translate(o.x, o.y + Math.sin(o.p) * 2); ctx.scale(Math.max(0.15, s), 1);
  ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#c98f10'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
function drawDevil(o) {
  ctx.save(); ctx.translate(o.x, o.y); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
  // bat wings
  const w = Math.sin(o.p * 8) * 0.4;
  for (const sd of [-1, 1]) { ctx.save(); ctx.scale(sd, 1); ctx.rotate(w * sd); ctx.fillStyle = '#7a1f2a'; ctx.beginPath(); ctx.moveTo(8, -4); ctx.lineTo(30, -16); ctx.lineTo(26, -4); ctx.lineTo(32, 2); ctx.lineTo(22, 4); ctx.lineTo(24, 10); ctx.lineTo(8, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  // tail
  ctx.strokeStyle = '#d8352c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(6, 12); ctx.quadraticCurveTo(22, 22 + Math.sin(o.p * 4) * 4, 18, 30); ctx.stroke();
  ctx.fillStyle = '#d8352c'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(18, 30); ctx.lineTo(13, 35); ctx.lineTo(22, 36); ctx.closePath(); ctx.fill(); ctx.stroke();
  // body + head
  ctx.lineWidth = 2.2;
  ctx.fillStyle = '#e8463c'; ctx.beginPath(); ctx.ellipse(0, 8, 11, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -10, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff3d6'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 6, -20); ctx.quadraticCurveTo(sd * 12, -32, sd * 13, -30); ctx.quadraticCurveTo(sd * 11, -24, sd * 10, -18); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // cheeky face
  ctx.fillStyle = '#fff'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 5 - 2, -12, 3.5, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = OUT; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * 5 - 3.5, -11, 1.8, 0, Math.PI * 2); ctx.fill(); }
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, -17); ctx.lineTo(-3, -15); ctx.moveTo(8, -17); ctx.lineTo(1, -15); ctx.stroke();
  ctx.beginPath(); ctx.arc(-2, -5, 5, 0.2, Math.PI - 0.2); ctx.stroke();
  // little pitchfork in the hand
  ctx.strokeStyle = '#3b4652'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-12, 16); ctx.lineTo(-20, -14); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-24, -12); ctx.lineTo(-22, -22); ctx.moveTo(-20, -14); ctx.lineTo(-19, -24); ctx.moveTo(-16, -15); ctx.lineTo(-16, -24); ctx.moveTo(-24, -12); ctx.lineTo(-16, -15); ctx.stroke();
  ctx.restore();
}
function drawPitchfork(s) {
  ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.atan2(s.vy, s.vx) + Math.PI); ctx.lineCap = 'round';
  ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(30, 0); ctx.stroke();
  ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(30, 0); ctx.stroke();
  ctx.strokeStyle = '#9aa6b1'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(-4, 8); ctx.moveTo(-4, -8); ctx.lineTo(-14, -8); ctx.moveTo(-4, 0); ctx.lineTo(-16, 0); ctx.moveTo(-4, 8); ctx.lineTo(-14, 8); ctx.stroke();
  ctx.restore();
}
function drawLightning(o) {
  const x = o.x + o.w / 2;
  ctx.save();
  // dark cloud on top
  const top = ceilY() - 60;
  cloudBlob(x, top, 0.8, '#5d6b80', false);
  if (o.t < 60) {
    if (Math.sin(o.t * 0.6) > 0) { ctx.strokeStyle = 'rgba(255,240,120,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(x, top + 20); ctx.lineTo(x, FLOOR); ctx.stroke(); ctx.setLineDash([]); }
  } else {
    ctx.globalAlpha = 1 - (o.t - 60) / 25;
    ctx.strokeStyle = '#fff8c0'; ctx.lineWidth = 9; ctx.shadowColor = '#ffe14d'; ctx.shadowBlur = 24; ctx.lineJoin = 'miter';
    ctx.beginPath(); ctx.moveTo(x, top + 18);
    for (let y = top + 18, i = 0; y < FLOOR; y += 26, i++) ctx.lineTo(x + (i % 2 ? 14 : -14), y + 26);
    ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,220,0.25)'; ctx.fillRect(0, -DY, W, VH);
  }
  ctx.restore();
}
function drawStorm(o) {
  ctx.save();
  cloudBlob(o.x, o.y, 0.75, '#5d6b80', false);
  ctx.strokeStyle = 'rgba(120,160,220,0.8)'; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) { const rx = o.x - 26 + i * 13, ry = o.y + 20 + ((S.t * 3 + i * 9) % 26); ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 7); ctx.stroke(); }
  ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(o.x + 4, o.y - 2); ctx.lineTo(o.x - 4, o.y + 10); ctx.lineTo(o.x + 1, o.y + 10); ctx.lineTo(o.x - 3, o.y + 20); ctx.lineTo(o.x + 8, o.y + 6); ctx.lineTo(o.x + 3, o.y + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawCloudPlatform(o) {
  ctx.save(); ctx.globalAlpha = Math.max(0, o.life);
  const wob = o.stand > 40 ? Math.sin(S.t * 0.6) * 2 : 0;
  ctx.translate(wob, 0);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(150,175,210,0.9)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(o.x, o.y + 4);
  ctx.quadraticCurveTo(o.x + 10, o.y - 14, o.x + 34, o.y - 8); ctx.quadraticCurveTo(o.x + 56, o.y - 22, o.x + 80, o.y - 10); ctx.quadraticCurveTo(o.x + 108, o.y - 18, o.x + o.w, o.y + 2);
  ctx.quadraticCurveTo(o.x + o.w + 6, o.y + 18, o.x + o.w - 20, o.y + 20); ctx.lineTo(o.x + 14, o.y + 20); ctx.quadraticCurveTo(o.x - 8, o.y + 18, o.x, o.y + 4);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawRainbow(o) {
  ctx.save(); ctx.lineCap = 'round';
  const cols = ['#ff5a5a', '#ffb02e', '#ffe14d', '#5fd36a', '#36a8f4', '#9b63d6'];
  // soft glow under the arc
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 50; ctx.beginPath();
  for (let u = 0; u <= 1.001; u += 0.02) { const x = o.x + u * o.w, y = rbY(o, u) + 20; u ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  cols.forEach((c, i) => {
    ctx.strokeStyle = c; ctx.lineWidth = 7; ctx.beginPath();
    for (let u = 0; u <= 1.001; u += 0.02) { const x = o.x + u * o.w, y = rbY(o, u) + 3 + i * 6.5; u ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
  });
  // the clouds it stands on
  cloudBlob(o.x + 6, o.base + 30, 0.75); cloudBlob(o.x + o.w - 6, o.base + 30, 0.75);
  ctx.restore();
}
function drawOxxo(o) {
  // a tiny corner shop high up on its own little cloud (about two Kai heads big)
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(OXXO_W / 54, OXXO_W / 54);
  const x = 0, y = 0, w = 54, h = 34;
  ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.4;
  // soft glow so it can be spotted
  const gl = ctx.createRadialGradient(x + w / 2, y - h / 2, 4, x + w / 2, y - h / 2, 60);
  gl.addColorStop(0, 'rgba(255,230,120,0.55)'); gl.addColorStop(1, 'rgba(255,230,120,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x + w / 2, y - h / 2, 60, 0, Math.PI * 2); ctx.fill();
  cloudBlob(x + w / 2, y + 8, 0.55);
  ctx.fillStyle = '#f4efe6'; ctx.fillRect(x + 4, y - h + 10, w - 8, h - 10); ctx.strokeRect(x + 4, y - h + 10, w - 8, h - 10);
  // red sign with yellow stripes
  ctx.fillStyle = '#d8241f'; ctx.fillRect(x, y - h, w, 13); ctx.strokeRect(x, y - h, w, 13);
  ctx.fillStyle = '#ffd23a'; ctx.fillRect(x, y - h, w, 2.5); ctx.fillRect(x, y - h + 10.5, w, 2.5);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 9px Arial Black, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OXXO', x + w / 2, y - h + 6.8);
  // window + door
  ctx.fillStyle = '#bfe3f5'; ctx.fillRect(x + 8, y - 19, 16, 12); ctx.strokeRect(x + 8, y - 19, 16, 12);
  ctx.fillStyle = '#8fd0ea'; ctx.fillRect(x + 30, y - 19, 12, 19); ctx.strokeRect(x + 30, y - 19, 12, 19);
  // tiny angel cashier
  ctx.fillStyle = '#f6cfa6'; ctx.beginPath(); ctx.arc(x + 16, y - 13, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x + 16, y - 17.5, 3, 1, 0, 0, Math.PI * 2); ctx.stroke();
  // little wings on the roof
  ctx.strokeStyle = OUT; ctx.lineWidth = 1.5;
  for (const sd of [-1, 1]) { ctx.save(); ctx.translate(x + w / 2 + sd * (w / 2 - 2), y - h + 2); ctx.scale(sd, 1); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8, -10, 16, -9); ctx.quadraticCurveTo(12, -4, 14, -2); ctx.quadraticCurveTo(8, -1, 0, 3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
function drawField(o) {
  // a small cloud football pitch with the goal made of clouds
  const x = o.x;
  ctx.save();
  cloudBlob(x + 300, FLOOR + 8, 4.4);
  ctx.restore();
}
function drawAngel(x, y, s = 1, armsUp = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
  const fl = Math.sin(S.t * 0.15) * 0.2;
  for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * 6, -48); ctx.scale(sd, 1); ctx.rotate(-0.3 - fl); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(18, -22, 40, -24); ctx.quadraticCurveTo(32, -12, 36, -4); ctx.quadraticCurveTo(20, 2, 0, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-10, -50); ctx.lineTo(10, -50); ctx.lineTo(14, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd23a'; ctx.fillRect(-11, -30, 22, 4);
  ctx.strokeStyle = '#f6cfa6'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-9, -44); ctx.lineTo(-20, armsUp ? -62 : -28); ctx.moveTo(9, -44); ctx.lineTo(20, armsUp ? -62 : -28); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
  ctx.fillStyle = '#f6cfa6'; ctx.beginPath(); ctx.arc(0, -60, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.arc(0, -64, 11, Math.PI, 0); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(-4, -59, 1.6, 0, Math.PI * 2); ctx.arc(4, -59, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -55, 3.5, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 3; ctx.shadowColor = '#ffe68a'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.ellipse(0, -78, 11, 3.5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.restore();
}
function drawArrow(a) {
  ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(Math.atan2(a.vy, a.vx)); ctx.globalCompositeOperation = 'lighter';
  if (a.star) {
    ctx.fillStyle = '#fff3a0'; ctx.shadowColor = '#ffe14d'; ctx.shadowBlur = 14;
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 4 : 10, an = i * Math.PI / 5; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.closePath(); ctx.fill();
  } else {
    const g = ctx.createLinearGradient(-40, 0, 10, 0); g.addColorStop(0, 'rgba(255,230,120,0)'); g.addColorStop(1, 'rgba(255,240,170,0.9)');
    ctx.fillStyle = g; ctx.fillRect(-40, -3, 44, 6);
    ctx.shadowColor = '#ffe14d'; ctx.shadowBlur = 12; ctx.fillStyle = '#fffbe0';
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(2, -6); ctx.lineTo(4, 0); ctx.lineTo(2, 6); ctx.closePath(); ctx.fill();
    ctx.fillRect(-14, -1.5, 18, 3);
  }
  ctx.restore();
}

// ---------- overlays ----------
function bubble(cx, cy, text, withButtons, below) {
  ctx.save(); ctx.font = 'bold 15px Arial'; const tw = ctx.measureText(text).width;
  const bw = tw + 30, bh = withButtons ? 78 : 40, bx = clamp(cx - bw / 2, 10, W - bw - 10), by = below ? cy + 16 : cy - bh - 20;
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 14); ctx.fill(); ctx.stroke();
  if (below) { ctx.beginPath(); ctx.moveTo(cx - 10, by); ctx.lineTo(cx, by - 16); ctx.lineTo(cx + 10, by); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(cx - 9, by - 2, 18, 5); }
  else { ctx.beginPath(); ctx.moveTo(cx - 10, by + bh); ctx.lineTo(cx, by + bh + 16); ctx.lineTo(cx + 10, by + bh); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(cx - 9, by + bh - 3, 18, 5); }
  ctx.fillStyle = OUT; ctx.textBaseline = 'middle'; ctx.fillText(text, bx + 15, by + 22);
  if (withButtons) {
    BTN.yes.x = bx + bw / 2 - 80; BTN.yes.y = by + 40; BTN.no.x = bx + bw / 2 + 10; BTN.no.y = by + 40;
    for (const [b, label, c1, c2] of [[BTN.yes, tx('JA'), '#34c759', '#1f8f3c'], [BTN.no, tx('NEIN'), '#ff5a4f', '#c0352c']]) {
      const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h); g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1); ctx.textAlign = 'left';
    }
  }
  ctx.restore();
}
function drawShopIcon(id, cx, cy) {
  ctx.save(); ctx.translate(cx, cy); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  if (id === 'harpoon') { ctx.rotate(-0.5); ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(18, 0); ctx.stroke(); ctx.strokeStyle = '#a0703a'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#d8dee6'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(18, -6); ctx.lineTo(32, 0); ctx.lineTo(18, 6); ctx.lineTo(21, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (id === 'turbo') { ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ff8a00'; ctx.beginPath(); ctx.moveTo(3, -12); ctx.lineTo(-7, 2); ctx.lineTo(-1, 2); ctx.lineTo(-4, 12); ctx.lineTo(7, -3); ctx.lineTo(1, -3); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (id === 'star') { ctx.fillStyle = '#fff3a0'; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(10, -3); ctx.lineTo(22, 0); ctx.lineTo(10, 3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); } ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  if (id === 'heart') { drawHeart(0, 0, 16, true); }
  if (id === 'capRed' || id === 'capGreen' || id === 'capBali') { ctx.fillStyle = id === 'capRed' ? '#d8352c' : id === 'capBali' ? '#f48fb8' : '#2f8a5f'; ctx.beginPath(); ctx.moveTo(-16, 6); ctx.quadraticCurveTo(-14, -16, 4, -14); ctx.quadraticCurveTo(16, -12, 14, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(10, 4); ctx.quadraticCurveTo(24, 3, 28, 7); ctx.lineTo(12, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (id === 'beanie') { ctx.fillStyle = '#7a3fb8'; ctx.beginPath(); ctx.moveTo(-15, 8); ctx.quadraticCurveTo(-15, -18, 0, -17); ctx.quadraticCurveTo(15, -16, 15, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#9b63d6'; ctx.beginPath(); ctx.roundRect(-16, 2, 32, 8, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(0, -19, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  if (id === 'backpack') { ctx.fillStyle = '#e8463c'; ctx.beginPath(); ctx.roundRect(-13, -16, 26, 32, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(-9, 0, 18, 6); ctx.strokeRect(-9, 0, 18, 6); }
  if (id === 'teeRed' || id === 'teeYellow') { ctx.fillStyle = id === 'teeRed' ? '#c8352c' : '#e0a81e'; ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(-20, -6); ctx.lineTo(-15, 2); ctx.lineTo(-10, -1); ctx.lineTo(-10, 16); ctx.lineTo(10, 16); ctx.lineTo(10, -1); ctx.lineTo(15, 2); ctx.lineTo(20, -6); ctx.lineTo(8, -14); ctx.quadraticCurveTo(0, -8, -8, -14); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (id === 'shorts') { ctx.fillStyle = '#4a78b8'; ctx.beginPath(); ctx.moveTo(-16, -12); ctx.lineTo(16, -12); ctx.lineTo(18, 8); ctx.lineTo(3, 8); ctx.lineTo(0, -2); ctx.lineTo(-3, 8); ctx.lineTo(-18, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#2f5a96'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-16, -7); ctx.lineTo(16, -7); ctx.stroke(); }
  if (id === 'skirt') { ctx.fillStyle = '#d94f7c'; ctx.beginPath(); ctx.moveTo(-11, -14); ctx.lineTo(11, -14); ctx.lineTo(20, 14); ctx.quadraticCurveTo(0, 19, -20, 14); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-4, -12); ctx.lineTo(-8, 15); ctx.moveTo(4, -12); ctx.lineTo(8, 15); ctx.stroke(); }
  if (id === 'shoesRed') { ctx.fillStyle = '#d8352c'; ctx.beginPath(); ctx.roundRect(-20, -4, 26, 10, 4); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(0, 4, 26, 10, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-19, 3, 24, 2.5); ctx.fillRect(1, 11, 24, 2.5); }
  ctx.restore();
}
function drawShop() {
  ctx.save(); ctx.fillStyle = 'rgba(40,10,10,0.78)'; ctx.fillRect(0, -VH, W, 3 * VH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#d8241f'; ctx.beginPath(); ctx.roundRect(W / 2 - 90, 8, 180, 34, 10); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(W / 2 - 90, 8, 180, 5); ctx.fillRect(W / 2 - 90, 37, 180, 5);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Arial Black, Arial'; ctx.fillText('OXXO', W / 2, 26);
  ctx.textAlign = 'left'; ctx.font = 'bold 15px Arial'; drawCoin({ x: W / 2 + 140, y: 25, p: 0 }); ctx.fillStyle = '#fff'; ctx.fillText(String(S.coins), W / 2 + 156, 26);
  shopList().forEach((it, i) => {
    const r = shopCardRect(i), owned = shopOwned(it), afford = S.coins >= it.price;
    const worn = it.kind === 'cloth' && owned && isWorn(it.id);
    ctx.fillStyle = owned ? '#eaf7ea' : afford ? '#fff8e8' : '#d9d2c8'; ctx.strokeStyle = it.id === 'harpoon' && !owned ? '#ffd23a' : OUT; ctx.lineWidth = it.id === 'harpoon' && !owned ? 4 : 2.5;
    ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 12); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = afford || owned ? 1 : 0.5;
    drawShopIcon(it.id, r.x + 34, r.y + 40);
    ctx.fillStyle = OUT; ctx.textAlign = 'left'; let fs = 13; ctx.font = `bold ${fs}px Arial`; while (ctx.measureText(tx(it.name)).width > r.w - 68 && fs > 9) { fs--; ctx.font = `bold ${fs}px Arial`; } ctx.fillText(tx(it.name), r.x + 62, r.y + 22);
    if (it.desc) { ctx.font = '10px Arial'; ctx.fillStyle = '#5a5a5a'; wrapText(tx(it.desc), r.x + 62, r.y + 40, r.w - 68, 12); }
    ctx.globalAlpha = 1;
    // price / state
    ctx.textAlign = 'center'; ctx.font = 'bold 13px Arial';
    const label = owned ? (it.kind === 'cloth' ? (worn ? tx('Angezogen') : tx('Anziehen')) : tx('Schon gekauft')) : `${tx('Kaufen')} · ${it.price}`;
    ctx.fillStyle = owned ? '#2f8a5f' : afford ? '#d8241f' : '#8a8a8a';
    ctx.beginPath(); ctx.roundRect(r.x + 10, r.y + r.h - 34, r.w - 20, 24, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(label, r.x + r.w / 2, r.y + r.h - 21);
  });
  if (S.shopMsgT > 0) { ctx.textAlign = 'center'; ctx.font = 'bold 16px Arial'; ctx.fillStyle = '#ffd23a'; ctx.fillText(S.shopMsg, W / 2 + 360, H - 28); }
  // continue button
  const b = BTN.shopDone; ctx.fillStyle = '#34c759'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 15px Arial'; ctx.fillText(tx('WEITER') + ' →', b.x + b.w / 2, b.y + b.h / 2 + 1);
  ctx.restore();
}
function isWorn(id) {
  const o = SAVE.outfit;
  return (id === 'capRed' && o.cap === '#d8352c' && !o.beanie) || (id === 'capGreen' && o.cap === '#2f8a5f' && !o.beanie) || (id === 'beanie' && o.beanie) || (id === 'backpack' && o.backpack) || (id === 'teeRed' && o.tee === '#c8352c') || (id === 'teeYellow' && o.tee === '#e0a81e') || (id === 'shoesRed' && o.shoes === '#d8352c') || (id === 'capBali' && o.cap === '#f48fb8' && !o.beanie) || (id === 'shorts' && o.bottom === 'shorts') || (id === 'skirt' && o.bottom === 'skirt');
}
function wrapText(text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '';
  for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); line = w; y += lh; } else line = test; }
  ctx.fillText(line, x, y);
}
// Kai seen from behind (penalty game)
function drawKaiBack(x, y, sc, kick) {
  const OF = SAVE.outfit || {}, isBali = OF.char === 'bali', SKIN = isBali ? '#f6d3b8' : '#f2c79e', TEE = OF.tee || (isBali ? '#f6a3c4' : '#1f3c6e'), CAP = OF.cap || '#1e4fa3';
  const BOTTOM = isBali ? (OF.bottom || 'jeans') : 'shorts', SHORTS = isBali ? (BOTTOM === 'skirt' ? '#d94f7c' : '#4a78b8') : '#b4652e', SHOE = OF.shoes || (isBali ? '#ffffff' : '#1b1b22');
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
  ctx.fillStyle = 'rgba(80,110,160,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 6, 0, 0, Math.PI * 2); ctx.fill();
  // legs (right leg swings for the kick)
  const kk = Math.sin(kick * Math.PI);
  for (const sd of [-1, 1]) {
    const lift = sd === 1 ? kk * 10 : 0, fx = sd * 9 + (sd === 1 ? -kk * 4 : 0);
    ctx.fillStyle = BOTTOM === 'jeans' ? SHORTS : SKIN; ctx.beginPath(); ctx.roundRect(sd * 9 - 5, -34, 10, 28 - lift, 4); ctx.fill(); ctx.stroke();
    if (BOTTOM !== 'jeans') { ctx.fillStyle = '#ffffff'; ctx.fillRect(sd * 9 - 5, -12 - lift, 10, 5); ctx.strokeRect(sd * 9 - 5, -12 - lift, 10, 5); }
    ctx.fillStyle = SHOE; ctx.beginPath(); ctx.ellipse(fx, -4 - lift, 8, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  // shorts
  ctx.fillStyle = SHORTS;
  if (BOTTOM === 'skirt') { ctx.beginPath(); ctx.moveTo(-15, -50); ctx.lineTo(15, -50); ctx.lineTo(21, -24); ctx.quadraticCurveTo(0, -20, -21, -24); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(-16, -50); ctx.lineTo(16, -50); ctx.lineTo(17, -30); ctx.lineTo(2, -30); ctx.lineTo(0, -36); ctx.lineTo(-2, -30); ctx.lineTo(-17, -30); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // arms
  for (const sd of [-1, 1]) {
    ctx.fillStyle = SKIN; ctx.beginPath(); ctx.roundRect(sd * 19 - 4, -76, 8, 34, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = TEE; ctx.beginPath(); ctx.roundRect(sd * 19 - 6, -80, 12, 14, 4); ctx.fill(); ctx.stroke();
  }
  // T-shirt (back)
  ctx.fillStyle = TEE; ctx.beginPath(); ctx.roundRect(-16, -82, 32, 36, 7); ctx.fill(); ctx.stroke();
  if (OF.backpack) { ctx.fillStyle = '#e0702b'; ctx.beginPath(); ctx.roundRect(-12, -78, 24, 28, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c2551a'; ctx.fillRect(-8, -62, 16, 8); ctx.strokeRect(-8, -62, 16, 8); }
  // angel wings on his back
  const fl = Math.sin(S.t * 0.12) * 0.12;
  for (const sd of [-1, 1]) {
    ctx.save(); ctx.translate(sd * 6, -74); ctx.scale(sd, 1); ctx.rotate(-0.25 - fl);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(20, -30, 52, -30); ctx.quadraticCurveTo(42, -16, 48, -8); ctx.quadraticCurveTo(36, -2, 40, 6); ctx.quadraticCurveTo(20, 8, 0, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,170,200,0.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(10, 2); ctx.lineTo(40, -14); ctx.moveTo(10, 8); ctx.lineTo(34, 2); ctx.stroke();
    ctx.restore();
  }
  ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
  // neck + head from behind: blond shoulder-length hair
  ctx.fillStyle = SKIN; ctx.fillRect(-4, -88, 8, 8);
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.ellipse(-14, -100, 3, 5, 0, 0, Math.PI * 2); ctx.ellipse(14, -100, 3, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // shoulder-length blond hair, a soft bob that flicks out at the ends
  ctx.fillStyle = isBali ? '#e8cd8e' : '#f2c26b'; ctx.beginPath(); ctx.moveTo(-15, -104);
  ctx.quadraticCurveTo(-19, -92, -17, -82); ctx.quadraticCurveTo(-12, -78, -8, -82); ctx.quadraticCurveTo(-4, -78, 0, -81);
  ctx.quadraticCurveTo(4, -78, 8, -82); ctx.quadraticCurveTo(12, -78, 17, -82); ctx.quadraticCurveTo(19, -92, 15, -104); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(170,115,40,0.55)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-7, -100); ctx.quadraticCurveTo(-9, -90, -8, -84); ctx.moveTo(7, -100); ctx.quadraticCurveTo(9, -90, 8, -84); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
  if (OF.beanie) { ctx.fillStyle = '#7a3fb8'; ctx.beginPath(); ctx.arc(0, -106, 16, Math.PI, 0); ctx.lineTo(16, -101); ctx.lineTo(-16, -101); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (isBali && !OF.cap) {
    // Bali without a cap: smooth blond hair on top of the head
    ctx.fillStyle = '#e8cd8e'; ctx.beginPath(); ctx.arc(0, -104, 16, Math.PI, 0); ctx.lineTo(16, -100); ctx.lineTo(-16, -100); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(170,115,40,0.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, -119); ctx.lineTo(0, -106); ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
  }
  else {
    // cap from behind: dome, the round opening above the strap shows a bit of hair
    ctx.fillStyle = CAP; ctx.beginPath(); ctx.arc(0, -105, 16, Math.PI, 0); ctx.lineTo(16, -102); ctx.lineTo(-16, -102); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2c26b'; ctx.beginPath(); ctx.arc(0, -102, 6, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = shade(CAP); ctx.beginPath(); ctx.roundRect(-7, -104, 14, 3, 1.5); ctx.fill();
    ctx.fillStyle = CAP; ctx.beginPath(); ctx.arc(0, -121, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  if (OF.halo) { ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 3; ctx.shadowColor = '#ffe68a'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.ellipse(0, -130, 13, 4, 0, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
  ctx.restore();
}
function drawFootball() {
  const f = S.foot;
  ctx.save();
  // --- its own scene: sky, cloud pitch, goal ---
  const g = ctx.createLinearGradient(0, -DY, 0, H); g.addColorStop(0, '#6cc0f2'); g.addColorStop(1, '#dff1fd');
  ctx.fillStyle = g; ctx.fillRect(0, -DY, W, VH);
  for (let i = 0; i < 9; i++) cloudBlob(60 + i * 150 + seeded(i) * 40, 70 + seeded(i * 3) * 50, 0.9 + seeded(i * 5) * 0.6, 'rgba(255,255,255,0.8)', false);
  // pitch (white cloud with light lines in perspective)
  ctx.fillStyle = '#f4f9ff'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 248); ctx.lineTo(W, 248); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(120,170,220,0.6)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(GOAL.x1 - 120, GOAL.bottom); ctx.lineTo(GOAL.x1 - 240, H); ctx.moveTo(GOAL.x2 + 120, GOAL.bottom); ctx.lineTo(GOAL.x2 + 240, H);
  ctx.moveTo(GOAL.x1 - 120, GOAL.bottom); ctx.lineTo(GOAL.x2 + 120, GOAL.bottom); ctx.stroke();
  ctx.fillStyle = 'rgba(120,170,220,0.7)'; ctx.beginPath(); ctx.ellipse(BALL0.x, BALL0.y + 2, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  // clouds framing the goal
  for (let i = 0; i < 7; i++) cloudBlob(GOAL.x1 - 30 + i * ((GOAL.x2 - GOAL.x1 + 60) / 6), GOAL.top - 18, 0.55, '#ffffff', false);
  for (let i = 0; i < 4; i++) { cloudBlob(GOAL.x1 - 40, GOAL.top + 20 + i * 42, 0.6, '#ffffff', false); cloudBlob(GOAL.x2 + 40, GOAL.top + 20 + i * 42, 0.6, '#ffffff', false); }
  // --- net (back frame is a bit smaller and higher = depth) ---
  const B = { x1: GOAL.x1 + 34, x2: GOAL.x2 - 34, top: GOAL.top + 20, bottom: GOAL.bottom - 14 };
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(B.x1, B.top, B.x2 - B.x1, B.bottom - B.top);
  ctx.strokeStyle = 'rgba(110,130,160,0.55)'; ctx.lineWidth = 1;
  for (let x = B.x1; x <= B.x2; x += 14) { ctx.beginPath(); ctx.moveTo(x, B.top); ctx.lineTo(x, B.bottom); ctx.stroke(); }
  for (let y = B.top; y <= B.bottom; y += 14) { ctx.beginPath(); ctx.moveTo(B.x1, y); ctx.lineTo(B.x2, y); ctx.stroke(); }
  // side + roof nets
  for (let i = 0; i <= 6; i++) {
    const u = i / 6;
    ctx.beginPath(); ctx.moveTo(GOAL.x1, GOAL.top + (GOAL.bottom - GOAL.top) * u); ctx.lineTo(B.x1, B.top + (B.bottom - B.top) * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(GOAL.x2, GOAL.top + (GOAL.bottom - GOAL.top) * u); ctx.lineTo(B.x2, B.top + (B.bottom - B.top) * u); ctx.stroke();
  }
  for (let i = 0; i <= 14; i++) { const u = i / 14; ctx.beginPath(); ctx.moveTo(GOAL.x1 + (GOAL.x2 - GOAL.x1) * u, GOAL.top); ctx.lineTo(B.x1 + (B.x2 - B.x1) * u, B.top); ctx.stroke(); }
  // ball in the net (behind the keeper)
  const b = f.ball;
  if (b && b.state === 'goal') drawBall(b.x, b.y, b.s, b.t);
  // --- the angel goalkeeper walks left and right in the goal ---
  ctx.save(); ctx.translate(f.keeperX, GOAL.bottom + 2); ctx.rotate((f.lean || 0) * 0.45); drawAngel(0, 0, 1.15, true); ctx.restore();   // leans into the dive
  // --- front frame: posts + crossbar ---
  ctx.strokeStyle = OUT; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(GOAL.x1, GOAL.bottom); ctx.lineTo(GOAL.x1, GOAL.top); ctx.lineTo(GOAL.x2, GOAL.top); ctx.lineTo(GOAL.x2, GOAL.bottom); ctx.stroke();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(GOAL.x1, GOAL.bottom); ctx.lineTo(GOAL.x1, GOAL.top); ctx.lineTo(GOAL.x2, GOAL.top); ctx.lineTo(GOAL.x2, GOAL.bottom); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,210,60,0.9)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(GOAL.x1 - 2, GOAL.bottom); ctx.lineTo(GOAL.x1 - 2, GOAL.top - 2); ctx.lineTo(GOAL.x2 + 2, GOAL.top - 2); ctx.lineTo(GOAL.x2 + 2, GOAL.bottom); ctx.stroke();
  // --- aiming arrow from the ball ---
  if (!f.ball && !f.done) {
    ctx.save(); ctx.translate(BALL0.x, BALL0.y); ctx.rotate(f.ang);
    ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 6; ctx.setLineDash([12, 8]); ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(0, -150); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -172); ctx.lineTo(-11, -148); ctx.lineTo(11, -148); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // --- Kai from behind, ball in front of him ---
  drawKaiBack(BALL0.x - 54, H + 8, 1.25, f.kickT);
  if (!b) drawBall(BALL0.x, BALL0.y, 1, 0);
  else if (b.state !== 'goal') drawBall(b.x, b.y, b.s, b.t);
  // --- header ---
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(20,40,80,0.65)'; ctx.beginPath(); ctx.roundRect(W / 2 - 170, 8, 340, 50, 12); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.fillText(tx('ENGEL-ELFMETER'), W / 2, 22);
  ctx.font = 'bold 12px Arial'; ctx.fillStyle = '#bfe6ff'; ctx.fillText(tx('Tore: {g} / 3   ·   Schüsse: {s} / 5', { g: f.goals, s: f.shots }), W / 2, 42);
  ctx.font = 'bold 12px Arial'; ctx.fillStyle = 'rgba(20,40,80,0.8)'; ctx.textAlign = 'right'; ctx.fillText(tx('Tippen / X = schießen, wenn der Pfeil richtig zeigt'), W - 16, H - 14);
  if (f.msgT > 0) { ctx.textAlign = 'center'; ctx.font = 'bold 40px Arial'; ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.strokeText(f.msg, W / 2, 112); ctx.fillText(f.msg, W / 2, 112); }
  ctx.restore();
}
function drawBall(x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(t * 0.3);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * 5.5, Math.sin(a) * 5.5); } ctx.closePath(); ctx.fill();
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 5.5, Math.sin(a) * 5.5); ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); ctx.stroke(); }
  ctx.restore();
}
function drawHarp() {
  const h = S.harp;
  ctx.save();
  // the angel with the harp on a cloud
  cloudBlob(1000, FLOOR - 20, 1.6);
  ctx.save(); ctx.translate(1040, FLOOR - 40);
  ctx.strokeStyle = '#c99a2e'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-6, -70, 26, -96); ctx.quadraticCurveTo(44, -70, 40, -40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(40, -40); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.2;
  for (let i = 1; i < 8; i++) { const u = i / 8; ctx.beginPath(); ctx.moveTo(u * 40, -u * 40); ctx.lineTo(4 + u * 30, -60 - u * 30 + (h.lit >= 0 && i === h.lit + 1 ? Math.sin(S.t * 2) * 2 : 0)); ctx.stroke(); }
  ctx.restore();
  drawAngel(1000, FLOOR - 26, 1.05, false);
  // piano
  const P = PIANO, names = NOTE_NAMES[SAVE.lang] || NOTE_NAMES.de;
  ctx.fillStyle = 'rgba(20,30,60,0.72)'; ctx.beginPath(); ctx.roundRect(P.x0 - 16, P.y - 34, P.keyW * 8 + 32, P.keyH + 44, 14); ctx.fill();
  for (let i = 0; i < 8; i++) {
    const x = P.x0 + i * P.keyW, pressed = h.press.some(p => p.i === i);
    const lit = h.lit === i, hint = h.mode === 'input' && h.hint === i && h.hintT > 0;
    ctx.fillStyle = lit ? '#ffd23a' : pressed ? '#bfe6ff' : '#ffffff';
    ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x + 2, P.y, P.keyW - 4, P.keyH, [0, 0, 8, 8]); ctx.fill(); ctx.stroke();
    if (hint) { ctx.fillStyle = `rgba(255,210,58,${h.fails >= 8 ? 0.55 : 0.35 * Math.min(1, h.hintT / 10)})`; ctx.fillRect(x + 4, P.y + 2, P.keyW - 8, P.keyH - 4); }
    if (lit) { ctx.save(); ctx.shadowColor = '#ffd23a'; ctx.shadowBlur = 20; ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 3; ctx.strokeRect(x + 3, P.y + 1, P.keyW - 6, P.keyH - 2); ctx.restore(); }
    ctx.fillStyle = OUT; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText(names[i], x + P.keyW / 2, P.y + P.keyH - 16);
    if (!isTouch) { ctx.font = '10px Arial'; ctx.fillStyle = '#8a8a8a'; ctx.fillText('ASDFGHJK'[i], x + P.keyW / 2, P.y + 14); }
  }
  // black keys (decoration)
  for (const i of [0, 1, 3, 4, 5]) { const x = P.x0 + (i + 1) * P.keyW - 13; ctx.fillStyle = '#1d2530'; ctx.beginPath(); ctx.roundRect(x, P.y, 26, 58, [0, 0, 4, 4]); ctx.fill(); }
  // status line
  ctx.textAlign = 'center'; ctx.font = 'bold 13px Arial'; ctx.fillStyle = '#fff';
  const st = h.mode === 'input' ? tx('Du bist dran!') : h.mode === 'end' ? '' : tx('Hör zu…');
  ctx.fillText(st + '   ·   ' + tx('Versuch {a} / {b}', { a: Math.min(h.fails + 1, 10), b: 10 }), W / 2, P.y - 18);
  // progress dots of the melody
  for (let i = 0; i < h.melody.length; i++) { ctx.fillStyle = h.mode === 'input' && i < h.idx ? '#5fd36a' : 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(P.x0 - 4 + i * 14, P.y - 18, 4, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
function drawStairs() {
  ctx.save();
  const u = Math.min(1, S.stairsT / 120);
  ctx.globalAlpha = u;
  for (let i = 0; i < 14; i++) {
    const x = 240 + i * 30, y = 160 + i * 11;
    const g = ctx.createLinearGradient(x, y, x, y + 10); g.addColorStop(0, '#fff6c8'); g.addColorStop(1, '#e8c04a');
    ctx.fillStyle = g; ctx.strokeStyle = 'rgba(200,150,40,0.9)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x, y, 40, 10, 3); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

// ---------- HUD ----------
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
function drawNoteIcon(x, y, on) {
  ctx.save(); ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x - 4, y + 6, 4, 3, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 6, y + 4, 4, 3, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x, y - 8); ctx.lineTo(x + 10, y - 10); ctx.lineTo(x + 10, y + 4); ctx.stroke();
  if (!on) { ctx.strokeStyle = '#ff5a4f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 10, y - 11); ctx.lineTo(x + 14, y + 12); ctx.stroke(); }
  ctx.restore();
}
function drawSpeakerIcon(x, y, on) {
  ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 9, y - 4); ctx.lineTo(x - 4, y - 4); ctx.lineTo(x + 2, y - 10); ctx.lineTo(x + 2, y + 10); ctx.lineTo(x - 4, y + 4); ctx.lineTo(x - 9, y + 4); ctx.closePath(); ctx.fill();
  if (on) { ctx.beginPath(); ctx.arc(x + 3, y, 6, -0.8, 0.8); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 3, y, 10, -0.8, 0.8); ctx.stroke(); }
  else { ctx.strokeStyle = '#ff5a4f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 6, y - 6); ctx.lineTo(x + 14, y + 6); ctx.moveTo(x + 14, y - 6); ctx.lineTo(x + 6, y + 6); ctx.stroke(); }
  ctx.restore();
}
function drawEventIcon(type, cx, cy, passed) {
  ctx.save(); ctx.translate(cx, cy); ctx.lineJoin = 'round'; ctx.globalAlpha = passed ? 0.45 : 1;
  ctx.fillStyle = type === 'harp' ? '#6b4a10' : '#0b2a45'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 1.2;
  if (type === 'oxxo' || type === 'oxxo2') { ctx.fillStyle = '#d8241f'; ctx.fillRect(-7, -5, 14, 10); ctx.fillStyle = '#ffd23a'; ctx.fillRect(-7, -5, 14, 2); ctx.fillRect(-7, 3, 14, 2); }
  if (type === 'rainbow') { ['#ff5a5a', '#ffe14d', '#36a8f4'].forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 5, 7 - i * 2, Math.PI, 0); ctx.stroke(); }); }
  if (type === 'clouds') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-3, 2, 4, 0, Math.PI * 2); ctx.arc(2, 0, 5, 0, Math.PI * 2); ctx.arc(6, 3, 3, 0, Math.PI * 2); ctx.fill(); }
  if (type === 'football') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill(); }
  if (type === 'harp') { ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, 6); ctx.quadraticCurveTo(-6, -4, 2, -7); ctx.quadraticCurveTo(7, -2, 5, 3); ctx.lineTo(-4, 6); ctx.stroke(); }
  ctx.restore();
}
function drawProgress() {
  const w = 300, x = W / 2 - w / 2, y = 14;
  ctx.save(); ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(20,40,80,0.55)'; ctx.beginPath(); ctx.roundRect(x - 64, y - 10, w + 140, 28, 14); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'right'; ctx.fillText(tx('HIMMEL'), x - 8, y + 4);
  ctx.textAlign = 'left'; ctx.fillText(tx('HARFE'), x + w + 34, y + 4);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.roundRect(x, y, w, 8, 4); ctx.fill();
  const f = clamp(S.dist / LEVEL_LENGTH, 0, 1);
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ffd23a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, Math.max(8, w * f), 8, 4); ctx.fill();
  for (const ev of EVENTS) if (ev.type !== 'oxxo2' || !SAVE.items.harpoon) drawEventIcon(ev.type, x + w * ev.at / LEVEL_LENGTH, y + 4, S.dist >= ev.at);
  drawEventIcon('harp', x + w + 18, y + 4, false);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1e4fa3'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x + w * f, y + 4, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawHUD() {
  ctx.save(); ctx.textBaseline = 'middle';
  const x = 18, hy = 18, n = S.hearts, show = Math.min(n, 8);
  const boxW = n > 8 ? 120 : Math.max(60, show * 22 + 16);
  ctx.fillStyle = S.heartFlash > 0 ? 'rgba(120,10,20,0.8)' : S.heartFlash < 0 ? 'rgba(120,90,10,0.8)' : 'rgba(20,40,80,0.55)';
  ctx.beginPath(); ctx.roundRect(x - 6, hy - 6, boxW, 26, 10); ctx.fill();
  if (n > 8) { drawHeart(x + 10, hy + 7, 9, true); ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.fillText('× ' + n, x + 26, hy + 8); }
  else for (let i = 0; i < Math.max(show, 1); i++) drawHeart(x + 10 + i * 22, hy + 7, 9, i < n);
  drawProgressBox(12, 44);
  if (S.turbo > 0) {
    // turbo countdown, right under the timeline
    const bw = 240, bx = W / 2 - bw / 2, by = 40, secs = Math.ceil(S.turbo / 60);
    ctx.save(); ctx.fillStyle = 'rgba(20,40,80,0.7)'; ctx.beginPath(); ctx.roundRect(bx, by, bw, 26, 10); ctx.fill();
    const tg = ctx.createLinearGradient(bx, 0, bx + bw, 0); tg.addColorStop(0, '#ff8a00'); tg.addColorStop(1, '#ffe14d');
    ctx.fillStyle = tg; ctx.beginPath(); ctx.roundRect(bx + 116, by + 7, Math.max(6, (bw - 126) * S.turbo / TURBO_FRAMES), 12, 6); ctx.fill();
    ctx.fillStyle = '#ffe14d'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('⚡ TURBO ' + secs + ' s', bx + 10, by + 13.5);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(20,40,80,0.55)'; ctx.beginPath(); ctx.roundRect(W - 168, 10, 156, 30, 10); ctx.fill();
  drawCoin({ x: W - 148, y: 25, p: 0 }); ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.fillText('× ' + S.coins, W - 132, 26);
  for (const [b, on, icon] of [[BTN.music, Audio.musicOn, drawNoteIcon], [BTN.sfx, Audio.sfxOn, drawSpeakerIcon]]) {
    ctx.fillStyle = on ? 'rgba(20,40,80,0.55)' : 'rgba(80,10,10,0.7)'; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 9); ctx.fill(); icon(b.x + b.w / 2 - 1, b.y + b.h / 2, on);
  }
  if (S.phase === 'play') {
    drawProgress();
    if (!isTouch) { const hint = tx('Rechtsklick / X = schießen'); ctx.textAlign = 'right'; ctx.font = 'bold 12px Arial'; ctx.fillStyle = 'rgba(20,40,80,0.7)'; ctx.fillText(hint, W - 16, H - 14); }
  }
  if (S.msgTimer > 0) { ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, S.msgTimer / 20); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.font = 'bold 24px Arial'; ctx.strokeText(S.msg, W / 2, 80); ctx.fillText(S.msg, W / 2, 80); ctx.globalAlpha = 1; }
  ctx.restore();
}
function panel(title, lines, titleColor) {
  ctx.save(); ctx.fillStyle = 'rgba(20,30,70,0.72)'; ctx.fillRect(0, -VH, W, 3 * VH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = titleColor; ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.font = 'bold 40px Arial';
  ctx.strokeText(title, W / 2, 76); ctx.fillText(title, W / 2, 76);
  ctx.fillStyle = '#f4f8ff'; ctx.font = 'bold 14px Arial';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 118 + i * 22));
  ctx.restore();
}
function button(b, label, c1, c2) {
  ctx.save(); const pulse = 1 + Math.sin(S.t * 0.08) * 0.03; ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(pulse, pulse);
  const g = ctx.createLinearGradient(0, -b.h / 2, 0, b.h / 2); g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 1); ctx.restore();
}
function drawScreens() {
  if (S.phase === 'start') {
    panel(tx('DER HIMMEL'), [
      tx('Sprung-Taste links: tippen / halten = mit den Flügeln schlagen → Kai steigt. Loslassen = Kai gleitet nach unten.'),
      tx('Lichtpfeile: Schuss-Taste rechts (am PC Rechtsklick oder X). Schieß die Teufelchen ab!'),
      tx('Im OXXO auf der Wolke kaufst du die Harpune – ohne sie kommst du nicht in die Tiefsee.'),
      tx('Am Ende spielt der Engel eine Melodie – spiel sie auf dem Klavier nach.'),
    ], '#ffe68a');
    ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(S.t * 0.1) * 0.4; ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.fillText(tx('Tippen oder Leertaste zum Losfliegen'), W / 2, 240); ctx.restore();
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText(tx('LEVEL 2 · HIMMELSWELT'), W / 2, 36); ctx.restore();
    drawLangPicker();
  }
  if (S.phase === 'gameover') { panel(tx('KEINE LEBEN MEHR!'), [tx('Alle 3 Leben sind weg. Nochmal versuchen?')], '#ff7a6a'); button(BTN.goYes, tx('NOCHMAL VERSUCHEN'), '#36c6f4', '#1677a8'); button(BTN.goNo, tx('NEIN – ZUM MENÜ'), '#8a96a8', '#5d6878'); }
}

// ================= MAIN DRAW =================
function draw() {
  ctx.save();
  if (S.shake > 0) ctx.translate(rand(-1, 1) * S.shake * 0.6, rand(-1, 1) * S.shake * 0.6);
  drawSky();
  for (const o of S.objects) if (o.type === 'field') drawField(o);
  for (const o of S.objects) {
    if (o.done && o.type !== 'oxxo') continue;
    if (o.type === 'oxxo') drawOxxo(o);
    if (o.type === 'rainbow') drawRainbow(o);
    if (o.type === 'cloudp') drawCloudPlatform(o);
    if (o.type === 'storm') drawStorm(o);
    if (o.type === 'lightning') drawLightning(o);
  }
  drawCloudFloor();
  for (const o of S.objects) { if (o.done) continue; if (o.type === 'coin') drawCoin(o); if (o.type === 'devil') drawDevil(o); }
  if (S.phase === 'stairs') drawStairs();
  // Kai with angel wings
  const k = S.kai;
  if (!S.hideKai && !(k.hitTimer > 0 && Math.floor(k.hitTimer / 5) % 2 === 0)) {
    const tilt = clamp(-k.vy * 0.04, -0.15, 0.12);
    drawKaiFigure({ x: k.x, y: k.y + (k.rainbow || k.cloud ? 0 : Math.sin(S.t * 0.06) * 1.5), tilt: k.rainbow ? (k.rbTilt || 0) : tilt, crouch: 3, wings: k.wing, armsUp: k.vy < -1, outfit: SAVE.outfit, wind: 0.6 });
  }
  for (const a of S.arrows) drawArrow(a);
  for (const s of S.shots) drawPitchfork(s);
  for (const p of S.particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life)); ctx.fillStyle = p.color;
    if (p.feather) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.life * 3); ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.8, p.r * 0.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (S.phase === 'foot') drawFootball();   // own full-screen scene (from behind Kai)
  if (S.phase === 'harp') drawHarp();
  if (S.noHud) return;
  ctx.save(); ctx.translate(0, -DY); drawHUD(); ctx.restore();
  if (S.phase === 'shopAsk' && S.stop) bubble(S.stop.x + OXXO_W / 2, S.stop.y + 26, tx('Das OXXO auf der Wolke! Willst du reingehen?'), true, true);
  if (S.phase === 'footAsk') { drawAngel(560, FLOOR - 6, 1, false); bubble(560, FLOOR - 100, tx('Kai, ein Elfmeter-Duell gegen mich?'), true); }
  if (S.phase === 'shop') drawShop();
  ctx.save(); ctx.translate(0, -DY / 2); drawScreens(); ctx.restore();
}

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 16.667, 3); last = now;
  update(dt); draw();
  requestAnimationFrame(loop);
}
// arriving in the sky: remember the state so a game over only restarts this world
if (QUERY.get('from') === 'stadt' || QUERY.get('from') === 'replay' || !SAVE.checkpoint || SAVE.checkpoint.world !== 'heaven') setCheckpoint('heaven');

requestAnimationFrame(loop);
window.__S = S; window.__test = { runEvent, startHarp, startFootball, add, SAVE, leaveShop, endFootball };
})();
</script>
</body>
</html>
