import { describe, it, expect } from "vitest";
import { Room, Rooms, inputSchema, nickname, rank } from "../server/rooms";
import { makePlayer, respawn, step } from "../shared/physics";
import { idleInput } from "../shared/types";
import { checkpoints, LEVEL, routeProgress } from "../shared/level";
describe("salas e validação", () => {
  it("gera códigos únicos e permite quatro jogadores", () => {
    const store = new Rooms();
    for (let i = 0; i < 100; i++) store.create();
    expect(store.rooms.size).toBe(100);
    const r = new Room("GB-1234");
    for (let i = 0; i < 4; i++) r.join(`Player ${i}`, `${i}`);
    expect(
      new Set([...r.members.values()].map((m) => m.player.color)).size,
    ).toBe(4);
    expect(() => r.join("Quinto", "5")).toThrow("cheia");
  });
  it("sanitiza e valida nomes", () => {
    expect(nickname.parse("  João  ")).toBe("João");
    for (const n of ["a", "<script>", "a".repeat(19), "\n"])
      expect(nickname.safeParse(n).success).toBe(false);
  });
  it("não permite roubar uma cor ou alterar perfil depois da largada", () => {
    const r = new Room("GB-1234");
    r.join("Azul", "a");
    r.join("Verde", "b");
    expect(() => r.profile("b", "Verde", 0)).toThrow();
    r.profile("b", "Pedro", 2);
    expect(r.members.get("b")!.player.name).toBe("Pedro");
    r.phase = "racing";
    expect(() => r.profile("b", "Outro", 3)).toThrow();
    expect(() => r.join("Novo", "c")).toThrow();
  });
  it("exige dois jogadores, carregamento e todos prontos", () => {
    const r = new Room("GB-1234");
    const a = r.join("Ana", "a");
    r.ready("a", true);
    a.player.loaded = true;
    r.tick(1000);
    expect(r.phase).toBe("lobby");
    const b = r.join("Beto", "b");
    r.ready("b", true);
    r.tick(1000);
    expect(r.phase).toBe("lobby");
    b.player.loaded = true;
    r.tick(1000);
    expect(r.phase).toBe("countdown");
    expect(r.startAt).toBe(4500);
    r.tick(4499);
    expect(r.phase).toBe("countdown");
    r.tick(4500);
    expect(r.phase).toBe("racing");
  });
  it("reconecta com token e expira após quinze segundos", () => {
    const r = new Room("GB-1234"),
      a = r.join("Ana", "a", 1000);
    a.player.connected = false;
    a.seen = 1000;
    expect(r.resume(a.token, 1100).player.id).toBe("a");
    expect(() => r.resume("invalido")).toThrow();
    a.player.connected = false;
    expect(() => r.resume(a.token, 17000)).toThrow();
    r.tick(17000);
    expect(r.members.size).toBe(0);
  });
  it("rejeita posição, tipos errados e sequência inválida no evento", () => {
    expect(inputSchema.safeParse(idleInput()).success).toBe(true);
    for (const d of [
      { ...idleInput(), x: 5000 },
      { ...idleInput(), seq: -1 },
      { ...idleInput(), seq: NaN },
      { ...idleInput(), jump: "true" },
      null,
    ])
      expect(inputSchema.safeParse(d).success).toBe(false);
  });
});
describe("simulação autoritativa", () => {
  it("limita a velocidade e respawna no checkpoint", () => {
    const p = makePlayer("a", "Ana", 0);
    for (let i = 0; i < 60; i++)
      step(p, { ...idleInput(), right: true, run: true }, (i * 1000) / 60);
    expect(p.vx).toBeLessThanOrEqual(370);
    p.checkpoint = 1;
    p.y = 1000;
    step(p, idleInput(), 2000);
    expect(p.x).toBe(checkpoints[1].x);
    expect(p.deaths).toBe(1);
  });
  it("ativa checkpoint apenas por proximidade e não perde progresso salvo", () => {
    const p = makePlayer("a", "Ana", 0);
    p.x = 1860;
    p.y = 550;
    step(p, idleInput(), 1000);
    expect(p.checkpoint).toBe(1);
    p.x = 100;
    step(p, idleInput(), 1017);
    expect(p.checkpoint).toBe(1);
    respawn(p);
    expect(p.x).toBe(1860);
  });
  it("pulo variável e coyote time", () => {
    const p = makePlayer("a", "Ana", 0);
    p.grounded = true;
    step(p, { ...idleInput(), jump: true }, 1000);
    expect(p.vy).toBeLessThan(-500);
    step(p, idleInput(), 1017);
    expect(p.vy).toBeGreaterThan(-220);
    const q = makePlayer("b", "Beto", 1);
    q.coyote = 0.05;
    step(q, { ...idleInput(), jump: true }, 1000);
    expect(q.vy).toBeLessThan(-500);
  });
  it("jump buffer dispara ao tocar o chão", () => {
    const p = makePlayer("a", "Ana", 0);
    p.y = 551;
    p.vy = 150;
    step(p, { ...idleInput(), jump: true }, 1000);
    step(p, { ...idleInput(), jump: true }, 1017);
    step(p, { ...idleInput(), jump: true }, 1034);
    step(p, { ...idleInput(), jump: true }, 1051);
    expect(p.vy).toBeLessThan(0);
  });
  it("coleta cada cristal uma vez por jogador", () => {
    const p = makePlayer("a", "Ana", 0);
    p.x = 280;
    p.y = 410;
    step(p, idleInput(), 1000);
    step(p, idleInput(), 1017);
    expect(p.crystals).toBe(1);
  });
  it("não conclui sem checkpoints e mantém os demais correndo", () => {
    const r = new Room("GB-1234"),
      a = r.join("Ana", "a"),
      b = r.join("Beto", "b");
    r.phase = "racing";
    r.startAt = 1000;
    a.player.x = LEVEL.finish;
    a.player.y = 550;
    r.tick(2000);
    expect(a.player.finished).toBeNull();
    a.player.checkpoint = 2;
    r.tick(3000);
    expect(a.player.finished).toBe(2000);
    expect(r.phase).toBe("racing");
    b.player.x = LEVEL.finish;
    b.player.y = 550;
    b.player.checkpoint = 2;
    r.tick(4000);
    expect(r.phase).toBe("finished");
    expect(rank([b.player, a.player]).map((p) => p.id)).toEqual(["a", "b"]);
  });
  it("progresso é limitado ao percurso", () => {
    expect(routeProgress(-100, 550)).toBe(0);
    expect(routeProgress(LEVEL.finish, 550)).toBe(1);
    expect(routeProgress(2700, 550)).toBeGreaterThan(0.4);
  });
});
