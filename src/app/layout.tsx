import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '../components/ThemeProvider'

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
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
