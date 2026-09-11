import { idleInput } from "../shared/types";
export class Controls {
  state = idleInput();
  private abort = new AbortController();
  private keys = new Set<string>();
  private touches = new Map<number, string>();
  constructor() {
    window.addEventListener(
      "keydown",
      (e) => {
        if (
          e.target instanceof HTMLElement &&
          e.target.matches("input,select,textarea")
        )
          return;
        if (["Space", "ArrowLeft", "ArrowRight", "ArrowUp"].includes(e.code))
          e.preventDefault();
        this.keys.add(e.code);
      },
      { signal: this.abort.signal },
    );
    window.addEventListener("keyup", (e) => this.keys.delete(e.code), {
      signal: this.abort.signal,
    });
    window.addEventListener("blur", () => this.clear(), {
      signal: this.abort.signal,
    });
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) this.clear();
      },
      { signal: this.abort.signal },
    );
    document
      .querySelectorAll<HTMLButtonElement>("[data-control]")
      .forEach((b) => {
        b.onpointerdown = (e) => {
          b.setPointerCapture(e.pointerId);
          this.touches.set(e.pointerId, b.dataset.control!);
        };
        b.onpointerup = b.onpointercancel = (e) =>
          this.touches.delete(e.pointerId);
      });
  }
  clear() {
    this.keys.clear();
    this.touches.clear();
  }
  destroy() {
    this.abort.abort();
    this.clear();
  }
  read() {
    const pad = navigator.getGamepads?.()[0],
      has = (k: string) =>
        this.keys.has(k) || [...this.touches.values()].includes(k);
    this.state = {
      seq: this.state.seq + 1,
      left: has("ArrowLeft") || has("KeyA") || (pad?.axes[0] ?? 0) < -0.25,
      right: has("ArrowRight") || has("KeyD") || (pad?.axes[0] ?? 0) > 0.25,
      jump: has("Space") || has("ArrowUp") || !!pad?.buttons[0]?.pressed,
      run: has("ShiftLeft") || has("ShiftRight") || !!pad?.buttons[1]?.pressed,
    };
    return { ...this.state };
  }
}
