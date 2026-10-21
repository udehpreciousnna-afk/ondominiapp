import type { TelegramUser } from '@/types'
declare global {
  interface Window {
    Telegram?: { WebApp: {
      initData: string
      initDataUnsafe: { user?: TelegramUser; hash: string; auth_date: number }
      ready: () => void; expand: () => void; close: () => void
      showAlert: (message: string, callback?: () => void) => void
      HapticFeedback: {
        impactOccurred: (s:'light'|'medium'|'heavy') => void
        notificationOccurred: (t:'error'|'success'|'warning') => void
      }
    }}
  }
}
export function getTelegramWebApp() { return typeof window !== 'undefined' ? window.Telegram?.WebApp ?? null : null }

/** Read raw initData from the URL hash (Telegram sets #tgWebAppData=… even before the script loads) */
function getInitDataFromHash(): string {
  if (typeof window === 'undefined') return ''
  try {
    const p = new URLSearchParams(window.location.hash.slice(1))
    return p.get('tgWebAppData') ?? ''
  } catch { return '' }
}

/** Parse the user object from URL-hash initData as a fallback */
function getTelegramUserFromHash(): TelegramUser | null {
  try {
    const raw = getInitDataFromHash()
    if (!raw) return null
    const u = new URLSearchParams(raw).get('user')
    return u ? JSON.parse(decodeURIComponent(u)) : null
  } catch { return null }
}

export function getTelegramUser(): TelegramUser|null {
  return getTelegramWebApp()?.initDataUnsafe?.user ?? getTelegramUserFromHash() ?? null
}
export function getInitData(): string {
  return getTelegramWebApp()?.initData || getInitDataFromHash() || ''
}
export function initTelegramApp() { const t = getTelegramWebApp(); if (!t) return; t.ready(); t.expand() }

/** Wait up to `timeout` ms for telegram-web-app.js to inject window.Telegram.WebApp,
 *  then call ready()/expand(). Falls back gracefully if the script is blocked. */
export async function waitForTelegramWebApp(timeout = 3000): Promise<void> {
  if (typeof window === 'undefined') return
  const start = Date.now()
  while (!window.Telegram?.WebApp && Date.now() - start < timeout) {
    await new Promise(r => setTimeout(r, 100))
  }
  initTelegramApp()
}
export function haptic(s: 'light'|'medium'|'heavy'='light') { getTelegramWebApp()?.HapticFeedback.impactOccurred(s) }
export function hapticSuccess() { getTelegramWebApp()?.HapticFeedback.notificationOccurred('success') }
export function hapticError() { getTelegramWebApp()?.HapticFeedback.notificationOccurred('error') }
export function showAlert(message: string, callback?: () => void) {
  const t = getTelegramWebApp()
  if (t) t.showAlert(message, callback)
  else { if (typeof window !== 'undefined') window.alert(message); callback?.() }
}
