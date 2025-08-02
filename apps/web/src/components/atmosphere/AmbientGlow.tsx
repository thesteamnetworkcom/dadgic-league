// src/components/atmosphere/AmbientGlow.tsx
import { useEffect, useState } from 'react'

interface AmbientGlowProps {
  intensity?: 'low' | 'medium' | 'high'
  color?: 'green' | 'amber' | 'blue' | 'red'
  pulse?: boolean
  className?: string
}

export function AmbientGlow({ 
  intensity = 'low',
  color = 'green',
  pulse = false,
  className = '' 
}: AmbientGlowProps) {
  const [pulsePhase, setPulsePhase] = useState(0)

  useEffect(() => {
    if (pulse) {
      const interval = setInterval(() => {
        setPulsePhase(prev => (prev + 0.1) % (Math.PI * 2))
      }, 100)
      return () => clearInterval(interval)
    }
  }, [pulse])

  const getColorConfig = () => {
    switch (color) {
      case 'green': return { color: '0, 255, 65', shadowColor: 'rgba(0, 255, 65, 0.2)' }
      case 'amber': return { color: '255, 183, 77', shadowColor: 'rgba(255, 183, 77, 0.2)' }
      case 'blue': return { color: '59, 130, 246', shadowColor: 'rgba(59, 130, 246, 0.2)' }
      case 'red': return { color: '255, 87, 34', shadowColor: 'rgba(255, 87, 34, 0.2)' }
      default: return { color: '0, 255, 65', shadowColor: 'rgba(0, 255, 65, 0.2)' }
    }
  }

  const getIntensityValue = () => {
    const base = {
      low: 0.05,
      medium: 0.1,
      high: 0.2
    }[intensity]

    if (pulse) {
      return base + (Math.sin(pulsePhase) * base * 0.5)
    }
    return base
  }

  const colorConfig = getColorConfig()
  const intensityValue = getIntensityValue()

  return (
    <>
      {/* Radial glow spots */}
      <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
        {/* Corner glows */}
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, rgba(${colorConfig.color}, ${intensityValue}) 0%, transparent 70%)`,
            transform: 'translate(-50%, -50%)'
          }}
        />
        
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, rgba(${colorConfig.color}, ${intensityValue * 0.7}) 0%, transparent 70%)`,
            transform: 'translate(50%, -50%)'
          }}
        />
        
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, rgba(${colorConfig.color}, ${intensityValue * 0.6}) 0%, transparent 70%)`,
            transform: 'translate(-50%, 50%)'
          }}
        />
        
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, rgba(${colorConfig.color}, ${intensityValue * 0.8}) 0%, transparent 70%)`,
            transform: 'translate(50%, 50%)'
          }}
        />

        {/* Center ambient glow */}
        <div
          className="absolute top-1/2 left-1/2 w-[800px] h-[600px] rounded-full blur-3xl"
          style={{
            background: `radial-gradient(ellipse, rgba(${colorConfig.color}, ${intensityValue * 0.3}) 0%, transparent 80%)`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>
    </>
  )
}