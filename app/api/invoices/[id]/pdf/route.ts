import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const MARGIN = 50
const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const LINE_HEIGHT = 14
const ROW_HEIGHT = 20
const TABLE_COLS = { description: 260, quantity: 70, unitPrice: 95, amount: 95 }
const TABLE_LEFT = 50
const TABLE_RIGHT = PAGE_WIDTH - MARGIN

function drawText(
  page: { drawText: (text: string, opts: { x: number; y: number; size: number; font: any; color?: any }) => void },
  text: string,
  x: number,
  y: number,
  font: any,
  size: number = 11,
  color = rgb(0, 0, 0)
) {
  const safe = (text ?? '').toString().slice(0, 200)
  page.drawText(safe, { x, y, size, font, color })
}

function drawTextRight(
  page: { drawText: (text: string, opts: { x: number; y: number; size: number; font: any; color?: any }) => void },
  text: string,
  rightX: number,
  y: number,
  font: any,
  size: number = 11,
  color = rgb(0, 0, 0)
) {
  const safe = (text ?? '').toString().slice(0, 200)
  const width = font.widthOfTextAtSize(safe, size)
  page.drawText(safe, { x: rightX - width, y, size, font, color })
}

function drawTextCenter(
  page: { drawText: (text: string, opts: { x: number; y: number; size: number; font: any; color?: any }) => void },
  text: string,
  leftX: number,
  rightX: number,
  y: number,
  font: any,
  size: number = 11,
  color = rgb(0, 0, 0)
) {
  const safe = (text ?? '').toString().slice(0, 200)
  const width = font.widthOfTextAtSize(safe, size)
  const x = leftX + (rightX - leftX - width) / 2
  page.drawText(safe, { x, y, size, font, color })
}

function drawLine(
  page: { drawLine: (opts: { start: { x: number; y: number }; end: { x: number; y: number }; thickness: number }) => void },
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness = 0.5
) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness })
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

    const doc = await PDFDocument.create()
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
    const muted = rgb(0.45, 0.45, 0.45)

    let y = PAGE_HEIGHT - MARGIN

    // ─── Header: Company (left) | Invoice Number + Status (right) ───
    drawText(page, invoice.companies?.name || 'Company', TABLE_LEFT, y, fontBold, 20)
    y -= LINE_HEIGHT
    const companyLines = [
      invoice.companies?.address,
      [invoice.companies?.city, invoice.companies?.state, invoice.companies?.postal_code].filter(Boolean).join(', '),
      invoice.companies?.phone,
    ].filter(Boolean)
    for (const line of companyLines) {
      drawText(page, line, TABLE_LEFT, y, font, 10, muted)
      y -= LINE_HEIGHT - 2
    }

    const headerRightY = PAGE_HEIGHT - MARGIN
    drawTextRight(page, 'Invoice Number', TABLE_RIGHT, headerRightY, font, 10, muted)
    drawTextRight(page, invoice.invoice_number, TABLE_RIGHT, headerRightY - LINE_HEIGHT, fontBold, 18)
    drawTextRight(page, 'Status', TABLE_RIGHT, headerRightY - LINE_HEIGHT - 20, font, 10, muted)
    drawTextRight(page, (invoice.status || 'Draft').charAt(0).toUpperCase() + (invoice.status || '').slice(1), TABLE_RIGHT, headerRightY - LINE_HEIGHT - 34, fontBold, 12)

    y -= 16
    drawLine(page, TABLE_LEFT, y, TABLE_RIGHT, y, 0.5)
    y -= 24

    // ─── Bill To (left) | Issue Date, Due Date (right) ───
    const billToY = y
    drawText(page, 'Bill To', TABLE_LEFT, y, font, 10, muted)
    drawTextRight(page, 'Issue Date', TABLE_RIGHT, y, font, 10, muted)
    drawTextRight(page, new Date(invoice.issue_date).toLocaleDateString(), TABLE_RIGHT, y, fontBold, 11)
    y -= LINE_HEIGHT - 2
    drawText(page, invoice.customers?.name || 'Customer', TABLE_LEFT, y, fontBold, 11)
   // drawTextRight(page, 'Due Date', TABLE_RIGHT, y, font, 10, muted)
    //drawTextRight(page, new Date(invoice.due_date).toLocaleDateString(), TABLE_RIGHT, y, fontBold, 11)
    y -= LINE_HEIGHT
    const customerLines = [
      invoice.customers?.address,
      [invoice.customers?.city, invoice.customers?.state, invoice.customers?.postal_code].filter(Boolean).join(', '),
      invoice.customers?.phone,
      invoice.customers?.email,
    ].filter(Boolean)
    for (const line of customerLines) {
      drawText(page, line, TABLE_LEFT, y, font, 10, muted)
      y -= LINE_HEIGHT - 2
    }

    y -= 12
    drawLine(page, TABLE_LEFT, y, TABLE_RIGHT, y, 0.5)
    y -= 20

    // ─── Table: Description (left) | Quantity (center) | Unit Price (right) | Amount (right) ───
    const colDescEnd = TABLE_LEFT + TABLE_COLS.description
    const colQtyEnd = colDescEnd + TABLE_COLS.quantity
    const colUnitEnd = colQtyEnd + TABLE_COLS.unitPrice
    const colAmountEnd = TABLE_RIGHT

    drawText(page, 'Description', TABLE_LEFT, y, fontBold, 10)
    drawTextCenter(page, 'Quantity', colDescEnd, colQtyEnd, y, fontBold, 10)
    drawTextRight(page, 'Unit Price', colUnitEnd, y, fontBold, 10)
    drawTextRight(page, 'Amount', colAmountEnd, y, fontBold, 10)
    y -= ROW_HEIGHT
    drawLine(page, TABLE_LEFT, y, TABLE_RIGHT, y, 0.8)
    y -= 6

    const items = invoice.invoice_items ?? []
    for (const item of items) {
      drawText(page, (item.description ?? '').slice(0, 45), TABLE_LEFT, y, font, 10)
      drawTextCenter(page, String(item.quantity ?? 0), colDescEnd, colQtyEnd, y, font, 10)
      drawTextRight(page, `$${Number(item.unit_price).toFixed(2)}`, colUnitEnd, y, font, 10)
      drawTextRight(page, `$${Number(item.amount).toFixed(2)}`, colAmountEnd, y, font, 10)
      y -= ROW_HEIGHT
    }

    drawLine(page, TABLE_LEFT, y, TABLE_RIGHT, y, 0.5)
    y -= 20

    // ─── Totals (right-aligned column, matching UI) ───
    const totalLabelLeft = colUnitEnd - 20
    const totalValueRight = colAmountEnd

    drawText(page, 'Subtotal:', totalLabelLeft, y, font, 10)
    drawTextRight(page, `$${Number(invoice.subtotal).toFixed(2)}`, totalValueRight, y, font, 10)
    y -= LINE_HEIGHT + 2
    drawText(page, 'Tax:', totalLabelLeft, y, font, 10)
    drawTextRight(page, `$${Number(invoice.tax).toFixed(2)}`, totalValueRight, y, font, 10)
    y -= LINE_HEIGHT + 6
    drawLine(page, totalLabelLeft, y, totalValueRight, y, 0.5)
    y -= LINE_HEIGHT + 4
    drawText(page, 'Total:', totalLabelLeft, y, fontBold, 12)
    drawTextRight(page, `$${Number(invoice.total).toFixed(2)}`, totalValueRight, y, fontBold, 12)
    y -= 24

    if (invoice.notes) {
      drawText(page, 'Notes', TABLE_LEFT, y, fontBold, 10)
      y -= LINE_HEIGHT
      const noteLines = String(invoice.notes).split(/\n/).slice(0, 8)
      for (const line of noteLines) {
        drawText(page, line.slice(0, 85), TABLE_LEFT, y, font, 10, muted)
        y -= LINE_HEIGHT - 2
      }
    }

    const pdfBytes = await doc.save()

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
