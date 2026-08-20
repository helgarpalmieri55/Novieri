/**
 * Telling a person when Atena breaks.
 *
 * Every failure path in chat.js used to end at `console.error`. That log is
 * real and `hs logs` can read it, but nobody reads it: the assistant could
 * stop answering on a Friday and the first anyone would know is a founder
 * opening the widget to show someone. Visitors see a polite error and leave,
 * and the site's own products page sells "monitoring, alerts that arrive".
 *
 * So a failure now opens a ticket — the same queue the handoff transcripts
 * land in, which is somewhere the founders already look.
 *
 * Two channels, on purpose, because they fail for different reasons:
 *
 *   1. A CRM ticket. Rich, actionable, and it sits in the pipeline next to
 *      the conversations it interrupted.
 *   2. A form submission, if ALERT_FORM_GUID names one. The Forms API needs
 *      no authentication at all — portal id and form guid are public values —
 *      so it still works when the ticket API is the thing that is broken,
 *      and a HubSpot form fires its own notification email.
 *
 * Channel 2 is what makes a failed handoff reportable. When deliverTranscript
 * returns false the ticket API has just refused us; announcing that over the
 * ticket API would be shouting down the same dead line.
 *
 * Nothing here may break a response. Every failure is caught and swallowed:
 * the visitor's error message matters more than Novieri's copy of it.
 */
const axios = require("axios");
const { appTokens } = require("./guard.js");
const { submitForm } = require("./leads.js");

const TICKETS_API = "https://api.hubapi.com/crm/v3/objects/tickets";
const HUBDB_API = "https://api.hubapi.com/cms/v3/hubdb";

/**
 * One alert per kind per hour. An Anthropic outage that lasts all afternoon
 * is one ticket, not one per visitor who walked into it.
 */
const COOLDOWN_SECONDS = Number(process.env.ALERT_COOLDOWN || 3600);

/**
 * What each failure means, in the words a person needs at 7am on a Sunday
 * before they have any context. `check` is ordered: most likely cause first.
 */
const KINDS = {
  not_configured: {
    summary: "the Anthropic API key is missing",
    visitors: "Every visitor who opens the chat gets an error. Atena has not answered anyone since this started.",
    check: [
      "HubSpot → Developer projects → Novieri site → the ANTHROPIC_API_KEY secret still exists",
      "The last deploy did not drop the secret (a renamed secret reads as unset)",
    ],
  },
  upstream: {
    summary: "the AI provider rejected or dropped our request",
    visitors: "Every visitor who opens the chat gets an error until this clears.",
    check: [
      "The Anthropic account has credit and the key is still active",
      "status.anthropic.com for an ongoing incident",
      "The model name in chat.js is still one the account can call",
    ],
  },
  rate_limited: {
    summary: "the AI provider is rate-limiting us",
    visitors: "Some visitors are being turned away. Others get through.",
    check: [
      "Whether real traffic caused this or something is looping",
      "The account's rate limits against the current volume",
    ],
  },
  empty: {
    summary: "the model returned nothing to say",
    visitors: "The visitor got an error instead of a reply.",
    check: [
      "Rare and usually transient — if it repeats, the prompt or the profile is the suspect",
    ],
  },
  handoff: {
    summary: "a visitor asked for a person and the transcript never reached the CRM",
    visitors:
      "This one is costly and silent: the visitor got a perfect goodbye and the WhatsApp number. Nobody at Novieri has their conversation. If they write, they will open with 'hola' and nothing else.",
    check: [
      "The private app still holds the tickets scope (a scope granted in a UI can be revoked in one)",
      "The ticket pipeline and stage ids in TICKET_PIPELINE_ID / TICKET_STAGE_ID still exist",
      "The function log for the transcript — it is written there as a fallback, so the lead is not lost yet",
    ],
  },
};

/** The ticket body, written for whoever opens it cold. */
function report(kind, detail, where) {
  const k = KINDS[kind] || { summary: kind, visitors: "", check: [] };
  const lines = [
    `Atena stopped working: ${k.summary}.`,
    "",
    `What the server saw:  ${detail || "(no detail)"}`,
    `When:                 ${new Date().toISOString()}`,
  ];
  if (where?.page) lines.push(`Page:                 ${where.page}`);
  if (where?.locale) lines.push(`Reading:              ${where.locale === "es" ? "Spanish" : "English"}`);
  lines.push("", "What this means for visitors:", `  ${k.visitors}`, "", "What to check, in order:");
  k.check.forEach((line, i) => lines.push(`  ${i + 1}. ${line}`));
  lines.push(
    "",
    `Repeat alerts of this kind are suppressed for ${Math.round(COOLDOWN_SECONDS / 60)} minutes,`,
    "so a long outage is one ticket rather than one per affected visitor.",
  );
  return lines.join("\n");
}

/**
 * Have we already said this in the cooldown window?
 *
 * Backed by the same HubDB table the rate limiter uses, and read from the
 * draft surface it already writes to, so this needs no new table and no
 * push-live round trip. Two calls, not three.
 *
 * Fails *open* — an unreachable HubDB means we alert. Over-reporting a real
 * outage beats staying quiet through one, and this path only runs when
 * something is already broken.
 */
async function alreadyReported(kind, token, deadline) {
  const tableId = process.env.RATE_LIMIT_TABLE_ID;
  if (!token || !tableId) return false;
  const key = `alert|${kind}`;
  const now = Math.floor(Date.now() / 1000);
  const auth = (ms) => ({ headers: { Authorization: `Bearer ${token}` }, timeout: ms });

  try {
    let budget = deadline - Date.now();
    if (budget < 400) return false;
    const search = await axios.get(
      `${HUBDB_API}/tables/${tableId}/rows/draft?bucket=${encodeURIComponent(key)}`,
      auth(Math.min(budget, 1500)),
    );
    const row = (search.data?.results || [])[0];
    const last = Number(row?.values?.hits ? JSON.parse(row.values.hits)[0] : 0) || 0;
    if (now - last < COOLDOWN_SECONDS) return true;

    budget = deadline - Date.now();
    if (budget < 400) return false;
    const values = { bucket: key, hits: JSON.stringify([now]) };
    if (row) {
      await axios.patch(`${HUBDB_API}/tables/${tableId}/rows/${row.id}/draft`, { values }, auth(Math.min(budget, 1200)));
    } else {
      await axios.post(`${HUBDB_API}/tables/${tableId}/rows`, { values }, auth(Math.min(budget, 1200)));
    }
    return false;
  } catch (e) {
    console.warn(`alert: cooldown store unreachable (${e.message}) — reporting anyway`);
    return false;
  }
}

/**
 * @param {string} kind          one of KINDS
 * @param {string} detail        what the server actually saw
 * @param {{page?:string, locale?:string, deadline?:number}} where
 *        `deadline` is an epoch-ms budget. The platform kills a function at
 *        15s and this runs on paths that have already spent most of that, so
 *        every step checks the clock and gives up rather than being killed
 *        mid-write. A visitor waiting on an error message should not wait
 *        longer for our bookkeeping.
 * @returns {Promise<boolean>} whether a person will hear about it
 */
async function reportOutage(kind, detail, where = {}) {
  const deadline = where.deadline || Date.now() + 3500;
  const body = report(kind, detail, where);
  const [token] = appTokens();

  if (await alreadyReported(kind, token, deadline)) return true;

  if (token && deadline - Date.now() > 600) {
    try {
      await axios.post(
        TICKETS_API,
        {
          properties: {
            subject: `Atena is down — ${(KINDS[kind] || {}).summary || kind}`,
            content: body.slice(0, 60000),
            hs_pipeline: process.env.TICKET_PIPELINE_ID || "0",
            hs_pipeline_stage: process.env.TICKET_STAGE_ID || "1",
            hs_ticket_priority: "HIGH",
          },
        },
        { headers: { Authorization: `Bearer ${token}` }, timeout: Math.min(deadline - Date.now(), 2500) },
      );
      return true;
    } catch (e) {
      console.error(`alert: ticket creation failed (${e.response?.status || e.code}) — falling back to the form`);
    }
  }

  // Channel two. Unauthenticated by design, so it survives exactly the
  // failures that stop channel one.
  const guid = process.env.ALERT_FORM_GUID;
  if (guid && deadline - Date.now() > 400) {
    const ok = await submitForm(
      guid,
      { email: process.env.ALERT_EMAIL || "info@novieri.com", message: body.slice(0, 4000) },
      {},
      "",
      Math.min(deadline - Date.now(), 2500),
    );
    if (ok) return true;
  }

  console.error(`alert: no channel reached a person\n${body}`);
  return false;
}

module.exports = { reportOutage, report, KINDS };
