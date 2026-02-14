import { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabase } from './useSupabase';

export interface TypingUser {
  userId: string;
  username: string;
}

const TYPING_DEBOUNCE_MS = 2000;

/**
 * Typing indicator: Supabase Realtime presence ile "X yazıyor..." gösterir.
 * roomKey: kanal için channelId, DM için `dm:${threadId}`
 */
export function useTypingIndicator(
  roomKey: string | null,
  userId: string | undefined,
  username: string
) {
  const supabase = useSupabase();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isTypingRef = useRef(false);

  const setTyping = useCallback(
    async (typing: boolean) => {
      if (!roomKey || !userId) return;
      if (isTypingRef.current === typing) return;
      isTypingRef.current = typing;
      const ch = channelRef.current;
      if (!ch) return;
      try {
        await ch.track({
          user_id: userId,
          username: username || 'Kullanıcı',
          typing,
        });
      } catch {
        // presence track fail is non-critical
      }
    },
    [roomKey, userId, username]
  );

  useEffect(() => {
    if (!roomKey || !userId) {
      setTypingUsers([]);
      return;
    }

    const channelName = `typing:${roomKey}`;
    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const others: TypingUser[] = [];
        Object.values(state).forEach((presences) => {
          (presences as Array<{ user_id?: string; username?: string; typing?: boolean }>).forEach(
            (p) => {
              if (p.user_id && p.user_id !== userId && p.typing) {
                others.push({ userId: p.user_id, username: p.username || 'Kullanıcı' });
              }
            }
          );
        });
        setTypingUsers(others);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && isTypingRef.current) {
          await channel.track({
            user_id: userId,
            username: username || 'Kullanıcı',
            typing: true,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setTypingUsers([]);
    };
  }, [roomKey, userId, username, supabase]);

  return { typingUsers, setTyping };
}

export function useTypingDebounce(
  inputVal: string,
  debounceMs: number = TYPING_DEBOUNCE_MS
): boolean {
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (inputVal.length > 0) {
      setIsTyping(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        timeoutRef.current = null;
      }, debounceMs);
    } else {
      setIsTyping(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [inputVal, debounceMs]);

  return isTyping;
}
