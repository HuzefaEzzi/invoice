import { CustomerForm } from '@/components/forms/customer-form'

export default function NewCustomerPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">New Customer</h1>
        <p className="text-muted-foreground">Add a new customer to your account</p>
      </div>
      <CustomerForm />
    </div>
  )
}
