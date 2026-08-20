/**
 * Does the header actually fit the screen it is on?
 *
 * This exists because every horizontal-overflow assertion this project has
 * ever run reported the site clean while the header was pushing its primary
 * call to action off the viewport at five widths. `.site-header` is
 * `position: fixed`, so it contributes nothing to `document.scrollWidth` —
 * the page-level check was structurally incapable of seeing it. Measured on
 * the live site before the fix: at 768 the bar needed 1016px in English and
 * 1093 in Spanish, and "Book a call" / "Agendar llamada" was not on screen
 * between 768 and 1023. In Spanish it was still cut in half at 1024.
 *
 * So this measures the bar, not the document: its own scrollWidth against the
 * viewport, plus an explicit check that the booking button's right edge is
 * inside the screen, in both languages, at every width where the layout
 * changes hands between the drawer and the desktop nav.
 *
 *   node scripts/check-header-fit.mjs [--domain=www.novieri.com]
 */
import pw from "playwright";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Playwright's own default is a headless shell that a CI runner installs and
 * this project's sandbox does not have; the sandbox instead ships a full
 * Chromium under a versioned /opt path. Resolve whichever is actually here
 * rather than making the caller know which environment they are in.
 */
function chromium() {
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (existsSync(root)) {
    for (const dir of readdirSync(root)) {
      if (!dir.startsWith("chromium-")) continue;
      const bin = join(root, dir, "chrome-linux", "chrome");
      if (existsSync(bin)) return bin;
    }
  }
  return undefined; // let Playwright find its own
}

const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || "").split("=")[1] || d;
const domain = arg("domain", "www.novieri.com");
const WIDTHS = [320, 360, 375, 390, 430, 768, 820, 900, 1024, 1100, 1280, 1440];
const PAGES = [
  { path: "/", label: "en" },
  { path: "/es", label: "es" },
];

const browser = await pw.chromium.launch({
  executablePath: chromium(),
  args: ["--ssl-version-max=tls1.2"],
});

const failures = [];
for (const { path, label } of PAGES) {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    try {
      await page.goto(`https://${domain}${path}?hsDebug=true`, { waitUntil: "load", timeout: 60000 });
      const r = await page.evaluate((vw) => {
        const bar = document.querySelector(".header-bar");
        if (!bar) return { missing: true };
        // The booking control, whichever of the two breakpoint variants is live.
        const cta = [...bar.querySelectorAll("a.btn-primary")].find(
          (a) => getComputedStyle(a).display !== "none" && a.getBoundingClientRect().width > 0,
        );
        return {
          scrollWidth: bar.scrollWidth,
          clientWidth: bar.clientWidth,
          ctaRight: cta ? Math.round(cta.getBoundingClientRect().right) : null,
          ctaText: cta ? cta.innerText.trim() : null,
          viewport: vw,
        };
      }, width);

      if (r.missing) {
        failures.push(`${label} @${width}: no .header-bar on the page`);
      } else {
        if (r.scrollWidth > r.clientWidth) {
          failures.push(`${label} @${width}: header-bar needs ${r.scrollWidth}px in a ${r.clientWidth}px bar`);
        }
        if (r.ctaRight === null) {
          failures.push(`${label} @${width}: no visible booking button in the header`);
        } else if (r.ctaRight > width) {
          failures.push(`${label} @${width}: "${r.ctaText}" ends at ${r.ctaRight}, past the ${width}px viewport`);
        }
      }
    } finally {
      await page.close();
    }
  }
}
await browser.close();

if (failures.length) {
  console.error(`check-header-fit: ${failures.length} failure(s)`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`check-header-fit: OK — header fits and the booking button is on screen at ${WIDTHS.length} widths × ${PAGES.length} locales.`);
