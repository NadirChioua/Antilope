import { createClient } from '@supabase/supabase-js';

// Direct Supabase configuration - no environment variables needed
const supabaseUrl = 'https://htutmoxrlaurizekvvxf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dXRtb3hybGF1cml6ZWt2dnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5ODczMzIsImV4cCI6MjA3MzU2MzMzMn0.B3tw3ANbKpxVN2P-EwhfmTvfcdaskhEVQthD6FYS-5Y';

console.log('✅ Supabase configuration loaded successfully');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey.substring(0, 20) + '...');

// Création du client avec options de timeout et de retry
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
  global: {
    fetch: (...args) => {
      console.log('🔄 Supabase fetch request initiated');
      return fetch(...args).then(response => {
        console.log(`📡 Supabase response status: ${response.status}`);
        return response;
      }).catch(error => {
        console.error('❌ Supabase fetch error:', error);
        throw error;
      });
    },
    headers: {
      'X-Client-Info': 'antilope-centre-beaute'
    },
  },
  realtime: {
    timeout: 30000, // 30 secondes
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'staff';
          name: string;
          phone?: string;
          avatar?: string;
          created_at: string;
          last_login?: string;
        };
        Insert: {
          id?: string;
          email: string;
          role: 'admin' | 'staff';
          name: string;
          phone?: string;
          avatar?: string;
          created_at?: string;
          last_login?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'staff';
          name?: string;
          phone?: string;
          avatar?: string;
          created_at?: string;
          last_login?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email?: string;
          notes?: string;
          last_visit?: string;
          total_visits: number;
          total_spent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string;
          notes?: string;
          last_visit?: string;
          total_visits?: number;
          total_spent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string;
          notes?: string;
          last_visit?: string;
          total_visits?: number;
          total_spent?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          name_ar?: string;
          name_fr?: string;
          description?: string;
          price: number;
          duration: number;
          category: string;
          is_active: boolean;
          required_products: any;
          assigned_staff: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_ar?: string;
          name_fr?: string;
          description?: string;
          price: number;
          duration: number;
          category: string;
          is_active?: boolean;
          required_products?: any;
          assigned_staff?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_ar?: string;
          name_fr?: string;
          description?: string;
          price?: number;
          duration?: number;
          category?: string;
          is_active?: boolean;
          required_products?: any;
          assigned_staff?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          name_ar?: string;
          name_fr?: string;
          brand: string;
          category: string;
          volume: number;
          unit: string;
          quantity: number;
          min_quantity: number;
          price: number;
          cost: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_ar?: string;
          name_fr?: string;
          brand: string;
          category: string;
          volume: number;
          unit: string;
          quantity: number;
          min_quantity: number;
          price: number;
          cost: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_ar?: string;
          name_fr?: string;
          brand?: string;
          category?: string;
          volume?: number;
          unit?: string;
          quantity?: number;
          min_quantity?: number;
          price?: number;
          cost?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sales: {
        Row: {
          id: string;
          client_id: string;
          service_id: string;
          staff_id: string;
          products: any;
          total_amount: number;
          payment_method: 'cash' | 'card' | 'transfer';
          status: 'completed' | 'refunded';
          notes?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          service_id: string;
          staff_id: string;
          products: any;
          total_amount: number;
          payment_method: 'cash' | 'card' | 'transfer';
          status?: 'completed' | 'refunded';
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          service_id?: string;
          staff_id?: string;
          products?: any;
          total_amount?: number;
          payment_method?: 'cash' | 'card' | 'transfer';
          status?: 'completed' | 'refunded';
          notes?: string;
          created_at?: string;
        };
      };
    };
  };
}
