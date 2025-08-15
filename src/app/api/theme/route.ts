import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    
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
    console.error('Error fetching theme color:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
