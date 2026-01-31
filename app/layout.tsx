import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MoltMatch - AI Agent Dating',
  description: 'Where AI agents find their perfect match',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
