import { useState, useEffect } from 'react';
import { supabase, TradingAccount } from '../lib/supabase';
import { toast } from 'sonner';

export function useAccounts() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching accounts...');
      
      const { data, error } = await supabase
        .from('trading_accounts')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Accounts fetched:', data);
      setAccounts(data || []);
    } catch (error: any) {
      console.error('❌ Error fetching accounts:', error);
      
      // More specific error messages
      if (error.code === '42P01') {
        toast.error('Trading accounts table not found. Please run database migration.');
      } else if (error.code === '42501') {
        toast.error('Permission denied. Check RLS policies.');
      } else if (error.message?.includes('Failed to fetch')) {
        toast.error('Network error. Check your connection.');
      } else {
        toast.error(`Failed to load accounts: ${error.message || 'Unknown error'}`);
      }
      
      // Set empty array on error to prevent app crash
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async (account: Omit<TradingAccount, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      console.log('➕ Adding account:', account);
      
      const { data, error } = await supabase
        .from('trading_accounts')
        .insert([{
          name: account.name,
          broker: account.broker,
          account_number: account.account_number || null,
          initial_balance: account.initial_balance || 0,
          currency: account.currency || 'USD',
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Insert error:', error);
        throw error;
      }

      console.log('✅ Account created:', data);
      toast.success('Account created successfully');
      await fetchAccounts();
      return data;
    } catch (error: any) {
      console.error('❌ Error adding account:', error);
      
      if (error.code === '23505') {
        toast.error('Account with this name already exists');
      } else if (error.code === '42501') {
        toast.error('Permission denied. Check database permissions.');
      } else {
        toast.error(`Failed to create account: ${error.message || 'Unknown error'}`);
      }
      throw error;
    }
  };

  const updateAccount = async (id: string, updates: Partial<TradingAccount>) => {
    try {
      console.log('📝 Updating account:', id, updates);
      
      const { error } = await supabase
        .from('trading_accounts')
        .update({
          name: updates.name,
          broker: updates.broker,
          account_number: updates.account_number || null,
          initial_balance: updates.initial_balance,
          currency: updates.currency,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Update error:', error);
        throw error;
      }

      console.log('✅ Account updated');
      toast.success('Account updated successfully');
      await fetchAccounts();
    } catch (error: any) {
      console.error('❌ Error updating account:', error);
      toast.error(`Failed to update account: ${error.message || 'Unknown error'}`);
      throw error;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      console.log('🗑️ Deleting account:', id);
      
      const { error } = await supabase
        .from('trading_accounts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Delete error:', error);
        throw error;
      }

      console.log('✅ Account deleted');
      toast.success('Account deleted successfully');
      await fetchAccounts();
    } catch (error: any) {
      console.error('❌ Error deleting account:', error);
      
      if (error.code === '23503') {
        toast.error('Cannot delete account with existing trades. Delete trades first.');
      } else {
        toast.error(`Failed to delete account: ${error.message || 'Unknown error'}`);
      }
      throw error;
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAccounts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('trading_accounts_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'trading_accounts' 
        },
        (payload) => {
          console.log('📡 Realtime update:', payload);
          fetchAccounts();
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      console.log('🔌 Unsubscribing from realtime');
      supabase.removeChannel(channel);
    };
  }, []);

  // Create default account if none exist
  useEffect(() => {
    if (!loading && accounts.length === 0) {
      console.log('📌 No accounts found, creating default...');
      
      // Only create default account once
      const hasCreatedDefault = localStorage.getItem('defaultAccountCreated');
      if (!hasCreatedDefault) {
        addAccount({
          name: 'Main Account',
          broker: 'Default Broker',
          account_number: '',
          initial_balance: 10000,
          currency: 'USD'
        }).then(() => {
          localStorage.setItem('defaultAccountCreated', 'true');
        }).catch(err => {
          console.error('Failed to create default account:', err);
        });
      }
    }
  }, [loading, accounts.length]);

  return {
    accounts,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    refreshAccounts: fetchAccounts,
  };
}
