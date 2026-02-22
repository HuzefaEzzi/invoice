'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Invoice = Database['public']['Tables']['invoices']['Row']
type InvoiceItem = Database['public']['Tables']['invoice_items']['Row']
type Company = Database['public']['Tables']['companies']['Row']
type Customer = Database['public']['Tables']['customers']['Row']
type Product = Database['public']['Tables']['products']['Row']

interface InvoiceFormProps {
  invoiceId?: string
}

interface LineItem extends Partial<InvoiceItem> {
  tempId: string
}

export function InvoiceForm({ invoiceId }: InvoiceFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    invoice_number: '',
    company_id: '',
    customer_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    notes: '',
    subtotal: '0',
    tax: '0',
    total: '0',
  })

  useEffect(() => {
    if (user) {
      fetchCompanies()
      if (invoiceId && invoiceId !== 'new') {
        fetchInvoice()
      } else {
        fetchNextInvoiceNumber()
      }
    }
  }, [user, invoiceId])

  const fetchNextInvoiceNumber = async () => {
    try {
      const res = await fetch('/api/invoices/next-number')
      if (res.ok) {
        const { nextNumber } = await res.json()
        setInvoice((prev) => ({ ...prev, invoice_number: nextNumber }))
      }
    } catch (e) {
      console.error('Error fetching next invoice number:', e)
    }
  }

  useEffect(() => {
    if (invoice.company_id) {
      fetchCustomers(invoice.company_id)
      fetchProducts(invoice.company_id)
    }
  }, [invoice.company_id])

  useEffect(() => {
    calculateTotals()
  }, [lineItems])

  const fetchCompanies = async () => {
    try {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user!.id)

      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchCustomers = async (companyId: string) => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', companyId)

      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchProducts = async (companyId: string) => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', companyId)

      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchInvoice = async () => {
    try {
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single()

      if (invoiceData) {
        setInvoice(invoiceData)
      }

      const { data: itemsData } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)

      if (itemsData) {
        setLineItems(itemsData.map((item) => ({ ...item, tempId: item.id })))
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    }
  }

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const total = subtotal

    setInvoice((prev) => ({
      ...prev,
      subtotal: subtotal.toString(),
      tax: '0',
      total: total.toString(),
    }))
  }

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        tempId: Date.now().toString(),
        product_id: null,
        description: '',
        quantity: '1',
        unit_price: '0',
        amount: '0',
      },
    ])
  }

  const updateLineItem = (tempId: string, field: string, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.tempId !== tempId) return item
        const updated = { ...item, [field]: value }
        if (field === 'product_id') {
          const product = products.find((p) => p.id === value)
          if (product) {
            updated.description = product.name
            updated.unit_price = product.price
          } else {
            updated.description = ''
            updated.unit_price = '0'
          }
        }
        if (field === 'quantity' || field === 'unit_price' || field === 'product_id') {
          updated.amount = (Number(updated.quantity) * Number(updated.unit_price)).toString()
        }
        return updated
      })
    )
  }

  const removeLineItem = (tempId: string) => {
    setLineItems(lineItems.filter((item) => item.tempId !== tempId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (invoiceId && invoiceId !== 'new') {
        const { error } = await supabase
          .from('invoices')
          .update(invoice)
          .eq('id', invoiceId)

        if (error) throw error
      } else {
        const response = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...invoice,
            items: lineItems.map((item) => ({
              product_id: item.product_id || null,
              description: item.description || '',
              quantity: item.quantity,
              unit_price: item.unit_price,
            })),
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create invoice')
        }
      }

      router.push('/dashboard/invoices')
    } catch (error) {
      console.error('Error saving invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{invoiceId ? 'Edit Invoice' : 'New Invoice'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Invoice Number *</label>
                <Input
                  type="text"
                  value={invoice.invoice_number || ''}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company *</label>
                <select
                  value={invoice.company_id || ''}
                  onChange={(e) => setInvoice({ ...invoice, company_id: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md"
                  required
                >
                  <option value="">Select company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Customer *</label>
                <select
                  value={invoice.customer_id || ''}
                  onChange={(e) => setInvoice({ ...invoice, customer_id: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md"
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Issue Date *</label>
                <Input
                  type="date"
                  value={invoice.issue_date || ''}
                  onChange={(e) => setInvoice({ ...invoice, issue_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Due Date *</label>
                <Input
                  type="date"
                  value={invoice.due_date || ''}
                  onChange={(e) => setInvoice({ ...invoice, due_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={invoice.status || ''}
                  onChange={(e) => setInvoice({ ...invoice, status: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            {/* Line Items */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Line Items</h3>
              <div className="space-y-3">
                {lineItems.map((item) => (
                  <div key={item.tempId} className="flex gap-2 items-end">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs mb-1">Product</label>
                      <select
                        value={item.product_id || ''}
                        onChange={(e) =>
                          updateLineItem(item.tempId, 'product_id', e.target.value || null)
                        }
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — ₹{Number(p.price).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-20">
                      <label className="block text-xs mb-1">Qty</label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity || '1'}
                        onChange={(e) =>
                          updateLineItem(item.tempId, 'quantity', e.target.value)
                        }
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs mb-1">Amount</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.amount || '0'}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeLineItem(item.tempId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={addLineItem} className="mt-4 bg-transparent">
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full md:w-64 space-y-3">
                <div className="flex justify-between py-3 border-t-2 border-border font-bold text-lg">
                  <span>Total:</span>
                  <span>₹{Number(invoice.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={invoice.notes || ''}
                onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : invoiceId ? 'Update Invoice' : 'Create Invoice'}
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
