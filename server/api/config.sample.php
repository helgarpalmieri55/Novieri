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
    // Create the mailbox in your GoDaddy panel first (e.g. hola@novieri.com).
    'smtp_host' => 'smtpout.secureserver.net',
    'smtp_port' => 465, // implicit SSL
    'smtp_user' => 'hola@novieri.com',
    'smtp_pass' => '',

    // Where form submissions arrive / the From identity they are sent with.
    'mail_to'   => 'hola@novieri.com',
    'mail_from' => 'hola@novieri.com',

    // Your own integrations (read by your code, not by these endpoints).
    'tracking_code' => '',
];
