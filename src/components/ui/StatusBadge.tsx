import type { WithdrawalStatus } from '@/types'
const cfg: Record<WithdrawalStatus, {label:string;bg:string;color:string;border:string}> = {
  pending:    { label:'Pending',    bg:'rgba(251,191,36,0.1)',  color:'#fbbf24', border:'rgba(251,191,36,0.25)' },
  processing: { label:'Processing', bg:'rgba(56,189,248,0.1)',  color:'#38bdf8', border:'rgba(56,189,248,0.25)' },
  completed:  { label:'Completed',  bg:'rgba(34,197,94,0.12)',  color:'#4ade80', border:'rgba(34,197,94,0.3)'   },
  rejected:   { label:'Rejected',   bg:'rgba(239,68,68,0.1)',   color:'#f87171', border:'rgba(239,68,68,0.25)'  },
  cancelled:  { label:'Cancelled',  bg:'rgba(107,114,128,0.1)', color:'#9ca3af', border:'rgba(107,114,128,0.2)' },
}
export function StatusBadge({ status }: { status: WithdrawalStatus }) {
  const { label, bg, color, border } = cfg[status] ?? cfg.pending
  return (
    <span style={{
      background: bg, color, border: `1px solid ${border}`,
      padding: '3px 12px', borderRadius: 999,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>{label}</span>
  )
}
