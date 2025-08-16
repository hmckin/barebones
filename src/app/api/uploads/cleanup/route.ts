import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { TEMP_STORAGE_BUCKET } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tempFilenames, runFullCleanup = false } = body
    
    // If runFullCleanup is true, clean up ALL expired files
    if (runFullCleanup) {
      return await cleanupAllExpiredFiles(request)
    }
    
    // Otherwise, just clean up the specific files requested
    if (!tempFilenames || !Array.isArray(tempFilenames) || tempFilenames.length === 0) {
      return NextResponse.json(
        { error: 'No filenames provided for cleanup' },
        { status: 400 }
      )
    }
    
    // Create Supabase client for specific file cleanup
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
    
    // Remove specific expired files from temp storage
    const { data, error } = await supabase.storage
      .from(TEMP_STORAGE_BUCKET)
      .remove(tempFilenames)
    
    if (error) {
      console.error('Failed to cleanup expired files:', error)
      return NextResponse.json(
        { error: 'Failed to cleanup expired files' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${tempFilenames.length} expired file(s)`,
      removedFiles: data
    })
    
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// New function to clean up ALL expired files
async function cleanupAllExpiredFiles(request: NextRequest) {
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
