import { InvoiceForm } from '@/components/forms/invoice-form'

export default function NewInvoicePage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Invoice</h1>
        <p className="text-muted-foreground">Create a new invoice</p>
      </div>
      <InvoiceForm />
    </div>
  )
}
