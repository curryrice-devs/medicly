// Configuration for the Medicly app
export const config = {
  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  
  // Backend API
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
  },
  
  // File upload limits
  upload: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedVideoTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo'],
  },
  
  // Video processing
  processing: {
    pollInterval: 2000, // 2 seconds
    signedUrlExpiry: 60 * 60 * 24, // 24 hours
    processingUrlExpiry: 60 * 60, // 1 hour
  }
};

// Helper function to validate environment variables
export function validateConfig() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
} 