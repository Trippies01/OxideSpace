import React from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { Avatar } from './ui/Avatar';

export interface IncomingCallInfo {
    id: string;
    from_user_id: string;
    room_name: string;
    caller_name: string;
    caller_avatar: string;
}

interface IncomingCallModalProps {
    call: IncomingCallInfo | null;
    onAccept: () => void;
    onDecline: () => void;
    accepting?: boolean;
}

export function IncomingCallModal({ call, onAccept, onDecline, accepting }: IncomingCallModalProps) {
    if (!call) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center animate-in fade-in zoom-in-95 duration-200">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Gelen arama</p>
                <Avatar src={call.caller_avatar} size="xl" className="mx-auto mb-4 ring-4 ring-orange-500/30" />
                <h3 className="text-xl font-bold text-white mb-1">{call.caller_name}</h3>
                <p className="text-sm text-zinc-400 mb-6">Sesli arama yapıyor...</p>
                <div className="flex gap-3 justify-center">
                    <button
                        type="button"
                        onClick={onDecline}
                        disabled={accepting}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-medium transition-colors disabled:opacity-50"
                    >
                        <PhoneOff size={20} /> Reddet
                    </button>
                    <button
                        type="button"
                        onClick={onAccept}
                        disabled={accepting}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 font-medium transition-colors disabled:opacity-50"
                    >
                        <Phone size={20} /> Kabul Et
                    </button>
                </div>
            </div>
        </div>
    );
}
