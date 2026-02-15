'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Company = Database['public']['Tables']['companies']['Row']

export default function CompaniesPage() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCompanies()
    }
  }, [user])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return

    try {
      const { error } = await supabase.from('companies').delete().eq('id', id)
      if (error) throw error
      setCompanies(companies.filter((c) => c.id !== id))
    } catch (error) {
      console.error('Error deleting company:', error)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Companies</h1>
          <p className="text-muted-foreground">Manage your business companies</p>
        </div>
        <Link href="/dashboard/companies/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Company
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : companies.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No companies yet</p>
            <Link href="/dashboard/companies/new">
              <Button>Create your first company</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardHeader>
                <CardTitle className="text-lg">{company.name}</CardTitle>
                <CardDescription>{company.email || 'No email'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  {company.phone && <p>Phone: {company.phone}</p>}
                  {company.address && <p>Address: {company.address}</p>}
                  {company.city && <p>City: {company.city}</p>}
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/companies/${company.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(company.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
