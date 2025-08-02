// src/lib/api/services.ts
import { apiClient } from './client'
import {
  type Pod,
  type Player,
  type League,
  type CreatePodRequest,
  type CreatePlayerRequest,
  type CreateLeagueRequest,
  type ParseRequest,
  type ParseResponse,
  type PlayerStats,
  type PodInsight,
  type PodWithParticipants,
  supabase
} from '@dadgic/database'

// Game/Pod Services
export const podService = {
  async create(data: CreatePodRequest) {
    return apiClient.post<Pod>('/pod', data)
  },

  async getAll() {
    return apiClient.get<Pod[]>('/pods')
  },

  async getById(id: string) {
    return apiClient.get<Pod>(`/pods/${id}`)
  },

  async update(id: string, data: Partial<CreatePodRequest>) {
    return apiClient.put<Pod>(`/pods/${id}`, data)
  },

  async delete(id: string) {
    return apiClient.delete<Pod>(`/pods/${id}`)
  },

  async getRecent(limit: number = 10) {
    return apiClient.get<Pod[]>(`/pods/recent?limit=${limit}`)
  }
}

// Player Services
export const playerService = {
  async create(data: CreatePlayerRequest) {
    return apiClient.post<Player>('/players', data)
  },

  async getAll() {
    return apiClient.get<Player[]>('/players')
  },

  async getById(id: string) {
    return apiClient.get<Player>(`/players/${id}`)
  },

  async getStats(playerId?: string) {
    const endpoint = playerId ? `/players/${playerId}/stats` : '/players/me/stats'
    return apiClient.get<PlayerStats>(endpoint)
  },

  async search(query: string) {
    return apiClient.get<Player[]>(`/players/search?q=${encodeURIComponent(query)}`)
  }
}

// League Services
export const leagueService = {
  async create(data: CreateLeagueRequest) {
    return apiClient.post<League>('/leagues', data)
  },

  async getAll() {
    return apiClient.get<League[]>('/leagues')
  },

  async getById(id: string) {
    return apiClient.get<League>(`/leagues/${id}`)
  }
}

// AI Parsing Service
export const aiService = {
  async parse(data: ParseRequest) {
    return apiClient.post<ParseResponse>('/ai/parse', data)
  }
}

// Analytics/Insights Services
export const analyticsService = {
  async getInsights(playerId?: string) {
    const endpoint = playerId ? `/analytics/insights/${playerId}` : '/analytics/insights/me'
    return apiClient.get<PodInsight[]>(endpoint)
  },

  async getDashboardStats(playerId?: string) {
    const endpoint = playerId ? `/analytics/dashboard/${playerId}` : '/analytics/dashboard/me'
    // Get access token from Supabase session
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token
    return apiClient.get<{
      stats: PlayerStats
      recent_games: PodWithParticipants[]
      insights: PodInsight[]
    }>(endpoint, accessToken)
  }
}