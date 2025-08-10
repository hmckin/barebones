"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronUp, MessageSquare, ChevronDown, Image as ImageIcon, Search, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/contexts/app-context'
import { useTickets } from '@/hooks/use-tickets'
import { getStatusColor } from '@/lib/utils'

const ProgressBadge = ({ status }: { status: string }) => {
  return (
    <Badge className={`text-xs font-medium mb-2 ${getStatusColor(status)}`}>
      {status.toUpperCase()}
    </Badge>
  )
}

interface RequestsViewProps {
  sortBy: string
  showStatus?: boolean
  searchQuery?: string
  onSortChange?: (sortBy: string) => void
  createPostFilter?: string
}

export function RequestsView({ sortBy, showStatus = true, searchQuery = '', onSortChange, createPostFilter = '' }: RequestsViewProps) {
  const { upvoteSuggestion, hasUserUpvoted, selectPost } = useApp()
  const { suggestions, loading, updateSorting, updateSearch, searchInput } = useTickets()
  const [searchBarInput, setSearchBarInput] = useState('')

  // Update sorting when props change
  React.useEffect(() => {
    if (sortBy === 'trending') {
      updateSorting('upvotes', 'desc')
    } else if (sortBy === 'newest') {
      updateSorting('createdAt', 'desc')
    } else if (sortBy === 'oldest') {
      updateSorting('createdAt', 'asc')
    }
  }, [sortBy, updateSorting])

  // Update search when prop changes (for external search triggers)
  React.useEffect(() => {
    if (searchQuery !== searchInput) {
      updateSearch(searchQuery)
    }
  }, [searchQuery, updateSearch, searchInput])

  const handleSearchChange = (query: string) => {
    setSearchBarInput(query)
    updateSearch(query)
  }

  const handleUpvote = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      await upvoteSuggestion(postId)
    } finally {
      // No specific cleanup needed for rapid clicking
    }
  }

  // Don't return early - always render the header and conditionally show content

  // Apply create post filtering locally without affecting the search bar
  let filteredSuggestions = suggestions
  if (createPostFilter) {
    const filterLower = createPostFilter.toLowerCase()
    filteredSuggestions = suggestions.filter(suggestion =>
      suggestion.title.toLowerCase().includes(filterLower) ||
      suggestion.description.toLowerCase().includes(filterLower)
    )
  }

  // Apply search bar filtering locally without affecting create post filtering
  if (searchBarInput) {
    const searchLower = searchBarInput.toLowerCase()
    filteredSuggestions = filteredSuggestions.filter(suggestion =>
      suggestion.title.toLowerCase().includes(searchLower) ||
      suggestion.description.toLowerCase().includes(searchLower)
    )
  }

  // Apply local sorting based on the current sortBy prop
  let sortedSuggestions = [...filteredSuggestions]
  if (sortBy === 'trending' || sortBy === 'upvotes') {
    sortedSuggestions.sort((a, b) => b.upvotes - a.upvotes)
  } else if (sortBy === 'newest') {
    sortedSuggestions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (sortBy === 'oldest') {
    sortedSuggestions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  } else if (sortBy === 'alphabetical') {
    sortedSuggestions.sort((a, b) => a.title.localeCompare(b.title))
  } else if (sortBy === 'reverse-alphabetical') {
    sortedSuggestions.sort((a, b) => b.title.localeCompare(a.title))
  }

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header - Not Scrollable */}
      <div className="flex-shrink-0 mb-6">
        <RequestsHeader 
          sortBy={sortBy} 
          searchValue={searchBarInput}
          onSortChange={(newSortBy) => {
            if (newSortBy === 'trending') {
              updateSorting('upvotes', 'desc')
            } else if (newSortBy === 'newest') {
              updateSorting('createdAt', 'desc')
            } else if (newSortBy === 'oldest') {
              updateSorting('createdAt', 'asc')
            } else if (newSortBy === 'alphabetical') {
              // For alphabetical sorting, we'll fetch fresh data and sort locally
              // Use 'createdAt' as the base sort to get fresh data
              updateSorting('createdAt', 'desc')
            } else if (newSortBy === 'reverse-alphabetical') {
              // For reverse alphabetical sorting, we'll fetch fresh data and sort locally
              // Use 'createdAt' as the base sort to get fresh data
              updateSorting('createdAt', 'desc')
            }
            // Call the parent callback if provided
            onSortChange?.(newSortBy)
          }}
          onSearchChange={handleSearchChange}
        />
      </div>
      
      {/* Scrollable Posts List */}
      <div className="flex-1 overflow-y-auto space-y-0 px-2 py-0.5 pr-6">
        {loading ? (
          // Show loading skeletons when loading
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-transparent border-0 shadow-none">
                <CardContent className="px-5">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Show actual posts when not loading
          <>
            {sortedSuggestions.map((suggestion, index) => {
              const isUpvoted = hasUserUpvoted(suggestion.id)
              
              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.05,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ 
                    scale: 0.98,
                    transition: { duration: 0.1 }
                  }}
                >
                  <Card 
                    className="bg-transparent hover:bg-white dark:hover:bg-gray-800 border-0 hover:border hover:border-gray-200 dark:hover:border-gray-700 shadow-none transition-colors outline-none cursor-pointer"
                    onClick={() => selectPost(suggestion, 'requests')}
                  >
                    <CardContent className="px-5">
                      <div className="flex space-x-4">
                        {/* Upvote Section */}
                        <div className="flex flex-col items-center space-y-1">
                          <button
                            onClick={(e) => handleUpvote(suggestion.id, e)}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors ${
                              isUpvoted
                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
                            }`}
                            title={
                              isUpvoted
                                ? 'Click to remove upvote'
                                : 'Click to upvote this post'
                            }
                          >
                            <ChevronUp className={`w-4 h-4 ${isUpvoted ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                            <span className={`text-xs font-medium leading-none ${
                              isUpvoted
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {suggestion.upvotes}
                            </span>
                          </button>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {suggestion.title}
                          </h3>
                          {showStatus && <ProgressBadge status={suggestion.status} />}
                          {suggestion.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                              {suggestion.description}
                            </p>
                          )}
                        </div>

                        {/* Comments and Attachments Section */}
                        <div className="flex items-center space-x-3 text-gray-500">
                          {/* Comments */}
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm">{suggestion.comments.length}</span>
                          </div>
                          
                          {/* Attachments */}
                          {suggestion.images.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <ImageIcon className="w-4 h-4" />
                              <span className="text-sm">{suggestion.images.length}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}

            {sortedSuggestions.length === 0 && (
              <Card className="bg-transparent shadow-none transition-colors outline-none">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchBarInput.trim() 
                      ? `No posts found matching "${searchBarInput}"`
                      : createPostFilter.trim()
                      ? `No posts found matching "${createPostFilter}"`
                      : "Be the first to create a post!"
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface RequestsHeaderProps {
  sortBy: string
  searchValue: string
  onSortChange: (sortBy: string) => void
  onSearchChange: (query: string) => void
}

export function RequestsHeader({ sortBy, searchValue, onSortChange, onSearchChange }: RequestsHeaderProps) {
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  
  const getSortLabel = () => {
    switch (sortBy) {
      case 'trending':
        return 'Trending'
      case 'newest':
        return 'Newest'
      case 'oldest':
        return 'Oldest'
      case 'alphabetical':
        return 'A→Z'
      case 'reverse-alphabetical':
        return 'Z→A'
      default:
        return 'Trending'
    }
  }

  const handleSearchChange = (query: string) => {
    onSearchChange(query)
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-0.5">
        <span className="text-xl font-semibold">Showing</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto text-xl font-semibold focus-visible:ring-0 focus-visible:border-transparent hover:bg-transparent hover:text-primary">
              {getSortLabel()}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-0">
            <DropdownMenuItem onClick={() => onSortChange('trending')} className="cursor-pointer">
              Trending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('newest')} className="cursor-pointer">
              Newest
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('oldest')} className="cursor-pointer">
              Oldest
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('alphabetical')} className="cursor-pointer">
              A→Z
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('reverse-alphabetical')} className="cursor-pointer">
              Z→A
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-xl font-semibold">posts</span>
      </div>
      <div className="flex items-center space-x-2">
        {/* Search Icon and Input */}
        <div className="relative">
          <div 
            className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            onMouseEnter={() => setIsSearchVisible(true)}
            onMouseLeave={() => {
              if (!searchValue) {
                setIsSearchVisible(false)
              }
            }}
          >
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          
          {/* Search Input - Only visible on hover or when there's a query */}
          <AnimatePresence>
            {(isSearchVisible || searchValue) && (
              <motion.div 
                className="absolute right-0 top-0 z-10"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0, scaleX: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                style={{ transformOrigin: "right" }}
                onMouseEnter={() => setIsSearchVisible(true)}
                onMouseLeave={() => {
                  if (!searchValue) {
                    setIsSearchVisible(false)
                  }
                }}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search posts..."
                    value={searchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 pr-8 w-64 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-600"
                    autoFocus
                  />
                  {searchValue && (
                    <button
                      onClick={() => {
                        handleSearchChange('')
                        setIsSearchVisible(false)
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
} 