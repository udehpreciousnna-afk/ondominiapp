import { NextRequest, NextResponse } from 'next/server'
const PHP_BASE=process.env.NEXT_PUBLIC_API_BASE!; const SEC=process.env.PHP_SYNC_SECRET||process.env.BOT_TOKEN!
export async function POST(req: NextRequest) {
  const body=await req.json()
  if (body.password!==process.env.ADMIN_PASSWORD) return NextResponse.json({error:'Unauthorized'},{status:401})
  try { const r=await fetch(`${PHP_BASE}/admin/update_withdrawal.php`,{method:'POST',headers:{'Content-Type':'application/json','X-Bot-Secret':SEC},body:JSON.stringify(body)}); return NextResponse.json(await r.json()) }
  catch { return NextResponse.json({error:'Backend error'},{status:500}) }
}
