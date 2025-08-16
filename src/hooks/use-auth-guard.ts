"use client"

import { useRouter } from 'next/navigation'
import { useAuth } from './use-auth'
import { useCallback } from 'react'
import { storageUtils } from '@/lib/storage-utils'

interface UseAuthGuardReturn {
  requireAuth: (action: () => void | Promise<void>, actionName?: string, formData?: Record<string, unknown>) => void | Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

export function useAuthGuard(): UseAuthGuardReturn {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  const requireAuth = useCallback((
    action: () => void | Promise<void>, 
    actionName: string = 'perform this action',
    formData?: Record<string, unknown>
  ) => {
    if (isLoading) {
      return // Still loading, wait
    }

    if (!isAuthenticated) {
      // Store the current action, return URL, and form data for after login
      const currentUrl = window.location.pathname + window.location.search
      const redirectUrl = `/auth/signin?redirect=${encodeURIComponent(currentUrl)}&action=${encodeURIComponent(actionName)}`
      
      // Store form data if provided (excluding File objects which will be handled by temp uploads)
      if (formData) {
        try {
          // Check if this is comment data and store it using the storage utility
          if (formData.ticketId && formData.commentContent) {
            storageUtils.storeCommentDraft(
              formData.ticketId as string,
              formData.commentContent as string
            )
          } else {
            // Handle other form data (like create post) as before
            const serializableData = { ...formData }
            if (serializableData.attachedImages && Array.isArray(serializableData.attachedImages)) {
              // Store all necessary image data except File objects which can't be serialized
              serializableData.attachedImages = serializableData.attachedImages.map((img: Record<string, unknown>) => ({
                id: img.id as string,
                name: img.name as string,
                url: img.url as string,
                size: img.size as number,
                type: img.type as string,
                uploadedAt: img.uploadedAt as Date,
                tempFilename: img.tempFilename as string,
                expiresAt: img.expiresAt as string
              }))
            }
            
            const storageKey = `auth_form_data_${Date.now()}`
            localStorage.setItem(storageKey, JSON.stringify(serializableData))
            localStorage.setItem('auth_form_data_key', storageKey)
          }
        } catch (error) {
          console.error('Failed to prepare form data for storage:', error)
        }
      }
      
      router.push(redirectUrl)
      return
    }

    // User is authenticated, proceed with action
    return action()
  }, [isAuthenticated, isLoading, router])

  return {
    requireAuth,
    isAuthenticated,
    isLoading
  }
}
