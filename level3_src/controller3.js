
// ======================================================================
// LEVEL 2 – ONE PAGE: city, sky and deep sea live in the same canvas.
// Switching worlds is a continuous camera move (like Level 1):
//   'up'   city → sky      : the city slides down, the cloud world comes in from the top
//   'down' sky → city      : Kai falls through the cloud floor, the city comes up from below
//   'dive' city → deep sea : the camera dives with Kai under the water surface
//   'cut'  new game        : instant
// During a move both worlds are drawn at the same time; Kai is drawn by the controller.
// ======================================================================
let CUR = null, TRANS = null;
// LEVEL 3 – DINOLAND: the dino valley and the Felsenhöhe above it (the Lavahöhlen follow).
const FACTORY = { tal: makeTal, hoehe: makeHoehe, lava: makeLava };
const THEME = { tal: 'dino', hoehe: 'hoehe', lava: 'lava' };
const worldKey = file => (file || 'tal').replace('.html', '');
function makeWorld(file, query) { const key = worldKey(file); const w = FACTORY[key](new URLSearchParams(query || '')); w.key = key; w.fromFinal = /from=replay/.test(query || ''); return w; }
function activate(w) {
  // a fresh world always starts with normal background music (e.g. the harp paused it in the sky, turbo sped it up)
  if (!PAUSE.on) Audio.pauseBg(false); Audio.setFast(false); Audio.setBoss(false);
  CUR = w; SAVE.where = w.key; writeSave(); window.__S = w.S; window.__test = w.test; window.__events = w.events; window.__world = w.key; }

const ease = u => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
const easeOut = u => 1 - (1 - u) * (1 - u);
const easeIn = u => u * u;
const lerp = (a, b, u) => a + (b - a) * u;

function beginTransition(file, query) {
  if (TRANS) return;
  const from = CUR, toKey = worldKey(file);
  const kind = from.key === 'tal' && toKey === 'lava' ? 'pipe'
    : (from.key === 'stadt' && toKey === 'himmel') || (from.key === 'tal' && toKey === 'hoehe') || (from.key === 'lava' && toKey === 'tal') ? 'up'
    : (from.key === 'himmel' && toKey === 'stadt') || (from.key === 'hoehe' && toKey === 'tal') ? 'down'
    : /final=1/.test(query) ? 'cut'
    : from.key === 'stadt' && toKey === 'tiefsee' ? (/pipe=1/.test(query) ? 'pipe' : 'dive')
    : from.key === 'tiefsee' && toKey === 'stadt' && /from=tiefsee/.test(query) ? 'surface' : 'cut';
  const next = makeWorld(file, query);
  if (!PAUSE.on) Audio.pauseBg(false);
  if (kind === 'cut') { activate(next); Audio.setTheme(THEME[toKey]); return; }
  const k = from.S.kai;
  // Kai's start / end point ON THE SCREEN (the dino worlds scroll, so the camera is taken off)
  const x1 = next.S.kai && next.S.cam != null ? next.S.kai.x - next.S.cam : 250;
  TRANS = { kind, splash: /splash=1/.test(query || ''), from, to: next, t: 0, T: kind === 'up' ? 140 : kind === 'down' ? 130 : kind === 'pipe' ? 170 : 150, x0: k.x - (from.S.cam || 0), x1, y0: k.y, splashed: false,
    climb: kind !== 'pipe' && ['tal', 'hoehe', 'lava'].includes(from.key), lava: toKey === 'lava' || from.key === 'lava' };
  from.S.hideKai = true; from.S.noHud = true; next.S.hideKai = true; next.S.noHud = true;
  next.S.phase = 'transit';
}

function updateTransition(dt) {
  const tr = TRANS; tr.t += dt;
  const p = Math.min(1, tr.t / tr.T);
  // the old world keeps running its own animation (scrolling, particles); the new one scrolls along
  tr.from.update(dt);
  const ns = tr.to.S; ns.t = (ns.t || 0) + dt; ns.scroll = (ns.scroll || 0) + (tr.kind === 'up' ? 2.5 : 3) * dt;
  if ((tr.kind === 'dive' && p > 0.3 || tr.kind === 'surface' && p > 0.5) && !tr.splashed) { tr.splashed = true; Audio.play('pop'); Audio.play('air'); }
  if (tr.kind === 'up' && p > 0.55 && !tr.themed) { tr.themed = true; Audio.setTheme(THEME[tr.to.key] || 'sky'); }
  if (tr.kind !== 'up' && p > 0.55 && !tr.themed) { tr.themed = true; Audio.setTheme(THEME[tr.to.key]); }
  if (p >= 1) {
    const w = tr.to; TRANS = null;
    w.S.hideKai = false; w.S.noHud = false;
    activate(w); w.enter();
  }
}

// camera offset of the OLD world (the new one sits right above / below it)
const PIPE_GAP = 260;      // underground between the street and the sea
function transOffsets(tr, p) {
  if (tr.kind === 'surface') { const c = VH * ease(clamp((p - 0.1) / 0.88, 0, 1)); return { from: c, to: c - VH, seam: c }; }
  if (tr.kind === 'pipe') { const c = -(VH + PIPE_GAP) * ease(clamp((p - 0.12) / 0.86, 0, 1)); return { from: c, to: c + VH + PIPE_GAP, seam: c + VH }; }
  if (tr.kind === 'up') { const c = VH * ease(clamp((p - 0.12) / 0.88, 0, 1)); return { from: c, to: c - VH, seam: c }; }
  const c = -VH * ease(clamp((p - 0.08) / 0.9, 0, 1)); return { from: c, to: c + VH, seam: c + VH };
}
// where Kai is on the screen during the move
function transKai(tr, p) {
  const x = lerp(tr.x0, tr.x1 ?? 250, ease(Math.min(1, p * 1.4)));
  let y, o = { wings: tr.from.S.t * 0.45, armsUp: false, tilt: 0, crouch: 3, diver: false };
  if (tr.climb) {
    // Dinoland: climbing up the liana to the Felsenhöhe / down again into the valley – no wings
    o.wings = undefined; o.armsUp = p < 0.85; o.crouch = p > 0.9 ? 6 : 4;
    if (tr.kind === 'up') y = p < 0.45 ? lerp(tr.y0, 40, ease(p / 0.45)) : lerp(40, FLOOR, ease((p - 0.45) / 0.55));
    else y = p < 0.5 ? lerp(tr.y0, 150, ease(p / 0.5)) : lerp(150, FLOOR, easeIn((p - 0.5) / 0.5));
    return { x, y, o };
  }
  if (tr.kind === 'up') {
    // hoisted up: fast rise, then he settles where the sky game starts (y 200)
    y = p < 0.35 ? lerp(tr.y0, 70, easeOut(p / 0.35)) : lerp(70, 200, ease((p - 0.35) / 0.65));
    o.armsUp = p < 0.5; o.tilt = p < 0.35 ? -0.12 : 0; o.wings = tr.t * 0.45;
  } else if (tr.kind === 'down') {
    // falls through the clouds, the camera catches up, then he lands on the street (FLOOR)
    y = p < 0.55 ? lerp(tr.y0, 150, ease(p / 0.55)) : lerp(150, FLOOR, easeIn((p - 0.55) / 0.45));
    o.armsUp = p < 0.85; o.wings = p < 0.88 ? tr.t * 0.3 : undefined; o.crouch = p > 0.92 ? 7 : 3;
  } else if (tr.kind === 'surface') {
    // swims up, breaks through the water surface and lands on the street
    y = p < 0.6 ? lerp(tr.y0, 120, ease(p / 0.6)) : lerp(120, FLOOR, easeIn((p - 0.6) / 0.4));
    o.wings = undefined; o.diver = p < 0.55; o.armsUp = p > 0.45 && p < 0.9; o.crouch = p > 0.93 ? 7 : 3;
  } else if (tr.kind === 'pipe') {
    // sinks into the tube, slides down the underground, comes out at the top of the sea
    const endY = tr.lava ? FLOOR : 210;
    y = p < 0.12 ? lerp(tr.y0, tr.y0 + 70, easeIn(p / 0.12)) : lerp(tr.y0 + 70, endY, ease((p - 0.12) / 0.88));
    o.wings = undefined; o.diver = !tr.lava && p > 0.75; o.armsUp = p > 0.08 && p < 0.8; o.crouch = 5;
    return { x: p < 0.78 ? tr.x0 : lerp(tr.x0, tr.lava ? tr.x1 : 250, ease((p - 0.78) / 0.22)), y, o };
  } else if (tr.splash) {
    // came off the harbor pier: already in the water – straight down to where the sea game starts
    y = lerp(tr.y0, 210, ease(p));
    o.wings = undefined; o.diver = p > 0.25; o.armsUp = p < 0.3; o.tilt = p < 0.4 ? 0.35 : 0;
  } else {
    // dive: hop off the pier, splash, sink to where the sea game starts (y 210)
    y = p < 0.22 ? lerp(tr.y0, tr.y0 - 70, easeOut(p / 0.22)) : lerp(tr.y0 - 70, 210, ease((p - 0.22) / 0.78));
    o.wings = undefined; o.diver = p > 0.38; o.armsUp = p < 0.38; o.tilt = p < 0.22 ? -0.1 : p < 0.5 ? 0.35 : 0;
  }
  return { x, y, o };
}
function drawSeam(tr, y) {
  ctx.save();
  if (tr.kind === 'pipe') {
    // underground: earth, stones, and the green tube going straight down
    const y2 = y + PIPE_GAP;
    const g = ctx.createLinearGradient(0, y, 0, y2); g.addColorStop(0, '#6b4a2e'); g.addColorStop(0.5, '#4a321f'); g.addColorStop(1, tr.lava ? '#3a1c14' : '#2a3f4f');
    ctx.fillStyle = g; ctx.fillRect(0, y, W, PIPE_GAP);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.ellipse((i * 137) % W, y + 20 + (i * 53) % (PIPE_GAP - 40), 10 + i % 4 * 4, 6 + i % 3 * 2, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore(); return;
  }
  if (tr.lava) {
    // between the valley and the lava caves: a band of rock and earth
    const g = ctx.createLinearGradient(0, y - 60, 0, y + 60); g.addColorStop(0, '#6b4a2e'); g.addColorStop(0.5, '#3a281c'); g.addColorStop(1, '#2a1810');
    ctx.fillStyle = g; ctx.fillRect(0, y - 60, W, 120);
    ctx.restore(); return;
  }
  if (tr.kind === 'dive' || tr.kind === 'surface') {
    // water surface between the harbor and the deep sea
    const g = ctx.createLinearGradient(0, y - 30, 0, y + 30);
    g.addColorStop(0, 'rgba(90,190,230,0)'); g.addColorStop(0.45, 'rgba(120,215,245,0.95)'); g.addColorStop(1, 'rgba(10,70,120,0)');
    ctx.fillStyle = g; ctx.fillRect(0, y - 30, W, 60);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.05 + TRANS.t * 0.2) * 3);
    ctx.stroke();
  } else {
    // a soft band of clouds hides the seam between city sky and cloud floor
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 18; i++) { const x = i * 78 - 20, r = 30 + (i * 37 % 17); ctx.beginPath(); ctx.arc(x, y + (i % 2 ? -6 : 6), r, 0, Math.PI * 2); ctx.fill(); }
    const g = ctx.createLinearGradient(0, y - 60, 0, y + 60);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, y - 60, W, 120);
  }
  ctx.restore();
}
// the open space above each world (the screen is taller than the world): matching sky / water colour
function drawBand(w) {
  if (DY <= 0) return;
  const S2 = w.S, cols = w.key === 'tal' ? ['#f2a65a', '#f7c47e'] : w.key === 'hoehe' ? ['#4fa8e6', '#5fb3ea'] : w.key === 'lava' ? ['#140a0a', '#1a0f10'] : w.key === 'stadt' ? ['#479fdc', '#5fb8ec'] : w.key === 'tiefsee' ? ['#47bde3', '#1a8fbf']
    : S2.phase === 'foot' ? ['#7cc9f4', '#7cc9f4'] : ['#55b3ec', '#6cc3f2'];
  const g = ctx.createLinearGradient(0, 0, 0, DY + 1); g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, DY + 1);
  if (w.key === 'himmel' && S2.phase !== 'foot') {
    // a few soft clouds drifting in the high sky
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 7; i++) {
      const x = ((i * 260 - (S2.scroll || 0) * 0.12) % (W + 300) + W + 300) % (W + 300) - 150, y = 30 + ((i * 53) % Math.max(40, DY - 30));
      ctx.beginPath(); ctx.ellipse(x, y, 60, 16, 0, 0, Math.PI * 2); ctx.ellipse(x + 30, y - 10, 34, 16, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (w.key === 'tiefsee') {
    // light rays from the surface
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    for (let i = 0; i < 5; i++) { const x = i * 300 + 80; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 60, 0); ctx.lineTo(x + 140, DY + 1); ctx.lineTo(x + 40, DY + 1); ctx.closePath(); ctx.fill(); }
  }
}
function drawWorldFull(w) { ctx.save(); ctx.translate(0, DY); w.draw(); ctx.restore(); }
function drawWorldAt(w, off) {
  if (off >= VH || off <= -VH) return;
  ctx.save(); ctx.beginPath(); ctx.rect(0, Math.max(0, off), W, VH - Math.abs(off)); ctx.clip();
  ctx.translate(0, off); drawWorldFull(w); ctx.restore();
}
function drawTransition() {
  const tr = TRANS, p = Math.min(1, tr.t / tr.T), off = transOffsets(tr, p);
  ctx.clearRect(0, 0, W, VH);
  drawWorldAt(tr.from, off.from); drawWorldAt(tr.to, off.to);
  drawSeam(tr, off.seam);
  const kk = transKai(tr, p);
  let tube = null;
  if (tr.kind === 'pipe') {
    // the tube from the city street down through the earth into the sea
    const top = tr.y0 + DY + off.from, bot = off.seam + PIPE_GAP + 50, x1 = tr.x0 - 40, x2 = tr.x0 + 40;
    tube = { top, bot, x1, x2 };
    const g = ctx.createLinearGradient(x1, 0, x2, 0);
    if (tr.lava) { g.addColorStop(0, '#5a4a48'); g.addColorStop(0.3, '#b8a69c'); g.addColorStop(0.55, '#8a7a74'); g.addColorStop(1, '#3a2c2a'); }
    else { g.addColorStop(0, '#1f7a34'); g.addColorStop(0.3, '#4fc45f'); g.addColorStop(0.55, '#2f9e45'); g.addColorStop(1, '#165c27'); }
    ctx.fillStyle = g; ctx.fillRect(x1, Math.max(off.seam, top + 20), x2 - x1, bot - Math.max(off.seam, top + 20));
    ctx.fillStyle = 'rgba(10,40,20,0.55)'; ctx.fillRect(x1 + 8, top + 6, x2 - x1 - 16, bot - top - 6);
    ctx.fillStyle = '#165c27'; ctx.beginPath(); ctx.roundRect(x1 - 6, bot - 14, x2 - x1 + 12, 16, 4); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
  }
  drawKaiFigure(Object.assign({ x: kk.x, y: kk.y + DY, push: 0, flip: 0, wind: 0.8, outfit: SAVE.outfit, prop: tr.t * 0.3 }, kk.o));
  if (tube) {
    // the front of the tube is see-through, so Kai is visible sliding inside
    ctx.fillStyle = TRANS && TRANS.lava ? 'rgba(200,170,150,0.25)' : 'rgba(60,180,80,0.38)'; ctx.fillRect(tube.x1, tube.top + 20, tube.x2 - tube.x1, tube.bot - tube.top - 34);
    ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(tube.x1, tube.top + 20); ctx.lineTo(tube.x1, tube.bot - 14); ctx.moveTo(tube.x2, tube.top + 20); ctx.lineTo(tube.x2, tube.bot - 14); ctx.stroke();
  }
}

// ================= TITLE MENU · CONFIRM · NEW GAME =================
// Progress is saved automatically (browser storage on this device).
// With a saved game the page opens with WEITERSPIELEN (big) and "Komplett neu anfangen" (small, asks first).
const MENU = { open: false, btns: {} }, CONFIRM = { open: false, btns: {} };
const hasProgress = () => !!(SAVE.started || SAVE.done.tal || SAVE.done.hoehe || SAVE.done.lava || SAVE.items.magmaBoard || SAVE.seenHoehe || SAVE.seenLava);
function askNewGame() { CONFIRM.open = true; Audio.play('warn'); }
function doNewGame() {
  const keep = { char: SAVE.char, outfit: SAVE.outfit, outfitKai: SAVE.outfitKai, outfitBali: SAVE.outfitBali, owned: SAVE.owned, importedL2: true, best: SAVE.best || 0 };
  resetSave(true); Object.assign(SAVE, keep); writeSave();        // a new game keeps who rides and the clothes
  CONFIRM.open = false; MENU.open = false; PAUSE.on = false; Audio.pauseBg(false); INV.open = false;
  TRANS = null; activate(makeWorld('tal.html', ''));            // fresh valley start screen
}
function continueGame() {
  MENU.open = false; CUR.S.noHud = false;
  CUR.enterFromMenu();
}
// EXIT / game over "NEIN": back to the title menu of the game (the current world is rebuilt like after a reload)
function toMainMenu() {
  Audio.stopSong(); Audio.grindLoop(false); Audio.setBoss(false); Audio.setFast(false);
  PAUSE.on = false; INV.open = false; CONFIRM.open = false; TRANS = null;
  CTRL.shootP.clear(); CTRL.jumpP.clear(); CTRL.right = false; CTRL.pad.clear(); CTRL.lastDir = 0;
  if ((SAVE.lives ?? LIVES_MAX) <= 0) restartWorldSave();      // EXIT right from the game-over screen
  writeSave();
  const where = CUR ? CUR.key : (SAVE.where || 'tal');
  activate(makeWorld(where, hasProgress() ? 'from=continue' : ''));
  Audio.setTheme(THEME[where]);
  MENU.open = true; CUR.S.noHud = true; Audio.play('tink');
}
// ganz raus: back to the start page of the Invert app (music and the other areas)
function goToApp() { writeSave(); Audio.pauseBg(true); location.href = new URL('./', location.href).href; }
function mButton(b, label, c1, c2, small) {
  ctx.save(); const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h); g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.strokeStyle = small ? 'rgba(255,255,255,0.5)' : OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = `bold ${small ? 13 : 20}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1); ctx.restore();
}
function drawMenu() {
  if (!MENU.open) return;
  const cy = VH / 2;
  ctx.save(); ctx.fillStyle = 'rgba(8,16,34,0.72)'; ctx.fillRect(0, 0, W, VH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.font = 'bold 40px Arial';
  ctx.strokeText(tx('INVERT – LEVEL 3'), W / 2, cy - 95); ctx.fillText(tx('INVERT – LEVEL 3'), W / 2, cy - 95);
  ctx.fillStyle = '#ffb25a'; ctx.font = 'bold 15px Arial'; ctx.lineWidth = 4; ctx.strokeText(tx('DINOLAND'), W / 2, cy - 122); ctx.fillText(tx('DINOLAND'), W / 2, cy - 122);
  if (hasProgress()) { ctx.fillStyle = '#bfe6ff'; ctx.font = 'bold 14px Arial'; ctx.fillText(tx('Dein Spielstand ist gespeichert.'), W / 2, cy - 58); }
  // little overview: worlds + coins
  drawWorldIcon('tal', W / 2 - 60, cy - 26, SAVE.done.tal); drawWorldIcon('hoehe', W / 2 - 30, cy - 26, SAVE.done.hoehe); drawWorldIcon('lava', W / 2, cy - 26, SAVE.done.lava);
  ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'left'; ctx.fillText('● ' + SAVE.coins, W / 2 + 50, cy - 26);
  const stars = ['rodeo', 'fossil', 'ptero', 'lore'].filter(m => SAVE.mini[m] === true).length;
  ctx.fillStyle = '#ffd23a'; ctx.fillText('★ ' + stars + '/4', W / 2 + 110, cy - 26);
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px Arial';
  if (stars === 4 && SAVE.done.tal && SAVE.done.hoehe && SAVE.done.lava) ctx.fillText(tx('100 % – POKAL! Alles geschafft!'), W / 2, cy + (hasProgress() ? 186 : 146));
  ctx.fillText(tx('Punkte: {p}   ·   Rekord: {r}', { p: fmtNum(SAVE.score || 0), r: fmtNum(SAVE.best || 0) }), W / 2, cy + (hasProgress() ? 166 : 126));
  ctx.restore();
  const prog = hasProgress();
  MENU.btns.cont = { x: W / 2 - 150, y: cy + 4, w: 300, h: 54 };
  MENU.btns.reset = prog ? { x: W / 2 - 110, y: cy + 70, w: 220, h: 30 } : null;
  MENU.btns.app = { x: W / 2 - 130, y: cy + (prog ? 112 : 72), w: 260, h: 36 };
  mButton(MENU.btns.cont, '▶  ' + tx(prog ? 'WEITERSPIELEN' : 'SPIELEN'), '#34c759', '#1f8f3c');
  if (prog) mButton(MENU.btns.reset, tx('Komplett neu anfangen'), 'rgba(200,60,50,0.55)', 'rgba(150,30,25,0.55)', true);
  mButton(MENU.btns.app, '◀  ' + tx('Zurück zur Invert-App'), '#4a6fa5', '#2c4a78');
  // WHO RIDES? Kai on the left, Bali on the right of the buttons – tap to choose
  ctx.save();
  ctx.fillStyle = '#bfe6ff'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(tx('Wer fährt?'), W / 2 - 330, cy - 92); ctx.fillText(tx('Wer fährt?'), W / 2 + 330, cy - 92);
  ctx.restore();
  for (const [id, cx] of [['kai', W / 2 - 330], ['bali', W / 2 + 330]]) {
    const b = MENU.btns[id] = { x: cx - 78, y: cy - 78, w: 156, h: 196 }, on = SAVE.char === id;
    ctx.save();
    ctx.fillStyle = on ? 'rgba(52,199,89,0.28)' : 'rgba(255,255,255,0.08)'; ctx.strokeStyle = on ? '#7dffa0' : 'rgba(255,255,255,0.3)'; ctx.lineWidth = on ? 4 : 2;
    ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 16); ctx.fill(); ctx.stroke();
    ctx.restore();
    const of = id === SAVE.char ? SAVE.outfit : id === 'bali' ? Object.assign({}, SAVE_DEFAULT.outfitBali, SAVE.outfitBali) : Object.assign({}, SAVE_DEFAULT.outfit, SAVE.outfitKai || {}, { char: 'kai' });
    drawKaiFigure({ x: cx - 6, y: b.y + b.h - 40, tilt: 0, crouch: 2, push: 0, flip: 0, wind: 0.6, outfit: of });
    ctx.save(); ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((on ? '✓ ' : '') + (id === 'kai' ? 'Kai' : 'Bali'), cx, b.y + b.h - 18); ctx.restore();
  }
  ctx.save(); ctx.translate(0, DY); drawLangPicker(); ctx.restore();
}
function drawConfirm() {
  if (!CONFIRM.open) return;
  const cy = VH / 2, bw = 520, bh = 170, bx = W / 2 - bw / 2, by = cy - bh / 2;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, VH);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 18); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 22px Arial'; ctx.fillText(tx('Wirklich alles löschen?'), W / 2, by + 38);
  ctx.font = '14px Arial'; ctx.fillText(tx('Gekaufte Sachen, Münzen und geschaffte Welten sind dann weg.'), W / 2, by + 70);
  ctx.restore();
  CONFIRM.btns.yes = { x: W / 2 - 200, y: by + 104, w: 180, h: 44 };
  CONFIRM.btns.no = { x: W / 2 + 20, y: by + 104, w: 180, h: 44 };
  mButton(CONFIRM.btns.yes, tx('JA, LÖSCHEN'), '#ff5a4f', '#c0352c');
  mButton(CONFIRM.btns.no, tx('NEIN'), '#8a96a8', '#5d6878');
}
// ◀ ZURÜCK: back to the final screen (when a world / little game was started from there),
// or one step back inside a world (piñata choice → question, memory size → whale question)
const BACK = { btn: null };
const backVisible = () => !TRANS && !MENU.open && !CONFIRM.open && !PAUSE.on && !INV.open && CUR && (CUR.fromFinal || CUR.canBack());
function drawBackButton() {
  if (!backVisible()) { BACK.btn = null; return; }
  const b = BACK.btn = { x: 12, y: 112, w: 118, h: 32 };
  ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.moveTo(b.x + 14, b.y + 16); ctx.lineTo(b.x + 24, b.y + 9); ctx.lineTo(b.x + 24, b.y + 23); ctx.closePath(); ctx.fill();
  ctx.font = 'bold 14px Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(tx('ZURÜCK'), b.x + 32, b.y + 17);
  ctx.restore();
}
function doBack() {
  Audio.play('tink');
  if (CUR.canBack()) CUR.back();
}
function drawPauseExtras() {
  if (!PAUSE.on || CONFIRM.open) return;
  PAUSE.resetBtn = { x: W / 2 - 110, y: VH / 2 + 62, w: 220, h: 32 };
  mButton(PAUSE.resetBtn, tx('Komplett neu anfangen'), 'rgba(200,60,50,0.7)', 'rgba(150,30,25,0.7)', true);
}
// clicks for menu / confirm / pause button – caught before the worlds see them
const inB = (p, b) => b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
function screenP(e) { const r = canvas.getBoundingClientRect(), sc = Math.min(r.width / W, r.height / VH); return { x: (e.clientX - r.left - (r.width - W * sc) / 2) / sc, y: (e.clientY - r.top - (r.height - VH * sc) / 2) / sc }; }

// ================= ON-SCREEN CONTROLS (two thumbs, multitouch) =================
// Like Super Mario on a phone:
//   left thumb:  ◀  ▶  – hold = ride, let go = stop (the thumb can slide from one arrow to the other)
//   right thumb: SPRUNG (big, hold = higher) and SCHUSS (slingshot, only while Kai has one)
// on the computer: hold ← / → = ride, Space / click = jump, X / right mouse button = shoot
const CTRL = { R: 56, jumpP: new Set(), shootP: new Set(), right: false,
  pad: new Map(),            // finger id → -1 (◀) / 1 (▶)
  keyL: false, keyR: false, lastPressed: 1, lastDir: 0,
  // the buttons are only for phones / tablets: shown after a finger touch, hidden again when a mouse is used
  touch: !!(window.matchMedia && matchMedia('(pointer: coarse)').matches) };
const ctlOn = () => !TRANS && CUR && CUR.ctl && !CUR.S.noHud && !MENU.open && !CONFIRM.open && !PAUSE.on && !INV.open;
const canShootNow = () => ctlOn() && CUR.ctl.canShoot();
const jumpVisible = () => CTRL.touch && ctlOn() && CUR.ctl.showJump();
const shootVisible = () => CTRL.touch && canShootNow();
const padVisible = () => CTRL.touch && steerOn();
const leftC = () => ({ x: 20 + CTRL.R, y: VH - 20 - CTRL.R });
const rightC = () => ({ x: 20 + CTRL.R * 3 + 22, y: VH - 20 - CTRL.R });
const jumpC = () => ({ x: W - 20 - CTRL.R, y: VH - 20 - CTRL.R });
const shootC = () => ({ x: W - 20 - CTRL.R * 3 - 26, y: VH - 20 - CTRL.R - 18 });
// generous touch zones at the bottom corners (a thumb does not hit exactly)
const inPadZone = p => p.x < 330 && p.y > VH - 230;
const padSide = p => p.x < (leftC().x + rightC().x) / 2 ? -1 : 1;
const inJumpZone = p => p.x > W - 165 && p.y > VH - 230;
const inShootZone = p => p.x > W - 330 && p.x <= W - 165 && p.y > VH - 230;
// the riding direction wanted right now (fingers on ◀ ▶ and the arrow keys) – the one pressed last wins
function wantedDir() {
  let l = CTRL.keyL, r = CTRL.keyR;
  for (const s of CTRL.pad.values()) { if (s < 0) l = true; else r = true; }
  return l && r ? CTRL.lastPressed : r ? 1 : l ? -1 : 0;
}
function ctlShoot() { if (canShootNow()) { Audio.init(); CUR.ctl.shoot(); } }
// ---- Level 3 steering: Kai rides only while ◀ / ▶ (or an arrow key) is held ----
const steerOn = () => ctlOn() && CUR.ctl.steer && CUR.ctl.active();
function ctlButton(c, pressed, label, icon) {
  const R = CTRL.R;
  ctx.save();
  ctx.globalAlpha = pressed ? 0.95 : 0.72;
  const g = ctx.createRadialGradient(c.x - R * 0.3, c.y - R * 0.3, 4, c.x, c.y, R);
  if (icon === 'jump') { g.addColorStop(0, pressed ? '#9ff0ff' : '#e9fbff'); g.addColorStop(1, pressed ? '#1aa0d8' : '#5bbfe6'); }
  else if (icon === 'left' || icon === 'right') { g.addColorStop(0, pressed ? '#fff6c8' : '#ffffff'); g.addColorStop(1, pressed ? '#f2b630' : '#c9d3df'); }
  else { g.addColorStop(0, pressed ? '#ffd2c8' : '#fff1ec'); g.addColorStop(1, pressed ? '#d8392c' : '#f06a55'); }
  ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(c.x, c.y, pressed ? R - 3 : R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 1; ctx.fillStyle = OUT; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const x = c.x, y = c.y - 8;
  if (icon === 'jump') {
    ctx.beginPath(); ctx.moveTo(x, y - 20); ctx.lineTo(x + 17, y); ctx.lineTo(x + 7, y); ctx.lineTo(x + 7, y + 14); ctx.lineTo(x - 7, y + 14); ctx.lineTo(x - 7, y); ctx.lineTo(x - 17, y); ctx.closePath(); ctx.fill();
  } else if (icon === 'sling') {
    drawSlingIcon(x, y - 1, 1.18);
  } else if (icon === 'bomb') {
    ctx.save(); ctx.translate(x, y + 2); ctx.scale(1.6, 1.6); ctx.strokeStyle = OUT; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#3aa0f0'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-3, -4, 2.6, 3.4, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1f6fb8'; ctx.beginPath(); ctx.moveTo(-3, 10); ctx.lineTo(3, 10); ctx.lineTo(0, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  } else if (icon === 'left' || icon === 'right') {
    const d = icon === 'left' ? -1 : 1;
    ctx.beginPath(); ctx.moveTo(x + d * 20, y + 8); ctx.lineTo(x - d * 12, y - 12); ctx.lineTo(x - d * 12, y + 28); ctx.closePath(); ctx.fill();
  } else if (icon === 'stick') {
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x - 16, y + 14); ctx.lineTo(x + 14, y - 16); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 14, y - 16, 9, -0.2, 1.4); ctx.stroke();
  } else {
    // arrow / harpoon pointing right
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 22, y); ctx.lineTo(x + 10, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 22, y); ctx.lineTo(x + 6, y - 11); ctx.lineTo(x + 6, y + 11); ctx.closePath(); ctx.fill();
    if (icon === 'arrow') { ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 22, y); ctx.lineTo(x - 29, y - 8); ctx.moveTo(x - 22, y); ctx.lineTo(x - 29, y + 8); ctx.stroke(); }
    else { ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 1, y); ctx.lineTo(x - 5, y - 8); ctx.stroke(); }
  }
  ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, c.x, c.y + 26);
  ctx.restore();
}
// a slingshot that reads as one at a glance: wooden fork, two stretched rubber bands, a leather pouch with a stone
function drawSlingIcon(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // fork: handle + two arms (dark outline, then wood)
  const fork = () => { ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(0, 4); ctx.moveTo(0, 6); ctx.quadraticCurveTo(-4, 0, -12, -6); ctx.lineTo(-13, -20); ctx.moveTo(0, 6); ctx.quadraticCurveTo(4, 0, 12, -6); ctx.lineTo(13, -20); ctx.stroke(); };
  ctx.strokeStyle = OUT; ctx.lineWidth = 9; fork();
  ctx.strokeStyle = '#a8703a'; ctx.lineWidth = 5.5; fork();
  ctx.strokeStyle = '#d29a5c'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-1.5, 20); ctx.lineTo(-1.5, 8); ctx.stroke();
  // rubber bands pulled back to the pouch
  ctx.strokeStyle = '#e2302a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-13, -18); ctx.lineTo(-3, 2); ctx.moveTo(13, -18); ctx.lineTo(3, 2); ctx.stroke();
  // leather pouch with the stone
  ctx.fillStyle = '#6b4226'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.ellipse(0, 4, 8, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(0, 1, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(-1.8, -0.8, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawControls() {
  if (padVisible()) {
    const want = wantedDir();
    ctlButton(leftC(), want < 0, '', 'left'); ctlButton(rightC(), want > 0, '', 'right');
  }
  if (jumpVisible()) ctlButton(jumpC(), CTRL.jumpP.size > 0, tx('SPRUNG'), 'jump');
  if (shootVisible()) ctlButton(shootC(), CTRL.shootP.size > 0 || CTRL.right, tx(CUR.ctl.icon === 'stick' ? 'SCHLAG' : CUR.ctl.icon === 'bomb' ? 'WURF' : 'SCHUSS'), CUR.ctl.icon);
}
function updateControls() {
  // holding the shoot button (or the right mouse button) keeps shooting – the weapon's own cooldown sets the pace
  if ((CTRL.shootP.size > 0 || CTRL.right) && canShootNow() && CUR.ctl.auto) CUR.ctl.shoot();
  // riding: only while an arrow (button or key) is held – let go and Kai stops
  if (!CUR || !CUR.ctl || !CUR.ctl.steer) return;
  if (!steerOn()) { CTRL.lastDir = 0; return; }
  const d = wantedDir();
  if (d !== CTRL.lastDir) { CTRL.lastDir = d; if (d) CUR.ctl.dir(d); else if (CUR.ctl.stop) CUR.ctl.stop(); }
}
// right mouse button: works even while the left button is held (that arrives as pointermove with new buttons)
function mouseButtons(e) {
  if (e.pointerType !== 'mouse') return;
  const r = (e.buttons & 2) !== 0;
  if (r && !CTRL.right) ctlShoot();
  CTRL.right = r;
}
canvas.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('pointermove', mouseButtons);
// a thumb on ◀ ▶ may slide over to the other arrow without lifting
window.addEventListener('pointermove', e => {
  if (!CTRL.pad.has(e.pointerId)) return;
  const p = screenP(e), s = padSide(p);
  if (s !== CTRL.pad.get(e.pointerId)) { CTRL.pad.set(e.pointerId, s); CTRL.lastPressed = s; }
});
const ctlRelease = e => {
  CTRL.pad.delete(e.pointerId);
  if (CTRL.jumpP.has(e.pointerId) && CUR && CUR.ctl && CUR.ctl.jump) CUR.ctl.jump(false);
  CTRL.jumpP.delete(e.pointerId); CTRL.shootP.delete(e.pointerId); if (e.pointerType === 'mouse') CTRL.right = (e.buttons & 2) !== 0; };
window.addEventListener('pointerup', ctlRelease); window.addEventListener('pointercancel', ctlRelease);
window.addEventListener('blur', () => { CTRL.jumpP.clear(); CTRL.shootP.clear(); CTRL.right = false; CTRL.pad.clear(); CTRL.keyL = CTRL.keyR = false; });

// LEVEL 4: when all three Dinoland bosses are beaten, the end screen gets a rocket button to Level 4 (Weltraum)
const L4 = { btn: null };
const l4Visible = () => !TRANS && CUR && CUR.S.phase === 'won' && allBossesDone() && !MENU.open && !CONFIRM.open && !PAUSE.on;
function drawL4Button() {
  if (!l4Visible()) { L4.btn = null; return; }
  const b = L4.btn = { x: W / 2 - 170, y: DY + 292, w: 340, h: 42 };
  const pulse = 1 + Math.sin(performance.now() / 160) * 0.03;
  ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(pulse, pulse);
  const g = ctx.createLinearGradient(0, -b.h / 2, 0, b.h / 2); g.addColorStop(0, '#7a5cff'); g.addColorStop(1, '#3a2a9a');
  ctx.fillStyle = g; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 17px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🚀  ' + tx('ZU LEVEL 4: WELTRAUM'), 0, 1);
  ctx.restore();
}
function goToLevel4() { writeSave(); Audio.pauseBg(true); location.href = new URL('level4.html', location.href).href; }

// EXIT (next to PAUSE, in every world): back to the title menu of the game
const EXIT = { btn: null };
const exitVisible = () => !TRANS && CUR && !CUR.S.noHud && !MENU.open && !CONFIRM.open;
function drawExitButton() {
  if (!exitVisible()) { EXIT.btn = null; return; }
  const w = 62, b = EXIT.btn = { x: PAUSE.btn.x + PAUSE.btn.w - w, y: PAUSE.btn.y + PAUSE.btn.h + 6, w, h: PAUSE.btn.h };
  ctx.save();
  ctx.fillStyle = 'rgba(120,20,20,0.7)'; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 9); ctx.fill();
  // little door with an arrow out
  ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.strokeRect(b.x + 8, b.y + 8, 9, 14);
  ctx.beginPath(); ctx.moveTo(b.x + 13, b.y + 15); ctx.lineTo(b.x + 22, b.y + 15); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(b.x + 25, b.y + 15); ctx.lineTo(b.x + 20, b.y + 11); ctx.lineTo(b.x + 20, b.y + 19); ctx.closePath(); ctx.fill();
  ctx.font = 'bold 12px Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', b.x + 29, b.y + 16);
  ctx.restore();
}

canvas.addEventListener('pointerdown', e => {
  const p = screenP(e);
  if (e.pointerType === 'touch') CTRL.touch = true; else if (e.pointerType === 'mouse') CTRL.touch = false;
  // right mouse button never jumps – it shoots
  if (e.pointerType === 'mouse' && e.button === 2) { e.stopImmediatePropagation(); e.preventDefault(); Audio.init(); mouseButtons(e); return; }
  if (EXIT.btn && exitVisible() && inB(p, EXIT.btn)) { e.stopImmediatePropagation(); e.preventDefault(); Audio.init(); toMainMenu(); return; }
  if (L4.btn && l4Visible() && inB(p, L4.btn)) { e.stopImmediatePropagation(); e.preventDefault(); goToLevel4(); return; }
  if (shootVisible() && inShootZone(p)) { e.stopImmediatePropagation(); e.preventDefault(); CTRL.shootP.add(e.pointerId); ctlShoot(); return; }
  if (padVisible() && inPadZone(p)) {
    e.stopImmediatePropagation(); e.preventDefault(); Audio.init();
    const s = padSide(p); CTRL.pad.set(e.pointerId, s); CTRL.lastPressed = s; return;
  }
  if (jumpVisible() && inJumpZone(p)) {
    CTRL.jumpP.add(e.pointerId);
    if (steerOn()) { e.stopImmediatePropagation(); e.preventDefault(); Audio.init(); CUR.ctl.jump(true); return; }
  }
  // Level 3: the mouse jumps with a click anywhere in the game (a finger elsewhere does nothing)
  if (steerOn() && p.y > 92 && !(EXIT.btn && inB(p, EXIT.btn))) {
    e.stopImmediatePropagation(); e.preventDefault(); Audio.init();
    if (e.pointerType === 'mouse') { CTRL.jumpP.add(e.pointerId); CUR.ctl.jump(true); }
    return;
  }
  if (BACK.btn && backVisible() && inB(p, BACK.btn)) { e.stopImmediatePropagation(); e.preventDefault(); Audio.init(); doBack(); return; }
  if (!CONFIRM.open && !MENU.open && !(PAUSE.on && PAUSE.resetBtn)) return;
  if (CONFIRM.open) {
    e.stopImmediatePropagation(); e.preventDefault(); Audio.init();
    if (inB(p, CONFIRM.btns.yes)) doNewGame(); else if (inB(p, CONFIRM.btns.no)) { CONFIRM.open = false; Audio.play('tink'); }
    return;
  }
  if (MENU.open) {
    e.stopImmediatePropagation(); e.preventDefault(); Audio.init();
    if (inB(p, MENU.btns.cont)) continueGame();
    else if (inB(p, MENU.btns.reset)) askNewGame();
    else if (inB(p, MENU.btns.app)) goToApp();
    else if (inB(p, MENU.btns.kai)) { setCharacter('kai'); Audio.play('flip'); }
    else if (inB(p, MENU.btns.bali)) { setCharacter('bali'); Audio.play('flip'); }
    else langPickerClick({ x: p.x, y: p.y - DY });
    return;
  }
  if (PAUSE.on && inB(p, PAUSE.resetBtn)) { e.stopImmediatePropagation(); e.preventDefault(); askNewGame(); }
}, true);

// ================= MAIN LOOP =================
const URLQ = new URLSearchParams(location.search);
if (URLQ.get('world')) activate(makeWorld(URLQ.get('world'), location.search.replace(/^\?/, '')));
else if (hasProgress()) {
  activate(makeWorld(FACTORY[SAVE.where] ? SAVE.where : 'tal', 'from=continue'));
  MENU.open = true; CUR.S.noHud = true;
} else { activate(makeWorld('tal', '')); MENU.open = true; CUR.S.noHud = true; }
Audio.setTheme(THEME[CUR.key]);
let lastT = performance.now();
function mainLoop(now) {
  const dt = Math.min((now - lastT) / 16.667, 3); lastT = now;
  if (TRANS) { updateTransition(dt); if (TRANS) drawTransition(); else drawWorldFull(CUR); }
  else {
    if (!INV.open && !PAUSE.on && !MENU.open && !CONFIRM.open) { updateControls(); CUR.update(dt); }
    drawWorldFull(CUR); drawL4Button(); drawControls(); if (!CUR.S.noHud) drawPauseButton(); drawInventoryPanel(); drawBackButton(); drawPauseOverlay(); drawExitButton(); drawPauseExtras(); drawMenu(); drawConfirm();
  }   // paused while ITEMS is open or PAUSE
  requestAnimationFrame(mainLoop);
}
// arrow keys: held = ride (the worlds read the direction through updateControls)
const isL = c => c === 'ArrowLeft' || c === 'KeyA', isR = c => c === 'ArrowRight' || c === 'KeyD';
window.addEventListener('keyup', e => { if (isL(e.code)) CTRL.keyL = false; if (isR(e.code)) CTRL.keyR = false; }, true);
window.addEventListener('keydown', e => {
  if (!e.repeat && isL(e.code)) { CTRL.keyL = true; CTRL.lastPressed = -1; }
  if (!e.repeat && isR(e.code)) { CTRL.keyR = true; CTRL.lastPressed = 1; }
  if (CONFIRM.open) { if (e.code === 'Escape') CONFIRM.open = false; e.stopImmediatePropagation(); return; }
  if (MENU.open) { if (e.code === 'Space' || e.code === 'Enter') continueGame(); e.stopImmediatePropagation(); return; }
  if (e.code === 'KeyP') { if (!TRANS) setPause(!PAUSE.on); }
  else if (e.code === 'KeyI') { if (!PAUSE.on) { INV.open = !INV.open; Audio.play('tink'); } }
  else if (e.code === 'Escape') { if (INV.open) INV.open = false; else if (backVisible()) doBack(); }
}, true);
requestAnimationFrame(mainLoop);
window.__ctl = { toMainMenu, CTRL, beginTransition, get TRANS() { return TRANS; }, get CUR() { return CUR; } };
})();
</script>
