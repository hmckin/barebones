import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { prisma } from '@/lib/supabase-server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { displayName } = await request.json()

    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 })
    }

    if (displayName.trim().length === 0) {
      return NextResponse.json({ error: 'Display name cannot be empty' }, { status: 400 })
    }

    if (displayName.length > 50) {
      return NextResponse.json({ error: 'Display name must be 50 characters or less' }, { status: 400 })
    }

    // Update the user's display name
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { displayName: displayName.trim() }
    })

    return NextResponse.json({ 
      success: true, 
      displayName: updatedUser.displayName 
    })

  } catch (error) {
    console.error('Error updating display name:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's current display name
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { displayName: true }
    })

    return NextResponse.json({ 
      displayName: userData?.displayName || null 
    })

  } catch (error) {
    console.error('Error getting display name:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 