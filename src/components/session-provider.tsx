"use client"

import { SupabaseAuthProvider } from "@/contexts/supabase-auth-context"
import { ReactNode } from "react"

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <SupabaseAuthProvider>
      {children}
    </SupabaseAuthProvider>
  )
} 