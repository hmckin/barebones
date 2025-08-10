import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { STORAGE_BUCKET } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to upload logo' },
        { status: 401 }
      )
    }
    
    // Check if user is admin (you can implement your own admin check logic)
    // For now, we'll allow any authenticated user to upload logo
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const redirectUrl = formData.get('redirectUrl') as string
    
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
    
    // Generate unique filename for logo
    const timestamp = Date.now()
    const filename = `logos/${timestamp}-${file.name}`
    
    console.log('Attempting to upload logo to:', filename)
    console.log('File size:', file.size, 'File type:', file.type)
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, file)
    
    if (error) {
      console.error('Supabase upload error:', error)
      console.error('Error details:', {
        message: error.message
      })
      
      let errorMessage = 'Failed to upload logo to storage'
      if (error.message.includes('policy')) {
        errorMessage = 'Storage policy violation. Please check your Supabase storage policies.'
      } else if (error.message.includes('bucket')) {
        errorMessage = 'Storage bucket access denied. Please check your Supabase configuration.'
      } else if (error.message.includes('not found')) {
        errorMessage = 'Storage bucket not found. Please create the "images" bucket in your Supabase dashboard.'
      } else if (error.message.includes('row level')) {
        errorMessage = 'Row level security policy violation. Please check your Supabase storage policies.'
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
    
    // Return logo data
    return NextResponse.json({
      success: true,
      logo: {
        url: publicUrl,
        redirectUrl: redirectUrl || undefined
      },
      filename,
      size: file.size,
      type: file.type
    })
    
  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 