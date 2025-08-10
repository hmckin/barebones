import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createServerSupabase } from '@/lib/supabase-server'

const prisma = new PrismaClient()

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
    const { ticketId } = body
    
    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      )
    }
    
    // Get user ID
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    })
    
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Check if user has already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_ticketId: {
          userId: dbUser.id,
          ticketId
        }
      }
    })
    
    if (existingVote) {
      // Remove vote
      await prisma.vote.delete({
        where: {
          userId_ticketId: {
            userId: dbUser.id,
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
      
      // Get updated upvote count
      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { upvotesCount: true }
      })
      
      return NextResponse.json({ 
        action: 'removed',
        upvotes: updatedTicket?.upvotesCount || 0
      })
    } else {
      // Add vote
      await prisma.vote.create({
        data: {
          userId: dbUser.id,
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
      
      // Get updated upvote count
      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { upvotesCount: true }
      })
      
      return NextResponse.json({ 
        action: 'added',
        upvotes: updatedTicket?.upvotesCount || 0
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