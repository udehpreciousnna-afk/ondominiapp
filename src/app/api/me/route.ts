// GET /api/me?user_id=123
// Read-only endpoint — fetches fresh user data from cPanel without any sync/overwrite
// Used by DepositSheet to poll for ETH balance changes after deposit
import { NextRequest, NextResponse } from 'next/server'

const PHP_BASE   = process.env.NEXT_PUBLIC_API_BASE!
const PHP_SECRET = process.env.PHP_SYNC_SECRET || process.env.BOT_TOKEN!

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('user_id')
  if (!uid) return NextResponse.json({ error: 'No user_id' }, { status: 400 })

  try {
    const r    = await fetch(`${PHP_BASE}/api/me_by_id.php?uid=${uid}`, {
      headers: { 'X-Bot-Secret': PHP_SECRET },
      cache:   'no-store',  // always fresh
    })
    const user = await r.json()
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: 'Backend error' }, { status: 500 })
  }
}
