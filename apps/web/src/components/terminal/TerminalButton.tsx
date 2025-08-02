import { ReactNode, ButtonHTMLAttributes } from 'react'

interface TerminalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'discord' | 'terminal'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
}

export function TerminalButton({ 
  children, 
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  ...props 
}: TerminalButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-3
    font-semibold transition-all duration-200
    border focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-orange-500 to-orange-600
      hover:from-orange-600 hover:to-orange-700
      text-white border-orange-500
      focus:ring-orange-500
      transform hover:scale-105 shadow-lg
    `,
    secondary: `
      bg-transparent border-2 border-gray-600
      text-gray-300 hover:text-white hover:border-gray-400
      focus:ring-gray-500
    `,
    discord: `
      bg-discord-500 hover:bg-discord-600
      text-white border-discord-500
      focus:ring-discord-500
      transform hover:scale-105 shadow-lg
    `,
    terminal: `
      bg-transparent border border-terminal-green
      color: var(--terminal-green)
      font-family: var(--font-mono)
      hover:bg-terminal-green hover:color-black
      focus:ring-terminal-green
    `
  }

  // Convert CSS custom properties to Tailwind classes for terminal variant
  const terminalClasses = variant === 'terminal' 
    ? 'bg-transparent border border-green-400 text-green-400 font-mono hover:bg-green-400 hover:text-black focus:ring-green-400'
    : variantStyles[variant]

  const classes = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variant === 'terminal' ? terminalClasses : variantStyles[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ')

  return (
    <button className={classes} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  )
}