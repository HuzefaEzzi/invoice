import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'

// Remote Chromium pack (used on Vercel where node_modules/bin is not available).
// First request may be slower while the pack is downloaded and extracted to /tmp.
const CHROMIUM_VERSION = '143.0.4'
const CHROMIUM_PACK_URL =
  process.env.CHROMIUM_PACK_URL ||
  `https://github.com/Sparticuz/chromium/releases/download/v${CHROMIUM_VERSION}/chromium-v${CHROMIUM_VERSION}-pack.${process.arch === 'arm64' ? 'arm64' : 'x64'}.tar`

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildInvoiceHtml(invoice: any): string {
  const company = invoice.companies || {}
  const customer = invoice.customers || {}
  const items = invoice.invoice_items || []

  const companyAddress = [
    company.address,
    [company.city, company.state, company.postal_code].filter(Boolean).join(', '),
    company.phone,
  ].filter(Boolean)

  const customerAddress = [
    customer.address,
    [customer.city, customer.state, customer.postal_code].filter(Boolean).join(', '),
    customer.phone,
    customer.email,
  ].filter(Boolean)

  const issueDate = new Date(invoice.issue_date).toLocaleDateString()
  const dueDate = new Date(invoice.due_date).toLocaleDateString()

  const lineItemsHtml = items
    .map(
      (item: any) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.description || '')}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: center;">${escapeHtml(String(item.quantity ?? 0))}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${Number(item.unit_price).toFixed(2)}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">₹${Number(item.amount).toFixed(2)}</td>
      </tr>
    `
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.5; color: #18181b; padding: 48px; }
    .card { max-width: 800px; margin: 0 auto; }
    .section { margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #e5e7eb; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .text-right { text-align: right; }
    .muted { color: #71717a; font-size: 13px; }
    .bold { font-weight: 600; }
    .text-3xl { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .space-y-1 > * + * { margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px 0; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    th.text-center { text-align: center; }
    th.text-right { text-align: right; }
    .totals { margin-left: auto; width: 280px; }
    .totals .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .totals .row.total { padding-top: 12px; margin-top: 12px; border-top: 1px solid #e5e7eb; font-weight: 700; font-size: 18px; }
    .notes { white-space: pre-wrap; font-size: 13px; color: #71717a; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="section">
      <div class="grid-2">
        <div>
          <h1 class="text-3xl">${escapeHtml(company.name || 'Company')}</h1>
          <div class="muted space-y-1">
            ${companyAddress.map((line: string) => `<p>${escapeHtml(line)}</p>`).join('')}
          </div>
        </div>
        <div class="text-right">
          <div>
            <p class="muted">Invoice Number</p>
            <p class="bold" style="font-size: 22px;">${escapeHtml(invoice.invoice_number)}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="grid-2">
        <div>
          <p class="muted bold" style="margin-bottom: 8px;">Bill To</p>
          <p class="bold">${escapeHtml(customer.name || 'Customer')}</p>
          <div class="muted space-y-1" style="margin-top: 8px;">
            ${customerAddress.map((line: string) => `<p>${escapeHtml(line)}</p>`).join('')}
          </div>
        </div>
        <div class="text-right" style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <p class="muted">Issue Date</p>
            <p class="bold">${escapeHtml(issueDate)}</p>
          </div>
          <div>
            <p class="muted">Due Date</p>
            <p class="bold">${escapeHtml(dueDate)}</p>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 32px;">
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-center">Quantity</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
        </tbody>
      </table>
    </div>

    <div class="grid-2">
      <div>
        ${invoice.notes ? `<div><p class="bold" style="font-size: 13px; margin-bottom: 8px;">Notes</p><p class="notes">${escapeHtml(invoice.notes)}</p></div>` : ''}
      </div>
      <div class="totals">
        <div class="row total">
          <span>Total:</span>
          <span>₹${Number(invoice.total).toFixed(2)}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

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

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, companies(*), customers(*), invoice_items(*)')
      .eq('id', id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const html = buildInvoiceHtml(invoice)

    const browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1200, height: 800, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: true,
    })

    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        printBackground: true,
      })
      await browser.close()

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
        },
      })
    } finally {
      await browser.close()
    }
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
