export type SecretObjectType = 'hydrant' | 'key' | 'garage' | 'vhs';

export function drawSpaceSignalTransmitter(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, elapsedSeconds = 0) {
  ctx.save();
  const on = elapsedSeconds <= 0 ? Math.sin(frame * 0.08) > 0 : isSOSLightOn(elapsedSeconds);
  const pulse = on ? 1 : 0.45;

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y + 55);
  ctx.lineTo(x + 35, y + 5);
  ctx.lineTo(x + 70, y + 55);
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.fillRect(x + 22, y + 48, 48, 12);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x + 43, y + 20, 8, 30);

  ctx.shadowColor = '#f8fafc';
  ctx.shadowBlur = on ? 24 : 4;
  ctx.fillStyle = `rgba(255,255,255,${pulse})`;
  ctx.beginPath();
  ctx.arc(x + 47, y + 12, on ? 9 : 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  if (elapsedSeconds > 0) {
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('•••  ———  •••', x + 47, y - 18);
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#64748b';
    ctx.fillText('UNKNOWN SIGNAL', x + 47, y + 82);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

function isSOSLightOn(t: number) {
  const dot = 0.12;
  const gap = 0.12;
  const dash = 0.36;
  const letterGap = 0.36;
  const pattern: Array<[number, boolean]> = [
    [dot, true], [gap, false], [dot, true], [gap, false], [dot, true], [letterGap, false],
    [dash, true], [gap, false], [dash, true], [gap, false], [dash, true], [letterGap, false],
    [dot, true], [gap, false], [dot, true], [gap, false], [dot, true],
  ];
  let elapsed = t % pattern.reduce((sum, part) => sum + part[0], 0);
  for (const [duration, lightOn] of pattern) {
    if (elapsed < duration) return lightOn;
    elapsed -= duration;
  }
  return false;
}


export function drawSecretObject(
  ctx: CanvasRenderingContext2D,
  type: SecretObjectType,
  x: number,
  floorY: number,
  frame: number,
  hydrantHits = 0,
) {
  ctx.save();

  if (type === 'hydrant') {
    const y = floorY - 48;
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(x + 22, floorY + 2, 25, 5, 0, 0, Math.PI * 2); ctx.fill();
    // Body
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(x + 9, y + 12, 26, 36);
    ctx.fillRect(x + 2, y + 24, 40, 12);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(x + 22, y + 12, 13, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(x + 6, y + 7, 32, 5);
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(x + 12, y + 17, 5, 24);

    if (hydrantHits > 0 && hydrantHits < 5) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${hydrantHits}/5`, x + 22, y - 10);
      ctx.strokeStyle = 'rgba(56,189,248,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 22, y + 22, 30 + Math.sin(frame * 0.08) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.textAlign = 'left';
  }

  if (type === 'key') {
    const y = floorY - 68;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(x + 12, y + 15, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 21, y + 15); ctx.lineTo(x + 45, y + 15); ctx.lineTo(x + 45, y + 23); ctx.lineTo(x + 37, y + 23); ctx.lineTo(x + 37, y + 29); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('KEY', x, y - 5);
  }

  if (type === 'garage') {
    const y = floorY - 125;
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(x, y, 180, 125);
    ctx.fillStyle = '#374151';
    ctx.fillRect(x - 8, y - 8, 196, 8);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3;
    for (let yy = y + 15; yy < floorY; yy += 18) {
      ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + 180, yy); ctx.stroke();
    }
    ctx.fillStyle = '#111827';
    ctx.fillRect(x + 35, y + 20, 110, 105);
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 35, y + 20, 110, 105);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GARAGE', x + 90, y - 14);
    ctx.textAlign = 'left';
  }

  if (type === 'vhs') {
    const y = floorY - 63;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#111827';
    ctx.fillRect(x, y, 78, 48);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 78, 48);
    ctx.fillStyle = '#374151';
    ctx.fillRect(x + 8, y + 8, 62, 18);
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 9px Arial';
    ctx.fillText('INVERT61', x + 14, y + 20);
    ctx.fillStyle = '#111827';
    ctx.beginPath(); ctx.arc(x + 20, y + 35, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 58, y + 35, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('VHS', x + 28, y - 8);
  }

  ctx.restore();
}
