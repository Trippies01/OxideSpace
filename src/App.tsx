"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Hash, Plus, Search, Bell, LogOut, X, ChevronDown, ChevronRight, Folder,
    Image as ImageIcon, Zap, Menu,
    Volume2, Shield, CheckCircle, Loader2, Layout,
    AlertCircle, Moon, Sun,
    Speaker, Camera, PenLine, Save, Copy, Calendar,
    Music, Code2, Award, Coffee, LogIn, Github, MessageCircle, UserPlus, Check
} from 'lucide-react';
import { Track, RoomEvent } from 'livekit-client';
import {
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

// --- TİP TANIMLAMALARI ---
import type { Channel, Server } from './types';

// --- COMPONENT IMPORTS ---
import { ChatArea } from './components/ChatArea';
import { CanvasChannelView } from './components/CanvasChannelView';
import { Sidebar } from './components/Sidebar';
import { AppUpdateBanner } from './components/AppUpdateBanner';
import { GlassCard } from './components/ui/GlassCard';
import { Button } from './components/ui/Button';
import { Avatar } from './components/ui/Avatar';
import { normalizeStatus } from './utils/helpers';
import { logger } from './utils/logger';
import { MESSAGE_MAX_LENGTH, SERVER_NAME_MIN_LENGTH, SERVER_NAME_MAX_LENGTH, CHANNEL_NAME_MIN_LENGTH, CHANNEL_NAME_MAX_LENGTH, MAX_ATTACHMENT_BYTES, MAX_AVATAR_BYTES, ALLOWED_IMAGE_TYPES, ALLOWED_FILE_TYPES, AUTH_CHECK_TIMEOUT_MS } from './constants';
import { uploadMessageAttachment, uploadAvatar } from './lib/storage';

// --- SABİT VERİLER VE YAPILANDIRMA ---

const SERVER_FOLDERS_KEY = 'oxide_server_folders';

// Bildirim tipi (Supabase public.notifications ile uyumlu)
export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
  link_url: string | null;
};

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return 'Az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

// --- YARDIMCI BİLEŞENLER ---

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => (
    <div className="flex items-center gap-3 bg-[#18181b] border border-white/10 text-white px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm z-[200]">
        {type === 'success' ? <CheckCircle className="text-green-400" size={20} /> : <AlertCircle className="text-red-400" size={20} />}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-auto text-zinc-500 hover:text-white"><X size={16} /></button>
    </div>
);

const Badge = ({ type }: { type: string }) => {
    const icons: { [key: string]: React.ReactElement } = {
        developer: <Code2 size={14} className="text-blue-400" />,
        'early-supporter': <Zap size={14} className="text-yellow-400" />,
        booster: <RocketIcon size={14} className="text-pink-400" />
    };
    return (
        <div className="group relative bg-white/5 p-1.5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-help">
            {icons[type] || <Award size={14} className="text-zinc-400" />}
        </div>
    );
};


const RocketIcon = ({ className, size }: { className?: string; size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4">
            <div className="absolute inset-0" onClick={onClose} />
            <GlassCard className="w-full max-w-md rounded-3xl p-6 relative overflow-hidden border border-white/10 bg-[#121217] max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors bg-white/5 p-1 rounded-full z-10">
                    <X size={20} />
                </button>
                {title && (
                    <>
                        <h2 className="text-2xl font-bold mb-1 text-white">{title}</h2>
                        <div className="w-full h-px bg-gradient-to-r from-orange-500/50 to-transparent mb-6" />
                    </>
                )}
                {children}
            </GlassCard>
        </div>
    );
};



// --- NEW OPTIMIZED COMPONENTS ---

// --- ANA UYGULAMA BİLEŞENİ ---

const formatError = (error: unknown): string => {
    if (!error) return 'Bilinmeyen hata';
    if (typeof error === 'string') return error;
    if (error instanceof Error && error.message) return error.message;
    try {
        return JSON.stringify(error);
    } catch {
        return 'Bilinmeyen hata';
    }
};

import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import UsernameSetup from './components/UsernameSetup';
import { useSupabase, useAuth, useProfile } from './hooks/useSupabase';
import { isTauri } from './hooks/useAppUpdate';
import { useVoiceChannel, useServerManagement, useTypingIndicator, useTypingDebounce, useOnlinePresence, useServerMembers, type ServerMemberDisplay } from './hooks';
import { useServerContext, useVoiceContext, useUIContext, useUserContext, useMessageContext } from './contexts';
import { voiceService } from './lib/voice';
import { livekitService, type MediaDevice } from './lib/livekit';
import { isKoalaAvailable, createKoalaFilter, releaseKoalaFilter } from './lib/koalaFilter';
import { isRnnoiseAvailable, createRnnoiseFilter, releaseRnnoiseFilter } from './lib/rnnoiseFilter';

export default function OxideApp() {
    // --- CONTEXT HOOKS ---
    const {
        activeServerId,
        setActiveServerId,
        activeChannelId,
        setActiveChannelId,
        servers,
        setServers,
        channels,
        setChannels,
        channelType,
        setChannelType,
        connectedVoiceChannelId,
        setConnectedVoiceChannelId,
        dbServers,
        dbServersLoading,
        dbChannels,
        refetchChannels,
        refetchServers,
        setLastTextChannelIdForServer,
    } = useServerContext();

    const {
        voiceState,
        setVoiceState,
        voiceChannelUsers,
        setVoiceChannelUsers,
        livekitSpeakingIds,
        setLivekitSpeakingIds,
        livekitVideoTracks,
        setLivekitVideoTracks,
        livekitFocusedKey,
        setLivekitFocusedKey,
        livekitPinnedKey,
        setLivekitPinnedKey,
        livekitFullscreen,
        setLivekitFullscreen,
    } = useVoiceContext();

    const {
        toasts,
        addToast,
        removeToast,
        inputVal,
        setInputVal,
        showMembers,
        setShowMembers,
        isMobileMenuOpen,
        setMobileMenuOpen,
        showNotifications,
        setShowNotifications,
        showAddFriend,
        setShowAddFriend,
        searchQuery,
        setSearchQuery,
        isLoading,
        setIsLoading,
        isAuthChecking,
        setIsAuthChecking,
        view,
        setView,
        modals,
        setModals,
        newChannelName,
        setNewChannelName,
        newChannelType,
        setNewChannelType,
        newChannelCategory,
        setNewChannelCategory,
        newCategoryName,
        setNewCategoryName,
        newServerName,
        setNewServerName,
        newServerIconFile,
        setNewServerIconFile,
        newServerIconPreview,
        setNewServerIconPreview,
        joinCode,
        setJoinCode,
        inviteCode,
        setInviteCode,
        inviteLoading,
        setInviteLoading,
        newFriendName,
        setNewFriendName,
    } = useUIContext();

    // --- USER & MESSAGE CONTEXTS ---
    const {
        user,
        setUser,
        friends,
        setFriends,
        activeDmUser,
        setActiveDmUser,
    } = useUserContext();

    const {
        messages: currentMessages,
        setMessages: setCurrentMessages,
        sendMessage: sendMessageHandler,
        editMessage: editMessageHandler,
        messagesLoading: channelMessagesLoading,
    } = useMessageContext();

    // --- LOCAL STATE (component-specific) ---
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [dmMessagesLoading, setDmMessagesLoading] = useState(false);
    const [serverFolders, setServerFolders] = useState<{ id: string; name: string }[]>(() => {
        try {
            const raw = localStorage.getItem(SERVER_FOLDERS_KEY);
            if (!raw) return [];
            const data = JSON.parse(raw);
            return Array.isArray(data.folders) ? data.folders : [];
        } catch { return []; }
    });
    const [serverToFolder, setServerToFolder] = useState<Record<string, string>>(() => {
        try {
            const raw = localStorage.getItem(SERVER_FOLDERS_KEY);
            if (!raw) return {};
            const data = JSON.parse(raw);
            return data.serverToFolder && typeof data.serverToFolder === 'object' ? data.serverToFolder : {};
        } catch { return {}; }
    });
    const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(() => {
        try {
            const raw = localStorage.getItem(SERVER_FOLDERS_KEY);
            if (!raw) return new Set();
            const data = JSON.parse(raw);
            return new Set(Array.isArray(data.collapsedIds) ? data.collapsedIds : []);
        } catch { return new Set(); }
    });
    const [folderContextServer, setFolderContextServer] = useState<string | null>(null);
    const [folderMenuPos, setFolderMenuPos] = useState({ x: 0, y: 0 });
    const [newFolderName, setNewFolderName] = useState('');
    const [draggedServerId, setDraggedServerId] = useState<string | null>(null);
    const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
    const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);
    const [dropTargetUncategorized, setDropTargetUncategorized] = useState(false);
    const [dropTargetFolderOrderId, setDropTargetFolderOrderId] = useState<string | null>(null);

    useEffect(() => {
        try {
            localStorage.setItem(SERVER_FOLDERS_KEY, JSON.stringify({
                folders: serverFolders,
                serverToFolder,
                collapsedIds: Array.from(collapsedFolderIds),
            }));
        } catch (_) { /* ignore */ }
    }, [serverFolders, serverToFolder, collapsedFolderIds]);
    const [pendingAttachment, setPendingAttachment] = useState<File | null>(null);
    const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [selectedMemberForProfile, setSelectedMemberForProfile] = useState<ServerMemberDisplay | null>(null);
    const [friendRequestsIncoming, setFriendRequestsIncoming] = useState<Array<{ id: string; from_user_id: string; profiles: { id: string; username: string | null; avatar_url: string | null } | null }>>([]);
    const [requestStatusWithSelected, setRequestStatusWithSelected] = useState<'pending_sent' | 'pending_received' | 'accepted' | null>(null);

    // --- SUPABASE HOOKS ---
    const supabase = useSupabase();
    const { session, user: authUser, loading: authLoading, signOut } = useAuth();
    const { profile, loading: profileLoading, updateProfile, refetch: refetchProfile } = useProfile();

    const needsUsername = (p: typeof profile) =>
      !p?.username || /^User-[a-f0-9]{4}$/i.test(p.username || '');
    // Messages are now handled by MessageContext
    
    // --- CUSTOM HOOKS ---
    const { fetchVoiceChannelUsers } = useVoiceChannel();
    useServerManagement();
    const typingRoomKey = activeServerId === 'dm' && activeDmUser?.threadId
        ? `dm:${activeDmUser.threadId}`
        : (channelType === 'text' && activeChannelId ? activeChannelId : null);
    const isTyping = useTypingDebounce(inputVal);
    const { typingUsers, setTyping } = useTypingIndicator(typingRoomKey, authUser?.id, user.username);
    useEffect(() => {
        setTyping(isTyping);
    }, [isTyping, setTyping]);

    const onlineUserIds = useOnlinePresence(authUser?.id);
    const serverIdForMembers = activeServerId && activeServerId !== 'dm' ? activeServerId : null;
    const { members: serverMembers } = useServerMembers(serverIdForMembers);

    // Sync auth loading state - show login when auth has finished loading (or timeout)
    useEffect(() => {
        if (!authLoading) {
            setIsAuthChecking(false);
            return;
        }
        // Fallback: if auth loading takes > 8s (e.g. Supabase unreachable), show login anyway
        const timeout = window.setTimeout(() => {
            setIsAuthChecking(false);
        }, AUTH_CHECK_TIMEOUT_MS);
        return () => window.clearTimeout(timeout);
    }, [authLoading]);

    // Initialize voice service when user logs in
    useEffect(() => {
        if (authUser?.id) {
            voiceService.initialize(authUser.id);
        } else {
            voiceService.cleanup();
        }
    }, [authUser?.id]);

    // Profile sync is now handled in UserContext

    // Sync servers from DB → sidebar. F5: loading true iken [dm] ile ezme; sadece yükleme bittiğinde yaz.
    useEffect(() => {
        if (dbServersLoading) return;
        const dm = { id: 'dm', name: 'Mesajlar', icon: null, type: 'dm' as const };
        setServers((prev) => {
            const fromDb = (dbServers || []).map((s: { id: string; name: string; icon_url?: string | null; owner_id?: string | null }) => ({
                id: s.id,
                name: s.name,
                icon: s.icon_url || `https://api.dicebear.com/7.x/icons/svg?seed=${s.name}`,
                color: 'from-gray-700 to-gray-900',
                type: 'server' as const,
                ownerId: s.owner_id ?? undefined
            }));
            const fromDbIds = new Set(fromDb.map((s) => s.id));
            const optimistic = prev.filter((s): s is Server => s.id !== 'dm' && !fromDbIds.has(s.id));
            return [dm, ...optimistic, ...fromDb];
        });
    }, [dbServers, dbServersLoading]);

    // Sync channels from database
    useEffect(() => {
        if (activeServerId && dbChannels && dbChannels.length > 0) {
            setChannels(prev => ({
                ...prev,
                [activeServerId]: dbChannels.map(c => ({
                    id: c.id,
                    name: c.name,
                    type: c.type,
                    category: c.category || 'GENEL'
                }))
            }));
        }
    }, [activeServerId, dbChannels]);

    // Message sync is now handled in MessageContext

    // Kamera/mikrofon sadece ses kanalına girince veya ayarlar açılınca yüklensin (açılışta izin istemeyelim)

    // Fetch functions removed - now using hooks (useProfile, useServers, useChannels, useMessages)
    // Messages are now handled by useMessages hook with real-time subscriptions





    // UI Controls - moved to UIContext

    // Voice Controls - moved to VoiceContext and useVoiceChannel hook
    // fetchVoiceChannelUsers is now handled by useVoiceChannel hook automatically

    useEffect(() => {
        if (channelType !== 'voice') return;
        const room = livekitService.getRoom();
        if (!room) return;

        const syncState = () => {
            const micPublication = room.localParticipant.getTrackPublication(Track.Source.Microphone);
            const cameraPublication = room.localParticipant.getTrackPublication(Track.Source.Camera);
            const screenPublication = room.localParticipant.getTrackPublication(Track.Source.ScreenShare);

            setVoiceState((prev) => ({
                ...prev,
                mic: !(micPublication && micPublication.isMuted),
                video: !!cameraPublication?.track,
                screenShare: !!screenPublication?.track,
            }));
        };

        syncState();
        room.on('localTrackPublished', syncState);
        room.on('localTrackUnpublished', syncState);

        return () => {
            room.off('localTrackPublished', syncState);
            room.off('localTrackUnpublished', syncState);
        };
    }, [channelType]);

    useEffect(() => {
        if (channelType !== 'voice') {
            setLivekitSpeakingIds(new Set());
            setLivekitVideoTracks(new Map());
            setLivekitFocusedKey(null);
            setLivekitPinnedKey(null);
            setLivekitFullscreen(false);
            return;
        }

        const room = livekitService.getRoom();
        if (!room) return;

        let isMounted = true;
        const getKey = (identity: string, source: string) => `${identity}:${source}`;
        const eventHandlers: Array<{ event: string; handler: (...args: any[]) => void }> = [];

        const applyLocalVideo = () => {
            if (!isMounted) return;
            const cameraPublication = room.localParticipant.getTrackPublication(Track.Source.Camera);
            const screenPublication = room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
            const cameraTrack = cameraPublication?.track;
            const screenTrack = screenPublication?.track;

            setLivekitVideoTracks((prev) => {
                const next = new Map(prev);
                if (cameraTrack && cameraTrack.kind === 'video') {
                    next.set(getKey(room.localParticipant.identity, Track.Source.Camera), {
                        track: cameraTrack,
                        source: Track.Source.Camera,
                        muted: !!cameraPublication?.isMuted,
                    });
                } else {
                    next.delete(getKey(room.localParticipant.identity, Track.Source.Camera));
                }

                if (screenTrack && screenTrack.kind === 'video') {
                    next.set(getKey(room.localParticipant.identity, Track.Source.ScreenShare), {
                        track: screenTrack,
                        source: Track.Source.ScreenShare,
                        muted: !!screenPublication?.isMuted,
                    });
                } else {
                    next.delete(getKey(room.localParticipant.identity, Track.Source.ScreenShare));
                }
                return next;
            });
        };

        const handleTrackSubscribed = (track: Track, publication: any, participant: any) => {
            if (!isMounted || track.kind !== 'video') return;
            const source = publication?.source || Track.Source.Camera;
            setLivekitVideoTracks((prev) => {
                const next = new Map(prev);
                next.set(getKey(participant.identity, source), { track, source, muted: !!publication?.isMuted });
                return next;
            });
            if (activeChannelId && (source === Track.Source.ScreenShare || source === Track.Source.Camera)) {
                fetchVoiceChannelUsers(activeChannelId);
            }
        };

        const handleTrackUnsubscribed = (track: Track, publication: any, participant: any) => {
            if (!isMounted || track.kind !== 'video') return;
            const source = publication?.source || Track.Source.Camera;
            setLivekitVideoTracks((prev) => {
                const next = new Map(prev);
                next.delete(getKey(participant.identity, source));
                return next;
            });
            if (activeChannelId && (source === Track.Source.ScreenShare || source === Track.Source.Camera)) {
                fetchVoiceChannelUsers(activeChannelId);
            }
        };

        const handleTrackMuted = (publication: any, participant: any) => {
            if (!isMounted) return;
            const source = publication?.source || Track.Source.Camera;
            setLivekitVideoTracks((prev) => {
                const next = new Map(prev);
                const key = getKey(participant.identity, source);
                const entry = next.get(key);
                if (entry) {
                    next.set(key, { ...entry, muted: true });
                }
                return next;
            });
        };

        const handleTrackUnmuted = (publication: any, participant: any) => {
            if (!isMounted) return;
            const source = publication?.source || Track.Source.Camera;
            setLivekitVideoTracks((prev) => {
                const next = new Map(prev);
                const key = getKey(participant.identity, source);
                const entry = next.get(key);
                if (entry) {
                    next.set(key, { ...entry, muted: false });
                }
                return next;
            });
        };

        const handleParticipantDisconnected = (participant: any) => {
            if (!isMounted) return;
            setLivekitVideoTracks((prev) => {
                const next = new Map(prev);
                next.forEach((_value, key) => {
                    if (key.startsWith(`${participant.identity}:`)) {
                        next.delete(key);
                    }
                });
                return next;
            });
            setLivekitSpeakingIds((prev) => {
                const next = new Set(prev);
                next.delete(participant.identity);
                return next;
            });
        };

        const handleActiveSpeakersChanged = (speakers: any[]) => {
            if (!isMounted) return;
            setLivekitSpeakingIds(new Set(speakers.map((p) => p.identity)));
        };

        const onLocalTrackChanged = () => {
            applyLocalVideo();
            if (activeChannelId) fetchVoiceChannelUsers(activeChannelId);
        };

        // Register all event handlers
        const events = [
            { event: 'trackSubscribed', handler: handleTrackSubscribed },
            { event: 'trackUnsubscribed', handler: handleTrackUnsubscribed },
            { event: 'participantDisconnected', handler: handleParticipantDisconnected },
            { event: 'activeSpeakersChanged', handler: handleActiveSpeakersChanged },
            { event: RoomEvent.TrackMuted, handler: handleTrackMuted },
            { event: RoomEvent.TrackUnmuted, handler: handleTrackUnmuted },
            { event: 'localTrackPublished', handler: onLocalTrackChanged },
            { event: 'localTrackUnpublished', handler: onLocalTrackChanged },
        ];

        events.forEach(({ event, handler }) => {
            room.on(event as any, handler);
            eventHandlers.push({ event, handler });
        });

        // Initial setup
        applyLocalVideo();
        if (activeChannelId) fetchVoiceChannelUsers(activeChannelId);
        room.remoteParticipants.forEach((participant) => {
            participant.videoTrackPublications.forEach((publication: any) => {
                if (publication.track && publication.track.kind === 'video' && isMounted) {
                    const source = publication?.source || Track.Source.Camera;
                    setLivekitVideoTracks((prev) => {
                        const next = new Map(prev);
                        next.set(getKey(participant.identity, source), { track: publication.track, source, muted: !!publication?.isMuted });
                        return next;
                    });
                }
            });
        });

        return () => {
            isMounted = false;
            eventHandlers.forEach(({ event, handler }) => {
                room.off(event as any, handler);
            });
        };
    }, [channelType, activeChannelId, fetchVoiceChannelUsers]);

    useEffect(() => {
        if (!livekitFocusedKey) {
            setLivekitFullscreen(false);
        }
    }, [livekitFocusedKey]);

    // Modals & Settings
    // Modals moved to UIContext
    const [settingsTab, setSettingsTab] = useState('Hesabım');
    const [micTestLevel, setMicTestLevel] = useState(0);
    const [isMicTesting, setIsMicTesting] = useState(false);
    
    // Audio/Video Settings
    const [audioInputDevice, setAudioInputDevice] = useState<string>('');
    const [audioOutputDevice, setAudioOutputDevice] = useState<string>('');
    const [videoInputDevice, setVideoInputDevice] = useState<string>('');
    const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
    const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
    const [inputVolume, setInputVolume] = useState(100);
    const [outputVolume, setOutputVolume] = useState(100);
    const [inputSensitivity, setInputSensitivity] = useState(50);
    const [echoCancellation, setEchoCancellation] = useState(true);
    const [noiseSuppression, setNoiseSuppression] = useState(true);
    const [automaticGainControl, setAutomaticGainControl] = useState(true);
    const [koalaEnabled, setKoalaEnabled] = useState(() => {
        try { return localStorage.getItem('oxide_koala_enabled') === 'true'; } catch { return false; }
    });
    const [rnnoiseEnabled, setRnnoiseEnabled] = useState(() => {
        try { return localStorage.getItem('oxide_rnnoise_enabled') === 'true'; } catch { return false; }
    });
    const [videoQuality, setVideoQuality] = useState('720p');
    const [cameraPreview, setCameraPreview] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

    // Profile State
    const [profileTab, setProfileTab] = useState('overview');
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [tempBio, setTempBio] = useState(user.bio);
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [tempUsername, setTempUsername] = useState(user.username);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [statusMenuRect, setStatusMenuRect] = useState<{ top: number; left: number } | null>(null);
    const [isCreatingServer, setIsCreatingServer] = useState(false);
    const [isCreatingChannel, setIsCreatingChannel] = useState(false);

    // Form states moved to UIContext


    const bottomRef = useRef<HTMLDivElement>(null);
    const serverIconInputRef = useRef<HTMLInputElement>(null);
    const profileStatusMenuRef = useRef<HTMLDivElement>(null);
    const avatarFileInputRef = useRef<HTMLInputElement>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // --- EFFECTS ---
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages, activeChannelId, activeDmUser]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (isMicTesting) {
            interval = setInterval(() => setMicTestLevel(Math.random() * 100), 250);
        } else {
            setMicTestLevel(0);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isMicTesting]);

    useLayoutEffect(() => {
        if (showStatusMenu && profileStatusMenuRef.current) {
            const r = profileStatusMenuRef.current.getBoundingClientRect();
            setStatusMenuRect({ top: r.bottom + 8, left: r.left });
        } else {
            setStatusMenuRect(null);
        }
    }, [showStatusMenu]);

    useEffect(() => {
        if (!showStatusMenu) return;
        const handleClickOutside = (e: MouseEvent) => {
            const menuEl = document.getElementById('profile-status-menu');
            if (profileStatusMenuRef.current && !profileStatusMenuRef.current.contains(e.target as Node) && menuEl && !menuEl.contains(e.target as Node)) {
                setShowStatusMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showStatusMenu]);

    // Aygıt listelerini sadece ayarlar açıkken veya ses kanalındayken yükle (açılışta kamera/mikrofon açılmasın)
    useEffect(() => {
        const needDevices = modals.settings || channelType === 'voice';
        if (!needDevices) return;

        const loadDevices = async () => {
            try {
                const [audioInputs, audioOutputs, videoInputs] = await Promise.all([
                    livekitService.getAudioInputDevices(),
                    livekitService.getAudioOutputDevices(),
                    livekitService.getVideoInputDevices(),
                ]);
                setAudioDevices([
                    ...audioInputs.map(d => ({ ...d, kind: 'audioinput' as MediaDeviceKind })),
                    ...audioOutputs.map(d => ({ ...d, kind: 'audiooutput' as MediaDeviceKind })),
                ]);
                setVideoDevices(videoInputs.map(d => ({ ...d, kind: 'videoinput' as MediaDeviceKind })));
            } catch (error) {
                logger.error('Aygıt listesi yüklenemedi:', error);
            }
        };
        loadDevices();
        const onDeviceChange = () => loadDevices();
        navigator.mediaDevices.addEventListener('devicechange', onDeviceChange);
        return () => navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange);
    }, [modals.settings, channelType]);

    // Aygıt değişikliklerini LiveKit'e yansıt
    useEffect(() => {
        if (audioInputDevice) {
            livekitService.setAudioInputDevice(audioInputDevice).catch((e) => logger.error(e));
        }
    }, [audioInputDevice]);

    useEffect(() => {
        if (videoInputDevice) {
            livekitService.setVideoInputDevice(videoInputDevice).catch((e) => logger.error(e));
        }
    }, [videoInputDevice]);

    // Gelişmiş gürültü bastırma: RNNoise (açık kaynak) veya Koala (ticari)
    // Öncelik: Koala > RNNoise > Hiçbiri
    useEffect(() => {
        try { localStorage.setItem('oxide_koala_enabled', String(koalaEnabled)); } catch { /* ignore */ }
        try { localStorage.setItem('oxide_rnnoise_enabled', String(rnnoiseEnabled)); } catch { /* ignore */ }

        const reapplyMic = () => {
            const room = livekitService.getRoom();
            if (!room) return;
            const pub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
            if (pub?.track) livekitService.enableAudio(false).then(() => livekitService.enableAudio(true)).catch(() => {});
        };

        const applyFilter = async () => {
            // Öncelik 1: Koala (etkinse ve mevcutsa)
            if (koalaEnabled && isKoalaAvailable()) {
                const filter = await createKoalaFilter();
                if (filter) {
                    livekitService.setAudioFilter(filter);
                    reapplyMic();
                    return;
                }
            }

            // Öncelik 2: RNNoise (etkinse)
            if (rnnoiseEnabled && isRnnoiseAvailable()) {
                const filter = await createRnnoiseFilter();
                if (filter) {
                    livekitService.setAudioFilter(filter);
                    reapplyMic();
                    return;
                }
            }

            // Hiçbiri etkin değil
            livekitService.setAudioFilter(null);
            reapplyMic();
        };

        applyFilter().catch(() => {});

        return () => { livekitService.setAudioFilter(null); };
    }, [koalaEnabled, rnnoiseEnabled]);

    useEffect(() => {
        if (audioOutputDevice) {
            livekitService.setAudioOutputDevice(audioOutputDevice).catch((e) => logger.error(e));
        }
    }, [audioOutputDevice]);

    // Ses kısıtları: yankı iptali kapalıyken yayın sesi konuşurken kesilmez (kulaklık önerilir)
    const prevAudioOpts = useRef({ echoCancellation, noiseSuppression, automaticGainControl });
    useEffect(() => {
        livekitService.setAudioCaptureOptions({
            echoCancellation,
            noiseSuppression,
            autoGainControl: automaticGainControl,
        });
        const changed =
            prevAudioOpts.current.echoCancellation !== echoCancellation ||
            prevAudioOpts.current.noiseSuppression !== noiseSuppression ||
            prevAudioOpts.current.automaticGainControl !== automaticGainControl;
        prevAudioOpts.current = { echoCancellation, noiseSuppression, automaticGainControl };
        if (changed && channelType === 'voice') {
            const room = livekitService.getRoom();
            if (room) {
                const pub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
                if (pub?.track) {
                    livekitService.enableAudio(false).then(() => livekitService.enableAudio(true)).catch(() => {});
                }
            }
        }
    }, [echoCancellation, noiseSuppression, automaticGainControl, channelType]);

    useEffect(() => {
        return () => {
            if (newServerIconPreview) {
                URL.revokeObjectURL(newServerIconPreview);
            }
        };
    }, [newServerIconPreview]);

    useEffect(() => {
        setInviteCode('');
    }, [activeServerId]);

    const fetchDmThreads = useCallback(async () => {
        if (!authUser?.id) {
            setFriends([]);
            return;
        }

        try {
            const { data: myThreads, error: threadsError } = await supabase
                .from('dm_participants')
                .select('thread_id')
                .eq('user_id', authUser.id);

            if (threadsError) throw threadsError;

            const threadIds = (myThreads || []).map(t => t.thread_id);
            if (threadIds.length === 0) {
                setFriends([]);
                return;
            }

            const { data: others, error: othersError } = await supabase
                .from('dm_participants')
                .select('thread_id, profiles(id, username, avatar_url, status)')
                .in('thread_id', threadIds)
                .neq('user_id', authUser.id);

            if (othersError) throw othersError;

            const { data: lastMessages } = await supabase
                .from('dm_messages')
                .select('thread_id, content, created_at')
                .in('thread_id', threadIds)
                .order('created_at', { ascending: false });

            const lastByThread = new Map<string, string>();
            (lastMessages || []).forEach((msg: any) => {
                if (!lastByThread.has(msg.thread_id)) {
                    lastByThread.set(msg.thread_id, msg.content);
                }
            });

            const dmList = (others || []).map((entry: any) => {
                const profile = entry.profiles;
                const userId = profile?.id || 'unknown';
                return {
                    id: userId,
                    name: profile?.username || 'Kullanıcı',
                    status: profile?.status || 'offline',
                    avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${userId}`,
                    lastMsg: lastByThread.get(entry.thread_id),
                    threadId: entry.thread_id,
                };
            });

            setFriends(dmList);
        } catch (error) {
            logger.error('DM listesi yüklenemedi:', error);
            addToast('DM listesi yüklenemedi.', 'error');
        }
    }, [authUser?.id, supabase, addToast]);

    const fetchFriendRequestsIncoming = useCallback(async () => {
        if (!authUser?.id) {
            setFriendRequestsIncoming([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('friend_requests')
                .select('id, from_user_id, to_user_id, profiles:from_user_id(id, username, avatar_url)')
                .eq('to_user_id', authUser.id)
                .eq('status', 'pending');
            if (error) throw error;
            const list = (data || []).map((r: any) => ({
                id: r.id,
                from_user_id: r.from_user_id,
                profiles: r.profiles ?? null,
            }));
            setFriendRequestsIncoming(list);
        } catch {
            setFriendRequestsIncoming([]);
        }
    }, [authUser?.id, supabase]);

    useEffect(() => {
        fetchFriendRequestsIncoming();
    }, [fetchFriendRequestsIncoming]);

    const fetchNotifications = useCallback(async () => {
        if (!authUser?.id) {
            setNotifications([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('id, user_id, type, title, body, read, created_at, link_url')
                .eq('user_id', authUser.id)
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            setNotifications((data as AppNotification[]) || []);
        } catch {
            setNotifications([]);
        }
    }, [authUser?.id, supabase]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (!authUser?.id) return;
        const channel = supabase
            .channel('notifications-live')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${authUser.id}` }, () => {
                fetchNotifications();
            })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [authUser?.id, supabase, fetchNotifications]);

    const markNotificationRead = useCallback(async (id: string) => {
        try {
            await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', authUser?.id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch { /* ignore */ }
    }, [authUser?.id, supabase]);

    const markAllNotificationsRead = useCallback(async () => {
        if (!authUser?.id) return;
        try {
            await supabase.from('notifications').update({ read: true }).eq('user_id', authUser.id);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch { /* ignore */ }
    }, [authUser?.id, supabase]);

    useEffect(() => {
        if (!selectedMemberForProfile || !authUser?.id) {
            setRequestStatusWithSelected(null);
            return;
        }
        const memberId = selectedMemberForProfile.id;
        (async () => {
            const { data } = await supabase
                .from('friend_requests')
                .select('from_user_id, to_user_id, status')
                .or(`and(from_user_id.eq.${authUser.id},to_user_id.eq.${memberId}),and(from_user_id.eq.${memberId},to_user_id.eq.${authUser.id})`)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (!data) {
                setRequestStatusWithSelected(null);
                return;
            }
            if (data.status === 'accepted') {
                setRequestStatusWithSelected('accepted');
                return;
            }
            if (data.status === 'pending') {
                setRequestStatusWithSelected(data.from_user_id === authUser.id ? 'pending_sent' : 'pending_received');
                return;
            }
            setRequestStatusWithSelected(null);
        })();
    }, [selectedMemberForProfile?.id, authUser?.id, supabase]);

    const fetchDmMessages = useCallback(async (threadId: string) => {
        if (!threadId) return;
        setDmMessagesLoading(true);
        try {
            const { data, error } = await supabase
                .from('dm_messages')
                .select('*, profiles:user_id(username, avatar_url)')
                .eq('thread_id', threadId)
                .order('created_at', { ascending: true });

            if (error) {
                addToast('DM mesajları yüklenemedi.', 'error');
                return;
            }
            const mapped = (data || []).map((msg: any) => ({
                id: msg.id,
                user: msg.profiles?.username || 'Kullanıcı',
                content: msg.content,
                time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMe: msg.user_id === authUser?.id,
                avatar: msg.profiles?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${msg.user_id}`,
            }));
            setCurrentMessages(mapped);
        } finally {
            setDmMessagesLoading(false);
        }
    }, [authUser?.id, supabase, addToast]);

    useEffect(() => {
        fetchDmThreads();
    }, [fetchDmThreads]);

    useEffect(() => {
        const threadId = activeDmUser?.threadId;
        if (!threadId) return;

        fetchDmMessages(threadId);

        const channel = supabase
            .channel(`dm_messages:${threadId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'dm_messages',
                filter: `thread_id=eq.${threadId}`,
            }, () => {
                fetchDmMessages(threadId);
                fetchDmThreads();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeDmUser?.threadId, supabase, fetchDmMessages, fetchDmThreads]);

    // --- MEMOIZED CALLBACKS & VALUES (must be before early returns) ---
    const handleDmSelect = useCallback((friend: any) => {
        setActiveDmUser(friend);
        setShowAddFriend(false);
        if (friend.threadId) {
            fetchDmMessages(friend.threadId);
        } else {
            setCurrentMessages([]);
        }
        setMobileMenuOpen(false);
    }, [fetchDmMessages]);

    const handleSendFriendRequest = useCallback(async (member: ServerMemberDisplay) => {
        if (!authUser?.id) return;
        if (member.id === authUser.id) {
            addToast('Kendinle arkadaş olamazsın.', 'info');
            return;
        }
        try {
            const { error } = await supabase
                .from('friend_requests')
                .insert({ from_user_id: authUser.id, to_user_id: member.id, status: 'pending' });
            if (error) {
                if (error.code === '23505') {
                    addToast('Zaten istek gönderdin veya arkadaşsınız.', 'info');
                    return;
                }
                throw error;
            }
            setRequestStatusWithSelected('pending_sent');
            addToast('Arkadaşlık isteği gönderildi.', 'success');
        } catch (e: unknown) {
            addToast('İstek gönderilemedi: ' + formatError(e), 'error');
        }
    }, [authUser?.id, supabase, addToast]);

    const handleAcceptFriendRequest = useCallback(async (fromUserId: string, fromProfile?: { username: string | null; avatar_url: string | null } | null) => {
        if (!authUser?.id) return;
        try {
            const { data: threadId, error } = await supabase.rpc('accept_friend_request', { p_from_user_id: fromUserId });
            if (error) throw error;
            await fetchFriendRequestsIncoming();
            await fetchDmThreads();
            setActiveServerId('dm');
            handleDmSelect({
                id: fromUserId,
                name: fromProfile?.username ?? 'Kullanıcı',
                status: 'offline',
                avatar: fromProfile?.avatar_url ?? `https://api.dicebear.com/7.x/notionists/svg?seed=${fromUserId}`,
                threadId,
            });
            addToast('Arkadaş eklendi.', 'success');
        } catch (e: unknown) {
            addToast('Kabul edilemedi: ' + formatError(e), 'error');
        }
    }, [authUser?.id, supabase, fetchFriendRequestsIncoming, fetchDmThreads, handleDmSelect, addToast]);

    const handleRejectFriendRequest = useCallback(async (requestId: string) => {
        try {
            const { error } = await supabase
                .from('friend_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId)
                .eq('to_user_id', authUser?.id);
            if (error) throw error;
            await fetchFriendRequestsIncoming();
            addToast('İstek reddedildi.', 'info');
        } catch (e: unknown) {
            addToast('Reddedilemedi: ' + formatError(e), 'error');
        }
    }, [authUser?.id, supabase, fetchFriendRequestsIncoming, addToast]);

    const handleOpenDmWithMemberIfFriend = useCallback((member: ServerMemberDisplay) => {
        const friend = friends.find(f => f.id === member.id);
        if (friend) {
            setSelectedMemberForProfile(null);
            setActiveServerId('dm');
            handleDmSelect(friend);
        } else {
            addToast('Önce arkadaşlık isteğini kabul etmeleri gerekiyor.', 'info');
        }
    }, [friends, handleDmSelect]);

    const currentServer = useMemo(() => 
        servers.find(s => s.id === activeServerId) || servers[0],
        [servers, activeServerId]
    );
    
    const serverChannels = useMemo(() => 
        (activeServerId && channels[activeServerId]) || [],
        [channels, activeServerId]
    );

    const filteredChannels = useMemo(() => 
        serverChannels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
        [serverChannels, searchQuery]
    );
    
    const filteredFriends = useMemo(() => 
        friends.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())),
        [friends, searchQuery]
    );

    const categories = useMemo(() => filteredChannels.reduce((acc: any, ch) => {
        if (!acc[ch.category]) acc[ch.category] = [];
        acc[ch.category].push(ch);
        return acc;
    }, {}), [filteredChannels]);

    const handleAttachmentSelect = useCallback((file: File) => {
        if (file.size > MAX_ATTACHMENT_BYTES) {
            addToast(`Dosya en fazla ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB olabilir.`, 'error');
            return;
        }
        const type = file.type.toLowerCase();
        if (!ALLOWED_FILE_TYPES.includes(type)) {
            addToast('Bu dosya türü desteklenmiyor. Resim, PDF veya metin kullanın.', 'error');
            return;
        }
        setPendingAttachment(file);
        setAttachmentPreviewUrl(URL.createObjectURL(file));
    }, [addToast]);

    const handleAttachmentClear = useCallback(() => {
        if (attachmentPreviewUrl) URL.revokeObjectURL(attachmentPreviewUrl);
        setPendingAttachment(null);
        setAttachmentPreviewUrl(null);
    }, [attachmentPreviewUrl]);

    // --- ACTIONS ---

    const handleServerSwitch = (serverId: string) => {
        if (serverId === activeServerId) return;
        setIsLoading(true);
        setMobileMenuOpen(false);
        setSearchQuery('');
        setShowAddFriend(false);

        // Async işlemi direkt yap
        (async () => {
            setActiveServerId(serverId);
            if (serverId === 'dm') {
                setActiveChannelId(null);
                setActiveDmUser(null);
                setCurrentMessages([]);
                setIsLoading(false);
            } else {
                // Sunucuya geçince DM state temizlensin, kanal mesajları yüklensin
                setActiveDmUser(null);
                setCurrentMessages([]);
                await refetchChannels();
                if (dbChannels && dbChannels.length > 0) {
                    setActiveChannelId(dbChannels[0].id);
                    setChannelType(dbChannels[0].type);
                } else {
                    setActiveChannelId(null);
                }
                setIsLoading(false);
            }
        })();
    };

    const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = inputVal.trim();
        if ((!trimmed && !pendingAttachment) || !authUser?.id) return;
        if (trimmed.length > MESSAGE_MAX_LENGTH) {
            addToast(`Mesaj en fazla ${MESSAGE_MAX_LENGTH} karakter olabilir.`, 'error');
            return;
        }

        let contentToSend = trimmed;
        if (pendingAttachment) {
            try {
                const channelOrThreadId = activeServerId === 'dm' && activeDmUser?.threadId
                    ? activeDmUser.threadId
                    : (channelType === 'text' && activeChannelId ? activeChannelId : activeChannelId || '');
                const url = await uploadMessageAttachment(pendingAttachment, authUser.id, channelOrThreadId);
                const isImage = ALLOWED_IMAGE_TYPES.includes(pendingAttachment.type);
                contentToSend = contentToSend ? `${contentToSend}\n${isImage ? `[IMG:${url}]` : `[FILE:${url}]`}` : (isImage ? `[IMG:${url}]` : `[FILE:${url}]`);
            } catch (err: unknown) {
                addToast(err instanceof Error ? err.message : 'Dosya yüklenemedi', 'error');
                return;
            }
            handleAttachmentClear();
        }

        if (activeServerId === 'dm') {
            const threadId = activeDmUser?.threadId;
            if (!threadId) {
                addToast('Bir DM seçmelisiniz.', 'info');
                setInputVal('');
                return;
            }
            try {
                const { error } = await supabase
                    .from('dm_messages')
                    .insert({
                        thread_id: threadId,
                        user_id: authUser.id,
                        content: contentToSend,
                    });

                if (error) throw error;
                addToast('Mesaj gönderildi', 'success');
            } catch (error: unknown) {
                addToast(error instanceof Error ? error.message : 'DM mesajı gönderilemedi', 'error');
            }
        } else if (activeServerId && activeServerId !== 'dm' && channelType === 'text' && activeChannelId) {
            try {
                if (authUser?.id) {
                    await sendMessageHandler(contentToSend, authUser.id);
                }
            } catch (error: unknown) {
                addToast(formatError(error) || 'Mesaj gönderilemedi', 'error');
            }
        }
        setInputVal('');
    }, [inputVal, pendingAttachment, authUser?.id, activeServerId, activeDmUser?.threadId, channelType, activeChannelId, addToast, setInputVal, sendMessageHandler, supabase, handleAttachmentClear]);

    const handleEditMessage = useCallback(async (id: string | number, newContent: string) => {
        const trimmed = newContent.trim();
        if (!trimmed || trimmed.length > MESSAGE_MAX_LENGTH) return;
        if (activeServerId === 'dm') {
            try {
                const { error } = await supabase.from('dm_messages').update({ content: trimmed }).eq('id', id).eq('user_id', authUser?.id);
                if (error) throw error;
                setCurrentMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: trimmed } : m)));
                addToast('Mesaj güncellendi', 'success');
            } catch (error: unknown) {
                addToast('Mesaj güncellenemedi: ' + formatError(error), 'error');
            }
        } else if (channelType === 'text' && activeChannelId) {
            try {
                await editMessageHandler(String(id), trimmed);
                addToast('Mesaj güncellendi', 'success');
            } catch (error: unknown) {
                addToast('Mesaj güncellenemedi: ' + formatError(error), 'error');
            }
        }
    }, [activeServerId, channelType, activeChannelId, authUser?.id, supabase, addToast, setCurrentMessages, editMessageHandler]);

    const handleDeleteMessage = useCallback(async (id: string | number) => {
        const msgId = String(id);
        if (activeServerId === 'dm') {
            try {
                const { error } = await supabase.from('dm_messages').delete().eq('id', msgId);
                if (error) throw error;
                setCurrentMessages((prev) => prev.filter((m) => m.id !== id));
                addToast('Mesaj silindi', 'success');
            } catch (error: unknown) {
                addToast('Mesaj silinemedi: ' + formatError(error), 'error');
            }
        } else if (channelType === 'text' && activeChannelId) {
            try {
                const { error } = await supabase.from('messages').delete().eq('id', msgId);
                if (error) throw error;
                setCurrentMessages((prev) => prev.filter((m) => m.id !== id));
                addToast('Mesaj silindi', 'success');
            } catch (error: unknown) {
                addToast('Mesaj silinemedi: ' + formatError(error), 'error');
            }
        }
    }, [activeServerId, channelType, activeChannelId, supabase, addToast, setCurrentMessages]);

    const handleSaveCanvasData = useCallback(async (channelId: string, data: Record<string, unknown>) => {
        const { error } = await supabase.from('channels').update({ canvas_data: data }).eq('id', channelId);
        if (error) throw error;
        await refetchChannels();
    }, [supabase, refetchChannels]);

    const handleCreateChannel = async () => {
        if (isCreatingChannel) return;
        const channelName = newChannelName.trim();
        if (!channelName) return;
        if (channelName.length < CHANNEL_NAME_MIN_LENGTH || channelName.length > CHANNEL_NAME_MAX_LENGTH) {
            addToast(`Kanal adı ${CHANNEL_NAME_MIN_LENGTH}-${CHANNEL_NAME_MAX_LENGTH} karakter olmalı.`, 'error');
            return;
        }
        if (!activeServerId || activeServerId === 'dm') {
            addToast('Kanal oluşturmak için bir sunucu seçmelisiniz.', 'error');
            return;
        }
        if (activeServerId.length < 36) {
            addToast('Geçersiz sunucu seçimi.', 'error');
            return;
        }
        setIsCreatingChannel(true);
        try {
            const { data: maxRow } = await supabase
                .from('channels')
                .select('position')
                .eq('server_id', activeServerId)
                .order('position', { ascending: false })
                .limit(1)
                .maybeSingle();
            const nextPosition = (maxRow?.position ?? -1) + 1;

            const { data, error } = await supabase
                .from('channels')
                .insert({
                    server_id: activeServerId,
                    name: channelName.toLowerCase().replace(/\s+/g, '-'),
                    type: newChannelType,
                    category: newChannelCategory.toUpperCase() || 'GENEL',
                    position: nextPosition
                })
                .select()
                .single();

            if (error) {
                addToast('Kanal oluşturulamadı: ' + error.message, 'error');
                return;
            }
            if (data) {
                await refetchChannels();
                setModals(prev => ({ ...prev, addChannel: false }));
                setNewChannelName('');
                addToast(`${data.name} kanalı oluşturuldu.`);
                setActiveChannelId(data.id);
                setChannelType(data.type);
            }
        } finally {
            setIsCreatingChannel(false);
        }
    };

    const handleDeleteChannel = useCallback(async (channelId: string) => {
        if (!channelId || !activeServerId) return;

        try {
            const { error } = await supabase
                .from('channels')
                .delete()
                .eq('id', channelId);

            if (error) throw error;

            if (channelId === activeChannelId) {
                const { data: remaining } = await supabase
                    .from('channels')
                    .select('id, type')
                    .eq('server_id', activeServerId)
                    .order('position', { ascending: true })
                    .order('created_at', { ascending: true });
                const firstText = (remaining || []).find((c: { type: string }) => c.type === 'text');
                setActiveChannelId(firstText?.id ?? null);
                setChannelType('text');
            }

            await refetchChannels();
            addToast('Kanal silindi.', 'success');
        } catch (error: unknown) {
            addToast('Kanal silinemedi: ' + formatError(error), 'error');
        }
    }, [activeChannelId, activeServerId, supabase, addToast, refetchChannels, setActiveChannelId, setChannelType]);

    const handleCreateCategory = () => {
        if (!newCategoryName.trim()) return;
        // Kategori sadece sanal bir gruplama olduğu için, aslında "boş" bir kategori oluşturmak
        // şu anki yapı (kanalların category property'si) ile zor çünkü kanallar listesinde tutuluyor.
        // Bu yüzden kullanıcıya bir "placeholder" kanal oluşturmayacağız ama
        // kullanıcı "Kanal Ekle" dediğinde bu kategoriyi seçebilecek.
        // Ancak görsel olarak hemen görünmesi için geçici bir "boş" kanal ekleyebiliriz veya
        // sadece bildirim verebiliriz.
        // Daha iyi UX için: Yeni kategoriyi "newChannelCategory" state'ine atayıp Kanal Ekle modalını açalım.

        setNewChannelCategory(newCategoryName.toUpperCase());
        setModals(prev => ({ ...prev, createCategory: false, addChannel: true }));
        setNewCategoryName('');
        addToast(`Kategori seçildi: ${newCategoryName}. Şimdi bir kanal ekle.`);
    };

    const handleServerIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            addToast('Sadece resim dosyası yükleyebilirsiniz.', 'error');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            addToast('Resim boyutu en fazla 2MB olmalı.', 'error');
            return;
        }
        if (newServerIconPreview) {
            URL.revokeObjectURL(newServerIconPreview);
        }
        setNewServerIconFile(file);
        setNewServerIconPreview(URL.createObjectURL(file));
    };

    const uploadServerIcon = async (): Promise<string | null> => {
        if (!newServerIconFile || !authUser?.id) return null;

        const fileExt = newServerIconFile.name.split('.').pop() || 'png';
        const filePath = `${authUser.id}/${Date.now()}.${fileExt}`;

        const { error } = await supabase.storage
            .from('server-icons')
            .upload(filePath, newServerIconFile, {
                cacheControl: '3600',
                upsert: true,
            });

        if (error) {
            logger.error('Server icon upload error:', error);
            addToast('Sunucu resmi yüklenemedi: ' + (error.message || 'Bilinmeyen hata'), 'error');
            return null;
        }

        const { data } = supabase.storage.from('server-icons').getPublicUrl(filePath);
        return data?.publicUrl || null;
    };

    const generateInviteCode = () => Math.random().toString(36).slice(2, 8);

    const handleCreateInvite = async () => {
        if (!activeServerId || activeServerId === 'dm') {
            addToast('Davet oluşturmak için bir sunucu seçmelisiniz.', 'error');
            return;
        }
        if (!authUser?.id) {
            addToast('Giriş yapmanız gerekiyor.', 'error');
            return;
        }

        setInviteLoading(true);
        try {
            let created = null;
            for (let attempt = 0; attempt < 3 && !created; attempt += 1) {
                const code = generateInviteCode();
                const { data, error } = await supabase
                    .from('server_invites')
                    .insert({
                        server_id: activeServerId,
                        code,
                        created_by: authUser.id,
                    })
                    .select()
                    .single();

                if (!error) {
                    created = data;
                } else if (!error.message?.includes('duplicate')) {
                    throw error;
                }
            }

            if (!created) {
                throw new Error('Davet kodu oluşturulamadı.');
            }

            setInviteCode(created.code);
            addToast('Davet kodu oluşturuldu.', 'success');
        } catch (error: any) {
            addToast('Davet oluşturulamadı: ' + (error.message || 'Bilinmeyen hata'), 'error');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleCopyInvite = async () => {
        if (!inviteCode) return;
        try {
            await navigator.clipboard.writeText(inviteCode);
            addToast('Davet kodu kopyalandı.', 'success');
        } catch (error) {
            logger.error('Invite copy error:', error);
            addToast('Kopyalama başarısız.', 'error');
        }
    };

    const addServerFolder = () => {
        const name = newFolderName.trim() || 'Yeni Klasör';
        const fid = crypto.randomUUID();
        setServerFolders(prev => [...prev, { id: fid, name }]);
        setNewFolderName('');
        if (folderContextServer) setServerToFolder(prev => ({ ...prev, [folderContextServer]: fid }));
        setFolderContextServer(null);
    };
    const addServerToFolder = (serverId: string, folderId: string) => {
        setServerToFolder(prev => ({ ...prev, [serverId]: folderId }));
        setFolderContextServer(null);
    };
    const removeServerFromFolder = (serverId: string) => {
        setServerToFolder(prev => { const next = { ...prev }; delete next[serverId]; return next; });
        setFolderContextServer(null);
    };
    const toggleFolderCollapsed = (folderId: string) => {
        setCollapsedFolderIds(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) next.delete(folderId);
            else next.add(folderId);
            return next;
        });
    };

    const reorderFolder = (draggedId: string, dropBeforeFolderId: string) => {
        setServerFolders(prev => {
            const fromI = prev.findIndex(f => f.id === draggedId);
            const toI = prev.findIndex(f => f.id === dropBeforeFolderId);
            if (fromI === -1 || toI === -1 || fromI === toI) return prev;
            const next = prev.filter((_, i) => i !== fromI);
            const insertI = toI > fromI ? toI - 1 : toI;
            next.splice(insertI, 0, prev[fromI]);
            return next;
        });
    };

    const handleCreateServer = async () => {
        if (isCreatingServer) return;
        const name = newServerName.trim();
        if (!name) return;
        if (name.length < SERVER_NAME_MIN_LENGTH || name.length > SERVER_NAME_MAX_LENGTH) {
            addToast(`Sunucu adı ${SERVER_NAME_MIN_LENGTH}-${SERVER_NAME_MAX_LENGTH} karakter olmalı.`, 'error');
            return;
        }
        if (!authUser?.id) {
            addToast('Giriş yapmanız gerekiyor.', 'error');
            return;
        }
        if (!profile) {
            addToast('Profil yükleniyor, lütfen bekleyin...', 'info');
            return;
        }
        setIsCreatingServer(true);
        try {
            let iconUrl = `https://api.dicebear.com/7.x/icons/svg?seed=${name}`;
            if (newServerIconFile) {
                const uploadedUrl = await uploadServerIcon();
                if (uploadedUrl) iconUrl = uploadedUrl;
            }

            const { data, error } = await supabase
                .from('servers')
                .insert({
                    name: name,
                    icon_url: iconUrl,
                    owner_id: authUser.id
                })
                .select()
                .single();

            if (error) {
                addToast('Sunucu oluşturulamadı: ' + error.message, 'error');
                return;
            }
            if (!data) return;

            const { error: memberError } = await supabase
                .from('server_members')
                .insert({ server_id: data.id, user_id: authUser.id, role: 'owner' });
            if (memberError) {
                if (memberError.code === '23505') {
                    // Zaten üye (çift tıklama / tekrar deneme)
                } else {
                    addToast('Üyelik kaydı oluşturulamadı: ' + (memberError.message || 'Bilinmeyen hata'), 'error');
                }
            }

            const defaultChannels = [
                { server_id: data.id, name: 'genel', type: 'text', category: 'GENEL', position: 0 },
                { server_id: data.id, name: 'sohbet', type: 'voice', category: 'SES', position: 1 }
            ];
            await supabase.from('channels').insert(defaultChannels).select();

            setServers((prev) => {
                if (prev.some((s) => s.id === data.id)) return prev;
                return [
                    ...prev,
                    {
                        id: data.id,
                        name: data.name,
                        icon: data.icon_url || iconUrl,
                        color: 'from-gray-700 to-gray-900',
                        type: 'server',
                        ownerId: data.owner_id || authUser.id,
                    },
                ];
            });

            await refetchServers();
            setModals(prev => ({ ...prev, createServer: false }));
            setNewServerName('');
            setNewServerIconFile(null);
            if (newServerIconPreview) {
                URL.revokeObjectURL(newServerIconPreview);
                setNewServerIconPreview(null);
            }
            addToast(`${name} sunucusu hazır!`);
            handleServerSwitch(data.id);
        } finally {
            setIsCreatingServer(false);
        }
    };

    const handleJoinServer = async () => {
        if (!joinCode.trim()) return;
        if (!authUser?.id) {
            addToast('Giriş yapmanız gerekiyor.', 'error');
            return;
        }
        try {
            const { data: inviteData, error: inviteError } = await supabase
                .from('server_invites')
                .select('server_id')
                .eq('code', joinCode.trim())
                .single();

            if (inviteError || !inviteData) {
                addToast('Geçersiz veya süresi dolmuş davet kodu.', 'error');
                return;
            }

            const { error: memberError } = await supabase.from('server_members').insert({
                server_id: inviteData.server_id,
                user_id: authUser.id,
            });

            if (memberError) {
                if (memberError.code === '23505') {
                    addToast('Zaten bu sunucunun üyesisin!', 'info');
                    setModals(prev => ({ ...prev, joinServer: false }));
                    setJoinCode('');
                    await refetchServers();
                    handleServerSwitch(inviteData.server_id);
                    return;
                }
                throw memberError;
            }

            await refetchServers();
            setModals(prev => ({ ...prev, joinServer: false }));
            setJoinCode('');
            addToast('Sunucuya katıldın!', 'success');
            handleServerSwitch(inviteData.server_id);
        } catch (err: unknown) {
            addToast('Katılma başarısız: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'), 'error');
        }
    };

    const handleAddFriend = async () => {
        if (!newFriendName.trim()) return;
        if (!authUser?.id) {
            addToast('Giriş yapmanız gerekiyor.', 'error');
            return;
        }

        try {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, status')
                .ilike('username', newFriendName.trim())
                .limit(1)
                .single();

            if (profileError || !profile) {
                addToast('Kullanıcı bulunamadı.', 'error');
                return;
            }

            if (profile.id === authUser.id) {
                addToast('Kendinle arkadaş olamazsın.', 'info');
                return;
            }

            const { error: reqErr } = await supabase
                .from('friend_requests')
                .insert({ from_user_id: authUser.id, to_user_id: profile.id, status: 'pending' });
            if (reqErr) {
                if (reqErr.code === '23505') {
                    addToast('Zaten istek gönderdin veya arkadaşsınız.', 'info');
                } else {
                    throw reqErr;
                }
            } else {
                addToast('Arkadaşlık isteği gönderildi.', 'success');
            }
            setNewFriendName('');
            setShowAddFriend(false);
            await fetchFriendRequestsIncoming();
        } catch (error: any) {
            addToast('İstek gönderilemedi: ' + (error.message || 'Bilinmeyen hata'), 'error');
        }
    };

    const handleSaveBio = async () => {
        try {
            await updateProfile({ bio: tempBio });
            setUser(prev => ({ ...prev, bio: tempBio }));
            setIsEditingBio(false);
            addToast('Biyografi güncellendi.', 'success');
        } catch (e: unknown) {
            addToast(formatError(e), 'error');
        }
    };

    const handleSaveUsername = async () => {
        const trimmed = tempUsername.trim();
        if (trimmed.length < 2 || trimmed.length > 32 || !/^[a-zA-Z0-9_]+$/.test(trimmed)) {
            addToast('Kullanıcı adı 2-32 karakter, sadece harf, rakam ve _ olmalı.', 'error');
            return;
        }
        try {
            await updateProfile({ username: trimmed });
            setUser(prev => ({ ...prev, username: trimmed }));
            setIsEditingUsername(false);
            addToast('Kullanıcı adı güncellendi.');
        } catch (e: unknown) {
            addToast(formatError(e), 'error');
        }
    };

    const handleStatusChange = (newStatus: string) => {
        setUser(prev => ({ ...prev, status: newStatus }));
        setShowStatusMenu(false);
        addToast(`Durum ayarlandı: ${newStatus}`);
    };

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!activeServerId || activeServerId === 'dm') return;
        if (!over || active.id === over.id) return;

        const currentServerChannels = channels[activeServerId] || [];
        const oldIndex = currentServerChannels.findIndex((c: Channel) => c.id === active.id);
        const newIndex = currentServerChannels.findIndex((c: Channel) => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const newChannels = arrayMove(currentServerChannels, oldIndex, newIndex);
        const overChannel = currentServerChannels.find((c: Channel) => c.id === over.id);
        if (overChannel && currentServerChannels[oldIndex]?.category !== overChannel.category) {
            newChannels[newIndex] = { ...newChannels[newIndex], category: overChannel.category };
        }

        setChannels((items: { [key: string]: Channel[] }) => ({
            ...items,
            [activeServerId]: newChannels,
        }));

        try {
            for (let i = 0; i < newChannels.length; i++) {
                const { error } = await supabase
                    .from('channels')
                    .update({ position: i })
                    .eq('id', newChannels[i].id);
                if (error) throw error;
            }
            await refetchChannels();
        } catch (err: unknown) {
            addToast('Kanal sırası kaydedilemedi.', 'error');
            await refetchChannels();
        }
    }, [activeServerId, channels, setChannels, supabase, refetchChannels, addToast]);

    const unreadCount = notifications.filter(n => !n.read).length;

    // --- RENDER: single return so React always sees the same number of hooks ---
    let content: React.ReactNode;
    if (isAuthChecking) {
        content = (
            <div className="h-screen w-full bg-[#09090b] flex items-center justify-center text-white">
                <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
        );
    } else if (!session) {
        if (isTauri()) {
            content = <Auth onLogin={() => {}} />;
        } else {
            content = showAuthModal
                ? <Auth onLogin={() => setShowAuthModal(false)} />
                : <LandingPage onLoginClick={() => setShowAuthModal(true)} />;
        }
    } else if (profileLoading || !profile) {
        content = (
            <div className="h-screen w-full bg-[#09090b] flex items-center justify-center text-white">
                <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
        );
    } else if (needsUsername(profile)) {
        content = <UsernameSetup onDone={refetchProfile} />;
    } else {
        content = (
        <div className="h-screen w-full bg-[#09090b] text-white flex flex-col font-sans overflow-hidden relative selection:bg-orange-500/30" onClick={() => { setShowNotifications(false); }}>
                <AppUpdateBanner />

            {/* Toast */}
            <div className="absolute bottom-6 right-6 z-[150] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className="pointer-events-auto">
                        <Toast message={t.msg} type={t.type} onClose={() => removeToast(t.id)} />
                    </div>
                ))}
            </div>

            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[40vw] h-[40vw] bg-orange-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[30vw] h-[30vw] bg-red-900/10 rounded-full blur-[120px]" />
            </div>

            {/* --- TOP NAV (göze çarpan bar + sunucu klasörleri) --- */}
            <div className="h-20 flex-shrink-0 z-50 px-4 md:px-6 flex items-center justify-between bg-gradient-to-r from-[#0c0c0f] via-[#121218] to-[#0c0c0f] border-b border-white/10 shadow-[0_4px_24px_-4px_rgba(249,115,22,0.12)]">
                <div className="flex items-center gap-4 md:gap-5 flex-1 min-w-0">
                    <button className="md:hidden p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
                        <Menu size={22} />
                    </button>

                    <div
                        className="flex items-center gap-3 cursor-pointer group flex-shrink-0 rounded-2xl px-3 py-2 transition-all duration-300 hover:bg-white/5"
                        onClick={() => handleServerSwitch('dm')}
                    >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 ${activeServerId === 'dm' ? 'shadow-lg shadow-orange-500/40 ring-2 ring-orange-400/50' : 'bg-white/5 group-hover:bg-white/10'}`}>
                            <img src="/logo.png" alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-lg tracking-tight hidden md:block bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">Oxide<span className="text-orange-400">Space</span></span>
                    </div>

                    <div className="h-9 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent hidden md:block flex-shrink-0" />

                    <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar py-2 flex-1 min-w-0 max-w-[55vw]">
                        {(() => {
                            const list = servers.filter((s: Server) => s.type !== 'dm');
                            const uncategorized = list.filter((s: Server) => !serverToFolder[s.id]);
                            const handleDragStart = (e: React.DragEvent, serverId: string) => {
                                setDraggedServerId(serverId);
                                e.dataTransfer.setData('text/plain', serverId);
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setDragImage((e.target as HTMLElement), 0, 0);
                            };
                            const handleDragEnd = () => {
                                setDraggedServerId(null);
                                setDraggedFolderId(null);
                                setDropTargetFolderId(null);
                                setDropTargetUncategorized(false);
                                setDropTargetFolderOrderId(null);
                            };
                            const handleDropUncategorized = (e: React.DragEvent) => {
                                e.preventDefault();
                                const folderId = e.dataTransfer.getData('application/x-folder-id');
                                if (folderId && serverFolders.length > 0) {
                                    reorderFolder(folderId, serverFolders[0].id);
                                    setDraggedFolderId(null);
                                } else {
                                    const id = e.dataTransfer.getData('text/plain');
                                    if (id) removeServerFromFolder(id);
                                }
                                setDropTargetUncategorized(false);
                                setDropTargetFolderOrderId(null);
                            };
                            const handleDropFolder = (e: React.DragEvent, fId: string) => {
                                e.preventDefault();
                                const folderId = e.dataTransfer.getData('application/x-folder-id');
                                if (folderId && folderId !== fId) {
                                    reorderFolder(folderId, fId);
                                    setDraggedFolderId(null);
                                    setDropTargetFolderOrderId(null);
                                } else {
                                    const id = e.dataTransfer.getData('text/plain');
                                    if (id) {
                                        addServerToFolder(id, fId);
                                        setCollapsedFolderIds(prev => { const next = new Set(prev); next.delete(fId); return next; });
                                    }
                                    setDropTargetFolderId(null);
                                }
                            };
                            const renderServerBtn = (server: Server) => (
                                <button
                                    key={server.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, server.id)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => handleServerSwitch(server.id)}
                                    onContextMenu={(e) => { e.preventDefault(); setFolderContextServer(server.id); setFolderMenuPos({ x: e.clientX, y: e.clientY }); }}
                                    className={`group flex items-center gap-2.5 pl-1.5 pr-4 py-2 rounded-xl transition-all duration-300 flex-shrink-0 cursor-grab active:cursor-grabbing
                                        ${activeServerId === server.id ? 'bg-white/15 text-white shadow-lg shadow-black/30 ring-1 ring-white/20' : 'hover:bg-white/10 text-zinc-400 hover:text-zinc-200'}
                                        ${draggedServerId === server.id ? 'opacity-50 scale-95' : ''}`}
                                >
                                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${server.color ?? 'from-gray-700 to-gray-900'} p-[2px] flex-shrink-0`}>
                                        <img src={server.icon || ''} alt="" className="w-full h-full rounded-lg bg-black/60 object-cover" draggable={false} />
                                    </div>
                                    <span className="text-sm font-semibold whitespace-nowrap">{server.name}</span>
                                </button>
                            );
                            return (
                                <>
                                    <button
                                        onClick={() => setModals(m => ({ ...m, create: true }))}
                                        className="w-11 h-11 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-zinc-500 hover:text-orange-400 hover:border-orange-500/50 hover:bg-orange-500/10 transition-all flex-shrink-0 order-first"
                                        title="Sunucu oluştur"
                                    >
                                        <Plus size={20} />
                                    </button>
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (draggedServerId) setDropTargetUncategorized(true); if (draggedFolderId && serverFolders.length > 0) setDropTargetUncategorized(true); }}
                                        onDragLeave={() => { setDropTargetUncategorized(false); setDropTargetFolderOrderId(null); }}
                                        onDrop={handleDropUncategorized}
                                        className={`flex items-center gap-2 flex-shrink-0 min-w-[80px] rounded-xl transition-colors ${dropTargetUncategorized ? 'bg-orange-500/20 ring-2 ring-orange-500/50 ring-inset' : ''}`}
                                    >
                                        {uncategorized.map(renderServerBtn)}
                                    </div>
                                    {serverFolders.map(f => {
                                        const inFolder = list.filter((s: Server) => serverToFolder[s.id] === f.id);
                                        const isCollapsed = collapsedFolderIds.has(f.id);
                                        const isDropTarget = dropTargetFolderId === f.id;
                                        const isFolderOrderTarget = dropTargetFolderOrderId === f.id;
                                        return (
                                            <div
                                                key={f.id}
                                                draggable
                                                onDragStart={(e) => {
                                                    setDraggedFolderId(f.id);
                                                    e.dataTransfer.setData('application/x-folder-id', f.id);
                                                    e.dataTransfer.effectAllowed = 'move';
                                                    e.dataTransfer.setDragImage((e.currentTarget as HTMLElement), 0, 0);
                                                }}
                                                onDragEnd={handleDragEnd}
                                                className={`flex items-center gap-1 flex-shrink-0 rounded-xl transition-colors cursor-grab active:cursor-grabbing
                                                    ${isDropTarget ? 'bg-orange-500/20 ring-2 ring-orange-500/50 ring-inset' : ''}
                                                    ${isFolderOrderTarget ? 'ring-2 ring-amber-500/60 ring-inset' : ''}
                                                    ${draggedFolderId === f.id ? 'opacity-50' : ''}`}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    e.dataTransfer.dropEffect = 'move';
                                                    if (draggedFolderId && draggedFolderId !== f.id) setDropTargetFolderOrderId(f.id);
                                                    if (draggedServerId) setDropTargetFolderId(f.id);
                                                }}
                                                onDragLeave={() => { setDropTargetFolderId(prev => prev === f.id ? null : prev); setDropTargetFolderOrderId(prev => prev === f.id ? null : prev); }}
                                                onDrop={(e) => handleDropFolder(e, f.id)}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => toggleFolderCollapsed(f.id)}
                                                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors flex-shrink-0"
                                                    title={isCollapsed ? 'Aç' : 'Kapat'}
                                                >
                                                    <ChevronRight size={16} className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                                                    <Folder size={14} />
                                                    <span className="text-xs font-medium">{f.name}</span>
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    {!isCollapsed && inFolder.map(renderServerBtn)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Sunucu sağ tık: Klasöre taşı / Yeni klasör */}
                {folderContextServer && createPortal(
                    <div className="fixed inset-0 z-[200]" onClick={() => setFolderContextServer(null)}>
                        <div
                            className="absolute bg-[#18181b] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[200px] overflow-hidden"
                            style={{ left: folderMenuPos.x, top: folderMenuPos.y }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-white/5">Klasöre taşı</div>
                            {serverToFolder[folderContextServer] && (
                                <button type="button" onClick={() => removeServerFromFolder(folderContextServer)} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white">
                                    Klasörden çıkar
                                </button>
                            )}
                            {serverFolders.map(f => (
                                <button key={f.id} type="button" onClick={() => addServerToFolder(folderContextServer, f.id)} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white flex items-center gap-2">
                                    <Folder size={14} className="text-orange-500/80" />{f.name}
                                </button>
                            ))}
                            <div className="border-t border-white/5 mt-1 pt-1">
                                <div className="px-3 py-1.5 text-xs text-zinc-500">Yeni klasör</div>
                                <div className="flex gap-1 px-3 pb-2">
                                    <input
                                        type="text"
                                        value={newFolderName}
                                        onChange={e => setNewFolderName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addServerFolder()}
                                        placeholder="Klasör adı"
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                    />
                                    <button type="button" onClick={addServerFolder} className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium">Ekle</button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                <div className="flex items-center gap-4">
                    <div className="relative hidden lg:block group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-zinc-300" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={activeServerId === 'dm' ? "Arkadaş ara..." : "Kanal ara..."}
                            className="bg-black/20 border border-white/5 rounded-full py-2 pl-10 pr-4 text-sm w-48 focus:w-64 transition-all focus:outline-none focus:border-orange-500/50 placeholder-zinc-600"
                        />
                    </div>

                    {/* Notifications Trigger */}
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); }}
                            className="relative p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse border-2 border-[#09090b]" />}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifications && (
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-full right-0 mt-2 w-80 bg-[#121217] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                            >
                                <div className="p-3 border-b border-white/5 flex justify-between items-center bg-white/5">
                                    <span className="font-bold text-sm">Bildirimler</span>
                                    {notifications.some(n => !n.read) && (
                                        <button type="button" onClick={markAllNotificationsRead} className="text-xs text-orange-400 hover:text-orange-300">Tümünü Okundu İşaretle</button>
                                    )}
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 ? <p className="p-4 text-center text-zinc-500 text-sm">Bildirim yok.</p> :
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => { markNotificationRead(n.id); }}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); markNotificationRead(n.id); } }}
                                                className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!n.read ? 'bg-orange-500/5' : ''}`}
                                            >
                                                <p className="text-sm font-medium text-zinc-200 mb-0.5">{n.title}</p>
                                                {n.body && <p className="text-xs text-zinc-400 mb-1">{n.body}</p>}
                                                <span className="text-[10px] text-zinc-500">{formatTimeAgo(n.created_at)}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div
                        className="flex items-center gap-3 pl-4 border-l border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setModals(m => ({ ...m, profile: true }))}
                    >
                        <div className="text-right hidden md:block">
                            <div className="text-sm font-bold text-white">{user.username}</div>
                            <div className="text-xs text-green-400 flex items-center justify-end gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'online' ? 'bg-green-400' : 'bg-zinc-500'}`} /> {user.status === 'online' ? 'Çevrimiçi' : user.status}
                            </div>
                        </div>
                        <Avatar src={user.avatar} size="md" status={normalizeStatus(user.status)} />
                    </div>
                </div>
            </div>

            {/* --- CONTENT WRAPPER --- */}
            <div className="flex-1 flex overflow-hidden p-0 md:p-4 gap-4 relative">

                {isLoading && (
                    <div className="absolute inset-0 z-40 bg-[#09090b]/90 flex flex-col items-center justify-center">
                        <Loader2 size={48} className="text-orange-500 animate-spin mb-4" />
                        <p className="text-zinc-400 font-medium tracking-wide">Bağlantı oksitleniyor...</p>
                    </div>
                )}

                {/* LEFT SIDEBAR */}
                <div className={`
          absolute inset-y-0 left-0 z-30 w-72 bg-[#121217] md:bg-transparent md:static md:flex flex-col
          transform transition-transform duration-300 ease-in-out md:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
                    <Sidebar
                        activeServerId={activeServerId}
                        handleDmSelect={handleDmSelect}
                        handleDragEnd={handleDragEnd}
                        filteredFriends={filteredFriends}
                        activeDmUser={activeDmUser}
                        setShowAddFriend={setShowAddFriend}
                        currentServer={currentServer}
                        categories={categories}
                        serverChannels={serverChannels}
                        activeChannelId={activeChannelId}
                        setActiveChannelId={setActiveChannelId}
                        setChannelType={setChannelType}
                        connectedVoiceChannelId={connectedVoiceChannelId}
                        setConnectedVoiceChannelId={setConnectedVoiceChannelId}
                        setLastTextChannelIdForServer={setLastTextChannelIdForServer}
                        setMobileMenuOpen={setMobileMenuOpen}
                        setModals={setModals}
                        setNewChannelCategory={setNewChannelCategory}
                        sensors={sensors}
                        user={user}
                        authUser={authUser}
                        addToast={addToast}
                        fetchVoiceChannelUsers={fetchVoiceChannelUsers}
                        setVoiceChannelUsers={setVoiceChannelUsers}
                        onDeleteChannel={handleDeleteChannel}
                        onlineUserIds={onlineUserIds}
                        friendRequestsIncoming={friendRequestsIncoming}
                        onAcceptFriendRequest={handleAcceptFriendRequest}
                        onRejectFriendRequest={handleRejectFriendRequest}
                    />
                </div>

                {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

                {/* CENTER CONTENT */}
                <div className="flex-1 flex flex-col min-w-0 relative transition-all h-full">
                    {(!activeChannelId && activeServerId !== 'dm' && !showAddFriend) || (activeServerId === 'dm' && !activeDmUser && !showAddFriend) ? (
                        <GlassCard className="flex-1 rounded-none md:rounded-3xl flex flex-col items-center justify-center text-center p-8 border-none md:border">
                            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/20 flex items-center justify-center mb-6 overflow-hidden">
                                <img src="/logo.png" alt="OxideSpace" className="w-20 h-20 object-cover rounded-xl" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Sinyal Bekleniyor...</h2>
                            <p className="text-zinc-400 max-w-sm">Sol taraftan bir kanal veya sohbet seçerek iletişime başla.</p>
                        </GlassCard>
                    ) : showAddFriend ? (
                        // ADD FRIEND UI
                        <GlassCard className="flex-1 rounded-none md:rounded-3xl flex flex-col items-center justify-center p-8 border-none md:border">
                            <div className="max-w-md w-full">
                                <h2 className="text-2xl font-bold text-white mb-6 text-center">Arkadaş Ekle</h2>
                                <div className="flex gap-2">
                                    <input
                                        value={newFriendName}
                                        onChange={(e) => setNewFriendName(e.target.value)}
                                        placeholder="Kullanıcı adı gir (örn: NeoUser)"
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                                    />
                                    <Button success onClick={handleAddFriend} disabled={!newFriendName}>Gönder</Button>
                                </div>
                                <div className="mt-8">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase mb-4">Önerilenler</h3>
                                    <div className="space-y-2">
                                        {['CyberPunk', 'Glitch', 'Matrix'].map(name => (
                                            <div key={name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={`https://api.dicebear.com/7.x/notionists/svg?seed=${name}`} size="sm" status={undefined} onClick={undefined} />
                                                    <span className="font-bold">{name}</span>
                                                </div>
                                                <Button onClick={() => { setNewFriendName(name); handleAddFriend(); }} className="h-8 px-3 py-0 text-xs bg-white/10">Ekle</Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ) : channelType === 'canvas' && activeChannelId && activeServerId && activeServerId !== 'dm' ? (
                        <CanvasChannelView
                            channel={serverChannels.find((c: Channel) => c.id === activeChannelId) ?? null}
                            channelName={serverChannels.find((c: Channel) => c.id === activeChannelId)?.name ?? 'Canvas'}
                            supabase={supabase}
                            currentUserId={authUser?.id}
                            onSaveCanvasData={handleSaveCanvasData}
                            addToast={addToast}
                        />
                    ) : (
                        // CHAT / VOICE UI
                        <ChatArea
                            messages={currentMessages}
                            messagesLoading={activeServerId === 'dm' ? dmMessagesLoading : channelMessagesLoading}
                            typingUsers={typingUsers}
                            user={user}
                            inputVal={inputVal}
                            setInputVal={setInputVal}
                            onSendMessage={handleSendMessage}
                            onDeleteMessage={handleDeleteMessage}
                            onEditMessage={handleEditMessage}
                            bottomRef={bottomRef}
                            channelType={channelType}
                            serverChannels={serverChannels}
                            activeChannelId={activeChannelId}
                            activeServerId={activeServerId}
                            activeDmUser={activeDmUser}
                            showMembers={showMembers}
                            setShowMembers={setShowMembers}
                            voiceState={voiceState}
                            setVoiceState={setVoiceState}
                            setActiveChannelId={setActiveChannelId}
                            setChannelType={setChannelType}
                            setConnectedVoiceChannelId={setConnectedVoiceChannelId}
                            setVoiceChannelUsers={setVoiceChannelUsers}
                            addToast={addToast}
                            voiceChannelUsers={voiceChannelUsers}
                            livekitSpeakingIds={livekitSpeakingIds}
                            livekitVideoTracks={livekitVideoTracks}
                            livekitFocusedKey={livekitFocusedKey}
                            setLivekitFocusedKey={setLivekitFocusedKey}
                            livekitPinnedKey={livekitPinnedKey}
                            setLivekitPinnedKey={setLivekitPinnedKey}
                            livekitFullscreen={livekitFullscreen}
                            setLivekitFullscreen={setLivekitFullscreen}
                            attachmentPreviewUrl={attachmentPreviewUrl}
                            attachmentName={pendingAttachment?.name ?? ''}
                            onAttachmentSelect={handleAttachmentSelect}
                            onAttachmentClear={handleAttachmentClear}
                            onOpenSettings={() => setModals(m => ({ ...m, settings: true }))}
                        />
                    )}
                </div>

                {/* RIGHT SIDEBAR (MEMBERS) */}
                {showMembers && activeChannelId && channelType === 'text' && activeServerId !== 'dm' && !showAddFriend && (
                    <GlassCard className="w-64 rounded-3xl overflow-hidden hidden lg:flex flex-col flex-shrink-0 border-white/5 border-l-0 md:border-l">
                        <div className="p-4 border-b border-white/5 bg-black/20">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500">
                                Çevrimiçi — {serverMembers.filter(m => onlineUserIds.has(m.id)).length} / {serverMembers.length}
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {serverMembers.length === 0 ? (
                                <p className="text-zinc-500 text-sm">Üye listesi yükleniyor...</p>
                            ) : (
                                serverMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setSelectedMemberForProfile(member)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedMemberForProfile(member); } }}
                                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                                    >
                                        <Avatar
                                            src={member.avatar}
                                            size="sm"
                                            status={onlineUserIds.has(member.id) ? 'online' : 'idle'}
                                        />
                                        <div className="min-w-0">
                                            <div className="font-medium text-sm text-zinc-200 truncate">{member.username}</div>
                                            <div className="text-[10px] text-zinc-500 truncate">
                                                {member.role === 'owner' ? 'Yönetici 👑' : 'Topluluk Üyesi'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </GlassCard>
                )}
            </div>

            {/* --- MODALS --- */}

            {/* 1. SEÇİM MODALI (Oluştur/Katıl) */}
            <Modal isOpen={modals.create} onClose={() => setModals(m => ({ ...m, create: false }))} title="Yeni Bir Başlangıç">
                <div className="space-y-4">
                    <button
                        onClick={() => setModals(m => ({ ...m, create: false, createServer: true }))}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:border-orange-500 hover:bg-orange-500/10 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/20 rounded-full text-orange-500 group-hover:scale-110 transition-transform"><Plus size={24} /></div>
                            <div className="text-left">
                                <div className="font-bold text-white text-lg">Kendi Evrenini Yarat</div>
                                <div className="text-zinc-400 text-sm">Arkadaşların için yeni bir sunucu.</div>
                            </div>
                        </div>
                        <ChevronDown className="-rotate-90 text-zinc-500 group-hover:text-white" />
                    </button>

                    <button
                        onClick={() => setModals(m => ({ ...m, create: false, joinServer: true }))}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:border-green-500 hover:bg-green-500/10 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/20 rounded-full text-green-500 group-hover:scale-110 transition-transform"><LogIn size={24} /></div>
                            <div className="text-left">
                                <div className="font-bold text-white text-lg">Bir Evrene Katıl</div>
                                <div className="text-zinc-400 text-sm">Davet kodun var mı?</div>
                            </div>
                        </div>
                        <ChevronDown className="-rotate-90 text-zinc-500 group-hover:text-white" />
                    </button>
                </div>
            </Modal>

            {/* 2. SUNUCU OLUŞTURMA */}
            <Modal isOpen={modals.createServer} onClose={() => setModals(m => ({ ...m, createServer: false }))} title="Evrenini Tasarla">
                <div className="text-center space-y-6 py-4">
                    <div
                        className="w-24 h-24 bg-white/5 border-2 border-dashed border-zinc-500 rounded-full mx-auto flex items-center justify-center hover:border-orange-500 hover:text-orange-500 cursor-pointer transition-colors text-zinc-500 group overflow-hidden"
                        onClick={() => serverIconInputRef.current?.click()}
                    >
                        {newServerIconPreview ? (
                            <img src={newServerIconPreview} className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon size={32} className="group-hover:scale-110 transition-transform" />
                        )}
                    </div>
                    <input
                        ref={serverIconInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleServerIconChange}
                    />
                    <div>
                        <label className="block text-left text-xs font-bold text-zinc-400 uppercase mb-2">Evren Adı</label>
                        <input
                            value={newServerName}
                            onChange={(e) => setNewServerName(e.target.value)}
                            type="text"
                            placeholder="Oxide Topluluğu"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 transition-colors font-medium"
                        />
                    </div>
                    <Button primary className="w-full py-3" onClick={handleCreateServer} disabled={!newServerName || isCreatingServer}>
                                        {isCreatingServer ? <><Loader2 className="animate-spin inline mr-2" size={18} /> Oluşturuluyor...</> : 'Başlat'}
                                    </Button>
                </div>
            </Modal>

            {/* 3. SUNUCUYA KATILMA */}
            <Modal isOpen={modals.joinServer} onClose={() => setModals(m => ({ ...m, joinServer: false }))} title="Davet Kodu Gir">
                <div className="space-y-6 py-4">
                    <div>
                        <label className="block text-left text-xs font-bold text-zinc-400 uppercase mb-2">Davet Kodu</label>
                        <input
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            type="text"
                            placeholder="Örn: oxide-space"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors font-medium"
                        />
                        <p className="text-xs text-zinc-500 mt-2">Davet kodları büyük/küçük harf duyarlıdır.</p>
                    </div>
                    <Button success className="w-full py-3" onClick={handleJoinServer} disabled={!joinCode}>Katıl</Button>
                </div>
            </Modal>

            {/* 4. SUNUCU AYARLARI */}
            <Modal isOpen={modals.serverSettings} onClose={() => setModals(m => ({ ...m, serverSettings: false }))} title="Sunucu Ayarları">
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 p-0.5">
                            <img src={currentServer.icon || ''} className="w-full h-full rounded-full object-cover bg-black" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">{currentServer.name}</h3>
                            <span className="text-xs text-zinc-500">ID: {currentServer.id}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Sunucu Adı</label>
                        <div className="flex gap-2">
                            <input type="text" defaultValue={currentServer.name} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-orange-500" />
                            <Button>Kaydet</Button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Davet Kodu</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inviteCode}
                                readOnly
                                placeholder="Henüz davet kodu yok"
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500"
                            />
                            <Button success onClick={handleCreateInvite} disabled={inviteLoading || activeServerId === 'dm'}>
                                {inviteLoading ? 'Oluşturuluyor...' : 'Oluştur'}
                            </Button>
                            <Button onClick={handleCopyInvite} disabled={!inviteCode}>Kopyala</Button>
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">Davet kodu büyük/küçük harf duyarlıdır.</p>
                    </div>

                    <div className="h-px bg-white/5 my-4" />

                    <div>
                        <h4 className="font-bold text-white mb-2">Tehlikeli Bölge</h4>
                        <div className="border border-red-900/30 bg-red-900/10 rounded-xl p-4 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-red-200">Sunucuyu Sil</div>
                                <div className="text-xs text-red-400">Bu işlem geri alınamaz.</div>
                            </div>
                            <Button danger className="h-8 text-xs">Sil</Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* ... (Existing Channel Create Modal Code) */}
            <Modal isOpen={modals.addChannel} onClose={() => setModals(m => ({ ...m, addChannel: false }))} title="Yeni Frekans Oluştur">
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Kanal Türü</label>
                        <div className="space-y-2">
                            <div onClick={() => setNewChannelType('text')} className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all ${newChannelType === 'text' ? 'bg-orange-500/20 border-orange-500' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}>
                                <div className="flex items-center gap-3">
                                    <Hash size={24} className="text-zinc-300" />
                                    <div>
                                        <div className="font-bold text-white">Metin Kanalı</div>
                                        <div className="text-xs text-zinc-400">Görsel, yazı ve kod parçaları.</div>
                                    </div>
                                </div>
                                {newChannelType === 'text' && <CheckCircle size={20} className="text-orange-500" />}
                            </div>
                            <div onClick={() => setNewChannelType('voice')} className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all ${newChannelType === 'voice' ? 'bg-orange-500/20 border-orange-500' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}>
                                <div className="flex items-center gap-3">
                                    <Volume2 size={24} className="text-zinc-300" />
                                    <div>
                                        <div className="font-bold text-white">Ses Kanalı</div>
                                        <div className="text-xs text-zinc-400">Sesli sohbet, ekran paylaşımı.</div>
                                    </div>
                                </div>
                                {newChannelType === 'voice' && <CheckCircle size={20} className="text-orange-500" />}
                            </div>
                            <div onClick={() => setNewChannelType('canvas')} className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all ${newChannelType === 'canvas' ? 'bg-orange-500/20 border-orange-500' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}>
                                <div className="flex items-center gap-3">
                                    <Layout size={24} className="text-zinc-300" />
                                    <div>
                                        <div className="font-bold text-white">Tasarım / Canvas</div>
                                        <div className="text-xs text-zinc-400">UI/UX, wireframe, Penpot paylaşımı.</div>
                                    </div>
                                </div>
                                {newChannelType === 'canvas' && <CheckCircle size={20} className="text-orange-500" />}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Kanal Adı</label>
                        <input
                            value={newChannelName}
                            onChange={(e) => setNewChannelName(e.target.value)}
                            type="text"
                            placeholder="genel-sohbet"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Kategori</label>
                        <div className="relative">
                            <input
                                value={newChannelCategory}
                                onChange={(e) => setNewChannelCategory(e.target.value.toUpperCase())}
                                list="categories-list"
                                type="text"
                                placeholder="GENEL"
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 transition-colors"
                            />
                            <datalist id="categories-list">
                                {Object.keys(categories).map(cat => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button onClick={() => setModals(m => ({ ...m, addChannel: false }))}>İptal</Button>
                        <Button primary onClick={handleCreateChannel} disabled={!newChannelName || isCreatingChannel}>
                                            {isCreatingChannel ? <><Loader2 className="animate-spin inline mr-2" size={16} /> Oluşturuluyor...</> : 'Oluştur'}
                                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 5. KATEGORİ OLUŞTURMA */}
            <Modal isOpen={modals.createCategory} onClose={() => setModals(m => ({ ...m, createCategory: false }))} title="Kategori Oluştur">
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Kategori Adı</label>
                        <input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            type="text"
                            placeholder="OYUN ODALARI"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 transition-colors uppercase"
                        />
                        <p className="text-xs text-zinc-500 mt-2">Bu kategorinin içine hemen bir kanal eklemen gerekecek.</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button onClick={() => setModals(m => ({ ...m, createCategory: false }))}>İptal</Button>
                        <Button primary onClick={handleCreateCategory} disabled={!newCategoryName}>Devam Et</Button>
                    </div>
                </div>
            </Modal>

            {/* Profil Modal */}
            <Modal isOpen={modals.profile} onClose={() => { setModals(m => ({ ...m, profile: false })); setShowStatusMenu(false); }} title="Profil">
                <div className="-mx-6">
                    <div className={`h-32 ${user.bannerColor} w-full relative`} />
                    <div className="px-6 -mt-14 relative">
                        <div ref={profileStatusMenuRef} className="inline-block p-1 bg-[#121217] rounded-2xl shadow-lg border border-white/5 overflow-visible">
                            <button type="button" onClick={() => setShowStatusMenu(!showStatusMenu)} className="block rounded-[1.25rem] ring-2 ring-transparent focus:ring-2 focus:ring-orange-500/50 focus:outline-none overflow-visible">
                                <Avatar src={user.avatar} size="xl" status={normalizeStatus(user.status)} className="rounded-[1.25rem]" />
                            </button>
                        </div>
                        {showStatusMenu && statusMenuRect && createPortal(
                            <div
                                id="profile-status-menu"
                                role="menu"
                                className="fixed z-[200] min-w-[11rem] py-1.5 px-1 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl"
                                style={{ top: statusMenuRect.top, left: statusMenuRect.left }}
                            >
                                <div className="px-3 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">Durum</div>
                                {[
                                    { key: 'online', label: 'Çevrimiçi', dot: 'bg-green-500' },
                                    { key: 'idle', label: 'Boşta', dot: 'bg-yellow-500' },
                                    { key: 'dnd', label: 'Rahatsız etmeyin', dot: 'bg-red-500' },
                                    { key: 'invisible', label: 'Görünmez', dot: 'bg-zinc-500' },
                                ].map(({ key, label, dot }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        role="menuitem"
                                        onClick={() => { handleStatusChange(key); setShowStatusMenu(false); }}
                                        className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-left text-sm text-white hover:bg-white/5 whitespace-nowrap"
                                    >
                                        <div className={`w-3 h-3 rounded-full shrink-0 ${dot}`} />
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>,
                            document.body
                        )}
                        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                                    <span className="truncate">{user.username}</span>
                                    <span className="text-zinc-500 font-normal text-base">{user.discriminator}</span>
                                    {user.badges.map(badge => <Badge key={badge} type={badge} />)}
                                </h2>
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    {(() => {
                                        const status = normalizeStatus(user.status) ?? 'online';
                                        const statusConfig = { online: { label: 'Çevrimiçi', dot: 'bg-green-500' }, idle: { label: 'Boşta', dot: 'bg-yellow-500' }, dnd: { label: 'Rahatsız etmeyin', dot: 'bg-red-500' }, invisible: { label: 'Görünmez', dot: 'bg-zinc-500' } };
                                        const { label, dot } = statusConfig[status] ?? statusConfig.online;
                                        return (
                                            <button type="button" onClick={() => setShowStatusMenu(!showStatusMenu)} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left">
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                                                <span className="text-zinc-300">{label}</span>
                                            </button>
                                        );
                                    })()}
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const tag = `${user.username}${user.discriminator}`;
                                            try {
                                                await navigator.clipboard.writeText(tag);
                                                addToast('Etiket kopyalandı', 'success');
                                            } catch {
                                                addToast('Kopyalama başarısız', 'error');
                                            }
                                        }}
                                        className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
                                    >
                                        <Copy size={12} /> Etiketi kopyala
                                    </button>
                                </div>
                            </div>
                            <Button
                                onClick={() => { setModals(m => ({ ...m, profile: false, settings: true })); setSettingsTab('Hesabım'); }}
                                className="bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 text-xs py-2 px-4 shrink-0"
                            >
                                Profili Düzenle
                            </Button>
                        </div>
                    </div>

                    <div className="px-6 mt-6 flex gap-1 border-b border-white/5">
                        {['Genel Bakış', 'Aktivite', 'Bağlantılar'].map(tab => {
                            const tabKey = tab === 'Genel Bakış' ? 'overview' : tab === 'Aktivite' ? 'activity' : 'connections';
                            return (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setProfileTab(tabKey)}
                                    className={`pb-3 px-1 text-sm font-semibold border-b-2 -mb-px transition-colors ${profileTab === tabKey ? 'text-white border-orange-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
                                >
                                    {tab}
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-6 min-h-[220px] bg-[#0c0c0f]/80">
                        {profileTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Kullanıcı adı</h3>
                                    {isEditingUsername ? (
                                        <div className="space-y-2">
                                            <input
                                                value={tempUsername}
                                                onChange={(e) => setTempUsername(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 outline-none transition-colors"
                                                placeholder="kullanici_adi"
                                                autoFocus
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button type="button" onClick={() => { setIsEditingUsername(false); setTempUsername(user.username); }} className="text-sm text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5">İptal</button>
                                                <button type="button" onClick={handleSaveUsername} className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Save size={14} /> Kaydet</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => { setTempUsername(user.username); setIsEditingUsername(true); }}
                                            className="w-full text-left text-sm p-3 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-colors flex items-center justify-between group"
                                        >
                                            <span className="text-white font-medium">{user.username}</span>
                                            <PenLine size={14} className="text-zinc-500 opacity-0 group-hover:opacity-100" />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Etiket</h3>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                        <span className="text-white font-medium">{user.discriminator}</span>
                                        <span className="text-xs text-zinc-500">Premium ile değiştirilebilir</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Hakkımda</h3>
                                    {isEditingBio ? (
                                        <div className="space-y-2">
                                            <textarea
                                                value={tempBio}
                                                onChange={(e) => setTempBio(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 outline-none resize-none h-24 transition-colors"
                                                placeholder="Kendini kısaca tanıt..."
                                                autoFocus
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button type="button" onClick={() => setIsEditingBio(false)} className="text-sm text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5">İptal</button>
                                                <button type="button" onClick={handleSaveBio} className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Save size={14} /> Kaydet</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => { setTempBio(user.bio); setIsEditingBio(true); }}
                                            className="w-full text-left text-sm p-3 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-colors min-h-[4rem] group"
                                        >
                                            <span className={user.bio ? 'text-zinc-300' : 'text-zinc-500 italic'}>{user.bio || 'Biyografi ekle veya buraya tıkla...'}</span>
                                            <PenLine size={14} className="float-right mt-1 text-zinc-500 opacity-0 group-hover:opacity-100" />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-1 pt-2 border-t border-white/5">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Üyelik</h3>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                            <Calendar size={20} className="text-zinc-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-white">OxideSpace üyesi</div>
                                            <div className="text-xs text-zinc-500">
                                                {authUser?.created_at
                                                    ? `Katılım: ${new Date(authUser.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                                    : '—'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* ... other profile tabs (activity, connections) */}
                        {profileTab === 'activity' && (
                            <div>
                                <div className="bg-gradient-to-r from-green-900/20 to-black border border-green-500/20 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center relative overflow-hidden group">
                                        <Music size={32} className="text-green-500 relative z-10" />
                                        <div className="absolute inset-0 bg-green-500/20 animate-pulse" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-green-500 uppercase mb-0.5">Spotify dinliyor</div>
                                        <div className="font-bold text-white">Cyberpunk 2077 OST</div>
                                        <div className="text-xs text-zinc-400">P.T. Adamczyk</div>
                                        {/* Fake Progress Bar */}
                                        <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                                            <div className="w-1/3 h-full bg-white rounded-full" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 opacity-50">
                                    <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                        <Code2 size={24} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">Visual Studio Code</div>
                                        <div className="text-xs text-zinc-400">Editing OneFile.jsx</div>
                                    </div>
                                    <div className="ml-auto text-xs text-zinc-500">4s</div>
                                </div>
                            </div>
                        )}

                        {profileTab === 'connections' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Github size={20} className="text-white" />
                                        <span className="font-bold text-sm">NeoDeveloper</span>
                                    </div>
                                    <ExternalLinkIcon className="text-zinc-500 w-4 h-4" />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[#1DB954]/10 border border-[#1DB954]/20 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Music size={20} className="text-[#1DB954]" />
                                        <span className="font-bold text-sm">NeoMusic</span>
                                    </div>
                                    <ExternalLinkIcon className="text-zinc-500 w-4 h-4" />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Coffee size={20} className="text-[#5865F2]" />
                                        <span className="font-bold text-sm">Buy Me a Coffee</span>
                                    </div>
                                    <ExternalLinkIcon className="text-zinc-500 w-4 h-4" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Üye profili modalı (sağ panelden tıklanınca) */}
            <Modal
                isOpen={!!selectedMemberForProfile}
                onClose={() => setSelectedMemberForProfile(null)}
                title="Üye profili"
            >
                {selectedMemberForProfile && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar
                                src={selectedMemberForProfile.avatar}
                                size="xl"
                                status={onlineUserIds.has(selectedMemberForProfile.id) ? 'online' : 'idle'}
                                className="rounded-2xl"
                            />
                            <div className="min-w-0">
                                <h3 className="text-lg font-bold text-white truncate">{selectedMemberForProfile.username}</h3>
                                <p className="text-sm text-zinc-400">
                                    {selectedMemberForProfile.username}#{selectedMemberForProfile.discriminator || selectedMemberForProfile.id.substring(0, 4)}
                                </p>
                                <p className="text-sm text-zinc-500">
                                    {selectedMemberForProfile.role === 'owner' ? 'Yönetici 👑' : 'Topluluk Üyesi'}
                                </p>
                                <span className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${onlineUserIds.has(selectedMemberForProfile.id) ? 'bg-green-500/20 text-green-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                                    <span className={`w-2 h-2 rounded-full ${onlineUserIds.has(selectedMemberForProfile.id) ? 'bg-green-500' : 'bg-zinc-500'}`} />
                                    {onlineUserIds.has(selectedMemberForProfile.id) ? 'Çevrimiçi' : 'Çevrimdışı'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {requestStatusWithSelected === 'accepted' && (
                                <button
                                    type="button"
                                    onClick={() => handleOpenDmWithMemberIfFriend(selectedMemberForProfile)}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-colors font-medium text-sm"
                                >
                                    <MessageCircle size={18} />
                                    Mesaj Gönder
                                </button>
                            )}
                            {requestStatusWithSelected === 'pending_sent' && (
                                <p className="text-center py-2 text-sm text-zinc-400">Arkadaşlık isteği gönderildi. Kabul etmelerini bekle.</p>
                            )}
                            {requestStatusWithSelected === 'pending_received' && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const req = friendRequestsIncoming.find(r => r.from_user_id === selectedMemberForProfile.id);
                                            if (req) await handleAcceptFriendRequest(selectedMemberForProfile.id, req.profiles);
                                            setSelectedMemberForProfile(null);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 font-medium text-sm"
                                    >
                                        <Check size={18} />
                                        Kabul Et
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const req = friendRequestsIncoming.find(r => r.from_user_id === selectedMemberForProfile.id);
                                            if (req) await handleRejectFriendRequest(req.id);
                                            setRequestStatusWithSelected(null);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 font-medium text-sm"
                                    >
                                        <X size={18} />
                                        Reddet
                                    </button>
                                </div>
                            )}
                            {requestStatusWithSelected === null && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleSendFriendRequest(selectedMemberForProfile)}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-colors font-medium text-sm"
                                    >
                                        <UserPlus size={18} />
                                        Arkadaş Ekle
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenDmWithMemberIfFriend(selectedMemberForProfile)}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 transition-colors font-medium text-sm"
                                    >
                                        <MessageCircle size={18} />
                                        Mesaj Gönder
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Aktivite</h4>
                            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                <p className="text-sm text-zinc-400">Şu an görüntülenen bir aktivite yok.</p>
                                <p className="text-xs text-zinc-500 mt-1">Müzik, oyun veya uygulama durumu henüz paylaşılmadı.</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ... (Existing Settings Modal Code) */}
            {modals.settings && (
                <div className="fixed inset-0 z-[200] bg-[#09090b] flex">
                    {/* Sidebar */}
                    <div className="w-80 bg-[#121217] p-6 flex flex-col border-r border-white/5 overflow-y-auto">
                        <h2 className="font-bold text-xs text-zinc-500 uppercase mb-4 px-2 tracking-wider">Ayarlar</h2>
                        <div className="space-y-1 mb-6">
                            {['Hesabım', 'Görünüm', 'Ses ve Görüntü', 'Gizlilik'].map((item) => (
                                <div
                                    key={item}
                                    onClick={() => setSettingsTab(item)}
                                    className={`px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium transition-colors ${settingsTab === item ? 'bg-orange-600/20 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                                >
                                    {item}
                                </div>
                            ))}
                            <div className="my-4 h-px bg-white/5" />
                            <div
                                onClick={async () => {
                                    setModals(m => ({ ...m, settings: false }));
                                    await signOut();
                                }}
                                className="px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium text-rose-400 hover:bg-rose-500/10 flex items-center justify-between group"
                            >
                                Çıkış Yap <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-[#09090b] p-8 md:p-12 overflow-y-auto relative custom-scrollbar">
                        <button
                            onClick={() => setModals(m => ({ ...m, settings: false }))}
                            className="fixed top-8 right-8 w-10 h-10 border border-zinc-600 rounded-full flex flex-col items-center justify-center text-zinc-400 hover:text-white hover:border-white transition-all bg-black/50 backdrop-blur-sm z-50"
                        >
                            <X size={20} />
                            <span className="text-[9px] font-bold mt-0.5">ESC</span>
                        </button>

                        <div className="max-w-3xl mx-auto">

                            {settingsTab === 'Hesabım' && (
                                <>
                                    <h1 className="text-3xl font-bold text-white mb-2">Hesabım</h1>
                                    <p className="text-zinc-500 text-sm mb-8">Profil bilgilerini ve hesap ayarlarını yönet.</p>
                                    <input
                                        ref={avatarFileInputRef}
                                        type="file"
                                        accept={ALLOWED_IMAGE_TYPES.join(',')}
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            e.target.value = '';
                                            if (!file || !authUser?.id) return;
                                            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                                                addToast('Lütfen JPEG, PNG, GIF veya WebP seçin.', 'error');
                                                return;
                                            }
                                            if (file.size > MAX_AVATAR_BYTES) {
                                                addToast(`Profil resmi en fazla 2 MB olabilir.`, 'error');
                                                return;
                                            }
                                            setAvatarUploading(true);
                                            try {
                                                const url = await uploadAvatar(file, authUser.id);
                                                const urlWithCacheBuster = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
                                                await updateProfile({ avatar_url: urlWithCacheBuster });
                                                refetchProfile();
                                                addToast('Profil resmi güncellendi.', 'success');
                                            } catch (err) {
                                                addToast(formatError(err), 'error');
                                            } finally {
                                                setAvatarUploading(false);
                                            }
                                        }}
                                    />
                                    <div className="rounded-2xl border border-white/10 bg-[#121217]/80 overflow-hidden mb-8">
                                        <div className="p-6 flex flex-wrap items-center gap-4 sm:gap-6">
                                            <div className="relative shrink-0">
                                                <Avatar src={user.avatar} size="xl" status={normalizeStatus(user.status)} className="border-4 border-[#09090b]" />
                                                <button
                                                    type="button"
                                                    disabled={avatarUploading}
                                                    onClick={() => avatarFileInputRef.current?.click()}
                                                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-50"
                                                    title="Profil resmi güncelle"
                                                >
                                                    {avatarUploading ? <Loader2 className="animate-spin text-white" size={28} /> : <ImageIcon className="text-white" size={28} />}
                                                </button>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xl font-bold text-white">{user.username}<span className="text-zinc-500 font-normal ml-1">{user.discriminator}</span></div>
                                                <p className="text-zinc-500 text-sm mt-0.5">Profil fotoğrafı ve kullanıcı adı · Resmin üzerine gelerek güncelleyebilirsin</p>
                                            </div>
                                            <Button primary onClick={() => { setModals(m => ({ ...m, settings: false, profile: true })); }} className="shrink-0">Profili Düzenle</Button>
                                        </div>
                                        <div className="border-t border-white/5 divide-y divide-white/5">
                                            <div className="flex items-center justify-between px-6 py-4">
                                                <div>
                                                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">E-posta</div>
                                                    <div className="text-white font-medium mt-0.5">{authUser?.email ?? '—'}</div>
                                                </div>
                                                <span className="text-xs text-zinc-500">Doğrulanmış hesap</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {settingsTab === 'Görünüm' && (
                                <>
                                    <h1 className="text-3xl font-bold mb-8">Görünüm</h1>
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-4"><Moon size={24} /> <span>Karanlık Mod</span></div>
                                            <div className="w-6 h-6 bg-orange-500 rounded-full border-4 border-[#121217] ring-2 ring-orange-500"></div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between opacity-50 cursor-not-allowed">
                                            <div className="flex items-center gap-4"><Sun size={24} /> <span>Aydınlık Mod</span></div>
                                            <div className="w-6 h-6 rounded-full border-2 border-zinc-600"></div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {settingsTab === 'Ses ve Görüntü' && (
                                <>
                                    <h1 className="text-3xl font-bold mb-8">Ses ve Görüntü</h1>
                                    <div className="space-y-8">
                                        {/* Ses Aygıtları */}
                                        <div>
                                            <h2 className="text-lg font-bold text-white mb-4">Ses Aygıtları</h2>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Giriş Aygıtı</label>
                                                    <select
                                                        value={audioInputDevice}
                                                        onChange={(e) => setAudioInputDevice(e.target.value)}
                                                        className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500"
                                                    >
                                                        <option value="">Varsayılan Mikrofon</option>
                                                        {audioDevices.filter(d => d.kind === 'audioinput').map((device) => (
                                                            <option key={device.deviceId} value={device.deviceId}>
                                                                {device.label || `Mikrofon ${device.deviceId.substring(0, 8)}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Çıkış Aygıtı</label>
                                                    <select
                                                        value={audioOutputDevice}
                                                        onChange={(e) => setAudioOutputDevice(e.target.value)}
                                                        className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500"
                                                    >
                                                        <option value="">Varsayılan Hoparlör</option>
                                                        {audioDevices.filter(d => d.kind === 'audiooutput').map((device) => (
                                                            <option key={device.deviceId} value={device.deviceId}>
                                                                {device.label || `Hoparlör ${device.deviceId.substring(0, 8)}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-px bg-white/5" />

                                        {/* Ses Seviyeleri */}
                                        <div>
                                            <h2 className="text-lg font-bold text-white mb-4">Ses Seviyeleri</h2>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex justify-between text-xs text-zinc-500 mb-2">
                                                        <span>Giriş Seviyesi</span>
                                                        <span>{inputVolume}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={inputVolume}
                                                        onChange={(e) => setInputVolume(Number(e.target.value))}
                                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-xs text-zinc-500 mb-2">
                                                        <span>Çıkış Seviyesi</span>
                                                        <span>{outputVolume}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={outputVolume}
                                                        onChange={(e) => setOutputVolume(Number(e.target.value))}
                                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-xs text-zinc-500 mb-2">
                                                        <span>Giriş Hassasiyeti</span>
                                                        <span>{inputSensitivity}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={inputSensitivity}
                                                        onChange={(e) => setInputSensitivity(Number(e.target.value))}
                                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-px bg-white/5" />

                                        {/* Ses Geliştirmeleri */}
                                        <div>
                                            <h2 className="text-lg font-bold text-white mb-4">Ses Geliştirmeleri</h2>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-xl">
                                                    <div>
                                                        <div className="font-medium text-white">Yankı İptali</div>
                                                        <div className="text-xs text-zinc-500">Mikrofonunuzdan gelen yankıyı azaltır. Yayın izlerken konuşunca ses kesiliyorsa kapatıp kulaklık kullanın.</div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={echoCancellation}
                                                            onChange={(e) => setEchoCancellation(e.target.checked)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                                    </label>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-xl">
                                                    <div>
                                                        <div className="font-medium text-white">Gürültü Bastırma</div>
                                                        <div className="text-xs text-zinc-500">Arka plan gürültüsünü azaltır (tarayıcı yerleşik)</div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={noiseSuppression}
                                                            onChange={(e) => setNoiseSuppression(e.target.checked)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                                    </label>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl">
                                                    <div>
                                                        <div className="font-medium text-white flex items-center gap-2">
                                                            Krisp Seviye Gürültü Engelleme
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded-full uppercase font-bold">AI</span>
                                                        </div>
                                                        <div className="text-xs text-zinc-400">RNNoise ML ile profesyonel gürültü bastırma (klavye, fan, arka plan sesleri)</div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={rnnoiseEnabled}
                                                            onChange={(e) => {
                                                                setRnnoiseEnabled(e.target.checked);
                                                                if (e.target.checked && koalaEnabled) setKoalaEnabled(false);
                                                            }}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-red-500"></div>
                                                    </label>
                                                </div>
                                                {isKoalaAvailable() && (
                                                <div className="flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-xl">
                                                    <div>
                                                        <div className="font-medium text-white">Koala gürültü bastırma</div>
                                                        <div className="text-xs text-zinc-500">Picovoice Koala ile daha güçlü gürültü azaltma (Access Key gerekir)</div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={koalaEnabled}
                                                            onChange={(e) => setKoalaEnabled(e.target.checked)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                                    </label>
                                                </div>
                                                )}
                                                <div className="flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-xl">
                                                    <div>
                                                        <div className="font-medium text-white">Otomatik Kazanç Kontrolü</div>
                                                        <div className="text-xs text-zinc-500">Ses seviyesini otomatik ayarlar</div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={automaticGainControl}
                                                            onChange={(e) => setAutomaticGainControl(e.target.checked)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-px bg-white/5" />

                                        {/* Video Aygıtları */}
                                        <div>
                                            <h2 className="text-lg font-bold text-white mb-4">Video Aygıtları</h2>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Kamera</label>
                                                    <select
                                                        value={videoInputDevice}
                                                        onChange={(e) => setVideoInputDevice(e.target.value)}
                                                        className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500"
                                                    >
                                                        <option value="">Varsayılan Kamera</option>
                                                        {videoDevices.map((device) => (
                                                            <option key={device.deviceId} value={device.deviceId}>
                                                                {device.label || `Kamera ${device.deviceId.substring(0, 8)}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Video Kalitesi</label>
                                                    <select
                                                        value={videoQuality}
                                                        onChange={(e) => setVideoQuality(e.target.value)}
                                                        className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500"
                                                    >
                                                        <option value="480p">480p (SD)</option>
                                                        <option value="720p">720p (HD)</option>
                                                        <option value="1080p">1080p (Full HD)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-px bg-white/5" />

                                        {/* Test ve Önizleme */}
                                        <div>
                                            <h2 className="text-lg font-bold text-white mb-4">Test ve Önizleme</h2>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <Button className="flex-1" icon={Speaker} onClick={async () => {
                                                        if (!isMicTesting) {
                                                            setIsMicTesting(true);
                                                            try {
                                                                const constraints: MediaStreamConstraints = {
                                                                    audio: {
                                                                        deviceId: audioInputDevice ? { exact: audioInputDevice } : undefined,
                                                                        echoCancellation: echoCancellation,
                                                                        noiseSuppression: noiseSuppression,
                                                                        autoGainControl: automaticGainControl,
                                                                    }
                                                                };
                                                                
                                                                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                                                                const audioContext = new AudioContext();
                                                                const analyser = audioContext.createAnalyser();
                                                                const microphone = audioContext.createMediaStreamSource(stream);
                                                                microphone.connect(analyser);
                                                                analyser.fftSize = 256;
                                                                analyser.smoothingTimeConstant = 0.8;
                                                                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                                                                let animationFrameId: number;
                                                                const throttleMs = 80;
                                                                let lastUpdate = 0;
                                                                const updateLevel = () => {
                                                                    if (!isMicTesting) {
                                                                        if (animationFrameId) cancelAnimationFrame(animationFrameId);
                                                                        stream.getTracks().forEach(track => track.stop());
                                                                        audioContext.close();
                                                                        return;
                                                                    }
                                                                    analyser.getByteFrequencyData(dataArray);
                                                                    const now = Date.now();
                                                                    if (now - lastUpdate >= throttleMs) {
                                                                        lastUpdate = now;
                                                                        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                                                                        const normalizedLevel = Math.min((average / 255) * 100 * (inputVolume / 100), 100);
                                                                        setMicTestLevel(normalizedLevel);
                                                                    }
                                                                    animationFrameId = requestAnimationFrame(updateLevel);
                                                                };
                                                                updateLevel();
                                                            } catch (error) {
                                                                logger.error('Mic test error:', error);
                                                                setIsMicTesting(false);
                                                                addToast('Mikrofon erişimi reddedildi', 'error');
                                                            }
                                                        } else {
                                                            setIsMicTesting(false);
                                                            setMicTestLevel(0);
                                                        }
                                                    }}>
                                                        {isMicTesting ? 'Testi Durdur' : 'Mikrofon Testi'}
                                                    </Button>
                                                    <Button className="flex-1" icon={Camera} onClick={async () => {
                                                        if (!cameraPreview) {
                                                            try {
                                                                const stream = await navigator.mediaDevices.getUserMedia({ 
                                                                    video: { deviceId: videoInputDevice || undefined } 
                                                                });
                                                                setCameraStream(stream);
                                                                setCameraPreview(true);
                                                            } catch (error) {
                                                                logger.error('Camera error:', error);
                                                                addToast('Kamera erişimi reddedildi', 'error');
                                                            }
                                                        } else {
                                                            if (cameraStream) {
                                                                cameraStream.getTracks().forEach(track => track.stop());
                                                                setCameraStream(null);
                                                            }
                                                            setCameraPreview(false);
                                                        }
                                                    }}>
                                                        {cameraPreview ? 'Önizlemeyi Kapat' : 'Kamera Önizleme'}
                                                    </Button>
                                                </div>

                                                {/* Mic Test Bar */}
                                                {isMicTesting && (
                                                    <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                                                        <div className="flex justify-between text-xs text-zinc-500 mb-1">
                                                            <span>Giriş Seviyesi</span>
                                                            <span>{Math.round(micTestLevel)}%</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-orange-500 transition-all duration-100 ease-out"
                                                                style={{ width: `${Math.min(micTestLevel, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Camera Preview */}
                                                {cameraPreview && cameraStream && (
                                                    <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                                                        <video
                                                            ref={(video) => {
                                                                if (video && cameraStream) {
                                                                    video.srcObject = cameraStream;
                                                                    video.play();
                                                                }
                                                            }}
                                                            autoPlay
                                                            muted
                                                            className="w-full rounded-lg"
                                                            style={{ maxHeight: '300px', objectFit: 'contain' }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {settingsTab === 'Gizlilik' && (
                                <>
                                    <h1 className="text-3xl font-bold mb-8">Gizlilik</h1>
                                    <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-2xl mb-6">
                                        <h3 className="font-bold text-orange-400 mb-2 flex items-center gap-2"><Shield size={20} /> Güvenli Mod</h3>
                                        <p className="text-sm text-zinc-300">OxideSpace tüm mesajlarını uçtan uca şifreler. Verilerin güvende.</p>
                                    </div>
                                </>
                            )}

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
    }

    return content;
}

const ExternalLinkIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
);