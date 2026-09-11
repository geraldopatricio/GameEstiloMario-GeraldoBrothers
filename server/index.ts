import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { Server } from "socket.io";
import swaggerUi from "swagger-ui-express";
import { z } from "zod";
import { Rooms, inputSchema, nickname } from "./rooms";
import type { ClientEvents, ServerEvents, Reply } from "../shared/types";
const app = express(),
  http = createServer(app),
  rooms = new Rooms();
const origins = (process.env.ALLOWED_ORIGIN ?? "http://localhost:5188").split(
  ",",
);
const io = new Server<ClientEvents, ServerEvents>(http, {
  cors: { origin: origins },
  maxHttpBufferSize: 4096,
  allowRequest: (req, cb) =>
    cb(null, !req.headers.origin || origins.includes(req.headers.origin)),
});
const spec = {
  openapi: "3.0.3",
  info: { title: "Geraldo Brothers API", version: "0.1.0" },
  paths: {
    "/api/health": {
      get: {
        summary: "Estado do servidor",
        responses: { "200": { description: "Servidor disponível" } },
      },
    },
  },
};
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", rooms: rooms.rooms.size }),
);
app.get("/api/openapi.json", (_req, res) => res.json(spec));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));
app.use(express.static(resolve("dist")));
const joinSchema = z
  .object({ name: nickname, code: z.string().regex(/^GB-\d{4}$/) })
  .strict();
io.on("connection", (socket) => {
  let roomCode = "",
    playerId = "",
    windowAt = Date.now(),
    count = 0;
  const limited = (max = 90) => {
    const now = Date.now();
    if (now - windowAt >= 1000) {
      windowAt = now;
      count = 0;
    }
    return ++count > max;
  };
  const room = () => rooms.rooms.get(roomCode);
  const send = () => {
    const r = room();
    if (r) io.to(r.code).emit("snapshot", r.snapshot());
  };
  const leave = () => {
    const r = room();
    if (r) {
      r.members.delete(playerId);
      socket.leave(roomCode);
      send();
    }
    roomCode = "";
    playerId = "";
  };
  const replyError = (cb: ((r: Reply) => void) | undefined, e: unknown) => {
    if (typeof cb === "function")
      cb({
        ok: false,
        error:
          e instanceof z.ZodError
            ? "Confira o nome e o código da sala."
            : e instanceof Error
              ? e.message
              : "Evento inválido.",
      });
  };
  socket.on("create", (data, cb) => {
    try {
      if (limited(12)) throw Error("Muitas solicitações. Aguarde um segundo.");
      const { name } = z.object({ name: nickname }).strict().parse(data);
      if (roomCode) throw Error("Saia da sala atual primeiro.");
      const r = rooms.create();
      const m = r.join(name, randomUUID());
      roomCode = r.code;
      playerId = m.player.id;
      socket.join(roomCode);
      if (typeof cb === "function")
        cb({ ok: true, code: roomCode, id: playerId, token: m.token });
      send();
    } catch (e) {
      replyError(cb, e);
    }
  });
  socket.on("join", (data, cb) => {
    try {
      if (limited(12)) throw Error("Aguarde antes de tentar novamente.");
      const { name, code } = joinSchema.parse(data);
      if (roomCode) throw Error("Saia da sala atual primeiro.");
      const r = rooms.rooms.get(code);
      if (!r) throw Error("Sala não encontrada. Confira o código.");
      const m = r.join(name, randomUUID());
      roomCode = r.code;
      playerId = m.player.id;
      socket.join(roomCode);
      if (typeof cb === "function")
        cb({ ok: true, code: roomCode, id: playerId, token: m.token });
      send();
    } catch (e) {
      replyError(cb, e);
    }
  });
  socket.on("resume", (data, cb) => {
    try {
      if (limited(12)) throw Error("Aguarde um instante.");
      const { code, token } = z
        .object({ code: z.string().max(7), token: z.string().length(48) })
        .strict()
        .parse(data);
      if (roomCode) throw Error("Já conectado.");
      const r = rooms.rooms.get(code);
      if (!r) throw Error("Sala expirada.");
      const existing = [...r.members.values()].find((m) => m.token === token);
      if (existing?.player.connected) throw Error("Sessão já conectada.");
      const m = r.resume(token);
      roomCode = code;
      playerId = m.player.id;
      socket.join(code);
      if (typeof cb === "function") cb({ ok: true, code, id: playerId, token });
      socket.emit("notice", "Reconectado à partida");
      send();
    } catch (e) {
      replyError(cb, e);
    }
  });
  socket.on("profile", (data) => {
    try {
      if (limited(12)) return;
      const d = z
        .object({ name: nickname, color: z.number().int().min(0).max(3) })
        .strict()
        .parse(data);
      room()?.profile(playerId, d.name, d.color);
      send();
    } catch (e) {
      socket.emit(
        "notice",
        e instanceof Error ? e.message : "Perfil inválido.",
      );
    }
  });
  socket.on("ready", (data) => {
    if (limited(12) || typeof data !== "boolean") return;
    room()?.ready(playerId, data);
    send();
  });
  socket.on("loaded", () => {
    const m = room()?.members.get(playerId);
    if (m) m.player.loaded = true;
  });
  socket.on("input", (data) => {
    if (limited()) return;
    const parsed = inputSchema.safeParse(data),
      m = room()?.members.get(playerId);
    if (
      !parsed.success ||
      !m ||
      parsed.data.seq <= m.input.seq ||
      parsed.data.seq > m.input.seq + 300
    )
      return;
    m.input = parsed.data;
    m.lastInput = Date.now();
  });
  socket.on("pingCheck", (cb) => {
    if (!limited() && typeof cb === "function") cb();
  });
  socket.on("leave", leave);
  socket.on("disconnect", () => {
    const m = room()?.members.get(playerId);
    if (m) {
      m.player.connected = false;
      m.seen = Date.now();
    }
    send();
  });
});
let ticks = 0;
setInterval(() => {
  const now = Date.now();
  ticks++;
  for (const [code, r] of rooms.rooms) {
    r.tick(now);
    if (!r.members.size) {
      rooms.rooms.delete(code);
      continue;
    }
    if (ticks % 3 === 0) io.to(code).emit("snapshot", r.snapshot(now));
  }
}, 1000 / 60);
const port = Number(process.env.PORT ?? 3001);
http.listen(port, process.env.HOST ?? "0.0.0.0", () =>
  console.log(JSON.stringify({ event: "server_started", port })),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    io.close();
    http.close(() => process.exit(0));
  });
