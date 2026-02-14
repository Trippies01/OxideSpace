import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from './useSupabase';

export interface ServerMemberDisplay {
  id: string;
  username: string;
  avatar: string;
  role: string;
}

/**
 * Belirtilen sunucunun üyelerini server_members + profiles ile getirir.
 */
export function useServerMembers(serverId: string | null) {
  const supabase = useSupabase();
  const [members, setMembers] = useState<ServerMemberDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!serverId) {
      setMembers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: memberRows, error: memberErr } = await supabase
        .from('server_members')
        .select('user_id, role')
        .eq('server_id', serverId);

      if (memberErr) throw memberErr;
      if (!memberRows?.length) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const userIds = memberRows.map((r) => r.user_id);
      const { data: profileRows, error: profileErr } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (profileErr) throw profileErr;
      const profileMap = new Map<string, { username: string | null; avatar_url: string | null }>();
      (profileRows || []).forEach((p: { id: string; username: string | null; avatar_url: string | null }) => {
        profileMap.set(p.id, { username: p.username, avatar_url: p.avatar_url });
      });

      const list: ServerMemberDisplay[] = memberRows.map((row) => {
        const profile = profileMap.get(row.user_id);
        return {
          id: row.user_id,
          username: profile?.username ?? 'Kullanıcı',
          avatar: profile?.avatar_url ?? `https://api.dicebear.com/7.x/notionists/svg?seed=${row.user_id}`,
          role: row.role || 'member',
        };
      });
      setMembers(list);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [serverId, supabase]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { members, loading, error, refetch };
}
