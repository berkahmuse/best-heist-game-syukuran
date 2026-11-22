// The three floors of the Gilded Cage Casino. Each level is one room the thief
// crosses: walls and furniture as cover, shadow pools, guard patrols, sweeping
// cameras, lasers, loot, a security panel, and the exit. Coordinates are game
// pixels; the play area is 1280 x (720 - HUD_H).
import { HUD_H } from './config.js';

function guard(waypoints, pause = 1.2) {
  return { waypoints, pause };
}
function camera(x, y, from, to, speed = 0.5) {
  return { x, y, from, to, speed };
}
function loot(x, y, kind, value, name, locked = false) {
  return { x, y, kind, value, name, locked, taken: false };
}
function laser(x, y, w, h, period = 2.4, onFrac = 0.55, phase = 0) {
  return { x, y, w, h, period, onFrac, phase };
}

export const LEVELS = [
  {
    id: 1,
    name: 'THE GAMING FLOOR',
    target: 'The Duchess Chip',
    targetValue: 6000,
    intro: 'Opening night at the Gilded Cage. Lift the Duchess Chip — a single $1M chip — from the cashier cage, then slip out the service door. The floor is full of cover: slot rows, felt tables, and the dark corners between them.',
    start: { x: 640, y: 660 },
    exit: { x: 90, y: 640 },
    panel: { x: 1180, y: 640 },
    walls: [
      { x: 0, y: HUD_H, w: 1280, h: 18 },
      { x: 0, y: 684, w: 1280, h: 18 },
      { x: 0, y: HUD_H, w: 18, h: 624 },
      { x: 1262, y: HUD_H, w: 18, h: 624 },
      // Slot machine rows (cover you can duck behind).
      { x: 120, y: 170, w: 200, h: 46, kind: 'slots' },
      { x: 960, y: 170, w: 200, h: 46, kind: 'slots' },
      { x: 120, y: 480, w: 200, h: 46, kind: 'slots' },
      { x: 960, y: 480, w: 200, h: 46, kind: 'slots' },
      // Roulette + blackjack felt tables.
      { x: 480, y: 300, w: 150, h: 110, kind: 'roulette' },
      { x: 650, y: 300, w: 150, h: 110, kind: 'table' },
      // Cashier cage (the target sits inside its window).
      { x: 560, y: 96, w: 160, h: 60, kind: 'cage' },
    ],
    shadows: [
      { x: 40, y: 240, w: 170, h: 130 },
      { x: 1070, y: 240, w: 170, h: 130 },
      { x: 330, y: 560, w: 180, h: 90 },
      { x: 770, y: 560, w: 180, h: 90 },
    ],
    guards: [
      guard([[200, 270], [1080, 270], [1080, 460], [200, 460]]),
      guard([[1080, 460], [200, 460], [200, 270], [1080, 270]], 0.8),
      guard([[640, 560], [640, 180]], 1.6),
    ],
    cameras: [
      camera(300, 92, 0.4, Math.PI - 0.5, 0.5),
      camera(980, 668, Math.PI + 0.4, Math.PI * 2 - 0.5, 0.45),
    ],
    lasers: [],
    loot: [
      loot(640, 140, 'gem', 6000, 'The Duchess Chip', true),
      loot(180, 350, 'chip', 1200, 'High-roller chips'),
      loot(1100, 350, 'cash', 900, 'A fat bankroll'),
      loot(560, 470, 'cash', 900, 'Tips jar'),
      loot(720, 470, 'chip', 1200, 'A stack of gold chips'),
    ],
  },
  {
    id: 2,
    name: 'THE HIGH-ROLLER SALON',
    target: "The Peacock Diamond",
    targetValue: 8000,
    intro: 'Upstairs, the salon where whales play for millions. The Peacock Diamond waits in a glass case between the poker tables. Lasers guard the case — cross them only while they are dark.',
    start: { x: 90, y: 640 },
    exit: { x: 1190, y: 200 },
    panel: { x: 90, y: 110 },
    walls: [
      { x: 0, y: HUD_H, w: 1280, h: 18 },
      { x: 0, y: 684, w: 1280, h: 18 },
      { x: 0, y: HUD_H, w: 18, h: 624 },
      { x: 1262, y: HUD_H, w: 18, h: 624 },
      // Poker tables down the middle — two routes around them.
      { x: 300, y: 180, w: 170, h: 100, kind: 'table' },
      { x: 300, y: 440, w: 170, h: 100, kind: 'table' },
      { x: 810, y: 180, w: 170, h: 100, kind: 'table' },
      { x: 810, y: 440, w: 170, h: 100, kind: 'table' },
      // The diamond case on its plinth, centre.
      { x: 605, y: 300, w: 70, h: 90, kind: 'case' },
      // Private bar, top right.
      { x: 1060, y: 96, w: 180, h: 70, kind: 'bar' },
    ],
    shadows: [
      { x: 40, y: 300, w: 150, h: 130 },
      { x: 1090, y: 300, w: 150, h: 130 },
      { x: 560, y: 560, w: 160, h: 90 },
    ],
    guards: [
      guard([[240, 140], [1040, 140], [1040, 600], [240, 600]]),
      guard([[1040, 600], [240, 600], [240, 140], [1040, 140]], 0.9),
      guard([[560, 140], [560, 600]], 1.4),
      guard([[180, 620], [1100, 620]], 1.0),
    ],
    cameras: [
      camera(640, 92, 0.3, Math.PI - 0.3, 0.55),
      camera(90, 668, -0.4, Math.PI - 1.2, 0.5),
      camera(1190, 380, Math.PI * 0.6, Math.PI * 1.4, 0.4),
    ],
    lasers: [
      laser(560, 290, 160, 14, 2.6, 0.5, 0),
      laser(560, 410, 160, 14, 2.6, 0.5, 1.3),
    ],
    loot: [
      loot(640, 398, 'gem', 8000, 'The Peacock Diamond', true),
      loot(385, 300, 'cash', 900, 'A whale\u2019s bankroll'),
      loot(895, 300, 'chip', 1200, 'Platinum chips'),
      loot(385, 420, 'chip', 1200, 'Gold chips'),
      loot(895, 420, 'cash', 900, 'The dealer\u2019s float'),
    ],
  },
  {
    id: 3,
    name: 'THE COUNTING ROOM',
    target: 'The Gilded Cage Crown',
    targetValue: 12000,
    intro: 'The vault below the floor, where the night\u2019s millions are counted. The Crown sits in the vault at the far end behind a laser web and the tightest patrols in the house. Take it, then reach the service elevator — the getaway van is waiting.',
    start: { x: 640, y: 640 },
    exit: { x: 640, y: 100 },
    panel: { x: 1180, y: 120 },
    walls: [
      { x: 0, y: HUD_H, w: 1280, h: 18 },
      { x: 0, y: 684, w: 1280, h: 18 },
      { x: 0, y: HUD_H, w: 18, h: 624 },
      { x: 1262, y: HUD_H, w: 18, h: 624 },
      // Counting tables with cash stacks.
      { x: 200, y: 220, w: 180, h: 90, kind: 'count' },
      { x: 900, y: 220, w: 180, h: 90, kind: 'count' },
      { x: 200, y: 470, w: 180, h: 90, kind: 'count' },
      { x: 900, y: 470, w: 180, h: 90, kind: 'count' },
      // Vault door frame at the top centre.
      { x: 560, y: 96, w: 40, h: 70, kind: 'vault' },
      { x: 680, y: 96, w: 40, h: 70, kind: 'vault' },
    ],
    shadows: [
      { x: 40, y: 330, w: 150, h: 120 },
      { x: 1090, y: 330, w: 150, h: 120 },
      { x: 520, y: 560, w: 240, h: 90 },
    ],
    guards: [
      guard([[160, 160], [1120, 160], [1120, 580], [160, 580]]),
      guard([[1120, 580], [160, 580], [160, 160], [1120, 160]], 0.7),
      guard([[640, 600], [640, 220]], 1.2),
      guard([[320, 380], [960, 380]], 1.0),
      guard([[960, 620], [320, 140]], 1.5),
    ],
    cameras: [
      camera(200, 92, 0.2, Math.PI - 0.4, 0.6),
      camera(1080, 92, 0.4, Math.PI - 0.2, 0.55),
      camera(640, 668, Math.PI + 0.3, Math.PI * 2 - 0.3, 0.5),
    ],
    lasers: [
      laser(480, 180, 320, 12, 2.2, 0.55, 0),
      laser(480, 250, 320, 12, 2.2, 0.55, 1.1),
      laser(480, 320, 320, 12, 2.2, 0.55, 0.5),
    ],
    loot: [
      loot(640, 130, 'crown', 12000, 'The Gilded Cage Crown', true),
      loot(290, 335, 'gold', 2500, 'Gold bars'),
      loot(990, 335, 'gold', 2500, 'Gold bars'),
      loot(290, 585, 'cash', 900, 'Counted cash'),
      loot(990, 585, 'cash', 900, 'Counted cash'),
      loot(640, 380, 'gem', 6000, 'The cashier\u2019s reserve'),
    ],
  },
];
