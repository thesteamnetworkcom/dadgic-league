// src/components/landing/LandingHeader.tsx
interface LandingHeaderProps {
  className?: string
}

export function LandingHeader({ className = '' }: LandingHeaderProps) {
  return (
    <header className={`py-6 border-b border-orange-500/10 ${className}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-orange-400 tracking-tight">
              Dadgic
              <span className="ml-2 text-xl">⚡</span>
            </h1>
          </div>
          
          {/* Future navigation items can go here */}
          <nav className="hidden md:flex space-x-8">
            {/* Navigation placeholder */}
          </nav>
        </div>
      </div>
    </header>
  )
}