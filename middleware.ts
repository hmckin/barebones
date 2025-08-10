import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create response
  let response = NextResponse.next()
  
  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Handle auth for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Ensure session is valid and refresh if needed
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
        
        if (refreshedSession) {
          // Update cookies with refreshed session
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // Session is valid, continue
          }
        }
      }
    } catch (error) {
      // Handle auth errors silently for API routes
      console.error('Middleware API auth error:', error)
    }
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 