"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

export function AuthButton() {
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuth()

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    )
  }

  if (!isAuthenticated) {
    return (
      <Button onClick={signIn} variant="outline">
        Sign In
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {user?.name || user?.email}
      </span>
      <Button onClick={signOut} variant="outline" size="sm">
        Sign Out
      </Button>
    </div>
  )
} 