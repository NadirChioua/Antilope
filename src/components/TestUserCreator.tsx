import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

const TestUserCreator: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt123');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const createTestUsers = async () => {
    setIsCreating(true);
    try {
      const hashedPassword = await hashPassword('123456');
      console.log('Generated hash:', hashedPassword);

      // First, delete existing test users
      await supabase
        .from('users')
        .delete()
        .in('email', ['admin@test.com', 'staff@test.com']);

      // Create admin user
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .insert({
          email: 'admin@test.com',
          password: hashedPassword,
          name: 'Test Admin',
          role: 'admin'
        })
        .select()
        .single();

      if (adminError) {
        console.error('Admin user creation error:', adminError);
        throw adminError;
      }

      // Create staff user
      const { data: staffUser, error: staffError } = await supabase
        .from('users')
        .insert({
          email: 'staff@test.com',
          password: hashedPassword,
          name: 'Test Staff',
          role: 'staff'
        })
        .select()
        .single();

      if (staffError) {
        console.error('Staff user creation error:', staffError);
        throw staffError;
      }

      console.log('Created users:', { adminUser, staffUser });
      toast.success('Test users created successfully!');
      
      // Verify users exist
      const { data: allUsers, error: fetchError } = await supabase
        .from('users')
        .select('email, name, role, password')
        .in('email', ['admin@test.com', 'staff@test.com']);

      if (fetchError) {
        console.error('Error fetching users:', fetchError);
      } else {
        console.log('Verified users in database:', allUsers);
      }

    } catch (error) {
      console.error('Error creating test users:', error);
      toast.error('Failed to create test users: ' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
      <h3 className="text-lg font-semibold mb-2">Test User Creator</h3>
      <p className="text-sm text-gray-600 mb-4">
        Create test users for authentication testing:
        <br />
        • admin@test.com / 123456 (Admin role)
        <br />
        • staff@test.com / 123456 (Staff role)
      </p>
      <button
        onClick={createTestUsers}
        disabled={isCreating}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isCreating ? 'Creating...' : 'Create Test Users'}
      </button>
    </div>
  );
};

export default TestUserCreator;