<?php

/** Shared helpers for the Novieri PHP endpoints (contact.php, chat.php). */

function send_json(int $status, array $data): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Loads config.php (server-managed, never deployed). 503 while missing. */
function load_config(): array
{
    $path = __DIR__ . '/config.php';
    if (!is_file($path)) {
        send_json(503, ['error' => 'not_configured']);
    }
    $config = require $path;
    return is_array($config) ? $config : [];
}

/**
 * Same-origin calls need nothing; a preview deploy (GitHub Pages) calling the
 * production backend does. Only origins listed in config.php are allowed, and
 * an OPTIONS preflight is answered here.
 */
function handle_cors(array $config): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = array_map('strval', (array) ($config['allowed_origins'] ?? []));
    if ($origin !== '' && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Headers: Content-Type');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Max-Age: 86400');
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/**
 * Cross-origin write protection. A browser attaches Origin to every POST, so
 * a POST that carries neither Origin nor Referer is not a visitor on the
 * site — it is a script talking to the endpoint directly. Same-origin
 * requests pass on the server's own host; anything else must be listed in
 * `allowed_origins`.
 */
function require_known_origin(array $config): void
{
    $allowed = [];
    foreach ((array) ($config['allowed_origins'] ?? []) as $origin) {
        $host = parse_url((string) $origin, PHP_URL_HOST);
        if (is_string($host) && $host !== '') {
            $allowed[] = strtolower($host);
        }
    }
    $self = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    $self = (string) preg_replace('/:\d+$/', '', $self);
    if ($self !== '') {
        $allowed[] = $self;
        // www and apex are the same site; the .htaccess redirect only fires
        // on navigations, not on a fetch() already in flight.
        $allowed[] = str_starts_with($self, 'www.') ? substr($self, 4) : 'www.' . $self;
    }

    $source = (string) ($_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '');
    $from = $source !== '' ? parse_url($source, PHP_URL_HOST) : null;
    if (!is_string($from) || !in_array(strtolower($from), $allowed, true)) {
        error_log('novieri: blocked POST from origin "' . ($source ?: '(none)') . '" ip ' . client_ip());
        send_json(403, ['error' => 'forbidden']);
    }
}

function require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        send_json(405, ['error' => 'method_not_allowed']);
    }
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    $body = json_decode($raw ?: '', true);
    if (!is_array($body)) {
        send_json(400, ['error' => 'bad_request']);
    }
    return $body;
}

function client_ip(): string
{
    // REMOTE_ADDR only: X-Forwarded-For is client-controlled on shared hosting.
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/**
 * Small file-based rate limiter (per identity, per bucket). The identity is
 * the client IP unless one is passed — pass a constant to make the bucket
 * site-wide, which is how the daily spend ceiling is enforced. Fails open on
 * filesystem trouble — better to serve than to lock everyone out.
 */
function enforce_rate_limit(string $bucket, int $max, int $windowSeconds, ?string $identity = null): void
{
    $file = sys_get_temp_dir() . '/novieri_rl_' . md5($bucket . '|' . ($identity ?? client_ip()));
    $handle = @fopen($file, 'c+');
    if ($handle === false) {
        return;
    }
    try {
        if (!flock($handle, LOCK_EX)) {
            return;
        }
        $now = time();
        $raw = stream_get_contents($handle);
        $hits = json_decode($raw ?: '[]', true);
        $hits = is_array($hits) ? array_values(array_filter($hits, fn ($t) => is_int($t) && $now - $t < $windowSeconds)) : [];
        if (count($hits) >= $max) {
            flock($handle, LOCK_UN);
            fclose($handle);
            send_json(429, ['error' => 'rate_limited']);
        }
        $hits[] = $now;
        rewind($handle);
        ftruncate($handle, 0);
        fwrite($handle, json_encode($hits));
        flock($handle, LOCK_UN);
    } finally {
        if (is_resource($handle)) {
            fclose($handle);
        }
    }
}
