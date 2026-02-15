import { CompanyForm } from '@/components/forms/company-form'

export default function NewCompanyPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Company</h1>
        <p className="text-muted-foreground">Add a new company to your account</p>
      </div>
      <CompanyForm />
    </div>
  )
}
