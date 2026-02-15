'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Database } from '@/lib/supabase'

type Company = Database['public']['Tables']['companies']['Row']

interface CompanyFormProps {
  companyId?: string
}

export function CompanyForm({ companyId }: CompanyFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [company, setCompany] = useState<Partial<Company>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    tax_id: '',
  })

  useEffect(() => {
    if (companyId && companyId !== 'new') {
      fetchCompany()
    }
  }, [companyId])

  const fetchCompany = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single()

      if (error) throw error
      setCompany(data)
    } catch (error) {
      console.error('Error fetching company:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (companyId && companyId !== 'new') {
        const { error } = await supabase
          .from('companies')
          .update(company)
          .eq('id', companyId)

        if (error) throw error
      } else {
        const response = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(company),
        })

        if (!response.ok) {
          throw new Error('Failed to create company')
        }
      }

      router.push('/dashboard/companies')
    } catch (error) {
      console.error('Error saving company:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{companyId ? 'Edit Company' : 'New Company'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name *</label>
                <Input
                  type="text"
                  value={company.name || ''}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={company.email || ''}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  type="tel"
                  value={company.phone || ''}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tax ID</label>
                <Input
                  type="text"
                  value={company.tax_id || ''}
                  onChange={(e) => setCompany({ ...company, tax_id: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <Input
                type="text"
                value={company.address || ''}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <Input
                  type="text"
                  value={company.city || ''}
                  onChange={(e) => setCompany({ ...company, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <Input
                  type="text"
                  value={company.state || ''}
                  onChange={(e) => setCompany({ ...company, state: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Postal Code</label>
                <Input
                  type="text"
                  value={company.postal_code || ''}
                  onChange={(e) => setCompany({ ...company, postal_code: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <Input
                type="text"
                value={company.country || ''}
                onChange={(e) => setCompany({ ...company, country: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : companyId ? 'Update Company' : 'Create Company'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
