import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const FixedTestUserCreator: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [results, setResults] = useState<string>('');

  // Use the EXACT same password hashing as the authentication system
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt123'); // Same salt as auth system
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const createTestUsers = async () => {
    setIsCreating(true);
    setResults('Creating test users with correct password hashing...\n');
    
    try {
      // First, delete any existing test users
      console.log('🗑️ Cleaning up existing test users...');
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .in('email', ['admin@antilope.com', 'staff@antilope.com']);

      if (deleteError) {
        console.log('⚠️ Delete error (might be expected):', deleteError);
      }

      // Hash passwords using the same method as authentication
      const adminPasswordHash = await hashPassword('admin123');
      const staffPasswordHash = await hashPassword('staff123');

      console.log('🔐 Password hashes generated:', {
        admin: adminPasswordHash,
        staff: staffPasswordHash
      });

      setResults(prev => prev + '✅ Password hashes generated\n');

      // Create admin user
      console.log('👑 Creating admin user...');
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .insert({
          email: 'admin@antilope.com',
          password: adminPasswordHash,
          role: 'admin',
          name: 'Admin User',
          phone: '+1234567890'
        })
        .select()
        .single();

      if (adminError) {
        console.error('❌ Admin creation error:', adminError);
        setResults(prev => prev + `❌ Admin creation failed: ${adminError.message}\n`);
        throw adminError;
      }

      console.log('✅ Admin user created:', adminUser);
      setResults(prev => prev + '✅ Admin user created successfully\n');

      // Create staff user
      console.log('👤 Creating staff user...');
      const { data: staffUser, error: staffError } = await supabase
        .from('users')
        .insert({
          email: 'staff@antilope.com',
          password: staffPasswordHash,
          role: 'staff',
          name: 'Staff User',
          phone: '+1234567891'
        })
        .select()
        .single();

      if (staffError) {
        console.error('❌ Staff creation error:', staffError);
        setResults(prev => prev + `❌ Staff creation failed: ${staffError.message}\n`);
        throw staffError;
      }

      console.log('✅ Staff user created:', staffUser);
      setResults(prev => prev + '✅ Staff user created successfully\n');

      // Verify users were created
      const { data: allUsers, error: verifyError } = await supabase
        .from('users')
        .select('id, email, role, name')
        .in('email', ['admin@antilope.com', 'staff@antilope.com']);

      if (verifyError) {
        console.error('❌ Verification error:', verifyError);
        setResults(prev => prev + `❌ Verification failed: ${verifyError.message}\n`);
      } else {
        console.log('✅ Users verified:', allUsers);
        setResults(prev => prev + `✅ Verified ${allUsers?.length || 0} users created\n`);
        setResults(prev => prev + '\n🎉 Test users ready for login!\n');
        setResults(prev => prev + '📧 Admin: admin@antilope.com / admin123\n');
        setResults(prev => prev + '📧 Staff: staff@antilope.com / staff123\n');
      }

      toast.success('Test users created successfully! You can now login.');

    } catch (error: any) {
      console.error('❌ Error creating test users:', error);
      setResults(prev => prev + `❌ Error: ${error.message}\n`);
      toast.error(`Failed to create test users: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-green-800 mb-3">✅ Fixed Test User Creator</h3>
      <p className="text-sm text-green-700 mb-3">
        This uses the exact same password hashing as your authentication system.
      </p>
      
      <button
        onClick={createTestUsers}
        disabled={isCreating}
        className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 mb-3"
      >
        {isCreating ? 'Creating Test Users...' : 'Create Test Users (Fixed)'}
      </button>
      
      {results && (
        <div className="p-3 bg-gray-100 rounded text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
          {results}
        </div>
      )}
      
      <div className="mt-3 text-sm text-green-700">
        <p><strong>Test Credentials:</strong></p>
        <p>🔑 Admin: admin@antilope.com / admin123</p>
        <p>🔑 Staff: staff@antilope.com / staff123</p>
      </div>
    </div>
  );
};

export default FixedTestUserCreator;