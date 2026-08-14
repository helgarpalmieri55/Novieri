/**
 * End-to-end test of the chat handoff.
 *
 * Sylvi gives out the WhatsApp number when a visitor asks for a person, and
 * the conversation that led there is filed as a ticket so whoever answers has
 * already read it. Four things have to line up for that: the number reaching
 * the prompt, the handoff being detected in the reply, a token in the
 * function's environment, and the tickets scope on that token. Three of them
 * fail open — the visitor still gets an answer — so the only way to know the
 * transcript arrived is to look for it.
 *
 *   HUBSPOT_PRIVATE_APP_TOKEN=... node scripts/check-chat-handoff.mjs
 *
 * It holds a real conversation with the live endpoint and then searches the
 * CRM for the ticket. The visitor's line says it is a test, so the ticket is
 * self-identifying in the queue — close it when you see it.
 */
const token = (process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.HUBSPOT_APP_TOKEN || "").trim();
const domain = process.env.HUBSPOT_SITE_DOMAIN || "www.novieri.com";
if (!token) {
  console.error("No token. Set HUBSPOT_PRIVATE_APP_TOKEN.");
  process.exit(1);
}

const MARKER = "automated handoff test";
const since = Date.now() - 60_000;

/**
 * --list shows the handoff queue instead of adding to it: every ticket Sylvi
 * has filed in the last few hours, newest first. Useful on its own, and it is
 * how you tell a handoff that never happened from one the search index had
 * not caught up with yet.
 */
if (process.argv.includes("--list")) {
  const hours = Number((process.argv.find((a) => a.startsWith("--hours=")) || "").split("=")[1] || 6);
  const res = await fetch("https://api.hubapi.com/crm/v3/objects/tickets/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: "createdate", operator: "GT", value: String(Date.now() - hours * 3600_000) }] }],
      properties: ["subject", "content", "createdate"],
      sorts: [{ propertyName: "createdate", direction: "DESCENDING" }],
      limit: 50,
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    console.error(`ticket search returned ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
    process.exit(1);
  }
  const handoffs = (body.results || []).filter((t) => (t.properties.subject || "").startsWith("Sylvi handoff"));
  console.log(`${body.total || 0} ticket(s) in the last ${hours}h, ${handoffs.length} of them handoffs:\n`);
  for (const t of handoffs) {
    console.log(`  ${t.properties.createdate}  ${t.id}  ${t.properties.subject}`);
  }
  process.exit(0);
}

// A Colombian visitor asking for a person: the one case that should produce
// both the number and a ticket.
const res = await fetch(`https://${domain}/hs/serverless/chat`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: `https://${domain}`,
    Referer: `https://${domain}/contacto`,
  },
  body: JSON.stringify({
    locale: "es",
    region: "co",
    messages: [
      {
        role: "user",
        content: `Hola, esto es un ${MARKER} — necesito hablar con una persona real, no con un bot.`,
      },
    ],
  }),
});
const chat = await res.json();
if (!res.ok || !chat.reply) {
  console.error(`chat endpoint returned ${res.status}: ${JSON.stringify(chat).slice(0, 300)}`);
  process.exit(1);
}
console.log(`reply   ${chat.reply.replace(/\s+/g, " ").slice(0, 160)}…\n`);

const gaveNumber = /3\D{0,2}0\D{0,2}0\D{0,2}8\D{0,2}5\D{0,2}1\D{0,2}6\D{0,2}3\D{0,2}0\D{0,2}0/.test(chat.reply);
const leaked = /\[\[\s*HANDOFF\s*\]\]/i.test(chat.reply);
console.log(`${gaveNumber ? "ok   " : "FAIL "} the number reached a Colombian visitor who asked for a person`);
console.log(`${leaked ? "FAIL " : "ok   "} the handoff token was stripped before the reply went out`);

/**
 * The ticket. Searched by creation time rather than by subject, so a changed
 * subject line shows up as the wrong ticket instead of as no ticket at all.
 *
 * Polled, because CRM search is not read-your-writes: a ticket created two
 * seconds ago is not in the index yet, and asking once said "no ticket" about
 * a feature that was working. The first version of this check did exactly
 * that and sent me looking for a bug that was not there.
 */
async function findTicket() {
  const search = await fetch("https://api.hubapi.com/crm/v3/objects/tickets/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: "createdate", operator: "GT", value: String(since) }] }],
      properties: ["subject", "content", "createdate"],
      sorts: [{ propertyName: "createdate", direction: "DESCENDING" }],
      limit: 10,
    }),
  });
  const body = await search.json();
  if (!search.ok) {
    console.error(`\nFAIL  ticket search returned ${search.status}: ${JSON.stringify(body).slice(0, 300)}`);
    process.exit(1);
  }
  return body;
}

let found = { results: [] };
let ticket;
for (let attempt = 1; attempt <= 8 && !ticket; attempt += 1) {
  if (attempt > 1) await new Promise((r) => setTimeout(r, 8000));
  found = await findTicket();
  ticket = (found.results || []).find((t) => (t.properties.content || "").includes(MARKER));
  if (!ticket) console.log(`      waiting for the search index (${attempt}/8)`);
}
if (!ticket) {
  console.error(`\nFAIL  no ticket carrying the transcript appeared, after a minute of polling.`);
  console.error(`      ${found.total || 0} ticket(s) created in that window.\n`);

  // The function swallows its own failures so a broken CRM cannot cost a
  // visitor their answer, which means the reason is only in a log nobody
  // reads. So make the same call from here, where the error is visible.
  const pipelines = await fetch("https://api.hubapi.com/crm/v3/pipelines/tickets", {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  console.error("      ticket pipelines this portal actually has:");
  for (const p of pipelines.results || []) {
    console.error(`        pipeline ${p.id} "${p.label}" — stages ${(p.stages || []).map((s) => `${s.id} "${s.label}"`).join(", ")}`);
  }

  const probe = await fetch("https://api.hubapi.com/crm/v3/objects/tickets", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      properties: {
        subject: `Sylvi handoff — ${MARKER}`,
        content: MARKER,
        hs_pipeline: process.env.TICKET_PIPELINE_ID || "0",
        hs_pipeline_stage: process.env.TICKET_STAGE_ID || "1",
        hs_ticket_priority: "HIGH",
      },
    }),
  });
  const probeBody = await probe.text();
  console.error(`\n      the same call, made from here: ${probe.status}`);
  console.error(`      ${probeBody.slice(0, 500)}`);
  process.exit(1);
}

console.log(`ok    ticket ${ticket.id} — "${ticket.properties.subject}"`);
console.log(`\n--- what a founder would read ---\n${ticket.properties.content}`);
console.log(`\nClose ticket ${ticket.id}; it is this test and nothing else.`);
if (!gaveNumber || leaked) process.exit(1);
