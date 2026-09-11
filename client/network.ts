import { io, type Socket } from "socket.io-client";
import type {
  ClientEvents,
  ServerEvents,
  Snapshot,
  Reply,
} from "../shared/types";
export const socket: Socket<ServerEvents, ClientEvents> = io(
  import.meta.env.VITE_SERVER_URL || undefined,
  {
    autoConnect: false,
    reconnectionAttempts: 8,
    reconnectionDelay: 500,
    reconnectionDelayMax: 2000,
  },
);
export const session = { id: "", code: "", token: "" };
export let state: Snapshot | null = null;
export let offset = 0;
export let ping = 0;
export function remember(r: Reply) {
  if (!r.ok) return;
  session.id = r.id!;
  session.code = r.code!;
  session.token = r.token!;
  sessionStorage.setItem("gb-session", JSON.stringify(session));
}
socket.on("snapshot", (s) => {
  state = s;
  offset = s.now - Date.now();
});
setInterval(() => {
  if (!socket.connected) return;
  const t = performance.now();
  socket.emit("pingCheck", () => (ping = Math.round(performance.now() - t)));
}, 2000);
export function connect() {
  socket.connect();
}
