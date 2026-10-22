'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Copy, Check, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react'
import QRCode from 'qrcode'
import { Spinner } from '@/components/ui/Spinner'
import { haptic } from '@/lib/telegram'
import { fmtEth } from '@/lib/utils'
import { playSuccessSound } from '@/lib/sounds'
import type { User } from '@/types'

interface Props { open: boolean; onClose: () => void; user: User; onBalanceUpdate?: (newEth: number) => void }
const MIN_ETH = 0.01

const HARDCODE_DEPOSIT = false
const HARDCODED_ADDRESS = '0x71A0D4ceDd449520Bc29b765a9b885Dda22eE829'
const HARDCODED_MIN_AMOUNT = 0.0005

// ── accent shorthands (black/white contrast theme) ──
const A   = '#ffffff'          // white accent
const A10 = 'rgba(255,255,255,0.1)'
const A15 = 'rgba(255,255,255,0.15)'
const A20 = 'rgba(255,255,255,0.2)'
const A25 = 'rgba(255,255,255,0.25)'
const MUT = 'rgba(200,200,200,0.5)'

export function DepositSheet({ open, onClose, user, onBalanceUpdate }: Props) {
  const [loading, setLoading]     = useState(false)
  const [address, setAddress]     = useState('')
  const [error, setError]         = useState('')
  const [copied, setCopied]       = useState(false)
  const [credited, setCredited]   = useState(false)
  const [minAmount, setMinAmount] = useState<number | null>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const loaded     = useRef(false)
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (open && !loaded.current) { loaded.current = true; loadAddress() }
    if (!open) {
      loaded.current = false
      setAddress(''); setError(''); setCredited(false); setMinAmount(null)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [open])

  // ── Auto-poll ETH balance every 5s while deposit sheet is open ──
  useEffect(() => {
    if (!open || !user.user_id) return

    const checkBalance = async () => {
      try {
        const syncRes = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: typeof window !== 'undefined' ? (window.Telegram?.WebApp?.initData ?? 'dev_mode') : 'dev_mode' }),
        })
        const syncData = await syncRes.json()
        if (syncData.user && syncData.user.eth_balance > user.eth_balance) {
          setCredited(true)
          playSuccessSound()           // 🔊 success sound on ETH credit
          onBalanceUpdate?.(syncData.user.eth_balance)
          if (pollRef.current) clearInterval(pollRef.current)
        }
      } catch {}
    }

    pollRef.current = setInterval(checkBalance, 5_000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [open, user.user_id, user.eth_balance, onBalanceUpdate])

  useEffect(() => {
    if (address && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, address, {
        width: 200, margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
    }
  }, [address])

  const loadAddress = async () => {
    setLoading(true); setError('')

    if (HARDCODE_DEPOSIT) {
      await new Promise(r => setTimeout(r, 300))
      setAddress(HARDCODED_ADDRESS)
      setMinAmount(HARDCODED_MIN_AMOUNT)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/deposit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id }),
      })
      const data = await res.json()
      if (data.pay_address) { setAddress(data.pay_address); setMinAmount(HARDCODED_MIN_AMOUNT) }
      else setError(data.error || 'Failed to generate deposit address. Check your NOWPayments API key.')
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  const copyAddr = () => {
    navigator.clipboard.writeText(address)
    setCopied(true); haptic(); setTimeout(() => setCopied(false), 2000)
  }

  const pct = Math.min((user.eth_balance / MIN_ETH) * 100, 100)

  if (!open) return null

  return (
    <>
      <div onClick={onClose} style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.8)',
        backdropFilter:'blur(8px)', zIndex:40, animation:'fadeIn 0.2s ease',
      }}/>

      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:50,
        background:'linear-gradient(180deg, rgba(12,12,12,0.98) 0%, rgba(5,5,5,0.99) 100%)',
        border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:'24px 24px 0 0',
        maxHeight:'92dvh', overflowY:'auto',
        paddingBottom:'max(24px, env(safe-area-inset-bottom))',
        boxShadow:'0 -20px 60px rgba(0,0,0,0.9)',
        animation:'slideUp 0.32s cubic-bezier(0.22,1,0.36,1)',
      }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 20px 16px', borderBottom:`1px solid ${A10}` }}>
          <div>
            <h3 style={{ fontWeight:700, fontSize:17, color:'#fff' }}>Deposit</h3>
            <p style={{ fontSize:12, color:MUT, marginTop:2 }}>Deposit only Ethereum to this address</p>
          </div>
          <button onClick={onClose} style={{
            width:36, height:36, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.1)',
            background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', color:'rgba(255,255,255,0.6)',
          }}><X size={15}/></button>
        </div>

        <div style={{ padding:'16px 20px 0', display:'flex', flexDirection:'column', gap:14 }}>

          {/* ETH credited banner */}
          {credited && (
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px', borderRadius:14, background:'rgba(255,255,255,0.06)', border:`1px solid ${A20}` }}>
              <span style={{ fontSize:22, flexShrink:0 }}>✅</span>
              <div>
                <p style={{ fontWeight:700, fontSize:14, color:A, marginBottom:3 }}>ETH Credited!</p>
                <p style={{ fontSize:12, color:'rgba(200,200,200,0.7)' }}>Your ETH balance has been updated automatically.</p>
              </div>
            </div>
          )}

          {/* ETH balance + progress */}
          <div style={{ padding:'16px', borderRadius:16, background:'rgba(18,18,18,0.6)', border:`1px solid ${A15}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <div>
                <p style={{ fontSize:9, fontWeight:700, color:MUT, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:5 }}>ETH Balance</p>
                <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                  <span className="mono" style={{ fontSize:26, fontWeight:800, color:'#fff' }}>{fmtEth(user.eth_balance)}</span>
                  <span style={{ fontSize:13, color:'#a78bfa', fontWeight:600 }}>ETH</span>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:9, fontWeight:700, color:MUT, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:5 }}>Required</p>
                <span className="mono" style={{ fontSize:18, fontWeight:700, color:'#fff' }}>{MIN_ETH} ETH</span>
              </div>
            </div>
            <div style={{ height:8, borderRadius:4, background:'rgba(10,10,10,0.8)', overflow:'hidden', marginBottom:8 }}>
              <div style={{
                height:'100%', borderRadius:4, width:`${pct}%`,
                background: pct >= 100 ? 'linear-gradient(90deg, #555, #fff)' : 'linear-gradient(90deg, #92400e, #f59e0b)',
                transition:'width 0.8s ease',
              }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
              <span style={{ color:MUT }}>{pct.toFixed(0)}% funded</span>
              {user.eth_balance < MIN_ETH && (
                <span style={{ color:'#fbbf24' }}>Still needed: <span className="mono">{fmtEth(MIN_ETH - user.eth_balance)} ETH</span></span>
              )}
            </div>
          </div>

          {/* Info */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 13px', borderRadius:12, background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.2)' }}>
            <AlertTriangle size={14} color="#fbbf24" style={{ flexShrink:0, marginTop:1 }}/>
            <p style={{ fontSize:12, color:'rgba(251,191,36,0.85)', lineHeight:1.5 }}>
              <strong>Minimum deposit: {minAmount ? `${fmtEth(minAmount)} ETH` : 'checking...'}</strong> Amounts below the minimum are permanently lost.
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'32px 0' }}>
              <Spinner size={36}/>
              <p style={{ color:MUT, fontSize:13 }}>Generating your deposit address...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 13px', borderRadius:12, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={14} color="#f87171" style={{ flexShrink:0, marginTop:1 }}/>
                <p style={{ fontSize:13, color:'#fca5a5' }}>{error}</p>
              </div>
              <button onClick={loadAddress} style={{ padding:'12px', borderRadius:12, border:`1px solid ${A15}`, background:A10, color:A, fontSize:13, fontWeight:600, cursor:'pointer' }}>Retry</button>
            </div>
          )}

          {/* QR + address */}
          {!loading && address && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                <div style={{ padding:16, borderRadius:20, background:'#fff', boxShadow:'0 4px 24px rgba(0,0,0,0.6)' }}>
                  <canvas ref={canvasRef}/>
                </div>
                <p style={{ fontSize:12, color:MUT }}>Scan to get the deposit address</p>
              </div>

              <div style={{ padding:'16px', borderRadius:16, background:'rgba(18,18,18,0.6)', border:`1px solid ${A15}` }}>
                <p style={{ fontSize:9, fontWeight:700, color:MUT, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10 }}>Deposit Address</p>
                <p className="mono" style={{ fontSize:12, color:'#fff', wordBreak:'break-all', lineHeight:1.7, marginBottom:14 }}>{address}</p>
                <button onClick={copyAddr} style={{
                  width:'100%', padding:'13px', borderRadius:12, cursor:'pointer',
                  background: copied ? A15 : A10,
                  border:`1px solid ${A25}`,
                  color:A, fontSize:13, fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  transition:'all 0.2s',
                }}>
                  {copied ? <><Check size={15}/> Copied!</> : <><Copy size={15}/> Copy Address</>}
                </button>
              </div>

              <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 13px', borderRadius:12, background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.2)' }}>
                <AlertTriangle size={14} color="#fbbf24" style={{ flexShrink:0, marginTop:1 }}/>
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:'#fbbf24', marginBottom:3 }}>Minimum deposit: {minAmount ? `${fmtEth(minAmount)} ETH.` : 'checking...'}</p>
                  <p style={{ fontSize:11, color:'rgba(251,191,36,0.7)', lineHeight:1.4 }}>Amounts below the minimum are permanently lost.</p>
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 13px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:`1px solid ${A15}`, marginBottom:4 }}>
                <Shield size={14} color={A} style={{ flexShrink:0, marginTop:1 }}/>
                <p style={{ fontSize:12, color:'rgba(200,200,200,0.7)', lineHeight:1.5 }}>
                  Credited after <strong style={{ color:A }}>10 confirmations</strong> — typically <strong style={{ color:A }}>2-5 mins</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
