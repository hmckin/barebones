import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createServerSupabase } from '@/lib/supabase-server'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const ticketId = params.id
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Validate status value
    const validStatuses = ['Queued', 'In Progress', 'Completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }

    // Update the ticket status using Prisma
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
      comments: updatedTicket.comments.map((comment: any) => ({
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 