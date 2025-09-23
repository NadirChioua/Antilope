import { supabase } from '@/lib/supabaseClient';

export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Check if environment variables are loaded
    console.log('Environment variables:');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
    
    // Test 2: Check authentication status
    console.log('🔄 Checking authentication status...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
    } else {
      console.log('🔐 Auth session:', session ? 'Authenticated' : 'Not authenticated');
      if (session) {
        console.log('User:', session.user?.email);
      }
    }
    
    // Test 3: Try different queries to understand the issue
    console.log('🔄 Testing different queries...');
    
    // Test 3a: Try to access users table (which should work for authentication)
    console.log('🔄 Testing users table access...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Users table error:', usersError);
    } else {
      console.log('✅ Users table accessible:', usersData);
    }
    
    // Test 3b: Try to access clients table
    console.log('🔄 Testing clients table access...');
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Clients table error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Test 3c: Try with different select
      console.log('🔄 Testing clients table with different query...');
      const { data: clientsData2, error: clientsError2 } = await supabase
        .from('clients')
        .select('id')
        .limit(1);
        
      if (clientsError2) {
        console.error('❌ Clients table (id only) error:', clientsError2);
      } else {
        console.log('✅ Clients table (id only) accessible:', clientsData2);
      }
      
      return { success: false, error: error.message };
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Query result:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Auto-run test when this module is imported
testSupabaseConnection();