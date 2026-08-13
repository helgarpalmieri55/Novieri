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
 * Delivery needs the private app token and the tickets scope on it. Without
 * either, the transcript goes to the function log, where `hs logs` can reach
 * it, and the log says plainly that it is a fallback. Nothing here may break
 * a reply: every failure is caught, logged and swallowed, because the
 * visitor's answer matters more than Novieri's copy of it.
 */
const axios = require("axios");
const { appToken } = require("./guard.js");

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
  const token = appToken();

  if (!token) {
    // Not silent: a handoff nobody hears about is the failure this exists to
    // prevent, so it goes somewhere a person can still find it.
    console.warn(
      `handoff: no private app token, so this transcript is only in the log\n${body}`,
    );
    return false;
  }

  try {
    await axios.post(
      TICKETS_API,
      {
        properties: {
          subject: `Sylvi handoff — visitor asked for a person (${conversation.region === "co" ? "Colombia" : "international"})`,
          content: body.slice(0, 60000),
          // The default ticket pipeline and its first stage. Overridable
          // without a deploy if the portal's pipeline is ever rebuilt.
          hs_pipeline: process.env.TICKET_PIPELINE_ID || "0",
          hs_pipeline_stage: process.env.TICKET_STAGE_ID || "1",
          hs_ticket_priority: "HIGH",
        },
      },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 6000 },
    );
    return true;
  } catch (e) {
    const detail = JSON.stringify(e.response?.data || e.message).slice(0, 400);
    console.error(`handoff: ticket creation failed (${e.response?.status || e.code}) — ${detail}\n${body}`);
    return false;
  }
}

module.exports = { deliverTranscript, transcript };
