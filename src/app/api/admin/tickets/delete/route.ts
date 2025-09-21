import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabase } from '@/lib/supabase-server'

export async function DELETE(request: NextRequest) {
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

    // Get the ticket ID from the request body
    const { ticketId } = await request.json()

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 })
    }

    // Check if ticket exists
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    })

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Delete the ticket using Prisma (this will cascade delete related comments and votes)
    await prisma.ticket.delete({
      where: { id: ticketId }
    })

    return NextResponse.json({
      success: true,
      message: 'Ticket deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 