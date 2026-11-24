// =====================================================================
//  LAVAHÖHLEN – MINI GAME: LORE-FAHRT (mine cart race)
//  Three tracks above each other. The cart races to the right and gets faster and faster.
//    ▲ / ▼        = change to the track above / below
//    SPRUNG       = jump (over holes in the track and rocks)
//    DUCKEN (hold)= duck (under low beams and glow bats)
//    an oncoming cart can't be jumped – change the track! (a "!" warns at the right edge)
//  Gems on all tracks. 30 seconds; 3 crashes = the ride is over.
// =====================================================================
const LORE_T = 1800, CART_X = 380, CART_JUMP = -9.6, CART_G = 0.5;
// the three tracks use the whole height of the screen above the buttons (0 = bottom, 1 = middle, 2 = top)
const loreBottom = () => H - 140;
const loreGap = () => clamp((loreBottom() - (-DY + 140)) / 2, 96, 140);
const laneY = i => loreBottom() - i * loreGap();
const loreSpeed = g => 5 + Math.min(1, g.t / LORE_T) * 3.5; // faster and faster
function startLore() {
  const k = S.kai; k.vx = 0; k.dir = 0;
  S.game = { id: 'lore', t: 0, lane: 1, from: 1, sw: 0, y: laneY(1), jy: 0, vy: 0, air: false, duck: false, duckP: new Set(), duckKey: false,
    obs: [], gems: [], crashes: 0, inv: 0, result: null, next: 200, scroll: 0, got: 0 };
  S.phase = 'lore'; Audio.play('chime');
  flash(isTouchDev() ? '▲ ▼ = Gleis wechseln · SPRUNG · DUCKEN halten' : '↑ ↓ = Gleis · Leertaste = springen · X halten = ducken', 180);
}
// ---------- controls ----------
function loreLane(d) {
  const g = S.game; if (!g || g.result || g.air || g.sw > 0) return;
  const n = clamp(g.lane + d, 0, 2); if (n === g.lane) return;
  g.from = g.lane; g.lane = n; g.sw = 12; Audio.play('clank');
}
function loreJump() { const g = S.game; if (!g || g.result || g.air || g.sw > 0) return; g.vy = CART_JUMP; g.air = true; Audio.play('jump'); }
// the four buttons of the ride (screen / world coordinates of the lower part)
const LBTN = { R: 52 };
const loreBtn = () => {
  const R = LBTN.R, y = H - 12 - R;
  return { down: { x: 18 + R, y }, up: { x: 18 + R * 3 + 20, y }, duck: { x: W - 18 - R * 3 - 20, y }, jump: { x: W - 18 - R, y } };
};
const inCircle = (p, c) => Math.hypot(p.x - c.x, p.y - c.y) < LBTN.R + 12;
function lorePointer(p, id) {
  const g = S.game; if (!g) return;
  if (g.result) {
    if (g.result === 'lose' && inRect(p, GBTN.again)) { S.game = null; startLore(); return; }
    if (inRect(p, g.result === 'lose' ? GBTN.next2 : GBTN.next)) endLore();
    return;
  }
  const b = loreBtn();
  if (inCircle(p, b.up)) loreLane(1);
  else if (inCircle(p, b.down)) loreLane(-1);
  else if (inCircle(p, b.duck)) g.duckP.add(id);
  else if (inCircle(p, b.jump)) loreJump();
  else if (p.x > W / 2) loreJump();                      // anywhere else on the right half = jump
}
const releaseDuck = e => { if (CUR === ME && S.game && S.game.duckP) S.game.duckP.delete(e.pointerId); };
window.addEventListener('pointerup', releaseDuck); window.addEventListener('pointercancel', releaseDuck);
function gameKey(e) {
  if (S.phase !== 'lore') return;
  const g = S.game; if (!g) return;
  if (g.result) { if (e.code === 'Space' || e.code === 'Enter') endLore(); return; }
  if (e.repeat) return;
  if (e.code === 'ArrowUp' || e.code === 'KeyW') loreLane(1);
  else if (e.code === 'ArrowDown' || e.code === 'KeyS') loreLane(-1);
  else if (e.code === 'Space') { e.preventDefault(); loreJump(); }
  else if (e.code === 'KeyX' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') g.duckKey = true;
}
window.addEventListener('keyup', e => { if (CUR === ME && S.game && S.game.id === 'lore' && (e.code === 'KeyX' || e.code === 'ShiftLeft' || e.code === 'ShiftRight')) S.game.duckKey = false; });
function gameKeyUp() {}
const GBTN = { next: { x: W / 2 - 110, y: 250, w: 220, h: 44 }, again: { x: W / 2 - 235, y: 250, w: 220, h: 44 }, next2: { x: W / 2 + 15, y: 250, w: 220, h: 44 } };

// ---------- the ride ----------
// the cart's box: standing Kai reaches 110 px above the rail, ducking only 58
const cartBox = g => ({ x1: CART_X - 40, x2: CART_X + 40, y1: g.y + g.jy - (g.duck ? 58 : 110), y2: g.y + g.jy });
const overGap = (g, lane) => g.obs.some(o => o.type === 'gap' && o.lane === lane && CART_X > o.x + 14 && CART_X < o.x + o.w - 14);
function spawnLore(g) {
  const lane = Math.floor(Math.random() * 3), x = W + 60, r = Math.random(), late = g.t / LORE_T;
  if (r < 0.24) g.obs.push({ type: 'gap', lane, x, w: rand(90, 130) });
  else if (r < 0.42) g.obs.push({ type: 'rock', lane, x, w: 40, h: 34 });
  else if (r < 0.6) g.obs.push({ type: 'beam', lane, x, w: 46 });
  else if (r < 0.76) g.obs.push({ type: 'bat', lane, x, w: 44, t: 0 });
  else if (!g.obs.some(o => o.type === 'cart' && (o.warn > 0 || o.x > CART_X - 100))) g.obs.push({ type: 'cart', lane, x: x + 260, w: 92, warn: 70 });   // oncoming: announced at the edge first (only one at a time – there is always a free track)
  else g.obs.push({ type: 'rock', lane, x, w: 40, h: 34 });
  // gems: a row on some track, sometimes high up (only with a jump)
  if (Math.random() < 0.7) { const gl = Math.floor(Math.random() * 3), high = Math.random() < 0.4; for (let i = 0; i < 3; i++) g.gems.push({ lane: gl, x: x + 140 + i * 34, dy: high ? 120 : 50 }); }
  g.next = rand(230, 330) - late * 60;
}
function updateLore(dt) {
  const g = S.game; if (!g || g.result) return;
  const sp = loreSpeed(g);
  g.t += dt; g.scroll += sp * dt;
  if (g.inv > 0) g.inv -= dt;
  g.duck = g.duckKey || g.duckP.size > 0;
  g.next -= sp * dt;
  if (g.next <= 0 && g.t < LORE_T - 90) spawnLore(g);
  for (const o of g.obs) {
    if (o.type === 'cart' && o.warn > 0) { o.warn -= dt; if (o.warn > 0) continue; }
    o.x -= (sp + (o.type === 'cart' ? 4 : 0)) * dt; if (o.type === 'bat') o.t += dt;
  }
  for (const gm of g.gems) gm.x -= sp * dt;
  g.obs = g.obs.filter(o => o.x + o.w > -80); g.gems = g.gems.filter(gm => gm.x > -30 && !gm.done);
  // changing the track: the cart glides up / down
  if (g.sw > 0) { g.sw -= dt; const u = 1 - Math.max(0, g.sw) / 12; g.y = laneY(g.from) + (laneY(g.lane) - laneY(g.from)) * u; if (g.sw <= 0) g.y = laneY(g.lane); }
  // jumping (g.jy = height above the rail)
  if (g.air) {
    g.vy += CART_G * dt; g.jy += g.vy * dt;
    if (g.jy >= 0 && !overGap(g, g.lane)) { g.jy = 0; g.vy = 0; g.air = false; Audio.play('land'); }
  } else if (g.sw <= 0 && overGap(g, g.lane)) { g.air = true; g.vy = 1; }
  // fell into a hole: crash, the cart is put back on the rail behind it
  if (g.jy > 60) { crash(); g.jy = 0; g.vy = 0; g.air = false; for (const o of g.obs) if (o.type === 'gap' && o.lane === g.lane && o.x < CART_X + 60) o.x = -999; }
  if (g.sw <= 0) {
    const b = cartBox(g), ly = laneY(g.lane);
    for (const o of g.obs) {
      if (o.hit || o.lane !== g.lane || b.x2 < o.x || b.x1 > o.x + o.w) continue;
      if (o.type === 'rock' && b.y2 > ly - o.h) { o.hit = true; crash(); }
      if (o.type === 'beam' && b.y1 < ly - 74) { o.hit = true; crash(); }                           // a low beam: duck!
      if (o.type === 'bat' && b.y1 < ly - 70 && b.y2 > ly - 100) { o.hit = true; crash(); }         // bat at head height: duck!
      if (o.type === 'cart' && o.warn <= 0) { o.hit = true; crash(); }                              // oncoming cart: change the track!
    }
    for (const gm of g.gems) if (!gm.done && gm.lane === g.lane && Math.abs(gm.x - CART_X) < 44) {
      const gy = ly - gm.dy; if (gy > b.y1 - 12 && gy < b.y2 + 6) { gm.done = true; S.coins++; addScore(PTS.coin); g.got++; Audio.play('pearl'); }
    }
  }
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
