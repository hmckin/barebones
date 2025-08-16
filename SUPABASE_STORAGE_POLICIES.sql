
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

-- Policy to allow public read access to all images
CREATE POLICY "Allow public read access to images" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'images');

-- Allow ANYONE (including anonymous users) to upload to temp-images
CREATE POLICY "Allow anyone to upload to temp-images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'temp-images');

-- Allow ANYONE to read from temp-images (needed for signed URLs to work)
CREATE POLICY "Allow anyone to read from temp-images" ON storage.objects
FOR SELECT USING (bucket_id = 'temp-images');

-- Allow authenticated users to delete from temp-images (for cleanup)
CREATE POLICY "Allow authenticated deletes from temp-images" ON storage.objects
FOR DELETE USING (bucket_id = 'temp-images' AND auth.role() = 'authenticated');

-- ============================================================================
-- DATABASE RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vote" ENABLE ROW LEVEL SECURITY;

-- Users Table Policies
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile" ON "User"
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Tickets Table Policies
CREATE POLICY "Users can view public tickets" ON "Ticket"
  FOR SELECT USING (hidden = false);

CREATE POLICY "Users can create own tickets" ON "Ticket"
  FOR INSERT WITH CHECK (auth.uid()::text = "authorId");

CREATE POLICY "Users can update own tickets" ON "Ticket"
  FOR UPDATE USING (auth.uid()::text = "authorId");

CREATE POLICY "System admins can view all tickets" ON "Ticket"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE "User".id = auth.uid()::text 
      AND "User".role = 'system_admin'
    )
  );

CREATE POLICY "System admins can update all tickets" ON "Ticket"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE "User".id = auth.uid()::text 
      AND "User".role = 'system_admin'
    )
  );

-- Comments Table Policies
CREATE POLICY "Users can view public comments" ON "Comment"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Ticket" 
      WHERE "Ticket".id = "Comment"."ticketId" 
      AND "Ticket".hidden = false
    )
  );

CREATE POLICY "Users can create comments on public tickets" ON "Comment"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Ticket" 
      WHERE "Ticket".id = "Comment"."ticketId" 
      AND "Ticket".hidden = false
    )
    AND auth.uid()::text = "authorId"
  );

CREATE POLICY "Users can update own comments" ON "Comment"
  FOR UPDATE USING (auth.uid()::text = "authorId");

CREATE POLICY "System admins can view all comments" ON "Comment"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE "User".id = auth.uid()::text 
      AND "User".role = 'system_admin'
    )
  );

-- Votes Table Policies
CREATE POLICY "Users can view votes on public tickets" ON "Vote"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Ticket" 
      WHERE "Ticket".id = "Vote"."ticketId" 
      AND "Ticket".hidden = false
    )
  );

CREATE POLICY "Users can vote on public tickets" ON "Vote"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Ticket" 
      WHERE "Ticket".id = "Vote"."ticketId" 
      AND "Ticket".hidden = false
    )
    AND auth.uid()::text = "userId"
  );

CREATE POLICY "Users can update own votes" ON "Vote"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own votes" ON "Vote"
  FOR DELETE USING (auth.uid()::text = "userId");

CREATE POLICY "System admins can view all votes" ON "Vote"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE "User".id = auth.uid()::text 
      AND "User".role = 'system_admin'
    )
  );
