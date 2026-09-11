import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const svg = await readFile("public/icon.svg", "utf8");
  for (const size of [192, 512]) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
    });
    await page.setContent(
      `<style>html,body{margin:0;width:100%;height:100%}svg{width:100%;height:100%}</style>${svg}`,
    );
    await page.screenshot({
      path: `public/icon-${size}.png`,
      omitBackground: true,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
