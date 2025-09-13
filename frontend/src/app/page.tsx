'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/analyze')
  }, [router])

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="text-6xl mb-4">🔄</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Redirecting...</h1>
        <p className="text-gray-600">Taking you to the video analysis tool</p>
      </div>
    </div>
  )
}