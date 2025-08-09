"use client"

import { useSession, signIn, signOut } from "next-auth/react"

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === "loading",
    signIn: () => signIn(),
    signOut: () => signOut(),
    isAdmin: session?.user?.role === "ADMIN",
  }
} 