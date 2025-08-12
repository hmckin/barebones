import { useState, useCallback, useMemo } from 'react'
import { useApp } from '@/contexts/app-context'
import { TicketFilters } from '@/lib/api'

export function useTickets() {
  const { suggestions, loading } = useApp()
  const [filters, setFilters] = useState<TicketFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [searchInput, setSearchInput] = useState('')

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

  // Update search input
  const updateSearch = useCallback((search: string) => {
    setSearchInput(search)
  }, [])

  // Update status filter
  const updateStatusFilter = useCallback((status: string | undefined) => {
    setFilters(prev => ({ ...prev, status: status || undefined }))
  }, [])

  // Get filtered and sorted suggestions - all done locally
  const filteredSuggestions = useMemo(() => {
    let filtered = [...suggestions]

    // Apply search filter locally
    if (searchInput) {
      const searchLower = searchInput.toLowerCase()
      filtered = filtered.filter(suggestion =>
        suggestion.title.toLowerCase().includes(searchLower) ||
        suggestion.description.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter locally
    if (filters.status) {
      filtered = filtered.filter(suggestion => suggestion.status === filters.status)
    }

    // Apply sorting locally
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
  }, [suggestions, searchInput, filters.status, filters.sortBy, filters.sortOrder])

  // Get paginated suggestions - temporarily disabled for development
  const paginatedSuggestions = useMemo(() => {
    // For now, return all suggestions without pagination
    // TODO: Re-enable pagination when implementing proper pagination UI
    return filteredSuggestions
  }, [filteredSuggestions])

  return {
    // Data
    suggestions: paginatedSuggestions,
    allSuggestions: suggestions,
    loading,
    
    // Filters
    filters,
    
    // Actions
    updateFilters,
    updatePagination,
    updateSorting,
    updateSearch,
    updateStatusFilter,
    
    // Search state
    searchInput,
    
    // Computed values
    totalCount: filteredSuggestions.length,
    hasMore: false // Temporarily disabled pagination
  }
} 