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
  privacy: "We care about your privacy. Read how we handle your data in our privacy policy: https://www.novieri.com/legal/privacy-policy",
  process: "To answer your enquiry we need your permission to store and process your personal data.",
};

const ES = {
  submit: "Enviar mensaje",
  thanks: "Recibido. Te respondemos el mismo día hábil.",
  consent: "Al enviar este formulario aceptas que Novieri te contacte sobre tu consulta.",
  optIn: "También acepto recibir novedades ocasionales de Novieri. Puedes darte de baja cuando quieras.",
  privacy: "Cuidamos tu privacidad. Lee cómo tratamos tus datos en nuestra política de privacidad: https://www.novieri.com/legal/politica-de-privacidad",
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
if (prop && !prop.options.some((o) => o.value === IT_OPTION.value)) {
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
// team-size qualifier. The property comes first — an enumeration field on a
// form is rejected unless the contact property already knows its options.
const TEAM_PROP = "novieri_people_affected";
const TEAM_OPTIONS = [
  { label: "1–5", value: "1_5" },
  { label: "6–20", value: "6_20" },
  { label: "21–50", value: "21_50" },
  { label: "50+", value: "50_plus" },
];
const teamProp = await api(`/crm/v3/properties/contacts/${TEAM_PROP}`).catch(() => null);
if (!teamProp && !dryRun) {
  await api("/crm/v3/properties/contacts", {
    method: "POST",
    body: JSON.stringify({
      name: TEAM_PROP,
      label: "People affected (website form)",
      groupName: "contactinformation",
      type: "enumeration",
      fieldType: "select",
      options: TEAM_OPTIONS.map((o, n) => ({ ...o, description: "", displayOrder: n, hidden: false })),
    }),
  });
  console.log(`created contact property ${TEAM_PROP}`);
}

function hasField(patch, name) {
  let found = false;
  eachField(patch, (f) => { if (f.name === name) found = true; });
  return found;
}
/** Inserts single-field groups before the service dropdown, cloning an
    existing group's shape so HubSpot recognises the structure. */
function insertFields(patch, defs) {
  const groups = patch.fieldGroups;
  const template = groups.find((g) => (g.fields || []).length === 1) || groups[0];
  let at = groups.findIndex((g) => (g.fields || []).some((f) => f.name === "novieri_service_interest"));
  if (at === -1) at = groups.length;
  for (const d of defs) {
    if (hasField(patch, d.name)) continue;
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
  {
    objectTypeId: "0-1",
    name: TEAM_PROP,
    label: lang === "es" ? "¿Cuántas personas están afectadas?" : "How many people are affected?",
    required: false,
    hidden: false,
    fieldType: "dropdown",
    options: TEAM_OPTIONS.map((o, n) => ({ ...o, description: "", displayOrder: n })),
  },
];
insertFields(enPatch, fieldDefs("en"));
insertFields(esBody, fieldDefs("es"));

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
