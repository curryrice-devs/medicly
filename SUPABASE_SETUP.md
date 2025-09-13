# Medicly Supabase Setup Guide

This guide will help you set up Supabase for the medicly application with video storage, user management, and session tracking.

## 📋 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **New Supabase Project**: Create a new project in your Supabase dashboard

## 🗃️ Database Setup

Run the following SQL files in order in your Supabase SQL Editor:

### 1. Create Database Schema

```bash
# Run these files in your Supabase SQL Editor in this order:
1. supabase/migrations/01_create_users_table.sql
2. supabase/migrations/02_create_sessions_table.sql  
3. supabase/migrations/03_create_session_videos_table.sql
4. supabase/migrations/04_create_tasks_table.sql
5. supabase/migrations/05_create_session_history_table.sql
6. supabase/migrations/06_create_patient_videos_bucket.sql
7. supabase/migrations/07_seed_data.sql
8. supabase/migrations/08_create_api_functions.sql
```

### 2. Environment Variables

Create a `.env.local` file in your frontend directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application Configuration  
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
```

## 🔑 Getting Your Supabase Keys

1. Go to your Supabase project dashboard
2. Navigate to **Settings → API**
3. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

## 📦 Storage Setup

The `patient-videos` bucket will be automatically created when you run the migration files. This bucket:

- **Private**: Secure video storage with RLS policies
- **100MB Limit**: Prevents oversized uploads
- **Video Types**: Supports MP4, AVI, MOV formats
- **Organized Paths**: Videos stored in session-specific folders

## 🏗️ Database Schema Overview

### Tables Created:

1. **`users`** - User profiles and authentication data
2. **`sessions`** - Therapy sessions between patients and doctors
3. **`session_videos`** - Video uploads with processing status
4. **`tasks`** - Upcoming tasks and reminders
5. **`session_history`** - Activity timeline for each session

### Key Features:

- **Row Level Security (RLS)**: Secure data access
- **Automatic Triggers**: Progress calculation, history tracking
- **API Functions**: Session management, video processing
- **Storage Integration**: Secure video bucket with policies

## 🔐 Security Features

- **RLS Policies**: Users can only access their own data
- **Doctor Access**: Doctors can view patient data from their sessions
- **Secure Storage**: Private video bucket with access controls
- **Automatic Cleanup**: Orphaned file cleanup functions

## 🎯 Demo Data

After running the seed data migration, you'll have:

- **Demo Users**: `patient@demo.com` and `doctor@demo.com`
- **Sample Sessions**: Shoulder Rehab, Lower Back, Knee Recovery
- **Test Tasks**: Upload videos, assessments, appointments
- **Session History**: Sample activity timeline

## 🚀 Testing the Setup

1. **Run Migrations**: Execute all SQL files in order
2. **Set Environment Variables**: Add your Supabase keys
3. **Test Authentication**: Try logging in with demo accounts
4. **Upload Videos**: Test video upload to patient-videos bucket
5. **Check Database**: Verify data is created correctly

## 🔗 Frontend Integration

The frontend is already set up to use Supabase with:

- **`useSupabaseVideoUpload`** hook for video uploads
- **Authentication context** for user management
- **Session management** with real-time updates
- **Task tracking** with database integration

## 📊 API Endpoints Available

- `get_user_sessions()` - Get user's therapy sessions
- `get_user_tasks()` - Get pending tasks
- `upload_session_video()` - Upload video to session
- `create_session()` - Create new therapy session
- `add_session_history()` - Add activity to session timeline

## 🛠️ Development Workflow

1. **Start Supabase**: Your project is live after setup
2. **Run Frontend**: `npm run dev` in frontend directory
3. **Run Backend**: `python run.py` in backend directory
4. **Test Features**: Upload videos, create sessions, track progress

## 🔧 Troubleshooting

- **RLS Errors**: Check that users are properly authenticated
- **Upload Failures**: Verify bucket permissions and file size limits
- **Missing Data**: Ensure all migration files ran successfully
- **CORS Issues**: Check Supabase CORS settings for your domain

Your medicly application is now ready with a full Supabase backend! 🏥 