
// =====================================================================
//  LEVEL 4 – COMMON DRAWING (HUD, panels, shop, Kai on the hoverboard, coins, hearts, shots)
//  The world's own draw file brings: drawBackground, drawGround, drawPlat, drawWalker, drawFlyer, drawDrop,
//  drawPuddle and the optional hooks drawSpecial, drawWorldMid, drawWorldFront, drawWorldTop, startPanel, drawShopClerk.
// =====================================================================
function draw() {
  ctx.save();
  if (S.shake > 0) ctx.translate(rand(-S.shake, S.shake) * 0.6, rand(-S.shake, S.shake) * 0.4);
  if (hook('drawSpecial')) { ctx.restore(); if (!S.noHud && S.phase !== 'intro') drawHUD(); if (!MENU.open) drawScreens(); return; }
  drawBackground();
  ctx.save(); ctx.translate(-S.cam, 0);
  drawGround();
  hook('drawWorldMid');
  drawCheckpoints();
  for (const p of S.plats) if (p.state !== 'gone' && onScreen(p.x - 20, p.w + 40)) drawPlat(p);
  for (const p of S.puddles) if (onScreen(p.x - p.w, p.w * 2)) drawPuddle(p);
  for (const o of S.objects) if (!o.done && onScreen(o.x - 20, 40)) { if (o.type === 'coin') drawCoin(o); else if (o.type === 'heart') drawHeart(o.x, o.y + Math.sin(o.p * 1.3) * 4, 12, true); else drawFruit(o.x, o.y + Math.sin(o.p * 1.3) * 4, 1); }
  for (const c of S.walkers) if (onScreen(c.x - 60, 120) && !(c.dead && c.deadT > 60)) drawWalker(c);
  for (const p of S.flyers) if (onScreen(p.x - 80, 160)) drawFlyer(p);
  for (const s of S.drops) drawDropShadow(s);
  for (const s of S.drops) drawDrop(s);
  hook('drawWorldFront');
  for (const s of S.eshots) drawEShot(s);
  for (const s of S.shots) drawShot(s);
  for (const p of S.particles) { ctx.globalAlpha = Math.max(0, Math.min(1, p.life)); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
  drawPops(S.pops);
  ctx.restore();
  if (!S.hideKai && !hook('drawKaiOverride')) drawKai();
  hook('drawWorldTop');
  ctx.restore();
  if (!S.noHud) drawHUD();
  if (!MENU.open) drawScreens();
}
const onScreen = (x, w) => x + w > S.cam - 60 && x < S.cam + W + 60;

// ---------------- small things ----------------
function drawCoin(o) {
  const s = Math.abs(Math.cos(o.p * 1.5));
  ctx.save(); ctx.translate(o.x, o.y + Math.sin(o.p) * 2); ctx.scale(Math.max(0.15, s), 1);
  ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#c98f10'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
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
// a mango (the elephants of Aurora 61 love them)
function drawFruit(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.3); ctx.strokeStyle = OUT; ctx.lineWidth = 1.8;
  const g = ctx.createLinearGradient(-10, -8, 10, 10); g.addColorStop(0, '#ffd23a'); g.addColorStop(0.6, '#ff9a1a'); g.addColorStop(1, '#ff5a3a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 9, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.ellipse(4, -12, 6, 3, -0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-3, -4, 2.5, 4, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawSign(x, y, text, col, floorY = FLOOR) {
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.fillStyle = SIGN_POLE; ctx.fillRect(x - 3, y, 6, floorY - y); ctx.strokeRect(x - 3, y, 6, floorY - y);
  ctx.font = 'bold 14px Arial'; const w = ctx.measureText(text).width + 22;
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - w / 2, y - 26, w, 26, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y - 12);
  ctx.restore();
}
function drawCheckpoints() {
  for (const x of CHECKPOINTS) {
    if (!onScreen(x - 30, 60)) continue;
    const on = S.cpX >= x;
    ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.fillStyle = '#8c8f9a'; ctx.beginPath(); ctx.roundRect(x - 14, FLOOR - 40, 28, 36, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c9d3dc'; ctx.fillRect(x - 2, FLOOR - 150, 4, 112);
    const wave = Math.sin(S.t * 0.12) * 4;
    ctx.fillStyle = on ? '#34c759' : '#d8352c';
    ctx.beginPath(); ctx.moveTo(x + 2, FLOOR - 150); ctx.quadraticCurveTo(x + 22, FLOOR - 146 + wave, x + 40, FLOOR - 140); ctx.lineTo(x + 2, FLOOR - 126); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (on) { ctx.fillStyle = 'rgba(125,255,160,0.35)'; ctx.beginPath(); ctx.arc(x, FLOOR - 40, 10 + Math.sin(S.t * 0.1) * 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
}
function drawShot(s) {
  ctx.save(); ctx.translate(s.x, s.y);
  if (WEAPON.look === 'laser') {
    ctx.rotate(Math.atan2(s.vy, s.vx)); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(54,244,160,0.35)'; ctx.beginPath(); ctx.ellipse(-8, 0, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d8ffe9'; ctx.beginPath(); ctx.ellipse(-6, 0, 14, 2.6, 0, 0, Math.PI * 2); ctx.fill();
  } else if (WEAPON.look === 'sun') {
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 16); g.addColorStop(0, '#fffbe0'); g.addColorStop(0.4, '#ffd23a'); g.addColorStop(1, 'rgba(255,160,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = s.col; ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(-2, -2, 2.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function drawEShot(s) {
  ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot || 0); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.fillStyle = s.col || '#8a8a96';
  ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = s.r * (i % 2 ? 0.8 : 1.05); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(-s.r * 0.3, -s.r * 0.3, s.r * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawDropShadow(s) {
  if (!groundAt(s.x)) return;
  const u = clamp((s.y + DY + 40) / (FLOOR + DY + 40), 0, 1);
  ctx.fillStyle = `rgba(20,10,30,${0.12 + u * 0.4})`; ctx.beginPath(); ctx.ellipse(s.x, FLOOR - 3, 8 + u * 18, 2 + u * 4, 0, 0, Math.PI * 2); ctx.fill();
}

// ---------------- Kai / Bali on the hoverboard ----------------
function drawKai() {
  const k = S.kai, sx = k.x - S.cam;
  if (k.inv > 0 && Math.floor(k.inv / 5) % 2 === 0) return;
  const air = !k.ground, push = 0;
  let fa = k.faceAnim; if (Math.abs(fa) < 0.14) fa = 0.14 * (Math.sign(fa) || 1);
  let fy = 1 - 2 * k.flipAnim; if (Math.abs(fy) < 0.12) fy = 0.12 * (Math.sign(fy) || 1);
  const up = k.flip ? -k.vy : k.vy;            // < 0 = moving away from the floor / ceiling
  ctx.save(); ctx.translate(sx, k.y); ctx.scale(fa, fy);
  // a hovering board floats a little above the ground – a soft glow below it
  if (!air) { ctx.fillStyle = 'rgba(54,198,244,0.18)'; ctx.beginPath(); ctx.ellipse(0, -1, 46, 5, 0, 0, Math.PI * 2); ctx.fill(); }
  const bob = Math.sin(S.t * 0.15) * 1.5;
  drawKaiFigure({ x: 0, y: -4 + bob, tilt: air ? (up < 0 ? -0.06 : 0.06) : 0, crouch: air ? (up < 0 ? 6 : 4) : k.landT > 0 ? 3 + k.landT * 0.6 : 0,
    push, flip: 0, armsUp: air && k.shootT <= 0, ouch: k.hurtT > 0, wind: Math.min(1, Math.abs(k.vx) / SPEED), outfit: SAVE.outfit, hover: true, space: SPACE_HELMET });
  if (k.shootT > 0) drawHandWeapon(26, -56 + bob);
  ctx.restore();
}
function drawHandWeapon(x, y) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
  if (WEAPON.look === 'laser') {
    ctx.fillStyle = '#c9d3dc'; ctx.beginPath(); ctx.roundRect(-6, -6, 22, 9, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8b96a1'; ctx.beginPath(); ctx.roundRect(-4, 2, 6, 9, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#36f4a0'; ctx.fillRect(15, -4, 5, 4);
  } else if (WEAPON.look === 'sun') {
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(8, -2, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillStyle = '#ff5a8a'; ctx.beginPath(); ctx.arc(6, -2, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#36c6f4'; ctx.beginPath(); ctx.arc(14, 2, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

// ---------------- HUD ----------------
function drawHUD() {
  ctx.save(); ctx.translate(0, -DY); ctx.textBaseline = 'middle';
  const x = 18, hy = 18, n = S.hearts, show = Math.min(n, 8);
  const boxW = n > 8 ? 120 : Math.max(60, show * 22 + 16);
  ctx.fillStyle = S.heartFlash > 0 ? 'rgba(120,10,20,0.8)' : S.heartFlash < 0 ? 'rgba(120,90,10,0.8)' : 'rgba(20,30,50,0.6)';
  ctx.beginPath(); ctx.roundRect(x - 6, hy - 6, boxW, 26, 10); ctx.fill();
  if (n > 8) { drawHeart(x + 10, hy + 7, 9, true); ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.fillText('× ' + n, x + 26, hy + 8); }
  else for (let i = 0; i < Math.max(show, 1); i++) drawHeart(x + 10 + i * 22, hy + 7, 9, i < n);
  ctx.fillStyle = 'rgba(20,30,50,0.6)'; ctx.beginPath(); ctx.roundRect(W - 168, 10, 156, 30, 10); ctx.fill();
  drawCoin({ x: W - 148, y: 25, p: 0 });
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.fillText('× ' + S.coins, W - 132, 26);
  if (SHOW_FRUITS) {
    ctx.fillStyle = 'rgba(20,30,50,0.6)'; ctx.beginPath(); ctx.roundRect(W - 168, 76, 76, 26, 10); ctx.fill();
    drawFruit(W - 150, 89, 0.75); ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.fillText('× ' + S.fruits, W - 136, 90);
  }
  for (const [b, on, icon] of [[BTN.music, Audio.musicOn, drawNoteIcon], [BTN.sfx, Audio.sfxOn, drawSpeakerIcon]]) {
    ctx.fillStyle = on ? 'rgba(20,30,50,0.6)' : 'rgba(80,10,10,0.7)'; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 9); ctx.fill();
    icon(b.x + b.w / 2 - 1, b.y + b.h / 2, on);
  }
  drawProgressBox(12, 44);
  if (S.phase === 'play' && !(S.mid && S.mid.state !== 'gone')) drawWayBar(S.kai.x, BOSS_X, CHECKPOINTS, S.cpX, WAY_ICONS(), tx(BOSS_SHORT), BOSS_COL);
  if (S.mid && S.mid.state !== 'gone' && S.mid.bar != null && S.phase === 'play') drawBossBar(tx(MID_NAME), S.mid.bar);
  if (S.boss && (S.phase === 'boss' || S.phase === 'stars') && S.boss.bar != null) drawBossBar(tx(BOSS_NAME), S.boss.bar);
  drawScoreBox(S.score);
  if (S.msgTimer > 0) {
    ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, S.msgTimer / 20);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.font = 'bold 24px Arial';
    ctx.strokeText(S.msg, W / 2, 84); ctx.fillText(S.msg, W / 2, 84); ctx.globalAlpha = 1;
  }
  ctx.restore();
}
function drawNoteIcon(x, y, on) {
  ctx.save(); ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x - 3, y + 5, 4, 3, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 1, y + 5); ctx.lineTo(x + 1, y - 8); ctx.lineTo(x + 7, y - 5); ctx.stroke();
  if (!on) { ctx.strokeStyle = '#ff6a5a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9); ctx.stroke(); }
  ctx.restore();
}
function drawSpeakerIcon(x, y, on) {
  ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 8, y - 3); ctx.lineTo(x - 4, y - 3); ctx.lineTo(x + 1, y - 8); ctx.lineTo(x + 1, y + 8); ctx.lineTo(x - 4, y + 3); ctx.lineTo(x - 8, y + 3); ctx.closePath(); ctx.fill();
  if (on) { ctx.beginPath(); ctx.arc(x + 3, y, 6, -0.8, 0.8); ctx.stroke(); }
  else { ctx.strokeStyle = '#ff6a5a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 4, y - 5); ctx.lineTo(x + 10, y + 5); ctx.moveTo(x + 10, y - 5); ctx.lineTo(x + 4, y + 5); ctx.stroke(); }
  ctx.restore();
}

// ---------------- panels ----------------
function panel(title, lines, titleColor, ty = 78) {
  ctx.save(); ctx.fillStyle = 'rgba(16,22,44,0.76)'; ctx.fillRect(0, -VH, W, 3 * VH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = titleColor; ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.font = 'bold 40px Arial';
  ctx.strokeText(title, W / 2, ty); ctx.fillText(title, W / 2, ty);
  ctx.fillStyle = '#f2f8ff'; ctx.font = 'bold 15px Arial';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 120 + i * (lines.length > 4 ? 21 : 24)));
  ctx.restore();
}
function button(b, label, c1, c2) {
  ctx.save(); const pulse = 1 + Math.sin(S.t * 0.08) * 0.03;
  ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(pulse, pulse);
  const g = ctx.createLinearGradient(0, -b.h / 2, 0, b.h / 2); g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; let fs = 16; ctx.font = `bold ${fs}px Arial`; while (ctx.measureText(label).width > b.w - 16 && fs > 10) { fs--; ctx.font = `bold ${fs}px Arial`; }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 1);
  ctx.restore();
}
function drawScreens() {
  if (S.phase === 'start') hook('startPanel');
  if (S.phase === 'ask' && S.ask) {
    const a = askInfo(S.ask);
    panel(a.title, a.lines, a.color || '#9fd8ff');
    button(BTN.yes, a.yes || tx('JA'), '#34c759', '#1f8f3c'); button(BTN.no, a.no || tx('NEIN, WEITER'), '#8a96a8', '#5d6878');
  }
  if (S.phase === 'shop') drawShop();
  if (S.phase === 'gameover') {
    panel(tx('KEINE LEBEN MEHR!'), [tx('Alle 3 Leben sind weg. Nochmal versuchen?'), tx('Du startest beim letzten Checkpoint.')], '#ff7a6a');
    button(BTN.goYes, tx('NOCHMAL VERSUCHEN'), '#36c6f4', '#1677a8'); button(BTN.goNo, tx('NEIN – ZUM MENÜ'), '#8a96a8', '#5d6878');
  }
  if (S.phase === 'won') {
    const w = wonInfo();
    panel(w.title, w.lines, '#7dffa0');
    button(BTN.won1, w.b1, '#34c759', '#1f8f3c'); button(BTN.won2, w.b2 || tx('ZUM MENÜ'), '#8a96a8', '#5d6878');
  }
}
// the result of a mini game (win / lose) – screen space
function resultPanel(text, win, extra) {
  ctx.save(); ctx.fillStyle = 'rgba(16,26,44,0.6)'; ctx.fillRect(0, -VH, W, 3 * VH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = win ? '#7dffa0' : '#ffb0a0'; ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.font = 'bold 28px Arial';
  ctx.strokeText(text, W / 2, 190); ctx.fillText(text, W / 2, 190);
  if (extra) { ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 18px Arial'; ctx.strokeText(extra, W / 2, 226); ctx.fillText(extra, W / 2, 226); }
  ctx.restore();
  if (win) button(GBTN.next, tx('WEITER'), '#34c759', '#1f8f3c');
  else { button(GBTN.again, '↻ ' + tx('NOCHMAL'), '#36c6f4', '#1677a8'); button(GBTN.next2, tx('WEITER'), '#8a96a8', '#5d6878'); }
}

// ---------------- the shop ----------------
function drawShop() {
  ctx.save(); ctx.fillStyle = 'rgba(40,14,10,0.88)'; ctx.fillRect(0, -VH, W, 3 * VH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const cx = SHOP_CARD.x0 + (SHOP_CARD.cols * (SHOP_CARD.w + SHOP_CARD.gap)) / 2;
  ctx.fillStyle = '#d8231f'; ctx.beginPath(); ctx.roundRect(cx - 160, 6, 320, 36, 8); ctx.fill();
  ctx.fillStyle = '#ffd23a'; ctx.fillRect(cx - 156, 9, 312, 3); ctx.fillRect(cx - 156, 36, 312, 3);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Arial'; ctx.fillText(SHOP_TITLE(), cx, 25);
  ctx.textAlign = 'right'; ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 16px Arial'; ctx.fillText('● ' + S.coins, W - 30, 25);
  ctx.restore();
  hook('drawShopClerk');
  ctx.save(); ctx.textBaseline = 'middle';
  shopList().forEach((it, i) => {
    const r = shopCardRect(i), owned = shopOwned(it), afford = S.coins >= it.price;
    ctx.fillStyle = owned ? 'rgba(52,199,89,0.3)' : 'rgba(255,255,255,0.1)'; ctx.strokeStyle = it.must ? '#ff8a3a' : 'rgba(255,255,255,0.35)'; ctx.lineWidth = it.must ? 3 : 1.5;
    ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 12); ctx.fill(); ctx.stroke();
    drawShopIcon(it, r.x + 34, r.y + 40);
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; let fs = 14; ctx.font = `bold ${fs}px Arial`;
    const nm = tx(it.name); while (ctx.measureText(nm).width > r.w - 70 && fs > 9) { fs--; ctx.font = `bold ${fs}px Arial`; }
    ctx.fillText(nm, r.x + 64, r.y + 24);
    if (it.desc) { ctx.font = '10px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.75)'; wrapText(tx(it.desc), r.x + 64, r.y + 44, r.w - 70, 12); }
    ctx.textAlign = 'center'; ctx.font = 'bold 14px Arial';
    if (owned) { ctx.fillStyle = '#9ff5b5'; ctx.fillText(it.kind === 'cloth' ? tx('Anziehen') : tx('Gekauft ✓'), r.x + r.w / 2, r.y + r.h - 14); }
    else { ctx.fillStyle = afford ? '#ffd23a' : '#ff8a7a'; ctx.fillText('● ' + it.price, r.x + r.w / 2, r.y + r.h - 14); }
  });
  ctx.restore();
  button(BTN.shopDone, tx('FERTIG'), '#34c759', '#1f8f3c');
}
function wrapText(t, x, y, maxW, lh) {
  const words = t.split(' '); let line = '';
  for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); line = w; y += lh; } else line = test; }
  if (line) ctx.fillText(line, x, y);
}
// a speech bubble (screen space), tail pointing down-left to (tx0, ty0)
function speech(x, y, w, text, tx0, ty0) {
  ctx.save(); ctx.font = 'bold 14px Arial'; ctx.textBaseline = 'top';
  const lines = []; let line = '';
  for (const wd of text.split(' ')) { const t = line ? line + ' ' + wd : wd; if (ctx.measureText(t).width > w - 24 && line) { lines.push(line); line = wd; } else line = t; }
  if (line) lines.push(line);
  const h = lines.length * 18 + 18;
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill(); ctx.stroke();
  if (tx0 != null) { ctx.beginPath(); ctx.moveTo(x + 24, y + h - 2); ctx.lineTo(tx0, ty0); ctx.lineTo(x + 46, y + h - 2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillRect(x + 22, y + h - 6, 26, 5); }
  ctx.fillStyle = OUT; ctx.textAlign = 'left'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 10 + i * 18));
  ctx.restore();
  return h;
}
function drawShopIcon(it, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  if (it.id === 'heart') drawHeart(0, 0, 16, true);
  else if (it.id === 'mangos') { drawFruit(-8, 4, 1); drawFruit(8, 4, 1); drawFruit(0, -8, 1); }
  else if (it.id === 'cake') drawCake(0, 4, 1.2);
  else if (it.id === 'paint2') { for (const [px, py, pc] of [[-10, 6, '#ff5a8a'], [10, 6, '#36c6f4'], [0, -10, '#ffd23a']]) { ctx.fillStyle = pc; ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); } ctx.fillStyle = '#ffd23a'; ctx.lineWidth = 3; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.strokeText('×2', 16, 20); ctx.fillText('×2', 16, 20); }
  else {
    const col = { capRed: '#d8352c', capGreen: '#2f8a5f', capBali: '#f48fb8', capGold: '#e8b923', beanie: '#7a3fb8', backpack: '#e0702b', teeRed: '#c8352c', teeYellow: '#e0a81e', shoesRed: '#d8352c', shorts: '#4a78b8', skirt: '#d94f7c' }[it.id] || '#888';
    ctx.fillStyle = col;
    if (it.id.startsWith('cap')) { ctx.beginPath(); ctx.arc(0, 4, 16, Math.PI, 0); ctx.lineTo(24, 4); ctx.lineTo(16, 9); ctx.lineTo(-16, 9); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (it.id === 'beanie') { ctx.beginPath(); ctx.arc(0, 6, 16, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -12, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else if (it.id.startsWith('tee')) { ctx.beginPath(); ctx.moveTo(-10, -14); ctx.lineTo(-22, -6); ctx.lineTo(-16, 2); ctx.lineTo(-11, -2); ctx.lineTo(-11, 16); ctx.lineTo(11, 16); ctx.lineTo(11, -2); ctx.lineTo(16, 2); ctx.lineTo(22, -6); ctx.lineTo(10, -14); ctx.quadraticCurveTo(0, -8, -10, -14); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (it.id.startsWith('shoes')) { ctx.beginPath(); ctx.moveTo(-18, 8); ctx.lineTo(-18, -4); ctx.lineTo(-4, -4); ctx.quadraticCurveTo(4, 2, 18, 2); ctx.lineTo(18, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-18, 6, 36, 3); }
    else if (it.id === 'backpack') { ctx.beginPath(); ctx.roundRect(-14, -16, 28, 32, 8); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(-9, 0, 18, 12, 4); ctx.stroke(); }
    else if (it.id === 'shorts') { ctx.beginPath(); ctx.moveTo(-16, -10); ctx.lineTo(16, -10); ctx.lineTo(18, 12); ctx.lineTo(3, 12); ctx.lineTo(0, 0); ctx.lineTo(-3, 12); ctx.lineTo(-18, 12); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (it.id === 'skirt') { ctx.beginPath(); ctx.moveTo(-10, -12); ctx.lineTo(10, -12); ctx.lineTo(20, 14); ctx.lineTo(-20, 14); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
}
// the Mega-Mango-Kuchen
function drawCake(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.fillStyle = '#f4c27a'; ctx.beginPath(); ctx.roundRect(-20, -6, 40, 16, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffb02e'; ctx.beginPath(); ctx.roundRect(-16, -18, 32, 13, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff3d0'; ctx.beginPath(); ctx.moveTo(-20, -6); for (let i = 0; i <= 8; i++) ctx.lineTo(-20 + i * 5, -6 + (i % 2 ? 5 : 0)); ctx.lineTo(20, -8); ctx.lineTo(-20, -8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff3d0'; ctx.beginPath(); ctx.ellipse(0, -19, 16, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  drawFruit(0, -28, 0.8);
  ctx.restore();
}

// an elephant of Aurora 61 (like Flappy in the book): wings when happy, a tear when sad
function drawElephant(x, y, s, t, wings, dir = 1, sad = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5 / Math.max(0.5, s);
  const body = '#9fb6d6', dark = '#7f96b8';
  const fl = wings ? Math.sin(t * 0.3) : 0;
  if (wings) { ctx.fillStyle = '#e8f0ff'; ctx.save(); ctx.translate(-8, -46); ctx.rotate(-0.4 - fl * 0.5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-20, -40, -56, -44); ctx.quadraticCurveTo(-46, -30, -54, -20); ctx.quadraticCurveTo(-36, -18, -40, -6); ctx.quadraticCurveTo(-22, -8, 0, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  // legs
  ctx.fillStyle = dark;
  for (const lx of [-22, -6, 10, 24]) { ctx.beginPath(); ctx.roundRect(lx - 7, sad ? -18 : -24, 14, sad ? 18 : 24, 5); ctx.fill(); ctx.stroke(); }
  // body
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, sad ? -34 : -40, 38, 26, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-36, -40); ctx.quadraticCurveTo(-48, -36, -46, -26); ctx.stroke();
  // head
  const hy = sad ? -46 : -58;
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(34, hy, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // trunk: up when happy, down when sad
  ctx.lineWidth = 10 / Math.max(0.5, s) * 0.9; ctx.strokeStyle = OUT; ctx.beginPath();
  if (sad) { ctx.moveTo(50, hy + 8); ctx.quadraticCurveTo(60, hy + 30, 54, hy + 44); } else { ctx.moveTo(50, hy + 6); ctx.quadraticCurveTo(70, hy + 4, 70, hy - 18); }
  ctx.stroke(); ctx.strokeStyle = body; ctx.lineWidth = 7 / Math.max(0.5, s) * 0.9; ctx.stroke(); ctx.lineWidth = 2.5 / Math.max(0.5, s); ctx.strokeStyle = OUT;
  // big ear
  ctx.fillStyle = '#c3d3ea'; ctx.beginPath(); ctx.ellipse(22, hy + (sad ? 8 : 0), 15, 20, sad ? 0.5 : -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f3b8c8'; ctx.beginPath(); ctx.ellipse(22, hy + (sad ? 8 : 0), 8, 12, sad ? 0.5 : -0.2, 0, Math.PI * 2); ctx.fill();
  // eye
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(42, hy - 6, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2a5f8a'; ctx.beginPath(); ctx.arc(43, hy - 5, 3.4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(44, hy - 7, 1.2, 0, Math.PI * 2); ctx.fill();
  if (sad) { ctx.fillStyle = '#7fd0ff'; ctx.beginPath(); ctx.ellipse(46, hy + 6 + ((t * 0.5) % 20), 2.5, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(36, hy - 16); ctx.lineTo(46, hy - 12); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(46, hy + 8, 5, 0.1, Math.PI - 0.6); ctx.stroke(); ctx.fillStyle = '#ff9ad0'; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(52, hy + 2, 4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  if (wings) { ctx.fillStyle = '#ffffff'; ctx.save(); ctx.translate(-2, -50); ctx.rotate(-0.2 + fl * 0.6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-18, -44, -52, -50); ctx.quadraticCurveTo(-42, -34, -50, -24); ctx.quadraticCurveTo(-30, -22, -34, -8); ctx.quadraticCurveTo(-18, -8, 0, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
