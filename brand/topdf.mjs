import pw from "playwright";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
function chromium() {
  const root = "/opt/pw-browsers";
  if (existsSync(root)) for (const d of readdirSync(root)) {
    if (!d.startsWith("chromium-")) continue;
    const bin = join(root, d, "chrome-linux", "chrome");
    if (existsSync(bin)) return bin;
  }
  return undefined;
}
const b = await pw.chromium.launch({ executablePath: chromium(), args: ["--ssl-version-max=tls1.2"] });
const p = await b.newPage();
await p.goto("file://" + process.cwd() + "/brand/novieri-brand-guidelines.html", { waitUntil: "load" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(1200);
await p.pdf({
  path: "brand/Novieri-Brand-Guidelines.pdf",
  format: "Letter",
  printBackground: true,
  margin: { top: "0", bottom: "0", left: "0", right: "0" },
});
await b.close();
