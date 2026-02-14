import { useCallback, useEffect } from 'react';
import { Track } from 'livekit-client';
import { useSupabase } from './useSupabase';
import { livekitService } from '../lib/livekit';
import { useVoiceContext } from '../contexts/VoiceContext';
import { useServerContext } from '../contexts/ServerContext';
import { useUIContext } from '../contexts/UIContext';
import type { VoiceChannelUser } from '../types';

/**
 * Voice channel yönetimi için custom hook
 * Voice channel'a katılma, kullanıcı listesi, LiveKit event handling
 */
export function useVoiceChannel() {
  const supabase = useSupabase();
  const { activeChannelId, channelType } = useServerContext();
  const {
    voiceChannelUsers,
    setVoiceChannelUsers,
  } = useVoiceContext();
  const { addToast } = useUIContext();

  /**
   * Voice channel kullanıcılarını çek (voice_states + LiveKit room participant'ları)
   */
  const fetchVoiceChannelUsers = useCallback(
    async (channelId: string) => {
      if (!channelId) return;

      try {
        // 1. voice_states tablosundan kullanıcıları çek
        const { data: voiceStatesData, error: voiceStatesError } = await supabase
          .from('voice_states')
          .select(
            `
            *,
            profiles:user_id (
              id,
              username,
              avatar_url,
              status
            )
          `
          )
          .eq('channel_id', channelId);

        if (voiceStatesError) {
          logger.error('Voice state fetch error:', voiceStatesError);
          addToast('Ses kanalı kullanıcıları yüklenemedi.', 'error');
        }

        // 2. LiveKit room'daki participant'ları al
        const room = livekitService.getRoom();
        const participantIds = new Set<string>();

        if (room) {
          // Local participant
          if (room.localParticipant.identity) {
            participantIds.add(room.localParticipant.identity);
          }

          // Remote participants
          room.remoteParticipants.forEach((participant) => {
            if (participant.identity) {
              participantIds.add(participant.identity);
            }
          });
        }

        // 3. Participant ID'lerinden profile bilgilerini çek
        const participantIdArray = Array.from(participantIds);
        let participantProfiles: any[] = [];

        if (participantIdArray.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, status')
            .in('id', participantIdArray);

          if (profilesError) {
            logger.error('Profiles fetch error:', profilesError);
          } else if (profilesData) {
            participantProfiles = profilesData;
          }
        }

        // 4. voice_states'ten gelen kullanıcıları map'le
        const voiceStatesUsers = new Map<string, VoiceChannelUser>();
        if (voiceStatesData) {
          voiceStatesData.forEach((vs: any) => {
            if (vs.profiles) {
              voiceStatesUsers.set(vs.user_id, {
                ...vs.profiles,
                muted: vs.muted,
                deafened: vs.deafened,
                video_enabled: vs.video_enabled,
                screen_share_enabled: vs.screen_share_enabled,
              });
            }
          });
        }

        // 5. LiveKit participant'larını ekle/güncelle
        const allUsers = new Map<string, VoiceChannelUser>(voiceStatesUsers);
        const currentRoom = livekitService.getRoom();

        participantProfiles.forEach((profile) => {
          const existingUser = allUsers.get(profile.id);
          if (currentRoom) {
            const participant =
              currentRoom.remoteParticipants.get(profile.id) ||
              (currentRoom.localParticipant.identity === profile.id
                ? currentRoom.localParticipant
                : null);

            if (participant) {
              const micPub = participant.getTrackPublication(Track.Source.Microphone);
              const cameraPub = participant.getTrackPublication(Track.Source.Camera);
              const screenPub = participant.getTrackPublication(Track.Source.ScreenShare);

              if (existingUser) {
                // Mevcut kullanıcıyı güncelle
                allUsers.set(profile.id, {
                  ...existingUser,
                  muted: micPub ? micPub.isMuted : existingUser.muted,
                  video_enabled: cameraPub ? !!cameraPub.track : existingUser.video_enabled,
                  screen_share_enabled: screenPub ? !!screenPub.track : existingUser.screen_share_enabled,
                });
              } else {
                // Yeni participant
                allUsers.set(profile.id, {
                  ...profile,
                  muted: micPub ? micPub.isMuted : false,
                  deafened: false,
                  video_enabled: cameraPub ? !!cameraPub.track : false,
                  screen_share_enabled: screenPub ? !!screenPub.track : false,
                });
              }
            }
          }
        });

        // 6. Final listeyi oluştur
        setVoiceChannelUsers(Array.from(allUsers.values()));
      } catch (error) {
        logger.error('fetchVoiceChannelUsers error:', error);
        addToast('Ses kanalı kullanıcıları yüklenirken hata oluştu.', 'error');
      }
    },
    [supabase, addToast, setVoiceChannelUsers]
  );

  /**
   * Voice channel kullanıcılarını dinle (realtime subscriptions)
   */
  useEffect(() => {
    if (!activeChannelId || channelType !== 'voice') {
      setVoiceChannelUsers([]);
      return;
    }

    let isMounted = true;
    let voiceStatesChannel: ReturnType<typeof supabase.channel> | null = null;
    let roomEventHandlers: Array<{ event: string; handler: () => void }> = [];

    const setupSubscriptions = async () => {
      // Realtime subscription for voice states
      voiceStatesChannel = supabase
        .channel(`voice_states:${activeChannelId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'voice_states',
            filter: `channel_id=eq.${activeChannelId}`,
          },
          () => {
            if (isMounted) {
              fetchVoiceChannelUsers(activeChannelId);
            }
          }
        )
        .subscribe();

      // LiveKit room events
      const room = livekitService.getRoom();
      if (room && isMounted) {
        const handleParticipantConnected = () => {
          if (isMounted) {
            fetchVoiceChannelUsers(activeChannelId);
          }
        };
        const handleParticipantDisconnected = () => {
          if (isMounted) {
            fetchVoiceChannelUsers(activeChannelId);
          }
        };

        room.on('participantConnected', handleParticipantConnected);
        room.on('participantDisconnected', handleParticipantDisconnected);

        roomEventHandlers = [
          { event: 'participantConnected', handler: handleParticipantConnected },
          { event: 'participantDisconnected', handler: handleParticipantDisconnected },
        ];

        // Initial fetch
        fetchVoiceChannelUsers(activeChannelId);
      }
    };

    setupSubscriptions();

    return () => {
      isMounted = false;

      // Cleanup Supabase channel
      if (voiceStatesChannel) {
        supabase.removeChannel(voiceStatesChannel);
      }

      // Cleanup LiveKit room events
      const room = livekitService.getRoom();
      if (room && roomEventHandlers.length > 0) {
        roomEventHandlers.forEach(({ event, handler }) => {
          room.off(event as any, handler);
        });
      }
    };
  }, [activeChannelId, channelType, supabase, fetchVoiceChannelUsers, setVoiceChannelUsers]);

  return {
    fetchVoiceChannelUsers,
    voiceChannelUsers,
  };
}
