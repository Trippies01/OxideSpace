import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Monitor,
  Phone,
} from 'lucide-react';

export interface MediaControlBarProps {
  micOn: boolean;
  videoOn: boolean;
  deafened: boolean;
  screenShareOn: boolean;
  onMicToggle: () => void;
  onVideoToggle: () => void;
  onDeafenToggle: () => void;
  onScreenShareToggle: () => void;
  onDisconnect: () => void;
  className?: string;
}

/**
 * Bottom floating control bar — Mic, Deafen, Camera, Screen Share, Red Disconnect.
 */
export const MediaControlBar: React.FC<MediaControlBarProps> = ({
  micOn,
  videoOn,
  deafened,
  screenShareOn,
  onMicToggle,
  onVideoToggle,
  onDeafenToggle,
  onScreenShareToggle,
  onDisconnect,
  className = '',
}) => {
  const iconClass = 'p-3 rounded-full transition-colors text-discord-text-secondary hover:text-discord-text-primary hover:bg-white/10';
  const iconClassActive = 'text-discord-text-primary bg-white/10';
  const iconClassDanger = 'text-discord-destructive hover:bg-discord-destructive/20';

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-30
        flex items-center gap-1 md:gap-2
        bg-discord-control-bar border border-white/10
        px-2 py-2 rounded-full shadow-xl
        ${className}
      `}
    >
      <button
        type="button"
        onClick={onMicToggle}
        disabled={deafened}
        title={micOn ? 'Mikrofonu kapat' : 'Mikrofonu aç'}
        className={`${iconClass} ${micOn ? iconClassActive : iconClassDanger} ${deafened ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {micOn ? <Mic size={22} /> : <MicOff size={22} />}
      </button>

      <button
        type="button"
        onClick={onDeafenToggle}
        title={deafened ? 'Sesi aç' : 'Sesi kapat'}
        className={`${iconClass} ${deafened ? iconClassDanger : iconClassActive}`}
      >
        {deafened ? <VolumeX size={22} /> : <Volume2 size={22} />}
      </button>

      <button
        type="button"
        onClick={onVideoToggle}
        title={videoOn ? 'Kamerayı kapat' : 'Kamerayı aç'}
        className={`${iconClass} ${videoOn ? iconClassActive : ''}`}
      >
        {videoOn ? <Video size={22} /> : <VideoOff size={22} />}
      </button>

      <button
        type="button"
        onClick={onScreenShareToggle}
        title={screenShareOn ? 'Ekran paylaşımını durdur' : 'Ekran paylaş'}
        className={`${iconClass} ${screenShareOn ? 'text-discord-success' : ''}`}
      >
        <Monitor size={22} />
      </button>

      {/* Red Disconnect — visually separated */}
      <div className="w-px h-8 bg-white/10 mx-1" aria-hidden />
      <button
        type="button"
        onClick={onDisconnect}
        title="Ses kanalından ayrıl"
        className="p-3.5 rounded-full bg-discord-destructive hover:bg-discord-destructive/90 text-white transition-colors"
      >
        <Phone size={22} className="rotate-[135deg]" fill="currentColor" />
      </button>
    </div>
  );
};
