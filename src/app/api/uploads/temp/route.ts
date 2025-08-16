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
            // No need to set cookies for temp uploads
          },
        },
      }
    )
    
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
    
    // Generate unique filename with timestamp and random string to avoid conflicts
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const filename = `temp/${timestamp}-${randomId}-${file.name}`
    
    // Upload to temporary storage bucket
    const { data, error } = await supabase.storage
      .from(TEMP_STORAGE_BUCKET)
      .upload(filename, file)
    
    if (error) {
      console.error('Supabase temp upload error:', error)
      
      let errorMessage = 'Failed to upload file to temporary storage'
      if (error.message.includes('policy')) {
        errorMessage = 'Storage policy violation. Please check your Supabase storage policies.'
      } else if (error.message.includes('bucket')) {
        errorMessage = 'Temporary storage bucket access denied. Please check your Supabase configuration.'
      } else if (error.message.includes('not found')) {
        errorMessage = 'Temporary storage bucket not found. Please create the "temp-images" bucket in your Supabase dashboard.'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: error.message
        },
        { status: 500 }
      )
    }
    
    // Generate a signed URL that expires in 1 hour
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(TEMP_STORAGE_BUCKET)
      .createSignedUrl(filename, 3600) // 1 hour expiration
    
    if (signedUrlError || !signedUrlData) {
      console.error('Failed to create signed URL:', signedUrlError)
      return NextResponse.json(
        { error: 'Failed to create access URL for uploaded file' },
        { status: 500 }
      )
    }
    
    const { signedUrl } = signedUrlData
    
    return NextResponse.json({
      success: true,
      tempFilename: filename,
      signedUrl,
      size: file.size,
      type: file.type,
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    })
    
  } catch (error) {
    console.error('Temp upload error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
