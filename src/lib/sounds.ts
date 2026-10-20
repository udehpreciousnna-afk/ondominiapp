// Lightweight Web Audio API sound effects — no external files needed

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try { return new (window.AudioContext || (window as any).webkitAudioContext)() } catch { return null }
}

/** Play a two-tone descending error sound for Insufficient ETH */
export function playErrorSound() {
  const ctx = getCtx()
  if (!ctx) return
  ;[0, 0.22].forEach((delay, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(i === 0 ? 320 : 220, ctx.currentTime + delay)
    osc.frequency.exponentialRampToValueAtTime(i === 0 ? 160 : 100, ctx.currentTime + delay + 0.3)
    gain.gain.setValueAtTime(0.28, ctx.currentTime + delay)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + 0.3)
  })
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
