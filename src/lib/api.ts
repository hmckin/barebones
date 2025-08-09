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
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
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
  }
}

// Comments API
export const commentsApi = {
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