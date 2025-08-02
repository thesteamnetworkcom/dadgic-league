// src/lib/api/hooks.ts
import { useState, useEffect } from 'react'
import { podService, playerService, aiService, analyticsService } from './services'
import { handleAPIError } from './client'
import type { Pod, Player, PlayerStats, PodInsight, ParseRequest, CreatePodRequest, ParseResponse, APIResponse, PodWithParticipants } from '@dadgic/database'

// Custom hook for API calls with loading/error states
function useAPI<T>(
  apiCall: () => Promise<APIResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiCall()
      
      if (response.success && response.data) {
        setData(response.data)
      } else {
        setError(response.error || 'Unknown error occurred')
      }
    } catch (err) {
      setError(handleAPIError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refetch()
  }, dependencies)

  return { data, loading, error, refetch }
}

// Game/Pod hooks
export function useRecentGames(limit: number = 10) {
  return useAPI<Pod[]>(() => podService.getRecent(limit), [limit])
}

export function usePod(id: string) {
  return useAPI<Pod>(() => podService.getById(id), [id])
}

// Player hooks
export function usePlayerStats(playerId?: string) {
  return useAPI<PlayerStats>(() => playerService.getStats(playerId), [playerId])
}

export function usePlayers() {
  return useAPI<Player[]>(() => playerService.getAll(), [])
}

// Analytics hooks
export function useInsights(playerId?: string) {
  return useAPI<PodInsight[]>(() => analyticsService.getInsights(playerId), [playerId])
}

export function useDashboardData(playerId?: string) {
  return useAPI<{
    stats: PlayerStats
    recent_games: PodWithParticipants[]
    insights: PodInsight[]
  }>(() => analyticsService.getDashboardStats(playerId), [playerId])
}

// Mutation hooks (for create/update operations)
export function useCreatePod() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPod = async (data: CreatePodRequest) => {
    try {
      setLoading(true)
      setError(null)
      const response = await podService.create(data)
      
      if (response.success) {
        return response.data
      } else {
        setError(response.error || 'Failed to create game')
        return null
      }
    } catch (err) {
      const errorMessage = handleAPIError(err)
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createPod, loading, error }
}

export function useAIParse() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parse = async (data: ParseRequest) => {
    try {
      setLoading(true)
      setError(null)
      const response = await aiService.parse(data)
      
      if (response.success) {
        return response.data
      } else {
        setError(response.error || 'Failed to parse input')
        return null
      }
    } catch (err) {
      const errorMessage = handleAPIError(err)
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { parse, loading, error }
}

// Player search hook
export function usePlayerSearch() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async (query: string) => {
    if (!query.trim()) return []

    try {
      setLoading(true)
      setError(null)
      const response = await playerService.search(query)
      
      if (response.success) {
        return response.data || []
      } else {
        setError(response.error || 'Search failed')
        return []
      }
    } catch (err) {
      const errorMessage = handleAPIError(err)
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }

  return { search, loading, error }
}