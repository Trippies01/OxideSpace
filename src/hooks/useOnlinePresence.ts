import { useState, useEffect, useRef } from 'react';
import { useSupabase } from './useSupabase';

/**
 * Çevrimiçi durum: Supabase Realtime presence ile uygulama açık olan kullanıcıları takip eder.
 * Dönen Set ile üye listesi / arkadaş listesinde online/offline gösterilebilir.
 */
export function useOnlinePresence(userId: string | undefined): Set<string> {
  const supabase = useSupabase();
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) {
      setOnlineIds(new Set());
      return;
    }

    const channelName = 'presence:online';
    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const ids = new Set<string>();
        Object.values(state).forEach((presences) => {
          (presences as Array<{ user_id?: string }>).forEach((p) => {
            if (p.user_id && p.user_id !== userId) ids.add(p.user_id);
          });
        });
        setOnlineIds(ids);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setOnlineIds(new Set());
    };
  }, [userId, supabase]);

  return onlineIds;
}
