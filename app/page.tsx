'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AuthProvider } from '@/lib/auth-context'

function RootContent() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/auth/login')
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Invoice Manager</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default function Root() {
  return (
    <AuthProvider>
      <RootContent />
    </AuthProvider>
  )
}
