// Deterministic screenshot poses: ?shot=start|play|alarm|vault&seed=N places the
// real game in a composed state so the screenshots show the room, the guards
// with their vision cones, the cameras, a loot target and the alarm meter in
// one frame. These are the same live objects the player meets — only positioned.
export function applyShot(params, state, loadLevel, startGame) {
  const shot = params.get('shot');
  if (!shot) return;
  const seed = Number(params.get('seed') || '1') || 1;

  if (shot === 'start') {
    state.screen = 'title';
    return;
  }
  if (shot === 'play') {
    startGame();
    state.screen = 'play';
    state.frozen = true;
    // Vesper mid-floor between the slot rows, cones sweeping past, cameras live.
    state.player.x = 560;
    state.player.y = 430;
    state.player.facing = -Math.PI / 2;
    state.guards[0].x = 420;
    state.guards[0].y = 300;
    state.guards[0].angle = Math.PI / 4;
    state.guards[1].x = 980;
    state.guards[1].y = 480;
    state.guards[1].angle = Math.PI * 0.85;
    state.guards[2].x = 640;
    state.guards[2].y = 560;
    state.guards[2].angle = -Math.PI / 2;
    state.cameras[0].angle = 1.1;
    state.cameras[1].angle = Math.PI * 1.6;
    state.alarm = 32;
    state.haul = 2100;
    state.level.loot[1].taken = true; // high-roller chips already lifted
    state.tools.tossed.push({ x: 700, y: 480, born: 0, ttl: 6 });
    state.tools.chips = 3;
    return;
  }
  if (shot === 'alarm') {
    startGame();
    state.screen = 'play';
    state.frozen = true;
    // Caught in a cone at close range: alarm high, guard alerted, camera red.
    state.player.x = 700;
    state.player.y = 260;
    state.player.facing = Math.PI;
    state.guards[0].x = 640;
    state.guards[0].y = 235;
    state.guards[0].angle = Math.PI / 2;
    state.guards[0].state = 'investigate';
    state.guards[0].suspicion = 0.9;
    state.guards[0].investigateX = 700;
    state.guards[0].investigateY = 260;
    state.guards[1].x = 1040;
    state.guards[1].y = 520;
    state.guards[1].angle = Math.PI * 1.1;
    state.cameras[0].angle = 1.35;
    state.cameras[1].angle = Math.PI * 1.5;
    state.alarm = 78;
    state.haul = 1200;
    state.level.loot[2].taken = true;
    return;
  }
  if (shot === 'vault') {
    // Floor 3: the Crown taken, Vesper at the service elevator — the getaway.
    startGame();
    loadLevel(2);
    state.screen = 'play';
    state.frozen = true;
    state.level.loot[0].taken = true; // The Gilded Cage Crown
    state.level.loot[1].taken = true;
    state.level.loot[2].taken = true;
    state.haul = 22400;
    state.alarm = 18;
    state.player.x = 640;
    state.player.y = 160;
    state.player.facing = -Math.PI / 2;
    state.guards[0].x = 300;
    state.guards[0].y = 300;
    state.guards[0].angle = Math.PI * 0.75;
    state.guards[2].x = 640;
    state.guards[2].y = 420;
    state.guards[2].angle = -Math.PI / 2;
    state.guards[4].x = 900;
    state.guards[4].y = 200;
    state.guards[4].angle = Math.PI * 0.6;
    state.cameras[0].angle = 0.9;
    state.cameras[1].angle = Math.PI * 0.8;
    state.tools.smokeClouds.push({ x: 900, y: 420, born: 0, ttl: 5 });
    return;
  }
  void seed;
}
