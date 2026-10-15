import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch ONDO and ETH prices from CoinGecko
    const r = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ondo-finance%2Cethereum&vs_currencies=usd',
      { next: { revalidate: 60 } }
    )
    const data = await r.json()
    return NextResponse.json({
      ondo: data?.['ondo-finance']?.usd ?? 0,
      eth:  data?.['ethereum']?.usd ?? 0,
    })
  } catch {
    // Fallback: try the PHP backend prices endpoint if configured
    try {
      const r2 = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/prices.php`, { next: { revalidate: 60 } })
      const d2 = await r2.json()
      return NextResponse.json({ ondo: d2.ondo ?? d2.bio ?? 0, eth: d2.eth ?? 0 })
    } catch {
      return NextResponse.json({ ondo: 0, eth: 0 })
    }
  }
}
