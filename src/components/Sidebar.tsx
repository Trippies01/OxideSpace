import React, { useState } from 'react';
import { Plus, Settings, ChevronDown, FolderPlus, Mic, MicOff, Volume2, VolumeX, Check, X, UserPlus, Search, Users, Circle, CircleOff, Phone } from 'lucide-react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { livekitService } from '../lib/livekit';
import type { Server, Channel, User } from '../types';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { SortableChannelItem } from './SortableChannelItem';
import { normalizeStatus } from '../utils/helpers';
import { logger } from '../utils/logger';

interface SidebarProps {
    activeServerId: string | null;
    handleDmSelect: (friend: any) => void;
    handleDragEnd: (event: any) => void;
    filteredFriends: any[];
    activeDmUser: { id: string; name: string; status: string; avatar: string; lastMsg?: string; threadId?: string } | null;
    setShowAddFriend: (show: boolean) => void;
    currentServer: Server;
    categories: { [key: string]: Channel[] };
    serverChannels: Channel[];
    activeChannelId: string | null;
    setActiveChannelId: (id: string | null) => void;
    setChannelType: (type: string) => void;
    connectedVoiceChannelId: string | null;
    setConnectedVoiceChannelId: (id: string | null) => void;
    setLastTextChannelIdForServer?: (serverId: string, channelId: string) => void;
    setMobileMenuOpen: (open: boolean) => void;
    setModals: React.Dispatch<React.SetStateAction<any>>;
    setNewChannelCategory: (category: string) => void;
    sensors: any;
    user: User;
    authUser: any;
    addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    fetchVoiceChannelUsers: (channelId: string) => void;
    setVoiceChannelUsers: React.Dispatch<React.SetStateAction<any[]>>;
    onDeleteChannel: (channelId: string) => void;
    onlineUserIds?: Set<string>;
    friendRequestsIncoming?: Array<{ id: string; from_user_id: string; profiles: { id: string; username: string | null; avatar_url: string | null } | null }>;
    onAcceptFriendRequest?: (fromUserId: string, fromProfile?: { username: string | null; avatar_url: string | null } | null) => void;
    onRejectFriendRequest?: (requestId: string) => void;
    dmSearchQuery?: string;
    setDmSearchQuery?: (q: string) => void;
    dmStatusFilter?: 'all' | 'online' | 'offline';
    setDmStatusFilter?: (v: 'all' | 'online' | 'offline') => void;
    dmSortBy?: 'name_asc' | 'name_desc' | 'online_first';
    setDmSortBy?: (v: 'name_asc' | 'name_desc' | 'online_first') => void;
    friendsCount?: number;
    onStartCall?: (friend: { id: string; name: string; threadId?: string }) => void;
}

export const Sidebar = React.memo(({
    activeServerId,
    handleDmSelect,
    handleDragEnd,
    filteredFriends,
    activeDmUser,
    setShowAddFriend,
    currentServer,
    categories,
    serverChannels,
    activeChannelId,
    setActiveChannelId,
    setChannelType,
    connectedVoiceChannelId,
    setConnectedVoiceChannelId,
    setLastTextChannelIdForServer,
    setMobileMenuOpen,
    setModals,
    setNewChannelCategory,
    sensors,
    user,
    authUser,
    addToast,
    fetchVoiceChannelUsers,
    setVoiceChannelUsers,
    onDeleteChannel,
    onlineUserIds = new Set(),
    friendRequestsIncoming = [],
    onAcceptFriendRequest,
    onRejectFriendRequest,
    dmSearchQuery = '',
    setDmSearchQuery,
    dmStatusFilter = 'all',
    setDmStatusFilter,
    dmSortBy = 'online_first',
    setDmSortBy,
    friendsCount = 0,
    onStartCall,
}: SidebarProps) => {
    const [dmViewTab, setDmViewTab] = useState<'friends' | 'pending'>('friends');

    return (
        <GlassCard className="h-full flex flex-col rounded-none md:rounded-3xl overflow-hidden border-y-0 md:border-y border-l-0 md:border-l">
            {activeServerId === 'dm' ? (
                <div className="p-4 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3 px-2">
                        <h2 className="text-xl font-bold">Mesajlar</h2>
                        <Button onClick={() => setShowAddFriend(true)} className="h-8 px-3 py-0 bg-green-600/20 text-green-400 hover:bg-green-600/30 border-green-600/30 text-xs">Arkadaş Ekle</Button>
                    </div>

                    {/* Discord tarzı: Arkadaşlar sekmesi */}
                    <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5 mb-3 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => setDmViewTab('friends')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${dmViewTab === 'friends' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Users size={14} /> Arkadaşlar
                        </button>
                        <button
                            type="button"
                            onClick={() => setDmViewTab('pending')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors relative ${dmViewTab === 'pending' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <UserPlus size={14} /> Bekleyen
                            {friendRequestsIncoming.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">{friendRequestsIncoming.length}</span>
                            )}
                        </button>
                    </div>

                    {dmViewTab === 'pending' ? (
                        <div className="space-y-2 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                            {friendRequestsIncoming.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Check className="text-zinc-600 mb-2" size={32} />
                                    <p className="text-zinc-500 text-sm">Bekleyen arkadaşlık isteği yok.</p>
                                </div>
                            ) : (
                                friendRequestsIncoming.map((req) => (
                                    <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                        <Avatar src={req.profiles?.avatar_url ?? `https://api.dicebear.com/7.x/notionists/svg?seed=${req.from_user_id}`} size="sm" />
                                        <span className="flex-1 text-sm font-medium text-white truncate">{req.profiles?.username ?? 'Kullanıcı'}</span>
                                        <div className="flex gap-1 shrink-0">
                                            <button type="button" onClick={() => onAcceptFriendRequest?.(req.from_user_id, req.profiles)} className="p-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30" title="Kabul et"><Check size={16} /></button>
                                            <button type="button" onClick={() => onRejectFriendRequest?.(req.id)} className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10" title="Reddet"><X size={16} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Arkadaşlarda ara (Discord gibi) */}
                            <div className="mb-3 space-y-2 flex-shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type="text"
                                        value={dmSearchQuery}
                                        onChange={(e) => setDmSearchQuery?.(e.target.value)}
                                        placeholder="Arkadaşlarında ara..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-colors"
                                    />
                                    {dmSearchQuery && (
                                        <button type="button" onClick={() => setDmSearchQuery?.('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10" title="Temizle"><X size={16} /></button>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {(['all', 'online', 'offline'] as const).map((key) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setDmStatusFilter?.(key)}
                                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                dmStatusFilter === key ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-zinc-400 border border-transparent hover:bg-white/10 hover:text-zinc-300'
                                            }`}
                                        >
                                            {key === 'all' && <Users size={12} />}
                                            {key === 'online' && <Circle size={12} className="text-green-500" />}
                                            {key === 'offline' && <CircleOff size={12} />}
                                            {key === 'all' && 'Tümü'}
                                            {key === 'online' && 'Çevrimiçi'}
                                            {key === 'offline' && 'Çevrimdışı'}
                                        </button>
                                    ))}
                                    <select
                                        value={dmSortBy}
                                        onChange={(e) => setDmSortBy?.(e.target.value as 'name_asc' | 'name_desc' | 'online_first')}
                                        className="ml-auto bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-orange-500/50"
                                    >
                                        <option value="online_first">Çevrimiçi önce</option>
                                        <option value="name_asc">İsim A-Z</option>
                                        <option value="name_desc">İsim Z-A</option>
                                    </select>
                                </div>
                                <p className="text-[11px] text-zinc-500 px-0.5">
                                    {filteredFriends.length === 0 ? 'Eşleşen arkadaş yok' : `${filteredFriends.length} / ${friendsCount} arkadaş`}
                                </p>
                            </div>

                            <div className="space-y-1 overflow-y-auto pr-1 flex-1 custom-scrollbar min-h-0">
                                {filteredFriends.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <Search className="text-zinc-600 mb-2" size={32} />
                                        <p className="text-zinc-500 text-sm">Arama kriterlerine uyan arkadaş yok.</p>
                                        <p className="text-xs text-zinc-600 mt-1">Filtreleri değiştirin veya arama metnini düzenleyin.</p>
                                    </div>
                                ) : (
                                    filteredFriends.map((friend: any) => (
                                        <div
                                            key={friend.id}
                                            onClick={() => handleDmSelect(friend)}
                                            className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors group
             ${activeDmUser?.id === friend.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                        >
                                            <Avatar src={friend.avatar} size="sm" status={onlineUserIds.has(friend.id) ? 'online' : normalizeStatus(friend.status)} onClick={undefined} />
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-sm font-medium transition-colors truncate ${activeDmUser?.id === friend.id ? 'text-white' : 'text-zinc-300'}`}>{friend.name}</div>
                                                <div className="text-xs text-zinc-500 truncate group-hover:text-zinc-400">{friend.lastMsg || 'Mesaj yok'}</div>
                                            </div>
                                            {onStartCall && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); onStartCall(friend); }}
                                                    className="p-2 rounded-lg text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Ara"
                                                >
                                                    <Phone size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <>
                    <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 flex-shrink-0">
                        <div
                            className="font-bold text-lg tracking-wide truncate cursor-pointer hover:text-zinc-300 transition-colors"
                            onClick={() => setModals((m: any) => ({ ...m, serverSettings: true }))}
                        >
                            {currentServer.name}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setModals((m: any) => ({ ...m, createCategory: true }))}
                                className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Kategori Ekle"
                            >
                                <FolderPlus size={18} />
                            </button>
                            <button
                                onClick={() => { setNewChannelCategory('GENEL'); setModals((m: any) => ({ ...m, addChannel: true })); }}
                                className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Kanal Ekle"
                            >
                                <Plus size={20} />
                            </button>
                            <button
                                onClick={() => setModals((m: any) => ({ ...m, serverSettings: true }))}
                                className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                {currentServer.ownerId === user.id ? <Settings size={18} /> : <ChevronDown size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                        {Object.keys(categories).length === 0 ? <p className="text-zinc-500 text-center text-sm mt-10">Kanal bulunamadı.</p> :
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={serverChannels.map((c: any) => c.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {Object.entries(categories).map(([cat, chans]: any) => (
                                        <div key={cat}>
                                            <div className="flex items-center justify-between px-3 mb-2 group cursor-pointer mt-4 first:mt-0">
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{cat}</span>
                                                <Plus size={14} onClick={(e) => { e.stopPropagation(); setNewChannelCategory(cat); setModals((m: any) => ({ ...m, addChannel: true })); }} className="text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-orange-400 transition-all" />
                                            </div>
                                            <div className="space-y-1">
                                                {chans.map((channel: any) => (
                                                    <SortableChannelItem
                                                        key={channel.id}
                                                        channel={channel}
                                                        isActive={channel.type === 'voice' ? (activeChannelId === channel.id || connectedVoiceChannelId === channel.id) : (activeChannelId === channel.id)}
                                                        onDelete={onDeleteChannel}
                                                        currentUser={user}
                                                        currentServer={currentServer}
                                                        onClick={(event: React.MouseEvent) => {
                                                            event.preventDefault();
                                                            event.stopPropagation();
                                                            setMobileMenuOpen(false);

                                                            if (channel.type === 'text') {
                                                                setActiveChannelId(channel.id);
                                                                setChannelType('text');
                                                                if (activeServerId && setLastTextChannelIdForServer) setLastTextChannelIdForServer(activeServerId, channel.id);
                                                                return;
                                                            }
                                                            if (channel.type === 'canvas') {
                                                                setActiveChannelId(channel.id);
                                                                setChannelType('canvas');
                                                                return;
                                                            }

                                                            if (channel.type !== 'voice' || !authUser?.id) return;

                                                            const userName = user.username || authUser.email || 'User';

                                                            if (connectedVoiceChannelId === channel.id) {
                                                                if (activeChannelId === channel.id) {
                                                                    livekitService.leaveRoom().then(() => {
                                                                        setConnectedVoiceChannelId(null);
                                                                        setActiveChannelId(null);
                                                                        setChannelType('text');
                                                                        setVoiceChannelUsers([]);
                                                                        addToast('Ses kanalından ayrıldın.', 'info');
                                                                    }).catch((err: any) => {
                                                                        logger.error('Voice leave error:', err);
                                                                        addToast('Ses kanalından ayrılırken hata oluştu', 'error');
                                                                    });
                                                                } else {
                                                                    setActiveChannelId(channel.id);
                                                                    setChannelType('voice');
                                                                }
                                                                return;
                                                            }

                                                            if (connectedVoiceChannelId) {
                                                                livekitService.leaveRoom().then(() => {
                                                                    livekitService.joinRoom(channel.id, authUser.id, userName)
                                                                        .then(() => {
                                                                            setConnectedVoiceChannelId(channel.id);
                                                                            setActiveChannelId(channel.id);
                                                                            setChannelType('voice');
                                                                            fetchVoiceChannelUsers(channel.id);
                                                                            addToast(`${channel.name} ses kanalına katıldın.`, 'success');
                                                                        })
                                                                        .catch((err: any) => {
                                                                            logger.error('Voice join error:', err);
                                                                            addToast('Ses kanalına katılamadı: ' + (err?.message || 'Bilinmeyen hata'), 'error');
                                                                        });
                                                                });
                                                            } else {
                                                                livekitService.joinRoom(channel.id, authUser.id, userName)
                                                                    .then(() => {
                                                                        setConnectedVoiceChannelId(channel.id);
                                                                        setActiveChannelId(channel.id);
                                                                        setChannelType('voice');
                                                                        fetchVoiceChannelUsers(channel.id);
                                                                        addToast(`${channel.name} ses kanalına katıldın.`, 'success');
                                                                    })
                                                                    .catch((err: any) => {
                                                                        logger.error('Voice join error:', err);
                                                                        addToast('Ses kanalına katılamadı: ' + (err?.message || 'Bilinmeyen hata'), 'error');
                                                                    });
                                                            }
                                                        }}
                                                    >
                                                        {/* Voice Users - Basitleştirilmiş */}
                                                        {channel.type === 'voice' && (channel.id === activeChannelId || channel.id === connectedVoiceChannelId) && (
                                                            <div className="pl-8 pb-2">
                                                                <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5 mx-1">
                                                                    <Avatar src={user.avatar} size="sm" className="w-5 h-5" status={undefined} onClick={undefined} />
                                                                    <span className="text-xs font-bold text-white truncate">{user.username}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </SortableChannelItem>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </SortableContext>
                            </DndContext>
                        }
                    </div>
                </>
            )}

            {/* User Mini Bar */}
            <UserMiniBar user={user} setModals={setModals} />
        </GlassCard>
    );
});
Sidebar.displayName = 'Sidebar';

const UserMiniBar = React.memo(({ user, setModals }: { user: User; setModals: React.Dispatch<React.SetStateAction<any>> }) => {
    const [voiceState, setVoiceState] = useState({ mic: true, deafen: false });

    return (
        <div className="p-4 border-t border-white/5 bg-black/20 flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => setModals((m: any) => ({ ...m, profile: true }))}>
                <Avatar src={user.avatar} size="sm" status={normalizeStatus(user.status)} onClick={undefined} />
                <div className="text-xs">
                    <div className="font-bold text-white">{user.username}</div>
                    <div className="text-zinc-500">{user.discriminator}</div>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={() => setVoiceState(p => ({ ...p, mic: !p.mic }))} className={`p-1.5 rounded-lg ${!voiceState.mic ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10 text-zinc-400'}`} title="Mikrofon">
                    {!voiceState.mic ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button onClick={() => setVoiceState(p => ({ ...p, deafen: !p.deafen }))} className={`p-1.5 rounded-lg ${voiceState.deafen ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10 text-zinc-400'}`} title="Ses">
                    {voiceState.deafen ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <button onClick={() => setModals((m: any) => ({ ...m, settings: true }))} className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400" title="Ayarlar">
                    <Settings size={16} />
                </button>
            </div>
        </div>
    );
});
UserMiniBar.displayName = 'UserMiniBar';
