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
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="no-select">
        <div className="bg-watermark" />
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100dvh' }}>
          {children}
        </div>
      </body>
    </html>
  )
}
