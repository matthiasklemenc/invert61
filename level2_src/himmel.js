
// =====================================================================
//  LEVEL 2 · DER HIMMEL (sky world)
//  OXXO on a cloud (harpoon!), penalty game in the middle, harp melody at the end
// =====================================================================
const SPEED = 4.6, LEVEL_LENGTH = 15500;
const EVENTS = [
  { at: 2600, type: 'rainbow' },
  { at: 3500, type: 'oxxo' },          // about 10 s after the start
  { at: 4200, type: 'clouds' },
  { at: 7200, type: 'football' },
  { at: 9400, type: 'rainbow' },
  { at: 11200, type: 'clouds' },
  { at: 12000, type: 'oxxo2' },          // second chance – only if the harpoon wasn't bought
];
const TURBO_FRAMES = 12 * 60;
// objects appear at the right edge: spawn them earlier so they reach Kai when the timeline says
const LEAD = (W + 80) - 250;
for (const ev of EVENTS) ev.spawnAt = Math.max(0, ev.at - LEAD);
const RB = { base: FLOOR - 78, h: 118 };
const ceilY = () => Math.min(100, 150 - DY);     // highest point Kai can fly (just under the HUD)
const skyY = (a, b) => rand(ceilY() + a, b);       // random height inside the whole open sky
// does a point (with some padding) touch Kai anywhere – head, wings, body, legs, board?
// the whole figure counts: head to board, board tail (-43) to nose (+44)
function onKai(px, py, pad) { const k = S.kai; return px > k.x - 43 - pad && px < k.x + 44 + pad && py > k.y - 118 - pad && py < k.y + 8 + pad; }
// small OXXO up in the clouds (about twice the size of Kai's head)
const OXXO_W = 108, OXXO_H = 68;      // twice the first size (the screen is taller now)
function touchesOxxo(o) {
  const k = S.kai, hx = k.x + 4, hy = k.y - 92;                 // Kai's head
  return hx + 20 > o.x && hx - 20 < o.x + OXXO_W && hy - 16 < o.y + 2 && k.y - 50 > o.y - OXXO_H;   // head or body reaches the shop
}          // rainbow: lifted on clouds, Kai must fly up onto it
const rbY = (o, u) => o.base - Math.sin(u * Math.PI) * o.h;

function newState() {
  return {
    phase: 'start', t: 0, scroll: 0, speed: SPEED, dist: 0, eventIdx: 0,
    kai: { x: 250, y: 200, vy: 0, wing: 0, hitTimer: 0, rainbow: null, cloud: null, grindT: 0 },
    hearts: SAVE.hearts, coins: SAVE.coins, heartFlash: 0, turbo: 0, starBlast: false,
    objects: [], arrows: [], shots: [], particles: [], nextSpawn: 500, shootCd: 0,
    msg: '', msgTimer: 0, shake: 0, stop: null, shopMsg: '', shopMsgT: 0,
    foot: null, harp: null, stairsT: 0,
  };
}
const S = newState();
function resetWorld() {
  restartWorldSave();
  Object.assign(S, newState()); S.phase = 'play';
  Audio.grindLoop(false); Audio.pauseBg(false);
}

// ================= INPUT =================
const BTN = {
  music: { x: W - 252, y: 10, w: 34, h: 30 },
  sfx:   { x: W - 212, y: 10, w: 34, h: 30 },
  again: { x: W / 2 - 100, y: 228, w: 200, h: 40 },
  yes: { x: 0, y: 0, w: 70, h: 30 }, no: { x: 0, y: 0, w: 70, h: 30 },
  shopDone: { x: W / 2 - 80, y: H - 44, w: 160, h: 32 },
  goYes: { x: W / 2 - 215, y: 228, w: 210, h: 40 }, goNo: { x: W / 2 + 5, y: 228, w: 210, h: 40 },
};
function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  const sc = Math.min(r.width / W, r.height / VH);
  const ox = r.left + (r.width - W * sc) / 2, oy = r.top + (r.height - VH * sc) / 2;
  return { x: (e.clientX - ox) / sc, y: (e.clientY - oy) / sc - DY };
}
const inRect = (p, b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
let isTouch = false, keyHold = false;
const gest = new Map(), holdPointers = new Set();
const SWIPE_PX = 28, DECIDE_MS = 90;
function action() {
  if (S.phase === 'play') shoot();
  else if (S.phase === 'foot') footShoot();
}
canvas.addEventListener('pointerdown', e => {
  e.preventDefault(); Audio.init(); Audio.setTheme('sky');
  if (e.pointerType === 'touch') isTouch = true;
  const p = toLogical(e);
  const hp = { x: p.x, y: p.y + DY };          // the HUD sits at the very top of the screen
  if (pauseClick(hp)) return;                  // PAUSE / WEITER
  if (invClick(hp)) return;                    // ITEMS drop-down (weapons + outfit)
  if (inRect(hp, BTN.music)) { Audio.toggleMusic(); return; }
  if (inRect(hp, BTN.sfx)) { Audio.toggleSfx(); return; }
  const mp = { x: p.x, y: p.y + DY / 2 };      // menus are drawn centred on the tall screen
  if (S.phase === 'start') { if (!langPickerClick(mp)) { S.phase = 'play'; SAVE.started = true; writeSave(); } return; }
  if (S.phase === 'gameover') { if (inRect(mp, BTN.goYes)) resetWorld(); else if (inRect(mp, BTN.goNo)) { resetWorld(); toMainMenu(); } return; }
  if (S.phase === 'shopAsk' || S.phase === 'footAsk') { askClick(p); return; }
  if (S.phase === 'shop') { shopClick(p); return; }
  if (S.phase === 'foot') { footShoot(); return; }
  if (S.phase === 'harp') { harpClick(p); return; }
  if (S.phase !== 'play') return;
  tapFlap();
  gest.set(e.pointerId, { x0: e.clientX, y0: e.clientY, t0: performance.now(), decided: false });
});
// on-screen buttons (controller): JUMP button left = wing beat / hold, SHOOT button right = light arrows
const CTL = {
  showJump: () => S.phase === 'play',
  canShoot: () => S.phase === 'play',
  shoot: () => { if (S.phase === 'play') shoot(); }, auto: true, icon: 'arrow',
};
function decideGestures() {
  const now = performance.now();
  for (const [id, g] of gest) if (!g.decided && now - g.t0 > DECIDE_MS) { g.decided = true; holdPointers.add(id); }
}
const rel = e => { const g = gest.get(e.pointerId); gest.delete(e.pointerId); holdPointers.delete(e.pointerId); };
window.addEventListener('pointerup', rel); window.addEventListener('pointercancel', rel);
window.addEventListener('keydown', e => {
  Audio.init(); Audio.setTheme('sky');
  if (S.phase === 'harp') { const i = 'asdfghjk'.indexOf(e.key.toLowerCase()); const j = '12345678'.indexOf(e.key); if (i >= 0 || j >= 0) { harpKey(i >= 0 ? i : j); return; } }
  if (e.code === 'KeyX') { e.preventDefault(); if (!e.repeat) action(); return; }
  if (e.code === 'KeyM') { Audio.toggleMusic(); return; }
  if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
  e.preventDefault(); if (e.repeat) return;
  if (S.phase === 'start') { S.phase = 'play'; return; }
  if (S.phase === 'gameover') { resetWorld(); return; }
  if (S.phase === 'foot') { footShoot(); return; }
  if (S.phase === 'play') tapFlap();
  keyHold = true;
});
window.addEventListener('keyup', e => { if (e.code === 'Space' || e.code === 'ArrowUp') keyHold = false; });

// ================= HELPERS =================
function burst(x, y, color, n, speed = 4) { for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), v = rand(1, speed); S.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(1.5, 4), color, life: 1, g: 0.05 }); } }
function flash(text, f = 80) { S.msg = text; S.msgTimer = f; }
// one wing beat per tap / click / Space: a clear hop up – fast taps keep climbing
function tapFlap() { const k = S.kai; k.rainbow = null; k.cloud = null; k.vy = Math.max(-8.5, Math.min(k.vy, 0) - 6); k.tapT = 20; flapFx(); }
function flapFx() { Audio.play('flap'); for (let i = 0; i < 3; i++) S.particles.push({ x: S.kai.x - 20 + rand(-8, 8), y: S.kai.y - 60, vx: rand(-2, -0.5), vy: rand(0.3, 1.2), r: rand(2, 3.5), color: 'rgba(255,255,255,0.9)', life: 0.8, g: 0, feather: true }); }
function loseHeart() {
  S.hearts--; S.heartFlash = 40;
  if (S.hearts <= 0 && loseLife()) {
    S.hearts = LIFE_HEARTS; S.heartFlash = -40; S.kai.hitTimer = 150;
    flash(SAVE.lives === 1 ? tx('LEBEN VERLOREN! Letztes Leben!') : tx('LEBEN VERLOREN! Noch {n} Leben', { n: SAVE.lives }), 120);
    Audio.play('gameover'); return;
  }
  if (S.hearts <= 0) { S.hearts = 0; S.phase = 'gameover'; Audio.grindLoop(false); Audio.play('gameover'); holdPointers.clear(); keyHold = false; }
}
function hurt(text, x, y) {
  const k = S.kai; if (k.hitTimer > 0) return false;
  k.hitTimer = 80; k.rainbow = null; k.cloud = null; k.vy = 2;
  burst(x, y, '#ffffff', 14); S.shake = 8; Audio.play('crash'); flash(tx(text), 60);
  loseHeart(); return true;
}
function coinGot(n, x, y) { S.coins += n; burst(x, y, '#ffd23a', 6 + n * 2, 3); Audio.play('coin'); }

// leaving the OXXO / the football cloud: Kai flaps up first, so he doesn't touch the cloud floor
function liftOff() { const k = S.kai; S.floorWarn = 0; k.y = Math.min(k.y, FLOOR - 80); k.vy = -3; S.lowWarned = false; flapFx(); }
function startFall() {
  const k = S.kai;
  S.phase = 'fall'; S.fallT = 0; k.vy = 1; k.rainbow = null; k.cloud = null;
  Audio.grindLoop(false); Audio.play('crash'); flash(tx('Kai fällt durch die Wolken…'), 120);
  holdPointers.clear(); keyHold = false;
  SAVE.hearts = S.hearts; SAVE.coins = S.coins; writeSave();
  goToWorld('stadt.html', 'from=himmel&fall=1');   // camera follows Kai down through the clouds into the city
}
// ================= OBJECTS =================
function add(o) { o.p = rand(0, 6); o.done = false; S.objects.push(o); return o; }
function addCoin(x, y) { add({ type: 'coin', x, y, r: 9 }); }
function coinArc(x0, y0, n, h, sp = 36) { for (let i = 0; i < n; i++) addCoin(x0 + i * sp, y0 - Math.sin(i / Math.max(1, n - 1) * Math.PI) * h); }
function pickType() {
  const p = S.dist / LEVEL_LENGTH;
  // devils come regularly; in turbo there are many more of them (and more coins)
  if (S.noDevil >= 3) return 'devil';
  const tb = [['coins', 3.5], ['devil', (2.2 + p * 2) * (S.turbo > 0 ? 2.2 : 1)], ['lightning', 1 + p * 1.5], ['storm', 1.3], ['cloudp', 1.3]];
  const tot = tb.reduce((s, [, w]) => s + w, 0); let r = Math.random() * tot;
  for (const [k, w] of tb) { r -= w; if (r <= 0) return k; }
  return 'coins';
}
function spawn() {
  const x = W + 60, mul = S.turbo > 0 ? 2 : 1;
  const type = pickType();
  S.noDevil = type === 'devil' ? 0 : (S.noDevil || 0) + 1;
  if (type === 'coins' || S.turbo > 0) { for (let m = 0; m < mul; m++) coinArc(x + m * 260, skyY(10, 240), 6, Math.random() < 0.5 ? 0 : 50); }
  if (type === 'devil') add({ type: 'devil', x: x + 40, baseY: skyY(-10, 220), r: 20, throwT: rand(40, 90), hp: 1 });
  if (type === 'lightning') add({ type: 'lightning', x: x + rand(0, 200), w: 30, t: 0, r: 0 });
  if (type === 'storm') add({ type: 'storm', x, y: skyY(-10, 200), r: 34 });
  if (type === 'cloudp') { const c = add({ type: 'cloudp', x, y: rand(170, 250), w: 130, life: 1, stand: 0 }); coinArc(x + 20, c.y - 30, 4, 0, 30); }
  S.nextSpawn = rand(260, 380) * (S.turbo > 0 ? 0.7 : 1);
}
function runEvent(ev) {
  const x = W + 80;
  if (ev.type === 'oxxo' || (ev.type === 'oxxo2' && !SAVE.items.harpoon)) { add({ type: 'oxxo', x, y: Math.max(ceilY() - 30, 128 - DY) }); S.nextSpawn = Math.min(S.nextSpawn, 250); }
  if (ev.type === 'rainbow') { const o = add({ type: 'rainbow', x, w: 460, h: RB.h, base: RB.base }); for (let i = 0; i < 7; i++) addCoin(o.x + 50 + i * 60, rbY(o, (50 + i * 60) / o.w) - 40); S.nextSpawn = 380; }
  if (ev.type === 'clouds') { for (let i = 0; i < 3; i++) { const c = add({ type: 'cloudp', x: x + i * 220, y: 230 - i * 40, w: 130, life: 1, stand: 0 }); coinArc(c.x + 20, c.y - 30, 4, 0, 30); } S.nextSpawn = 420; }
  if (ev.type === 'football') { add({ type: 'field', x }); S.nextSpawn = 300; }
}

// ================= SHOOTING (light arrows) =================
function shoot() {
  if (S.shootCd > 0) return;
  const k = S.kai, x = k.x + 40, y = k.y - 60;
  if (SAVE.items.star && SAVE.weapon.sky === 'star') { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; S.arrows.push({ x, y, vx: Math.cos(a) * 11, vy: Math.sin(a) * 11, star: true, life: 70 }); } }
  else S.arrows.push({ x, y, vx: 14, vy: 0, life: 90 });
  S.shootCd = 14; Audio.play('arrow');
}

// ================= ASK (OXXO / football) =================
function askClick(p) {
  if (inRect(p, BTN.yes)) {
    if (S.phase === 'shopAsk') { S.phase = 'shop'; Audio.play('buy'); S.shopMsg = tx('Willkommen im OXXO!'); S.shopMsgT = 120; }
    else startFootball();
  } else if (inRect(p, BTN.no)) {
    if (S.phase === 'shopAsk') leaveShop(); else endFootball(null);
  }
}

// ================= OXXO SHOP =================
const SHOP = [
  { id: 'harpoon', name: 'Harpune', desc: 'Pflicht für die Tiefsee!', price: 40, kind: 'item' },
  { id: 'turbo', name: 'Turbo', desc: 'Doppelt schnell, doppelt so viel zu sammeln', price: 25, kind: 'power' },
  { id: 'star', name: 'Sternen-Rundumschuss', desc: '8 Sterne in alle Richtungen', price: 30, kind: 'power' },
  { id: 'heart', name: 'Herz', desc: '+1 Herz', price: 20, kind: 'power' },
  { id: 'capRed', who: 'kai', name: 'Rote Kappe', price: 10, kind: 'cloth', apply: o => { o.cap = '#d8352c'; o.beanie = false; } },
  { id: 'capGreen', who: 'kai', name: 'Grüne Kappe', price: 10, kind: 'cloth', apply: o => { o.cap = '#2f8a5f'; o.beanie = false; } },
  { id: 'capBali', who: 'bali', name: 'Schildkappe', desc: 'Kappe für Bali', price: 10, kind: 'cloth', apply: o => { o.cap = '#f48fb8'; o.beanie = false; } },
  { id: 'shorts', who: 'bali', name: 'Kurze Hose', desc: 'Jeans-Shorts für den Sommer', price: 15, kind: 'cloth', apply: o => { o.bottom = 'shorts'; } },
  { id: 'skirt', who: 'bali', name: 'Rock', desc: 'Rock bis zu den Knien', price: 15, kind: 'cloth', apply: o => { o.bottom = 'skirt'; } },
  { id: 'beanie', name: 'Beanie', price: 15, kind: 'cloth', apply: o => { o.beanie = true; } },
  { id: 'backpack', name: 'Rucksack', price: 20, kind: 'cloth', apply: o => { o.backpack = !o.backpack; } },
  { id: 'teeRed', name: 'Rotes T-Shirt', price: 10, kind: 'cloth', apply: o => { o.tee = '#c8352c'; } },
  { id: 'teeYellow', name: 'Gelbes T-Shirt', price: 10, kind: 'cloth', apply: o => { o.tee = '#e0a81e'; } },
  { id: 'shoesRed', name: 'Rote Schuhe', price: 15, kind: 'cloth', apply: o => { o.shoes = '#d8352c'; } },
];
// what the OXXO sells depends on who is riding (Kai or Bali)
const shopList = () => SHOP.filter(forChar);
const SHOP_CARD = { cols: 6, w: 172, h: 112, gap: 10 };
SHOP_CARD.x0 = (W - (SHOP_CARD.cols * SHOP_CARD.w + (SHOP_CARD.cols - 1) * SHOP_CARD.gap)) / 2; SHOP_CARD.y0 = 52;
function shopCardRect(i) { const c = i % SHOP_CARD.cols, r = Math.floor(i / SHOP_CARD.cols); return { x: SHOP_CARD.x0 + c * (SHOP_CARD.w + SHOP_CARD.gap), y: SHOP_CARD.y0 + r * (SHOP_CARD.h + SHOP_CARD.gap), w: SHOP_CARD.w, h: SHOP_CARD.h }; }
function shopOwned(it) {
  if (it.id === 'harpoon') return SAVE.items.harpoon;
  if (it.id === 'turbo') return S.boughtTurbo && !S.turboUsed;   // can be bought again at every OXXO
  if (it.id === 'star') return !!SAVE.items.star;                  // bought once = stays bought
  if (it.kind === 'cloth') return !!SAVE.owned[it.id];
  return false;
}
function shopClick(p) {
  if (inRect(p, BTN.shopDone)) { leaveShop(); return; }
  shopList().forEach((it, i) => {
    if (!inRect(p, shopCardRect(i))) return;
    const owned = shopOwned(it);
    if (owned && it.kind === 'cloth') { it.apply(SAVE.outfit); writeSave(); Audio.play('flip'); S.shopMsg = tx('Angezogen'); S.shopMsgT = 60; return; }
    if (owned) { S.shopMsg = tx('Schon gekauft'); S.shopMsgT = 60; return; }
    if (S.coins < it.price) { Audio.play('denied'); S.shopMsg = tx('Zu wenig Münzen!'); S.shopMsgT = 80; return; }
    S.coins -= it.price; spendCoins(it.price); Audio.play('buy'); S.shopMsg = tx('Gekauft!'); S.shopMsgT = 70;
    if (it.id === 'harpoon') SAVE.items.harpoon = true;
    if (it.id === 'turbo') { S.boughtTurbo = true; S.turboUsed = false; }
    if (it.id === 'star') { SAVE.items.star = true; SAVE.weapon.sky = 'star'; SAVE.weapon.sea = 'star'; }
    if (it.id === 'heart') { S.hearts++; S.heartFlash = -40; }
    if (it.kind === 'cloth') { SAVE.owned[it.id] = true; it.apply(SAVE.outfit); }
    SAVE.coins = S.coins; SAVE.hearts = S.hearts; writeSave();
  });
}
function leaveShop() {
  S.phase = 'play'; if (S.stop) S.stop.done = true; S.stop = null; liftOff(); S.nextSpawn = Math.min(S.nextSpawn, 120);
  if (S.boughtTurbo && !S.turboUsed) { S.turboUsed = true; S.turbo = TURBO_FRAMES; Audio.setFast(true); flash(tx('TURBO! Doppelt schnell – jetzt schießen!'), 90); }
  else if (SAVE.items.star && SAVE.weapon.sky === 'star') flash(tx('Sternen-Rundumschuss aktiv!'), 80);
  if (!SAVE.items.harpoon) flash(tx('Du brauchst zuerst die Harpune aus dem OXXO im Himmel!'), 120);
}

// ================= PENALTY GAME (angel goalkeeper) – seen from behind Kai =================
// goal frame in perspective: front posts, crossbar, ground line
const GOAL = { x1: 450, x2: 830, top: 92, bottom: 252 };
const BALL0 = { x: 640, y: 300 };
function startFootball() {
  S.phase = 'foot';
  S.foot = { shots: 0, goals: 0, ang: 0, angDir: 1, keeperX: 640, keeperDir: 1, ball: null, msgT: 0, msg: '', done: 0, kickT: 0 };
}
function footShoot() {
  const f = S.foot; if (!f || f.ball || f.done) return;
  // where the arrow points: on the goal line, left/right; a little random height
  const tx_ = BALL0.x + Math.tan(f.ang) * 260, ty = rand(GOAL.top + 40, GOAL.bottom - 40);
  f.ball = { x: BALL0.x, y: BALL0.y, tx: tx_, ty, t: 0, T: 32, state: 'fly', s: 1 };
  f.shots++; f.kickT = 1; f.react = Math.max(5, 10 - f.shots); f.diveSpd = 3.4 + f.shots * 0.35; Audio.play('kick');
}
function updateFootball(dt) {
  const f = S.foot;
  if (f.kickT > 0) f.kickT = Math.max(0, f.kickT - 0.06 * dt);
  // the aiming arrow swings smoothly left and right (its own rhythm)
  if (!f.ball) { f.aimT = (f.aimT || 0) + dt; f.ang = 0.92 * Math.sin(f.aimT * 0.042); }
  // the angel goalkeeper: walks to a random spot, waits a moment, picks a new spot – not in time with the arrow.
  // When Kai shoots he reacts after a short moment and dives towards the ball: shoot far away from him!
  const kMin = GOAL.x1 + 55, kMax = GOAL.x2 - 55;
  if (f.ball && f.ball.state === 'fly') {
    if (f.ball.t > f.react) { const d = clamp(f.ball.tx, kMin - 20, kMax + 20) - f.keeperX; f.keeperX += Math.sign(d) * Math.min(Math.abs(d), f.diveSpd * dt); f.lean = clamp(d / 60, -1, 1); }
  } else if (!f.ball) {
    f.lean = (f.lean || 0) * 0.85;
    if (f.kWait > 0) f.kWait -= dt;
    else {
      if (f.kTarget == null) f.kTarget = rand(kMin, kMax);
      const d = f.kTarget - f.keeperX, spd = 2.0 + f.shots * 0.3;
      f.keeperX += Math.sign(d) * Math.min(Math.abs(d), spd * dt);
      if (Math.abs(d) < 1) { f.kWait = rand(8, 45); let n = rand(kMin, kMax); if (Math.abs(n - f.keeperX) < 90) n = f.keeperX < 640 ? rand(660, kMax) : rand(kMin, 620); f.kTarget = n; }
    }
  }
  if (f.ball) {
    const b = f.ball; b.t += dt;
    if (b.state === 'fly') {
      const u = Math.min(1, b.t / b.T);
      b.x = BALL0.x + (b.tx - BALL0.x) * u; b.y = BALL0.y + (b.ty - BALL0.y) * u - Math.sin(u * Math.PI) * 50; b.s = 1 - u * 0.55;
      if (u >= 1) {
        if (b.tx < GOAL.x1 + 8 || b.tx > GOAL.x2 - 8) { b.state = 'miss'; f.msg = tx('Daneben!'); Audio.play('denied'); b.vx = b.tx < 640 ? -3 : 3; }
        else if (Math.abs(b.tx - f.keeperX) < 46) { b.state = 'saved'; f.msg = tx('Gehalten!'); Audio.play('boing'); b.vx = rand(-3, 3); b.vy = 2; }
        else { b.state = 'goal'; f.goals++; f.msg = tx('TOR!'); Audio.play('goal'); burst(b.x, b.y, '#ffd23a', 24, 5); }
        f.msgT = 70; b.t = 0;
      }
    } else if (b.state === 'saved') { b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 0.25 * dt; b.s = Math.min(1.3, b.s + 0.02 * dt); }
    else if (b.state === 'goal') { b.s = Math.max(0.35, b.s - 0.004 * dt); b.y = Math.min(b.y + 1.2 * dt, GOAL.bottom - 24); }
    else if (b.state === 'miss') { b.x += b.vx * dt; b.s = Math.max(0.3, b.s - 0.005 * dt); }
    if (b.state !== 'fly' && b.t > 55) {
      f.ball = null;
      if (f.goals >= 3 || f.shots >= 5 || f.goals + (5 - f.shots) < 3) {
        const won = f.goals >= 3; f.done = 1;
        if (won) { S.coins += 15; S.hearts++; S.heartFlash = -40; Audio.play('win'); flash(tx('GEWONNEN! +15 Münzen · +1 Herz'), 150); }
        else flash(tx('Knapp verloren – weiter geht\'s!'), 120);
        setTimeout(() => endFootball(won), 1400);
      }
    }
  }
  if (f.msgT > 0) f.msgT -= dt;
}
function endFootball(won) {
  SAVE.mini.football = SAVE.mini.football === true || won === true; writeSave();
  if (S.mini) { goToWorld('tiefsee.html', 'final=1'); return; }   // came from the final screen
  S.phase = 'play'; S.foot = null; if (S.stop) { S.stop.done = true; S.stop = null; } liftOff(); S.nextSpawn = Math.min(S.nextSpawn, 120);
}

// ================= HARP / PIANO FINALE =================
const SCALE = [60, 62, 64, 65, 67, 69, 71, 72];       // C4 … C5 (white keys)
const NOTE_NAMES = { de: ['C', 'D', 'E', 'F', 'G', 'A', 'H', 'C'], en: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'], es: ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Do'] };
const PIANO = { keyW: 72, keyH: 108, y: H - 116 };
PIANO.x0 = (W - PIANO.keyW * 8) / 2;
function makeMelody() {
  // a new short melody every game: small steps, starts on C/E/G, ends on C
  const len = Math.random() < 0.5 ? 7 : 8;
  const m = [[0, 2, 4][Math.floor(Math.random() * 3)]];
  for (let i = 1; i < len - 1; i++) {
    let step = [-2, -1, -1, 1, 1, 2, 2, 3][Math.floor(Math.random() * 8)];
    let n = m[i - 1] + step; if (n < 0 || n > 7) n = m[i - 1] - step; n = clamp(n, 0, 7);
    if (n === m[i - 1] && Math.random() < 0.6) n = clamp(n + (n > 3 ? -1 : 1), 0, 7);
    m.push(n);
  }
  m.push(m[m.length - 1] >= 4 ? 7 : 0);
  return m;
}
function startHarp() {
  S.phase = 'harp';
  S.harp = { melody: makeMelody(), fails: 0, idx: 0, mode: 'intro', timer: 90, playIdx: 0, lit: -1, litT: 0, hint: -1, hintT: 0, done: null, press: [] };
  Audio.pauseBg(true);   // harp: background music off (it comes back when Kai leaves the sky)
  flash(tx('Hör gut zu und spiel die Melodie nach!'), 120);
}
function harpTempo() { return S.harp.fails >= 3 ? 52 : 36; }
function updateHarp(dt) {
  const h = S.harp;
  if (h.litT > 0) { h.litT -= dt; if (h.litT <= 0) h.lit = -1; }
  for (const p of h.press) p.t -= dt; h.press = h.press.filter(p => p.t > 0);
  if (h.mode === 'intro') { h.timer -= dt; if (h.timer <= 0) { h.mode = 'play'; h.playIdx = 0; h.timer = 20; } }
  else if (h.mode === 'play') {
    h.timer -= dt;
    if (h.timer <= 0) {
      if (h.playIdx < h.melody.length) {
        const n = h.melody[h.playIdx]; Audio.harp(SCALE[n]); h.lit = n; h.litT = harpTempo() * 0.75; h.playIdx++; h.timer = harpTempo();
      } else { h.mode = 'input'; h.idx = 0; flash(tx('Du bist dran!'), 70); setHint(); }
    }
  } else if (h.mode === 'input') {
    if (h.hintT > 0) h.hintT -= dt;
  } else if (h.mode === 'wrong') { h.timer -= dt; if (h.timer <= 0) { h.mode = 'play'; h.playIdx = 0; h.timer = 10; } }
  else if (h.mode === 'end') { h.timer -= dt; if (h.timer <= 0) { S.phase = 'stairs'; S.stairsT = 0; Audio.play('chime'); flash(tx('Die Himmelstreppe führt zurück in die Stadt…'), 200); } }
}
function setHint() {
  const h = S.harp;
  if (h.fails >= 8) { h.hint = h.melody[h.idx]; h.hintT = 99999; }          // long glow
  else if (h.fails >= 6) { h.hint = h.melody[h.idx]; h.hintT = 22; }        // short glow
  else { h.hint = -1; h.hintT = 0; }
}
function harpClick(p) {
  for (let i = 0; i < 8; i++) { const r = { x: PIANO.x0 + i * PIANO.keyW, y: PIANO.y, w: PIANO.keyW, h: PIANO.keyH }; if (inRect(p, r)) { harpKey(i); return; } }
}
function harpKey(i) {
  const h = S.harp; if (!h || h.mode !== 'input') return;
  Audio.harp(SCALE[i]); h.press.push({ i, t: 14 });
  if (i === h.melody[h.idx]) {
    h.idx++;
    if (h.idx >= h.melody.length) {
      h.mode = 'end'; h.timer = 170; h.done = true;
      SAVE.outfit.halo = true; SAVE.owned.halo = true; S.coins += 20; Audio.play('win');
      flash(tx('WUNDERSCHÖN! Der goldene Heiligenschein gehört dir!'), 170);
    } else setHint();
  } else {
    h.fails++; Audio.play('denied');
    if (h.fails >= 10) { h.mode = 'end'; h.timer = 150; h.done = false; flash(tx('Wir üben nächstes Mal weiter!'), 150); }
    else {
      h.mode = 'wrong'; h.timer = 70;
      flash(h.fails === 3 ? tx('Ich spiele langsamer…') : h.fails === 6 ? tx('Ich helfe dir ein bisschen…') : tx('Falsch – hör nochmal zu!'), 70);
    }
  }
}

// ================= UPDATE =================
function update(dt) {
  S.t += dt; decideGestures();
  if (S.shake > 0) S.shake = Math.max(0, S.shake - dt);
  if (S.heartFlash > 0) S.heartFlash = Math.max(0, S.heartFlash - dt); else if (S.heartFlash < 0) S.heartFlash = Math.min(0, S.heartFlash + dt);
  if (S.msgTimer > 0) S.msgTimer -= dt;
  if (S.shopMsgT > 0) S.shopMsgT -= dt;
  const k = S.kai;
  k.wing += 0.12 * dt;
  if (S.phase === 'start' || S.phase === 'gameover') { S.scroll += 0.8 * dt; k.y = 200 + Math.sin(S.t * 0.04) * 6; updateParticles(dt, 0); return; }
  if (S.phase === 'shopAsk' || S.phase === 'shop' || S.phase === 'footAsk') { updateParticles(dt, 0); return; }
  if (S.phase === 'foot') { updateFootball(dt); updateParticles(dt, 0); return; }
  if (S.phase === 'harp') { updateHarp(dt); updateParticles(dt, 0); k.y += (200 - k.y) * 0.05 * dt; return; }
  if (S.phase === 'fall') {
    S.fallT += dt; k.vy = Math.min(k.vy + 0.35 * dt, 9); k.y += k.vy * dt; k.wing += 0.05 * dt;
    updateParticles(dt, 0);
    return;
  }
  if (S.phase === 'stairs') {
    S.stairsT += dt; k.wing += 0.1 * dt;
    // Kai walks down the glowing stairway
    const u = Math.min(1, S.stairsT / 200); k.x = 250 + u * 380; k.y = 160 + u * 140;
    updateParticles(dt, 0);
    if (S.stairsT > 200 && !S.leaving) { S.leaving = true; SAVE.hearts = S.hearts; SAVE.coins = S.coins; SAVE.done.heaven = true; SAVE.mini.harp = SAVE.mini.harp === true || !!(S.harp && S.harp.done); goToWorld('stadt.html', 'from=himmel'); }
    return;
  }

  // ---- world movement (stops at the OXXO, the football field and the harp) ----
  const stopNow = S.stop && !S.stop.done && S.stop.x <= S.stopAt;
  const target = stopNow ? 0 : S.turbo > 0 ? SPEED * 2 : SPEED;
  S.speed += (target - S.speed) * Math.min(1, (stopNow ? 0.25 : 0.06) * dt);
  if (stopNow && S.speed < 0.15) {
    S.speed = 0;
    if (S.stop.type === 'oxxo' && S.phase === 'play') { S.phase = 'shopAsk'; holdPointers.clear(); keyHold = false; }
    if (S.stop.type === 'field' && S.phase === 'play') { S.phase = 'footAsk'; holdPointers.clear(); keyHold = false; }
  }
  const move = S.speed * dt;
  S.scroll += move; S.dist += move;
  if (S.turbo > 0) { S.turbo -= dt; if (S.turbo <= 0) { S.turbo = 0; Audio.setFast(false); flash(tx('Turbo vorbei')); } }
  if (S.shootCd > 0) S.shootCd -= dt;

  // events & spawning
  const ev = EVENTS[S.eventIdx];
  if (ev && S.dist >= ev.spawnAt && !S.stop) { S.eventIdx++; runEvent(ev); }
  if (S.dist >= LEVEL_LENGTH && !S.stop && S.phase === 'play') { S.speed = 0; startHarp(); return; }
  if (!S.stop || S.stop.x > S.stopAt + 420) { S.nextSpawn -= move; if (S.nextSpawn <= 0 && S.dist < LEVEL_LENGTH - 900) spawn(); }

  // ---- Kai flight ----
  const hold = holdPointers.size > 0 || keyHold;
  if (k.rainbow) {
    const o = k.rainbow, u = (k.x - o.x) / o.w;
    if (u >= 1 || o.x + o.w < 0) { k.rainbow = null; k.vy = -4.5; flapFx(); }
    else {
      k.y = rbY(o, u); k.vy = 0; k.grindT += dt;
      k.rbTilt = Math.atan(-Math.cos(u * Math.PI) * Math.PI * o.h / o.w) * 0.8;
      if (Math.random() < 0.8 * dt) S.particles.push({ x: k.x + rand(-20, 20), y: k.y, vx: rand(-3, -1), vy: rand(-1.5, 0.5), r: rand(1.5, 3), color: ['#ff5a5a', '#ffb02e', '#ffe14d', '#5fd36a', '#36a8f4', '#9b63d6'][Math.floor(Math.random() * 6)], life: 0.8, g: 0.05 });
      if (k.grindT > 14) { k.grindT = 0; coinGot(1, k.x, k.y - 20); }
    }
  }
  if (k.cloud) {
    const c = k.cloud;
    if (hold || k.x < c.x || k.x > c.x + c.w || c.life <= 0) k.cloud = null;
    else { k.y = c.y; k.vy = 0; c.stand += dt; if (c.stand > 40) c.life -= 0.02 * dt; if (c.stand > 40 && !c.warned) { c.warned = true; flash(tx('Die Wolke löst sich auf!'), 50); } }
  }
  if (!k.rainbow && !k.cloud) {
    if (hold) { k.vy -= 0.34 * dt; if (Math.floor(k.wing / Math.PI) !== Math.floor((k.wing + 0.33 * dt) / Math.PI)) flapFx(); k.wing += 0.33 * dt; }
    else k.vy += 0.11 * dt;
    if (k.tapT > 0) k.tapT -= dt;
    k.vy *= Math.pow(0.97, dt); k.vy = clamp(k.vy, k.tapT > 0 ? -8.5 : -4.4, 2.6);
    const prevY = k.y; k.y += k.vy * dt;
    if (k.vy >= 0) for (const o of S.objects) {
      if (o.done) continue;
      if (o.type === 'rainbow') { const u = (k.x - o.x) / o.w; if (u > 0.03 && u < 0.95) { const ry = rbY(o, u); if (prevY <= ry + 3 && k.y >= ry) { k.rainbow = o; k.y = ry; flash(tx('REGENBOGEN-GRIND!'), 60); break; } } }
      if (o.type === 'cloudp' && o.life > 0 && k.x > o.x + 8 && k.x < o.x + o.w - 8 && prevY <= o.y + 3 && k.y >= o.y) { k.cloud = o; k.y = o.y; Audio.play('land'); break; }
    }
    if (S.stop) { if (k.y > FLOOR) { k.y = FLOOR; k.vy = 0; } }          // safe ground at the OXXO / football cloud
    else {
      S.floorWarn = clamp((k.y - (FLOOR - 70)) / 70, 0, 1);
      if (k.y > FLOOR - 45 && k.vy > 0 && !S.lowWarned) { S.lowWarned = true; flash(tx('Zu tief! Nicht die Wolken berühren!'), 70); Audio.play('warn'); }
      if (k.y < FLOOR - 90) S.lowWarned = false;
      if (k.y >= FLOOR) { startFall(); return; }
    }
    if (k.y < ceilY()) { k.y = ceilY(); k.vy = Math.max(0, k.vy); }
  }
  Audio.grindLoop(!!k.rainbow);
  if (k.hitTimer > 0) k.hitTimer -= dt;

  // ---- objects ----
  const kx = k.x + 4, ky = k.y - 50;
  for (const o of S.objects) {
    o.x -= move; o.p += 0.04 * dt;
    if (o.done) continue;
    if (o.type === 'field' && !S.stop && o.x < W - 100) { S.stop = o; S.stopAt = 120; }
    // the OXXO: Kai has to fly all the way up and touch the little shop
    if (o.type === 'oxxo' && !o.done && !S.stop && S.phase === 'play' && touchesOxxo(o)) {
      S.stop = o; S.stopAt = o.x + 1; S.speed = 0; S.kai.vy = 0; S.kai.rainbow = null;
      S.phase = 'shopAsk'; holdPointers.clear(); keyHold = false; Audio.play('chime');
    }
    if (o.type === 'devil') {
      o.x -= (S.speed > 0 ? -1.6 : 0) * dt; o.y = o.baseY + Math.sin(o.p * 1.5) * 18;
      o.throwT -= dt;
      if (o.throwT <= 0 && o.x < W - 40 && o.x > k.x + 60) {
        const dx = kx - o.x, dy = ky - o.y, d = Math.hypot(dx, dy) || 1;
        S.shots.push({ x: o.x - 10, y: o.y, vx: dx / d * 5.5, vy: dy / d * 5.5, rot: Math.atan2(dy, dx) });
        o.throwT = rand(90, 140); Audio.play('throwit');
      }
    }
    if (o.type === 'lightning') { o.t += dt; if (o.t > 60 && !o.boom) { o.boom = true; Audio.play('thunder'); S.shake = 6; } if (o.t > 85) o.done = true; }
    // hazards
    if (o.type === 'devil' && onKai(o.x, o.y, 16)) hurt('Teufelchen!', o.x, o.y);
    if (o.type === 'storm' && onKai(o.x, o.y, o.r * 0.7)) hurt('Gewitterwolke!', o.x, o.y);
    if (o.type === 'lightning' && o.t > 60 && Math.abs(o.x + o.w / 2 - kx) < o.w / 2 + 14) hurt('Blitz!', kx, ky);
    if (o.type === 'coin' && onKai(o.x, o.y, o.r)) { o.done = true; coinGot(1, o.x, o.y); }
    if (o.type === 'cloudp' && o.life <= 0) o.done = true;
  }
  // arrows hit devils (and burst storm clouds)
  for (const a of S.arrows) {
    a.x += a.vx * dt; a.y += a.vy * dt; a.life -= dt;
    for (const o of S.objects) {
      if (o.done || (o.type !== 'devil' && o.type !== 'storm')) continue;
      if (Math.hypot(a.x - o.x, a.y - o.y) < (o.r || 20) + 8) {
        a.life = 0; o.done = true;
        if (o.type === 'devil') { burst(o.x, o.y, '#ff5a3a', 20, 5); Audio.play('devilHit'); coinGot(3, o.x, o.y); flash(tx('TREFFER! +3'), 40); }
        else { burst(o.x, o.y, '#9aa6b1', 16, 4); Audio.play('pop'); }
      }
    }
    // arrows also shoot down the pitchforks the devils throw (shaft or prongs)
    if (a.life > 0) for (const s of S.shots) {
      if (s.dead) continue;
      const tipX = s.x + Math.cos(s.rot) * 16, tipY = s.y + Math.sin(s.rot) * 16;
      if (Math.hypot(a.x - s.x, a.y - s.y) < 18 || Math.hypot(a.x - tipX, a.y - tipY) < 14) {
        s.dead = true; a.life = 0;
        burst(s.x, s.y, '#ffd23a', 12, 4); burst(s.x, s.y, '#c8352c', 8, 3); Audio.play('clank'); coinGot(1, s.x, s.y);
        break;
      }
    }
  }
  S.arrows = S.arrows.filter(a => a.life > 0 && a.x < W + 40 && a.x > -40 && a.y > -DY - 40 && a.y < H + 40);
  for (const s of S.shots) {
    s.x += (s.vx - S.speed * 0.3) * dt; s.y += s.vy * dt;
    // the pitchfork hurts wherever it touches Kai (shaft or prongs)
    const tipX = s.x + Math.cos(s.rot) * 16, tipY = s.y + Math.sin(s.rot) * 16;
    if (!s.dead && (onKai(s.x, s.y, 6) || onKai(tipX, tipY, 4))) { if (hurt('Dreizack!', s.x, s.y)) s.dead = true; }
  }
  S.shots = S.shots.filter(s => !s.dead && s.x > -40 && s.y < H + 40 && s.y > -DY - 40);
  S.objects = S.objects.filter(o => o.x + (o.w || 60) > -120 && !(o.done && (o.type === 'coin' || o.type === 'devil' || o.type === 'storm' || o.type === 'lightning')));
  updateParticles(dt, move);
}
function updateParticles(dt, move) {
  for (const p of S.particles) { p.x += p.vx * dt - move * 0.4; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.life -= 0.025 * dt; }
  S.particles = S.particles.filter(p => p.life > 0);
}

// penalty shoot-out straight from the final screen
if (QUERY.get('mini') === 'football') { S.mini = true; startFootball(); }
