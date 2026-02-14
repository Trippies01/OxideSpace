import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Track } from 'livekit-client';
import type { VoiceState, VoiceChannelUser } from '../types';

interface VoiceContextType {
  // Voice State
  voiceState: VoiceState;
  setVoiceState: React.Dispatch<React.SetStateAction<VoiceState>>;
  
  // Voice Channel Users
  voiceChannelUsers: VoiceChannelUser[];
  setVoiceChannelUsers: React.Dispatch<React.SetStateAction<VoiceChannelUser[]>>;
  
  // LiveKit States
  livekitSpeakingIds: Set<string>;
  setLivekitSpeakingIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  livekitVideoTracks: Map<string, { track: Track; source: string; muted: boolean }>;
  setLivekitVideoTracks: React.Dispatch<React.SetStateAction<Map<string, { track: Track; source: string; muted: boolean }>>>;
  livekitFocusedKey: string | null;
  setLivekitFocusedKey: (key: string | null) => void;
  livekitPinnedKey: string | null;
  setLivekitPinnedKey: (key: string | null) => void;
  livekitFullscreen: boolean;
  setLivekitFullscreen: (fullscreen: boolean) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    mic: true,
    video: false,
    deafen: false,
    screenShare: false,
    streamVolume: 100,
    normalVolume: 100,
  });
  
  const [voiceChannelUsers, setVoiceChannelUsers] = useState<VoiceChannelUser[]>([]);
  const [livekitSpeakingIds, setLivekitSpeakingIds] = useState<Set<string>>(new Set());
  const [livekitVideoTracks, setLivekitVideoTracks] = useState<Map<string, { track: Track; source: string; muted: boolean }>>(new Map());
  const [livekitFocusedKey, setLivekitFocusedKey] = useState<string | null>(null);
  const [livekitPinnedKey, setLivekitPinnedKey] = useState<string | null>(null);
  const [livekitFullscreen, setLivekitFullscreen] = useState(false);

  return (
    <VoiceContext.Provider
      value={{
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
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoiceContext() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoiceContext must be used within VoiceProvider');
  }
  return context;
}
