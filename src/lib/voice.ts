// Voice Channel Backend Service
import { supabase } from './supabase';
import { logger } from '../utils/logger';

export interface VoiceState {
    id: string;
    user_id: string;
    channel_id: string;
    server_id?: string;
    muted: boolean;
    deafened: boolean;
    video_enabled: boolean;
    screen_share_enabled: boolean;
    session_id?: string;
}

export interface PeerConnection {
    peerConnection: RTCPeerConnection;
    userId: string;
    stream?: MediaStream;
}

class VoiceService {
    private peerConnections: Map<string, PeerConnection> = new Map();
    private localStream: MediaStream | null = null;
    private currentChannelId: string | null = null;
    private userId: string | null = null;
    private voiceStateSubscription: any = null;

    // WebRTC Configuration
    private rtcConfig: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    async initialize(userId: string) {
        this.userId = userId;
    }

    // Ses kanalına katıl
    async joinChannel(channelId: string, serverId?: string) {
        if (this.currentChannelId === channelId) return;

        // Önceki kanaldan ayrıl
        if (this.currentChannelId) {
            await this.leaveChannel();
        }

        this.currentChannelId = channelId;

        try {
            // Mikrofon ve kamera erişimi
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false // İlk başta sadece ses
            });

            // Voice state oluştur
            const { error } = await supabase
                .from('voice_states')
                .upsert({
                    user_id: this.userId!,
                    channel_id: channelId,
                    server_id: serverId,
                    muted: false,
                    deafened: false,
                    video_enabled: false,
                    screen_share_enabled: false
                }, {
                    onConflict: 'user_id,channel_id'
                })
                .select()
                .single();

            if (error) {
                logger.error('Voice state error:', error);
                return;
            }

            // Diğer kullanıcıları dinle
            this.subscribeToVoiceStates(channelId);

            // Diğer kullanıcılarla peer connection kur
            await this.setupPeerConnections(channelId);

        } catch (error) {
            logger.error('Error joining voice channel:', error);
            throw error;
        }
    }

    // Ses kanalından ayrıl
    async leaveChannel() {
        if (!this.currentChannelId) return;

        // Voice state'i sil
        await supabase
            .from('voice_states')
            .delete()
            .eq('user_id', this.userId!)
            .eq('channel_id', this.currentChannelId);

        // Peer connections'ları kapat
        this.peerConnections.forEach((pc) => {
            pc.peerConnection.close();
            if (pc.stream) {
                pc.stream.getTracks().forEach(track => track.stop());
            }
        });
        this.peerConnections.clear();

        // Local stream'i durdur
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Subscription'ı kapat
        if (this.voiceStateSubscription) {
            this.voiceStateSubscription.unsubscribe();
            this.voiceStateSubscription = null;
        }

        this.currentChannelId = null;
    }

    // Mikrofon durumunu değiştir
    async toggleMute(muted: boolean) {
        if (!this.currentChannelId || !this.localStream) return;

        this.localStream.getAudioTracks().forEach(track => {
            track.enabled = !muted;
        });

        await supabase
            .from('voice_states')
            .update({ muted })
            .eq('user_id', this.userId!)
            .eq('channel_id', this.currentChannelId);
    }

    // Sağırlaştırma durumunu değiştir
    async toggleDeafen(deafened: boolean) {
        if (!this.currentChannelId) return;

        await supabase
            .from('voice_states')
            .update({ deafened: deafened })
            .eq('user_id', this.userId!)
            .eq('channel_id', this.currentChannelId);

        // Eğer sağırlaştırıldıysa, mikrofonu da kapat
        if (deafened) {
            await this.toggleMute(true);
        }
    }

    // Video durumunu değiştir
    async toggleVideo(enabled: boolean) {
        if (!this.currentChannelId) return;

        if (enabled && !this.localStream?.getVideoTracks().length) {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                videoStream.getVideoTracks().forEach(track => {
                    this.localStream?.addTrack(track);
                });
            } catch (error) {
                console.error('Error enabling video:', error);
                return;
            }
        } else if (!enabled && this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.stop();
                this.localStream?.removeTrack(track);
            });
        }

        await supabase
            .from('voice_states')
            .update({ video_enabled: enabled })
            .eq('user_id', this.userId!)
            .eq('channel_id', this.currentChannelId);
    }

    // Ekran paylaşımını başlat/durdur
    async toggleScreenShare(enabled: boolean) {
        if (!this.currentChannelId) return;

        if (enabled) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });

                // Screen share track'ini peer connections'a ekle
                screenStream.getTracks().forEach(track => {
                    this.peerConnections.forEach((pc) => {
                        pc.peerConnection.getSenders().forEach(sender => {
                            if (track.kind === 'video') {
                                sender.replaceTrack(track);
                            }
                        });
                    });
                });

                // Stream bittiğinde durdur
                screenStream.getVideoTracks()[0].onended = () => {
                    this.toggleScreenShare(false);
                };

            } catch (error) {
                logger.error('Error sharing screen:', error);
            }
        }

        await supabase
            .from('voice_states')
            .update({ screen_share_enabled: enabled })
            .eq('user_id', this.userId!)
            .eq('channel_id', this.currentChannelId);
    }

    // Voice states'i dinle
    private subscribeToVoiceStates(channelId: string) {
        this.voiceStateSubscription = supabase
            .channel(`voice:${channelId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'voice_states',
                filter: `channel_id=eq.${channelId}`
            }, async (payload) => {
                if (payload.eventType === 'INSERT' && payload.new.user_id !== this.userId) {
                    // Yeni kullanıcı katıldı
                    await this.createPeerConnection(payload.new.user_id);
                } else if (payload.eventType === 'DELETE') {
                    // Kullanıcı ayrıldı
                    this.removePeerConnection(payload.old.user_id);
                } else if (payload.eventType === 'UPDATE') {
                    // Kullanıcı durumu değişti
                    this.updatePeerConnection(payload.new as VoiceState);
                }
            })
            .subscribe();
    }

    // Peer connections kurulumu
    private async setupPeerConnections(channelId: string) {
        const { data: voiceStates } = await supabase
            .from('voice_states')
            .select('*')
            .eq('channel_id', channelId)
            .neq('user_id', this.userId!);

        if (voiceStates) {
            for (const state of voiceStates) {
                await this.createPeerConnection(state.user_id);
            }
        }
    }

    // Peer connection oluştur
    private async createPeerConnection(userId: string) {
        if (this.peerConnections.has(userId)) return;

        const peerConnection = new RTCPeerConnection(this.rtcConfig);
        
        // Local stream'i ekle
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream!);
            });
        }

        // Remote stream'i al
        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            // Remote stream'i UI'a gönder (event listener ile)
            this.onRemoteStream(userId, remoteStream);
        };

        // ICE candidate'ları işle
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // ICE candidate'ı sinyalizasyon sunucusuna gönder
                this.sendIceCandidate(userId, event.candidate);
            }
        };

        this.peerConnections.set(userId, { peerConnection, userId });

        // Offer oluştur ve gönder
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        await this.sendOffer(userId, offer);
    }

    // Peer connection'ı kaldır
    private removePeerConnection(userId: string) {
        const pc = this.peerConnections.get(userId);
        if (pc) {
            pc.peerConnection.close();
            if (pc.stream) {
                pc.stream.getTracks().forEach(track => track.stop());
            }
            this.peerConnections.delete(userId);
        }
    }

    // Peer connection'ı güncelle
    private updatePeerConnection(state: VoiceState) {
        const pc = this.peerConnections.get(state.user_id);
        if (pc) {
            // Mute/unmute durumunu güncelle
            // (Bu genellikle UI tarafında gösterilir, stream'i etkilemez)
        }
    }

    // Remote stream callback (UI'a göndermek için)
    private onRemoteStream(userId: string, stream: MediaStream) {
        const pc = this.peerConnections.get(userId);
        if (pc) {
            pc.stream = stream;
            // Event dispatch edilebilir veya callback kullanılabilir
            if (this.onStreamCallback) {
                this.onStreamCallback(userId, stream);
            }
        }
    }

    // Callbacks
    private onStreamCallback?: (userId: string, stream: MediaStream) => void;
    
    setOnStreamCallback(callback: (userId: string, stream: MediaStream) => void) {
        this.onStreamCallback = callback;
    }

    // Sinyalizasyon (basitleştirilmiş - gerçek uygulamada WebSocket/WebRTC signaling server kullanılmalı)
    private async sendOffer(_userId: string, _offer: RTCSessionDescriptionInit) {
        // Bu kısım gerçek bir signaling server gerektirir
        // Şimdilik Supabase Realtime kullanabiliriz
        if (import.meta.env.DEV) {
            logger.log('Sending offer to', _userId, _offer);
        }
    }

    private async sendIceCandidate(_userId: string, _candidate: RTCIceCandidate) {
        if (import.meta.env.DEV) {
            logger.log('Sending ICE candidate to', _userId, _candidate);
        }
    }

    // Local stream'i al
    getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    // Peer connections'ları al
    getPeerConnections(): Map<string, PeerConnection> {
        return this.peerConnections;
    }

    // Temizlik
    async cleanup() {
        await this.leaveChannel();
        this.userId = null;
    }
}

export const voiceService = new VoiceService();



