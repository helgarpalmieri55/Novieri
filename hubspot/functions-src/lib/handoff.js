/**
 * Handing a conversation to a person.
 *
 * When a visitor asks to talk to someone real, Sylvi gives them the way
 * through — in Colombia, the WhatsApp line; everywhere else, the calendar and
 * the inbox, because that line is Colombian and Novieri does not pretend
 * otherwise. Whoever picks that up needs the conversation that led to it: the
 * visitor will open WhatsApp with "hola" and nothing else, and everything they
 * already explained is in a chat panel nobody at Novieri can see.
 *
 * So the transcript goes to the CRM as a ticket. A ticket, not a contact:
 * there is no email address at this point and inventing one to satisfy the
 * forms API would put a fake person in the database. A ticket is also what
 * this actually is — a queue of people waiting on a human.
 *
 * Delivery needs a token whose app holds the tickets scope. Without one, the
 * transcript goes to the function log, where `hs logs` can reach
 * it, and the log says plainly that it is a fallback. Nothing here may break
 * a reply: every failure is caught, logged and swallowed, because the
 * visitor's answer matters more than Novieri's copy of it.
 */
const axios = require("axios");
const { appTokens } = require("./guard.js");

const TICKETS_API = "https://api.hubapi.com/crm/v3/objects/tickets";

/** The conversation, as a person would read it. */
function transcript({ messages, reply, locale, region, page }) {
  const lines = [
    "A visitor asked to speak to a real person, and Sylvi gave them the way through.",
    "",
    `Page:     ${page || "(unknown)"}`,
    `Reading:  ${locale === "es" ? "Spanish" : "English"}`,
    `Market:   ${region === "co" ? "Colombia" : "outside Colombia"} (from the browser's timezone, so a guess)`,
    "",
    "--- conversation ---",
  ];
  for (const message of messages) {
    lines.push(`${message.role === "user" ? "Visitor" : "Sylvi"}: ${message.content}`);
  }
  lines.push(`Sylvi: ${reply}`);
  return lines.join("\n");
}

/**
 * @param {{messages: Array<{role:string,content:string}>, reply: string,
 *          locale: string, region: string, page: string}} conversation
 * @returns {Promise<boolean>} whether it reached the CRM
 */
async function deliverTranscript(conversation) {
  const body = transcript(conversation);
  const tokens = appTokens();

  if (!tokens.length) {
    // Not silent: a handoff nobody hears about is the failure this exists to
    // prevent, so it goes somewhere a person can still find it.
    console.warn(
      `handoff: no private app token, so this transcript is only in the log\n${body}`,
    );
    return false;
  }

  const properties = {
    subject: `Sylvi handoff — visitor asked for a person (${conversation.region === "co" ? "Colombia" : "international"})`,
    content: body.slice(0, 60000),
    // The default ticket pipeline and its first stage — measured against this
    // portal: pipeline 0 "Support Pipeline", stage 1 "New". Overridable
    // without a deploy if the pipeline is ever rebuilt.
    hs_pipeline: process.env.TICKET_PIPELINE_ID || "0",
    hs_pipeline_stage: process.env.TICKET_STAGE_ID || "1",
    hs_ticket_priority: "HIGH",
  };

  // Each identity in turn. A 403 means this token's app was never granted the
  // scope, which is a different problem from a bad request and the only one a
  // second token can solve — so it is the only status worth retrying. The
  // first attempt failing this way is exactly what happened here: the app
  // declared hubdb and contacts, not tickets, so every transcript 403'd into
  // a log and the visitor's reply looked perfect.
  let last;
  for (const token of tokens) {
    try {
      await axios.post(TICKETS_API, { properties }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 6000,
      });
      return true;
    } catch (e) {
      last = e;
      const status = e.response?.status;
      if (status !== 403) break;
      console.warn("handoff: token lacks the tickets scope — trying the next one");
    }
  }

  const detail = JSON.stringify(last?.response?.data || last?.message).slice(0, 400);
  console.error(`handoff: ticket creation failed (${last?.response?.status || last?.code}) — ${detail}\n${body}`);
  return false;
}

module.exports = { deliverTranscript, transcript };
