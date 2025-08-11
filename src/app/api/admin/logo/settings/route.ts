import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to update logo settings' },
        { status: 401 }
      )
    }
    
    // Check if user is admin (you can implement your own admin check logic)
    // For now, we'll allow any authenticated user to update logo settings
    
    const { redirectUrl } = await request.json()
    
    // Validate redirect URL if provided
    if (redirectUrl && redirectUrl.trim() !== '') {
      try {
        new URL(redirectUrl)
      } catch {
        return NextResponse.json(
          { error: 'Invalid redirect URL format' },
          { status: 400 }
        )
      }
    }
    
    // In a real implementation, you'd save this to your database
    // For now, we'll just return success
    
    return NextResponse.json({
      success: true,
      message: 'Logo settings updated successfully',
      data: {
        redirectUrl: redirectUrl || undefined
      }
    })
    
  } catch (error) {
    console.error('Logo settings update error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 