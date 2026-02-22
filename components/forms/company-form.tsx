'use client'

import React from "react"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImagePlus, X } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Company = Database['public']['Tables']['companies']['Row']

const LOGO_BUCKET = 'company-logos'
const MAX_LOGO_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

interface CompanyFormProps {
  companyId?: string
}

export function CompanyForm({ companyId }: CompanyFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [removeLogoRequested, setRemoveLogoRequested] = useState(false)
  const [company, setCompany] = useState<Partial<Company>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    tax_id: '',
  })

  useEffect(() => {
    if (companyId && companyId !== 'new') {
      fetchCompany()
    }
  }, [companyId])

  const fetchCompany = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single()

      if (error) throw error
      setCompany(data)
      setRemoveLogoRequested(false)
      if (data?.logo_url) setLogoPreview(data.logo_url)
      else setLogoPreview(null)
    } catch (error) {
      console.error('Error fetching company:', error)
    }
  }

  const getLogoPath = (cid: string) => `${user!.id}/${cid}/logo`

  const uploadLogo = async (companyIdForPath: string): Promise<string | null> => {
    if (!logoFile || !user) return null
    const ext = logoFile.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${getLogoPath(companyIdForPath)}.${ext}`
    const { data, error } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(path, logoFile, { upsert: true, contentType: logoFile.type })
    if (error) throw error
    const { data: urlData } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(data.path)
    return urlData.publicUrl
  }

  const removeStoredLogo = async () => {
    if (!companyId || companyId === 'new' || !user) return
    try {
      const folderPath = `${user.id}/${companyId}`
      const { data: list } = await supabase.storage.from(LOGO_BUCKET).list(folderPath)
      const files = (list ?? []).filter((f) => f.name).map((f) => `${folderPath}/${f.name}`)
      if (files.length) await supabase.storage.from(LOGO_BUCKET).remove(files)
    } catch (_) {
      // ignore
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_LOGO_SIZE) {
      return
    }
    if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleRemoveLogo = () => {
    if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
    setLogoFile(null)
    setLogoPreview(null)
    setRemoveLogoRequested(true)
    setCompany((c) => ({ ...c, logo_url: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (companyId && companyId !== 'new') {
        let logoUrl: string | null | undefined = company.logo_url
        if (logoFile) {
          logoUrl = await uploadLogo(companyId)
          if (logoUrl) setCompany((c) => ({ ...c, logo_url: logoUrl! }))
        }
        if (removeLogoRequested) {
          await removeStoredLogo()
          logoUrl = null
        }
        const { error } = await supabase
          .from('companies')
          .update({ ...company, logo_url: logoUrl })
          .eq('id', companyId)

        if (error) throw error
      } else {
        const response = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(company),
        })

        if (!response.ok) {
          throw new Error('Failed to create company')
        }
        const created = await response.json()
        if (logoFile && created?.id) {
          const logoUrl = await uploadLogo(created.id)
          if (logoUrl) {
            await supabase
              .from('companies')
              .update({ logo_url: logoUrl })
              .eq('id', created.id)
          }
        }
      }

      router.push('/dashboard/companies')
    } catch (error) {
      console.error('Error saving company:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{companyId ? 'Edit Company' : 'New Company'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              className="hidden"
              onChange={handleLogoChange}
            />
            <div>
              <label className="block text-sm font-medium mb-2">Company logo</label>
              <div className="flex items-center gap-4 flex-wrap">
                {(logoPreview || logoFile) ? (
                  <>
                    <div className="w-[200px] h-[200px] rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
                      <img
                        src={logoPreview!}
                        alt="Logo preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveLogo}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Upload logo
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, GIF or WebP. Max 2MB. Shown on invoices and PDFs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name *</label>
                <Input
                  type="text"
                  value={company.name || ''}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={company.email || ''}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  type="tel"
                  value={company.phone || ''}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tax ID</label>
                <Input
                  type="text"
                  value={company.tax_id || ''}
                  onChange={(e) => setCompany({ ...company, tax_id: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <Input
                type="text"
                value={company.address || ''}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <Input
                  type="text"
                  value={company.city || ''}
                  onChange={(e) => setCompany({ ...company, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <Input
                  type="text"
                  value={company.state || ''}
                  onChange={(e) => setCompany({ ...company, state: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Postal Code</label>
                <Input
                  type="text"
                  value={company.postal_code || ''}
                  onChange={(e) => setCompany({ ...company, postal_code: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <Input
                type="text"
                value={company.country || ''}
                onChange={(e) => setCompany({ ...company, country: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : companyId ? 'Update Company' : 'Create Company'}
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
