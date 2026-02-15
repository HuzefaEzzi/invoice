import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  try {
    // Fetch invoice with related data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, companies(*), customers(*), invoice_items(*)')
      .eq('id', id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Generate simple HTML for PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { margin-bottom: 40px; }
          .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .company-details { font-size: 12px; color: #666; }
          .invoice-title { font-size: 32px; font-weight: bold; margin-bottom: 20px; margin-top: 40px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .info-section { }
          .info-label { font-size: 12px; color: #999; margin-bottom: 5px; }
          .info-value { font-size: 14px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { border-bottom: 2px solid #000; padding: 10px; text-align: left; font-weight: bold; }
          td { border-bottom: 1px solid #ddd; padding: 10px; }
          .line-items-table td { text-align: right; }
          .line-items-table td:first-child { text-align: left; }
          .totals { float: right; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
          .total-final { display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #000; font-weight: bold; font-size: 16px; }
          .notes { margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${invoice.companies?.name || 'Company'}</div>
          <div class="company-details">
            ${invoice.companies?.address ? invoice.companies.address : ''}<br/>
            ${invoice.companies?.city ? invoice.companies.city + ', ' + invoice.companies.state : ''}<br/>
            ${invoice.companies?.phone ? invoice.companies.phone : ''}
          </div>
        </div>

        <div class="invoice-title">INVOICE</div>

        <div class="info-grid">
          <div class="info-section">
            <div class="info-label">BILL TO</div>
            <div class="info-value">${invoice.customers?.name || 'Customer'}</div>
            <div style="margin-top: 10px; font-size: 12px;">
              ${invoice.customers?.address ? invoice.customers.address : ''}<br/>
              ${invoice.customers?.city ? invoice.customers.city + ', ' + invoice.customers.state : ''}<br/>
              ${invoice.customers?.email ? invoice.customers.email : ''}
            </div>
          </div>
          <div class="info-section" style="text-align: right;">
            <div class="info-label">Invoice #</div>
            <div class="info-value">${invoice.invoice_number}</div>
            <div style="margin-top: 20px;">
              <div class="info-label">Issue Date</div>
              <div>${new Date(invoice.issue_date).toLocaleDateString()}</div>
              <div class="info-label" style="margin-top: 10px;">Due Date</div>
              <div>${new Date(invoice.due_date).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <table class="line-items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.invoice_items
              ?.map(
                (item) => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>$${Number(item.unit_price).toFixed(2)}</td>
                <td>$${Number(item.amount).toFixed(2)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>$${Number(invoice.subtotal).toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Tax</span>
            <span>$${Number(invoice.tax).toFixed(2)}</span>
          </div>
          <div class="total-final">
            <span>TOTAL</span>
            <span>$${Number(invoice.total).toFixed(2)}</span>
          </div>
        </div>

        ${
          invoice.notes
            ? `
          <div class="notes">
            <strong>Notes:</strong>
            <p>${invoice.notes}</p>
          </div>
        `
            : ''
        }
      </body>
      </html>
    `

    // For now, return HTML. In production, you'd use a library like puppeteer or similar
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.html"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
