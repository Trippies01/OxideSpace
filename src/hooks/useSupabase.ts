// useSupabase - Gelişmiş Supabase hook'ları
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types/supabase';

/**
 * Supabase client'ı döndüren hook
 * Client singleton olduğu için memoize edilmiş
 */
export function useSupabase(): SupabaseClient {
  return useMemo(() => supabase, []);
}

/**
 * Authentication hook - Session ve user yönetimi
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabase();

  useEffect(() => {
    let cancelled = false;

    // Initial session check - always set loading false (success or error) so login page can show
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!cancelled) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      })
      .catch((err) => {
        logger.error('Session check failed:', err);
        if (!cancelled) {
          setSession(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, metadata?: Record<string, any>) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
        },
      });
      if (error) throw error;
      return data;
    },
    [supabase]
  );

  const resetPasswordForEmail = useCallback(
    async (email: string) => {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
    },
    [supabase]
  );

  return {
    session,
    user,
    loading,
    signOut,
    signIn,
    signUp,
    resetPasswordForEmail,
    isAuthenticated: !!session && !!user,
  };
}

/**
 * User Profile hook
 */
export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = useSupabase();
  const { user } = useAuth();

  const targetUserId = userId || user?.id;

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (fetchError) {
        // Profile yoksa oluştur
        if (fetchError.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: targetUserId,
              username: null,
              discriminator: null,
              avatar_url: `https://api.dicebear.com/7.x/notionists/svg?seed=${targetUserId}`,
              status: 'online',
            })
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newProfile);
        } else {
          throw fetchError;
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Profile yüklenemedi'));
      logger.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, supabase]);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!targetUserId) throw new Error('User ID gerekli');

      try {
        const { data, error: updateError } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId)
          .select()
          .single();

        if (updateError) throw updateError;
        setProfile(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Profile güncellenemedi');
        setError(error);
        throw error;
      }
    },
    [targetUserId, supabase]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
}

/**
 * Servers hook - Discord gibi: Kullanıcının üye olduğu sunucuları SQL'den çeker.
 * F5: Auth tam yüklenene kadar fetch yapmaz; sonra tek sefer çeker (server_members → servers).
 */
export function useServers() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = useSupabase();
  const { user, loading: authLoading } = useAuth();

  const fetchServers = useCallback(async () => {
    try {
      setError(null);
      if (!user?.id) {
        setServers([]);
        setLoading(false);
        return;
      }
      setLoading(true);

      const { data: memberRows, error: memberErr } = await supabase
        .from('server_members')
        .select('server_id')
        .eq('user_id', user.id);

      if (memberErr) throw memberErr;
      const serverIds = (memberRows || []).map((r) => r.server_id);
      if (serverIds.length === 0) {
        setServers([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('servers')
        .select('id, created_at, name, icon_url, owner_id')
        .in('id', serverIds)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setServers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Servers yüklenemedi'));
      logger.error('Servers fetch error:', err);
      setServers([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    fetchServers();
  }, [authLoading, fetchServers]);

  return {
    servers,
    loading,
    error,
    refetch: fetchServers,
  };
}

/**
 * Channels hook
 */
export function useChannels(serverId: string | null) {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabase = useSupabase();

  const fetchChannels = useCallback(async () => {
    if (!serverId || serverId === 'dm') {
      setChannels([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('channels')
        .select('*')
        .eq('server_id', serverId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setChannels(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Channels yüklenemedi'));
      logger.error('Channels fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [serverId, supabase]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return {
    channels,
    loading,
    error,
    refetch: fetchChannels,
  };
}

/**
 * Messages hook
 */
export function useMessages(channelId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabase = useSupabase();

  const fetchMessages = useCallback(async () => {
    if (!channelId || channelId.length < 36) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*, profiles:user_id(username, avatar_url)')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Transform messages to match app format
      const transformedMessages = (data || []).map((msg: any) => ({
        id: msg.id,
        user: msg.profiles?.username || 'Unknown',
        content: msg.content,
        time: new Date(msg.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isMe: false, // Will be set based on current user
        avatar: msg.profiles?.avatar_url || '',
      }));

      setMessages(transformedMessages);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Messages yüklenemedi'));
      logger.error('Messages fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [channelId, supabase]);

  const sendMessage = useCallback(
    async (content: string, userId: string) => {
      if (!channelId || !content.trim()) return;

      try {
        const { data, error: sendError } = await supabase
          .from('messages')
          .insert({
            channel_id: channelId,
            user_id: userId,
            content: content.trim(),
          })
          .select('*, profiles:user_id(username, avatar_url)')
          .single();

        if (sendError) throw sendError;

        // Add to local state
        const newMessage = {
          id: data.id,
          user: data.profiles?.username || 'Unknown',
          content: data.content,
          time: new Date(data.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isMe: true,
          avatar: data.profiles?.avatar_url || '',
        };

        setMessages((prev) => [...prev, newMessage]);
        return newMessage;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Mesaj gönderilemedi');
        setError(error);
        throw error;
      }
    },
    [channelId, supabase]
  );

  const updateMessage = useCallback(
    async (messageId: string, userId: string, content: string) => {
      if (!channelId || !content.trim()) return;
      try {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ content: content.trim() })
          .eq('id', messageId)
          .eq('user_id', userId);
        if (updateError) throw updateError;
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, content: content.trim() } : m))
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Mesaj güncellenemedi');
        setError(error);
        throw error;
      }
    },
    [channelId, supabase]
  );

  useEffect(() => {
    if (!channelId || channelId.length < 36) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    let messagesChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscription = async () => {
      // Initial fetch
      await fetchMessages();

      // Subscribe to new messages and deletions
      messagesChannel = supabase
        .channel(`messages:${channelId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${channelId}`,
          },
          async (payload) => {
            if (!isMounted) return;
            
            // Optimistic update: Add new message directly instead of refetching all
            try {
              const { data: newMessage, error: fetchError } = await supabase
                .from('messages')
                .select('*, profiles:user_id(username, avatar_url)')
                .eq('id', payload.new.id)
                .single();

              if (!fetchError && newMessage && isMounted) {
                const transformedMessage = {
                  id: newMessage.id,
                  user: newMessage.profiles?.username || 'Unknown',
                  content: newMessage.content,
                  time: new Date(newMessage.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  isMe: false,
                  avatar: newMessage.profiles?.avatar_url || '',
                };
                setMessages((prev) => {
                  if (prev.some((m) => m.id === transformedMessage.id)) return prev;
                  return [...prev, transformedMessage];
                });
              } else if (isMounted) {
                // Fallback to full fetch if optimistic update fails
                fetchMessages();
              }
            } catch (error) {
              logger.error('Error adding new message:', error);
              if (isMounted) {
                fetchMessages();
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${channelId}`,
          },
          (payload) => {
            if (!isMounted) return;
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${channelId}`,
          },
          (payload) => {
            if (!isMounted) return;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === payload.new.id ? { ...m, content: (payload.new as any).content } : m
              )
            );
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (messagesChannel) {
        supabase.removeChannel(messagesChannel);
      }
    };
  }, [channelId, supabase, fetchMessages]);

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
    sendMessage,
    updateMessage,
  };
}
