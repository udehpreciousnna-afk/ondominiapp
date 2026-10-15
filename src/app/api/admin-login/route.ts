import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  const { password }=await req.json()
  return password===process.env.ADMIN_PASSWORD ? NextResponse.json({ok:true}) : NextResponse.json({error:'Unauthorized'},{status:401})
}
