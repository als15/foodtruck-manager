import { createClient } from '@supabase/supabase-js';

// For local development, create a .env.local file with your credentials
// For production, replace these with your actual Supabase credentials
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'REPLACE_WITH_YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'REPLACE_WITH_YOUR_SUPABASE_KEY';

if (supabaseUrl === 'REPLACE_WITH_YOUR_SUPABASE_URL') {
  console.warn('🔧 Setup Required: Please update your Supabase credentials');
  console.warn('📝 Edit src/lib/supabase.ts and replace the placeholder values');
  console.warn('🌐 Or set environment variables in your deployment platform');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      ingredients: {
        Row: {
          id: string;
          name: string;
          cost_per_unit: number;
          unit: string;
          supplier: string;
          category: string;
          is_available: boolean;
          last_updated: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          cost_per_unit: number;
          unit: string;
          supplier: string;
          category: string;
          is_available?: boolean;
          last_updated?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cost_per_unit?: number;
          unit?: string;
          supplier?: string;
          category?: string;
          is_available?: boolean;
          last_updated?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: number;
          category: string;
          allergens: string[];
          is_available: boolean;
          prep_time: number;
          total_ingredient_cost: number;
          profit_margin: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          price: number;
          category: string;
          allergens?: string[];
          is_available?: boolean;
          prep_time: number;
          total_ingredient_cost?: number;
          profit_margin?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          price?: number;
          category?: string;
          allergens?: string[];
          is_available?: boolean;
          prep_time?: number;
          total_ingredient_cost?: number;
          profit_margin?: number;
          updated_at?: string;
        };
      };
      menu_item_ingredients: {
        Row: {
          id: string;
          menu_item_id: string;
          ingredient_id: string;
          quantity: number;
          unit: string;
          cost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          ingredient_id: string;
          quantity: number;
          unit: string;
          cost?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          menu_item_id?: string;
          ingredient_id?: string;
          quantity?: number;
          unit?: string;
          cost?: number;
        };
      };
      employees: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          position: string;
          hourly_rate: number;
          hire_date: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          position: string;
          hourly_rate: number;
          hire_date: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          position?: string;
          hourly_rate?: number;
          hire_date?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      shifts: {
        Row: {
          id: string;
          employee_id: string;
          date: string;
          start_time: string;
          end_time: string;
          hours_worked: number;
          role: string;
          location: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          date: string;
          start_time: string;
          end_time: string;
          hours_worked: number;
          role: string;
          location?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          hours_worked?: number;
          role?: string;
          location?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          date: string;
          type: 'revenue' | 'expense';
          category: string;
          amount: number;
          description: string;
          location: string;
          payment_method: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          type: 'revenue' | 'expense';
          category: string;
          amount: number;
          description: string;
          location?: string;
          payment_method?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          type?: 'revenue' | 'expense';
          category?: string;
          amount?: number;
          description?: string;
          location?: string;
          payment_method?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          name: string;
          address: string;
          lat: number;
          lng: number;
          type: 'event' | 'regular' | 'special';
          permits_required: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          lat: number;
          lng: number;
          type: 'event' | 'regular' | 'special';
          permits_required?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          lat?: number;
          lng?: number;
          type?: 'event' | 'regular' | 'special';
          permits_required?: string[];
          updated_at?: string;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          name: string;
          category: string;
          current_stock: number;
          unit: string;
          min_threshold: number;
          cost_per_unit: number;
          supplier: string;
          last_restocked: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          current_stock: number;
          unit: string;
          min_threshold: number;
          cost_per_unit: number;
          supplier?: string;
          last_restocked: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          current_stock?: number;
          unit?: string;
          min_threshold?: number;
          cost_per_unit?: number;
          supplier?: string;
          last_restocked?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          loyalty_points: number;
          total_orders: number;
          total_spent: number;
          favorite_items: string[];
          last_visit: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email?: string;
          phone?: string;
          loyalty_points?: number;
          total_orders?: number;
          total_spent?: number;
          favorite_items?: string[];
          last_visit: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          loyalty_points?: number;
          total_orders?: number;
          total_spent?: number;
          favorite_items?: string[];
          last_visit?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];