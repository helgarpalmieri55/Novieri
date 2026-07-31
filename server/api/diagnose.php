<?php

/**
 * Self-diagnosis endpoint.
 *
 * Takes the visitor's ten answers plus their contact details, asks Claude for
 * a report written for their case, renders it to a PDF (FPDF, vendored), mails
 * the lead — with the PDF attached — to the sales mailbox and to the visitor,
 * and returns both the report and the PDF (base64) in one response. Nothing is
 * written to disk, so there is no file to expire or clean up.
 */

require __DIR__ . '/common.php';
require __DIR__ . '/lib/fpdf.php';
require __DIR__ . '/lib/Exception.php';
require __DIR__ . '/lib/PHPMailer.php';
require __DIR__ . '/lib/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;

$config = load_config();
handle_cors($config);
require_post();
if (empty($config['anthropic_api_key'])) {
    send_json(503, ['error' => 'not_configured']);
}
enforce_rate_limit('diagnose', 6, 3600);

$body = read_json_body();

// Honeypot: bots fill it, humans never see it. Pretend success, generate nothing.
if (!empty($body['website'])) {
    send_json(200, ['report' => ['headline' => '', 'summary' => '', 'strengths' => [], 'risks' => [], 'priorities' => [], 'closing' => '']]);
}

$locale = ($body['locale'] ?? '') === 'en' ? 'en' : 'es';
$contact = is_array($body['contact'] ?? null) ? $body['contact'] : [];
$name = trim((string) ($contact['name'] ?? ''));
$email = trim((string) ($contact['email'] ?? ''));
$company = trim((string) ($contact['company'] ?? ''));
$phone = trim((string) ($contact['phone'] ?? ''));
$pct = (int) ($body['score']['pct'] ?? 0);
$level = trim((string) ($body['score']['level'] ?? ''));

if ($name === '' || $company === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json(400, ['error' => 'invalid']);
}
if (strlen($name) > 200 || strlen($email) > 320 || strlen($company) > 200 || strlen($phone) > 60) {
    send_json(400, ['error' => 'too_long']);
}

$answers = [];
foreach ((array) ($body['answers'] ?? []) as $a) {
    if (is_array($a) && is_string($a['question'] ?? null) && is_string($a['answer'] ?? null)) {
        $q = mb_substr(trim($a['question']), 0, 300);
        $v = mb_substr(trim($a['answer']), 0, 300);
        if ($q !== '' && $v !== '') {
            $answers[] = ['question' => $q, 'answer' => $v];
        }
    }
}
if (count($answers) < 5) {
    send_json(400, ['error' => 'invalid']);
}

/* ---------- 1. The report ---------- */

$lang = $locale === 'en' ? 'English' : 'Spanish';
$answerBlock = '';
foreach ($answers as $i => $a) {
    $answerBlock .= ($i + 1) . ". {$a['question']}\n   → {$a['answer']}\n";
}

$system = <<<PROMPT
You are a senior IT and AI consultant at Novieri, writing a short technology diagnostic for a company that just answered a ten-question self-assessment on novieri.com.

Write in {$lang}. In Spanish, address the reader as "tú".

Voice: confident, plain, specific — a senior engineer explaining clearly. No exclamation marks, no buzzwords, no filler. Name the concrete risk and the concrete next step. Never invent facts about the company beyond what the answers state, and never quote prices.

Novieri's services, and the only ones you may recommend: AI and automation; managed IT; cybersecurity and compliance (SOC 2 and PCI DSS readiness); custom software.

Return ONLY a JSON object, no prose around it, no markdown fences, with exactly these keys:
{
  "headline": "one sentence naming where this company stands",
  "summary": "2-3 sentences reading their situation as a whole",
  "strengths": ["2-3 short items they already do well"],
  "risks": ["3-4 short items, the most serious first, each naming the concrete consequence"],
  "priorities": [{"title": "short action", "body": "1-2 sentences on why it comes first and what it changes"}],
  "closing": "one or two sentences on what working with Novieri would look like from here"
}
Give exactly 3 priorities, ordered by what to do first.
PROMPT;

$userMsg = "Company: {$company}\nSelf-assessment score: {$pct}/100 (level: {$level})\n\nAnswers:\n{$answerBlock}";

$payload = json_encode([
    'model' => 'claude-opus-5',
    'max_tokens' => 4096,
    'system' => [['type' => 'text', 'text' => $system, 'cache_control' => ['type' => 'ephemeral']]],
    'messages' => [['role' => 'user', 'content' => $userMsg]],
], JSON_UNESCAPED_UNICODE);

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 120,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'x-api-key: ' . $config['anthropic_api_key'],
        'anthropic-version: 2023-06-01',
    ],
]);
$raw = curl_exec($ch);
$status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($raw === false) {
    error_log('diagnose: curl error — ' . $curlError);
    send_json(502, ['error' => 'upstream']);
}
if ($status === 429) {
    send_json(429, ['error' => 'rate_limited']);
}
$response = json_decode($raw, true);
if ($status !== 200 || !is_array($response)) {
    error_log("diagnose: api error {$status} — " . substr($raw, 0, 400));
    send_json(502, ['error' => 'upstream']);
}
if (($response['stop_reason'] ?? '') === 'refusal') {
    send_json(502, ['error' => 'refused']);
}

$text = '';
foreach ((array) ($response['content'] ?? []) as $block) {
    if (($block['type'] ?? '') === 'text') {
        $text .= $block['text'] ?? '';
    }
}
// The model is asked for bare JSON; strip a fence if one slips through.
$text = trim($text);
$text = preg_replace('/^```(?:json)?\s*|\s*```$/', '', $text);
$report = json_decode($text, true);

if (!is_array($report) || empty($report['headline']) || empty($report['summary'])) {
    error_log('diagnose: unparseable report — ' . substr($text, 0, 400));
    send_json(502, ['error' => 'upstream']);
}

$str = fn ($v) => is_string($v) ? $v : '';
$list = function ($v): array {
    return is_array($v) ? array_values(array_filter(array_map(fn ($x) => is_string($x) ? $x : '', $v))) : [];
};
$report = [
    'headline' => $str($report['headline']),
    'summary' => $str($report['summary']),
    'strengths' => $list($report['strengths'] ?? []),
    'risks' => $list($report['risks'] ?? []),
    'priorities' => array_values(array_filter(array_map(
        fn ($p) => is_array($p) && !empty($p['title'])
            ? ['title' => $str($p['title'] ?? ''), 'body' => $str($p['body'] ?? '')]
            : null,
        (array) ($report['priorities'] ?? []),
    ))),
    'closing' => $str($report['closing'] ?? ''),
];

/* ---------- 2. The PDF ---------- */

/** FPDF's core fonts are latin-1; Spanish accents survive the conversion. */
function pdf_text(string $s): string
{
    return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $s) ?: $s;
}

$L = $locale === 'en'
    ? ['title' => 'Technology diagnostic', 'for' => 'Prepared for', 'date' => 'Date', 'level' => 'Level',
       'score' => 'Self-assessment score', 'strengths' => 'What you already have', 'risks' => 'Risks we see',
       'priorities' => "What we'd do first", 'answers' => 'Your answers', 'foot' => 'novieri.com · ' . ($config['mail_to'] ?? '')]
    : ['title' => 'Diagnóstico de tecnología', 'for' => 'Preparado para', 'date' => 'Fecha', 'level' => 'Nivel',
       'score' => 'Puntaje del autodiagnóstico', 'strengths' => 'Lo que ya tienes', 'risks' => 'Riesgos que vemos',
       'priorities' => 'Qué haríamos primero', 'answers' => 'Tus respuestas', 'foot' => 'novieri.com · ' . ($config['mail_to'] ?? '')];

$pdf = new FPDF();
$pdf->SetAutoPageBreak(true, 20);
$pdf->AddPage();

// Header band in the brand plum
$pdf->SetFillColor(79, 52, 97);
$pdf->Rect(0, 0, 210, 34, 'F');
$pdf->SetTextColor(255, 255, 255);
$pdf->SetFont('Helvetica', 'B', 20);
$pdf->SetXY(16, 10);
$pdf->Cell(0, 8, pdf_text('novieri'), 0, 1);
$pdf->SetFont('Helvetica', '', 11);
$pdf->SetX(16);
$pdf->Cell(0, 7, pdf_text($L['title']), 0, 1);

$pdf->SetTextColor(22, 18, 29);
$pdf->SetY(44);
$pdf->SetFont('Helvetica', '', 10);
$pdf->SetX(16);
$pdf->Cell(0, 6, pdf_text("{$L['for']}: {$company} — {$name}"), 0, 1);
$pdf->SetX(16);
$pdf->Cell(0, 6, pdf_text("{$L['date']}: " . date('Y-m-d') . "    {$L['level']}: {$level}    {$L['score']}: {$pct}/100"), 0, 1);

$section = function (string $heading) use ($pdf) {
    $pdf->Ln(4);
    $pdf->SetX(16);
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetTextColor(79, 52, 97);
    $pdf->Cell(0, 7, pdf_text($heading), 0, 1);
    $pdf->SetTextColor(22, 18, 29);
    $pdf->SetFont('Helvetica', '', 10);
};
$para = function (string $body) use ($pdf) {
    $pdf->SetX(16);
    $pdf->MultiCell(178, 5.4, pdf_text($body));
};
$bullets = function (array $items) use ($pdf) {
    foreach ($items as $item) {
        $pdf->SetX(16);
        $pdf->Cell(5, 5.4, pdf_text('-'), 0, 0);
        $pdf->MultiCell(173, 5.4, pdf_text($item));
    }
};

$pdf->Ln(4);
$pdf->SetX(16);
$pdf->SetFont('Helvetica', 'B', 13);
$pdf->MultiCell(178, 6.5, pdf_text($report['headline']));
$pdf->Ln(2);
$pdf->SetFont('Helvetica', '', 10);
$para($report['summary']);

if ($report['strengths']) {
    $section($L['strengths']);
    $bullets($report['strengths']);
}
if ($report['risks']) {
    $section($L['risks']);
    $bullets($report['risks']);
}
if ($report['priorities']) {
    $section($L['priorities']);
    foreach ($report['priorities'] as $i => $p) {
        $pdf->SetX(16);
        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->MultiCell(178, 5.4, pdf_text(($i + 1) . '. ' . $p['title']));
        $pdf->SetFont('Helvetica', '', 10);
        $pdf->SetX(21);
        $pdf->MultiCell(173, 5.4, pdf_text($p['body']));
        $pdf->Ln(1);
    }
}
if ($report['closing'] !== '') {
    $pdf->Ln(3);
    $para($report['closing']);
}

$section($L['answers']);
foreach ($answers as $i => $a) {
    $pdf->SetX(16);
    $pdf->SetFont('Helvetica', '', 9);
    $pdf->SetTextColor(85, 77, 96);
    $pdf->MultiCell(178, 4.8, pdf_text(($i + 1) . '. ' . $a['question']));
    $pdf->SetX(21);
    $pdf->SetFont('Helvetica', 'B', 9);
    $pdf->MultiCell(173, 4.8, pdf_text($a['answer']));
    $pdf->SetTextColor(22, 18, 29);
}

$pdf->SetY(-15);
$pdf->SetFont('Helvetica', '', 8);
$pdf->SetTextColor(111, 104, 128);
$pdf->SetX(16);
$pdf->Cell(0, 5, pdf_text($L['foot']), 0, 0);

$pdfData = $pdf->Output('S');
$fileName = $locale === 'en' ? 'novieri-diagnostic.pdf' : 'diagnostico-novieri.pdf';

/* ---------- 3. The lead ---------- */

if (!empty($config['smtp_user']) && !empty($config['smtp_pass'])) {
    $esc = fn (string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
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
        $mail->Subject = "[autodiagnóstico] {$company} — {$level} ({$pct}/100)";
        $mail->Body = '<h2 style="font-family:sans-serif">Nuevo autodiagnóstico</h2>'
            . '<table style="font-family:sans-serif;font-size:14px">'
            . '<tr><td><b>Nombre</b></td><td>' . $esc($name) . '</td></tr>'
            . '<tr><td><b>Empresa</b></td><td>' . $esc($company) . '</td></tr>'
            . '<tr><td><b>Correo</b></td><td>' . $esc($email) . '</td></tr>'
            . '<tr><td><b>Teléfono</b></td><td>' . $esc($phone ?: '—') . '</td></tr>'
            . '<tr><td><b>Resultado</b></td><td>' . $esc("{$level} · {$pct}/100") . '</td></tr>'
            . '</table><p style="font-family:sans-serif;font-size:14px">' . $esc($report['headline']) . '</p>';
        $mail->addStringAttachment($pdfData, $fileName, 'base64', 'application/pdf');
        $mail->send();

        // A copy for the visitor — this is what they were promised.
        $copy = clone $mail;
        $copy->clearAddresses();
        $copy->addAddress($email, $name);
        $copy->Subject = $locale === 'en' ? 'Your Novieri technology diagnostic' : 'Tu diagnóstico de tecnología — Novieri';
        $copy->Body = $locale === 'en'
            ? '<p style="font-family:sans-serif;font-size:15px">Hi ' . $esc($name) . ',<br><br>Your diagnostic is attached. If you want to go through it with us, reply to this email and we\'ll set up 30 minutes.<br><br>— Novieri</p>'
            : '<p style="font-family:sans-serif;font-size:15px">Hola ' . $esc($name) . ',<br><br>Adjunto va tu diagnóstico. Si quieres revisarlo con nosotros, responde este correo y agendamos 30 minutos.<br><br>— Novieri</p>';
        $copy->send();
    } catch (Throwable $e) {
        // The visitor still gets their report; only the notification failed.
        error_log('diagnose: mail failed — ' . $e->getMessage());
    }
}

send_json(200, [
    'report' => $report,
    'pdf' => base64_encode($pdfData),
    'fileName' => $fileName,
]);
