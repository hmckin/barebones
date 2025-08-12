import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
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

    // Find user by email (not Supabase ID)
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Update the user's display name
    const updatedUser = await prisma.user.update({
      where: { email: user.email },
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
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    // Get the user's current display name by email
    const userData = await prisma.user.findUnique({
      where: { email: user.email },
      select: { displayName: true }
    })

    if (!userData) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    return NextResponse.json({ 
      displayName: userData.displayName 
    })

  } catch (error) {
    console.error('Error getting display name:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 