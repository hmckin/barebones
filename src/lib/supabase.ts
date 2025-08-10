import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side Supabase client (using SSR-compatible client)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Client component Supabase client (with auth)
export const createClientSupabase = () => createBrowserClient(supabaseUrl, supabaseAnonKey)

// Storage bucket name for images
export const STORAGE_BUCKET = 'images' 