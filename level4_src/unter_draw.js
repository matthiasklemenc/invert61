// =====================================================================
//  DRAWING – DIE UNTERWELT (dark purple caves, glowing crystals and mushrooms, green acid)
// =====================================================================
const CAVE = '#3a2a52', CAVE_D = '#24183a', MOSS = '#7dffa0';
function drawBackground() {
  const g = ctx.createLinearGradient(0, -DY, 0, H); g.addColorStop(0, '#0c0614'); g.addColorStop(0.6, '#1e1230'); g.addColorStop(1, '#2b1a40');
  ctx.fillStyle = g; ctx.fillRect(0, -DY, W, H + DY);
  // far cave wall with glowing crystals
  const off = S.cam * 0.15;
  for (let i = 0; i < 10; i++) {
    const x = ((i * 190 - off) % 1900 + 1900) % 1900 - 150, y = 120 + (i * 47) % 110, col = ['#36f4d0', '#ff5ad1', '#b48cff'][i % 3];
    ctx.save(); ctx.globalAlpha = 0.45 + Math.sin(S.t * 0.04 + i) * 0.15;
    const gl = ctx.createRadialGradient(x, y, 2, x, y, 40); gl.addColorStop(0, col); gl.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.8; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 10); ctx.lineTo(x - 7, y); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // stalactites hanging from the top
  const off2 = S.cam * 0.4;
  ctx.fillStyle = '#2a1c40';
  for (let i = 0; i < 16; i++) {
    const x = ((i * 97 - off2) % 1560 + 1560) % 1560 - 140, len = 40 + (i * 37) % 70;
    ctx.beginPath(); ctx.moveTo(x - 22, -DY); ctx.lineTo(x, -DY + len + DY * 0.25); ctx.lineTo(x + 22, -DY); ctx.closePath(); ctx.fill();
  }
  // middle: rock pillars with glowing mushrooms
  const off3 = S.cam * 0.32;
  for (let i = 0; i < 6; i++) {
    const x = ((i * 330 - off3) % 1980 + 1980) % 1980 - 160;
    ctx.fillStyle = '#2f2046'; ctx.beginPath(); ctx.moveTo(x - 40, H); ctx.lineTo(x - 26, 190); ctx.quadraticCurveTo(x, 170, x + 26, 190); ctx.lineTo(x + 40, H); ctx.closePath(); ctx.fill();
    drawMushroom(x + 20, 200 + (i % 2) * 30, 0.7, i % 2 ? '#ff5ad1' : '#36f4d0');
  }
}
function drawMushroom(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const gl = ctx.createRadialGradient(0, -20, 2, 0, -20, 46); gl.addColorStop(0, col); gl.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.35; ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, -20, 46, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = '#e8dcf4'; ctx.fillRect(-5, -20, 10, 20);
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -22, 22, 13, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(-8, -28, 3, 0, Math.PI * 2); ctx.arc(6, -30, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawGround() {
  const x0 = S.cam - 40, x1 = S.cam + W + 40;
  for (const [a, b] of GROUND) {
    if (b < x0 || a > x1) continue;
    const l = Math.max(a, x0), r = Math.min(b, x1);
    const g = ctx.createLinearGradient(0, FLOOR, 0, H + 40); g.addColorStop(0, CAVE); g.addColorStop(1, CAVE_D);
    ctx.fillStyle = g; ctx.fillRect(l, FLOOR - 4, r - l, H - FLOOR + 44);
    ctx.fillStyle = 'rgba(20,10,30,0.4)'; for (let x = Math.floor(l / 80) * 80; x < r; x += 80) { ctx.beginPath(); ctx.ellipse(x + 30, FLOOR + 20 + (x / 80 % 2) * 12, 16, 5, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#4fc49a'; ctx.fillRect(l, FLOOR - 6, r - l, 6);
    ctx.fillStyle = MOSS; for (let x = Math.floor(l / 26) * 26; x < r; x += 26) { ctx.beginPath(); ctx.arc(x + 8, FLOOR - 6, 3, Math.PI, 0); ctx.fill(); }
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(l, FLOOR - 6); ctx.lineTo(r, FLOOR - 6); ctx.stroke();
    ctx.fillStyle = CAVE_D;
    if (a > x0) { ctx.beginPath(); ctx.moveTo(a, FLOOR - 6); ctx.lineTo(a + 10, H + 40); ctx.lineTo(a, H + 40); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(a, FLOOR - 6); ctx.lineTo(a, H + 40); ctx.stroke(); }
    if (b < x1) { ctx.beginPath(); ctx.moveTo(b, FLOOR - 6); ctx.lineTo(b - 10, H + 40); ctx.lineTo(b, H + 40); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(b, FLOOR - 6); ctx.lineTo(b, H + 40); ctx.stroke(); }
  }
  // acid pools: bubbling green
  for (const [a, b] of HAZ) {
    if (b < x0 || a > x1) continue;
    ctx.save();
    const g = ctx.createLinearGradient(0, FLOOR - 8, 0, FLOOR + 14); g.addColorStop(0, '#b8ff6a'); g.addColorStop(1, '#3aa04a');
    ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse((a + b) / 2, FLOOR - 2, (b - a) / 2, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(230,255,200,0.9)';
    for (let i = 0; i < 4; i++) { const u = (S.t * 0.02 + i * 0.25) % 1; ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.arc(a + 20 + i * (b - a - 40) / 3, FLOOR - 4 - u * 22, 3 + u * 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    drawSign(a - 30, FLOOR - 56, '☠ ' + tx('SÄURE'), '#b8ff6a');
  }
  // the gorges: deep and dark
  for (let i = 0; i < GROUND.length - 1; i++) {
    const a = GROUND[i][1], b = GROUND[i + 1][0];
    if (b < x0 || a > x1) continue;
    ctx.fillStyle = 'rgba(5,2,10,0.85)'; ctx.fillRect(a, FLOOR - 4, b - a, H - FLOOR + 44);
  }
  // the worm holes in the middle-boss arena
  if (onScreen(MID.x, W)) for (const h of WURM_HOLES) {
    ctx.save(); ctx.fillStyle = '#0c0614'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(h, FLOOR - 2, 54, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a4a7a'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(h - 54 + i * 21.6, FLOOR - 6 + (i % 2) * 3, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
}
function drawPlat(p) {
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  let x = p.x, y = p.y;
  if (p.kind === 'crumble' && p.state === 'shake') x += Math.sin(S.t * 1.7) * 2.5;
  if (p.kind === 'move') {
    // a floating glowing crystal slab
    const gl = ctx.createLinearGradient(x, y, x + p.w, y + 14); gl.addColorStop(0, '#5ae6ff'); gl.addColorStop(1, '#b48cff');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + p.w, y); ctx.lineTo(x + p.w - 12, y + 16); ctx.lineTo(x + 12, y + 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + 10, y + 3, p.w * 0.3, 3);
  } else {
    // a big glowing mushroom cap (the rotten ones wobble and fall)
    const col = p.kind === 'crumble' ? '#9a7aa8' : '#ff5ad1';
    ctx.fillStyle = '#e8dcf4'; ctx.fillRect(x + p.w / 2 - 10, y + 10, 20, FLOOR - y - 10); ctx.strokeRect(x + p.w / 2 - 10, y + 10, 20, FLOOR - y - 10);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 6, y + 14); ctx.quadraticCurveTo(x - 4, y - 16, x + p.w / 2, y - 18); ctx.quadraticCurveTo(x + p.w + 4, y - 16, x + p.w + 6, y + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x + 18 + i * (p.w - 36) / 3, y - 4 + (i % 2) * 6, 4, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}
// a little slime worm
function drawWalker(c) {
  ctx.save(); ctx.translate(c.x, FLOOR);
  if (c.dead) { const u = Math.min(1, c.deadT / 14); ctx.globalAlpha = Math.max(0, 1 - c.deadT / 60); ctx.translate(0, -Math.sin(u * Math.PI) * 20); }
  ctx.scale(c.dir, 1); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  for (let i = 4; i >= 0; i--) {
    const sx = -i * 11, sy = -12 - Math.abs(Math.sin(c.t * 0.25 + i * 0.8)) * 6;
    ctx.fillStyle = i % 2 ? '#5ac46a' : '#7dff6a'; ctx.beginPath(); ctx.arc(sx, sy, 12 - i * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(4, -22, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(5.5, -22, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -12, 4, 0.3, Math.PI - 0.3); ctx.stroke();
  ctx.restore();
}
// a cave bat with glowing eyes
function drawFlyer(p) {
  ctx.save(); ctx.translate(p.x, p.y); if (p.dead) ctx.rotate(p.deadT * 0.2);
  ctx.scale(p.dir * (p.baby ? 0.65 : 1), p.baby ? 0.65 : 1); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  const angry = p.state === 'warn' || p.state === 'dive', f = Math.sin(p.t * (angry ? 0.45 : 0.3));
  ctx.fillStyle = '#5a3f8a';
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(sd * 20, -20 - f * 14, sd * 40, -8 - f * 18); ctx.lineTo(sd * 34, 2); ctx.lineTo(sd * 26, -2); ctx.lineTo(sd * 18, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#7a5aa8'; ctx.beginPath(); ctx.ellipse(0, 0, 13, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-8, -9); ctx.lineTo(-6, -18); ctx.lineTo(-2, -10); ctx.moveTo(8, -9); ctx.lineTo(6, -18); ctx.lineTo(2, -10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = angry ? '#ff5a4f' : '#ffd23a'; ctx.beginPath(); ctx.arc(-4, -2, 2.6, 0, Math.PI * 2); ctx.arc(5, -2, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-3, 5); ctx.lineTo(-1, 9); ctx.lineTo(1, 5); ctx.fill();
  ctx.restore();
}
// a drop of slime from the ceiling
function drawDrop(s) {
  ctx.save(); ctx.translate(s.x, s.y); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.fillStyle = '#7dff6a'; ctx.beginPath(); ctx.moveTo(0, -s.r * 1.6); ctx.quadraticCurveTo(s.r, 0, 0, s.r * 0.8); ctx.quadraticCurveTo(-s.r, 0, 0, -s.r * 1.6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(-s.r * 0.25, -s.r * 0.1, s.r * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawPuddle(p) {
  const a = Math.min(1, p.t / 20, (p.life - p.t) / 30);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#7dff6a'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(p.x, FLOOR - 2, p.w / 2, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
}
function drawWorldMid() {
  // the pipe up to Aurora 61 (left)
  if (onScreen(60, 220)) {
    ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    const g = ctx.createLinearGradient(110, 0, 206, 0); g.addColorStop(0, '#1f7a6a'); g.addColorStop(0.35, '#4fd1b5'); g.addColorStop(1, '#165c50');
    ctx.fillStyle = g; ctx.fillRect(118, -DY - 10, 80, FLOOR - 170 + DY); ctx.strokeRect(118, -DY - 10, 80, FLOOR - 170 + DY);
    ctx.beginPath(); ctx.roundRect(110, FLOOR - 190, 96, 20, 4); ctx.fill(); ctx.stroke();
    ctx.restore();
    drawSign(290, FLOOR - 70, '▲ ' + tx('AURORA 61'), '#7dffa0');
  }
  if (onScreen(MID.x - 60, 120) && !SAVE.mid.wurm) drawSign(MID.x + 60, FLOOR - 70, '⚠ ' + tx('MONDWURM'), '#c9a66b');
  // the cages with the elephants (boss arena)
  if (onScreen(CAGES[0] - 80, 400)) {
    const open = S.boss && S.boss.state === 'happy' && S.boss.t > 60 || SAVE.done.unter && !(S.boss && S.boss.state !== 'happy');
    for (let i = 0; i < CAGES.length; i++) {
      const x = CAGES[i], fr = S.freed && S.freed[i];
      if (!open) drawElephant(x, FLOOR - 4, 0.62, S.t, false, -1, true);
      ctx.save(); ctx.strokeStyle = '#4a3a5a'; ctx.lineWidth = 5;
      ctx.fillStyle = '#5a4a6a'; ctx.fillRect(x - 50, FLOOR - 120, 100, 10); ctx.fillRect(x - 50, FLOOR - 8, 100, 8);
      const doorUp = open ? Math.min(1, ((fr && fr.t) || 200) / 30) : 0;
      for (let j = 0; j < 6; j++) { const bx = x - 45 + j * 18; ctx.beginPath(); ctx.moveTo(bx, FLOOR - 110 - (j < 3 ? 0 : 0)); ctx.lineTo(bx, FLOOR - 8 - doorUp * 100); ctx.stroke(); }
      ctx.restore();
      if (open && fr) { const u = fr.t; drawElephant(x + Math.sin(u * 0.03 + i) * 60 * Math.min(1, u / 60), FLOOR - 4 - Math.min(220, u * 1.2) + Math.sin(u * 0.08 + i) * 10, 0.62, S.t, true, i % 2 ? 1 : -1, false); }
    }
  }
}
function drawWorldFront() {
  const m = S.mid;
  if (m && m.state !== 'gone' && m.y > 0) drawWurm(m);
  for (const c of S.clouds) drawRainCloud(c);
  if (S.boss) drawGrummel(S.boss);
}
function drawWurm(m) {
  const hx = WURM_HOLES[m.hole], top = FLOOR - 190 * m.y;
  ctx.save(); ctx.beginPath(); ctx.rect(hx - 120, -DY - 100, 240, FLOOR - 2 + DY + 100); ctx.clip();
  if (m.flash > 0 && Math.floor(m.flash / 4) % 2 === 0) ctx.globalAlpha = 0.55;
  ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  const sway = m.state === 'up' ? Math.sin(m.t * 0.06) * 18 : 0;
  // body segments down into the hole
  for (let i = 6; i >= 1; i--) {
    const sy = top + 40 + i * 30, sx = hx + sway * (1 - i / 7);
    ctx.fillStyle = i % 2 ? '#d8c8b0' : '#c9b89c'; ctx.beginPath(); ctx.ellipse(sx, sy, 44, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(120,100,80,0.4)'; ctx.beginPath(); ctx.arc(sx - 14, sy - 4, 5, 0, Math.PI * 2); ctx.arc(sx + 16, sy + 3, 4, 0, Math.PI * 2); ctx.fill();
  }
  // head (moon coloured, with craters)
  const hxs = hx + sway;
  ctx.fillStyle = '#e3d6c0'; ctx.beginPath(); ctx.arc(hxs, top + 30, 46, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(150,130,110,0.45)'; ctx.beginPath(); ctx.arc(hxs - 24, top + 8, 7, 0, Math.PI * 2); ctx.arc(hxs + 28, top + 14, 6, 0, Math.PI * 2); ctx.arc(hxs + 6, top - 4, 4, 0, Math.PI * 2); ctx.fill();
  const dead = m.state === 'dead';
  for (const sd of [-1, 1]) {
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(hxs + sd * 16, top + 22, 11, dead ? 2 : 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (!dead) { ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(hxs + sd * 16 + (S.kai.x > hx ? 3 : -3), top + 24, 5, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.fillStyle = '#5a2a3a'; ctx.beginPath(); ctx.ellipse(hxs, top + 52, 20, m.state === 'up' && m.spit < 14 ? 12 : 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawRainCloud(c) {
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  if (c.rain) { ctx.strokeStyle = 'rgba(140,180,255,0.75)'; ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { const x = c.x - 40 + i * 10, y0 = c.y + 18 + ((S.t * 9 + i * 23) % 60); ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x - 3, Math.min(FLOOR, y0 + (FLOOR - c.y))); ctx.stroke(); } ctx.strokeStyle = OUT; }
  ctx.fillStyle = '#4a4458';
  ctx.beginPath(); ctx.arc(c.x - 26, c.y + 4, 20, 0, Math.PI * 2); ctx.arc(c.x, c.y - 8, 26, 0, Math.PI * 2); ctx.arc(c.x + 28, c.y + 4, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(c.x - 9, c.y - 4, 3, 0, Math.PI * 2); ctx.arc(c.x + 9, c.y - 4, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(c.x, c.y + 10, 6, Math.PI + 0.4, -0.4); ctx.stroke();
  ctx.restore();
}
function drawGrummel(b) {
  const happy = b.state === 'happy', mix = happy ? Math.min(1, b.t / 60) : 0;
  ctx.save(); ctx.translate(b.x, b.y + Math.sin(S.t * 0.07) * 5); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  if (b.flash > 0 && Math.floor(b.flash / 4) % 2 === 0) ctx.globalAlpha = 0.55;
  // shadow on the ground while aiming the crash
  if (b.state === 'aim') { ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, FLOOR - b.y - 2, 60, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  // his dark cloud
  if (b.state !== 'sit') { ctx.fillStyle = happy ? '#ffffff' : '#3a3448'; ctx.beginPath(); ctx.arc(-44, 46, 22, 0, Math.PI * 2); ctx.arc(-10, 52, 26, 0, Math.PI * 2); ctx.arc(28, 48, 24, 0, Math.PI * 2); ctx.arc(54, 50, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  // fluffy round body (grey-purple → warm yellow when he laughs)
  const col = mix > 0 ? mixCol4('#7a6a92', '#ffc84a', mix) : '#7a6a92';
  ctx.fillStyle = col;
  ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = 54 + (i % 2) * 6; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.9); } ctx.closePath(); ctx.fill(); ctx.stroke();
  // little horns
  ctx.fillStyle = mix > 0.5 ? '#fff3c4' : '#5a4a72'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 22, -44); ctx.lineTo(sd * 30, -66); ctx.lineTo(sd * 38, -40); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // eyes + bushy eyebrows
  for (const sd of [-1, 1]) {
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(sd * 18, -10, 11, happy ? 4 : 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (!happy) { ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(sd * 18 + (S.kai.x > b.x ? 3 : -3), -8, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = mix > 0.5 ? '#c98a2a' : '#3a2c4a'; ctx.beginPath(); ctx.ellipse(sd * 20, happy ? -30 : -24, 16, 6, happy ? -sd * 0.2 : sd * 0.35, 0, Math.PI * 2); ctx.fill();
  }
  // mouth: a big frown – or a big laugh
  ctx.lineWidth = 4;
  if (happy) { ctx.fillStyle = '#8a2a2a'; ctx.beginPath(); ctx.arc(0, 14, 22, 0.1, Math.PI - 0.1); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ff7a8a'; ctx.beginPath(); ctx.arc(0, 28, 9, Math.PI, 0); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(0, 34, 18, Math.PI + 0.5, -0.5); ctx.stroke(); }
  ctx.lineWidth = 3;
  // arms
  ctx.fillStyle = col; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 60, 12 + (happy ? -20 : Math.sin(S.t * 0.1) * 4), 14, 9, sd * (happy ? -0.8 : 0.4), 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  if (happy) for (let i = 0; i < 6; i++) { const a = S.t * 0.05 + i; drawStar4(Math.cos(a) * 80, Math.sin(a) * 70, 5); }
  ctx.restore();
}
function drawStar4(x, y, r) { ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.moveTo(x, y - r * 2); ctx.lineTo(x + r * 0.5, y - r * 0.5); ctx.lineTo(x + r * 2, y); ctx.lineTo(x + r * 0.5, y + r * 0.5); ctx.lineTo(x, y + r * 2); ctx.lineTo(x - r * 0.5, y + r * 0.5); ctx.lineTo(x - r * 2, y); ctx.lineTo(x - r * 0.5, y - r * 0.5); ctx.closePath(); ctx.fill(); }
function mixCol4(a, b, u) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  return `rgb(${Math.round((pa >> 16) * (1 - u) + (pb >> 16) * u)},${Math.round(((pa >> 8) & 255) * (1 - u) + ((pb >> 8) & 255) * u)},${Math.round((pa & 255) * (1 - u) + (pb & 255) * u)})`;
}
// the darkness: a soft light around Kai (sun balls glow too)
function drawWorldTop() {
  const k = S.kai, sx = k.x - S.cam, sy = k.y - 60;
  ctx.save();
  const g = ctx.createRadialGradient(sx, sy, 80, sx, sy, 700);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(5,0,12,0.55)');
  ctx.fillStyle = g; ctx.fillRect(-20, -DY - 20, W + 40, H + DY + 40);
  ctx.restore();
}
function startPanel() {
  const touch = CTRL.touch;
  panel(tx('DIE UNTERWELT'), [
    touch ? tx('◀ ▶ = fahren · SPRUNG = springen · SCHUSS = Sonnenkugeln') : tx('← → = fahren · Leertaste = springen · X = Sonnenkugeln'),
    tx('Abu hat dir SONNENKUGELN mitgegeben – sie leuchten hier unten im Dunkeln.'),
    tx('Vorsicht: grüne Säure, tropfender Schleim, Schleimwürmer und Fledermäuse!'),
    tx('In der Mitte: der RIESEN-MONDWURM. Am Ende: GRUMMEL, der Glücksdieb.'),
    tx('Er hat die Elefanten von Aurora 61 eingesperrt. Befreie sie!'),
  ], '#b48cff');
  button(BTN.start, '▶  ' + tx('LOS GEHT\'S'), '#34c759', '#1f8f3c');
}
