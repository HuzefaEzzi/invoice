'use client'

import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PwaInstallButton } from '@/components/pwa-install-button'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <p className="text-lg">{user?.email}</p>
            </div>
            {user?.user_metadata?.full_name && (
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <p className="text-lg">{user.user_metadata.full_name}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">User ID</label>
              <p className="text-sm text-muted-foreground font-mono">{user?.id}</p>
            </div>
          </CardContent>
        </Card>

        {/* PWA Information */}
        <Card>
          <CardHeader>
            <CardTitle>Progressive Web App</CardTitle>
            <CardDescription>Install Invoice Manager on your device</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Invoice Manager is a Progressive Web App that can be installed on your mobile
              device or computer for offline access and native app-like experience.
            </p>
            <PwaInstallButton />
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card>
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
            <CardDescription>Manage your login session</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You can sign out of your account here. You'll need to log in again to access
              your invoices and data.
            </p>
            <Button onClick={handleSignOut} className="bg-destructive hover:bg-destructive/90">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>Invoice Manager PWA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Version: 1.0.0</p>
            <p>
              Invoice Manager is a professional invoicing application built with Next.js and
              Supabase.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
