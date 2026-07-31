<?php

/**
 * Novieri backend configuration — copy this file to config.php in the same
 * directory ON THE SERVER and fill in the values.
 *
 * config.php is intentionally NOT in the repository and the deploy workflow
 * never uploads or deletes it, so your keys survive every deploy. .htaccess
 * blocks direct HTTP access to it. This is also the place for any other
 * integration keys you add (tracking codes, CRM keys, ...) — the endpoints
 * only read the keys listed below and ignore the rest.
 */
return [
    // Anthropic API key for the website chatbot (chat.php) and the
    // self-diagnosis report (diagnose.php). While empty, both answer 503 and
    // the widget shows its error state. This is the only place it lives.
    'anthropic_api_key' => '',

    // Abuse ceilings. Per-IP burst (5/min) and session (20/15 min) limits are
    // fixed in chat.php; these two are the ones worth tuning, because they
    // bound the monthly bill. 'chat_daily_total' is site-wide, so it holds
    // even against someone rotating IP addresses.
    'chat_daily_per_ip'    => 60,
    'chat_daily_total'     => 800,
    'diagnose_daily_total' => 100,

    // Optional extra salt for the signature on chatbot replies (the backend
    // uses it to tell its own words from a forged conversation). Any random
    // string; changing it only invalidates chats already open in a browser.
    'chat_secret' => '',

    // GoDaddy mailbox used by the contact form (contact.php).
    // Create the mailbox in your GoDaddy panel first (e.g. sales@novieri.com).
    'smtp_host' => 'smtpout.secureserver.net',
    'smtp_port' => 465, // implicit SSL
    'smtp_user' => 'sales@novieri.com',
    'smtp_pass' => '',

    // Where form submissions arrive / the From identity they are sent with.
    'mail_to'   => 'sales@novieri.com',
    'mail_from' => 'sales@novieri.com',

    // HubSpot (account region na1, which api.hsforms.com serves; an eu1
    // account would need api-eu1.hsforms.com in hubspot.php). The Forms API
    // needs no token — the portal id and form GUID identify the submission.
    'hubspot_portal_id' => '45528787',

    // If a diagnostic submission is rejected for unknown fields while the
    // contact form works, these two are the wrong way round — swap them.
    'hubspot_form_contact'    => '21f27f61-c4bf-4076-8bdb-5d9d4c45d258',
    'hubspot_form_diagnostic' => '42957848-6780-467b-8f8b-4e5944e2ebe0',

    // Private App access token (Settings > Integrations > Private Apps).
    // API keys were deprecated by HubSpot and no longer work. Only needed
    // for writing the diagnosis as a note on the contact timeline; leave
    // empty and everything else still works.
    'hubspot_token' => '',

    // Google reCAPTCHA v3 (google.com/recaptcha/admin -> create a v3 site).
    // The SITE key is public and goes in the build as
    // NEXT_PUBLIC_RECAPTCHA_SITE_KEY; only the SECRET belongs here. While
    // this is empty the endpoints skip verification, so the forms work
    // before the keys exist. Scores run 0.0 (bot) to 1.0 (human); 0.5 is
    // Google's suggested threshold — raise it if spam still gets through,
    // lower it if real people are being turned away.
    'recaptcha_secret'    => '',
    'recaptcha_min_score' => 0.5,

    // Origins allowed to call these endpoints from another host. Same-origin
    // calls (the site on this server) never need an entry. Add the GitHub
    // Pages preview origin here if you want its form/chatbot to work:
    // 'https://helgarpalmieri55.github.io'
    'allowed_origins' => [],

    // Your own integrations (read by your code, not by these endpoints).
    'tracking_code' => '',
];
