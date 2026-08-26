import pw from "playwright";
import { existsSync, readdirSync } from "node:fs"; import { join } from "node:path";
function chromium(){const r="/opt/pw-browsers";for(const d of readdirSync(r)){const b=join(r,d,"chrome-linux","chrome");if(existsSync(b))return b;}}
const b = await pw.chromium.launch({ executablePath: chromium() });
const p = await b.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 1.4 });
await p.goto("file://" + process.cwd() + "/brand/novieri-brand-guidelines.html", { waitUntil: "load" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(900);
const n = await p.evaluate(() => document.querySelectorAll("section.page").length);
for (let i = 0; i < n; i++) {
  const el = await p.evaluateHandle(i => document.querySelectorAll("section.page")[i], i);
  await el.asElement().screenshot({ path: `/tmp/bg-${String(i+1).padStart(2,"0")}.png` });
}
console.log("pages shot:", n);
await b.close();
