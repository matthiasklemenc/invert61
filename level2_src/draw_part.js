// ---------- drawing: background ----------
function drawBackground() {
  const g = ctx.createLinearGradient(0, -DY, 0, H);
  const k0 = DY / VH;
  g.addColorStop(0, '#3fb6e0'); g.addColorStop(k0 || 0.001, '#1a8fbf'); g.addColorStop(k0 + (1 - k0) * 0.35, '#0d5f8f'); g.addColorStop(k0 + (1 - k0) * 0.75, '#063a62'); g.addColorStop(1, '#03213b');
  ctx.fillStyle = g; ctx.fillRect(0, -DY, W, VH);

  // surface shimmer
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#bff0ff';
  ctx.beginPath(); ctx.moveTo(0, -DY);
  for (let x = 0; x <= W; x += 20) ctx.lineTo(x, -DY + 8 + Math.sin(x * 0.02 + S.t * 0.05) * 4 + Math.sin(x * 0.047 - S.t * 0.03) * 3);
  ctx.lineTo(W, -DY); ctx.fill();
  ctx.restore();

  // god rays
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) {
    const baseX = ((i * 230 - S.scroll * 0.08) % (W + 300) + W + 300) % (W + 300) - 150;
    const sway = Math.sin(S.t * 0.01 + i * 1.7) * 30;
    const w = 40 + (i % 3) * 25;
    const rg = ctx.createLinearGradient(0, -DY, 0, H);
    rg.addColorStop(0, 'rgba(180,240,255,0.16)'); rg.addColorStop(1, 'rgba(180,240,255,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(baseX, -DY); ctx.lineTo(baseX + w, -DY);
    ctx.lineTo(baseX + w + 120 + sway, H); ctx.lineTo(baseX + 60 + sway, H);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // far rocks (parallax 0.15)
  drawRockLayer(0.15, 230, 60, '#0a4166', 0.9, 11);
  // background fish school
  for (const f of S.fish) drawSmallFish(f.x, f.y, f.s, f.p, 'rgba(8,48,80,0.75)');
  // mid rocks & kelp (parallax 0.4)
  drawRockLayer(0.4, 265, 45, '#07314f', 1, 23);
  drawKelpLayer(0.55, '#1f7a5a', '#145a43', 0.9, 31);
  // marine snow
  ctx.fillStyle = 'rgba(220,245,255,0.45)';
  for (const s of S.snow) { ctx.beginPath(); ctx.arc(s.x, s.y + Math.sin(S.t * 0.02 + s.p) * 2, s.r, 0, Math.PI * 2); ctx.fill(); }
}

function seeded(n) { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }

function drawRockLayer(par, baseY, amp, color, alpha, seed) {
  const off = S.scroll * par;
  const seg = 160;
  const start = Math.floor(off / seg) - 1;
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(-10, H);
  for (let i = start; i < start + W / seg + 3; i++) {
    const x = i * seg - off;
    const h = seeded(i + seed) * amp;
    const h2 = seeded(i + seed + 0.5) * amp * 0.7;
    ctx.lineTo(x, baseY - h);
    ctx.quadraticCurveTo(x + seg * 0.5, baseY - h - 18 - h2, x + seg, baseY - seeded(i + 1 + seed) * amp);
  }
  ctx.lineTo(W + 10, H); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawKelpLayer(par, c1, c2, alpha, seed) {
  const off = S.scroll * par;
  const seg = 110;
  const start = Math.floor(off / seg) - 1;
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round';
  for (let i = start; i < start + W / seg + 3; i++) {
    if (seeded(i + seed) < 0.35) continue;
    const x = i * seg - off + seeded(i * 3 + seed) * 60;
    const h = 60 + seeded(i * 7 + seed) * 120;
    const strands = 2 + Math.floor(seeded(i * 5 + seed) * 3);
    for (let s = 0; s < strands; s++) {
      const sx = x + s * 9;
      ctx.strokeStyle = s % 2 ? c2 : c1; ctx.lineWidth = 6 - s;
      ctx.beginPath(); ctx.moveTo(sx, FLOOR + 4);
      for (let y = 0; y <= h; y += 10) {
        const sw = Math.sin(S.t * 0.03 + y * 0.04 + i + s) * (y * 0.12);
        ctx.lineTo(sx + sw, FLOOR + 4 - y);
      }
      ctx.stroke();
      // leaves
      ctx.fillStyle = s % 2 ? c2 : c1;
      for (let y = 25; y < h; y += 26) {
        const sw = Math.sin(S.t * 0.03 + y * 0.04 + i + s) * (y * 0.12);
        ctx.beginPath(); ctx.ellipse(sx + sw + 6, FLOOR - y, 8, 3, -0.5 + Math.sin(S.t * 0.04 + y) * 0.2, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawSmallFish(x, y, s, p, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(-s, s); ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
  const tw = Math.sin(p) * 3;
  ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(22, -6 + tw); ctx.lineTo(22, 6 + tw); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawFloor() {
  const off = S.scroll;
  const g = ctx.createLinearGradient(0, FLOOR - 10, 0, H);
  g.addColorStop(0, '#d9c48f'); g.addColorStop(0.3, '#b9a36f'); g.addColorStop(1, '#6f6a4f');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 16) ctx.lineTo(x, FLOOR + 2 + Math.sin((x + off) * 0.015) * 3 + Math.sin((x + off) * 0.041) * 1.5);
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 16) { const y = FLOOR + 2 + Math.sin((x + off) * 0.015) * 3 + Math.sin((x + off) * 0.041) * 1.5; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke();
  // ripples
  ctx.strokeStyle = 'rgba(120,100,60,0.45)'; ctx.lineWidth = 1.5;
  for (let r = 0; r < 3; r++) {
    const y = FLOOR + 12 + r * 9;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 12) { const yy = y + Math.sin((x + off) * 0.06 + r) * 2; x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }
    ctx.stroke();
  }
  // caustic light on sand
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,255,220,0.07)';
  for (let i = 0; i < 18; i++) {
    const x = ((i * 83 - off * 0.9 + Math.sin(S.t * 0.02 + i) * 20) % W + W) % W;
    ctx.beginPath(); ctx.ellipse(x, FLOOR + 14 + (i % 3) * 7, 22, 4, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // pebbles
  const seg = 70, start = Math.floor(off / seg) - 1;
  for (let i = start; i < start + W / seg + 2; i++) {
    if (seeded(i + 5) < 0.5) continue;
    const x = i * seg - off + seeded(i * 2) * 40;
    ctx.fillStyle = seeded(i) > 0.5 ? '#8b8a7a' : '#a39276';
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(x, FLOOR + 6, 5 + seeded(i * 9) * 5, 3 + seeded(i * 4) * 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
}

// ---------- drawing: objects ----------
function drawMine(o) {
  const { x, y } = o;
  // chain to the sea floor
  ctx.strokeStyle = '#2a3a48'; ctx.lineWidth = 2;
  for (let cy = y + 22; cy < FLOOR; cy += 8) { ctx.beginPath(); ctx.ellipse(x + Math.sin(o.p + cy * 0.02) * 2, cy + 4, 2.5, 4, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = '#3b4652'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(x - 12, FLOOR - 6, 24, 10, 3); ctx.fill(); ctx.stroke();
  // spikes
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2 + 0.2;
    const sx = x + Math.cos(a) * 20, sy = y + Math.sin(a) * 20;
    const ex = x + Math.cos(a) * 31, ey = y + Math.sin(a) * 31;
    ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = '#6b7884'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.fillStyle = '#c4a35a'; ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fill();
  }
  const g = ctx.createRadialGradient(x - 8, y - 9, 3, x, y, 24);
  g.addColorStop(0, '#7d8a96'); g.addColorStop(0.5, '#46525e'); g.addColorStop(1, '#1f2933');
  ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // belt + rivets
  ctx.strokeStyle = 'rgba(20,32,46,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, 22, 6, 0, 0, Math.PI); ctx.stroke();
  ctx.fillStyle = '#9aa6b1';
  for (let i = 0; i < 5; i++) { const a = 0.3 + i * 0.6; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 21, y + Math.sin(a) * 5.5, 1.5, 0, Math.PI * 2); ctx.fill(); }
  // blinking warning light
  const on = Math.sin(S.t * 0.15) > 0.3;
  ctx.fillStyle = on ? '#ff3b30' : '#6b1d1a';
  if (on) { ctx.shadowColor = '#ff3b30'; ctx.shadowBlur = 16; }
  ctx.beginPath(); ctx.arc(x, y - 24, 4, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x - 8, y - 9, 6, 3.5, -0.6, 0, Math.PI * 2); ctx.fill();
}

function drawJelly(o) {
  const { x, y } = o;
  const pulse = Math.sin(o.p * 3);
  const bw = 24 + pulse * 3, bh = 20 - pulse * 2;
  ctx.save();
  // glow
  const glow = ctx.createRadialGradient(x, y, 4, x, y, 55);
  glow.addColorStop(0, 'rgba(240,140,255,0.35)'); glow.addColorStop(1, 'rgba(240,140,255,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 55, 0, Math.PI * 2); ctx.fill();
  // tentacles
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const tX = x - bw * 0.7 + i * (bw * 1.4 / 5);
    ctx.strokeStyle = i % 2 ? 'rgba(255,170,235,0.85)' : 'rgba(210,140,255,0.85)';
    ctx.lineWidth = i % 2 ? 2 : 3;
    ctx.beginPath(); ctx.moveTo(tX, y + 2);
    for (let s = 1; s <= 8; s++) ctx.lineTo(tX + Math.sin(o.p * 4 + s * 0.8 + i) * (2 + s * 0.8), y + 2 + s * 6);
    ctx.stroke();
  }
  // bell
  const g = ctx.createRadialGradient(x - 6, y - bh * 0.6, 2, x, y - 4, bw);
  g.addColorStop(0, 'rgba(255,225,255,0.95)'); g.addColorStop(0.6, 'rgba(232,140,250,0.85)'); g.addColorStop(1, 'rgba(170,80,220,0.85)');
  ctx.fillStyle = g; ctx.strokeStyle = '#5a1f6e'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - bw, y + 2);
  ctx.bezierCurveTo(x - bw, y - bh * 1.4, x + bw, y - bh * 1.4, x + bw, y + 2);
  for (let i = 0; i < 6; i++) { const sx = x + bw - (i + 0.5) * (bw * 2 / 6); ctx.quadraticCurveTo(sx, y + 7, sx - bw / 6, y + 2); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // face-ish spots
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath(); ctx.ellipse(x - 8, y - bh * 0.7, 5, 3, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(120,40,160,0.35)';
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x - 8 + i * 8, y - 4, 2.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

function drawUrchin(o) {
  const { x } = o; const y = FLOOR - 8;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, FLOOR + 3, 22, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const a = Math.PI + (i / 25) * Math.PI;
    const len = 22 + (i % 2) * 7 + Math.sin(S.t * 0.05 + i) * 1.5;
    ctx.strokeStyle = OUT; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 10, y + Math.sin(a) * 8); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
    ctx.strokeStyle = i % 2 ? '#7b4fb8' : '#4b2c7a'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 10, y + Math.sin(a) * 8); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
  }
  const g = ctx.createRadialGradient(x - 4, y - 6, 2, x, y, 16);
  g.addColorStop(0, '#9b6fd6'); g.addColorStop(1, '#2e1a4f');
  ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, 15, 12, 0, Math.PI, 0); ctx.lineTo(x + 15, y + 6); ctx.lineTo(x - 15, y + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawAir(o) {
  const { x, y } = o;
  const wob = Math.sin(o.p * 3) * 1.5;
  const bub = (bx, by, r) => {
    const g = ctx.createRadialGradient(bx - r * 0.35, by - r * 0.35, r * 0.1, bx, by, r);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.4, 'rgba(190,240,255,0.35)'); g.addColorStop(1, 'rgba(120,210,255,0.55)');
    ctx.fillStyle = g; ctx.strokeStyle = 'rgba(230,250,255,0.95)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(bx, by, r + wob * 0.3, r - wob * 0.3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.ellipse(bx - r * 0.4, by - r * 0.45, r * 0.25, r * 0.15, -0.6, 0, Math.PI * 2); ctx.fill();
  };
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 36);
  glow.addColorStop(0, 'rgba(190,245,255,0.35)'); glow.addColorStop(1, 'rgba(190,245,255,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 36, 0, Math.PI * 2); ctx.fill();
  bub(x, y, 15); bub(x + 15, y - 12, 7); bub(x - 13, y + 11, 5);
  ctx.fillStyle = '#0b4a6e'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.fillText('O₂', x, y + 4);
  ctx.restore();
}

function starPath(x, y, R, r, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + i * Math.PI / 5 - Math.PI / 2;
    const rr = i % 2 ? r : R;
    // rounded arms via quadratic curves
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function drawStar(o) {
  const { x, y } = o;
  const rot = Math.sin(o.p) * 0.3;
  ctx.save(); ctx.lineJoin = 'round';
  const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 16);
  g.addColorStop(0, '#ffd27a'); g.addColorStop(1, '#f0702a');
  ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  starPath(x, y, 16, 7, rot); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff1c9';
  for (let i = 0; i < 5; i++) { const a = rot + i * Math.PI * 2 / 5 - Math.PI / 2; for (let d = 4; d < 13; d += 4) { ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.1, 0, Math.PI * 2); ctx.fill(); } }
  ctx.restore();
}

function drawClam(o) {
  const x = o.x, y = FLOOR - 2;
  const open = o.done ? 0.08 : 0.32 + Math.sin(o.p * 2) * 0.1;
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  // bottom shell
  ctx.fillStyle = '#e7b9a8';
  ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.quadraticCurveTo(x, y + 10, x + 18, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  // pearl
  if (!o.done) {
    const g = ctx.createRadialGradient(x - 2, y - 6, 1, x, y - 4, 7);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfd8e8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 4, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  // top shell (hinged at back)
  ctx.save(); ctx.translate(x - 18, y); ctx.rotate(-open);
  ctx.fillStyle = '#f2c9b8';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(18, -18, 36, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(160,90,80,0.6)'; ctx.lineWidth = 1.2;
  for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(4, -1); ctx.lineTo(i * 7.5, -9 - Math.sin(i / 5 * Math.PI) * 3); ctx.stroke(); }
  ctx.restore();
  ctx.restore();
}

// ---------- drawing: Kai ----------
function drawKai() {
  const k = S.kai;
  if (S.hideKai) return;
  if (k.hitTimer > 0 && Math.floor(k.hitTimer / 5) % 2 === 0) return;
  const tilt = clamp(-k.vy * 0.04, -0.18, 0.12);
  const bob = k.y >= FLOOR ? Math.sin(S.t * 0.12) * 0.8 : Math.sin(S.t * 0.06) * 1.5;
  drawKaiFigure({ x: k.x, y: k.y + bob, tilt, diver: true, crouch: k.thrust ? 4 : 0, prop: k.prop, outfit: SAVE.outfit });
}

