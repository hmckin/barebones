import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000') // Higher limit for admin view
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const authorId = searchParams.get('authorId')
    const hidden = searchParams.get('hidden') // Allow filtering by hidden status
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
    
    // Don't filter by hidden by default - show all tickets to admins
    if (hidden !== null && hidden !== undefined) {
      where.hidden = hidden === 'true'
    }
    
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
        skip: (page - 1) * limit,
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

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      tickets: transformedTickets,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('Error fetching admin tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 