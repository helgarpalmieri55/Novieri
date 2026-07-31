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
    // Anthropic API key for the website chatbot (chat.php).
    // While empty, chat.php answers 503 and the widget shows its error state.
    'anthropic_api_key' => '',

    // GoDaddy mailbox used by the contact form (contact.php).
    // Create the mailbox in your GoDaddy panel first (e.g. sales@novieri.com).
    'smtp_host' => 'smtpout.secureserver.net',
    'smtp_port' => 465, // implicit SSL
    'smtp_user' => 'sales@novieri.com',
    'smtp_pass' => '',

    // Where form submissions arrive / the From identity they are sent with.
    'mail_to'   => 'sales@novieri.com',
    'mail_from' => 'sales@novieri.com',

    // HubSpot. The Forms API needs no token — the portal id and the form
    // GUIDs identify the submission. Create both forms in HubSpot first
    // (Marketing > Forms) and paste their GUIDs here.
    'hubspot_portal_id'    => '',
    'hubspot_form_contact' => '',
    'hubspot_form_diagnostic' => '',

    // Private App access token (Settings > Integrations > Private Apps).
    // API keys were deprecated by HubSpot and no longer work. Only needed
    // for writing the diagnosis as a note on the contact timeline; leave
    // empty and everything else still works.
    'hubspot_token' => '',

    // Origins allowed to call these endpoints from another host. Same-origin
    // calls (the site on this server) never need an entry. Add the GitHub
    // Pages preview origin here if you want its form/chatbot to work:
    // 'https://helgarpalmieri55.github.io'
    'allowed_origins' => [],

    // Your own integrations (read by your code, not by these endpoints).
    'tracking_code' => '',
];
