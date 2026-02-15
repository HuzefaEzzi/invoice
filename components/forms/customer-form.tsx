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

type Customer = Database['public']['Tables']['customers']['Row']
type Company = Database['public']['Tables']['companies']['Row']

interface CustomerFormProps {
  customerId?: string
}

export function CustomerForm({ customerId }: CustomerFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [customer, setCustomer] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    tax_id: '',
    notes: '',
    company_id: '',
  })

  useEffect(() => {
    if (user) {
      fetchCompanies()
      if (customerId && customerId !== 'new') {
        fetchCustomer()
      }
    }
  }, [user, customerId])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user!.id)

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchCustomer = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()

      if (error) throw error
      setCustomer(data)
    } catch (error) {
      console.error('Error fetching customer:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (customerId && customerId !== 'new') {
        const { error } = await supabase
          .from('customers')
          .update(customer)
          .eq('id', customerId)

        if (error) throw error
      } else {
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer),
        })

        if (!response.ok) {
          throw new Error('Failed to create customer')
        }
      }

      router.push('/dashboard/customers')
    } catch (error) {
      console.error('Error saving customer:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{customerId ? 'Edit Customer' : 'New Customer'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Company *</label>
              <select
                value={customer.company_id || ''}
                onChange={(e) => setCustomer({ ...customer, company_id: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
                required
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name *</label>
                <Input
                  type="text"
                  value={customer.name || ''}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={customer.email || ''}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  type="tel"
                  value={customer.phone || ''}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tax ID</label>
                <Input
                  type="text"
                  value={customer.tax_id || ''}
                  onChange={(e) => setCustomer({ ...customer, tax_id: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <Input
                type="text"
                value={customer.address || ''}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <Input
                  type="text"
                  value={customer.city || ''}
                  onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <Input
                  type="text"
                  value={customer.state || ''}
                  onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Postal Code</label>
                <Input
                  type="text"
                  value={customer.postal_code || ''}
                  onChange={(e) => setCustomer({ ...customer, postal_code: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <Input
                type="text"
                value={customer.country || ''}
                onChange={(e) => setCustomer({ ...customer, country: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={customer.notes || ''}
                onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : customerId ? 'Update Customer' : 'Create Customer'}
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
