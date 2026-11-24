
// =====================================================================
//  PIÑATA PARTY – mini game in the city
// =====================================================================
const PINATA_HITS = 6;                 // hits needed before the song (2 passes of Matt's MP3) ends
const PIN_L_DOWN = 190, PIN_L_UP = 78;   // rope length: normal / pulled all the way up
const PIN_TYPES = [
  { id: 'star', name: 'Stern' },
  { id: 'trex', name: 'T-Rex' },
  { id: 'rocket', name: 'Rakete' },
];
const PIN_BTN = {
  yes: { x: 0, y: 0, w: 70, h: 30 }, no: { x: 0, y: 0, w: 70, h: 30 },
  cards: PIN_TYPES.map((t, i) => ({ x: W / 2 - 255 + i * 180, y: 78, w: 150, h: 190 })),
};

function partyPivot() { const p = S.party; return { x: p.x + 220, y: 22 }; }

// ---------- flow ----------
function pinataInput(p) {
  if (S.phase === 'pinataAsk') {
    if (inRect(p, PIN_BTN.yes)) { S.phase = 'pinataPick'; Audio.play('flip'); }
    else if (inRect(p, PIN_BTN.no)) { endParty(); flash(tx('Viel Spaß noch!'), 60); }
    return true;
  }
  if (S.phase === 'pinataPick') {
    PIN_BTN.cards.forEach((c, i) => { if (inRect(p, c)) startPinata(PIN_TYPES[i].id); });
    return true;
  }
  return false;
}
function startPinata(type) {
  const plan = Audio.playSong(2);
  S.pin = {
    type, hits: 0, theta: 0.65, omega: 0, L: PIN_L_DOWN, Lt: PIN_L_DOWN, up: false, upT: rand(260, 420),
    spin: 0, rot: 0, shake: 0, swing: 0, cracks: [], t0: plan.t0 ?? (Audio.now() + 0.1), plan, done: false, end: 0, result: null,
  };
  S.phase = 'pinata';
  flash(isTouch ? tx('¡Dale! Linke Taste = springen · rechte Taste = schlagen') : tx('¡Dale! Klick = springen · Rechtsklick / X = schlagen'), 160);
}
function endParty() {
  Audio.stopSong();
  if (S.pin && S.pin.result === 'win') { SAVE.mini.pinata = true; writeSave(); }
  if (S.mini) { S.pin = null; goToWorld('tiefsee.html', 'final=1'); return; }   // came from the final screen
  S.phase = 'play'; S.partyDone = true; S.pin = null;
  pointers.clear(); keyDown = false;
}
function swingStick() {
  const pin = S.pin; if (!pin || pin.done || pin.swing > 0) return;
  pin.swing = 22; pin.checked = false;
  Audio.play('swish');
}
function pinataPos() {
  const pin = S.pin, pv = partyPivot();
  return { x: pv.x + Math.sin(pin.theta) * pin.L, y: pv.y + Math.cos(pin.theta) * pin.L, ang: pin.theta };
}
const PIN_G = 0.31;                      // pendulum "gravity" (≈ 2.6 s per swing at full rope length)
function updatePinata(dt) {
  const pin = S.pin;
  if (!pin) return;
  const k = S.kai;
  // ---- Kai can jump during the piñata game (hold = higher) ----
  const hold = pointers.size > 0 || keyDown;
  if (pressQueued) { pressQueued = false; if (k.ground) { k.vy = JUMP_V; k.ground = false; Audio.play('jump'); } }
  if (!k.ground) {
    k.vy = Math.min(k.vy + (hold && k.vy < 0 ? HOLD_GRAV : GRAV) * dt, 14);
    k.y += k.vy * dt;
    if (k.y >= FLOOR) { k.y = FLOOR; k.vy = 0; k.ground = true; Audio.play('land'); }
  }
  // ---- rope: the kid pulls the piñata up and holds it there until Kai hits it ----
  if (!pin.done && !pin.up) {
    pin.upT -= dt;
    if (pin.upT <= 0) { pin.up = true; pin.Lt = PIN_L_UP; flash(tx('Hochgezogen! Spring hoch und schlag zu!'), 110); }
  }
  pin.L += (pin.Lt - pin.L) * Math.min(1, (pin.up ? 0.06 : 0.05) * dt);
  // ---- real pendulum ----
  const L = Math.max(60, pin.L);
  pin.omega += -(PIN_G / L) * Math.sin(pin.theta) * dt;
  pin.omega *= Math.pow(pin.up ? 0.94 : 0.9992, dt);          // hangs (almost) still when pulled up
  if (!pin.up && !pin.done) {
    // the rope kid keeps it swinging: add a little energy when the swing gets small
    const energy = 0.5 * L * pin.omega * pin.omega + PIN_G * (1 - Math.cos(pin.theta));
    const target = PIN_G * (1 - Math.cos(0.55 + pin.hits * 0.05));
    if (energy < target && Math.abs(pin.theta) < 0.25) pin.omega *= 1 + 0.02 * dt;
  }
  pin.theta += pin.omega * dt;
  // the rope can't swing it into the pole: soft limit
  if (Math.abs(pin.theta) > 0.9 && Math.sign(pin.omega) === Math.sign(pin.theta)) pin.omega *= Math.pow(0.8, dt);
  pin.spin *= Math.pow(0.93, dt); pin.rot += pin.spin * dt;
  pin.rot += (-pin.rot) * Math.min(1, 0.04 * dt);
  if (pin.shake > 0) pin.shake -= dt;
  // ---- stick: the hit is checked when the stick is horizontal ----
  if (pin.swing > 0) {
    pin.swing -= dt;
    if (!pin.checked && pin.swing < 12) {
      pin.checked = true;
      const pp = pinataPos(), tipX = k.x + 100, tipY = k.y - 72;
      if (!pin.done && Math.hypot(pp.x - tipX, pp.y - tipY) < 58) hitPinata(pp);
    }
  }
  // ---- song timing ----
  const songT = Audio.now() - pin.t0;
  if (!pin.done && songT >= pin.plan.total) {
    pin.done = true; pin.result = 'timeout'; pin.end = 170; pin.up = true; pin.Lt = 40;
    Audio.stopSong(); flash(tx('¡Se acabó el tiempo! Keine Geschenke…'), 150);
  }
  if (pin.done) { pin.end -= dt; if (pin.end <= 0 && k.ground) endParty(); }
  updateParticles(dt);
}
function hitPinata(pp) {
  const pin = S.pin;
  pin.hits++; pin.shake = 16; S.shake = 6;
  // bounce: the stick swings to the right, the piñata flies away from it
  pin.omega = -pin.omega * 0.3 + 0.02 + pin.hits * 0.0015;
  pin.spin = rand(0.08, 0.14) * (Math.random() < 0.5 ? -1 : 1);
  if (pin.up) { pin.up = false; pin.Lt = PIN_L_DOWN; pin.upT = rand(300, 460); }
  pin.cracks.push({ a: rand(0, Math.PI * 2), l: rand(10, 22) });
  Audio.play('whack');
  const cols = ['#ff5fa2', '#ffd23a', '#36c6f4', '#7fcf8a', '#b59de0', '#ff8a3a'];
  for (let i = 0; i < 10; i++) S.particles.push({ x: pp.x, y: pp.y, vx: rand(-1, 5), vy: rand(-5, 1), r: rand(2, 4), color: cols[i % cols.length], life: 1.2, g: 0.25, shard: true, rot: rand(0, 6) });
  if (pin.hits >= PINATA_HITS) {
    pin.done = true; pin.result = 'win'; pin.end = 200; SAVE.mini.pinata = true; miniPts('pinata'); writeSave();
    Audio.stopSong(); Audio.play('pinataPop'); setTimeout(() => Audio.play('cheer'), 300);
    S.coins += 15; S.hearts += 1; S.heartFlash = -40; S.shake = 14;
    for (let i = 0; i < 46; i++) {
      const a = rand(-Math.PI, 0), v = rand(3, 9);
      S.particles.push({ x: pp.x, y: pp.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(4, 7), color: cols[i % cols.length], life: 2.4, g: 0.28, candy: true, rot: rand(0, 6) });
    }
    for (let i = 0; i < 14; i++) S.particles.push({ x: pp.x, y: pp.y, vx: rand(-5, 5), vy: rand(-9, -3), r: 7, color: '#ffd23a', life: 2.2, g: 0.3, coin: true });
    flash(tx('¡PIÑATA! +15 Münzen · +1 Herz'), 170);
  } else flash(`¡Dale! ${pin.hits} / ${PINATA_HITS}`, 50);
}

// ---------- drawing: piñatas ----------
const FRINGE = ['#ff5fa2', '#ffd23a', '#36c6f4', '#7fcf8a', '#ff8a3a', '#b59de0'];
function fringeFill(pathFn, bands, x0, y0, w, h) {
  // paper fringe: coloured bands with little scallops
  ctx.save(); pathFn(); ctx.clip();
  const bh = h / bands.length;
  bands.forEach((c, i) => {
    ctx.fillStyle = c; ctx.fillRect(x0, y0 + i * bh, w, bh + 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
    for (let fx = x0; fx < x0 + w; fx += 5) { ctx.beginPath(); ctx.moveTo(fx, y0 + i * bh + 1); ctx.lineTo(fx + 2.5, y0 + (i + 1) * bh - 1); ctx.stroke(); }
  });
  ctx.restore();
}
function drawPinataShape(type, x, y, s, rot, cracks = []) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  if (type === 'star') {
    // the classic 7-point piñata: round body with paper cones and streamers
    const cones = 7;
    for (let i = 0; i < cones; i++) {
      const a = -Math.PI / 2 + i / cones * Math.PI * 2;
      const bx = Math.cos(a) * 22, by = Math.sin(a) * 22, tx = Math.cos(a) * 58, ty = Math.sin(a) * 58;
      const nx = -Math.sin(a) * 11, ny = Math.cos(a) * 11;
      const path = () => { ctx.beginPath(); ctx.moveTo(bx + nx, by + ny); ctx.lineTo(tx, ty); ctx.lineTo(bx - nx, by - ny); ctx.closePath(); };
      fringeFill(path, [FRINGE[i % 6], FRINGE[(i + 2) % 6], FRINGE[(i + 4) % 6]].reverse(), -70, -70, 140, 140);
      path(); ctx.stroke();
      // streamers at the tips
      for (let r = 0; r < 3; r++) {
        ctx.strokeStyle = FRINGE[(i + r) % 6]; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(tx, ty);
        ctx.quadraticCurveTo(tx + Math.cos(a) * 8 + Math.sin(S.t * 0.2 + r + i) * 4, ty + 10, tx + Math.cos(a) * 4 + (r - 1) * 4, ty + 22 + r * 3);
        ctx.stroke();
      }
      ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    }
    const body = () => { ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); };
    fringeFill(body, ['#ff5fa2', '#ffd23a', '#36c6f4', '#7fcf8a', '#ff8a3a'], -30, -28, 60, 56);
    body(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-9, -10, 7, 4, -0.6, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'trex') {
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(-58, 6); ctx.quadraticCurveTo(-40, -10, -18, -12);       // tail
      ctx.quadraticCurveTo(0, -30, 18, -24);                               // back
      ctx.lineTo(26, -40); ctx.quadraticCurveTo(30, -52, 52, -50);          // neck + head top
      ctx.lineTo(62, -40); ctx.lineTo(60, -30); ctx.lineTo(44, -30);        // snout + jaw
      ctx.lineTo(40, -24); ctx.lineTo(30, -20);
      ctx.quadraticCurveTo(26, 4, 14, 12);                                 // belly
      ctx.lineTo(16, 34); ctx.lineTo(6, 34); ctx.lineTo(4, 16);             // front leg
      ctx.lineTo(-12, 16); ctx.lineTo(-12, 34); ctx.lineTo(-22, 34); ctx.lineTo(-24, 10);
      ctx.quadraticCurveTo(-40, 8, -58, 6); ctx.closePath();
    };
    // back spikes: sitting exactly ON the back line (tail → back), pointing away from the body.
    // Drawn before the body, so their base disappears into the back.
    const q = (a, c, b, t) => ({ x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y });
    const qd = (a, c, b, t) => ({ x: 2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x), y: 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y) });
    const SEG = [[{ x: -58, y: 6 }, { x: -40, y: -10 }, { x: -18, y: -12 }], [{ x: -18, y: -12 }, { x: 0, y: -30 }, { x: 18, y: -24 }]];
    ctx.fillStyle = '#ff8a3a'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    for (const u of [0.45, 0.72, 1.0, 1.25, 1.5, 1.75]) {
      const sg = SEG[u < 1 ? 0 : 1], t = u < 1 ? u : u - 1;
      const pt = q(sg[0], sg[1], sg[2], t), d = qd(sg[0], sg[1], sg[2], t), L = Math.hypot(d.x, d.y) || 1;
      const dx = d.x / L, dy = d.y / L; let nx = dy, ny = -dx; if (ny > 0) { nx = -nx; ny = -ny; }
      const h = u > 0.9 && u < 1.6 ? 11 : 8, w = 5;
      ctx.beginPath();
      ctx.moveTo(pt.x - dx * w - nx * 3, pt.y - dy * w - ny * 3);
      ctx.lineTo(pt.x + nx * h, pt.y + ny * h);
      ctx.lineTo(pt.x + dx * w - nx * 3, pt.y + dy * w - ny * 3);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    fringeFill(body, ['#3f9b4f', '#58b865', '#3f9b4f', '#58b865', '#3f9b4f', '#58b865', '#3f9b4f'], -62, -54, 126, 90);
    body(); ctx.stroke();
    // teeth, eye, arm, spikes
    ctx.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(46 + i * 4, -30); ctx.lineTo(48 + i * 4, -26); ctx.lineTo(50 + i * 4, -30); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(46, -42, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(47, -42, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(26, -10); ctx.lineTo(34, -4); ctx.lineTo(36, 2); ctx.stroke();
  } else if (type === 'rocket') {
    const body = () => {
      ctx.beginPath(); ctx.moveTo(0, -60); ctx.quadraticCurveTo(22, -40, 20, 0); ctx.lineTo(20, 30); ctx.lineTo(-20, 30); ctx.lineTo(-20, 0); ctx.quadraticCurveTo(-22, -40, 0, -60); ctx.closePath();
    };
    // fins
    ctx.fillStyle = '#e8463c';
    ctx.beginPath(); ctx.moveTo(-20, 6); ctx.lineTo(-38, 32); ctx.lineTo(-20, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, 6); ctx.lineTo(38, 32); ctx.lineTo(20, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
    fringeFill(body, ['#e8463c', '#e8463c', '#ffffff', '#ffffff', '#36c6f4', '#ffffff', '#ffffff', '#e8463c'], -24, -62, 48, 94);
    body(); ctx.stroke();
    ctx.fillStyle = '#9fd3e8'; ctx.beginPath(); ctx.arc(0, -18, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(-3, -21, 3, 0, Math.PI * 2); ctx.fill();
    // tissue-paper flames
    for (let i = 0; i < 7; i++) {
      ctx.strokeStyle = ['#ffd23a', '#ff8a3a', '#e8463c'][i % 3]; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-15 + i * 5, 30); ctx.quadraticCurveTo(-15 + i * 5 + Math.sin(S.t * 0.3 + i) * 5, 42, -15 + i * 5 + Math.sin(S.t * 0.2 + i) * 3, 52 + (i % 3) * 5); ctx.stroke();
    }
  }
  // cracks from hits
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2;
  for (const c of cracks) { ctx.beginPath(); ctx.moveTo(Math.cos(c.a) * 6, Math.sin(c.a) * 6); ctx.lineTo(Math.cos(c.a) * c.l, Math.sin(c.a) * c.l); ctx.lineTo(Math.cos(c.a + 0.4) * (c.l + 6), Math.sin(c.a + 0.4) * (c.l + 6)); ctx.stroke(); }
  ctx.restore();
}

// ---------- drawing: party scene ----------
function drawKid(x, y, shirt, hair, cheer, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  const arm = cheer ? -1 : 0;
  ctx.fillStyle = '#c88a5a';
  ctx.beginPath(); ctx.moveTo(-6, -24); ctx.lineTo(-6, 0); ctx.lineTo(-2, 0); ctx.lineTo(-2, -24); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2, -24); ctx.lineTo(2, 0); ctx.lineTo(6, 0); ctx.lineTo(6, -24); ctx.fill(); ctx.stroke();
  ctx.fillStyle = shirt; ctx.beginPath(); ctx.roundRect(-10, -50, 20, 28, 5); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#c88a5a'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-9, -44); ctx.lineTo(-17, -44 + (arm ? -16 : 14)); ctx.moveTo(9, -44); ctx.lineTo(17, -44 + (arm ? -16 : 14)); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.fillStyle = '#e0a878'; ctx.beginPath(); ctx.arc(0, -60, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(0, -63, 11, Math.PI, 0); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(-4, -60, 1.5, 0, Math.PI * 2); ctx.arc(4, -60, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -56, cheer ? 4 : 3, 0.1, Math.PI - 0.1); ctx.stroke();
  ctx.restore();
}
function drawParty(o) {
  const pv = { x: o.x + 220, y: 22 }, f = FLOOR;
  ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  // wooden pole with arm and pulley
  const poleX = o.x + 420;
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(poleX - 5, pv.y - 6, 10, f - pv.y + 6); ctx.strokeRect(poleX - 5, pv.y - 6, 10, f - pv.y + 6);
  ctx.fillRect(pv.x - 6, pv.y - 6, poleX - pv.x + 6, 9); ctx.strokeRect(pv.x - 6, pv.y - 6, poleX - pv.x + 6, 9);
  ctx.fillStyle = '#9aa6b1'; ctx.beginPath(); ctx.arc(pv.x, pv.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // banner
  const sx = (pv.x + poleX) / 2 + 30;
  ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx - 40, pv.y + 3); ctx.lineTo(sx - 40, 44); ctx.moveTo(sx + 40, pv.y + 3); ctx.lineTo(sx + 40, 44); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(sx - 60, 44, 120, 26, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8463c'; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center'; ctx.fillText(tx('¡FIESTA!'), sx, 63);
  // rope down to the kid who pulls it
  ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(poleX - 6, pv.y); ctx.lineTo(poleX - 14, f - 50); ctx.stroke();
  const cheer = S.pin && S.pin.shake > 0 || (S.pin && S.pin.result === 'win');
  drawKid(poleX - 24, f - 4, '#36c6f4', '#3a2a1a', false);
  drawKid(o.x + 470, f - 4, '#ff5fa2', '#6b3f1f', cheer, 0.95);
  drawKid(o.x + 510, f - 4, '#ffd23a', '#1a1a1a', cheer, 1.05);
  drawKid(o.x + 550, f - 4, '#7fcf8a', '#8a5a2b', cheer, 0.9);
  // table with a cake
  ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.fillStyle = '#f6c94c'; ctx.fillRect(o.x + 590, f - 34, 70, 8); ctx.strokeRect(o.x + 590, f - 34, 70, 8);
  ctx.fillStyle = '#8a5a2b'; ctx.fillRect(o.x + 596, f - 26, 6, 26); ctx.fillRect(o.x + 648, f - 26, 6, 26);
  ctx.fillStyle = '#ff8fb8'; ctx.beginPath(); ctx.roundRect(o.x + 606, f - 54, 38, 20, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(o.x + 606, f - 48, 38, 4);
  ctx.restore();
  // the hanging piñata (before / after the game it just hangs there)
  if (!S.pin && !S.partyDone) { ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pv.x, pv.y); ctx.lineTo(pv.x, pv.y + 140); ctx.stroke(); drawPinataShape('star', pv.x, pv.y + 190, 0.85, Math.sin(S.t * 0.04) * 0.08); }
}
function drawPinataGame() {
  const pin = S.pin, k = S.kai;
  if (pin && !(pin.result === 'win' && pin.end < 190)) {
    const pp = pinataPos(), pv = partyPivot();
    ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pv.x, pv.y); ctx.lineTo(pp.x - Math.sin(pp.ang) * 40, pp.y - Math.cos(pp.ang) * 40); ctx.stroke();
    const sh = pin.shake > 0 ? Math.sin(pin.shake * 1.7) * 0.18 : 0;
    drawPinataShape(pin.type, pp.x, pp.y, 0.9, -pp.ang + pin.rot + sh, pin.cracks);
  }
  // Kai's stick
  if (S.phase === 'pinata' || S.phase === 'pinataAsk' || S.phase === 'pinataPick') {
    const sw = pin && pin.swing > 0 ? pin.swing : 0;
    const prog = sw > 0 ? 1 - sw / 24 : 0;                       // 0 → 1 over the swing
    const ang = -2.0 + Math.sin(Math.min(1, prog * 1.6) * Math.PI / 2) * 2.2 - (prog > 0.62 ? (prog - 0.62) * 5.8 : 0);
    const hx = k.x + 30, hy = k.y - 66;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang); ctx.lineCap = 'round';
    ctx.strokeStyle = OUT; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(72, 0); ctx.stroke();
    ctx.strokeStyle = '#c98f4a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(72, 0); ctx.stroke();
    ctx.strokeStyle = '#e8463c'; ctx.lineWidth = 5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(14 + i * 16, 0); ctx.lineTo(20 + i * 16, 0); ctx.stroke(); }
    ctx.restore();
    if (sw > 10 && sw < 18) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy, 78, -0.9, 0.3); ctx.stroke(); }
  }
}
function drawPinataUI() {
  const pin = S.pin;
  if (S.phase === 'pinataAsk') {
    const kidX = S.party.x + 510, kidY = FLOOR - 80;
    const txt = tx('¡Kai! Hilfst du uns mit der Piñata?');
    ctx.save(); ctx.font = 'bold 15px Arial'; const tw = ctx.measureText(txt).width;
    const bw = tw + 30, bh = 78, bx = clamp(kidX - bw / 2, 300, W - bw - 10), by = kidY - 120;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(kidX - 10, by + bh); ctx.lineTo(kidX, by + bh + 18); ctx.lineTo(kidX + 10, by + bh); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(kidX - 9, by + bh - 3, 18, 5);
    ctx.fillStyle = OUT; ctx.textBaseline = 'middle'; ctx.fillText(txt, bx + 15, by + 22);
    PIN_BTN.yes.x = bx + bw / 2 - 80; PIN_BTN.yes.y = by + 40; PIN_BTN.no.x = bx + bw / 2 + 10; PIN_BTN.no.y = by + 40;
    for (const [b, label, c1, c2] of [[PIN_BTN.yes, tx('JA'), '#34c759', '#1f8f3c'], [PIN_BTN.no, tx('NEIN'), '#ff5a4f', '#c0352c']]) {
      const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h); g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1); ctx.textAlign = 'left';
    }
    ctx.restore();
  }
  if (S.phase === 'pinataPick') {
    ctx.save(); ctx.fillStyle = 'rgba(10,20,40,0.7)'; ctx.fillRect(0, -VH, W, 3 * VH);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Arial'; ctx.fillText(tx('Welche Piñata?'), W / 2, 52);
    PIN_BTN.cards.forEach((c, i) => {
      const g = ctx.createLinearGradient(0, c.y, 0, c.y + c.h); g.addColorStop(0, '#fff7e0'); g.addColorStop(1, '#ffe2b6');
      ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 14); ctx.fill(); ctx.stroke();
      drawPinataShape(PIN_TYPES[i].id, c.x + c.w / 2, c.y + 82, PIN_TYPES[i].id === 'star' ? 0.95 : 0.9, Math.sin(S.t * 0.05 + i) * 0.08);
      ctx.fillStyle = OUT; ctx.font = 'bold 16px Arial'; ctx.fillText(tx(PIN_TYPES[i].name), c.x + c.w / 2, c.y + c.h - 16);
    });
    ctx.restore();
  }
  if (S.phase === 'pinata' && pin) {
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // hit counter
    ctx.fillStyle = 'rgba(20,30,50,0.65)'; ctx.beginPath(); ctx.roundRect(W / 2 - 110, 8, 220, 28, 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Arial'; ctx.fillText(tx('PIÑATA'), W / 2 - 60, 22);
    for (let i = 0; i < PINATA_HITS; i++) { ctx.fillStyle = i < pin.hits ? '#ffd23a' : 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(W / 2 - 20 + i * 20, 22, 6, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = 'bold 11px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    const hint = isTouch ? tx('Linke Taste = springen  ·  rechte Taste = schlagen') : tx('Klick / Leertaste = springen  ·  Rechtsklick / X = schlagen');
    ctx.strokeText(hint, W / 2, H - 82); ctx.fillText(hint, W / 2, H - 82);
    // karaoke
    const t = Audio.now() - pin.t0, lines = pin.plan.lines;
    let li = lines.findIndex(L => t >= L.start && t < L.start + L.dur);
    if (t < 0) li = 0;
    if (li >= 0 && !pin.done) {
      const L = lines[li], next = lines[li + 1];
      ctx.fillStyle = 'rgba(20,30,50,0.72)'; ctx.beginPath(); ctx.roundRect(W / 2 - 260, H - 70, 520, 60, 14); ctx.fill();
      ctx.font = 'bold 22px Arial';
      const tw = ctx.measureText(L.text).width, prog = clamp((t - L.start) / L.dur, 0, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillText(L.text, W / 2, H - 50);
      ctx.save(); ctx.beginPath(); ctx.rect(W / 2 - tw / 2, H - 66, tw * prog, 32); ctx.clip();
      ctx.fillStyle = '#ffd23a'; ctx.fillText(L.text, W / 2, H - 50); ctx.restore();
      if (next) { ctx.font = 'bold 12px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillText(next.text, W / 2, H - 24); }
      ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#7fe0ff'; ctx.textAlign = 'left'; ctx.fillText(tx("Strophe {a} / {b}", { a: L.rep + 1, b: 2 }), W / 2 - 250, H - 62);
    }
    ctx.restore();
  }
}

// piñata straight from the final screen
if (QUERY.get('mini') === 'pinata') { S.mini = true; S.party = addObject('party', 150); S.phase = 'pinataPick'; }

// ZURÜCK inside the city: from the piñata choice back to the question
function worldCanBack() { return S.phase === 'pinataPick' && !S.mini; }
function worldBack() { S.phase = 'pinataAsk'; Audio.play('tink'); }
