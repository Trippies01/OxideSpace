import React from 'react';
import { Mic, MicOff, User } from 'lucide-react';
import { LivekitVideo } from '../ui/LivekitVideo';
import type { Track } from 'livekit-client';

export interface VideoCardParticipant {
  id: string;
  name: string;
  avatar?: string;
  muted?: boolean;
  isSpeaking?: boolean;
}

export interface VideoCardProps {
  participant: VideoCardParticipant;
  /** Optional LiveKit video track (camera or screen) */
  track?: Track | null;
  trackMuted?: boolean;
  /** If true, render as screen share (object-contain, no mute overlay on video) */
  isScreenShare?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  isActive?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  participant,
  track,
  trackMuted = false,
  isScreenShare = false,
  className = '',
  style,
  onClick,
  isActive = false,
}) => {
  const hasVideo = track && track.mediaStreamTrack;
  const avatarUrl = participant.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${participant.id}`;

  return (
    <div
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`
        relative w-full h-full min-h-0 rounded-xl overflow-hidden bg-[#2b2d31] border border-white/10
        flex items-center justify-center
        ${onClick ? 'cursor-pointer hover:border-white/20 transition-colors' : ''}
        ${isActive ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-[#0e0e12]' : ''}
        ${className}
      `}
      style={style}
    >
      {hasVideo ? (
        <>
          <LivekitVideo
            track={track}
            muted={isScreenShare ? false : trackMuted}
            className={isScreenShare ? 'w-full h-full object-contain' : 'w-full h-full object-cover'}
          />
          {!isScreenShare && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
          )}
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#1e1f22] text-zinc-400">
          <img
            src={avatarUrl}
            alt=""
            className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-white/10"
          />
          <span className="mt-2 text-xs font-medium text-zinc-500 truncate max-w-full px-2">
            {participant.name}
          </span>
        </div>
      )}

      {/* Bottom bar: name + mute */}
      <div className="absolute bottom-0 left-0 right-0 h-8 md:h-9 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between px-2 gap-2">
        <span className="text-xs font-medium text-white truncate flex-1 min-w-0">
          {participant.name}
        </span>
        <span
          className={`flex-shrink-0 p-1 rounded ${participant.muted ? 'bg-red-500/80 text-white' : 'bg-white/20 text-white/90'}`}
          title={participant.muted ? 'Susturuldu' : 'Açık'}
        >
          {participant.muted ? <MicOff size={12} /> : <Mic size={12} />}
        </span>
      </div>

      {participant.isSpeaking && (
        <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse border-2 border-[#0e0e12]" />
      )}
    </div>
  );
};
