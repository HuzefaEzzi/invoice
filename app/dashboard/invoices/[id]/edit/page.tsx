import { InvoiceForm } from '@/components/forms/invoice-form'

interface EditInvoicePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { id } = await params

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Invoice</h1>
        <p className="text-muted-foreground">Update invoice information</p>
      </div>
      <InvoiceForm invoiceId={id} />
    </div>
  )
}
