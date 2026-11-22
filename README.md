[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/berkahmuse/best-heist-game-syukuran/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/berkahmuse/best-heist-game-syukuran/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

# The Gilded Cage — a casino heist

A top-down stealth heist game for the [best heist game competition](https://make.fun/c/best-heist-game-20261122-0559) on make.fun. You are Vesper, a thief working opening night at the Gilded Cage Casino, across three floors — the Gaming Floor, the High-Roller Salon, and the Counting Room — to steal the Duchess Chip, the Peacock Diamond, and the Gilded Cage Crown, then vanish through the service elevator before the alarm hits 100%.

## How to play

- **WASD / arrow keys** — move
- **Shift** — sneak (slower, much harder to spot)
- **Space** — run (fast, but loud: nearby guards come to look)
- **Click** — toss a chip to distract a guard (limited per floor)
- **Q** — smoke bomb: blinds every vision cone for 5 s
- **F** — EMP pulse: kills cameras and lasers for 6 s, but feeds the alarm +8%
- **C** — dealer disguise: guards spot you far slower, but you cannot run
- **Hold E** — crack a locked case (release the needle in the green, 3 times) or kill the cameras at a SEC panel
- **R** — restart the floor · **M** — mute

Guards patrol with vision cones and grow suspicious, investigate, then chase. Cameras sweep the room. Laser grids blink on and off — cross only while dark. Being seen feeds the **alarm meter**; hide in shadow pools or break line of sight to let it fall. At 100% you are busted. Every piece of loot slows you down a little, so greed has a price.

## Run it

```sh
node serve.ts --port 8083
# open http://localhost:8083
```

No build step, no network requests — plain static files under `game/`, all art drawn in code and all sound synthesized with WebAudio.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `game/index.html` — the page
- `game/src/config.js` — constants, palette, speeds, alarm and tool tuning
- `game/src/random.js` — seeded RNG and geometry helpers
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — synthesized jazz loop and sound effects (WebAudio)
- `game/src/levels.js` — the three casino floors: walls, furniture, patrols, cameras, lasers, loot
- `game/src/guards.js` — guard AI (patrol / suspicious / investigate / chase) and line of sight
- `game/src/cameras.js` — sweeping cameras and blinking lasers
- `game/src/player.js` — the thief: movement, noise, loot weight, safe-crack timing
- `game/src/tools.js` — chip toss, smoke bomb, EMP pulse, dealer disguise
- `game/src/render.js` — all canvas drawing: the casino, its people, its danger
- `game/src/hud.js` — HUD, alarm meter, title / intro / busted / getaway screens
- `game/src/shots.js` — deterministic screenshot poses (`?shot=…&seed=…`)
- `game/src/main.js` — game loop, detection, loot, panel, exit, win / busted flow
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
