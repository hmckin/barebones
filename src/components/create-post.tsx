"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Image as ImageIcon, X } from 'lucide-react'
import { useApp } from '@/contexts/app-context'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { ImageAttachment } from '@/types'

interface CreatePostProps {
  onSearchChange?: (query: string) => void
}

export function CreatePost({ onSearchChange }: CreatePostProps) {
  const { addSuggestion, loading } = useApp()
  const { requireAuth } = useAuthGuard()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<{ title?: string }>({})
  const [attachedImages, setAttachedImages] = useState<ImageAttachment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Restore form data from localStorage if available (after authentication)
  useEffect(() => {
    const formDataKey = localStorage.getItem('auth_form_data_key')
    if (formDataKey) {
      try {
        const storedData = localStorage.getItem(formDataKey)
        if (storedData) {
          const parsedData = JSON.parse(storedData)
                  if (parsedData.title) setTitle(parsedData.title)
        if (parsedData.description) setDescription(parsedData.description)
        
        // Check if stored images are still valid and clean up expired ones
        if (parsedData.attachedImages) {
          const validImages = parsedData.attachedImages.filter((img: ImageAttachment) => {
            if (!img.expiresAt) return false
            return new Date() < new Date(img.expiresAt)
          })
          
          if (validImages.length !== parsedData.attachedImages.length) {
            // Some images expired, show warning and clean up
            const expiredCount = parsedData.attachedImages.length - validImages.length
            alert(`${expiredCount} image(s) have expired and will need to be re-uploaded.`)
            
            // Clean up expired images from temp storage
            const expiredImages = parsedData.attachedImages.filter((img: ImageAttachment) => {
              if (!img.expiresAt) return true
              return new Date() >= new Date(img.expiresAt)
            })
            
            // Remove expired images from temp storage
            const expiredFilenames = expiredImages
              .map((img: ImageAttachment) => img.tempFilename)
              .filter(Boolean)
            
            if (expiredFilenames.length > 0) {
              // Clean up expired files asynchronously
              (async () => {
                try {
                  const { uploadsApi } = await import('@/lib/api')
                  
                  // First clean up the specific expired files
                  const cleanupResult = await uploadsApi.cleanupExpiredFiles(expiredFilenames)
                  if (cleanupResult.error) {
                    console.error('Failed to cleanup expired images:', cleanupResult.error)
                  } else {
                    console.log('Successfully cleaned up expired images:', cleanupResult.data?.message)
                  }
                  
                  // Then trigger a full cleanup to catch any other orphaned files
                  const fullCleanupResult = await uploadsApi.cleanupExpiredFiles([], true)
                  if (fullCleanupResult.error) {
                    console.error('Failed to run full cleanup:', fullCleanupResult.error)
                  } else {
                    console.log('Full cleanup completed:', fullCleanupResult.data?.message)
                  }
                } catch (error) {
                  console.error('Failed to cleanup expired images:', error)
                }
              })()
            }
          }
          
          setAttachedImages(validImages)
        }
          
          // Clear the stored data after restoring
          localStorage.removeItem(formDataKey)
          localStorage.removeItem('auth_form_data_key')
        }
      } catch (error) {
        console.error('Failed to restore form data:', error)
        // Clear invalid stored data
        localStorage.removeItem(formDataKey)
        localStorage.removeItem('auth_form_data_key')
      }
    }
  }, [])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    
    // Update search query to filter tickets
    if (onSearchChange) {
      const searchQuery = newTitle || description
      onSearchChange(searchQuery)
    }
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value
    setDescription(newDescription)
    
    // Update search query to filter tickets
    if (onSearchChange) {
      const searchQuery = title || newDescription
      onSearchChange(searchQuery)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select only image files')
        continue
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        continue
      }

      try {
        // Upload to temporary storage immediately
        const { uploadsApi } = await import('@/lib/api')
        const uploadResult = await uploadsApi.uploadTempImage(file)
        
        if (uploadResult.error) {
          alert(`Failed to upload image: ${uploadResult.error}`)
          continue
        }

        if (uploadResult.data) {
          const newImage: ImageAttachment = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            url: uploadResult.data.signedUrl,
            size: file.size,
            type: file.type,
            uploadedAt: new Date(),
            file: file, // Keep file reference for final upload
            tempFilename: uploadResult.data.tempFilename, // Store temp filename for later
            expiresAt: uploadResult.data.expiresAt
          }

          setAttachedImages(prev => [...prev, newImage])
        }
      } catch (error) {
        console.error('Failed to upload image:', error)
        alert('Failed to upload image. Please try again.')
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (imageId: string) => {
    setAttachedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url)
      }
      return prev.filter(img => img.id !== imageId)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const newErrors: { title?: string } = {}
    if (!title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Use authentication guard for form submission
    await requireAuth(async () => {
      setIsSubmitting(true)
      try {
        await addSuggestion({
          title: title.trim(),
          description: description.trim(),
          status: 'Queued',
          upvotes: 0,
          hidden: false
        }, attachedImages)
        
        // Reset form
        setTitle('')
        setDescription('')
        setAttachedImages([])
        setErrors({})
        setShowSuccess(true)
        
        // Clear stored form data after successful submission
        const formDataKey = localStorage.getItem('auth_form_data_key')
        if (formDataKey) {
          localStorage.removeItem(formDataKey)
          localStorage.removeItem('auth_form_data_key')
        }
        
        // Clear the search filter after a short delay so user can see their post
        setTimeout(() => {
          if (onSearchChange) {
            onSearchChange('')
          }
          setShowSuccess(false)
        }, 3000)
        
        // Clean up image URLs and reset attachments
        attachedImages.forEach(img => URL.revokeObjectURL(img.url))
        setAttachedImages([])
      } catch (error) {
        console.error('Failed to create post:', error)
        
        // Show user-friendly error message
        let errorMessage = 'Failed to create post. Please try again.'
        
        if (error instanceof Error) {
          if (error.message.includes('Storage bucket not configured')) {
            errorMessage = 'Image upload service is not configured. Please contact support.'
          } else if (error.message.includes('Unauthorized')) {
            errorMessage = 'Please sign in to create posts with images.'
          } else if (error.message.includes('policy violation')) {
            errorMessage = 'Image upload failed due to security policy. Please try a different image.'
          } else if (error.message.includes('File size')) {
            errorMessage = 'Image is too large. Please use an image smaller than 5MB.'
          } else {
            errorMessage = error.message
          }
        }
        
        // You might want to show this error message to the user via a toast or alert
        alert(errorMessage)
      } finally {
        setIsSubmitting(false)
      }
    }, 'create a post', { title, description, attachedImages })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="bg-gray-50 dark:bg-gray-900 max-w-md mx-auto shadow-none">
      <CardContent className="px-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2 pb-2">Create a Post</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold uppercase text-gray-700 dark:text-gray-300 mb-2">
              TITLE
            </label>
            <Input
              id="title"
              value={title}
              onChange={handleTitleChange}
              placeholder="Your brilliant idea"
              className={`${errors.title ? 'border-red-500' : ''} bg-white dark:bg-gray-800`}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-semibold uppercase text-gray-700 dark:text-gray-300 mb-2">
              DETAILS
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Any additional details"
              rows={4}
              className="bg-white dark:bg-gray-800"
            />
          </div>

          {/* Image Attachments */}
          {attachedImages.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold uppercase text-gray-700 dark:text-gray-300">
                ATTACHED IMAGES ({attachedImages.length})
              </label>
              <div className="space-y-2">
                {attachedImages.map((image) => (
                  <div key={image.id} className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded border">
                    <img 
                      src={image.url} 
                      alt={image.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {image.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(image.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage(image.id)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center py-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <ImageIcon className="size-8" />
              </Button>
            </div>
            {/* Submit Button or Success Message */}
            {showSuccess ? (
              <div className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md font-medium">
                ✓ Post Created!
              </div>
            ) : (
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90 text-white"
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? 'CREATING...' : 'CREATE POST'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 