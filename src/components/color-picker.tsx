"use client"

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor={`color-${label.toLowerCase()}`} className="text-xs font-medium min-w-16">
        {label}
      </Label>
      <div className="flex items-center space-x-2">
        <Input
          id={`color-${label.toLowerCase()}`}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-8 p-0 border rounded cursor-pointer"
        />
        <span className="text-xs text-muted-foreground font-mono">{value}</span>
      </div>
    </div>
  )
} 