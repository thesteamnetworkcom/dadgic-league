// src/components/forms/GameEditorPage.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { JsonEditor } from './JsonEditor'
import { TerminalSection } from '../terminal/TerminalSection'
import { InsightTerminal } from '../terminal/InsightTerminal'
import { useCreatePod, useAIParse } from '@/lib/api/hooks'
import { useToast } from '@/contexts/ToastContext'
import type { CreatePodRequest } from '@dadgic/database'

interface GameEditorPageProps {
  initialData?: any
  mode?: 'create' | 'edit'
  className?: string
}

export function GameEditorPage({ 
  initialData, 
  mode = 'create',
  className = '' 
}: GameEditorPageProps) {
  const [processingMessage, setProcessingMessage] = useState('')
  const { createPod, loading: saveLoading, error: saveError } = useCreatePod()
  const { parse, loading: aiLoading, error: aiError } = useAIParse()
  const { showToast } = useToast()
  const router = useRouter()

  const isProcessing = saveLoading || aiLoading

  const handleSaveGame = async (gameData: any) => {
    setProcessingMessage('Saving game data...')
    
    try {
      // Transform frontend data to API format
      const podData: CreatePodRequest = {
        date: gameData.timestamp,
        game_length_minutes: gameData.duration_minutes,
        turns: gameData.turns,
        notes: gameData.notes,
        participants: gameData.participants.map((player: any) => ({
          player_identifier: player.player_identifier, // Will be resolved by PlayerMatchingService
          commander_deck: player.commander_deck,
          result: player.result === 'W' ? 'win' : player.result === 'L' ? 'lose' : player.result
        }))
      }
      console.log(podData)
      const result = await createPod(podData)
      
      if (result) {
        // Clear stored data
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('parsedGameData')
        }
        
        // Show success toast
        showToast('Game saved successfully!', 'success')
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        showToast('Failed to save game. Please try again.', 'error')
      }
    } catch (error) {
      console.error('Error saving game:', error)
    } finally {
      setProcessingMessage('')
    }
  }

  const handleAiAssist = async (corrections: string) => {
    setProcessingMessage('Processing AI corrections...')
    
    try {
      const result = await parse({
        text: corrections,
        domain: 'pod'
      })
      
      if (result) {
        // TODO: Apply corrections to the form
        console.log('AI corrections result:', result)
        showToast('AI corrections applied successfully!', 'success')
        // For now, just log the result - would need to update form state
      } else {
        showToast('Failed to process AI corrections', 'error')
      }
    } catch (error) {
      console.error('Error processing AI corrections:', error)
    } finally {
      setProcessingMessage('')
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-terminal-amber font-mono">
          {mode === 'edit' ? 'Edit Game' : 'New Game Entry'}
        </h1>
        
        <div className="text-sm text-gray-500 font-mono">
          game_data.json
        </div>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <InsightTerminal title="PROCESSING" variant="info">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-terminal-green border-t-transparent rounded-full animate-spin" />
            <span>{processingMessage}</span>
          </div>
        </InsightTerminal>
      )}

      {/* Error Display */}
      {(saveError || aiError) && (
        <InsightTerminal title="ERROR" variant="warning">
          <div className="space-y-2">
            <div>Operation failed: {saveError || aiError}</div>
            <div className="text-xs text-gray-400">
              Check your data and try again, or contact support if the issue persists.
            </div>
          </div>
        </InsightTerminal>
      )}

      {/* JSON Editor */}
      <TerminalSection title="game_data_editor.json">
        <div className="space-y-4">
          <div className="text-xs text-gray-400 font-mono mb-4">
            Edit the JSON structure below. Fields marked with status indicators show parsing confidence.
          </div>
          
          <JsonEditor
            initialData={initialData}
            onSave={handleSaveGame}
            onAiAssist={handleAiAssist}
            isLoading={isProcessing}
          />
        </div>
      </TerminalSection>

      {/* Help Section */}
      <TerminalSection title="syntax_help.txt">
        <div className="text-xs text-gray-400 font-mono space-y-2">
          <div><span className="text-blue-400">auto-filled</span> - Data parsed from natural language</div>
          <div><span className="text-yellow-400">needs input</span> - Required field missing data</div>
          <div><span className="text-green-400">parsed</span> - Field successfully validated</div>
          <div><span className="text-red-400">error</span> - Invalid data format</div>
          <div className="mt-4 pt-2 border-t border-gray-600">
            <div className="text-terminal-amber">Player Resolution:</div>
            <div>• Names will be matched to existing players</div>
            <div>• New players will be created automatically</div>
            <div>• Discord usernames can be used if linked</div>
          </div>
        </div>
      </TerminalSection>
    </div>
  )
}