import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useApp } from '@/contexts/app-context'
import { ticketsApi, TicketFilters, PaginatedResponse } from '@/lib/api'
import { Suggestion } from '@/types'

// Custom hook for debounced search
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useTickets() {
  const { suggestions, loading, loadTickets } = useApp()
  const [filters, setFilters] = useState<TicketFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [searchInput, setSearchInput] = useState('')
  
  // Debounce the search input to prevent excessive API calls
  const debouncedSearch = useDebounce(searchInput, 300)

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters(prev => ({ ...prev, search: debouncedSearch || undefined }))
    }
  }, [debouncedSearch, filters.search])

  // Load tickets when filters change
  useEffect(() => {
    // Skip the initial load since the app context already loads tickets
    const isInitialLoad = filters.page === 1 && 
                         filters.limit === 10 && 
                         filters.sortBy === 'createdAt' && 
                         filters.sortOrder === 'desc' &&
                         !filters.search &&
                         !filters.status
    
    if (!isInitialLoad) {
      loadTickets(filters)
    }
  }, [filters, loadTickets])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<TicketFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }))
  }, [])

  // Update pagination
  const updatePagination = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  // Update sorting
  const updateSorting = useCallback((sortBy: TicketFilters['sortBy'], sortOrder: TicketFilters['sortOrder'] = 'desc') => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder }))
  }, [])

  // Update search input (debounced)
  const updateSearch = useCallback((search: string) => {
    setSearchInput(search)
  }, [])

  // Update status filter
  const updateStatusFilter = useCallback((status: string | undefined) => {
    setFilters(prev => ({ ...prev, status: status || undefined }))
  }, [])

  // Get filtered and sorted suggestions
  const getFilteredSuggestions = useCallback(() => {
    let filtered = [...suggestions]

    // Apply search filter locally if needed
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(suggestion =>
        suggestion.title.toLowerCase().includes(searchLower) ||
        suggestion.description.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter locally if needed
    if (filters.status) {
      filtered = filtered.filter(suggestion => suggestion.status === filters.status)
    }

    // Apply sorting locally if needed
    if (filters.sortBy === 'upvotes') {
      filtered.sort((a, b) => {
        if (filters.sortOrder === 'asc') {
          return a.upvotes - b.upvotes
        }
        return b.upvotes - a.upvotes
      })
    } else if (filters.sortBy === 'createdAt') {
      filtered.sort((a, b) => {
        if (filters.sortOrder === 'asc') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }

    return filtered
  }, [suggestions, filters])

  // Get paginated suggestions
  const getPaginatedSuggestions = useCallback(() => {
    const filtered = getFilteredSuggestions()
    const page = filters.page || 1
    const limit = filters.limit || 10
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    
    return filtered.slice(startIndex, endIndex)
  }, [getFilteredSuggestions, filters.page, filters.limit])

  // Refresh tickets
  const refreshTickets = useCallback(() => {
    loadTickets(filters)
  }, [loadTickets, filters])

  return {
    // Data
    suggestions: getPaginatedSuggestions(),
    allSuggestions: suggestions,
    loading,
    
    // Filters and pagination
    filters,
    pagination,
    
    // Actions
    updateFilters,
    updatePagination,
    updateSorting,
    updateSearch,
    updateStatusFilter,
    refreshTickets,
    
    // Search state
    searchInput,
    
    // Computed values
    totalCount: getFilteredSuggestions().length,
    hasMore: (filters.page || 1) * (filters.limit || 10) < getFilteredSuggestions().length
  }
} 