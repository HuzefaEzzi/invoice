'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Building2,
  Users,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/invoices', label: 'Invoices', icon: FileText },
    { href: '/dashboard/customers', label: 'Customers', icon: Users },
    { href: '/dashboard/products', label: 'Products', icon: Package },
    { href: '/dashboard/companies', label: 'Companies', icon: Building2 },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative top-0 left-0 h-screen w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <Link href="/dashboard" className="mb-8 flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">InvoiceHub</span>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Sign Out */}
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full justify-start gap-3 bg-transparent"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
