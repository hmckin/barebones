"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApp } from '@/contexts/app-context'
import { Suggestion } from '@/types'

export function ProgressView() {
  const { suggestions, updateSuggestionStatus } = useApp()

  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.status]) {
      acc[suggestion.status] = []
    }
    acc[suggestion.status].push(suggestion)
    return acc
  }, {} as Record<Suggestion['status'], Suggestion[]>)

  const handleStatusChange = (suggestionId: string, newStatus: Suggestion['status']) => {
    updateSuggestionStatus(suggestionId, newStatus)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Progress View</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['Queued', 'In Progress', 'Completed'] as const).map((status) => (
          <Card key={status}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{status}</span>
                <Badge variant="secondary">
                  {groupedSuggestions[status]?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupedSuggestions[status]?.map((suggestion) => (
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
                      <Select
                        value={suggestion.status}
                        onValueChange={(value: Suggestion['status']) => 
                          handleStatusChange(suggestion.id, value)
                        }
                      >
                        <SelectTrigger className="w-32 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Queued">Queued</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
              
              {(!groupedSuggestions[status] || groupedSuggestions[status].length === 0) && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No {status.toLowerCase()} items
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 