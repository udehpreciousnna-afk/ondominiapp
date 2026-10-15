<?php
// api/withdrawals_by_id.php — get user's withdrawal history
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json');

$secret = $_SERVER['HTTP_X_BOT_SECRET'] ?? '';
if ($secret !== BOT_TOKEN) {
    http_response_code(403); echo json_encode(['error'=>'Forbidden']); exit;
}

$uid = (int)($_GET['uid'] ?? 0);
if (!$uid) { echo json_encode(['withdrawals',[]]); exit; }

$db   = get_db();
$stmt = $db->prepare("SELECT * FROM withdrawals WHERE user_id=? ORDER BY submitted_at DESC");
$stmt->execute([$uid]);
echo json_encode(['withdrawals' => $stmt->fetchAll()]);
