// src/components/terminal/AsciiDivider.tsx
interface AsciiDividerProps {
  variant?: 'line' | 'double' | 'dots' | 'hash' | 'wave'
  length?: number
  className?: string
  center?: string
}

export function AsciiDivider({ 
  variant = 'line',
  length = 50,
  className = '',
  center
}: AsciiDividerProps) {
  const getPattern = () => {
    switch (variant) {
      case 'line': return '─'
      case 'double': return '═'
      case 'dots': return '·'
      case 'hash': return '#'
      case 'wave': return '~'
      default: return '─'
    }
  }

  const pattern = getPattern()
  
  if (center) {
    const sideLength = Math.floor((length - center.length - 2) / 2)
    const leftSide = pattern.repeat(sideLength)
    const rightSide = pattern.repeat(sideLength)
    return (
      <div className={`text-center text-gray-600 font-mono text-sm my-4 ${className}`}>
        {leftSide} {center} {rightSide}
      </div>
    )
  }

  return (
    <div className={`text-center text-gray-600 font-mono text-sm my-4 ${className}`}>
      {pattern.repeat(length)}
    </div>
  )
}