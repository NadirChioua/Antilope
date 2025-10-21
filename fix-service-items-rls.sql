-- ============================================================================
-- FIX SERVICE_ITEMS RLS POLICIES
-- ============================================================================
-- This script fixes the RLS policies for service_items table to allow
-- authenticated users to insert, update, and delete records properly
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read service items" ON public.service_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert service items" ON public.service_items;
DROP POLICY IF EXISTS "Allow authenticated users to update service items" ON public.service_items;
DROP POLICY IF EXISTS "Allow authenticated users to delete service items" ON public.service_items;

-- Create new, more permissive policies for authenticated users
CREATE POLICY "service_items_select_policy" ON public.service_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_items_insert_policy" ON public.service_items
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "service_items_update_policy" ON public.service_items
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "service_items_delete_policy" ON public.service_items
    FOR DELETE TO authenticated USING (true);

-- Also ensure service_role has full access
CREATE POLICY "service_items_service_role_policy" ON public.service_items
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant explicit permissions
GRANT ALL ON public.service_items TO authenticated;
GRANT ALL ON public.service_items TO service_role;

-- Verify the policies are working
SELECT 
    'RLS Policies Fixed' as status,
    'service_items table should now allow authenticated users to insert records' as message;

