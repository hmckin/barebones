import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createServerSupabase } from '@/lib/supabase-server'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const offset = (page - 1) * limit
    
    // Filtering
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const authorId = searchParams.get('authorId')
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // Build where clause
    const where: {
      hidden?: boolean;
      status?: string;
      OR?: Array<{ title: { contains: string; mode: 'insensitive' } } | { description: { contains: string; mode: 'insensitive' } }>;
      authorId?: string;
      createdAt?: { gte: Date };
    } = {}
    
    // Always filter out hidden tickets for regular users
    where.hidden = false
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (authorId) {
      where.authorId = authorId
    }
    
    // Build orderBy clause
    const orderBy: { [key: string]: string } = {}
    if (sortBy === 'upvotes') {
      orderBy.upvotesCount = sortOrder
    } else if (sortBy === 'trending') {
      // For trending, we'll sort by upvotes in the last 7 days
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      where.createdAt = {
        gte: weekAgo
      }
      orderBy.upvotesCount = 'desc'
    } else {
      orderBy[sortBy] = sortOrder
    }
    
    // Get tickets with pagination
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
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
      }),
      prisma.ticket.count({ where })
    ])
    
    // Transform data to match frontend expectations
    const transformedTickets = tickets.map((ticket: {
      id: string;
      title: string;
      description: string;
      status: string;
      hidden: boolean;
      upvotesCount: number;
      createdAt: Date;
      updatedAt: Date;
      imageUrl: string | null;
      author: { id: string; name: string | null; email: string | null; image: string | null };
      comments: Array<{
        id: string;
        content: string;
        createdAt: Date;
        author: { id: string; name: string | null; email: string | null; displayName: string | null };
      }>;
      _count: { comments: number; votes: number };
    }) => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      hidden: ticket.hidden,
      upvotes: ticket.upvotesCount,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      author: ticket.author,
      comments: ticket.comments.map((comment: {
        id: string;
        content: string;
        createdAt: Date;
        author: { id: string; name: string | null; email: string | null; displayName: string | null };
      }) => ({
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
    }))
    
    return NextResponse.json({
      tickets: transformedTickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json(
        { error: 'Authentication error', details: authError.message },
        { status: 401 }
      )
    }
    
    if (!user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { title, description, imageUrl } = body
    
    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
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
    
    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        title: title.trim(),
        description: description?.trim() || '',
        imageUrl,
        authorId: dbUser.id,
        status: 'Queued'
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
    const transformedTicket = {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      upvotes: 0,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      author: ticket.author,
      comments: [],
      images: ticket.imageUrl ? [{
        id: `img-${ticket.id}`,
        name: 'uploaded-image',
        url: ticket.imageUrl,
        size: 0,
        type: 'image/*',
        uploadedAt: ticket.createdAt
      }] : []
    }
    
    return NextResponse.json(transformedTicket, { status: 201 })
    
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
} 