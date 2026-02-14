import React, { useMemo } from 'react';
import type { Track } from 'livekit-client';
import { livekitService } from '../lib/livekit';
import type { User, VoiceState, VoiceChannelUser } from '../types';
import { logger } from '../utils/logger';
import VoiceChannelView from './voice-channel/VoiceChannelView';
import type { VoiceChannelParticipant } from './voice-channel/VoiceChannelView';

interface VoiceChannelControlsProps {
    user: User;
    voiceState: VoiceState;
    setVoiceState: React.Dispatch<React.SetStateAction<VoiceState>>;
    voiceChannelUsers: VoiceChannelUser[];
    livekitSpeakingIds: Set<string>;
    livekitVideoTracks: Map<string, { track: Track; source: string; muted: boolean }>;
    livekitFocusedKey: string | null;
    setLivekitFocusedKey: (key: string | null) => void;
    livekitPinnedKey: string | null;
    setLivekitPinnedKey: (key: string | null) => void;
    livekitFullscreen: boolean;
    setLivekitFullscreen: (fullscreen: boolean) => void;
    focusedKey: string | null;
    focusedEntry: { track: Track; source: string; muted: boolean } | null;
    focusedId: string | null;
    isFullscreen: boolean;
    setActiveChannelId: (id: string | null) => void;
    setChannelType: (type: string) => void;
    setConnectedVoiceChannelId?: (id: string | null) => void;
    setVoiceChannelUsers: React.Dispatch<React.SetStateAction<VoiceChannelUser[]>>;
    addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    channelName?: string;
    onOpenTextChat?: () => void;
    onOpenSettings?: () => void;
}

export const VoiceChannelControls = React.memo(({
    user,
    voiceState,
    setVoiceState,
    voiceChannelUsers,
    livekitSpeakingIds,
    livekitVideoTracks,
    setLivekitFocusedKey,
    livekitPinnedKey,
    setLivekitPinnedKey,
    livekitFullscreen,
    setLivekitFullscreen,
    focusedKey,
    focusedEntry,
    focusedId,
    isFullscreen,
    setActiveChannelId,
    setChannelType,
    setConnectedVoiceChannelId,
    setVoiceChannelUsers,
    addToast,
    channelName = 'Ses Kanalı',
    onOpenTextChat,
    onOpenSettings
}: VoiceChannelControlsProps) => {
    const handleLeave = async () => {
        try {
            await livekitService.leaveRoom();
            setConnectedVoiceChannelId?.(null);
            setActiveChannelId(null);
            setChannelType('text');
            setVoiceChannelUsers([]);
            setLivekitFocusedKey(null);
            setLivekitPinnedKey(null);
            setLivekitFullscreen(false);
            addToast('Ses kanalından ayrıldın.', 'info');
        } catch (error: unknown) {
            logger.error('Voice leave error:', error);
            addToast('Ses kanalından ayrılırken hata oluştu', 'error');
        }
    };

    const handleVideoToggle = async () => {
        try {
            const next = !voiceState.video;
            await livekitService.setCameraEnabled(next);
            setVoiceState((p: VoiceState) => ({ ...p, video: next }));
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Kamera açılamadı', 'error');
            setVoiceState((p: VoiceState) => ({ ...p, video: false }));
        }
    };

    const handleMicToggle = async () => {
        try {
            const next = !voiceState.mic;
            await livekitService.setMicrophoneEnabled(next);
            setVoiceState((p: VoiceState) => ({ ...p, mic: next }));
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Mikrofon açılamadı', 'error');
            setVoiceState((p: VoiceState) => ({ ...p, mic: false }));
        }
    };

    const handleSpeakerToggle = async () => {
        try {
            const next = !voiceState.deafen;
            await livekitService.setDeafened(next);
            if (!next) {
                const n = (voiceState.normalVolume ?? 100) / 100;
                const s = (voiceState.streamVolume ?? 100) / 100;
                livekitService.setRemoteVolumes(n, s);
            }
            setVoiceState((p: VoiceState) => ({ ...p, deafen: next, mic: next ? false : p.mic }));
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Ses ayarı yapılamadı', 'error');
            setVoiceState((p: VoiceState) => ({ ...p, deafen: false }));
        }
    };

    const handleStreamVolumeChange = (value: number) => {
        setVoiceState((p: VoiceState) => ({ ...p, streamVolume: value }));
        const n = (voiceState.normalVolume ?? 100) / 100;
        livekitService.setRemoteVolumes(n, value / 100);
    };

    const handleNormalVolumeChange = (value: number) => {
        setVoiceState((p: VoiceState) => ({ ...p, normalVolume: value }));
        const s = (voiceState.streamVolume ?? 100) / 100;
        livekitService.setRemoteVolumes(value / 100, s);
    };

    const handleScreenShareToggle = async () => {
        try {
            const next = !voiceState.screenShare;
            await livekitService.setScreenShareEnabled(next);
            setVoiceState((p: VoiceState) => ({ ...p, screenShare: next }));
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Ekran paylaşımı başlatılamadı', 'error');
            setVoiceState((p: VoiceState) => ({ ...p, screenShare: false }));
        }
    };

    const selfParticipant: VoiceChannelUser = useMemo(() => ({
        id: user.id,
        username: user.username,
        avatar_url: user.avatar,
        avatar: user.avatar,
        muted: !voiceState.mic,
        deafened: voiceState.deafen,
        video_enabled: voiceState.video,
        screen_share_enabled: voiceState.screenShare,
    }), [user, voiceState]);

    const allParticipants: VoiceChannelUser[] = useMemo(() => {
        const others = voiceChannelUsers.filter((u) => u.id !== user.id);
        return [selfParticipant, ...others];
    }, [selfParticipant, voiceChannelUsers, user.id]);

    const viewParticipants: VoiceChannelParticipant[] = useMemo(() =>
        allParticipants.map((p) => ({
            id: p.id,
            name: p.id === user.id ? 'Sen' : (p.username || `User-${p.id.slice(-4)}`),
            seed: p.username || p.id.slice(-8) || p.id,
            talking: livekitSpeakingIds.has(p.id),
            muted: p.muted ?? false,
            camera: p.video_enabled ?? false,
            screen: p.screen_share_enabled ?? false,
            avatar: p.avatar_url || (p as VoiceChannelUser & { avatar?: string }).avatar,
        })),
        [allParticipants, user.id, livekitSpeakingIds]
    );

    return (
        <VoiceChannelView
            channelName={channelName}
            channelBadge="Ses"
            participants={viewParticipants}
            videoTracks={livekitVideoTracks}
            isMuted={!voiceState.mic}
            isDeafened={voiceState.deafen}
            isVideoOn={voiceState.video}
            isScreenShareOn={voiceState.screenShare}
            onMicToggle={handleMicToggle}
            onDeafenToggle={handleSpeakerToggle}
            onVideoToggle={handleVideoToggle}
            onScreenShareToggle={handleScreenShareToggle}
            onDisconnect={handleLeave}
            onOpenTextChat={onOpenTextChat}
            onSettingsClick={onOpenSettings}
            streamVolume={voiceState.streamVolume ?? 100}
            normalVolume={voiceState.normalVolume ?? 100}
            onStreamVolumeChange={handleStreamVolumeChange}
            onNormalVolumeChange={handleNormalVolumeChange}
        />
    );
});
VoiceChannelControls.displayName = 'VoiceChannelControls';
