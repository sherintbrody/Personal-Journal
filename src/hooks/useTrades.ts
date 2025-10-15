import { useState, useEffect } from 'react';
import { supabase, Trade } from '../lib/supabase';
import { toast } from 'sonner';

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const transformedData = data?.map(trade => ({
        ...trade,
        timestamp: new Date(trade.timestamp),
        openDate: new Date(trade.open_date),
        closeDate: trade.close_date ? new Date(trade.close_date) : undefined,
      })) || [];

      setTrades(transformedData as any);
    } catch (error: any) {
      console.error('Error fetching trades:', error);
      toast.error('Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  const addTrade = async (trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .insert([{
          instrument: trade.instrument,
          lot_size: trade.lot_size,
          entry_price: trade.entry_price,
          stop_loss: trade.stop_loss,
          take_profit: trade.take_profit,
          result: trade.result,
          notes: trade.notes,
          emotion: trade.emotion,
          mindset_before: trade.mindset_before,
          mindset_after: trade.mindset_after,
          timestamp: trade.timestamp,
          type: trade.type,
          exit_price: trade.exit_price,
          status: trade.status,
          open_date: trade.open_date,
          close_date: trade.close_date,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Trade added successfully');
      await fetchTrades();
      return data;
    } catch (error: any) {
      console.error('Error adding trade:', error);
      toast.error('Failed to add trade');
      throw error;
    }
  };

  const updateTrade = async (id: string, updates: Partial<Trade>) => {
    try {
      const { error } = await supabase
        .from('trades')
        .update({
          instrument: updates.instrument,
          lot_size: updates.lot_size,
          entry_price: updates.entry_price,
          stop_loss: updates.stop_loss,
          take_profit: updates.take_profit,
          result: updates.result,
          notes: updates.notes,
          emotion: updates.emotion,
          mindset_before: updates.mindset_before,
          mindset_after: updates.mindset_after,
          exit_price: updates.exit_price,
          status: updates.status,
          close_date: updates.close_date,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Trade updated successfully');
      await fetchTrades();
    } catch (error: any) {
      console.error('Error updating trade:', error);
      toast.error('Failed to update trade');
      throw error;
    }
  };

  const deleteTrade = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Trade deleted successfully');
      await fetchTrades();
    } catch (error: any) {
      console.error('Error deleting trade:', error);
      toast.error('Failed to delete trade');
      throw error;
    }
  };

  useEffect(() => {
    fetchTrades();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('trades_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trades' },
        () => {
          fetchTrades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    trades,
    loading,
    addTrade,
    updateTrade,
    deleteTrade,
    refreshTrades: fetchTrades,
  };
}
