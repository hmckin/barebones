import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Test database connection
    const ticketCount = await prisma.ticket.count()
    
    return NextResponse.json({
      message: 'Database connection successful',
      ticketCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database connection test failed:', error)
    return NextResponse.json(
      { error: 'Database connection failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 