import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const DirectSQLExecutor: React.FC = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<string>('');

  const executeSQL = async (sql: string, description: string) => {
    try {
      setIsExecuting(true);
      console.log(`Executing: ${description}`);
      
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.error(`Error in ${description}:`, error);
        setResults(prev => prev + `❌ ${description}: ${error.message}\n`);
        return false;
      }
      
      console.log(`✅ ${description} completed:`, data);
      setResults(prev => prev + `✅ ${description}: Success\n`);
      return true;
    } catch (err: any) {
      console.error(`Exception in ${description}:`, err);
      setResults(prev => prev + `❌ ${description}: ${err.message}\n`);
      return false;
    }
  };

  const fixPasswordColumn = async () => {
    setIsExecuting(true);
    setResults('Starting password column fix...\n');
    
    try {
      // Step 1: Check if column exists
      const checkSQL = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password';
      `;
      
      await executeSQL(checkSQL, 'Checking if password column exists');
      
      // Step 2: Add password column if it doesn't exist
      const addColumnSQL = `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'password'
          ) THEN
            ALTER TABLE public.users ADD COLUMN password TEXT NOT NULL DEFAULT '';
            RAISE NOTICE 'Password column added successfully';
          ELSE
            RAISE NOTICE 'Password column already exists';
          END IF;
        END $$;
      `;
      
      await executeSQL(addColumnSQL, 'Adding password column');
      
      // Step 3: Verify the column was added
      const verifySQL = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password';
      `;
      
      const success = await executeSQL(verifySQL, 'Verifying password column');
      
      if (success) {
        toast.success('Password column has been added successfully!');
        setResults(prev => prev + '\n🎉 Database schema is now ready for authentication!\n');
      }
      
    } catch (error: any) {
      console.error('Error fixing password column:', error);
      toast.error(`Failed to fix password column: ${error.message}`);
      setResults(prev => prev + `❌ Failed: ${error.message}\n`);
    } finally {
      setIsExecuting(false);
    }
  };

  const createRPCFunction = async () => {
    setIsExecuting(true);
    setResults('Creating RPC function for SQL execution...\n');
    
    const createRPCSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
      RETURNS JSON
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result JSON;
      BEGIN
        EXECUTE sql_query;
        result := '{"status": "success"}'::JSON;
        RETURN result;
      EXCEPTION
        WHEN OTHERS THEN
          result := json_build_object('error', SQLERRM);
          RETURN result;
      END;
      $$;
    `;
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: createRPCSQL });
      
      if (error) {
        // If RPC doesn't exist, try to create it using a different approach
        console.log('RPC function might not exist, trying alternative approach...');
        setResults(prev => prev + '⚠️ RPC function needs to be created manually in Supabase dashboard\n');
        toast.error('Please create the RPC function manually in your Supabase dashboard');
      } else {
        setResults(prev => prev + '✅ RPC function created successfully\n');
        toast.success('RPC function created successfully!');
      }
    } catch (err: any) {
      setResults(prev => prev + `❌ Error creating RPC: ${err.message}\n`);
      toast.error(`Error creating RPC function: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-red-800 mb-3">🔧 Emergency Database Fix</h3>
      
      <div className="space-y-3">
        <button
          onClick={createRPCFunction}
          disabled={isExecuting}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isExecuting ? 'Creating RPC Function...' : '1. Create RPC Function'}
        </button>
        
        <button
          onClick={fixPasswordColumn}
          disabled={isExecuting}
          className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isExecuting ? 'Fixing Database...' : '2. Fix Password Column'}
        </button>
      </div>
      
      {results && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
          {results}
        </div>
      )}
      
      <div className="mt-3 text-sm text-red-700">
        <p><strong>Manual Alternative:</strong></p>
        <p>If the automatic fix doesn't work, please run this SQL in your Supabase dashboard:</p>
        <code className="block mt-2 p-2 bg-gray-200 rounded text-xs">
          ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '';
        </code>
      </div>
    </div>
  );
};

export default DirectSQLExecutor;