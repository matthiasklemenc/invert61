// =====================================================================
//  LAVAHÖHLEN – MINI GAME: LORE-FAHRT (mine cart ride)
//  Kai sits in a mine cart that races along the rails through the cave. Tap / Space = the cart jumps.
//  Jump over holes in the track and over rocks – but not into the glow bats flying above the rails.
//  Collect the gems. 25 seconds; crashing 3 times = the ride is over.
// =====================================================================
const LORE_T = 1500, LORE_SP = 5.6, CART_X = 300, RAIL_Y = FLOOR - 16, CART_JUMP = -10.8, CART_G = 0.5;
function startLore() {
  const k = S.kai; k.vx = 0; k.dir = 0;
  S.game = { id: 'lore', t: 0, y: RAIL_Y, vy: 0, ground: true, obs: [], gems: [], crashes: 0, inv: 0, result: null, next: 140, scroll: 0, got: 0 };
  S.phase = 'lore'; Audio.play('chime');
  flash(isTouchDev() ? 'Tippen = mit der Lore springen!' : 'Leertaste / Klick = mit der Lore springen!', 140);
}
function loreJump() { const g = S.game; if (!g || g.result || !g.ground) return; g.vy = CART_JUMP; g.ground = false; Audio.play('jump'); }
function lorePointer(p) {
  const g = S.game; if (!g) return;
  if (g.result) {
    if (g.result === 'lose' && inRect(p, GBTN.again)) { S.game = null; startLore(); return; }
    if (inRect(p, g.result === 'lose' ? GBTN.next2 : GBTN.next)) endLore();
    return;
  }
  loreJump();
}
function gameKey(e) {
  if (S.phase !== 'lore') return;
  const g = S.game; if (!g) return;
  if (g.result) { if (e.code === 'Space' || e.code === 'Enter') endLore(); return; }
  if (!e.repeat && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW')) { e.preventDefault(); loreJump(); }
}
function gameKeyUp() {}
const GBTN = { next: { x: W / 2 - 110, y: 250, w: 220, h: 44 }, again: { x: W / 2 - 235, y: 250, w: 220, h: 44 }, next2: { x: W / 2 + 15, y: 250, w: 220, h: 44 } };
const cartBox = g => ({ x1: CART_X - 40, x2: CART_X + 40, y1: g.y - 110, y2: g.y });
const overGap = g => g.obs.some(o => o.type === 'gap' && CART_X > o.x + 12 && CART_X < o.x + o.w - 12);
function updateLore(dt) {
  const g = S.game; if (!g || g.result) return;
  g.t += dt; g.scroll += LORE_SP * dt;
  if (g.inv > 0) g.inv -= dt;
  // new obstacles: holes in the track, rocks on the rails, glow bats above
  g.next -= LORE_SP * dt;
  if (g.next <= 0 && g.t < LORE_T - 100) {
    const r = Math.random(), x = W + 40;
    if (r < 0.4) { const w = rand(90, 130); g.obs.push({ type: 'gap', x, w }); for (let i = 0; i < 3; i++) g.gems.push({ x: x + w / 2 + (i - 1) * 30, y: RAIL_Y - 130 + Math.abs(i - 1) * 14 }); }
    else if (r < 0.75) { g.obs.push({ type: 'rock', x, w: 40, h: 34 }); g.gems.push({ x: x + 20, y: RAIL_Y - 120 }); }
    else { g.obs.push({ type: 'bat', x, w: 46, y: RAIL_Y - 170 + Math.random() * 20, t: 0 }); g.gems.push({ x: x + 23, y: RAIL_Y - 60 }); }
    g.next = rand(300, 460);
  }
  for (const o of g.obs) { o.x -= LORE_SP * dt; if (o.type === 'bat') o.t = (o.t || 0) + dt; }
  for (const gm of g.gems) gm.x -= LORE_SP * dt;
  g.obs = g.obs.filter(o => o.x + o.w > -60); g.gems = g.gems.filter(gm => gm.x > -30 && !gm.done);
  // the cart: on the rails or in the air
  if (!g.ground) {
    g.vy += CART_G * dt; g.y += g.vy * dt;
    if (g.y >= RAIL_Y && !overGap(g)) { g.y = RAIL_Y; g.vy = 0; g.ground = true; Audio.play('land'); }
  } else if (overGap(g)) { g.ground = false; g.vy = 1; }
  if (g.y > RAIL_Y + 40) { crash(); g.y = RAIL_Y; g.vy = 0; g.ground = true; for (const o of g.obs) if (o.type === 'gap' && o.x < CART_X + 60) o.x = -999; }
  const b = cartBox(g);
  for (const o of g.obs) {
    if (o.type === 'rock' && !o.hit && b.x2 > o.x && b.x1 < o.x + o.w && b.y2 > RAIL_Y - o.h) { o.hit = true; crash(); }
    if (o.type === 'bat' && !o.hit && b.x2 > o.x && b.x1 < o.x + o.w && b.y1 < o.y + 14 && b.y2 > o.y - 14) { o.hit = true; crash(); }
  }
  for (const gm of g.gems) if (!gm.done && Math.abs(gm.x - CART_X) < 44 && gm.y > b.y1 - 10 && gm.y < b.y2 + 10) { gm.done = true; S.coins++; addScore(PTS.coin); g.got++; Audio.play('pearl'); }
  if (g.crashes >= 3) { g.result = 'lose'; Audio.play('nomatch'); saveProgress(); }
  else if (g.t >= LORE_T) {
    g.result = 'win'; S.coins += 20; SAVE.mini.lore = true;
    g.pts = !SAVE.pts.mini_lore; if (g.pts) { SAVE.pts.mini_lore = true; S.score += PTS.mini; }
    saveProgress(); Audio.play('win'); Audio.play('cheer');
  }
}
function crash() { const g = S.game; if (g.inv > 0) return; g.crashes++; g.inv = 70; S.shake = 8; Audio.play('crash'); }
function endLore() {
  const k = S.kai, gate = SITES.lore + 120;
  S.game = null; S.phase = 'play'; saveProgress();
  k.x = gate + 200; k.y = FLOOR; k.vy = 0; k.ground = true; k.platform = null; k.dir = 0; k.face = 1;
  Audio.play('tink');
}
