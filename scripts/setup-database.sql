-- Create users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  tax_id TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  tax_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  quantity BIGINT DEFAULT 0,
  sku TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(12, 2) DEFAULT 0,
  tax DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(company_id, invoice_number)
);

-- Create invoice items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own user data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own user data" ON public.users;
DROP POLICY IF EXISTS "Users can view their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
DROP POLICY IF EXISTS "Users can create products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view invoice items for their invoices" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can create invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can update invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can delete invoice items" ON public.invoice_items;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own user data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own user data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Create RLS policies for companies table
CREATE POLICY "Users can view their own companies"
  ON public.companies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies"
  ON public.companies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companies"
  ON public.companies FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for customers table
CREATE POLICY "Users can view their own customers"
  ON public.customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create customers"
  ON public.customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers"
  ON public.customers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers"
  ON public.customers FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for products table
CREATE POLICY "Users can view their own products"
  ON public.products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON public.products FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for invoices table
CREATE POLICY "Users can view their own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
  ON public.invoices FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for invoice_items table
CREATE POLICY "Users can view invoice items for their invoices"
  ON public.invoice_items FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE auth.uid() = user_id
    )
  );

CREATE POLICY "Users can create invoice items"
  ON public.invoice_items FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE auth.uid() = user_id
    )
  );

CREATE POLICY "Users can update invoice items"
  ON public.invoice_items FOR UPDATE
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE auth.uid() = user_id
    )
  );

CREATE POLICY "Users can delete invoice items"
  ON public.invoice_items FOR DELETE
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE auth.uid() = user_id
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
