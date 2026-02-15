import { ProductForm } from '@/components/forms/product-form'

interface EditProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Product</h1>
        <p className="text-muted-foreground">Update product information</p>
      </div>
      <ProductForm productId={id} />
    </div>
  )
}
