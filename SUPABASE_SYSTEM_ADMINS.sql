-- Create the system_admins table
CREATE TABLE IF NOT EXISTS system_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE system_admins ENABLE ROW LEVEL SECURITY;

-- Create working RLS policies
-- Allow authenticated users to read (needed for admin checks)
CREATE POLICY "Allow authenticated users to read system admins" ON system_admins
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow existing admins to insert new admins
CREATE POLICY "Allow admins to insert new admins" ON system_admins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_admins 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Allow existing admins to update other admins
CREATE POLICY "Allow admins to update other admins" ON system_admins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM system_admins 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Allow existing admins to delete other admins
CREATE POLICY "Allow admins to delete other admins" ON system_admins
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM system_admins 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_admins_updated_at 
  BEFORE UPDATE ON system_admins 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial system administrator (replace with your email)
INSERT INTO system_admins (email, name) 
VALUES ('harrymckinney97@gmail.com', 'Harry McKinney')
ON CONFLICT (email) DO NOTHING;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_system_admins_email ON system_admins(email); 