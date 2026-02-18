import React, { useState } from 'react';
import { Track } from 'livekit-client';
import { RoomContext, useMaybeRoomContext, useLocalParticipant, useTrackToggle } from '@livekit/components-react';
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VoiceControlBarProps {
  /** Optional: pass room when not inside RoomContext (e.g. from livekitService.getRoom()) */
  room?: import('livekit-client').Room | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Inner bar (must be inside RoomContext or receive room via VoiceControlBar)
// ---------------------------------------------------------------------------

function VoiceControlBarInner() {
  const room = useMaybeRoomContext();

  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant(
    room ? { room } : undefined
  );

  const micToggle = useTrackToggle({ source: Track.Source.Microphone, room: room ?? undefined });
  const cameraToggle = useTrackToggle({ source: Track.Source.Camera, room: room ?? undefined });
  const screenShareToggle = useTrackToggle({ source: Track.Source.ScreenShare, room: room ?? undefined });

  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (!room || disconnecting) return;
    setDisconnecting(true);
    try {
      await room.disconnect(true);
    } finally {
      setDisconnecting(false);
    }
  };

  if (!room) {
    return (
      <div className="flex justify-center py-3 px-4 bg-[#1e1f22] rounded-xl">
        <div className="text-gray-500 text-sm">Oda bağlantısı yok</div>
      </div>
    );
  }

  return (
    <div
      className="
        flex items-center justify-center gap-2 py-3 px-4
        bg-[#1e1f22] rounded-xl border border-white/5
        shadow-[0_4px_24px_rgba(0,0,0,0.4)]
      "
    >
      {/* Microphone */}
      <button
        type="button"
        onClick={() => micToggle.toggle()}
        disabled={micToggle.pending}
        title={isMicrophoneEnabled ? 'Sustur' : 'Sesi aç'}
        className={`
          p-3 rounded-full transition-colors
          ${isMicrophoneEnabled ? 'hover:bg-white/10 text-gray-200' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}
        `}
      >
        {isMicrophoneEnabled ? <Mic size={22} /> : <MicOff size={22} className="text-red-400" />}
      </button>

      {/* Camera */}
      <button
        type="button"
        onClick={() => cameraToggle.toggle()}
        disabled={cameraToggle.pending}
        title={isCameraEnabled ? 'Kamerayı kapat' : 'Kamerayı aç'}
        className="p-3 rounded-full text-gray-200 hover:bg-white/10 transition-colors"
      >
        {isCameraEnabled ? <Video size={22} /> : <VideoOff size={22} />}
      </button>

      {/* Screen Share — green when active */}
      <button
        type="button"
        onClick={() => screenShareToggle.toggle()}
        disabled={screenShareToggle.pending}
        title={isScreenShareEnabled ? 'Paylaşımı durdur' : 'Ekran paylaş'}
        className={`
          p-3 rounded-full transition-colors
          ${isScreenShareEnabled ? 'bg-green-500/25 text-green-400 hover:bg-green-500/35' : 'text-gray-200 hover:bg-white/10'}
        `}
      >
        {isScreenShareEnabled ? <Monitor size={22} className="text-green-400" /> : <Monitor size={22} />}
      </button>

      {/* Disconnect */}
      <button
        type="button"
        onClick={handleDisconnect}
        disabled={disconnecting}
        title="Odadan ayrıl"
        className="p-3 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors disabled:opacity-50"
      >
        <PhoneOff size={22} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VoiceControlBar — fixed at bottom, optional RoomContext wrapper
// ---------------------------------------------------------------------------

export default function VoiceControlBar({ room, className = '' }: VoiceControlBarProps) {
  const content = (
    <div className={`flex-shrink-0 w-full flex justify-center pb-4 pt-2 px-4 ${className}`}>
      <VoiceControlBarInner />
    </div>
  );

  if (room) {
    return <RoomContext.Provider value={room}>{content}</RoomContext.Provider>;
  }

  return content;
}
