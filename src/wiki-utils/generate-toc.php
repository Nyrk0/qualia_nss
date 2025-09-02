<?php
// src/wiki-utils/generate-toc.php
// Scans src/wiki/{Home.md,User-Guide,Developer-Docs} and creates/updates src/wiki-utils/toc-manifest.json
// Returns the manifest JSON as response. Designed to run on qualia-nss.com server.

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

function response(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

function join_path(string ...$parts): string {
    $clean = [];
    foreach ($parts as $p) {
        if ($p === '' || $p === DIRECTORY_SEPARATOR) continue;
        $clean[] = trim($p, "/\\");
    }
    $prefix = '';
    if (strpos($parts[0] ?? '', DIRECTORY_SEPARATOR) === 0) {
        $prefix = DIRECTORY_SEPARATOR;
    }
    return $prefix . implode(DIRECTORY_SEPARATOR, $clean);
}

// Wiki root defaults to ../wiki (git submodule). Override with env WIKI_ROOT if needed.
$wikiRoot = getenv('WIKI_ROOT');
if (!$wikiRoot) {
    $wikiRoot = realpath(join_path(__DIR__, '..', 'wiki')) ?: '';
}
if (!$wikiRoot || !is_dir($wikiRoot)) {
    response(500, [
        'ok' => false,
        'error' => 'Wiki root not found',
        'wikiRoot' => $wikiRoot,
    ]);
}

$homePath = join_path($wikiRoot, 'Home.md');
$userGuideDir = join_path($wikiRoot, 'User-Guide');
$devDocsDir   = join_path($wikiRoot, 'Developer-Docs');
$manifestPath = join_path(__DIR__, 'toc-manifest.json');

function list_md_files(string $dir, string $prefix): array {
    if (!is_dir($dir)) return [];
    $items = @scandir($dir) ?: [];
    $files = [];
    foreach ($items as $it) {
        if ($it === '.' || $it === '..') continue;
        $full = join_path($dir, $it);
        if (is_file($full) && preg_match('/\.md$/i', $it)) {
            $files[] = [
                'name' => $it,
                'path' => $prefix . '/' . $it,
            ];
        }
    }
    // Sort by leading numeric prefix if present, then lexicographically
    usort($files, function ($a, $b) {
        $ax = $a['name'];
        $bx = $b['name'];
        preg_match('/^(\d+)/', $ax, $ma);
        preg_match('/^(\d+)/', $bx, $mb);
        $na = isset($ma[1]) ? intval($ma[1], 10) : PHP_INT_MAX;
        $nb = isset($mb[1]) ? intval($mb[1], 10) : PHP_INT_MAX;
        if ($na !== $nb) return $na <=> $nb;
        return strnatcasecmp($ax, $bx);
    });
    return $files;
}

$general = [];
if (is_file($homePath)) {
    $general[] = [ 'name' => 'Home.md', 'path' => 'Home.md' ];
}
$userGuide = list_md_files($userGuideDir, 'User-Guide');
$devDocs   = list_md_files($devDocsDir, 'Developer-Docs');

$manifest = [
    'general'   => $general,
    'userGuide' => $userGuide,
    'devDocs'   => $devDocs,
    'generatedAt' => gmdate('c'),
];

// Write manifest next to this script (not inside the wiki submodule)
$dirWritable = is_writable(dirname($manifestPath));
$wrote = false;
$writeError = null;
if ($dirWritable) {
    $json = json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        $writeError = 'JSON encoding failed';
    } else {
        $tmp = $manifestPath . '.tmp';
        $fp = @fopen($tmp, 'wb');
        if ($fp === false) {
            $writeError = 'Unable to open temp file for writing';
        } else {
            if (flock($fp, LOCK_EX)) {
                fwrite($fp, $json);
                fflush($fp);
                flock($fp, LOCK_UN);
                fclose($fp);
                @rename($tmp, $manifestPath);
                $wrote = true;
            } else {
                fclose($fp);
                @unlink($tmp);
                $writeError = 'Unable to acquire file lock';
            }
        }
    }
}

$response = [
    'ok' => true,
    'wroteManifest' => $wrote,
    'writeError' => $writeError,
    'paths' => [
        'wikiRoot' => $wikiRoot,
        'home' => $homePath,
        'userGuideDir' => $userGuideDir,
        'devDocsDir' => $devDocsDir,
        'manifest' => $manifestPath,
    ],
    'manifest' => $manifest,
];

response(200, $response);
