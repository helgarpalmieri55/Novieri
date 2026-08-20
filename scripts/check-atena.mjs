/**
 * Is Atena answering?
 *
 * One request, one verdict, no dependencies. It exists in three places at
 * once: a step at the end of every deploy, a thing a person can run when they
 * suspect something, and the reference implementation for whatever external
 * monitor ends up watching this endpoint — the Novieri ops platform included.
 *
 *   node scripts/check-atena.mjs
 *   node scripts/check-atena.mjs --domain=www.novieri.com --locale=es --json
 *
 * Exit 0 when she answered, 1 when she did not. That is the whole contract,
 * so a monitor only has to read the exit code.
 *
 * What "answering" means here is deliberately stricter than "the endpoint is
 * up". A 200 with an empty body, a 200 carrying an {error} envelope, or a
 * reply too short to be a sentence all count as down, because all three look
 * identical to a visitor: the widget shows its error notice.
 *
 * The request is shaped exactly like the widget's, because the function
 * checks the Origin header and the message shape and will reject anything
 * else with a 400 that means "bad client", not "service down".
 */
const args = process.argv.slice(2);
const flag = (name, fallback) =>
  (args.find((a) => a.startsWith(`--${name}=`)) || "").split("=")[1] || fallback;

const domain = flag("domain", process.env.HUBSPOT_SITE_DOMAIN || "www.novieri.com");
const locale = flag("locale", "es");
const asJson = args.includes("--json");
const timeoutMs = Number(flag("timeout", "20000"));

/**
 * A question with exactly one correct answer, drawn from the published site,
 * so the check measures whether she can still reach her own knowledge — not
 * just whether the model replied with something.
 */
const ASK = {
  es: { message: "¿En qué ciudad está Novieri?", expect: /barranquilla/i },
  en: { message: "What city is Novieri based in?", expect: /barranquilla/i },
};

const started = Date.now();
const url = `https://${domain}/hs/serverless/chat`;
const probe = ASK[locale] || ASK.es;

function verdict(ok, reason, extra = {}) {
  const result = { ok, reason, ms: Date.now() - started, url, locale, ...extra };
  if (asJson) {
    console.log(JSON.stringify(result));
  } else {
    console.log(`${ok ? "up  " : "DOWN"}  ${url}  ${result.ms}ms  ${reason}`);
  }
  process.exit(ok ? 0 : 1);
}

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutMs);

let res;
try {
  res = await fetch(url, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      // The function rejects unknown origins. A monitor is not a browser, so
      // it has to say which page it is pretending to be.
      Origin: `https://${domain}`,
      Referer: `https://${domain}/`,
    },
    body: JSON.stringify({
      locale,
      region: "co",
      messages: [{ role: "user", content: probe.message }],
    }),
  });
} catch (e) {
  verdict(false, `no response (${e.name === "AbortError" ? `timeout after ${timeoutMs}ms` : e.message})`);
} finally {
  clearTimeout(timer);
}

const text = await res.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  verdict(false, `HTTP ${res.status}, body was not JSON`, { status: res.status, sample: text.slice(0, 200) });
}

// 429 is the site's own rate limiter, not a failure of the service. A monitor
// polling faster than the burst limit would otherwise report an outage it
// caused itself.
if (res.status === 429) verdict(true, "rate limited — the guard is working, service assumed up", { status: 429 });

if (!res.ok) verdict(false, `HTTP ${res.status} ${body?.error || ""}`.trim(), { status: res.status, error: body?.error });
if (body?.error) verdict(false, `error envelope: ${body.error}`, { status: res.status, error: body.error });

const reply = typeof body?.reply === "string" ? body.reply.trim() : "";
if (reply.length < 20) verdict(false, `reply too short (${reply.length} chars)`, { status: res.status, reply });
if (!probe.expect.test(reply)) {
  // She answered, but not from her own profile. Worth knowing — the profile
  // is generated from the site's copy, so this is how a broken build shows up.
  verdict(false, "answered, but the answer misses a fact from her own profile", {
    status: res.status,
    reply: reply.slice(0, 300),
  });
}

verdict(true, `answered in ${reply.length} chars`, { status: res.status });
