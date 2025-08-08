"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronUp, MessageSquare, ArrowLeft, Send, Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    <Badge className={`text-xs font-medium ${getStatusColor(status)}`}>
      {status.toUpperCase()}
    </Badge>
  )
}

interface ExpandedPostProps {
  post: Suggestion
}

export function ExpandedPost({ post }: ExpandedPostProps) {
  const { hasUserUpvoted, upvoteSuggestion, selectPost, suggestions, addComment } = useApp()
  const currentPost = suggestions.find(s => s.id === post.id) || post
  const isUpvoted = hasUserUpvoted(currentPost.id)
  const [commentContent, setCommentContent] = useState('')
  const [showImages, setShowImages] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (commentContent.trim()) {
      addComment(currentPost.id, commentContent.trim(), 'Anonymous')
      setCommentContent('')
    }
  }

  const handleImageClose = () => {
    setShowImages(false)
    setCurrentImageIndex(0)
  }

  const handleNextImage = () => {
    if (currentPost.images && currentPost.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % currentPost.images.length)
    }
  }

  const handlePrevImage = () => {
    if (currentPost.images && currentPost.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + currentPost.images.length) % currentPost.images.length)
    }
  }

  const hasImages = currentPost.images && currentPost.images.length > 0

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Back Button */}
      <motion.div 
        className="absolute left-0 top-0"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Button
          variant="ghost"
          onClick={() => selectPost(null)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to posts</span>
        </Button>
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="max-w-4xl mx-auto space-y-6 h-full overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Main Ticket Card */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
          <CardContent className="px-6 py-2">
            <div className="flex space-x-6">
              {/* Upvote Section */}
              <div className="flex flex-col items-center space-y-4">
                <button
                  onClick={() => upvoteSuggestion(currentPost.id)}
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
                    {currentPost.upvotes}
                  </span>
                </button>
              </div>

              {/* Content Section */}
              <div className="flex-1">
                <div className="mb-2">
                  <ProgressBadge status={currentPost.status} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {currentPost.title}
                </h1>
                
                {currentPost.description && (
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                      {currentPost.description}
                    </p>
                  </div>
                )}

                {/* Post Metadata */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span>Created {new Date(currentPost.createdAt).toLocaleDateString()}</span>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{currentPost.comments.length} comments</span>
                      </div>
                      {hasImages && (
                        <button
                          onClick={() => setShowImages(true)}
                          className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 underline"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span>View images</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <div className="mt-5 flex flex-col h-[calc(100vh-500px)]">
          
          {/* Comments List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 border-b border-gray-200 dark:border-gray-700">
            {currentPost.comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              </div>
            ) : (
              currentPost.comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3 py-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {comment.author.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {comment.author}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Comment Form - Pinned to viewport bottom */}
        <div className="fixed bottom-0 left-60 right-60 bg-transparent p-4 z-10">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleAddComment} className="flex items-center space-x-3">
              <Input
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 border-0 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                required
              />
              <Button 
                type="submit" 
                className="bg-gray-800 hover:bg-gray-900 text-white"
                disabled={!commentContent.trim()}
              >
                Comment
              </Button>
            </form>
          </div>
        </div>
      </motion.div>

      {/* Image Viewer Overlay */}
      <AnimatePresence>
        {showImages && hasImages && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Close Button */}
            <button
              onClick={handleImageClose}
              className="absolute top-4 right-4 z-40 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image Display */}
            <div className="relative w-full h-full flex items-center justify-center p-8">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={currentPost.images[currentImageIndex].url}
                  alt={currentPost.images[currentImageIndex].name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>

              {/* Navigation Arrows */}
              {currentPost.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {currentPost.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {currentPost.images.length}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 