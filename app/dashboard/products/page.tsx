'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit, Trash2, Tag } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Product = Database['public']['Tables']['products']['Row']

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      setProducts(products.filter((p) => p.id !== id))
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Product
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No products yet</p>
            <Link href="/dashboard/products/new">
              <Button>Create your first product</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-semibold">Product Name</th>
                <th className="px-4 py-3 text-left font-semibold">SKU</th>
                <th className="px-4 py-3 text-right font-semibold">Price</th>
                <th className="px-4 py-3 text-right font-semibold">Quantity</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.description && (
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {product.sku ? (
                      <span className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        {product.sku}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ${Number(product.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">{product.quantity}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <Link href={`/dashboard/products/${product.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
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
