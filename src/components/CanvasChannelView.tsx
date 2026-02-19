import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { Layout, Loader2, Users } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import type { Channel } from '../types';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface CanvasChannelViewProps {
    channel: Channel | null;
    channelName: string;
    supabase: SupabaseClient;
    currentUserId: string | undefined;
    onSaveCanvasData: (channelId: string, data: Record<string, unknown>) => Promise<void>;
    addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const SAVE_DEBOUNCE_MS = 1200;
const BROADCAST_DEBOUNCE_MS = 400;

/** Boş = her kanal kendi canvas'ı (Excalidraw, kanal başına canvas_data). Tek paylaşılan Penpot istemiyorsanız boş bırakın. */
const PENPOT_EMBED_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PENPOT_EMBED_URL) || '';

/**
 * Canvas kanalı: VITE_PENPOT_EMBED_URL ayarlıysa Penpot canvas (giriş yok, paylaşım linki);
 * değilse ortak beyaz tahta (Excalidraw). Kanal açılınca doğrudan açılır.
 */
export function CanvasChannelView({
    channel,
    channelName,
    supabase,
    currentUserId,
    onSaveCanvasData,
    addToast,
}: CanvasChannelViewProps) {
    const [saving, setSaving] = useState(false);
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const broadcastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedRef = useRef<string>('');
    const isRemoteUpdateRef = useRef(false);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const initialData = channel?.canvas_data && typeof channel.canvas_data === 'object'
        ? (channel.canvas_data as { elements?: unknown; appState?: unknown })
        : null;

    const saveToBackend = useCallback(
        (data: { elements?: unknown; appState?: unknown }) => {
            if (!channel?.id) return;
            const payload = { elements: data.elements ?? [], appState: data.appState ?? {} };
            const key = JSON.stringify(payload);
            if (key === lastSavedRef.current) return;
            lastSavedRef.current = key;
            setSaving(true);
            onSaveCanvasData(channel.id, payload)
                .then(() => addToast('Tasarım kaydedildi.', 'success'))
                .catch(() => addToast('Kaydedilirken hata oluştu.', 'error'))
                .finally(() => setSaving(false));
        },
        [channel?.id, onSaveCanvasData, addToast]
    );

    const broadcastCanvas = useCallback(
        (data: { elements: unknown[]; appState: Record<string, unknown> }) => {
            const ch = channelRef.current;
            if (!ch || !currentUserId) return;
            ch.send({
                type: 'broadcast',
                event: 'canvas_sync',
                payload: { userId: currentUserId, elements: data.elements, appState: data.appState },
            });
        },
        [currentUserId]
    );

    const handleChange = useCallback(
        (elements: readonly unknown[], appState: Record<string, unknown>) => {
            if (isRemoteUpdateRef.current) return;
            if (!channel?.id) return;
            const data = { elements: [...elements], appState: { ...appState } };

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                saveTimeoutRef.current = null;
                saveToBackend(data);
            }, SAVE_DEBOUNCE_MS);

            if (broadcastTimeoutRef.current) clearTimeout(broadcastTimeoutRef.current);
            broadcastTimeoutRef.current = setTimeout(() => {
                broadcastTimeoutRef.current = null;
                broadcastCanvas(data);
            }, BROADCAST_DEBOUNCE_MS);
        },
        [channel?.id, saveToBackend, broadcastCanvas]
    );

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (broadcastTimeoutRef.current) clearTimeout(broadcastTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (!channel?.id || !supabase) return;
        const channelNameRealtime = `canvas:${channel.id}`;
        const ch = supabase.channel(channelNameRealtime);

        ch.on('broadcast', { event: 'canvas_sync' }, ({ payload }) => {
            const { userId, elements, appState } = payload as { userId?: string; elements?: unknown[]; appState?: Record<string, unknown> };
            if (userId === currentUserId || !elements) return;
            isRemoteUpdateRef.current = true;
            try {
                excalidrawAPI?.updateScene?.({ elements: elements ?? [], appState: appState ?? {} });
            } finally {
                setTimeout(() => { isRemoteUpdateRef.current = false; }, 100);
            }
        });

        ch.subscribe();
        channelRef.current = ch;
        return () => {
            supabase.removeChannel(ch);
            channelRef.current = null;
        };
    }, [channel?.id, supabase, currentUserId, excalidrawAPI]);

    return (
        <GlassCard className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-3xl border border-white/5">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/20 flex-shrink-0 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Layout size={20} className="text-orange-400" />
                    <span className="font-bold text-white">{channelName}</span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Users size={12} /> Ortak canvas — sunucudakiler anlık görür
                    </span>
                </div>
                {saving && (
                    <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Loader2 size={14} className="animate-spin" /> Kaydediliyor…
                    </span>
                )}
            </div>

            <div className="flex-1 flex flex-col min-h-0 p-4 overflow-hidden">
                {PENPOT_EMBED_URL ? (
                    <>
                        <p className="text-xs text-zinc-500 mb-1 flex-shrink-0">Penpot canvas — giriş yok, doğrudan tasarım alanı</p>
                        <div className="flex-1 min-h-[480px] flex flex-col relative rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e]">
                            <iframe
                                title="Penpot canvas"
                                src={PENPOT_EMBED_URL}
                                className="absolute inset-0 w-full h-full border-0 rounded-xl"
                                allow="fullscreen"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-xs text-zinc-500 mb-1 flex-shrink-0">Beyaz tahta — çizim araçları üstte; aynı kanaldaki herkes anlık görür</p>
                        <div className="flex-1 min-h-[480px] flex flex-col relative rounded-xl overflow-hidden border border-white/10 bg-white">
                            <div className="absolute inset-0 w-full h-full">
                                <Excalidraw
                                    key={channel?.id}
                                    excalidrawAPI={(api) => setExcalidrawAPI(api)}
                                    initialData={initialData ? { elements: initialData.elements as any, appState: initialData.appState as any } : undefined}
                                    onChange={handleChange}
                                    theme="light"
                                    langCode="tr"
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </GlassCard>
    );
}
