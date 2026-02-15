import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
      }
      companies: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          country: string | null
          tax_id: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
      }
      customers: {
        Row: {
          id: string
          user_id: string
          company_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          country: string | null
          tax_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          company_id: string
          name: string
          description: string | null
          price: string
          quantity: number
          sku: string | null
          created_at: string
          updated_at: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          company_id: string
          customer_id: string
          invoice_number: string
          status: string
          issue_date: string
          due_date: string
          subtotal: string
          tax: string
          total: string
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          product_id: string | null
          description: string
          quantity: string
          unit_price: string
          amount: string
          created_at: string
          updated_at: string
        }
      }
    }
  }
}
