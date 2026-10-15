<?php
// api/auth.php — exchanges signed token for a PHP session
// Called by Next.js frontend when token is in URL
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');

session_start();

$token = $_GET['token'] ?? '';
$uid   = verify_user_token($token);

if (!$uid) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

$_SESSION['portal_uid'] = $uid;
echo json_encode(['ok' => true, 'user_id' => $uid]);
