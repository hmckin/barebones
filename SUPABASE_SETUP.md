# Supabase Storage Setup for Image Uploads

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready

## 2. Get Your Project Credentials

1. Go to your project dashboard
2. Navigate to **Settings** → **API**
3. Copy your **Project URL** and **anon public** key

## 3. Create Environment Variables

Create a `.env.local` file in your project root with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Create Storage Bucket

1. In your Supabase dashboard, go to **Storage**
2. Click **Create a new bucket**
3. Name it `images`
4. Set it to **Public** (so images can be viewed)
5. Click **Create bucket**

## 5. Set Storage Policies

In your `images` bucket, go to **Policies** and add:

**For INSERT (upload):**
```sql
(auth.role() = 'authenticated')
```

**For SELECT (view):**
```sql
(true)
```

## 6. Test the Setup

1. Restart your development server
2. Try uploading an image
3. Check that it appears in your Supabase Storage bucket

## Benefits of This Setup

✅ **Scalable**: Handles any number of images  
✅ **CDN**: Automatic global CDN distribution  
✅ **Secure**: Proper authentication and policies  
✅ **Cost-effective**: Pay only for what you use  
✅ **Reliable**: 99.9% uptime SLA  

## File Structure

- Images are stored in Supabase Storage bucket `images`
- URLs are generated as `/api/uploads?file=filename.jpg`
- The API redirects to Supabase's public URLs
- No local file storage needed 