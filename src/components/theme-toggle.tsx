"use client"

import * as React from "react"
import { Moon, Sun, Palette, Monitor, Settings } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ColorPicker } from "@/components/color-picker"
import { useApp } from "@/contexts/app-context"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const { themeColors, updateThemeColors } = useApp()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="p-3">
          <div className="text-sm font-medium mb-3 flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Theme Colors
          </div>
          <div className="space-y-3">
            <ColorPicker
              label="Primary"
              value={themeColors.primary}
              onChange={(color) => updateThemeColors({ primary: color })}
            />
            <ColorPicker
              label="Secondary"
              value={themeColors.secondary}
              onChange={(color) => updateThemeColors({ secondary: color })}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 