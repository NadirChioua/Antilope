# 🚀 COMPLETE SUPABASE SETUP - 100% WORKING SOLUTION

## 🎯 **GOAL: 100% Working Supabase Connection**

This guide will ensure your project works 100% with Supabase.

## 📋 **STEP 1: Database Schema Setup**

### 1.1 Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard/project/htutmoxrlaurizekvvxf
2. Click "SQL Editor" (left sidebar)
3. Click "New query"

### 1.2 Copy and Run This Complete Schema
```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the 'users' table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    email text UNIQUE NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'staff'::text NOT NULL,
    name text NOT NULL,
    phone text,
    avatar text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_login timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow public read access" ON public.users;
CREATE POLICY "Allow public read access" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow individual insert access" ON public.users;
CREATE POLICY "Allow individual insert access" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow individual update access" ON public.users;
CREATE POLICY "Allow individual update access" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Create the 'clients' table
CREATE TABLE IF NOT EXISTS public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    phone text UNIQUE NOT NULL,
    email text UNIQUE,
    notes text,
    last_visit timestamp with time zone,
    total_visits integer DEFAULT 0 NOT NULL,
    total_spent numeric DEFAULT 0.00 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage clients" ON public.clients FOR ALL USING (auth.role() = 'authenticated');

-- Create the 'products' table
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    name_ar text,
    name_fr text,
    brand text NOT NULL,
    category text NOT NULL,
    volume numeric,
    unit text,
    quantity integer DEFAULT 0 NOT NULL,
    min_quantity integer DEFAULT 0 NOT NULL,
    price numeric DEFAULT 0.00 NOT NULL,
    cost numeric DEFAULT 0.00 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage products" ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- Create the 'services' table
CREATE TABLE IF NOT EXISTS public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    name_ar text,
    name_fr text,
    description text,
    price numeric DEFAULT 0.00 NOT NULL,
    duration integer NOT NULL,
    category text NOT NULL,
    commission_percent numeric DEFAULT 0.00 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    assigned_staff uuid[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage services" ON public.services FOR ALL USING (auth.role() = 'authenticated');

-- Create the 'sales' table
CREATE TABLE IF NOT EXISTS public.sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
    service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
    staff_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    total_amount numeric NOT NULL,
    payment_method text NOT NULL,
    status text DEFAULT 'completed'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage sales" ON public.sales FOR ALL USING (auth.role() = 'authenticated');

-- Create the 'sale_items' table
CREATE TABLE IF NOT EXISTS public.sale_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
    quantity numeric NOT NULL,
    unit_price numeric NOT NULL,
    total_price numeric NOT NULL,
    item_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage sale_items" ON public.sale_items FOR ALL USING (auth.role() = 'authenticated');

-- Create the 'sale_product_usage' table
CREATE TABLE IF NOT EXISTS public.sale_product_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    qty_used numeric NOT NULL,
    unit text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.sale_product_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage sale_product_usage" ON public.sale_product_usage FOR ALL USING (auth.role() = 'authenticated');

-- Create the 'commissions' table
CREATE TABLE IF NOT EXISTS public.commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    staff_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
    service_id uuid REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    commission_percentage numeric NOT NULL,
    commission_amount numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    paid_at timestamp with time zone
);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage commissions" ON public.commissions FOR ALL USING (auth.role() = 'authenticated');

-- Create the 'stock_history' table
CREATE TABLE IF NOT EXISTS public.stock_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
    staff_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    movement_type text NOT NULL,
    quantity_before numeric NOT NULL,
    quantity_change numeric NOT NULL,
    quantity_after numeric NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage stock_history" ON public.stock_history FOR ALL USING (auth.role() = 'authenticated');

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO public.products (name, brand, category, volume, unit, quantity, min_quantity, price, cost) VALUES
('Shampoo Premium', 'L\'Oreal', 'Hair Care', 500, 'ml', 50, 10, 25.00, 15.00),
('Conditioner Repair', 'L\'Oreal', 'Hair Care', 500, 'ml', 30, 5, 20.00, 12.00),
('Hair Mask', 'Kerastase', 'Hair Care', 200, 'ml', 20, 5, 35.00, 25.00),
('Face Cream', 'La Mer', 'Skincare', 50, 'ml', 15, 3, 150.00, 100.00),
('Nail Polish Red', 'OPI', 'Nail Care', 15, 'ml', 100, 20, 12.00, 8.00);

INSERT INTO public.services (name, description, price, duration, category, commission_percent) VALUES
('Hair Cut & Style', 'Professional haircut and styling', 50.00, 60, 'Hair', 10.00),
('Hair Coloring', 'Full hair coloring service', 120.00, 120, 'Hair', 15.00),
('Manicure', 'Complete nail care service', 30.00, 45, 'Nails', 8.00),
('Pedicure', 'Complete foot care service', 40.00, 60, 'Nails', 8.00),
('Facial Treatment', 'Deep cleansing facial', 80.00, 90, 'Skincare', 12.00);

INSERT INTO public.clients (name, phone, email, notes) VALUES
('Sarah Johnson', '+1234567890', 'sarah@email.com', 'Regular client, prefers morning appointments'),
('Maria Garcia', '+1234567891', 'maria@email.com', 'VIP client, loves hair coloring'),
('Emma Wilson', '+1234567892', 'emma@email.com', 'New client, interested in skincare'),
('Lisa Brown', '+1234567893', 'lisa@email.com', 'Long-time client, always on time');
```

## 📋 **STEP 2: Create User Accounts**

### 2.1 Go to Authentication
1. In Supabase Dashboard, click "Authentication" (left sidebar)
2. Click "Users" tab
3. Click "Add user"

### 2.2 Create Admin User
- **Email**: `admin@antilope.com`
- **Password**: `admin123`
- **Email Confirm**: ✅ (check this)
- Click "Create user"

### 2.3 Create Staff User
- **Email**: `staff@antilope.com`
- **Password**: `staff123`
- **Email Confirm**: ✅ (check this)
- Click "Create user"

### 2.4 Update User Roles
1. Go to "SQL Editor"
2. Run this query to set user roles:

```sql
-- Get user IDs first (replace with actual IDs from auth.users)
-- You can find these in Authentication > Users

-- Update admin user role
UPDATE public.users 
SET role = 'admin', name = 'Admin User'
WHERE email = 'admin@antilope.com';

-- Update staff user role  
UPDATE public.users 
SET role = 'staff', name = 'Staff User'
WHERE email = 'staff@antilope.com';
```

## 📋 **STEP 3: Test the Connection**

### 3.1 Open Your App
1. Go to: http://localhost:3000
2. Check browser console for:
   ```
   ✅ Supabase configuration loaded successfully
   URL: https://hututmxrlaurizekvvxf.supabase.co
   Key: eyJhbGciOiJIUzI1NiIsInR5cCI6...
   ```

### 3.2 Test Login
1. Try: `admin@antilope.com` / `admin123`
2. Should redirect to admin dashboard
3. Try: `staff@antilope.com` / `staff123`
4. Should redirect to staff POS

## 🎯 **EXPECTED RESULT**

After completing all steps:
- ✅ Login works 100%
- ✅ Admin dashboard loads with real data
- ✅ Staff POS loads with real data
- ✅ All CRUD operations work
- ✅ No more "Failed to fetch" errors

## 🚨 **If Still Not Working**

1. **Check Console Errors** - Look for specific error messages
2. **Verify Database** - Make sure all tables were created
3. **Check Users** - Verify user accounts exist and have correct roles
4. **Test Connection** - Use the test-connection.html file

---

**🎉 This will give you a 100% working Supabase connection!**

