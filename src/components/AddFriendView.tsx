import React, { useState, useCallback, useEffect } from 'react';
import { UserPlus, UserCheck, Clock, Search, X, Check, Loader2 } from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { normalizeStatus } from '../utils/helpers';

export type FriendRequestIncoming = {
    id: string;
    from_user_id: string;
    profiles: { id: string; username: string | null; avatar_url: string | null } | null;
};

export type FriendRequestOutgoing = {
    id: string;
    to_user_id: string;
    profiles: { id: string; username: string | null; avatar_url: string | null } | null;
};

type SearchResult = {
    id: string;
    username: string | null;
    avatar_url: string | null;
    status: string | null;
};

type TabId = 'add' | 'pending';

interface AddFriendViewProps {
    currentUserId: string;
    friends: Array<{ id: string; name: string; status: string; avatar: string; threadId?: string }>;
    friendRequestsIncoming: FriendRequestIncoming[];
    friendRequestsOutgoing: FriendRequestOutgoing[];
    onSearchUsers: (query: string) => Promise<SearchResult[]>;
    onSendRequest: (userId: string) => Promise<void>;
    onAcceptRequest: (fromUserId: string, fromProfile?: { username: string | null; avatar_url: string | null } | null) => Promise<void>;
    onRejectRequest: (requestId: string) => Promise<void>;
    onCancelRequest: (requestId: string) => Promise<void>;
    onOpenDm: (friend: { id: string; name: string; status: string; avatar: string; threadId?: string }) => void;
    onClose: () => void;
    addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function AddFriendView({
    currentUserId,
    friends,
    friendRequestsIncoming,
    friendRequestsOutgoing,
    onSearchUsers,
    onSendRequest,
    onAcceptRequest,
    onRejectRequest,
    onCancelRequest,
    onOpenDm,
    onClose,
    addToast,
}: AddFriendViewProps) {
    const [activeTab, setActiveTab] = useState<TabId>('add');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [sendingId, setSendingId] = useState<string | null>(null);

    const friendIds = new Set(friends.map(f => f.id));
    const pendingSentIds = new Set(friendRequestsOutgoing.map(r => r.to_user_id));
    const pendingReceivedIds = new Set(friendRequestsIncoming.map(r => r.from_user_id));

    const search = useCallback(async () => {
        const q = searchQuery.trim();
        if (!q || q.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const results = await onSearchUsers(q);
            setSearchResults(results.filter(r => r.id !== currentUserId));
        } catch {
            setSearchResults([]);
            addToast('Arama yapılamadı.', 'error');
        } finally {
            setSearching(false);
        }
    }, [searchQuery, currentUserId, onSearchUsers, addToast]);

    useEffect(() => {
        const t = setTimeout(search, 400);
        return () => clearTimeout(t);
    }, [searchQuery, search]);

    const getButtonState = (userId: string) => {
        if (friendIds.has(userId)) return 'friend';
        if (pendingSentIds.has(userId)) return 'pending_sent';
        if (pendingReceivedIds.has(userId)) return 'pending_received';
        return 'none';
    };

    const handleSendRequest = async (userId: string) => {
        setSendingId(userId);
        try {
            await onSendRequest(userId);
            search(); // refresh results
        } finally {
            setSendingId(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0c0c0f] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        aria-label="Kapat"
                    >
                        <X size={20} />
                    </button>
                    <h2 className="text-lg font-bold text-white">Arkadaş Ekle</h2>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 px-4">
                <button
                    onClick={() => setActiveTab('add')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'add'
                            ? 'border-green-500 text-green-400'
                            : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <UserPlus size={16} />
                        Arkadaş Ekle
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                        activeTab === 'pending'
                            ? 'border-green-500 text-green-400'
                            : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <Clock size={16} />
                        Bekleyen İstekler
                    </span>
                    {(friendRequestsIncoming.length + friendRequestsOutgoing.length) > 0 && (
                        <span className="absolute -top-0.5 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center">
                            {friendRequestsIncoming.length + friendRequestsOutgoing.length}
                        </span>
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'add' && (
                    <>
                        <div className="mb-4">
                            <p className="text-xs text-zinc-500 mb-2">Kullanıcı adı ile ara (en az 2 karakter)</p>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Örn: NeoUser"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-colors"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {searching && (
                            <div className="flex items-center justify-center py-8 text-zinc-500">
                                <Loader2 size={24} className="animate-spin" />
                            </div>
                        )}

                        {!searching && searchQuery.trim().length >= 2 && (
                            <div className="space-y-1">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Sonuçlar</h3>
                                {searchResults.length === 0 ? (
                                    <p className="text-zinc-500 text-sm py-4">Kullanıcı bulunamadı.</p>
                                ) : (
                                    searchResults.map((user) => {
                                        const state = getButtonState(user.id);
                                        const isSending = sendingId === user.id;
                                        return (
                                            <div
                                                key={user.id}
                                                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/[0.07] border border-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Avatar
                                                        src={user.avatar_url ?? `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`}
                                                        size="sm"
                                                        status={user.status ? normalizeStatus(user.status) : undefined}
                                                        onClick={undefined}
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-white truncate">{user.username || 'Kullanıcı'}</div>
                                                        <div className="text-xs text-zinc-500">
                                                            {state === 'friend' && <span className="text-green-500/80">Arkadaş</span>}
                                                            {state === 'pending_sent' && <span className="text-amber-500/80">İstek gönderildi</span>}
                                                            {state === 'pending_received' && <span className="text-blue-500/80">Size istek gönderdi</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="shrink-0">
                                                    {state === 'friend' && (
                                                        <Button
                                                            className="h-8 px-3 py-0 text-xs"
                                                            onClick={() => {
                                                                const f = friends.find(x => x.id === user.id);
                                                                if (f) {
                                                                    onClose();
                                                                    onOpenDm(f);
                                                                }
                                                            }}
                                                        >
                                                            Mesaj
                                                        </Button>
                                                    )}
                                                    {state === 'pending_sent' && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium">
                                                            <Clock size={14} /> Beklemede
                                                        </span>
                                                    )}
                                                    {state === 'pending_received' && (
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => onAcceptRequest(user.id, { username: user.username, avatar_url: user.avatar_url })}
                                                                className="p-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors"
                                                                title="Kabul et"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const req = friendRequestsIncoming.find(r => r.from_user_id === user.id);
                                                                    if (req) onRejectRequest(req.id);
                                                                }}
                                                                className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 transition-colors"
                                                                title="Reddet"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {state === 'none' && (
                                                        <Button
                                                            success
                                                            className="h-8 px-3 py-0 text-xs"
                                                            onClick={() => handleSendRequest(user.id)}
                                                            disabled={isSending}
                                                        >
                                                            {isSending ? <Loader2 size={14} className="animate-spin" /> : 'İstek Gönder'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {!searching && searchQuery.trim().length < 2 && (
                            <div className="py-8 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                                    <UserPlus className="text-zinc-500" size={28} />
                                </div>
                                <p className="text-zinc-500 text-sm">Arkadaş eklemek için yukarıya kullanıcı adı yazın.</p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'pending' && (
                    <div className="space-y-6">
                        {friendRequestsIncoming.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Gelen istekler — {friendRequestsIncoming.length}</h3>
                                <div className="space-y-2">
                                    {friendRequestsIncoming.map((req) => (
                                        <div
                                            key={req.id}
                                            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar
                                                    src={req.profiles?.avatar_url ?? `https://api.dicebear.com/7.x/notionists/svg?seed=${req.from_user_id}`}
                                                    size="sm"
                                                    onClick={undefined}
                                                />
                                                <span className="font-medium text-white truncate">{req.profiles?.username ?? 'Kullanıcı'}</span>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <button
                                                    onClick={() => onAcceptRequest(req.from_user_id, req.profiles)}
                                                    className="p-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors"
                                                    title="Kabul et"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={() => onRejectRequest(req.id)}
                                                    className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 transition-colors"
                                                    title="Reddet"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {friendRequestsOutgoing.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Giden istekler — {friendRequestsOutgoing.length}</h3>
                                <div className="space-y-2">
                                    {friendRequestsOutgoing.map((req) => (
                                        <div
                                            key={req.id}
                                            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar
                                                    src={req.profiles?.avatar_url ?? `https://api.dicebear.com/7.x/notionists/svg?seed=${req.to_user_id}`}
                                                    size="sm"
                                                    onClick={undefined}
                                                />
                                                <span className="font-medium text-white truncate">{req.profiles?.username ?? 'Kullanıcı'}</span>
                                            </div>
                                            <button
                                                onClick={() => onCancelRequest(req.id)}
                                                className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                                            >
                                                İptal
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {friendRequestsIncoming.length === 0 && friendRequestsOutgoing.length === 0 && (
                            <div className="py-12 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                                    <Clock className="text-zinc-500" size={28} />
                                </div>
                                <p className="text-zinc-500 text-sm">Bekleyen arkadaşlık isteği yok.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
