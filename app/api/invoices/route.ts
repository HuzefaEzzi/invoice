import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ensureUser } from '@/lib/ensure-user'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Create a client with the user's session
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

    const body = await request.json()
    const { company_id, customer_id, invoice_number, issue_date, due_date, status, items, tax_rate, notes } = body

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * Number(item.unit_price)), 0)
    const tax = subtotal * ((tax_rate ?? 10) / 100)
    const total = subtotal + tax

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
    await ensureUser(adminSupabase, user)

    const { data, error } = await adminSupabase
      .from('invoices')
      .insert({
        user_id: user.id,
        company_id,
        customer_id,
        invoice_number,
        issue_date,
        due_date,
        status,
        subtotal,
        tax,
        total,
        notes,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Insert invoice items (description and unit_price from product selection)
    const invoiceItems = items.map((item: any) => ({
      invoice_id: data.id,
      product_id: item.product_id || null,
      description: item.description || '',
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: Number(item.quantity) * Number(item.unit_price),
    }))

    const { error: itemsError } = await adminSupabase
      .from('invoice_items')
      .insert(invoiceItems)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Create a client with the user's session
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

    // Use service role key to bypass RLS
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

    const { data, error } = await adminSupabase
      .from('invoices')
      .select()
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}
