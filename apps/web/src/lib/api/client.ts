import { APIResponse, APIError } from "@dadgic/database"


class APIClient {
  private baseURL: string

  constructor(baseURL: string = '') {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      const data: APIResponse<T> = await response.json()

      if (!response.ok) {
        const error = new Error(data.error || `HTTP ${response.status}`) as APIError
        error.status = response.status
        error.response = data
        throw error
      }

      return data
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Network error
        throw new Error('Network error - please check your connection')
      }
      throw error
    }
  }

  // GET request
  async get<T>(endpoint: string, accessToken?: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { 
        method: 'GET',
        headers:{
            Authorization: `Bearer ${accessToken}`
        }
    })
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// Create singleton instance
export const apiClient = new APIClient('/api')

// Error handling utilities
export const handleAPIError = (error: unknown): string => {
  if (error instanceof Error) {
    const apiError = error as APIError
    if (apiError.status === 401) {
      return 'Authentication required - please sign in'
    }
    if (apiError.status === 403) {
      return 'Permission denied - admin access required'
    }
    if (apiError.status === 400) {
      return apiError.message || 'Invalid request data'
    }
    if (apiError.status >= 500) {
      return 'Server error - please try again later'
    }
    return apiError.message
  }
  return 'An unexpected error occurred'
}