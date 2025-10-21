-- ============================================================================
-- COMPLETE DATABASE SETUP FOR SALON MANAGEMENT SYSTEM
-- ============================================================================
-- This script sets up all required tables and columns for the enhanced
-- salon management system with icons and repeated services support
-- ============================================================================

-- 1. ADD ICON COLUMNS TO SERVICES TABLE
-- ============================================================================

-- Add icon_name column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS icon_name VARCHAR(50) DEFAULT 'scissors';

-- Add icon_library column to services table  
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS icon_library VARCHAR(20) DEFAULT 'lucide';

-- Update existing services to have default icons
UPDATE public.services 
SET 
    icon_name = 'scissors',
    icon_library = 'lucide'
WHERE icon_name IS NULL OR icon_name = '';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_services_icon_name ON public.services(icon_name);

-- Add comments to document the columns
COMMENT ON COLUMN public.services.icon_name IS 'Icon name for the service (salon-themed icons only)';
COMMENT ON COLUMN public.services.icon_library IS 'Icon library used (default: lucide)';

-- 2. CREATE SERVICE_ITEMS TABLE FOR REPEATED SERVICES
-- ============================================================================

-- Create service_items table for individual service instances
CREATE TABLE IF NOT EXISTS public.service_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    original_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    adjusted_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    price_adjustment_reason TEXT,
    quantity_sold INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_items_sale_id ON public.service_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_service_items_service_id ON public.service_items(service_id);
CREATE INDEX IF NOT EXISTS idx_service_items_created_at ON public.service_items(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read service items
CREATE POLICY "Allow authenticated users to read service items" ON public.service_items
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert service items
CREATE POLICY "Allow authenticated users to insert service items" ON public.service_items
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update service items
CREATE POLICY "Allow authenticated users to update service items" ON public.service_items
    FOR UPDATE TO authenticated USING (true);

-- Allow authenticated users to delete service items
CREATE POLICY "Allow authenticated users to delete service items" ON public.service_items
    FOR DELETE TO authenticated USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_service_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_items_updated_at
    BEFORE UPDATE ON public.service_items
    FOR EACH ROW EXECUTE FUNCTION public.update_service_items_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.service_items IS 'Individual service instances within sales for repeated services support';
COMMENT ON COLUMN public.service_items.sale_id IS 'Reference to the parent sale';
COMMENT ON COLUMN public.service_items.service_id IS 'Reference to the service being sold';
COMMENT ON COLUMN public.service_items.original_price IS 'Original price of the service';
COMMENT ON COLUMN public.service_items.adjusted_price IS 'Adjusted price for this specific sale';
COMMENT ON COLUMN public.service_items.price_adjustment_reason IS 'Reason for price adjustment';
COMMENT ON COLUMN public.service_items.quantity_sold IS 'Quantity of this service instance (usually 1)';

-- Grant permissions
GRANT ALL ON public.service_items TO authenticated;
GRANT ALL ON public.service_items TO service_role;

-- 3. ENHANCE SALES TABLE FOR BETTER TRACKING
-- ============================================================================

-- Add columns to sales table for overall sale adjustments if needed
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS total_original_amount NUMERIC(10,2) DEFAULT 0.00;

-- Add columns to sale_items table for dynamic pricing and quantity per service instance
ALTER TABLE public.sale_items
ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS adjusted_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS price_adjustment_reason TEXT,
ADD COLUMN IF NOT EXISTS quantity_sold INTEGER DEFAULT 1;

-- 4. CREATE HELPFUL VIEWS
-- ============================================================================

-- Create view for services with icon data
CREATE OR REPLACE VIEW public.services_with_icons AS
SELECT 
    s.id,
    s.name,
    s.name_ar,
    s.name_fr,
    s.description,
    s.price,
    s.duration,
    s.category,
    s.commission_percent,
    s.is_active,
    s.required_products,
    s.assigned_staff,
    s.icon_name,
    s.icon_library,
    s.created_at,
    s.updated_at
FROM public.services s
ORDER BY s.name;

-- Grant access to the view
GRANT SELECT ON public.services_with_icons TO authenticated;

-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Verify the setup worked
SELECT 
    'Services table has icon columns' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'services' AND column_name = 'icon_name'
        ) THEN 'PASS'
        ELSE 'FAIL'
    END as status;

SELECT 
    'Service_items table exists' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'service_items'
        ) THEN 'PASS'
        ELSE 'FAIL'
    END as status;

-- Show current services with their icons
SELECT 
    name,
    icon_name,
    icon_library,
    is_active
FROM public.services
ORDER BY name;

