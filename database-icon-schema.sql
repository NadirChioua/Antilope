-- ============================================================================
-- SALON ICON SYSTEM - DATABASE SCHEMA ENHANCEMENT
-- ============================================================================
-- This script ensures the database schema supports salon-specific icons
-- and maintains data integrity for all service and icon data
-- ============================================================================

-- Add icon columns to services table if they don't exist
DO $$ 
BEGIN
    -- Add icon_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'services' AND column_name = 'icon_name') THEN
        ALTER TABLE public.services ADD COLUMN icon_name VARCHAR(50) DEFAULT 'scissors';
    END IF;
    
    -- Add icon_library column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'services' AND column_name = 'icon_library') THEN
        ALTER TABLE public.services ADD COLUMN icon_library VARCHAR(20) DEFAULT 'lucide';
    END IF;
END $$;

-- Create icon_categories table for salon-specific icon management
CREATE TABLE IF NOT EXISTS public.icon_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert salon-specific icon categories
INSERT INTO public.icon_categories (name, display_name, description, sort_order) VALUES
('Hair', 'Hair Services', 'Hair cutting, styling, coloring, and treatments', 1),
('Beauty', 'Beauty & Skincare', 'Facial treatments, makeup, and skincare services', 2),
('Nails', 'Nail Services', 'Manicure, pedicure, and nail art services', 3),
('Wellness', 'Wellness & Massage', 'Massage, relaxation, and wellness treatments', 4),
('Luxury', 'Luxury Services', 'Premium and exclusive salon services', 5),
('Quick', 'Quick Services', 'Express and fast treatments', 6)
ON CONFLICT (name) DO NOTHING;

-- Create salon_icons table for icon management
CREATE TABLE IF NOT EXISTS public.salon_icons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES public.icon_categories(id),
    description TEXT,
    icon_data TEXT, -- SVG or icon reference
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert salon-specific icons
INSERT INTO public.salon_icons (name, display_name, category_id, description, sort_order) VALUES
-- Hair Services
('scissors', 'Hair Cutting', (SELECT id FROM public.icon_categories WHERE name = 'Hair'), 'Hair cutting and styling', 1),
('brush', 'Hair Brushing', (SELECT id FROM public.icon_categories WHERE name = 'Hair'), 'Hair brushing and styling', 2),
('sparkle', 'Hair Highlights', (SELECT id FROM public.icon_categories WHERE name = 'Hair'), 'Hair highlights and coloring', 3),
('wand2', 'Hair Transformations', (SELECT id FROM public.icon_categories WHERE name = 'Hair'), 'Hair transformations', 4),

-- Beauty & Skincare
('heart', 'Facial Treatments', (SELECT id FROM public.icon_categories WHERE name = 'Beauty'), 'Facial treatments and skincare', 1),
('sparkles', 'Makeup Services', (SELECT id FROM public.icon_categories WHERE name = 'Beauty'), 'Makeup and beauty treatments', 2),
('eye', 'Eye Treatments', (SELECT id FROM public.icon_categories WHERE name = 'Beauty'), 'Eyebrow and eye treatments', 3),
('palette', 'Color Services', (SELECT id FROM public.icon_categories WHERE name = 'Beauty'), 'Color and makeup services', 4),
('sun', 'Sun Protection', (SELECT id FROM public.icon_categories WHERE name = 'Beauty'), 'Sun protection and skincare', 5),
('moon', 'Night Skincare', (SELECT id FROM public.icon_categories WHERE name = 'Beauty'), 'Night skincare treatments', 6),

-- Nail Services
('hand', 'Nail Treatments', (SELECT id FROM public.icon_categories WHERE name = 'Nails'), 'Hand and nail treatments', 1),
('gem', 'Nail Art', (SELECT id FROM public.icon_categories WHERE name = 'Nails'), 'Nail art and decorations', 2),
('diamond', 'Premium Nails', (SELECT id FROM public.icon_categories WHERE name = 'Nails'), 'Premium nail services', 3),

-- Wellness & Massage
('flower', 'Wellness Treatments', (SELECT id FROM public.icon_categories WHERE name = 'Wellness'), 'Natural and organic treatments', 1),
('shield', 'Healing Treatments', (SELECT id FROM public.icon_categories WHERE name = 'Wellness'), 'Protective and healing treatments', 2),
('star', 'Featured Wellness', (SELECT id FROM public.icon_categories WHERE name = 'Wellness'), 'Featured wellness services', 3),

-- Luxury Services
('crown', 'Luxury Services', (SELECT id FROM public.icon_categories WHERE name = 'Luxury'), 'Premium luxury services', 1),
('award', 'Award Services', (SELECT id FROM public.icon_categories WHERE name = 'Luxury'), 'Award-winning treatments', 2),
('gift', 'Gift Services', (SELECT id FROM public.icon_categories WHERE name = 'Luxury'), 'Gift and special services', 3),

-- Quick Services
('zap', 'Quick Treatments', (SELECT id FROM public.icon_categories WHERE name = 'Quick'), 'Quick express treatments', 1)
ON CONFLICT (name) DO NOTHING;

-- Add foreign key constraint for services icon_name
ALTER TABLE public.services 
ADD CONSTRAINT fk_services_icon_name 
FOREIGN KEY (icon_name) REFERENCES public.salon_icons(name);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_services_icon_name ON public.services(icon_name);
CREATE INDEX IF NOT EXISTS idx_services_icon_library ON public.services(icon_library);
CREATE INDEX IF NOT EXISTS idx_salon_icons_category ON public.salon_icons(category_id);
CREATE INDEX IF NOT EXISTS idx_salon_icons_active ON public.salon_icons(is_active);

-- Add RLS policies for icon management
ALTER TABLE public.icon_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_icons ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read icon data
CREATE POLICY "Allow authenticated users to read icon categories" ON public.icon_categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read salon icons" ON public.salon_icons
    FOR SELECT TO authenticated USING (true);

-- Allow admin users to manage icons
CREATE POLICY "Allow admin users to manage icon categories" ON public.icon_categories
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Allow admin users to manage salon icons" ON public.salon_icons
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to update service icon
CREATE OR REPLACE FUNCTION public.update_service_icon(
    service_id UUID,
    new_icon_name VARCHAR(50),
    new_icon_library VARCHAR(20) DEFAULT 'lucide'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validate icon exists
    IF NOT EXISTS (SELECT 1 FROM public.salon_icons WHERE name = new_icon_name AND is_active = true) THEN
        RAISE EXCEPTION 'Icon % does not exist or is not active', new_icon_name;
    END IF;
    
    -- Update service icon
    UPDATE public.services 
    SET 
        icon_name = new_icon_name,
        icon_library = new_icon_library,
        updated_at = NOW()
    WHERE id = service_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get service with icon data
CREATE OR REPLACE FUNCTION public.get_service_with_icon(service_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    price NUMERIC,
    duration INTEGER,
    category VARCHAR(100),
    icon_name VARCHAR(50),
    icon_library VARCHAR(20),
    icon_display_name VARCHAR(100),
    icon_description TEXT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.description,
        s.price,
        s.duration,
        s.category,
        s.icon_name,
        s.icon_library,
        si.display_name as icon_display_name,
        si.description as icon_description,
        s.is_active
    FROM public.services s
    LEFT JOIN public.salon_icons si ON s.icon_name = si.name
    WHERE s.id = service_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all services with icon data
CREATE OR REPLACE FUNCTION public.get_all_services_with_icons()
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    price NUMERIC,
    duration INTEGER,
    category VARCHAR(100),
    icon_name VARCHAR(50),
    icon_library VARCHAR(20),
    icon_display_name VARCHAR(100),
    icon_description TEXT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.description,
        s.price,
        s.duration,
        s.category,
        s.icon_name,
        s.icon_library,
        si.display_name as icon_display_name,
        si.description as icon_description,
        s.is_active
    FROM public.services s
    LEFT JOIN public.salon_icons si ON s.icon_name = si.name
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_service_icon(UUID, VARCHAR(50), VARCHAR(20)) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_service_with_icon(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_services_with_icons() TO authenticated;

-- Update existing services to have default icons if they don't have any
UPDATE public.services 
SET 
    icon_name = 'scissors',
    icon_library = 'lucide'
WHERE icon_name IS NULL OR icon_name = '';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_icon_categories_updated_at
    BEFORE UPDATE ON public.icon_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salon_icons_updated_at
    BEFORE UPDATE ON public.salon_icons
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for easy service and icon data access
CREATE OR REPLACE VIEW public.services_with_icons AS
SELECT 
    s.id,
    s.name,
    s.description,
    s.price,
    s.duration,
    s.category,
    s.icon_name,
    s.icon_library,
    si.display_name as icon_display_name,
    si.description as icon_description,
    ic.name as icon_category,
    ic.display_name as icon_category_display,
    s.is_active,
    s.created_at,
    s.updated_at
FROM public.services s
LEFT JOIN public.salon_icons si ON s.icon_name = si.name
LEFT JOIN public.icon_categories ic ON si.category_id = ic.id;

-- Grant access to the view
GRANT SELECT ON public.services_with_icons TO authenticated;

COMMENT ON TABLE public.icon_categories IS 'Salon-specific icon categories for organizing service icons';
COMMENT ON TABLE public.salon_icons IS 'Salon-specific icons for service representation';
COMMENT ON VIEW public.services_with_icons IS 'Complete service data with icon information for easy access';

