
// ================= CITY DRAWING =================
function seeded(n) { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }

function drawSky() {
  const g = ctx.createLinearGradient(0, -DY, 0, FLOOR);
  g.addColorStop(0, '#4aa8e6'); g.addColorStop(DY / (DY + FLOOR) * 0.9, '#5fb8ec'); g.addColorStop(1 - 0.35 * FLOOR / (DY + FLOOR), '#a9dcf5'); g.addColorStop(1, '#ffe2b6');
  ctx.fillStyle = g; ctx.fillRect(0, -DY, W, VH);
  // sun
  const sx = 980 - (S.scroll * 0.01) % 200, sy = 62;
  const sg = ctx.createRadialGradient(sx, sy, 10, sx, sy, 90);
  sg.addColorStop(0, 'rgba(255,245,200,0.9)'); sg.addColorStop(1, 'rgba(255,245,200,0)');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, 90, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff2b0'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, 26, 0, Math.PI * 2); ctx.fill();
  // clouds
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 310 - S.scroll * 0.04) % (W + 300) + W + 300) % (W + 300) - 150, cy = 40 + (i % 3) * 22;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (const [dx, dy, r] of [[0, 0, 18], [20, -8, 22], [42, 0, 18], [22, 6, 16]]) { ctx.beginPath(); ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2); ctx.fill(); }
  }
}
function drawMountains() {
  // the mountains around the lake
  for (const [par, base, amp, col, seed] of [[0.03, 175, 70, '#8fb3c9', 3], [0.07, 195, 55, '#6f9bb3', 9]]) {
    const off = S.scroll * par, seg = 180, start = Math.floor(off / seg) - 1;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-10, FLOOR);
    for (let i = start; i < start + W / seg + 3; i++) {
      const x = i * seg - off;
      ctx.lineTo(x, base - seeded(i + seed) * amp);
      ctx.quadraticCurveTo(x + seg * 0.5, base - seeded(i + seed + 0.3) * amp - 30, x + seg, base - seeded(i + 1 + seed) * amp);
    }
    ctx.lineTo(W + 10, FLOOR); ctx.closePath(); ctx.fill();
  }
  // lake shimmer
  ctx.fillStyle = '#9fd3e8'; ctx.fillRect(0, 196, W, 20);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 14; i++) { const x = ((i * 97 - S.scroll * 0.09) % W + W) % W; ctx.beginPath(); ctx.moveTo(x, 203 + (i % 3) * 4); ctx.lineTo(x + 18, 203 + (i % 3) * 4); ctx.stroke(); }
}
function drawBuildings() {
  const par = 0.35, off = S.scroll * par;
  let i = Math.floor(off / 150) - 2;
  // houses have variable widths: walk with a seeded generator
  let x = i * 150 - off;
  ctx.lineJoin = 'round';
  for (let n = 0; n < 14; n++, i++) {
    const w = 120 + Math.floor(seeded(i * 3.1) * 70), h = 70 + Math.floor(seeded(i * 7.7) * 70);
    const col = BLD_COLORS[Math.floor(seeded(i * 1.9) * BLD_COLORS.length)];
    const y = FLOOR - 8 - h;
    if (x > W + 20) break;
    if (x + w > -20) {
      ctx.fillStyle = col; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
      ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
      // roof edge / terracotta
      ctx.fillStyle = seeded(i) > 0.5 ? '#c4643c' : '#ffffff';
      ctx.fillRect(x - 4, y - 6, w + 8, 8); ctx.strokeRect(x - 4, y - 6, w + 8, 8);
      // windows
      const cols = Math.max(2, Math.floor(w / 42)), rows = h > 110 ? 2 : 1;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const wx = x + 14 + c * ((w - 28) / cols) + ((w - 28) / cols - 20) / 2, wy = y + 14 + r * 44;
        ctx.fillStyle = '#2a4a66'; ctx.fillRect(wx, wy, 20, 24); ctx.strokeRect(wx, wy, 20, 24);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(wx + 2, wy + 2, 6, 10);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(wx - 3, wy + 24, 26, 4); ctx.strokeRect(wx - 3, wy + 24, 26, 4);
        if (seeded(i * 11 + c) > 0.6) { ctx.fillStyle = '#e8463c'; for (let f = 0; f < 3; f++) { ctx.beginPath(); ctx.arc(wx + 4 + f * 6, wy + 22, 3, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = '#3f8f4a'; ctx.fillRect(wx, wy + 24, 20, 2); }
      }
      // door
      if (seeded(i * 5.3) > 0.35) { const dx = x + w * 0.5 - 12; ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.roundRect(dx, FLOOR - 8 - 38, 24, 38, [10, 10, 0, 0]); ctx.fill(); ctx.stroke(); }
    }
    x += w + 6 + Math.floor(seeded(i * 2.3) * 20);
  }
  // papel picado banners across the street
  for (let b = 0; b < 3; b++) {
    const bx = ((b * 520 - S.scroll * par) % 1560 + 1560) % 1560 - 260, len = 240, by = 112;
    ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + len / 2, by + 20, bx + len, by); ctx.stroke();
    for (let f = 0; f < 11; f++) {
      const t = (f + 0.5) / 11, fx = bx + len * t, fy = by + 20 * 4 * t * (1 - t) * 0.5 + 1;
      ctx.fillStyle = BLD_COLORS[(f + b) % BLD_COLORS.length];
      ctx.beginPath(); ctx.moveTo(fx - 8, fy); ctx.lineTo(fx + 8, fy); ctx.lineTo(fx + 8, fy + 14); ctx.lineTo(fx, fy + 18); ctx.lineTo(fx - 8, fy + 14); ctx.closePath(); ctx.fill();
    }
  }
}
function drawStreetProps() {
  // palm trees and lamps (parallax 0.7)
  const par = 0.7, off = S.scroll * par, seg = 260, start = Math.floor(off / seg) - 1;
  for (let i = start; i < start + W / seg + 2; i++) {
    const x = i * seg - off + seeded(i) * 60;
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    if (seeded(i * 4.4) > 0.45) {
      // palm
      ctx.fillStyle = '#9b7348';
      ctx.beginPath(); ctx.moveTo(x - 5, FLOOR); ctx.quadraticCurveTo(x + 6, FLOOR - 70, x + 2, FLOOR - 140); ctx.lineTo(x + 10, FLOOR - 140); ctx.quadraticCurveTo(x + 14, FLOOR - 70, x + 5, FLOOR); ctx.closePath(); ctx.fill(); ctx.stroke();
      const sw = Math.sin(S.t * 0.04 + i) * 0.08;
      for (let l = 0; l < 6; l++) {
        const a = -Math.PI / 2 + (l - 2.5) * 0.55 + sw;
        ctx.save(); ctx.translate(x + 6, FLOOR - 140); ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = l % 2 ? '#3f9b4f' : '#2f8040';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(24, -14, 52, 6); ctx.quadraticCurveTo(24, -2, 0, 0); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    } else {
      // street lamp
      ctx.fillStyle = '#3b4652';
      ctx.fillRect(x, FLOOR - 120, 5, 120); ctx.strokeRect(x, FLOOR - 120, 5, 120);
      ctx.beginPath(); ctx.moveTo(x + 2, FLOOR - 120); ctx.quadraticCurveTo(x + 2, FLOOR - 134, x + 20, FLOOR - 132); ctx.stroke();
      ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.roundRect(x + 14, FLOOR - 134, 16, 10, 3); ctx.fill(); ctx.stroke();
    }
  }
}
function drawStreet() {
  // sidewalk
  ctx.fillStyle = '#d8d2c6'; ctx.fillRect(0, FLOOR - 8, W, 20);
  ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, FLOOR - 8); ctx.lineTo(W, FLOOR - 8); ctx.stroke();
  ctx.strokeStyle = 'rgba(20,32,46,0.25)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 30; i++) { const x = ((i * 64 - S.scroll) % (W + 64) + W + 64) % (W + 64) - 32; ctx.beginPath(); ctx.moveTo(x, FLOOR - 8); ctx.lineTo(x - 6, FLOOR + 12); ctx.stroke(); }
  // curb
  ctx.fillStyle = '#b9b2a4'; ctx.fillRect(0, FLOOR + 12, W, 6);
  ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, FLOOR + 12); ctx.lineTo(W, FLOOR + 12); ctx.stroke();
  // road
  ctx.fillStyle = '#3d4450'; ctx.fillRect(0, FLOOR + 18, W, H - FLOOR);
  ctx.fillStyle = '#f2c94c';
  for (let i = 0; i < 14; i++) { const x = ((i * 120 - S.scroll * 1.0) % (W + 120) + W + 120) % (W + 120) - 60; ctx.fillRect(x, FLOOR + 30, 54, 4); }
}

// ---------- obstacles ----------
function drawObject(o) {
  const x = o.x, f = FLOOR;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  switch (o.type) {
    case 'party': { ctx.restore(); drawParty(o); return; }
    case 'pipe': {
      // big green tube with a thick rim, metal bands and bolts
      const x = o.x, top = o.top, w = o.w;
      const body = ctx.createLinearGradient(x + 4, 0, x + w - 4, 0);
      body.addColorStop(0, '#1f7a34'); body.addColorStop(0.3, '#4fc45f'); body.addColorStop(0.55, '#2f9e45'); body.addColorStop(1, '#165c27');
      ctx.fillStyle = body; ctx.fillRect(x + 6, top + 20, w - 12, FLOOR - top - 20); ctx.strokeRect(x + 6, top + 20, w - 12, FLOOR - top - 20);
      ctx.fillStyle = 'rgba(20,60,30,0.45)'; ctx.fillRect(x + 6, top + 44, w - 12, 6); ctx.fillRect(x + 6, FLOOR - 16, w - 12, 6);
      ctx.fillStyle = '#d7e8d2'; for (const bx of [x + 14, x + w - 14]) for (const by of [top + 47, FLOOR - 13]) { ctx.beginPath(); ctx.arc(bx, by, 2.2, 0, Math.PI * 2); ctx.fill(); }
      const rim = ctx.createLinearGradient(x - 6, 0, x + w + 6, 0);
      rim.addColorStop(0, '#1f7a34'); rim.addColorStop(0.3, '#62d672'); rim.addColorStop(0.55, '#36ad4d'); rim.addColorStop(1, '#165c27');
      ctx.fillStyle = rim; ctx.beginPath(); ctx.roundRect(x - 6, top, w + 12, 22, 5); ctx.fill(); ctx.stroke();
      // dark opening
      ctx.fillStyle = '#0c2414'; ctx.beginPath(); ctx.ellipse(x + w / 2, top + 4, w / 2 - 2, 5, 0, 0, Math.PI * 2); ctx.fill();
      // little down-arrow hint when Kai has the harpoon
      if (SAVE.items.harpoon) { const b = Math.sin(S.t * 0.15) * 3; ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(x + w / 2 - 9, top - 30 + b); ctx.lineTo(x + w / 2 + 9, top - 30 + b); ctx.lineTo(x + w / 2, top - 16 + b); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      break;
    }
    case 'pier': {
      // lake strip + wooden pier going into the water, sign HAFEN
      ctx.fillStyle = '#5fb8d8'; ctx.fillRect(x - 40, FLOOR - 70, o.w + 120, 62);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) { const wx = x - 30 + i * 52 + Math.sin(S.t * 0.05 + i) * 6; ctx.beginPath(); ctx.moveTo(wx, FLOOR - 50 + (i % 3) * 12); ctx.lineTo(wx + 22, FLOOR - 50 + (i % 3) * 12); ctx.stroke(); }
      ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
      ctx.fillStyle = '#9b6632'; ctx.fillRect(x, FLOOR - 26, o.w, 12); ctx.strokeRect(x, FLOOR - 26, o.w, 12);
      for (let px = x + 10; px < x + o.w; px += 48) { ctx.fillStyle = '#6b4a2e'; ctx.fillRect(px, FLOOR - 14, 8, 22); ctx.strokeRect(px, FLOOR - 14, 8, 22); }
      // sign
      ctx.fillStyle = '#6b4a2e'; ctx.fillRect(x + 30, FLOOR - 110, 6, 86); ctx.strokeRect(x + 30, FLOOR - 110, 6, 86);
      ctx.fillStyle = '#f4efe6'; ctx.beginPath(); ctx.roundRect(x - 10, FLOOR - 134, 90, 28, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1e4fa3'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText(tx('HAFEN'), x + 35, FLOOR - 115);
      // closed gate if Kai has no harpoon
      if (!SAVE.items.harpoon) {
        ctx.fillStyle = '#d8352c'; ctx.fillRect(x + 90, FLOOR - 60, 8, 36); ctx.strokeRect(x + 90, FLOOR - 60, 8, 36);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 98, FLOOR - 56, 90, 10); ctx.strokeRect(x + 98, FLOOR - 56, 90, 10);
        ctx.fillStyle = '#d8352c'; for (let i = 0; i < 4; i++) ctx.fillRect(x + 104 + i * 22, FLOOR - 56, 10, 10);
        drawWorldIcon('harpoon', x + 210, FLOOR - 56, false);
        ctx.strokeStyle = '#d8352c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 200, FLOOR - 66); ctx.lineTo(x + 220, FLOOR - 46); ctx.stroke();
      }
      break;
    }
    case 'police': {
      if (x > W - 10) {
        const blink = Math.sin(S.t * 0.5) > 0;
        ctx.fillStyle = blink ? '#e8463c' : '#2f6fe0'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(W - 30, f - 70); ctx.lineTo(W - 8, f - 34); ctx.lineTo(W - 52, f - 34); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.fillText('!', W - 30, f - 39);
        break;
      }
      const y0 = o.top;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(x + 2, f - 12); ctx.lineTo(x + 2, y0 + 30); ctx.lineTo(x + 26, y0 + 26); ctx.lineTo(x + 40, y0 + 2); ctx.lineTo(x + 108, y0 + 2); ctx.lineTo(x + 124, y0 + 26); ctx.lineTo(x + 148, y0 + 30); ctx.lineTo(x + 148, f - 12); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1d2530'; ctx.fillRect(x + 30, y0 + 28, 92, f - 12 - y0 - 28); ctx.strokeRect(x + 30, y0 + 28, 92, f - 12 - y0 - 28);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.fillText(tx('POLICÍA'), x + 76, y0 + 42);
      ctx.fillStyle = '#bfe3f5'; ctx.beginPath(); ctx.moveTo(x + 44, y0 + 7); ctx.lineTo(x + 72, y0 + 7); ctx.lineTo(x + 72, y0 + 24); ctx.lineTo(x + 32, y0 + 24); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 78, y0 + 7); ctx.lineTo(x + 104, y0 + 7); ctx.lineTo(x + 116, y0 + 24); ctx.lineTo(x + 78, y0 + 24); ctx.closePath(); ctx.fill(); ctx.stroke();
      // light bar
      const on = Math.sin(S.t * 0.6) > 0;
      ctx.fillStyle = on ? '#e8463c' : '#7a1f1a'; if (on) { ctx.shadowColor = '#e8463c'; ctx.shadowBlur = 16; }
      ctx.beginPath(); ctx.roundRect(x + 56, y0 - 8, 16, 9, 3); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
      ctx.fillStyle = !on ? '#2f6fe0' : '#16336e'; if (!on) { ctx.shadowColor = '#2f6fe0'; ctx.shadowBlur = 16; }
      ctx.beginPath(); ctx.roundRect(x + 74, y0 - 8, 16, 9, 3); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
      // headlight (it drives towards Kai)
      ctx.fillStyle = '#ffe9a0'; ctx.fillRect(x + 2, y0 + 34, 8, 6); ctx.strokeRect(x + 2, y0 + 34, 8, 6);
      const hg = ctx.createLinearGradient(x, 0, x - 70, 0); hg.addColorStop(0, 'rgba(255,240,170,0.5)'); hg.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(x + 2, y0 + 34); ctx.lineTo(x - 70, y0 + 26); ctx.lineTo(x - 70, y0 + 52); ctx.lineTo(x + 2, y0 + 40); ctx.closePath(); ctx.fill();
      for (const wx of [x + 34, x + 118]) { ctx.fillStyle = '#20252c'; ctx.beginPath(); ctx.arc(wx, f - 10, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#9aa3ad'; ctx.beginPath(); ctx.arc(wx, f - 10, 5, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'cone': {
      ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(x + 11, o.top); ctx.lineTo(x + 20, f - 4); ctx.lineTo(x + 2, f - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(x + 6, f - 18, 10, 5);
      ctx.fillStyle = '#e05a10'; ctx.fillRect(x - 2, f - 5, 26, 5); ctx.strokeRect(x - 2, f - 5, 26, 5);
      break;
    }
    case 'hydrant': {
      ctx.fillStyle = '#d62b2b';
      ctx.beginPath(); ctx.roundRect(x + 5, o.top + 8, 16, 30, 3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 13, o.top + 9, 9, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.fillRect(x, o.top + 16, 26, 8); ctx.strokeRect(x, o.top + 16, 26, 8);
      ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(x + 13, o.top + 1, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x + 8, o.top + 10, 3, 24);
      if (!o.spun && !o.hit) {
        const a = S.t * 0.12, cy = o.top - 22 + Math.sin(S.t * 0.1) * 3;
        ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 13, cy, 9, a, a + Math.PI * 1.5); ctx.stroke();
        ctx.fillStyle = '#ffd23a'; ctx.beginPath(); const ex = x + 13 + Math.cos(a + Math.PI * 1.5) * 9, ey = cy + Math.sin(a + Math.PI * 1.5) * 9;
        ctx.arc(ex, ey, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'bin': {
      ctx.fillStyle = '#2f8a5f'; ctx.beginPath(); ctx.moveTo(x + 2, o.top + 6); ctx.lineTo(x + 30, o.top + 6); ctx.lineTo(x + 27, f - 2); ctx.lineTo(x + 5, f - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#257050'; ctx.beginPath(); ctx.roundRect(x, o.top, 32, 8, 3); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + 10 + i * 6, o.top + 14); ctx.lineTo(x + 10 + i * 6, f - 8); ctx.stroke(); }
      break;
    }
    case 'bench': {
      ctx.fillStyle = '#6b4a2e';
      for (const lx of [x + 10, x + o.w - 18]) { ctx.fillRect(lx, o.top + 6, 8, f - o.top - 6); ctx.strokeRect(lx, o.top + 6, 8, f - o.top - 6); }
      ctx.fillStyle = '#9aa6b1'; ctx.beginPath(); ctx.roundRect(x, o.top, o.w, 8, 3); ctx.fill(); ctx.stroke();   // metal edge = grind
      ctx.fillStyle = o.color; ctx.beginPath(); ctx.roundRect(x + 4, o.top - 26, o.w - 8, 10, 3); ctx.fill(); ctx.stroke();
      for (const lx of [x + 14, x + o.w - 14]) { ctx.beginPath(); ctx.moveTo(lx, o.top - 16); ctx.lineTo(lx, o.top); ctx.stroke(); }
      break;
    }
    case 'rail': {
      ctx.fillStyle = '#6b7884';
      for (const px of [x + 12, x + o.w / 2, x + o.w - 12]) { ctx.fillRect(px - 3, o.top + 4, 6, f - o.top - 4); ctx.strokeRect(px - 3, o.top + 4, 6, f - o.top - 4); }
      ctx.fillStyle = '#c9d3dc'; ctx.beginPath(); ctx.roundRect(x, o.top, o.w, 7, 3.5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x + 6, o.top + 1.5, o.w - 12, 2);
      break;
    }
    case 'car': {
      const c = o.color, y0 = o.top;
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.moveTo(x + 4, f - 12); ctx.lineTo(x + 4, y0 + 30); ctx.lineTo(x + 28, y0 + 26); ctx.lineTo(x + 42, y0); ctx.lineTo(x + 112, y0); ctx.lineTo(x + 130, y0 + 26); ctx.lineTo(x + 156, y0 + 30); ctx.lineTo(x + 156, f - 12); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#bfe3f5'; ctx.beginPath(); ctx.moveTo(x + 46, y0 + 5); ctx.lineTo(x + 76, y0 + 5); ctx.lineTo(x + 76, y0 + 24); ctx.lineTo(x + 34, y0 + 24); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 82, y0 + 5); ctx.lineTo(x + 108, y0 + 5); ctx.lineTo(x + 122, y0 + 24); ctx.lineTo(x + 82, y0 + 24); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffe9a0'; ctx.fillRect(x + 148, y0 + 34, 8, 6); ctx.strokeRect(x + 148, y0 + 34, 8, 6);
      for (const wx of [x + 36, x + 124]) { ctx.fillStyle = '#20252c'; ctx.beginPath(); ctx.arc(wx, f - 10, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#9aa3ad'; ctx.beginPath(); ctx.arc(wx, f - 10, 5, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'icecream': {
      const y0 = o.top;
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(x, y0, o.w, f - 14 - y0, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff8fb8'; ctx.fillRect(x, y0 + 52, o.w, 14); ctx.strokeRect(x, y0 + 52, o.w, 14);
      ctx.fillStyle = '#7fd6e8'; ctx.beginPath(); ctx.roundRect(x + 20, y0 + 12, 90, 32, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = OUT; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.fillText(tx('HELADOS'), x + 65, y0 + 33);
      // cone on the roof
      if (!o.coneTaken) {
        // the ice cream on the roof: ride through it = +1 heart (a little sparkle shows it can be taken)
        const bob = Math.sin(S.t * 0.12) * 2;
        ctx.fillStyle = '#e0a85a'; ctx.beginPath(); ctx.moveTo(x + 160, y0 - 2 + bob); ctx.lineTo(x + 170, y0 - 30 + bob); ctx.lineTo(x + 150, y0 - 30 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff8fb8'; ctx.beginPath(); ctx.arc(x + 160, y0 - 34 + bob, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.6 + Math.sin(S.t * 0.2) * 0.4; ctx.beginPath(); ctx.arc(x + 172, y0 - 46 + bob, 2.5, 0, Math.PI * 2); ctx.arc(x + 147, y0 - 40 + bob, 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#bfe3f5'; ctx.beginPath(); ctx.roundRect(x + 140, y0 + 12, 46, 32, 4); ctx.fill(); ctx.stroke();
      for (const wx of [x + 40, x + 160]) { ctx.fillStyle = '#20252c'; ctx.beginPath(); ctx.arc(wx, f - 12, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#9aa3ad'; ctx.beginPath(); ctx.arc(wx, f - 12, 6, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'taco': {
      const y0 = o.top;
      // umbrella
      ctx.fillStyle = '#6b4a2e'; ctx.fillRect(x + 63, y0 - 46, 4, 50);
      for (let s = 0; s < 6; s++) { ctx.fillStyle = s % 2 ? '#ffffff' : '#e8463c'; ctx.beginPath(); ctx.moveTo(x + 65, y0 - 56); ctx.lineTo(x + 5 + s * 20, y0 - 36); ctx.lineTo(x + 25 + s * 20, y0 - 36); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      // cart
      ctx.fillStyle = '#f6c94c'; ctx.beginPath(); ctx.roundRect(x, y0, o.w, f - 16 - y0, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3f9b4f'; ctx.fillRect(x, y0, o.w, 10); ctx.strokeRect(x, y0, o.w, 10);
      ctx.fillStyle = OUT; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center'; ctx.fillText(tx('TACOS'), x + o.w / 2, y0 + 34);
      for (const wx of [x + 22, x + o.w - 22]) { ctx.fillStyle = '#20252c'; ctx.beginPath(); ctx.arc(wx, f - 12, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      break;
    }
    case 'hole': {
      ctx.fillStyle = '#1a1d22'; ctx.beginPath(); ctx.ellipse(x + o.w / 2, f + 2, o.w / 2, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2b3038'; ctx.beginPath(); ctx.ellipse(x + o.w / 2, f + 4, o.w / 2 - 8, 5, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'ramp': {
      if (o.wings && !o.done) {
        const gl = ctx.createRadialGradient(x + o.w / 2, f - 20, 4, x + o.w / 2, f - 20, 90); gl.addColorStop(0, 'rgba(255,240,170,0.6)'); gl.addColorStop(1, 'rgba(255,240,170,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x + o.w / 2, f - 20, 90, 0, Math.PI * 2); ctx.fill();
        const fl = Math.sin(S.t * 0.15) * 0.25;
        for (const sd of [-1, 1]) {
          ctx.save(); ctx.translate(x + o.w * 0.6, f - o.h * 0.6); ctx.scale(sd, 1); ctx.rotate(-0.4 - fl);
          ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(8, -20, 30, -36, 56, -34); ctx.quadraticCurveTo(50, -24, 58, -18); ctx.quadraticCurveTo(46, -12, 50, -4); ctx.quadraticCurveTo(36, -4, 36, 4); ctx.quadraticCurveTo(18, 2, 0, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.restore();
        }
        ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
      }
      ctx.fillStyle = o.wings ? '#fff3c0' : o.bossRamp ? '#ffb02e' : '#4f8fd6';
      ctx.beginPath(); ctx.moveTo(x, f); ctx.quadraticCurveTo(x + o.w * 0.7, f - 4, x + o.w, f - o.h); ctx.lineTo(x + o.w, f); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#9aa6b1'; ctx.fillRect(x + o.w - 3, f - o.h, 6, o.h); ctx.strokeRect(x + o.w - 3, f - o.h, 6, o.h);
      if (o.bossRamp && !o.done) {
        const ay = f - o.h - 40 + Math.sin(S.t * 0.25) * 6;
        ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x + o.w / 2, ay + 18); ctx.lineTo(x + o.w / 2 - 13, ay); ctx.lineTo(x + o.w / 2 - 5, ay); ctx.lineTo(x + o.w / 2 - 5, ay - 14); ctx.lineTo(x + o.w / 2 + 5, ay - 14); ctx.lineTo(x + o.w / 2 + 5, ay); ctx.lineTo(x + o.w / 2 + 13, ay); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.lineWidth = 3; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.strokeText(tx('RAMPE'), x + o.w / 2, ay - 20); ctx.fillText(tx('RAMPE'), x + o.w / 2, ay - 20);
      }
      break;
    }
    case 'dog': {
      const y = f, run = Math.sin(o.p * 6);
      ctx.translate(x + 23, y);
      ctx.fillStyle = '#b07a4a';
      for (const [lx, ph] of [[-12, 0], [-6, 2], [8, 1], [14, 3]]) { ctx.beginPath(); ctx.moveTo(lx, -14); ctx.lineTo(lx + Math.sin(o.p * 6 + ph) * 6, -2); ctx.lineWidth = 4; ctx.stroke(); }
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(0, -18, 18, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(16, -22); ctx.quadraticCurveTo(26 + run * 3, -34, 22, -24); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-20, -26, 10, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7a4f2a'; ctx.beginPath(); ctx.ellipse(-18, -34, 4, 7, 0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(-28, -25, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(-22, -28, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8463c'; ctx.beginPath(); ctx.ellipse(-27, -19, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8463c'; ctx.fillRect(-14, -26, 6, 3);
      if (o.x > W - 60) { ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; ctx.font = 'bold 14px Arial'; ctx.lineWidth = 3; ctx.strokeText(tx('WAU!'), -40, -42); ctx.fillText(tx('WAU!'), -40, -42); }
      break;
    }
  }
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
function drawTaco(o) {
  const y = o.y + Math.sin(S.t * 0.08) * 4;
  ctx.save(); ctx.translate(o.x, y); ctx.lineJoin = 'round';
  const gl = ctx.createRadialGradient(0, 0, 4, 0, 0, 44); gl.addColorStop(0, 'rgba(255,90,120,0.45)'); gl.addColorStop(1, 'rgba(255,90,120,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.fillStyle = '#6fbf4a'; ctx.beginPath(); ctx.ellipse(0, -4, 17, 7, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#e8463c'; for (const dx of [-8, 0, 8]) { ctx.beginPath(); ctx.arc(dx, -7, 3, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#f2c46a'; ctx.beginPath(); ctx.arc(0, 0, 18, Math.PI, 0); ctx.lineTo(18, 2); ctx.quadraticCurveTo(0, 10, -18, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  drawHeart(o.x + 20, y - 18, 7, true);
  ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
  ctx.strokeText('+2', o.x + 20, y - 30); ctx.fillText('+2', o.x + 20, y - 30); ctx.restore();
}

// ---------- garbage truck ----------
function drawTruck(b) {
  const x = b.x, f = FLOOR, roofY = f - TRUCK.roofH;
  ctx.save();
  ctx.translate(x + 170, f); ctx.rotate(b.tilt); ctx.translate(-(x + 170), -f);
  if (b.hurt > 0) ctx.translate(Math.sin(b.hurt * 1.4) * 4, 0);
  ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  // container body
  const g = ctx.createLinearGradient(0, roofY, 0, f); g.addColorStop(0, '#3fae6a'); g.addColorStop(1, '#25804a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, roofY, TRUCK.body, TRUCK.roofH - 26, 8); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(20,32,46,0.35)'; ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x + i * 42, roofY + 6); ctx.lineTo(x + i * 42, f - 32); ctx.stroke(); }
  ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  ctx.fillStyle = '#ffd23a'; ctx.fillRect(x + 10, f - 70, TRUCK.body - 20, 10); ctx.strokeRect(x + 10, f - 70, TRUCK.body - 20, 10);
  // roof edge (landing zone)
  ctx.fillStyle = '#9aa6b1'; ctx.beginPath(); ctx.roundRect(x + 6, roofY - 6, TRUCK.body - 12, 8, 3); ctx.fill(); ctx.stroke();
  // flashing amber light
  const on = Math.sin(S.t * 0.3) > 0;
  ctx.fillStyle = on ? '#ffb02e' : '#a0661a'; if (on) { ctx.shadowColor = '#ffb02e'; ctx.shadowBlur = 18; }
  ctx.beginPath(); ctx.roundRect(x + 120, roofY - 16, 18, 10, 4); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
  // rear hopper with an angry face
  ctx.fillStyle = '#2f8a5f'; ctx.beginPath(); ctx.moveTo(x, roofY + 10); ctx.lineTo(x - 26, roofY + 30); ctx.lineTo(x - 26, f - 30); ctx.lineTo(x, f - 26); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a1d22'; ctx.beginPath(); ctx.moveTo(x - 22, roofY + 70); ctx.lineTo(x - 4, roofY + 66); ctx.lineTo(x - 4, f - 34); ctx.lineTo(x - 22, f - 36); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - 20, roofY + 72 + i * 10); ctx.lineTo(x - 12, roofY + 76 + i * 10); ctx.lineTo(x - 20, roofY + 80 + i * 10); ctx.fill(); }
  const ey = roofY + 44;
  for (const ex of [x - 18, x - 6]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(ex - 1.5, ey + 1, 2.2, 0, Math.PI * 2); ctx.fill(); }
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 24, ey - 10); ctx.lineTo(x - 12, ey - 6); ctx.moveTo(x - 1, ey - 10); ctx.lineTo(x - 10, ey - 6); ctx.stroke();
  // cab
  const cx = x + TRUCK.body, cy = f - TRUCK.cabH;
  ctx.fillStyle = '#f2f2f2'; ctx.beginPath(); ctx.moveTo(cx, f - 26); ctx.lineTo(cx, cy + 10); ctx.quadraticCurveTo(cx, cy, cx + 12, cy); ctx.lineTo(cx + 56, cy); ctx.lineTo(cx + TRUCK.cab, cy + 46); ctx.lineTo(cx + TRUCK.cab, f - 26); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9fd3e8'; ctx.beginPath(); ctx.moveTo(cx + 14, cy + 10); ctx.lineTo(cx + 52, cy + 10); ctx.lineTo(cx + 80, cy + 44); ctx.lineTo(cx + 14, cy + 44); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3fae6a'; ctx.fillRect(cx, f - 60, TRUCK.cab, 12); ctx.strokeRect(cx, f - 60, TRUCK.cab, 12);
  // exhaust pipe + smoke
  ctx.fillStyle = '#6b7884'; ctx.fillRect(cx - 8, cy - 22, 7, 40); ctx.strokeRect(cx - 8, cy - 22, 7, 40);
  if (Math.random() < 0.3) S.particles.push({ x: cx - 4, y: cy - 24, vx: rand(-1.5, -0.5), vy: rand(-1.5, -0.6), r: rand(4, 8), color: 'rgba(90,90,100,0.45)', life: 1, g: -0.01 });
  // wheels
  for (const wx of [x + 50, x + 130, cx + 60]) {
    const rot = S.t * 0.3;
    ctx.fillStyle = '#20252c'; ctx.beginPath(); ctx.arc(wx, f - 18, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9aa3ad'; ctx.beginPath(); ctx.arc(wx, f - 18, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#4a525c'; ctx.lineWidth = 2; for (let s = 0; s < 3; s++) { const a = rot + s * 2.1; ctx.beginPath(); ctx.moveTo(wx, f - 18); ctx.lineTo(wx + Math.cos(a) * 8, f - 18 + Math.sin(a) * 8); ctx.stroke(); }
    ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  }
  // damage marks
  for (let i = 0; i < 3 - b.hp; i++) { ctx.strokeStyle = '#1a1d22'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 50 + i * 60, roofY + 2); ctx.lineTo(x + 60 + i * 60, roofY + 18); ctx.lineTo(x + 52 + i * 60, roofY + 30); ctx.stroke(); }
  if (b.hurt > 0) { ctx.globalAlpha = b.hurt / 50 * 0.5; ctx.fillStyle = '#fff'; ctx.fillRect(x - 26, roofY - 16, TRUCK.body + TRUCK.cab + 26, TRUCK.roofH + 16); ctx.globalAlpha = 1; }
  // target arrow above the roof
  if (b.state === 'fight') {
    const ay = roofY - 34 + Math.sin(S.t * 0.15) * 5;
    ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x + 125, ay + 16); ctx.lineTo(x + 112, ay); ctx.lineTo(x + 120, ay); ctx.lineTo(x + 120, ay - 12); ctx.lineTo(x + 130, ay - 12); ctx.lineTo(x + 130, ay); ctx.lineTo(x + 138, ay); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}
function drawProjectile(p) {
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  if (p.kind === 'bin') {
    ctx.fillStyle = '#6b7884'; ctx.beginPath(); ctx.roundRect(-14, -18, 28, 36, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a525c'; ctx.fillRect(-16, -20, 32, 6); ctx.strokeRect(-16, -20, 32, 6);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 7, -10); ctx.lineTo(i * 7, 14); ctx.stroke(); }
  } else if (p.kind === 'bag') {
    ctx.fillStyle = '#2b2f36'; ctx.beginPath(); ctx.ellipse(0, 2, 14, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4, -10); ctx.lineTo(0, -16); ctx.lineTo(4, -10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(-5, -2, 4, 3, -0.5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#e8463c'; ctx.beginPath(); ctx.roundRect(-5, -8, 10, 16, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#cfd8e8'; ctx.fillRect(-5, -8, 10, 3);
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
function drawEventIcon(type, cx, cy, passed) {
  ctx.save(); ctx.translate(cx, cy); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.globalAlpha = passed ? 0.45 : 1;
  ctx.fillStyle = type === 'truck' ? '#1e4d33' : '#0b2a45'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 1.2;
  if (type === 'taco') { ctx.fillStyle = '#f2c46a'; ctx.beginPath(); ctx.arc(0, 2, 7, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#6fbf4a'; ctx.fillRect(-5, -2, 10, 2); }
  else if (type === 'pipe') { ctx.fillStyle = '#3fb653'; ctx.fillRect(-4, -2, 8, 8); ctx.fillRect(-6, -6, 12, 4); ctx.strokeRect(-6, -6, 12, 4); }
  else if (type === 'ramp') { ctx.fillStyle = '#4f8fd6'; ctx.beginPath(); ctx.moveTo(-7, 5); ctx.quadraticCurveTo(2, 4, 7, -5); ctx.lineTo(7, 5); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (type === 'wing') {
    // golden disc with a white angel wing
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(0, 0, 8.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-5, 5); ctx.quadraticCurveTo(-4, -6, 7, -6); ctx.quadraticCurveTo(4, -3, 6, -1); ctx.quadraticCurveTo(2, 0, 4, 3); ctx.quadraticCurveTo(-1, 3, -5, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  else if (type === 'icecream') { ctx.fillStyle = '#e0a85a'; ctx.beginPath(); ctx.moveTo(-4, -1); ctx.lineTo(4, -1); ctx.lineTo(0, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ff8fb8'; ctx.beginPath(); ctx.arc(0, -3, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  else if (type === 'pinata') {
    ctx.fillStyle = '#ff5fa2';
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.3) * 4, Math.sin(a - 0.3) * 4); ctx.lineTo(Math.cos(a) * 8.5, Math.sin(a) * 8.5); ctx.lineTo(Math.cos(a + 0.3) * 4, Math.sin(a + 0.3) * 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  else if (type === 'truck') { ctx.fillStyle = '#3fae6a'; ctx.fillRect(-8, -5, 11, 9); ctx.strokeRect(-8, -5, 11, 9); ctx.fillStyle = '#f2f2f2'; ctx.fillRect(3, -2, 5, 6); ctx.strokeRect(3, -2, 5, 6); ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(-5, 5, 2, 0, Math.PI * 2); ctx.arc(5, 5, 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
function drawProgress() {
  const w = 440, x = W / 2 - w / 2, y = 14;
  ctx.save(); ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(20,30,50,0.6)'; ctx.beginPath(); ctx.roundRect(x - 64, y - 10, w + 150, 28, 14); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'right'; ctx.fillText(tx('STADT'), x - 8, y + 4);
  ctx.textAlign = 'left'; ctx.fillText(tx('MÜLLWAGEN'), x + w + 34, y + 4);
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.roundRect(x, y, w, 8, 4); ctx.fill();
  const f = clamp(S.dist / LEVEL_LENGTH, 0, 1);
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#ffd23a'); g.addColorStop(1, '#3fae6a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, Math.max(8, w * f), 8, 4); ctx.fill();
  for (const ev of EVENTS) if (ev.type === 'pipe') drawEventIcon('pipe', x + w * ev.at / LEVEL_LENGTH, y + 4, S.dist >= ev.at);
  for (const ev of EVENTS) if (ev.type === 'wing' && wingsActive()) { ctx.save(); ctx.translate(x + w * ev.at / LEVEL_LENGTH, y + 4); ctx.scale(0.9, 0.9); drawEventIcon('wing', 0, 0, S.dist >= ev.at); ctx.restore(); }
  for (const ev of EVENTS) if (ev.type !== 'wing' && ev.type !== 'pipe') drawEventIcon(ev.type, x + w * ev.at / LEVEL_LENGTH, y + 4, S.dist >= ev.at);
  drawEventIcon('truck', x + w + 18, y + 4, false);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1e4fa3'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x + w * f, y + 4, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawHUD() {
  ctx.save(); ctx.textBaseline = 'middle';
  // hearts (no upper limit)
  const x = 18, hy = 18, n = S.hearts, show = Math.min(n, 8);
  const boxW = n > 8 ? 120 : Math.max(60, show * 22 + 16);
  ctx.fillStyle = S.heartFlash > 0 ? 'rgba(120,10,20,0.8)' : S.heartFlash < 0 ? 'rgba(120,90,10,0.8)' : 'rgba(20,30,50,0.6)';
  ctx.beginPath(); ctx.roundRect(x - 6, hy - 6, boxW, 26, 10); ctx.fill();
  if (n > 8) { drawHeart(x + 10, hy + 7, 9, true); ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.fillText('× ' + n, x + 26, hy + 8); }
  else for (let i = 0; i < Math.max(show, 1); i++) drawHeart(x + 10 + i * 22, hy + 7, 9, i < n);
  // coins
  ctx.fillStyle = 'rgba(20,30,50,0.6)'; ctx.beginPath(); ctx.roundRect(W - 168, 10, 156, 30, 10); ctx.fill();
  drawCoin({ x: W - 148, y: 25, p: 0 });
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.fillText('× ' + S.coins, W - 132, 26);
  // music + sound buttons
  for (const [b, on, icon] of [[BTN.music, Audio.musicOn, drawNoteIcon], [BTN.sfx, Audio.sfxOn, drawSpeakerIcon]]) {
    ctx.fillStyle = on ? 'rgba(20,30,50,0.6)' : 'rgba(80,10,10,0.7)'; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 9); ctx.fill();
    icon(b.x + b.w / 2 - 1, b.y + b.h / 2, on);
  }
  if (S.phase === 'play' && S.mode === 'main') drawProgress();
  drawProgressBox(12, 44);
  if (S.phase === 'boss' && S.boss) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(20,40,25,0.75)'; ctx.beginPath(); ctx.roundRect(W / 2 - 120, 8, 240, 28, 12); ctx.fill();
    ctx.fillStyle = '#d8ffe0'; ctx.font = 'bold 12px Arial'; ctx.fillText(tx('MÜLLWAGEN'), W / 2 - 44, 22);
    for (let i = 0; i < 3; i++) drawEventIcon('truck', W / 2 + 26 + i * 28, 22, i >= S.boss.hp);
  }
  if (S.msgTimer > 0) {
    ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, S.msgTimer / 20);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.font = 'bold 26px Arial';
    ctx.strokeText(S.msg, W / 2, 84); ctx.fillText(S.msg, W / 2, 84); ctx.globalAlpha = 1;
  }
  ctx.restore();
}
function panel(title, lines, titleColor) {
  ctx.save(); ctx.fillStyle = 'rgba(10,20,40,0.72)'; ctx.fillRect(0, -VH, W, 3 * VH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = titleColor; ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.font = 'bold 40px Arial';
  ctx.strokeText(title, W / 2, 78); ctx.fillText(title, W / 2, 78);
  ctx.fillStyle = '#f4f8ff'; ctx.font = 'bold 15px Arial';
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
  if (S.phase === 'start' && S.mode !== 'main') {
    panel(FELL ? tx('Runtergefallen! Zurück in der Stadt.') : tx('ZURÜCK IN DER STADT'), [tx('Ab zum Hafen – mit der Harpune in die Tiefsee!')], '#ffd23a');
    ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(S.t * 0.1) * 0.4; ctx.fillStyle = '#7fe0ff'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.fillText(tx('Tippen oder Leertaste zum Weiterfahren'), W / 2, 230); ctx.restore();
    drawLangPicker();
  } else if (S.phase === 'start' && RESUME) {
    panel(FELL ? tx('Runtergefallen! Zurück in der Stadt.') : tx('ZURÜCK IN DER STADT'), [FROM_SEA ? tx('Weiter dort, wo du in die Tiefe gerutscht bist.') : tx('Weiter dort, wo du abgesprungen bist.')], '#ffd23a');
    ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(S.t * 0.1) * 0.4; ctx.fillStyle = '#7fe0ff'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.fillText(tx('Tippen oder Leertaste zum Weiterfahren'), W / 2, 230); ctx.restore();
    drawLangPicker();
  } else if (S.phase === 'start') {
    panel(tx('DIE STADT'), [
      tx('Tippen / Leertaste = Springen (Ollie). Länger halten = höher springen.'),
      tx('In der Luft nochmal tippen = Kickflip (+3 Münzen). Auf Bänken und Geländern landen = Grinden.'),
      tx('Auf einem Hydranten landen = Spin! Weiter tippen = mehr Drehungen (+3 Münzen je Drehung, 3 Drehungen = +1 Herz).'),
      tx('Jeder Zusammenstoß kostet ein Herz. Tacos schenken dir +2 Herzen.'),
      tx('Auf Rampen tippen = großer Sprung. Am Ende: Über die Rampe des Müllwagens aufs Dach springen – 3×!'),
    ], '#ffd23a');
    ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(S.t * 0.1) * 0.4; ctx.fillStyle = '#7fe0ff'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center';
    ctx.fillText(tx('Tippen oder Leertaste zum Losfahren'), W / 2, 250); ctx.restore();
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText(tx('LEVEL 2 · NORMALE WELT'), W / 2, 38); ctx.restore();
      drawLangPicker();
  }
  if (S.phase === 'gameover') { panel(tx('KEINE LEBEN MEHR!'), [tx('Alle 3 Leben sind weg. Nochmal versuchen?'), tx('Strecke: {p}%   ·   Münzen: {c}', { p: Math.floor(clamp(S.dist / LEVEL_LENGTH, 0, 1) * 100), c: S.coins })], '#ff7a6a'); button(BTN.goYes, tx('NOCHMAL VERSUCHEN'), '#36c6f4', '#1677a8'); button(BTN.goNo, tx('NEIN – ZUM MENÜ'), '#8a96a8', '#5d6878'); }
  if (S.phase === 'victory') { panel(tx('GESCHAFFT!'), [tx('Der Müllwagen ist erledigt!'), tx('Münzen: {c}   ·   Herzen: {h}', { c: S.coins, h: S.hearts })], '#ffd23a'); button(BTN.again, tx('NOCHMAL SPIELEN'), '#34c759', '#1f8f3c'); }
}

// ================= MAIN DRAW =================
function draw() {
  ctx.save();
  if (S.shake > 0) ctx.translate(rand(-1, 1) * S.shake * 0.6, rand(-1, 1) * S.shake * 0.6);
  drawSky(); drawMountains(); drawBuildings(); drawStreetProps(); drawStreet();
  for (const o of S.objects) if (o.type === 'hole') drawObject(o);
  if (S.boss) drawTruck(S.boss);
  for (const o of S.objects) if (o.type !== 'coin' && o.type !== 'tacoItem' && o.type !== 'hole' && !(o.type === 'ramp' && o.done && o.x < -200)) drawObject(o);
  for (const o of S.objects) { if (o.done) continue; if (o.type === 'coin') drawCoin(o); if (o.type === 'tacoItem') drawTaco(o); }
  for (const p of S.projectiles) drawProjectile(p);
  // Kai
  const k = S.kai;
  if (S.hideKai) {}
  else if (S.phase !== 'start' && !(k.hitTimer > 0 && Math.floor(k.hitTimer / 5) % 2 === 0)) {
    const push = k.ground && !k.flipping && k.pushT < 34 ? k.pushT / 34 : 0;
    const air = !k.ground && !k.platform;
    // nose up on the way up, then the board levels out – a skater lands flat on all four wheels
    // OLLIE (goofy): the left foot snaps the tail down → the nose comes up, the right foot slides up to the nose
    // and levels the board, knees pulled up; then the board stays flat under the feet and lands on all four wheels.
    let pose = { boardAngle: 0, boardLift: 0, slide: 0, crouch: null };
    if (air && k.ollieT != null && !k.flipping) {
      const t = k.ollieT;
      const toGround = clamp((k.takeoffY ?? FLOOR) - k.y, 0, 28);          // how far the tail can still reach the ground
      if (t < 6) {
        // pop: back leg fully stretched, tail snapped onto the ground, nose up, front knee pulled up
        const u = Math.min(1, t / 3);
        pose = { boardAngle: -0.5 * u, boardLift: toGround + 9 * u, slide: Math.min(1, t / 6) * 0.45, crouch: 0, straightBack: true };
      }
      else if (t < 16) { const u = (t - 6) / 10; pose = { boardAngle: -0.5 * (1 - u) * (1 - u), boardLift: toGround * (1 - u) - 11 * Math.sin(u * Math.PI / 2), slide: 0.45 + 0.55 * u, crouch: 6 }; }
      else { const down = clamp(k.vy / 5, 0, 1); pose = { boardAngle: 0, boardLift: -11 * (1 - down), slide: 1 - down, crouch: 6 - down * 2 }; }
    }
    const tilt = air ? 0 : k.grind ? -0.05 : 0;
    if (k.natas) {
      const c = Math.cos(k.natas.rot);
      ctx.save(); ctx.translate(k.x, 0); ctx.scale(Math.abs(c) < 0.08 ? 0.08 * Math.sign(c || 1) : c, 1); ctx.translate(-k.x, 0);
      drawKaiFigure({ x: k.x, y: k.y, tilt: 0, crouch: 4, push: 0, flip: 0, armsUp: true, wind: 0.3 });
      ctx.restore();
      // spin counter
      ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 16px Arial'; ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = OUT; ctx.lineWidth = 4;
      const txt = '↻ ' + Math.min(k.natas.spins + 1, Math.round(k.natas.target / (Math.PI * 2))) + ' / ' + Math.round(k.natas.target / (Math.PI * 2));
      ctx.strokeText(txt, k.x, k.y - 132); ctx.fillText(txt, k.x, k.y - 132); ctx.restore();
    } else
    drawKaiFigure({ x: k.x, y: k.y, tilt, boardAngle: pose.boardAngle, boardLift: pose.boardLift, slide: pose.slide, straightBack: pose.straightBack, crouch: pose.crouch != null ? pose.crouch : air ? (k.vy < 0 ? 6 : 4) : k.landT > 0 ? 3 + k.landT * 0.6 : push ? 3 : 0, push, flip: k.flip, armsUp: air, ouch: k.hitTimer > 50, wind: 1, outfit: SAVE.outfit, wings: S.phase === 'ascend' ? k.wing : undefined });
  } else if (S.phase === 'start') drawKaiFigure({ x: k.x, y: k.y, tilt: 0, crouch: 0, push: 0, flip: 0, wind: 0.4, outfit: SAVE.outfit });
  if (S.party || S.pin) drawPinataGame();
  for (const p of S.particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life)); ctx.fillStyle = p.color;
    if (p.candy) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot += 0.1); ctx.beginPath(); ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-11, -4); ctx.lineTo(-11, 4); ctx.closePath(); ctx.moveTo(6, 0); ctx.lineTo(11, -4); ctx.lineTo(11, 4); ctx.closePath(); ctx.fill(); ctx.restore(); if (p.y > FLOOR) { p.y = FLOOR; p.vy *= -0.3; p.vx *= 0.6; } continue; }
    if (p.coin) { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(Math.abs(Math.cos(S.t * 0.3 + p.vx)), 1); ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); if (p.y > FLOOR) { p.y = FLOOR; p.vy *= -0.3; p.vx *= 0.6; } continue; }
    if (p.shard) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); }
    else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (S.noHud) return;
  ctx.save(); ctx.translate(0, -DY); drawHUD(); ctx.restore();
  drawPinataUI();
  ctx.save(); ctx.translate(0, -DY / 2); drawScreens(); ctx.restore();   // menus centred on the tall screen
}

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 16.667, 3);
  last = now;
  update(dt); draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.__S = S; window.__test = { startBoss, addObject, addCoinArc, runEvent, resetGame };
})();
</script>
</body>
</html>
