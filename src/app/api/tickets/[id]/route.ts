import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabase } from '@/lib/supabase-server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the ID from the URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const ticketId = pathParts[pathParts.length - 1]
    
    const { status } = await request.json()

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      )
    }

    if (!status || !['Queued', 'In Progress', 'Completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (Queued, In Progress, or Completed)' },
        { status: 400 }
      )
    }

    // Update the ticket status
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
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

    // Transform to match frontend expectations
    const transformedTicket = {
      id: updatedTicket.id,
      title: updatedTicket.title,
      description: updatedTicket.description,
      status: updatedTicket.status,
      upvotes: updatedTicket.upvotesCount,
      createdAt: updatedTicket.createdAt,
      updatedAt: updatedTicket.updatedAt,
      author: updatedTicket.author,
      comments: updatedTicket.comments.map((comment: { id: string; content: string; author: { id: string; name: string | null; email: string | null } | null; createdAt: Date }) => ({
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

    return NextResponse.json(transformedTicket)
    
  } catch (error) {
    console.error('Error updating ticket status:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket status' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the ID from the URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]

    if (!id) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      )
    }

    // Get the ticket by ID
    const ticket = await prisma.ticket.findUnique({
      where: { id },
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
                email: true,
                displayName: true
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

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Transform to match frontend expectations
    const transformedTicket = {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      upvotes: ticket.upvotesCount,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      author: ticket.author,
      comments: ticket.comments.map((comment: { id: string; content: string; author: { id: string; name: string | null; email: string | null; displayName: string | null } | null; createdAt: Date }) => ({
        id: comment.id,
        content: comment.content,
        author: comment.author?.displayName || comment.author?.name || comment.author?.email || 'Anonymous',
        createdAt: new Date(comment.createdAt)
      })),
      images: ticket.imageUrl ? [{
        id: `img-${ticket.id}`,
        name: 'uploaded-image',
        url: ticket.imageUrl,
        size: 0,
        type: 'image/*',
        uploadedAt: ticket.createdAt
      }] : [],
      _count: ticket._count
    }

    return NextResponse.json(transformedTicket)
    
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    )
  }
} 