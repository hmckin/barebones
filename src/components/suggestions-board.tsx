"use client"

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Image as ImageIcon } from 'lucide-react'
import { useApp } from '@/contexts/app-context'

export function SuggestionsBoard() {
  const { addSuggestion } = useApp()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<{ title?: string }>({})

  const handleSubmit = (e: React.FormEvent) => {
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

    addSuggestion({
      title: title.trim(),
      description: description.trim(),
      upvotes: 0,
      status: 'Queued'
    })

    // Reset form
    setTitle('')
    setDescription('')
    setErrors({})
  }

  return (
    <Card className="bg-gray-50 dark:bg-gray-900 max-w-md mx-auto">
      <CardContent className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Create a Post</h2>
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
              onChange={(e) => setTitle(e.target.value)}
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
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any additional details"
              rows={4}
              className="bg-white dark:bg-gray-800"
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-gray-500">
              <ImageIcon className="w-5 h-5" />
              <span className="text-sm">Add image</span>
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
              CREATE POST
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 