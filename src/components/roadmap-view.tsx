"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronUp, MessageSquare } from 'lucide-react'
import { useApp } from '@/contexts/app-context'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'In Progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'Completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'Queued':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

const ProgressBadge = ({ status }: { status: string }) => {
  return (
    <Badge className={`text-xs font-medium mb-2 ${getStatusColor(status)}`}>
      {status.toUpperCase()}
    </Badge>
  )
}

export function RoadmapView() {
  const { suggestions, upvoteSuggestion } = useApp()

  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.status]) {
      acc[suggestion.status] = []
    }
    acc[suggestion.status].push(suggestion)
    return acc
  }, {} as Record<string, typeof suggestions>)

  // Add backlog items (items with 0 upvotes)
  const backlogItems = suggestions.filter(s => s.upvotes === 0)
  groupedSuggestions['Backlog'] = backlogItems

  const columns = [
    { key: 'Backlog', title: 'Backlog', color: '' },
    { key: 'Queued', title: 'Queued', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
    { key: 'In Progress', title: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { key: 'Completed', title: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Roadmap</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <Card key={column.key}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{column.title}</span>
                <Badge variant="secondary">
                  {groupedSuggestions[column.key]?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupedSuggestions[column.key]?.map((suggestion) => (
                <Card key={suggestion.id} className="p-3">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">{suggestion.title}</h4>
                    {suggestion.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {suggestion.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {suggestion.upvotes} upvotes
                      </span>
                      <button
                        onClick={() => upvoteSuggestion(suggestion.id)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
                      >
                        <ChevronUp className="w-3 h-3" />
                        <span className="text-xs">Upvote</span>
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {(!groupedSuggestions[column.key] || groupedSuggestions[column.key].length === 0) && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No {column.title.toLowerCase()} items
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 