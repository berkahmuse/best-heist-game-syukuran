// All drawing: the casino itself, its people and its danger. Canvas 2D only,
// everything drawn in code — no image files, no network.
import { W, H, HUD_H, PAL, GUARD_VIEW_DIST, GUARD_VIEW_HALF, CAM_VIEW_DIST, CAM_VIEW_HALF } from './config.js';
import { laserOn } from './cameras.js';
import { clamp } from './random.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function cone(ctx, x, y, angle, half, dist, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, dist, angle - half, angle + half);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle - half) * dist, y + Math.sin(angle - half) * dist);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle + half) * dist, y + Math.sin(angle + half) * dist);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// --- Floor and furniture -------------------------------------------------
export function drawFloor(ctx, level, now) {
  // Plum carpet with a subtle diamond tile pattern.
  ctx.fillStyle = PAL.carpet;
  ctx.fillRect(0, HUD_H, W, H - HUD_H);
  ctx.fillStyle = PAL.carpetTile;
  const s = 64;
  for (let y = HUD_H; y < H; y += s) {
    for (let x = 0; x < W; x += s) {
      if (((x + y) / s) % 2 === 0) ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
    }
  }
  // Gold rope line along the carpet border.
  ctx.strokeStyle = 'rgba(212,175,55,0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 10]);
  ctx.strokeRect(26, HUD_H + 26, W - 52, H - HUD_H - 52);
  ctx.setLineDash([]);

  // Shadow pools: the dark corners where the thief can hide.
  for (const sh of level.shadows) {
    ctx.fillStyle = PAL.shadow;
    rr(ctx, sh.x, sh.y, sh.w, sh.h, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(55,224,216,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Furniture and architecture, by kind.
  for (const w of level.walls) {
    drawWallPiece(ctx, w, now);
  }

  // Neon sign for the floor name, top-left inside the room.
  ctx.save();
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillStyle = PAL.neonPink;
  ctx.shadowColor = PAL.neonPink;
  ctx.shadowBlur = 12;
  ctx.fillText('★ THE GILDED CAGE ★', 34, HUD_H + 24);
  ctx.restore();
}

function drawWallPiece(ctx, w, now) {
  const kind = w.kind || 'wall';
  if (kind === 'wall') {
    ctx.fillStyle = PAL.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PAL.wallEdge;
    if (w.h <= 20) ctx.fillRect(w.x, w.y + w.h - 3, w.w, 3);
    if (w.w <= 20) ctx.fillRect(w.x + w.w - 3, w.y, 3, w.h);
    return;
  }
  if (kind === 'slots') {
    // A row of slot machines: glowing screens in a brass cabinet.
    ctx.fillStyle = '#1a0b1e';
    rr(ctx, w.x, w.y, w.w, w.h, 8);
    ctx.fill();
    ctx.strokeStyle = PAL.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    const n = 5;
    for (let i = 0; i < n; i += 1) {
      const sx = w.x + 10 + (i * (w.w - 20)) / n;
      const sw = (w.w - 20) / n - 6;
      const colors = [PAL.neonPink, PAL.neonCyan, PAL.goldBright, PAL.neonPurple, PAL.neonPink];
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.75 + 0.25 * Math.sin(now * 3 + i * 1.7);
      rr(ctx, sx, w.y + 8, sw, w.h - 16, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(['7', '♠', '♦', '★', '7'][i], sx + sw / 2 - 4, w.y + w.h / 2 + 4);
    }
    return;
  }
  if (kind === 'roulette' || kind === 'table' || kind === 'count') {
    // Felt table with a brass rim; roulette gets its wheel.
    ctx.fillStyle = PAL.felt;
    rr(ctx, w.x, w.y, w.w, w.h, 12);
    ctx.fill();
    ctx.strokeStyle = PAL.feltEdge;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(243,230,200,0.35)';
    ctx.lineWidth = 1;
    rr(ctx, w.x + 8, w.y + 8, w.w - 16, w.h - 16, 8);
    ctx.stroke();
    if (kind === 'roulette') {
      const cx = w.x + w.w / 2;
      const cy = w.y + w.h / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#2a1a2e';
      ctx.fill();
      ctx.strokeStyle = PAL.gold;
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2 + now * 0.15;
        ctx.fillStyle = i % 2 ? '#c0392b' : '#111';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, 22, a, a + Math.PI / 4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = PAL.goldBright;
      ctx.fill();
    }
    if (kind === 'count') {
      // Cash stacks on the counting tables.
      for (let i = 0; i < 3; i += 1) {
        const sx = w.x + 20 + i * 55;
        ctx.fillStyle = '#7fc97f';
        ctx.fillRect(sx, w.y + w.h / 2 - 12, 40, 24);
        ctx.strokeStyle = '#2c5c2c';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, w.y + w.h / 2 - 12, 40, 24);
        ctx.fillStyle = '#1c4a1c';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('$', sx + 16, w.y + w.h / 2 + 4);
      }
    }
    return;
  }
  if (kind === 'cage') {
    // The cashier cage: brass bars over a marble counter.
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#3a1f3f';
    for (let i = 0; i < 8; i += 1) {
      ctx.fillRect(w.x + 6 + i * 19, w.y, 5, w.h);
    }
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(w.x, w.y + w.h - 6, w.w, 6);
    ctx.fillStyle = PAL.ink;
    ctx.font = 'bold 11px Georgia, serif';
    ctx.fillText('CASHIER', w.x + w.w / 2 - 26, w.y + w.h + 14);
    return;
  }
  if (kind === 'case') {
    ctx.fillStyle = 'rgba(180,220,255,0.25)';
    rr(ctx, w.x, w.y, w.w, w.h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,230,255,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#241128';
    ctx.fillRect(w.x - 6, w.y + w.h - 8, w.w + 12, 14);
    return;
  }
  if (kind === 'bar') {
    ctx.fillStyle = '#4a1f2a';
    rr(ctx, w.x, w.y, w.w, w.h, 10);
    ctx.fill();
    ctx.strokeStyle = PAL.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = PAL.neonCyan;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('— BAR —', w.x + w.w / 2 - 28, w.y + w.h / 2 + 5);
    return;
  }
  if (kind === 'vault') {
    ctx.fillStyle = '#5a5a66';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#33333d';
    ctx.fillRect(w.x + 4, w.y + 4, w.w - 8, w.h - 8);
    ctx.beginPath();
    ctx.arc(w.x + w.w / 2, w.y + w.h / 2, 9, 0, Math.PI * 2);
    ctx.fillStyle = PAL.gold;
    ctx.fill();
    return;
  }
  ctx.fillStyle = PAL.wall;
  ctx.fillRect(w.x, w.y, w.w, w.h);
}

// --- Loot, lasers, cameras, guards, player --------------------------------
export function drawLoot(ctx, level, now) {
  for (const l of level.loot) {
    if (l.taken) continue;
    const bob = Math.sin(now * 2.5 + l.x) * 2;
    ctx.save();
    ctx.translate(l.x, l.y + bob);
    if (l.kind === 'gem') {
      ctx.shadowColor = '#7fd4ff';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#7fd4ff';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(11, -2);
      ctx.lineTo(0, 14);
      ctx.lineTo(-11, -2);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(5, -2);
      ctx.lineTo(0, 2);
      ctx.lineTo(-5, -2);
      ctx.closePath();
      ctx.fill();
    } else if (l.kind === 'crown') {
      ctx.shadowColor = PAL.goldBright;
      ctx.shadowBlur = 18;
      ctx.fillStyle = PAL.goldBright;
      ctx.beginPath();
      ctx.moveTo(-13, 8);
      ctx.lineTo(-13, -6);
      ctx.lineTo(-6, 0);
      ctx.lineTo(0, -12);
      ctx.lineTo(6, 0);
      ctx.lineTo(13, -6);
      ctx.lineTo(13, 8);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (l.kind === 'gold') {
      ctx.fillStyle = PAL.goldBright;
      for (let i = 0; i < 3; i += 1) {
        ctx.fillRect(-13 + i * 3, 2 - i * 6, 20, 7);
        ctx.strokeStyle = '#8a6d1f';
        ctx.strokeRect(-13 + i * 3, 2 - i * 6, 20, 7);
      }
    } else if (l.kind === 'cash') {
      ctx.fillStyle = '#7fc97f';
      rr(ctx, -12, -8, 24, 16, 3);
      ctx.fill();
      ctx.strokeStyle = '#2c5c2c';
      ctx.stroke();
      ctx.fillStyle = '#1c4a1c';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('$', -3, 4);
    } else {
      // Chip stack.
      const cols = ['#d43d5e', '#2b7fd4', '#f6d95c', '#7f5fd4'];
      for (let i = 0; i < 4; i += 1) {
        ctx.fillStyle = cols[i];
        ctx.beginPath();
        ctx.ellipse(0, 8 - i * 4, 11, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.stroke();
      }
    }
    ctx.restore();
    // Locked case: a gold ring + pulsing padlock dot.
    if (l.locked) {
      ctx.save();
      ctx.strokeStyle = PAL.goldBright;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(now * 4);
      ctx.beginPath();
      ctx.arc(l.x, l.y + bob, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // Name tag under the room's target loot.
    if (l.name === level.target) {
      ctx.fillStyle = PAL.goldBright;
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`★ ${l.name} ★`, l.x, l.y + 38);
      ctx.textAlign = 'left';
    }
  }
}

export function drawLasers(ctx, lasers, now, empOff) {
  for (const l of lasers) {
    const on = !empOff && laserOn(l, now);
    ctx.save();
    ctx.globalAlpha = on ? 0.95 : 0.18;
    ctx.fillStyle = on ? '#ff2e4d' : '#7a2a35';
    ctx.fillRect(l.x, l.y, l.w, l.h);
    if (on) {
      ctx.shadowColor = '#ff2e4d';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ff8fa0';
      ctx.fillRect(l.x, l.y + l.h / 2 - 1, l.w, 2);
    }
    ctx.restore();
  }
}

export function drawCameras(ctx, cameras, player, walls, now, smoke) {
  for (const cam of cameras) {
    const off = cam.offForever || now < cam.disabledUntil;
    const sees = !off && !smoke && camSees(cam, player, walls, now);
    if (!off) {
      cone(ctx, cam.x, cam.y, cam.angle, CAM_VIEW_HALF, CAM_VIEW_DIST,
        sees ? 'rgba(255,60,60,0.25)' : PAL.camCone,
        sees ? 'rgba(255,60,60,0.7)' : PAL.camConeEdge);
    }
    // Wall mount + lens.
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(cam.angle);
    ctx.fillStyle = off ? '#555' : '#222';
    rr(ctx, -8, -6, 18, 12, 4);
    ctx.fill();
    ctx.fillStyle = off ? '#333' : sees ? '#ff3b30' : '#ffd640';
    ctx.beginPath();
    ctx.arc(11, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (off) {
      ctx.fillStyle = '#888';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('OFF', cam.x - 9, cam.y + 22);
    }
  }
}

function camSees(cam, player, walls, now) {
  // Cheap local copy of the cameras.js check for the render's red tint.
  if (cam.offForever || now < cam.disabledUntil) return false;
  const d = Math.hypot(player.x - cam.x, player.y - cam.y);
  if (d > CAM_VIEW_DIST) return false;
  let diff = Math.atan2(player.y - cam.y, player.x - cam.x) - cam.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CAM_VIEW_HALF) return false;
  return true;
}

export function drawGuards(ctx, guards, player, walls, smoke) {
  for (const g of guards) {
    const seen = guardSees(g, player, walls, smoke);
    cone(ctx, g.x, g.y, g.angle, GUARD_VIEW_HALF, GUARD_VIEW_DIST,
      g.state === 'chase' ? 'rgba(255,60,60,0.30)'
        : g.state === 'suspicious' || g.state === 'investigate' ? 'rgba(255,180,60,0.24)'
        : PAL.guardCone,
      g.state === 'chase' ? 'rgba(255,60,60,0.75)'
        : g.state === 'suspicious' || g.state === 'investigate' ? 'rgba(255,180,60,0.65)'
        : PAL.guardConeEdge);
    // Body: a suited guard with a bow tie.
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.angle);
    ctx.fillStyle = PAL.guardSuit;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0d0d14';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f3e6c8';
    ctx.beginPath();
    ctx.arc(7, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(11, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // State marker: ? while suspicious, ! while chasing/investigating.
    if (g.state !== 'patrol') {
      ctx.fillStyle = g.state === 'chase' ? '#ff3b30' : '#ffb43c';
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(g.state === 'chase' ? '!' : '?', g.x, g.y - 20);
      ctx.textAlign = 'left';
    }
    // Suspicion arc under the guard.
    if (g.suspicion > 0.05) {
      ctx.strokeStyle = g.suspicion > 0.8 ? '#ff3b30' : '#ffb43c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 18, -Math.PI / 2, -Math.PI / 2 + g.suspicion * Math.PI * 2);
      ctx.stroke();
    }
  }
}

function guardSees(g, player, walls, smoke) {
  if (smoke) return false;
  const d = Math.hypot(player.x - g.x, player.y - g.y);
  if (d > GUARD_VIEW_DIST) return false;
  let diff = Math.atan2(player.y - g.y, player.x - g.x) - g.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= GUARD_VIEW_HALF;
}

export function drawPlayer(ctx, player, now) {
  ctx.save();
  ctx.translate(player.x, player.y);
  // Soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(player.facing);
  // Tuxedo thief: black suit, gold pocket square; dealer disguise: red vest.
  ctx.fillStyle = player.disguised ? '#7a1f2b' : '#15101c';
  ctx.beginPath();
  ctx.arc(0, 0, player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = player.disguised ? '#f3e6c8' : PAL.goldBright;
  ctx.beginPath();
  ctx.arc(6, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  // Eyes looking where the thief faces.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(9, -3, 1.8, 0, Math.PI * 2);
  ctx.arc(9, 3, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Sneak indicator: a small crescent under the thief.
  if (player.sneaking) {
    ctx.fillStyle = PAL.neonCyan;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', player.x, player.y + 26);
    ctx.textAlign = 'left';
  }
  // Running noise rings.
  if (player.noise > 0.7) {
    ctx.strokeStyle = `rgba(255,255,255,${0.35 * (1 - (now % 0.6) / 0.6)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 18 + ((now % 0.6) / 0.6) * 26, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawToolsLayer(ctx, tools, now) {
  // Tossed chips on the floor, still clinking.
  for (const c of tools.tossed) {
    const age = now - c.born;
    ctx.fillStyle = '#f6d95c';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(246,217,92,0.7)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6 + age * 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Smoke clouds.
  for (const c of tools.smokeClouds) {
    const age = now - c.born;
    const a = age < 0.5 ? age / 0.5 : 1 - (age - 0.5) / (c.ttl - 0.5);
    ctx.fillStyle = `rgba(200,200,210,${0.5 * Math.max(0, a)})`;
    for (let i = 0; i < 7; i += 1) {
      const ang = (i / 7) * Math.PI * 2 + c.x;
      const r = 55 + 18 * Math.sin(i * 2.7 + age);
      ctx.beginPath();
      ctx.arc(c.x + Math.cos(ang) * 40, c.y + Math.sin(ang) * 30, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawExitAndPanel(ctx, level, now, targetTaken) {
  // EXIT: the service door, glowing green once the target is taken.
  const ex = level.exit;
  ctx.save();
  ctx.fillStyle = targetTaken ? '#1f7a3a' : '#3a3a44';
  rr(ctx, ex.x - 34, ex.y - 14, 68, 28, 6);
  ctx.fill();
  ctx.strokeStyle = targetTaken ? '#7fe07f' : '#666';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = targetTaken ? '#c8ffd2' : '#aaa';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(targetTaken ? 'EXIT ★' : 'EXIT', ex.x, ex.y + 5);
  ctx.restore();
  if (targetTaken) {
    ctx.save();
    ctx.strokeStyle = `rgba(127,224,127,${0.5 + 0.3 * Math.sin(now * 4)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, 26 + 4 * Math.sin(now * 4), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  // Security panel: hold E here to kill the cameras for the room.
  const pn = level.panel;
  ctx.save();
  ctx.fillStyle = '#20242e';
  rr(ctx, pn.x - 12, pn.y - 16, 24, 32, 4);
  ctx.fill();
  ctx.strokeStyle = PAL.neonCyan;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = PAL.neonCyan;
  ctx.beginPath();
  ctx.arc(pn.x, pn.y - 4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SEC', pn.x, pn.y + 12);
  ctx.restore();
}

export function drawPickBar(ctx, player) {
  const pk = player.picking;
  if (!pk) return;
  const bw = 320;
  const bx = W / 2 - bw / 2;
  const by = 560;
  ctx.save();
  ctx.fillStyle = 'rgba(10,6,14,0.9)';
  rr(ctx, bx - 14, by - 34, bw + 28, 84, 10);
  ctx.fill();
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PAL.cream;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Cracking: ${pk.loot.name} — release E in the green (${pk.good}/3)`, W / 2, by - 12);
  // Bar with the green window.
  ctx.fillStyle = '#2a1a2e';
  ctx.fillRect(bx, by, bw, 16);
  ctx.fillStyle = PAL.safe;
  const gw = bw * 0.16;
  ctx.fillRect(bx + pk.greenAt * bw - gw / 2, by, gw, 16);
  ctx.fillStyle = '#fff';
  ctx.fillRect(bx + pk.needle * bw - 2, by - 4, 4, 24);
  ctx.restore();
}
