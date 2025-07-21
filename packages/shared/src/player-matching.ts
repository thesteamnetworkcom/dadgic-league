// packages/shared/src/player-matching.ts
import { db } from '@dadgic/database'
import type { ParsedPlayer as AIParsedPlayer } from './ai-parser.js'

export interface PlayerMatchResult {
  matchedPlayers: Array<{
    id: string                     // ADDED: Include UUID
    name: string
    discord_username: string
    commander: string
    result: 'win' | 'lose' | 'draw'
  }>
  unmatchedPlayers: string[]
  suggestions: PlayerSuggestion[]
}

export interface PlayerSuggestion {
  input: string
  suggestions: Array<{
    name: string
    discord_username: string
    confidence: number
    reason: string
  }>
}

export async function findPlayerMatches(
  aiParsedPlayers: AIParsedPlayer[]
): Promise<PlayerMatchResult> {
  try {
    // Get all players from database using your actual method
    const allPlayers = await db.players.getAll()

    const matchedPlayers: PlayerMatchResult['matchedPlayers'] = []
    const unmatchedPlayers: string[] = []
    const suggestions: PlayerSuggestion[] = []

    for (const aiPlayer of aiParsedPlayers) {
      const matchResult = findBestPlayerMatch(aiPlayer.name, allPlayers)
      
      if (matchResult.match) {
        matchedPlayers.push({
          id: matchResult.match.id,        // ADDED: Include UUID from database
          name: matchResult.match.name,
          discord_username: matchResult.match.discord_username,
          commander: aiPlayer.commander,
          result: aiPlayer.result,
        })
      } else {
        unmatchedPlayers.push(aiPlayer.name)
        
        if (matchResult.suggestions.length > 0) {
          suggestions.push({
            input: aiPlayer.name,
            suggestions: matchResult.suggestions
          })
        }
      }
    }

    return { matchedPlayers, unmatchedPlayers, suggestions }
  } catch (error) {
    console.error('Error matching players:', error)
    throw error
  }
}

function findBestPlayerMatch(searchName: string, dbPlayers: any[]) {
  const searchLower = searchName.toLowerCase().trim()
  const suggestions: PlayerSuggestion['suggestions'] = []

  // 1. Exact discord_username match
  let match = dbPlayers.find(p => 
    p.discord_username?.toLowerCase().trim() === searchLower
  )
  if (match) return { match, suggestions: [] }

  // 2. Exact name match
  match = dbPlayers.find(p => 
    p.name?.toLowerCase().trim() === searchLower
  )
  if (match) return { match, suggestions: [] }

  // 3. Build suggestions for partial matches
  for (const player of dbPlayers) {
    const dbName = player.name?.toLowerCase().trim() || ''
    const dbUsername = player.discord_username?.toLowerCase().trim() || ''
    
    let confidence = 0
    let reason = ''

    // Partial matching
    if (dbName.includes(searchLower) || searchLower.includes(dbName)) {
      confidence = Math.max(confidence, 80)
      reason = `Name similarity: "${player.name}"`
    }
    
    if (dbUsername.includes(searchLower) || searchLower.includes(dbUsername)) {
      confidence = Math.max(confidence, 85)
      reason = `Username similarity: "${player.discord_username}"`
    }

    // Add to suggestions if confidence is good
    if (confidence >= 70) {
      suggestions.push({
        name: player.name,
        discord_username: player.discord_username,
        confidence,
        reason
      })
    }
  }

  // Sort suggestions by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence)
  
  // Auto-match if we have very high confidence
  const topSuggestion = suggestions[0]
  if (topSuggestion && topSuggestion.confidence >= 85) {
    const autoMatch = dbPlayers.find(p => 
      p.discord_username === topSuggestion.discord_username
    )
    return { match: autoMatch, suggestions: suggestions.slice(0, 3) }
  }

  return { match: null, suggestions: suggestions.slice(0, 3) }
}
