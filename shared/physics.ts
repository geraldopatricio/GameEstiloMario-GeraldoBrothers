import {
  checkpoints,
  crystals,
  enemies,
  enemyX,
  LEVEL,
  platforms,
  platformAt,
  routeProgress,
} from "./level";
import type { Input, Player } from "./types";
export const DT = 1 / 60;
export function makePlayer(id: string, name: string, color: number): Player {
  return {
    id,
    name,
    color,
    ready: false,
    loaded: false,
    connected: true,
    x: 100 + color * 42,
    y: 550,
    vx: 0,
    vy: 0,
    grounded: false,
    coyote: 0,
    buffer: 0,
    jumpHeld: false,
    checkpoint: 0,
    crystals: 0,
    collected: [],
    deaths: 0,
    finished: null,
    progress: 0,
    ack: 0,
    invulnerable: 0,
    direction: 1,
  };
}
export function respawn(p: Player) {
  const cp = checkpoints[p.checkpoint];
  p.x = cp.x;
  p.y = cp.y;
  p.vx = 0;
  p.vy = 0;
  p.deaths++;
  p.invulnerable = 1.5;
  p.grounded = false;
}
export function step(
  p: Player,
  input: Input,
  time: number,
  authoritative = true,
) {
  if (p.finished !== null) return;
  const dt = DT,
    oldY = p.y;
  p.invulnerable = Math.max(0, p.invulnerable - dt);
  p.coyote = p.grounded ? 0.11 : Math.max(0, p.coyote - dt);
  p.buffer = Math.max(0, p.buffer - dt);
  if (input.jump && !p.jumpHeld) p.buffer = 0.12;
  if (!input.jump && p.jumpHeld && p.vy < -210) p.vy = -210;
  p.jumpHeld = input.jump;
  if (p.buffer > 0 && p.coyote > 0) {
    p.vy = -590;
    p.grounded = false;
    p.coyote = 0;
    p.buffer = 0;
  }
  const axis = Number(input.right) - Number(input.left),
    max = input.run ? 370 : 255;
  const target = axis * max,
    accel = (axis ? 1900 : 2400) * (p.grounded ? 1 : 0.65) * dt;
  p.vx += Math.max(-accel, Math.min(accel, target - p.vx));
  if (axis) p.direction = axis;
  p.vy = Math.min(950, p.vy + 1650 * dt);
  p.x = Math.max(16, Math.min(LEVEL.width - 16, p.x + p.vx * dt));
  p.y += p.vy * dt;
  p.grounded = false;
  for (const source of platforms) {
    const q = platformAt(source, time);
    if (
      p.x + 15 > q.x &&
      p.x - 15 < q.x + q.w &&
      oldY + 22 <= q.y + 2 &&
      p.y + 22 >= q.y &&
      p.vy >= 0
    ) {
      p.y = q.y - 22;
      p.vy = 0;
      p.grounded = true;
      if (source.moving) p.x += q.x - platformAt(source, time - dt * 1000).x;
    }
  }
  if (authoritative) {
    if (p.y > LEVEL.height + 80) respawn(p);
    for (const e of enemies)
      if (
        p.invulnerable <= 0 &&
        Math.abs(p.x - enemyX(e, time)) < 31 &&
        Math.abs(p.y - 559) < 34
      ) {
        if (p.vy > 100 && oldY + 22 < 548) {
          p.vy = -400;
          p.invulnerable = 0.3;
        } else respawn(p);
      }
    checkpoints.forEach((cp, i) => {
      if (
        i > p.checkpoint &&
        Math.abs(p.x - cp.x) < 48 &&
        Math.abs(p.y - cp.y) < 350
      )
        p.checkpoint = i;
    });
    for (const c of crystals)
      if (
        !p.collected.includes(c.id) &&
        Math.hypot(p.x - c.x, p.y - c.y) < 38
      ) {
        p.collected.push(c.id);
        p.crystals++;
      }
  }
  p.progress = routeProgress(p.x, p.y);
  p.ack = input.seq;
}
