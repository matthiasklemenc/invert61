
// ================= MORE CREATURES =================
function drawWreck(o) {
  const x = o.x, d = o.deckY;
  ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  // hull
  const g = ctx.createLinearGradient(0, d, 0, FLOOR + 10);
  g.addColorStop(0, '#7a5534'); g.addColorStop(1, '#3e2a1a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, d - 14);                     // broken bow
  ctx.lineTo(x + 30, d);
  ctx.lineTo(x + o.w - 40, d);
  ctx.lineTo(x + o.w - 30, d - 46);         // stern cabin
  ctx.lineTo(x + o.w + 8, d - 46);
  ctx.lineTo(x + o.w + 2, d + 10);
  ctx.quadraticCurveTo(x + o.w - 20, FLOOR + 4, x + o.w - 80, FLOOR + 10);
  ctx.lineTo(x + 70, FLOOR + 10);
  ctx.quadraticCurveTo(x + 18, FLOOR - 10, x, d - 14);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // planks
  ctx.strokeStyle = 'rgba(30,18,10,0.55)'; ctx.lineWidth = 1.5;
  for (let py = d + 12; py < FLOOR; py += 12) { ctx.beginPath(); ctx.moveTo(x + 20 + (py - d) * 0.25, py); ctx.lineTo(x + o.w - 20 - (py - d) * 0.3, py); ctx.stroke(); }
  // deck rail line
  ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.fillStyle = '#8f6a43'; ctx.fillRect(x + 30, d - 5, o.w - 70, 6); ctx.strokeRect(x + 30, d - 5, o.w - 70, 6);
  // portholes (one broken)
  for (let i = 0; i < 5; i++) {
    const px = x + 90 + i * 85, py = d + 30;
    ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = i === 2 ? '#0a1a24' : '#3f8f88'; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
    if (i !== 2) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(px - 2, py - 2, 2, 0, Math.PI * 2); ctx.fill(); }
  }
  // hole in the hull
  ctx.fillStyle = '#120c08'; ctx.beginPath(); ctx.moveTo(x + 150, FLOOR - 4); ctx.lineTo(x + 165, d + 52); ctx.lineTo(x + 190, d + 58); ctx.lineTo(x + 200, d + 50); ctx.lineTo(x + 215, FLOOR - 2); ctx.closePath(); ctx.fill();
  // mast + yard (grind rail)
  const mx = x + 335;
  ctx.fillStyle = '#6b4a2e'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(mx - 7, d); ctx.lineTo(mx - 6, o.railY - 46); ctx.lineTo(mx + 2, o.railY - 56); ctx.lineTo(mx + 7, o.railY - 40); ctx.lineTo(mx + 7, d); ctx.closePath(); ctx.fill(); ctx.stroke();
  const rx1 = x + o.railX1, rx2 = x + o.railX2, ry = o.railY;
  ctx.fillStyle = '#9aa6b1'; ctx.beginPath(); ctx.roundRect(rx1, ry, rx2 - rx1, 8, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(rx1 + 6, ry + 1.5, rx2 - rx1 - 12, 2);
  ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(rx1 + 8, ry + 8); ctx.lineTo(mx - 6, d - 4); ctx.moveTo(rx2 - 8, ry + 8); ctx.lineTo(mx + 6, d - 4); ctx.stroke();
  // torn flag
  const fw = Math.sin(S.t * 0.06) * 4;
  ctx.fillStyle = '#d9d2c0'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(mx + 2, ry - 52); ctx.lineTo(mx + 40 + fw, ry - 46); ctx.lineTo(mx + 30 + fw, ry - 38); ctx.lineTo(mx + 42 + fw, ry - 30); ctx.lineTo(mx + 3, ry - 28); ctx.closePath(); ctx.fill(); ctx.stroke();
  // seaweed + barnacles on the hull
  ctx.fillStyle = '#e9e2cf';
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(x + 60 + i * 52, FLOOR - 8 - (i % 3) * 9, 3 + (i % 2) * 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = '#2f8a5f'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (const sx of [x + 40, x + 250, x + 470]) { ctx.beginPath(); ctx.moveTo(sx, FLOOR); for (let yy = 0; yy < 60; yy += 8) ctx.lineTo(sx + Math.sin(S.t * 0.04 + yy * 0.08) * yy * 0.15, FLOOR - yy); ctx.stroke(); }
  // hint for players
  if (o.x > 200 && o.x < W) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.fillText(tx('GRIND ↓'), (rx1 + rx2) / 2, ry - 10); ctx.textAlign = 'left'; }
  ctx.restore();
}

function drawShark(o) {
  const x = o.x, y = o.y;
  if (x > W - 10) {   // warning at the right edge before it comes in
    const blink = Math.sin(S.t * 0.4) > 0;
    ctx.save(); ctx.fillStyle = blink ? '#ff3b30' : '#ffcc00'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(W - 30, y - 18); ctx.lineTo(W - 10, y + 16); ctx.lineTo(W - 50, y + 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.fillText('!', W - 30, y + 11); ctx.restore();
    return;
  }
  const tail = Math.sin(o.p * 6) * 10;
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  // tail
  ctx.fillStyle = '#5d7a95';
  ctx.beginPath(); ctx.moveTo(48, 0); ctx.lineTo(80, -22 + tail); ctx.lineTo(72, 2 + tail * 0.3); ctx.lineTo(82, 20 + tail); ctx.closePath(); ctx.fill(); ctx.stroke();
  // dorsal fin
  ctx.beginPath(); ctx.moveTo(-6, -18); ctx.quadraticCurveTo(8, -46, 20, -44); ctx.quadraticCurveTo(14, -30, 18, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
  // body
  const g = ctx.createLinearGradient(0, -22, 0, 22); g.addColorStop(0, '#7f9bb5'); g.addColorStop(0.55, '#6a87a2'); g.addColorStop(0.56, '#eef3f7'); g.addColorStop(1, '#d7e0e8');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(-58, 2); ctx.bezierCurveTo(-52, -22, 10, -26, 52, -4); ctx.bezierCurveTo(30, 14, -20, 24, -58, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  // pectoral fin
  ctx.fillStyle = '#5d7a95'; ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(4, 30); ctx.lineTo(10, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  // gills
  ctx.strokeStyle = 'rgba(20,32,46,0.6)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-24 + i * 5, -8); ctx.quadraticCurveTo(-26 + i * 5, 0, -24 + i * 5, 6); ctx.stroke(); }
  // eye + angry brow
  ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(-38, -7, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(-39, -6, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-46, -15); ctx.lineTo(-32, -11); ctx.stroke();
  // grin with teeth
  ctx.fillStyle = '#5a1f2a'; ctx.beginPath(); ctx.moveTo(-56, 4); ctx.quadraticCurveTo(-42, 14, -26, 6); ctx.quadraticCurveTo(-42, 8, -56, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-52 + i * 5, 5 + i * 0.3); ctx.lineTo(-50 + i * 5, 10); ctx.lineTo(-48 + i * 5, 5.5 + i * 0.3); ctx.fill(); }
  ctx.restore();
}

function drawPuffer(o) {
  const x = o.x, y = o.y, r = o.r, inf = o.inflate;
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // spikes (grow when inflated)
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, len = r + 3 + inf * 9;
    ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len); ctx.stroke();
    ctx.strokeStyle = '#f7e7b0'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len); ctx.stroke();
  }
  // tail + fin
  ctx.fillStyle = '#f0a83a'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(r - 2, 0); ctx.lineTo(r + 10, -8 + Math.sin(o.p * 8) * 3); ctx.lineTo(r + 10, 8 + Math.sin(o.p * 8) * 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  // body
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.4, 2, 0, 0, r);
  g.addColorStop(0, '#ffe99a'); g.addColorStop(0.7, '#f5c443'); g.addColorStop(1, '#d99a22');
  ctx.fillStyle = g; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff4d6'; ctx.beginPath(); ctx.ellipse(0, r * 0.45, r * 0.7, r * 0.4, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(140,90,20,0.45)';
  for (const [sx, sy] of [[0.2, -0.5], [0.5, -0.2], [-0.1, -0.2], [0.45, 0.2]]) { ctx.beginPath(); ctx.arc(sx * r, sy * r, r * 0.09, 0, Math.PI * 2); ctx.fill(); }
  // eye (big, worried when inflated) + lips
  ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(-r * 0.45, -r * 0.25, r * 0.28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(-r * 0.5, -r * 0.22, r * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f07a6a'; ctx.beginPath(); ctx.ellipse(-r * 0.92, r * 0.12, 3 + inf * 2, 2.5 + inf * 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawOctopus(o) {
  const x = o.x, y = o.y;
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // legs
  for (let i = 0; i < 6; i++) {
    const sx = -14 + i * 5.6, dir = i < 3 ? -1 : 1;
    ctx.strokeStyle = OUT; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(sx, 4); ctx.quadraticCurveTo(sx + dir * 10, 16 + Math.sin(S.t * 0.08 + i) * 2, sx + dir * 18, 12 + Math.sin(S.t * 0.08 + i) * 3); ctx.stroke();
    ctx.strokeStyle = '#c2457a'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(sx, 4); ctx.quadraticCurveTo(sx + dir * 10, 16 + Math.sin(S.t * 0.08 + i) * 2, sx + dir * 18, 12 + Math.sin(S.t * 0.08 + i) * 3); ctx.stroke();
  }
  // head
  const g = ctx.createRadialGradient(-5, -14, 2, 0, -6, 20);
  g.addColorStop(0, '#f08ab5'); g.addColorStop(1, '#b23a6e');
  ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  const squash = o.squirted ? 0.85 : 1 + Math.sin(S.t * 0.1) * 0.04;
  ctx.beginPath(); ctx.ellipse(0, -8, 17, 17 * squash, 0, Math.PI, 0); ctx.lineTo(16, 6); ctx.quadraticCurveTo(0, 10, -16, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-6, -16, 5, 3, -0.5, 0, Math.PI * 2); ctx.fill();
  // eyes
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(s * 6, -4, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(s * 6 - 1, -3, 2, 0, Math.PI * 2); ctx.fill();
  }
  if (!o.squirted) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; }
  ctx.restore();
}

function drawMiniSquid(o) {
  const x = o.x, y = o.y;
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // tentacles trailing to the right
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = i % 2 ? '#e0577f' : '#c13d66'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(8, -4 + i * 2);
    for (let s = 1; s <= 4; s++) ctx.lineTo(8 + s * 5, -4 + i * 2 + Math.sin(o.p * 6 + s + i) * 2.5);
    ctx.stroke();
  }
  // body pointing left
  ctx.fillStyle = '#f07399'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-18, 0); ctx.quadraticCurveTo(-8, -11, 10, -7); ctx.lineTo(10, 7); ctx.quadraticCurveTo(-8, 11, -18, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-14, -3); ctx.lineTo(-20, -10); ctx.lineTo(-10, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-14, 3); ctx.lineTo(-20, 10); ctx.lineTo(-10, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(4, -2, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(3, -2, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawChest(o) {
  const x = o.x, y = o.y, open = o.open || 0;
  ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  // glow so players notice it
  const gl = ctx.createRadialGradient(x, y - 18, 4, x, y - 18, 60 + open * 40);
  gl.addColorStop(0, `rgba(255,215,80,${0.35 + open * 0.4})`); gl.addColorStop(1, 'rgba(255,215,80,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y - 18, 60 + open * 40, 0, Math.PI * 2); ctx.fill();
  // box
  ctx.fillStyle = '#8a5a2b'; ctx.beginPath(); ctx.roundRect(x - 26, y - 26, 52, 26, 3); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(40,20,8,0.5)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x - 24, y - 13); ctx.lineTo(x + 24, y - 13); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.fillStyle = '#e0b545';
  for (const bx of [x - 20, x + 14]) { ctx.fillRect(bx, y - 26, 6, 26); ctx.strokeRect(bx, y - 26, 6, 26); }
  // inside: gold + hearts when open
  if (open > 0) {
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.ellipse(x, y - 26, 24, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const rise = open * 34;
    ctx.globalAlpha = Math.max(0, 1.2 - open);
    drawHeart(x - 10, y - 34 - rise, 9, true); drawHeart(x + 10, y - 40 - rise, 9, true);
    ctx.globalAlpha = 1;
  }
  // lid (opens backwards)
  ctx.save(); ctx.translate(x - 26, y - 26); ctx.rotate(-open * 1.9);
  ctx.fillStyle = '#9b6632';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -6); ctx.quadraticCurveTo(26, -24, 52, -6); ctx.lineTo(52, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e0b545';
  for (const bx of [6, 40]) { ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx, -12 - (bx === 6 ? 0 : 0)); ctx.lineTo(bx + 6, -13); ctx.lineTo(bx + 6, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  // lock
  if (open < 0.2) { ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.roundRect(x - 5, y - 30, 10, 11, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 27, 2, 4); }
  // sparkles
  for (let i = 0; i < 3; i++) {
    const a = S.t * 0.05 + i * 2.1, sx = x + Math.cos(a) * 30, sy = y - 26 + Math.sin(a * 1.3) * 14;
    ctx.fillStyle = '#fff6c2'; ctx.beginPath(); ctx.moveTo(sx, sy - 4); ctx.lineTo(sx + 1.2, sy - 1.2); ctx.lineTo(sx + 4, sy); ctx.lineTo(sx + 1.2, sy + 1.2); ctx.lineTo(sx, sy + 4); ctx.lineTo(sx - 1.2, sy + 1.2); ctx.lineTo(sx - 4, sy); ctx.lineTo(sx - 1.2, sy - 1.2); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawMiniJelly(o) { ctx.save(); ctx.translate(o.x, o.y); ctx.scale(0.62, 0.62); drawJelly({ x: 0, y: 0, p: o.p }); ctx.restore(); }

// ================= GIANT SQUID =================
function tentaclePath(points, w0, w1) {
  // tapered tentacle along a list of points
  const left = [], right = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i], q = points[Math.min(i + 1, points.length - 1)], pr = points[Math.max(i - 1, 0)];
    const dx = q.x - pr.x, dy = q.y - pr.y, len = Math.hypot(dx, dy) || 1;
    const w = w0 + (w1 - w0) * (i / (points.length - 1));
    left.push({ x: p.x - dy / len * w, y: p.y + dx / len * w });
    right.push({ x: p.x + dy / len * w, y: p.y - dx / len * w });
  }
  ctx.beginPath(); ctx.moveTo(left[0].x, left[0].y);
  for (const p of left) ctx.lineTo(p.x, p.y);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
  ctx.closePath();
}
function drawTentacle(points, w0, w1, color, suckers = true) {
  ctx.fillStyle = color; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  tentaclePath(points, w0, w1); ctx.fill(); ctx.stroke();
  if (suckers) {
    ctx.fillStyle = '#f6c3cf';
    for (let i = 2; i < points.length - 1; i += 2) { const w = (w0 + (w1 - w0) * (i / (points.length - 1))) * 0.45; ctx.beginPath(); ctx.arc(points[i].x, points[i].y + w * 0.6, Math.max(1.2, w), 0, Math.PI * 2); ctx.fill(); }
  }
}
function drawBoss(b) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, b.fade);
  const x = b.x + (b.hurt > 0 ? Math.sin(b.hurt * 1.3) * 5 : 0), y = b.y;
  // arms
  for (let i = 0; i < 7; i++) {
    const pts = [], baseX = x - 30 + i * 12, baseY = y + 70;
    const len = 150 + (i % 3) * 40, dirA = Math.PI * (0.62 + i * 0.07);
    for (let s = 0; s <= 14; s++) {
      const f = s / 14;
      const wave = Math.sin(S.t * 0.05 + i * 1.3 + f * 4) * 30 * f;
      pts.push({ x: baseX + Math.cos(dirA) * len * f + wave * 0.6, y: baseY + Math.sin(dirA) * len * f * 0.7 + wave });
    }
    drawTentacle(pts, 13, 2, i % 2 ? '#a92a48' : '#8f2240');
  }
  // mantle going up and to the right (partly off screen)
  const g = ctx.createLinearGradient(x - 80, y, x + 200, y - 200);
  g.addColorStop(0, '#c8375a'); g.addColorStop(1, '#6b1530');
  ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 70, y + 40);
  ctx.bezierCurveTo(x - 110, y - 40, x - 40, y - 120, x + 60, y - 150);
  ctx.lineTo(x + 230, y - 260);
  ctx.lineTo(x + 300, y - 200);
  ctx.bezierCurveTo(x + 220, y - 80, x + 120, y + 40, x + 60, y + 80);
  ctx.quadraticCurveTo(x - 20, y + 90, x - 70, y + 40);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // fins at the top of the mantle
  ctx.fillStyle = '#9b2445';
  ctx.beginPath(); ctx.moveTo(x + 150, y - 170); ctx.quadraticCurveTo(x + 140, y - 240, x + 200, y - 270); ctx.lineTo(x + 210, y - 210); ctx.closePath(); ctx.fill(); ctx.stroke();
  // spots
  ctx.fillStyle = 'rgba(255,200,215,0.25)';
  for (const [sx, sy, sr] of [[20, -90, 10], [60, -110, 7], [100, -60, 9], [140, -130, 6], [40, -40, 6], [-30, -70, 7], [90, -10, 5]]) { ctx.beginPath(); ctx.arc(x + sx, y + sy, sr, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(x - 40, y - 70, 40, 12, -0.9, 0, Math.PI * 2); ctx.fill();
  // the one big eye
  const e = bossEye(b), open = b.eye;
  ctx.fillStyle = '#4a0f22'; ctx.beginPath(); ctx.ellipse(e.x, e.y, 30, 27, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.ellipse(e.x, e.y, 25, 22, 0, 0, Math.PI * 2); ctx.clip();
  const ig = ctx.createRadialGradient(e.x - 6, e.y - 6, 2, e.x, e.y, 25);
  ig.addColorStop(0, '#fff7b0'); ig.addColorStop(0.6, '#ffd23a'); ig.addColorStop(1, '#e08a10');
  ctx.fillStyle = ig; ctx.fillRect(e.x - 30, e.y - 30, 60, 60);
  // pupil looks at Kai
  const lk = Math.atan2(S.kai.y - 46 - e.y, S.kai.x - e.x);
  ctx.fillStyle = '#14080c'; ctx.beginPath(); ctx.ellipse(e.x + Math.cos(lk) * 6, e.y + Math.sin(lk) * 5, 5, 15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(e.x - 9, e.y - 9, 4, 0, Math.PI * 2); ctx.fill();
  if (b.hp < 3) { ctx.strokeStyle = 'rgba(200,20,40,0.7)'; ctx.lineWidth = 1.5; for (let i = 0; i < 3 - b.hp + 1; i++) { ctx.beginPath(); ctx.moveTo(e.x + 25, e.y - 8 + i * 8); ctx.lineTo(e.x + 12, e.y - 4 + i * 6); ctx.lineTo(e.x + 8, e.y + i * 5); ctx.stroke(); } }
  // eyelids (armoured plates) close over the eye
  const lid = (1 - open) * 24;
  ctx.fillStyle = '#7d1b37'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.fillRect(e.x - 30, e.y - 30, 60, 8 + lid); ctx.strokeRect(e.x - 30, e.y - 30, 60, 8 + lid);
  ctx.fillRect(e.x - 30, e.y + 22 - lid, 60, 8 + lid); ctx.strokeRect(e.x - 30, e.y + 22 - lid, 60, 8 + lid);
  ctx.restore();
  ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(e.x, e.y, 30, 27, 0, 0, Math.PI * 2); ctx.stroke();
  // target ring when the eye is open
  if (open > 0.6 && b.state === 'fight') {
    ctx.strokeStyle = `rgba(255,240,120,${0.5 + Math.sin(S.t * 0.3) * 0.4})`; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.arc(e.x, e.y, 38, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  if (b.hurt > 0) { ctx.globalAlpha = Math.min(1, b.hurt / 30) * 0.28 * b.fade; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, y - 40, 120, 120, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  // tentacle slam
  if (b.slam && b.state === 'fight') drawSlam(b);
}
function drawSlam(b) {
  const s = b.slam;
  ctx.save();
  if (s.t < 60) {
    const blink = Math.sin(s.t * 0.5) > 0;
    ctx.strokeStyle = blink ? 'rgba(255,60,50,0.9)' : 'rgba(255,200,60,0.7)'; ctx.lineWidth = 3; ctx.setLineDash([14, 10]);
    ctx.beginPath(); ctx.moveTo(150, s.y); ctx.lineTo(b.x - 120, s.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = blink ? '#ff3b30' : '#ffcc00'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(130, s.y - 18); ctx.lineTo(150, s.y + 16); ctx.lineTo(110, s.y + 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.fillText('!', 130, s.y + 11);
  } else {
    const reach = s.t < 85 ? (s.t - 60) / 25 : s.t < 105 ? 1 : Math.max(0, 1 - (s.t - 105) / 30);
    const sx = b.x - 60, sy = b.y + 50, tipX = b.x - 120 - reach * (b.x - 180);
    const pts = [];
    for (let i = 0; i <= 18; i++) { const f = i / 18; pts.push({ x: sx + (tipX - sx) * f, y: sy + (s.y - sy) * Math.min(1, f * 2.2) + Math.sin(f * 9 + S.t * 0.4) * 4 * f }); }
    drawTentacle(pts, 18, 4, '#b02d4d');
  }
  ctx.restore();
}

// ================= OVERLAYS / SCREENS =================
function drawInk() {
  if (S.ink <= 0) return;
  const a = Math.min(1, S.ink / 60) * 0.93;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#07060c';
  for (const b of S.inkBlobs) {
    for (let i = 0; i < 9; i++) {
      const ang = i / 9 * Math.PI * 2 + b.seed, rr = b.r * (0.45 + seeded(b.seed + i) * 0.35);
      ctx.beginPath(); ctx.arc(b.x + Math.cos(ang) * b.r * 0.45, b.y + Math.sin(ang) * b.r * 0.4 + (S.ink < 120 ? (120 - S.ink) * 0.3 : 0), rr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawEventIcon(type, cx, cy, passed) {
  ctx.save(); ctx.translate(cx, cy); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.globalAlpha = passed ? 0.45 : 1;
  // round badge
  ctx.fillStyle = type === 'squid' ? '#5a1024' : '#0b2a45'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 1.2;
  if (type === 'turbo') {
    ctx.fillStyle = '#ffd23a';
    ctx.scale(1.25, 1.25); ctx.beginPath(); ctx.moveTo(2, -7); ctx.lineTo(-4, 1); ctx.lineTo(0, 1); ctx.lineTo(-2, 7); ctx.lineTo(4, -2); ctx.lineTo(0, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (type === 'chest') {
    ctx.fillStyle = '#9b6632'; ctx.fillRect(-6, -2, 12, 7); ctx.strokeRect(-6, -2, 12, 7);
    ctx.beginPath(); ctx.moveTo(-6, -2); ctx.quadraticCurveTo(0, -8, 6, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(-1.5, -3, 3, 4);
  } else if (type === 'wreck') {
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath(); ctx.moveTo(-7, 1); ctx.lineTo(7, 1); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#d9c7a0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 1); ctx.lineTo(0, -7); ctx.stroke();
    ctx.fillStyle = '#e8e2d0'; ctx.beginPath(); ctx.moveTo(0.5, -7); ctx.lineTo(5, -5); ctx.lineTo(0.5, -3); ctx.closePath(); ctx.fill();
  } else if (type === 'whale') {
    ctx.fillStyle = '#5b93d6';
    ctx.beginPath(); ctx.ellipse(-1, 1, 6.5, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(8, -4); ctx.lineTo(8, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-4, 0, 1.2, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'squid') {
    ctx.fillStyle = '#c8375a';
    ctx.beginPath(); ctx.ellipse(0, -2, 5, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c8375a'; ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 2, 3); ctx.lineTo(i * 3, 8); ctx.stroke(); }
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(0, -2, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = OUT; ctx.fillRect(-0.4, -3.8, 0.8, 3.6);
  }
  ctx.restore();
}

function drawProgress() {
  const w = 300, x = W / 2 - w / 2, y = 14;
  ctx.save(); ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(2,20,40,0.65)'; ctx.beginPath(); ctx.roundRect(x - 70, y - 10, w + 156, 28, 14); ctx.fill();
  ctx.fillStyle = '#bfe6ff'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'right'; ctx.fillText(tx('TIEFSEE'), x - 8, y + 4);
  ctx.textAlign = 'left'; ctx.fillText(tx('KALMAR'), x + w + 34, y + 4);
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.roundRect(x, y, w, 8, 4); ctx.fill();
  const f = clamp(S.dist / LEVEL_LENGTH, 0, 1);
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#36c6f4'); g.addColorStop(1, '#c8375a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, Math.max(8, w * f), 8, 4); ctx.fill();
  // event markers as small icons
  for (const ev of EVENTS) drawEventIcon(ev.type, x + w * ev.at / LEVEL_LENGTH, y + 4, S.dist >= ev.at);
  drawEventIcon('squid', x + w + 18, y + 4, false);
  // Kai marker
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1e4fa3'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x + w * f, y + 4, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawBossHP() {
  const b = S.boss; if (!b) return;
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(40,4,16,0.75)'; ctx.beginPath(); ctx.roundRect(W / 2 - 120, 8, 240, 28, 12); ctx.fill();
  ctx.fillStyle = '#ffd0dc'; ctx.font = 'bold 12px Arial'; ctx.fillText(tx('RIESENKALMAR'), W / 2 - 40, 22);
  for (let i = 0; i < 3; i++) {
    const ex = W / 2 + 30 + i * 26, alive = i < b.hp;
    ctx.fillStyle = alive ? '#ffd23a' : '#3a1a22'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(ex, 22, 10, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (alive) { ctx.fillStyle = OUT; ctx.beginPath(); ctx.ellipse(ex, 22, 2, 6, 0, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.strokeStyle = '#ff5a4f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(ex - 6, 16); ctx.lineTo(ex + 6, 28); ctx.moveTo(ex + 6, 16); ctx.lineTo(ex - 6, 28); ctx.stroke(); }
  }
  ctx.restore();
}

function panel(title, lines, titleColor) {
  ctx.save();
  ctx.fillStyle = 'rgba(2,14,30,0.78)'; ctx.fillRect(0, -VH, W, 3 * VH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = titleColor; ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.font = 'bold 40px Arial';
  ctx.strokeText(title, W / 2, 80); ctx.fillText(title, W / 2, 80);
  ctx.fillStyle = '#e6f4ff'; ctx.font = 'bold 15px Arial';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 126 + i * 24));
  ctx.restore();
}
function button(b, label, c1, c2) {
  ctx.save();
  const pulse = 1 + Math.sin(S.t * 0.08) * 0.03;
  ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(pulse, pulse);
  const g = ctx.createLinearGradient(0, -b.h / 2, 0, b.h / 2); g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 1);
  ctx.restore();
}
function drawScreens() {
  if (S.phase === 'start') {
    panel(tx('DIE TIEFSEE'), [
      tx('Gedrückt halten (Tippen / Leertaste) = Propeller → Kai steigt. Loslassen = Kai sinkt.'),
      tx('Die Luft wird immer weniger – sammle Luftblasen! Ohne Luft verlierst du alle 2 Sek. ein Herz.'),
      tx('Jeder Treffer kostet ein Herz. Schatztruhen schenken dir +2 Herzen.'),
      tx('Schießen mit der Harpune: Schuss-Taste rechts, am PC Rechtsklick oder X (im Turbo und beim Kalmar).'),
      tx('Am Ende wartet der Riesenkalmar – triff sein Auge 3× mit der Harpune.'),
    ], '#7fe0ff');
    ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(S.t * 0.1) * 0.4; ctx.fillStyle = '#ffe14d'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center';
    ctx.fillText(tx('Tippen oder Leertaste zum Abtauchen'), W / 2, 250); ctx.restore();
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText(tx('LEVEL 2 · UNTERWASSERWELT'), W / 2, 40); ctx.restore();
    drawLangPicker();
  }
  if (S.phase === 'gameover') {
    panel(tx('KEINE LEBEN MEHR!'), [tx('Alle 3 Leben sind weg. Nochmal versuchen?'), tx('Strecke: {p}%   ·   Seesterne: {s}   ·   Perlen: {pe}', { p: Math.floor(clamp(S.dist / LEVEL_LENGTH, 0, 1) * 100), s: S.stars, pe: S.pearls }), S.lostBy === 'air' ? tx('Tipp: Achte auf die O₂-Luftblasen!') : tx('Tipp: Schatztruhen geben +2 Herzen!')], '#ff7a6a');
    button(BTN.goYes, tx('NOCHMAL VERSUCHEN'), '#36c6f4', '#1677a8');
    button(BTN.goNo, tx('NEIN – ZUM MENÜ'), '#8a96a8', '#5d6878');
  }
  if (S.phase === 'seaDone') {
    // squid beaten, but not everything yet
    panel(tx('DER RIESENKALMAR IST BESIEGT!'), [tx('Noch offen für Level 3:'), ...openBosses().map(s => '• ' + s)], '#7fe0ff');
    button(BTN.again, tx('WEITER'), '#34c759', '#1f8f3c');
  }
  if (S.phase === 'victory') {
    // ---- LEVEL 2 COMPLETE ----
    ctx.save(); ctx.fillStyle = 'rgba(10,20,50,0.82)'; ctx.fillRect(0, -VH, W, 3 * VH);
    // fireworks
    for (let i = 0; i < 6; i++) {
      const fx = 120 + i * 210, fy = 60 + (i % 2) * 40, r = 20 + ((S.t * 1.5 + i * 30) % 60), a = 1 - r / 80;
      ctx.globalAlpha = Math.max(0, a); ctx.strokeStyle = ['#ffd23a', '#ff5fa2', '#36c6f4', '#7fcf8a', '#ff8a3a', '#b59de0'][i];
      ctx.lineWidth = 3; for (let k = 0; k < 10; k++) { const an = k * Math.PI / 5; ctx.beginPath(); ctx.moveTo(fx + Math.cos(an) * r * 0.5, fy + Math.sin(an) * r * 0.5); ctx.lineTo(fx + Math.cos(an) * r, fy + Math.sin(an) * r); ctx.stroke(); }
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.font = 'bold 38px Arial';
    ctx.strokeText(tx('LEVEL 2 GESCHAFFT!'), W / 2, 30); ctx.fillText(tx('LEVEL 2 GESCHAFFT!'), W / 2, 30);
    ctx.fillStyle = '#f4f8ff'; ctx.font = 'bold 14px Arial';
    ctx.fillText(tx('Perlen {p} × 5 + Seesterne {s} = {c} Münzen', { p: SAVE.pearls, s: SAVE.starfish, c: S.bonus || 0 }), W / 2, 64);
    ctx.fillText(tx('Münzen gesamt: {c}   ·   Herzen: {h}', { c: SAVE.coins, h: SAVE.hearts }), W / 2, 84);
    // world + mini game results
    const res = [[tx('Stadt'), SAVE.done.city], [tx('Himmel'), SAVE.done.heaven], [tx('Tiefsee'), SAVE.done.sea], [tx('Piñata'), SAVE.mini.pinata], [tx('Wal-Memory'), SAVE.mini.whale], [tx('Elfmeter'), SAVE.mini.football], [tx('Harfe'), SAVE.mini.harp]];
    res.forEach(([name, ok], i) => {
      const x = W / 2 - 330 + i * 110;
      ctx.fillStyle = ok ? 'rgba(47,138,95,0.85)' : 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.roundRect(x - 50, 98, 100, 30, 10); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.fillText((ok ? '✓ ' : '– ') + name, x, 113);
    });
    // 100 % trophy (right of the title)
    drawTrophy(W / 2 + 300, 32, SAVE.trophy);
    ctx.font = 'bold 12px Arial'; ctx.fillStyle = SAVE.trophy ? '#ffd23a' : 'rgba(255,255,255,0.7)'; ctx.textAlign = 'left';
    ctx.fillText(SAVE.trophy ? '100 %' : miniCount() + ' / 4', W / 2 + 324, 34); ctx.textAlign = 'center';
    ctx.font = 'bold 12px Arial'; ctx.fillStyle = SAVE.trophy ? '#ffd23a' : 'rgba(255,255,255,0.65)';
    ctx.fillText(SAVE.trophy ? tx('100 %-POKAL! Alle Minispiele geschafft · +50 Münzen · Goldene Kappe') : tx('Minispiele {n}/4 – alle 4 = 100 %-Pokal', { n: miniCount() }), W / 2, 136);
    ctx.fillStyle = '#7fe0ff'; ctx.font = 'bold 19px Arial'; ctx.fillText(tx('LEVEL 3 FREIGESCHALTET'), W / 2, 164);
    ctx.restore();
    button(BTN.newGame, tx('NEUES SPIEL'), '#34c759', '#1f8f3c');
    button(BTN.level3, '▶ ' + tx('LEVEL 3: DINOLAND'), '#ff9a2a', '#d0601a');
    // play one world or one little game again – everything stays (items, coins, finished worlds)
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = 'bold 12px Arial'; ctx.fillText(tx('Oder eine Welt nochmal spielen (du verlierst nichts):'), W / 2, 242);
    for (const b of BTN.replay) {
      ctx.fillStyle = 'rgba(54,168,244,0.9)'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 10); ctx.fill(); ctx.stroke();
      drawWorldIcon(b.world === 'stadt' ? 'city' : b.world === 'himmel' ? 'heaven' : 'sea', b.x + 20, b.y + b.h / 2, true);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Arial'; ctx.fillText(tx(b.label), b.x + b.w / 2 + 12, b.y + b.h / 2 + 1);
    }
    for (const b of BTN.minis) {
      ctx.fillStyle = 'rgba(181,108,230,0.9)'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.arc(b.x + 20, b.y + b.h / 2, 13, 0, Math.PI * 2); ctx.fill();
      drawMiniIcon(b.game, b.x + 20, b.y + b.h / 2);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Arial'; ctx.fillText(tx(b.label), b.x + b.w / 2 + 12, b.y + b.h / 2 + 1);
    }
    ctx.restore();
  }

}

// golden trophy (grey outline when not yet won)
function drawTrophy(cx, cy, won) {
  ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
  const s = won ? 1 + Math.sin(S.t * 0.1) * 0.06 + (S.trophyNew > 0 ? 0.3 * S.trophyNew / 300 : 0) : 1; ctx.scale(s, s);
  if (won) { const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 34); g.addColorStop(0, 'rgba(255,230,120,0.7)'); g.addColorStop(1, 'rgba(255,230,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = won ? 1 : 0.45; const gold = won ? '#ffd23a' : '#9aa3ad';
  ctx.fillStyle = gold;
  ctx.beginPath(); ctx.moveTo(-12, -14); ctx.lineTo(12, -14); ctx.quadraticCurveTo(12, 4, 0, 6); ctx.quadraticCurveTo(-12, 4, -12, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * 13, -8, 5, sd < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, sd < 0 ? Math.PI * 1.5 : Math.PI * 0.5, sd > 0); ctx.stroke(); }
  ctx.fillRect(-2.5, 6, 5, 6); ctx.strokeRect(-2.5, 6, 5, 6);
  ctx.beginPath(); ctx.roundRect(-9, 12, 18, 5, 2); ctx.fill(); ctx.stroke();
  if (won) { ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.ellipse(-5, -8, 2, 5, 0.3, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
// small icons for the mini-game buttons: piñata star, football, whale
function drawMiniIcon(game, cx, cy) {
  ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = OUT; ctx.lineWidth = 1.3; ctx.lineJoin = 'round';
  if (game === 'pinata') {
    const cols = ['#ff5fa2', '#ffd23a', '#36c6f4', '#7fcf8a', '#ff8a3a'];
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a - 0.35) * 4, Math.sin(a - 0.35) * 4); ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11); ctx.lineTo(Math.cos(a + 0.35) * 4, Math.sin(a + 0.35) * 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (game === 'football') {
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT; ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * 4, Math.sin(a) * 4); } ctx.closePath(); ctx.fill();
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4); ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10); ctx.stroke(); }
  } else { ctx.scale(0.42, 0.42); drawIcon('whale', 0, 0); }
  ctx.restore();
}

// ================= MAIN DRAW =================
function draw() {
  ctx.save();
  if (S.shake > 0) ctx.translate(rand(-1, 1) * S.shake * 0.6, rand(-1, 1) * S.shake * 0.6);
  drawBackground();
  if (S.whale) drawWhale(S.whale);
  for (const o of S.objects) {
    if (o.done && o.type !== 'clam') continue;
    switch (o.type) {
      case 'mine': drawMine(o); break;
      case 'jelly': drawJelly(o); break;
      case 'minijelly': drawMiniJelly(o); break;
      case 'minisquid': drawMiniSquid(o); break;
      case 'air': drawAir(o); break;
      case 'star': drawStar(o); break;
      case 'pearl': drawPearl(o); break;
      case 'turbo': drawTurboItem(o); break;
      case 'puffer': drawPuffer(o); break;
    }
  }
  drawFloor();
  for (const o of S.objects) if (o.type === 'wreck') drawWreck(o);
  for (const o of S.objects) if (o.type === 'chest') drawChest(o);
  for (const o of S.objects) {
    if (o.type === 'clam') drawClam(o);
    if (o.done) continue;
    if (o.type === 'urchin') drawUrchin(o);
    if (o.type === 'octopus') drawOctopus(o);
  }
  if (S.boss) drawBoss(S.boss);
  for (const b of S.bubbles) {
    ctx.globalAlpha = Math.min(1, b.life);
    ctx.strokeStyle = 'rgba(225,250,255,0.9)'; ctx.lineWidth = 1.3; ctx.fillStyle = 'rgba(190,240,255,0.2)';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (S.turbo > 0) drawSpeedLines();
  drawKaiTurboGlow();
  if (S.phase !== 'victory') drawKai();
  for (const o of S.objects) if (o.type === 'shark' && !o.done) drawShark(o);
  for (const h of S.harpoons) drawHarpoon(h);
  for (const e of S.explosions) drawExplosion(e);
  for (const p of S.particles) {
    ctx.globalAlpha = Math.min(1, p.life); ctx.fillStyle = p.color;
    if (p.shard) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); }
    else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  drawInk();
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.6, W / 2, H / 2, W * 0.65);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, S.phase === 'boss' ? 'rgba(40,0,15,0.55)' : 'rgba(0,10,25,0.45)');
  ctx.fillStyle = v; ctx.fillRect(-20, -20, W + 40, H + 40);
  if (S.oxygen <= 0 && S.phase === 'play' || S.oxygen <= 0 && S.phase === 'boss') { ctx.globalAlpha = 0.25 + Math.sin(S.t * 0.25) * 0.15; const rv = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.6); rv.addColorStop(0, 'rgba(255,0,0,0)'); rv.addColorStop(1, 'rgba(255,30,30,1)'); ctx.fillStyle = rv; ctx.fillRect(-20, -20, W + 40, H + 40); ctx.globalAlpha = 1; }
  if (S.phase === 'ascent') { ctx.globalAlpha = Math.min(1, S.phaseTimer / 200); ctx.fillStyle = '#dff6ff'; ctx.fillRect(-20, -20, W + 40, H + 40); ctx.globalAlpha = 1; }
  ctx.restore();
  if (S.noHud) return;
  if (S.phase === 'memory' && S.memory) drawMemory();
  if (S.phase === 'memoryPick') drawMemoryPick();
  if (S.phase === 'memoryEnd') drawMemoryEnd();
  ctx.save(); ctx.translate(0, -DY); drawHUD(); ctx.restore();
  ctx.save(); ctx.translate(0, -DY / 2); drawScreens(); ctx.restore();
}

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 16.667, 3);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.__S = S; window.__test = { startBoss, explode, addObject, resetGame, turbo: () => { S.turbo = TURBO_FRAMES; Audio.setFast(true); } };
})();
</script>
</body>
</html>
