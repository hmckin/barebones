import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

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
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      author: comment.author.name || comment.author.email || 'Anonymous',
      createdAt: comment.createdAt
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
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
    
    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
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
        authorId: user.id
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
      createdAt: comment.createdAt
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