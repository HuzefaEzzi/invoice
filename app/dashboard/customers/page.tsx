'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit, Trash2, Mail, Phone } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Customer = Database['public']['Tables']['customers']['Row']

export default function CustomersPage() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCustomers()
    }
  }, [user])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
      setCustomers(customers.filter((c) => c.id !== id))
    } catch (error) {
      console.error('Error deleting customer:', error)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Customers</h1>
          <p className="text-muted-foreground">Manage your customers</p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Customer
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No customers yet</p>
            <Link href="/dashboard/customers/new">
              <Button>Create your first customer</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <Card key={customer.id}>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-3">{customer.name}</h3>
                <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${customer.email}`} className="hover:text-foreground">
                        {customer.email}
                      </a>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${customer.phone}`} className="hover:text-foreground">
                        {customer.phone}
                      </a>
                    </div>
                  )}
                  {customer.address && <p>📍 {customer.address}</p>}
                  {customer.city && <p>{customer.city}, {customer.state}</p>}
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/customers/${customer.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(customer.id)}
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
