import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabase } from '@/lib/supabase-server'

export async function PATCH(request: NextRequest) {
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

    // Get the ticket ID and hidden status from the request body
    const { ticketId, hidden } = await request.json()

    if (ticketId === undefined || hidden === undefined) {
      return NextResponse.json({ error: 'Ticket ID and hidden status are required' }, { status: 400 })
    }

    // Update the ticket's hidden status using Prisma
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { hidden },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        votes: {
          select: {
            userId: true
          }
        },
        _count: {
          select: {
            comments: true,
            votes: true
          }
        }
      }
    })

    if (!updatedTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Transform the ticket to match frontend expectations
    const transformedTicket = {
      id: updatedTicket.id,
      title: updatedTicket.title,
      description: updatedTicket.description,
      status: updatedTicket.status,
      hidden: updatedTicket.hidden,
      upvotes: updatedTicket.upvotesCount,
      createdAt: updatedTicket.createdAt,
      updatedAt: updatedTicket.updatedAt,
      author: updatedTicket.author,
      comments: updatedTicket.comments.map((comment: { id: string; content: string; author: { name: string | null; email: string | null } | null; createdAt: Date }) => ({
        id: comment.id,
        content: comment.content,
        author: comment.author?.name || comment.author?.email || 'Anonymous',
        createdAt: new Date(comment.createdAt)
      })),
      images: updatedTicket.imageUrl ? [{
        id: `img-${updatedTicket.id}`,
        name: 'uploaded-image',
        url: updatedTicket.imageUrl,
        size: 0,
        type: 'image/*',
        uploadedAt: updatedTicket.createdAt
      }] : [],
      _count: updatedTicket._count
    }

    return NextResponse.json({
      success: true,
      data: transformedTicket,
      message: `Ticket ${hidden ? 'hidden' : 'shown'} successfully`
    })

  } catch (error) {
    console.error('Error updating ticket visibility:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 