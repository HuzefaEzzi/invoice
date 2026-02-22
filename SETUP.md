# Invoice Manager PWA - Setup Instructions

This is a complete Progressive Web App for invoice management built with Next.js, React, Supabase, and TypeScript.

## Features

- ✅ User Authentication (Supabase Auth)
- ✅ Company Management
- ✅ Customer Management
- ✅ Product Catalog
- ✅ Invoice Creation & Management
- ✅ PDF Export (HTML download)
- ✅ Row-Level Security (RLS)
- ✅ Responsive Design (Mobile, Tablet, Desktop)
- ✅ Progressive Web App (PWA) - Installable
- ✅ Service Worker for Offline Support
- ✅ Professional UI with Shadcn/UI

## Prerequisites

- Node.js 18+ (already includes npm)
- Supabase account (free tier works)

## Setup Steps

### 1. Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project (note your project URL and anon key)
3. Go to SQL Editor and run the database migration script from `/scripts/setup-database.sql`
   - Copy the entire SQL file content
   - Paste it into Supabase SQL Editor
   - Click Run
4. **(Optional) Company logos:** To allow uploading company logos (shown on invoices and PDFs):
   - In Supabase Dashboard go to **Storage** → **New bucket**. Create a bucket named `company-logos`, set it to **Public**, set file size limit to **2MB**, and allowed MIME types to `image/jpeg`, `image/png`, `image/gif`, `image/webp`.
   - In SQL Editor run the script `/scripts/setup-storage-logos.sql` to add RLS policies so users can only upload to their own folder.

### 2. Configure Environment Variables

Add these environment variables to your Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase project settings:
- Go to Settings → API → Project Settings
- Copy the URL and the "anon" key

### 3. Database Tables

The setup script creates these tables with RLS:

- **users** - User profile information (extends Supabase auth)
- **companies** - Business companies/brands
- **customers** - Client information
- **products** - Product catalog
- **invoices** - Invoice records
- **invoice_items** - Line items for invoices

All tables have Row-Level Security enabled to ensure users only see their own data.

### 4. Features Breakdown

#### Authentication
- Sign up with email and password
- Sign in to access dashboard
- Protected routes redirect to login

#### Dashboard
- Overview stats (invoices, customers, products, companies)
- Quick action shortcuts

#### Companies
- Create, read, update, delete companies
- Store company details (address, phone, tax ID, etc.)
- Upload company logo (stored in Supabase Storage; shown on invoices and PDFs)

#### Customers
- Manage customer contacts
- Link customers to companies
- Store delivery addresses

#### Products
- Create product catalog
- Track prices and quantities
- Organize by company

#### Invoices
- Create professional invoices
- Add line items with prices and quantities
- Automatic total calculations
- Status tracking (draft, sent, paid, overdue)
- Download as HTML (can be printed to PDF)

#### Settings
- View account information
- Install as PWA
- Sign out

### 5. PWA Features

#### Install App
- On mobile: Click share → Add to Home Screen
- On desktop: Click install button in address bar

#### Offline Support
- Service worker caches key pages
- Basic functionality works offline

#### Shortcuts
- Quick shortcuts from home screen to New Invoice and Customers

### 6. PDF Export & Company Logos

- Invoices can be **downloaded as PDF** from the invoice view page (uses server-side PDF generation with company logo when set).
- **Company logos** are stored in Supabase Storage (`company-logos` bucket), one logo per company. They appear when creating/editing invoices, on the invoice view, and in the generated PDF.
1. Click the Download button on an invoice
2. In the browser print dialog, select "Save as PDF"
3. Or print directly to your printer

## Development

### Run Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run start
```

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Set Up Custom Domain

In Vercel dashboard:
1. Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration steps

## Database Schema

### users
```sql
id (UUID), email (TEXT), full_name (TEXT), created_at, updated_at
```

### companies
```sql
id, user_id, name, email, phone, address, city, state, postal_code, country, tax_id, logo_url
```

### customers
```sql
id, user_id, company_id, name, email, phone, address, city, state, postal_code, country, tax_id, notes
```

### products
```sql
id, user_id, company_id, name, description, price, quantity, sku
```

### invoices
```sql
id, user_id, company_id, customer_id, invoice_number, status, issue_date, due_date, subtotal, tax, total, notes
```

### invoice_items
```sql
id, invoice_id, product_id, description, quantity, unit_price, amount
```

## Troubleshooting

### "Missing Supabase environment variables"
- Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set
- Restart dev server after setting variables

### Database tables not found
- Run the setup SQL script in Supabase SQL Editor
- Ensure script completed without errors

### Can't log in
- Check that Supabase Auth is enabled in your project
- Verify email/password are correct
- Check Supabase Auth settings for email confirmation requirements

### PDF download not working
- Browser might be blocking downloads - check security settings
- Try a different browser
- Check browser console for errors

## Next Steps

- Add email invoice sending
- Implement payment gateway integration
- Add recurring invoices
- Add expense tracking
- Implement multi-currency support
- Add accounting reports

## Support

For issues with:
- **Supabase**: Visit [Supabase Docs](https://supabase.com/docs)
- **Next.js**: Visit [Next.js Docs](https://nextjs.org/docs)
- **Shadcn/UI**: Visit [Shadcn UI](https://ui.shadcn.com)

## License

This project is open source and available under the MIT License.
