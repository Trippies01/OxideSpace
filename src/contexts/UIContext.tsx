import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
  id: number;
  msg: string;
  type: 'success' | 'error' | 'info';
}

interface UIContextType {
  // Toast notifications
  toasts: Toast[];
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: number) => void;
  
  // UI States
  inputVal: string;
  setInputVal: (val: string) => void;
  showMembers: boolean;
  setShowMembers: (show: boolean) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  showAddFriend: boolean;
  setShowAddFriend: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isAuthChecking: boolean;
  setIsAuthChecking: (checking: boolean) => void;
  
  // View state
  view: string;
  setView: (view: string) => void;
  
  // Modal states
  modals: {
    create: boolean;
    joinServer: boolean;
    createServer: boolean;
    settings: boolean;
    serverSettings: boolean;
    profile: boolean;
    addChannel: boolean;
    createCategory: boolean;
  };
  setModals: React.Dispatch<React.SetStateAction<{
    create: boolean;
    joinServer: boolean;
    createServer: boolean;
    settings: boolean;
    serverSettings: boolean;
    profile: boolean;
    addChannel: boolean;
    createCategory: boolean;
  }>>;
  
  // Form states
  newChannelName: string;
  setNewChannelName: (name: string) => void;
  newChannelType: string;
  setNewChannelType: (type: string) => void;
  newChannelCategory: string;
  setNewChannelCategory: (category: string) => void;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  newServerName: string;
  setNewServerName: (name: string) => void;
  newServerIconFile: File | null;
  setNewServerIconFile: (file: File | null) => void;
  newServerIconPreview: string | null;
  setNewServerIconPreview: (preview: string | null) => void;
  joinCode: string;
  setJoinCode: (code: string) => void;
  inviteCode: string;
  setInviteCode: (code: string) => void;
  inviteLoading: boolean;
  setInviteLoading: (loading: boolean) => void;
  newFriendName: string;
  setNewFriendName: (name: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [showMembers, setShowMembers] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [view, setView] = useState('setup');
  const [modals, setModals] = useState({
    create: false,
    joinServer: false,
    createServer: false,
    settings: false,
    serverSettings: false,
    profile: false,
    addChannel: false,
    createCategory: false
  });
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('text');
  const [newChannelCategory, setNewChannelCategory] = useState('GENEL');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newServerName, setNewServerName] = useState('');
  const [newServerIconFile, setNewServerIconFile] = useState<File | null>(null);
  const [newServerIconPreview, setNewServerIconPreview] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');

  const addToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <UIContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        inputVal,
        setInputVal,
        showMembers,
        setShowMembers,
        isMobileMenuOpen,
        setMobileMenuOpen,
        showNotifications,
        setShowNotifications,
        showAddFriend,
        setShowAddFriend,
        searchQuery,
        setSearchQuery,
        isLoading,
        setIsLoading,
        isAuthChecking,
        setIsAuthChecking,
        view,
        setView,
        modals,
        setModals,
        newChannelName,
        setNewChannelName,
        newChannelType,
        setNewChannelType,
        newChannelCategory,
        setNewChannelCategory,
        newCategoryName,
        setNewCategoryName,
        newServerName,
        setNewServerName,
        newServerIconFile,
        setNewServerIconFile,
        newServerIconPreview,
        setNewServerIconPreview,
        joinCode,
        setJoinCode,
        inviteCode,
        setInviteCode,
        inviteLoading,
        setInviteLoading,
        newFriendName,
        setNewFriendName,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUIContext() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within UIProvider');
  }
  return context;
}
