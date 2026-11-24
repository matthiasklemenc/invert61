// =====================================================================
//  DRAWING – AURORA 61 (like in Matt's book: turquoise sky with aurora lights, a big planet,
//  palms, waterfalls, purple and yellow flowers, white round houses)
// =====================================================================
const GRASS = '#62c45a', GRASS_D = '#3f9a45', SOIL = '#7a5530', SOIL_D = '#5a3c22';
function drawAuroraSky(cam) {
  const g = ctx.createLinearGradient(0, -DY, 0, H); g.addColorStop(0, '#1f8f8a'); g.addColorStop(0.45, '#48c9b5'); g.addColorStop(1, '#bff2df');
  ctx.fillStyle = g; ctx.fillRect(0, -DY, W, H + DY);
  // the aurora lights waving at the top
  ctx.save(); ctx.globalAlpha = 0.35;
  ['#7dffa0', '#b48cff', '#36f4d0'].forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 18 - i * 4; ctx.beginPath(); for (let x = -20; x <= W + 20; x += 20) ctx.lineTo(x, -DY + 40 + i * 22 + Math.sin(x * 0.006 + S.t * 0.01 + i * 1.3 - cam * 0.0005) * 26); ctx.stroke(); });
  ctx.restore();
  // a big planet with a ring and a small moon
  const px = W * 0.72 - cam * 0.01, py = -DY * 0.5 + 40;
  ctx.save(); ctx.fillStyle = 'rgba(220,250,245,0.75)'; ctx.beginPath(); ctx.arc(px, py, 90, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(160,225,220,0.6)'; ctx.beginPath(); ctx.ellipse(px - 20, py + 10, 50, 22, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(px, py, 140, 26, -0.25, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(px - 200, py + 60, 14, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawAuroraHills(cam) {
  // far mountains with waterfalls
  const off = cam * 0.12;
  ctx.fillStyle = '#5fae9a';
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W + 40; x += 40) { const wx = x + off; ctx.lineTo(x, 150 + Math.sin(wx * 0.004) * 40 + Math.sin(wx * 0.013) * 12); }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 4; i++) {
    const x = ((i * 520 + 200 - off) % 2080 + 2080) % 2080 - 200, top = 150 + Math.sin((x + off) * 0.004) * 40;
    const g = ctx.createLinearGradient(0, top, 0, 280); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(180,240,255,0.6)');
    ctx.fillStyle = g; ctx.fillRect(x - 9, top, 18, 280 - top);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let j = 0; j < 4; j++) { const y = top + ((S.t * 2 + j * 30) % (280 - top)); ctx.fillRect(x - 6 + (j % 2) * 6, y, 3, 12); }
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(x, 280, 28, 8, 0, 0, Math.PI * 2); ctx.fill();
  }
  // middle: green hills with white round houses and palms
  const off2 = cam * 0.32;
  ctx.fillStyle = '#4fb46a';
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W + 40; x += 40) { const wx = x + off2; ctx.lineTo(x, 228 + Math.sin(wx * 0.006) * 22); }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 6; i++) {
    const x = ((i * 410 + 90 - off2) % 2460 + 2460) % 2460 - 200, y = 228 + Math.sin((x + off2) * 0.006) * 22;
    if (i % 2) drawDomeHouse(x, y + 6, 0.55); else drawPalm(x, y + 6, 0.6);
  }
}
function drawDomeHouse(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.ellipse(0, -40, 70, 44, 0, Math.PI, 0); ctx.lineTo(70, 0); ctx.lineTo(-70, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#dfe6ee'; ctx.beginPath(); ctx.ellipse(0, -40, 84, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.roundRect(-50, -34, 40, 20, 8); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(14, -34, 40, 20, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#36c6f4'; ctx.fillRect(-70, -8, 140, 5);
  ctx.restore();
}
function drawPalm(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, -70, 4, -140); ctx.stroke();
  ctx.fillStyle = '#3f9a45';
  for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(4, -140); ctx.rotate(i * 1.05 + 0.2); ctx.beginPath(); ctx.ellipse(36, 0, 40, 9, 0.25, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = '#8a5a32'; ctx.beginPath(); ctx.arc(-2, -134, 6, 0, Math.PI * 2); ctx.arc(10, -132, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawFlower(x, y, col, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#3f9a45'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -14); ctx.stroke();
  ctx.fillStyle = col; for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; ctx.beginPath(); ctx.arc(Math.cos(a) * 5, -16 + Math.sin(a) * 5, 4, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(0, -16, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawBackground() { drawAuroraSky(S.cam); drawAuroraHills(S.cam); }
function drawGround() {
  const x0 = S.cam - 40, x1 = S.cam + W + 40;
  for (const [a, b] of GROUND) {
    if (b < x0 || a > x1) continue;
    const l = Math.max(a, x0), r = Math.min(b, x1);
    const g = ctx.createLinearGradient(0, FLOOR, 0, H + 40); g.addColorStop(0, SOIL); g.addColorStop(1, SOIL_D);
    ctx.fillStyle = g; ctx.fillRect(l, FLOOR, r - l, H - FLOOR + 40);
    ctx.fillStyle = GRASS; ctx.fillRect(l, FLOOR - 6, r - l, 12);
    ctx.strokeStyle = GRASS_D; ctx.lineWidth = 2;
    for (let x = Math.floor(l / 22) * 22; x < r; x += 22) { ctx.beginPath(); ctx.moveTo(x, FLOOR - 4); ctx.lineTo(x + 4, FLOOR - 12); ctx.lineTo(x + 8, FLOOR - 4); ctx.stroke(); }
    for (let x = Math.floor(l / 130) * 130 + 40; x < r - 10; x += 130) drawFlower(x, FLOOR - 4, ['#b48cff', '#ffd23a', '#ff5a8a', '#ffffff'][Math.abs(x / 130 | 0) % 4], 1);
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(l, FLOOR - 6); ctx.lineTo(r, FLOOR - 6); ctx.stroke();
    ctx.fillStyle = SOIL_D;
    if (a > x0) { ctx.beginPath(); ctx.moveTo(a, FLOOR - 6); ctx.lineTo(a + 10, H + 40); ctx.lineTo(a, H + 40); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(a, FLOOR - 6); ctx.lineTo(a, H + 40); ctx.stroke(); }
    if (b < x1) { ctx.beginPath(); ctx.moveTo(b, FLOOR - 6); ctx.lineTo(b - 10, H + 40); ctx.lineTo(b, H + 40); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(b, FLOOR - 6); ctx.lineTo(b, H + 40); ctx.stroke(); }
  }
  // the gorges: a river with a waterfall mist far below
  for (let i = 0; i < GROUND.length - 1; i++) {
    const a = GROUND[i][1], b = GROUND[i + 1][0];
    if (b < x0 || a > x1) continue;
    const g = ctx.createLinearGradient(0, FLOOR, 0, H + 40); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,220,240,0.9)');
    ctx.fillStyle = g; ctx.fillRect(a, FLOOR, b - a, H - FLOOR + 40);
  }
}
function drawPlat(p) {
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  let x = p.x, y = p.y;
  if (p.kind === 'crumble' && p.state === 'shake') x += Math.sin(S.t * 1.7) * 2.5;
  if (p.kind === 'move') {
    // a floating giant lily pad
    ctx.fillStyle = '#4fc46a'; ctx.beginPath(); ctx.ellipse(x + p.w / 2, y + 4, p.w / 2, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#2f8a45'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + p.w / 2, y + 4); ctx.lineTo(x + p.w - 10, y); ctx.stroke();
    drawFlower(x + p.w * 0.3, y, '#ff9ad0', 0.9);
  } else if (p.kind === 'crumble') {
    // a big puffy flower that wilts when Kai stands on it
    ctx.fillStyle = '#ff9ad0'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(x + 12 + i * (p.w - 24) / 4, y + 6, 18, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.roundRect(x + 6, y - 3, p.w - 12, 8, 4); ctx.fill(); ctx.stroke();
  } else {
    // a grassy floating island with a little waterfall
    ctx.fillStyle = SOIL; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + p.w, y); ctx.lineTo(x + p.w - 16, y + 24); ctx.lineTo(x + p.w * 0.5, y + 40); ctx.lineTo(x + 16, y + 24); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = GRASS; ctx.beginPath(); ctx.roundRect(x - 2, y - 4, p.w + 4, 10, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x + p.w * 0.7, y + 6, 6, 40 + Math.sin(S.t * 0.2) * 3);
  }
  ctx.restore();
}
// Grisella's grey blobs – a paint ball makes them colourful and happy again
function drawWalker(c) {
  ctx.save(); ctx.translate(c.x, FLOOR);
  const happy = c.dead;
  if (happy) { ctx.globalAlpha = Math.max(0, 1 - c.deadT / 60); ctx.translate(0, -c.deadT * 1.2); }
  ctx.scale(c.dir, 1); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  const sq = Math.sin(c.t * 0.25) * 3;
  ctx.fillStyle = happy ? ['#ff9ad0', '#7dffa0', '#ffd23a'][c.kind] : '#8d8f99';
  ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(-28, -40 - sq, 0, -42 - sq); ctx.quadraticCurveTo(28, -40 - sq, 26, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; for (const ex of [-8, 8]) { ctx.beginPath(); ctx.arc(ex + 4, -26 - sq, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = OUT; for (const ex of [-8, 8]) { ctx.beginPath(); ctx.arc(ex + 6, -26 - sq, 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.beginPath(); if (happy) ctx.arc(4, -16 - sq, 6, 0.2, Math.PI - 0.2); else ctx.arc(4, -10 - sq, 6, Math.PI + 0.3, -0.3); ctx.stroke();
  if (!happy) { ctx.beginPath(); ctx.moveTo(-6, -36 - sq); ctx.lineTo(2, -33 - sq); ctx.moveTo(18, -36 - sq); ctx.lineTo(10, -33 - sq); ctx.stroke(); }
  ctx.restore();
}
// Grisella's grey birds – turn into colourful birds when hit
function drawFlyer(p) {
  ctx.save(); ctx.translate(p.x, p.y);
  if (p.dead) { ctx.translate(0, 0); }
  ctx.scale(p.dir * (p.baby ? 0.65 : 1), p.baby ? 0.65 : 1); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  const angry = p.state === 'warn' || p.state === 'dive', f = Math.sin(p.t * (angry ? 0.35 : 0.22));
  const body = p.dead ? '#ffd23a' : '#6f717c', wing = p.dead ? '#ff5a8a' : '#9a9ca6';
  ctx.fillStyle = wing; ctx.beginPath(); ctx.moveTo(-4, -4); ctx.quadraticCurveTo(-18, -24 - f * 20, -38, -20 - f * 26); ctx.quadraticCurveTo(-18, -6, -4, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-34, -6); ctx.lineTo(-32, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffb02e'; ctx.beginPath(); ctx.moveTo(20, -4); ctx.lineTo(32, 0); ctx.lineTo(20, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(12, -4, 3.4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(13, -4, 1.6, 0, Math.PI * 2); ctx.fill();
  if (angry) { ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(16, -8); ctx.stroke(); }
  ctx.fillStyle = wing; ctx.beginPath(); ctx.moveTo(2, -4); ctx.quadraticCurveTo(-4, -28 - f * 24, -30, -26 - f * 30); ctx.quadraticCurveTo(-12, -8, 2, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
// a coconut falling from a palm
function drawDrop(s) {
  ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.fillStyle = '#8a5a32'; ctx.beginPath(); ctx.arc(0, 0, s.r * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5a3c22'; ctx.beginPath(); ctx.arc(-3, -3, 2, 0, Math.PI * 2); ctx.arc(3, -3, 2, 0, Math.PI * 2); ctx.arc(0, 3, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawPuddle(p) {
  const a = Math.min(1, p.t / 20, (p.life - p.t) / 30);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#7a7c86'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(p.x, FLOOR - 2, p.w / 2, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(p.x - p.w * 0.15, FLOOR - 4, p.w * 0.12, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ---------------- elephants, Abu, Grisella ----------------
// Abu, the grandfather: white hair and beard, glasses, orange plaid shirt, blue suspenders
function drawAbu(x, y, s, wave) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  // legs + shoes
  ctx.fillStyle = '#3a4a6a'; ctx.fillRect(-18, -60, 15, 56); ctx.strokeRect(-18, -60, 15, 56); ctx.fillRect(3, -60, 15, 56); ctx.strokeRect(3, -60, 15, 56);
  ctx.fillStyle = '#4a3020'; ctx.beginPath(); ctx.roundRect(-22, -8, 22, 9, 4); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(0, -8, 24, 9, 4); ctx.fill(); ctx.stroke();
  // body: orange plaid shirt
  ctx.fillStyle = '#f29a3a'; ctx.beginPath(); ctx.roundRect(-30, -132, 60, 78, 18); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.roundRect(-30, -132, 60, 78, 18); ctx.clip();
  ctx.strokeStyle = 'rgba(200,90,20,0.55)'; ctx.lineWidth = 3; for (let i = -30; i < 30; i += 12) { ctx.beginPath(); ctx.moveTo(i, -132); ctx.lineTo(i, -54); ctx.stroke(); } for (let j = -128; j < -54; j += 12) { ctx.beginPath(); ctx.moveTo(-30, j); ctx.lineTo(30, j); ctx.stroke(); }
  ctx.restore();
  // suspenders
  ctx.strokeStyle = '#4a78b8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-14, -128); ctx.lineTo(-12, -58); ctx.moveTo(14, -128); ctx.lineTo(12, -58); ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  // arms
  ctx.fillStyle = '#f29a3a';
  ctx.beginPath(); ctx.roundRect(-42, -124, 14, 54, 7); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(36, -120); ctx.rotate(wave ? -2.4 + Math.sin(S.t * 0.2) * 0.3 : 0.1); ctx.beginPath(); ctx.roundRect(-7, 0, 14, 54, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f2c79e'; ctx.beginPath(); ctx.arc(0, 58, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#f2c79e'; ctx.beginPath(); ctx.arc(-35, -66, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // head
  ctx.fillStyle = '#f2c79e'; ctx.beginPath(); ctx.arc(0, -158, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // white hair (sides and top)
  ctx.fillStyle = '#f2f2f2'; ctx.beginPath(); ctx.ellipse(-22, -170, 12, 16, -0.3, 0, Math.PI * 2); ctx.ellipse(22, -170, 12, 16, 0.3, 0, Math.PI * 2); ctx.ellipse(0, -184, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
  // beard + moustache
  ctx.beginPath(); ctx.moveTo(-24, -156); ctx.quadraticCurveTo(-26, -118, 0, -112); ctx.quadraticCurveTo(26, -118, 24, -156); ctx.quadraticCurveTo(12, -142, 0, -144); ctx.quadraticCurveTo(-12, -142, -24, -156); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-8, -146, 10, 5, 0.2, 0, Math.PI * 2); ctx.ellipse(8, -146, 10, 5, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -138, 5, 0.2, Math.PI - 0.2); ctx.stroke();
  // nose, glasses, eyes, eyebrows
  ctx.fillStyle = '#e8a880'; ctx.beginPath(); ctx.arc(0, -154, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(-10, -162, 2.6, 0, Math.PI * 2); ctx.arc(10, -162, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 2.2; ctx.beginPath(); ctx.roundRect(-20, -169, 16, 12, 4); ctx.stroke(); ctx.beginPath(); ctx.roundRect(4, -169, 16, 12, 4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-4, -164); ctx.lineTo(4, -164); ctx.stroke();
  ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-20, -174); ctx.lineTo(-6, -176); ctx.moveTo(6, -176); ctx.lineTo(20, -174); ctx.stroke();
  ctx.restore();
}
function drawGrisella(b) {
  if (b.state === 'gone') return;
  ctx.save(); ctx.translate(b.x, b.y); ctx.scale(b.face * b.sz, b.sz); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  if (b.flash > 0 && Math.floor(b.flash / 4) % 2 === 0) ctx.globalAlpha = 0.5;
  // the broom
  ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-70, 18); ctx.lineTo(60, 8); ctx.stroke();
  ctx.fillStyle = '#c9a26a'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-60, 10); ctx.lineTo(-100, -2 + Math.sin(S.t * 0.3) * 3); ctx.lineTo(-104, 22); ctx.lineTo(-96, 40 + Math.sin(S.t * 0.3) * 3); ctx.lineTo(-60, 26); ctx.closePath(); ctx.fill(); ctx.stroke();
  // grey cloak
  ctx.fillStyle = '#7d808c'; ctx.beginPath(); ctx.moveTo(-26, -40); ctx.quadraticCurveTo(-50, 0, -44 + Math.sin(S.t * 0.2) * 6, 30); ctx.lineTo(24, 22); ctx.quadraticCurveTo(26, -10, 14, -40); ctx.closePath(); ctx.fill(); ctx.stroke();
  // arm with the "Farbsauger" (a colour vacuum wand)
  ctx.fillStyle = '#7d808c'; ctx.beginPath(); ctx.moveTo(6, -30); ctx.lineTo(40, -18); ctx.lineTo(36, -8); ctx.lineTo(2, -18); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5a5c66'; ctx.beginPath(); ctx.moveTo(38, -16); ctx.lineTo(66, -24); ctx.lineTo(70, -8); ctx.lineTo(40, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(200,200,210,0.6)'; for (let i = 0; i < 3; i++) { const u = ((S.t * 0.05 + i / 3) % 1); ctx.beginPath(); ctx.arc(70 + (1 - u) * 50, -16 + Math.sin(u * 9) * 6, 4 * (1 - u) + 1, 0, Math.PI * 2); ctx.fill(); }
  // head: grey-green face, long silver hair, pointy hat
  ctx.fillStyle = '#d8dad2'; ctx.beginPath(); ctx.moveTo(-18, -58); ctx.quadraticCurveTo(-36, -20, -30, 0); ctx.lineTo(-6, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#b9c4b0'; ctx.beginPath(); ctx.arc(0, -56, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, -58); ctx.quadraticCurveTo(28, -52, 18, -46); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(8, -60, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6a2a8a'; ctx.beginPath(); ctx.arc(9.5, -60, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -68); ctx.lineTo(14, -66); ctx.stroke();
  ctx.strokeStyle = '#8a3a9a'; ctx.beginPath(); ctx.arc(8, -44, 6, b.flash > 0 ? Math.PI + 0.4 : 0.3, b.flash > 0 ? -0.4 : Math.PI - 0.3); ctx.stroke(); ctx.strokeStyle = OUT;
  ctx.fillStyle = '#4a4c56'; ctx.beginPath(); ctx.ellipse(0, -72, 30, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-18, -74); ctx.quadraticCurveTo(-8, -110, -26, -126); ctx.quadraticCurveTo(8, -110, 18, -74); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9a9ca6'; ctx.fillRect(-16, -84, 33, 6);
  ctx.restore();
  // the grey beam along the ground
  if (b.state === 'beam') {
    ctx.save();
    if (b.t < 50) { if (Math.floor(b.t / 6) % 2 === 0) { ctx.fillStyle = 'rgba(255,60,60,0.35)'; const x2 = b.x + b.face * (W - 280); ctx.fillRect(Math.min(b.x, x2), FLOOR - 30, Math.abs(x2 - b.x), 26); } }
    else if (b.t < 140) { const reach = b.x + b.face * (W - 280) * b.beam; ctx.fillStyle = 'rgba(140,142,152,0.85)'; ctx.fillRect(Math.min(b.x, reach), FLOOR - 32, Math.abs(reach - b.x), 28); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(Math.min(b.x, reach), FLOOR - 24, Math.abs(reach - b.x), 5); }
    ctx.restore();
  }
}
function drawPipe() {
  if (!onScreen(PIPE_X - 100, PIPE_W + 200)) return;
  const x = PIPE_X, top = FLOOR - PIPE_H, lid = S.big.lid;
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  const g = ctx.createLinearGradient(x, 0, x + PIPE_W, 0); g.addColorStop(0, '#1f7a6a'); g.addColorStop(0.35, '#4fd1b5'); g.addColorStop(1, '#165c50');
  ctx.fillStyle = g; ctx.fillRect(x + 6, top + 16, PIPE_W - 12, PIPE_H - 16); ctx.strokeRect(x + 6, top + 16, PIPE_W - 12, PIPE_H - 16);
  ctx.beginPath(); ctx.roundRect(x, top, PIPE_W, 20, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#0c2a26'; ctx.beginPath(); ctx.ellipse(x + PIPE_W / 2, top + 4, PIPE_W / 2 - 8, 5, 0, 0, Math.PI * 2); ctx.fill();
  // the heavy stone lid (lifted by the big elephant)
  const lx = x + PIPE_W / 2 - (lid > 0 && S.big.state !== 'lift' ? 120 : 0) * lid, ly = S.big.state === 'lift' ? Math.min(top - 4, S.big.y - 20) : top - 4 + (lid >= 1 ? PIPE_H - 12 : 0);
  ctx.fillStyle = '#9a9488'; ctx.beginPath(); ctx.ellipse(lid >= 1 ? x - 70 : lx, lid >= 1 ? FLOOR - 10 : ly, PIPE_W / 2 + 6, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawWorldMid() {
  // the rocket back to the moon (left)
  if (onScreen(60, 200)) { drawRocket4(150, FLOOR - 4, 0.6); drawSign(300, FLOOR - 70, '◀ 🚀 ' + tx('MOND'), '#9fd8ff'); }
  // Abu's house with the OXXO
  const ox = SITES.oxxo + 120;
  if (onScreen(ox - 260, 520)) {
    drawDomeHouse(ox - 40, FLOOR, 1.5);
    ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.fillStyle = '#d8231f'; ctx.beginPath(); ctx.roundRect(ox - 105, FLOOR - 128, 130, 34, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(ox - 103, FLOOR - 126, 126, 4); ctx.fillRect(ox - 103, FLOOR - 100, 126, 4);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OXXO', ox - 40, FLOOR - 111);
    ctx.fillStyle = '#6b4a2e'; ctx.beginPath(); ctx.roundRect(ox + 40, FLOOR - 70, 34, 70, [14, 14, 0, 0]); ctx.fill(); ctx.stroke();
    ctx.restore();
    drawAbu(ox + 130, FLOOR, 0.55, Math.abs(S.kai.x - ox) < 400);
    if (Math.abs(S.kai.x - ox) < 420 && S.phase === 'play') { ctx.save(); ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.fillStyle = '#ffffff'; const t = tx('Abu: „Komm rein, Kai!“'); ctx.strokeText(t, ox + 130, FLOOR - 128); ctx.fillText(t, ox + 130, FLOOR - 128); ctx.restore(); }
  }
  // the photo hut for the Fotosafari
  const fx = SITES.foto + 120;
  if (onScreen(fx - 150, 320)) {
    ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.fillStyle = '#c99a5f'; ctx.fillRect(fx - 60, FLOOR - 90, 120, 90); ctx.strokeRect(fx - 60, FLOOR - 90, 120, 90);
    ctx.fillStyle = '#3f9a45'; ctx.beginPath(); ctx.moveTo(fx - 80, FLOOR - 88); ctx.lineTo(fx, FLOOR - 140); ctx.lineTo(fx + 80, FLOOR - 88); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#333a44'; ctx.beginPath(); ctx.roundRect(fx - 26, FLOOR - 76, 52, 34, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.arc(fx, FLOOR - 59, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    drawSign(fx + 120, FLOOR - 70, '📷 ' + tx('FOTOSAFARI'), '#ffb02e');
  }
  for (const e of ELES) if (onScreen(e.g1 - 100, 200)) drawSign(e.g1 - 40, FLOOR - 64, '🐘 ' + tx('ELEFANTEN-FLUG'), '#9fb6d6');
  drawPipe();
}
// the rocket from the moon (small copy of the moon rocket, no window face)
function drawRocket4(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = OUT; ctx.lineWidth = 3 / s; ctx.lineJoin = 'round';
  ctx.fillStyle = '#e8463c';
  ctx.beginPath(); ctx.moveTo(-34, -60); ctx.quadraticCurveTo(-70, -40, -66, 0); ctx.lineTo(-38, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(34, -60); ctx.quadraticCurveTo(70, -40, 66, 0); ctx.lineTo(38, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.moveTo(-40, -6); ctx.lineTo(-44, -180); ctx.quadraticCurveTo(-44, -290, 0, -330); ctx.quadraticCurveTo(44, -290, 44, -180); ctx.lineTo(40, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.clip(); ctx.fillStyle = '#e8463c'; ctx.beginPath(); ctx.moveTo(-60, -262); ctx.quadraticCurveTo(0, -282, 60, -262); ctx.lineTo(60, -340); ctx.lineTo(-60, -340); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2f6fd6'; ctx.fillRect(-60, -240, 120, 12); ctx.fillRect(-60, -86, 120, 12); ctx.restore();
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(0, -170, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.arc(0, -170, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawWorldFront() {
  // the elephants at the gorges
  for (const e of S.eles) {
    if (!onScreen(e.fx - 80, 160) || (S.fly && S.fly.e === e)) continue;
    const happy = SAVE['ele' + e.i];
    drawElephant(e.fx, e.fy + (happy ? Math.sin(S.t * 0.08) * 3 : 0), 1, S.t, happy, 1, !happy);
    if (!happy && Math.abs(S.kai.x - e.home) < 300) { ctx.save(); ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.fillStyle = '#ffffff'; const t = '🥭 × 3'; ctx.strokeText(t, e.fx + 20, FLOOR - 120); ctx.fillText(t, e.fx + 20, FLOOR - 120); ctx.restore(); }
  }
  // the big elephant at the pipe (twice as big)
  if (onScreen(S.big.x - 160, 320)) {
    const b = S.big, happy = b.state !== 'sad' && b.state !== 'eat';
    drawElephant(b.x, b.y, 1.9, S.t, happy, b.state === 'lift' ? 1 : -1, !happy);
    if (b.state === 'eat') drawCake(b.x - 90, FLOOR - 70 + Math.min(40, b.t * 0.6), 1 - Math.min(0.9, b.t / 100));
  }
  if (S.boss) drawGrisella(S.boss);
  // Kai flying on an elephant
  if (S.fly) {
    const k = S.kai;
    drawElephant(k.x, k.y + 34, 1.15, S.t, true, k.face, false);
    ctx.save(); ctx.translate(k.x - 6 * k.face, k.y - 28); ctx.scale(k.face, 1);
    drawKaiFigure({ x: 0, y: 0, tilt: -0.05, crouch: 6, push: 0, flip: 0, armsUp: !k.shootT, wind: 1, outfit: SAVE.outfit, hover: true });
    ctx.restore();
  }
  // Flappy (Abu's baby elephant) flies along
  if (SAVE.flappy && S.flappy && onScreen(S.flappy.x - 40, 80)) drawElephant(S.flappy.x, S.flappy.y + 30, 0.42, S.t * 1.4, true, S.flappy.face || 1, false);
}
function drawKaiOverride() { return !!S.fly; }
// while Grisella is here, the colours are sucked out of the world
function drawWorldTop() {
  const b = S.boss; if (!b || b.grey < 0.02) return;
  ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = Math.min(0.95, b.grey); ctx.fillStyle = '#808080'; ctx.fillRect(-20, -DY - 20, W + 40, H + DY + 40); ctx.restore();
}
function drawSpecial() { if (S.phase === 'game' && S.game) { drawFoto(); return true; } return false; }
// first time on Aurora 61: Abu greets Kai and gives him Flappy and the paint balls
function startPanel() {
  ctx.save(); ctx.fillStyle = 'rgba(16,40,44,0.78)'; ctx.fillRect(0, -VH, W, 3 * VH); ctx.restore();
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#7dffa0'; ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.font = 'bold 40px Arial';
  ctx.strokeText(tx('AURORA 61'), W / 2 + 120, 40); ctx.fillText(tx('AURORA 61'), W / 2 + 120, 40); ctx.restore();
  drawAbu(150, H - 4, 1.15, true);
  drawElephant(300, 150 + Math.sin(S.t * 0.08) * 8, 0.6, S.t * 1.4, true, -1, false);
  const touch = CTRL.touch;
  speech(370, 58, 560, tx('Hallo Kai! Willkommen bei mir auf Aurora 61! Das ist Flappy, mein kleiner Elefant – er fliegt mit dir und sammelt Münzen. Hier hast du Farbkugeln: damit machst du Grisellas graue Wesen wieder bunt!'), 300, 150);
  ctx.save(); ctx.fillStyle = '#f2f8ff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  [touch ? tx('◀ ▶ = fahren · SPRUNG = springen · SCHUSS = Farbkugeln') : tx('← → = fahren · Leertaste = springen · X = Farbkugeln'),
    tx('Traurige Elefanten: gib ihnen 3 Mangos – dann fliegen sie dich über die Schlucht.'),
    tx('In meinem OXXO gibt es den Mega-Mango-Kuchen für die Unterwelt.'),
    tx('Am Ende wartet die FARBHEXE GRISELLA.')].forEach((l, i) => ctx.fillText(l, 380, 190 + i * 20));
  ctx.restore();
  button({ x: W / 2 + 140, y: 268, w: 220, h: 44 }, '▶  ' + tx('LOS GEHT\'S'), '#34c759', '#1f8f3c');
}
// Abu stands behind the counter in his OXXO
function drawShopClerk() {
  ctx.save();
  drawAbu(108, H + 4, 1.05, true);
  ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.fillStyle = '#c99a5f'; ctx.fillRect(0, H - 92, 220, 100); ctx.strokeRect(-4, H - 92, 224, 100);
  ctx.fillStyle = '#d8231f'; ctx.fillRect(0, H - 92, 220, 12); ctx.fillStyle = '#ffd23a'; ctx.fillRect(0, H - 80, 220, 4);
  ctx.restore();
  if (S.shopMsgT > 0) speech(12, 6, 214, S.shopMsg, 100, 165);
}
