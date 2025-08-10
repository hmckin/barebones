import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createServerSupabase } from '@/lib/supabase-server'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get('ticketId')
    
    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      )
    }
    
    const comments = await prisma.comment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })
    
    // Transform to match frontend expectations
    const transformedComments = comments.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      author: comment.author.name || comment.author.email || 'Anonymous',
      createdAt: new Date(comment.createdAt)
    }))
    
    return NextResponse.json(transformedComments)
    
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { ticketId, content } = body
    
    // Validation
    if (!ticketId || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'Ticket ID and content are required' },
        { status: 400 }
      )
    }
    
    // Get or create user in database
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    })
    
    if (!dbUser) {
      // Create user if they don't exist in the database
      dbUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'user'
        }
      })
    }
    
    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    })
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }
    
    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        ticketId,
        authorId: dbUser.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })
    
    // Transform to match frontend expectations
    const transformedComment = {
      id: comment.id,
      content: comment.content,
      author: comment.author.name || comment.author.email || 'Anonymous',
      createdAt: new Date(comment.createdAt)
    }
    
    return NextResponse.json(transformedComment, { status: 201 })
    
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
} 