'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, Users, Package, Building2 } from 'lucide-react'

interface DashboardStats {
  invoices: number
  customers: number
  products: number
  companies: number
  totalRevenue: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    invoices: 0,
    customers: 0,
    products: 0,
    companies: 0,
    totalRevenue: '$0.00',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const [invoices, customers, products, companies] = await Promise.all([
        supabase.from('invoices').select('id', { count: 'exact' }).eq('user_id', user!.id),
        supabase.from('customers').select('id', { count: 'exact' }).eq('user_id', user!.id),
        supabase.from('products').select('id', { count: 'exact' }).eq('user_id', user!.id),
        supabase.from('companies').select('id', { count: 'exact' }).eq('user_id', user!.id),
      ])

      setStats({
        invoices: invoices.count || 0,
        customers: customers.count || 0,
        products: products.count || 0,
        companies: companies.count || 0,
        totalRevenue: '$0.00',
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    href,
  }: {
    title: string
    value: string | number
    icon: React.ReactNode
    href: string
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <Link href={href} className="text-xs text-primary hover:underline mt-2 inline-block">
          View →
        </Link>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Invoices"
          value={stats.invoices}
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          href="/dashboard/invoices"
        />
        <StatCard
          title="Customers"
          value={stats.customers}
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          href="/dashboard/customers"
        />
        <StatCard
          title="Products"
          value={stats.products}
          icon={<Package className="h-5 w-5 text-muted-foreground" />}
          href="/dashboard/products"
        />
        <StatCard
          title="Companies"
          value={stats.companies}
          icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
          href="/dashboard/companies"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Create new items quickly from here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/dashboard/invoices/new">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <FileText className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </Link>
            <Link href="/dashboard/customers/new">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Users className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </Link>
            <Link href="/dashboard/products/new">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Package className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </Link>
            <Link href="/dashboard/companies/new">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Building2 className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
