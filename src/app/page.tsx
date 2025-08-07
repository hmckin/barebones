"use client"

import React, { useState, useEffect } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { SuggestionsBoard } from '@/components/suggestions-board'
import { TrendingPosts, PostsHeader } from '@/components/trending-posts'
import { RoadmapView } from '@/components/roadmap-view'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/contexts/app-context'

export default function Home() {
  const { themeColors } = useApp()
  const [mounted, setMounted] = useState(false)
  const [sortBy, setSortBy] = useState('trending')
  const [activeTab, setActiveTab] = useState('roadmap')

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

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">barebones</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
            </div>
          </div>
          
          {/* Tabs below title */}
          <div className="mt-4 flex justify-start">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="flex w-auto bg-transparent p-0 space-x-1">
                <TabsTrigger 
                  value="requests" 
                  className="flex items-left bg-transparent data-[state=active]:text-primary hover:text-gray-900 dark:hover:text-gray-100 rounded-md px-3 py-2 transition-colors text-gray-400 dark:text-gray-500"
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
                  className="flex items-left bg-transparent data-[state=active]:text-primary hover:text-gray-900 dark:hover:text-gray-100 rounded-md px-3 py-2 transition-colors text-gray-400 dark:text-gray-500"
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
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Create Post Form */}
              <div className="lg:col-span-1">
                <SuggestionsBoard />
              </div>
              
              {/* Right Column - Trending Posts */}
              <div className="lg:col-span-2 space-y-6">
                <PostsHeader sortBy={sortBy} onSortChange={setSortBy} />
                <TrendingPosts sortBy={sortBy} showStatus={false} />
              </div>
            </div>
          </div>
        )}
        
        {/* Roadmap Tab */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            <RoadmapView />
          </div>
        )}
      </div>
    </div>
  )
}
