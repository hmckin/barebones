"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ColorPicker } from '@/components/color-picker'
import { useApp } from '@/contexts/app-context'

export function ThemeSettings() {
  const { themeColors, updateThemeColors } = useApp()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ColorPicker
          label="Primary Color"
          value={themeColors.primary}
          onChange={(color) => updateThemeColors({ primary: color })}
        />
        <ColorPicker
          label="Secondary Color"
          value={themeColors.secondary}
          onChange={(color) => updateThemeColors({ secondary: color })}
        />
      </CardContent>
    </Card>
  )
} 