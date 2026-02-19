// Channel Management Hook
import { useState, useCallback } from 'react';
import { useSupabase } from './useSupabase';

export function useChannelManagement() {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteChannel = useCallback(
    async (channelId: string) => {
      try {
        setLoading(true);
        setError(null);

        const { error: deleteError } = await supabase
          .from('channels')
          .delete()
          .eq('id', channelId);

        if (deleteError) throw deleteError;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Kanal silinemedi');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const updateChannel = useCallback(
    async (channelId: string, updates: { name?: string; category?: string; canvas_url?: string | null }) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: updateError } = await supabase
          .from('channels')
          .update(updates)
          .eq('id', channelId)
          .select()
          .single();

        if (updateError) throw updateError;
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Kanal güncellenemedi');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  return {
    deleteChannel,
    updateChannel,
    loading,
    error,
  };
}


