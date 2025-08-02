// src/components/atmosphere/TerminalGrid.tsx
interface TerminalGridProps {
  variant?: 'subtle' | 'visible' | 'bright'
  size?: number
  className?: string
}

export function TerminalGrid({ 
  variant = 'subtle',
  size = 20,
  className = '' 
}: TerminalGridProps) {
  const getOpacity = () => {
    switch (variant) {
      case 'subtle': return '0.02'
      case 'visible': return '0.05'
      case 'bright': return '0.1'
      default: return '0.02'
    }
  }

  const gridStyle = {
    backgroundImage: `
      linear-gradient(rgba(0, 255, 65, ${getOpacity()}) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 255, 65, ${getOpacity()}) 1px, transparent 1px)
    `,
    backgroundSize: `${size}px ${size}px`
  }

  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={gridStyle}
    />
  )
}