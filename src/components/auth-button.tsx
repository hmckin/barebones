"use client"

import { useState, useEffect, useRef } from "react"
import { useSupabaseAuth } from "@/contexts/supabase-auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { ChevronDown, User, Settings, LogOut, Save, X } from "lucide-react"
import { userProfileApi } from "@/lib/api"

export function AuthButton() {
  const { user, isAuthenticated, isLoading, signOut } = useSupabaseAuth()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [tempDisplayName, setTempDisplayName] = useState("")
  const [isLoadingName, setIsLoadingName] = useState(false)
  const [nameError, setNameError] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load user's display name on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadDisplayName()
    }
  }, [isAuthenticated, user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setIsEditingName(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadDisplayName = async () => {
    try {
      const result = await userProfileApi.getDisplayName()
      if (result.data && !result.error) {
        setDisplayName(result.data.displayName || "")
      }
    } catch (error) {
      console.error('Error loading display name:', error)
    }
  }

  const handleSaveDisplayName = async () => {
    if (!tempDisplayName.trim()) {
      setNameError("Display name cannot be empty")
      return
    }

    if (tempDisplayName.length > 50) {
      setNameError("Display name must be 50 characters or less")
      return
    }

    setIsLoadingName(true)
    setNameError("")

    try {
      const result = await userProfileApi.updateDisplayName(tempDisplayName.trim())
      if (result.data && !result.error) {
        setDisplayName(result.data.displayName)
        setIsEditingName(false)
        setTempDisplayName("")
      } else {
        setNameError(result.error || "Failed to update display name")
      }
    } catch (error) {
      setNameError("Failed to update display name")
    } finally {
      setIsLoadingName(false)
    }
  }

  const handleEditName = () => {
    setTempDisplayName(displayName)
    setIsEditingName(true)
    setNameError("")
  }

  const handleCancelEdit = () => {
    setIsEditingName(false)
    setTempDisplayName("")
    setNameError("")
  }

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    )
  }

  if (!isAuthenticated) {
    return (
      <Button onClick={() => router.push('/auth/signin')} variant="outline">
        Sign In
      </Button>
    )
  }

  const currentDisplayName = displayName || user?.user_metadata?.full_name || user?.email

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2"
      >
        <User className="w-4 h-4" />
        <span className="max-w-32 truncate">{currentDisplayName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {currentDisplayName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Display Name Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Display Name
              </h3>
              {!isEditingName && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditName}
                  className="h-6 px-2 text-xs"
                >
                  Edit
                </Button>
              )}
            </div>

            {isEditingName ? (
              <div className="space-y-3">
                <Input
                  value={tempDisplayName}
                  onChange={(e) => setTempDisplayName(e.target.value)}
                  placeholder="Enter display name"
                  className="h-8 text-sm"
                  maxLength={50}
                />
                {nameError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{nameError}</p>
                )}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={handleSaveDisplayName}
                    disabled={isLoadingName}
                    className="h-7 px-3 text-xs"
                  >
                    {isLoadingName ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    <span className="ml-1">Save</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="h-7 px-3 text-xs"
                  >
                    <X className="w-3 h-3" />
                    <span className="ml-1">Cancel</span>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {displayName || "No display name set"}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="p-2">
            <Button
              variant="ghost"
              onClick={signOut}
              className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 