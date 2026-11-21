
// ================= KAI (shared by all Level 2 worlds) =================
// o = { x, y, tilt, diver, crouch, push (0..1), flip (board rotation for kickflip), prop (propeller angle), wind (0..1), outfit,
//       boardAngle (ollie: nose up < 0, turns around the tail), boardLift (board pulled up to the feet, < 0), slide (front foot slides to the nose 0..1) }
// Kai rides GOOFY: right foot in front, left foot on the tail. Riding to the right his back faces us,
// so the pushing foot (left) steps down on the far side – it is drawn BEHIND the board.
function limb(x1, y1, x2, y2, w1, w2, color) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1 + nx * w1, y1 + ny * w1); ctx.lineTo(x2 + nx * w2, y2 + ny * w2);
  ctx.lineTo(x2 - nx * w2, y2 - ny * w2); ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
  ctx.closePath(); ctx.fill(); ctx.stroke();
}
function drawKaiFigure(o) {
  const OF = o.outfit || {}, SKIN = '#f2c79e', TEE = OF.tee || '#1f3c6e', CAP = OF.cap || '#1e4fa3', SHORTS = '#b4652e', SHOE = OF.shoes || '#1b1b22';
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.tilt || 0);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  const shoe = (sx, sy, rot = 0, far = false) => {
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(rot);
    ctx.fillStyle = far ? shade(SHOE) : SHOE;
    ctx.beginPath(); ctx.roundRect(-9, -8, 21, 8, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = far ? '#d8d8d8' : '#ffffff'; ctx.fillRect(-8, -2, 19, 2.5);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(2, -4); ctx.stroke();
    ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.restore();
  };
  // two-bone leg with a knee that always bends forward
  const L1 = 18, L2 = 18;
  const knee = (hx, hy, ax, ay) => {
    let dx = ax - hx, dy = ay - hy, d = Math.hypot(dx, dy);
    const maxD = L1 + L2 - 0.01;
    if (d > maxD) { ax = hx + dx / d * maxD; ay = hy + dy / d * maxD; dx = ax - hx; dy = ay - hy; d = maxD; }
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const px = hx + a * dx / d, py = hy + a * dy / d;
    // Kai rides goofy with his back to us: the knee bends towards his chest = away from the camera.
    // So the knee is not pushed out sideways – the leg just looks shorter when he bends it.
    let kx = px - h * dy / d * 0.12, ky = py + h * dx / d * 0.12;
    if (kx < px) { kx = px + h * dy / d * 0.12; ky = py - h * dx / d * 0.12; }
    return { kx, ky, ax, ay };
  };
  let crouch = o.crouch || 0; const push = o.push || 0, flip = o.flip || 0;
  const feetLift = flip ? 10 : 0;
  const bA = o.boardAngle || 0, bL = o.boardLift || 0, slide = o.slide || 0;
  const PIV = { x: -38, y: -4 };                                   // the tail end of the board touches the ground
  // a point on the deck (local board coords) → figure coords, following the ollie pose
  const deckPt = (x, y) => { const c = Math.cos(bA), s = Math.sin(bA), dx = x - PIV.x, dy = y - PIV.y; return { x: PIV.x + dx * c - dy * s, y: PIV.y + dx * s + dy * c + bL }; };
  const SKIN_FAR = '#d9ad84', SHORTS_FAR = '#94511f';
  // back foot on the tail, front foot near the bolts (slides up to the nose in an ollie)
  const tailP = deckPt(-25, -13), frontP = deckPt(15 + slide * 13, -13);
  // POP: the back leg is fully stretched and snaps the tail onto the ground – the hip sits exactly one leg length above the tail
  if (o.straightBack) { const dx = tailP.x + 8, ay = tailP.y - 7; crouch = ay - Math.sqrt(Math.max(0, 35.4 * 35.4 - dx * dx)) + 46; }

  // ---------- the pushing (left) leg is on the far side of the board ----------
  const pp = Math.sin(Math.PI * push);
  const hipY = -46 + crouch + pp * 12;
  const pushing = pp > 0.02 && !flip;
  if (pushing) {
    // foot steps down beside the board, a bit higher (further away), and kicks backwards
    const ax = 2 - pp * 46, ay = -1 - (1 - pp) * 12;          // sweeps back on the ground, ends behind the tail
    const j = knee(-8, hipY, ax, ay);
    limb(-8, hipY, j.kx, j.ky, 5, 4.4, SKIN_FAR); limb(j.kx, j.ky, j.ax, j.ay, 4.4, 3.8, SKIN_FAR);
    ctx.fillStyle = SKIN_FAR; ctx.beginPath(); ctx.arc(j.kx, j.ky, 4.4, 0, Math.PI * 2); ctx.fill();
    limb(j.ax, j.ay - 4, j.ax, j.ay, 4, 4, '#dcdcdc'); shoe(j.ax, j.ay + 7, pp * 0.3, true);
    const dx = j.kx + 8, dy = j.ky - hipY, d = Math.hypot(dx, dy) || 1;
    limb(-8, hipY, -8 + dx / d * 10, hipY + dy / d * 10, 7, 6.5, SHORTS_FAR);
  }

  // ---------- skateboard ----------
  ctx.save();
  if (bA || bL) { ctx.translate(PIV.x, PIV.y + bL); ctx.rotate(bA); ctx.translate(-PIV.x, -PIV.y); }
  ctx.translate(0, -11);
  if (flip) ctx.scale(1, Math.cos(flip));          // kickflip: the board spins around its long axis
  ctx.translate(0, 11);
  for (const wx of [-26, 24]) {
    ctx.fillStyle = '#f3efe6'; ctx.beginPath(); ctx.arc(wx, -3, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9aa3ad'; ctx.beginPath(); ctx.arc(wx, -3, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#8b96a1';
  ctx.fillRect(-31, -11, 11, 4); ctx.strokeRect(-31, -11, 11, 4);
  ctx.fillRect(19, -11, 11, 4); ctx.strokeRect(19, -11, 11, 4);
  if (o.diver) {
    ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.roundRect(-52, -12, 14, 6, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e0b95a'; ctx.beginPath(); ctx.roundRect(-44, -17, 10, 12, 3); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(-54, -9);
    for (let i = 0; i < 3; i++) {
      const a = (o.prop || 0) + i * Math.PI * 2 / 3, len = Math.cos(a) * 11;
      ctx.fillStyle = Math.sin(a) > 0 ? '#f2cf6b' : '#b98d2f';
      ctx.beginPath(); ctx.ellipse(0, len / 2, 3.2, Math.abs(len / 2) + 1, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#7a5b1c'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // deck (grip side up, or graphic side when flipped)
  const underside = flip && Math.cos(flip) < 0;
  ctx.fillStyle = underside ? '#e8463c' : '#1d2530';
  ctx.beginPath();
  ctx.moveTo(-40, -19); ctx.quadraticCurveTo(-36, -13, -30, -13);
  ctx.lineTo(30, -13); ctx.quadraticCurveTo(37, -13, 41, -20);
  ctx.lineTo(43, -17); ctx.quadraticCurveTo(38, -9, 30, -9);
  ctx.lineTo(-30, -9); ctx.quadraticCurveTo(-39, -9, -43, -16); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.strokeStyle = underside ? '#ffd23a' : '#e8463c'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-28, -11); ctx.lineTo(28, -11); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.restore();

  // ---------- angel wings (sky world) – behind everything ----------
  if (o.wings !== undefined) {
    // feathered angel wings attached at the shoulders, flapping up and down
    const fl = Math.sin(o.wings) * 0.38;
    for (const [side, col] of [[1, '#e3e9f4'], [0, '#ffffff']]) {
      ctx.save(); ctx.translate(-8 + side * 5, -70 + (o.crouch || 0)); ctx.rotate(-0.15 + fl + side * 0.12);
      ctx.fillStyle = col; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-10, -22, -34, -42, -62, -40);                     // leading edge up to the tip
      ctx.quadraticCurveTo(-58, -30, -66, -24);                             // primary feathers (scallops)
      ctx.quadraticCurveTo(-56, -18, -60, -10);
      ctx.quadraticCurveTo(-48, -8, -50, 0);
      ctx.quadraticCurveTo(-38, -2, -38, 7);
      ctx.quadraticCurveTo(-26, 2, -24, 10);
      ctx.quadraticCurveTo(-12, 4, 0, 6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(20,32,46,0.22)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-6, -4); ctx.quadraticCurveTo(-26, -20, -54, -26); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-26, -8, -46, -8); ctx.moveTo(-8, 3); ctx.quadraticCurveTo(-20, 2, -32, 4); ctx.stroke();
      ctx.restore();
    }
  }
  // backpack
  if (OF.backpack && !o.diver) {
    ctx.fillStyle = '#e8463c'; ctx.beginPath(); ctx.roundRect(-27, -78 + (o.crouch || 0), 14, 26, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(-25, -66 + (o.crouch || 0), 10, 4);
  }

  // ---------- legs ----------
  const leg = (hx, hy, ax, ay, shoeRot) => {
    const j = knee(hx, hy, ax, ay);
    limb(hx, hy, j.kx, j.ky, 5, 4.4, SKIN);                         // thigh
    limb(j.kx, j.ky, j.ax, j.ay, 4.4, 3.8, SKIN);                   // shin
    ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(j.kx, j.ky, 4.4, 0, Math.PI * 2); ctx.fill();  // round knee
    limb(j.ax, j.ay - 4, j.ax, j.ay, 4, 4, '#ffffff');              // sock
    shoe(j.ax, j.ay + 7, shoeRot);
    return j;
  };
  // left (back) foot on the tail, right (front) foot near the front bolts – it slides up to the nose in an ollie
  const jb = pushing ? null : leg(-8, hipY, tailP.x, tailP.y - 7 - feetLift, bA);
  const jf = leg(11, hipY, frontP.x, frontP.y - 7 - feetLift, bA * (1 - slide));
  // shorts: waist + short legs that follow the thighs
  ctx.fillStyle = SHORTS;
  for (const [hx, j] of [[-8, jb], [11, jf]]) {
    if (!j) continue;
    const dx = j.kx - hx, dy = j.ky - hipY, d = Math.hypot(dx, dy) || 1;
    limb(hx, hipY, hx + dx / d * 10, hipY + dy / d * 10, 7, 6.5, SHORTS);
  }
  ctx.beginPath(); ctx.roundRect(-16, hipY - 8, 34, 13, 3); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;

  // ---------- torso ----------
  const ty = crouch + pp * 12;
  ctx.fillStyle = SKIN;
  ctx.beginPath(); ctx.moveTo(-12, -70 + ty); ctx.quadraticCurveTo(-26, -60 + ty, -24, -48 + ty); ctx.lineTo(-19, -48 + ty); ctx.quadraticCurveTo(-20, -58 + ty, -8, -64 + ty); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(-22, -46 + ty, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // neck (visible without the diving collar)
  if (!o.diver) { ctx.fillStyle = SKIN; ctx.fillRect(1, -82 + ty, 8, 8); ctx.strokeRect(1, -82 + ty, 8, 8); }
  ctx.fillStyle = TEE;
  ctx.beginPath();
  ctx.moveTo(-14, -76 + ty); ctx.quadraticCurveTo(2, -80 + ty, 16, -74 + ty);
  ctx.lineTo(20, -51 + ty); ctx.lineTo(-17, -51 + ty); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-14, -76 + ty); ctx.lineTo(-22, -64 + ty); ctx.lineTo(-13, -60 + ty); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  // front arm (raised a bit in the air)
  const armUp = o.armsUp ? -10 : 0;
  ctx.fillStyle = TEE;
  ctx.beginPath(); ctx.moveTo(10, -76 + ty); ctx.lineTo(22, -70 + ty); ctx.lineTo(17, -62 + ty); ctx.lineTo(8, -66 + ty); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = SKIN;
  ctx.beginPath(); ctx.moveTo(20, -70 + ty); ctx.quadraticCurveTo(32, -64 + ty + armUp, 36, -56 + ty + armUp * 1.6); ctx.lineTo(32, -53 + ty + armUp * 1.6); ctx.quadraticCurveTo(28, -60 + ty + armUp, 17, -63 + ty); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(35, -53 + ty + armUp * 1.6, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // ---------- head ----------
  const hx = 4, hy = -92 + ty;
  if (o.diver) { ctx.fillStyle = 'rgba(170,225,245,0.25)'; ctx.beginPath(); ctx.arc(hx, hy, 25, 0, Math.PI * 2); ctx.fill(); }
  const hw = (performance.now() / 16.667) * (o.diver ? 0.07 : 0.25);
  const wind = o.diver ? 0 : (o.wind ?? 1);       // on land the hair blows backwards
  ctx.fillStyle = '#f2c14e'; ctx.strokeStyle = '#a77a1a'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(hx - 1, hy - 3);
  ctx.lineTo(hx - 10, hy - 3);
  ctx.bezierCurveTo(hx - 16 - wind * 6, hy - 1, hx - 20 - wind * 10 + Math.sin(hw) * 2, hy + 6 - wind * 2, hx - 18 - wind * 12 + Math.sin(hw + 1) * 3, hy + 17 - wind * 4);
  ctx.quadraticCurveTo(hx - 14 - wind * 6, hy + 13, hx - 11 - wind * 6 + Math.sin(hw + 2) * 2, hy + 19 - wind * 2);
  ctx.quadraticCurveTo(hx - 6, hy + 11, hx - 1, hy + 4);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(167,122,26,0.7)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(hx - 12, hy - 1); ctx.quadraticCurveTo(hx - 16 - wind * 6, hy + 7, hx - 15 - wind * 9 + Math.sin(hw + 1) * 2, hy + 14 - wind * 3); ctx.stroke();
  ctx.fillStyle = '#f6cfa6'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.ellipse(hx + 3, hy + 1, 12, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(hx - 6, hy + 2, 3, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f2c14e'; ctx.strokeStyle = '#a77a1a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(hx - 9, hy - 4); ctx.quadraticCurveTo(hx - 12, hy + 4, hx - 8, hy + 10); ctx.quadraticCurveTo(hx - 6, hy + 2, hx - 3, hy - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.ellipse(hx + 9, hy, 1.8, 2.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx + 9.6, hy - 0.8, 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#a77a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx + 6, hy - 5); ctx.lineTo(hx + 11, hy - 5.5); ctx.stroke();
  ctx.fillStyle = 'rgba(240,120,110,0.35)'; ctx.beginPath(); ctx.arc(hx + 7, hy + 6, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = OUT; ctx.lineWidth = 1.6;
  if (o.ouch) { ctx.beginPath(); ctx.ellipse(hx + 10, hy + 7, 2, 2.5, 0, 0, Math.PI * 2); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(hx + 10, hy + 6, 3, 0.2, 1.4); ctx.stroke(); }
  // cap or beanie
  if (OF.beanie && !o.diver) {
    ctx.fillStyle = '#7a3fb8'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(hx - 12, hy - 1); ctx.quadraticCurveTo(hx - 12, hy - 22, hx + 3, hy - 21); ctx.quadraticCurveTo(hx + 17, hy - 20, hx + 15, hy - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9b63d6'; ctx.beginPath(); ctx.roundRect(hx - 13, hy - 6, 29, 7, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(hx + 2, hy - 23, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else {
  ctx.fillStyle = CAP; ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(hx - 12, hy - 2); ctx.quadraticCurveTo(hx - 10, hy - 19, hx + 5, hy - 17); ctx.quadraticCurveTo(hx + 15, hy - 15, hx + 14, hy - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = shade(CAP);
  ctx.beginPath(); ctx.moveTo(hx + 10, hy - 7); ctx.quadraticCurveTo(hx + 20, hy - 8, hx + 23, hy - 5); ctx.lineTo(hx + 12, hy - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(hx + 2, hy - 11, 2.2, 0, Math.PI * 2); ctx.fill();
  }
  if (OF.halo && !o.diver) {
    ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 3.5; ctx.shadowColor = '#ffe68a'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.ellipse(hx + 2, hy - 30, 13, 4, -0.1, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
  }

  if (o.diver) {
    ctx.fillStyle = '#d0a548'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(hx - 16, hy + 17, 34, 8, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a6a22';
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(hx - 10 + i * 8, hy + 21, 1.4, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = 'rgba(230,250,255,0.95)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hx, hy, 25, Math.PI * 0.82, Math.PI * 0.18 + Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(hx, hy, 26.5, Math.PI * 0.8, Math.PI * 0.2 + Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(hx - 11, hy - 13, 7, 3.5, -0.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(hx + 15, hy + 9, 3, 1.6, -0.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8463c'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.roundRect(-26, -78 + ty, 11, 24, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9aa3ad'; ctx.fillRect(-23, -82 + ty, 5, 4); ctx.strokeRect(-23, -82 + ty, 5, 4);
    ctx.strokeStyle = '#3b4652'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-20, -82 + ty); ctx.quadraticCurveTo(-18, -92 + ty, hx - 18, hy + 14); ctx.stroke();
  }
  ctx.restore();
}
function shade(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) * 0.78, g = ((n >> 8) & 255) * 0.78, b = (n & 255) * 0.78;
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
