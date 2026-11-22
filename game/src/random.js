// Seeded random numbers so a screenshot seed replays the same room.
// Mulberry32: small, fast, deterministic.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick an element from an array with a seeded rng.
export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// Small helpers the geometry code shares.
export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}
