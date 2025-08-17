"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Settings, Shield, User } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useApp } from "@/contexts/app-context"
import { useAuth } from "@/hooks/use-auth"
import { SystemAdminModal } from "./system-admin-modal"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const { checkIsSystemAdmin } = useApp()
  const { isAuthenticated, user, signOut } = useAuth()
  const [showSystemAdminModal, setShowSystemAdminModal] = React.useState(false)
  const router = useRouter()

  // Check if current user is a system administrator
  const currentUserIsSystemAdmin = user?.email ? checkIsSystemAdmin(user.email) : false

  // If not authenticated, show sign in button
  if (!isAuthenticated) {
    return (
      <Button onClick={() => router.push('/auth/signin')} variant="outline">
        Sign In
      </Button>
    )
  }

  // If authenticated, show profile button with theme dropdown
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full">
            <User className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Profile & Settings</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Theme options */}
          <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
            <Sun className="mr-2 h-4 w-4" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
            <Monitor className="mr-2 h-4 w-4" />
            System
          </DropdownMenuItem>
          
          {/* System admin option */}
          {currentUserIsSystemAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowSystemAdminModal(true)} className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                System Administration
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuSeparator />

            {/* User info at bottom - no border */}
            <div className="px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400">
              {user?.name || user?.email}
            </div>
          
          {/* Sign out option */}
          <DropdownMenuItem onClick={signOut} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>

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