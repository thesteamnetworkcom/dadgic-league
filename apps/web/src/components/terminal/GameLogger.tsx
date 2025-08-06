// src/components/terminal/GameLogger.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TerminalInput } from './TerminalInput'
import { TerminalButton } from './TerminalButton'
import { useAIParse } from '@/lib/api/hooks'
import { useToast } from '@/contexts/ToastContext'

interface GameLoggerProps {
  onParseComplete?: (parsedData: any) => void
  className?: string
}

export function GameLogger({ onParseComplete, className = '' }: GameLoggerProps) {
  const [input, setInput] = useState('')
  const { parse, loading, error } = useAIParse()
  const { showToast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !loading) {
      try {
        const result = await parse({
          text: input.trim(),
          domain: 'pod'
        })

        if (result) {
          // Store parsed data for the JSON editor
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('parsedGameData', JSON.stringify(result))
            sessionStorage.setItem('parsedGameData_immediate', JSON.stringify({
              data: result,
              timestamp: Date.now()
            }))
          }
          
          // Show success toast
          showToast('Game parsed successfully! Redirecting to editor...', 'success')
          
          // Call callback if provided
          if (onParseComplete) {
            onParseComplete(result)
          } else {
            // Default: redirect to JSON editor after brief delay
            router.push('/game-editor')
          }
          
          setInput('')
        } else {
          showToast('Failed to parse game description', 'error')
        }
      } catch (err) {
        console.error('Parse error:', err)
      }
    }
  }

  const examples = [
    "Beat Mike and Sarah with Korvold, took about 45 minutes",
    "Lost to Tom's Atraxa deck, game went 8 turns",
    "Won a 4-player pod with Rhystic Study value"
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-terminal-green font-mono text-sm mb-3">
        <span className="text-terminal-green">$</span> report_game
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-surface-primary border border-gray-600 min-h-20">
          <TerminalInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your game... (e.g., 'Beat Mike and Sarah with Korvold, took 45 minutes')"
            className="border-0 bg-transparent resize-none"
            disabled={loading}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500 font-mono">
            Natural language → AI parsing → Structured data
          </div>
          <TerminalButton
            type="submit"
            variant="terminal"
            size="sm"
            disabled={!input.trim() || loading}
          >
            {loading ? 'Processing...' : 'Parse & Log'}
          </TerminalButton>
        </div>
        
        {error && (
          <div className="text-terminal-red text-xs font-mono">
            Error: {error}
          </div>
        )}
      </form>

      {/* Example prompts */}
      <div className="text-xs text-gray-500 space-y-1">
        <div className="font-mono">Examples:</div>
        {examples.map((example, index) => (
          <div 
            key={index}
            className="cursor-pointer hover:text-gray-400 font-mono pl-2"
            onClick={() => setInput(example)}
          >
            • "{example}"
          </div>
        ))}
      </div>
    </div>
  )
}