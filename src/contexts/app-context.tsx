"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Suggestion, ThemeColors } from '@/types'

interface AppContextType {
  suggestions: Suggestion[]
  themeColors: ThemeColors
  addSuggestion: (suggestion: Omit<Suggestion, 'id' | 'createdAt'>) => void
  upvoteSuggestion: (id: string) => void
  updateSuggestionStatus: (id: string, status: Suggestion['status']) => void
  updateThemeColors: (colors: Partial<ThemeColors>) => void
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions)
  const [themeColors, setThemeColors] = useState<ThemeColors>(defaultThemeColors)

  // Load theme colors from localStorage on mount
  useEffect(() => {
    const savedColors = localStorage.getItem('themeColors')
    if (savedColors) {
      try {
        setThemeColors(JSON.parse(savedColors))
      } catch (error) {
        console.error('Failed to parse saved theme colors:', error)
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

  const upvoteSuggestion = (id: string) => {
    setSuggestions(prev =>
      prev.map(suggestion =>
        suggestion.id === id
          ? { ...suggestion, upvotes: suggestion.upvotes + 1 }
          : suggestion
      )
    )
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
    localStorage.setItem('themeColors', JSON.stringify(newColors))
  }

  return (
    <AppContext.Provider
      value={{
        suggestions,
        themeColors,
        addSuggestion,
        upvoteSuggestion,
        updateSuggestionStatus,
        updateThemeColors
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