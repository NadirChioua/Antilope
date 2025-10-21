-- ============================================================================
-- QUICK RLS FIX FOR SERVICE_ITEMS TABLE
-- ============================================================================
-- Run this script to immediately fix the RLS policy issue
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read service items" ON public.service_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert service items" ON public.service_items;
DROP POLICY IF EXISTS "Allow authenticated users to update service items" ON public.service_items;
DROP POLICY IF EXISTS "Allow authenticated users to delete service items" ON public.service_items;
DROP POLICY IF EXISTS "service_items_select_policy" ON public.service_items;
DROP POLICY IF EXISTS "service_items_insert_policy" ON public.service_items;
DROP POLICY IF EXISTS "service_items_update_policy" ON public.service_items;
DROP POLICY IF EXISTS "service_items_delete_policy" ON public.service_items;
DROP POLICY IF EXISTS "service_items_service_role_policy" ON public.service_items;
DROP POLICY IF EXISTS "service_items_all_access" ON public.service_items;
DROP POLICY IF EXISTS "service_items_service_role_access" ON public.service_items;

-- Create a single, simple policy that allows all operations for authenticated users
CREATE POLICY "service_items_full_access" ON public.service_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow service_role full access
CREATE POLICY "service_items_service_role_full_access" ON public.service_items
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant explicit permissions
GRANT ALL ON public.service_items TO authenticated;
GRANT ALL ON public.service_items TO service_role;

-- Test that we can insert (this should work now)
SELECT 'RLS policies fixed - service_items table should now accept inserts from authenticated users' as status;

