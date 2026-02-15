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

type Product = Database['public']['Tables']['products']['Row']
type Company = Database['public']['Tables']['companies']['Row']

interface ProductFormProps {
  productId?: string
}

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [product, setProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: '0.00',
    quantity: 0,
    sku: '',
    company_id: '',
  })

  useEffect(() => {
    if (user) {
      fetchCompanies()
      if (productId && productId !== 'new') {
        fetchProduct()
      }
    }
  }, [user, productId])

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

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error
      setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (productId && productId !== 'new') {
        const { error } = await supabase
          .from('products')
          .update(product)
          .eq('id', productId)

        if (error) throw error
      } else {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        })

        if (!response.ok) {
          throw new Error('Failed to create product')
        }
      }

      router.push('/dashboard/products')
    } catch (error) {
      console.error('Error saving product:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{productId ? 'Edit Product' : 'New Product'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Company *</label>
              <select
                value={product.company_id || ''}
                onChange={(e) => setProduct({ ...product, company_id: e.target.value })}
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

            <div>
              <label className="block text-sm font-medium mb-2">Product Name *</label>
              <Input
                type="text"
                value={product.name || ''}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={product.description || ''}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={product.price || '0.00'}
                  onChange={(e) => setProduct({ ...product, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <Input
                  type="number"
                  value={product.quantity || 0}
                  onChange={(e) => setProduct({ ...product, quantity: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SKU</label>
                <Input
                  type="text"
                  value={product.sku || ''}
                  onChange={(e) => setProduct({ ...product, sku: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : productId ? 'Update Product' : 'Create Product'}
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
