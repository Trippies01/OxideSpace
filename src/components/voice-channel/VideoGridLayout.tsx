import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGridCalculation } from '../../hooks/useGridCalculation';
import { VideoCard, type VideoCardParticipant } from './VideoCard';
import type { Track } from 'livekit-client';

export type VideoGridParticipant = VideoCardParticipant & {
  /** Optional: camera track */
  cameraTrack?: Track | null;
  /** Optional: screen share track */
  screenTrack?: Track | null;
  cameraMuted?: boolean;
  screenMuted?: boolean;
};

export interface VideoGridLayoutProps {
  participants: VideoGridParticipant[];
  /** 'grid' = equal cells; 'speaker' = one large (75-80%) + sidebar */
  mode?: 'grid' | 'speaker';
  /** Max participants to show in grid; rest show as "+X more" */
  maxParticipants?: number;
  /** In speaker mode: index of the focused/speaker participant (0-based) */
  speakerIndex?: number;
  onParticipantClick?: (participant: VideoGridParticipant, index: number) => void;
  className?: string;
}

const DEFAULT_MAX = 12;

export const VideoGridLayout: React.FC<VideoGridLayoutProps> = ({
  participants,
  mode = 'grid',
  maxParticipants = DEFAULT_MAX,
  speakerIndex = 0,
  onParticipantClick,
  className = '',
}) => {
  const visible = participants.slice(0, maxParticipants);
  const overflowCount = participants.length - visible.length;
  const count = visible.length;

  const { cols, rows, cellWidth, cellHeight, containerRef } = useGridCalculation(
    mode === 'speaker' ? 1 + (count - 1) : count
  );

  if (count === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center bg-[#0e0e12] text-zinc-500 ${className}`}>
        <p className="text-sm">Henüz kimse yok</p>
      </div>
    );
  }

  if (mode === 'speaker' && count > 1) {
    const speaker = visible[speakerIndex] ?? visible[0];
    const others = visible.filter((_, i) => i !== speakerIndex);

    return (
      <div
        ref={containerRef}
        className={`relative flex-1 flex min-h-0 w-full gap-3 p-3 ${className}`}
      >
        {/* Main area: 75-80% */}
        <div className="flex-[3] min-w-0 min-h-0 flex flex-col">
          <motion.div
            key={speaker.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-h-0 rounded-xl overflow-hidden"
          >
            <VideoCard
              participant={speaker}
              track={speaker.screenTrack ?? speaker.cameraTrack ?? null}
              trackMuted={speaker.screenTrack ? false : speaker.cameraMuted}
              isScreenShare={!!speaker.screenTrack}
              isActive
              onClick={onParticipantClick ? () => onParticipantClick(speaker, speakerIndex) : undefined}
              className="h-full w-full"
            />
          </motion.div>
        </div>

        {/* Sidebar: scrollable list */}
        <div className="w-48 md:w-56 flex-shrink-0 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {others.map((p, i) => {
              const idx = i >= speakerIndex ? i + 1 : i;
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 h-24 md:h-28 rounded-lg overflow-hidden"
                >
                  <VideoCard
                    participant={p}
                    track={p.screenTrack ?? p.cameraTrack ?? null}
                    trackMuted={p.screenTrack ? false : p.cameraMuted}
                    isScreenShare={!!p.screenTrack}
                    onClick={onParticipantClick ? () => onParticipantClick(p, idx) : undefined}
                    className="h-full w-full"
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {overflowCount > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/80 text-zinc-400 text-sm">
            +{overflowCount} katılımcı daha
          </div>
        )}
      </div>
    );
  }

  // Grid mode
  const gap = 8;
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gap,
    width: '100%',
    height: '100%',
    minHeight: 0,
  };

  return (
    <div ref={containerRef} className={`flex-1 flex flex-col min-h-0 w-full p-3 ${className}`}>
      <div className="flex-1 min-h-0" style={{ minHeight: 200 }}>
        <div style={gridStyle}>
          <AnimatePresence mode="popLayout">
            {visible.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 min-h-0 aspect-video max-h-full"
              >
                <VideoCard
                  participant={p}
                  track={p.screenTrack ?? p.cameraTrack ?? null}
                  trackMuted={p.screenTrack ? false : p.cameraMuted}
                  isScreenShare={!!p.screenTrack}
                  onClick={onParticipantClick ? () => onParticipantClick(p, i) : undefined}
                  className="h-full w-full"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {overflowCount > 0 && (
        <div className="flex-shrink-0 py-2 text-center">
          <span className="text-sm text-zinc-500">+{overflowCount} katılımcı daha</span>
        </div>
      )}
    </div>
  );
};
