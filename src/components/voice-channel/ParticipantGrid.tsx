import React from 'react';
import { UserTile } from './UserTile';
import type { MockParticipant } from './mockData';

export interface ParticipantGridProps {
  participants: MockParticipant[];
  className?: string;
}

/**
 * Responsive grid: 1 user = center; 2 users = stack vertically (reference layout).
 * More users = responsive grid.
 */
export const ParticipantGrid: React.FC<ParticipantGridProps> = ({
  participants,
  className = '',
}) => {
  const count = participants.length;

  if (count === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center text-discord-text-secondary ${className}`}>
        <p className="text-sm">Henüz kimse yok</p>
      </div>
    );
  }

  if (count === 1) {
    const p = participants[0];
    return (
      <div className={`flex-1 flex items-center justify-center p-4 ${className}`}>
        <div className="w-full max-w-md">
          <UserTile
            name={p.name}
            avatar={p.avatar}
            isSpeaking={p.isSpeaking}
          />
        </div>
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className={`flex-1 flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-center md:gap-6 ${className}`}>
        {participants.map((p) => (
          <div key={p.id} className="flex-1 min-h-[200px] max-w-md mx-auto w-full">
            <UserTile
              name={p.name}
              avatar={p.avatar}
              isSpeaking={p.isSpeaking}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`
        flex-1 grid gap-4 p-4 overflow-auto
        grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
        auto-rows-fr content-center
        ${className}
      `}
    >
      {participants.map((p) => (
        <div key={p.id} className="min-h-[200px]">
          <UserTile
            name={p.name}
            avatar={p.avatar}
            isSpeaking={p.isSpeaking}
          />
        </div>
      ))}
    </div>
  );
};
