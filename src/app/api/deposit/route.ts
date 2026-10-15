import { NextRequest, NextResponse } from 'next/server'
const PHP_BASE=process.env.NEXT_PUBLIC_API_BASE!; const SEC=process.env.PHP_SYNC_SECRET||process.env.BOT_TOKEN!
export async function POST(req: NextRequest) {
  const { user_id }=await req.json()
  if (!user_id) return NextResponse.json({ error:'No user_id' },{status:400})
  try { const r=await fetch(`${PHP_BASE}/api/deposit_by_id.php`,{method:'POST',headers:{'Content-Type':'application/json','X-Bot-Secret':SEC},body:JSON.stringify({user_id})}); return NextResponse.json(await r.json()) }
  catch { return NextResponse.json({ error:'Backend error' },{status:500}) }
}
