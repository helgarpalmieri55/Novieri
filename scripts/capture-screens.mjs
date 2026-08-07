/**
 * Screenshots of the live site, for the AI-powered Websites product page.
 *
 * The product is this site: the same platform, the same components. So its
 * demo is not a mockup, it is a capture of novieri.com as it stands — desktop
 * and phone, English and Spanish, each pinned to a market so the shot shows a
 * known state rather than whatever the runner's timezone implies.
 *
 * Playwright is not a dependency of the build; install it when regenerating:
 *   npm i -D playwright --no-save && node scripts/capture-screens.mjs
 * Output lands in hubspot/files/screens and is uploaded by the deploy.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Relative to this file, not to a machine: the first run of this on a runner
// tried to create a directory under the path it had on the author's box.
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../hubspot/files/screens");
mkdirSync(OUT, { recursive: true });

// Consent is set before the first paint so the cookie banner is not in the
// shot, and the region is pinned so each capture is of a known market.
const primer = (region) => `
  try { localStorage.setItem("novieri-consent", "all"); } catch (e) {}
  document.documentElement.setAttribute("data-region", "${region}");
`;

const shots = [
  { name: "site-home-desktop", url: "https://www.novieri.com/", w: 1440, h: 900, region: "intl" },
  { name: "site-home-mobile-es", url: "https://www.novieri.com/es", w: 414, h: 896, region: "co" },
  { name: "site-products-desktop", url: "https://www.novieri.com/products", w: 1440, h: 900, region: "intl" },
];

// Outbound traffic leaves through the sandbox's agent proxy, and its CA is on
// the system store — so Chromium is pointed at the proxy rather than having
// certificate checking turned off.
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  ...(proxy ? { proxy: { server: proxy } } : {}),
  args: ["--no-sandbox", ...(proxy ? [`--proxy-server=${proxy}`] : [])],
});
for (const s of shots) {
  const ctx = await browser.newContext({
    viewport: { width: s.w, height: s.h },
    deviceScaleFactor: 2,
    timezoneId: s.region === "co" ? "America/Bogota" : "America/New_York",
  });
  await ctx.addInitScript(primer(s.region));
  const page = await ctx.newPage();
  await page.goto(s.url, { waitUntil: "networkidle", timeout: 60000 });
  // The reveal animation runs on scroll; settle it before capturing.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/${s.name}.png` });
  console.log("captured", s.name, `${s.w}x${s.h}`, s.region);
  await ctx.close();
}
await browser.close();
