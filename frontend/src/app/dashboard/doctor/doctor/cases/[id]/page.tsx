'use client'

import { useParams } from 'next/navigation'

export default function CaseReviewRoute() {
  const params = useParams()
  const id = params?.id as string

  return (
    <div style={{ 
      flex: 1,
      backgroundColor: 'hsl(var(--background))',
      padding: '16px 12px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: 'hsl(var(--foreground))',
          marginBottom: '16px'
        }}>
          Case Review: {id}
        </h1>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>
          Patient case review functionality coming soon...
        </p>
      </div>
    </div>
  )
}


