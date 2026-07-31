<?php

/**
 * HubSpot lead delivery.
 *
 * Submissions go through the **Forms Submission API**, not the CRM API: only
 * a form submission is treated by HubSpot as a conversion — it enrols the
 * contact in form-submission workflows, fires the notification, counts in
 * campaign reporting, and lands on the timeline as a real submission. A
 * contact created through the CRM API arrives silently.
 *
 * The endpoint needs no authentication (portal id + form guid identify it),
 * so this works before any private-app token exists. The token is only used
 * for the optional note on the contact timeline.
 *
 * Nothing here is allowed to break a submission: every failure is logged and
 * swallowed, because the visitor's email delivery and their report matter
 * more than the CRM copy.
 */

/**
 * @param array<string,string> $fields  HubSpot property name => value
 * @param array{hutk?:string,pageUri?:string,pageName?:string} $context
 * @param array{text?:string} $consent  The consent copy the visitor accepted
 */
function hubspot_submit_form(array $config, string $formKey, array $fields, array $context = [], array $consent = []): bool
{
    $portal = trim((string) ($config['hubspot_portal_id'] ?? ''));
    $guid = trim((string) ($config[$formKey] ?? ''));
    if ($portal === '' || $guid === '') {
        return false; // Not configured yet — silently skip.
    }

    $payload = [
        'submittedAt' => (int) round(microtime(true) * 1000),
        'fields' => [],
        'context' => [],
    ];

    foreach ($fields as $name => $value) {
        $value = trim((string) $value);
        if ($value === '') {
            continue;
        }
        $payload['fields'][] = [
            'objectTypeId' => '0-1', // contact
            'name' => $name,
            'value' => mb_substr($value, 0, 60000),
        ];
    }
    if ($payload['fields'] === []) {
        return false;
    }

    // The tracking cookie is what links this submission to everything the
    // visitor read beforehand. Absent when they declined cookies — the
    // submission still lands, just without browsing attribution.
    foreach (['hutk', 'pageUri', 'pageName'] as $k) {
        if (!empty($context[$k])) {
            $payload['context'][$k] = mb_substr((string) $context[$k], 0, 1000);
        }
    }
    if (!empty($context['ipAddress'])) {
        $payload['context']['ipAddress'] = $context['ipAddress'];
    }

    if (!empty($consent['text'])) {
        $payload['legalConsentOptions'] = [
            'consent' => [
                'consentToProcess' => true,
                'text' => mb_substr((string) $consent['text'], 0, 1000),
            ],
        ];
    }

    $url = "https://api.hsforms.com/submissions/v3/integration/submit/{$portal}/{$guid}";
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    ]);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($raw === false) {
        error_log('hubspot: curl error — ' . $err);
        return false;
    }
    if ($status < 200 || $status >= 300) {
        error_log("hubspot: submit {$formKey} failed {$status} — " . substr((string) $raw, 0, 400));
        return false;
    }
    return true;
}

/**
 * Writes a note onto the contact's timeline, so sales reads the diagnosis
 * before the call. Requires a private-app token with CRM write scope; skipped
 * silently when no token is configured.
 */
function hubspot_note(array $config, string $email, string $body): bool
{
    $token = trim((string) ($config['hubspot_token'] ?? ''));
    if ($token === '' || $email === '' || $body === '') {
        return false;
    }

    $call = function (string $url, ?array $json, string $method = 'POST') use ($token) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . $token],
        ]);
        if ($json !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($json, JSON_UNESCAPED_UNICODE));
        }
        $raw = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        return [$status, json_decode((string) $raw, true)];
    };

    // The form submission has just created (or matched) the contact.
    [$status, $found] = $call('https://api.hubapi.com/crm/v3/objects/contacts/search', [
        'filterGroups' => [['filters' => [['propertyName' => 'email', 'operator' => 'EQ', 'value' => $email]]]],
        'limit' => 1,
    ]);
    $contactId = $found['results'][0]['id'] ?? null;
    if ($status !== 200 || !$contactId) {
        error_log("hubspot: contact lookup failed {$status}");
        return false;
    }

    [$status] = $call('https://api.hubapi.com/crm/v3/objects/notes', [
        'properties' => [
            'hs_note_body' => mb_substr($body, 0, 60000),
            'hs_timestamp' => (int) round(microtime(true) * 1000),
        ],
        'associations' => [[
            'to' => ['id' => $contactId],
            'types' => [['associationCategory' => 'HUBSPOT_DEFINED', 'associationTypeId' => 202]],
        ]],
    ]);
    if ($status < 200 || $status >= 300) {
        error_log("hubspot: note create failed {$status}");
        return false;
    }
    return true;
}
