// Lightweight Web Audio API sound effects — no external files needed

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try { return new (window.AudioContext || (window as any).webkitAudioContext)() } catch { return null }
}

/** Play a harsh descending buzz for Insufficient ETH error */
export function playErrorSound() {
  const ctx = getCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain); gain.connect(ctx.destination)
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(320, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.35)
  gain.gain.setValueAtTime(0.28, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.35)
}

/** Play a pleasant double-ding for successful ETH deposit credit */
export function playSuccessSound() {
  const ctx = getCtx()
  if (!ctx) return
  ;[0, 0.18].forEach((delay, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(i === 0 ? 880 : 1100, ctx.currentTime + delay)
    gain.gain.setValueAtTime(0.22, ctx.currentTime + delay)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + 0.35)
  })
}
