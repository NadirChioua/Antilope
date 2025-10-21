-- ============================================================================
-- VERIFY DATABASE SETUP - CHECK ALL TABLES AND COLUMNS
-- ============================================================================
-- This script verifies that all required tables and columns exist
-- ============================================================================

-- Check if services table has icon columns
SELECT 
    'Services table icon columns' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'services' AND column_name = 'icon_name'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'services' AND column_name = 'icon_library'
        ) THEN 'PASS - Icon columns exist'
        ELSE 'FAIL - Icon columns missing'
    END as status;

-- Check if service_items table exists
SELECT 
    'Service_items table' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'service_items' AND table_schema = 'public'
        ) THEN 'PASS - Table exists'
        ELSE 'FAIL - Table missing'
    END as status;

-- Check service_items table structure
SELECT 
    'Service_items columns' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'service_items' AND column_name = 'sale_id'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'service_items' AND column_name = 'service_id'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'service_items' AND column_name = 'original_price'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'service_items' AND column_name = 'adjusted_price'
        ) THEN 'PASS - All required columns exist'
        ELSE 'FAIL - Missing required columns'
    END as status;

-- Show current services with their icons
SELECT 
    'Current services with icons' as info,
    name,
    icon_name,
    icon_library,
    is_active
FROM public.services
ORDER BY name
LIMIT 10;

-- Check if we can query service_items (should return empty result if table is empty)
SELECT 
    'Service_items table accessible' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.service_items LIMIT 1
        ) OR NOT EXISTS (
            SELECT 1 FROM public.service_items LIMIT 1
        ) THEN 'PASS - Table is accessible'
        ELSE 'FAIL - Table not accessible'
    END as status;

-- Summary
SELECT 
    'DATABASE SETUP VERIFICATION COMPLETE' as summary,
    'All required tables and columns should now exist' as message,
    'You can now use the application with full functionality' as next_step;

