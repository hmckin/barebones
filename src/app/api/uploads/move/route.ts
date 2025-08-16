import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { STORAGE_BUCKET, TEMP_STORAGE_BUCKET } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to move images' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { tempFilename, originalName, originalType } = body
    
    if (!tempFilename) {
      return NextResponse.json(
        { error: 'Temporary filename is required' },
        { status: 400 }
      )
    }
    
    // Generate permanent filename with user ID
    const timestamp = Date.now()
    const userId = user.id
    const permanentFilename = `${userId}/${timestamp}-${originalName || 'image'}`
    
    // Download file from temp storage
    const { data: tempFile, error: downloadError } = await supabase.storage
      .from(TEMP_STORAGE_BUCKET)
      .download(tempFilename)
    
    if (downloadError) {
      console.error('Failed to download temp file:', downloadError)
      return NextResponse.json(
        { error: 'Failed to access temporary file' },
        { status: 500 }
      )
    }
    
    // Upload to permanent storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(permanentFilename, tempFile, {
        contentType: originalType || 'image/jpeg'
      })
    
    if (uploadError) {
      console.error('Failed to upload to permanent storage:', uploadError)
      return NextResponse.json(
        { error: 'Failed to move file to permanent storage' },
        { status: 500 }
      )
    }
    
    // Delete from temp storage
    const { error: deleteError } = await supabase.storage
      .from(TEMP_STORAGE_BUCKET)
      .remove([tempFilename])
    
    if (deleteError) {
      console.error('Failed to delete temp file:', deleteError)
      // Don't fail the request if temp cleanup fails
    }
    
    // Get public URL for permanent file
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(permanentFilename)
    
    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      filename: permanentFilename,
      publicUrl
    })
    
  } catch (error) {
    console.error('Move file error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
