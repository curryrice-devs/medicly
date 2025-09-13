'use client'

import React, { useRef } from 'react'
import { useSupabaseVideoUpload } from '@/hooks/useSupabaseVideoUpload'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export function SupabaseVideoTest() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { 
    isUploading, 
    uploadProgress, 
    uploadError, 
    uploadedVideo,
    uploadVideo,
    testBucketAccess 
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

  const handleTestBucket = async () => {
    console.log('🧪 Testing Supabase bucket access...')
    const result = await testBucketAccess()
    console.log('📊 Detailed test result:', result)
    
    if (result.success) {
      alert(`✅ Bucket test successful!\nBuckets: ${result.buckets?.map(b => b.name).join(', ')}\nFiles: ${result.files?.length || 0}`)
    } else {
      console.error('❌ Bucket test error details:', result)
      alert(`❌ Bucket test failed: ${result.error}`)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      console.log('📁 Selected file:', file.name, file.size, file.type)
      console.log('🔧 Upload state before:', { isUploading, uploadProgress, uploadError })
      
      await uploadVideo(file)
      
      console.log('🔧 Upload state after:', { isUploading, uploadProgress, uploadError, uploadedVideo })
      alert('✅ Upload successful!')
    } catch (error) {
      console.error('❌ Upload failed:', error)
      console.log('🔧 Final upload state:', { isUploading, uploadProgress, uploadError, uploadedVideo })
      alert(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #0d4a2b', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: 'rgba(13, 74, 43, 0.05)'
    }}>
      <h3 style={{ color: '#0d4a2b', marginBottom: '16px' }}>🧪 Supabase Video Upload Test</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <Button onClick={handleTestConnection} style={{ marginRight: '10px' }}>
          Test Connection
        </Button>
        
        <Button onClick={handleTestBucket} style={{ marginRight: '10px' }}>
          Test Bucket Access
        </Button>
        
        <Button onClick={() => fileInputRef.current?.click()}>
          Test Video Upload
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

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

      <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '16px' }}>
        <strong>Instructions:</strong>
        <ol>
          <li>First click "Test Bucket Access" to verify Supabase connection</li>
          <li>Check browser console for detailed logs</li>
          <li>Then try "Test Video Upload" with a small video file</li>
          <li>Monitor console for upload progress and errors</li>
        </ol>
      </div>
    </div>
  )
} 