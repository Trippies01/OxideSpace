import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Message } from '../types';
import { useMessages } from '../hooks/useSupabase';
import { useServerContext } from './ServerContext';
import { useUserContext } from './UserContext';

interface MessageContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  sendMessage: (content: string, userId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  messagesLoading: boolean;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { activeChannelId, channelType } = useServerContext();
  const { user } = useUserContext();

  const channelIdForMessages = channelType === 'text' ? activeChannelId : null;

  const { messages: dbMessages, sendMessage: sendDbMessage, updateMessage: updateDbMessage, loading: messagesLoading } = useMessages(channelIdForMessages);

  useEffect(() => {
    const username = user?.username ?? '';
    if (Array.isArray(dbMessages) && dbMessages.length > 0) {
      const formattedMessages = dbMessages.map((m) => ({
        ...m,
        isMe: m.user === username
      }));
      setMessages(formattedMessages);
    } else if (!channelIdForMessages || !Array.isArray(dbMessages) || dbMessages.length === 0) {
      setMessages([]);
    }
  }, [dbMessages, user?.username, channelIdForMessages]);

  const sendMessage = async (content: string, userId: string) => {
    await sendDbMessage(content, userId);
  };

  const editMessage = async (messageId: string, content: string) => {
    const userId = user?.id;
    if (!userId) return;
    await updateDbMessage(messageId, userId, content);
  };

  return (
    <MessageContext.Provider
      value={{
        messages,
        setMessages,
        sendMessage,
        editMessage,
        messagesLoading,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

export function useMessageContext() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessageContext must be used within MessageProvider');
  }
  return context;
}
