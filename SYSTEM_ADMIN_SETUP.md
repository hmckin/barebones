# System Administrators Setup Guide

This guide will help you set up the production-ready system administrators feature using Supabase.

## 🗄️ Database Setup

### 1. Create the System Admins Table

1. **Go to your Supabase Dashboard**
   - Navigate to [supabase.com](https://supabase.com)
   - Open your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Setup Script**
   - Copy the contents of `SUPABASE_SYSTEM_ADMINS.sql`
   - **IMPORTANT**: Replace `'your-email@example.com'` with your actual email address
   - Paste and run the script

4. **Verify the Table**
   - Go to "Table Editor" in the left sidebar
   - You should see a new `system_admins` table
   - It should contain your email as the first system administrator

### 2. Table Structure

The `system_admins` table contains:
- `id`: Unique identifier (UUID)
- `email`: Email address (unique, required)
- `name`: Display name (optional)
- `created_at`: When the admin was added
- `updated_at`: When the admin was last updated

## 🔐 Security Features

### Row Level Security (RLS)
- **Enabled by default** on the `system_admins` table
- **Only system administrators** can view, add, edit, or delete other administrators
- **Self-service protection**: You cannot remove yourself if you're the last admin

### API Security
- **Authentication required**: All endpoints require a valid Supabase session
- **Authorization required**: Only system administrators can access admin endpoints
- **Input validation**: Email addresses are validated and sanitized

## 🚀 API Endpoints

### GET `/api/admin/system-admins`
- **Purpose**: List all system administrators
- **Access**: System administrators only
- **Response**: Array of admin users

### POST `/api/admin/system-admins`
- **Purpose**: Add a new system administrator
- **Access**: System administrators only
- **Body**: `{ "email": "user@example.com", "name": "User Name" }`
- **Response**: New admin user data

### DELETE `/api/admin/system-admins/[id]`
- **Purpose**: Remove a system administrator
- **Access**: System administrators only
- **Response**: Success message

## 🎯 How to Use

### 1. First Time Setup
1. **Run the SQL script** in Supabase (see Database Setup above)
2. **Sign in** to your application with the email you added
3. **Click your profile button** (user icon) in the top right
4. **Click "System Administration"** - you should now see this option!

### 2. Adding More Administrators
1. **Open System Administration** from your profile
2. **Go to "Admin Users" tab**
3. **Enter the email address** of the new administrator
4. **Click "Add Admin"**
5. **The user will now see** the System Administration option

### 3. Removing Administrators
1. **Open System Administration**
2. **Go to "Admin Users" tab**
3. **Click "Remove"** next to the administrator you want to remove
4. **Confirm the action**

## 🛡️ Security Best Practices

### 1. Initial Setup
- **Use a strong email** for your first admin account
- **Don't share admin access** with untrusted users
- **Consider using a dedicated admin email** for production

### 2. Ongoing Management
- **Regularly review** your system administrators list
- **Remove access** for users who no longer need it
- **Monitor admin actions** through Supabase logs

### 3. Backup
- **Export your system admins** list periodically
- **Keep a record** of who has admin access
- **Test the setup** in a staging environment first

## 🔧 Troubleshooting

### Common Issues

#### "System Administration option not visible"
- **Check**: Are you signed in with an email that's in the `system_admins` table?
- **Solution**: Add your email to the table using the SQL script

#### "Forbidden - System administrator access required"
- **Check**: Is your email in the `system_admins` table?
- **Solution**: Add yourself as an admin or contact an existing admin

#### "Cannot remove the last system administrator"
- **Check**: Are you trying to remove the only admin?
- **Solution**: Add another admin first, then remove the current one

#### API errors (500, 401, 403)
- **Check**: Supabase connection and authentication
- **Check**: RLS policies are properly set
- **Check**: User session is valid

### Debug Steps
1. **Check Supabase logs** for detailed error messages
2. **Verify RLS policies** are enabled and correct
3. **Test authentication** with a simple query
4. **Check browser console** for client-side errors

## 📝 Migration from localStorage

If you were using the previous localStorage-based system:

1. **Your existing admins** will need to be re-added to the database
2. **The new system** will automatically load from the API
3. **No data loss** - the old localStorage data remains until cleared

## 🎉 What's Next?

With the system administrators feature now production-ready:

1. **Test thoroughly** in your development environment
2. **Deploy to staging** and verify functionality
3. **Add your team members** as system administrators
4. **Monitor usage** and adjust policies as needed
5. **Consider adding audit logs** for admin actions

## 🆘 Need Help?

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Review Supabase logs** for detailed error messages
3. **Verify your database setup** matches the SQL script
4. **Test with a simple admin user** first

---

**Note**: This system is now production-ready and uses proper database-backed authentication and authorization. The localStorage fallback has been removed in favor of secure API endpoints. 