import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function DELETE(request: NextRequest) {
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

    // Get the ID from the URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]

    if (!id) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      )
    }

    // Check if trying to remove the last system administrator
    const { count, error: countError } = await supabase
      .from('system_admins')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting system admins:', countError)
      return NextResponse.json(
        { error: 'Failed to verify system administrator count' },
        { status: 500 }
      )
    }

    if (count && count <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove the last system administrator' },
        { status: 400 }
      )
    }

    // Delete the system administrator
    const { error: deleteError } = await supabase
      .from('system_admins')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting system admin:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove system administrator' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'System administrator removed successfully' })
  } catch (error) {
    console.error('System admin DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 