#!/bin/bash

echo "🔧 Setting up environment variables..."

# Create frontend .env file
cat > frontend/.env << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://psvrdfyhfctfdpuduknb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzdnJkZnloZmN0ZmRwdWR1a25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NzY3ODYsImV4cCI6MjA3MzA1Mjc4Nn0.kvJms2m3S9rTcWOUxT-Mkt-MJYaBivcxRq2-vi5FUDQ
EOF

echo "✅ Frontend .env file created"

# Check if Docker is running
if docker info > /dev/null 2>&1; then
    echo "✅ Docker is running"
    echo "🚀 You can now run: supabase start"
else
    echo "❌ Docker is not running"
    echo "📋 Please start Docker Desktop first, then run: supabase start"
fi

echo ""
echo "📝 Next steps:"
echo "1. Start Docker Desktop if not running"
echo "2. Run: supabase start"
echo "3. Set up the patient_videos bucket in Supabase"
echo "4. Test your video upload!" 