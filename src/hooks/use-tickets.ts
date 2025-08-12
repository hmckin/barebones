import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/contexts/app-context'
import { TicketFilters } from '@/lib/api'

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
  const { suggestions, loading, loadTickets, hasInitialized } = useApp()
  const [filters, setFilters] = useState<TicketFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [searchInput, setSearchInput] = useState('')
  const [hasSetInitialFilters, setHasSetInitialFilters] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasAppliedInitialSorting, setHasAppliedInitialSorting] = useState(false)
  
  // Debounce the search input to prevent excessive API calls
  const debouncedSearch = useDebounce(searchInput, 300)

  // Track when the context has fully initialized
  useEffect(() => {
    if (hasInitialized && !isInitialized) {
      console.log('useTickets: AppContext has initialized, marking hook as initialized')
      setIsInitialized(true)
    }
  }, [hasInitialized, isInitialized])

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters(prev => ({ ...prev, search: debouncedSearch || undefined }))
    }
  }, [debouncedSearch, filters.search])

  // Load tickets when filters change, but only after initialization and when filters actually change
  useEffect(() => {
    console.log('useTickets: Filters changed:', filters)
    
    // Don't make any API calls until the context has fully initialized
    if (!isInitialized) {
      console.log('useTickets: Skipping API call - hook not yet initialized')
      return
    }
    
    // Skip the initial load since the app context already loads tickets
    // Only make API calls when filters actually change from their initial values
    const isInitialFilterState = (filters.page === 1 || !filters.page) && 
                                (filters.limit === 10 || !filters.limit) && 
                                filters.sortBy === 'createdAt' && 
                                filters.sortOrder === 'desc' &&
                                !filters.search &&
                                !filters.status
    
    // Don't make API calls if we're still in initial filter state and haven't applied initial sorting
    if (isInitialFilterState && !hasAppliedInitialSorting) {
      console.log('useTickets: Skipping API call - initial filter state, initial sorting not yet applied')
      return
    }
    
    // Only make API calls when filters have actually changed from initial state
    // or when we have non-default filters
    const hasNonDefaultFilters = filters.search || 
                                filters.status || 
                                filters.sortBy !== 'createdAt' || 
                                filters.sortOrder !== 'desc' ||
                                (filters.page && filters.page > 1)
    
    if (hasNonDefaultFilters || (hasSetInitialFilters && hasAppliedInitialSorting)) {
      console.log('useTickets: Calling loadTickets with filters:', filters)
      loadTickets(filters)
    } else {
      console.log('useTickets: Skipping API call - using context data. hasNonDefaultFilters:', hasNonDefaultFilters, 'hasSetInitialFilters:', hasSetInitialFilters, 'hasAppliedInitialSorting:', hasAppliedInitialSorting)
    }
  }, [filters, loadTickets, isInitialized, hasSetInitialFilters, hasAppliedInitialSorting])

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
    console.log('useTickets: updateSorting called with:', { sortBy, sortOrder, hasSetInitialFilters, isInitialized, hasAppliedInitialSorting })
    
    // Don't update filters until the hook is initialized
    if (!isInitialized) {
      console.log('useTickets: Skipping sorting update - hook not yet initialized')
      return
    }
    
    // Check if this is just setting up the initial default sorting
    // These are the default sorts that don't require API calls
    const isInitialSorting = (sortBy === 'createdAt' && sortOrder === 'desc') || 
                            (sortBy === 'upvotes' && sortOrder === 'desc')
    
    if (isInitialSorting && !hasAppliedInitialSorting) {
      console.log('useTickets: Applying initial sorting, not marking as filter change')
      setHasAppliedInitialSorting(true)
      // Don't update filters for initial sorting setup
      return
    }
    
    // For any other sorting changes, update the filters
    setFilters(prev => ({ ...prev, sortBy, sortOrder }))
    
    // Mark that we've set initial filters after the first actual change
    if (!hasSetInitialFilters) {
      console.log('useTickets: Setting hasSetInitialFilters to true')
      setHasSetInitialFilters(true)
    }
  }, [hasSetInitialFilters, isInitialized, hasAppliedInitialSorting])

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
    if (isInitialized) {
      loadTickets(filters)
    }
  }, [loadTickets, filters, isInitialized])

  return {
    // Data
    suggestions: getPaginatedSuggestions(),
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
    refreshTickets,
    
    // Search state
    searchInput,
    
    // Computed values
    totalCount: getFilteredSuggestions().length,
    hasMore: ((filters.page || 1) * (filters.limit || 10)) < getFilteredSuggestions().length
  }
} 