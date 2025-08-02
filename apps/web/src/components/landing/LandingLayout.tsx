// src/components/landing/LandingLayout.tsx
import { ReactNode } from 'react'
import { TerminalBackground } from '../terminal/TerminalBackground'
import { LandingHeader } from './LandingHeader'

interface LandingLayoutProps {
  children: ReactNode
  className?: string
}

export function LandingLayout({ children, className = '' }: LandingLayoutProps) {
  return (
    <TerminalBackground variant="landing" className={className}>
      <div className="flex flex-col min-h-screen">
        <LandingHeader />
        <main className="flex-1">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="border-t border-gray-700 py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center text-gray-500">
              <p className="text-sm">
                &copy; 2024 Dadgic. Built for commanders who value their time.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </TerminalBackground>
  )
}