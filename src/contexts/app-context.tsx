"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Suggestion, ThemeColors, UserUpvotes, Comment, ImageAttachment, Logo } from '@/types'
import { ticketsApi, votesApi, uploadsApi, adminTicketsApi } from '@/lib/api'
import { storageUtils } from '@/lib/storage-utils'

interface AppContextType {
  suggestions: Suggestion[]
  adminTickets: Suggestion[]
  themeColors: ThemeColors
  userUpvotes: UserUpvotes
  selectedPost: Suggestion | null
  previousTab: string
  systemAdmins: AdminUser[]
  logo: Logo | null
  loading: boolean
  addSuggestion: (suggestion: Omit<Suggestion, 'id' | 'createdAt' | 'comments' | 'images'>, images?: ImageAttachment[]) => Promise<void>
  addComment: (suggestionId: string, content: string, author: string) => Promise<void>
  upvoteSuggestion: (id: string) => Promise<void>
  updateSuggestionStatus: (id: string, status: Suggestion['status']) => Promise<void>
  toggleSuggestionVisibility: (id: string, hidden: boolean) => Promise<void>
  deleteSuggestion: (id: string) => Promise<void>
  updateThemeColors: (colors: Partial<ThemeColors>) => void
  updateLogo: (logo: Logo) => void
  hasUserUpvoted: (id: string) => boolean
  selectPost: (post: Suggestion | null, fromTab?: string) => void
  loadTickets: () => Promise<void>
  loadAdminTickets: () => Promise<void>
  updateAdminTickets: (tickets: Suggestion[]) => void
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

const defaultThemeColors: ThemeColors = {
  primary: '#3b82f6'
}

const defaultUserUpvotes: UserUpvotes = {
  upvotedPosts: []
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [adminTickets, setAdminTickets] = useState<Suggestion[]>([])
  const [themeColors, setThemeColors] = useState<ThemeColors>(defaultThemeColors)
  const [userUpvotes, setUserUpvotes] = useState<UserUpvotes>(defaultUserUpvotes)
  const [selectedPost, setSelectedPost] = useState<Suggestion | null>(null)
  const [previousTab, setPreviousTab] = useState<string>('posts')
  const [systemAdmins, setSystemAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [logo, setLogo] = useState<Logo | null>(null)

  // Load theme color from public API and user upvotes from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clean up expired comment drafts
      storageUtils.cleanupExpiredDrafts()

      // Load theme color from public API
      const loadThemeColor = async () => {
        try {
          const response = await fetch('/api/theme')
          if (response.ok) {
            const result = await response.json()
            if (result.data?.primary) {
              setThemeColors({ primary: result.data.primary })
            }
          }
        } catch (error) {
          console.error('Failed to load theme color from API:', error)
        }
      }
      
      loadThemeColor()

      // Load logo from public API
      const loadLogo = async () => {
        try {
          const response = await fetch('/api/logo')
          if (response.ok) {
            const result = await response.json()
            if (result.data) {
              setLogo(result.data)
            }
          }
        } catch (error) {
          console.error('Failed to load logo from API:', error)
        }
      }
      
      loadLogo()

      const savedUpvotes = localStorage.getItem('userUpvotes')
      if (savedUpvotes) {
        try {
          setUserUpvotes(JSON.parse(savedUpvotes))
        } catch (error) {
          console.error('Failed to parse saved user upvotes:', error)
        }
      }

      // Load selected post from localStorage
      const savedSelectedPost = localStorage.getItem('selectedPost')
      if (savedSelectedPost) {
        try {
          const parsedPost = JSON.parse(savedSelectedPost)
          // Only restore if we have the full post data
          if (parsedPost && parsedPost.id) {
            setSelectedPost(parsedPost)
          }
        } catch (error) {
          console.error('Failed to parse saved selected post:', error)
        }
      }

      // Load previous tab from localStorage
      const savedPreviousTab = localStorage.getItem('previousTab')
      if (savedPreviousTab) {
        setPreviousTab(savedPreviousTab)
      }
    }
  }, [])

  // Load initial tickets once on mount
  useEffect(() => {
    loadTickets()
  }, [])

  // Check for pending comment ticket ID after tickets are loaded
  useEffect(() => {
    if (suggestions.length > 0 && typeof window !== 'undefined') {
      const pendingCommentTicketId = localStorage.getItem('pendingCommentTicketId')
      if (pendingCommentTicketId) {
        // Find the ticket and select it
        const ticket = suggestions.find(s => s.id === pendingCommentTicketId)
        if (ticket) {
          selectPost(ticket)
        }
        // Clear the pending ticket ID
        localStorage.removeItem('pendingCommentTicketId')
      }
    }
  }, [suggestions])

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
      let imageUrl: string | undefined
      if (images && images.length > 0) {
        const imageAttachment = images[0]
        
        if (imageAttachment.tempFilename) {
          // Move from temporary storage to permanent storage
          const moveResult = await uploadsApi.moveTempToPermanent(
            imageAttachment.tempFilename,
            imageAttachment.name,
            imageAttachment.type
          )
          if (moveResult.error) {
            throw new Error(moveResult.error)
          }
          imageUrl = moveResult.data?.imageUrl
        } else if (imageAttachment.file) {
          // Direct upload for authenticated users
          const uploadResult = await uploadsApi.uploadImage(imageAttachment.file)
          if (uploadResult.error) {
            throw new Error(uploadResult.error)
          }
          imageUrl = uploadResult.data?.imageUrl
        } else {
          // Fallback for existing URLs
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
      
      const result = await ticketsApi.createTicket({
        title: suggestion.title,
        description: suggestion.description,
        imageUrl
      })
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      if (result.data) {
        setSuggestions(prev => [result.data!, ...prev])
      }
    } catch (error) {
      console.error('Failed to create suggestion:', error)
      throw error
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
        const commentWithAuthor = {
          ...result.data,
          author: result.data.author || 'Anonymous',
          createdAt: result.data.createdAt instanceof Date ? result.data.createdAt : new Date(result.data.createdAt)
        }
        
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
    }
  }

  const hasUserUpvoted = (id: string): boolean => {
    return userUpvotes.upvotedPosts.includes(id)
  }

  const upvoteSuggestion = async (id: string) => {
    try {
      const isUpvoted = hasUserUpvoted(id)
      
      // Optimistically update UI
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
      
      const revertedUserUpvotes: UserUpvotes = {
        upvotedPosts: userUpvotes.upvotedPosts
      }
      setUserUpvotes(revertedUserUpvotes)
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
    }
  }

  const updateThemeColors = (colors: Partial<ThemeColors>) => {
    const newColors = { ...themeColors, ...colors }
    setThemeColors(newColors)
    // Theme colors are now managed by the database, no need to save to localStorage
  }

  const updateLogo = (newLogo: Logo) => {
    setLogo(newLogo)
    // Logo is now managed by the database, no need to save to localStorage
  }

  const selectPost = (post: Suggestion | null, fromTab?: string) => {
    if (post) {
      let fullPost = suggestions.find(s => s.id === post.id) || post
      
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
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedPost', JSON.stringify(fullPost))
      }
    } else {
      setSelectedPost(null)
      // Remove from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedPost')
      }
    }
    if (fromTab) {
      setPreviousTab(fromTab)
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('previousTab', fromTab)
      }
    }
  }

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true)
      // Always filter out hidden tickets for regular users
      const result = await ticketsApi.getTickets({ hidden: false, limit: 1000 })
      
      if (result.error) {
        // Don't throw error for unauthenticated users, just return
        if (result.error.includes('Unauthorized') || result.error.includes('Forbidden')) {
          return
        }
        throw new Error(result.error)
      }
      
      if (result.data && result.data.tickets && result.data.tickets.length > 0) {
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
      } else {
        setSuggestions([])
      }
    } catch (error) {
      console.error('Failed to load tickets:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAdminTickets = useCallback(async () => {
    try {
      setLoading(true)
      const result = await adminTicketsApi.getAdminTickets({ limit: 1000 })
      
      if (result.error) {
        if (result.error.includes('Unauthorized') || result.error.includes('Forbidden')) {
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
      }
    } catch (error) {
      console.error('Failed to load admin tickets:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateAdminTickets = (tickets: Suggestion[]) => {
    setAdminTickets(tickets)
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
    }
  }

  const checkIsSystemAdmin = (userEmail: string) => {
    return systemAdmins.some(admin => admin.email === userEmail)
  }

  return (
    <AppContext.Provider
      value={{
        suggestions,
        adminTickets,
        themeColors,
        userUpvotes,
        selectedPost,
        previousTab,
        systemAdmins,
        logo,
        loading,
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