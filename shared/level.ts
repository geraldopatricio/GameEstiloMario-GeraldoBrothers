export const LEVEL = {
  name: "Campos de Geraldo",
  width: 5400,
  height: 800,
  finish: 5160,
};
export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  moving?: boolean;
}
export const platforms: Platform[] = [
  { x: 0, y: 580, w: 850, h: 220 },
  { x: 990, y: 580, w: 660, h: 220 },
  { x: 1800, y: 580, w: 660, h: 220 },
  { x: 2620, y: 580, w: 680, h: 220 },
  { x: 3480, y: 580, w: 640, h: 220 },
  { x: 4300, y: 580, w: 1100, h: 220 },
  { x: 420, y: 464, w: 160, h: 26 },
  { x: 720, y: 375, w: 160, h: 26 },
  { x: 1170, y: 455, w: 170, h: 26 },
  { x: 1530, y: 430, w: 120, h: 26 },
  { x: 1960, y: 454, w: 140, h: 26 },
  { x: 2200, y: 365, w: 160, h: 26 },
  { x: 2770, y: 452, w: 170, h: 26 },
  { x: 3090, y: 350, w: 150, h: 26 },
  { x: 3630, y: 450, w: 180, h: 26 },
  { x: 3900, y: 350, w: 150, h: 26 },
  { x: 4560, y: 448, w: 160, h: 26 },
  { x: 850, y: 505, w: 125, h: 24, moving: true },
  { x: 3300, y: 490, w: 125, h: 24, moving: true },
  { x: 4100, y: 490, w: 130, h: 24, moving: true },
];
export const platformAt = (p: Platform, time: number): Platform => ({
  ...p,
  x: p.x + (p.moving ? Math.sin(time / 900) * 45 : 0),
});
export const checkpoints = [
  { x: 100, y: 550 },
  { x: 1860, y: 550 },
  { x: 3530, y: 550 },
];
export const crystals = Array.from({ length: 38 }, (_, id) => ({
  id,
  x: 280 + id * 124,
  y: id % 4 === 0 ? 410 : 530,
}));
export const enemies = [
  { x: 1300, range: 140 },
  { x: 2320, range: 90 },
  { x: 2900, range: 100 },
  { x: 3840, range: 140 },
  { x: 4680, range: 140 },
];
export const enemyX = (e: (typeof enemies)[number], time: number) =>
  e.x + Math.sin(time / 650) * e.range;
// Ordered route gates allow progress to extend to vertical/curved courses.
export const route = [
  { x: 100, y: 550 },
  { x: 850, y: 550 },
  { x: 1860, y: 550 },
  { x: 2620, y: 550 },
  { x: 3530, y: 550 },
  { x: 4300, y: 550 },
  { x: 5160, y: 550 },
];
export function routeProgress(x: number, y: number) {
  let best = Infinity,
    progress = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i],
      b = route[i + 1],
      dx = b.x - a.x,
      dy = b.y - a.y;
    const t = Math.max(
      0,
      Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy)),
    );
    const d = Math.hypot(x - a.x - t * dx, y - a.y - t * dy);
    if (d < best) {
      best = d;
      progress = (i + t) / (route.length - 1);
    }
  }
  return progress;
}
