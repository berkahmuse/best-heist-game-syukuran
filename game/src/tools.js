// The thief's tools, each with a cost so the player has to choose:
//  - Chip toss (click): a clink that pulls guards to a spot. Limited chips.
//  - Smoke bomb (Q): a cloud that blinds every cone for 5 s. One per floor.
//  - EMP pulse (F): kills cameras and lasers for 6 s, but feeds the alarm.
//  - Dealer disguise (C): guards spot you far slower; you move slower and
//    cannot run. Toggle with a short cooldown.
import { TOOLS, ALARM_EMP_COST } from './config.js';
import { distractGuards } from './guards.js';
import { dist } from './random.js';

export function makeTools() {
  return {
    chips: TOOLS.coin.start,
    smoke: TOOLS.smoke.start,
    emp: TOOLS.emp.start,
    disguiseOn: false,
    disguiseCooldown: 0,
    smokeClouds: [], // {x, y, born, ttl}
    empUntil: 0, // game time
    tossed: [], // {x, y, born, ttl} chip markers on the floor
    flash: null, // {text, until} transient message for the HUD
  };
}

export function inSmoke(tools, x, y, now) {
  return tools.smokeClouds.some(
    (c) => now - c.born < c.ttl && dist(x, y, c.x, c.y) < 110,
  );
}

export function empActive(tools, now) {
  return now < tools.empUntil;
}

export function updateTools(tools, dt, now) {
  tools.smokeClouds = tools.smokeClouds.filter((c) => now - c.born < c.ttl);
  tools.tossed = tools.tossed.filter((c) => now - c.born < c.ttl);
  if (tools.disguiseCooldown > 0) tools.disguiseCooldown -= dt;
  if (tools.flash && now > tools.flash.until) tools.flash = null;
}

function flash(tools, text, now, dur = 2.2) {
  tools.flash = { text, until: now + dur };
}

// Click: toss a chip toward the mouse. It lands where clicked (clamped to the
// floor) and every guard in earshot walks over to investigate the clink.
export function tossChip(tools, guards, x, y, now, audio) {
  if (tools.chips <= 0) {
    flash(tools, 'No chips left — find more on the floor', now);
    return false;
  }
  tools.chips -= 1;
  const cx = Math.max(40, Math.min(1240, x));
  const cy = Math.max(90, Math.min(680, y));
  tools.tossed.push({ x: cx, y: cy, born: now, ttl: 6 });
  distractGuards(guards, cx, cy, 320);
  audio.chip();
  return true;
}

export function useSmoke(tools, player, now, audio) {
  if (tools.smoke <= 0) {
    flash(tools, 'No smoke bombs left', now);
    return false;
  }
  tools.smoke -= 1;
  tools.smokeClouds.push({ x: player.x, y: player.y, born: now, ttl: 5 });
  audio.smoke();
  flash(tools, 'Smoke! Cones are blind for 5 s', now);
  return true;
}

export function useEmp(tools, cameras, now, audio, state) {
  if (tools.emp <= 0) {
    flash(tools, 'No EMP pulses left', now);
    return false;
  }
  tools.emp -= 1;
  tools.empUntil = now + 6;
  for (const c of cameras) c.disabledUntil = now + 6;
  state.alarm = Math.min(100, state.alarm + ALARM_EMP_COST);
  audio.emp();
  flash(tools, 'EMP! Cameras and lasers dead for 6 s — alarm +8%', now);
  return true;
}

export function toggleDisguise(tools, player, now, audio) {
  if (tools.disguiseCooldown > 0) return false;
  tools.disguiseOn = !tools.disguiseOn;
  player.disguised = tools.disguiseOn;
  tools.disguiseCooldown = 1;
  audio.coin();
  flash(tools, tools.disguiseOn
    ? 'Dealer disguise on — guards spot you slower, but no running'
    : 'Disguise off', now);
  return true;
}
