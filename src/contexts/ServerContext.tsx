import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Server, Channel } from '../types';
import { useServers, useChannels } from '../hooks/useSupabase';

interface ServerContextType {
  // State
  activeServerId: string | null;
  activeChannelId: string | null;
  servers: Server[];
  channels: { [key: string]: Channel[] };
  channelType: string;
  /** Bağlı olduğun ses kanalı (ayrılınca null). Görünümden bağımsız. */
  connectedVoiceChannelId: string | null;
  lastTextChannelIdByServer: Record<string, string>;
  
  // Actions
  setActiveServerId: (id: string | null) => void;
  setActiveChannelId: (id: string | null) => void;
  setChannelType: (type: string) => void;
  setConnectedVoiceChannelId: (id: string | null) => void;
  setServers: React.Dispatch<React.SetStateAction<Server[]>>;
  setChannels: React.Dispatch<React.SetStateAction<{ [key: string]: Channel[] }>>;
  setLastTextChannelIdForServer: (serverId: string, channelId: string) => void;
  
  // Data from hooks
  dbServers: any[];
  dbServersLoading: boolean;
  dbChannels: any[];
  refetchServers: () => Promise<void>;
  refetchChannels: () => Promise<void>;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export function ServerProvider({ children }: { children: ReactNode }) {
  const [activeServerId, setActiveServerId] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [channelType, setChannelType] = useState('text');
  const [connectedVoiceChannelId, setConnectedVoiceChannelId] = useState<string | null>(null);
  const [servers, setServers] = useState<Server[]>([{ id: 'dm', name: 'Mesajlar', icon: null, type: 'dm' }]);
  const [channels, setChannels] = useState<{ [key: string]: Channel[] }>({});
  const [lastTextChannelIdByServer, setLastTextChannelIdByServer] = useState<Record<string, string>>({});

  const setLastTextChannelIdForServer = React.useCallback((serverId: string, channelId: string) => {
    setLastTextChannelIdByServer((prev) => ({ ...prev, [serverId]: channelId }));
  }, []);

  const { servers: dbServers, loading: dbServersLoading, refetch: refetchServers } = useServers();
  const { channels: dbChannels, refetch: refetchChannels } = useChannels(activeServerId);

  return (
    <ServerContext.Provider
      value={{
        activeServerId,
        activeChannelId,
        servers,
        channels,
        channelType,
        connectedVoiceChannelId,
        lastTextChannelIdByServer,
        setActiveServerId,
        setActiveChannelId,
        setChannelType,
        setConnectedVoiceChannelId,
        setServers,
        setChannels,
        setLastTextChannelIdForServer,
        dbServers,
        dbServersLoading,
        dbChannels,
        refetchServers,
        refetchChannels,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
}

export function useServerContext() {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServerContext must be used within ServerProvider');
  }
  return context;
}
