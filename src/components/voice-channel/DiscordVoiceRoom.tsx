import React from 'react';
import { Track } from 'livekit-client';
import { ScreenShare, MicOff, Volume2, VolumeX, Maximize, MoreVertical } from 'lucide-react';
import { LivekitVideo } from '../ui/LivekitVideo';
import VoiceControlBar from './VoiceControlBar';

// ---------------------------------------------------------------------------
// Types (align with existing VoiceChannelView)
// ---------------------------------------------------------------------------

export interface DiscordParticipant {
  id: string;
  name: string;
  seed: string;
  talking: boolean;
  muted: boolean;
  /** When true, show Headphones icon (Discord "deafened") */
  deafened?: boolean;
  camera?: boolean;
  screen?: boolean;
  avatar?: string;
}

export type VideoTrackEntry = { track: Track; source: string; muted: boolean };

export interface DiscordVoiceRoomProps {
  participants: DiscordParticipant[];
  videoTracks?: Map<string, VideoTrackEntry>;
  /** When true, any participant is screen sharing → use Focus Mode */
  isScreenShareEnabled: boolean;
  /** Pass LiveKit room so VoiceControlBar can use useRoomContext/useLocalParticipant (e.g. livekitService.getRoom()) */
  room?: import('livekit-client').Room | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// ParticipantTile — Discord-style card (speaking border, name tag, status, menu)
// ---------------------------------------------------------------------------

export interface ParticipantTileProps {
  participant: DiscordParticipant;
  cameraTrack?: Track | null;
  screenTrack?: Track | null;
  cameraMuted?: boolean;
  screenMuted?: boolean;
  /** Compact mode for Focus sidebar */
  compact?: boolean;
  /** Optional: called when 3-dot menu is clicked */
  onMenuClick?: (participant: DiscordParticipant, e: React.MouseEvent) => void;
}

export function ParticipantTile({
  participant,
  cameraTrack,
  screenTrack,
  cameraMuted = false,
  screenMuted = false,
  compact = false,
  onMenuClick,
}: ParticipantTileProps) {
  const hasScreen = (participant.screen && screenTrack) ?? false;
  const hasCamera = (participant.camera && cameraTrack) ?? false;
  const hasVideo = hasScreen || hasCamera;
  const avatarUrl = participant.avatar ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${participant.seed}`;

  /** Green border when user is speaking and not muted (Discord-style) */
  const isSpeaking = participant.talking && !participant.muted;

  return (
    <div
      className={`
        relative w-full rounded-lg overflow-hidden
        flex items-center justify-center
        bg-[#2b2d31]
        border-2 transition-colors duration-200
        ${isSpeaking ? 'border-green-500 shadow-[0_0_0_1px_rgba(34,197,94,0.5)]' : 'border-[#1e1f22]'}
        ${compact ? 'aspect-video min-h-[120px]' : 'aspect-video'}
        group
      `}
    >
      {/* Content: screen share | camera | avatar */}
      {hasScreen ? (
        <>
          <LivekitVideo track={screenTrack!} muted={false} className="absolute inset-0 w-full h-full object-contain" />
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <ScreenShare size={10} /> YAYINDA
            </span>
          </div>
        </>
      ) : hasCamera ? (
        <>
          <LivekitVideo
            track={cameraTrack!}
            muted={cameraMuted}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1e1f22]">
          <img
            src={avatarUrl}
            alt={participant.name}
            className={`rounded-full object-cover border-2 border-[#2b2d31] flex-shrink-0 ${compact ? 'w-16 h-16' : 'w-24 h-24 md:w-28 md:h-28'}`}
          />
        </div>
      )}

      {/* Name tag — bottom-left, Discord look (dark semi-transparent, white text) */}
      <div className="absolute bottom-2 left-2 right-2 z-10 min-w-0">
        <span className="inline-block px-2 py-1 rounded bg-black/50 text-white text-xs font-medium truncate max-w-full backdrop-blur-sm">
          {participant.name}
        </span>
      </div>

      {/* Status icons — top-right (muted/deafen when not in name row) */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        {hasScreen ? null : (
          <>
            {participant.muted && (
              <span className="p-1.5 rounded bg-black/50" title="Susturuldu">
                <MicOff size={14} className="text-red-400" />
              </span>
            )}
            {participant.deafened && !participant.muted && (
              <span className="p-1.5 rounded bg-black/50" title="Ses kapalı">
                <VolumeX size={14} className="text-gray-400" />
              </span>
            )}
          </>
        )}
        {/* 3-dot menu — visible on hover */}
        {onMenuClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick(participant, e);
            }}
            className="p-1.5 rounded bg-black/50 text-gray-300 hover:bg-black/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="Seçenekler"
          >
            <MoreVertical size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GridLayout — default view when no one is screen sharing
// ---------------------------------------------------------------------------

export interface GridLayoutProps {
  participants: DiscordParticipant[];
  videoTracks: Map<string, VideoTrackEntry> | undefined;
  getTracks: (id: string) => { cameraTrack: Track | null; screenTrack: Track | null; cameraMuted: boolean; screenMuted: boolean };
}

export function GridLayout({ participants, videoTracks, getTracks }: GridLayoutProps) {
  if (participants.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
        <Volume2 size={48} className="mb-4 opacity-50" />
        <p className="text-sm">Henüz kimse yok.</p>
      </div>
    );
  }

  const n = participants.length;
  const cols = n <= 1 ? 1 : n <= 4 ? 2 : n <= 9 ? 3 : 4;

  /* Discord overlay: 674×372px, 8px margin — same for default/camera/screen */
  const overlayMax = 'max-w-[674px] max-h-[372px]';
  const overlayMargin = 'm-2'; /* 8px */

  return (
    <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden p-4">
      <div
        className="grid gap-2 w-full h-full max-w-full max-h-full content-center justify-items-center min-w-0"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridAutoRows: 'minmax(0, 1fr)',
        }}
      >
        {participants.map((p) => (
          <div key={p.id} className={`min-w-0 min-h-0 w-full h-full aspect-video flex items-center justify-center ${overlayMax} ${overlayMargin}`}>
            <ParticipantTile
              participant={p}
              compact={false}
              {...getTracks(p.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FocusLayout — when someone is screen sharing: main stage + sidebar
// ---------------------------------------------------------------------------

export interface FocusLayoutProps {
  participants: DiscordParticipant[];
  videoTracks: Map<string, VideoTrackEntry> | undefined;
  getTracks: (id: string) => { cameraTrack: Track | null; screenTrack: Track | null; cameraMuted: boolean; screenMuted: boolean };
  /** Participant who is screen sharing (used for main stage) */
  screenSharer: DiscordParticipant | null;
  onFullscreen?: () => void;
}

export function FocusLayout({
  participants,
  videoTracks,
  getTracks,
  screenSharer,
  onFullscreen,
}: FocusLayoutProps) {
  const screenTrack = screenSharer ? getTracks(screenSharer.id).screenTrack : null;
  const sidebarParticipants = participants.filter((p) => p.id !== screenSharer?.id);

  return (
    <div className="flex-1 flex min-h-0 w-full gap-3 p-4">
      {/* Main Stage — Discord overlay size 674×372px, 8px margin */}
      <div className="flex-[3] min-w-0 min-h-0 flex flex-col items-center justify-center rounded-xl overflow-hidden bg-[#2b2d31] border border-white/10">
        <div className="relative w-[674px] max-w-full h-[372px] max-h-full min-h-0 flex items-center justify-center bg-black rounded-lg m-2">
          {screenTrack ? (
            <LivekitVideo
              track={screenTrack}
              muted={false}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500">
              <ScreenShare size={48} className="opacity-50" />
              <span className="text-sm mt-2">Ekran yükleniyor...</span>
            </div>
          )}
          <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <ScreenShare size={12} /> YAYINDA
            </span>
            {onFullscreen && (
              <button
                type="button"
                onClick={onFullscreen}
                className="p-2 rounded bg-black/60 hover:bg-black/80 text-white"
                title="Tam ekran"
              >
                <Maximize size={18} />
              </button>
            )}
          </div>
          {screenSharer && (
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-sm font-medium truncate">
              {screenSharer.name}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar — ~280px, scrollable participant tiles, thin dark scrollbar */}
      <div className="discord-voice-sidebar-scroll w-[280px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto rounded-xl border border-white/10 bg-[#2b2d31] py-2 pr-2">
        {sidebarParticipants.map((p) => (
          <div key={p.id} className="min-h-[120px] flex-shrink-0">
            <ParticipantTile
              participant={p}
              compact
              {...getTracks(p.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DiscordVoiceRoom — main container
// ---------------------------------------------------------------------------

export default function DiscordVoiceRoom({
  participants,
  videoTracks,
  isScreenShareEnabled,
  room = null,
  className = '',
}: DiscordVoiceRoomProps) {
  const getTracks = (id: string) => getTracksForParticipant(videoTracks, id);

  const screenSharer =
    participants.find((p) => getTracks(p.id).screenTrack || p.screen) ?? null;

  return (
    <div className={`flex flex-col h-full w-full min-h-0 bg-[#313338] ${className}`}>
      <div className="flex-1 min-h-0 overflow-hidden">
        {isScreenShareEnabled && screenSharer ? (
          <FocusLayout
            participants={participants}
            videoTracks={videoTracks}
            getTracks={getTracks}
            screenSharer={screenSharer}
          />
        ) : (
          <GridLayout
            participants={participants}
            videoTracks={videoTracks}
            getTracks={getTracks}
          />
        )}
      </div>
      <VoiceControlBar room={room} />
    </div>
  );
}
