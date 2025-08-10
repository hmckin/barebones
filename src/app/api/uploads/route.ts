import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { supabase, STORAGE_BUCKET } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createServerSupabase(request)
    
    const { data: { user } } = await supabaseAuth.auth.getUser()
    
    if (!user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to upload images' },
        { status: 401 }
      )
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Basic file validation
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }
    
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }
    
    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`
    
    // Try to upload directly instead of checking bucket existence
    // The listBuckets() call has permission issues in server context
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, file)
    
    if (error) {
      console.error('Supabase upload error:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload file to storage'
      if (error.message.includes('policy')) {
        errorMessage = 'Storage policy violation. Please check your Supabase storage policies.'
      } else if (error.message.includes('bucket')) {
        errorMessage = 'Storage bucket access denied. Please check your Supabase configuration.'
      } else if (error.message.includes('not found')) {
        errorMessage = 'Storage bucket not found. Please create the "images" bucket in your Supabase dashboard.'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: error.message
        },
        { status: 500 }
      )
    }
    

    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filename)
    
    return NextResponse.json({
      success: true,
      imageUrl: filename,
      filename,
      size: file.size,
      type: file.type,
      publicUrl
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 