// src/components/terminal/TerminalDashboardLayout.tsx
import { ReactNode, useState } from 'react'
import { TerminalBackground } from './TerminalBackground'
import { TerminalHeader } from './TerminalHeader'
import { TerminalNavigation } from './TerminalNavigation'

interface TerminalDashboardLayoutProps {
  children: ReactNode
  className?: string
}

export function TerminalDashboardLayout({ children, className = '' }: TerminalDashboardLayoutProps) {
  const [activeNav, setActiveNav] = useState('dashboard')

  const navItems = [
    { id: 'dashboard', label: 'dashboard.exe' },
    { id: 'games', label: 'recent_games.log' },
    { id: 'insights', label: 'meta_analysis.dat' },
    { id: 'leagues', label: 'leagues.cfg', disabled: true },
    { id: 'settings', label: 'system.ini', disabled: true }
  ]

  return (
    <TerminalBackground variant="terminal" className={className}>
      <div className="min-h-screen flex flex-col font-mono">
        <TerminalHeader />
        <TerminalNavigation 
          items={navItems}
          activeItem={activeNav}
          onItemChange={setActiveNav}
        />
        
        <main className="flex-1 p-5 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </TerminalBackground>
  )
}