import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    
    // Get current logo from database
    const { data: settings, error } = await supabase
      .from('Settings')
      .select('logoUrl, logoRedirectUrl')
      .eq('id', 1)
      .single()

    if (error) {
      console.error('Error fetching logo:', error)
      // Return null if database error
      return NextResponse.json({
        data: null
      })
    }

    // Only return logo if logoUrl exists
    if (settings?.logoUrl) {
      return NextResponse.json({
        data: {
          url: settings.logoUrl,
          redirectUrl: settings.logoRedirectUrl || undefined
        }
      })
    }

    return NextResponse.json({
      data: null
    })

  } catch (error) {
    console.error('Error fetching logo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
