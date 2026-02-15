'use client'

import React from "react"
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'

export default function RootLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AuthProvider>
      {children}
      <Analytics />
    </AuthProvider>
  )
}
