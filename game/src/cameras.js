// Wall cameras: fixed mounts that sweep a cone between two angles. Being seen
// by a camera feeds the alarm; an EMP pulse or the room's security panel shuts
// them down for the rest of the room.
import { CAM_VIEW_DIST, CAM_VIEW_HALF } from './config.js';
import { angleDiff, angleTo, dist } from './random.js';
import { losBlocked } from './guards.js';

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    from: def.from,
    to: def.to,
    speed: def.speed,
    angle: def.from,
    dir: 1,
    disabledUntil: 0, // game time; 0 = live
    offForever: false,
  };
}

export function updateCamera(cam, dt, now) {
  if (cam.offForever || now < cam.disabledUntil) return;
  cam.angle += cam.dir * cam.speed * dt;
  if (cam.dir > 0 && cam.angle >= cam.to) { cam.angle = cam.to; cam.dir = -1; }
  if (cam.dir < 0 && cam.angle <= cam.from) { cam.angle = cam.from; cam.dir = 1; }
}

export function cameraSees(cam, player, walls, now, smoke) {
  if (cam.offForever || now < cam.disabledUntil || smoke) return false;
  if (dist(cam.x, cam.y, player.x, player.y) > CAM_VIEW_DIST) return false;
  const ang = angleTo(cam.x, cam.y, player.x, player.y);
  if (Math.abs(angleDiff(ang, cam.angle)) > CAM_VIEW_HALF) return false;
  if (losBlocked(cam.x, cam.y, player.x, player.y, walls)) return false;
  return true;
}

// A laser beam: on for part of its cycle, off for the rest. Crossing while it
// is on feeds the alarm fast.
export function laserOn(laser, now) {
  const t = (now + laser.phase) % laser.period;
  return t < laser.period * laser.onFrac;
}

export function playerInLaser(player, laser) {
  return (
    player.x + 10 > laser.x && player.x - 10 < laser.x + laser.w &&
    player.y + 10 > laser.y && player.y - 10 < laser.y + laser.h
  );
}
