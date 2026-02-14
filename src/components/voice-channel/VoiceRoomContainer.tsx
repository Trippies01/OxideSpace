import React from 'react';
import { Volume2, MessageCircle } from 'lucide-react';
import { ParticipantGrid } from './ParticipantGrid';
import { ActivityTile } from './ActivityTile';
import { MediaControlBar } from './MediaControlBar';
import { VoiceVideoLayout, type VideoTrackEntry } from './VoiceVideoLayout';
import type { MockParticipant } from './mockData';

export interface VoiceRoomContainerProps {
  channelName?: string;
  participants?: MockParticipant[];
  onInvite?: () => void;
  onActivity?: () => void;
  /** Open text chat (e.g. switch to first text channel) */
  onOpenTextChat?: () => void;
  /** Control bar state (can be lifted to parent later) */
  micOn?: boolean;
  videoOn?: boolean;
  deafened?: boolean;
  screenShareOn?: boolean;
  onMicToggle?: () => void;
  onVideoToggle?: () => void;
  onDeafenToggle?: () => void;
  onScreenShareToggle?: () => void;
  onDisconnect?: () => void;
  /** Discord-style video layout: when set, show main video + thumbnail strip */
  videoTracks?: Map<string, VideoTrackEntry>;
  focusedKey?: string | null;
  onFocusKey?: (key: string | null) => void;
  pinnedKey?: string | null;
  onPinnedKey?: (key: string | null) => void;
  videoParticipantNames?: Map<string, string>;
  videoSpeakingIds?: Set<string>;
  onVideoFullscreen?: (enabled: boolean) => void;
  isVideoFullscreen?: boolean;
}

/**
 * Main wrapper — black/dark background, channel name overlay top-left.
 * Assembles ParticipantGrid, ActivityTile, MediaControlBar.
 */
export const VoiceRoomContainer: React.FC<VoiceRoomContainerProps> = ({
  channelName = 'Vip#2',
  participants = [],
  onInvite,
  onActivity,
  onOpenTextChat,
  micOn = true,
  videoOn = false,
  deafened = false,
  screenShareOn = false,
  onMicToggle = () => {},
  onVideoToggle = () => {},
  onDeafenToggle = () => {},
  onScreenShareToggle = () => {},
  onDisconnect = () => {},
  videoTracks,
  focusedKey = null,
  onFocusKey = () => {},
  pinnedKey = null,
  onPinnedKey = () => {},
  videoParticipantNames = new Map(),
  videoSpeakingIds = new Set(),
  onVideoFullscreen,
  isVideoFullscreen = false,
}) => {
  const hasVideo = videoTracks && videoTracks.size > 0;

  return (
    <div className="min-h-screen bg-discord-bg-app text-discord-text-primary flex flex-col">
      {/* Channel name overlay — top left; optional text chat button */}
      <div className="flex-shrink-0 h-12 px-4 flex items-center justify-between border-b border-white/5 bg-discord-surface">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-discord-success flex items-center justify-center">
            <Volume2 size={16} className="text-white" />
          </div>
          <span className="font-semibold text-discord-text-primary text-sm">
            🔊 {channelName}
          </span>
        </div>
        {onOpenTextChat && (
          <button
            type="button"
            onClick={onOpenTextChat}
            className="p-2 rounded-lg text-discord-text-secondary hover:text-discord-text-primary hover:bg-discord-surface-tertiary transition-colors"
            title="Yazı kanalına git"
          >
            <MessageCircle size={20} />
          </button>
        )}
      </div>

      {/* Main content — Discord-style video layout when we have tracks, else avatar grid */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto">
        {hasVideo ? (
          <VoiceVideoLayout
            videoTracks={videoTracks}
            focusedKey={focusedKey}
            onFocusKey={onFocusKey}
            pinnedKey={pinnedKey}
            onPinnedKey={onPinnedKey}
            participantNames={videoParticipantNames}
            speakingIds={videoSpeakingIds}
            onFullscreen={onVideoFullscreen}
            isFullscreen={isVideoFullscreen}
            className="min-h-0"
          />
        ) : (
          <>
            <ParticipantGrid participants={participants} className="flex-1 min-h-0" />
            <div className="flex-shrink-0 p-4 pt-0">
              <ActivityTile onInvite={onInvite} onActivity={onActivity} />
            </div>
          </>
        )}
      </div>

      {/* Bottom control bar — fixed, with padding so content isn't hidden */}
      <div className="h-24 flex-shrink-0" aria-hidden />
      <MediaControlBar
        micOn={micOn}
        videoOn={videoOn}
        deafened={deafened}
        screenShareOn={screenShareOn}
        onMicToggle={onMicToggle}
        onVideoToggle={onVideoToggle}
        onDeafenToggle={onDeafenToggle}
        onScreenShareToggle={onScreenShareToggle}
        onDisconnect={onDisconnect}
      />
    </div>
  );
};
