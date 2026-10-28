-- ====================================================================
-- VYAPAAR AI — SUPABASE POSTGRESQL DATABASE SCHEMA & RLS POLICIES
-- Target: Supabase Postgres
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'manager', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'upi', 'card', 'khata', 'split');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sale_status AS ENUM ('completed', 'cancelled', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE waste_reason AS ENUM (
        'unsold_eod',
        'spoiled_ingredients',
        'overcooked_burnt',
        'damaged_spill',
        'customer_return',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE inventory_movement_type AS ENUM (
        'restock',
        'sale',
        'waste',
        'manual_adjustment'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    business_type TEXT NOT NULL DEFAULT 'Tea Stall & Snacks Corner',
    currency TEXT NOT NULL DEFAULT 'INR',
    currency_symbol TEXT NOT NULL DEFAULT '₹',
    address TEXT,
    phone TEXT,
    gstin TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. BUSINESS MEMBERS TABLE (Multi-user permissions)
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'owner',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(business_id, user_id)
);

-- 6. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'tea',
    selling_price NUMERIC(10, 2) NOT NULL CHECK (selling_price >= 0),
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0),
    stock_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    min_stock_alert NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
    unit TEXT NOT NULL DEFAULT 'cup',
    is_active BOOLEAN NOT NULL DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. SALES TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    net_amount NUMERIC(10, 2) NOT NULL CHECK (net_amount >= 0),
    payment_method payment_method NOT NULL DEFAULT 'cash',
    customer_name TEXT,
    customer_phone TEXT,
    status sale_status NOT NULL DEFAULT 'completed',
    cancellation_reason TEXT,
    sale_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. SALE ITEMS (With historical price & cost snapshots)
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0), -- Snapshot
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0), -- Snapshot
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'rent', 'electricity', 'gas', 'transport', 'packaging', 'raw_materials', 'wages', 'other'
    title TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL DEFAULT 'cash',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. FOOD WASTE RECORDS
CREATE TABLE IF NOT EXISTS public.waste_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0),
    total_waste_cost NUMERIC(10, 2) NOT NULL CHECK (total_waste_cost >= 0),
    reason waste_reason NOT NULL DEFAULT 'unsold_eod',
    waste_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. INVENTORY MOVEMENTS AUDIT TRAIL
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type inventory_movement_type NOT NULL,
    quantity_change NUMERIC(10, 2) NOT NULL,
    quantity_after NUMERIC(10, 2) NOT NULL,
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. CUSTOMERS (Loyalty & Khata / Udhaar balance)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    khata_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    loyalty_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(business_id, phone)
);

-- 13. KHATA ENTRIES (Udhaar credit & payment transactions)
CREATE TABLE IF NOT EXISTS public.khata_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('credit_given', 'payment_received')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    notes TEXT,
    entry_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_products_business ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_business_date ON public.sales(business_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business_date ON public.expenses(business_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_waste_business_date ON public.waste_records(business_id, waste_date DESC);
CREATE INDEX IF NOT EXISTS idx_inv_movements_prod ON public.inventory_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_business ON public.customers(business_id, phone);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.khata_entries ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is member of business
CREATE OR REPLACE FUNCTION public.is_business_member(b_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.business_members
        WHERE business_id = b_id AND user_id = auth.uid()
    );
$$;

-- Helper function: Check if current user is owner of business
CREATE OR REPLACE FUNCTION public.is_business_owner(b_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.businesses
        WHERE id = b_id AND owner_id = auth.uid()
    );
$$;

-- Profiles: Users can read/write their own profile
CREATE POLICY "Users can manage their own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Businesses: Owners can manage, members can read
CREATE POLICY "Users can view businesses they belong to" ON public.businesses
    FOR SELECT USING (owner_id = auth.uid() OR public.is_business_member(id));

CREATE POLICY "Users can insert businesses they own" ON public.businesses
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their businesses" ON public.businesses
    FOR UPDATE USING (owner_id = auth.uid());

-- Business Members
CREATE POLICY "Members can view membership" ON public.business_members
    FOR SELECT USING (user_id = auth.uid() OR public.is_business_member(business_id));

CREATE POLICY "Owners can manage membership" ON public.business_members
    FOR ALL USING (public.is_business_owner(business_id));

-- Products
CREATE POLICY "Business members can view products" ON public.products
    FOR SELECT USING (public.is_business_member(business_id));

CREATE POLICY "Business members can manage products" ON public.products
    FOR ALL USING (public.is_business_member(business_id));

-- Sales
CREATE POLICY "Business members can view sales" ON public.sales
    FOR SELECT USING (public.is_business_member(business_id));

CREATE POLICY "Business members can insert/update sales" ON public.sales
    FOR ALL USING (public.is_business_member(business_id));

-- Sale Items
CREATE POLICY "Business members can manage sale items" ON public.sale_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.sales
            WHERE sales.id = sale_items.sale_id AND public.is_business_member(sales.business_id)
        )
    );

-- Expenses
CREATE POLICY "Business members can manage expenses" ON public.expenses
    FOR ALL USING (public.is_business_member(business_id));

-- Waste Records
CREATE POLICY "Business members can manage waste records" ON public.waste_records
    FOR ALL USING (public.is_business_member(business_id));

-- Inventory Movements
CREATE POLICY "Business members can manage inventory movements" ON public.inventory_movements
    FOR ALL USING (public.is_business_member(business_id));

-- Customers & Khata
CREATE POLICY "Business members can manage customers" ON public.customers
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Business members can manage khata entries" ON public.khata_entries
    FOR ALL USING (public.is_business_member(business_id));
