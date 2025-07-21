// src/components/Navigation.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { TrophyIcon, StatsIcon, PlusIcon, UsersIcon } from '@/components/icons'

// Navigation icons
function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function DocumentAddIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function CogIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  adminOnly?: boolean
}

const navigation: NavigationItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: HomeIcon,
  },
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: StatsIcon,
  },
  {
    name: 'Report Game',
    href: '/report',
    icon: DocumentAddIcon,
  },
  {
    name: 'Create League',
    href: '/generateleague',
    icon: CogIcon,
    adminOnly: true,
  },
]

export default function Navigation() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Filter navigation items based on user role
  const visibleNavigation = navigation.filter(item => {
    if (item.adminOnly && user?.role !== 'admin') {
      return false
    }
    return true
  })

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  if (!user) {
    return null // Don't show navigation when not authenticated
  }

  return (
    <nav className="bg-neutral-800/80 backdrop-blur-sm border-b border-neutral-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <TrophyIcon className="h-8 w-8 text-accent-500" />
            <span className="text-xl font-bold text-white">Dadgic MTG</span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleNavigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${active 
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-700/50'
                    }
                  `}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {/* User avatar and info */}
            <div className="hidden sm:flex items-center space-x-3">
              {user.avatar_url && (
                <img 
                  src={user.avatar_url} 
                  alt={user.name || 'User Avatar'} 
                  className="w-8 h-8 rounded-full ring-2 ring-neutral-600"
                />
              )}
              <div className="text-sm">
                <div className="text-white font-medium">{user.name || user.discord_username}</div>
                {user.role === 'admin' && (
                  <div className="text-accent-400 text-xs font-medium">Admin</div>
                )}
              </div>
            </div>
            
            {/* Sign out button */}
            <button
              onClick={signOut}
              className="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Sign Out
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-700/50 transition-colors"
            >
              {mobileMenuOpen ? (
                <XIcon className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-800/95 backdrop-blur-sm border-b border-neutral-700">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {visibleNavigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
                    ${active 
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-700/50'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            
            {/* Mobile user info */}
            <div className="pt-4 mt-4 border-t border-neutral-600">
              <div className="flex items-center space-x-3 px-3 py-2">
                {user.avatar_url && (
                  <img 
                    src={user.avatar_url} 
                    alt={user.name || 'User Avatar'} 
                    className="w-8 h-8 rounded-full ring-2 ring-neutral-600"
                  />
                )}
                <div className="text-sm">
                  <div className="text-white font-medium">{user.name || user.discord_username}</div>
                  {user.role === 'admin' && (
                    <div className="text-accent-400 text-xs font-medium">Admin</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}