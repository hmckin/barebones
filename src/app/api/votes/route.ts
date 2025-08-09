import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const prisma = new PrismaClient()

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
    const { ticketId } = body
    
    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
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
    
    // Check if user has already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_ticketId: {
          userId: user.id,
          ticketId
        }
      }
    })
    
    if (existingVote) {
      // Remove vote
      await prisma.vote.delete({
        where: {
          userId_ticketId: {
            userId: user.id,
            ticketId
          }
        }
      })
      
      // Decrease upvotes count
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          upvotesCount: {
            decrement: 1
          }
        }
      })
      
      return NextResponse.json({ 
        action: 'removed',
        upvotes: -1
      })
    } else {
      // Add vote
      await prisma.vote.create({
        data: {
          userId: user.id,
          ticketId
        }
      })
      
      // Increase upvotes count
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          upvotesCount: {
            increment: 1
          }
        }
      })
      
      return NextResponse.json({ 
        action: 'added',
        upvotes: 1
      })
    }
    
  } catch (error) {
    console.error('Error handling vote:', error)
    return NextResponse.json(
      { error: 'Failed to handle vote' },
      { status: 500 }
    )
  }
} 