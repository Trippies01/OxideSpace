import React, { useMemo } from 'react';
import { Track } from 'livekit-client';
import { livekitService } from '../lib/livekit';
import type { User } from '../types';
import { logger } from '../utils/logger';
import VoiceChannelView from './voice-channel/VoiceChannelView';
import type { VoiceChannelParticipant } from './voice-channel/VoiceChannelView';

interface DmCallViewProps {
    user: User;
    /** Karşı taraf (aktif DM kullanıcısı) - isim/avatar için */
    activeDmUser: { id: string; name: string; avatar?: string } | null;
    voiceState: { mic: boolean; video: boolean; screenShare: boolean; deafen?: boolean; normalVolume?: number; streamVolume?: number };
    setVoiceState: React.Dispatch<React.SetStateAction<any>>;
    livekitSpeakingIds: Set<string>;
    livekitVideoTracks: Map<string, { track: Track; source: string; muted: boolean }>;
    livekitFocusedKey: string | null;
    setLivekitFocusedKey: (key: string | null) => void;
    livekitPinnedKey: string | null;
    setLivekitPinnedKey: (key: string | null) => void;
    livekitFullscreen: boolean;
    setLivekitFullscreen: (v: boolean) => void;
    addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    onLeave: () => void;
    setVoiceChannelUsers: React.Dispatch<React.SetStateAction<any[]>>;
}

export const DmCallView = React.memo(function DmCallView({
    user,
    activeDmUser,
    voiceState,
    setVoiceState,
    livekitSpeakingIds,
    livekitVideoTracks,
    setLivekitFocusedKey,
    livekitPinnedKey,
    setLivekitPinnedKey,
    livekitFullscreen,
    setLivekitFullscreen,
    addToast,
    onLeave,
    setVoiceChannelUsers,
}: DmCallViewProps) {
    const room = livekitService.getRoom();
    const isDmCall = room?.name.startsWith('dm_call_');

    const participants: VoiceChannelParticipant[] = useMemo(() => {
        if (!room || !isDmCall) return [];
        const list: VoiceChannelParticipant[] = [];
        const getKey = (identity: string, source: string) => `${identity}:${source}`;

        // Kendim (identity = userId)
        const localId = room.localParticipant.identity;
        const localCam = livekitVideoTracks.has(getKey(localId, Track.Source.Camera));
        const localScreen = livekitVideoTracks.has(getKey(localId, Track.Source.ScreenShare));
        const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
        list.push({
            id: localId,
            name: 'Sen',
            seed: user.username || user.id,
            talking: livekitSpeakingIds.has(localId),
            muted: !!(micPub && micPub.isMuted),
            camera: localCam,
            screen: localScreen,
            avatar: user.avatar,
        });

        // Uzak katılımcılar
        room.remoteParticipants.forEach((p) => {
            const cam = livekitVideoTracks.has(getKey(p.identity, Track.Source.Camera));
            const screen = livekitVideoTracks.has(getKey(p.identity, Track.Source.ScreenShare));
            const displayName = activeDmUser?.id === p.identity ? activeDmUser.name : (p.name || p.identity);
            list.push({
                id: p.identity,
                name: displayName,
                seed: p.identity,
                talking: livekitSpeakingIds.has(p.identity),
                muted: false,
                camera: cam,
                screen,
                avatar: activeDmUser?.id === p.identity ? activeDmUser.avatar : undefined,
            });
        });

        return list;
    }, [room, isDmCall, user, activeDmUser, livekitVideoTracks, livekitSpeakingIds]);

    const handleLeave = async () => {
        try {
            await livekitService.leaveRoom();
            setVoiceChannelUsers([]);
            setLivekitFocusedKey(null);
            setLivekitPinnedKey(null);
            setLivekitFullscreen(false);
            onLeave();
            addToast('Görüşme sonlandırıldı.', 'info');
        } catch (e) {
            logger.error('DM call leave error', e);
            addToast('Görüşmeden ayrılırken hata oluştu.', 'error');
            onLeave();
        }
    };

    const handleVideoToggle = async () => {
        try {
            const next = !voiceState.video;
            await livekitService.setCameraEnabled(next);
            setVoiceState((p: any) => ({ ...p, video: next }));
        } catch (e) {
            addToast(e instanceof Error ? e.message : 'Kamera açılamadı', 'error');
            setVoiceState((p: any) => ({ ...p, video: false }));
        }
    };

    const handleMicToggle = async () => {
        try {
            const next = !voiceState.mic;
            await livekitService.setMicrophoneEnabled(next);
            setVoiceState((p: any) => ({ ...p, mic: next }));
        } catch (e) {
            addToast(e instanceof Error ? e.message : 'Mikrofon açılamadı', 'error');
            setVoiceState((p: any) => ({ ...p, mic: false }));
        }
    };

    const handleSpeakerToggle = async () => {
        const next = !(voiceState.deafen ?? false);
        try {
            await livekitService.setDeafened(next);
            setVoiceState((p: any) => ({ ...p, deafen: next, mic: next ? false : p.mic }));
        } catch (e) {
            addToast(e instanceof Error ? e.message : 'Ses ayarı yapılamadı', 'error');
        }
    };

    const handleScreenShareToggle = async () => {
        try {
            const next = !voiceState.screenShare;
            await livekitService.setScreenShareEnabled(next);
            setVoiceState((p: any) => ({ ...p, screenShare: next }));
        } catch (e) {
            addToast(e instanceof Error ? e.message : 'Ekran paylaşımı başlatılamadı', 'error');
            setVoiceState((p: any) => ({ ...p, screenShare: false }));
        }
    };

    const handleStreamVolumeChange = (value: number) => {
        setVoiceState((p: any) => ({ ...p, streamVolume: value }));
        const n = (voiceState.normalVolume ?? 100) / 100;
        livekitService.setRemoteVolumes(n, value / 100);
    };

    const handleNormalVolumeChange = (value: number) => {
        setVoiceState((p: any) => ({ ...p, normalVolume: value }));
        const s = (voiceState.streamVolume ?? 100) / 100;
        livekitService.setRemoteVolumes(value / 100, s);
    };

    if (!room || !isDmCall) return null;

    const channelName = activeDmUser ? `Görüşme - ${activeDmUser.name}` : 'Görüşme';

    return (
        <VoiceChannelView
            channelName={channelName}
            channelBadge="DM"
            participants={participants}
            videoTracks={livekitVideoTracks}
            isMuted={!voiceState.mic}
            isDeafened={voiceState.deafen ?? false}
            isVideoOn={voiceState.video}
            isScreenShareOn={voiceState.screenShare}
            onMicToggle={handleMicToggle}
            onDeafenToggle={handleSpeakerToggle}
            onVideoToggle={handleVideoToggle}
            onScreenShareToggle={handleScreenShareToggle}
            onDisconnect={handleLeave}
            streamVolume={voiceState.streamVolume ?? 100}
            normalVolume={voiceState.normalVolume ?? 100}
            onStreamVolumeChange={handleStreamVolumeChange}
            onNormalVolumeChange={handleNormalVolumeChange}
        />
    );
});
