"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Suggestion, ThemeColors, UserUpvotes, Comment, ImageAttachment, Logo } from '@/types'
import { ticketsApi, votesApi, uploadsApi, adminTicketsApi } from '@/lib/api'

interface AppContextType {
  suggestions: Suggestion[]
  adminTickets: Suggestion[] // Add separate state for admin tickets
  themeColors: ThemeColors
  userUpvotes: UserUpvotes
  selectedPost: Suggestion | null
  previousTab: string
  systemAdmins: AdminUser[]
  logo: Logo | null
  loading: boolean
  hasInitialized: boolean // Track if initial load has completed
  addSuggestion: (suggestion: Omit<Suggestion, 'id' | 'createdAt' | 'comments' | 'images'>, images?: ImageAttachment[]) => Promise<void>
  addComment: (suggestionId: string, content: string, author: string) => Promise<void>
  upvoteSuggestion: (id: string) => Promise<void> // Toggles upvote on/off
  updateSuggestionStatus: (id: string, status: Suggestion['status']) => Promise<void>
  toggleSuggestionVisibility: (id: string, hidden: boolean) => Promise<void>
  deleteSuggestion: (id: string) => Promise<void>
  updateThemeColors: (colors: Partial<ThemeColors>) => void
  updateLogo: (logo: Logo) => void
  hasUserUpvoted: (id: string) => boolean
  selectPost: (post: Suggestion | null, fromTab?: string) => void
  loadTickets: (filters?: any) => Promise<void>
  loadAdminTickets: () => Promise<void> // Add this function for admin view
  updateAdminTickets: (tickets: Suggestion[]) => void // Add this function for optimistic updates
  addSystemAdmin: (email: string) => Promise<void>
  removeSystemAdmin: (adminId: string) => Promise<void>
  checkIsSystemAdmin: (userEmail: string) => boolean
}

interface AdminUser {
  id: string
  name: string
  email: string
  avatar?: string
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const initialSuggestions: Suggestion[] = [
  {
    id: '1',
    title: 'Dark Mode Support',
    description: 'Add a dark mode option for better user experience in low-light environments.',
    upvotes: 15,
    status: 'In Progress',
    hidden: false,
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
    hidden: false,
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
    hidden: false,
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
  const [adminTickets, setAdminTickets] = useState<Suggestion[]>([]) // Add separate state for admin tickets
  const [themeColors, setThemeColors] = useState<ThemeColors>(defaultThemeColors)
  const [userUpvotes, setUserUpvotes] = useState<UserUpvotes>(defaultUserUpvotes)
  const [selectedPost, setSelectedPost] = useState<Suggestion | null>(null)
  const [previousTab, setPreviousTab] = useState<string>('posts')
  const [systemAdmins, setSystemAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState<boolean>(true) // Start with loading true to prevent flicker
  const [logo, setLogo] = useState<Logo | null>(null)
  const [hasInitialized, setHasInitialized] = useState<boolean>(false) // Track if we've completed initial load

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
          const parsedLogo = JSON.parse(savedLogo)
          // Check if the saved logo is the old black box SVG and replace it with null
          if (parsedLogo?.url === 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjI1IiBoZWlnaHQ9Ijc1IiB2aWV3Qm94PSIwIDAgMjI1IDc1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMjI1IiBoZWlnaHQ9Ijc1IiBmaWxsPSIjMDAwIi8+Cjwvc3ZnPgo=') {
            // Clear the old logo from localStorage and set to null
            localStorage.removeItem('logo')
            setLogo(null)
          } else {
            setLogo(parsedLogo)
          }
        } catch (error) {
          console.error('Failed to parse saved logo:', error)
        }
      }
    }
  }, [])

  // Load initial tickets
  useEffect(() => {
    console.log('AppContext: Starting initial ticket load')
    loadTickets()
    
    // Add a timeout fallback to ensure we don't get stuck in loading state
    const timeoutId = setTimeout(() => {
      console.log('AppContext: Timeout fallback - setting loading false and initialized true')
      setLoading(false)
      setHasInitialized(true)
    }, 10000) // 10 second timeout
    
    return () => clearTimeout(timeoutId)
  }, [])

  // Debug logging for state changes
  useEffect(() => {
    console.log('AppContext state change:', { loading, hasInitialized, suggestionsCount: suggestions.length })
  }, [loading, hasInitialized, suggestions.length])

  // Load system administrators from API
  useEffect(() => {
    loadSystemAdmins()
  }, [])

  const loadSystemAdmins = async () => {
    try {
      const response = await fetch('/api/admin/system-admins')
      if (response.ok) {
        const result = await response.json()
        setSystemAdmins(result.data || [])
      } else {
        console.error('Failed to load system admins:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading system admins:', error)
    }
  }

  const addSuggestion = async (suggestion: Omit<Suggestion, 'id' | 'createdAt' | 'comments' | 'images'>, images?: ImageAttachment[]) => {
    try {
      // Upload images first if any
      let imageUrl: string | undefined
      if (images && images.length > 0) {
        // Get the original file from the ImageAttachment
        // We need to store the actual File object, not just the URL
        const imageAttachment = images[0]
        
        // If we have the original file, use it directly
        if (imageAttachment.file) {
          const uploadResult = await uploadsApi.uploadImage(imageAttachment.file)
          if (uploadResult.error) {
            throw new Error(uploadResult.error)
          }
          imageUrl = uploadResult.data?.imageUrl
        } else {
          // Fallback: try to convert from blob URL (less reliable)
          try {
            const imageFile = await fetch(imageAttachment.url).then(r => r.blob())
            const file = new File([imageFile], imageAttachment.name, { type: imageAttachment.type })
            
            const uploadResult = await uploadsApi.uploadImage(file)
            if (uploadResult.error) {
              throw new Error(uploadResult.error)
            }
            imageUrl = uploadResult.data?.imageUrl
          } catch (uploadError) {
            console.error('Failed to upload image:', uploadError)
            throw new Error('Failed to upload image. Please try again.')
          }
        }
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
      throw error // Re-throw to let the component handle it
    }
  }

  const addComment = async (suggestionId: string, content: string, author: string) => {
    try {
      const result = await ticketsApi.createComment({
        ticketId: suggestionId,
        content
      })
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      if (result.data) {
        // Always use the backend author data to ensure consistency
        const commentWithAuthor = {
          ...result.data,
          author: result.data.author || 'Anonymous',
          createdAt: result.data.createdAt instanceof Date ? result.data.createdAt : new Date(result.data.createdAt)
        }
        
        // Add to local state
        setSuggestions(prev =>
          prev.map(suggestion =>
            suggestion.id === suggestionId
              ? { ...suggestion, comments: [...suggestion.comments, commentWithAuthor] }
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

  const updateSuggestionStatus = async (id: string, status: Suggestion['status']) => {
    try {
      // Optimistically update the UI first
      setSuggestions(prev =>
        prev.map(suggestion =>
          suggestion.id === id
            ? { ...suggestion, status }
            : suggestion
        )
      )

      // Call the API to persist the change
      const result = await ticketsApi.updateTicketStatus(id, status)
      
      if (result.error) {
        // If the API call failed, revert the optimistic update
        setSuggestions(prev =>
          prev.map(suggestion =>
            suggestion.id === id
              ? { ...suggestion, status: suggestion.status }
              : suggestion
          )
        )
        console.error('Failed to update ticket status:', result.error)
        throw new Error(result.error)
      }

      // Update with the actual data from the server
      if (result.data) {
        setSuggestions(prev =>
          prev.map(suggestion =>
            suggestion.id === id
              ? { ...suggestion, ...result.data }
              : suggestion
          )
        )
      }
    } catch (error) {
      console.error('Error updating suggestion status:', error)
      // The optimistic update will be reverted above if there's an error
    }
  }

  const toggleSuggestionVisibility = async (id: string, hidden: boolean) => {
    try {
      // Optimistically update the UI first
      setSuggestions(prev =>
        prev.map(suggestion =>
          suggestion.id === id
            ? { ...suggestion, hidden }
            : suggestion
        )
      )

      // Call the API to persist the change
      const result = await ticketsApi.toggleVisibility(id, hidden)
      
      if (result.error) {
        // If the API call failed, revert the optimistic update
        setSuggestions(prev =>
          prev.map(suggestion =>
            suggestion.id === id
              ? { ...suggestion, hidden: !hidden }
              : suggestion
          )
        )
        console.error('Failed to toggle ticket visibility:', result.error)
        throw new Error(result.error)
      }

      // Update with the actual data from the server
      if (result.data) {
        setSuggestions(prev =>
          prev.map(suggestion =>
            suggestion.id === id
              ? { ...suggestion, ...result.data }
              : suggestion
          )
        )
      }
    } catch (error) {
      console.error('Error toggling suggestion visibility:', error)
      // The optimistic update will be reverted above if there's an error
    }
  }

  const deleteSuggestion = async (id: string) => {
    try {
      // Optimistically remove from UI first
      setSuggestions(prev => prev.filter(suggestion => suggestion.id !== id))

      // Call the API to delete
      const result = await ticketsApi.deleteTicket(id)
      
      if (result.error) {
        // If the API call failed, revert the optimistic update
        await loadTickets()
        console.error('Failed to delete ticket:', result.error)
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error deleting suggestion:', error)
      // The optimistic update will be reverted above if there's an error
    }
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
    if (post) {
      // Find the full suggestion data from the suggestions array to ensure we have complete comment data
      let fullPost = suggestions.find(s => s.id === post.id) || post
      
      // Ensure the post has complete comment data
      if (fullPost.comments && Array.isArray(fullPost.comments)) {
        fullPost = {
          ...fullPost,
          comments: fullPost.comments.map(comment => ({
            ...comment,
            author: comment.author || 'Anonymous',
            createdAt: comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt)
          }))
        }
      }
      
      setSelectedPost(fullPost)
    } else {
      setSelectedPost(null)
    }
    if (fromTab) {
      setPreviousTab(fromTab)
    }
  }

  const loadTickets = useCallback(async (filters: any = {}) => {
    console.log('AppContext: loadTickets called with filters:', filters)
    try {
      setLoading(true)
      // Always filter out hidden tickets for regular users
      const result = await ticketsApi.getTickets({ ...filters, hidden: false })
      
      if (result.error) {
        // Don't throw error for unauthenticated users, just log it
        if (result.error.includes('Unauthorized') || result.error.includes('Forbidden')) {
          console.log('User not authenticated, skipping ticket load')
          return
        }
        throw new Error(result.error)
      }
      
      if (result.data && result.data.tickets && result.data.tickets.length > 0) {
        console.log('AppContext: Setting suggestions from API:', result.data.tickets.length)
        // Ensure all comments have proper author fields and dates
        const ticketsWithValidComments = result.data.tickets.map(ticket => ({
          ...ticket,
          comments: ticket.comments.map(comment => ({
            ...comment,
            author: comment.author || 'Anonymous',
            createdAt: comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt)
          }))
        }))
        
        setSuggestions(ticketsWithValidComments)
        
        // Sync user upvotes with backend
        await syncUserUpvotes(ticketsWithValidComments)
      } else {
        // If no tickets returned, set empty array
        console.log('No tickets returned from API, setting empty suggestions')
        setSuggestions([])
      }
    } catch (error) {
      console.error('Failed to load tickets:', error)
      // Set empty array if API fails
      console.log('API failed, setting empty suggestions')
      setSuggestions([])
    } finally {
      console.log('AppContext: loadTickets completed, setting loading false and initialized true')
      setLoading(false)
      setHasInitialized(true) // Mark that we've completed the initial load
    }
  }, [])

  const loadAdminTickets = useCallback(async () => {
    try {
      setLoading(true)
      // Use the dedicated admin API to load all tickets (both visible and hidden)
      const result = await adminTicketsApi.getAdminTickets({})
      
      if (result.error) {
        if (result.error.includes('Unauthorized') || result.error.includes('Forbidden')) {
          console.log('User not authenticated, skipping admin ticket load')
          return
        }
        throw new Error(result.error)
      }

      if (result.data && result.data.tickets && result.data.tickets.length > 0) {
        const ticketsWithValidComments = result.data.tickets.map(ticket => ({
          ...ticket,
          comments: ticket.comments.map(comment => ({
            ...comment,
            author: comment.author || 'Anonymous',
            createdAt: comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt)
          }))
        }))
        setAdminTickets(ticketsWithValidComments)
      } else {
        console.log('No tickets returned from admin API, keeping initial admin tickets')
      }
    } catch (error) {
      console.error('Failed to load admin tickets:', error)
      // Keep the initial admin tickets if API fails
      console.log('Admin API failed, keeping initial admin tickets')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateAdminTickets = (tickets: Suggestion[]) => {
    setAdminTickets(tickets)
  }

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

  const addSystemAdmin = async (email: string) => {
    try {
      const response = await fetch('/api/admin/system-admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add system administrator')
      }

      const result = await response.json()
      if (result.data) {
        setSystemAdmins(prev => [...prev, result.data])
      }
    } catch (error) {
      console.error('Failed to add system admin:', error)
      throw error
    }
  }

  const removeSystemAdmin = async (adminId: string) => {
    try {
      const response = await fetch(`/api/admin/system-admins/${adminId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove system administrator')
      }

      setSystemAdmins(prev => prev.filter(admin => admin.id !== adminId))
    } catch (error) {
      console.error('Failed to remove system admin:', error)
      throw error
    }
  }

  const checkIsSystemAdmin = (userEmail: string) => {
    return systemAdmins.some(admin => admin.email === userEmail)
  }

  return (
    <AppContext.Provider
      value={{
        suggestions,
        adminTickets, // Add adminTickets to the context value
        themeColors,
        userUpvotes,
        selectedPost,
        previousTab,
        systemAdmins,
        logo,
        loading,
        hasInitialized, // Add hasInitialized to the context value
        addSuggestion,
        addComment,
        upvoteSuggestion,
        updateSuggestionStatus,
        toggleSuggestionVisibility,
        deleteSuggestion,
        updateThemeColors,
        updateLogo,
        hasUserUpvoted,
        selectPost,
        loadTickets,
        loadAdminTickets,
        updateAdminTickets,
        addSystemAdmin,
        removeSystemAdmin,
        checkIsSystemAdmin
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