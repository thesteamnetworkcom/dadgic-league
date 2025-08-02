// src/components/terminal/TerminalLoading.tsx
interface TerminalLoadingProps {
  message?: string
  className?: string
}

export function TerminalLoading({ 
  message = "Loading...", 
  className = "" 
}: TerminalLoadingProps) {
  return (
    <div className={`min-h-screen bg-terminal-bg flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-terminal-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-terminal-green font-mono text-sm">{message}</p>
      </div>
    </div>
  )
}