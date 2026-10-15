'use client'
import { useState } from 'react'
import { RefreshCw, CheckCircle, XCircle, Users, Clock, TrendingUp } from 'lucide-react'
import { BioLogo } from '@/components/ui/BioLogo'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Spinner } from '@/components/ui/Spinner'
import { fmtBio, fmtEth, fmtDate, shortAddr } from '@/lib/utils'
import type { Withdrawal, WithdrawalStatus } from '@/types'

interface Stats {
  total_users?: number
  pending_count?: number
  completed_count?: number
  total_bio_out?: number
  total_eth_out?: number
  total_deposits?: number
}

export default function AdminPage() {
  const [authed, setAuthed]           = useState(false)
  const [password, setPassword]       = useState('')
  const [adminPwd, setAdminPwd]       = useState('')
  const [loginErr, setLoginErr]       = useState('')
  const [stats, setStats]             = useState<Stats | null>(null)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [filter, setFilter]           = useState<'all' | WithdrawalStatus>('all')
  const [loading, setLoading]         = useState(false)
  const [updating, setUpdating]       = useState<number | null>(null)
  const [txInputs, setTxInputs]       = useState<Record<number, string>>({})
  const [noteInputs, setNoteInputs]   = useState<Record<number, string>>({})

  const login = async () => {
    setLoginErr('')
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) { setAdminPwd(password); setAuthed(true); loadData(password) }
      else setLoginErr('Wrong password.')
    } catch { setLoginErr('Network error.') }
  }

  const loadData = async (pwd = adminPwd) => {
    setLoading(true)
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE!
      const [sRes, wRes] = await Promise.all([
        fetch(`${base}/admin/stats.php`, { headers: { 'X-Admin-Password': pwd } }),
        fetch(`${base}/admin/withdrawals_api.php`, { headers: { 'X-Admin-Password': pwd } }),
      ])
      if (sRes.ok) setStats(await sRes.json())
      if (wRes.ok) { const d = await wRes.json(); setWithdrawals(d.withdrawals ?? []) }
    } catch {}
    finally { setLoading(false) }
  }

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id)
    try {
      await fetch('/api/admin-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPwd, id, status, tx_hash: txInputs[id] ?? '', notes: noteInputs[id] ?? '' }),
      })
      await loadData()
    } catch {}
    finally { setUpdating(null) }
  }

  const filtered = filter === 'all' ? withdrawals : withdrawals.filter(w => w.status === filter)

  const S = {
    page: { minHeight: '100dvh', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' } as React.CSSProperties,
    loginWrap: { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 } as React.CSSProperties,
    loginCard: {
      background: 'rgba(10,40,20,0.5)',
      border: '1px solid rgba(34,197,94,0.2)',
      backdropFilter: 'blur(20px)',
      borderRadius: 24,
      padding: 36,
      width: '100%',
      maxWidth: 380,
      boxShadow: '0 0 60px rgba(34,197,94,0.12)',
    } as React.CSSProperties,
    topbar: {
      borderBottom: '1px solid rgba(34,197,94,0.08)',
      background: 'rgba(0,0,0,0.9)',
      backdropFilter: 'blur(12px)',
      position: 'sticky' as const,
      top: 0,
      zIndex: 30,
    },
    topbarInner: { maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 12 } as React.CSSProperties,
    main: { maxWidth: 1200, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column' as const, gap: 20 },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12 } as React.CSSProperties,
    statCard: {
      background: 'rgba(10,40,20,0.4)',
      border: '1px solid rgba(34,197,94,0.18)',
      backdropFilter: 'blur(20px)',
      borderRadius: 20,
      padding: 16,
    } as React.CSSProperties,
    tableWrap: {
      background: 'rgba(10,40,20,0.35)',
      border: '1px solid rgba(34,197,94,0.15)',
      backdropFilter: 'blur(20px)',
      borderRadius: 24,
      overflow: 'hidden',
    } as React.CSSProperties,
  }

  // ── Login ─────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={S.page}>
        <div style={S.loginWrap}>
          <div style={S.loginCard}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
              <BioLogo size={52} />
              <h1 style={{ fontSize: 20, fontWeight: 800, marginTop: 14 }}>Admin Panel</h1>
              <p style={{ fontSize: 11, color: 'rgba(134,239,172,0.5)', marginTop: 4 }}>BIO Protocol</p>
            </div>
            {loginErr && (
              <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#fca5a5' }}>
                {loginErr}
              </div>
            )}
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="Admin password"
              style={{ width: '100%', background: 'rgba(5,20,10,0.8)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: '12px 16px', fontSize: 14, color: '#fff', outline: 'none', marginBottom: 14 }}
            />
            <button
              onClick={login}
              style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(90deg,#22c55e,#16a34a)', color: '#000', fontWeight: 800, fontSize: 14, boxShadow: '0 0 24px rgba(34,197,94,0.35)' }}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Dashboard ─────────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* Topbar */}
      <div style={S.topbar}>
        <div style={S.topbarInner}>
          <BioLogo size={32} />
          <span style={{ fontWeight: 700, flex: 1 }}>BIO Admin</span>
          <button
            onClick={() => loadData()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(134,239,172,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <RefreshCw size={12} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
            Refresh
          </button>
          <button
            onClick={() => setAuthed(false)}
            style={{ fontSize: 12, color: 'rgba(134,239,172,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={S.main}>
        {/* Stats */}
        {stats && (
          <div style={S.statsGrid}>
            {[
              { icon: <Users size={15} />,       label: 'Total Users',   value: stats.total_users ?? 0,                color: '#fff'     },
              { icon: <Clock size={15} />,        label: 'Pending',       value: stats.pending_count ?? 0,             color: '#fbbf24'  },
              { icon: <CheckCircle size={15} />,  label: 'Completed',     value: stats.completed_count ?? 0,           color: '#22c55e'  },
              { icon: <TrendingUp size={15} />,   label: 'BIO Paid Out',  value: `${fmtBio(stats.total_bio_out ?? 0)}`, color: '#fff'    },
              { icon: <TrendingUp size={15} />,   label: 'ETH Paid Out',  value: `${fmtEth(stats.total_eth_out ?? 0)}`, color: '#a78bfa' },
              { icon: <TrendingUp size={15} />,   label: 'ETH Deposited', value: `${(stats.total_deposits ?? 0).toFixed(4)}`, color: '#a78bfa' },
            ].map(s => (
              <div key={s.label} style={S.statCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'rgba(134,239,172,0.5)' }}>
                  {s.icon}
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</span>
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['all', 'pending', 'processing', 'completed', 'rejected', 'cancelled'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'capitalize',
                background:   filter === f ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                color:        filter === f ? '#22c55e'               : 'rgba(134,239,172,0.5)',
                border: `1px solid ${filter === f ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {f} {f !== 'all' ? `(${withdrawals.filter(w => w.status === f).length})` : ''}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Spinner size={32} />
          </div>
        ) : (
          <div style={S.tableWrap}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(34,197,94,0.08)', background: 'rgba(5,15,8,0.6)' }}>
                    {['ID', 'User', 'Wallet', 'BIO', 'ETH Fee', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(134,239,172,0.5)', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(134,239,172,0.4)', fontSize: 13 }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                        No withdrawals found
                      </td>
                    </tr>
                  ) : filtered.map(w => (
                    <tr key={w.id} style={{ borderTop: '1px solid rgba(34,197,94,0.05)' }}>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 11, color: 'rgba(134,239,172,0.5)' }}>#{w.id}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ fontWeight: 600, fontSize: 12, color: '#fff' }}>{w.telegram_name || '—'}</p>
                        <p style={{ fontSize: 10, color: 'rgba(134,239,172,0.4)', fontFamily: 'monospace', marginTop: 2 }}>{w.user_id}</p>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(134,239,172,0.6)' }}>{shortAddr(w.wallet_address, 8, 6)}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(w.wallet_address)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(134,239,172,0.4)' }}
                            title="Copy"
                          >📋</button>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#fff', whiteSpace: 'nowrap' }}>
                        {w.token === 'ETH' ? fmtEth(w.bio_amount) : fmtBio(w.bio_amount)} {w.token || 'BIO'}
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 11, color: 'rgba(134,239,172,0.5)', whiteSpace: 'nowrap' }}>
                        {w.token === 'ETH' ? '— (fee-less)' : `${w.eth_fee_paid} ETH`}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge status={w.status} />
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 11, color: 'rgba(134,239,172,0.4)', whiteSpace: 'nowrap' }}>
                        {fmtDate(w.submitted_at)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {(w.status === 'pending' || w.status === 'processing') ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                            <input
                              placeholder="TX hash (optional)"
                              value={txInputs[w.id] ?? ''}
                              onChange={e => setTxInputs(p => ({ ...p, [w.id]: e.target.value }))}
                              style={{ background: 'rgba(5,20,10,0.8)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontFamily: 'monospace', color: '#fff', outline: 'none', width: '100%' }}
                            />
                            <input
                              placeholder="Admin notes"
                              value={noteInputs[w.id] ?? ''}
                              onChange={e => setNoteInputs(p => ({ ...p, [w.id]: e.target.value }))}
                              style={{ background: 'rgba(5,20,10,0.8)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#fff', outline: 'none', width: '100%' }}
                            />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => updateStatus(w.id, 'completed')}
                                disabled={updating === w.id}
                                style={{ flex: 1, padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(90deg,#16a34a,#22c55e)', color: '#000', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: updating === w.id ? 0.6 : 1 }}
                              >
                                {updating === w.id ? <Spinner size={12} color="#000" /> : <CheckCircle size={11} />}
                                Complete
                              </button>
                              <button
                                onClick={() => updateStatus(w.id, 'rejected')}
                                disabled={updating === w.id}
                                style={{ flex: 1, padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#7f1d1d', color: '#fca5a5', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                              >
                                <XCircle size={11} /> Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: 11 }}>
                            {w.tx_hash && (
                              <a href={`https://etherscan.io/tx/${w.tx_hash}`} target="_blank" rel="noopener noreferrer"
                                style={{ color: '#22c55e', fontFamily: 'monospace', display: 'block' }}>
                                {shortAddr(w.tx_hash, 6, 4)} ↗
                              </a>
                            )}
                            {w.admin_notes && <p style={{ color: 'rgba(134,239,172,0.4)', marginTop: 4, fontStyle: 'italic' }}>{w.admin_notes}</p>}
                            {!w.tx_hash && !w.admin_notes && <span style={{ color: 'rgba(134,239,172,0.3)' }}>—</span>}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
