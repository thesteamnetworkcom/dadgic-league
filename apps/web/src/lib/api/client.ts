// apps/web/src/lib/api/client.ts
// Fixed API client that automatically includes auth tokens

import { clearSessionCache } from '../auth-session'
import { APIResponse, supabase } from '@dadgic/database'

/**
 * Enhanced fetch wrapper with automatic auth token inclusion
 */
export async function apiCall(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  try {
    // ✅ AUTO-INCLUDE AUTH TOKEN from Supabase session
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    }

    // ✅ Add Authorization header if we have a token
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
      console.log('🔒 Adding auth token to request:', url)
    } else {
      console.log('🔒 No auth token available for request:', url)
    }

    console.log('🌐 API call:', { url, method: options.method || 'GET', hasToken: !!accessToken })
    
    const response = await fetch(url, {
      ...options,
      headers,
    })

    // ✅ Handle 401 responses (token expired/invalid)
    if (response.status === 401) {
      console.log('🔒 401 detected - token expired, clearing session cache')
      clearSessionCache()
      return response
    }

    // ✅ Log other error responses for debugging
    if (!response.ok) {
      console.log('🌐 API error response:', { 
        url, 
        status: response.status, 
        statusText: response.statusText 
      })
    }

    return response

  } catch (error) {
    console.error('🌐 API call failed:', { url, error })
    throw error
  }
}

/**
 * JSON API wrapper with automatic auth and 401 handling
 */
export async function apiCallJSON<T>(
  url: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  try {
    const response = await apiCall(url, options)
    
    // Handle 401 specifically
    if (response.status === 401) {
      return {
        success: false,
        error: 'Authentication required - please sign in again',
        timestamp: new Date().toISOString()
      }
    }
    
    // Parse JSON response
    const data = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString()
      }
    }
    
    return data as APIResponse<T>
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Handle API errors consistently across the app
 */
export function handleAPIError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unexpected error occurred'
}

/**
 * GET request wrapper - automatically includes auth token
 */
export async function apiGet<T>(url: string): Promise<APIResponse<T>> {
  return apiCallJSON<T>(url, { method: 'GET' })
}

/**
 * POST request wrapper - automatically includes auth token
 */
export async function apiPost<T>(
  url: string, 
  data?: any
): Promise<APIResponse<T>> {
  return apiCallJSON<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PUT request wrapper - automatically includes auth token
 */
export async function apiPut<T>(
  url: string, 
  data?: any
): Promise<APIResponse<T>> {
  return apiCallJSON<T>(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE request wrapper - automatically includes auth token
 */
export async function apiDelete<T>(url: string): Promise<APIResponse<T>> {
  return apiCallJSON<T>(url, { method: 'DELETE' })
}