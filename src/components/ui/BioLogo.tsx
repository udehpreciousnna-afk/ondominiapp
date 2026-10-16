// ONDO Finance logo components
// OndoLogo — large header version using the actual logo image
// OndoIcon — small token row version

import Image from 'next/image'

/** @deprecated use OndoLogo */
export function BioLogo({ size = 72 }: { size?: number }) { return <OndoLogo size={size} /> }
/** @deprecated use OndoIcon */
export function BioIcon({ size = 36 }: { size?: number }) { return <OndoIcon size={size} /> }

export function OndoLogo({ size = 72 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      boxShadow: `0 0 ${size * 0.55}px rgba(255,255,255,0.14), 0 0 ${size * 0.2}px rgba(255,255,255,0.06)`,
      border: '1.5px solid rgba(255,255,255,0.2)',
      background: '#fff',
    }}>
      <Image
        src="/ondo-logo.jpg" alt="ONDO Finance"
        width={size} height={size}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        priority
      />
    </div>
  )
}

export function OndoIcon({ size = 36 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      boxShadow: `0 0 ${size * 0.4}px rgba(255,255,255,0.12)`,
      border: '1px solid rgba(255,255,255,0.22)',
      background: '#fff',
    }}>
      <Image
        src="/ondo-logo.jpg" alt="ONDO"
        width={size} height={size}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        priority
      />
    </div>
  )
}

export function EthIcon({ size = 36 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 0 ${size * 0.4}px rgba(255,255,255,0.12)`,
      border: '1px solid rgba(200,200,200,0.3)',
      background: '#ffffff',
    }}>
      <Image
        src="/eth-logo.png" alt="ETH"
        width={size} height={size}
        style={{ width: '72%', height: '72%', objectFit: 'contain', display: 'block' }}
        priority
      />
    </div>
  )
}
