
// ================= NEW DRAWINGS =================
function drawExplosion(e) {
  const t = e.t, x = e.x, y = e.y;
  ctx.save();
  // white flash
  if (t < 8) { ctx.globalAlpha = 1 - t / 8; ctx.fillStyle = '#fffbe6'; ctx.beginPath(); ctx.arc(x, y, 50 + t * 10, 0, Math.PI * 2); ctx.fill(); }
  // shockwave ring
  ctx.globalAlpha = Math.max(0, 1 - t / 35);
  ctx.strokeStyle = 'rgba(220,245,255,0.9)'; ctx.lineWidth = 4 * (1 - t / 35) + 1;
  ctx.beginPath(); ctx.arc(x, y, 20 + t * 5, 0, Math.PI * 2); ctx.stroke();
  // fireball: several blobs growing and fading from yellow → orange → dark smoke
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + i;
    const dist = Math.min(t, 25) * (1.1 + (i % 3) * 0.45);
    const bx = x + Math.cos(a) * dist, by = y + Math.sin(a) * dist - t * 0.4;
    const r = (22 + (i % 4) * 7) * Math.min(1, t / 6 + 0.3) * (1 + t / 50);
    const life = 1 - t / 70;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    if (t < 26) { g.addColorStop(0, `rgba(255,250,200,${life})`); g.addColorStop(0.4, `rgba(255,190,60,${life})`); g.addColorStop(1, `rgba(230,80,20,0)`); }
    else { g.addColorStop(0, `rgba(70,80,95,${life * 0.7})`); g.addColorStop(1, 'rgba(40,50,60,0)'); }
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawHarpoon(h) {
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.rot || 0); ctx.lineCap = 'round';
  ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(34, 0); ctx.stroke();
  ctx.strokeStyle = '#a0703a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(34, 0); ctx.stroke();
  ctx.fillStyle = '#d8dee6'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(34, -5); ctx.lineTo(48, 0); ctx.lineTo(34, 5); ctx.lineTo(37, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(30, -2); ctx.lineTo(26, -7); ctx.moveTo(30, 2); ctx.lineTo(26, 7); ctx.stroke();
  ctx.fillStyle = '#e8463c'; ctx.fillRect(-8, -3, 6, 6);
  ctx.globalAlpha = 0.5; ctx.strokeStyle = '#dff6ff'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-10, -3); ctx.lineTo(-40, -3); ctx.moveTo(-10, 3); ctx.lineTo(-30, 3); ctx.stroke();
  ctx.restore();
}

function drawTurboItem(o) {
  const { x, y } = o; const pulse = 1 + Math.sin(S.t * 0.2) * 0.08;
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, 4, x, y, 60);
  glow.addColorStop(0, 'rgba(255,230,80,0.55)'); glow.addColorStop(1, 'rgba(255,230,80,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 60, 0, Math.PI * 2); ctx.fill();
  // rotating rays
  ctx.translate(x, y); ctx.rotate(S.t * 0.03);
  ctx.fillStyle = 'rgba(255,240,150,0.35)';
  for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(5, -44); ctx.lineTo(-5, -44); ctx.closePath(); ctx.fill(); }
  ctx.rotate(-S.t * 0.03); ctx.scale(pulse, pulse);
  // bubble shell
  ctx.fillStyle = 'rgba(255,215,60,0.9)'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff6c2'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
  // lightning bolt
  ctx.fillStyle = '#ff8a00'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(3, -14); ctx.lineTo(-8, 2); ctx.lineTo(-1, 2); ctx.lineTo(-4, 14); ctx.lineTo(8, -3); ctx.lineTo(1, -3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-9, -10, 5, 2.5, -0.7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
  ctx.strokeText('TURBO', x, y + 40); ctx.fillText('TURBO', x, y + 40); ctx.textAlign = 'left';
}

function drawPearl(o) {
  const { x, y } = o;
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 20);
  glow.addColorStop(0, 'rgba(255,255,255,0.45)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 9);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#e3e9f5'); g.addColorStop(1, '#b8c4da');
  ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 3, y - 3, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawWhale(wh) {
  const x = wh.x, y = wh.y + Math.sin(wh.p) * 5;
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  const tail = Math.sin(wh.p * 2) * 14;
  // tail fluke (right side, whale faces left)
  ctx.fillStyle = '#3f74b8';
  ctx.beginPath(); ctx.moveTo(170, 0);
  ctx.quadraticCurveTo(205, -10 + tail * 0.5, 235, -38 + tail);
  ctx.quadraticCurveTo(222, -6 + tail * 0.5, 240, 18 + tail);
  ctx.quadraticCurveTo(205, 12 + tail * 0.4, 170, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
  // body
  const g = ctx.createLinearGradient(0, -70, 0, 60);
  g.addColorStop(0, '#5b93d6'); g.addColorStop(1, '#2f5f9e');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-150, 10);
  ctx.bezierCurveTo(-155, -55, -60, -78, 40, -62);
  ctx.bezierCurveTo(120, -50, 160, -20, 178, 4);
  ctx.bezierCurveTo(150, 30, 90, 52, 10, 54);
  ctx.bezierCurveTo(-90, 56, -148, 46, -150, 10);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // belly with grooves
  ctx.fillStyle = '#e7eef6';
  ctx.beginPath(); ctx.moveTo(-146, 22); ctx.bezierCurveTo(-110, 52, -10, 58, 90, 40); ctx.bezierCurveTo(30, 30, -80, 30, -146, 22); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(80,110,150,0.6)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-130 + i * 8, 28 + i * 2); ctx.quadraticCurveTo(-60 + i * 10, 42 + i, 20 + i * 8, 38 + i); ctx.stroke(); }
  ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  // flipper
  const fl = Math.sin(wh.p * 1.5) * 0.2;
  ctx.save(); ctx.translate(-50, 30); ctx.rotate(0.4 + fl);
  ctx.fillStyle = '#3a6cae'; ctx.beginPath(); ctx.ellipse(10, 18, 13, 30, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  // mouth & smile
  ctx.beginPath(); ctx.moveTo(-148, 14); ctx.quadraticCurveTo(-110, 24, -80, 16); ctx.stroke();
  // eye
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(-100, -8, 9, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(-103, -7, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-101.5, -9, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,140,150,0.45)'; ctx.beginPath(); ctx.ellipse(-90, 6, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
  // spots + highlight
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (const [sx, sy, sr] of [[0, -40, 6], [30, -48, 4], [60, -36, 5], [-30, -52, 4]]) { ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(-60, -50, 40, 8, -0.15, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // speech bubble with YES / NO buttons
  if (S.phase === 'whaleAsk') {
    const txt = tx('Hallo Kai! Spielen wir Memory?');
    ctx.save(); ctx.font = 'bold 15px Arial'; const tw = ctx.measureText(txt).width;
    const bw = tw + 30, bh = 78, bx = x - 350, by = y - 138;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + bw - 90, by + bh); ctx.lineTo(bx + bw - 60, by + bh + 22); ctx.lineTo(bx + bw - 66, by + bh); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(bx + bw - 89, by + bh - 3, 22, 5);
    ctx.fillStyle = OUT; ctx.textBaseline = 'middle'; ctx.fillText(txt, bx + 15, by + 22);
    BTN.yes.x = bx + bw / 2 - 80; BTN.yes.y = by + 40;
    BTN.no.x = bx + bw / 2 + 10; BTN.no.y = by + 40;
    for (const [btn, label, c1, c2] of [[BTN.yes, tx('JA'), '#34c759', '#1f8f3c'], [BTN.no, tx('NEIN'), '#ff5a4f', '#c0352c']]) {
      const g = ctx.createLinearGradient(0, btn.y, 0, btn.y + btn.h); g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText(label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1); ctx.textAlign = 'left';
    }
    ctx.restore();
  }
}

// ---- memory card icons ----
function drawIcon(icon, cx, cy) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
  if (icon === 'star') drawStar({ x: cx, y: cy, p: 0 });
  else if (icon === 'pearl') { ctx.translate(cx, cy); ctx.scale(2, 2); drawPearl({ x: 0, y: 0 }); }
  else if (icon === 'jelly') { ctx.translate(cx, cy - 6); ctx.scale(0.85, 0.85); drawJelly({ x: 0, y: 0, p: S.t * 0.02 }); }
  else if (icon === 'fish') {
    ctx.translate(cx, cy);
    ctx.fillStyle = '#ff8c2a';
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(24, -11); ctx.lineTo(24, 11); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-2, 0, 18, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-4, -11); ctx.quadraticCurveTo(0, 0, -4, 11); ctx.lineTo(2, 11); ctx.quadraticCurveTo(6, 0, 2, -11); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(-12, -3, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (icon === 'crab') {
    ctx.translate(cx, cy + 4);
    ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(s * 10, 4 + i * 3); ctx.lineTo(s * 22, 8 + i * 5); ctx.stroke(); }
    ctx.fillStyle = '#e8463c'; ctx.lineWidth = 2.2;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 12, -4); ctx.lineTo(s * 18, -14); ctx.stroke(); ctx.beginPath(); ctx.arc(s * 20, -18, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, 2, 16, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (const s of [-1, 1]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * 5, -10, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(s * 5, -10, 1.5, 0, Math.PI * 2); ctx.fill(); }
  } else if (icon === 'seahorse') {
    ctx.translate(cx, cy);
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.moveTo(-2, -24); ctx.quadraticCurveTo(12, -26, 12, -16); ctx.lineTo(20, -14); ctx.lineTo(19, -9); ctx.lineTo(10, -10);
    ctx.quadraticCurveTo(14, 0, 8, 10); ctx.quadraticCurveTo(2, 22, -6, 20); ctx.quadraticCurveTo(-14, 16, -8, 10); ctx.quadraticCurveTo(-4, 14, -2, 10);
    ctx.quadraticCurveTo(-10, 0, -8, -12); ctx.quadraticCurveTo(-8, -22, -2, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e09b2d'; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-15, -2); ctx.lineTo(-8, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(3, -18, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(20,32,46,0.5)'; ctx.lineWidth = 1.2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-6, -6 + i * 5); ctx.lineTo(6, -7 + i * 5); ctx.stroke(); }
  } else if (icon === 'shell') {
    // scallop shell
    ctx.translate(cx, cy + 4); ctx.fillStyle = '#ffb38a';
    ctx.beginPath(); ctx.moveTo(-6, 14); ctx.lineTo(6, 14); ctx.lineTo(9, 8); ctx.quadraticCurveTo(24, -2, 18, -14); ctx.quadraticCurveTo(0, -28, -18, -14); ctx.quadraticCurveTo(-24, -2, -9, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(160,70,40,0.7)'; ctx.lineWidth = 1.6; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(i * 8, -18 + Math.abs(i) * 3); ctx.stroke(); }
  } else if (icon === 'turtle') {
    ctx.translate(cx, cy);
    ctx.fillStyle = '#7cc46a';
    for (const [fx, fy] of [[-16, 10], [14, 10], [-16, -8], [14, -8]]) { ctx.beginPath(); ctx.ellipse(fx, fy, 7, 4, fx < 0 ? -0.5 : 0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(22, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(24, -2, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f8a3a'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(0, -10); ctx.lineTo(10, -6); ctx.lineTo(10, 6); ctx.lineTo(0, 10); ctx.lineTo(-10, 6); ctx.closePath(); ctx.stroke();
  } else if (icon === 'octo') {
    ctx.translate(cx, cy); ctx.fillStyle = '#b06ad8';
    for (let i = 0; i < 5; i++) { const x0 = -14 + i * 7; ctx.beginPath(); ctx.moveTo(x0 - 3, 2); ctx.quadraticCurveTo(x0 - 6, 14, x0 + 1, 20); ctx.quadraticCurveTo(x0 + 3, 12, x0 + 4, 2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, -6, 16, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (const s of [-1, 1]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * 6, -6, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(s * 6, -5, 1.8, 0, Math.PI * 2); ctx.fill(); }
  } else if (icon === 'anchor') {
    ctx.translate(cx, cy); ctx.strokeStyle = OUT; ctx.lineWidth = 7;
    const draw = () => { ctx.beginPath(); ctx.arc(0, -18, 5, 0, Math.PI * 2); ctx.moveTo(0, -13); ctx.lineTo(0, 18); ctx.moveTo(-10, -6); ctx.lineTo(10, -6); ctx.moveTo(-18, 6); ctx.quadraticCurveTo(-14, 20, 0, 20); ctx.quadraticCurveTo(14, 20, 18, 6); ctx.stroke(); };
    draw(); ctx.strokeStyle = '#8fa3b8'; ctx.lineWidth = 3.5; draw();
  } else if (icon === 'coral') {
    ctx.translate(cx, cy + 14); ctx.strokeStyle = OUT; ctx.lineCap = 'round';
    const branch = () => { ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -16); ctx.moveTo(0, -4); ctx.quadraticCurveTo(-12, -8, -12, -24); ctx.moveTo(0, -10); ctx.quadraticCurveTo(12, -12, 12, -28); ctx.moveTo(-6, -8); ctx.lineTo(-16, -14); ctx.moveTo(7, -14); ctx.lineTo(16, -18); ctx.stroke(); };
    ctx.lineWidth = 8; branch(); ctx.strokeStyle = '#ff6f7d'; ctx.lineWidth = 4.5; branch();
  } else if (icon === 'whale') {
    ctx.translate(cx, cy + 2); ctx.fillStyle = '#4a86c8';
    ctx.beginPath(); ctx.moveTo(-22, -2); ctx.quadraticCurveTo(-22, -16, 0, -16); ctx.quadraticCurveTo(18, -16, 18, 0); ctx.lineTo(26, -10); ctx.lineTo(28, 6); ctx.lineTo(18, 4); ctx.quadraticCurveTo(12, 12, -6, 12); ctx.quadraticCurveTo(-22, 12, -22, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#cfe6f7'; ctx.beginPath(); ctx.moveTo(-20, 2); ctx.quadraticCurveTo(-6, 12, 12, 4); ctx.quadraticCurveTo(-2, 8, -20, 2); ctx.fill();
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(-12, -4, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7fd6ef'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -17); ctx.quadraticCurveTo(-8, -26, -12, -24); ctx.moveTo(-4, -17); ctx.quadraticCurveTo(0, -27, 4, -24); ctx.stroke();
  }
  ctx.restore();
}

function drawMemory() {
  const m = S.memory, L = m.L;
  ctx.save();
  ctx.fillStyle = 'rgba(2,16,34,0.72)'; ctx.fillRect(0, -VH, W, 3 * VH);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px Arial';
  ctx.fillText(tx('WAL-MEMORY') + '  ·  ' + L.rows + ' × 6', W / 2, L.y0 - 34);
  ctx.font = 'bold 13px Arial'; ctx.fillStyle = '#bfe6ff';
  ctx.fillText(m.done ? m.result : tx('Finde alle Paare!   Paare: {p}/{n}   ·   Züge: {m}   ·   jedes Paar = +2 Seesterne', { p: m.pairs, n: m.n, m: m.moves }), W / 2, L.y0 - 12);
  for (let i = 0; i < m.cards.length; i++) {
    const c = m.cards[i], r = memRect(L, i), x = r.x, y = r.y;
    const cx = x + L.cw / 2, cy = y + L.ch / 2;
    const f = c.flip; const sx = Math.abs(Math.cos(f * Math.PI));
    const front = f > 0.5;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(Math.max(0.02, sx), 1); ctx.translate(-cx, -cy);
    ctx.lineWidth = 3; ctx.strokeStyle = c.found ? '#ffd25a' : OUT;
    if (front) {
      const g = ctx.createLinearGradient(0, y, 0, y + L.ch); g.addColorStop(0, '#e9f8ff'); g.addColorStop(1, '#b9e3f7');
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, L.cw, L.ch, 10); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(cx, cy); ctx.scale(L.scale, L.scale); drawIcon(c.icon, 0, 0); ctx.restore();
    } else {
      const g = ctx.createLinearGradient(0, y, 0, y + L.ch); g.addColorStop(0, '#2c7fc2'); g.addColorStop(1, '#174f86');
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, L.cw, L.ch, 10); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
      for (let w = 0; w < 3; w++) { ctx.beginPath(); for (let px = 0; px <= L.cw - 20; px += 4) { const yy = y + L.ch * (0.3 + w * 0.19) + Math.sin(px * 0.25) * 3; px ? ctx.lineTo(x + 10 + px, yy) : ctx.moveTo(x + 10 + px, yy); } ctx.stroke(); }
      if (L.ch > 60) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = 'bold 10px Arial'; ctx.fillText('INVERT', cx, y + L.ch - 10); }
    }
    ctx.restore();
  }
  if (!m.done) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(SKIP_BTN.x, SKIP_BTN.y, SKIP_BTN.w, SKIP_BTN.h, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.fillText(tx('Überspringen'), W / 2, SKIP_BTN.y + 18);
  }
  ctx.restore();
}
// choose the size: 2×6 (standard), 3×6, 4×6
function drawMemoryPick() {
  ctx.save(); ctx.fillStyle = 'rgba(2,16,34,0.72)'; ctx.fillRect(0, -VH, W, 3 * VH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px Arial'; ctx.fillText(tx('WAL-MEMORY'), W / 2, 80);
  ctx.font = 'bold 14px Arial'; ctx.fillStyle = '#bfe6ff'; ctx.fillText(tx('Wie viele Karten?'), W / 2, 112);
  for (const b of memPickBtns()) {
    const std = b.r === 2;
    const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h); g.addColorStop(0, std ? '#34c759' : '#36a8f4'); g.addColorStop(1, std ? '#1f8f3c' : '#1677a8');
    ctx.fillStyle = g; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 14); ctx.fill(); ctx.stroke();
    // tiny card grid preview
    for (let r = 0; r < b.r; r++) for (let c = 0; c < 6; c++) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(b.x + 14 + c * 9, b.y + 32 - b.r * 5 + r * 10, 7, 8); }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'left'; ctx.fillText(b.r + ' × 6', b.x + 82, b.y + (std ? 24 : 32));
    if (std) { ctx.font = 'bold 12px Arial'; ctx.fillText(tx('Standard'), b.x + 82, b.y + 46); }
    ctx.font = '11px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.textAlign = 'right'; ctx.fillText(tx('{n} Paare', { n: b.r * 3 }), b.x + b.w - 12, b.y + b.h - 12);
    ctx.textAlign = 'center';
  }
  ctx.restore();
}
// after a game: again or go on
function drawMemoryEnd() {
  ctx.save(); ctx.fillStyle = 'rgba(2,16,34,0.72)'; ctx.fillRect(0, -VH, W, 3 * VH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px Arial'; ctx.fillText(tx('WAL-MEMORY'), W / 2, 100);
  ctx.font = 'bold 15px Arial'; ctx.fillStyle = '#ffe14d'; ctx.fillText(S.memLast || tx('Noch einmal?'), W / 2, 140);
  for (const [b, label, c1, c2] of [[MEM_END.again, tx('NOCHMAL SPIELEN'), '#36a8f4', '#1677a8'], [MEM_END.done, tx('WEITER'), '#34c759', '#1f8f3c']]) {
    const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h); g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Arial'; ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1);
  }
  ctx.restore();
}

function drawSpeedLines() {
  ctx.save(); ctx.lineCap = 'round';
  for (const l of S.speedLines) {
    const g = ctx.createLinearGradient(l.x, 0, l.x + l.len, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x + l.len, l.y); ctx.stroke();
  }
  ctx.restore();
}

function drawKaiTurboGlow() {
  if (S.turbo <= 0) return;
  const k = S.kai;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(k.x, k.y - 45, 10, k.x, k.y - 45, 80);
  g.addColorStop(0, 'rgba(255,220,80,0.35)'); g.addColorStop(1, 'rgba(255,220,80,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(k.x, k.y - 45, 80, 0, Math.PI * 2); ctx.fill();
  // jet trail behind the propeller
  const tg = ctx.createLinearGradient(k.x - 160, 0, k.x - 55, 0);
  tg.addColorStop(0, 'rgba(255,200,60,0)'); tg.addColorStop(1, 'rgba(255,240,180,0.6)');
  ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(k.x - 55, k.y - 16); ctx.lineTo(k.x - 160, k.y - 9 + Math.sin(S.t) * 3); ctx.lineTo(k.x - 55, k.y - 2); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ---- HUD with music / sound buttons and shoot button ----
function drawNoteIcon(x, y, on) {
  ctx.save(); ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x - 4, y + 6, 4, 3, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 6, y + 4, 4, 3, -0.4, 0, Math.PI * 2); ctx.fill();
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

function drawHeart(cx, cy, r, full) {
  ctx.save(); ctx.translate(cx, cy); ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.9);
  ctx.bezierCurveTo(-r * 1.3, -r * 0.1, -r * 0.9, -r * 1.1, 0, -r * 0.45);
  ctx.bezierCurveTo(r * 0.9, -r * 1.1, r * 1.3, -r * 0.1, 0, r * 0.9);
  ctx.closePath();
  ctx.fillStyle = full ? '#ff3b5c' : 'rgba(255,255,255,0.15)'; ctx.fill();
  ctx.strokeStyle = full ? OUT : 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.8; ctx.stroke();
  if (full) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.35, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
function drawHUD() {
  const x = 18, y = 16, w = 220, h = 18;
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(2,20,40,0.65)'; ctx.beginPath(); ctx.roundRect(x - 6, y - 6, w + 70, h + 12, 10); ctx.fill();
  ctx.fillStyle = '#bff4ff'; ctx.font = 'bold 13px Arial'; ctx.fillText('O₂', x + 2, y + h / 2 + 1);
  const bx = x + 30;
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.roundRect(bx, y, w, h, 9); ctx.fill();
  const pct = S.oxygen / 100;
  const g = ctx.createLinearGradient(bx, 0, bx + w, 0);
  if (pct > 0.3) { g.addColorStop(0, '#36c6f4'); g.addColorStop(1, '#a5f0ff'); } else { g.addColorStop(0, '#ff3b30'); g.addColorStop(1, '#ff9f5a'); }
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(bx, y, Math.max(h, w * pct), h, 9); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.roundRect(bx + 4, y + 3, Math.max(4, w * pct - 8), 4, 2); ctx.fill();
  ctx.fillStyle = S.oxygen <= 0 && Math.sin(S.t * 0.4) > 0 ? '#ff5a4f' : '#ffffff'; ctx.font = 'bold 11px Arial'; ctx.fillText(Math.ceil(S.oxygen) + '%', bx + w + 8, y + h / 2 + 1);

  // hearts (no upper limit – compact display when there are many)
  {
    const hy = 46, n = S.hearts;
    const show = Math.min(n, 8);
    const boxW = n > 8 ? 120 : Math.max(60, show * 22 + 16);
    ctx.fillStyle = S.heartFlash > 0 ? 'rgba(120,10,20,0.8)' : S.heartFlash < 0 ? 'rgba(120,90,10,0.8)' : 'rgba(2,20,40,0.65)';
    ctx.beginPath(); ctx.roundRect(x - 6, hy - 4, boxW, 26, 10); ctx.fill();
    if (n > 8) { drawHeart(x + 10, hy + 9, 9, true); ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.fillText('× ' + n, x + 26, hy + 10); }
    else for (let i = 0; i < Math.max(show, 1); i++) drawHeart(x + 10 + i * 22, hy + 9, 9, i < n);
  }
  drawProgressBox(12, 76);
  // turbo timer
  if (S.turbo > 0) {
    const ty = 108, tw = 220 * (S.turbo / TURBO_FRAMES);
    ctx.fillStyle = 'rgba(2,20,40,0.65)'; ctx.beginPath(); ctx.roundRect(x - 6, ty - 4, w + 70, 22, 10); ctx.fill();
    ctx.fillStyle = '#ffe14d'; ctx.font = 'bold 11px Arial'; ctx.fillText('TURBO ' + Math.ceil(S.turbo / 60) + ' s', x, ty + 7);
    const tg = ctx.createLinearGradient(bx + 20, 0, bx + 240, 0); tg.addColorStop(0, '#ff8a00'); tg.addColorStop(1, '#ffe14d');
    ctx.fillStyle = tg; ctx.beginPath(); ctx.roundRect(bx + 20, ty, Math.max(6, tw), 14, 7); ctx.fill();
  }

  // music + sound buttons
  for (const [b, on, icon] of [[BTN.music, Audio.musicOn, drawNoteIcon], [BTN.sfx, Audio.sfxOn, drawSpeakerIcon]]) {
    ctx.fillStyle = on ? 'rgba(2,20,40,0.65)' : 'rgba(80,10,10,0.7)';
    ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 9); ctx.fill();
    icon(b.x + b.w / 2 - 1, b.y + b.h / 2, on);
  }

  // collectibles
  ctx.fillStyle = 'rgba(2,20,40,0.65)'; ctx.beginPath(); ctx.roundRect(W - 168, 10, 156, 30, 10); ctx.fill();
  drawStar({ x: W - 148, y: 25, p: 0 });
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.fillText('× ' + S.stars, W - 128, 26);
  drawPearl({ x: W - 68, y: 25 });
  ctx.fillStyle = '#fff'; ctx.fillText('× ' + S.pearls, W - 54, 26);

  // level progress towards the giant squid
  if (S.phase === 'play' || S.phase === 'whaleAsk' || S.phase === 'memory') drawProgress();
  if (S.phase === 'boss' && S.boss) drawBossHP();
  ctx.textAlign = 'center';
  if (S.msgTimer > 0) {
    ctx.globalAlpha = Math.min(1, S.msgTimer / 20);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.font = 'bold 26px Arial';
    ctx.strokeText(S.msg, W / 2, 100); ctx.fillText(S.msg, W / 2, 100);
    ctx.globalAlpha = 1;
  }

  // how to shoot (only while shooting is possible)
  if (canShoot() && S.phase !== 'memory' && !isTouch) {
    const t = tx('Rechtsklick / X = schießen');
    ctx.textAlign = 'right'; ctx.font = 'bold 14px Arial';
    const tw = ctx.measureText(t).width;
    ctx.fillStyle = 'rgba(160,30,20,0.85)'; ctx.beginPath(); ctx.roundRect(W - tw - 164, H - 44, tw + 22, 30, 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(t, W - 153, H - 28);
  }
  ctx.restore();
}

