// The HUD strip and the full-screen states: title, room intro, busted, and the
// getaway score screen. All canvas-drawn, no DOM.
import { W, HUD_H, PAL, ratingFor } from './config.js';

export function drawHud(ctx, state) {
  // Brass-trimmed HUD strip.
  ctx.fillStyle = '#17101f';
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = PAL.gold;
  ctx.fillRect(0, HUD_H - 3, W, 3);

  ctx.fillStyle = PAL.cream;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`FLOOR ${state.levelIndex + 1}/3 — ${state.level.name}`, 16, 26);
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#c9b98a';
  ctx.fillText(`Target: ${state.level.target}`, 16, 46);

  // Alarm meter: the heart of the HUD.
  const ax = 470;
  const aw = 340;
  ctx.fillStyle = '#2a1a2e';
  ctx.fillRect(ax, 14, aw, 18);
  const frac = state.alarm / 100;
  ctx.fillStyle = state.alarm > 70 ? '#ff3b30' : state.alarm > 40 ? '#ffb43c' : '#37e0d8';
  ctx.fillRect(ax, 14, aw * frac, 18);
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ax, 14, aw, 18);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ALARM ${Math.round(state.alarm)}%`, ax + aw / 2, 28);
  ctx.textAlign = 'left';
  if (state.alarm > 70) {
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.fillText('⚠ THE HOUSE IS ONTO YOU', ax, 48);
  }

  // Haul + tools, right side.
  ctx.fillStyle = PAL.goldBright;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(`HAUL $${state.haul.toLocaleString('en-US')}`, W - 16, 26);
  ctx.fillStyle = PAL.cream;
  ctx.font = '12px Georgia, serif';
  const t = state.tools;
  ctx.fillText(
    `Chips ${t.chips} · Smoke ${t.smoke} · EMP ${t.emp} · Disguise ${t.disguiseOn ? 'ON' : 'off'}`,
    W - 16, 46,
  );
  ctx.textAlign = 'left';

  // Transient tool message under the HUD.
  if (state.tools.flash) {
    ctx.fillStyle = 'rgba(10,6,14,0.85)';
    const msg = state.tools.flash.text;
    ctx.font = 'bold 13px Georgia, serif';
    const mw = ctx.measureText(msg).width + 24;
    ctx.fillRect(W / 2 - mw / 2, HUD_H + 8, mw, 26);
    ctx.strokeStyle = PAL.gold;
    ctx.strokeRect(W / 2 - mw / 2, HUD_H + 8, mw, 26);
    ctx.fillStyle = PAL.goldBright;
    ctx.textAlign = 'center';
    ctx.fillText(msg, W / 2, HUD_H + 26);
    ctx.textAlign = 'left';
  }

  // "HOLD E" prompts near the player.
  if (state.prompt) {
    ctx.fillStyle = 'rgba(10,6,14,0.9)';
    ctx.font = 'bold 13px Georgia, serif';
    const pw = ctx.measureText(state.prompt).width + 20;
    ctx.fillRect(state.player.x - pw / 2, state.player.y - 44, pw, 24);
    ctx.strokeStyle = PAL.goldBright;
    ctx.strokeRect(state.player.x - pw / 2, state.player.y - 44, pw, 24);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(state.prompt, state.player.x, state.player.y - 27);
    ctx.textAlign = 'left';
  }
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(8,4,12,0.82)';
  ctx.fillRect(0, 0, W, 720);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = '#1c1024';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

export function drawTitle(ctx, now) {
  dim(ctx);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PAL.goldBright;
  ctx.shadowColor = PAL.gold;
  ctx.shadowBlur = 24;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('THE GILDED CAGE', W / 2, 220);
  ctx.restore();
  ctx.fillStyle = PAL.neonPink;
  ctx.shadowColor = PAL.neonPink;
  ctx.shadowBlur = 14;
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('— a casino heist in three floors —', W / 2, 262);
  ctx.shadowBlur = 0;
  ctx.fillStyle = PAL.cream;
  ctx.font = '17px Georgia, serif';
  const lines = [
    'You are Vesper, the thief who never leaves a tip.',
    'Tonight the Gilded Cage opens its doors — and its vault.',
    'Steal the Duchess Chip, the Peacock Diamond and the Crown,',
    'then reach the service elevator before the alarm hits 100%.',
    '',
    'WASD move · Shift sneak · Space run (loud!) · Click toss a chip',
    'Q smoke bomb · F EMP pulse · C dealer disguise · Hold E crack a case',
    'E at the SEC panel kills the cameras · R restart the floor · M mute',
  ];
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 310 + i * 26));
  ctx.fillStyle = PAL.goldBright;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(`PRESS ENTER TO BEGIN${Math.sin(now * 4) > 0 ? ' ▸' : ''}`, W / 2, 540);
  ctx.textAlign = 'left';
}

export function drawIntro(ctx, level) {
  dim(ctx);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PAL.goldBright;
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText(level.name, W / 2, 240);
  ctx.fillStyle = PAL.cream;
  ctx.font = '17px Georgia, serif';
  wrap(ctx, level.intro, W / 2, 290, 820, 26);
  ctx.fillStyle = PAL.neonCyan;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText(`TARGET: ${level.target} — $${level.targetValue.toLocaleString('en-US')}`, W / 2, 430);
  ctx.fillStyle = PAL.goldBright;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText('PRESS ENTER', W / 2, 480);
  ctx.restore();
}

export function drawBusted(ctx, state) {
  dim(ctx);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff3b30';
  ctx.font = 'bold 56px Georgia, serif';
  ctx.fillText('BUSTED!', W / 2, 260);
  ctx.fillStyle = PAL.cream;
  ctx.font = '18px Georgia, serif';
  ctx.fillText('Security swarms the floor. Vesper is escorted out through the kitchens.', W / 2, 310);
  ctx.fillText(`You kept $${state.haul.toLocaleString('en-US')} of the haul — the house kept the rest.`, W / 2, 340);
  ctx.fillStyle = PAL.goldBright;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText('PRESS R TO TRY THE FLOOR AGAIN', W / 2, 420);
  ctx.restore();
}

export function drawWin(ctx, state) {
  dim(ctx);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PAL.goldBright;
  ctx.shadowColor = PAL.gold;
  ctx.shadowBlur = 20;
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText('CLEAN GETAWAY!', W / 2, 220);
  ctx.shadowBlur = 0;
  ctx.fillStyle = PAL.cream;
  ctx.font = '19px Georgia, serif';
  ctx.fillText('The van pulls away as the alarm finally wakes the house.', W / 2, 268);
  ctx.fillStyle = PAL.goldBright;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText(`TOTAL HAUL: $${state.haul.toLocaleString('en-US')}`, W / 2, 330);
  ctx.fillStyle = PAL.neonCyan;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(ratingFor(state.alarm, state.timeSec), W / 2, 372);
  ctx.fillStyle = PAL.cream;
  ctx.font = '16px Georgia, serif';
  ctx.fillText(`Time: ${Math.floor(state.timeSec / 60)}:${String(Math.floor(state.timeSec % 60)).padStart(2, '0')}  ·  Final alarm: ${Math.round(state.alarm)}%  ·  Floors cleared: 3/3`, W / 2, 408);
  ctx.fillStyle = PAL.goldBright;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText('PRESS ENTER TO PLAY AGAIN', W / 2, 470);
  ctx.restore();
}

export function drawFloorClear(ctx, state) {
  dim(ctx);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = PAL.goldBright;
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText(`${state.level.name} — CLEARED`, W / 2, 260);
  ctx.fillStyle = PAL.cream;
  ctx.font = '19px Georgia, serif';
  ctx.fillText(`${state.level.target} is yours. Haul so far: $${state.haul.toLocaleString('en-US')}`, W / 2, 310);
  ctx.fillStyle = PAL.neonCyan;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText('PRESS ENTER FOR THE NEXT FLOOR', W / 2, 380);
  ctx.restore();
}

function wrap(ctx, text, cx, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, yy);
      line = w;
      yy += lh;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, cx, yy);
}
