import React, { useState, useRef, useEffect } from 'react';
import { Hash, Radio, ChevronDown, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Channel, Server, User } from '../types';

interface SortableChannelItemProps {
    channel: Channel;
    isActive: boolean;
    onClick: (event: React.MouseEvent) => void;
    onDelete: (channelId: string) => void;
    currentUser: User;
    currentServer: Server;
    children?: React.ReactNode;
}

export const SortableChannelItem = React.memo(({ channel, isActive, onClick, onDelete, currentUser, currentServer, children }: SortableChannelItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: channel.id });
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) {
            onClick(e);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(true);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDelete && window.confirm(`"${channel.name}" kanalını silmek istediğinize emin misiniz?`)) {
            onDelete(channel.id);
        }
        setShowMenu(false);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showMenu]);

    const canManage = currentServer?.ownerId === currentUser?.id;

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none transform-gpu relative">
            <div
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-100 group relative select-none
                ${isActive
                        ? 'bg-gradient-to-r from-orange-500/20 to-red-500/10 text-white border border-orange-500/30'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent'}`}
            >
                {channel.type === 'text'
                    ? <Hash size={18} className={isActive ? 'text-orange-400' : 'opacity-50'} />
                    : <Radio size={18} className={isActive ? 'text-red-400' : 'opacity-50'} />}
                <span className="font-medium text-sm truncate select-none flex-1">{channel.name}</span>
                {canManage && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className={`flex-shrink-0 p-1 hover:bg-white/10 rounded transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                        <ChevronDown size={14} />
                    </button>
                )}
            </div>
            {showMenu && canManage && (
                <div
                    ref={menuRef}
                    className="absolute left-full ml-2 top-0 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[180px] animate-in slide-in-from-left-2 fade-in"
                >
                    <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                        <Trash2 size={16} />
                        Kanalı Sil
                    </button>
                </div>
            )}
            {children}
        </div>
    );
});
SortableChannelItem.displayName = 'SortableChannelItem';
