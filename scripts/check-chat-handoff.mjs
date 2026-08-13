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

// The ticket. Searched by creation time rather than by subject, so a changed
// subject line shows up as the wrong ticket instead of as no ticket at all.
const search = await fetch("https://api.hubapi.com/crm/v3/objects/tickets/search", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    filterGroups: [{ filters: [{ propertyName: "createdate", operator: "GT", value: String(since) }] }],
    properties: ["subject", "content", "createdate"],
    sorts: [{ propertyName: "createdate", direction: "DESCENDING" }],
    limit: 5,
  }),
});
const found = await search.json();
if (!search.ok) {
  console.error(`\nFAIL  ticket search returned ${search.status}: ${JSON.stringify(found).slice(0, 300)}`);
  process.exit(1);
}

const ticket = (found.results || []).find((t) => (t.properties.content || "").includes(MARKER));
if (!ticket) {
  console.error(`\nFAIL  no ticket carrying the transcript was created in the last minute.`);
  console.error(`      ${found.total || 0} ticket(s) created in that window.`);
  process.exit(1);
}

console.log(`ok    ticket ${ticket.id} — "${ticket.properties.subject}"`);
console.log(`\n--- what a founder would read ---\n${ticket.properties.content}`);
console.log(`\nClose ticket ${ticket.id}; it is this test and nothing else.`);
if (!gaveNumber || leaked) process.exit(1);
