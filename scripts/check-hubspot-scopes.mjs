/**
 * What the private app token can actually do.
 *
 * Two things the serverless functions need have been quietly dead: per-IP
 * rate limiting, which writes its counters to HubDB, and the chat handoff,
 * which files the transcript as a ticket. Both authenticate with the private
 * app token, and both fail open — they log and carry on — so a missing secret
 * or a missing scope looks exactly like nothing happening.
 *
 * The variable is HUBSPOT_APP_TOKEN, not PRIVATE_APP_ACCESS_TOKEN: that name
 * is a reserved keyword in an app function's config and cannot be a project
 * secret at all, which is the other half of why none of this ever ran.
 *
 * This says which it is, before a deploy depends on the answer:
 *
 *   HUBSPOT_PRIVATE_APP_TOKEN=... node scripts/check-hubspot-scopes.mjs
 *
 * The scope list comes from HubSpot's own token-info endpoint, and then each
 * API the functions use is called for real — read-only — because a scope
 * granted in the UI and an API that answers are not always the same thing.
 * Nothing here writes.
 */
const token = (process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.HUBSPOT_APP_TOKEN || "").trim();
if (!token) {
  console.error("No token. Set HUBSPOT_PRIVATE_APP_TOKEN.");
  process.exit(1);
}

const auth = { Authorization: `Bearer ${token}` };

/** What each function needs, and why — so a missing one reads as a symptom. */
const NEEDED = [
  { scope: "hubdb", why: "per-IP rate limiting on /chat and /diagnose" },
  { scope: "crm.objects.tickets.write", why: "filing a chat handoff transcript as a ticket" },
];

let failed = false;

// The scopes HubSpot says the token carries.
let scopes = [];
try {
  const res = await fetch("https://api.hubapi.com/oauth/v2/private-apps/get/access-token-info", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ tokenKey: token }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body).slice(0, 200)}`);
  scopes = body.scopes || [];
  console.log(`token   portal ${body.hubId ?? "?"}, ${scopes.length} scope(s)\n`);
} catch (e) {
  console.log(`token   could not read the scope list (${e.message})`);
  console.log("        falling back to the live calls below, which are the real test\n");
}

for (const { scope, why } of NEEDED) {
  if (!scopes.length) continue;
  const has = scopes.includes(scope);
  if (!has) failed = true;
  console.log(`${has ? "ok   " : "MISS "} ${scope.padEnd(28)} ${why}`);
}

// And what the APIs themselves say. A read is enough: if the token cannot
// list tickets it certainly cannot create one, and a 403 names the scope.
const probes = [
  ["HubDB tables", "https://api.hubapi.com/cms/v3/hubdb/tables?limit=1"],
  ["CRM tickets", "https://api.hubapi.com/crm/v3/objects/tickets?limit=1"],
];

console.log("");
for (const [label, url] of probes) {
  try {
    const res = await fetch(url, { headers: auth });
    const detail = res.ok ? "" : ` — ${(await res.text()).slice(0, 160)}`;
    if (!res.ok) failed = true;
    console.log(`${res.ok ? "ok   " : "FAIL "} ${label.padEnd(28)} ${res.status}${detail}`);
  } catch (e) {
    failed = true;
    console.log(`FAIL  ${label.padEnd(28)} ${e.message}`);
  }
}

if (failed) {
  console.error(
    "\nAdd the missing scopes in HubSpot: Settings > Integrations > Private Apps >" +
      "\nthe app > Scopes. Then rotate nothing — the token stays the same.",
  );
  process.exit(1);
}
console.log("\nThe token can do everything the functions ask of it.");
