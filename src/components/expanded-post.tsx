"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronUp, MessageSquare, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/contexts/app-context'
import { Suggestion } from '@/types'

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

interface ExpandedPostProps {
  post: Suggestion
}

export function ExpandedPost({ post }: ExpandedPostProps) {
  const { hasUserUpvoted, upvoteSuggestion, selectPost } = useApp()
  const isUpvoted = hasUserUpvoted(post.id)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Button
          variant="ghost"
          onClick={() => selectPost(null)}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to posts</span>
        </Button>
      </motion.div>

      {/* Expanded Post Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
        <CardContent className="p-8">
          <div className="flex space-x-6">
            {/* Upvote Section */}
            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={() => upvoteSuggestion(post.id)}
                className={`flex flex-col items-center justify-center w-16 h-16 rounded-full transition-colors ${
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
                <ChevronUp className={`w-6 h-6 ${isUpvoted ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                <span className={`text-lg font-bold ${
                  isUpvoted
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {post.upvotes}
                </span>
              </button>
            </div>

            {/* Content Section */}
            <div className="flex-1">
              <div className="mb-4">
                <ProgressBadge status={post.status} />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {post.title}
              </h1>
              
              {post.description && (
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                    {post.description}
                  </p>
                </div>
              )}

              {/* Post Metadata */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span>Created {new Date(post.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>0 comments</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  )
} 