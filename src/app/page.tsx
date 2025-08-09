"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeToggle } from '@/components/theme-toggle'
import { SuggestionsBoard } from '@/components/suggestions-board'
import { TrendingPosts, PostsHeader } from '@/components/trending-posts'
import { ExpandedPost } from '@/components/expanded-post'
import { RoadmapView } from '@/components/roadmap-view'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/contexts/app-context'

export default function Home() {
  const { themeColors, selectedPost, logo } = useApp()
  const [mounted, setMounted] = useState(false)
  const [sortBy, setSortBy] = useState('trending')
  const [activeTab, setActiveTab] = useState('requests')
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestionsSearchQuery, setSuggestionsSearchQuery] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Apply dynamic theme colors
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement
      root.style.setProperty('--custom-primary', themeColors.primary)
      root.style.setProperty('--custom-secondary', themeColors.secondary)
    }
  }, [themeColors, mounted])

  const handleLogoClick = () => {
    if (logo?.redirectUrl) {
      window.open(logo.redirectUrl, '_blank', 'noopener,noreferrer')
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className={`min-h-screen bg-background ${selectedPost ? 'h-screen overflow-hidden' : ''}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2 w-[225px] h-[75px] overflow-hidden">
                {logo?.url ? (
                  <button
                    onClick={handleLogoClick}
                    className={`flex items-center justify-center ${logo.redirectUrl ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                  >
                    <img 
                      src={logo.url} 
                      alt="Logo" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </button>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bone">
                    <path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"/>
                  </svg>
                )}
              </div>
              
              {/* Tabs underneath logo */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="flex w-auto bg-transparent p-0 space-x-1">
                  <TabsTrigger 
                    value="requests" 
                    className="flex items-left bg-transparent data-[state=active]:text-primary hover:text-gray-900 dark:hover:text-gray-100 rounded-md transition-colors text-gray-400 dark:text-gray-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lightbulb">
                      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
                      <path d="M9 18h6"/>
                      <path d="M10 22h4"/>
                    </svg>
                    <span>Feature Requests</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="roadmap" 
                    className="flex items-left bg-transparent data-[state=active]:text-primary hover:text-gray-900 dark:hover:text-gray-100 rounded-md transition-colors text-gray-400 dark:text-gray-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-kanban">
                      <rect width="18" height="18" x="3" y="3" rx="2"/>
                      <path d="M8 7v7"/>
                      <path d="M12 7v4"/>
                      <path d="M16 7v9"/>
                    </svg>
                    <span>Roadmap</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex items-end space-x-4 pt-10">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto py-8 h-[calc(100vh-120px)]">
        <AnimatePresence mode="wait">
          {/* Expanded Post View */}
          {selectedPost && (
            <motion.div
              key="expanded-post"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ExpandedPost post={selectedPost} />
            </motion.div>
          )}
          
          {/* Regular Layout */}
          {!selectedPost && (
            <motion.div
              key="regular-layout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full flex flex-col"
            >
              {/* Requests Tab */}
              {activeTab === 'requests' && (
                <div className="flex-1 flex flex-col h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
                    {/* Left Column - Create Post Form */}
                    <div className="lg:col-span-1">
                      <SuggestionsBoard 
                        onSearchChange={setSuggestionsSearchQuery}
                      />
                    </div>
                    
                    {/* Right Column - Trending Posts */}
                    <div className="lg:col-span-2 flex flex-col h-full min-h-0">
                      <PostsHeader 
                        sortBy={sortBy} 
                        onSortChange={setSortBy} 
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                      />
                      <div className="flex-1 overflow-y-auto pt-6 px-2 pr-6">
                        <TrendingPosts 
                          sortBy={sortBy} 
                          showStatus={false} 
                          searchQuery={`${searchQuery} ${suggestionsSearchQuery}`.trim()}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Roadmap Tab */}
              {activeTab === 'roadmap' && (
                <div className="space-y-6 flex-1 overflow-y-auto">
                  <RoadmapView />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
