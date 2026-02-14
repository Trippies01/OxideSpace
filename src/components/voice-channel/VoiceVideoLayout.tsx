import React from 'react';
import { Track } from 'livekit-client';
import { Monitor, User, Pin, Maximize2 } from 'lucide-react';
import { LivekitVideo } from '../ui/LivekitVideo';

export interface VideoTrackEntry {
  track: Track;
  source: string;
  muted: boolean;
}

export interface VoiceVideoLayoutProps {
  /** Map: "identity:source" -> entry */
  videoTracks: Map<string, VideoTrackEntry>;
  /** Currently focused/pinned key (shown in main area) */
  focusedKey: string | null;
  onFocusKey: (key: string | null) => void;
  pinnedKey: string | null;
  onPinnedKey: (key: string | null) => void;
  /** Participant identity -> display name */
  participantNames: Map<string, string>;
  speakingIds: Set<string>;
  onFullscreen?: (enabled: boolean) => void;
  isFullscreen?: boolean;
  className?: string;
}

/**
 * Discord-style layout: one large main video (screen share or pinned camera)
 * and a horizontal strip of thumbnails. Click thumbnail to pin to main.
 */
export const VoiceVideoLayout: React.FC<VoiceVideoLayoutProps> = ({
  videoTracks,
  focusedKey,
  onFocusKey,
  pinnedKey,
  onPinnedKey,
  participantNames,
  speakingIds,
  onFullscreen,
  isFullscreen = false,
  className = '',
}) => {
  const entries = Array.from(videoTracks.entries()) as Array<[string, VideoTrackEntry]>;
  const screenEntries = entries.filter(([, v]) => v.source === Track.Source.ScreenShare);
  const cameraEntries = entries.filter(([, v]) => v.source === Track.Source.Camera);

  // Discord: screen share takes priority for main view; then pinned; then first screen/camera
  const mainKey =
    pinnedKey && videoTracks.has(pinnedKey)
      ? pinnedKey
      : focusedKey && videoTracks.has(focusedKey)
        ? focusedKey
        : screenEntries[0]?.[0] ?? cameraEntries[0]?.[0] ?? null;

  const mainEntry = mainKey ? videoTracks.get(mainKey) : null;
  const mainId = mainKey ? mainKey.split(':')[0] : null;
  const mainIsScreen = mainEntry?.source === Track.Source.ScreenShare;
  const mainName = mainId ? participantNames.get(mainId) || mainId : '';
  const isSpeaking = mainId ? speakingIds.has(mainId) : false;

  // Discord-style: aynı kişinin kamerası varsa yan container'da göster (ekran + kamera aynı anda)
  const mainCameraKey = mainId ? `${mainId}:${Track.Source.Camera}` : null;
  const mainCameraEntry = mainCameraKey && mainIsScreen ? videoTracks.get(mainCameraKey) : null;

  // Thumbnails: all tracks except the one shown in main (or all, with main highlighted)
  const thumbnails = entries;

  if (entries.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center bg-[#0e0e12] text-zinc-500 ${className}`}>
        <p className="text-sm">Kamera veya ekran paylaşımı yok</p>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col min-h-0 bg-[#0e0e12] ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}>
      {/* Discord-style: ekran paylaşımı + aynı kişinin kamerası yan yana */}
      <div className={`flex-1 min-h-0 flex flex-row gap-2 md:gap-3 min-w-0 ${isFullscreen ? 'm-0 p-0' : 'm-2 md:m-3'}`}>
        {/* Ana alan ve yan panel eşit boyut (50-50) */}
        <div className={`flex-1 min-w-0 min-h-0 flex flex-col relative overflow-hidden bg-black/40 rounded-xl ${isFullscreen ? 'rounded-none' : ''}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            {mainEntry && (
              <LivekitVideo
                track={mainEntry.track}
                muted={mainEntry.source === Track.Source.ScreenShare ? false : mainEntry.muted}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Top bar: label + pin/fullscreen */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between px-3 pt-1 z-10">
            <div className="flex items-center gap-2">
              {mainIsScreen ? (
                <Monitor size={16} className="text-white/90" />
              ) : (
                <User size={16} className="text-white/90" />
              )}
              <span className="text-sm font-medium text-white truncate">
                {mainIsScreen ? 'Ekran paylaşımı' : mainName}
              </span>
              {isSpeaking && (
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Konuşuyor" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPinnedKey(mainKey === pinnedKey ? null : mainKey)}
                className={`p-1.5 rounded-lg transition-colors ${mainKey === pinnedKey ? 'bg-orange-500/80 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                title={mainKey === pinnedKey ? 'Sabitlemeyi kaldır' : 'Sabitle'}
              >
                <Pin size={16} />
              </button>
              {onFullscreen && (
                <button
                  type="button"
                  onClick={() => onFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
                  title={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
                >
                  <Maximize2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Yan panel: kamera — eşit boyut */}
        {mainCameraEntry && (
          <div className="flex-1 min-w-0 min-h-0 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex flex-col">
            <div className="flex-1 min-h-0 relative">
              <LivekitVideo
                track={mainCameraEntry.track}
                muted={mainCameraEntry.muted}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 px-2 py-2 flex items-center gap-2 z-10">
                <User size={14} className="text-white/90 flex-shrink-0" />
                <span className="text-sm font-medium text-white truncate">{mainName}</span>
                {isSpeaking && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail strip — Discord-style horizontal strip at bottom (hidden in fullscreen) */}
      {!isFullscreen && (
      <div className="flex-shrink-0 px-2 pb-2 md:px-3 md:pb-3">
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar justify-center flex-wrap">
          {thumbnails.map(([key, entry]) => {
            const id = key.split(':')[0];
            const name = participantNames.get(id) || id;
            const isScreen = entry.source === Track.Source.ScreenShare;
            const active = key === mainKey;
            const speaking = speakingIds.has(id);

            return (
              <button
                key={key}
                type="button"
                onClick={() => onFocusKey(key)}
                className={`
                  flex-shrink-0 w-28 h-20 md:w-36 md:h-24 rounded-lg overflow-hidden
                  border-2 transition-all duration-200
                  ${active ? 'border-orange-500 ring-2 ring-orange-500/50' : 'border-white/10 hover:border-white/30'}
                  ${speaking ? 'ring-2 ring-green-400/60' : ''}
                `}
              >
                <div className="relative w-full h-full bg-black/60">
                  <LivekitVideo
                    track={entry.track}
                    muted={entry.source === Track.Source.ScreenShare ? false : entry.muted}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/80 to-transparent flex items-center px-2 gap-1">
                    {isScreen ? (
                      <Monitor size={10} className="text-white/90 flex-shrink-0" />
                    ) : (
                      <User size={10} className="text-white/90 flex-shrink-0" />
                    )}
                    <span className="text-[10px] font-medium text-white truncate">
                      {isScreen ? 'Ekran' : name}
                    </span>
                  </div>
                  {speaking && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
};
