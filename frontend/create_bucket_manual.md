# Manual Bucket Creation Guide

If the SQL automatic bucket creation doesn't work, follow these steps to create the `patient_videos` bucket manually in your Supabase dashboard.

## Step-by-Step Instructions

### 1. Access Supabase Dashboard
- Go to your Supabase project dashboard
- Navigate to **Storage** in the left sidebar

### 2. Create New Bucket
- Click the **"Create bucket"** button
- You'll see a form to configure the bucket

### 3. Configure Bucket Settings

**Basic Settings:**
- **Name**: `patient_videos` (exactly this name - the code expects this)
- **Public**: `false` (IMPORTANT: Keep this private for security)

**Advanced Settings:**
- **File size limit**: `100 MB` (or `104857600` bytes)
- **Allowed MIME types**: Add these one by one:
  - `video/mp4`
  - `video/avi` 
  - `video/mov`
  - `video/quicktime`
  - `video/x-msvideo`

### 4. Create the Bucket
- Click **"Create bucket"**
- You should see the `patient_videos` bucket appear in your storage list

### 5. Verify Creation
After creating the bucket:
- You should see it listed under **Storage**
- The bucket should show as **Private**
- File size limit should be **100 MB**

### 6. Continue with SQL Setup
After manually creating the bucket:
1. Go back to **SQL Editor**
2. Run the `supabase_video_setup.sql` file
3. The SQL will skip bucket creation (since it exists) and set up:
   - Storage policies
   - Videos table
   - RPC functions

## Troubleshooting

**If bucket creation fails:**
- Make sure you have Owner or Admin permissions on the Supabase project
- Check that the bucket name `patient_videos` is exactly correct
- Ensure you're in the correct Supabase project

**If you see "Bucket already exists" error:**
- That's fine! Just continue with the SQL setup
- The existing bucket will be used

## Verification

To verify everything is working:
1. The bucket should appear in **Storage**
2. After running the SQL, check **Database** → **Tables** for the `videos` table
3. Check **Database** → **Functions** for the RPC functions

The upload should now work properly with the manually created bucket! 