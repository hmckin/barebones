"use client"

import { useSupabaseAuth } from "@/contexts/supabase-auth-context"

export function useAuth() {
  const { user, session, isLoading, signIn, signOut, isAuthenticated } = useSupabaseAuth()

  return {
    user: user ? {
      id: user.id,
      name: user.user_metadata?.full_name || user.email,
      email: user.email,
      image: user.user_metadata?.avatar_url,
      role: user.user_metadata?.role || 'USER',
      displayName: user.user_metadata?.displayName || null
    } : null,
    isAuthenticated,
    isLoading,
    signIn: () => signIn("", ""),
    signOut,
    isAdmin: user?.user_metadata?.role === "ADMIN",
  }
} 