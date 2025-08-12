"use client"

import { useSupabaseAuth } from "@/contexts/supabase-auth-context"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"



export default function SignIn() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const { signInWithEmail } = useSupabaseAuth()

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const { error } = await signInWithEmail(email)
      
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