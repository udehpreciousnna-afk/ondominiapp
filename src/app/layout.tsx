import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'ONDO Finance',
  description: 'ONDO Withdrawal Portal',
}
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1,
  maximumScale: 1, userScalable: false,
  themeColor: '#08080f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="no-select">
        {/* ── Star field layers ── */}
        <div id="stars-sm" />
        <div id="stars-md" />
        <div id="stars-lg" />

        <div style={{ position: 'relative', zIndex: 1, minHeight: '100dvh' }}>
          {children}
        </div>
      </body>
    </html>
  )
}
