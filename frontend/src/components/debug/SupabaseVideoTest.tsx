'use client'

import React, { useRef } from 'react'
import { useSupabaseVideoUpload } from '@/hooks/useSupabaseVideoUpload'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/admin'

export function SupabaseVideoTest() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { 
    isUploading, 
    uploadProgress, 
    uploadError, 
    uploadedVideo,
    uploadVideo,
  } = useSupabaseVideoUpload()

  const handleTestConnection = async () => {
    console.log('🔌 Testing basic Supabase connection...')
    
    try {
      // Check environment variables first
      console.log('🔧 Environment variables:', {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'MISSING'
      })

      // Test basic auth
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('👤 Auth test:', { user: user?.email, error: authError })

      if (authError) {
        alert(`❌ Auth failed: ${authError.message}`)
        return
      }

      if (!user) {
        alert('❌ No user logged in')
        return
      }

      // Test storage connection
      console.log('📦 Testing storage connection...')
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        console.error('❌ Storage error:', bucketsError)
        alert(`❌ Storage test failed: ${bucketsError.message}`)
        return
      }

      console.log('✅ Available buckets:', buckets.map(b => b.name))
      
      // Check for patient_videos bucket
      const hasPatientVideos = buckets.some(b => b.name === 'patient_videos')
      
      alert(`✅ Connection successful!\nUser: ${user.email}\nBuckets: ${buckets.map(b => b.name).join(', ')}\npatient_videos exists: ${hasPatientVideos}`)
      
    } catch (error) {
      console.error('❌ Connection test failed:', error)
      alert(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div style={{ 
    }}>
      {isUploading && (
        <div style={{ marginBottom: '16px' }}>
          <div>Uploading: {uploadProgress}%</div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#e0e0e0', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${uploadProgress}%`, 
              height: '100%', 
              backgroundColor: '#0d4a2b',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {uploadError && (
        <div style={{ color: 'red', marginBottom: '16px' }}>
          Error: {uploadError}
        </div>
      )}

      {uploadedVideo && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: 'rgba(13, 74, 43, 0.1)', 
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <div><strong>✅ Upload Successful!</strong></div>
          <div>Video ID: {uploadedVideo.id}</div>
          <div>Filename: {uploadedVideo.filename}</div>
          <div>Size: {Math.round(uploadedVideo.size / 1024)} KB</div>
          <div>Storage Path: {uploadedVideo.storagePath}</div>
        </div>
      )}
    </div>
  )
} 