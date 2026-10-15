export interface TelegramUser {
  id: number; first_name: string; last_name?: string; username?: string
}
export interface User {
  user_id: number; telegram_name: string; username: string
  wallet_address: string; bio_balance: number; eth_balance: number
}
export interface Withdrawal {
  id: number; user_id: number; telegram_name: string
  wallet_address: string; bio_amount: number; eth_fee_paid: number
  token: 'ONDO' | 'ETH'
  status: WithdrawalStatus; submitted_at: string
  processed_at: string|null; tx_hash: string|null; admin_notes: string|null
}
export type WithdrawalStatus = 'pending'|'processing'|'completed'|'rejected'|'cancelled'
/** ondo = ONDO token price, eth = ETH price */
export interface Prices { ondo: number; eth: number }
export interface DepositResponse { success:boolean; pay_address?:string; payment_id?:string; error?:string }
export interface WithdrawResponse { success:boolean; withdrawal_id?:number; error?:string }
