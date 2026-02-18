import React, { useState, useEffect } from 'react';
import { Track } from 'livekit-client';
import {
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Volume2,
  ScreenShare,
  Maximize,
  Minimize,
  LayoutGrid,
  Maximize2,
  Minimize2,
  MessageSquare,
  Settings,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Send,
  X,
} from 'lucide-react';
import { LivekitVideo } from '../ui/LivekitVideo';
import { VoiceSesContextMenu } from './VoiceSesContextMenu';

export interface VoiceChannelParticipant {
  id: string;
  name: string;
  seed: string;
  talking: boolean;
  muted: boolean;
  camera?: boolean;
  screen?: boolean;
  ping?: number;
  avatar?: string;
}

export type VideoTrackEntry = { track: Track; source: string; muted: boolean };

export interface VoiceChannelViewProps {
  channelName: string;
  channelBadge?: string;
  participants: VoiceChannelParticipant[];
  /** LiveKit video tracks: key = "participantId:Track.Source.Camera" | "participantId:Track.Source.ScreenShare" */
  videoTracks?: Map<string, VideoTrackEntry>;
  isMuted: boolean;
  isDeafened: boolean;
  isVideoOn: boolean;
  isScreenShareOn: boolean;
  onMicToggle: () => void;
  onDeafenToggle: () => void;
  onVideoToggle: () => void;
  onScreenShareToggle: () => void;
  onDisconnect: () => void;
  onOpenTextChat?: () => void;
  onSettingsClick?: () => void;
  /** Discord tarzı sağ tık ses menüsü */
  streamVolume?: number;
  normalVolume?: number;
  onStreamVolumeChange?: (value: number) => void;
  onNormalVolumeChange?: (value: number) => void;
}

function PingIcon({ ms }: { ms: number }) {
  let color = 'text-green-500';
  let Icon = SignalHigh;
  if (ms > 150) {
    color = 'text-red-500';
    Icon = SignalLow;
  } else if (ms > 80) {
    color = 'text-yellow-500';
    Icon = SignalMedium;
  }
  return (
    <div className="group/ping relative flex items-center justify-center cursor-help" title={`${ms} ms`}>
      <Icon size={16} className={color} />
    </div>
  );
}

interface UserTileProps {
  user: VoiceChannelParticipant;
  isFocused?: boolean;
  isSmall?: boolean;
  focusedId: string | null;
  onFocusToggle: (id: string | null) => void;
  cameraTrack?: Track | null;
  screenTrack?: Track | null;
  cameraMuted?: boolean;
  screenMuted?: boolean;
}

function UserTile({ user, isFocused = false, isSmall = false, focusedId, onFocusToggle, cameraTrack, screenTrack, cameraMuted, screenMuted }: UserTileProps) {
  const hasScreenTrack = user.screen && screenTrack;
  const hasCameraTrack = user.camera && cameraTrack;

  return (
    <div
      className={`
        relative w-full h-full bg-black rounded-lg flex items-center justify-center shadow-lg group border border-[#1e1f22] overflow-hidden transition-all duration-300
        ${isSmall ? 'aspect-video' : 'aspect-video'}
        ${isFocused ? 'ring-1 ring-white/10' : ''}
      `}
    >
      {hasScreenTrack ? (
        <div className="absolute inset-0 bg-black">
          <LivekitVideo track={screenTrack} muted={false} className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md animate-pulse z-20">
            <ScreenShare size={10} /> YAYINDA
          </div>
          {/* Discord gibi: odakta değilse "Yayını izle" — tıklanana kadar ana alanda oynatılmaz */}
          {!isFocused && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFocusToggle(user.id); }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 hover:bg-black/50 transition-colors"
            >
              <span className="px-4 py-2 rounded-lg bg-[#23a559] hover:bg-[#1f9651] text-white font-medium text-sm flex items-center gap-2 shadow-lg">
                <Maximize2 size={18} /> Yayını izle
              </span>
            </button>
          )}
        </div>
      ) : hasCameraTrack ? (
        <div className="absolute inset-0 bg-black">
          <LivekitVideo track={cameraTrack} muted={cameraMuted} className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
        </div>
      ) : user.screen ? (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <p className="text-gray-500 text-sm z-10">Ekran yükleniyor...</p>
          <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md animate-pulse z-20">
            <ScreenShare size={10} /> YAYINDA
          </div>
        </div>
      ) : user.camera ? (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <img
            src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.seed}`}
            alt="Kamera"
            className="w-full h-full object-contain opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div
              className={`
                relative rounded-full overflow-hidden border-[4px] md:border-[6px] shadow-2xl transition-all duration-300 bg-[#1e1f22]
                ${isSmall ? 'w-16 h-16 border-[3px]' : 'w-24 h-24 md:w-32 md:h-32 group-hover:scale-105'}
                ${user.talking && !user.muted ? 'border-[#23a559]' : 'border-transparent'}
                ${user.muted ? 'border-red-500' : ''}
              `}
            >
              <img
                src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.seed}`}
                alt={user.name}
                className="w-full h-full object-cover"
              />
              {user.muted && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                  <MicOff size={isSmall ? 16 : 32} className="text-red-500 drop-shadow-md" />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className={`absolute left-3 z-20 flex items-center gap-2 ${isSmall ? 'bottom-2' : 'bottom-3 md:bottom-4 md:left-4'}`}>
        <div className="bg-black/60 backdrop-blur-md px-2 py-1 md:px-3 md:py-1.5 rounded-[4px] flex items-center gap-2 border border-white/5 shadow-sm">
          <span className={`font-semibold text-white tracking-wide drop-shadow-sm ${isSmall ? 'text-xs' : 'text-sm md:text-base'}`}>
            {user.name}
          </span>
          {!isSmall && (
            <>
              {user.muted && <MicOff size={14} className="text-red-400" />}
              {user.screen && <Monitor size={14} className="text-gray-300" />}
            </>
          )}
        </div>
        {!isSmall && user.ping != null && user.ping > 0 && (
          <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-[4px] border border-white/5 shadow-sm">
            <PingIcon ms={user.ping} />
          </div>
        )}
      </div>

      <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFocusToggle(focusedId === user.id ? null : user.id);
          }}
          className="p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-md backdrop-blur-sm transition-colors"
        >
          {focusedId === user.id ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {user.talking && !user.muted && !user.camera && !user.screen && (
        <div className="absolute inset-0 rounded-xl border-2 border-[#23a559] opacity-100 transition-opacity pointer-events-none shadow-[inset_0_0_20px_rgba(35,165,89,0.2)] animate-pulse" />
      )}
      {user.talking && !user.muted && (user.camera || user.screen) && (
        <div className="absolute inset-0 rounded-xl border-4 border-[#23a559] z-30 pointer-events-none" />
      )}
    </div>
  );
}

interface ControlBtnProps {
  icon: React.ReactNode;
  active: boolean;
  danger?: boolean;
  success?: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  tooltip: string;
  className?: string;
}

function ControlBtn({ icon, active, danger = false, success = false, onClick, onContextMenu, tooltip, className = '' }: ControlBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`
        group relative p-3 rounded-[8px] transition-all duration-200 flex items-center justify-center active:scale-95
        ${danger
          ? 'bg-transparent text-[#f2f3f5] hover:bg-[#da373c] hover:text-white'
          : success
            ? 'bg-[#23a559] text-white hover:bg-[#1f9651]'
            : active
              ? 'bg-transparent text-[#f2f3f5] hover:bg-[#35373c]'
              : 'bg-[#f2f3f5] text-[#313338] hover:bg-white'}
        ${className}
      `}
    >
      <div className="relative z-10">{icon}</div>
      {danger && <div className="absolute w-[120%] h-0.5 bg-current rotate-45 rounded-full opacity-60" />}
      <span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-black/90 text-[#f2f3f5] text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-medium z-50 shadow-md border border-white/10">
        {tooltip}
      </span>
      {!danger && !success && active && (
        <div className="absolute bottom-1 right-1 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-current opacity-60" />
      )}
    </button>
  );
}

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  time: string;
  avatar: string;
}

function getTracksForParticipant(
  videoTracks: Map<string, VideoTrackEntry> | undefined,
  participantId: string
): { cameraTrack: Track | null; screenTrack: Track | null; cameraMuted: boolean; screenMuted: boolean } {
  if (!videoTracks) return { cameraTrack: null, screenTrack: null, cameraMuted: false, screenMuted: false };
  const cameraEntry = videoTracks.get(`${participantId}:${Track.Source.Camera}`);
  const screenEntry = videoTracks.get(`${participantId}:${Track.Source.ScreenShare}`);
  return {
    cameraTrack: cameraEntry?.track ?? null,
    screenTrack: screenEntry?.track ?? null,
    cameraMuted: cameraEntry?.muted ?? false,
    screenMuted: screenEntry?.muted ?? false,
  };
}

/** Map'teki ilk ekran paylaşımı track'ini bul (identity farklı olsa bile) */
function getAnyScreenShareTrack(videoTracks: Map<string, VideoTrackEntry> | undefined): Track | null {
  if (!videoTracks || videoTracks.size === 0) return null;
  for (const [, entry] of videoTracks) {
    if (entry.source === Track.Source.ScreenShare && entry.track) return entry.track;
  }
  return null;
}

export default function VoiceChannelView({
  channelName,
  channelBadge = 'Vip#2',
  participants,
  videoTracks,
  isMuted,
  isDeafened,
  isVideoOn,
  isScreenShareOn,
  onMicToggle,
  onDeafenToggle,
  onVideoToggle,
  onScreenShareToggle,
  onDisconnect,
  onOpenTextChat,
  onSettingsClick,
  streamVolume = 100,
  normalVolume = 100,
  onStreamVolumeChange,
  onNormalVolumeChange,
}: VoiceChannelViewProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sesMenuOpen, setSesMenuOpen] = useState(false);
  const [sesMenuPosition, setSesMenuPosition] = useState({ x: 0, y: 0 });
  const stageRef = React.useRef<HTMLDivElement>(null);
  const controlBarRef = React.useRef<HTMLDivElement>(null);
  const voiceAreaRef = React.useRef<HTMLDivElement>(null);

  const isFullScreenRef = React.useRef(false);
  useEffect(() => {
    const handleFullScreenChange = () => {
      const el = document.fullscreenElement ?? (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      const stageEl = stageRef.current;
      const nowFull = !!el && !!stageEl && el === stageEl;
      if (isFullScreenRef.current !== nowFull) {
        isFullScreenRef.current = nowFull;
        setIsFullScreen(nowFull);
      }
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
    };
  }, []);

  useEffect(() => {
    if (!onStreamVolumeChange || !onNormalVolumeChange) return;
    const handleContextMenu = (e: MouseEvent) => {
      const area = voiceAreaRef.current;
      if (area && area.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
        setSesMenuPosition({ x: e.clientX, y: e.clientY });
        setSesMenuOpen(true);
      }
    };
    document.addEventListener('contextmenu', handleContextMenu, true);
    return () => document.removeEventListener('contextmenu', handleContextMenu, true);
  }, [onStreamVolumeChange, onNormalVolumeChange]);

  const toggleStageFullScreen = () => {
    const stageEl = stageRef.current;
    if (!stageEl) return;
    const fsEl = document.fullscreenElement ?? (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement;
    if (!fsEl) {
      const htmlEl = stageEl as HTMLElement;
      if (htmlEl.requestFullscreen) {
        htmlEl.requestFullscreen({ navigationUI: 'hide' }).catch((err: unknown) => console.error('Tam ekran hatası:', err));
      } else if ((htmlEl as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
        (htmlEl as HTMLElement & { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
      }
    } else {
      const exit = document.exitFullscreen ?? (document as Document & { webkitExitFullscreen?: () => void }).webkitExitFullscreen;
      if (exit) exit.call(document);
    }
  };

  const handleScreenShareToggle = () => {
    const next = !isScreenShareOn;
    onScreenShareToggle();
    if (next) {
      setIsChatOpen(false);
      /* Discord gibi: yayını otomatik ana alanda açma; kullanıcı "Yayını izle" deyince açılır */
    } else if (focusedId === participants[0]?.id) {
      setFocusedId(null);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: 'Sen',
        text: newMessage.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: 'me',
      },
    ]);
    setNewMessage('');
  };

  const focusedUser = participants.find((p) => p.id === focusedId);

  return (
    <div className="flex h-full w-full min-h-0 bg-[#1e1f22] text-gray-100 font-sans overflow-hidden">
      {/* === SOL / ORTA BÖLÜM (VİDEO ALANI) === */}
      <div ref={voiceAreaRef} className="flex-1 flex flex-col relative bg-black transition-all duration-300 min-w-0">
        {/* Kanal Bilgisi (Discord'da Izgara/Konuşmacı toggle yok) */}
        <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1e1f22]/90 hover:bg-[#1e1f22] transition-colors select-none backdrop-blur-sm border border-white/5 shadow-lg">
            <Volume2 size={16} className="text-gray-400" />
            <span className="font-bold text-sm text-gray-200">{channelName}</span>
            <div className="w-px h-3 bg-gray-600 mx-1" />
            <span className="text-xs text-green-500 font-mono">{channelBadge}</span>
          </div>
        </div>

        {/* --- ANA SAHNE (tam ekran yapılabilir) --- */}
        <div
          ref={stageRef}
          className="video-stage relative flex-1 w-full h-full min-h-0 overflow-hidden p-4 md:p-6 flex flex-col bg-black"
          data-fullscreen={isFullScreen ? 'true' : undefined}
        >
          <div className="video-stage-inner flex-1 flex flex-col min-h-0 w-full h-full relative">
          {/* Fullscreen: only screen track + exit button */}
          {isFullScreen ? (
            (() => {
              const who = focusedId && focusedUser ? getTracksForParticipant(videoTracks, focusedUser.id) : null;
              let screenTrack = who?.screenTrack;
              if (!screenTrack && participants.length > 0) {
                const sharer = participants.find((p) => getTracksForParticipant(videoTracks, p.id).screenTrack) ?? participants.find((p) => p.screen);
                screenTrack = sharer ? getTracksForParticipant(videoTracks, sharer.id).screenTrack ?? null : null;
              }
              return (
                <>
                  <div className="absolute inset-0 w-full h-full bg-black">
                    {screenTrack && <LivekitVideo track={screenTrack} muted={false} className="w-full h-full object-contain" />}
                  </div>
                  <button
                    type="button"
                    onClick={toggleStageFullScreen}
                    className="fixed top-4 right-4 z-[99999] px-4 py-2 rounded-lg bg-black/80 hover:bg-black text-white text-sm font-medium flex items-center gap-2 border border-white/20 shadow-lg"
                  >
                    <Minimize size={18} /> Tam ekrandan çık
                  </button>
                </>
              );
            })()
          ) : (
          <>
          {/* Discord gibi: ana container = kamera (üst), yayın paylaşımı hemen aşağıda, sonra katılımcı grid */}
          {(() => {
            if (participants.length === 0) {
              return (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 h-full">
                  <Volume2 size={48} className="mb-4 opacity-50" />
                  <p className="text-sm">Henüz kimse yok.</p>
                </div>
              );
            }
            const selfId = participants[0]?.id;
            const selfTracks = selfId ? getTracksForParticipant(videoTracks, selfId) : null;
            const someoneScreenSharing = isScreenShareOn || participants.some((p) => getTracksForParticipant(videoTracks, p.id).screenTrack ?? p.screen);
            const screenSharer =
              (focusedId && focusedUser && (getTracksForParticipant(videoTracks, focusedUser.id).screenTrack || focusedUser.screen) ? focusedUser : null)
              ?? participants.find((p) => getTracksForParticipant(videoTracks, p.id).screenTrack)
              ?? participants.find((p) => p.screen)
              ?? (isScreenShareOn && participants[0] ? participants[0] : null);
            const screenSharerTracks = screenSharer ? getTracksForParticipant(videoTracks, screenSharer.id) : null;
            const screenTrackToShow =
              screenSharerTracks?.screenTrack
              ?? (isScreenShareOn ? selfTracks?.screenTrack : null)
              ?? (someoneScreenSharing ? getAnyScreenShareTrack(videoTracks) : null);

            const gridList = participants.filter(
              (p) => (isVideoOn && p.id === selfId ? false : true) && (screenSharer && p.id === screenSharer.id ? false : true)
            );
            const n = Math.max(1, gridList.length);
            const gridCols = n <= 1 ? 1 : n <= 4 ? 2 : n <= 9 ? 3 : 4;

            return (
              <div className="flex flex-1 flex-row gap-2 min-h-0 overflow-hidden w-full">
                {/* Sol: Profil alanı — sadece kamera + grid, Discord gibi sabit; ekran paylaşınca aşağı kaymaz */}
                <div className="flex-1 flex flex-col gap-2 min-w-0 min-h-0 overflow-hidden">
                  {/* 1. Ana container: sadece kamera (profil) */}
                  {isVideoOn && (
                    <div className="w-full aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-black border border-white/10 relative flex items-center justify-center">
                      {selfTracks?.cameraTrack ? (
                        <LivekitVideo track={selfTracks.cameraTrack} muted={selfTracks.cameraMuted} className="w-full h-full object-contain" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-500">
                          <Video size={32} className="opacity-50" />
                          <span className="text-xs mt-2">Kamera</span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* 2. Katılımcılar grid */}
                  {gridList.length > 0 && (
                    <div
                      className="grid gap-2 flex-1 min-w-0 min-h-0 overflow-auto content-start"
                      style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`, gridAutoRows: 'auto' }}
                    >
                      {gridList.map((user) => (
                        <div key={user.id} className="min-w-0 aspect-video rounded-lg overflow-hidden">
                          <UserTile
                            user={user}
                            focusedId={focusedId}
                            onFocusToggle={setFocusedId}
                            {...getTracksForParticipant(videoTracks, user.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Sağ: Ayrı container — sadece ekran paylaşımı; açılınca layout büyümez, yanında sabit panel */}
                {someoneScreenSharing && screenSharer && (
                  <div className="w-[min(420px,45%)] flex-shrink-0 flex flex-col min-h-0 rounded-lg overflow-hidden bg-black border border-white/10">
                    <div className="flex-1 min-h-0 relative flex items-center justify-center aspect-video max-h-full">
                      {screenTrackToShow ? (
                        <LivekitVideo track={screenTrackToShow} muted={false} className="w-full h-full object-contain" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-500">
                          <ScreenShare size={40} className="opacity-50" />
                          <span className="text-sm mt-2">Ekran yükleniyor...</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-2 z-20">
                        <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md animate-pulse">
                          <ScreenShare size={10} /> YAYINDA
                        </div>
                        <button type="button" onClick={toggleStageFullScreen} className="p-2 rounded bg-black/60 hover:bg-black/80 text-white transition-colors" title="Tam ekran">
                          <Maximize size={18} />
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-sm font-medium truncate max-w-full">{screenSharer.name}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          </>
          )}
          </div>
        </div>

        {/* --- ALT KONTROL PANELİ --- */}
        <div className="flex-shrink-0 w-full pb-6 pt-2 px-4 flex justify-center z-50 pointer-events-none">
          <div
            ref={controlBarRef}
            className="pointer-events-auto bg-[#111214] px-4 py-2.5 rounded-[12px] flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)] border border-[#1e1f22]"
          >
            <ControlBtn
              icon={isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              active={!isMuted}
              danger={isMuted}
              onClick={onMicToggle}
              tooltip={isMuted ? 'Sesi Aç' : 'Sustur'}
            />
            <ControlBtn
              icon={<Headphones size={20} />}
              active={!isDeafened}
              onClick={onDeafenToggle}
              tooltip={isDeafened ? 'Sesi Aç' : 'Sağırlaştır (sağ tık: ses ayarları)'}
            />
            <ControlBtn
              icon={isVideoOn ? <VideoOff size={20} /> : <Video size={20} />}
              active={isVideoOn}
              onClick={onVideoToggle}
              tooltip={isVideoOn ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
            />
            <ControlBtn
              icon={isScreenShareOn ? <MonitorOff size={20} /> : <Monitor size={20} />}
              active={isScreenShareOn}
              success={isScreenShareOn}
              onClick={handleScreenShareToggle}
              tooltip={isScreenShareOn ? 'Paylaşımı Durdur' : 'Ekran Paylaş'}
            />
            <div className="w-px h-8 bg-[#3f4147] mx-2" />
            <button
              type="button"
              onClick={onDisconnect}
              className="group relative p-3 rounded-[8px] bg-[#da373c] hover:bg-[#a1282c] text-white transition-all duration-200 flex items-center justify-center shadow-lg active:scale-95"
              title="Bağlantıyı Kes"
            >
              <PhoneOff size={22} />
              <span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Bağlantıyı Kes
              </span>
            </button>
            <div className="w-px h-8 bg-[#3f4147] mx-2" />
            <ControlBtn
              icon={isChatOpen ? <MessageSquare size={20} fill="currentColor" /> : <MessageSquare size={20} />}
              active={isChatOpen}
              onClick={() => setIsChatOpen(!isChatOpen)}
              tooltip="Sohbeti Göster"
              className={isChatOpen ? 'text-white' : ''}
            />
            <ControlBtn icon={<Settings size={20} />} active={false} onClick={onSettingsClick ?? (() => {})} tooltip="Ayarlar" />
            <ControlBtn
              icon={focusedId ? <LayoutGrid size={20} /> : <Maximize2 size={20} />}
              active={false}
              onClick={() => setFocusedId(focusedId ? null : participants[0]?.id ?? null)}
              tooltip={focusedId ? 'Izgara Görünümü' : 'Odaklan'}
            />
            <ControlBtn
              icon={isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
              active={isFullScreen}
              onClick={toggleStageFullScreen}
              tooltip={isFullScreen ? 'Tam Ekrandan Çık' : 'Yayını Tam Ekran Yap'}
            />
          </div>
        </div>
      </div>

      {/* === SAĞ BÖLÜM (SOHBET PANELİ) === */}
      <div
        className={`
          flex flex-col bg-[#2b2d31] border-l border-[#1e1f22] transition-all duration-300 ease-in-out flex-shrink-0
          ${isChatOpen ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full overflow-hidden'}
        `}
      >
        <div className="h-12 border-b border-[#1e1f22] flex items-center justify-between px-4 bg-[#2b2d31] shadow-sm flex-shrink-0">
          <span className="font-semibold text-gray-200 text-sm">Sohbet</span>
          <button type="button" onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Henüz mesaj yok.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex gap-3 group">
                <img
                  src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${msg.avatar}`}
                  alt=""
                  className="w-10 h-10 rounded-full bg-[#1e1f22] mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-gray-100 text-sm">{msg.user}</span>
                    <span className="text-[10px] text-gray-400">{msg.time}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 bg-[#2b2d31] flex-shrink-0 border-t border-[#1e1f22]">
          <form onSubmit={sendMessage} className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-[10px] font-bold">
              +
            </div>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="#genel-sohbet kanalına mesaj gönder"
              className="w-full bg-[#383a40] text-gray-100 text-sm rounded-lg py-2.5 pl-10 pr-10 outline-none focus:ring-0 placeholder-gray-500 border border-transparent focus:border-white/20"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {sesMenuOpen && onStreamVolumeChange && onNormalVolumeChange && (
        <VoiceSesContextMenu
          x={sesMenuPosition.x}
          y={sesMenuPosition.y}
          streamVolume={streamVolume}
          normalVolume={normalVolume}
          onStreamVolumeChange={onStreamVolumeChange}
          onNormalVolumeChange={onNormalVolumeChange}
          onClose={() => setSesMenuOpen(false)}
        />
      )}
    </div>
  );
}
