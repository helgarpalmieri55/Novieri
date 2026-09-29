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

const hex = (rgb) => {
  const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(rgb || "") || [0, 12, 10, 16];
  return "0x" + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("");
};

const browser = await pw.chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--ssl-version-max=tls1.2"],
});
const common = { locale: "es-CO", timezoneId: "America/Bogota" };

// The handset alone, centred on a clean backdrop, recorded in real time.
//
// Scaling it where it sits does not work: the demo lives in the right-hand
// column of a two-column section, so scaling about its own centre pushes it
// off the side of the viewport and the crop fills with page copy. Moving the
// live element onto a fixed stage keeps its timers, its observer and its
// scrolling intact while putting it in the middle of a plain background.
const STAGE = (scale) => `(()=>{
  const d=document.querySelector("[data-chat-demo]");
  const bg=getComputedStyle(d.closest("section")).backgroundColor;
  const stage=document.createElement("div");
  stage.style.cssText="position:fixed;inset:0;z-index:2147483647;background:"+bg
    +";display:flex;align-items:center;justify-content:center;overflow:hidden";
  document.body.appendChild(stage); stage.appendChild(d);
  Array.prototype.forEach.call(d.children, function(c){
    if(!c.hasAttribute("data-chat-phone")) c.style.display="none"; });
  d.style.transformOrigin="center center"; d.style.transform="scale(${scale})";
  return bg;})()`;
// The capability strip is hidden but still inside the wrapper, so centring the
// wrapper leaves the phone sitting high. Centre the phone itself.
const RECENTRE = (scale) => `(()=>{
  const d=document.querySelector("[data-chat-demo]");
  const b=document.querySelector("[data-chat-phone]").getBoundingClientRect();
  const dy=Math.round(innerHeight/2-(b.y+b.height/2));
  const dx=Math.round(innerWidth/2-(b.x+b.width/2));
  d.style.transform="translate("+dx+"px,"+dy+"px) scale(${scale})";})()`;
const PHONE_BOX = `(()=>{const b=document.querySelector("[data-chat-phone]").getBoundingClientRect();
  return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)};})()`;

const VW = 1120;
const VH = 1700;
const SCALE = 2.05;
const videoCtx = await browser.newContext({
  ...common,
  viewport: { width: VW, height: VH },
  recordVideo: { dir: tmp, size: { width: VW, height: VH } },
});
const vp = await videoCtx.newPage();
// Recording starts with the page, so the first couple of seconds are the
// marketing page loading, cookie banner and all. Time the setup and trim it
// off the front: the clip has to open on the phone.
const t0 = Date.now();
await vp.goto(url, { waitUntil: "load", timeout: 60000 });
await vp.evaluate(HIDE);
const bg = await vp.evaluate(STAGE(SCALE));
await vp.waitForTimeout(700);
await vp.evaluate(RECENTRE(SCALE));
await vp.waitForTimeout(700);
const box = await vp.evaluate(PHONE_BOX);
// Wait until the restarted conversation is back at its first message, so the
// trim lands on a clean opening frame rather than mid-cycle.
await vp
  .waitForFunction(
    `Array.from(document.querySelectorAll("[data-chat-row]")).filter(r=>r.style.display!=="none").length <= 1`,
    null,
    { timeout: 40000 },
  )
  .catch(() => {});
const trim = (Date.now() - t0) / 1000 + 0.35;
await vp.waitForTimeout(seconds * 1000 + 1000);
await videoCtx.close();
let webm = "";
for (const f of readdirSync(tmp).filter((f) => f.endsWith(".webm"))) {
  webm = path.join(out, `${name}.webm`);
  renameSync(path.join(tmp, f), webm);
}
console.log(`handset ${box.w}x${box.h} on ${bg}`);

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

// Instagram wants H.264 in MP4 with square pixels and an audio track, so the
// webm gets cropped to the handset, letterboxed onto the two shapes Instagram
// actually uses, and given a silent stereo track. ffmpeg comes from the
// imageio-ffmpeg wheel (pip install imageio-ffmpeg) rather than the system,
// which has none.
if (webm) {
  const MARGIN = 40;
  const crop = [
    Math.max(2, Math.round(box.w + MARGIN * 2)),
    Math.max(2, Math.round(box.h + MARGIN * 2)),
    Math.max(0, Math.round(box.x - MARGIN)),
    Math.max(0, Math.round(box.y - MARGIN)),
  ].join(":");
  const shapes = [
    { label: "reel", W: 1080, H: 1920, inner: 1800 },
    { label: "feed", W: 1080, H: 1350, inner: 1250 },
  ];
  const ff = spawnSync("python3", ["-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"], {
    encoding: "utf8",
  });
  const exe = (ff.stdout || "").trim();
  if (!exe) {
    console.error("no ffmpeg; skipping MP4 (pip install imageio-ffmpeg)");
  } else {
    for (const s2 of shapes) {
      const w = Math.round(((box.w + MARGIN * 2) / (box.h + MARGIN * 2)) * s2.inner / 2) * 2;
      const file = path.join(out, `${name}-${s2.label}-${s2.W}x${s2.H}.mp4`);
      const r = spawnSync(exe, [
        "-hide_banner", "-loglevel", "error", "-y", "-ss", trim.toFixed(2), "-i", webm,
        "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
        "-vf", `crop=${crop},scale=${w}:${s2.inner}:flags=lanczos,setsar=1,` +
               `pad=${s2.W}:${s2.H}:(ow-iw)/2:(oh-ih)/2:color=${hex(bg)},format=yuv420p`,
        "-c:v", "libx264", "-profile:v", "high", "-level", "4.0", "-crf", "19", "-preset", "slow",
        "-r", "30", "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart",
        file,
      ], { encoding: "utf8" });
      console.log(r.status === 0 ? `${s2.label} ${s2.W}x${s2.H}` : `${s2.label} failed: ${r.stderr}`);
    }
  }
}
