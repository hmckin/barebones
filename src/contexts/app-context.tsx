"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Suggestion, ThemeColors, UserUpvotes, Comment, ImageAttachment, Logo } from '@/types'

interface AppContextType {
  suggestions: Suggestion[]
  themeColors: ThemeColors
  userUpvotes: UserUpvotes
  selectedPost: Suggestion | null
  previousTab: string | null
  isSystemAdmin: boolean
  logo: Logo | null
  addSuggestion: (suggestion: Omit<Suggestion, 'id' | 'createdAt' | 'comments' | 'images'>, images?: ImageAttachment[]) => void
  addComment: (suggestionId: string, content: string, author: string) => void
  upvoteSuggestion: (id: string) => void // Toggles upvote on/off
  updateSuggestionStatus: (id: string, status: Suggestion['status']) => void
  updateThemeColors: (colors: Partial<ThemeColors>) => void
  updateLogo: (logo: Logo) => void
  hasUserUpvoted: (id: string) => boolean
  selectPost: (post: Suggestion | null, fromTab?: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const initialSuggestions: Suggestion[] = [
  {
    id: '1',
    title: 'Dark Mode Support',
    description: 'Add a dark mode option for better user experience in low-light environments.',
    upvotes: 15,
    status: 'In Progress',
    createdAt: new Date('2024-01-15'),
    comments: [
      {
        id: '1',
        content: 'This would be really helpful for night-time usage!',
        author: 'User123',
        createdAt: new Date('2024-01-16')
      },
      {
        id: '2',
        content: 'I agree, especially for users who work late hours.',
        author: 'Developer456',
        createdAt: new Date('2024-01-17')
      }
    ],
    images: []
  },
  {
    id: '2',
    title: 'Mobile App',
    description: 'Create a mobile application for iOS and Android platforms.',
    upvotes: 23,
    status: 'Queued',
    createdAt: new Date('2024-01-10'),
    comments: [
      {
        id: '3',
        content: 'This would make the platform much more accessible!',
        author: 'MobileUser',
        createdAt: new Date('2024-01-12')
      }
    ],
    images: [
      {
        id: 'img1',
        name: 'mobile-mockup.png',
        url: '/public/next.svg', // Using existing public image as placeholder
        size: 1024 * 1024, // 1MB
        type: 'image/png',
        uploadedAt: new Date('2024-01-10')
      }
    ]
  },
  {
    id: '3',
    title: 'Advanced Search',
    description: 'Implement advanced search functionality with filters and sorting options.',
    upvotes: 8,
    status: 'Completed',
    createdAt: new Date('2024-01-05'),
    comments: [],
    images: [
      {
        id: 'img2',
        name: 'search-interface.png',
        url: '/public/vercel.svg', // Using existing public image as placeholder
        size: 512 * 1024, // 512KB
        type: 'image/png',
        uploadedAt: new Date('2024-01-05')
      },
      {
        id: 'img3',
        name: 'search-results.png',
        url: '/public/file.svg', // Using existing public image as placeholder
        size: 768 * 1024, // 768KB
        type: 'image/png',
        uploadedAt: new Date('2024-01-05')
      }
    ]
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
  const [previousTab, setPreviousTab] = useState<string | null>(null)
  const [isSystemAdmin] = useState<boolean>(true) // Temporary FE flag, later replaced with BE role check
  const [logo, setLogo] = useState<Logo | null>({
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjI1IiBoZWlnaHQ9Ijc1IiB2aWV3Qm94PSIwIDAgMjI1IDc1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMjI1IiBoZWlnaHQ9Ijc1IiBmaWxsPSIjMDAwIi8+Cjwvc3ZnPgo=',
    redirectUrl: undefined
  })

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

      const savedLogo = localStorage.getItem('logo')
      if (savedLogo) {
        try {
          setLogo(JSON.parse(savedLogo))
        } catch (error) {
          console.error('Failed to parse saved logo:', error)
        }
      }
    }
  }, [])

  const addSuggestion = (suggestion: Omit<Suggestion, 'id' | 'createdAt' | 'comments' | 'images'>, images?: ImageAttachment[]) => {
    const newSuggestion: Suggestion = {
      ...suggestion,
      id: Date.now().toString(),
      createdAt: new Date(),
      comments: [],
      images: images || []
    }
    setSuggestions(prev => [newSuggestion, ...prev])
  }

  const addComment = (suggestionId: string, content: string, author: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      content,
      author,
      createdAt: new Date()
    }
    
    setSuggestions(prev =>
      prev.map(suggestion =>
        suggestion.id === suggestionId
          ? { ...suggestion, comments: [...suggestion.comments, newComment] }
          : suggestion
      )
    )
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

  const updateLogo = (newLogo: Logo) => {
    setLogo(newLogo)
    if (typeof window !== 'undefined') {
      localStorage.setItem('logo', JSON.stringify(newLogo))
    }
  }

  const selectPost = (post: Suggestion | null, fromTab?: string) => {
    setSelectedPost(post)
    if (fromTab) {
      setPreviousTab(fromTab)
    }
  }

  return (
    <AppContext.Provider
      value={{
        suggestions,
        themeColors,
        userUpvotes,
        selectedPost,
        previousTab,
        isSystemAdmin,
        logo,
        addSuggestion,
        addComment,
        upvoteSuggestion,
        updateSuggestionStatus,
        updateThemeColors,
        updateLogo,
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