// LiveKit Voice/Video Service
import { Room, RoomEvent, RemoteParticipant, LocalParticipant, Track, TrackPublication } from 'livekit-client';
import { logger } from '../utils/logger';

export interface LiveKitConfig {
    url: string;
    token: string;
}

export interface MediaDevice {
    deviceId: string;
    label: string;
    kind: MediaDeviceKind;
}

class LiveKitService {
    private room: Room | null = null;
    private localStream: MediaStream | null = null;
    private audioInputDevice: string | null = null;
    private videoInputDevice: string | null = null;
    /** Uzak katılımcıların ses track'leri için audio element'ler (oynatma için gerekli) */
    private remoteAudioElements = new Map<string, HTMLAudioElement>();
    private lastNormalVolume = 1;
    private lastStreamVolume = 1;
    /** İsteğe bağlı: mikrofon stream'ini Krisp/RNNoise vb. ile filtrele (Discord seviyesi gürültü engelleme) */
    private audioFilter: ((stream: MediaStream) => Promise<MediaStream>) | null = null;

    // Callbacks
    private onParticipantConnected?: (participant: RemoteParticipant) => void;
    private onParticipantDisconnected?: (participant: RemoteParticipant) => void;
    private onTrackSubscribed?: (track: Track, publication: TrackPublication, participant: RemoteParticipant | LocalParticipant) => void;
    private onTrackUnsubscribed?: (track: Track, publication: TrackPublication, participant: RemoteParticipant | LocalParticipant) => void;
    private onLocalTrackPublished?: (publication: TrackPublication, participant: LocalParticipant) => void;

    /**
     * LiveKit token oluştur - Supabase Edge Function kullanarak
     */
    async generateToken(userId: string, roomName: string, userName?: string): Promise<LiveKitConfig> {
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            if (!supabaseUrl || !supabaseAnonKey) {
                throw new Error('Supabase URL veya Anon Key eksik');
            }

            const response = await fetch(`${supabaseUrl}/functions/v1/livekit-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({ userId, roomName, userName }),
            });

            const text = await response.text();
            let payload: any = null;
            try {
                payload = text ? JSON.parse(text) : null;
            } catch {
                payload = null;
            }

            if (!response.ok) {
                const errorMessage = payload?.error || text || 'Token oluşturulamadı';
                throw new Error(errorMessage);
            }

            if (!payload?.token) {
                throw new Error('Token yanıtı geçersiz');
            }

            return {
                token: payload.token,
                url: payload?.url || '',
            };
        } catch (error) {
            logger.error('Token oluşturma hatası:', error);
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : 'LiveKit token oluşturulamadı. Supabase Edge Function yapılandırmasını kontrol edin.'
            );
        }
    }

    /**
     * Odaya katıl
     */
    async joinRoom(roomName: string, userId: string, userName: string): Promise<Room> {
        if (this.room && this.room.name === roomName) {
            return this.room;
        }

        // Önceki odadan ayrıl
        if (this.room) {
            await this.leaveRoom();
        }

        try {
            // Token oluştur (Supabase Edge Function'dan)
            const { token, url } = await this.generateToken(userId, roomName, userName);

            // LiveKit URL'i önce Edge Function'dan, yoksa env'den al
            const livekitUrl = url || import.meta.env.VITE_LIVEKIT_URL;
            if (!livekitUrl) {
                throw new Error('LiveKit URL eksik. VITE_LIVEKIT_URL ayarlayın veya Edge Function LIVEKIT_URL döndürsün.');
            }

            // Yeni oda oluştur
            const room = new Room({
                adaptiveStream: true,
                dynacast: true,
            });

            // Event listener'ları ekle
            this.setupRoomListeners(room);

            // Odaya bağlan
            await room.connect(livekitUrl, token);

            // Kullanıcı bilgilerini ayarla
            await room.localParticipant.setName(userName);

            this.room = room;
            void roomName; // room name stored for potential future use

            // Mikrofon ve kamera erişimi
            await this.enableAudio();
            
            return room;
        } catch (error) {
            logger.error('Odaya katılma hatası:', error);
            throw error;
        }
    }

    /**
     * Odadan ayrıl
     */
    async leaveRoom(): Promise<void> {
        if (!this.room) return;

        try {
            // Uzak ses element'lerini temizle
            this.remoteAudioElements.forEach((el) => el.remove());
            this.remoteAudioElements.clear();

            // Tüm track'leri durdur
            this.room.localParticipant.trackPublications.forEach((publication) => {
                if (publication.track) {
                    publication.track.stop();
                }
            });

            // Odadan ayrıl
            await this.room.disconnect();
            this.room = null;

            // Local stream'i temizle
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }
        } catch (error) {
            logger.error('Odadan ayrılma hatası:', error);
        }
    }

    /**
     * Ses aygıtlarını listele - izin istemez, sadece enumerateDevices (kamera/mikrofon açılmaz)
     * Etiketler izin verilene kadar boş olabilir.
     */
    async getAudioInputDevices(): Promise<MediaDevice[]> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices
                .filter(d => d.kind === 'audioinput')
                .map(d => ({
                    deviceId: d.deviceId,
                    label: d.label || `Mikrofon ${d.deviceId.substring(0, 8)}`,
                    kind: d.kind,
                }));
        } catch (error) {
            logger.error('Ses giriş aygıtları alınamadı:', error);
            return [];
        }
    }

    /**
     * Video aygıtlarını listele - izin istemez, sadece enumerateDevices (kamera açılmaz)
     * Etiketler izin verilene kadar boş olabilir.
     */
    async getVideoInputDevices(): Promise<MediaDevice[]> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices
                .filter(d => d.kind === 'videoinput')
                .map(d => ({
                    deviceId: d.deviceId,
                    label: d.label || `Kamera ${d.deviceId.substring(0, 8)}`,
                    kind: d.kind,
                }));
        } catch (error) {
            logger.error('Video giriş aygıtları alınamadı:', error);
            return [];
        }
    }

    /**
     * Ses çıkış aygıtlarını listele
     */
    async getAudioOutputDevices(): Promise<MediaDevice[]> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices
                .filter(d => d.kind === 'audiooutput')
                .map(d => ({
                    deviceId: d.deviceId,
                    label: d.label || `Hoparlör ${d.deviceId.substring(0, 8)}`,
                    kind: d.kind,
                }));
        } catch (error) {
            logger.error('Ses çıkış aygıtları alınamadı:', error);
            return [];
        }
    }

    /**
     * Mikrofonu aç/kapat
     */
    async enableAudio(enabled: boolean = true): Promise<void> {
        if (!this.room) return;

        try {
            if (enabled) {
                const constraints: MediaStreamConstraints = {
                    audio: this.audioInputDevice ? { deviceId: { exact: this.audioInputDevice } } : true,
                };
                let stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (this.audioFilter) {
                    try {
                        stream = await this.audioFilter(stream);
                    } catch (err) {
                        logger.error('Ses filtresi (Krisp/RNNoise) uygulanamadı, ham mikrofon kullanılıyor:', err);
                    }
                }
                const audioTrack = stream.getAudioTracks()[0];
                if (audioTrack) {
                    audioTrack.enabled = true;
                    await this.room.localParticipant.publishTrack(audioTrack, {
                        source: Track.Source.Microphone,
                        dtx: true,
                    });
                    this.localStream = stream;
                }
            } else {
                // Mikrofonu kapat
                const publication = this.room.localParticipant.getTrackPublication(Track.Source.Microphone);
                if (publication) {
                    await this.room.localParticipant.unpublishTrack(publication.track!);
                }
            }
        } catch (error) {
            logger.error('Mikrofon hatası:', error);
            throw error;
        }
    }

    async setMicrophoneEnabled(enabled: boolean): Promise<void> {
        if (!this.room) return;
        try {
            await this.room.localParticipant.setMicrophoneEnabled(enabled);
        } catch (error) {
            await this.enableAudio(enabled);
        }
    }

    /**
     * Kamerayı aç/kapat
     */
    async enableVideo(enabled: boolean = true): Promise<void> {
        if (!this.room) return;

        try {
            if (enabled) {
                const constraints: MediaStreamConstraints = {
                    video: this.videoInputDevice
                        ? { deviceId: { exact: this.videoInputDevice }, width: { ideal: 1920 }, height: { ideal: 1080 } }
                        : { width: { ideal: 1920 }, height: { ideal: 1080 } },
                };
                
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                const videoTrack = stream.getVideoTracks()[0];
                
                if (videoTrack) {
                    await this.room.localParticipant.publishTrack(videoTrack, {
                        source: Track.Source.Camera,
                    });
                }
            } else {
                // Kamerayı kapat
                const publication = this.room.localParticipant.getTrackPublication(Track.Source.Camera);
                if (publication) {
                    await this.room.localParticipant.unpublishTrack(publication.track!);
                }
            }
        } catch (error) {
            logger.error('Kamera hatası:', error);
            throw error;
        }
    }

    async setCameraEnabled(enabled: boolean): Promise<void> {
        if (!this.room) return;
        try {
            await this.room.localParticipant.setCameraEnabled(enabled);
        } catch (error) {
            await this.enableVideo(enabled);
        }
    }

    /**
     * Ekran paylaşımını başlat/durdur (getDisplayMedia + publishTrack).
     * audio: true ile tarayıcı "Ses paylaş" seçeneğini gösterir; yayın sesi karşı tarafa gider.
     */
    async enableScreenShare(enabled: boolean = true): Promise<void> {
        if (!this.room) return;

        try {
            if (enabled) {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        frameRate: { ideal: 30 },
                    },
                    audio: true,
                });

                const videoTrack = stream.getVideoTracks()[0];
                if (!videoTrack) throw new Error('Ekran görüntüsü alınamadı');

                await this.room.localParticipant.publishTrack(videoTrack, {
                    source: Track.Source.ScreenShare,
                });

                const audioTrack = stream.getAudioTracks()[0];
                if (audioTrack) {
                    await this.room.localParticipant.publishTrack(audioTrack, {
                        source: Track.Source.ScreenShareAudio,
                    });
                }

                const stopShare = () => this.enableScreenShare(false);
                videoTrack.onended = stopShare;
                if (audioTrack) audioTrack.addEventListener('ended', stopShare);
            } else {
                const screenPub = this.room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
                const screenAudioPub = this.room.localParticipant.getTrackPublication(Track.Source.ScreenShareAudio);
                if (screenPub?.track) await this.room.localParticipant.unpublishTrack(screenPub.track);
                if (screenAudioPub?.track) await this.room.localParticipant.unpublishTrack(screenAudioPub.track);
            }
        } catch (error) {
            logger.error('Ekran paylaşımı hatası:', error);
            throw error;
        }
    }

    async setScreenShareEnabled(enabled: boolean): Promise<void> {
        if (!this.room) return;
        try {
            // Her zaman kendi implementasyonumuzu kullan; SDK'nın setScreenShareEnabled'ı bazı ortamlarda tutarsız olabiliyor
            await this.enableScreenShare(enabled);
        } catch (error) {
            logger.error('setScreenShareEnabled error:', error);
            throw error;
        }
    }

    async setDeafened(deafened: boolean): Promise<void> {
        if (!this.room) return;
        try {
            await this.setMicrophoneEnabled(!deafened);
            this.room.remoteParticipants.forEach((participant) => {
                participant.audioTrackPublications.forEach((publication) => {
                    if (publication.track && typeof (publication.track as any).setVolume === 'function') {
                        (publication.track as any).setVolume(deafened ? 0 : 1);
                    }
                });
            });
        } catch (error) {
            logger.error('Deafen error:', error);
        }
    }

    /**
     * Uzak katılımcıların ses seviyeleri: normal ses (mikrofon) ve yayın sesi (ekran paylaşımı sesi).
     * @param normalVolume 0-1, mikrofon sesi
     * @param streamVolume 0-1, ekran paylaşımı sesi
     */
    setRemoteVolumes(normalVolume: number, streamVolume: number): void {
        this.lastNormalVolume = normalVolume;
        this.lastStreamVolume = streamVolume;
        if (!this.room) return;
        this.room.remoteParticipants.forEach((participant) => {
            if (typeof participant.setVolume === 'function') {
                participant.setVolume(normalVolume, Track.Source.Microphone);
                participant.setVolume(streamVolume, Track.Source.ScreenShareAudio);
            }
        });
    }

    /**
     * İsteğe bağlı gürültü filtresi (Krisp, RNNoise vb.).
     * Mikrofon açılırken ham stream bu fonksiyondan geçer; dönen stream yayınlanır.
     * null verirsen filtre kapatılır.
     */
    setAudioFilter(fn: ((stream: MediaStream) => Promise<MediaStream>) | null): void {
        this.audioFilter = fn;
    }

    /**
     * Ses giriş aygıtını değiştir
     */
    async setAudioInputDevice(deviceId: string): Promise<void> {
        this.audioInputDevice = deviceId;
        
        // Eğer mikrofon açıksa, yeniden başlat
        if (this.room) {
            const publication = this.room.localParticipant.getTrackPublication(Track.Source.Microphone);
            if (publication && publication.isMuted === false) {
                await this.enableAudio(false);
                await this.enableAudio(true);
            }
        }
    }

    /**
     * Video giriş aygıtını değiştir
     */
    async setVideoInputDevice(deviceId: string): Promise<void> {
        this.videoInputDevice = deviceId;
        
        // Eğer kamera açıksa, yeniden başlat
        if (this.room) {
            const publication = this.room.localParticipant.getTrackPublication(Track.Source.Camera);
            if (publication && publication.isMuted === false) {
                await this.enableVideo(false);
                await this.enableVideo(true);
            }
        }
    }

    /**
     * Ses çıkış aygıtını değiştir
     */
    async setAudioOutputDevice(deviceId: string): Promise<void> {
        // HTMLAudioElement ile çıkış aygıtını değiştir
        if (this.room) {
            this.room.remoteParticipants.forEach((participant) => {
                participant.audioTrackPublications.forEach((publication) => {
                    if (publication.track && publication.track instanceof MediaStreamTrack) {
                        const audioElement = new Audio();
                        audioElement.srcObject = new MediaStream([publication.track]);
                        // @ts-ignore - setSinkId experimental API
                        if (audioElement.setSinkId) {
                            audioElement.setSinkId(deviceId);
                        }
                    }
                });
            });
        }
    }

    /**
     * Room event listener'larını ayarla
     */
    private setupRoomListeners(room: Room): void {
        const devLog = (...args: unknown[]) => logger.log(...args);
        room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
            devLog('Katılımcı bağlandı:', participant.identity);
            if (this.onParticipantConnected) {
                this.onParticipantConnected(participant);
            }
        });

        room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
            devLog('Katılımcı ayrıldı:', participant.identity);
            this.remoteAudioElements.forEach((el, key) => {
                if (key.startsWith(`${participant.identity}:`)) {
                    el.remove();
                    this.remoteAudioElements.delete(key);
                }
            });
            if (this.onParticipantDisconnected) {
                this.onParticipantDisconnected(participant);
            }
        });

        room.on(RoomEvent.TrackSubscribed, (track: Track, publication: TrackPublication, participant: RemoteParticipant | LocalParticipant) => {
            devLog('Track abone olundu:', track.kind, participant.identity);
            // Uzak mikrofon/yayın sesi: audio track'ı bir element'e bağla ki karşı taraf duyabilsin
            if (track.kind === 'audio' && participant instanceof RemoteParticipant) {
                const key = `${participant.identity}:${publication.source}`;
                if (!this.remoteAudioElements.has(key)) {
                    const el = document.createElement('audio');
                    el.autoplay = true;
                    el.setAttribute('data-livekit-remote', key);
                    track.attach(el);
                    this.remoteAudioElements.set(key, el);
                    document.body.appendChild(el);
                    const vol = publication.source === Track.Source.ScreenShareAudio ? this.lastStreamVolume : this.lastNormalVolume;
                    participant.setVolume(vol, publication.source as Track.Source);
                }
            }
            if (this.onTrackSubscribed) {
                this.onTrackSubscribed(track, publication, participant);
            }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track: Track, publication: TrackPublication, participant: RemoteParticipant | LocalParticipant) => {
            devLog('Track abonelik iptal edildi:', track.kind, participant.identity);
            if (track.kind === 'audio' && participant instanceof RemoteParticipant) {
                const key = `${participant.identity}:${publication.source}`;
                const el = this.remoteAudioElements.get(key);
                if (el) {
                    track.detach(el);
                    el.remove();
                    this.remoteAudioElements.delete(key);
                }
            }
            if (this.onTrackUnsubscribed) {
                this.onTrackUnsubscribed(track, publication, participant);
            }
        });

        room.on(RoomEvent.LocalTrackPublished, (publication: TrackPublication, participant: LocalParticipant) => {
            devLog('Local track yayınlandı:', publication.kind);
            if (this.onLocalTrackPublished) {
                this.onLocalTrackPublished(publication, participant);
            }
        });
    }

    /**
     * Callback'leri ayarla
     */
    setOnParticipantConnected(callback: (participant: RemoteParticipant) => void): void {
        this.onParticipantConnected = callback;
    }

    setOnParticipantDisconnected(callback: (participant: RemoteParticipant) => void): void {
        this.onParticipantDisconnected = callback;
    }

    setOnTrackSubscribed(callback: (track: Track, publication: TrackPublication, participant: RemoteParticipant | LocalParticipant) => void): void {
        this.onTrackSubscribed = callback;
    }

    setOnTrackUnsubscribed(callback: (track: Track, publication: TrackPublication, participant: RemoteParticipant | LocalParticipant) => void): void {
        this.onTrackUnsubscribed = callback;
    }

    setOnLocalTrackPublished(callback: (publication: TrackPublication, participant: LocalParticipant) => void): void {
        this.onLocalTrackPublished = callback;
    }

    /**
     * Mevcut odayı al
     */
    getRoom(): Room | null {
        return this.room;
    }

    /**
     * Local stream'i al
     */
    getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    /**
     * Temizlik
     */
    async cleanup(): Promise<void> {
        await this.leaveRoom();
    }
}

export const livekitService = new LiveKitService();

