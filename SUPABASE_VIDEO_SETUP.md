# Supabase Video Storage Setup

This guide will help you set up video storage in Supabase for the Medicly app.

## Prerequisites

- Supabase project created
- Environment variables configured in `.env.local`

## Setup Steps

### 1. Environment Variables

Create a `.env.local` file in the `frontend/` directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Create the Storage Bucket

**Option A: Via SQL (Recommended)**
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase_video_setup.sql`
3. Click **Run** to execute all the SQL commands

**Option B: Manual Creation (If SQL fails)**
If the SQL bucket creation fails, create it manually:
1. Go to **Storage** in your Supabase dashboard
2. Click **Create bucket**
3. Set:
   - **Name**: `patient_videos`
   - **Public**: `false` (private bucket)
   - **File size limit**: `100 MB`
   - **Allowed MIME types**: `video/mp4, video/avi, video/mov, video/quicktime, video/x-msvideo`

This will create:
- ✅ `patient_videos` storage bucket (private, 100MB limit)
- ✅ Row Level Security policies for video access
- ✅ `videos` table to track uploaded videos
- ✅ RPC functions: `upload_session_video`, `start_video_processing`, `update_video_status`, `get_video`

### 3. Verify Setup

After running the SQL, verify in your Supabase dashboard:

**Storage:**
- Go to **Storage** → You should see `patient_videos` bucket

**Database:**
- Go to **Database** → **Tables** → You should see `videos` table
- Go to **Database** → **Functions** → You should see the 4 RPC functions

### 4. Test the Setup

The video upload hook will now:

1. **Authenticate** the user
2. **Upload** video to `patient_videos` bucket in path: `{patientId}/sessions/{caseNumber}/...`
3. **Create record** in `videos` table via `upload_session_video()` RPC
4. **Update status** via `start_video_processing()` when processing begins

## Folder Structure

Videos are organized as:
```
patient_videos/
└── {patient_id}/
    ├── sessions/
    │   └── {case_number}/
    │       └── {timestamp}-{random_id}.mp4
    └── processed/
        └── {timestamp}-{random_id}.mp4
```

Example:
```
patient_videos/
└── 880e8f5c-faa2-42d2-95d8-e0e053962a14/
    ├── sessions/
    │   └── 80/
    │       └── 1704067200000-abc123.mp4
    └── processed/
        └── 1704067200000-def456.mp4
```

## Security

- **Private bucket**: Videos are not publicly accessible
- **Row Level Security**: Users can only access their own videos
- **Signed URLs**: Temporary access URLs for video playback (24h expiry)
- **User isolation**: Each user's videos are in separate folders

## Troubleshooting

### Common Issues:

1. **"Bucket not found"** → Make sure you ran the SQL setup
2. **"Permission denied"** → Check your RLS policies are applied
3. **"Function not found"** → Verify the RPC functions were created
4. **Upload fails** → Check file size (max 100MB) and type (video/* only)

### Debug Video Upload:

The `useSupabaseVideoUpload` hook includes a `testBucketAccess()` function you can call to verify:
- Bucket exists
- Permissions are correct
- Can list files

## Next Steps

Once this is working, you can:
- Add video processing status updates
- Implement video thumbnails
- Add video metadata tracking
- Set up automated cleanup of old videos 