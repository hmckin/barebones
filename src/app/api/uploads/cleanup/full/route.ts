import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { TEMP_STORAGE_BUCKET } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client without requiring authentication
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // No need to set cookies for cleanup
          },
        },
      }
    )
    
    try {
      // List all files in temp bucket
      const { data: files, error: listError } = await supabase.storage
        .from(TEMP_STORAGE_BUCKET)
        .list('temp', { limit: 1000 })
      
      if (listError) {
        throw listError
      }
      
      if (!files || files.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No files found in temp storage',
          removedFiles: []
        })
      }
      
      // Check each file's creation time (assuming Supabase provides this)
      const oneHourAgo = new Date(Date.now() - 3600000)
      const expiredFiles = files.filter(file => {
        // You might need to adjust this based on what Supabase provides
        const createdAt = new Date(file.created_at || file.updated_at || 0)
        return createdAt < oneHourAgo
      })
      
      if (expiredFiles.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No expired files found',
          removedFiles: []
        })
      }
      
      // Delete all expired files
      const { data, error: removeError } = await supabase.storage
        .from(TEMP_STORAGE_BUCKET)
        .remove(expiredFiles.map(f => f.name))
      
      if (removeError) {
        throw removeError
      }
      
      return NextResponse.json({
        success: true,
        message: `Successfully cleaned up ${expiredFiles.length} expired file(s)`,
        removedFiles: data
      })
      
    } catch (error) {
      throw error
    }
    
  } catch (error) {
    console.error('Full cleanup error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to run full cleanup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also allow GET requests for easy testing
export async function GET() {
  return NextResponse.json({
    message: 'Use POST to run full cleanup of expired temp files',
    endpoint: '/api/uploads/cleanup/full',
    method: 'POST'
  })
}
