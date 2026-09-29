/**
 * Records a chat demo off the published site: a GIF for slides and social,
 * and a webm of the section in context.
 *
 * It shoots the live page rather than a local render because the animation
 * only exists in the deployed module, so what this captures is what a
 * visitor sees. Deploy first.
 *
 *   node scripts/record-chat-demo.mjs --url=/productos/asistente-ia-whatsapp --out=brand/demo
 *
 * The GIF needs Pillow (`pip install Pillow`); without it the frames are
 * left on disk and the webm is still written.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import pw from "playwright";

const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : d;
};
const origin = arg("origin", "https://www.novieri.com");
const url = origin + arg("url", "/productos/asistente-ia-whatsapp") + "?hsDebug=true";
const out = path.resolve(arg("out", "brand/demo"));
const name = arg("name", "chat-demo");
const seconds = Number(arg("seconds", "18"));
const tmp = path.join(out, ".frames");

// Anything pinned to the viewport lands on top of the phone: the cookie
// banner, the chat bubble, a sticky header. None of it belongs in a clip
// of the conversation.
const HIDE = `(()=>{document.querySelectorAll("body *").forEach(el=>{
  const cs=getComputedStyle(el);
  if((cs.position==="fixed"||cs.position==="sticky") && el.getBoundingClientRect().height>0
     && !el.closest("[data-chat-demo]")) el.style.setProperty("display","none","important");
});})()`;

rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

const browser = await pw.chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--ssl-version-max=tls1.2"],
});
const common = { locale: "es-CO", timezoneId: "America/Bogota" };

// The section in context, with its heading.
const videoCtx = await browser.newContext({
  ...common,
  viewport: { width: 1100, height: 760 },
  recordVideo: { dir: tmp, size: { width: 1100, height: 760 } },
});
const vp = await videoCtx.newPage();
await vp.goto(url, { waitUntil: "load", timeout: 60000 });
await vp.evaluate(HIDE);
const sectionTop = await vp.evaluate(
  `Math.round(document.querySelector("[data-chat-phone]").getBoundingClientRect().top+scrollY)`,
);
await vp.evaluate(`window.scrollTo({top:${sectionTop - 60},behavior:"instant"})`);
await vp.waitForTimeout(seconds * 1000 + 1000);
await videoCtx.close();
for (const f of readdirSync(tmp).filter((f) => f.endsWith(".webm"))) {
  renameSync(path.join(tmp, f), path.join(out, `${name}.webm`));
}

// The phone alone, frame by frame, for the GIF.
const ctx = await browser.newContext({
  ...common,
  viewport: { width: 1280, height: 950 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "load", timeout: 60000 });
await page.evaluate(HIDE);
// Crop to the handset, not the section: the clip should be a phone with
// WhatsApp open, with no eyebrow, heading or capability strip around it.
// A few pixels of margin keep the device's shadow from being sliced off.
const PAD = 14;
const top = await page.evaluate(
  `Math.round(document.querySelector("[data-chat-phone]").getBoundingClientRect().top+scrollY)`,
);
await page.evaluate(`window.scrollTo({top:${top - 120},behavior:"instant"})`);
const clip = await page.evaluate(`(()=>{
  const r=document.querySelector("[data-chat-phone]").getBoundingClientRect();
  return {x:Math.round(r.x)-${PAD},y:Math.round(r.y)-${PAD},
          width:Math.round(r.width)+${PAD * 2},height:Math.round(r.height)+${PAD * 2}};})()`);

const STEP = 205;
const total = Math.round((seconds * 1000) / STEP);
for (let n = 0; n < total; n += 1) {
  const started = Date.now();
  await page.screenshot({ path: path.join(tmp, `f${String(n).padStart(3, "0")}.png`), clip });
  const spent = Date.now() - started;
  if (spent < STEP) await page.waitForTimeout(STEP - spent);
}
await browser.close();
console.log(`${total} frames, clip ${clip.width}x${clip.height}`);

// Half size, adaptive palette, and the still tail trimmed to about two
// seconds so the loop turns over instead of sitting on the last message.
const gif = spawnSync("python3", ["-c", `
import glob, itertools, os, sys
from PIL import Image
tmp, out = sys.argv[1], sys.argv[2]
frames = []
for f in sorted(glob.glob(tmp + "/f*.png")):
    im = Image.open(f).convert("RGB")
    frames.append(im.resize((im.width // 2, im.height // 2), Image.LANCZOS))
def changed(a, b):
    pa, pb = a.tobytes(), b.tobytes()
    return sum(1 for x, y in itertools.islice(zip(pa, pb), 0, len(pa), 997) if x != y) > 3
last = max((i for i in range(1, len(frames)) if changed(frames[i-1], frames[i])), default=0)
frames = frames[: min(len(frames), last + 10)]
pal = [f.convert("P", palette=Image.ADAPTIVE, colors=96) for f in frames]
pal[0].save(out, save_all=True, append_images=pal[1:], duration=${STEP}, loop=0, optimize=True, disposal=2)
print(len(frames), "frames,", round(os.path.getsize(out) / 1e6, 2), "MB")
`, tmp, path.join(out, `${name}.gif`)], { encoding: "utf8" });
process.stdout.write(gif.stdout || "");
if (gif.status !== 0) {
  console.error(gif.stderr || "GIF step failed; frames kept at " + tmp);
} else {
  rmSync(tmp, { recursive: true, force: true });
}
