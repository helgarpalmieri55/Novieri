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
import { existsSync, mkdirSync } from "node:fs";
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

// Each shot pins three things, because the site reacts to all three: the
// browser's language (language-preference.js sends a first-time visitor to
// their own language — the first capture of /es came back in English because
// the browser said en-US), the timezone (which decides the market), and the
// viewport.
const shots = [
  { name: "site-home-desktop", url: "https://www.novieri.com/", w: 1440, h: 900, region: "intl", locale: "en-US" },
  { name: "site-home-mobile-es", url: "https://www.novieri.com/es", w: 414, h: 896, region: "co", locale: "es-CO" },
  { name: "site-products-desktop", url: "https://www.novieri.com/products", w: 1440, h: 900, region: "intl", locale: "en-US" },
];

// Nothing below assumes a particular machine.
//
// A CI runner installs its own Chromium and Playwright knows where it is; a
// sandbox that ships one pre-installed does not, and points PLAYWRIGHT_BROWSERS_PATH
// at it. Take that path only when something is actually there, otherwise let
// Playwright resolve its own — hardcoding the sandbox's copy is what broke the
// first two runs here.
const preinstalled = process.env.PLAYWRIGHT_BROWSERS_PATH
  ? `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium`
  : "";
// A proxy is likewise environment-specific: present in a sandbox, absent on a
// runner with direct network.
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch({
  ...(preinstalled && existsSync(preinstalled) ? { executablePath: preinstalled } : {}),
  ...(proxy ? { proxy: { server: proxy } } : {}),
  args: ["--no-sandbox", ...(proxy ? [`--proxy-server=${proxy}`] : [])],
});
for (const s of shots) {
  const ctx = await browser.newContext({
    viewport: { width: s.w, height: s.h },
    deviceScaleFactor: 2,
    locale: s.locale,
    timezoneId: s.region === "co" ? "America/Bogota" : "America/New_York",
  });
  await ctx.addInitScript(primer(s.region));
  const page = await ctx.newPage();
  await page.goto(s.url, { waitUntil: "networkidle", timeout: 60000 });
  // The reveal animation runs on scroll; settle it before capturing.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1800);
  const got = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    url: location.pathname,
  }));
  const wanted = s.locale.slice(0, 2);
  if (got.lang.slice(0, 2) !== wanted) {
    throw new Error(
      `${s.name}: asked for ${wanted} and landed on ${got.lang} at ${got.url} — the capture would show the wrong language`,
    );
  }
  await page.screenshot({ path: `${OUT}/${s.name}.png` });
  console.log("captured", s.name, `${s.w}x${s.h}`, s.region, got.lang, got.url);
  await ctx.close();
}
await browser.close();
