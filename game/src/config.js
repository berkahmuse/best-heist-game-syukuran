// Constants, palette and tool definitions for The Gilded Cage.
// One file, one job: every number the rest of the game shares lives here.
export const W = 1280;
export const H = 720;
export const HUD_H = 64;              // top HUD strip height
export const FLOOR_TOP = HUD_H;       // play area starts below the HUD
export const FLOOR_BOTTOM = 702;
export const TILE = 40;

// Art-deco casino palette: deep plum carpet, emerald felt, brass gold, neon pink.
export const PAL = {
  carpet: '#241128',
  carpetDark: '#1c0d20',
  carpetTile: '#2c1531',
  wall: '#3a1f3f',
  wallEdge: '#d4af37',
  felt: '#0e5c3f',
  feltEdge: '#c9a227',
  feltDark: '#0a4630',
  gold: '#d4af37',
  goldBright: '#f6d95c',
  neonPink: '#ff4d8d',
  neonCyan: '#37e0d8',
  neonPurple: '#b06cff',
  cream: '#f3e6c8',
  ink: '#140a18',
  guardSuit: '#2b2f4a',
  guardCone: 'rgba(255, 77, 77, 0.20)',
  guardConeEdge: 'rgba(255, 77, 77, 0.55)',
  camCone: 'rgba(255, 214, 64, 0.18)',
  camConeEdge: 'rgba(255, 214, 64, 0.5)',
  shadow: 'rgba(8, 4, 12, 0.45)',
  player: '#f6d95c',
  alarm: '#ff3b30',
  safe: '#7fe07f',
};

// Movement speeds (px/s) and detection tuning.
export const SPEED_WALK = 205;
export const SPEED_SNEAK = 115;
export const SPEED_RUN = 300;
export const SPEED_CARRY_PENALTY = 14; // px/s lost per loot item carried
export const SPEED_DISGUISE = 150;

export const GUARD_SPEED_PATROL = 78;
export const GUARD_SPEED_CHASE = 205;
export const GUARD_SPEED_INVESTIGATE = 130;
export const GUARD_VIEW_DIST = 250;
export const GUARD_VIEW_HALF = 0.52;   // radians either side of facing
export const GUARD_SNEAK_FACTOR = 0.62; // sneak shrinks the view distance
export const GUARD_SHADOW_FACTOR = 0.45; // hiding in a shadow pool shrinks it
export const GUARD_DISGUISE_FACTOR = 0.45; // dealer disguise shrinks it
export const CAM_VIEW_DIST = 300;
export const CAM_VIEW_HALF = 0.42;

// Alarm: +rate while seen (per second), decay while unseen.
export const ALARM_SEEN_RATE = 34;
export const ALARM_CAM_RATE = 26;
export const ALARM_LASER_RATE = 22;
export const ALARM_DECAY = 7;
export const ALARM_EMP_COST = 8;       // EMP pulse feeds the alarm a little
export const ALARM_BAD_PICK = 6;        // missing the safe-crack green zone

// Tools: what the thief carries, and what each one costs.
export const TOOLS = {
  coin: { key: 'click', name: 'Chip toss', start: 4, desc: 'Click to toss a chip; guards investigate the clink.' },
  smoke: { key: 'Q', name: 'Smoke bomb', start: 1, desc: 'Q: a smoke cloud that blinds every cone for 5 s.' },
  emp: { key: 'F', name: 'EMP pulse', start: 1, desc: 'F: kill cameras and lasers for 6 s, but it feeds the alarm +8%.' },
  disguise: { key: 'C', name: 'Dealer disguise', start: 1, desc: 'C: toggle the dealer uniform; guards spot you far slower.' },
};

// Loot values in dollars.
export const LOOT_VALUE = { chip: 1200, cash: 900, gold: 2500, gem: 6000, crown: 12000, art: 1500 };

// Safe-crack: hold E, the needle sweeps; release inside the green window.
export const PICK_SWEEP_TIME = 1.6;     // seconds for one full needle sweep
export const PICK_GREEN = 0.16;         // fraction of the bar that is green
export const PICK_NEED = 3;             // good releases to crack a case

// Score-screen ratings by final alarm.
export function ratingFor(alarm, timeSec) {
  if (alarm < 25) return 'GHOST — nobody ever knew you were there';
  if (alarm < 55) return 'SHADOW — a whisper on the casino floor';
  if (alarm < 85) return 'LOUD — the house knows your name';
  return 'MIRACLE — you walked out of a burning casino';
}
