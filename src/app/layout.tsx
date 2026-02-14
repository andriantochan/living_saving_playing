import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Financial Tracker - Living, Playing, Saving',
  description: 'Track your expenses and savings efficiently.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
