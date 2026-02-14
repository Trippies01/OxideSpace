import { useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { LucideIcon } from 'lucide-react';
import { Volume2, VolumeX, Monitor, Mic } from 'lucide-react';

const MENU_PADDING = 8;
const SLIDER_MIN = 0;
const SLIDER_MAX = 100;

export interface VoiceSesContextMenuProps {
  x: number;
  y: number;
  streamVolume: number;
  normalVolume: number;
  onStreamVolumeChange: (value: number) => void;
  onNormalVolumeChange: (value: number) => void;
  onClose: () => void;
}

function VolumeRow({
  icon: Icon,
  iconMuted: IconMuted,
  label,
  value,
  onChange,
  muted,
  onMuteToggle,
  accentColor,
}: {
  icon: LucideIcon;
  iconMuted: LucideIcon;
  label: string;
  value: number;
  onChange: (v: number) => void;
  muted: boolean;
  onMuteToggle: () => void;
  accentColor: string;
}) {
  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.round(Number(e.target.value));
    onChange(v);
  };

  return (
    <div className="px-3 py-2.5 rounded-lg hover:bg-[#3f4147]/50 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {muted ? (
            <IconMuted size={18} className="text-[#80848e] flex-shrink-0" />
          ) : (
            <Icon size={18} className={`flex-shrink-0 ${accentColor}`} />
          )}
          <span className="text-[13px] font-medium text-[#dbdee1] truncate">{label}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono text-[#b5bac1] tabular-nums w-8 text-right">
            {muted ? '0' : value}%
          </span>
          <button
            type="button"
            onClick={onMuteToggle}
            className="p-1.5 rounded-md text-[#b5bac1] hover:bg-[#404249] hover:text-white transition-colors"
            title={muted ? 'Sesi aç' : 'Sesi kıs'}
          >
            {muted ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
      </div>
      <input
        type="range"
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        value={muted ? 0 : value}
        onChange={handleSlider}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[#1e1f22] accent-[#5865f2] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5865f2] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
      />
    </div>
  );
}

export function VoiceSesContextMenu({
  x,
  y,
  streamVolume,
  normalVolume,
  onStreamVolumeChange,
  onNormalVolumeChange,
  onClose,
}: VoiceSesContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const clampedPosition = useMemo(() => ({ x, y }), [x, y]);

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = clampedPosition.x;
    let top = clampedPosition.y;
    if (left + rect.width + MENU_PADDING > vw) left = vw - rect.width - MENU_PADDING;
    if (left < MENU_PADDING) left = MENU_PADDING;
    if (top + rect.height + MENU_PADDING > vh) top = vh - rect.height - MENU_PADDING;
    if (top < MENU_PADDING) top = MENU_PADDING;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [clampedPosition.x, clampedPosition.y]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleContextMenuOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('contextmenu', handleContextMenuOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('contextmenu', handleContextMenuOutside, true);
    };
  }, [onClose]);

  const streamMuted = streamVolume === 0;
  const normalMuted = normalVolume === 0;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[10000] w-[280px] py-2 rounded-xl bg-[#313338] border border-[#1e1f22] shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-[#dbdee1]"
      style={{ left: x, top: y }}
    >
      <div className="px-3 pb-2 mb-2 border-b border-[#1e1f22]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#80848e]">
          Ses düzeyleri
        </h3>
        <p className="text-[11px] text-[#b5bac1] mt-0.5">
          Yayın ve mikrofon seslerini ayarlayın
        </p>
      </div>

      <div className="space-y-0.5 px-2">
        <VolumeRow
          icon={Monitor}
          iconMuted={VolumeX}
          label="Yayın sesi"
          value={streamVolume}
          onChange={onStreamVolumeChange}
          muted={streamMuted}
          onMuteToggle={() => onStreamVolumeChange(streamMuted ? 100 : 0)}
          accentColor="text-[#23a559]"
        />
        <VolumeRow
          icon={Mic}
          iconMuted={VolumeX}
          label="Normal ses (mikrofonlar)"
          value={normalVolume}
          onChange={onNormalVolumeChange}
          muted={normalMuted}
          onMuteToggle={() => onNormalVolumeChange(normalMuted ? 100 : 0)}
          accentColor="text-[#5865f2]"
        />
      </div>

      <div className="px-3 pt-2 mt-2 border-t border-[#1e1f22]">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded-lg text-[13px] font-medium text-[#b5bac1] hover:bg-[#404249] hover:text-white transition-colors"
        >
          Kapat
        </button>
      </div>
    </div>,
    document.body
  );
}
