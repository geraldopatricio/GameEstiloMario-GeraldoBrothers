import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
try {
  const a = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    }),
    b = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await a.newPage(),
    q = await b.newPage();
  for (const page of [p, q])
    page.on("pageerror", (e) => {
      errors.push(e.message);
      console.log("BROWSER ERROR", e.message);
    });
  await p.goto("http://localhost:5188");
  await p.screenshot({ path: "artifacts/menu-desktop.png", fullPage: true });
  await p.click("#create");
  await p.fill("#nickname", "Geraldo");
  await p.click("#room-form button");
  await p.waitForSelector("#copy-code");
  const code = (await p.locator("#copy-code").innerText()).match(/GB-\d{4}/)[0];
  await q.goto("http://localhost:5188");
  await q.click("#join");
  await q.fill("#nickname", "Joana");
  await q.fill("#room-code", code);
  await q.click("#room-form button");
  await q.waitForSelector("#ready");
  await p.screenshot({ path: "artifacts/lobby.png" });
  await p.click("#ready");
  await q.click("#ready");
  await p.waitForSelector("#race:not([hidden])");
  await p.waitForTimeout(4500);
  const getState = (page) =>
    page.evaluate(async () => {
      const n = await import("/client/network.ts");
      return { state: n.state, id: n.session.id };
    });
  await p.keyboard.down("KeyD");
  await p.keyboard.down("Shift");
  await p.waitForTimeout(1600);
  await p.keyboard.up("KeyD");
  await p.keyboard.up("Shift");
  let sa = await getState(p),
    sb = await getState(q);
  const pa = sa.state.players.find((v) => v.id === sa.id),
    pb = sb.state.players.find((v) => v.id === sb.id);
  assert(pa.x > 350, `player moved: ${pa.x}`);
  assert(pb.x < 250, `independent input: ${pb.x}`);
  assert(sa.state.players.length === 2);
  assert(Math.abs(sb.state.players.find((v) => v.id === sa.id).x - pa.x) < 50);
  await p.screenshot({ path: "artifacts/race-desktop.png" });
  await a.setOffline(true);
  await p.waitForTimeout(1200);
  await a.setOffline(false);
  await p.waitForTimeout(2500);
  sa = await getState(p);
  assert(sa.state.players.find((v) => v.id === sa.id).connected);
  await p.keyboard.down("KeyD");
  await p.waitForTimeout(700);
  await p.keyboard.up("KeyD");
  await q.reload();
  await q.waitForSelector("#race:not([hidden])");
  await q.waitForTimeout(1000);
  sb = await getState(q);
  assert(sb.state.players.length === 2);
  // Drive the course through keyboard events; no state or position is injected.
  const drive = async (page) =>
    page.evaluate(async () => {
      const n = await import("/client/network.ts");
      const level = await import("/shared/level.ts");
      let jumpUntil = 0;
      const press = (code, on) =>
        window.dispatchEvent(
          new KeyboardEvent(on ? "keydown" : "keyup", { code, bubbles: true }),
        );
      const timer = setInterval(() => {
        const me = n.state?.players.find((p) => p.id === n.session.id);
        if (!me) return;
        if (me.finished !== null) {
          press("KeyD", false);
          press("ShiftLeft", false);
          press("Space", false);
          clearInterval(timer);
          return;
        }
        const now = Date.now() + n.offset;
        const floor = level.platforms.find(
          (q) =>
            !q.moving &&
            me.x >= q.x &&
            me.x <= q.x + q.w &&
            Math.abs(me.y + 22 - q.y) < 4,
        );
        const gap = floor && me.x + 110 > floor.x + floor.w;
        const bug = level.enemies.some(
          (e) =>
            level.enemyX(e, now) > me.x - 20 &&
            level.enemyX(e, now) < me.x + 160 &&
            me.y > 490,
        );
        if (me.grounded && Date.now() > jumpUntil + 70 && (gap || bug))
          jumpUntil = Date.now() + 560;
        press("KeyD", true);
        press("ShiftLeft", true);
        press("Space", Date.now() < jumpUntil);
      }, 30);
    });
  await drive(p);
  await drive(q);
  await p.waitForSelector("#again", { timeout: 90000 });
  await q.waitForSelector("#again", { timeout: 10000 });
  assert.equal(await p.locator(".results>div").count(), 2);
  await p.screenshot({ path: "artifacts/podium.png" });
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const m = await mobile.newPage();
  await m.goto("http://localhost:5188");
  await m.screenshot({ path: "artifacts/menu-mobile.png", fullPage: true });
  assert(
    await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      result: "passed",
      code,
      players: 2,
      movement: pa.x,
      screenshots: 5,
      fullRace: true,
      reconnection: true,
      reload: true,
      mobile: true,
    }),
  );
} finally {
  await browser.close();
}
