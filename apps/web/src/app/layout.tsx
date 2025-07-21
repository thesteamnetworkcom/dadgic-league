import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PageErrorBoundary, AsyncErrorBoundary } from '@/components/error-boundaries'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MTG Commander Tracker',
  description: 'Track your Magic: The Gathering Commander games and leagues',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-neutral-900 text-white`}>
        <AsyncErrorBoundary>
          <PageErrorBoundary pageName="MTG Tracker">
            <AuthProvider>
              {children}
            </AuthProvider>
          </PageErrorBoundary>
        </AsyncErrorBoundary>
      </body>
    </html>
  )
}
