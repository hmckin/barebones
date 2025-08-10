"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Suggestion, ThemeColors, UserUpvotes, Comment, ImageAttachment, Logo } from '@/types'
import { ticketsApi, commentsApi, votesApi, uploadsApi } from '@/lib/api'

interface AppContextType {
  suggestions: Suggestion[]
  themeColors: ThemeColors
  userUpvotes: UserUpvotes
  selectedPost: Suggestion | null
  previousTab: string
  isSystemAdmin: boolean
  logo: Logo | null
  loading: boolean
  addSuggestion: (suggestion: Omit<Suggestion, 'id' | 'createdAt' | 'comments' | 'images'>, images?: ImageAttachment[]) => Promise<void>
  addComment: (suggestionId: string, content: string, author: string) => Promise<void>
  upvoteSuggestion: (id: string) => Promise<void> // Toggles upvote on/off
  updateSuggestionStatus: (id: string, status: Suggestion['status']) => void
  updateThemeColors: (colors: Partial<ThemeColors>) => void
  updateLogo: (logo: Logo) => void
  hasUserUpvoted: (id: string) => boolean
  selectPost: (post: Suggestion | null, fromTab?: string) => void
  loadTickets: (filters?: any) => Promise<void>
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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [themeColors, setThemeColors] = useState<ThemeColors>(defaultThemeColors)
  const [userUpvotes, setUserUpvotes] = useState<UserUpvotes>(defaultUserUpvotes)
  const [selectedPost, setSelectedPost] = useState<Suggestion | null>(null)
  const [previousTab, setPreviousTab] = useState<string>('posts')
  const [isSystemAdmin] = useState<boolean>(true) // Temporary FE flag, later replaced with BE role check
  const [loading, setLoading] = useState<boolean>(false)
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

  // Load initial tickets
  useEffect(() => {
    loadTickets()
  }, [])

  const addSuggestion = async (suggestion: Omit<Suggestion, 'id' | 'createdAt' | 'comments' | 'images'>, images?: ImageAttachment[]) => {
    try {
      // Upload images first if any
      let imageUrl: string | undefined
      if (images && images.length > 0) {
        // For now, we'll use the first image as the main image
        // In a real app, you might want to handle multiple images differently
        const imageFile = await fetch(images[0].url).then(r => r.blob())
        const file = new File([imageFile], images[0].name, { type: images[0].type })
        
        const uploadResult = await uploadsApi.uploadImage(file)
        if (uploadResult.error) {
          throw new Error(uploadResult.error)
        }
        imageUrl = uploadResult.data?.imageUrl
      }
      
      // Create ticket via API
      const result = await ticketsApi.createTicket({
        title: suggestion.title,
        description: suggestion.description,
        imageUrl
      })
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      if (result.data) {
        // Add to local state
        setSuggestions(prev => [result.data!, ...prev])
      }
    } catch (error) {
      console.error('Failed to create suggestion:', error)
      // You might want to show a toast notification here
    }
  }

  const addComment = async (suggestionId: string, content: string, author: string) => {
    try {
      const result = await commentsApi.createComment({
        ticketId: suggestionId,
        content
      })
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      if (result.data) {
        // Add to local state
        setSuggestions(prev =>
          prev.map(suggestion =>
            suggestion.id === suggestionId
              ? { ...suggestion, comments: [...suggestion.comments, result.data!] }
              : suggestion
          )
        )
      }
    } catch (error) {
      console.error('Failed to create comment:', error)
      // You might want to show a toast notification here
    }
  }

  const hasUserUpvoted = (id: string): boolean => {
    return userUpvotes.upvotedPosts.includes(id)
  }



  const upvoteSuggestion = async (id: string) => {
    try {
      // Prevent multiple rapid clicks
      const isUpvoted = hasUserUpvoted(id)
      
      // Optimistically update UI to prevent multiple clicks
      setSuggestions(prev =>
        prev.map(suggestion =>
          suggestion.id === id
            ? { 
                ...suggestion, 
                upvotes: isUpvoted 
                  ? Math.max(0, suggestion.upvotes - 1)
                  : suggestion.upvotes + 1
              }
            : suggestion
        )
      )

      // Optimistically update user upvotes
      const newUserUpvotes: UserUpvotes = {
        upvotedPosts: isUpvoted
          ? userUpvotes.upvotedPosts.filter(postId => postId !== id)
          : [...userUpvotes.upvotedPosts, id]
      }
      setUserUpvotes(newUserUpvotes)

      const result = await votesApi.toggleVote({ ticketId: id })
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      if (result.data) {
        // Update with actual backend response
        setSuggestions(prev =>
          prev.map(suggestion =>
            suggestion.id === id
              ? { ...suggestion, upvotes: result.data!.upvotes }
              : suggestion
          )
        )

        // Update user upvotes based on backend response
        const shouldBeUpvoted = result.data.action === 'added'
        const finalUserUpvotes: UserUpvotes = {
          upvotedPosts: shouldBeUpvoted
            ? [...userUpvotes.upvotedPosts, id]
            : userUpvotes.upvotedPosts.filter(postId => postId !== id)
        }
        
        setUserUpvotes(finalUserUpvotes)
        if (typeof window !== 'undefined') {
          localStorage.setItem('userUpvotes', JSON.stringify(finalUserUpvotes))
        }
      }
    } catch (error) {
      console.error('Failed to toggle vote:', error)
      
      // Revert optimistic updates on error
      setSuggestions(prev =>
        prev.map(suggestion =>
          suggestion.id === id
            ? { ...suggestion, upvotes: suggestion.upvotes }
            : suggestion
        )
      )
      
      // Revert user upvotes on error
      const revertedUserUpvotes: UserUpvotes = {
        upvotedPosts: userUpvotes.upvotedPosts
      }
      setUserUpvotes(revertedUserUpvotes)
      
      // You might want to show a toast notification here
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

  const loadTickets = useCallback(async (filters: any = {}) => {
    try {
      setLoading(true)
      const result = await ticketsApi.getTickets(filters)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      if (result.data) {
        setSuggestions(result.data.tickets)
        
        // Sync user upvotes with backend
        await syncUserUpvotes(result.data.tickets)
      }
    } catch (error) {
      console.error('Failed to load tickets:', error)
      // Fallback to initial suggestions if API fails
      setSuggestions(initialSuggestions)
    } finally {
      setLoading(false)
    }
  }, [])

  const syncUserUpvotes = async (tickets: Suggestion[]) => {
    try {
      // For each ticket, check if the current user has upvoted it
      // This would require a new API endpoint to get user's votes
      // For now, we'll rely on localStorage and the optimistic updates
      // In a production app, you'd want to fetch the user's actual vote status
    } catch (error) {
      console.error('Failed to sync user upvotes:', error)
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
        loading,
        addSuggestion,
        addComment,
        upvoteSuggestion,
        updateSuggestionStatus,
        updateThemeColors,
        updateLogo,
        hasUserUpvoted,
        selectPost,
        loadTickets
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