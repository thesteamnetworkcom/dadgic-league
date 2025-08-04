// apps/web/src/lib/api/services.ts
// Updated API services with automatic auth token inclusion

import { apiGet, apiPost, apiPut, apiDelete } from './client'
import type { 
  Pod, 
  Player, 
  PlayerStats, 
  PodInsight, 
  ParseRequest, 
  CreatePodRequest, 
  ParseResponse, 
  PodWithParticipants, 
  APIResponse
} from '@dadgic/database'

// ============================================================================
// POD SERVICE - Auto-auth enabled
// ============================================================================

export const podService = {
  async getRecent(limit: number = 10): Promise<APIResponse<Pod[]>> {
    return apiGet<Pod[]>(`/api/pods?limit=${limit}`)
  },

  async getById(id: string): Promise<APIResponse<Pod>> {
    return apiGet<Pod>(`/api/pods/${id}`)
  },

  async create(data: CreatePodRequest): Promise<APIResponse<Pod>> {
    return apiPost<Pod>('/api/pods', data)
  }
}

// ============================================================================
// PLAYER SERVICE - Auto-auth enabled
// ============================================================================

export const playerService = {
  async getAll(): Promise<APIResponse<Player[]>> {
    return apiGet<Player[]>('/api/players')
  },

  async getStats(playerId?: string): Promise<APIResponse<PlayerStats>> {
    const url = playerId 
      ? `/api/players/${playerId}/stats`
      : '/api/players/me/stats'
    return apiGet<PlayerStats>(url)
  },

  async search(query: string): Promise<APIResponse<Player[]>> {
    return apiGet<Player[]>(`/api/players?search=${encodeURIComponent(query)}`)
  },

  async create(data: any): Promise<APIResponse<Player>> {
    return apiPost<Player>('/api/players', data)
  }
}

// ============================================================================
// ANALYTICS SERVICE - Auto-auth enabled
// ============================================================================

export const analyticsService = {
  async getInsights(playerId?: string): Promise<APIResponse<PodInsight[]>> {
    const url = playerId 
      ? `/api/analytics/insights/${playerId}`
      : '/api/analytics/insights/me'
    return apiGet<PodInsight[]>(url)
  },

  async getDashboardStats(playerId?: string): Promise<APIResponse<{
    stats: PlayerStats
    recent_games: PodWithParticipants[]
    insights: PodInsight[]
  }>> {
    // ✅ SIMPLIFIED: No more manual token handling
    const url = playerId 
      ? `/api/analytics/dashboard/${playerId}`
      : '/api/analytics/dashboard/me'
    return apiGet(url)
  }
}

// ============================================================================
// AI SERVICE - No auth needed for parsing
// ============================================================================

export const aiService = {
  async parse(data: ParseRequest): Promise<APIResponse<ParseResponse>> {
    return apiPost<ParseResponse>('/api/ai/parse', data)
  }
}

// ============================================================================
// WHAT THIS FIXES:
//
// 1. ✅ All API calls now automatically include Authorization header
// 2. ✅ Tokens are pulled fresh from Supabase session each time
// 3. ✅ No more manual token passing in service calls
// 4. ✅ 401 responses automatically clear session cache
// 5. ✅ Consistent auth handling across all endpoints
//
// The auth middleware should now receive:
// Authorization: Bearer {fresh_supabase_access_token}
// ============================================================================