"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Settings, Shield } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useApp } from "@/contexts/app-context"
import { SystemAdminModal } from "./system-admin-modal"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const { isSystemAdmin } = useApp()
  const [showSystemAdminModal, setShowSystemAdminModal] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Settings</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
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
          {isSystemAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowSystemAdminModal(true)}>
                <Shield className="mr-2 h-4 w-4" />
                System Administration
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {showSystemAdminModal && (
        <SystemAdminModal 
          isOpen={showSystemAdminModal} 
          onClose={() => setShowSystemAdminModal(false)} 
        />
      )}
    </>
  )
} 