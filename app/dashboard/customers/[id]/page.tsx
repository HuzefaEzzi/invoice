import { CustomerForm } from '@/components/forms/customer-form'

interface EditCustomerPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Customer</h1>
        <p className="text-muted-foreground">Update customer information</p>
      </div>
      <CustomerForm customerId={id} />
    </div>
  )
}
