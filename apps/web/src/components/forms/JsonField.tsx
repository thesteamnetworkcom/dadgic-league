// src/components/forms/JsonField.tsx
import { ReactNode } from 'react'

interface JsonFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  status?: 'auto-filled' | 'needs-input' | 'parsed' | 'error'
  placeholder?: string
  required?: boolean
  readonly?: boolean
  type?: 'text' | 'number'
  className?: string
  suffix?: ReactNode
}

export function JsonField({ 
  label, 
  value, 
  onChange, 
  status = 'parsed',
  placeholder,
  required = false,
  readonly = false,
  type = 'text',
  className = '',
  suffix
}: JsonFieldProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'auto-filled': return 'border-blue-500 bg-blue-500/5'
      case 'needs-input': return 'border-yellow-500 bg-yellow-500/5'
      case 'parsed': return 'border-green-500 bg-green-500/5'
      case 'error': return 'border-red-500 bg-red-500/5'
      default: return 'border-gray-600'
    }
  }

  const getStatusIndicator = () => {
    switch (status) {
      case 'auto-filled': return <span className="text-blue-400 text-xs ml-2">auto-filled</span>
      case 'needs-input': return <span className="text-yellow-400 text-xs ml-2">needs input</span>
      case 'parsed': return <span className="text-green-400 text-xs ml-2">parsed</span>
      case 'error': return <span className="text-red-400 text-xs ml-2">error</span>
      default: return null
    }
  }

  return (
    <div className={`font-mono text-sm ${className}`}>
      <div className="flex items-center">
        <span className="text-blue-300 mr-1">"</span>
        <span className="text-blue-300">{label}</span>
        <span className="text-blue-300 mr-1">"</span>
        <span className="text-gray-400 mr-2">:</span>
        
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readonly}
          className={`
            bg-transparent border-0 outline-none text-terminal-green
            placeholder-gray-500 min-w-0 flex-1
            ${getStatusColor().includes('border-') ? 'px-1 border rounded' : ''}
            ${readonly ? 'cursor-default' : ''}
          `}
        />
        
        {getStatusIndicator()}
        {suffix}
        {required && !value && <span className="text-red-400 ml-1">*</span>}
      </div>
    </div>
  )
}