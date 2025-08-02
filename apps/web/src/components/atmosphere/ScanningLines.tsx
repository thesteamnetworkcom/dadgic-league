// src/components/atmosphere/ScanningLines.tsx
import { useEffect, useState } from 'react'

interface ScanningLinesProps {
  frequency?: number // seconds between scans
  duration?: number // duration of each scan
  className?: string
}

export function ScanningLines({ 
  frequency = 8,
  duration = 2,
  className = '' 
}: ScanningLinesProps) {
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsScanning(true)
      setTimeout(() => setIsScanning(false), duration * 1000)
    }, frequency * 1000)

    return () => clearInterval(interval)
  }, [frequency, duration])

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Horizontal scanning line */}
      {isScanning && (
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-terminal-green to-transparent opacity-30"
          style={{
            animation: `scanLine ${duration}s linear`,
            top: '0%'
          }}
        />
      )}
      
      {/* Vertical scanning line */}
      {isScanning && (
        <div
          className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-terminal-green to-transparent opacity-20"
          style={{
            animation: `scanVertical ${duration}s linear`,
            left: '0%'
          }}
        />
      )}
      
      <style jsx>{`
        @keyframes scanLine {
          0% { top: -2px; opacity: 0; }
          50% { opacity: 0.3; }
          100% { top: 100%; opacity: 0; }
        }
        
        @keyframes scanVertical {
          0% { left: -2px; opacity: 0; }
          50% { opacity: 0.2; }
          100% { left: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  )
}