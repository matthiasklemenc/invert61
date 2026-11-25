
// =====================================================================
//  LEVEL 2 · DIE STADT  (normal world)  – ends with the garbage-truck boss
// =====================================================================
const SPEED = 6.2, GRAV = 0.62, HOLD_GRAV = 0.36, JUMP_V = -11.5, RAMP_V = -13.5;
const SCALE = SPEED / 4.4;              // keep the level about one minute long at the new speed
const LEVEL_LENGTH = Math.round(17000 * SCALE), START_HEARTS = 5;
const EVENTS = [
  { at: 1200, type: 'ramp' },
  { at: 3500, type: 'taco' },
  { at: 6000, type: 'icecream' },
  { at: 7700, type: 'ramp' },
  { at: 9350, type: 'pinata' },         // piñata party mini game
  { at: 10500, type: 'taco' },
  { at: 12800, type: 'ramp' },
  { at: 15800, type: 'taco' },          // last taco right before the garbage truck
];
for (const ev of EVENTS) ev.at = Math.round(ev.at * SCALE);
// angel-wing ramps come again and again during the whole city (until the sky has been done)
const WING_EVERY = 4000;
for (let a = Math.round(2400 * SCALE); a < LEVEL_LENGTH - 1200; a += WING_EVERY) {
  let b = a;
  while (EVENTS.some(ev => Math.abs(ev.at - b) < 1100)) b += 100;          // keep clear of ramps, trucks, stands (~3 s)
  if (b < LEVEL_LENGTH - 1200) EVENTS.push({ at: b, type: 'wing' });
  a = b;
}
EVENTS.sort((a, b) => a.at - b.at);
// objects appear at the right edge and need LEAD distance until they reach Kai:
// spawn them that much earlier, so the timeline icon and the object arrive at the same time
const LEAD = (W + 60) - 250;
for (const ev of EVENTS) ev.spawnAt = Math.max(0, ev.at - LEAD);
const wingsActive = () => true;     // the angel-wing ramps always stay – also when the sky is already done (play it again)
// green tubes: jump on top → with the harpoon Kai slides down into the deep sea
const PIPE_EVERY = 4000;
for (let a = Math.round(4200 * SCALE); a < LEVEL_LENGTH - 1200; a += PIPE_EVERY) {
  let b = a;
  while (EVENTS.some(ev => Math.abs(ev.at - b) < 900)) b += 100;
  if (b < LEVEL_LENGTH - 1200) EVENTS.push({ at: b, type: 'pipe', spawnAt: Math.max(0, b - LEAD) });
}
EVENTS.sort((a, b) => a.at - b.at);
const BLD_COLORS = ['#f28ab2', '#f6c94c', '#4cc3c8', '#f08a4b', '#b59de0', '#7fcf8a', '#f5a3a3', '#6fb3e8'];

const FROM_SKY = QUERY.get('from') === 'himmel', FROM_SEA = QUERY.get('from') === 'tiefsee', FELL = QUERY.get('fall') === '1';
const CONT = QUERY.get('from') === 'continue' || QUERY.get('from') === 'replay';   // continue / play again: never wipe the save
const REPLAY = QUERY.get('from') === 'replay';            // WEITERSPIELEN from the title menu
const START_MODE = !REPLAY && (FROM_SKY || FROM_SEA || CONT) && SAVE.done.city ? 'harbor' : 'main';
const RESUME = !REPLAY && (FROM_SKY || FROM_SEA || CONT) && !SAVE.done.city && SAVE.cityResume ? SAVE.cityResume : null;
function newState(mode = START_MODE) {
  return {
    mode, outroIdx: 0, pierWarned: false, outroDist: 0, wingSpawned: false, pierSpawned: false, harbor: null, overWater: false, finalAfter: 0, splashed: false, sailBoings: 0, ahoiT: 0,
    phase: 'start', t: 0, scroll: 0, speed: SPEED, dist: 0, eventIdx: 0,
    kai: { x: 250, y: FLOOR, vy: 0, vx: 0, ground: true, platform: null, grind: false, flip: 0, flipping: false, pushT: 0, hitTimer: 0, grindT: 0, combo: 0, bossFly: false },
    hearts: SAVE.hearts, coins: SAVE.coins, heartFlash: 0, lostBy: '',
    objects: [], particles: [], projectiles: [], nextSpawn: 400,
    msg: '', msgTimer: 0, shake: 0, boss: null, phaseTimer: 0, party: null, partyDone: false, pin: null,
  };
}
const S = newState();
if (RESUME) { S.dist = RESUME.dist; S.eventIdx = RESUME.eventIdx; S.scroll = RESUME.dist; S.nextSpawn = 600; }
function resetGame() {
  // a game over only restarts the current world (from its checkpoint)
  const mode = S.mode === 'outro' ? 'main' : S.mode;
  restartWorldSave(); SAVE.cityResume = null; writeSave();
  Audio.stopSong(); Audio.grindLoop(false); Object.assign(S, newState(mode)); S.phase = 'play'; Audio.setBoss(false);
}
function beginWorld() {
  // first tap on the start screen
  if (S.mode === 'main' && !RESUME && !CONT) { resetSave(true); S.hearts = SAVE.hearts; S.coins = SAVE.coins; setCheckpoint('city'); }
  else if (S.mode === 'main') useCheckpoint('city');
  else setCheckpoint('city2');
  S.phase = 'play'; SAVE.started = true; writeSave();
}
function saveProgress() { SAVE.hearts = S.hearts; SAVE.coins = S.coins; writeSave(); }
// ---- after the garbage truck: on to the harbor; wing ramps lead up into the sky ----
// first one angel-wing ramp (the way up to the sky always stays open), then the HARBOR:
// the street turns into water, Kai rides over a long wooden pier, at its end a ramp → jump (+10) → splash → deep sea
const OUTRO = { wing: 600, harbor: 1800, wingEvery: 1300, pierLen: 1700 };
const WATER_Y = FLOOR + 20;                 // the water line lies BELOW the street / pier
const SAIL_Y = WATER_Y - 72;                // where Kai bounces off a sail (trampoline)
function clearAhead() { S.objects = S.objects.filter(o => !(o.x > W - 60 && o.type !== 'coin')); }
function updateOutro(move) {
  if (S.mode === 'main') return;
  S.outroDist = (S.outroDist || 0) + move;
  const d = S.outroDist;
  if (!S.wingSpawned && d >= OUTRO.wing && wingsActive()) {
    S.wingSpawned = true; clearAhead();
    const o = addObject('ramp', W + 60); o.wings = true; addCoinArc(W - 160, FLOOR - 40, 4, 0, 34); S.nextSpawn = Math.max(S.nextSpawn, 560);
  }
  if (!S.pierSpawned && d >= OUTRO.harbor) {
    S.pierSpawned = true;
    if (SAVE.items.harpoon) startHarbor();
    else { clearAhead(); addObject('pier', W + 40); S.nextSpawn = Math.max(S.nextSpawn, 500); }    // closed gate: no harpoon yet
  }
  // without the harpoon: more wing ramps up to the sky (the OXXO up there sells the harpoon)
  if (S.pierSpawned && !S.harbor && !SAVE.items.harpoon && d >= OUTRO.harbor + 900 + S.outroIdx * OUTRO.wingEvery) {
    S.outroIdx++; const o = addObject('ramp', W + 60); o.wings = true; S.nextSpawn = Math.max(S.nextSpawn, 420);
  }
}
function startHarbor() {
  clearAhead();
  const x = W + 40, len = OUTRO.pierLen;
  // sailboats in the open water after the pier – about one ramp jump / one sail bounce apart
  S.harbor = addObject('boardwalk', x, { w: len, boats: [270, 600, 930].map((d, i) => ({ d: len + d, i: i + 1, hits: 0, rock: 0 })) });
  const r = addObject('ramp', x + len - 96); r.pierRamp = true;           // the ramp sits right at the end of the pier
  // a second angel-wing ramp in the middle of the pier: one more chance to fly up to the sky
  if (wingsActive()) { const w2 = addObject('ramp', x + Math.round(len * 0.5) - 48); w2.wings = true; }
  for (let i = 0; i < 3; i++) addCoinArc(x + 260 + i * 440, FLOOR - 40, 5, 0, 34);
  addCoinArc(x + len + 10, FLOOR - 150, 5, 50, 42);                     // coins over the water: only reachable with the ramp jump
  addCoinArc(x + len + 330, FLOOR - 230, 5, 40, 44);                    // high up: only reachable with a sail bounce
  addCoinArc(x + len + 660, FLOOR - 230, 5, 40, 44);
}
// SEGEL-TRAMPOLIN: landing on a sail throws Kai up high – BOING! + "Ahoi, Kapitän Kai!"
function sailHit(prevY, y) {
  const k = S.kai;
  for (const b of S.harbor.boats) {
    const bx = S.harbor.x + b.d;
    if (k.x > bx - 58 && k.x < bx + 62 && prevY <= SAIL_Y && y >= SAIL_Y) return b;
  }
  return null;
}
function sayAhoi() {
  // the phone / browser speaks it (built-in voice); the text is shown anyway
  try {
    if (!Audio.sfxOn || !window.speechSynthesis) return;
    const l = SAVE.lang || 'de';
    const u = new SpeechSynthesisUtterance(tx('Ahoi, Kapitän Kai!'));      // "… Kapitän Bali!" when Bali rides
    u.lang = { de: 'de-DE', en: 'en-US', es: 'es-MX' }[l] || 'de-DE'; u.rate = 1.05; u.pitch = 1.3; u.volume = 1;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) {}
}
function sailBoing(b) {
  const k = S.kai;
  k.y = SAIL_Y; k.vy = -16.5; k.rampJump = true; k.ground = false; k.platform = null;
  b.hits++; b.rock = 1; S.coins += 20; S.sailBoings = (S.sailBoings || 0) + 1; gainPts(PTS.sail, k.x, SAIL_Y - 40, true);
  Audio.play('boing'); Audio.play('coin');
  for (let i = 0; i < 16; i++) S.particles.push({ x: k.x + rand(-30, 30), y: SAIL_Y + rand(-10, 10), vx: rand(-3, 3), vy: rand(-4, 1), r: rand(2, 4), color: i % 2 ? '#ffffff' : '#ffd23a', life: 1, g: 0.15 });
  flash(S.sailBoings > 1 ? tx('{n}× SEGEL-BOING! +20', { n: S.sailBoings }) : tx('SEGEL-BOING! +20'), 70);
  S.ahoiT = 130; sayAhoi();
}
// into the water at the end of the pier
function splashIntoWater() {
  const k = S.kai;
  S.phase = 'dive'; S.diveT = 0; S.splashed = true; k.ground = false; k.platform = null;
  Audio.grindLoop(false); Audio.play('pop'); Audio.play('air');
  for (let i = 0; i < 44; i++) S.particles.push({ x: k.x + rand(-24, 24), y: WATER_Y, vx: rand(-5, 5), vy: rand(-11, -3), r: rand(2, 6), color: i % 3 ? '#7fd6ef' : '#ffffff', life: 1.5, g: 0.35 });
  saveProgress();
  if (allBossesDone()) { S.finalAfter = 55; flash(tx('Alle Bosse besiegt!'), 90); return; }      // everything done: the big final screen
  // the deep sea is already done: no forced trip down – a rescue boat fishes Kai out and brings him back (the wing ramp comes again)
  if (SAVE.done.sea) { S.rescue = { t: 0, bx: W + 140, picked: false, fade: 0 }; flash(tx('Plitsch! Das Rettungsboot kommt!'), 120); return; }
  flash(tx('Ab in die Tiefsee!'), 90);
  goToWorld('tiefsee.html', 'from=stadt&splash=1');             // the camera follows Kai under water
}
// RESCUE BOAT (deep sea already done): Kai bobs in the water, the boat picks him up, short fade, back to the street before the harbor
function updateRescue(dt) {
  const k = S.kai, r = S.rescue; r.t += dt; S.scroll += 0.4 * dt;
  if (!r.picked) {
    // Kai sinks a little, then bobs at the surface
    k.vy = Math.min(k.vy + 0.5 * dt, 3); k.y = Math.min(k.y + k.vy * dt, WATER_Y + 26 + Math.sin(r.t * 0.12) * 3);
    if (r.t > 30) r.bx -= 7 * dt;
    if (r.bx <= k.x + 10) { r.picked = true; r.t = 0; Audio.play('chime'); flash(tx('Gerettet! Nochmal zur Engelsrampe!'), 120); }
  } else {
    k.y = WATER_Y - 14; k.x += 4 * dt; r.bx = k.x - 10;
    if (r.t > 50) r.fade = Math.min(1, r.fade + 0.05 * dt);
    if (r.fade >= 1) backToHarborStart();
  }
}
function backToHarborStart() {
  const k = S.kai;
  S.rescue = null; S.objects = []; S.projectiles = []; S.harbor = null; S.overWater = false; S.splashed = false;
  S.pierSpawned = false; S.wingSpawned = false; S.outroDist = Math.max(0, OUTRO.wing - 450); S.nextSpawn = 380; S.outroIdx = 0;
  Object.assign(k, { x: 250, y: FLOOR, vy: 0, vx: 0, ground: true, platform: null, grind: false, rampJump: false, flip: 0, flipping: false, combo: 0 });
  S.phase = 'play'; S.fadeIn = 1; holding = false; keyDown = false; pressQueued = false;
}
function startAscend() {
  const k = S.kai;
  S.phase = 'ascend'; S.ascendT = 0; k.vy = -9; k.ground = false; k.platform = null;
  Audio.play('chime'); flash(tx('Engelsflügel-Rampe! Ab in den Himmel!'), 120);
  // remember where Kai took off – back from the sky (or after falling down) he carries on here
  SAVE.cityResume = S.mode === 'main' ? { dist: S.dist, eventIdx: S.eventIdx } : null;
  saveProgress();
  goToWorld('himmel.html', 'from=stadt');      // camera lifts Kai up into the sky (continuous)
}
// a world that is already done: ask first before Kai is sent there again (no accidental trips)
function askGo(kind, yes, no) {
  S.askGo = { kind, yes, no, prev: S.phase }; S.phase = 'askGo'; holding = false; keyDown = false; pressQueued = false; Audio.play('chime');
}
function answerGo(ok) {
  const a = S.askGo; if (!a) return;
  S.askGo = null; S.phase = a.prev === 'askGo' ? 'play' : a.prev; holding = false; keyDown = false; pressQueued = false;
  if (ok) a.yes(); else { Audio.play('tink'); if (a.no) a.no(); }
}
function enterPipe(o, sure) {
  const k = S.kai;
  // the deep sea is already done: ask first (every time) – maybe Kai only wanted to jump over the tube
  if (SAVE.done.sea && !sure && SAVE.items.harpoon) { askGo('pipe', () => enterPipe(o, true)); return; }
  // the tube always stays open – also when the deep sea is already done (play it again)
  if (!SAVE.items.harpoon) {
    // no harpoon yet: the tube stays closed
    if (!o.warned) { o.warned = true; Audio.play('denied'); flash(tx('Du brauchst zuerst die Harpune aus dem OXXO im Himmel!'), 150); }
    return;
  }
  S.phase = 'pipe'; k.x = o.x + o.w / 2; k.y = o.top; k.vy = 0; k.platform = null; k.grind = false;
  Audio.grindLoop(false); Audio.play('pipe'); flash(tx('Ab durchs Rohr in die Tiefsee!'), 120);
  SAVE.cityResume = S.mode === 'main' ? { dist: S.dist, eventIdx: S.eventIdx } : null;
  saveProgress();
  goToWorld('tiefsee.html', 'from=stadt&pipe=1');
}
function startDive() {
  S.phase = 'dive'; S.diveT = 0; S.kai.vy = -10; S.kai.ground = false;
  flash(tx('Mit der Harpune ab in die Tiefsee!'), 120); Audio.play('jump');
  saveProgress();
  goToWorld('tiefsee.html', 'from=stadt');     // camera dives down with Kai
}

// ================= INPUT =================
const BTN = {
  music: { x: W - 252, y: 10, w: 34, h: 30 },
  sfx:   { x: W - 212, y: 10, w: 34, h: 30 },
  again: { x: W / 2 - 100, y: 228, w: 200, h: 40 },
  goYes: { x: W / 2 - 215, y: 228, w: 210, h: 40 }, goNo: { x: W / 2 + 5, y: 228, w: 210, h: 40 },
};
let holding = false, pressQueued = false;
function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  const sc = Math.min(r.width / W, r.height / VH);
  const ox = r.left + (r.width - W * sc) / 2, oy = r.top + (r.height - VH * sc) / 2;
  return { x: (e.clientX - ox) / sc, y: (e.clientY - oy) / sc - DY };
}
const inRect = (p, b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
const pointers = new Set();
// ---- controls: tap / click = jump (hold = higher), quick swipe to the right = action (hit / shoot)
// on the computer: mouse click or Space = jump, X = action
let isTouch = false;
const gest = new Map();                  // pointerId -> { x0, y0, t0, decided }
const SWIPE_PX = 28, DECIDE_MS = 90;
function action() { if (S.phase === 'pinata') swingStick(); }
canvas.addEventListener('pointerdown', e => {
  e.preventDefault(); Audio.init(); Audio.setTheme('city');
  if (e.pointerType === 'touch') isTouch = true;
  const p = toLogical(e);
  const hp = { x: p.x, y: p.y + DY };          // the HUD sits at the very top of the screen
  if (pauseClick(hp)) return;                  // PAUSE / WEITER
  if (invClick(hp)) return;                    // ITEMS drop-down (weapons + outfit)
  if (inRect(hp, BTN.music)) { Audio.toggleMusic(); return; }
  if (inRect(hp, BTN.sfx)) { Audio.toggleSfx(); return; }
  const mp = { x: p.x, y: p.y + DY / 2 };      // menus are drawn centred on the tall screen
  if (S.phase === 'start') { if (!langPickerClick(mp)) beginWorld(); return; }
  if (S.phase === 'gameover') { if (inRect(mp, BTN.goYes)) resetGame(); else if (inRect(mp, BTN.goNo)) { resetGame(); toMainMenu(); } return; }
  if (S.phase === 'askGo') { if (inRect(mp, BTN.goYes)) answerGo(true); else if (inRect(mp, BTN.goNo)) answerGo(false); return; }
  if (S.phase === 'victory') { if (inRect(mp, BTN.again)) resetGame(); return; }
  if (S.phase === 'ascend' || S.phase === 'dive' || S.phase === 'pipe') return;
  if (S.phase.startsWith('pinata') && pinataInput(p)) return;
  if (S.phase === 'pinataEnd') return;
  gest.set(e.pointerId, { x0: e.clientX, y0: e.clientY, t0: performance.now(), decided: false });
  pointers.add(e.pointerId);
});
// on-screen buttons (controller): JUMP button left = normal tap/hold, ACTION button right = hit the piñata
const CTL = {
  showJump: () => S.phase === 'play' || S.phase === 'boss' || S.phase === 'pinata',
  canShoot: () => S.phase === 'pinata' && !!S.pin && !S.pin.done,
  shoot: action, auto: false, icon: 'stick',
};
function decideGestures() {
  // a press that is not a swipe after a short moment becomes a jump (and keeps counting as "held")
  const now = performance.now();
  for (const g of gest.values()) if (!g.decided && now - g.t0 > DECIDE_MS) { g.decided = true; pressQueued = true; }
}
const rel = e => {
  const g = gest.get(e.pointerId);
  if (g && !g.decided) pressQueued = true;           // very quick tap
  gest.delete(e.pointerId); pointers.delete(e.pointerId);
};
window.addEventListener('pointerup', rel); window.addEventListener('pointercancel', rel);
let keyDown = false;
window.addEventListener('keydown', e => {
  if (S.phase === 'askGo') { if (e.code === 'Enter') answerGo(true); else if (e.code === 'Escape') answerGo(false); if (e.code === 'Space') e.preventDefault(); return; }
  if (e.code === 'KeyX') { e.preventDefault(); Audio.init(); if (!e.repeat) action(); return; }
  if (e.code !== 'Space' && e.code !== 'ArrowUp') { if (e.code === 'KeyM') Audio.toggleMusic(); return; }
  e.preventDefault(); Audio.init(); Audio.setTheme('city');
  if (e.repeat) return;
  if (S.phase === 'start') { beginWorld(); return; }
  if (S.phase === 'gameover' || S.phase === 'victory') { resetGame(); return; }
  if (S.phase === 'ascend' || S.phase === 'dive' || S.phase === 'pipe') return;
  if (S.phase === 'pinata') { pressQueued = true; keyDown = true; return; }
  if (S.phase === 'pinataAsk' || S.phase === 'pinataPick' || S.phase === 'pinataEnd') return;
  keyDown = true; pressQueued = true;
});
window.addEventListener('keyup', e => { if (e.code === 'Space' || e.code === 'ArrowUp') keyDown = false; });

// ================= OBJECTS =================
// x = left edge in screen space, w/h = size, top = y of the top surface
const DEF = {
  cone:     { w: 22, h: 30, solid: true },
  hydrant:  { w: 26, h: 38, solid: true },
  bin:      { w: 32, h: 44, solid: true },
  bench:    { w: 110, h: 30, solid: true, grind: true },
  rail:     { w: 170, h: 42, grind: true },
  car:      { w: 160, h: 54, solid: true, platform: true, topX1: 28, topX2: 120 },
  icecream: { w: 200, h: 104, solid: true, platform: true, topX1: 6, topX2: 194 },
  taco:     { w: 130, h: 72, solid: true, platform: true, topX1: 4, topX2: 126 },   // like the ice-cream van: jump on top, ride / jump off again
  hole:     { w: 74, h: 0 },
  ramp:     { w: 96, h: 36 },
  dog:      { w: 46, h: 30, solid: true },
  police:   { w: 150, h: 54, solid: true },
  pier:     { w: 360, h: 0 },
  boardwalk: { w: 1700, h: 0 },        // the long harbor pier over the water (instead of the street)
  pipe:     { w: 84, h: 82, solid: true, platform: true, topX1: -6, topX2: 90 },   // big green tube – the way down to the deep sea
  party:    { w: 700, h: 0 },
};
function addObject(type, x, extra = {}) {
  const d = DEF[type] || {};
  const o = Object.assign({ type, x, p: rand(0, 6), done: false, hit: false }, d, extra);
  if (d.h !== undefined) o.top = FLOOR - d.h;
  if (type === 'dog') o.vx = 2.2;
  if (type === 'police') o.vx = 3.2;
  if (type === 'bench' || type === 'car' || type === 'taco' || type === 'icecream') o.color = BLD_COLORS[Math.floor(Math.random() * BLD_COLORS.length)];
  S.objects.push(o);
  return o;
}
function addCoin(x, y) { S.objects.push({ type: 'coin', x, y, r: 9, p: rand(0, 6), done: false }); }
function addCoinArc(x0, y0, n, height, spacing = 34) { for (let i = 0; i < n; i++) addCoin(x0 + i * spacing, y0 - Math.sin(i / (n - 1) * Math.PI) * height); }

function pickType() {
  const p = S.dist / LEVEL_LENGTH;
  const t = [['cone', 3], ['hydrant', 2], ['bin', 2.5], ['bench', 2.5], ['rail', 2], ['car', 1.8], ['hole', 1.5], ['coins', 3]];
  if (p > 0.2) t.push(['dog', 1.5 + p * 2]);
  if (p > 0.15) t.push(['police', 1.1 + p]);
  const tot = t.reduce((s, [, w]) => s + w, 0); let r = Math.random() * tot;
  for (const [k, w] of t) { r -= w; if (r <= 0) return k; }
  return 'cone';
}
function spawn() {
  const type = pickType(), x = W + 40;
  if (type === 'coins') { addCoinArc(x, FLOOR - 40, 6, Math.random() < 0.5 ? 0 : 60); S.nextSpawn = rand(320, 460); return; }
  const o = addObject(type, x);
  if (type === 'bench' || type === 'rail') for (let i = 0; i < 3; i++) addCoin(x + 25 + i * (o.w - 50) / 2, o.top - 22);
  if (type === 'car') for (let i = 0; i < 3; i++) addCoin(x + 45 + i * 32, o.top - 26);
  if (type === 'dog') { o.x = W + 260; Audio.play('bark'); }
  if (type === 'police') { o.x = W + 420; }
  const p = S.dist / LEVEL_LENGTH;
  S.nextSpawn = (o.w + rand(300, 460)) * (1 - p * 0.2);
}
function runEvent(ev) {
  const x = W + 60;
  if (ev.type === 'pipe') {
    S.objects = S.objects.filter(o => !(o.x > W - 40 && o.solid));
    // no ramp right in front: a normal ollie (tap) is high enough to land on the tube; coins show the jump
    addObject('pipe', x + 40); addCoinArc(x - 110, FLOOR - 95, 4, 40, 34); S.nextSpawn = 520; return;
  }
  if (ev.type === 'wing') {
    if (!wingsActive()) return;
    S.objects = S.objects.filter(o => !(o.x > W - 40 && o.solid));     // a clear run-up
    const o = addObject('ramp', x); o.wings = true; addCoinArc(x - 220, FLOOR - 40, 4, 0, 34); S.nextSpawn = 520; return;
  }
  if (ev.type === 'ramp') { addObject('ramp', x); addCoinArc(x + 150, FLOOR - 150, 7, 70, 38); addObject('rail', x + 520); S.nextSpawn = 900; }
  if (ev.type === 'taco') { const o = addObject('taco', x); S.objects.push({ type: 'tacoItem', x: x + 65, y: o.top - 70, r: 18, p: 0, done: false }); S.nextSpawn = 420; }
  if (ev.type === 'pinata') { S.party = addObject('party', x); S.nextSpawn = 1400; return; }
  if (ev.type === 'icecream') { const o = addObject('icecream', x + 80); addObject('ramp', x - 40); for (let i = 0; i < 5; i++) addCoin(o.x + 30 + i * 35, o.top - 26); S.nextSpawn = 700; }
}

// ================= EFFECTS =================
function burst(x, y, color, n, speed = 4) { for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), v = rand(1, speed); S.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(1.5, 4), color, life: 1, g: 0.15 }); } }
function flash(text, f = 80) { S.msg = tx(text); S.msgTimer = f; }
function loseHeart(reason) {
  S.hearts--; S.heartFlash = 40;
  if (S.hearts <= 0 && loseLife()) {
    S.hearts = LIFE_HEARTS; S.heartFlash = -40; S.kai.hitTimer = 150;
    flash(SAVE.lives === 1 ? tx('LEBEN VERLOREN! Letztes Leben!') : tx('LEBEN VERLOREN! Noch {n} Leben', { n: SAVE.lives }), 120);
    Audio.play('gameover'); return;
  }
  if (S.hearts <= 0) { S.hearts = 0; S.lostBy = reason; S.phase = 'gameover'; Audio.setBoss(false); Audio.grindLoop(false); Audio.play('gameover'); pointers.clear(); keyDown = false; }
}
function hurt(text, x, y) {
  const k = S.kai;
  if (k.hitTimer > 0) return false;
  k.hitTimer = 80; k.flipping = false; k.flip = 0; k.combo = 0;
  burst(x, y, '#ffffff', 14); S.shake = 8;
  Audio.play('crash'); flash(text, 60);
  loseHeart('hit');
  return true;
}

function busted() {
  const k = S.kai;
  if (k.hitTimer > 0) return;
  k.hitTimer = 120; k.flipping = false; k.flip = 0; k.combo = 0;
  S.shake = 14; Audio.play('busted'); flash(tx('BUSTED! −3 Herzen'), 120);
  burst(k.x + 20, k.y - 50, '#e8463c', 12); burst(k.x + 20, k.y - 50, '#2f6fe0', 12);
  for (let i = 0; i < 3 && S.phase !== 'gameover' && S.hearts > 0; i++) { const before = SAVE.lives; loseHeart('busted'); if (SAVE.lives !== before) break; }
  if (k.ground) { k.ground = false; k.vy = -6; }
}

// ================= KAI =================
function kaiGrounded() { const k = S.kai; return k.ground || k.platform; }
function jump(v = JUMP_V) {
  const k = S.kai;
  k.vy = v; k.ground = false; k.platform = null; k.grind = false; k.combo = 0; k.rampJump = v === RAMP_V; k.ollieT = 0; k.takeoffY = k.y;   // ollie animation clock
  burst(k.x - 10, k.y, '#d9d2c0', 6, 2);
  Audio.play('jump');
}
function landed(surface) {
  const k = S.kai;
  if (k.natas) { updateNatas(dt); return; }
  if (k.flipping) { k.flipping = false; k.flip = 0; }
  k.ollieT = null;
  if (k.combo > 0) { const bonus = k.combo * 3; S.coins += bonus; gainPts(PTS.trick * k.combo, k.x, k.y - 130, k.combo > 1); flash(k.combo > 1 ? tx('{k}× KICKFLIP! +{n}', { k: k.combo, n: bonus }) : tx('KICKFLIP! +{n}', { n: bonus }), 60); Audio.play('coin'); }
  k.combo = 0;
  if (surface !== 'grind') { Audio.play('land'); k.landT = 10; }
}

function launchFromRamp(o, boost) {
  const k = S.kai;
  o.riding = false; o.done = true;
  if (o.wings) {
    // the sky is already done: ask first – NO = a normal big ramp jump
    if (SAVE.done.heaven && !o.askedGo) { o.askedGo = true; askGo('sky', () => startAscend(), () => { o.askedGo = false; o.wings = false; launchFromRamp(o, boost); o.wings = true; }); return; }
    startAscend(); return;
  }
  if (o.pierRamp) {
    // big jump off the end of the pier into the water: +10 coins
    jump(RAMP_V * 1.08); k.rampJump = true; S.coins += 10; gainPts(PTS.trick, k.x, k.y - 130);
    Audio.play('ramp'); Audio.play('coin'); flash(tx('HAFEN-SPRUNG! +10'), 90);
    return;
  }
  jump(RAMP_V * boost); k.rampJump = true;
  Audio.play('ramp'); flash(tx('BIG AIR!'), 50);
  if (o.bossRamp && S.boss) aimAtTruck();
}
function updateKai(dt) {
  const k = S.kai;
  const hold = pointers.size > 0 || keyDown;
  if (pressQueued && k.natas) { pressQueued = false; natasTap(); }
  if (pressQueued) {
    pressQueued = false;
    const ramp = k.ground ? S.objects.find(o => o.type === 'ramp' && !o.done && k.x >= o.x && k.x <= o.x + o.w) : null;
    if (ramp) launchFromRamp(ramp, 1);
    else if (k.rampGrace && k.rampGrace.t > 0) { const o = k.rampGrace.o; k.rampGrace = null; o.done = false; launchFromRamp(o, 1); }
    else if (kaiGrounded() && !k.bossFly) jump();
    else if (!k.flipping) { k.flipping = true; k.flip = 0; Audio.play('trick'); }
  }
  if (k.natas) { updateNatas(dt); return; }
  if (k.rampGrace) { k.rampGrace.t -= dt; if (k.rampGrace.t <= 0) k.rampGrace = null; }
  if (k.flipping) {
    k.flip += 0.26 * dt;
    if (k.flip >= Math.PI * 2) { k.flip = 0; k.flipping = false; k.combo++; }
  }
  // riding on a platform / grinding
  if (k.platform) {
    const o = k.platform, x1 = o.x + (o.topX1 ?? 0), x2 = o.x + (o.topX2 ?? o.w);
    if (k.x + 26 < x1 || k.x - 26 > x2 || o.done) { k.platform = null; k.grind = false; k.ground = false; k.vy = 0; }
    else {
      k.y = o.top; k.vy = 0;
      if (k.grind) {
        k.grindT += dt;
        if (Math.random() < 0.7 * dt) S.particles.push({ x: k.x + rand(-25, 25), y: k.y - 2, vx: rand(-3, -1), vy: rand(-2, 0), r: rand(1, 2.5), color: '#ffd25a', life: 0.8, g: 0.1 });
        if (k.grindT > 14) { k.grindT = 0; S.coins++; gainPts(PTS.grind); Audio.play('coin'); }
      }
    }
  }
  if (!k.platform && !k.ground) {
    if (k.ollieT !== null && k.ollieT !== undefined) k.ollieT += dt;
    const g = hold && k.vy < 0 && !k.rampJump ? HOLD_GRAV : GRAV;
    const prevY = k.y;
    k.vy = Math.min(k.vy + g * dt, 14);
    k.y += k.vy * dt;
    k.x += k.vx * dt;
    // land on top surfaces (platforms, grind ledges, the truck roof)
    if (k.vy >= 0) {
      for (const o of S.objects) {
        if (o.type !== 'hydrant' || o.spun || o.hit) continue;
        if (k.x > o.x - 14 && k.x < o.x + o.w + 14 && prevY <= o.top + 4 && k.y >= o.top) { startNatas(o); return; }
      }
      for (const o of S.objects) {
        if (!(o.platform || o.grind) || o.done) continue;
        const x1 = o.x + (o.topX1 ?? 0), x2 = o.x + (o.topX2 ?? o.w);
        if (k.x + 20 > x1 && k.x - 20 < x2 && prevY <= o.top + 3 && k.y >= o.top) {
          k.y = o.top; k.vy = 0; k.platform = o; k.grind = !!o.grind; k.grindT = 0;
          landed(k.grind ? 'grind' : 'land');
          if (o.type === 'pipe') { enterPipe(o); return; }
          if (k.grind) flash(tx('GRIND!'), 40);
          break;
        }
      }
      if (!k.platform && S.boss) bossRoofCheck(prevY);
    }
    if (S.overWater && S.phase === 'play' && k.vy > 0) { const b = sailHit(prevY, k.y); if (b) sailBoing(b); }
    if (S.overWater && !k.platform && k.y >= WATER_Y + 4 && S.phase === 'play') { splashIntoWater(); return; }
    if (!k.platform && k.y >= FLOOR && !S.overWater) {
      k.y = FLOOR; k.vy = 0; k.ground = true; landed('land');
      if (k.bossFly) { k.bossFly = false; }
    }
  }
  Audio.grindLoop(!!(k.platform && k.grind) && S.phase !== 'gameover');
  // return to the normal x position after a boss jump
  if (k.ground && !k.bossFly) { k.vx = 0; k.x += (250 - k.x) * Math.min(1, 0.05 * dt); }
  // kicker ramps: follow the slope and launch at the end
  if (k.ground) {
    for (const o of S.objects) {
      if (o.type !== 'ramp' || o.done) continue;
      if (k.x >= o.x && k.x <= o.x + o.w) { k.y = FLOOR - o.h * (k.x - o.x) / o.w; o.riding = true; }
      else if (o.riding && k.x > o.x + o.w) {
        // no tap: just a tiny hop off the lip – tapping is needed for a real jump
        o.riding = false; o.done = true; k.y = FLOOR - o.h;
        k.vy = -3.2; k.ground = false; k.rampJump = true; k.rampGrace = { o, t: 7 };
      }
    }
  }
  // falling into a pothole
  if (k.ground) for (const o of S.objects) {
    if (o.type === 'hole' && !o.hit && k.x > o.x + 14 && k.x < o.x + o.w - 14) { o.hit = true; if (hurt(tx('Schlagloch!'), k.x, FLOOR)) { k.ground = false; k.vy = -8; } }
  }
  // pushing animation while rolling
  if (k.ground) k.pushT = (k.pushT + dt) % 110; else k.pushT = 0;
  if (k.hitTimer > 0) k.hitTimer -= dt;
  if (k.landT > 0) k.landT -= dt;
}

// ================= HYDRANT SPIN (like Level 1) =================
// Land on a hydrant: Kai spins once automatically. Every tap during the spin adds one more
// turn (up to 5). Each turn = +3 coins, the 3rd turn = +1 heart.
const NATAS_MAX = 5;
function startNatas(o) {
  const k = S.kai;
  o.spun = true;
  k.natas = { o, rot: 0, target: Math.PI * 2, spins: 0 };
  k.x = o.x + o.w / 2; k.y = o.top; k.vy = 0; k.vx = 0; k.ground = false; k.platform = null; k.grind = false;
  k.flipping = false; k.flip = 0; k.combo = 0;
  Audio.play('clank'); flash(tx('SPIN! Tippen = weiterdrehen'), 70);
}
function updateNatas(dt) {
  const k = S.kai, n = k.natas;
  k.x = n.o.x + n.o.w / 2; k.y = n.o.top;
  n.rot += 0.13 * dt;
  const done = Math.floor(n.rot / (Math.PI * 2));
  if (done > n.spins) {
    n.spins = done;
    S.coins += 3; gainPts(PTS.trick, k.x, k.y - 140); burst(k.x, k.y - 60, '#ffd23a', 10, 4); Audio.play('coin');
    if (n.spins === 3) { S.hearts++; S.heartFlash = -40; burst(k.x, k.y - 60, '#ff5a7a', 14, 5); Audio.play('taco'); flash(tx('3 SPINS! +1 Herz'), 90); }
    else flash(tx('{n}× SPIN! +3', { n: n.spins }), 50);
  }
  if (n.rot >= n.target) {
    // hop off forward and keep rolling
    k.natas = null; k.vy = -7; k.ground = false; k.rampJump = false;
    Audio.play('jump');
  }
  if (k.hitTimer > 0) k.hitTimer -= dt;
}
function natasTap() {
  const n = S.kai.natas;
  if (n.target < Math.PI * 2 * NATAS_MAX) { n.target += Math.PI * 2; Audio.play('trick'); }
}

// ================= GARBAGE TRUCK (boss) =================
const TRUCK = { body: 250, cab: 95, roofH: 150, cabH: 118 };
function startBoss() {
  S.phase = 'boss';
  S.boss = { x: W + 80, hp: 3, state: 'enter', throwT: 120, rampT: 240, hurt: 0, t: 0, smoke: 0, tilt: 0 };
  Audio.play('horn'); Audio.setBoss(true);
  flash(tx('DER MÜLLWAGEN!'), 150);
}
function truckRoof(b) { return { x1: b.x + 12, x2: b.x + TRUCK.body - 8, y: FLOOR - TRUCK.roofH }; }
function aimAtTruck() {
  // compute the forward speed so Kai lands on the middle of the roof
  const k = S.kai, b = S.boss, roof = truckRoof(b);
  let y = k.y, vy = k.vy, t = 0;
  while (t < 200) { vy += GRAV; y += vy; t++; if (vy > 0 && y >= roof.y) break; }
  k.vx = ((roof.x1 + roof.x2) / 2 - k.x) / t;
  k.bossFly = true;
}
function bossRoofCheck(prevY) {
  const k = S.kai, b = S.boss; if (!b || b.state !== 'fight') return;
  const roof = truckRoof(b);
  if (k.x > roof.x1 && k.x < roof.x2 && prevY <= roof.y + 3 && k.y >= roof.y) {
    // stomp!
    k.y = roof.y; b.hp--; b.hurt = 50; S.shake = 14;
    burst(k.x, roof.y, '#9be08a', 20, 6); burst(k.x, roof.y, '#ffffff', 10, 4);
    for (let i = 0; i < 6; i++) S.particles.push({ x: k.x + rand(-40, 40), y: roof.y, vx: rand(-4, 4), vy: rand(-8, -3), r: rand(3, 6), color: ['#8a6a3a', '#6b7884', '#c9c9c9'][i % 3], life: 1.4, g: 0.35, shard: true, rot: rand(0, 6) });
    Audio.play('stomp'); Audio.play('horn');
    S.coins += 5; gainPts(PTS.bossHit, k.x, roof.y - 40, true);
    // bounce back to the street
    k.vy = -11; let y = k.y, vy = k.vy, t = 0;
    while (t < 200) { vy += GRAV; y += vy; t++; if (vy > 0 && y >= FLOOR) break; }
    k.vx = (250 - k.x) / t;
    if (b.hp <= 0) { b.state = 'dying'; b.t = 0; Audio.setBoss(false); flash(tx('DER MÜLLWAGEN IST ERLEDIGT!'), 160); S.coins += 20; bossPts('stadt'); }
    else flash(tx('VOLLTREFFER! Noch {n}×', { n: b.hp }), 90);
  }
}
function updateBoss(dt) {
  const b = S.boss; b.t += dt;
  if (b.hurt > 0) b.hurt -= dt;
  if (b.state === 'enter') { b.x += (640 - b.x) * Math.min(1, 0.02 * dt); if (b.x < 650) { b.state = 'fight'; flash(tx('Spring über die Rampe auf sein Dach! 3×'), 140); } return; }
  if (b.state === 'dying') {
    b.smoke += dt;
    b.x -= S.speed * dt * Math.min(1, b.t / 60);             // it stops – the street keeps moving
    if (Math.random() < 0.5 * dt) S.particles.push({ x: b.x + rand(20, 300), y: FLOOR - rand(60, 160), vx: rand(-1, 1), vy: rand(-2, -0.5), r: rand(6, 14), color: 'rgba(80,80,90,0.6)', life: 1.4, g: -0.02 });
    if (b.t > 200) {
      S.boss = null; S.phase = 'play'; S.mode = 'outro'; S.outroDist = 0; SAVE.done.city = true; SAVE.cityResume = null; saveProgress(); Audio.play('win');
      // always on to the harbor (when everything is done, the final screen comes after the splash)
      if (allBossesDone()) flash(tx('Alle Bosse besiegt! Ab zum Hafen – spring ins Wasser!'), 220);
      else flash(tx('Noch offen für Level 3:') + ' ' + openBosses().join(' · '), 220);
    }
    return;
  }
  b.x = 640 + Math.sin(b.t * 0.02) * 18;
  // throw trash backwards
  b.throwT -= dt;
  if (b.throwT <= 0) {
    const r = Math.random(), hx = b.x - 20;
    if (r < 0.45) S.projectiles.push({ kind: 'bin', x: hx, y: FLOOR - 18, vx: -1.2, vy: 0, rot: 0, r: 16, ground: true });
    else if (r < 0.8) {
      // the bag flies in an arc and lands on the street well in front of Kai, then lies there
      const landX = rand(430, 520), t = 45;
      S.projectiles.push({ kind: 'bag', x: hx, y: FLOOR - 100, vx: (landX - hx) / t + SPEED * 0, vy: -6, rot: 0, r: 13, ground: false, landX });
    } else {
      // two cans close together – one jump clears both
      S.projectiles.push({ kind: 'can', x: hx, y: FLOOR - 8, vx: -1.2, vy: 0, rot: 0, r: 8, ground: true });
      S.projectiles.push({ kind: 'can', x: hx + 20, y: FLOOR - 8, vx: -1.2, vy: 0, rot: 0, r: 8, ground: true });
    }
    Audio.play('throwit');
    b.throwT = rand(85, 120) - (3 - b.hp) * 10;
  }
  // drop a ramp so Kai can reach the roof
  b.rampT -= dt;
  if (b.rampT < 60 && b.throwT < 60) b.throwT = 60;   // no trash right before a ramp
  if (b.rampT <= 0) {
    // the truck THROWS the ramp out of the back – it flies in an arc, does a flip and lands behind the truck
    const hx = b.x - 20, landC = b.x - 72;
    S.projectiles = S.projectiles.filter(p => p.x < b.x - 260 || p.x > b.x);   // keep the way to the ramp clear
    S.projectiles.push({ kind: 'ramp', x: hx, y: FLOOR - 110, vx: (landC - hx) / 46, vy: -6.5, rot: 0, r: 18, ground: false });
    Audio.play('throwit');
    b.rampT = rand(300, 380);
  }
}
function updateProjectiles(dt) {
  const k = S.kai;
  for (const p of S.projectiles) {
    if (p.ground) { p.x += (p.vx - S.speed) * dt; if (p.kind !== 'bag') p.rot -= (p.kind === 'bin' ? 0.12 : 0.3) * dt; }
    else {
      p.x += p.vx * dt; p.vy += 0.35 * dt; p.y += p.vy * dt; p.rot += (p.kind === 'ramp' ? 0.137 : 0.15) * dt;
      if (p.kind === 'ramp' && p.y >= FLOOR - 18 && p.vy > 0) {
        // the thrown ramp lands on the street → it becomes the real ramp up to the roof
        const o = addObject('ramp', p.x - 48); o.bossRamp = true; p.dead = true;
        burst(p.x, FLOOR - 4, '#8a6a3a', 12, 3); Audio.play('stomp'); S.shake = Math.max(S.shake, 6);
        flash(tx('Rampe! Fahr drüber – aufs Dach!'), 90);
        continue;
      }
      if (p.y >= FLOOR - p.r) { p.y = FLOOR - p.r; p.ground = true; p.vx = 0; p.rot = 0; burst(p.x, FLOOR - 4, '#8a6a3a', 6, 2); }
    }
    // hit box: Kai's whole body
    if (!p.dead && p.kind !== 'ramp' && p.x + p.r > k.x - 18 && p.x - p.r < k.x + 30 && p.y + p.r > k.y - 100 && p.y - p.r < k.y - 4) {
      if (hurt(p.kind === 'bin' ? tx('Mülltonne!') : p.kind === 'bag' ? tx('Müllsack!') : tx('Dosen!'), p.x, p.y)) { p.dead = true; burst(p.x, p.y, '#8a6a3a', 10); }
    }
  }
  S.projectiles = S.projectiles.filter(p => !p.dead && p.x > -60);
}
// ================= UPDATE =================
function update(dt) {
  S.t += dt;
  decideGestures();
  if (S.shake > 0) S.shake = Math.max(0, S.shake - dt);
  if (S.heartFlash > 0) S.heartFlash = Math.max(0, S.heartFlash - dt); else if (S.heartFlash < 0) S.heartFlash = Math.min(0, S.heartFlash + dt);
  if (S.msgTimer > 0) S.msgTimer -= dt;
  if (S.phase === 'start' || S.phase === 'gameover' || S.phase === 'victory' || S.phase === 'askGo') { S.scroll += (S.phase === 'start' ? 1 : 0) * dt; updateParticles(dt); return; }

  if (!(S.party && !S.partyDone && S.party.x <= 150)) S.speed += ((S.kai.natas ? 0 : SPEED) - S.speed) * Math.min(1, (S.kai.natas ? 0.35 : 0.08) * dt);
  if (S.phase === 'ascend') {
    const k = S.kai; S.ascendT += dt; k.vy -= 0.25 * dt; k.y += k.vy * dt; k.wing = (k.wing || 0) + 0.45 * dt;
    S.scroll += SPEED * dt; updateParticles(dt);
    return;
  }
  if (S.phase === 'pipe') { updateParticles(dt); return; }
  if (S.harbor) for (const b of S.harbor.boats) if (b.rock > 0) b.rock = Math.max(0, b.rock - 0.012 * dt);
  if (S.ahoiT > 0) S.ahoiT -= dt;
  if (S.fadeIn > 0) S.fadeIn = Math.max(0, S.fadeIn - 0.04 * dt);
  if (S.phase === 'dive' && S.rescue) { updateRescue(dt); updateParticles(dt); return; }
  if (S.phase === 'dive') {
    const k = S.kai; S.diveT += dt; k.vy += 0.5 * dt; k.y += k.vy * dt; k.x += 1.2 * dt;
    if (S.finalAfter) { S.finalAfter -= dt; if (S.finalAfter <= 0) { S.finalAfter = 0; goToWorld('tiefsee.html', 'final=1'); } }
    if (k.y > WATER_Y + 20 && !S.splashed) { S.splashed = true; Audio.play('pop'); for (let i = 0; i < 30; i++) S.particles.push({ x: k.x, y: FLOOR, vx: rand(-4, 4), vy: rand(-8, -2), r: rand(2, 5), color: '#7fd6ef', life: 1.4, g: 0.35 }); }
    updateParticles(dt);
    return;
  }
  if (S.phase === 'pinataAsk' || S.phase === 'pinataPick') { updateParticles(dt); return; }
  if (S.phase === 'pinata') { updatePinata(dt); return; }
  const partyStop = S.party && !S.partyDone && S.party.x <= 150;
  if (partyStop) { S.speed += (0 - S.speed) * Math.min(1, 0.3 * dt); if (S.speed < 0.15 && kaiGrounded() && !S.kai.natas) { S.speed = 0; S.phase = 'pinataAsk'; pointers.clear(); holding = false; keyDown = false; pressQueued = false; return; } }
  const move = S.speed * dt;
  S.scroll += move;
  if (S.phase === 'play' && S.mode === 'main') S.dist += move;

  // events + spawning
  if (S.phase === 'play') {
    if (S.mode === 'main') {
      // autosave the position about every second, so WEITERSPIELEN continues right here
      S.autoT = (S.autoT || 0) + dt;
      if (S.autoT > 60 && !S.boss) { S.autoT = 0; SAVE.cityResume = { dist: S.dist, eventIdx: S.eventIdx }; saveProgress(); }
      const ev = EVENTS[S.eventIdx];
      if (ev && S.dist >= ev.spawnAt) { S.eventIdx++; runEvent(ev); }
      if (S.dist >= LEVEL_LENGTH && !S.boss) startBoss();
      else if (!S.boss && !(S.party && !S.partyDone)) { S.nextSpawn -= move; if (S.nextSpawn <= 0) spawn(); }
    } else {
      updateOutro(move);
      if (!S.harbor) { S.nextSpawn -= move; if (S.nextSpawn <= 0) spawn(); }      // nothing in the way on the pier
      else if (S.kai.x - 14 > S.harbor.x + S.harbor.w) {
        // past the end of the pier there is only water
        S.overWater = true; const k = S.kai;
        if (k.ground && !k.platform) { k.ground = false; k.vy = Math.max(k.vy, 0); }
      }
      // the harbor gate without the harpoon: Kai has to go up to the sky first
      for (const o of S.objects) if (o.type === 'pier') {
        if (!SAVE.items.harpoon && !S.pierWarned && o.x < W - 150) { S.pierWarned = true; flash(tx('Du brauchst zuerst die Harpune aus dem OXXO im Himmel!'), 150); Audio.play('denied'); }
      }
    }
  }
  if (S.boss) updateBoss(dt);

  for (const o of S.objects) {
    o.x -= move; o.p += 0.05 * dt;
    if (o.type === 'dog') { o.x -= o.vx * dt; if (!o.barked && o.x < W - 40) { o.barked = true; Audio.play('bark'); } }
    if (o.type === 'police') { o.x -= o.vx * dt; if (!o.sirened && o.x < W + 380) { o.sirened = true; Audio.play('siren'); } }
  }
  updateKai(dt);
  if (S.phase === 'gameover') return;

  // collisions
  const k = S.kai;
  const body = { x1: k.x - 14, x2: k.x + 22, y1: k.y - 100, y2: k.y - 4 };
  for (const o of S.objects) {
    if (o.done) continue;
    if (o.type === 'coin') { if (o.x + o.r > k.x - 43 && o.x - o.r < k.x + 44 && o.y + o.r > k.y - 114 && o.y - o.r < k.y + 4) { o.done = true; S.coins++; gainPts(PTS.coin); burst(o.x, o.y, '#ffd23a', 8, 3); Audio.play('coin'); } continue; }
    if (o.type === 'icecream' && !o.coneTaken) {
      const cx = o.x + 160, cy = o.top - 26;
      if (cx + 14 > k.x - 43 && cx - 14 < k.x + 44 && cy + 18 > k.y - 114 && cy - 14 < k.y + 4) {
        o.coneTaken = true; S.hearts++; S.heartFlash = -40; burst(cx, cy, '#ff8fb8', 18, 4); burst(cx, cy, '#ffd23a', 8, 3); Audio.play('taco'); flash(tx('EIS! +1 Herz'), 90);
      }
    }
    if (o.type === 'tacoItem') { if (o.x + o.r > k.x - 43 && o.x - o.r < k.x + 44 && o.y + o.r > k.y - 114 && o.y - o.r < k.y + 4) { o.done = true; S.hearts += 2; S.heartFlash = -40; burst(o.x, o.y, '#ffd23a', 20, 5); burst(o.x, o.y, '#ff5a7a', 10, 4); Audio.play('taco'); flash(tx('TACO! +2 Herzen'), 100); } continue; }
    if (!o.solid || o.hit || o.spun || k.platform === o || k.natas) continue;
    const ox1 = o.x + 4, ox2 = o.x + o.w - 4, oy1 = o.top + 6;
    if (body.x2 > ox1 && body.x1 < ox2 && body.y2 > oy1 && body.y1 < FLOOR) {
      o.hit = true;
      if (o.type === 'police') { busted(); continue; }
      const names = { pipe: tx('Rohr!'), cone: tx('Pylone!'), hydrant: tx('Hydrant!'), bin: tx('Mülltonne!'), bench: tx('Bank!'), car: tx('Auto!'), icecream: tx('Eiswagen!'), taco: tx('Taco-Stand!'), dog: tx('Wau! Der Hund!') };
      if (hurt(names[o.type] || tx('Autsch!'), k.x + 20, k.y - 40)) { if (k.ground) { k.ground = false; k.vy = -6; } }
    }
  }
  if (S.party && S.party.x + S.party.w < -80) S.party = null;
  S.objects = S.objects.filter(o => (o.type === 'boardwalk' || o.x + (o.w || 20) > -80) && !(o.done && (o.type === 'coin' || o.type === 'tacoItem')));
  updateProjectiles(dt);
  updateParticles(dt);
}
function updateParticles(dt) {
  if (S.pin && S.pin.result && !S.pin.saved) { S.pin.saved = true; SAVE.mini.pinata = SAVE.mini.pinata === true || S.pin.result === 'win'; writeSave(); }
  for (const p of S.particles) { p.x += p.vx * dt - (S.phase === 'play' || S.phase === 'boss' ? S.speed * dt * 0.5 : 0); p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.vx *= Math.pow(0.97, dt); if (p.shard) p.rot += 0.2 * dt; p.life -= 0.025 * dt; }
  S.particles = S.particles.filter(p => p.life > 0);
}
