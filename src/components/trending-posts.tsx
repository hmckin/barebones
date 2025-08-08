"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronUp, MessageSquare, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useApp } from '@/contexts/app-context'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'In Progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'Completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'Queued':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

const ProgressBadge = ({ status }: { status: string }) => {
  return (
    <Badge className={`text-xs font-medium mb-2 ${getStatusColor(status)}`}>
      {status.toUpperCase()}
    </Badge>
  )
}

interface TrendingPostsProps {
  sortBy: string
  showStatus?: boolean
}

export function TrendingPosts({ sortBy, showStatus = true }: TrendingPostsProps) {
  const { suggestions, upvoteSuggestion, hasUserUpvoted, userUpvotes, selectPost } = useApp()

  const getSortedSuggestions = () => {
    const sorted = [...suggestions]
    
    switch (sortBy) {
      case 'trending':
        return sorted.sort((a, b) => b.upvotes - a.upvotes)
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title))
      case 'reverse-alphabetical':
        return sorted.sort((a, b) => b.title.localeCompare(a.title))
      default:
        return sorted
    }
  }

  const sortedSuggestions = getSortedSuggestions()

  return (
    <div className="space-y-4">
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
              onClick={() => selectPost(suggestion)}
            >
            <CardContent className="p-4">
              <div className="flex space-x-4">
                {/* Upvote Section */}
                <div className="flex flex-col items-center space-y-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      upvoteSuggestion(suggestion.id)
                    }}
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

                {/* Comments Section */}
                <div className="flex items-center space-x-1 text-gray-500">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">{suggestion.comments.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        )
      })}

      {suggestions.length === 0 && (
        <Card className="bg-transparent hover:bg-white dark:hover:bg-gray-800 border-0 hover:border hover:border-gray-200 dark:hover:border-gray-700 shadow-none transition-colors outline-none">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No suggestions yet. Be the first to create a post!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface PostsHeaderProps {
  sortBy: string
  onSortChange: (sortBy: string) => void
}

export function PostsHeader({ sortBy, onSortChange }: PostsHeaderProps) {
  
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

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-0.5">
        <span className="text-xl font-semibold">Showing</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 text-xl font-semibold">
              {getSortLabel()}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-0">
            <DropdownMenuItem onClick={() => onSortChange('trending')}>
              Trending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('newest')}>
              Newest
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('oldest')}>
              Oldest
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('alphabetical')}>
              A→Z
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('reverse-alphabetical')}>
              Z→A
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-xl font-semibold">posts</span>
      </div>
      <div className="flex items-center space-x-2">
        {/* Search Icon */}
        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  )
} 