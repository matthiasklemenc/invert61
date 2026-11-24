// =====================================================================
//  ALIEN-ATTACKE – the arcade machine in the moon base (own aliens, pixel graphics, beeps)
//  Kai at the bottom: ◀ ▶ ride, SCHUSS = laser. Rows of aliens march sideways, step down at the edge and
//  get faster the fewer there are. They drop bombs. The shields crumble. A bonus UFO crosses the top.
//  3 waves, then the big MUTTERSCHIFF with an energy bar. Aliens reaching the shields = lost.
// =====================================================================
const AFX = 330, AFW = 620;                                   // the playing field (screen x)
const afTop = () => -DY + 58, afBot = () => H - 6;
const PX = 4;                                                 // one alien pixel
// own alien designs (11 × 8 pixels, two frames): X = body, W = white, K = black
const ALIENS = [
  { name: 'Glupschi', col: '#7dff6a', pts: 30, f: [
    ['..X.....X..', '...X...X...', '..XXXXXXX..', '.XXWWWWWXX.', 'XXXWWKWWXXX', 'XXXXWWWXXXX', '..X.X.X.X..', '.X.......X.'],
    ['..X.....X..', '...X...X...', '..XXXXXXX..', '.XXWWWWWXX.', 'XXXWKWWWXXX', 'XXXXWWWXXXX', '..XX...XX..', '...X...X...']] },
  { name: 'Zacki', col: '#ff5ad1', pts: 20, f: [
    ['X....X....X', '.X..XXX..X.', '..XXXXXXX..', '.XXKXXXKXX.', 'XXXXXXXXXXX', 'X.XXXXXXX.X', 'X.X.....X.X', '...XX.XX...'],
    ['..X..X..X..', '...XXXXX...', '..XXXXXXX..', '.XXKXXXKXX.', 'XXXXXXXXXXX', '.XXXXXXXXX.', '..X.....X..', '.X.......X.']] },
  { name: 'Wabbel', col: '#5ae6ff', pts: 10, f: [
    ['...XXXXX...', '.XXXXXXXXX.', 'XXWWXXXWWXX', 'XXKWXXXKWXX', 'XXXXXXXXXXX', '..XX.X.XX..', '.X..X.X..X.', 'X..X...X..X'],
    ['...XXXXX...', '.XXXXXXXXX.', 'XXWWXXXWWXX', 'XXWKXXXWKXX', 'XXXXXXXXXXX', '..XX.X.XX..', '..X.X.X.X..', '.X.X...X.X.']] },
];
const MOTHER = ['........XXXXXXXX........', '.....XXXXXXXXXXXXXX.....', '...XXXXXXXXXXXXXXXXXX...', '..XXWWXXWWXXWWXXWWXXWW..', '.XXXXXXXXXXXXXXXXXXXXXX.', 'XXXXXXXXXXXXXXXXXXXXXXXX', '..XXX..XXX....XXX..XXX..', '...X....X......X....X...'];
const UFO = ['.....XXXXXX.....', '...XXXXXXXXXX...', '..XXWXXWXXWXXX..', 'XXXXXXXXXXXXXXXX', '..XXX..XX..XXX..', '...X........X...'];
function pixelArt(rows, x, y, px, col) {
  for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) {
    const ch = rows[r][c]; if (ch === '.') continue;
    ctx.fillStyle = ch === 'W' ? '#ffffff' : ch === 'K' ? '#101018' : col;
    ctx.fillRect(Math.round(x + c * px), Math.round(y + r * px), px, px);
  }
}
// one wave only (Kai: shorter!) – it marches faster from the start, then the mothership comes
const WAVES = [{ rows: 4, cols: 8, step: 11, bomb: 0.012 }];
function startArcade() {
  const k = S.kai; k.vx = 0; k.dir = 0;
  S.game = { id: 'alien', steer: true, t: 0, wave: 0, x: AFX + AFW / 2, dir: 0, shots: [], bombs: [], lives: 3, inv: 0, cool: 0, aliens: [], march: 0, marchN: 0, mdir: 1, frame: 0,
    shields: [], ufo: null, ufoT: 600, mother: null, score: 0, result: null, msg: '', msgT: 0, pause: 90, sparks: [] };
  buildShields(); buildWave(0);
  S.phase = 'game'; Audio.play('blip'); Audio.setBoss(false);
}
function buildWave(i) {
  const g = S.game, w = WAVES[i], gap = 54, small = afBot() - afTop() < 400;
  const rows = small ? 3 : w.rows, rg = small ? 32 : 38;      // a small screen (computer): one row less, so there is room to march down
  g.aliens = [];
  const x0 = AFX + (AFW - (w.cols - 1) * gap - 44) / 2;
  for (let r = 0; r < rows; r++) for (let c = 0; c < w.cols; c++) g.aliens.push({ x: x0 + c * gap, y: afTop() + (small ? 30 : 46) + r * rg, type: r === 0 ? 0 : r < 2 ? 1 : 2, dead: false });
  g.total = g.aliens.length; g.mdir = 1; g.march = 0; g.pause = 90; g.msg = tx('Die Aliens kommen!'); g.msgT = 90;
}
function buildShields() {
  const g = S.game; g.shields = [];
  for (let s = 0; s < 3; s++) {
    const sx = AFX + 90 + s * 200, sy = afBot() - 96;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) {
      if (r === 0 && (c === 0 || c === 8)) continue;           // rounded top corners
      if (r >= 3 && c >= 3 && c <= 5) continue;                // the arch underneath
      g.shields.push({ x: sx + c * 8, y: sy + r * 8, hp: 2 });
    }
  }
}
function gameDir(d) { if (S.game) S.game.dir = d; }
function gameShoot() {
  const g = S.game; if (!g || g.result || g.cool > 0 || g.pause > 0) return;
  if (g.shots.length >= 2) return;
  g.shots.push({ x: g.x, y: afBot() - 64 }); g.cool = 14; Audio.play('pew');
}
const aliveAliens = g => g.aliens.filter(a => !a.dead);
function updateArcade(dt) {
  const g = S.game; if (!g) return;
  g.t += dt; if (g.msgT > 0) g.msgT -= dt;
  for (const s of g.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; } g.sparks = g.sparks.filter(s => s.t < 30);
  if (g.result) return;
  if (g.cool > 0) g.cool -= dt; if (g.inv > 0) g.inv -= dt;
  // Kai on his hoverboard
  g.x = clamp(g.x + g.dir * 6.2 * dt, AFX + 26, AFX + AFW - 26);
  if ((CTRL.shootP.size > 0 || CTRL.right || CTRL.jumpP.size > 0) && !g.result) gameShoot();
  if (g.pause > 0) { g.pause -= dt; return; }
  // Kai's laser shots
  for (const s of g.shots) {
    s.y -= 9.5 * dt;
    for (const a of g.aliens) if (!a.dead && s.x > a.x - 2 && s.x < a.x + 46 && s.y > a.y && s.y < a.y + 32) { a.dead = true; s.y = -9999; arcadeSpark(a.x + 22, a.y + 16, ALIENS[a.type].col); g.score += ALIENS[a.type].pts; Audio.play('invHit'); break; }
    if (s.y < -9000) continue;
    if (hitShield(s.x, s.y)) { s.y = -9999; continue; }
    if (g.ufo && s.x > g.ufo.x && s.x < g.ufo.x + 64 && s.y > g.ufo.y && s.y < g.ufo.y + 24) { arcadeSpark(g.ufo.x + 32, g.ufo.y + 12, '#ff5a4f'); g.ufo = null; s.y = -9999; S.coins += 5; g.score += 150; g.msg = tx('UFO! +5 Münzen'); g.msgT = 80; Audio.play('coin'); Audio.play('invHit'); continue; }
    const m = g.mother;
    if (m && m.hp > 0 && s.x > m.x && s.x < m.x + 168 && s.y > m.y && s.y < m.y + 56) { m.hp--; m.flash = 8; arcadeSpark(s.x, m.y + 50, '#ffd23a'); s.y = -9999; Audio.play('invHit'); if (m.hp <= 0) motherDown(); }
  }
  g.shots = g.shots.filter(s => s.y > afTop());
  if (g.result) return;
  // the march of the aliens: the fewer there are, the faster they go
  const alive = aliveAliens(g);
  if (!g.mother) {
    g.march += dt;
    const w = WAVES[g.wave], every = Math.max(3, w.step * (alive.length / g.total));
    if (g.march >= every && alive.length) {
      g.march = 0; g.frame ^= 1;
      Audio.note([110, 98, 87, 82][g.marchN++ % 4], 0.09, 'square', 0.07);
      const minX = Math.min(...alive.map(a => a.x)), maxX = Math.max(...alive.map(a => a.x + 44));
      if ((g.mdir > 0 && maxX + 10 > AFX + AFW - 6) || (g.mdir < 0 && minX - 10 < AFX + 6)) { g.mdir *= -1; for (const a of alive) a.y += afBot() - afTop() < 400 ? 14 : 28; }
      else for (const a of alive) a.x += 10 * g.mdir;
    }
    // bombs from the lowest alien of a column
    for (const a of alive) {
      if (Math.random() < w.bomb * dt / Math.max(4, alive.length / 3) && !alive.some(b => b !== a && Math.abs(b.x - a.x) < 10 && b.y > a.y)) g.bombs.push({ x: a.x + 22, y: a.y + 32, vy: 2.6 + g.wave * 0.5 });
    }
    // the aliens reached the shields: lost
    if (alive.some(a => a.y + 32 >= afBot() - 100)) { arcadeLose(tx('Die Aliens sind gelandet!')); return; }
    if (!alive.length) {
      S.coins += 5; Audio.play('chime');
      if (g.wave < WAVES.length - 1) { g.wave++; buildWave(g.wave); }
      else { g.mother = { x: AFX + AFW / 2 - 84, y: afTop() + 34, hp: 20, max: 20, t: 0, fire: 90, flash: 0 }; g.pause = 90; g.msg = tx('DAS MUTTERSCHIFF!'); g.msgT = 110; Audio.play('alarm'); }
    }
  } else {
    const m = g.mother; m.t += dt; if (m.flash > 0) m.flash -= dt;
    const weak = 1 - m.hp / m.max;
    m.x = AFX + AFW / 2 - 84 + Math.sin(m.t * (0.014 + weak * 0.012)) * (AFW / 2 - 100);
    m.y = afTop() + 34 + Math.sin(m.t * 0.03) * 10 + weak * 40;
    m.fire -= dt;
    if (m.fire <= 0) {
      m.fire = 70 - weak * 30;
      const n = weak > 0.5 ? 5 : 3;
      for (let i = 0; i < n; i++) g.bombs.push({ x: m.x + 84, y: m.y + 56, vy: 3.2, vx: (i - (n - 1) / 2) * 0.9 });
      Audio.note(330, 0.12, 'sawtooth', 0.06);
    }
  }
  // the bonus UFO
  g.ufoT -= dt;
  if (!g.ufo && g.ufoT <= 0 && !g.mother) { g.ufoT = rand(700, 1000); const left = Math.random() < 0.5; g.ufo = { x: left ? AFX - 64 : AFX + AFW, y: afTop() + 8, vx: left ? 2.4 : -2.4 }; Audio.play('ufo'); }
  if (g.ufo) { g.ufo.x += g.ufo.vx * dt; if (g.ufo.x < AFX - 80 || g.ufo.x > AFX + AFW + 20) g.ufo = null; }
  // bombs
  for (const b of g.bombs) {
    b.y += b.vy * dt; b.x += (b.vx || 0) * dt;
    if (hitShield(b.x, b.y + 8)) { b.y = 9999; continue; }
    if (g.inv <= 0 && Math.abs(b.x - g.x) < 22 && b.y + 10 > afBot() - 58 && b.y < afBot() - 4) {
      b.y = 9999; g.lives--; g.inv = 90; arcadeSpark(g.x, afBot() - 30, '#ff5a4f'); Audio.play('crash'); S.shake = 6;
      if (g.lives <= 0) { arcadeLose(tx('Du wurdest getroffen!')); return; }
    }
  }
  g.bombs = g.bombs.filter(b => b.y < afBot() + 10);
}
function hitShield(x, y) {
  const g = S.game;
  for (const s of g.shields) if (s.hp > 0 && x > s.x - 2 && x < s.x + 10 && y > s.y - 2 && y < s.y + 10) { s.hp--; return true; }
  return false;
}
function arcadeSpark(x, y, col) { const g = S.game; for (let i = 0; i < 10; i++) { const a = rand(0, Math.PI * 2), v = rand(1, 4); g.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, col }); } }
function motherDown() {
  const g = S.game, m = g.mother;
  for (let i = 0; i < 4; i++) arcadeSpark(m.x + 30 + i * 36, m.y + 28, i % 2 ? '#ffd23a' : '#ff5ad1');
  g.mother = null; g.bombs = [];
  g.result = 'win'; S.coins += 20; SAVE.mini.alien = true;
  g.pts = !SAVE.pts.mini_alien; if (g.pts) { SAVE.pts.mini_alien = true; S.score += PTS.mini; }
  saveProgress(); Audio.play('explosion'); Audio.play('win'); Audio.play('cheer');
}
function arcadeLose(text) { const g = S.game; g.result = 'lose'; g.loseText = text; Audio.play('nomatch'); Audio.play('gameover'); saveProgress(); }
function arcadePointer(p) {
  const g = S.game; if (!g) return;
  if (g.result) {
    if (g.result === 'lose' && inRect(p, GBTN.again)) { startArcade(); return; }
    if (inRect(p, g.result === 'lose' ? GBTN.next2 : GBTN.next)) endArcade();
    return;
  }
  // a mouse click (or a tap in the field) shoots
  if (p.x > AFX && p.x < AFX + AFW) gameShoot();
}
function endArcade() {
  const k = S.kai, gate = SITES.arcade + 120;
  S.game = null; S.phase = 'play'; saveProgress();
  k.x = gate + 220; k.y = FLOOR; k.vy = 0; k.ground = true; k.platform = null; k.dir = 0; k.face = 1;
  Audio.play('tink');
}

// ---------------- drawing (screen space) ----------------
function drawArcade() {
  const g = S.game;
  // the moon base hall behind the machine
  ctx.fillStyle = '#0b0f22'; ctx.fillRect(0, -DY, W, H + DY);
  ctx.fillStyle = '#141a36'; for (let i = 0; i < 9; i++) ctx.fillRect(i * 150 - 20, -DY, 10, H + DY);
  // the cabinet
  ctx.save(); ctx.strokeStyle = OUT; ctx.lineWidth = 4;
  ctx.fillStyle = '#5a3fd8'; ctx.beginPath(); ctx.roundRect(AFX - 40, -DY + 6, AFW + 80, H + DY - 2, 22); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7a5cff'; ctx.fillRect(AFX - 30, -DY + 14, AFW + 60, 36);
  ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 24px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(tx('ALIEN-ATTACKE'), AFX + AFW / 2, -DY + 33);
  ctx.fillStyle = '#05060c'; ctx.fillRect(AFX, afTop() - 4, AFW, afBot() - afTop() + 4);
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(AFX, afTop() - 4, AFW, afBot() - afTop() + 4); ctx.clip();
  // stars in the screen
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 40; i++) ctx.fillRect(AFX + (i * 97) % AFW, afTop() + (i * 53 + g.t * 0.2 * (1 + i % 3)) % (afBot() - afTop()), 2, 2);
  // shields
  for (const s of g.shields) if (s.hp > 0) { ctx.fillStyle = s.hp > 1 ? '#36f4a0' : '#1f9a63'; ctx.fillRect(s.x, s.y, 8, 8); }
  // aliens
  for (const a of g.aliens) if (!a.dead) { const A = ALIENS[a.type]; pixelArt(A.f[g.frame], a.x, a.y, PX, A.col); }
  if (g.ufo) pixelArt(UFO, g.ufo.x, g.ufo.y, 4, '#ff5a4f');
  if (g.mother) { const m = g.mother; pixelArt(MOTHER, m.x, m.y, 7, m.flash > 0 ? '#ffffff' : '#ff5ad1'); }
  // bombs (zig-zag) and laser shots
  for (const b of g.bombs) { ctx.fillStyle = '#ffd23a'; const z = Math.floor(b.y / 6) % 2 ? 2 : -2; ctx.fillRect(b.x - 2 + z, b.y, 4, 4); ctx.fillRect(b.x - 2 - z, b.y + 4, 4, 4); ctx.fillRect(b.x - 2 + z, b.y + 8, 4, 4); }
  for (const s of g.shots) { ctx.fillStyle = '#d8ffe9'; ctx.fillRect(s.x - 2, s.y, 4, 14); ctx.fillStyle = 'rgba(54,244,160,0.5)'; ctx.fillRect(s.x - 4, s.y - 2, 8, 18); }
  for (const s of g.sparks) { ctx.fillStyle = s.col; ctx.globalAlpha = 1 - s.t / 30; ctx.fillRect(s.x - 3, s.y - 3, 6, 6); } ctx.globalAlpha = 1;
  // Kai on the hoverboard at the bottom (small)
  if (!(g.inv > 0 && Math.floor(g.inv / 5) % 2 === 0) && g.result !== 'lose') {
    ctx.save(); ctx.translate(g.x, afBot() - 4); ctx.scale(0.55, 0.55);
    drawKaiFigure({ x: 0, y: 0, tilt: 0, crouch: 2, push: 0, flip: 0, armsUp: true, wind: 0.3, outfit: SAVE.outfit, hover: true, space: true });
    ctx.restore();
  }
  ctx.restore();
  // info: score, lives, wave / mothership energy
  ctx.save(); ctx.textBaseline = 'middle'; ctx.font = 'bold 15px "Courier New", monospace';
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.fillText(tx('PUNKTE') + ' ' + g.score, AFX + 8, afTop() + 12);
  ctx.textAlign = 'right'; ctx.fillText(g.mother ? tx('MUTTERSCHIFF') : tx('ALIENS') + ' ' + aliveAliens(g).length, AFX + AFW - 8, afTop() + 12);
  for (let i = 0; i < 3; i++) drawHeart(AFX + AFW / 2 - 24 + i * 24, afTop() + 12, 8, i < g.lives);
  if (g.mother) {
    const f = g.mother.hp / g.mother.max, bw = 240, bx = AFX + AFW / 2 - bw / 2, by = afTop() + 26;
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(bx, by, bw, 8);
    ctx.fillStyle = f > 0.6 ? '#34c759' : f > 0.3 ? '#ffcc2e' : '#ff3b30'; ctx.fillRect(bx, by, bw * f, 8);
  }
  if (g.msgT > 0) { sayBtn(AFX + AFW - 46, (afTop() + afBot()) / 2 - 18, g.msg, 36); ctx.textAlign = 'center'; ctx.font = 'bold 30px "Courier New", monospace'; ctx.fillStyle = '#ffd23a'; ctx.globalAlpha = Math.min(1, g.msgT / 20); ctx.fillText(g.msg, AFX + AFW / 2, (afTop() + afBot()) / 2); ctx.globalAlpha = 1; }
  // how to play (left and right of the machine)
  ctx.textAlign = 'center'; ctx.font = 'bold 13px Arial'; ctx.fillStyle = '#bfe6ff';
  const help = CTRL.touch ? [tx('◀ ▶ = fahren'), tx('SCHUSS = Laser')] : [tx('Pfeile ← → = fahren'), tx('Leertaste / X = Laser')];
  help.forEach((h, i) => ctx.fillText(h, AFX / 2 - 10, -DY + 90 + i * 22));
  ctx.restore();
  if (g.result) resultPanel(g.result === 'win' ? tx('MUTTERSCHIFF BESIEGT!') : g.loseText, g.result === 'win', g.result === 'win' ? tx('+20 Münzen · Pokal-Stern!') + (g.pts ? '  ·  +' + fmtNum(PTS.mini) + ' ' + tx('Punkte') : '') : null);
}
