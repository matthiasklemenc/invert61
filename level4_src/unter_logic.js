// =====================================================================
//  UNTERWELT – start, the way back up, Grummel's rain clouds
// =====================================================================
S.clouds = [];
function worldInit() {}
function worldReset() { S.clouds = []; }
function worldBegin() {
  if (!SAVE.items.sun) { SAVE.items.sun = true; writeSave(); flash(isTouchDev() ? 'Abu gibt dir SONNENKUGELN mit! Schuss-Taste rechts unten.' : 'Abu gibt dir SONNENKUGELN mit! Schießen: X oder rechte Maustaste.', 220); Audio.play('chest'); }
  else flash('DIE UNTERWELT', 110);
}
function worldAsk(id, yes) {
  if (yes && id === 'exit') { saveProgress(); S.phase = 'leaving'; Audio.play('pipe'); goToWorld('aurora.html', 'from=unter'); }
}
function worldPhase(dt) { if (S.phase === 'won' && S.boss) { S.boss.t += dt; for (const e of S.freed || []) e.t += dt; } return false; }
function worldPointer(p) {
  if (S.phase === 'won') {
    if (inRect(p, BTN.won1)) { saveProgress(); S.phase = 'leaving'; Audio.play('pipe'); goToWorld('aurora.html', 'from=unter'); }
    else if (inRect(p, BTN.won2)) toMainMenu();
    return true;
  }
  return false;
}
// Grummel's grumpy rain clouds: they float over Kai and then it rains (hurts). A sun ball makes them go poof.
function updateClouds(dt) {
  const k = S.kai, kb = kaiBox();
  for (const c of S.clouds) {
    c.t += dt;
    if (c.t < 70) c.x += (k.x - c.x) * Math.min(1, 0.04 * dt);
    c.rain = c.t > 70 && c.t < 190;
    if (c.rain && overlap(kb, { x1: c.x - 44, x2: c.x + 44, y1: c.y, y2: FLOOR })) hurt(c.x);
    if (c.t > 210) c.gone = true;
  }
  S.clouds = S.clouds.filter(c => !c.gone);
}
function worldUpdate(dt) { updateClouds(dt); }
function shotHitsExtra(s, sb) {
  for (const c of S.clouds) if (!c.gone && overlap(sb, { x1: c.x - 50, x2: c.x + 50, y1: c.y - 26, y2: c.y + 20 })) { c.gone = true; s.life = 0; burst(c.x, c.y, '#ffd23a', 14, 4); Audio.play('pop'); addScore(50, c.x, c.y - 20); return; }
  if (S.mid && S.mid.state !== 'gone') { wurmHit(s, sb); if (s.life <= 0) return; }
  if (S.boss) grummelHit(s, sb);
}
TEST.mid = () => TEST.setX(MID.x + 300);
