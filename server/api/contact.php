<?php

/**
 * Contact form endpoint — sends the submission to the configured mailbox
 * through GoDaddy SMTP (PHPMailer, vendored in lib/).
 */

require __DIR__ . '/common.php';
require __DIR__ . '/lib/Exception.php';
require __DIR__ . '/lib/PHPMailer.php';
require __DIR__ . '/lib/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;

require_post();
enforce_rate_limit('contact', 5, 600);
$config = load_config();
$body = read_json_body();

// Honeypot: bots fill it, humans never see it. Pretend success.
if (!empty($body['website'])) {
    send_json(200, ['ok' => true]);
}

$name = trim((string) ($body['name'] ?? ''));
$email = trim((string) ($body['email'] ?? ''));
$message = trim((string) ($body['message'] ?? ''));
$company = trim((string) ($body['company'] ?? '')) ?: '—';
$service = trim((string) ($body['service'] ?? '')) ?: '—';
$locale = ($body['locale'] ?? '') === 'en' ? 'en' : 'es';

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json(400, ['error' => 'invalid']);
}
if (strlen($name) > 200 || strlen($email) > 320 || strlen($company) > 200 || strlen($message) > 5000) {
    send_json(400, ['error' => 'too_long']);
}

if (empty($config['smtp_pass']) || empty($config['smtp_user'])) {
    error_log('contact: SMTP credentials not configured');
    send_json(503, ['error' => 'not_configured']);
}

$esc = fn (string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
$html = '<h2 style="font-family:sans-serif">Nuevo mensaje del sitio (' . $locale . ')</h2>'
    . '<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">'
    . '<tr><td style="padding:4px 12px 4px 0"><b>Nombre</b></td><td>' . $esc($name) . '</td></tr>'
    . '<tr><td style="padding:4px 12px 4px 0"><b>Empresa</b></td><td>' . $esc($company) . '</td></tr>'
    . '<tr><td style="padding:4px 12px 4px 0"><b>Correo</b></td><td>' . $esc($email) . '</td></tr>'
    . '<tr><td style="padding:4px 12px 4px 0"><b>Interés</b></td><td>' . $esc($service) . '</td></tr>'
    . '</table>'
    . '<p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap">' . $esc($message) . '</p>';

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $config['smtp_host'] ?? 'smtpout.secureserver.net';
    $mail->Port = (int) ($config['smtp_port'] ?? 465);
    $mail->SMTPSecure = $mail->Port === 465 ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->SMTPAuth = true;
    $mail->Username = $config['smtp_user'];
    $mail->Password = $config['smtp_pass'];
    $mail->CharSet = PHPMailer::CHARSET_UTF8;
    $mail->setFrom($config['mail_from'] ?? $config['smtp_user'], 'Novieri');
    $mail->addAddress($config['mail_to'] ?? $config['smtp_user']);
    $mail->addReplyTo($email, $name);
    $mail->isHTML(true);
    $mail->Subject = "[novieri.com] {$name} — {$service}";
    $mail->Body = $html;
    $mail->AltBody = "Nombre: {$name}\nEmpresa: {$company}\nCorreo: {$email}\nInterés: {$service}\n\n{$message}";
    $mail->send();
    send_json(200, ['ok' => true]);
} catch (Throwable $e) {
    error_log('contact: send failed — ' . $e->getMessage());
    send_json(502, ['error' => 'send_failed']);
}
