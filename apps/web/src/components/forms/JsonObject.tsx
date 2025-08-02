// src/components/forms/JsonObject.tsx
import { ReactNode } from 'react'

interface JsonObjectProps {
  children: ReactNode
  label?: string
  isArray?: boolean
  className?: string
  indent?: number
}

export function JsonObject({ 
  children, 
  label, 
  isArray = false, 
  className = '',
  indent = 0 
}: JsonObjectProps) {
  const indentStyle = { paddingLeft: `${indent * 20}px` }
  const contentIndentStyle = { paddingLeft: `${(indent + 1) * 20}px` }
  const openBracket = isArray ? '[' : '{'
  const closeBracket = isArray ? ']' : '}'

  return (
    <div className={`font-mono text-sm ${className}`}>
      {/* Opening line with label if provided */}
      <div style={indentStyle}>
        {label && (
          <>
            <span className="text-blue-300">"</span>
            <span className="text-blue-300">{label}</span>
            <span className="text-blue-300">"</span>
            <span className="text-gray-400">: </span>
          </>
        )}
        <span className="text-gray-400">{openBracket}</span>
      </div>
      
      {/* Content */}
      <div style={contentIndentStyle} className="space-y-1">
        {children}
      </div>
      
      {/* Closing bracket */}
      <div style={indentStyle}>
        <span className="text-gray-400">{closeBracket}</span>
      </div>
    </div>
  )
}