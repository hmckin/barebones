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

    const { primary } = await request.json()

    if (!primary) {
      return NextResponse.json({ error: 'Primary color is required' }, { status: 400 })
    }

    // Validate color format (basic hex validation)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (!hexColorRegex.test(primary)) {
      return NextResponse.json({ error: 'Invalid color format. Please use hex colors (e.g., #FF0000)' }, { status: 400 })
    }

    // Save primary color to database
    const { error: updateError } = await supabase
      .from('Settings')
      .upsert({ id: 1, primaryColor: primary })
      .eq('id', 1)

    if (updateError) {
      console.error('Error saving theme color to database:', updateError)
      return NextResponse.json({ error: 'Failed to save theme color' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Theme color saved successfully',
      data: { primary }
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

    // Get current theme color from database
    const { data: settings, error } = await supabase
      .from('Settings')
      .select('primaryColor')
      .eq('id', 1)
      .single()

    if (error) {
      console.error('Error fetching theme color:', error)
      // Return default color if database error
      return NextResponse.json({
        data: {
          primary: '#3B82F6'
        }
      })
    }

    return NextResponse.json({
      data: {
        primary: settings?.primaryColor || '#3B82F6'
      }
    })

  } catch (error) {
    console.error('Error fetching theme colors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 