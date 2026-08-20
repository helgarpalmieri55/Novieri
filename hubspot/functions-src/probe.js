/**
 * Is anything wrong with Atena, cheaply.
 *
 * The real check — ask her a question and read the answer — costs a model
 * call, and the chat endpoint's own rate limits cap one address at 60 of
 * those a day. A monitor polling every five minutes would spend that budget
 * by mid-morning and then measure nothing but its own 429s for the rest of
 * the day.
 *
 * So the watching splits in two. This endpoint answers "is the machine
 * assembled?" — deployed, secrets present, the stores it depends on
 * reachable — for free, as often as anyone likes. The deep check
 * (scripts/check-atena.mjs) answers "can she still think?", and runs rarely.
 * Between them they cover both ways this breaks: a deploy that dropped a
 * secret, and a provider that stopped answering.
 *
 * What it deliberately does not do is call the model. A health check that
 * costs money every time it runs is a health check somebody eventually turns
 * off.
 *
 * Disclosure: the public response is one boolean. `ready:false` says
 * something is missing without saying what, because "which secret is unset"
 * is a useful sentence for the wrong reader too. Send the PROBE_TOKEN header
 * and it names names.
 *
 * This component was an emptied diagnostic — it is reused rather than created
 * because deleting or adding app components has broken this deploy before.
 */
const axios = require("axios");

const HUBDB_API = "https://api.hubapi.com/cms/v3/hubdb";

function respond(sendResponse, statusCode, body) {
  const response = { statusCode, body, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } };
  if (typeof sendResponse === "function") sendResponse(response);
  return response;
}

/** Is the HubDB table the rate limiter and the alert cooldown both need alive? */
async function storeReachable(token, tableId) {
  if (!token || !tableId) return null; // not configured, which is its own answer
  try {
    await axios.get(`${HUBDB_API}/tables/${tableId}/rows/draft?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 3000,
    });
    return true;
  } catch {
    return false;
  }
}

exports.main = async (context = {}, sendResponse) => {
  const started = Date.now();
  const token = (process.env.HUBSPOT_APP_TOKEN || "").trim();
  const tableId = (process.env.RATE_LIMIT_TABLE_ID || "").trim();

  const checks = {
    // Presence only. Never the value, never a prefix, never a length.
    anthropic_key: Boolean((process.env.ANTHROPIC_API_KEY || "").trim()),
    app_token: Boolean(token),
    rate_limit_table: Boolean(tableId),
    store_reachable: await storeReachable(token, tableId),
  };

  // store_reachable is null when the store was never configured; that is
  // already reported by rate_limit_table and should not fail the aggregate
  // twice. Only an outright false counts against readiness.
  const ready = checks.anthropic_key && checks.app_token && checks.store_reachable !== false;

  const headers = context.headers || {};
  const offered = headers["x-novieri-probe"] || headers["X-Novieri-Probe"] || "";
  const secret = (process.env.PROBE_TOKEN || "").trim();
  const trusted = Boolean(secret) && offered === secret;

  const body = {
    service: "novieri-chat",
    deployed: true,
    ready,
    ms: Date.now() - started,
  };
  if (trusted) body.checks = checks;

  // 200 when healthy, 503 when not, so a monitor that reads nothing but the
  // status code still gets the right answer.
  return respond(sendResponse, ready ? 200 : 503, body);
};
