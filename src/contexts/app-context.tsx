"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Suggestion, ThemeColors, UserUpvotes } from '@/types'

interface AppContextType {
  suggestions: Suggestion[]
  themeColors: ThemeColors
  userUpvotes: UserUpvotes
  selectedPost: Suggestion | null
  addSuggestion: (suggestion: Omit<Suggestion, 'id' | 'createdAt'>) => void
  upvoteSuggestion: (id: string) => void // Toggles upvote on/off
  updateSuggestionStatus: (id: string, status: Suggestion['status']) => void
  updateThemeColors: (colors: Partial<ThemeColors>) => void
  hasUserUpvoted: (id: string) => boolean
  selectPost: (post: Suggestion | null) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const initialSuggestions: Suggestion[] = [
  {
    id: '1',
    title: 'Dark Mode Support',
    description: 'Add a dark mode option for better user experience in low-light environments.',
    upvotes: 15,
    status: 'In Progress',
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'Mobile App',
    description: 'Create a mobile application for iOS and Android platforms.',
    upvotes: 23,
    status: 'Queued',
    createdAt: new Date('2024-01-10')
  },
  {
    id: '3',
    title: 'Advanced Search',
    description: 'Implement advanced search functionality with filters and sorting options.',
    upvotes: 8,
    status: 'Completed',
    createdAt: new Date('2024-01-05')
  }
]

const defaultThemeColors: ThemeColors = {
  primary: '#3b82f6',
  secondary: '#8b5cf6'
}

const defaultUserUpvotes: UserUpvotes = {
  upvotedPosts: []
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions)
  const [themeColors, setThemeColors] = useState<ThemeColors>(defaultThemeColors)
  const [userUpvotes, setUserUpvotes] = useState<UserUpvotes>(defaultUserUpvotes)
  const [selectedPost, setSelectedPost] = useState<Suggestion | null>(null)

  // Load theme colors and user upvotes from localStorage on mount
  useEffect(() => {
    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      const savedColors = localStorage.getItem('themeColors')
      if (savedColors) {
        try {
          setThemeColors(JSON.parse(savedColors))
        } catch (error) {
          console.error('Failed to parse saved theme colors:', error)
        }
      }

      const savedUpvotes = localStorage.getItem('userUpvotes')
      if (savedUpvotes) {
        try {
          setUserUpvotes(JSON.parse(savedUpvotes))
        } catch (error) {
          console.error('Failed to parse saved user upvotes:', error)
        }
      }
    }
  }, [])

  const addSuggestion = (suggestion: Omit<Suggestion, 'id' | 'createdAt'>) => {
    const newSuggestion: Suggestion = {
      ...suggestion,
      id: Date.now().toString(),
      createdAt: new Date()
    }
    setSuggestions(prev => [newSuggestion, ...prev])
  }

  const hasUserUpvoted = (id: string): boolean => {
    return userUpvotes.upvotedPosts.includes(id)
  }

  const canUpvote = (id: string): boolean => {
    return !hasUserUpvoted(id)
  }

  const upvoteSuggestion = (id: string) => {
    const isUpvoted = hasUserUpvoted(id)
    
    if (isUpvoted) {
      // Remove upvote
      setSuggestions(prev =>
        prev.map(suggestion =>
          suggestion.id === id
            ? { ...suggestion, upvotes: Math.max(0, suggestion.upvotes - 1) }
            : suggestion
        )
      )

      // Update user upvotes
      const newUserUpvotes: UserUpvotes = {
        upvotedPosts: userUpvotes.upvotedPosts.filter(postId => postId !== id)
      }
      
      setUserUpvotes(newUserUpvotes)
      if (typeof window !== 'undefined') {
        localStorage.setItem('userUpvotes', JSON.stringify(newUserUpvotes))
      }
    } else {
      // Add upvote
      setSuggestions(prev =>
        prev.map(suggestion =>
          suggestion.id === id
            ? { ...suggestion, upvotes: suggestion.upvotes + 1 }
            : suggestion
        )
      )

      // Update user upvotes
      const newUserUpvotes: UserUpvotes = {
        upvotedPosts: [...userUpvotes.upvotedPosts, id]
      }
      
      setUserUpvotes(newUserUpvotes)
      if (typeof window !== 'undefined') {
        localStorage.setItem('userUpvotes', JSON.stringify(newUserUpvotes))
      }
    }
  }

  const updateSuggestionStatus = (id: string, status: Suggestion['status']) => {
    setSuggestions(prev =>
      prev.map(suggestion =>
        suggestion.id === id
          ? { ...suggestion, status }
          : suggestion
      )
    )
  }

  const updateThemeColors = (colors: Partial<ThemeColors>) => {
    const newColors = { ...themeColors, ...colors }
    setThemeColors(newColors)
    if (typeof window !== 'undefined') {
      localStorage.setItem('themeColors', JSON.stringify(newColors))
    }
  }

  const selectPost = (post: Suggestion | null) => {
    setSelectedPost(post)
  }

  return (
    <AppContext.Provider
      value={{
        suggestions,
        themeColors,
        userUpvotes,
        selectedPost,
        addSuggestion,
        upvoteSuggestion,
        updateSuggestionStatus,
        updateThemeColors,
        hasUserUpvoted,
        selectPost
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
} 