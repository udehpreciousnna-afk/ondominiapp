import { NextRequest, NextResponse } from 'next/server'
const PHP_BASE=process.env.NEXT_PUBLIC_API_BASE!; const SEC=process.env.PHP_SYNC_SECRET||process.env.BOT_TOKEN!
export async function GET(req: NextRequest) {
  const uid=req.nextUrl.searchParams.get('user_id')
  if (!uid) return NextResponse.json({ withdrawals:[] })
  try { const r=await fetch(`${PHP_BASE}/api/withdrawals_by_id.php?uid=${uid}`,{headers:{'X-Bot-Secret':SEC}}); return NextResponse.json(await r.json()) }
  catch { return NextResponse.json({ withdrawals:[] }) }
}
