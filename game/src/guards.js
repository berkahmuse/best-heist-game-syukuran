// Guard AI: patrol, suspicion, investigate, chase. A guard's suspicion rises
// while the thief is inside its vision cone and falls when the thief is hidden.
// At full suspicion the guard chases; catching the thief busts the heist.
import {
  GUARD_SPEED_PATROL, GUARD_SPEED_CHASE, GUARD_SPEED_INVESTIGATE,
  GUARD_VIEW_DIST, GUARD_VIEW_HALF, GUARD_SNEAK_FACTOR, GUARD_SHADOW_FACTOR,
  GUARD_DISGUISE_FACTOR,
} from './config.js';
import { angleDiff, angleTo, clamp, dist } from './random.js';

// Line-of-sight: true when no wall rect blocks the segment A->B.
export function losBlocked(ax, ay, bx, by, walls) {
  for (const w of walls) {
    if (segmentRect(ax, ay, bx, by, w)) return true;
  }
  return false;
}

function segmentRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function pointInWalls(x, y, walls) {
  return walls.some((w) => pointInRect(x, y, w));
}

// How visible the thief is to this guard right now: 0 (invisible) to 1.
export function visibility(guard, player, walls, inShadow, smoke) {
  if (smoke) return 0;
  const d = dist(guard.x, guard.y, player.x, player.y);
  let viewDist = GUARD_VIEW_DIST;
  if (player.sneaking) viewDist *= GUARD_SNEAK_FACTOR;
  if (inShadow) viewDist *= GUARD_SHADOW_FACTOR;
  if (player.disguised) viewDist *= GUARD_DISGUISE_FACTOR;
  if (d > viewDist) return 0;
  const ang = angleTo(guard.x, guard.y, player.x, player.y);
  if (Math.abs(angleDiff(ang, guard.angle)) > GUARD_VIEW_HALF) return 0;
  if (losBlocked(guard.x, guard.y, player.x, player.y, walls)) return 0;
  // Closer = more visible.
  return clamp(1.25 - d / viewDist, 0.25, 1);
}

export function makeGuard(def) {
  const [sx, sy] = def.waypoints[0];
  return {
    waypoints: def.waypoints,
    pause: def.pause,
    x: sx,
    y: sy,
    angle: 0,
    wpIndex: 1,
    waitT: 0,
    state: 'patrol', // patrol | suspicious | investigate | chase
    suspicion: 0,    // 0..1
    investigateX: 0,
    investigateY: 0,
    searchT: 0,
    stepT: 0,
  };
}

export function updateGuard(g, dt, player, walls, inShadow, smoke, onCaught, onSpotted) {
  const seen = visibility(g, player, walls, inShadow, smoke);
  if (seen > 0) {
    g.suspicion = clamp(g.suspicion + seen * dt * 1.15, 0, 1);
    if (g.state === 'patrol' && g.suspicion > 0.35) {
      g.state = 'suspicious';
      onSpotted();
    }
    if (g.suspicion >= 1 && g.state !== 'chase') {
      g.state = 'chase';
      onSpotted();
    }
  } else {
    g.suspicion = clamp(g.suspicion - dt * 0.25, 0, 1);
    if (g.state === 'suspicious' && g.suspicion <= 0.05) g.state = 'patrol';
  }

  // Movement per state.
  if (g.state === 'chase') {
    moveToward(g, player.x, player.y, GUARD_SPEED_CHASE, dt);
    g.angle = angleTo(g.x, g.y, player.x, player.y);
    if (dist(g.x, g.y, player.x, player.y) < 26) onCaught();
    if (seen === 0) {
      // Lost sight: go look where the thief was last seen.
      g.state = 'investigate';
      g.investigateX = player.x;
      g.investigateY = player.y;
      g.searchT = 3;
    }
  } else if (g.state === 'investigate' || g.state === 'suspicious') {
    if (g.state === 'investigate') {
      const arrived = moveToward(g, g.investigateX, g.investigateY, GUARD_SPEED_INVESTIGATE, dt);
      g.angle = angleTo(g.x, g.y, g.investigateX, g.investigateY);
      if (arrived) {
        g.searchT -= dt;
        g.angle += dt * 1.8; // look around
        if (g.searchT <= 0) { g.state = 'patrol'; g.suspicion = 0; }
      }
    } else {
      // Suspicious: stop and stare toward the thief's last direction.
      g.angle = angleTo(g.x, g.y, player.x, player.y);
    }
  } else {
    // Patrol: walk the loop, pausing at each waypoint.
    if (g.waitT > 0) {
      g.waitT -= dt;
    } else {
      const wp = g.waypoints[g.wpIndex];
      const arrived = moveToward(g, wp[0], wp[1], GUARD_SPEED_PATROL, dt);
      if (arrived) {
        g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
        g.waitT = g.pause;
      }
    }
  }
  // Footstep timing for the audio.
  g.stepT -= dt;
  if (g.stepT <= 0 && (g.state === 'patrol' || g.state === 'investigate')) g.stepT = 0.55;
}

// Move toward a point; returns true when arrived (within 4 px).
function moveToward(g, tx, ty, speed, dt) {
  const d = dist(g.x, g.y, tx, ty);
  if (d < 4) return true;
  const step = Math.min(d, speed * dt);
  g.x += ((tx - g.x) / d) * step;
  g.y += ((ty - g.y) / d) * step;
  if (g.state === 'patrol' || g.state === 'investigate') {
    g.angle = angleTo(g.x, g.y, tx, ty);
  }
  return d - step < 4;
}

// A tossed chip lands: guards in earshot walk over to investigate it.
export function distractGuards(guards, x, y, radius) {
  for (const g of guards) {
    if (g.state === 'chase') continue;
    if (dist(g.x, g.y, x, y) < radius) {
      g.state = 'investigate';
      g.investigateX = x;
      g.investigateY = y;
      g.searchT = 2.5;
    }
  }
}
