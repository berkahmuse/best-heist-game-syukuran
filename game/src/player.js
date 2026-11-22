// The thief: movement, sneaking, running noise, loot weight, disguise, and the
// safe-crack timing bar. Collision is circle-vs-rect against the room's walls.
import {
  SPEED_WALK, SPEED_SNEAK, SPEED_RUN, SPEED_CARRY_PENALTY, SPEED_DISGUISE,
  PICK_SWEEP_TIME, PICK_GREEN, PICK_NEED,
} from './config.js';
import { clamp } from './random.js';
import { pointInWalls } from './guards.js';

export function makePlayer(x, y) {
  return {
    x,
    y,
    r: 13,
    facing: -Math.PI / 2,
    sneaking: false,
    running: false,
    disguised: false,
    moving: false,
    noise: 0, // 0..1, how loud the thief is right now
    stepAcc: 0,
    carry: 0, // loot items carried (slows the thief)
    // Safe-crack state.
    picking: null, // { loot, needle, dir, good, bad }
  };
}

export function updatePlayer(p, input, dt, walls) {
  const mv = input.moveVector();
  p.sneaking = input.down('ShiftLeft') || input.down('ShiftRight');
  p.running = (input.down('KeyR') || input.down('Space')) && !p.sneaking && !p.disguised;
  let speed = p.sneaking ? SPEED_SNEAK : p.running ? SPEED_RUN : SPEED_WALK;
  if (p.disguised) speed = Math.min(speed, SPEED_DISGUISE);
  speed = Math.max(70, speed - p.carry * SPEED_CARRY_PENALTY);

  p.moving = mv.x !== 0 || mv.y !== 0;
  if (p.moving) {
    p.facing = Math.atan2(mv.y, mv.x);
    tryMove(p, mv.x * speed * dt, 0, walls);
    tryMove(p, 0, mv.y * speed * dt, walls);
  }
  p.noise = p.moving ? (p.running ? 1 : p.sneaking ? 0.12 : 0.45) : 0;
  // Footstep ticks for the audio engine.
  if (p.moving) {
    p.stepAcc += dt * (p.running ? 2.6 : 1.6);
    if (p.stepAcc >= 1) p.stepAcc = 0;
  } else {
    p.stepAcc = 0;
  }
}

function tryMove(p, dx, dy, walls) {
  const nx = p.x + dx;
  const ny = p.y + dy;
  if (!circleHitsWall(nx, ny, p.r, walls)) {
    p.x = nx;
    p.y = ny;
  }
}

function circleHitsWall(x, y, r, walls) {
  for (const w of walls) {
    const cx = clamp(x, w.x, w.x + w.w);
    const cy = clamp(y, w.y, w.y + w.h);
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

// --- Safe-crack: hold E near a locked case; the needle sweeps and the player
// releases inside the green window. Three good releases crack it open.
export function startPick(p, loot) {
  p.picking = { loot, needle: 0, dir: 1, good: 0, bad: 0, wasHeld: false, greenAt: 0.3 + Math.random() * 0.4 };
}

export function updatePick(p, dt, holdingE) {
  const pk = p.picking;
  if (!pk) return null;
  if (holdingE) {
    // Held: the needle sweeps; nothing is judged yet.
    pk.wasHeld = true;
    pk.needle += (pk.dir * dt) / PICK_SWEEP_TIME;
    if (pk.needle >= 1) { pk.needle = 1; pk.dir = -1; }
    if (pk.needle <= 0) { pk.needle = 0; pk.dir = 1; }
    return null;
  }
  // Released: judge exactly once, on the hold-to-release transition.
  if (!pk.wasHeld) return null;
  pk.wasHeld = false;
  const inGreen = Math.abs(pk.needle - pk.greenAt) < PICK_GREEN / 2;
  if (inGreen) {
    pk.good += 1;
    pk.greenAt = 0.2 + Math.random() * 0.6;
    if (pk.good >= PICK_NEED) {
      const loot = pk.loot;
      p.picking = null;
      return { cracked: true, loot };
    }
    return { good: true, goodCount: pk.good };
  }
  pk.bad += 1;
  return { good: false, badCount: pk.bad };
}

export function cancelPick(p) {
  p.picking = null;
}
