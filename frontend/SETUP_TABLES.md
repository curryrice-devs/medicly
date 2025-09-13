# Database Setup Instructions

## Setting Up Sessions and Treatments Tables

The application requires `sessions` and `treatments` tables to work properly. Follow these steps:

### 1. Go to Supabase SQL Editor
1. Open your Supabase project dashboard
2. Navigate to the SQL Editor (in the left sidebar)

### 2. Run the Setup Script
1. Copy the contents of `setup_tables.sql`
2. Paste it into the SQL editor
3. Click "Run" to execute

### 3. Verify Tables Were Created
1. Go to Table Editor in Supabase
2. You should see:
   - `treatments` table with sample exercises
   - `sessions` table (initially empty)

### 4. Check Browser Console
After running the SQL script, refresh your app and check the browser console for:
- `✅ Fetched treatments:` - Should show the sample treatments
- `✅ Fetched sessions:` - Will be empty initially

### Troubleshooting

If the dashboard is still loading:
1. Check browser console for errors
2. Verify you're logged in (check for user email in console logs)
3. Make sure RLS policies were created correctly
4. Try logging out and back in

### Creating Your First Session
1. Select an exercise from the dropdown
2. Click "Create Session"
3. The new session will appear in "Active Sessions" 