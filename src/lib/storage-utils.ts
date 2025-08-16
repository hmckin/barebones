"use client"

interface CommentDraft {
  ticketId: string
  commentContent: string
  expiresAt: number
}

const COMMENT_DRAFT_TTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export const storageUtils = {
  /**
   * Store comment draft data with TTL
   */
  storeCommentDraft(ticketId: string, commentContent: string): void {
    if (typeof window === 'undefined') return

    try {
      const draft: CommentDraft = {
        ticketId,
        commentContent,
        expiresAt: Date.now() + COMMENT_DRAFT_TTL
      }
      
      const key = `commentDraft:${ticketId}`
      localStorage.setItem(key, JSON.stringify(draft))
    } catch (error) {
      console.error('Failed to store comment draft:', error)
    }
  },

  /**
   * Retrieve comment draft data and check TTL
   */
  getCommentDraft(ticketId: string): string | null {
    if (typeof window === 'undefined') return null

    try {
      const key = `commentDraft:${ticketId}`
      const stored = localStorage.getItem(key)
      
      if (!stored) return null
      
      const draft: CommentDraft = JSON.parse(stored)
      
      // Check if draft has expired
      if (Date.now() > draft.expiresAt) {
        localStorage.removeItem(key)
        return null
      }
      
      return draft.commentContent
    } catch (error) {
      console.error('Failed to retrieve comment draft:', error)
      return null
    }
  },

  /**
   * Clear comment draft data for a specific ticket
   */
  clearCommentDraft(ticketId: string): void {
    if (typeof window === 'undefined') return

    try {
      const key = `commentDraft:${ticketId}`
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to clear comment draft:', error)
    }
  },

  /**
   * Get all comment draft keys (for cleanup purposes)
   */
  getAllCommentDraftKeys(): string[] {
    if (typeof window === 'undefined') return []

    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('commentDraft:')) {
          keys.push(key)
        }
      }
      return keys
    } catch (error) {
      console.error('Failed to get comment draft keys:', error)
      return []
    }
  },

  /**
   * Clean up expired comment drafts
   */
  cleanupExpiredDrafts(): void {
    if (typeof window === 'undefined') return

    try {
      const keys = this.getAllCommentDraftKeys()
      
      keys.forEach(key => {
        try {
          const stored = localStorage.getItem(key)
          if (stored) {
            const draft: CommentDraft = JSON.parse(stored)
            if (Date.now() > draft.expiresAt) {
              localStorage.removeItem(key)
            }
          }
        } catch (error) {
          // Remove invalid entries
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Failed to cleanup expired drafts:', error)
    }
  }
}
