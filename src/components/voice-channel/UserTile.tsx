import React from 'react';
import { Mic } from 'lucide-react';

export interface UserTileProps {
  name: string;
  avatar: string;
  isSpeaking?: boolean;
  className?: string;
}

/**
 * User card for voice channel — rounded tile, avatar center, name bottom-left.
 * Speaking indicator: green border around avatar.
 */
export const UserTile: React.FC<UserTileProps> = ({
  name,
  avatar,
  isSpeaking = false,
  className = '',
}) => {
  return (
    <div
      className={`
        relative rounded-2xl overflow-hidden bg-discord-surface
        min-h-[200px] flex items-center justify-center
        border border-white/5 transition-all duration-200
        hover:border-white/10
        ${className}
      `}
    >
      {/* Avatar — centered, with optional speaking ring */}
      <div
        className={`
          relative flex items-center justify-center w-28 h-28 md:w-36 md:h-36
          rounded-full overflow-hidden
          transition-all duration-200
          ${isSpeaking ? 'ring-4 ring-discord-success ring-offset-2 ring-offset-[#1e1f22] shadow-lg shadow-discord-success/30' : ''}
        `}
      >
        <img
          src={avatar}
          alt=""
          className="w-full h-full object-cover"
        />
        {isSpeaking && (
          <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-discord-success flex items-center justify-center border-2 border-discord-surface" title="Konuşuyor">
            <Mic size={14} className="text-white" />
          </span>
        )}
      </div>

      {/* Name tag — bottom-left, backdrop blur */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black/70 to-transparent flex items-end px-4 pb-2 pointer-events-none">
        <span className="text-discord-text-primary font-semibold text-sm drop-shadow-lg">
          {name}
        </span>
      </div>
    </div>
  );
};
