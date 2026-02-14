import React from 'react';
import { UserPlus, LayoutGrid } from 'lucide-react';

export interface ActivityTileProps {
  className?: string;
  onInvite?: () => void;
  onActivity?: () => void;
}

/**
 * Card for invites / games — gradient background, illustration, two buttons.
 */
export const ActivityTile: React.FC<ActivityTileProps> = ({
  className = '',
  onInvite,
  onActivity,
}) => {
  return (
    <div
      className={`
        relative rounded-2xl overflow-hidden
        min-h-[180px] flex flex-col items-center justify-center p-6
        bg-gradient-to-b from-[#1a1b1e] to-[#16171a]
        border border-purple-500/20
        shadow-inner
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 via-transparent to-pink-500/10 pointer-events-none" />

      <div className="relative flex flex-col items-center gap-4">
        {/* Illustration / icons */}
        <div className="flex items-center gap-4 text-4xl opacity-90">
          <span title="Aktivite">🏆</span>
          <span title="Oyun / Etkinlik">💎</span>
        </div>
        <p className="text-sm text-discord-text-secondary">Birlikte oyun veya aktivite başlatın</p>

        {/* Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={onInvite}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-discord-blurple hover:bg-discord-blurple/90 text-white text-sm font-medium transition-colors"
          >
            <UserPlus size={18} />
            Sesli Sohbete Davet et
          </button>
          <button
            type="button"
            onClick={onActivity}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-discord-surface hover:bg-discord-surface-hover text-discord-text-primary text-sm font-medium border border-white/5 transition-colors"
          >
            <LayoutGrid size={18} />
            Aktivite Seç
          </button>
        </div>
      </div>
    </div>
  );
};
