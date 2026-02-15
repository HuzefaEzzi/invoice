import { ProductForm } from '@/components/forms/product-form'

export default function NewProductPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">New Product</h1>
        <p className="text-muted-foreground">Add a new product to your catalog</p>
      </div>
      <ProductForm />
    </div>
  )
}
