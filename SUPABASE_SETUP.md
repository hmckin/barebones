# Supabase Storage Setup

## Quick Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project and wait for it to be ready

2. **Get Credentials**
   - Go to **Settings** → **API**
   - Copy **Project URL** and **anon public** key

3. **Add Environment Variables**
   - Create `.env.local` file with:
     ```
     DATABASE_URL=your_session_pooler
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Create Storage Bucket**
   - Go to **Storage** in dashboard
   - Create bucket named `images`
   - Set to **Public**

   - Go to **Storage** in dashboard
   - Create bucket named `temp-images`
   - Set to **Public**

5. **Add Storage Policy**
   - Run the SUPABASE_STORAGE_POLICIES.sql file in SQL editor

That's it! Restart your dev server and test uploading an image. 