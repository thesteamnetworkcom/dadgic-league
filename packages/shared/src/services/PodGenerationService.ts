// ============================================================================
// Pod Generation Service - Scheduling & Pairing Algorithm
// ============================================================================

import { Player } from "@dadgic/database"

/**
 * Generates balanced pod pairings for a league
 * Algorithm tries to minimize repeated player pairings
 */
export function generatePodPairings(
  players: Player[], 
  gamesPerPlayer: number
): Player[][] {
  const playerCount = players.length
  const totalPlayerSlots = playerCount * gamesPerPlayer
  const totalPods = Math.floor(totalPlayerSlots / 4)

  if (totalPlayerSlots % 4 !== 0) {
    throw new Error(
      `Cannot create balanced pods. ${playerCount} players × ${gamesPerPlayer} games = ${totalPlayerSlots} slots. ` +
      `Need a multiple of 4. Try adjusting games per player.`
    )
  }

  console.log(`Generating ${totalPods} pods for ${playerCount} players (${gamesPerPlayer} games each)`)

  // Track how many times each pair of players has played together
  const pairCounts = new Map<string, number>()
  
  // Track how many games each player has been assigned
  const playerGameCounts = new Map<string, number>()
  players.forEach(player => playerGameCounts.set(player.id, 0))

  // Initialize pair tracking
  for (let i = 0; i < playerCount; i++) {
    for (let j = i + 1; j < playerCount; j++) {
      const pairKey = getPairKey(players[i].id, players[j].id)
      pairCounts.set(pairKey, 0)
    }
  }

  const pods: Player[][] = []

  // Generate pods one by one
  for (let podIndex = 0; podIndex < totalPods; podIndex++) {
    const pod = generateSinglePod(players, playerGameCounts, pairCounts, gamesPerPlayer)
    if (!pod) {
      throw new Error(`Failed to generate pod ${podIndex + 1}. Try different player count or games per player.`)
    }
    
    pods.push(pod)
    
    // Update counts
    updateCounts(pod, playerGameCounts, pairCounts)
    
    console.log(`Generated pod ${podIndex + 1}:`, pod.map(id => `Player${id}`))
  }

  // Verify the result
  const verification = verifyGeneration(players, pods, gamesPerPlayer)
  if (!verification.isValid) {
    throw new Error(`Generation failed verification: ${verification.errors.join(', ')}`)
  }

  console.log('✅ Pod generation successful!')
  logFinalStats(players, pods, pairCounts)

  return pods
}

/**
 * Generate a single pod trying to minimize pair repetitions
 */
function generateSinglePod(
  allPlayers: Player[],
  playerGameCounts: Map<string, number>,
  pairCounts: Map<string, number>,
  maxGamesPerPlayer: number
): Player[] | null {
  // Get players who still need games
  const availablePlayers = allPlayers.filter(
    player => playerGameCounts.get(player.id)! < maxGamesPerPlayer
  )

  if (availablePlayers.length < 4) {
    return null // Can't make a pod
  }

  // Try different combinations to find the best pod
  const maxAttempts = 1000
  let bestPod: Player[] | null = null
  let bestScore = Infinity

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Randomly select 4 players
    const shuffled = [...availablePlayers].sort(() => Math.random() - 0.5)
    const candidatePod = shuffled.slice(0, 4)
    
    // Score this pod (lower is better)
    const score = scorePod(candidatePod, pairCounts)
    
    if (score < bestScore) {
      bestScore = score
      bestPod = candidatePod
    }
    
    // If we found a perfect pod (no repeated pairs), use it
    if (score === 0) {
      break
    }
  }

  return bestPod
}

/**
 * Score a pod based on how many repeated pairings it creates
 * Lower score is better (0 = no repeated pairs)
 */
function scorePod(pod: Player[], pairCounts: Map<string, number>): number {
  let score = 0
  
  for (let i = 0; i < pod.length; i++) {
    for (let j = i + 1; j < pod.length; j++) {
      const pairKey = getPairKey(pod[i].id, pod[j].id)
      const currentCount = pairCounts.get(pairKey) || 0
      
      // Heavily penalize repeated pairings
      score += currentCount * currentCount * 10
    }
  }
  
  return score
}

/**
 * Update tracking after creating a pod
 */
function updateCounts(
  pod: Player[], 
  playerGameCounts: Map<string, number>, 
  pairCounts: Map<string, number>
): void {
  // Update player game counts
  pod.forEach(player => {
    const current = playerGameCounts.get(player.id) || 0
    playerGameCounts.set(player.id, current + 1)
  })

  // Update pair counts
  for (let i = 0; i < pod.length; i++) {
    for (let j = i + 1; j < pod.length; j++) {
      const pairKey = getPairKey(pod[i].id, pod[j].id)
      const current = pairCounts.get(pairKey) || 0
      pairCounts.set(pairKey, current + 1)
    }
  }
}

/**
 * Create a consistent key for a pair of players
 */
function getPairKey(playerId1: string, playerId2: string): string {
  return playerId1 < playerId2 ? `${playerId1}-${playerId2}` : `${playerId2}-${playerId1}`
}

/**
 * Verify the generated pods meet requirements
 */
function verifyGeneration(
  players: Player[], 
  pods: Player[][], 
  expectedGamesPerPlayer: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check each player has correct number of games
  const playerGameCounts = new Map<string, number>()
  players.forEach(player => playerGameCounts.set(player.id, 0))

  pods.forEach(pod => {
    pod.forEach(player => {
      const current = playerGameCounts.get(player.id) || 0
      playerGameCounts.set(player.id, current + 1)
    })
  })

  players.forEach(player => {
    const gameCount = playerGameCounts.get(player.id) || 0
    if (gameCount !== expectedGamesPerPlayer) {
      errors.push(`Player ${player.id} has ${gameCount} games, expected ${expectedGamesPerPlayer}`)
    }
  })

  // Check each pod has exactly 4 players
  pods.forEach((pod, index) => {
    if (pod.length !== 4) {
      errors.push(`Pod ${index + 1} has ${pod.length} players, expected 4`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Log final statistics about the generation
 */
function logFinalStats(
  players: Player[], 
  pods: Player[][], 
  pairCounts: Map<string, number>
): void {
  // Count pair frequency distribution
  const pairFrequencies = new Map<number, number>()
  pairCounts.forEach(count => {
    const current = pairFrequencies.get(count) || 0
    pairFrequencies.set(count, current + 1)
  })

  console.log('Pair frequency distribution:')
  Array.from(pairFrequencies.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([frequency, count]) => {
      console.log(`  ${count} pairs played together ${frequency} times`)
    })

  const maxPairCount = Math.max(...pairCounts.values())
  const minPairCount = Math.min(...pairCounts.values())
  console.log(`📈 Pair balance: min=${minPairCount}, max=${maxPairCount}, range=${maxPairCount - minPairCount}`)
}