import { useState, useEffect } from 'react';
import { supabase, JournalEntry } from '../lib/supabase';
import { toast } from 'sonner';

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error('Error fetching journal entries:', error);
      toast.error('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert([entry])
        .select()
        .single();

      if (error) throw error;

      toast.success('Journal entry added');
      await fetchEntries();
      return data;
    } catch (error: any) {
      console.error('Error adding journal entry:', error);
      toast.error('Failed to add journal entry');
      throw error;
    }
  };

  const updateEntry = async (id: string, updates: Partial<JournalEntry>) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Journal entry updated');
      await fetchEntries();
    } catch (error: any) {
      console.error('Error updating journal entry:', error);
      toast.error('Failed to update journal entry');
      throw error;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Journal entry deleted');
      await fetchEntries();
    } catch (error: any) {
      console.error('Error deleting journal entry:', error);
      toast.error('Failed to delete journal entry');
      throw error;
    }
  };

  useEffect(() => {
    fetchEntries();

    const channel = supabase
      .channel('journal_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'journal_entries' },
        () => {
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    refreshEntries: fetchEntries,
  };
}
