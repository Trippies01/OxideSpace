import React from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { useAppUpdate, isTauri } from '../hooks/useAppUpdate';

export function AppUpdateBanner() {
  const { available, version, body, downloading, error, downloadAndInstall, dismiss } = useAppUpdate();

  if (!isTauri() || !available) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[300] flex justify-center p-3 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-4 bg-[#1e1f22] border border-[#23a559]/50 rounded-xl shadow-xl px-4 py-3 max-w-md w-full">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">
            Yeni sürüm: v{version}
          </p>
          {body && (
            <p className="text-zinc-400 text-xs mt-0.5 line-clamp-2">{body}</p>
          )}
          {error && (
            <p className="text-red-400 text-xs mt-0.5">{error}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => downloadAndInstall()}
            disabled={downloading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#23a559] hover:bg-[#1f9651] text-white text-sm font-medium disabled:opacity-70"
          >
            {downloading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                İndiriliyor…
              </>
            ) : (
              <>
                <Download size={16} />
                Güncelle
              </>
            )}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
