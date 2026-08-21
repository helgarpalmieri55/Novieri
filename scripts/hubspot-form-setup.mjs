/**
 * Brings the contact form in line with the site.
 *
 * Four things were wrong with it, all visible to a visitor:
 *
 * - The consent copy read "Sylvana Nova's Personal Portal". HubSpot stamps the
 *   account's company name into a form's legal text when the form is created,
 *   and the account was still named after the person who opened it. Renaming
 *   the account fixes it for forms made from now on; the text already written
 *   into this one has to be rewritten, which is what this does.
 * - "Preferred language" offered every locale HubSpot knows, several hundred
 *   of them, on a site that speaks two.
 * - The submit button said "Submit".
 * - /contacto rendered an English form. A HubSpot form has one language, so
 *   the Spanish page needs its own — built here from the English one so the
 *   two cannot drift in structure, only in wording.
 *
 *   node scripts/hubspot-form-setup.mjs --dry-run
 *   node scripts/hubspot-form-setup.mjs
 */
import { readFileSync } from "node:fs";

const TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const dryRun = process.argv.slice(2).includes("--dry-run");

const EN_FORM = "Website Contact";
const ES_FORM = "Website Contact · ES";

/** The two languages the site is published in, and nothing else. */
const LANGUAGE_OPTIONS = [
  { label: "English", value: "en", description: "", displayOrder: 0 },
  { label: "Español", value: "es", description: "", displayOrder: 1 },
];

const EN = {
  submit: "Send message",
  thanks: "Received. We'll reply within the same business day.",
  consent: "By submitting this form you agree that Novieri may contact you about your enquiry.",
  optIn: "I also agree to receive occasional updates from Novieri. You can unsubscribe at any time.",
  // An anchor, not a bare URL. privacyText is rendered as HTML by HubSpot, and
  // this string ended in a naked address that printed as plain text inside the
  // form — measured on both contact pages, `form a` count was 0. At the exact
  // moment someone hands over their personal data, the policy describing what
  // happens to it was not clickable.
  privacy: 'We care about your privacy. Read how we handle your data in our <a href="https://www.novieri.com/legal/privacy-policy">privacy policy</a>.',
  process: "To answer your enquiry we need your permission to store and process your personal data.",
};

const ES = {
  submit: "Enviar mensaje",
  thanks: "Recibido. Te respondemos el mismo día hábil.",
  consent: "Al enviar este formulario aceptas que Novieri te contacte sobre tu consulta.",
  optIn: "También acepto recibir novedades ocasionales de Novieri. Puedes darte de baja cuando quieras.",
  privacy: 'Cuidamos tu privacidad. Lee cómo tratamos tus datos en nuestra <a href="https://www.novieri.com/legal/politica-de-privacidad">política de privacidad</a>.',
  process: "Para responder tu consulta necesitamos tu permiso para almacenar y tratar tus datos personales.",
};

/**
 * Dropdown option labels, English to Spanish, from messages/*.json. Matched by
 * the English label rather than by value, because the values are HubSpot
 * property internals and the labels are what the two files agree on.
 */
const EN_MESSAGES = JSON.parse(readFileSync("messages/en.json", "utf8"));
const ES_MESSAGES = JSON.parse(readFileSync("messages/es.json", "utf8"));
const OPTION_LABELS = Object.fromEntries(
  Object.keys(EN_MESSAGES.contact.form.serviceOptions).map((key) => [
    EN_MESSAGES.contact.form.serviceOptions[key],
    ES_MESSAGES.contact.form.serviceOptions[key],
  ]),
);

/** Field labels and placeholders, by the property each field writes to. */
const ES_FIELDS = {
  firstname: { label: "Nombre", placeholder: "Tu nombre" },
  lastname: { label: "Apellido", placeholder: "Tu apellido" },
  email: { label: "Correo", placeholder: "tu@empresa.com" },
  company: { label: "Empresa", placeholder: "Nombre de tu empresa" },
  phone: { label: "Teléfono", placeholder: "" },
  message: { label: "Mensaje", placeholder: "Cuéntanos qué está pasando y qué te gustaría lograr" },
  novieri_service_interest: { label: "¿Qué necesitas?", placeholder: "" },
  hs_language: { label: "Idioma preferido", placeholder: "" },
};

async function api(path, options = {}) {
  const res = await fetch(`https://api.hubapi.com${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...options.headers },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`${res.status} ${body.message || res.statusText}`);
  return body;
}

/** Walks a form's field groups, letting `fn` rewrite each field in place. */
function eachField(form, fn) {
  for (const group of form.fieldGroups || []) {
    for (const field of group.fields || []) fn(field);
  }
}

function legal(copy) {
  return {
    type: "implicit_consent_to_process",
    communicationConsentText: copy.consent,
    communicationsCheckboxes: [{ required: false, subscriptionTypeId: null, label: copy.optIn }],
    privacyText: copy.privacy,
    consentToProcessText: copy.process,
  };
}

if (!TOKEN) {
  console.error("HUBSPOT_PRIVATE_APP_TOKEN is not set.");
  process.exit(1);
}

/**
 * IT consulting became the fifth service after the forms were built, so the
 * "What do you need?" dropdown stops one service short. The option has to
 * exist in two places: on the contact property (an enumeration rejects values
 * it does not know) and on each form's field. Property first, forms below.
 */
const IT_OPTION = { label: EN_MESSAGES.contact.form.serviceOptions.itConsulting, value: "it_consulting" };
const OTHER_LABEL = EN_MESSAGES.contact.form.serviceOptions.other;

const prop = await api("/crm/v3/properties/contacts/novieri_service_interest").catch(() => null);
// The wider scope revealed this property is a plain string — the dropdown's
// options live on the FORM, not the property. Only an enumeration takes an
// options patch; a string one 400s the whole run.
if (prop && prop.type === "enumeration" && !prop.options.some((o) => o.value === IT_OPTION.value)) {
  const options = [...prop.options];
  const at = options.findIndex((o) => o.label === OTHER_LABEL);
  options.splice(at === -1 ? options.length : at, 0, { ...IT_OPTION, hidden: false, description: "" });
  options.forEach((o, n) => (o.displayOrder = n));
  if (!dryRun) {
    await api("/crm/v3/properties/contacts/novieri_service_interest", {
      method: "PATCH",
      body: JSON.stringify({ options }),
    });
  }
  console.log(`${dryRun ? "would add" : "added"}  "${IT_OPTION.label}" to the novieri_service_interest property`);
}

/** Splices the IT consulting option into a form's service dropdown, before "other". */
function ensureItOption(f) {
  if (f.name !== "novieri_service_interest" || !Array.isArray(f.options)) return;
  if (f.options.some((o) => o.value === IT_OPTION.value)) return;
  const at = f.options.findIndex((o) => o.label === OTHER_LABEL);
  const like = f.options[0] || {};
  const option = { ...like, ...IT_OPTION, description: "" };
  f.options.splice(at === -1 ? f.options.length : at, 0, option);
  f.options.forEach((o, n) => (o.displayOrder = n));
}

const all = await api(`/marketing/v3/forms?${new URLSearchParams({ limit: "100" })}`);
const enStub = (all.results || []).find((f) => f.name === EN_FORM);
if (!enStub) {
  console.error(`no form named "${EN_FORM}"`);
  process.exit(1);
}
const en = await api(`/marketing/v3/forms/${enStub.id}`);

// --- English: fix what a visitor reads -------------------------------------
const enPatch = {
  displayOptions: { ...en.displayOptions, submitButtonText: EN.submit },
  configuration: { ...en.configuration, postSubmitAction: { type: "thank_you", value: EN.thanks } },
  legalConsentOptions: {
    ...legal(EN),
    communicationsCheckboxes: [
      {
        ...en.legalConsentOptions?.communicationsCheckboxes?.[0],
        label: EN.optIn,
      },
    ],
  },
  fieldGroups: JSON.parse(JSON.stringify(en.fieldGroups)),
};
eachField(enPatch, (f) => {
  if (f.name === "hs_language") f.options = LANGUAGE_OPTIONS;
  ensureItOption(f);
});

// --- Spanish: the same form, in Spanish ------------------------------------
const esStub = (all.results || []).find((f) => f.name === ES_FORM);
// createdAt, updatedAt and archived are required on create — not optional
// metadata, per HubSpotFormDefinitionCreateRequest in the Forms OpenAPI spec.
// Without them the POST fails with "Some required fields were not set".
const now = new Date().toISOString();
const esBody = {
  name: ES_FORM,
  formType: "hubspot",
  createdAt: now,
  updatedAt: now,
  archived: false,
  fieldGroups: JSON.parse(JSON.stringify(en.fieldGroups)),
  configuration: {
    ...en.configuration,
    language: "es",
    postSubmitAction: { type: "thank_you", value: ES.thanks },
  },
  displayOptions: { ...en.displayOptions, submitButtonText: ES.submit },
  legalConsentOptions: {
    ...legal(ES),
    communicationsCheckboxes: [
      {
        ...en.legalConsentOptions?.communicationsCheckboxes?.[0],
        label: ES.optIn,
      },
    ],
  },
};
eachField(esBody, (f) => {
  if (f.name === "hs_language") f.options = LANGUAGE_OPTIONS;
  // Before the relabel below, so the new option's English label is
  // in place for OPTION_LABELS to translate.
  ensureItOption(f);
  // A translated label over an English dropdown is worse than neither.
  if (Array.isArray(f.options)) {
    f.options = f.options.map((o) => (OPTION_LABELS[o.label] ? { ...o, label: OPTION_LABELS[o.label] } : o));
  }
  const es = ES_FIELDS[f.name];
  if (!es) return;
  f.label = es.label;
  if (es.placeholder) f.placeholder = es.placeholder;
});

// --- The review's two missing fields: an optional phone/WhatsApp and a
// company-size qualifier — the one answer that says which pricing tier a
// first contact is even in, since every tier is priced per user per month.
// The property comes first — an enumeration field on a
// form is rejected unless the contact property already knows its options.
const TEAM_PROP = "novieri_people_affected";
const TEAM_OPTIONS = [
  { label: "1–5", value: "1_5" },
  { label: "6–20", value: "6_20" },
  { label: "21–50", value: "21_50" },
  { label: "50+", value: "50_plus" },
];
let teamProp = await api(`/crm/v3/properties/contacts/${TEAM_PROP}`).catch(() => null);
if (!teamProp && !dryRun) {
  try {
    teamProp = await api("/crm/v3/properties/contacts", {
      method: "POST",
      body: JSON.stringify({
        name: TEAM_PROP,
        label: "Company size (website form)",
        groupName: "contactinformation",
        type: "enumeration",
        fieldType: "select",
        options: TEAM_OPTIONS.map((o, n) => ({ ...o, description: "", displayOrder: n, hidden: false })),
      }),
    });
    console.log(`created contact property ${TEAM_PROP}`);
  } catch (e) {
    // The private app can edit forms but not mint contact properties. The
    // phone field rides on a default property and ships regardless; this one
    // waits for the scope rather than failing the whole run.
    console.log(`cannot create ${TEAM_PROP}: ${String(e.message).slice(0, 120)}`);
    console.log("add the crm.schemas.contacts.write scope to the private app and re-run to get the team-size field.");
  }
}

// The diagnostic's optional "a founder may contact me" checkbox lands on
// this property; the serverless function sends it only when ticked.
const FOLLOWUP_PROP = "novieri_diagnostic_followup";
const followupProp = await api(`/crm/v3/properties/contacts/${FOLLOWUP_PROP}`).catch(() => null);
if (!followupProp && !dryRun) {
  try {
    await api("/crm/v3/properties/contacts", {
      method: "POST",
      body: JSON.stringify({
        name: FOLLOWUP_PROP,
        label: "Diagnostic: founder follow-up requested",
        groupName: "contactinformation",
        type: "enumeration",
        fieldType: "booleancheckbox",
        options: [
          { label: "Yes", value: "true", description: "", displayOrder: 0, hidden: false },
          { label: "No", value: "false", description: "", displayOrder: 1, hidden: false },
        ],
      }),
    });
    console.log(`created contact property ${FOLLOWUP_PROP}`);
  } catch (e) {
    console.log(`cannot create ${FOLLOWUP_PROP}: ${String(e.message).slice(0, 120)}`);
  }
}

function hasField(patch, name) {
  let found = false;
  eachField(patch, (f) => { if (f.name === name) found = true; });
  return found;
}
/**
 * Makes the form's fields match the definitions below.
 *
 * A missing field is inserted before the service dropdown, cloning an
 * existing group's shape so HubSpot recognises the structure. A field that is
 * already there has its wording corrected in place — which this used to skip
 * entirely, with `if (hasField) continue`. The consequence was quiet: a label
 * fixed here changed nothing on the live form, the run went green, and the old
 * wording stayed up. A script that only ever adds is not a script that makes
 * the form match this file.
 *
 * Only the wording is reconciled. Whether a field is required, and what order
 * the groups are in, are things someone may legitimately have changed in the
 * editor, and overwriting those from here would be a worse habit than the one
 * this fixes.
 */
function syncFields(patch, defs) {
  const groups = patch.fieldGroups;
  const template = groups.find((g) => (g.fields || []).length === 1) || groups[0];
  let at = groups.findIndex((g) => (g.fields || []).some((f) => f.name === "novieri_service_interest"));
  if (at === -1) at = groups.length;
  for (const d of defs) {
    if (hasField(patch, d.name)) {
      eachField(patch, (f) => {
        if (f.name !== d.name) return;
        for (const key of ["label", "placeholder"]) {
          if (d[key] !== undefined && f[key] !== d[key]) {
            console.log(`  field ~ ${d.name} ${key}: "${f[key]}" -> "${d[key]}"`);
            f[key] = d[key];
          }
        }
      });
      continue;
    }
    groups.splice(at, 0, { ...template, fields: [d] });
    at += 1;
    console.log(`  field + ${d.name} — "${d.label}"`);
  }
}
const fieldDefs = (lang) => [
  {
    objectTypeId: "0-1",
    name: "phone",
    label: lang === "es" ? "Teléfono o WhatsApp (opcional)" : "Phone or WhatsApp (optional)",
    required: false,
    hidden: false,
    fieldType: "phone",
  },
  ...(teamProp ? [{
    objectTypeId: "0-1",
    name: TEAM_PROP,
    // A sizing question, asked plainly. It shipped as "How many people are
    // affected?" — a support-desk question about an incident, on a form where
    // nobody has an incident yet, above four options that are obviously
    // headcount bands. The property name keeps its old spelling because a
    // contact property cannot be renamed without moving every value on it;
    // the label is what anyone reads.
    label: lang === "es" ? "¿Cuántas personas trabajan en tu empresa?" : "How many people work at your company?",
    required: false,
    hidden: false,
    fieldType: "dropdown",
    options: TEAM_OPTIONS.map((o, n) => ({ ...o, description: "", displayOrder: n })),
  }] : []),
];
syncFields(enPatch, fieldDefs("en"));
syncFields(esBody, fieldDefs("es"));

if (dryRun) {
  console.log(`patch  ${EN_FORM} (${en.id}) — submit "${EN.submit}", ${LANGUAGE_OPTIONS.length} languages, consent rewritten`);
  console.log(`${esStub ? "patch " : "create"} ${ES_FORM}${esStub ? ` (${esStub.id})` : ""} — ${Object.keys(ES_FIELDS).length} translatable fields`);
  process.exit(0);
}

await api(`/marketing/v3/forms/${en.id}`, { method: "PATCH", body: JSON.stringify(enPatch) });
console.log(`patched  ${EN_FORM} ${en.id}`);

const es = esStub
  ? await api(`/marketing/v3/forms/${esStub.id}`, { method: "PATCH", body: JSON.stringify(esBody) })
  : await api(`/marketing/v3/forms`, { method: "POST", body: JSON.stringify(esBody) });
console.log(`${esStub ? "patched " : "created "} ${ES_FORM} ${es.id}`);
console.log("\nRun the contact fills next so /contacto points at the Spanish form.");
