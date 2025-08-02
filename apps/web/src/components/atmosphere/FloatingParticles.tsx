// src/components/atmosphere/FloatingParticles.tsx
import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  direction: number
}

interface FloatingParticlesProps {
  count?: number
  speed?: number
  className?: string
}

export function FloatingParticles({ 
  count = 20,
  speed = 1,
  className = '' 
}: FloatingParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    // Initialize particles
    const initialParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      speed: (Math.random() * 0.5 + 0.3) * speed,
      opacity: Math.random() * 0.3 + 0.1,
      direction: Math.random() * Math.PI * 2
    }))
    
    setParticles(initialParticles)

    // Animation loop
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: (particle.x + Math.cos(particle.direction) * particle.speed + 100) % 100,
        y: (particle.y + Math.sin(particle.direction) * particle.speed + 100) % 100,
        opacity: Math.sin(Date.now() * 0.001 + particle.id) * 0.1 + 0.2
      })))
    }, 50)

    return () => clearInterval(interval)
  }, [count, speed])

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute bg-terminal-green rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            transition: 'opacity 0.5s ease'
          }}
        />
      ))}
    </div>
  )
}