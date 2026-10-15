import { NextRequest, NextResponse } from 'next/server'
import * as crypto from 'crypto'

const BOT_TOKEN  = process.env.BOT_TOKEN!
const PHP_BASE   = process.env.NEXT_PUBLIC_API_BASE!
const PHP_SECRET = process.env.PHP_SYNC_SECRET || BOT_TOKEN

function verifyInitData(initData: string): Record<string,string>|null {
  try {
    const params = new URLSearchParams(initData)
    const hash   = params.get('hash'); if (!hash) return null
    params.delete('hash')
    const str = Array.from(params.entries())
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([k,v]) => `${k}=${v}`).join('\n')
    const key = crypto.createHmac('sha256','WebAppData').update(BOT_TOKEN).digest()
    const exp = crypto.createHmac('sha256',key).update(str).digest('hex')
    if (exp !== hash) return null
    const authDate = parseInt(params.get('auth_date') ?? '0')
    if (Date.now()/1000 - authDate > 3600) return null
    return Object.fromEntries(params.entries())
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const { initData, devUser } = await req.json()
  let telegramUser: any = null

  if (initData === 'dev_mode' && devUser && process.env.NODE_ENV === 'development') {
    telegramUser = devUser
  } else {
    const data = verifyInitData(initData)
    if (!data) return NextResponse.json({ error: 'Invalid initData' }, { status: 401 })
    telegramUser = JSON.parse(data.user ?? '{}')
  }

  if (!telegramUser?.id) return NextResponse.json({ error: 'No user' }, { status: 400 })

  try {
    // ── Sync basic info only — NEVER send balances here ───────
    // Balances are managed by:
    //   - bio_balance: pushed by bot via balance.py when user taps Withdraw
    //   - eth_balance: managed by NOWPayments webhook on cPanel
    // Sending 0 here would overwrite real balances!
    await fetch(`${PHP_BASE}/api/sync_user.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Bot-Secret': PHP_SECRET },
      body: JSON.stringify({
        user_id:       telegramUser.id,
        telegram_name: `${telegramUser.first_name ?? ''} ${telegramUser.last_name ?? ''}`.trim(),
        username:      telegramUser.username ?? '',
        wallet_address: '',
        bio_balance:   -1,   // -1 = "don't update" signal to cPanel
        eth_balance:   -1,   // -1 = "don't update" signal to cPanel
      }),
    })

    // Read user back from cPanel (has real balances)
    const r    = await fetch(`${PHP_BASE}/api/me_by_id.php?uid=${telegramUser.id}`, {
      headers: { 'X-Bot-Secret': PHP_SECRET }
    })
    const user = await r.json()
    return NextResponse.json({ success: true, user })
  } catch {
    return NextResponse.json({ error: 'Backend error' }, { status: 500 })
  }
}
