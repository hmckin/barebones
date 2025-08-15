import { Suggestion, Comment } from '@/types'

const API_BASE = '/api'

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  tickets: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateTicketData {
  title: string
  description?: string
  imageUrl?: string
}

export interface CreateCommentData {
  ticketId: string
  content: string
}

export interface VoteData {
  ticketId: string
}

export interface UploadResponse {
  success: boolean
  imageUrl: string
  filename: string
  size: number
  type: string
}

export interface TicketFilters {
  page?: number
  limit?: number
  status?: string
  search?: string
  authorId?: string
  hidden?: boolean
  sortBy?: 'createdAt' | 'upvotes' | 'trending'
  sortOrder?: 'asc' | 'desc'
}

// Generic API call helper
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
      ...options,
    })

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      
      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch {
        // If we can't parse the error response, use the status text
        if (response.statusText) {
          errorMessage = response.statusText
        }
      }
      
      // Return error instead of throwing for better error handling
      return { error: errorMessage }
    }

    const data = await response.json()
    return { data }
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Tickets API
export const ticketsApi = {
  // Get tickets with filtering, sorting, and pagination
  async getTickets(filters: TicketFilters = {}): Promise<ApiResponse<PaginatedResponse<Suggestion>>> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })
    
    return apiCall<PaginatedResponse<Suggestion>>(`/tickets?${params.toString()}`)
  },

  // Create a new ticket
  async createTicket(data: CreateTicketData): Promise<ApiResponse<Suggestion>> {
    return apiCall<Suggestion>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Get a single ticket by ID
  async getTicket(id: string): Promise<ApiResponse<Suggestion>> {
    return apiCall<Suggestion>(`/tickets/${id}`)
  },

  // Update ticket status
  async updateTicketStatus(id: string, status: string): Promise<ApiResponse<Suggestion>> {
    return apiCall<Suggestion>(`/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },

  // Toggle ticket visibility (show/hide) - for regular users
  async toggleVisibility(ticketId: string, hidden: boolean): Promise<ApiResponse<{ success: boolean; data: Suggestion; message: string }>> {
    return apiCall<{ success: boolean; data: Suggestion; message: string }>('/admin/tickets/visibility', {
      method: 'PATCH',
      body: JSON.stringify({ ticketId, hidden }),
    })
  },

  // Delete a ticket - for regular users
  async deleteTicket(ticketId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiCall<{ success: boolean; message: string }>(`/tickets/${ticketId}`, {
      method: 'DELETE',
    })
  },

  // Get comments for a ticket
  async getComments(ticketId: string): Promise<ApiResponse<Comment[]>> {
    return apiCall<Comment[]>(`/comments?ticketId=${ticketId}`)
  },

  // Create a new comment
  async createComment(data: CreateCommentData): Promise<ApiResponse<Comment>> {
    return apiCall<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// Admin Tickets API - dedicated endpoints for admin management
export const adminTicketsApi = {
  // Get all tickets for admin view (including hidden ones)
  async getAdminTickets(filters: TicketFilters = {}): Promise<ApiResponse<PaginatedResponse<Suggestion>>> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })
    
    return apiCall<PaginatedResponse<Suggestion>>(`/admin/tickets?${params.toString()}`)
  },

  // Toggle ticket visibility (show/hide) - for admins
  async toggleVisibility(ticketId: string, hidden: boolean): Promise<ApiResponse<{ success: boolean; data: Suggestion; message: string }>> {
    return apiCall<{ success: boolean; data: Suggestion; message: string }>('/admin/tickets/visibility', {
      method: 'PATCH',
      body: JSON.stringify({ ticketId, hidden }),
    })
  },

  // Delete a ticket - for admins
  async deleteTicket(ticketId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiCall<{ success: boolean; message: string }>('/admin/tickets/delete', {
      method: 'DELETE',
      body: JSON.stringify({ ticketId }),
    })
  },

  // Update ticket status - for admins
  async updateTicketStatus(id: string, status: string): Promise<ApiResponse<Suggestion>> {
    return apiCall<Suggestion>(`/admin/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }
}

// Votes API
export const votesApi = {
  // Toggle vote on a ticket
  async toggleVote(data: VoteData): Promise<ApiResponse<{ action: string; upvotes: number }>> {
    return apiCall<{ action: string; upvotes: number }>('/votes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// Theme API
export const themeApi = {
  // Save theme color (admin only)
  async saveThemeColor(color: { primary: string }): Promise<ApiResponse<{ success: boolean; message: string; data: { primary: string } }>> {
    return apiCall<{ success: boolean; message: string; data: { primary: string } }>('/admin/theme', {
      method: 'POST',
      body: JSON.stringify(color),
    })
  },

  // Get theme color (admin only)
  async getThemeColor(): Promise<ApiResponse<{ primary: string }>> {
    return apiCall<{ primary: string }>('/admin/theme')
  },

  // Get public theme color (no auth required)
  async getPublicThemeColor(): Promise<ApiResponse<{ primary: string }>> {
    return apiCall<{ primary: string }>('/theme')
  }
}

// Logo Settings API
export const logoSettingsApi = {
  // Update logo settings (like redirect URL)
  async updateLogoSettings(settings: { redirectUrl?: string }): Promise<ApiResponse<{ success: boolean; message: string; data: { redirectUrl?: string } }>> {
    return apiCall<{ success: boolean; message: string; data: { redirectUrl?: string } }>('/admin/logo/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    })
  }
}

// Uploads API
export const uploadsApi = {
  // Upload an image file
  async uploadImage(file: File): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE}/uploads`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('Upload failed:', error)
      return { error: error instanceof Error ? error.message : 'Upload failed' }
    }
  }
}

// User Profile API
export const userProfileApi = {
  // Get user's display name
  async getDisplayName(): Promise<ApiResponse<{ displayName: string | null }>> {
    return apiCall<{ displayName: string | null }>('/user/display-name')
  },

  // Update user's display name
  async updateDisplayName(displayName: string): Promise<ApiResponse<{ success: boolean; displayName: string }>> {
    return apiCall<{ success: boolean; displayName: string }>('/user/display-name', {
      method: 'PATCH',
      body: JSON.stringify({ displayName }),
    })
  }
} 