import { it, expect } from "vitest";
import { Room } from "../server/rooms";
import { idleInput } from "../shared/types";
import { platforms, enemies, enemyX } from "../shared/level";

it("percurso completo alcançável usando apenas inputs, com dois finalistas", () => {
  const room = new Room("GB-1234");
  room.join("Ana", "a");
  room.join("Beto", "b");
  room.phase = "racing";
  room.startAt = 0;
  const holds = new Map<string, number>();
  for (
    let tick = 1;
    tick < 60 * 180 && room.snapshot().phase !== "finished";
    tick++
  ) {
    const now = (tick * 1000) / 60;
    for (const [id, m] of room.members) {
      const p = m.player;
      let hold = holds.get(id) ?? 0;
      const floor = platforms.find(
        (q) =>
          !q.moving &&
          p.x >= q.x &&
          p.x <= q.x + q.w &&
          Math.abs(p.y + 22 - q.y) < 3,
      );
      const gap = !!floor && p.x + 95 > floor.x + floor.w;
      const bug = enemies.some(
        (e) =>
          enemyX(e, now) > p.x - 20 && enemyX(e, now) < p.x + 135 && p.y > 490,
      );
      if (p.grounded && hold === 0 && (gap || bug)) hold = 34;
      m.input = {
        ...idleInput(),
        seq: tick,
        right: true,
        run: true,
        jump: hold > 0,
      };
      m.lastInput = now;
      holds.set(id, Math.max(0, hold - 1));
    }
    room.tick(now);
  }
  expect(
    [...room.members.values()].map((m) => ({
      x: m.player.x,
      cp: m.player.checkpoint,
      finished: m.player.finished,
      deaths: m.player.deaths,
    })),
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ cp: 2, finished: expect.any(Number) }),
    ]),
  );
  expect(room.phase).toBe("finished");
});
