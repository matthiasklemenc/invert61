// =====================================================================
//  MINI GAMES IN THE DINO VALLEY
//  DINO-RODEO: ride a bucking triceratops for 15 seconds – lean left / right to stay on.
//  FOSSILIEN AUSGRABEN: dig in the sand and find all 6 bones of a dino skeleton.
//    Every empty hole shows how many bones lie right next to it (like a metal detector).
// =====================================================================
const RODEO_T = 900;                 // 15 seconds
const FOS = { cols: 6, rows: 4, bones: 6, digs: 15, cw: 82, ch: 50 };
FOS.x = W / 2 - FOS.cols * FOS.cw / 2; FOS.y = 84;

function startGame(id) {
  const k = S.kai; k.vx = 0; k.dir = 0;
  if (id === 'rodeo') {
    S.game = { id, t: 0, bal: 0, bv: 0, hold: 0, result: null, buck: 0 };
    flash(CTRL.touch ? 'Links / rechts antippen und halten = lehnen!' : 'Pfeil links / rechts = lehnen!', 140);
  } else {
    const cells = [];
    for (let r = 0; r < FOS.rows; r++) for (let c = 0; c < FOS.cols; c++) cells.push({ c, r, bone: false, dug: false, n: 0 });
    const idx = cells.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, FOS.bones);
    for (const i of idx) cells[i].bone = true;
    for (const cl of cells) cl.n = cells.filter(o => o.bone && Math.abs(o.c - cl.c) <= 1 && Math.abs(o.r - cl.r) <= 1 && o !== cl).length;
    S.game = { id, cells, digs: FOS.digs, found: 0, result: null, t: 0 };
  }
  S.phase = id; Audio.play('chime');
}
function gameKey(e) {
  const g = S.game; if (!g) return;
  if (g.result) { if (e.code === 'Space' || e.code === 'Enter') endGame(); return; }
  if (g.id === 'rodeo') { if (e.code === 'ArrowLeft' || e.code === 'KeyA') g.hold = -1; if (e.code === 'ArrowRight' || e.code === 'KeyD') g.hold = 1; }
}
window.addEventListener('keyup', e => { if (CUR === ME && S.game && S.game.id === 'rodeo' && /Arrow(Left|Right)|Key[AD]/.test(e.code)) S.game.hold = 0; });
window.addEventListener('pointerup', () => { if (CUR === ME && S.game && S.game.id === 'rodeo') S.game.hold = 0; });
window.addEventListener('pointercancel', () => { if (CUR === ME && S.game && S.game.id === 'rodeo') S.game.hold = 0; });
const GBTN = { next: { x: W / 2 - 110, y: 250, w: 220, h: 44 }, again: { x: W / 2 - 235, y: 250, w: 220, h: 44 }, next2: { x: W / 2 + 15, y: 250, w: 220, h: 44 } };
function gamePointer(p) {
  const g = S.game; if (!g) return;
  if (g.result) {
    if (g.result === 'lose' && inRect(p, GBTN.again)) { const id = g.id; S.game = null; startGame(id); return; }
    if (inRect(p, g.result === 'lose' ? GBTN.next2 : GBTN.next)) endGame();
    return;
  }
  if (g.id === 'rodeo') { g.hold = p.x < W / 2 ? -1 : 1; return; }
  // fossil: dig the tapped square
  const c = Math.floor((p.x - FOS.x) / FOS.cw), r = Math.floor((p.y - FOS.y) / FOS.ch);
  if (c < 0 || r < 0 || c >= FOS.cols || r >= FOS.rows) return;
  const cl = g.cells.find(o => o.c === c && o.r === r);
  if (!cl || cl.dug || g.digs <= 0) return;
  cl.dug = true; g.digs--;
  const cx = FOS.x + c * FOS.cw + FOS.cw / 2, cy = FOS.y + r * FOS.ch + FOS.ch / 2;
  burst(cx + S.cam, cy, '#d9b97a', 10, 3);
  if (cl.bone) { g.found++; Audio.play('pearl'); if (g.found >= FOS.bones) gameWon(); }
  else { Audio.play('tink'); if (g.digs <= 0) gameLost(); }
}
function updateGame(dt) {
  const g = S.game; if (!g || g.result) return;
  g.t += dt;
  if (g.id !== 'rodeo') return;
  // the triceratops bucks: random kicks that get stronger, the rider leans against it
  g.buck -= dt;
  if (g.buck <= 0) { g.buck = rand(28, 60); g.bv += (Math.random() < 0.5 ? -1 : 1) * rand(0.012, 0.02 + g.t / RODEO_T * 0.02); Audio.play(Math.random() < 0.3 ? 'roar' : 'stomp'); }
  g.bv += g.bal * 0.0012 * dt;                 // the further you lean, the more you fall
  g.bv += g.hold * 0.0026 * dt;
  g.bv *= Math.pow(0.97, dt);
  g.bal += g.bv * dt;
  if (Math.abs(g.bal) >= 1) gameLost();
  else if (g.t >= RODEO_T) gameWon();
}
function gameWon() {
  const g = S.game; g.result = 'win';
  S.coins += 20; SAVE.mini[g.id] = true;
  g.pts = !SAVE.pts['mini_' + g.id]; if (g.pts) { SAVE.pts['mini_' + g.id] = true; S.score += PTS.mini; }
  saveProgress();
  Audio.play('win'); Audio.play('cheer');
}
function gameLost() { const g = S.game; g.result = 'lose'; Audio.play('nomatch'); if (g.id === 'rodeo') { S.shake = 8; Audio.play('crash'); } }
function endGame() {
  const k = S.kai, gate = SITES[S.game.id] + 120;
  S.game = null; S.phase = 'play';
  k.x = gate + 200; k.y = FLOOR; k.vy = 0; k.ground = true; k.platform = null; k.dir = 0; k.face = 1;
  Audio.play('tink');
}
