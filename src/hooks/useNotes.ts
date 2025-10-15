import { useState, useEffect } from 'react';
import { supabase, Note } from '../lib/supabase';
import { toast } from 'sonner';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([note])
        .select()
        .single();

      if (error) throw error;

      toast.success('Note added');
      await fetchNotes();
      return data;
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
      throw error;
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Note updated');
      await fetchNotes();
    } catch (error: any) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
      throw error;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Note deleted');
      await fetchNotes();
    } catch (error: any) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
      throw error;
    }
  };

  useEffect(() => {
    fetchNotes();

    const channel = supabase
      .channel('notes_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        () => {
          fetchNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    refreshNotes: fetchNotes,
  };
}
