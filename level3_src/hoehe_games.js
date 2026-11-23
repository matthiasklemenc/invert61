// =====================================================================
//  FELSENHÖHE: THE OXXO IN THE TREE HOUSE and the FLUGSAURIER-RITT
// =====================================================================

// ================= OXXO (tree house) =================
const SHOP = [
  { id: 'magma', name: 'Magma-Board', desc: 'Pflicht für die Lavahöhlen!', price: 50, kind: 'item' },
  { id: 'sling2', name: 'Super-Schleuder', desc: 'Schießt doppelt und schneller', price: 35, kind: 'item' },
  { id: 'heart', name: 'Herz', desc: '+1 Herz', price: 20, kind: 'power' },
  { id: 'capRed', who: 'kai', name: 'Rote Kappe', price: 10, kind: 'cloth', apply: o => { o.cap = '#d8352c'; o.beanie = false; } },
  { id: 'capGreen', who: 'kai', name: 'Grüne Kappe', price: 10, kind: 'cloth', apply: o => { o.cap = '#2f8a5f'; o.beanie = false; } },
  { id: 'capBali', who: 'bali', name: 'Schildkappe', desc: 'Kappe für Bali', price: 10, kind: 'cloth', apply: o => { o.cap = '#f48fb8'; o.beanie = false; } },
  { id: 'shorts', who: 'bali', name: 'Kurze Hose', desc: 'Jeans-Shorts für den Sommer', price: 15, kind: 'cloth', apply: o => { o.bottom = 'shorts'; } },
  { id: 'skirt', who: 'bali', name: 'Rock', desc: 'Rock bis zu den Knien', price: 15, kind: 'cloth', apply: o => { o.bottom = 'skirt'; } },
  { id: 'capGold', name: 'Goldene Kappe', price: 30, kind: 'cloth', apply: o => { o.cap = '#e8b923'; o.beanie = false; } },
  { id: 'beanie', name: 'Beanie', price: 15, kind: 'cloth', apply: o => { o.beanie = true; } },
  { id: 'backpack', name: 'Rucksack', price: 20, kind: 'cloth', apply: o => { o.backpack = !o.backpack; } },
  { id: 'teeRed', name: 'Rotes T-Shirt', price: 10, kind: 'cloth', apply: o => { o.tee = '#c8352c'; } },
  { id: 'teeYellow', name: 'Gelbes T-Shirt', price: 10, kind: 'cloth', apply: o => { o.tee = '#e0a81e'; } },
  { id: 'shoesRed', name: 'Rote Schuhe', price: 15, kind: 'cloth', apply: o => { o.shoes = '#d8352c'; } },
];
const shopList = () => SHOP.filter(forChar);
const SHOP_CARD = { cols: 6, w: 172, h: 108, gap: 10 };
SHOP_CARD.x0 = (W - (SHOP_CARD.cols * SHOP_CARD.w + (SHOP_CARD.cols - 1) * SHOP_CARD.gap)) / 2; SHOP_CARD.y0 = 52;
function shopCardRect(i) { const c = i % SHOP_CARD.cols, r = Math.floor(i / SHOP_CARD.cols); return { x: SHOP_CARD.x0 + c * (SHOP_CARD.w + SHOP_CARD.gap), y: SHOP_CARD.y0 + r * (SHOP_CARD.h + SHOP_CARD.gap), w: SHOP_CARD.w, h: SHOP_CARD.h }; }
function shopOwned(it) {
  if (it.id === 'magma') return !!SAVE.items.magmaBoard;
  if (it.id === 'sling2') return !!SAVE.items.sling2;
  if (it.kind === 'cloth') return !!SAVE.owned[it.id];
  return false;
}
function openShop() { S.phase = 'shop'; Audio.play('buy'); S.shopMsg = tx('Willkommen im OXXO!'); S.shopMsgT = 120; const k = S.kai; k.vx = 0; k.dir = 0; }
function shopClick(p) {
  if (inRect(p, BTN.shopDone)) { leaveShop(); return; }
  shopList().forEach((it, i) => {
    if (!inRect(p, shopCardRect(i))) return;
    const owned = shopOwned(it);
    if (owned && it.kind === 'cloth') { it.apply(SAVE.outfit); writeSave(); Audio.play('flip'); S.shopMsg = tx('Angezogen'); S.shopMsgT = 60; return; }
    if (owned) { S.shopMsg = tx('Schon gekauft'); S.shopMsgT = 60; return; }
    if (S.coins < it.price) { Audio.play('denied'); S.shopMsg = tx('Zu wenig Münzen!'); S.shopMsgT = 80; return; }
    S.coins -= it.price; spendCoins(it.price); Audio.play('buy'); S.shopMsg = tx('Gekauft!'); S.shopMsgT = 70;
    if (it.id === 'magma') SAVE.items.magmaBoard = true;
    if (it.id === 'sling2') { SAVE.items.sling2 = true; SAVE.weapon.hoehe = 'sling2'; }
    if (it.id === 'heart') { S.hearts++; S.heartFlash = -40; }
    if (it.kind === 'cloth') { SAVE.owned[it.id] = true; it.apply(SAVE.outfit); }
    SAVE.coins = S.coins; SAVE.hearts = S.hearts; writeSave();
  });
}
function leaveShop() {
  S.phase = 'play'; Audio.play('tink');
  const k = S.kai; k.x = SITES.oxxo + 170; k.dir = 0; k.vx = 0; k.face = 1;
  if (!SAVE.items.magmaBoard) flash('Ohne Magma-Board kommst du nicht in die Lavahöhlen!', 140);
}

// ================= FLUGSAURIER-RITT =================
// Kai rides a pterosaur through a canyon of rock pillars: tap / jump = flap the wings.
// 25 seconds; bumping into a rock 3 times = thrown off. Coins in the gaps.
const RIDE_T = 1500, RIDE_SP = 4.6, RIDE_X = 280, RIDE_FLAP = -5.4, RIDE_G = 0.3;
function startRide() {
  const k = S.kai; k.vx = 0; k.dir = 0;
  S.game = { id: 'ptero', t: 0, y: 170, vy: 0, pillars: [], coins: [], bumps: 0, inv: 0, got: 0, result: null, spawn: 30, scroll: 0, wing: 0 };
  S.phase = 'ride'; Audio.play('chime');
  flash(isTouchDev() ? 'Tippen = mit den Flügeln schlagen!' : 'Leertaste / Klick = mit den Flügeln schlagen!', 140);
}
function rideFlap() { const g = S.game; if (!g || g.result) return; g.vy = RIDE_FLAP; g.wing = 12; Audio.play('flap'); }
function ridePointer(p) {
  const g = S.game; if (!g) return;
  if (g.result) { if (inRect(p, GBTN.next)) endRide(); return; }
  rideFlap();
}
function gameKey(e) {
  if (S.phase === 'shop') { if (e.code === 'Escape' || e.code === 'Enter') leaveShop(); return; }
  if (S.phase === 'ride') {
    const g = S.game; if (!g) return;
    if (g.result) { if (e.code === 'Space' || e.code === 'Enter') endRide(); return; }
    if (!e.repeat && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW')) { e.preventDefault(); rideFlap(); }
  }
}
function gameKeyUp() {}
const GBTN = { next: { x: W / 2 - 110, y: 250, w: 220, h: 44 } };
const rideBox = g => ({ x1: RIDE_X - 34, x2: RIDE_X + 34, y1: g.y - 72, y2: g.y + 16 });
function updateRide(dt) {
  const g = S.game; if (!g || g.result) return;
  g.t += dt; g.scroll += RIDE_SP * dt;
  if (g.inv > 0) g.inv -= dt; if (g.wing > 0) g.wing -= dt;
  g.vy = Math.min(7, g.vy + RIDE_G * dt); g.y += g.vy * dt;
  if (g.y < 90) { g.y = 90; g.vy = Math.max(0, g.vy); }
  if (g.y > FLOOR - 16) { g.y = FLOOR - 16; g.vy = RIDE_FLAP * 0.8; bump(); }
  // new rock pillars with a gap (the gap gets a little smaller over time)
  g.spawn -= dt;
  if (g.spawn <= 0 && g.t < RIDE_T - 120) {
    g.spawn = 92;
    const gap = 184 - Math.min(24, g.t / RIDE_T * 30), mid = rand(110 + gap * 0.1, FLOOR - 40 - gap / 2);
    const top = Math.max(60, mid - gap / 2);
    g.pillars.push({ x: W + 60, top, bot: top + gap, w: 74, hit: false });
    for (let i = 0; i < 3; i++) g.coins.push({ x: W + 60 + 37, y: top + gap / 2 + (i - 1) * 34, done: false });
  }
  for (const pl of g.pillars) pl.x -= RIDE_SP * dt;
  for (const c of g.coins) c.x -= RIDE_SP * dt;
  g.pillars = g.pillars.filter(pl => pl.x > -120); g.coins = g.coins.filter(c => c.x > -40 && !c.done);
  const b = rideBox(g);
  for (const pl of g.pillars) {
    if (b.x2 < pl.x || b.x1 > pl.x + pl.w) continue;
    if (b.y1 < pl.top || b.y2 > pl.bot) { if (!pl.hit) { pl.hit = true; bump(); } }
  }
  for (const c of g.coins) if (!c.done && Math.abs(c.x - RIDE_X) < 40 && c.y > b.y1 - 8 && c.y < b.y2 + 8) { c.done = true; S.coins++; g.got++; Audio.play('coin'); }
  if (g.bumps >= 3) { g.result = 'lose'; Audio.play('nomatch'); Audio.play('crash'); S.shake = 8; saveProgress(); }
  else if (g.t >= RIDE_T) { g.result = 'win'; S.coins += 20; SAVE.mini.ptero = true; saveProgress(); Audio.play('win'); Audio.play('cheer'); }
}
function bump() {
  const g = S.game; if (g.inv > 0) return;
  g.bumps++; g.inv = 70; S.shake = 7; Audio.play('crash');
}
function endRide() {
  const k = S.kai, gate = SITES.ptero + 120;
  S.game = null; S.phase = 'play'; saveProgress();
  k.x = gate + 50; k.y = FLOOR; k.vy = 0; k.ground = true; k.platform = null; k.dir = 0; k.face = 1;
  Audio.play('tink');
}
