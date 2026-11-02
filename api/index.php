<?php
/**
 * Bass Shoplifting Championship — PHP + SQLite PDO Fallback API for Apache/LiteSpeed Hosts
 * Implements the identical /api/health and /api/leaderboard endpoints as server/leaderboard.js
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$dataDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0750, true);
}
$dbPath = $dataDir . DIRECTORY_SEPARATOR . 'leaderboard.sqlite';

try {
    $pdo = new PDO('sqlite:' . $dbPath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    $pdo->exec('PRAGMA journal_mode = WAL;');
    $pdo->exec('
        CREATE TABLE IF NOT EXISTS leaderboard_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nickname TEXT NOT NULL,
            category TEXT NOT NULL,
            discipline TEXT NOT NULL,
            division TEXT NOT NULL,
            fish_species_id TEXT NOT NULL,
            fish_name TEXT NOT NULL,
            fish_rarity TEXT NOT NULL,
            fish_weight REAL NOT NULL,
            execution_quality REAL NOT NULL,
            score REAL NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_lb_cat_score ON leaderboard_entries (category, score DESC, created_at ASC);
    ');
} catch (Throwable $e) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Leaderboard database unavailable.']);
    exit;
}

if (str_ends_with($uri, '/api/health') && $method === 'GET') {
    echo json_encode(['ok' => true, 'engine' => 'sqlite-pdo', 'timestamp' => gmdate('c')]);
    exit;
}

$validCategories = ['overall', 'discipline', 'heaviest_lift', 'largest_catch', 'victories'];
$validDisciplines = ['all', 'clean_jerk', 'snatch', 'dumbbell', 'deadlift', 'bench', 'overhead'];
$validDivisions = ['all', 'lightweight', 'middleweight', 'heavyweight', 'super_heavyweight', 'unlimited'];

if (str_ends_with($uri, '/api/leaderboard') && $method === 'GET') {
    $cat = in_array($_GET['category'] ?? 'overall', $validCategories, true) ? $_GET['category'] : 'overall';
    $disc = in_array($_GET['discipline'] ?? 'all', $validDisciplines, true) ? $_GET['discipline'] : 'all';
    $div = in_array($_GET['division'] ?? 'all', $validDivisions, true) ? $_GET['division'] : 'all';
    $limit = max(1, min(50, (int)($_GET['limit'] ?? 25)));

    $clauses = ['category = :cat'];
    $params = [':cat' => $cat];
    if ($disc !== 'all') {
        $clauses[] = 'discipline = :disc';
        $params[':disc'] = $disc;
    }
    if ($div !== 'all') {
        $clauses[] = 'division = :div';
        $params[':div'] = $div;
    }

    $where = implode(' AND ', $clauses);
    $stmt = $pdo->prepare("
        SELECT id, nickname, category, discipline, division,
               fish_species_id AS fishSpeciesId, fish_name AS fishName,
               fish_rarity AS fishRarity, fish_weight AS fishWeight,
               execution_quality AS executionQuality, score, created_at AS createdAt
        FROM leaderboard_entries
        WHERE $where
        ORDER BY score DESC, id ASC
        LIMIT :lim
    ");
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v, PDO::PARAM_STR);
    }
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();
    $entries = [];
    foreach ($rows as $idx => $r) {
        $r['rank'] = $idx + 1;
        $r['fishWeight'] = (float)$r['fishWeight'];
        $r['executionQuality'] = (float)$r['executionQuality'];
        $r['score'] = (float)$r['score'];
        $entries[] = $r;
    }

    $topOne = function (string $c) use ($pdo) {
        $s = $pdo->prepare("SELECT nickname, discipline, division, fish_name AS fishName, fish_rarity AS fishRarity, fish_weight AS fishWeight, score, created_at AS createdAt FROM leaderboard_entries WHERE category = ? ORDER BY score DESC, id ASC LIMIT 1");
        $s->execute([$c]);
        return $s->fetch() ?: null;
    };

    echo json_encode([
        'ok' => true,
        'category' => $cat,
        'discipline' => $disc,
        'division' => $div,
        'entries' => $entries,
        'highlights' => [
            'topOverall' => $topOne('overall'),
            'heaviestLift' => $topOne('heaviest_lift'),
            'largestCatch' => $topOne('largest_catch'),
            'mostVictories' => $topOne('victories')
        ]
    ]);
    exit;
}

if (str_ends_with($uri, '/api/leaderboard') && $method === 'POST') {
    $raw = file_get_contents('php://input', false, null, 0, 8192);
    $body = json_decode($raw ?: '{}', true);
    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid JSON payload.']);
        exit;
    }

    $submitOne = function (array $item) use ($pdo, $validCategories, $validDisciplines, $validDivisions) {
        $nick = trim(preg_replace('/\s+/', ' ', (string)($item['nickname'] ?? '')));
        if (strlen($nick) < 2 || strlen($nick) > 18 || !preg_match('/^[A-Za-z0-9 _.\-!]+$/', $nick)) {
            return ['ok' => false, 'error' => 'Invalid nickname (2-18 safe characters required).'];
        }
        $cat = (string)($item['category'] ?? 'overall');
        $disc = (string)($item['discipline'] ?? 'clean_jerk');
        $div = (string)($item['division'] ?? 'lightweight');
        if (!in_array($cat, $validCategories, true) || !in_array($disc, $validDisciplines, true) || !in_array($div, $validDivisions, true)) {
            return ['ok' => false, 'error' => 'Invalid category, discipline, or division.'];
        }
        $fishWeight = (float)($item['fishWeight'] ?? 0);
        $quality = (float)($item['executionQuality'] ?? 80);
        $score = (float)($item['score'] ?? 0);
        if ($fishWeight < 5 || $fishWeight > 1500 || $quality < 0 || $quality > 100 || $score <= 0 || $score > 150000) {
            return ['ok' => false, 'error' => 'Score or fish weight outside plausible bounds.'];
        }
        $now = gmdate('c');
        $ins = $pdo->prepare("
            INSERT INTO leaderboard_entries (
                nickname, category, discipline, division,
                fish_species_id, fish_name, fish_rarity,
                fish_weight, execution_quality, score, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $ins->execute([
            $nick,
            $cat,
            $disc,
            $div,
            substr((string)($item['fishSpeciesId'] ?? 'starter_hatchery_bass'), 0, 64),
            substr((string)($item['fishName'] ?? 'Standard-Issue Gym Bass'), 0, 80),
            substr((string)($item['fishRarity'] ?? 'common'), 0, 24),
            round($fishWeight, 1),
            round($quality, 1),
            round($score, 1),
            $now
        ]);
        return ['ok' => true, 'id' => (int)$pdo->lastInsertId(), 'rank' => 1, 'entry' => ['nickname' => $nick, 'score' => round($score, 1), 'createdAt' => $now]];
    };

    if (isset($body['submissions']) && is_array($body['submissions'])) {
        $results = [];
        foreach ($body['submissions'] as $sub) {
            $r = $submitOne((array)$sub);
            if (!$r['ok']) {
                http_response_code(400);
                echo json_encode($r);
                exit;
            }
            $results[] = $r;
        }
        http_response_code(201);
        echo json_encode(['ok' => true, 'results' => $results, 'primary' => $results[0] ?? null]);
        exit;
    }

    $res = $submitOne($body);
    http_response_code($res['ok'] ? 201 : 400);
    echo json_encode($res);
    exit;
}

http_response_code(404);
echo json_encode(['ok' => false, 'error' => 'API endpoint not found.']);
