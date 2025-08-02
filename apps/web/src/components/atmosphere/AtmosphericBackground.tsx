// src/components/atmosphere/AtmosphericBackground.tsx
import { ReactNode } from 'react'
import { TerminalGrid } from './TerminalGrid'
import { ScanningLines } from './ScanningLines'
import { FloatingParticles } from './FloatingParticles'
import { CornerElements } from './CornerElements'
import { AmbientGlow } from './AmbientGlow'
import { BackgroundVisualization } from './BackgroundVisualization'

interface AtmosphericBackgroundProps {
  children: ReactNode
  variant?: 'landing' | 'terminal' | 'minimal'
  intensity?: 'low' | 'medium' | 'high'
  className?: string
}

export function AtmosphericBackground({ 
  children, 
  variant = 'terminal',
  intensity = 'medium',
  className = '' 
}: AtmosphericBackgroundProps) {
  const getConfiguration = () => {
    switch (variant) {
      case 'landing':
        return {
          showGrid: true,
          showScanning: false,
          showParticles: true,
          showCorners: false,
          showGlow: true,
          showVisualization: false,
          gridVariant: 'subtle' as const,
          glowColor: 'amber' as const,
          particleCount: 15
        }
      case 'terminal':
        return {
          showGrid: true,
          showScanning: true,
          showParticles: true,
          showCorners: true,
          showGlow: true,
          showVisualization: true,
          gridVariant: 'visible' as const,
          glowColor: 'green' as const,
          particleCount: 25
        }
      case 'minimal':
        return {
          showGrid: true,
          showScanning: false,
          showParticles: false,
          showCorners: false,
          showGlow: false,
          showVisualization: false,
          gridVariant: 'subtle' as const,
          glowColor: 'green' as const,
          particleCount: 0
        }
      default:
        return {
          showGrid: true,
          showScanning: true,
          showParticles: true,
          showCorners: true,
          showGlow: true,
          showVisualization: true,
          gridVariant: 'visible' as const,
          glowColor: 'green' as const,
          particleCount: 25
        }
    }
  }

  const config = getConfiguration()
  const baseBackground = variant === 'landing' 
    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
    : 'bg-terminal-bg'

  return (
    <div className={`relative min-h-screen ${baseBackground} ${className}`}>
      {/* Background Layers (bottom to top) */}
      {config.showVisualization && (
        <BackgroundVisualization />
      )}
      
      {config.showGlow && (
        <AmbientGlow 
          color={config.glowColor} 
          intensity={intensity}
          pulse={variant === 'terminal'}
        />
      )}
      
      {config.showGrid && (
        <TerminalGrid variant={config.gridVariant} />
      )}
      
      {config.showParticles && config.particleCount > 0 && (
        <FloatingParticles 
          count={config.particleCount}
          speed={intensity === 'high' ? 1.5 : intensity === 'low' ? 0.5 : 1}
        />
      )}
      
      {config.showScanning && (
        <ScanningLines 
          frequency={intensity === 'high' ? 5 : intensity === 'low' ? 12 : 8}
        />
      )}
      
      {config.showCorners && (
        <CornerElements />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Accessibility: Disable animations for reduced motion */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )
}