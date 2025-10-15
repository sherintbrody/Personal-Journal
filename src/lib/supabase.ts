import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Environment Check:');
console.log('URL:', supabaseUrl ? '✅ Loaded' : '❌ Missing');
console.log('Key:', supabaseAnonKey ? '✅ Loaded' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials missing!');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseAnonKey);
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('✅ Supabase client created');

// Test connection
supabase
  .from('trades')
  .select('count')
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
    } else {
      console.log('✅ Supabase connection successful!');
    }
  });

// Database types
export interface Trade {
  id: string;
  user_id?: string;
  account_id?: string; // ADD THIS
  instrument: string;
  lot_size: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  result: number;
  notes: string;
  emotion: string;
  mindset_before: string;
  mindset_after: string;
  timestamp: string;
  type: 'buy' | 'sell';
  exit_price?: number;
  status: 'open' | 'closed';
  open_date: string;
  close_date?: string;
  created_at?: string;
  updated_at?: string;
}

// ADD THIS NEW INTERFACE
export interface TradingAccount {
  id: string;
  user_id?: string;
  name: string;
  broker: string;
  account_number?: string;
  initial_balance: number;
  currency: string;
  created_at?: string;
  updated_at?: string;
}

export interface JournalEntry {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  date: string;
  mood?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Note {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
}
