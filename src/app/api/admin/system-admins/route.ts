import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if the requesting user is a system administrator
    const { data: isAdmin, error: adminCheckError } = await supabase
      .from('system_admins')
      .select('id')
      .eq('email', user.email)
      .single()

    if (adminCheckError || !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - System administrator access required' },
        { status: 403 }
      )
    }

    // Get all system administrators
    const { data: systemAdmins, error: fetchError } = await supabase
      .from('system_admins')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching system admins:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch system administrators' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: systemAdmins })
  } catch (error) {
    console.error('System admins GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if the requesting user is a system administrator
    const { data: isAdmin, error: adminCheckError } = await supabase
      .from('system_admins')
      .select('id')
      .eq('email', user.email)
      .single()

    if (adminCheckError || !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - System administrator access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, name } = body

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('system_admins')
      .select('id')
      .eq('email', email.trim())
      .single()

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'User is already a system administrator' },
        { status: 409 }
      )
    }

    // Add new system administrator
    const { data: newAdmin, error: insertError } = await supabase
      .from('system_admins')
      .insert({
        email: email.trim(),
        name: name || email.split('@')[0]
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting system admin:', insertError)
      return NextResponse.json(
        { error: 'Failed to add system administrator' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: newAdmin }, { status: 201 })
  } catch (error) {
    console.error('System admins POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 