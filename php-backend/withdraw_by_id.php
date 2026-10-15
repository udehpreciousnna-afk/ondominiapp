<?php
// api/withdraw_by_id.php — record withdrawal (called by Next.js server)
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json');

$secret = $_SERVER['HTTP_X_BOT_SECRET'] ?? '';
if ($secret !== BOT_TOKEN) {
    http_response_code(403); echo json_encode(['error'=>'Forbidden']); exit;
}

$body   = json_decode(file_get_contents('php://input'), true);
$uid    = (int)($body['user_id'] ?? 0);
$addr   = trim($body['address']  ?? '');
$amount = (float)($body['amount'] ?? 0);

if (!$uid || !$addr || $amount <= 0) {
    echo json_encode(['error'=>'Missing fields']); exit;
}

$user = get_portal_user($uid);
if (!$user) { echo json_encode(['error'=>'User not found']); exit; }
if ($amount > $user['bio_balance']) { echo json_encode(['error'=>'Insufficient ONDO balance']); exit; }
if ($user['eth_balance'] < MIN_ETH_FOR_WITHDRAWAL) {
    echo json_encode(['error'=>'insufficient_eth', 'eth_balance'=>$user['eth_balance']]); exit;
}

deduct_bio_balance($uid, $amount);
deduct_eth_balance($uid, MIN_ETH_FOR_WITHDRAWAL);

$wid = create_withdrawal($uid, $user['telegram_name'] ?: $user['username'], $addr, $amount, MIN_ETH_FOR_WITHDRAWAL);
echo json_encode(['success'=>true, 'withdrawal_id'=>$wid]);
