import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data: invoices } = await adminSupabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const numericNumbers = (invoices || [])
      .map((inv) => parseInt(inv.invoice_number, 10))
      .filter((n) => !Number.isNaN(n))
    const nextNum = numericNumbers.length > 0 ? Math.max(...numericNumbers) + 1 : 1

    return NextResponse.json({ nextNumber: String(nextNum) })
  } catch (error) {
    console.error('Error fetching next invoice number:', error)
    return NextResponse.json({ error: 'Failed to get next invoice number' }, { status: 500 })
  }
}
