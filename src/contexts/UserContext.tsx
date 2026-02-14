import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types';
import { useAuth, useProfile } from '../hooks/useSupabase';

interface UserContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  activeDmUser: { id: string; name: string; status: string; avatar: string; lastMsg?: string; threadId?: string } | null;
  setActiveDmUser: (user: { id: string; name: string; status: string; avatar: string; lastMsg?: string; threadId?: string } | null) => void;
  friends: Array<{
    id: string;
    name: string;
    status: string;
    avatar: string;
    lastMsg?: string;
    threadId?: string;
  }>;
  setFriends: React.Dispatch<React.SetStateAction<Array<{
    id: string;
    name: string;
    status: string;
    avatar: string;
    lastMsg?: string;
    threadId?: string;
  }>>>;
}

/** Profil yüklenene kadar gösterilen başlangıç değeri; veritabanından gelmez */
const INITIAL_USER: User = {
  id: '',
  username: '',
  discriminator: '',
  bio: '',
  avatar: '',
  status: 'offline',
  bannerColor: '',
  badges: []
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [activeDmUser, setActiveDmUser] = useState<{ id: string; name: string; status: string; avatar: string; lastMsg?: string; threadId?: string } | null>(null);
  const [friends, setFriends] = useState<Array<{
    id: string;
    name: string;
    status: string;
    avatar: string;
    lastMsg?: string;
    threadId?: string;
  }>>([]);
  
  const { user: authUser } = useAuth();
  const { profile } = useProfile();

  // Sync profile to user state (Discord-style: username#discriminator)
  useEffect(() => {
    if (profile && authUser) {
      const disc = profile.discriminator
        ? '#' + profile.discriminator
        : '#' + profile.id.substring(0, 4);
      setUser({
        id: profile.id,
        username: profile.username || 'User',
        discriminator: disc,
        bio: profile.bio || '',
        avatar: profile.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.id}`,
        status: profile.status || 'online',
        bannerColor: 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500',
        badges: []
      });
    }
  }, [profile, authUser]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        activeDmUser,
        setActiveDmUser,
        friends,
        setFriends,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within UserProvider');
  }
  return context;
}
