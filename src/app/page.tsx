"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeToggle } from '@/components/theme-toggle'
import { CreatePost } from '@/components/create-post'
import { RequestsView } from '@/components/requests-view'
import { ExpandedPost } from '@/components/expanded-post'
import { RoadmapView } from '@/components/roadmap-view'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Lightbulb, SquareKanban} from 'lucide-react'
import { useApp } from '@/contexts/app-context'

export default function Home() {
  const { themeColors, selectedPost, logo, selectPost } = useApp()
  const [mounted, setMounted] = useState(false)
  const [sortBy, setSortBy] = useState('trending')
  const [activeTab, setActiveTab] = useState('requests')

  const [createPostSearchQuery, setCreatePostSearchQuery] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Apply dynamic theme color
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement
      root.style.setProperty('--custom-primary', themeColors.primary)
    }
  }, [themeColors, mounted])

  // Close expanded post when switching tabs
  useEffect(() => {
    if (selectedPost) {
      selectPost(null)
    }
  }, [activeTab])

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
        <div className="w-full pl-4 pr-10">
          <div className="flex items-start justify-between">
            {/* Left side - Logo and Tabs */}
            <div className="flex items-start space-x-4">
              <div className="flex items-center space-x-2 w-[150px] h-[75px] overflow-hidden">
                {logo?.url ? (
                  <button
                    onClick={handleLogoClick}
                    className={`flex items-center justify-center ${logo.redirectUrl ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                  >
                    <img 
                      src={logo.url} 
                      alt="Upload in settings" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </button>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Upload logo in settings
                  </span>
                )}
              </div>
              
              {/* Tabs */}
              <div className="pt-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                  <TabsList className="flex w-auto bg-transparent p-0 space-x-1">
                    <TabsTrigger 
                      value="requests" 
                      className="flex items-center bg-transparent data-[state=active]:text-primary hover:text-gray-900 dark:hover:text-gray-100 rounded-md transition-colors text-gray-400 dark:text-gray-500"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      <span>Feature Requests</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="roadmap" 
                      className="flex items-center bg-transparent data-[state=active]:text-primary hover:text-gray-900 dark:hover:text-gray-100 rounded-md transition-colors text-gray-400 dark:text-gray-500"
                    >
                      <SquareKanban className="w-4 h-4 mr-2" />
                      <span>Roadmap</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            
            {/* Right side - Combined Auth and Theme Controls */}
            <div className="pt-6 flex items-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 h-[calc(100vh-120px)]">
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
                      <CreatePost onSearchChange={setCreatePostSearchQuery} />
                    </div>
                    
                    {/* Right Column - Trending Posts */}
                    <div className="lg:col-span-2 flex flex-col h-full min-h-0">
                      <div className="flex-1 overflow-y-auto px-2 pr-6">
                        <RequestsView 
                          sortBy={sortBy} 
                          createPostFilter={createPostSearchQuery}
                          onSortChange={setSortBy}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Roadmap Tab */}
              {activeTab === 'roadmap' && (
                <div className="flex-1 h-full">
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
