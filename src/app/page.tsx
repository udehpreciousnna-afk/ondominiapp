'use client'
import { useEffect, useState, useCallback } from 'react'
import { Copy, Check, ArrowDownToLine, ArrowUpFromLine, History, ChevronDown, ChevronUp, ExternalLink, Wallet } from 'lucide-react'
import { OndoLogo, OndoIcon, EthIcon } from '@/components/ui/BioLogo'
import { Spinner } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { WithdrawSheet } from '@/components/withdraw/WithdrawSheet'
import { DepositSheet } from '@/components/deposit/DepositSheet'
import { initTelegramApp, getInitData, getTelegramUser, haptic, hapticSuccess, showAlert } from '@/lib/telegram'
import { shortAddr, fmtOndo, fmtEth, fmtDate } from '@/lib/utils'
import type { User, Prices, Withdrawal } from '@/types'

type AppState = 'loading' | 'error' | 'ready'

export default function Home() {
  const [state, setState]               = useState<AppState>('loading')
  const [user, setUser]                 = useState<User | null>(null)
  const [prices, setPrices]             = useState<Prices>({ ondo: 0, eth: 0 })
  const [withdrawals, setWithdrawals]   = useState<Withdrawal[]>([])
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showDeposit, setShowDeposit]   = useState(false)
  const [showHistory, setShowHistory]   = useState(false)
  const [copied, setCopied]             = useState(false)
  const [expandedW, setExpandedW]       = useState<number | null>(null)
  const [errorMsg, setErrorMsg]         = useState('')

  const loadPrices = useCallback(async () => {
    try { const r = await fetch('/api/prices'); setPrices(await r.json()) } catch {}
  }, [])

  const loadWithdrawals = useCallback(async (uid: number) => {
    try {
      const r = await fetch(`/api/withdrawals?user_id=${uid}`)
      const d = await r.json()
      setWithdrawals(d.withdrawals ?? [])
    } catch {}
  }, [])

  useEffect(() => {
    initTelegramApp()
    const init = async () => {
      const tgUser   = getTelegramUser()
      const initData = getInitData()
      const isDev    = process.env.NODE_ENV === 'development' && !initData

      if (!tgUser && !isDev) {
        setErrorMsg('Please open this app from the ONDO Finance bot in Telegram.')
        setState('error')
        return
      }

      try {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initData: isDev ? 'dev_mode' : initData,
            devUser:  isDev ? { id: 123456789, first_name: 'Test', username: 'testuser' } : undefined,
          }),
        })
        const data = await res.json()
        if (!data.user) throw new Error(data.error ?? 'No user returned')
        setUser(data.user)
        setState('ready')
        await Promise.all([loadPrices(), loadWithdrawals(data.user.user_id)])
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load your account.'
        setErrorMsg(msg)
        setState('error')
      }
    }
    init()
    const iv = setInterval(loadPrices, 60_000)
    return () => clearInterval(iv)
  }, [loadPrices, loadWithdrawals])

  // ── App-wide balance poll — keeps detecting deposits even after the sheet closes
  useEffect(() => {
    if (state !== 'ready' || !user) return

    const checkForCredit = async () => {
      try {
        const r = await fetch('/api/sync', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: getInitData() }),
        })
        const d = await r.json()
        if (!d.user) return
        const gained = d.user.eth_balance - user.eth_balance
        if (gained > 0.000001) {
          setUser(d.user)
          loadWithdrawals(d.user.user_id)
          hapticSuccess()
          showAlert(`✅ ${fmtEth(gained)} ETH has been credited to your balance!`)
        } else if (d.user.eth_balance !== user.eth_balance || d.user.bio_balance !== user.bio_balance) {
          setUser(d.user)
        }
      } catch {}
    }

    const iv = setInterval(checkForCredit, 15_000)
    return () => clearInterval(iv)
  }, [state, user, loadWithdrawals])

  const copyWallet = () => {
    if (!user?.wallet_address) return
    navigator.clipboard.writeText(user.wallet_address)
    setCopied(true); haptic()
    setTimeout(() => setCopied(false), 2000)
  }

  const refreshUser = async () => {
    if (!user) return
    try {
      const r = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData() }),
      })
      const d = await r.json()
      if (d.user) { setUser(d.user); loadWithdrawals(d.user.user_id) }
    } catch {}
  }

  // ── Loading ──────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <OndoLogo size={72} />
        <Spinner size={28} />
        <p style={{ color: 'rgba(200,200,200,0.6)', fontSize: 14 }}>Loading your portal...</p>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────
  if (state === 'error' || !user) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
        <OndoLogo size={64} />
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Unable to Load</h2>
        <p style={{ color: 'rgba(200,200,200,0.6)', fontSize: 14, lineHeight: 1.6 }}>{errorMsg}</p>
      </div>
    )
  }

  const name     = user.telegram_name || user.username || 'User'
  const initials = name.slice(0, 2).toUpperCase()
  const photoUrl = getTelegramUser()?.photo_url ?? null
  const ondoUsd  = user.bio_balance * prices.ondo
  const ethUsd   = user.eth_balance * prices.eth

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>

      {/* ── HEADER ── */}
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '36px 24px 24px' }}>
        <OndoLogo size={72} />
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginTop: 4 }}>
          ONDO Finance
        </h1>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,200,200,0.7)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          ONDO Withdrawal Portal
        </p>
      </div>

      {/* ── USER CARD ── */}
      <div className="glass glow fade-up-d1" style={{ margin: '0 16px 12px', borderRadius: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 18px 14px' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #1a1a1a, #3a3a3a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff',
            boxShadow: '0 0 20px rgba(255,255,255,0.08)',
            border: '1.5px solid rgba(255,255,255,0.15)',
            overflow: 'hidden',
          }}>
            {photoUrl
              ? <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials
            }
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </p>
            <p style={{ fontSize: 10, fontWeight: 500, color: 'rgba(200,200,200,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3 }}>
              Telegram ID
            </p>
            <p className="mono" style={{ fontSize: 13, color: 'rgba(200,200,200,0.8)', marginTop: 1 }}>
              {user.user_id}
            </p>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            borderRadius: 999, background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px #fff', animation: 'pulse-dot 2s infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Active</span>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 18px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px 16px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wallet size={15} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(200,200,200,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>
              Wallet Address
            </p>
            <p className="mono" style={{ fontSize: 12, color: user.wallet_address ? '#fff' : 'rgba(200,200,200,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.wallet_address ? shortAddr(user.wallet_address, 18, 6) : 'No wallet linked'}
            </p>
          </div>
          {user.wallet_address && (
            <button onClick={copyWallet} style={{ padding: '7px 9px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* ── ACTION TILES ── */}
      <div className="fade-up-d2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '0 16px 12px' }}>
        <ActionTile icon={<ArrowDownToLine size={22} color="#fff" />} label="Deposit"  onClick={() => { haptic(); setShowDeposit(true) }}  active={false} />
        <ActionTile icon={<ArrowUpFromLine size={22} color="#fff" />} label="Withdraw" onClick={() => { haptic(); setShowWithdraw(true) }} active={true}  />
      </div>

      {/* ── ASSETS ── */}
      <div className="fade-up-d3" style={{ margin: '0 16px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 4px' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Assets</span>
          <span style={{ fontSize: 12, color: 'rgba(200,200,200,0.5)', fontWeight: 500 }}>Balance</span>
        </div>

        {/* ONDO */}
        <div className="glass glow" style={{ borderRadius: 16, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
          onClick={() => { haptic(); setShowWithdraw(true) }}>
          <OndoIcon size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>ONDO</p>
            <p style={{ fontSize: 12, color: 'rgba(200,200,200,0.5)', marginTop: 2 }}>
              {prices.ondo > 0 ? `$${prices.ondo.toFixed(4)} USD` : '—'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="mono" style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{fmtOndo(user.bio_balance)}</p>
            <p style={{ fontSize: 12, color: 'rgba(200,200,200,0.7)', marginTop: 2 }}>${ondoUsd > 0 ? ondoUsd.toFixed(2) : '0.00'}</p>
          </div>
        </div>

        {/* ETH */}
        <div className="glass" style={{ borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
          onClick={() => { haptic(); setShowDeposit(true) }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: '#ffffff', border: '1px solid rgba(200,200,200,0.3)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/eth-logo.png" alt="ETH" style={{ width: '72%', height: '72%', objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>ETH</p>
            <p style={{ fontSize: 12, color: 'rgba(200,200,200,0.5)', marginTop: 2 }}>
              {prices.eth > 0 ? `$${prices.eth.toFixed(2)} USD` : '—'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="mono" style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{fmtEth(user.eth_balance)}</p>
            <p style={{ fontSize: 12, color: 'rgba(200,200,200,0.7)', marginTop: 2 }}>${ethUsd > 0 ? ethUsd.toFixed(2) : '0.00'}</p>
          </div>
        </div>
      </div>

      {/* ── HISTORY ── */}
      <div className="fade-up-d4 glass" style={{ margin: '0 16px', borderRadius: 20, overflow: 'hidden' }}>
        <button
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}
          onClick={() => { haptic(); setShowHistory(h => !h) }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={16} color="rgba(200,200,200,0.7)" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Withdrawal History</span>
            {withdrawals.length > 0 && (
              <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                {withdrawals.length}
              </span>
            )}
          </div>
          {showHistory
            ? <ChevronUp   size={15} color="rgba(200,200,200,0.5)" />
            : <ChevronDown size={15} color="rgba(200,200,200,0.5)" />}
        </button>

        {showHistory && (
          <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {withdrawals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>📭</p>
                <p style={{ color: 'rgba(200,200,200,0.5)', fontSize: 13 }}>No withdrawals yet</p>
              </div>
            ) : withdrawals.map(w => (
              <div key={w.id} style={{ marginTop: 8 }}>
                <button
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 14, background: 'rgba(15,15,15,0.6)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: '#fff', textAlign: 'left' }}
                  onClick={() => setExpandedW(expandedW === w.id ? null : w.id)}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {w.token === 'ETH' ? <EthIcon size={28} /> : <OndoIcon size={28} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="mono" style={{ fontWeight: 600, fontSize: 13 }}>
                      {w.token === 'ETH' ? fmtEth(w.bio_amount) : fmtOndo(w.bio_amount)} {w.token || 'ONDO'}
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(200,200,200,0.5)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortAddr(w.wallet_address)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <StatusBadge status={w.status} />
                    <p style={{ fontSize: 10, color: 'rgba(200,200,200,0.4)', marginTop: 4 }}>{fmtDate(w.submitted_at)}</p>
                  </div>
                </button>

                {expandedW === w.id && (
                  <div style={{ margin: '4px 0 0', padding: '12px 13px', borderRadius: 12, background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12 }}>
                    <DetailRow label="ID"        value={`#${w.id}`} />
                    <DetailRow label="Wallet"    value={shortAddr(w.wallet_address, 10, 6)} />
                    <DetailRow label="Amount"    value={`${w.token === 'ETH' ? fmtEth(w.bio_amount) : fmtOndo(w.bio_amount)} ${w.token || 'ONDO'}`} />
                    <DetailRow label="Submitted" value={fmtDate(w.submitted_at)} />
                    {w.processed_at && <DetailRow label="Processed" value={fmtDate(w.processed_at)} />}
                    {w.tx_hash && (
                      <a
                        href={`https://etherscan.io/tx/${w.tx_hash}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(200,200,200,0.8)', fontSize: 11, fontFamily: 'monospace', marginTop: 6 }}
                      >
                        {shortAddr(w.tx_hash, 8, 6)} <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SHEETS ── */}
      <WithdrawSheet
        open={showWithdraw} onClose={() => setShowWithdraw(false)}
        user={user} prices={prices}
        onDepositOpen={() => { setShowWithdraw(false); setTimeout(() => setShowDeposit(true), 200) }}
        onSuccess={refreshUser}
      />
      <DepositSheet
        open={showDeposit}
        onClose={() => setShowDeposit(false)}
        user={user}
        onBalanceUpdate={(newEth) => {
          setUser(prev => prev ? { ...prev, eth_balance: newEth } : prev)
        }}
      />
    </div>
  )
}

function ActionTile({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active: boolean }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      padding: '20px 12px', borderRadius: 18, cursor: 'pointer',
      background: active ? 'rgba(30,30,30,0.75)' : 'rgba(15,15,15,0.45)',
      border: active ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.08)',
      boxShadow: active ? '0 0 30px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.08)' : 'none',
      backdropFilter: 'blur(20px)', color: '#fff', fontSize: 13, fontWeight: 600,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
        border: active ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      {label}
    </button>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ color: 'rgba(200,200,200,0.5)' }}>{label}</span>
      <span className="mono" style={{ color: '#fff', fontSize: 11 }}>{value}</span>
    </div>
  )
}
