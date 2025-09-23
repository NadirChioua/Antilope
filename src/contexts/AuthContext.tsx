import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { authService } from '@/services/database';
import { User } from '@/types';
import { z } from 'zod';

// Input validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, userData: { name: string; role: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const checkAuth = async () => {
      console.log('🔄 Starting auth check...');
      
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          // Verify user still exists in database
          const userProfile = await authService.getUserProfile(userData.id);
          if (userProfile) {
            setUser({
              id: userProfile.id,
              email: userProfile.email,
              role: userProfile.role,
              name: userProfile.name,
              createdAt: userProfile.created_at,
            });
            console.log(`✅ Session restored for ${userProfile.role}: ${userProfile.name}`);
          } else {
            console.log('🚫 User profile not found, clearing session');
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          console.log('🚫 No active session found');
          setUser(null);
        }
      } catch (error) {
        console.error("❌ Auth check error:", error);
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        console.log('✅ Auth check completed');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔄 Starting login process...');
    setIsLoading(true);
    
    try {
      // Validate input using Zod schema
      const validatedData = loginSchema.parse({ email, password });
      
      // Sign in with database authentication
      const userProfile = await authService.signIn(validatedData.email, validatedData.password);

      if (!userProfile) {
        throw new Error('Login failed - invalid credentials');
      }

      const userData: User = {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
        name: userProfile.name,
        createdAt: userProfile.created_at,
      };

      setUser(userData);
      // Store user in localStorage for session persistence
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success(`Welcome back, ${userData.name}!`);
      console.log(`✅ Login completed for ${userData.role}: ${userData.name}`);
    } catch (error) {
      console.error('❌ Login error:', error);
      let errorMessage = 'Login failed';
      
      if (error instanceof z.ZodError) {
        errorMessage = error.errors[0].message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('🔄 Logging out...');
    try {
      // Clear user from state and localStorage
      setUser(null);
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
      console.log('✅ Logout completed');
    } catch (error) {
      console.error('❌ Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const signUp = async (email: string, password: string, userData: { name: string; role: string }) => {
    console.log('🔄 Starting sign up process...');
    setIsLoading(true);
    
    try {
      // Validate input
      const validatedData = loginSchema.parse({ email, password });
      
      // Sign up with database authentication
      const userProfile = await authService.signUp(
        validatedData.email,
        validatedData.password,
        userData.name,
        userData.role as 'admin' | 'staff'
      );

      if (!userProfile) {
        throw new Error('Sign up failed - could not create user');
      }

      toast.success('Account created successfully!');
      console.log('✅ Sign up completed');
    } catch (error) {
      console.error('❌ Sign up error:', error);
      let errorMessage = 'Sign up failed';
      
      if (error instanceof z.ZodError) {
        errorMessage = error.errors[0].message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    login,
    logout,
    signUp,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
