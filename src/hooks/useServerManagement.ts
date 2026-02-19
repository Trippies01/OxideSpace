import { useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { useServerContext } from '../contexts/ServerContext';
import { useUIContext } from '../contexts/UIContext';
import type { Server } from '../types';
import { logger } from '../utils/logger';

/**
 * Server yönetimi için custom hook
 * Server oluşturma, silme, güncelleme işlemleri
 */
export function useServerManagement() {
  const supabase = useSupabase();
  const { setServers, refetchServers } = useServerContext();
  const { addToast } = useUIContext();

  /**
   * Yeni server oluştur
   */
  const createServer = useCallback(
    async (name: string, iconFile?: File) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Kullanıcı giriş yapmamış');
        }

        // Icon upload
        let iconUrl: string | null = null;
        if (iconFile) {
          const fileExt = iconFile.name.split('.').pop();
          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
          const filePath = `server-icons/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('server-icons')
            .upload(filePath, iconFile, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            throw new Error('Icon yüklenemedi: ' + uploadError.message);
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from('server-icons').getPublicUrl(filePath);
          iconUrl = publicUrl;
        }

        // Server oluştur
        const { data: serverData, error: serverError } = await supabase
          .from('servers')
          .insert({
            name: name.trim(),
            icon_url: iconUrl,
            owner_id: user.id,
          })
          .select()
          .single();

        if (serverError) {
          throw serverError;
        }

        // Server member ekle (owner)
        const { error: memberError } = await supabase.from('server_members').insert({
          server_id: serverData.id,
          user_id: user.id,
        });

        if (memberError) {
          logger.error('Member ekleme hatası:', memberError);
        }

        // Optimistic update
        const newServer: Server = {
          id: serverData.id,
          name: serverData.name,
          icon: iconUrl,
          type: 'server',
          ownerId: serverData.owner_id,
        };

        setServers((prev) => [...prev, newServer]);
        await refetchServers();
        addToast('Sunucu oluşturuldu!', 'success');
        return serverData;
      } catch (error: any) {
        const errorMessage = error.message || 'Sunucu oluşturulamadı';
        addToast(errorMessage, 'error');
        throw error;
      }
    },
    [supabase, setServers, refetchServers, addToast]
  );

  /**
   * Server'a katıl (invite code ile)
   */
  const joinServer = useCallback(
    async (inviteCode: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Kullanıcı giriş yapmamış');
        }

        // Invite code'dan server_id'yi bul
        const { data: inviteData, error: inviteError } = await supabase
          .from('server_invites')
          .select('server_id')
          .eq('code', inviteCode)
          .single();

        if (inviteError || !inviteData) {
          throw new Error('Geçersiz davet kodu');
        }

        // Server member ekle
        const { error: memberError } = await supabase.from('server_members').insert({
          server_id: inviteData.server_id,
          user_id: user.id,
        });

        if (memberError) {
          if (memberError.code === '23505') {
            // Already a member
            addToast('Zaten bu sunucunun üyesisin!', 'info');
            return;
          }
          throw memberError;
        }

        await refetchServers();
        addToast('Sunucuya katıldın!', 'success');
      } catch (error: any) {
        const errorMessage = error.message || 'Sunucuya katılamadı';
        addToast(errorMessage, 'error');
        throw error;
      }
    },
    [supabase, refetchServers, addToast]
  );

  /**
   * Channel oluştur
   */
  const createChannel = useCallback(
    async (serverId: string, name: string, type: 'text' | 'voice' | 'canvas', category?: string) => {
      try {
        const { data: maxRow } = await supabase
          .from('channels')
          .select('position')
          .eq('server_id', serverId)
          .order('position', { ascending: false })
          .limit(1)
          .maybeSingle();
        const nextPosition = (maxRow?.position ?? -1) + 1;

        const { data: channelData, error: channelError } = await supabase
          .from('channels')
          .insert({
            server_id: serverId,
            name: name.trim(),
            type,
            category: category || 'GENEL',
            position: nextPosition,
          })
          .select()
          .single();

        if (channelError) {
          throw channelError;
        }

        addToast('Kanal oluşturuldu!', 'success');
        return channelData;
      } catch (error: any) {
        const errorMessage = error.message || 'Kanal oluşturulamadı';
        addToast(errorMessage, 'error');
        throw error;
      }
    },
    [supabase, addToast]
  );

  /**
   * Channel sil
   */
  const deleteChannel = useCallback(
    async (channelId: string) => {
      try {
        const { error } = await supabase.from('channels').delete().eq('id', channelId);

        if (error) {
          throw error;
        }

        addToast('Kanal silindi!', 'success');
      } catch (error: any) {
        const errorMessage = error.message || 'Kanal silinemedi';
        addToast(errorMessage, 'error');
        throw error;
      }
    },
    [supabase, addToast]
  );

  return {
    createServer,
    joinServer,
    createChannel,
    deleteChannel,
  };
}
