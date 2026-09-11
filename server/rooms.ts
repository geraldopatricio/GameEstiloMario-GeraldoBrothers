import { randomBytes, randomInt } from "node:crypto";
import { z } from "zod";
import {
  idleInput,
  type Input,
  type Player,
  type Snapshot,
} from "../shared/types";
import { makePlayer, step } from "../shared/physics";
import { LEVEL } from "../shared/level";
export const nickname = z
  .string()
  .trim()
  .min(2)
  .max(18)
  .regex(/^[\p{L}\p{N} _-]+$/u, "Use letras, números, espaços, _ ou -");
export const inputSchema = z
  .object({
    seq: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    left: z.boolean(),
    right: z.boolean(),
    jump: z.boolean(),
    run: z.boolean(),
  })
  .strict();
export interface Member {
  player: Player;
  token: string;
  input: Input;
  seen: number;
  lastInput: number;
}
export class Room {
  members = new Map<string, Member>();
  phase: Snapshot["phase"] = "lobby";
  startAt = 0;
  created = Date.now();
  constructor(public code: string) {}
  join(name: string, id: string, now = Date.now()) {
    if (this.phase !== "lobby") throw Error("Esta corrida já começou.");
    if (this.members.size >= 4)
      throw Error("Sala cheia: máximo de 4 corredores.");
    const parsed = nickname.parse(name);
    const used = [...this.members.values()].map((m) => m.player.color);
    const color = [0, 1, 2, 3].find((c) => !used.includes(c))!;
    const member = {
      player: makePlayer(id, parsed, color),
      token: randomBytes(24).toString("hex"),
      input: idleInput(),
      seen: now,
      lastInput: now,
    };
    this.members.set(id, member);
    return member;
  }
  profile(id: string, name: string, color: number) {
    if (this.phase !== "lobby") throw Error("A corrida já começou.");
    const m = this.members.get(id)!;
    if (!Number.isInteger(color) || color < 0 || color > 3)
      throw Error("Cor inválida.");
    if (
      [...this.members.values()].some(
        (v) => v.player.id !== id && v.player.color === color,
      )
    )
      throw Error("Essa cor já está em uso.");
    m.player.name = nickname.parse(name);
    m.player.color = color;
    m.player.ready = false;
  }
  ready(id: string, value: boolean) {
    if (this.phase !== "lobby") return;
    this.members.get(id)!.player.ready = value;
  }
  tick(now: number) {
    for (const [id, m] of this.members) {
      if (!m.player.connected && now - m.seen > 15000) this.members.delete(id);
    }
    if (
      this.phase === "lobby" &&
      this.members.size >= 2 &&
      [...this.members.values()].every(
        (m) => m.player.ready && m.player.loaded && m.player.connected,
      )
    ) {
      this.phase = "countdown";
      this.startAt = now + 3500;
    }
    if (this.phase === "countdown" && now >= this.startAt)
      this.phase = "racing";
    if (this.phase === "racing") {
      for (const m of this.members.values()) {
        if (!m.player.connected || now - m.lastInput > 250)
          m.input = { ...idleInput(), seq: m.input.seq };
        step(m.player, m.input, now);
        if (
          m.player.finished === null &&
          m.player.x >= LEVEL.finish &&
          m.player.y > 450 &&
          m.player.checkpoint === 2
        )
          m.player.finished = Math.max(0, now - this.startAt);
      }
      if (
        this.members.size &&
        [...this.members.values()].every((m) => m.player.finished !== null)
      )
        this.phase = "finished";
    }
  }
  snapshot(now = Date.now()): Snapshot {
    return {
      code: this.code,
      phase: this.phase,
      startAt: this.startAt,
      now,
      players: [...this.members.values()].map((m) => ({
        ...m.player,
        collected: [...m.player.collected],
      })),
    };
  }
  resume(token: string, now = Date.now()) {
    const m = [...this.members.values()].find((m) => m.token === token);
    if (!m || (!m.player.connected && now - m.seen > 15000))
      throw Error("A sessão expirou. Entre em uma nova sala.");
    m.player.connected = true;
    m.seen = now;
    return m;
  }
}
export function rank(players: Player[]) {
  return [...players].sort((a, b) =>
    a.finished !== null && b.finished !== null
      ? a.finished - b.finished
      : a.finished !== null
        ? -1
        : b.finished !== null
          ? 1
          : b.progress - a.progress,
  );
}
export class Rooms {
  rooms = new Map<string, Room>();
  create() {
    if (this.rooms.size >= 1000)
      throw Error("Servidor cheio. Tente novamente em instantes.");
    let code: string;
    do {
      code = `GB-${randomInt(1000, 10000)}`;
    } while (this.rooms.has(code));
    const room = new Room(code);
    this.rooms.set(code, room);
    return room;
  }
}
