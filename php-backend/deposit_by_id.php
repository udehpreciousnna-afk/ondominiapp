<?php
// api/deposit_by_id.php — create ETH deposit for a user (called by Next.js server)
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/nowpayments.php';

header('Content-Type: application/json');

$secret = $_SERVER['HTTP_X_BOT_SECRET'] ?? '';
if ($secret !== BOT_TOKEN) {
    http_response_code(403); echo json_encode(['error'=>'Forbidden']); exit;
}

$body    = json_decode(file_get_contents('php://input'), true);
$user_id = (int)($body['user_id'] ?? 0);
if (!$user_id) { echo json_encode(['error'=>'No user_id']); exit; }

$result = create_eth_payment($user_id);
if (isset($result['error'])) {
    http_response_code(500); echo json_encode($result); exit;
}

create_deposit($user_id, $result['payment_id'], $result['payment_id']);
echo json_encode(['success'=>true, 'pay_address'=>$result['pay_address'], 'payment_id'=>$result['payment_id']]);
