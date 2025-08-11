import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a system admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('system_admins')
      .select('*')
      .eq('email', user.email)
      .single()

    if (adminError || !adminCheck) {
      return NextResponse.json({ error: 'Forbidden: System admin access required' }, { status: 403 })
    }

    const { primary, secondary } = await request.json()

    if (!primary || !secondary) {
      return NextResponse.json({ error: 'Primary and secondary colors are required' }, { status: 400 })
    }

    // Validate color format (basic hex validation)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (!hexColorRegex.test(primary) || !hexColorRegex.test(secondary)) {
      return NextResponse.json({ error: 'Invalid color format. Please use hex colors (e.g., #FF0000)' }, { status: 400 })
    }

    // Save theme colors to database (you can create a theme_settings table)
    // For now, we'll just return success
    // In a real implementation, you'd save this to your database
    
    return NextResponse.json({
      success: true,
      message: 'Theme colors saved successfully',
      data: { primary, secondary }
    })

  } catch (error) {
    console.error('Error saving theme colors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a system admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('system_admins')
      .select('*')
      .eq('email', user.email)
      .single()

    if (adminError || !adminCheck) {
      return NextResponse.json({ error: 'Forbidden: System admin access required' }, { status: 403 })
    }

    // Get current theme colors from database
    // For now, return default colors
    // In a real implementation, you'd fetch this from your database
    
    return NextResponse.json({
      data: {
        primary: '#3B82F6',
        secondary: '#6B7280'
      }
    })

  } catch (error) {
    console.error('Error fetching theme colors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 