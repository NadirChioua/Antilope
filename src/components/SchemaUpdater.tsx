import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

const SchemaUpdater: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [schemaStatus, setSchemaStatus] = useState<string>('');

  const checkSchema = async () => {
    try {
      // Check if password column exists by trying to select it
      const { data, error } = await supabase
        .from('users')
        .select('password')
        .limit(1);

      if (error) {
        if (error.message.includes('password')) {
          setSchemaStatus('❌ Password column is missing');
          return false;
        }
        throw error;
      }

      setSchemaStatus('✅ Password column exists');
      return true;
    } catch (error) {
      console.error('Schema check error:', error);
      setSchemaStatus('❌ Error checking schema');
      return false;
    }
  };

  const addPasswordColumn = async () => {
    setIsUpdating(true);
    try {
      // Use Supabase's SQL execution to add the column
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          DO $$ 
          BEGIN
              IF NOT EXISTS (
                  SELECT 1 
                  FROM information_schema.columns 
                  WHERE table_name = 'users' 
                  AND column_name = 'password'
                  AND table_schema = 'public'
              ) THEN
                  ALTER TABLE public.users 
                  ADD COLUMN password VARCHAR(255);
              END IF;
          END $$;
        `
      });

      if (error) {
        // If the RPC doesn't exist, try direct SQL execution
        console.log('RPC method not available, trying direct approach...');
        
        // Alternative: Try to insert a test record to see if column exists
        const testResult = await supabase
          .from('users')
          .insert({
            email: 'test@schema.com',
            password: 'test',
            name: 'Schema Test',
            role: 'staff'
          });

        if (testResult.error && testResult.error.message.includes('password')) {
          throw new Error('Password column does not exist. Please run the SQL script manually in your Supabase dashboard.');
        } else if (!testResult.error) {
          // Clean up test record
          await supabase
            .from('users')
            .delete()
            .eq('email', 'test@schema.com');
        }
      }

      await checkSchema();
      toast.success('Schema updated successfully!');
      
    } catch (error) {
      console.error('Schema update error:', error);
      toast.error('Failed to update schema: ' + (error as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  React.useEffect(() => {
    checkSchema();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-red-50 border-red-200">
      <h3 className="text-lg font-semibold mb-2 text-red-800">Database Schema Status</h3>
      <p className="text-sm text-gray-600 mb-2">
        Status: <span className="font-mono">{schemaStatus}</span>
      </p>
      
      <div className="space-y-2">
        <button
          onClick={checkSchema}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Check Schema
        </button>
        
        <button
          onClick={addPasswordColumn}
          disabled={isUpdating}
          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 ml-2"
        >
          {isUpdating ? 'Updating...' : 'Add Password Column'}
        </button>
      </div>
      
      <div className="mt-3 p-2 bg-yellow-100 rounded text-xs">
        <strong>Manual Alternative:</strong> Run the SQL script <code>add-password-column.sql</code> in your Supabase dashboard if the automatic update fails.
      </div>
    </div>
  );
};

export default SchemaUpdater;