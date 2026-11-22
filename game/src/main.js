// The Gilded Cage — a casino heist. Main loop, game state, detection, loot,
// the security panel, the exit, and the win / busted flow.
import { W, H, HUD_H, ALARM_SEEN_RATE, ALARM_CAM_RATE, ALARM_LASER_RATE, ALARM_DECAY, ALARM_BAD_PICK } from './config.js';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { LEVELS } from './levels.js';
import { makeGuard, updateGuard, pointInRect } from './guards.js';
import { makeCamera, updateCamera, cameraSees, laserOn, playerInLaser } from './cameras.js';
import { makePlayer, updatePlayer, startPick, updatePick, cancelPick } from './player.js';
import { makeTools, updateTools, tossChip, useSmoke, useEmp, toggleDisguise, inSmoke, empActive } from './tools.js';
import { drawFloor, drawLoot, drawLasers, drawCameras, drawGuards, drawPlayer, drawToolsLayer, drawExitAndPanel, drawPickBar } from './render.js';
import { drawHud, drawTitle, drawIntro, drawBusted, drawWin, drawFloorClear } from './hud.js';
import { applyShot } from './shots.js';
import { dist } from './random.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const audio = new AudioEngine();

const state = {
  screen: 'title', // title | intro | play | busted | floorclear | win
  levelIndex: 0,
  level: null,
  player: null,
  guards: [],
  cameras: [],
  tools: makeTools(),
  alarm: 0,
  haul: 0,
  timeSec: 0,
  now: 0,
  frozen: false, // screenshot poses freeze the simulation
  prompt: null,
  spottedFlash: 0,
};

function loadLevel(idx) {
  const def = LEVELS[idx];
  state.levelIndex = idx;
  state.level = {
    ...def,
    walls: def.walls.map((w) => ({ ...w })),
    shadows: def.shadows.map((s) => ({ ...s })),
    loot: def.loot.map((l) => ({ ...l })),
    lasers: def.lasers.map((l) => ({ ...l })),
  };
  state.player = makePlayer(def.start.x, def.start.y);
  state.guards = def.guards.map(makeGuard);
  state.cameras = def.cameras.map(makeCamera);
  state.tools = makeTools();
  state.alarm = Math.max(0, state.alarm - 15); // a little calm between floors
  state.prompt = null;
}

function startGame() {
  state.haul = 0;
  state.timeSec = 0;
  state.alarm = 0;
  loadLevel(0);
}

function inShadow(p) {
  return state.level.shadows.some((s) => pointInRect(p.x, p.y, s));
}

function targetLoot() {
  return state.level.loot.find((l) => l.name === state.level.target);
}

function nearestLoot(maxD) {
  let best = null;
  let bestD = maxD;
  for (const l of state.level.loot) {
    if (l.taken) continue;
    const d = dist(state.player.x, state.player.y, l.x, l.y);
    if (d < bestD) { best = l; bestD = d; }
  }
  return best;
}

function update(dt) {
  state.now += dt;
  if (state.screen !== 'play' || state.frozen) {
    input.endFrame();
    return;
  }
  state.timeSec += dt;
  const p = state.player;
  const t = state.tools;
  const now = state.now;

  updateTools(t, dt, now);
  const smokeHere = inSmoke(t, p.x, p.y, now);
  const emp = empActive(t, now);

  // --- Input: tools ---
  if (input.clicked) {
    tossChip(t, state.guards, input.clicked.x, input.clicked.y, now, audio);
  }
  if (input.wasPressed('KeyQ')) useSmoke(t, p, now, audio);
  if (input.wasPressed('KeyF')) useEmp(t, state.cameras, now, audio, state);
  if (input.wasPressed('KeyC')) toggleDisguise(t, p, now, audio);
  if (input.wasPressed('KeyM')) audio.toggleMute();

  // --- Player movement (paused while cracking a case) ---
  if (!p.picking) updatePlayer(p, input, dt, state.level.walls);
  if (p.moving && p.stepAcc === 0) audio.step(p.running);

  // --- Loot pickup / safe-crack ---
  const near = nearestLoot(34);
  const nearPanel = dist(p.x, p.y, state.level.panel.x, state.level.panel.y) < 40;
  const panelLive = state.cameras.some((c) => !c.offForever);
  state.prompt = null;
  if (p.picking) {
    const res = updatePick(p, dt, input.down('KeyE'));
    if (res && res.cracked) {
      takeLoot(res.loot);
      audio.loot();
    } else if (res && res.good) {
      audio.pickGood();
    } else if (res && !res.good) {
      state.alarm = Math.min(100, state.alarm + ALARM_BAD_PICK);
      audio.pickBad();
    }
  } else if (near) {
    if (near.locked) {
      state.prompt = 'HOLD E — crack the case (release in the green!)';
      if (input.down('KeyE')) startPick(p, near);
    } else {
      state.prompt = `Press E — lift ${near.name}`;
      if (input.wasPressed('KeyE')) {
        takeLoot(near);
        audio.loot();
      }
    }
  } else if (nearPanel && panelLive) {
    state.prompt = 'Hold E — kill the cameras (SEC panel)';
    if (input.down('KeyE')) {
      state.cameras.forEach((c) => { c.offForever = true; });
      audio.pickGood();
      state.prompt = 'Cameras down for this floor';
    }
  }

  // --- Guards ---
  const shadow = inShadow(p);
  for (const g of state.guards) {
    updateGuard(g, dt, p, state.level.walls, shadow, smokeHere, onCaught, onSpotted);
  }

  // --- Cameras ---
  let seenByCam = false;
  for (const c of state.cameras) {
    updateCamera(c, dt, now);
    if (cameraSees(c, p, state.level.walls, now, smokeHere)) seenByCam = true;
  }

  // --- Lasers ---
  let inLaser = false;
  if (!emp) {
    for (const l of state.level.lasers) {
      if (laserOn(l, now) && playerInLaser(p, l)) { inLaser = true; break; }
    }
  }

  // --- Alarm ---
  const anyGuardSees = state.guards.some((g) => g.suspicion > 0.6 && g.state !== 'patrol');
  let delta = 0;
  if (anyGuardSees) delta += ALARM_SEEN_RATE;
  if (seenByCam) delta += ALARM_CAM_RATE;
  if (inLaser) delta += ALARM_LASER_RATE;
  if (delta > 0) {
    state.alarm = Math.min(100, state.alarm + delta * dt);
    if (state.alarm >= 100) { onBusted(); return; }
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
  }

  // --- Running noise pulls nearby guards ---
  if (p.noise > 0.7) {
    for (const g of state.guards) {
      if (g.state === 'patrol' && dist(g.x, g.y, p.x, p.y) < 190) {
        g.state = 'investigate';
        g.investigateX = p.x;
        g.investigateY = p.y;
        g.searchT = 2;
      }
    }
  }

  // --- Exit: only once the floor's target is taken ---
  const tgt = targetLoot();
  if (tgt && tgt.taken && dist(p.x, p.y, state.level.exit.x, state.level.exit.y) < 34) {
    if (state.levelIndex === LEVELS.length - 1) {
      state.screen = 'win';
      audio.win();
    } else {
      state.screen = 'floorclear';
      audio.win();
    }
  }

  if (input.wasPressed('KeyR')) {
    loadLevel(state.levelIndex);
  }
  input.endFrame();
}

function takeLoot(l) {
  l.taken = true;
  state.haul += l.value;
  state.player.carry += 1;
}

function onSpotted() {
  audio.spotted();
  state.spottedFlash = 0.4;
}

function onCaught() {
  state.screen = 'busted';
  audio.busted();
}

function onBusted() {
  state.screen = 'busted';
  audio.busted();
}

function render() {
  ctx.clearRect(0, 0, W, H);
  if (state.screen === 'title') {
    drawTitle(ctx, state.now);
    return;
  }
  if (state.screen === 'intro') {
    drawIntro(ctx, state.level);
    return;
  }
  if (!state.level) return;
  const now = state.now;
  const smokeHere = inSmoke(state.tools, state.player.x, state.player.y, now);
  drawFloor(ctx, state.level, now);
  drawLasers(ctx, state.level.lasers, now, empActive(state.tools, now));
  drawLoot(ctx, state.level, now);
  drawCameras(ctx, state.cameras, state.player, state.level.walls, now, smokeHere);
  drawGuards(ctx, state.guards, state.player, state.level.walls, smokeHere);
  drawExitAndPanel(ctx, state.level, now, !!targetLoot()?.taken);
  drawToolsLayer(ctx, state.tools, now);
  drawPlayer(ctx, state.player, now);
  drawPickBar(ctx, state.player);
  drawHud(ctx, state);
  if (state.spottedFlash > 0) {
    ctx.fillStyle = `rgba(255,59,48,${state.spottedFlash * 0.25})`;
    ctx.fillRect(0, HUD_H, W, H - HUD_H);
  }
  if (state.screen === 'busted') drawBusted(ctx, state);
  if (state.screen === 'floorclear') drawFloorClear(ctx, state);
  if (state.screen === 'win') drawWin(ctx, state);
}

// Screen transitions on Enter / R.
function handleKeys() {
  if (state.screen === 'title' && (input.wasPressed('Enter') || input.wasPressed('NumpadEnter'))) {
    audio.ensure();
    audio.startMusic();
    startGame();
    state.screen = 'intro';
  } else if (state.screen === 'intro' && (input.wasPressed('Enter') || input.wasPressed('NumpadEnter'))) {
    state.screen = 'play';
  } else if (state.screen === 'busted' && input.wasPressed('KeyR')) {
    loadLevel(state.levelIndex);
    state.screen = 'play';
  } else if (state.screen === 'floorclear' && (input.wasPressed('Enter') || input.wasPressed('NumpadEnter'))) {
    loadLevel(state.levelIndex + 1);
    state.screen = 'intro';
  } else if (state.screen === 'win' && (input.wasPressed('Enter') || input.wasPressed('NumpadEnter'))) {
    state.screen = 'title';
  }
  if (input.wasPressed('KeyM')) audio.toggleMute();
}

let last = performance.now();
function frame(nowMs) {
  const dt = Math.min(0.05, (nowMs - last) / 1000);
  last = nowMs;
  if (state.spottedFlash > 0) state.spottedFlash -= dt;
  handleKeys();
  update(dt);
  render();
  requestAnimationFrame(frame);
}

// Boot: load floor 1 so the title screen has a room behind it, then apply a
// deterministic screenshot pose if the URL asks for one.
loadLevel(0);
state.screen = 'title';
applyShot(new URLSearchParams(location.search), state, loadLevel, startGame);
// Exposed for automated play-testing only (read the live state, drive nothing).
window.__gilded = state;
requestAnimationFrame(frame);
