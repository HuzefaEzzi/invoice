'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Download, Edit, ArrowLeft } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Invoice = Database['public']['Tables']['invoices']['Row']
type InvoiceItem = Database['public']['Tables']['invoice_items']['Row']
type Company = Database['public']['Tables']['companies']['Row']
type Customer = Database['public']['Tables']['customers']['Row']

interface InvoiceWithDetails extends Invoice {
  companies?: Company
  customers?: Customer
  invoice_items?: InvoiceItem[]
}

interface ViewInvoicePageProps {
  params: Promise<{
    id: string
  }>
}

export default function ViewInvoicePage({ params: paramsPromise }: ViewInvoicePageProps) {
  const { user } = useAuth()
  const [params, setParams] = useState<{ id: string } | null>(null)
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    paramsPromise.then(setParams)
  }, [paramsPromise])

  useEffect(() => {
    if (user && params) {
      fetchInvoice()
    }
  }, [user, params])

  const fetchInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, companies(*), customers(*), invoice_items(*)')
        .eq('id', params!.id)
        .single()

      if (error) throw error
      setInvoice(data)
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!invoice) {
    return <div className="p-8 text-center">Invoice not found</div>
  }

  const items = invoice.invoice_items || []
  // Total from line items only (no tax)
  const totalFromItems = items.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  return (
    <div className="p-4 md:p-8">
      <div className="flex gap-3 mb-6">
        <Link href="/dashboard/invoices">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
        <Button onClick={() => (window.location.href = `/api/invoices/${invoice.id}/pdf`)}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <Card>
        <CardContent className="pt-8">
          {/* Header */}
          <div className="mb-8 pb-8 border-b border-border">
            <div className="grid grid-cols-2 gap-8">
              <div className="flex gap-4 items-start">
                {invoice.companies?.logo_url && (
                  <div className="w-[200px] h-[200px] rounded-lg border border-border overflow-hidden bg-muted flex-shrink-0 print:block">
                    <img
                      src={invoice.companies.logo_url}
                      alt="Company logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold mb-2">{invoice.companies?.name}</h1>
                  <div className="text-sm text-muted-foreground space-y-1">
                  {invoice.companies?.address && <p>{invoice.companies.address}</p>}
                  {invoice.companies?.city && (
                    <p>
                      {invoice.companies.city}, {invoice.companies.state}{' '}
                      {invoice.companies.postal_code}
                    </p>
                  )}
                  {invoice.companies?.phone && <p>{invoice.companies.phone}</p>}
                </div>
                </div>
              </div>
              <div className="text-right">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="text-2xl font-bold">{invoice.invoice_number}</p>
                </div>
                <div className="print:hidden">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold capitalize">{invoice.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer and Dates */}
          <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-border">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Bill To</p>
              <p className="font-semibold">{invoice.customers?.name}</p>
              <div className="text-sm text-muted-foreground space-y-1 mt-2">
                {invoice.customers?.address && <p>{invoice.customers.address}</p>}
                {invoice.customers?.city && (
                  <p>
                    {invoice.customers.city}, {invoice.customers.state}{' '}
                    {invoice.customers.postal_code}
                  </p>
                )}
                {invoice.customers?.phone && <p>{invoice.customers.phone}</p>}
                {invoice.customers?.email && <p>{invoice.customers.email}</p>}
              </div>
            </div>
            <div className="text-right space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Issue Date</p>
                <p className="font-semibold">{new Date(invoice.issue_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-semibold">{new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 font-semibold">Description</th>
                  <th className="text-center py-3 font-semibold">Quantity</th>
                  <th className="text-right py-3 font-semibold">Unit Price</th>
                  <th className="text-right py-3 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3">{item.description}</td>
                    <td className="text-center py-3">{item.quantity}</td>
                    <td className="text-right py-3">₹{Number(item.unit_price).toFixed(2)}</td>
                    <td className="text-right py-3 font-medium">
                      ₹{Number(item.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes and Totals */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              {invoice.notes && (
                <div>
                  <p className="font-semibold text-sm mb-2">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between pt-3 border-t border-border font-bold text-lg">
                <span>Total:</span>
                <span>₹{totalFromItems.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
