"use client"

import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Image as ImageIcon, X } from 'lucide-react'
import { useApp } from '@/contexts/app-context'
import { ImageAttachment } from '@/types'

interface CreatePostProps {
  // Removed onSearchChange as it's not needed for creating posts
}

export function CreatePost({}: CreatePostProps) {
  const { addSuggestion, loading } = useApp()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<{ title?: string }>({})
  const [attachedImages, setAttachedImages] = useState<ImageAttachment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value
    setDescription(newDescription)
    

  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select only image files')
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      // Create object URL for preview
      const url = URL.createObjectURL(file)
      
      const newImage: ImageAttachment = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: url,
        size: file.size,
        type: file.type,
        uploadedAt: new Date()
      }

      setAttachedImages(prev => [...prev, newImage])
    })

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
    
    // Validation
    const newErrors: { title?: string } = {}
    if (!title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await addSuggestion({
        title: title.trim(),
        description: description.trim(),
        upvotes: 0,
        status: 'Queued'
      }, attachedImages)

      // Reset form
      setTitle('')
      setDescription('')
      setErrors({})
      

      
      // Clean up image URLs and reset attachments
      attachedImages.forEach(img => URL.revokeObjectURL(img.url))
      setAttachedImages([])
    } catch (error) {
      console.error('Failed to create post:', error)
      // You might want to show an error message to the user
    } finally {
      setIsSubmitting(false)
    }
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
              {attachedImages.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {attachedImages.length} attached
                </Badge>
              )}
            </div>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? 'CREATING...' : 'CREATE POST'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 