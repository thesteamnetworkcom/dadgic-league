// src/components/forms/JsonEditor.tsx
import { useState } from 'react'
import { JsonField } from './JsonField'
import { JsonObject } from './JsonObject'
import { TerminalButton } from '../terminal/TerminalButton'

interface Player {
  name: string
  commander: string
  result: 'W' | 'L' | 'D'
}

interface GameData {
  players: Player[]
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

export function JsonEditor({ 
  initialData, 
  onSave, 
  onAiAssist, 
  isLoading = false,
  className = '' 
}: JsonEditorProps) {
  const [gameData, setGameData] = useState<GameData>({
    players: initialData?.players || [
      { name: '', commander: '', result: 'W' },
      { name: '', commander: '', result: 'L' }
    ],
    duration_minutes: initialData?.duration_minutes || null,
    turns: initialData?.turns || null,
    notes: initialData?.notes || '',
    timestamp: initialData?.timestamp || new Date().toISOString()
  })

  const [corrections, setCorrections] = useState('')

  const updatePlayer = (index: number, field: keyof Player, value: string) => {
    const newPlayers = [...gameData.players]
    newPlayers[index] = { ...newPlayers[index], [field]: value }
    setGameData({ ...gameData, players: newPlayers })
  }

  const addPlayer = () => {
    setGameData({
      ...gameData,
      players: [...gameData.players, { name: '', commander: '', result: 'L' }]
    })
  }

  const removePlayer = (index: number) => {
    if (gameData.players.length > 2) {
      const newPlayers = gameData.players.filter((_, i) => i !== index)
      setGameData({ ...gameData, players: newPlayers })
    }
  }

  const getPlayerStatus = (player: Player) => {
    if (!player.name) return 'needs-input'
    if (!player.commander) return 'needs-input'
    return 'parsed'
  }

  const isValid = () => {
    return gameData.players.every(p => p.name && p.commander) && 
           gameData.duration_minutes !== null
  }

  return (
    <div className={`bg-surface-primary border border-gray-600 p-6 font-mono text-sm ${className}`}>
      {/* JSON Structure */}
      <JsonObject indent={0}>
        {/* Players Array */}
        <JsonObject label="players" isArray indent={1}>
          {gameData.players.map((player, index) => (
            <div key={index} className="space-y-1">
              <JsonObject indent={2}>
                <div style={{ paddingLeft: '60px' }}>
                  <JsonField
                    label="name"
                    value={player.name}
                    onChange={(value) => updatePlayer(index, 'name', value)}
                    status={player.name ? 'parsed' : 'needs-input'}
                    placeholder="Player name"
                    required
                  />
                </div>
                <div style={{ paddingLeft: '60px' }}>
                  <JsonField
                    label="commander"
                    value={player.commander}
                    onChange={(value) => updatePlayer(index, 'commander', value)}
                    status={player.commander ? 'parsed' : 'needs-input'}
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
                        <button
                          onClick={() => updatePlayer(index, 'result', 'W')}
                          className={`px-2 py-1 text-xs rounded ${
                            player.result === 'W' ? 'bg-status-win text-black' : 'text-status-win hover:bg-status-win/20'
                          }`}
                        >
                          W
                        </button>
                        <button
                          onClick={() => updatePlayer(index, 'result', 'L')}
                          className={`px-2 py-1 text-xs rounded ${
                            player.result === 'L' ? 'bg-status-lose text-white' : 'text-status-lose hover:bg-status-lose/20'
                          }`}
                        >
                          L
                        </button>
                        {gameData.players.length > 2 && (
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
              {index < gameData.players.length - 1 && (
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
            status={gameData.duration_minutes ? 'parsed' : 'needs-input'}
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
              onClick={() => {
                onAiAssist(corrections)
                setCorrections('')
              }}
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