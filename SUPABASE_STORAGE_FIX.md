# Fixing Supabase Storage Issues for Image Uploads

## Current Problem
Your image uploads are failing because the `images` storage bucket doesn't exist in your Supabase project.

## Solution Steps

### 1. Create the Storage Bucket in Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `rilasokvrcteyqhdjsmq`
3. Navigate to **Storage** in the left sidebar
4. Click **Create a new bucket**
5. Set the following:
   - **Name**: `images`
   - **Public bucket**: ✅ Check this box
   - **File size limit**: 5MB (or your preferred limit)
6. Click **Create bucket**

### 2. Set Up Storage Policies

After creating the bucket, go to **Policies** tab and add these policies:

#### INSERT Policy (for uploading)
```sql
(auth.role() = 'authenticated')
```
- **Policy name**: `Allow authenticated users to upload images`
- **Target roles**: `authenticated`
- **Using expression**: `(auth.role() = 'authenticated')`

#### SELECT Policy (for viewing)
```sql
(true)
```
- **Policy name**: `Allow public access to view images`
- **Target roles**: `public`
- **Using expression**: `(true)`

### 3. Test the Setup

Run the test script to verify everything is working:
```bash
node test-supabase.js
```

You should see:
```
✅ Images bucket found!
✅ Bucket policies are working correctly
```

### 4. Alternative: Use Public Bucket (Simpler)

If you want to skip policies for now, you can:
1. Make the bucket public
2. Remove the authentication requirement from the uploads API temporarily

## Common Issues & Solutions

### Issue: "Bucket not found"
- **Solution**: Create the `images` bucket as described above

### Issue: "Policy violation"
- **Solution**: Set up the storage policies correctly

### Issue: "Unauthorized" error
- **Solution**: Make sure users are signed in before uploading

### Issue: "File too large"
- **Solution**: Check the file size limit in your bucket settings

## Testing Your Fix

1. Create the bucket and policies in Supabase
2. Restart your development server
3. Try uploading an image through the create post form
4. Check the browser console for any errors
5. Verify the image appears in your Supabase Storage dashboard

## Next Steps After Fix

Once storage is working:
1. Add proper error handling and user feedback
2. Implement image compression/resizing
3. Add file type validation
4. Set up image cleanup for unused files
5. Add progress indicators for uploads

## Need Help?

If you're still having issues after following these steps:
1. Check the browser console for specific error messages
2. Verify your Supabase project URL and key are correct
3. Ensure your Supabase session is working properly
4. Check the Network tab in browser dev tools for API errors 