// =====================================================
// packages/shared/src/pod-generation.ts
// Algorithm to generate balanced pod pairings for leagues
// =====================================================

/**
 * Generates balanced pod pairings for a league
 * @param playerIds Array of player UUIDs
 * @param gamesPerPlayer How many games each player should play
 * @returns Array of pod player groups (each group is 4 player UUIDs)
 */
export function generatePodPairings(
  playerIds: string[], 
  gamesPerPlayer: number
): string[][] {
  const playerCount = playerIds.length;
  const totalPlayerSlots = playerCount * gamesPerPlayer;
  const totalPods = Math.floor(totalPlayerSlots / 4);

  if (totalPlayerSlots % 4 !== 0) {
    throw new Error(
      `Cannot create balanced pods. ${playerCount} players × ${gamesPerPlayer} games = ${totalPlayerSlots} slots. ` +
      `Need a multiple of 4. Try adjusting games per player.`
    );
  }

  console.log(`Generating ${totalPods} pods for ${playerCount} players (${gamesPerPlayer} games each)`);

  // Track how many times each pair of players has played together
  const pairCounts = new Map<string, number>();
  
  // Track how many games each player has been assigned
  const playerGameCounts = new Map<string, number>();
  playerIds.forEach(id => playerGameCounts.set(id, 0));

  // Initialize pair tracking
  for (let i = 0; i < playerCount; i++) {
    for (let j = i + 1; j < playerCount; j++) {
      const pairKey = getPairKey(playerIds[i], playerIds[j]);
      pairCounts.set(pairKey, 0);
    }
  }

  const pods: string[][] = [];

  // Generate pods one by one
  for (let podIndex = 0; podIndex < totalPods; podIndex++) {
    const pod = generateSinglePod(playerIds, playerGameCounts, pairCounts, gamesPerPlayer);
    if (!pod) {
      throw new Error(`Failed to generate pod ${podIndex + 1}. Try different player count or games per player.`);
    }
    
    pods.push(pod);
    
    // Update counts
    updateCounts(pod, playerGameCounts, pairCounts);
    
    console.log(`Generated pod ${podIndex + 1}:`, pod.map(id => `Player${playerIds.indexOf(id) + 1}`));
  }

  // Verify the result
  const verification = verifyGeneration(playerIds, pods, gamesPerPlayer);
  if (!verification.isValid) {
    throw new Error(`Generation failed verification: ${verification.errors.join(', ')}`);
  }

  console.log('✅ Pod generation successful!');
  console.log('📊 Final statistics:');
  logFinalStats(playerIds, pods, pairCounts);

  return pods;
}

/**
 * Generate a single pod trying to minimize pair repetitions
 */
function generateSinglePod(
  allPlayers: string[],
  playerGameCounts: Map<string, number>,
  pairCounts: Map<string, number>,
  maxGamesPerPlayer: number
): string[] | null {
  // Get players who still need games
  const availablePlayers = allPlayers.filter(
    playerId => playerGameCounts.get(playerId)! < maxGamesPerPlayer
  );

  if (availablePlayers.length < 4) {
    return null; // Can't make a pod
  }

  // Try different combinations to find the best pod
  const maxAttempts = 1000;
  let bestPod: string[] | null = null;
  let bestScore = Infinity;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Randomly select 4 players
    const shuffled = [...availablePlayers].sort(() => Math.random() - 0.5);
    const candidatePod = shuffled.slice(0, 4);
    
    // Score this pod (lower is better)
    const score = scorePod(candidatePod, pairCounts);
    
    if (score < bestScore) {
      bestScore = score;
      bestPod = candidatePod;
    }
    
    // If we found a perfect pod (no repeated pairs), use it
    if (score === 0) {
      break;
    }
  }

  return bestPod;
}

/**
 * Score a pod based on how many repeated pairings it creates
 * Lower score is better (0 = no repeated pairs)
 */
function scorePod(pod: string[], pairCounts: Map<string, number>): number {
  let score = 0;
  
  for (let i = 0; i < pod.length; i++) {
    for (let j = i + 1; j < pod.length; j++) {
      const pairKey = getPairKey(pod[i], pod[j]);
      const currentCount = pairCounts.get(pairKey) || 0;
      
      // Heavily penalize repeated pairings
      score += currentCount * currentCount * 10;
    }
  }
  
  return score;
}

/**
 * Update tracking after creating a pod
 */
function updateCounts(
  pod: string[], 
  playerGameCounts: Map<string, number>, 
  pairCounts: Map<string, number>
): void {
  // Update player game counts
  pod.forEach(playerId => {
    const current = playerGameCounts.get(playerId) || 0;
    playerGameCounts.set(playerId, current + 1);
  });

  // Update pair counts
  for (let i = 0; i < pod.length; i++) {
    for (let j = i + 1; j < pod.length; j++) {
      const pairKey = getPairKey(pod[i], pod[j]);
      const current = pairCounts.get(pairKey) || 0;
      pairCounts.set(pairKey, current + 1);
    }
  }
}

/**
 * Create a consistent key for a pair of players
 */
function getPairKey(playerId1: string, playerId2: string): string {
  return playerId1 < playerId2 ? `${playerId1}-${playerId2}` : `${playerId2}-${playerId1}`;
}

/**
 * Verify the generated pods meet requirements
 */
function verifyGeneration(
  playerIds: string[], 
  pods: string[][], 
  expectedGamesPerPlayer: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check each player has correct number of games
  const playerGameCounts = new Map<string, number>();
  playerIds.forEach(id => playerGameCounts.set(id, 0));

  pods.forEach(pod => {
    pod.forEach(playerId => {
      const current = playerGameCounts.get(playerId) || 0;
      playerGameCounts.set(playerId, current + 1);
    });
  });

  playerIds.forEach(playerId => {
    const gameCount = playerGameCounts.get(playerId) || 0;
    if (gameCount !== expectedGamesPerPlayer) {
      errors.push(`Player ${playerId} has ${gameCount} games, expected ${expectedGamesPerPlayer}`);
    }
  });

  // Check each pod has exactly 4 players
  pods.forEach((pod, index) => {
    if (pod.length !== 4) {
      errors.push(`Pod ${index + 1} has ${pod.length} players, expected 4`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Log final statistics about the generation
 */
function logFinalStats(
  playerIds: string[], 
  pods: string[][], 
  pairCounts: Map<string, number>
): void {
  // Count pair frequency distribution
  const pairFrequencies = new Map<number, number>();
  pairCounts.forEach(count => {
    const current = pairFrequencies.get(count) || 0;
    pairFrequencies.set(count, current + 1);
  });

  console.log('Pair frequency distribution:');
  Array.from(pairFrequencies.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([frequency, count]) => {
      console.log(`  ${count} pairs played together ${frequency} times`);
    });

  const maxPairCount = Math.max(...pairCounts.values());
  const minPairCount = Math.min(...pairCounts.values());
  console.log(`📈 Pair balance: min=${minPairCount}, max=${maxPairCount}, range=${maxPairCount - minPairCount}`);
}

// =====================================================
// Helper function to test the algorithm
// =====================================================

/**
 * Test the algorithm with sample data
 */
export function testPodGeneration(): void {
  console.log('🧪 Testing pod generation algorithm...\n');

  const testCases = [
    { players: 8, games: 3 }, // 8 players × 3 games = 24 slots = 6 pods
    { players: 10, games: 6 }, // 10 players × 6 games = 60 slots = 15 pods  
    { players: 12, games: 4 }, // 12 players × 4 games = 48 slots = 12 pods
  ];

  testCases.forEach(({ players, games }, index) => {
    console.log(`\n--- Test Case ${index + 1}: ${players} players, ${games} games each ---`);
    
    try {
      const playerIds = Array.from({ length: players }, (_, i) => `player-${i + 1}`);
      const pods = generatePodPairings(playerIds, games);
      
      console.log(`✅ Success: Generated ${pods.length} pods`);
    } catch (error) {
      console.log(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}