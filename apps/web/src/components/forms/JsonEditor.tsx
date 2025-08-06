// src/components/forms/JsonEditor.tsx
import { useEffect, useState } from 'react'
import { JsonField } from './JsonField'
import { JsonObject } from './JsonObject'
import { TerminalButton } from '../terminal/TerminalButton'

interface Player {
  player_identifier: string
  commander_deck: string
  result: 'W' | 'L' | 'D'
}

interface GameData {
  participants: Player[]
  duration_minutes: number | null
  turns: number | null
  notes: string
  timestamp: string
}

interface JsonEditorProps {
  initialData?: Partial<GameData>
  onSave: (data: GameData) => void
  onAiAssist: (corrections: string) => void
  isLoading?: boolean
  className?: string
}

const createDefaultGameData = (initialData?: Partial<GameData>): GameData => ({
  participants: initialData?.participants || [
    { player_identifier: '', commander_deck: '', result: 'W' },
    { player_identifier: '', commander_deck: '', result: 'L' }
  ],
  duration_minutes: initialData?.duration_minutes || null,
  turns: initialData?.turns || null,
  notes: initialData?.notes || '',
  timestamp: initialData?.timestamp || new Date().toISOString()
})

export function JsonEditor({ 
  initialData, 
  onSave, 
  onAiAssist, 
  isLoading = false,
  className = '' 
}: JsonEditorProps) {
  const [gameData, setGameData] = useState(() => createDefaultGameData(initialData))
  const [corrections, setCorrections] = useState('')

  // Sync state when initialData changes
  useEffect(() => {
    if (initialData) {
      setGameData(createDefaultGameData(initialData))
    }
  }, [initialData])

  const updatePlayer = (index: number, field: keyof Player, value: string) => {
    const newPlayers = [...gameData.participants]
    newPlayers[index] = { ...newPlayers[index], [field]: value }
    setGameData({ ...gameData, participants: newPlayers })
  }

  const addPlayer = () => {
    setGameData({
      ...gameData,
      participants: [...gameData.participants, { player_identifier: '', commander_deck: '', result: 'L' }]
    })
  }

  const removePlayer = (index: number) => {
    if (gameData.participants.length > 2) {
      const newPlayers = gameData.participants.filter((_, i) => i !== index)
      setGameData({ ...gameData, participants: newPlayers })
    }
  }

  const getFieldStatus = (value: string | number | null, required = false) => {
    if (required && !value) return 'needs-input'
    return value ? 'parsed' : 'needs-input'
  }

  const isValid = () => {
    return gameData.participants.every(p => p.player_identifier && p.commander_deck) && 
           gameData.duration_minutes !== null
  }

  const handleCorrections = () => {
    onAiAssist(corrections)
    setCorrections('')
  }

  return (
    <div className={`bg-surface-primary border border-gray-600 p-6 font-mono text-sm ${className}`}>
      {/* JSON Structure */}
      <JsonObject indent={0}>
        {/* Players Array */}
        <JsonObject label="players" isArray indent={1}>
          {gameData.participants.map((player, index) => (
            <div key={index} className="space-y-1">
              <JsonObject indent={2}>
                <div style={{ paddingLeft: '60px' }}>
                  <JsonField
                    label="name"
                    value={player.player_identifier}
                    onChange={(value) => updatePlayer(index, 'player_identifier', value)}
                    status={getFieldStatus(player.player_identifier, true)}
                    placeholder="Player name"
                    required
                  />
                </div>
                <div style={{ paddingLeft: '60px' }}>
                  <JsonField
                    label="commander"
                    value={player.commander_deck}
                    onChange={(value) => updatePlayer(index, 'commander_deck', value)}
                    status={getFieldStatus(player.commander_deck, true)}
                    placeholder="Commander name"
                    required
                  />
                </div>
                <div style={{ paddingLeft: '60px' }}>
                  <JsonField
                    label="result"
                    value={player.result}
                    onChange={(value) => updatePlayer(index, 'result', value as 'W' | 'L' | 'D')}
                    status="auto-filled"
                    suffix={
                      <div className="flex items-center ml-2 space-x-1">
                        {(['W', 'L'] as const).map(result => (
                          <button
                            key={result}
                            onClick={() => updatePlayer(index, 'result', result)}
                            className={`px-2 py-1 text-xs rounded ${
                              player.result === result 
                                ? `bg-status-${result === 'W' ? 'win' : 'lose'} ${result === 'W' ? 'text-black' : 'text-white'}` 
                                : `text-status-${result === 'W' ? 'win' : 'lose'} hover:bg-status-${result === 'W' ? 'win' : 'lose'}/20`
                            }`}
                          >
                            {result}
                          </button>
                        ))}
                        {gameData.participants.length > 2 && (
                          <button
                            onClick={() => removePlayer(index)}
                            className="ml-2 text-red-400 hover:text-red-300 text-xs"
                          >
                            [remove]
                          </button>
                        )}
                      </div>
                    }
                  />
                </div>
              </JsonObject>
              {index < gameData.participants.length - 1 && (
                <div style={{ paddingLeft: '40px' }}>
                  <span className="text-gray-400">,</span>
                </div>
              )}
            </div>
          ))}
        </JsonObject>

        {/* Game Details */}
        <div style={{ paddingLeft: '20px' }}>
          <JsonField
            label="duration_minutes"
            value={gameData.duration_minutes?.toString() || ''}
            onChange={(value) => setGameData({ ...gameData, duration_minutes: parseInt(value) || null })}
            type="number"
            placeholder="45"
            status={getFieldStatus(gameData.duration_minutes, true)}
            required
            suffix={<span className="text-gray-400">,</span>}
          />
        </div>

        <div style={{ paddingLeft: '20px' }}>
          <JsonField
            label="turns"
            value={gameData.turns?.toString() || ''}
            onChange={(value) => setGameData({ ...gameData, turns: parseInt(value) || null })}
            type="number"
            placeholder="8"
            status="parsed"
            suffix={
              <div className="flex items-center">
                <span className="text-gray-500 text-xs ml-2">optional</span>
                <span className="text-gray-400">,</span>
              </div>
            }
          />
        </div>

        <div style={{ paddingLeft: '20px' }}>
          <JsonField
            label="notes"
            value={gameData.notes}
            onChange={(value) => setGameData({ ...gameData, notes: value })}
            placeholder="Additional notes..."
            status="parsed"
            suffix={<span className="text-gray-400">,</span>}
          />
        </div>

        <div style={{ paddingLeft: '20px' }}>
          <JsonField
            label="timestamp"
            value={gameData.timestamp}
            onChange={(value) => setGameData({ ...gameData, timestamp: value })}
            status="auto-filled"
            readonly
          />
        </div>
      </JsonObject>

      {/* Actions */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={addPlayer}
            className="text-terminal-green hover:text-terminal-amber text-xs font-mono"
          >
            [+ add player]
          </button>
          
          <div className="flex space-x-2">
            <TerminalButton
              variant="secondary"
              size="sm"
              onClick={() => onSave(gameData)}
              disabled={!isValid() || isLoading}
            >
              Save Game
            </TerminalButton>
          </div>
        </div>

        {/* AI Corrections */}
        <div className="border-t border-gray-600 pt-4">
          <div className="text-xs text-gray-400 mb-2 font-mono">AI Corrections:</div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={corrections}
              onChange={(e) => setCorrections(e.target.value)}
              placeholder="e.g., 'Sarah was playing Atraxa, not Kinnan'"
              className="flex-1 bg-surface-secondary border border-gray-600 px-3 py-2 text-terminal-green font-mono text-xs"
              disabled={isLoading}
            />
            <TerminalButton
              variant="terminal"
              size="sm"
              onClick={handleCorrections}
              disabled={!corrections.trim() || isLoading}
            >
              {isLoading ? 'Processing...' : 'Let AI Fix This'}
            </TerminalButton>
          </div>
        </div>
      </div>
    </div>
  )
}