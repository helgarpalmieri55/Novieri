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
 * Small file-based rate limiter (per IP, per bucket). Fails open on
 * filesystem trouble — better to serve than to lock everyone out.
 */
function enforce_rate_limit(string $bucket, int $max, int $windowSeconds): void
{
    $file = sys_get_temp_dir() . '/novieri_rl_' . md5($bucket . '|' . client_ip());
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
