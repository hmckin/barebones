"use client"

import { useSupabaseAuth } from "@/contexts/supabase-auth-context"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function AuthButton() {
  const { user, isAuthenticated, isLoading, signOut } = useSupabaseAuth()
  const router = useRouter()

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

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {user?.user_metadata?.full_name || user?.email}
      </span>
      <Button onClick={signOut} variant="outline" size="sm">
        Sign Out
      </Button>
    </div>
  )
} 