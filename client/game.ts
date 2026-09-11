import Phaser from "phaser";
import { runner } from "./art";
import { audio } from "./audio";
import { Controls } from "./input";
import { socket, session, offset } from "./network";
import {
  COLORS,
  type Input,
  type Player,
  type Snapshot,
} from "../shared/types";
import { DT, step } from "../shared/physics";
import {
  LEVEL,
  platforms,
  platformAt,
  crystals,
  checkpoints,
  enemies,
  enemyX,
} from "../shared/level";
export class RaceScene extends Phaser.Scene {
  controls!: Controls;
  latest: Snapshot | null = null;
  local: Player | null = null;
  pending: { input: Input; time: number }[] = [];
  sprites = new Map<string, Phaser.GameObjects.Container>();
  moving: Phaser.GameObjects.Container[] = [];
  gems = new Map<number, Phaser.GameObjects.Container>();
  bugs: Phaser.GameObjects.Container[] = [];
  accumulator = 0;
  lastSend = 0;
  ready = false;
  constructor() {
    super("race");
  }
  preload() {
    COLORS.forEach((c, i) =>
      this.load.svg(
        `runner${i}`,
        "data:image/svg+xml;base64," + btoa(runner(c)),
        { width: 70, height: 84 },
      ),
    );
  }
  create() {
    this.controls = new Controls();
    this.cameras.main.setBounds(0, 0, LEVEL.width, 800);
    this.cameras.main.setBackgroundColor("#c2dfdc");
    const sky = this.add.graphics().setScrollFactor(0);
    sky.fillGradientStyle(0x9acbd3, 0x9acbd3, 0xf4edc6, 0xf4edc6, 1);
    sky.fillRect(0, 0, 2500, 1000);
    this.add.circle(800, 130, 65, 0xfff1bf, 0.8).setScrollFactor(0.08);
    for (let layer = 0; layer < 3; layer++) {
      const g = this.add.graphics().setScrollFactor(0.12 + layer * 0.18);
      g.fillStyle([0xa1bdb0, 0x86a591, 0x638e79][layer]);
      for (let i = 0; i < 20; i++) {
        g.fillEllipse(i * 380, 490 + layer * 80, 650, 350 + layer * 40);
      }
      g.fillRect(0, 530 + layer * 70, 8000, 500);
    }
    for (let i = 0; i < 30; i++) {
      const x = i * 213 + 50,
        y = 550;
      const g = this.add.graphics().setScrollFactor(0.7);
      g.fillStyle(0x46685b);
      g.fillRoundedRect(x, y - 200, 15, 230, 5);
      g.fillStyle(i % 2 ? 0x527f63 : 0x608970);
      g.fillEllipse(x + 5, y - 220, 130, 130);
      g.fillEllipse(x - 40, y - 190, 100, 100);
    }
    for (const p of platforms) {
      const c = this.add.container(p.x, p.y);
      const g = this.add.graphics();
      g.fillStyle(0x84654e);
      g.fillRoundedRect(0, 0, p.w, p.h, 7);
      g.fillStyle(0x6d5546);
      g.fillRect(0, 18, p.w, p.h - 18);
      g.fillStyle(0xb5cf85);
      g.fillRoundedRect(-3, -6, p.w + 6, 16, 5);
      g.fillStyle(0x709560);
      g.fillRect(0, 8, p.w, 7);
      for (let j = 15; j < p.w; j += 45) {
        g.fillStyle(0xa28964, 0.45);
        g.fillRoundedRect(j, 34 + (j % 3) * 12, 19, 9, 3);
      }
      c.add(g);
      if (p.moving) this.moving.push(c);
    }
    checkpoints.slice(1).forEach((cp, i) => {
      this.add.rectangle(cp.x, cp.y - 30, 7, 90, 0x365a53);
      this.add.triangle(cp.x + 24, cp.y - 65, 0, 0, 46, 12, 0, 28, 0xffd476);
      this.add.text(cp.x - 24, cp.y + 20, `0${i + 1}`, {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#365a53",
      });
    });
    for (const c of crystals) {
      const gem = this.add.container(c.x, c.y);
      const shape = this.add.graphics();
      shape.fillStyle(0x71ffe0, 0.15);
      shape.fillCircle(0, 0, 20);
      shape.fillStyle(0x5bcbb7);
      shape.fillPoints(
        [
          { x: 0, y: -15 },
          { x: 11, y: 0 },
          { x: 0, y: 15 },
          { x: -11, y: 0 },
        ],
        true,
      );
      shape.fillStyle(0xbefff0);
      shape.fillTriangle(0, -15, 0, 8, -11, 0);
      gem.add(shape);
      this.gems.set(c.id, gem);
    }
    for (const e of enemies) {
      const bug = this.add.container(e.x, 558),
        g = this.add.graphics();
      g.lineStyle(4, 0x434744);
      for (let i = -1; i <= 1; i++) {
        g.lineBetween(i * 10, -2, i * 14, 15);
      }
      g.fillStyle(0x987ba1);
      g.fillEllipse(0, 0, 42, 26);
      g.fillStyle(0xc8aed0);
      g.fillEllipse(-3, -5, 29, 16);
      g.fillStyle(0x253c3d);
      g.fillCircle(11, -3, 3);
      g.fillCircle(17, -3, 3);
      bug.add(g);
      this.bugs.push(bug);
    }
    const portal = this.add.graphics();
    portal.lineStyle(15, 0x385d58);
    portal.strokeRoundedRect(LEVEL.finish - 36, 440, 80, 140, 35);
    portal.lineStyle(5, 0x85f4cc);
    portal.strokeRoundedRect(LEVEL.finish - 34, 439, 76, 138, 34);
    portal.fillStyle(0x9dffe0, 0.3);
    portal.fillRoundedRect(LEVEL.finish - 27, 448, 62, 124, 30);
    this.add
      .text(LEVEL.finish, 410, "CHEGADA", {
        fontSize: "17px",
        fontFamily: "Arial",
        fontStyle: "bold",
        color: "#31544d",
      })
      .setOrigin(0.5);
    this.add.text(140, 485, "A / D  MOVER     ESPAÇO  PULAR", {
      fontSize: "14px",
      color: "#436c60",
      fontFamily: "monospace",
    });
    this.add.text(670, 320, "SEGURE O PULO", {
      fontSize: "13px",
      color: "#436c60",
    });
    this.add.text(3150, 400, "SHIFT • CORRA E SALTE", {
      fontSize: "13px",
      color: "#436c60",
    });
    this.ready = true;
    socket.emit("loaded");
    if (this.latest) this.receive(this.latest);
  }
  receive(s: Snapshot) {
    this.latest = s;
    if (!this.ready) return;
    const me = s.players.find((p) => p.id === session.id);
    if (me) {
      this.controls.state.seq = Math.max(this.controls.state.seq, me.ack);
      const prev = this.local;
      if (prev) {
        if (me.crystals > prev.crystals) audio.sfx("crystal");
        if (me.checkpoint > prev.checkpoint) {
          audio.sfx("checkpoint");
          window.dispatchEvent(
            new CustomEvent("gb-toast", { detail: "CHECKPOINT!" }),
          );
        }
        if (me.deaths > prev.deaths) {
          audio.sfx("death");
          this.cameras.main.shake(140, 0.004);
        }
        if (me.finished !== null && prev.finished === null) audio.sfx("finish");
      }
      this.pending = this.pending.filter((p) => p.input.seq > me.ack);
      this.local = structuredClone(me);
      if (s.phase === "racing" && me.finished === null)
        for (const entry of this.pending)
          step(this.local, entry.input, entry.time, false);
    }
    for (const p of s.players) {
      if (!this.sprites.has(p.id)) {
        const image = this.add
          .image(0, -5, `runner${p.color}`)
          .setDisplaySize(45, 54);
        const label = this.add
          .text(0, -48, p.name, {
            fontFamily: "Arial",
            fontSize: "12px",
            fontStyle: "bold",
            color: "#ffffff",
            backgroundColor: "#24453de0",
            padding: { x: 7, y: 4 },
          })
          .setOrigin(0.5);
        const c = this.add.container(p.x, p.y, [image, label]);
        c.setDepth(10);
        this.sprites.set(p.id, c);
      }
      const c = this.sprites.get(p.id)!;
      (c.list[0] as Phaser.GameObjects.Image).setTexture(`runner${p.color}`);
      (c.list[1] as Phaser.GameObjects.Text).setText(p.name);
    }
    for (const [id, c] of this.sprites)
      if (!s.players.some((p) => p.id === id)) {
        c.destroy();
        this.sprites.delete(id);
      }
  }
  update(_time: number, delta: number) {
    if (!this.ready || !this.latest || !this.local) return;
    const now = Date.now() + offset;
    this.accumulator += Math.min(delta, 100);
    while (this.accumulator >= DT * 1000) {
      this.accumulator -= DT * 1000;
      if (
        this.latest.phase === "racing" &&
        this.local.finished === null &&
        socket.connected
      ) {
        const input = this.controls.read();
        if (input.jump && !this.local.jumpHeld && this.local.coyote > 0)
          audio.sfx("jump");
        const grounded = this.local.grounded;
        step(this.local, input, now, false);
        if (!grounded && this.local.grounded) audio.sfx("land");
        this.pending.push({ input, time: now });
        if (this.pending.length > 120) this.pending.shift();
        if (input.seq - this.lastSend >= 2) {
          socket.emit("input", input);
          this.lastSend = input.seq;
        }
      }
    }
    this.latest.players.forEach((p) => {
      const c = this.sprites.get(p.id);
      if (!c) return;
      const local = p.id === session.id,
        target = local ? this.local! : p;
      const extra = local
        ? 0
        : Math.min(100, Math.max(0, now - this.latest!.now)) / 1000;
      const x = target.x + target.vx * extra,
        y = target.y + target.vy * extra;
      const blend = local ? 1 : 1 - Math.exp(-delta / 65);
      c.x += (x - c.x) * blend;
      c.y += (y - c.y) * blend;
      const img = c.list[0] as Phaser.GameObjects.Image;
      img.setFlipX(target.direction < 0);
      img.rotation = target.grounded
        ? Math.sin(now / 75) * Math.min(0.07, Math.abs(target.vx) / 3000)
        : target.vx / 4000;
      img.y =
        -5 +
        (target.grounded
          ? Math.sin(now / 60) * Math.min(2, Math.abs(target.vx) / 100)
          : 0);
      c.alpha =
        target.invulnerable > 0
          ? Math.sin(now / 55) > 0
            ? 0.5
            : 1
          : target.connected
            ? 1
            : 0.35;
    });
    const camera = this.cameras.main;
    camera.setZoom(Math.max(0.65, Math.min(1.15, this.scale.height / 720)));
    const desired = this.local.x - camera.width / (2 * camera.zoom) + 120;
    camera.scrollX += (desired - camera.scrollX) * (1 - Math.exp(-delta / 100));
    camera.scrollY = 100;
    const movingSources = platforms.filter((p) => p.moving);
    this.moving.forEach((c, i) => (c.x = platformAt(movingSources[i], now).x));
    this.bugs.forEach((c, i) => (c.x = enemyX(enemies[i], now)));
    for (const [id, g] of this.gems) {
      g.visible = !this.local.collected.includes(id);
      g.y = crystals[id].y + Math.sin(now / 300 + id) * 4;
    }
  }
}
export function createGame() {
  const scene = new RaceScene();
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent: "game-canvas",
    backgroundColor: "#c2dfdc",
    scale: {
      mode: Phaser.Scale.NONE,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    scene,
    render: { antialias: true },
    audio: { noAudio: true },
  });
  return { game, scene };
}
