import React, { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Hash, Radio, LayoutGrid, MessageCircle, Plus, Smile, Send, Trash2, Loader2, Pencil, Check, X, Search, Paperclip } from 'lucide-react';
import { Track } from 'livekit-client';
import type { Message, User, Channel, VoiceState, VoiceChannelUser } from '../types';
import { GlassCard } from './ui/GlassCard';
import { Avatar } from './ui/Avatar';
import { VoiceChannelControls } from './VoiceChannelControls';
import { escapeHtml, parseMessageContent, getFileNameFromUrl } from '../utils/helpers';
import { MESSAGE_MAX_LENGTH, ALLOWED_FILE_TYPES } from '../constants';

export interface TypingUserDisplay {
    userId: string;
    username: string;
}

const MessageRow = React.memo(function MessageRow({
    msg,
    isEditing,
    editingContent,
    onEditingContentChange,
    onSaveEdit,
    onCancelEdit,
    onStartEdit,
    onDeleteMessage,
    onEditMessage,
}: {
    msg: Message;
    isEditing: boolean;
    editingContent: string;
    onEditingContentChange: (v: string) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onStartEdit: () => void;
    onDeleteMessage: (id: string | number) => void;
    onEditMessage?: (id: string | number, content: string) => void | Promise<void>;
}) {
    return (
        <div className={`flex gap-4 ${msg.isMe ? 'flex-row-reverse' : ''} group mb-6`}>
            <div className="flex-shrink-0 mt-auto">
                {!msg.isMe && <Avatar src={msg.avatar} size="md" status={undefined} onClick={undefined} />}
            </div>
            <div className={`flex flex-col max-w-[80%] md:max-w-[70%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-xs font-bold text-zinc-400 cursor-pointer hover:underline">{msg.user}</span>
                    <span className="text-[10px] text-zinc-600">{msg.time}</span>
                </div>
                {isEditing && onEditMessage ? (
                    <div className="flex gap-2 items-center w-full">
                        <input
                            value={editingContent}
                            onChange={(e) => onEditingContentChange(e.target.value)}
                            maxLength={MESSAGE_MAX_LENGTH}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                            autoFocus
                        />
                        <button type="button" onClick={onSaveEdit} className="p-2 text-green-400 hover:bg-white/10 rounded-lg" title="Kaydet"><Check size={16} /></button>
                        <button type="button" onClick={onCancelEdit} className="p-2 text-zinc-400 hover:bg-white/10 rounded-lg" title="İptal"><X size={16} /></button>
                    </div>
                ) : (
                    <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm relative break-words group/bubble
                        ${msg.isMe ? 'bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-br-none' : 'bg-white/10 text-zinc-100 rounded-bl-none border border-white/5'}`}>
                        {(() => {
                            const { text, imageUrls, fileUrls } = parseMessageContent(String(msg.content || ''));
                            return (
                                <>
                                    {imageUrls.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {imageUrls.map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden max-w-[280px] max-h-[280px] border border-white/10">
                                                    <img src={url} alt="" className="max-w-full max-h-[280px] object-contain" loading="lazy" />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    {fileUrls.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {fileUrls.map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-sm underline text-orange-300 hover:text-orange-200 flex items-center gap-1">
                                                    📎 {getFileNameFromUrl(url)}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    {text ? <span dangerouslySetInnerHTML={{ __html: escapeHtml(text).replace(/\n/g, '<br/>') }} /> : null}
                                </>
                            );
                        })()}
                        {msg.isMe && onEditMessage && (
                            <>
                                <button type="button" onClick={onStartEdit} className="absolute -top-3 -right-12 bg-black/80 p-1.5 rounded-full text-zinc-400 opacity-0 group-hover/bubble:opacity-100 hover:text-white transition-all border border-white/10" title="Düzenle"><Pencil size={12} /></button>
                                <button type="button" onClick={() => onDeleteMessage(msg.id)} className="absolute -top-3 -right-3 bg-black/80 p-1.5 rounded-full text-red-400 opacity-0 group-hover/bubble:opacity-100 hover:text-red-300 transition-all border border-white/10" title="Mesajı Sil"><Trash2 size={12} /></button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

interface ChatAreaProps {
    messages: Message[];
    messagesLoading?: boolean;
    typingUsers?: TypingUserDisplay[];
    user: User;
    inputVal: string;
    setInputVal: (val: string) => void;
    onSendMessage: (e?: React.FormEvent) => void;
    onDeleteMessage: (id: string | number) => void;
    onEditMessage?: (id: string | number, content: string) => void | Promise<void>;
    bottomRef: React.RefObject<HTMLDivElement>;
    channelType: string;
    serverChannels: Channel[];
    activeChannelId: string | null;
    activeServerId: string | null;
    activeDmUser: { id: string; name: string; status: string; avatar: string; lastMsg?: string; threadId?: string } | null;
    showMembers: boolean;
    setShowMembers: (show: boolean) => void;
    voiceState: VoiceState;
    setVoiceState: React.Dispatch<React.SetStateAction<VoiceState>>;
    setActiveChannelId: (id: string | null) => void;
    setChannelType: (type: string) => void;
    setConnectedVoiceChannelId?: (id: string | null) => void;
    setVoiceChannelUsers: React.Dispatch<React.SetStateAction<VoiceChannelUser[]>>;
    addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    voiceChannelUsers: VoiceChannelUser[];
    livekitSpeakingIds: Set<string>;
    livekitVideoTracks: Map<string, { track: Track; source: string; muted: boolean }>;
    livekitFocusedKey: string | null;
    setLivekitFocusedKey: (key: string | null) => void;
    livekitPinnedKey: string | null;
    setLivekitPinnedKey: (key: string | null) => void;
    livekitFullscreen: boolean;
    setLivekitFullscreen: (fullscreen: boolean) => void;
    attachmentPreviewUrl?: string | null;
    attachmentName?: string;
    onAttachmentSelect?: (file: File) => void;
    onAttachmentClear?: () => void;
    onOpenSettings?: () => void;
}

export const ChatArea = React.memo(({
    messages,
    messagesLoading = false,
    typingUsers = [],
    user,
    inputVal,
    setInputVal,
    onSendMessage,
    onDeleteMessage,
    onEditMessage,
    bottomRef,
    channelType,
    serverChannels,
    activeChannelId,
    activeServerId,
    activeDmUser,
    showMembers,
    setShowMembers,
    voiceState,
    setVoiceState,
    setActiveChannelId,
    setChannelType,
    setConnectedVoiceChannelId,
    setVoiceChannelUsers,
    addToast,
    voiceChannelUsers,
    livekitSpeakingIds,
    livekitVideoTracks,
    livekitFocusedKey,
    setLivekitFocusedKey,
    livekitPinnedKey,
    setLivekitPinnedKey,
    livekitFullscreen,
    setLivekitFullscreen,
    attachmentPreviewUrl = null,
    attachmentName = '',
    onAttachmentSelect,
    onAttachmentClear,
    onOpenSettings
}: ChatAreaProps) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const emojiPanelRef = React.useRef<HTMLDivElement>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | number | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [emojiOpen, setEmojiOpen] = useState(false);

    React.useEffect(() => {
        if (!emojiOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (emojiPanelRef.current && !emojiPanelRef.current.contains(e.target as Node)) setEmojiOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [emojiOpen]);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const searchTrimmed = searchQuery.trim().toLowerCase();
    const displayedMessages = searchTrimmed
        ? messages.filter((msg: Message) => String(msg.content || '').toLowerCase().includes(searchTrimmed))
        : messages;
    const videoEntries = Array.from(livekitVideoTracks.entries()) as Array<[string, { track: Track; source: string; muted: boolean }]>;
    const screenKey = videoEntries.find(([, value]) => value.source === Track.Source.ScreenShare)?.[0] || null;
    let autoFocusKey: string | null = null;
    for (const speakerId of Array.from(livekitSpeakingIds)) {
        const screenForSpeaker = videoEntries.find(([key, value]) => key.startsWith(`${speakerId}:`) && value.source === Track.Source.ScreenShare)?.[0];
        const cameraForSpeaker = videoEntries.find(([key, value]) => key.startsWith(`${speakerId}:`) && value.source === Track.Source.Camera)?.[0];
        autoFocusKey = screenForSpeaker || cameraForSpeaker || null;
        if (autoFocusKey) break;
    }
    const focusedKey = livekitPinnedKey || livekitFocusedKey || screenKey || autoFocusKey;
    const focusedEntry = focusedKey ? livekitVideoTracks.get(focusedKey) : null;
    const focusedId = focusedKey ? focusedKey.split(':')[0] : null;
    const isFullscreen = livekitFullscreen && !!focusedEntry;

    return (
        <>
            <div className="h-14 flex items-center justify-between px-4 mb-2 flex-shrink-0 md:bg-transparent bg-black/20">
                <div className="flex items-center gap-3">
                    {activeServerId === 'dm' ? (
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-400 text-lg">@</span>
                            <h3 className="text-xl font-bold text-white">{activeDmUser?.name}</h3>
                        </div>
                    ) : (
                        channelType === 'text' ? (
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Hash size={20} className="text-orange-400" />
                                {serverChannels.find((c: any) => c.id === activeChannelId)?.name}
                            </h3>
                        ) : (
                            <div className="flex items-center gap-2 text-red-400">
                                <Radio className="animate-pulse" />
                                <h3 className="text-xl font-bold text-white">{serverChannels.find((c: any) => c.id === activeChannelId)?.name}</h3>
                            </div>
                        )
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {channelType === 'text' && (
                        <>
                            {searchOpen ? (
                                <div className="flex items-center gap-1 bg-white/5 rounded-xl px-2 py-1.5 border border-white/10">
                                    <Search size={18} className="text-zinc-400 flex-shrink-0" />
                                    <input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Mesajlarda ara..."
                                        className="bg-transparent text-white placeholder-zinc-500 focus:outline-none w-40 text-sm"
                                        autoFocus
                                    />
                                    <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="p-1 text-zinc-400 hover:text-white" title="Kapat"><X size={16} /></button>
                                </div>
                            ) : (
                                <button onClick={() => setSearchOpen(true)} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400" title="Mesajlarda ara"><Search size={20} /></button>
                            )}
                        </>
                    )}
                    <button onClick={() => setShowMembers(!showMembers)} className={`p-2 rounded-xl transition-colors hidden md:block ${showMembers ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-zinc-400'}`}>
                        <LayoutGrid size={20} />
                    </button>
                </div>
            </div>

            <GlassCard className="flex-1 rounded-none md:rounded-3xl overflow-hidden flex flex-col relative border-white/5 border-x-0 md:border-x border-b-0 md:border-b">
                {channelType === 'voice' ? (
                    <VoiceChannelControls
                        user={user}
                        voiceState={voiceState}
                        setVoiceState={setVoiceState}
                        voiceChannelUsers={voiceChannelUsers}
                        livekitSpeakingIds={livekitSpeakingIds}
                        livekitVideoTracks={livekitVideoTracks}
                        livekitFocusedKey={livekitFocusedKey}
                        setLivekitFocusedKey={setLivekitFocusedKey}
                        livekitPinnedKey={livekitPinnedKey}
                        setLivekitPinnedKey={setLivekitPinnedKey}
                        livekitFullscreen={livekitFullscreen}
                        setLivekitFullscreen={setLivekitFullscreen}
                        focusedKey={focusedKey}
                        focusedEntry={focusedEntry ?? null}
                        focusedId={focusedId}
                        isFullscreen={isFullscreen}
                        setActiveChannelId={setActiveChannelId}
                        setChannelType={setChannelType}
                        setConnectedVoiceChannelId={setConnectedVoiceChannelId}
                        setVoiceChannelUsers={setVoiceChannelUsers}
                        addToast={addToast}
                        channelName={serverChannels.find((c: Channel) => c.id === activeChannelId)?.name ?? 'Ses Kanalı'}
                        onOpenTextChat={() => {
                            const firstText = serverChannels.find((c: Channel) => c.type === 'text');
                            if (firstText) {
                                setChannelType('text');
                                setActiveChannelId(firstText.id);
                            }
                        }}
                        onOpenSettings={onOpenSettings}
                    />
                ) : (
                    <>
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            {searchTrimmed && (
                                <div className="flex-shrink-0 flex items-center justify-between py-2 px-4 md:px-6 bg-white/5 rounded-xl mx-4 md:mx-6 mt-2 mb-2 text-sm text-zinc-400">
                                    <span>Arama: &quot;{searchQuery}&quot; — {displayedMessages.length} mesaj</span>
                                    <button type="button" onClick={() => { setSearchQuery(''); setSearchOpen(false); }} className="text-orange-400 hover:underline">Temizle</button>
                                </div>
                            )}
                            {messagesLoading ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                                    <Loader2 className="animate-spin text-orange-500" size={40} />
                                    <p className="text-sm text-zinc-500">Mesajlar yükleniyor...</p>
                                </div>
                            ) : displayedMessages.length === 0 ? (
                                <div className="flex-1 py-20 text-center opacity-50 select-none">
                                    {searchTrimmed ? (
                                        <>
                                            <Search size={40} className="mx-auto mb-4 text-zinc-500" />
                                            <h3 className="text-xl font-bold">Sonuç bulunamadı</h3>
                                            <p className="text-sm">&quot;{searchQuery}&quot; ile eşleşen mesaj yok.</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-20 h-20 bg-white/5 rounded-full mx-auto flex items-center justify-center mb-4">
                                                <MessageCircle size={40} />
                                            </div>
                                            <h3 className="text-xl font-bold">Sohbetin Başlangıcı</h3>
                                            <p className="text-sm">Burası başlangıç noktası. İlk &quot;merhaba&quot;yı sen de!</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 min-h-0 p-4 md:p-6 custom-scrollbar" style={{ minHeight: 0 }}>
                                    <Virtuoso
                                        style={{ height: '100%' }}
                                        data={displayedMessages}
                                        followOutput="smooth"
                                        components={{
                                            Footer: () => <div ref={bottomRef} className="h-2" />,
                                        }}
                                        itemContent={(_index, msg) => (
                                            <MessageRow
                                                msg={msg}
                                                isEditing={editingMessageId === msg.id}
                                                editingContent={editingContent}
                                                onEditingContentChange={setEditingContent}
                                                onSaveEdit={() => { if (onEditMessage) onEditMessage(msg.id, editingContent); setEditingMessageId(null); setEditingContent(''); }}
                                                onCancelEdit={() => { setEditingMessageId(null); setEditingContent(''); }}
                                                onStartEdit={() => { setEditingMessageId(msg.id); setEditingContent(String(msg.content || '')); }}
                                                onDeleteMessage={onDeleteMessage}
                                                onEditMessage={onEditMessage}
                                            />
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                        {typingUsers.length > 0 && channelType === 'text' && (
                            <div className="px-4 py-1 text-xs text-zinc-500 italic flex items-center gap-1">
                                <span className="animate-pulse">●</span>
                                {typingUsers.map((t) => t.username).join(', ')} yazıyor...
                            </div>
                        )}
                        <div className="p-4 pt-2">
                            {attachmentPreviewUrl && (
                                <div className="flex items-center gap-2 mb-2 p-2 bg-white/5 rounded-xl border border-white/10">
                                    {attachmentPreviewUrl.startsWith('blob:') && /\.(jpe?g|png|gif|webp)$/i.test(attachmentName || '') ? (
                                        <img src={attachmentPreviewUrl} alt="" className="w-12 h-12 object-cover rounded-lg" />
                                    ) : null}
                                    <span className="text-sm text-zinc-300 truncate flex-1">{attachmentName || 'Dosya'}</span>
                                    {onAttachmentClear && <button type="button" onClick={onAttachmentClear} className="p-1 text-zinc-400 hover:text-white" title="Kaldır"><X size={16} /></button>}
                                </div>
                            )}
                            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-2 flex items-center gap-2 focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/20 transition-all shadow-lg">
                                {channelType === 'text' && onAttachmentSelect ? (
                                    <>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept={ALLOWED_FILE_TYPES.join(',')}
                                            onChange={(e) => { const f = e.target.files?.[0]; if (f) onAttachmentSelect(f); e.target.value = ''; }}
                                        />
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-400 hover:text-white bg-white/5 rounded-xl hover:bg-white/10 transition-colors" title="Dosya ekle"><Paperclip size={20} /></button>
                                    </>
                                ) : (
                                    <button type="button" className="p-2 text-zinc-400 hover:text-white bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><Plus size={20} /></button>
                                )}
                                <form onSubmit={onSendMessage} className="flex-1">
                                    <input value={inputVal} onChange={(e) => setInputVal(e.target.value)} placeholder="Bir mesaj yaz..." maxLength={MESSAGE_MAX_LENGTH} className="w-full bg-transparent text-white placeholder-zinc-500 focus:outline-none h-10 px-2" />
                                </form>
                                <div className="flex items-center gap-1 pr-2 relative">
                                    <div className="relative" ref={emojiPanelRef}>
                                        <button type="button" onClick={() => setEmojiOpen((o) => !o)} className="p-2 text-zinc-400 hover:text-orange-400" title="Emoji"><Smile size={20} /></button>
                                        {emojiOpen && (
                                            <div className="absolute bottom-full right-0 mb-1 p-2 bg-[#18181b] border border-white/10 rounded-xl shadow-xl flex flex-wrap gap-1 max-w-[200px] z-10">
                                                {['😀','😊','👍','❤️','😂','🎉','🔥','✨','👋','🙏','😢','😡'].map((emoji) => (
                                                    <button key={emoji} type="button" onClick={() => { setInputVal(inputVal + emoji); setEmojiOpen(false); }} className="p-1.5 hover:bg-white/10 rounded-lg text-lg">{emoji}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {(inputVal.length > 0 || attachmentPreviewUrl) && <button type="button" onClick={(e) => { e.preventDefault(); onSendMessage(e as unknown as React.FormEvent); }} className="p-2 bg-orange-600 text-white rounded-xl shadow-lg hover:bg-orange-700 transition-all transform hover:scale-105"><Send size={18} /></button>}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </GlassCard>
        </>
    );
});
ChatArea.displayName = 'ChatArea';
