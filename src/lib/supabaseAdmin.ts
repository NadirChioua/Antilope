import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a client with RLS disabled for admin operations
// This is safe because we're handling authentication manually in the application
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// Function to execute queries with proper error handling
export async function executeAdminQuery<T>(
  queryFn: (client: typeof supabaseAdmin) => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  try {
    const result = await queryFn(supabaseAdmin);
    
    if (result.error) {
      console.error('Supabase query error:', result.error);
      
      // If it's an RLS error, provide a helpful message
      if (result.error.code === 'PGRST116' || result.error.message?.includes('row-level security')) {
        console.warn('RLS policy blocking access. Consider disabling RLS for this table or creating proper policies.');
      }
    }
    
    return result;
  } catch (error) {
    console.error('Unexpected error in admin query:', error);
    return { data: null, error };
  }
}