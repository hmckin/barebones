"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronUp, MessageSquare, ImageIcon } from 'lucide-react'
import { useApp } from '@/contexts/app-context'
import { motion } from 'framer-motion'
import { getStatusColor } from '@/lib/utils'

const ProgressBadge = ({ status }: { status: string }) => {
  return (
    <Badge className={`text-xs font-medium mb-2 ${getStatusColor(status)}`}>
      {status.toUpperCase()}
    </Badge>
  )
}

export function RoadmapView() {
  const { suggestions, upvoteSuggestion, hasUserUpvoted, selectPost } = useApp()

  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.status]) {
      acc[suggestion.status] = []
    }
    acc[suggestion.status].push(suggestion)
    return acc
  }, {} as Record<string, typeof suggestions>)

  const columns = [
    { key: 'Queued', title: 'Queued', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
    { key: 'In Progress', title: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { key: 'Completed', title: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Roadmap</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8">
        {columns.map((column) => (
          <div key={column.key} className="space-y-4">
            <div className="text-center">
              <Badge className={`text-xs font-medium mb-2 ${getStatusColor(column.key)}`}>
                {column.title.toUpperCase()}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {groupedSuggestions[column.key]?.map((suggestion, index) => {
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
                                               onClick={() => selectPost(suggestion, 'roadmap')}
                    >
                      <CardContent className="px-5">
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
                            {suggestion.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                                {suggestion.description}
                              </p>
                            )}
                          </div>


                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
              
              {(!groupedSuggestions[column.key] || groupedSuggestions[column.key].length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  No {column.title.toLowerCase()} items
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 