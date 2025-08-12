# System Administrators Setup

## Quick Setup

1. **Open Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Open your project

2. **Run the SQL Script**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"
   - Copy the contents of `SUPABASE_SYSTEM_ADMINS.sql`
   - **IMPORTANT**: Change the email and name in this line:
     ```sql
     INSERT INTO system_admins (email, name) 
     VALUES ('your-email@example.com', 'Your Name')
     ```
   - Paste and run the script

That's it! You're now a system administrator. 