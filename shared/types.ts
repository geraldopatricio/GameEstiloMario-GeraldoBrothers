export const COLORS = ["#58b8ff", "#ff727d", "#80d8a2", "#ffd16b"] as const;
export interface Input {
  seq: number;
  left: boolean;
  right: boolean;
  jump: boolean;
  run: boolean;
}
export const idleInput = (): Input => ({
  seq: 0,
  left: false,
  right: false,
  jump: false,
  run: false,
});
export interface Player {
  id: string;
  name: string;
  color: number;
  ready: boolean;
  loaded: boolean;
  connected: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  coyote: number;
  buffer: number;
  jumpHeld: boolean;
  checkpoint: number;
  crystals: number;
  collected: number[];
  deaths: number;
  finished: number | null;
  progress: number;
  ack: number;
  invulnerable: number;
  direction: number;
}
export interface Snapshot {
  code: string;
  phase: "lobby" | "countdown" | "racing" | "finished";
  players: Player[];
  startAt: number;
  now: number;
}
export interface Reply {
  ok: boolean;
  error?: string;
  code?: string;
  id?: string;
  token?: string;
}
export interface ClientEvents {
  create: (data: unknown, reply: (r: Reply) => void) => void;
  join: (data: unknown, reply: (r: Reply) => void) => void;
  resume: (data: unknown, reply: (r: Reply) => void) => void;
  profile: (data: unknown) => void;
  ready: (data: unknown) => void;
  loaded: () => void;
  input: (data: unknown) => void;
  leave: () => void;
  pingCheck: (reply: () => void) => void;
}
export interface ServerEvents {
  snapshot: (state: Snapshot) => void;
  notice: (message: string) => void;
}
