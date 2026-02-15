import { CompanyForm } from '@/components/forms/company-form'

interface EditCompanyPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
  const { id } = await params

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Company</h1>
        <p className="text-muted-foreground">Update company information</p>
      </div>
      <CompanyForm companyId={id} />
    </div>
  )
}
