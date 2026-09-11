export class Audio {
  ctx: AudioContext | null = null;
  music = Number(localStorage.getItem("gb-music") ?? 0.25);
  effects = Number(localStorage.getItem("gb-effects") ?? 0.55);
  vibration = localStorage.getItem("gb-vibration") !== "false";
  theme = "menu";
  private beat = 0;
  private timer?: ReturnType<typeof setInterval>;
  start() {
    this.ctx ??= new AudioContext();
    void this.ctx.resume();
    if (!this.timer) this.timer = setInterval(() => this.tick(), 210);
  }
  tone(
    freq: number,
    duration: number,
    volume: number,
    type: OscillatorType = "sine",
  ) {
    if (!this.ctx || volume <= 0) return;
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain(),
      t = this.ctx.currentTime;
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volume * 0.14, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start();
    o.stop(t + duration);
  }
  tick() {
    const melody =
      this.theme === "race"
        ? [64, 0, 71, 74, 67, 0, 69, 76, 0, 74, 67, 71, 62, 0, 69, 67]
        : this.theme === "victory"
          ? [67, 71, 74, 79, 76, 74, 71, 0]
          : [59, 0, 66, 69, 0, 64, 62, 0, 57, 64, 0, 67, 66, 0, 62, 0];
    const note = melody[this.beat % melody.length];
    if (note)
      this.tone(440 * 2 ** ((note - 69) / 12), 0.28, this.music, "triangle");
    if (this.beat % 4 === 0)
      this.tone(this.beat % 8 === 0 ? 98 : 130.81, 0.45, this.music * 0.7);
    this.beat++;
  }
  sfx(kind: string) {
    const notes: Record<string, number[]> = {
      jump: [320, 480],
      land: [110],
      crystal: [800, 1200],
      checkpoint: [440, 660, 880],
      death: [190, 100],
      start: [440, 660],
      finish: [523, 659, 784, 1046],
    };
    (notes[kind] ?? [400]).forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.16, this.effects, "triangle"), i * 65),
    );
    if (kind === "death" && this.vibration) navigator.vibrate?.(100);
  }
  save() {
    localStorage.setItem("gb-music", String(this.music));
    localStorage.setItem("gb-effects", String(this.effects));
    localStorage.setItem("gb-vibration", String(this.vibration));
  }
}
export const audio = new Audio();
