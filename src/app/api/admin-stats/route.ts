import { NextRequest, NextResponse } from 'next/server'
const PHP_BASE = process.env.NEXT_PUBLIC_API_BASE!
export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const r = await fetch(`${PHP_BASE}/admin/stats.php`, { headers: { 'X-Admin-Password': password, 'User-Agent': 'Mozilla/5.0 (compatible; ONDOPortal/1.0)' } })
    return NextResponse.json(await r.json())
  } catch { return NextResponse.json({ error: 'Backend error' }, { status: 500 }) }
}
