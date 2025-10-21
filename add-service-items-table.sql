-- ============================================================================
-- CREATE SERVICE_ITEMS TABLE FOR REPEATED SERVICES
-- ============================================================================
-- This script creates the service_items table needed for repeated services
-- and enhanced sale tracking with individual service instances
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

