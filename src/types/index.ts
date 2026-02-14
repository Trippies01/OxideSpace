// Type definitions for the application

export interface Server {
    id: string;
    name: string;
    icon: string | null;
    type: string;
    color?: string;
    ownerId?: string;
}

export interface Channel {
    id: string;
    name: string;
    type: string;
    category: string;
    server_id?: string;
    position?: number;
}

export interface Message {
    id: string | number;
    user: string;
    content: string;
    time: string;
    isMe: boolean;
    avatar: string;
}

export interface User {
    id: string;
    username: string;
    discriminator: string;
    bio: string;
    avatar: string;
    status: string;
    bannerColor: string;
    badges: string[];
}

export interface VoiceChannelUser {
    id: string;
    username: string;
    avatar_url?: string;
    status?: string;
    muted: boolean;
    deafened: boolean;
    video_enabled: boolean;
    screen_share_enabled: boolean;
}

export interface VoiceState {
    mic: boolean;
    video: boolean;
    deafen: boolean;
    screenShare: boolean;
    /** Yayın (ekran paylaşımı) sesi 0-100 */
    streamVolume?: number;
    /** Normal (mikrofon) sesi 0-100 - diğer katılımcıların ses seviyesi */
    normalVolume?: number;
}

export interface VideoTrackEntry {
    track: any; // Track from livekit-client
    source: string;
    muted: boolean;
}
