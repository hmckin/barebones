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
    
    // Validation
    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
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
          role: 'user',
          displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
        }
      })
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.email) {
      return NextResponse.json({ upvotedPosts: [] })
    }
    
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
    if (!dbUser) return NextResponse.json({ upvotedPosts: [] })
    
    const votes = await prisma.vote.findMany({
      where: { userId: dbUser.id },
      select: { ticketId: true }
    })
    
    return NextResponse.json({ upvotedPosts: votes.map(v => v.ticketId) })
  } catch (error) {
    return NextResponse.json({ upvotedPosts: [] })
  }
} 