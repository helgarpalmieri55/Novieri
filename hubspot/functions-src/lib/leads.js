/**
 * Lead delivery into HubSpot.
 *
 * Submissions go through the Forms Submission API rather than the CRM API,
 * for the same reason the PHP backend does: only a form submission counts as
 * a conversion. It enrols the contact in form-submission workflows, fires the
 * notification, shows in campaign reporting, and lands on the timeline as a
 * real submission. A contact created through the CRM API arrives silently —
 * and the follow-up email this page promises is a workflow on that form.
 *
 * The endpoint needs no authentication: the portal id and form guid identify
 * it, and both are public values.
 *
 * Nothing here may break a submission. Every failure is logged and swallowed,
 * because the visitor's report matters more than the CRM copy of it.
 */
const axios = require("axios");

/**
 * @param {string} formGuid
 * @param {Record<string,string>} fields  HubSpot property name => value
 * @param {{hutk?:string,pageUri?:string,pageName?:string,ipAddress?:string}} context
 * @param {string} consentText  The consent copy the visitor accepted
 */
async function submitForm(formGuid, fields, context = {}, consentText = "") {
  // The portal id is a public value — it is in every embed code and in every
  // /hubfs/ URL this site serves — but it was only ever read from an
  // environment variable that no function declares and the portal has never
  // held. So this guard failed on every submission and every diagnostic lead
  // was dropped, quietly, on the one path that promises a follow-up email.
  // The default is the id, taken from the file-manager URLs the theme already
  // hardcodes; the variable still wins if it is ever set.
  const portal = (process.env.HUBSPOT_PORTAL_ID || "45528787").trim();
  const guid = (formGuid || "").trim();
  if (!portal || !guid) {
    console.warn("leads: portal id or form guid missing — skipping CRM delivery");
    return false;
  }

  const payload = {
    submittedAt: Date.now(),
    fields: Object.entries(fields)
      .map(([name, value]) => [name, String(value ?? "").trim()])
      .filter(([, value]) => value !== "")
      .map(([name, value]) => ({ objectTypeId: "0-1", name, value: value.slice(0, 60000) })),
    context: {},
  };
  if (!payload.fields.length) return false;

  // The tracking cookie is what links this submission to everything the
  // visitor read beforehand. Absent when they declined cookies — the
  // submission still lands, just without browsing attribution.
  for (const key of ["hutk", "pageUri", "pageName", "ipAddress"]) {
    if (context[key]) payload.context[key] = String(context[key]).slice(0, 1000);
  }
  if (consentText) {
    payload.legalConsentOptions = {
      consent: { consentToProcess: true, text: consentText.slice(0, 1000) },
    };
  }

  try {
    await axios.post(
      `https://api.hsforms.com/submissions/v3/integration/submit/${portal}/${guid}`,
      payload,
      { headers: { "Content-Type": "application/json" }, timeout: 8000 },
    );
    return true;
  } catch (e) {
    const detail = JSON.stringify(e.response?.data || e.message).slice(0, 400);
    console.error(`leads: submission failed (${e.response?.status || e.code}) — ${detail}`);
    return false;
  }
}

module.exports = { submitForm };
