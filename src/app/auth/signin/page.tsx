"use client"

import { useSupabaseAuth } from "@/contexts/supabase-auth-context"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { storageUtils } from "@/lib/storage-utils"

function SignInContent() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const { signInWithEmail, isAuthenticated } = useSupabaseAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const redirectUrl = searchParams.get('redirect')
  const actionName = searchParams.get('action')

  // Redirect to intended action after successful authentication
  useEffect(() => {
    if (isAuthenticated && redirectUrl) {
      // Check if there are any stored comment drafts and restore the selected post
      const commentDraftKeys = storageUtils.getAllCommentDraftKeys()
      if (commentDraftKeys.length > 0) {
        // Find the first valid draft and restore the selected post state
        for (const key of commentDraftKeys) {
          const ticketId = key.replace('commentDraft:', '')
          const draftContent = storageUtils.getCommentDraft(ticketId)
          if (draftContent) {
            // Store the ticket ID in localStorage so the app context can restore it
            if (typeof window !== 'undefined') {
              localStorage.setItem('pendingCommentTicketId', ticketId)
            }
            break
          }
        }
      }
      
      router.push(redirectUrl)
    }
  }, [isAuthenticated, redirectUrl, router])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const { error } = await signInWithEmail(email, redirectUrl || undefined)
      
      if (!error) {
        setIsEmailSent(true)
      } else {
        console.error("Sign in failed:", error.message)
      }
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm mx-auto px-4">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="space-y-2">
                <CardTitle className="text-xl font-semibold">Check your email</CardTitle>
                <CardDescription className="text-muted-foreground">
                  A sign in link has been sent to {email}
                </CardDescription>
                {actionName && (
                  <CardDescription className="text-sm text-blue-600 dark:text-blue-400">
                    After signing in, you&apos;ll be able to {actionName}
                  </CardDescription>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                variant="link" 
                onClick={() => setIsEmailSent(false)}
                className="w-full"
              >
                Try another email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-auto px-4">
        <Card className="shadow-none bg-transparent">
          <CardHeader className="text-center pb-1">
            <CardTitle className="text-3xl font-semibold">Welcome</CardTitle>
            {actionName && (
              <CardDescription className="text-muted-foreground">
                Sign in to {actionName}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send sign in link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm mx-auto px-4">
          <Card className="shadow-none bg-transparent">
            <CardContent className="text-center py-8">
              <div className="animate-pulse">Loading...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
} 