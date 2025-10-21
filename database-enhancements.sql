-- ============================================================================
-- DATABASE ENHANCEMENTS FOR SALON MANAGEMENT SYSTEM
-- ============================================================================
-- This script adds the necessary database changes to support:
-- 1. Dynamic service pricing
-- 2. Service icons
-- 3. Repeated services in sales
-- 4. Enhanced transaction data
-- ============================================================================

-- Add icon support to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS icon_name text DEFAULT 'scissors',
ADD COLUMN IF NOT EXISTS icon_library text DEFAULT 'lucide';

-- Add dynamic pricing support to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS original_service_price numeric,
ADD COLUMN IF NOT EXISTS adjusted_service_price numeric,
ADD COLUMN IF NOT EXISTS price_adjustment_reason text;

-- Create service_items table for repeated services
CREATE TABLE IF NOT EXISTS public.service_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    original_price numeric NOT NULL,
    adjusted_price numeric NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Ensure unique combinations
    UNIQUE(sale_id, service_id, original_price, adjusted_price)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_items_sale_id ON public.service_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_service_items_service_id ON public.service_items(service_id);
CREATE INDEX IF NOT EXISTS idx_services_icon_name ON public.services(icon_name);

-- Enable RLS for new table
ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service_items
CREATE POLICY "Authenticated users can view service_items" ON public.service_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert service_items" ON public.service_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only admins can update service_items" ON public.service_items
  FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete service_items" ON public.service_items
  FOR DELETE USING (is_admin());

-- Update existing services with default icons
UPDATE public.services 
SET icon_name = CASE 
    WHEN name ILIKE '%hair%' OR name ILIKE '%cheveux%' THEN 'scissors'
    WHEN name ILIKE '%nail%' OR name ILIKE '%ongle%' THEN 'sparkles'
    WHEN name ILIKE '%face%' OR name ILIKE '%visage%' THEN 'heart'
    WHEN name ILIKE '%massage%' THEN 'hand'
    WHEN name ILIKE '%eyebrow%' OR name ILIKE '%sourcil%' THEN 'eye'
    ELSE 'scissors'
END,
icon_library = 'lucide'
WHERE icon_name IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.services.icon_name IS 'Icon identifier for the service (e.g., scissors, heart, sparkles)';
COMMENT ON COLUMN public.services.icon_library IS 'Icon library used (e.g., lucide, fontawesome)';
COMMENT ON COLUMN public.sales.original_service_price IS 'Original price of the service before any adjustments';
COMMENT ON COLUMN public.sales.adjusted_service_price IS 'Final price after adjustments';
COMMENT ON COLUMN public.sales.price_adjustment_reason IS 'Reason for price adjustment (e.g., discount, premium service)';
COMMENT ON TABLE public.service_items IS 'Individual service items within a sale, allowing repeated services';
