
-- Policy to allow authenticated users to upload images to the images bucket
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow authenticated users to upload logos to the logos folder
CREATE POLICY "Allow authenticated users to upload logos" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = 'logos'
);

-- Policy to allow authenticated users to view their own uploaded images
CREATE POLICY "Allow authenticated users to view their own images" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow authenticated users to update their own uploaded images
CREATE POLICY "Allow authenticated users to update their own images" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow authenticated users to delete their own uploaded images
CREATE POLICY "Allow authenticated users to delete their own images" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow public read access to all images (optional - remove if you want private images)
CREATE POLICY "Allow public read access to images" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'images');

-- Policy to allow public read access to logos specifically
CREATE POLICY "Allow public read access to logos" ON storage.objects
FOR SELECT 
TO public
USING (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] = 'logos'
);

-- Allow ANYONE (including anonymous users) to upload to temp-images
CREATE POLICY "Allow anyone to upload to temp-images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'temp-images');

-- Allow ANYONE to read from temp-images (needed for signed URLs to work)
CREATE POLICY "Allow anyone to read from temp-images" ON storage.objects
FOR SELECT USING (bucket_id = 'temp-images');

-- Allow authenticated users to delete from temp-images (for cleanup)
CREATE POLICY "Allow authenticated deletes from temp-images" ON storage.objects
FOR DELETE USING (bucket_id = 'temp-images' AND auth.role() = 'authenticated');