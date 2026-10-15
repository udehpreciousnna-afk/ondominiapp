<?php
// api/me_by_id.php — fetch user by ID (called by Next.js server)
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json');

$secret = $_SERVER['HTTP_X_BOT_SECRET'] ?? '';
if ($secret !== BOT_TOKEN) {
    http_response_code(403); echo json_encode(['error'=>'Forbidden']); exit;
}

$uid  = (int)($_GET['uid'] ?? 0);
$user = $uid ? get_portal_user($uid) : null;

if (!$user) {
    http_response_code(404); echo json_encode(['error'=>'User not found']); exit;
}
echo json_encode($user);
