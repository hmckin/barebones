
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

-- If you want to allow anonymous users to view images, uncomment this:
-- CREATE POLICY "Allow anonymous users to view images" ON storage.objects
-- FOR SELECT 
-- TO anon
-- USING (bucket_id = 'images'); 