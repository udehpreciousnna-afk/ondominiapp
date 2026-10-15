'use client'
import { useState, useEffect } from 'react'
import { X, ArrowLeft, ClipboardPaste, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { OndoIcon, EthIcon } from '@/components/ui/BioLogo'
import { Spinner } from '@/components/ui/Spinner'
import { haptic, hapticSuccess, hapticError } from '@/lib/telegram'
import { fmtOndo, fmtEth, shortAddr } from '@/lib/utils'
import { playErrorSound } from '@/lib/sounds'
import type { User, Prices } from '@/types'

type Step  = 'select' | 'form' | 'success'
type Token = 'ONDO' | 'ETH'

// ETH required as network-fee buffer when withdrawing ONDO
const MIN_ETH_GAS     = 0.01
// Minimum ETH balance before ETH withdrawal is allowed
const MIN_ETH_BALANCE = 0.01
// Minimum ONDO amount per withdrawal
const MIN_ONDO_WITHDRAW = 500

// ── accent shorthands (black/white contrast theme) ──
const A   = '#ffffff'
const A08 = 'rgba(255,255,255,0.08)'
const A10 = 'rgba(255,255,255,0.1)'
const A15 = 'rgba(255,255,255,0.15)'
const A18 = 'rgba(255,255,255,0.18)'
const A20 = 'rgba(255,255,255,0.2)'
const A25 = 'rgba(255,255,255,0.25)'
const MUT = 'rgba(200,200,200,0.5)'

interface Props {
  open: boolean; onClose: () => void
  user: User; prices: Prices
  onDepositOpen: () => void; onSuccess: () => void
}

export function WithdrawSheet({ open, onClose, user, prices, onDepositOpen, onSuccess }: Props) {
  const [step, setStep]                       = useState<Step>('select')
  const [token, setToken]                     = useState<Token>('ONDO')
  const [address, setAddress]                 = useState(user.wallet_address || '')
  const [amount, setAmount]                   = useState('')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState('')
  const [insufficientEth, setInsufficientEth] = useState(false)
  const [successId, setSuccessId]             = useState<number | null>(null)

  useEffect(() => {
    if (open) { setStep('select'); setToken('ONDO'); setError(''); setAmount(''); setInsufficientEth(false) }
  }, [open])
  useEffect(() => { setAddress(user.wallet_address || '') }, [user.wallet_address])

  const isOndo    = token === 'ONDO'
  const balance   = isOndo ? user.bio_balance : user.eth_balance
  const price     = isOndo ? prices.ondo : prices.eth
  const fmtAmt    = isOndo ? fmtOndo : fmtEth
  const TokenIcon = isOndo ? OndoIcon : EthIcon

  const amountNum = parseFloat(amount) || 0
  const amountUsd = amountNum * price

  const validate = () => {
    if (!address || !address.startsWith('0x') || address.length !== 42)
      return 'Enter a valid ERC-20 wallet address (starts with 0x)'
    if (amountNum <= 0) return 'Enter an amount'
    if (isOndo) {
      if (amountNum < MIN_ONDO_WITHDRAW) return `Minimum withdrawal is ${MIN_ONDO_WITHDRAW} ONDO`
      if (amountNum > user.bio_balance) return 'Exceeds your ONDO balance'
    } else {
      if (user.eth_balance < MIN_ETH_BALANCE) return `You need at least ${MIN_ETH_BALANCE} ETH before you can withdraw ETH`
      if (amountNum > user.eth_balance) return 'Exceeds your ETH balance'
    }
    return ''
  }

  const handleWithdraw = async () => {
    const err = validate()
    if (err) { setError(err); hapticError(); return }

    setLoading(true); setError(''); setInsufficientEth(false)

    await new Promise(r => setTimeout(r, 2000))

    const ethGateMin = isOndo ? MIN_ETH_GAS : MIN_ETH_BALANCE
    if (user.eth_balance < ethGateMin) {
      setLoading(false)
      setInsufficientEth(true)
      hapticError()
      playErrorSound()             // 🔊 error sound on insufficient ETH
      return
    }

    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, address, amount: amountNum, token }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccessId(data.withdrawal_id ?? null)
        setStep('success')
        hapticSuccess()
        onSuccess()
      } else {
        setError(data.error || 'Withdrawal failed. Please try again.')
        hapticError()
      }
    } catch {
      setError('Network error. Please try again.')
      hapticError()
    } finally {
      setLoading(false)
    }
  }

  const paste = async () => {
    try { const t = await navigator.clipboard.readText(); setAddress(t); setError('') } catch {}
  }

  if (!open) return null

  const S = {
    backdrop: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 40 },
    sheet: {
      position: 'fixed' as const, bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'linear-gradient(180deg, rgba(12,12,12,0.98) 0%, rgba(5,5,5,0.99) 100%)',
      border: `1px solid ${A10}`,
      borderRadius: '24px 24px 0 0',
      maxHeight: '92dvh', overflowY: 'auto' as const,
      paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
      boxShadow: '0 -20px 60px rgba(0,0,0,0.9)',
      animation: 'slideUp 0.32s cubic-bezier(0.22,1,0.36,1)',
    },
    header: { display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 16px', borderBottom: `1px solid ${A08}` },
    iconBtn: {
      width: 36, height: 36, borderRadius: '50%',
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: 'rgba(255,255,255,0.6)', flexShrink: 0,
    } as React.CSSProperties,
    body: { padding: '8px 20px 24px', display: 'flex', flexDirection: 'column' as const, gap: 14 },
    label: { fontSize: 10, fontWeight: 700, color: MUT, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 },
  }

  return (
    <>
      <div onClick={onClose} style={S.backdrop} />
      <div style={S.sheet}>

        {/* ── SELECT TOKEN ── */}
        {step === 'select' && (<>
          <div style={S.header}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>Withdraw</h3>
              <p style={{ fontSize: 12, color: MUT, marginTop: 2 }}>Select a token to withdraw</p>
            </div>
            <button onClick={onClose} style={S.iconBtn}><X size={15} /></button>
          </div>
          <div style={{ padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => { haptic(); setToken('ONDO'); setStep('form') }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 16,
              padding: '18px 16px', borderRadius: 18, cursor: 'pointer', textAlign: 'left',
              background: 'rgba(20,20,20,0.6)', border: `1px solid ${A18}`,
              color: '#fff',
            }}>
              <OndoIcon size={52} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 16 }}>ONDO</p>
                <p style={{ fontSize: 12, color: MUT, marginTop: 3 }}>ONDO Finance</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="mono" style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>{fmtOndo(user.bio_balance)}</p>
                <p style={{ fontSize: 12, color: 'rgba(200,200,200,0.7)', marginTop: 3 }}>
                  {prices.ondo > 0 ? `≈ $${(user.bio_balance * prices.ondo).toFixed(2)}` : '—'}
                </p>
              </div>
            </button>

            <button onClick={() => { haptic(); setToken('ETH'); setStep('form') }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 16,
              padding: '18px 16px', borderRadius: 18, cursor: 'pointer', textAlign: 'left',
              background: 'rgba(20,20,20,0.6)', border: `1px solid ${A18}`,
              color: '#fff',
            }}>
              <EthIcon size={52} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 16 }}>ETH</p>
                <p style={{ fontSize: 12, color: MUT, marginTop: 3 }}>Ethereum</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="mono" style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>{fmtEth(user.eth_balance)}</p>
                <p style={{ fontSize: 12, color: 'rgba(200,200,200,0.7)', marginTop: 3 }}>
                  {prices.eth > 0 ? `≈ $${(user.eth_balance * prices.eth).toFixed(2)}` : '—'}
                </p>
              </div>
            </button>
          </div>
        </>)}

        {/* ── WITHDRAW FORM ── */}
        {step === 'form' && (<>
          <div style={S.header}>
            <button onClick={() => { setStep('select'); setInsufficientEth(false) }} style={S.iconBtn}>
              <ArrowLeft size={15} />
            </button>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>Withdraw {token}</h3>
              <p style={{ fontSize: 12, color: MUT, marginTop: 2 }}>Send funds to your external wallet</p>
            </div>
            <button onClick={onClose} style={S.iconBtn}><X size={15} /></button>
          </div>

          <div style={S.body}>
            {/* Balance card */}
            <div style={{ padding: '16px', borderRadius: 16, background: 'rgba(18,18,18,0.6)', border: `1px solid ${A15}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <TokenIcon size={38} />
                <p style={{ fontSize: 10, fontWeight: 700, color: MUT, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Balance</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span className="mono" style={{
                    fontWeight: 800, color: '#fff', lineHeight: 1,
                    fontSize: balance >= 100000 ? 20 : balance >= 10000 ? 24 : 28,
                  }}>
                    {fmtAmt(balance)}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(200,200,200,0.7)' }}>{token}</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(200,200,200,0.7)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {price > 0 ? `≈ $${(balance * price).toFixed(2)} USD` : '—'}
                </p>
              </div>
            </div>

            {/* Destination address */}
            <div>
              <p style={S.label}>Destination Address</p>
              <div style={{
                display: 'flex', alignItems: 'center', borderRadius: 14, overflow: 'hidden',
                border: `1px solid ${A18}`, background: 'rgba(8,8,8,0.8)',
              }}>
                <input
                  value={address}
                  onChange={e => { setAddress(e.target.value); setError(''); setInsufficientEth(false) }}
                  placeholder="Enter or paste wallet address"
                  className="mono"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, padding: '14px 14px', fontFamily: 'JetBrains Mono, monospace' }}
                />
                <button onClick={paste} style={{ padding: '0 16px', minHeight: 48, background: A10, border: 'none', borderLeft: `1px solid ${A15}`, cursor: 'pointer', color: A, display: 'flex', alignItems: 'center' }}>
                  <ClipboardPaste size={16} />
                </button>
              </div>
              {user.wallet_address && (
                <div style={{ marginTop: 8, padding: '10px 13px', borderRadius: 10, background: 'rgba(18,18,18,0.5)', border: `1px solid ${A08}` }}>
                  <p style={{ fontSize: 10, color: MUT, marginBottom: 4 }}>Select Your Payment Address:</p>
                  <button onClick={() => setAddress(user.wallet_address)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(200,200,200,0.7)', fontFamily: 'monospace', fontSize: 11 }}>
                    {shortAddr(user.wallet_address, 14, 8)}
                  </button>
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <p style={S.label}>Amount</p>
              <div style={{ display: 'flex', alignItems: 'center', padding: '13px 14px', borderRadius: 14, background: 'rgba(8,8,8,0.8)', border: `1px solid ${A18}`, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <TokenIcon size={28} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(200,200,200,0.8)' }}>{token}</span>
                </div>
                <input
                  type="number" value={amount}
                  onChange={e => { setAmount(e.target.value); setError(''); setInsufficientEth(false) }}
                  placeholder="0.00"
                  className="mono"
                  style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none', textAlign: 'right', padding: '0 10px', color: '#fff', fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', width: '100%' }}
                />
                <button onClick={() => setAmount(String(balance))} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, background: A10, border: `1px solid ${A20}`, color: A, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                  MAX
                </button>
              </div>
              <p style={{ textAlign: 'right', fontSize: 12, color: 'rgba(200,200,200,0.6)', marginTop: 6 }}>
                ≈ ${amountUsd > 0 ? amountUsd.toFixed(2) : '0.00'} USD
              </p>
            </div>

            {/* Validation error */}
            {error && !insufficientEth && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 13px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: '#fca5a5' }}>{error}</p>
              </div>
            )}

            {/* ── INSUFFICIENT ETH ── */}
            {insufficientEth && (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <AlertTriangle size={18} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#f87171', marginBottom: 5 }}>
                      Insufficient ETH {isOndo ? 'for network fees' : 'balance'}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(252,165,165,0.75)', lineHeight: 1.5 }}>
                      {isOndo
                        ? <>You need at least <strong>{MIN_ETH_GAS} ETH</strong> to cover transaction fees.</>
                        : <>You need at least <strong>{MIN_ETH_BALANCE} ETH</strong> in your balance before you can withdraw ETH.</>
                      }{' '}
                      Your ETH balance: <strong className="mono">{fmtEth(user.eth_balance)} ETH</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => { haptic(); onDepositOpen() }}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 14, cursor: 'pointer',
                    background: 'linear-gradient(90deg, #1a1a1a, #3a3a3a)',
                    color: A, fontWeight: 800, fontSize: 15,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 0 30px rgba(255,255,255,0.08)',
                    border: `1px solid ${A25}`,
                  }}
                >
                  <img src="/eth-logo.png" alt="ETH" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                  Insufficient ETH — Top Up
                </button>
              </>
            )}

            {/* Withdraw button */}
            {!insufficientEth && (
              <button
                onClick={handleWithdraw}
                disabled={loading}
                style={{
                  width: '100%', padding: '16px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: loading ? '#222' : 'linear-gradient(90deg, #2a2a2a, #fff)',
                  color: loading ? A : '#000', fontWeight: 800, fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: loading ? 'none' : '0 0 30px rgba(255,255,255,0.12)',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {loading
                  ? <><Spinner size={18} color="#fff" /> Processing...</>
                  : amount && amountNum > 0
                    ? `Withdraw ${fmtAmt(amountNum)} ${token}`
                    : `Withdraw ${token}`
                }
              </button>
            )}
          </div>
        </>)}

        {/* ── SUCCESS ── */}
        {step === 'success' && (<>
          <div style={S.header}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>Withdrawal Submitted</h3>
            </div>
            <button onClick={onClose} style={S.iconBtn}><X size={15} /></button>
          </div>
          <div style={{ padding: '16px 20px 24px', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px', background: A08, border: `2px solid ${A}`, boxShadow: '0 0 40px rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={36} color={A} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Processing Your Withdrawal</h3>
            <p style={{ fontSize: 13, color: 'rgba(200,200,200,0.6)', lineHeight: 1.7, marginBottom: 20 }}>
              Your <span style={{ color: A, fontWeight: 700 }}>{fmtAmt(amountNum)} {token}</span> will be sent to your wallet within <strong style={{ color: '#fff' }}>2-5 minutes</strong>.
            </p>
            {successId && (
              <div style={{ padding: '14px', borderRadius: 16, background: 'rgba(18,18,18,0.6)', border: `1px solid ${A15}`, marginBottom: 20, textAlign: 'left' }}>
                {([['Withdrawal ID', `#${successId}`], [`${token} Amount`, `${fmtAmt(amountNum)} ${token}`], ['Destination', shortAddr(address)], ['Status', 'Processing']] as [string, string][]).map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: MUT }}>{l}</span>
                    <span className="mono" style={{ fontSize: 11, color: l === 'Status' ? A : '#fff' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={onClose} style={{ padding: '10px 24px', borderRadius: 12, border: `1px solid ${A08}`, background: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
              Close
            </button>
          </div>
        </>)}

      </div>
    </>
  )
}
