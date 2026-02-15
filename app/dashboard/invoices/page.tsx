'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit, Trash2, Download, Eye } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Invoice = Database['public']['Tables']['invoices']['Row']
type Customer = Database['public']['Tables']['customers']['Row']

interface InvoiceWithCustomer extends Invoice {
  customers?: { name: string }
}

export default function InvoicesPage() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<InvoiceWithCustomer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchInvoices()
    }
  }, [user])

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, customers(name)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return

    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id)
      if (error) throw error
      setInvoices(invoices.filter((i) => i.id !== id))
    } catch (error) {
      console.error('Error deleting invoice:', error)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-muted text-muted-foreground'
      case 'sent':
        return 'bg-blue-100 text-blue-900'
      case 'paid':
        return 'bg-green-100 text-green-900'
      case 'overdue':
        return 'bg-red-100 text-red-900'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Invoices</h1>
          <p className="text-muted-foreground">Manage and create invoices</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No invoices yet</p>
            <Link href="/dashboard/invoices/new">
              <Button>Create your first invoice</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-semibold">Invoice #</th>
                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                <th className="px-4 py-3 text-left font-semibold">Issue Date</th>
                <th className="px-4 py-3 text-left font-semibold">Due Date</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{invoice.invoice_number}</td>
                  <td className="px-4 py-3">{invoice.customers?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm">{new Date(invoice.issue_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">{new Date(invoice.due_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    ${Number(invoice.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(invoice.status)}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <Link href={`/dashboard/invoices/${invoice.id}`}>
                        <Button variant="outline" size="sm" title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                        <Button variant="outline" size="sm" title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Download PDF"
                        onClick={() => window.location.href = `/api/invoices/${invoice.id}/pdf`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(invoice.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
