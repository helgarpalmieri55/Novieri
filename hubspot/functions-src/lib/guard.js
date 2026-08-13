/**
 * Request guards shared by the public endpoints — the Node port of what
 * server/api/common.php does for the PHP backend. Same posture: assume the
 * caller is hostile, bound everything the caller controls, and fail open only
 * where failing closed would cost a real lead.
 */
const axios = require("axios");

const HUBDB_API = "https://api.hubapi.com/cms/v3/hubdb";

/** Hosts allowed to call these endpoints. */
const ALLOWED_HOSTS = ["novieri.com", "www.novieri.com"];

function headerValue(context, name) {
  const headers = context.headers || context.request?.headers || {};
  const key = Object.keys(headers).find((h) => h.toLowerCase() === name);
  return key ? headers[key] : "";
}

/**
 * A browser attaches Origin to every cross-document POST, so a request with
 * neither Origin nor Referer is a script talking to the endpoint directly.
 * Sandbox previews (*.hs-sites.com) are allowed so the site can be tested
 * before the domain is connected.
 */
function requireKnownOrigin(context) {
  const source = headerValue(context, "origin") || headerValue(context, "referer");
  let host = "";
  try {
    host = new URL(source).hostname.toLowerCase();
  } catch {
    host = "";
  }
  const ok = ALLOWED_HOSTS.includes(host) || /\.hs-sites\.com$/.test(host) || /\.hubspotpagebuilder\.com$/.test(host);
  if (!ok) {
    console.warn(`blocked call from origin "${source || "(none)"}"`);
    return { error: { status: 403, body: { error: "forbidden" } } };
  }
  return null;
}

function clientIp(context) {
  // Only the platform-provided address; forwarded headers are caller-controlled.
  return headerValue(context, "x-real-ip") || context.request?.remoteIp || "unknown";
}

/** Strips control characters (invisible steering) and collapses whitespace. */
function cleanText(text) {
  return String(text)
    .replace(/[\u0000-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u2028\u2029\u202A-\u202E\u2060-\u2064\uFEFF]/g, " ")
    .replace(/[ \t]{3,}/g, "  ")
    .trim();
}

/**
 * The tokens the HubSpot APIs may be called with, best first.
 *
 * `HUBSPOT_APP_TOKEN` is a standalone private app token, held as a project
 * secret. It is first because it is the one whose scopes can be read, granted
 * and verified — scripts/check-hubspot-scopes.mjs calls every API these
 * functions use and reports what answers.
 *
 * `PRIVATE_APP_ACCESS_TOKEN` is a reserved keyword: `hs project upload`
 * rejects any component that names it as a secret. Reserved is not the same
 * as provided. The evidence says it is empty here — a handoff at 13:59:56
 * filed its ticket while the app declared no tickets scope and this function
 * still returned a single token, which only works if that token was the
 * standalone one and the reserved variable was blank. It stays in the list in
 * case the platform ever fills it, and second because a token whose scopes
 * are declared elsewhere is the one more likely to surprise you.
 *
 * Both of these were read the wrong way today, in both directions. Absence
 * from `hs secrets list` was taken as proof the variable was unset (it proves
 * nothing either way — a reserved name is not a secret), and then the
 * reservation was taken as proof it was set. The ticket timestamps settled
 * it, and rate limiting really had been off until this token arrived.
 */
function appTokens() {
  return [process.env.HUBSPOT_APP_TOKEN, process.env.PRIVATE_APP_ACCESS_TOKEN]
    .map((t) => (t || "").trim())
    .filter((t, i, all) => t && all.indexOf(t) === i);
}

function appToken() {
  return appTokens()[0] || "";
}

/**
 * Per-identity rate limiting, backed by a HubDB table because serverless
 * invocations share no filesystem — the PHP version's counter files would
 * evaporate between calls. Read-modify-write is not atomic, which is fine for
 * abuse control: a determined racer gains a request or two, not a bypass.
 *
 * Table `novieri_rate_limits`, columns: bucket (text), hits (text, JSON array
 * of epoch seconds). Fails open on any HubDB trouble, and says so in the log.
 */
async function enforceRateLimit(bucket, identity, max, windowSeconds) {
  const token = appToken();
  const tableId = process.env.RATE_LIMIT_TABLE_ID;
  if (!token || !tableId) return null;

  const key = `${bucket}|${identity}`;
  const auth = { headers: { Authorization: `Bearer ${token}` }, timeout: 4000 };
  const now = Math.floor(Date.now() / 1000);

  try {
    const search = await axios.get(
      `${HUBDB_API}/tables/${tableId}/rows/draft?bucket=${encodeURIComponent(key)}`,
      auth,
    );
    const row = (search.data?.results || [])[0];
    let hits = [];
    try {
      hits = JSON.parse(row?.values?.hits || "[]");
    } catch {
      hits = [];
    }
    hits = hits.filter((t) => Number.isInteger(t) && now - t < windowSeconds);

    if (hits.length >= max) {
      return { error: { status: 429, body: { error: "rate_limited" } } };
    }
    hits.push(now);
    const values = { bucket: key, hits: JSON.stringify(hits.slice(-max)) };
    if (row) {
      await axios.patch(`${HUBDB_API}/tables/${tableId}/rows/${row.id}/draft`, { values }, auth);
    } else {
      await axios.post(`${HUBDB_API}/tables/${tableId}/rows`, { values }, auth);
    }
    await axios.post(`${HUBDB_API}/tables/${tableId}/draft/push-live`, {}, auth);
    return null;
  } catch (e) {
    // Better to serve than to lock everyone out of the site.
    console.warn(`rate limit store unavailable (${e.message}) — allowing request`);
    return null;
  }
}

/**
 * Google reCAPTCHA v3. Skipped entirely while no secret is set, so the forms
 * work before the keys exist. Once set, a missing or failing token is
 * rejected — except when Google itself is unreachable.
 */
async function verifyRecaptcha(token, action) {
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) return null;
  if (!token) return { error: { status: 400, body: { error: "captcha" } } };

  try {
    const { data } = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      new URLSearchParams({ secret, response: token }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 8000 },
    );
    const min = Number(process.env.RECAPTCHA_MIN_SCORE || 0.5);
    if (data.success !== true || data.action !== action || Number(data.score || 0) < min) {
      console.warn(`recaptcha rejected: action=${data.action} score=${data.score} errors=${data["error-codes"]}`);
      return { error: { status: 400, body: { error: "captcha" } } };
    }
    return null;
  } catch (e) {
    console.warn(`recaptcha unreachable (${e.message}) — allowing submission`);
    return null;
  }
}

module.exports = { requireKnownOrigin, headerValue, clientIp, cleanText, appToken, appTokens, enforceRateLimit, verifyRecaptcha };
