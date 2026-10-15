<?php
// api/withdrawals.php — returns current user's withdrawal history
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');

$uid = require_auth();

$db = get_db();
$stmt = $db->prepare(
    "SELECT * FROM withdrawals WHERE user_id = ? ORDER BY submitted_at DESC"
);
$stmt->execute([$uid]);
$rows = $stmt->fetchAll();

echo json_encode(['withdrawals' => $rows]);
