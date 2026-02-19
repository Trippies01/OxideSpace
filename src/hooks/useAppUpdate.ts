import { useState, useEffect } from 'react';

/** Tauri ortamında mı çalışıyoruz (masaüstü uygulama) - v1/v2 uyumlu */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as { __TAURI__?: unknown; __TAURI_INTERNALS__?: unknown };
  return !!(w.__TAURI__ ?? w.__TAURI_INTERNALS__);
}

export interface AppUpdateState {
  checking: boolean;
  available: boolean;
  version: string | null;
  body: string | null;
  error: string | null;
  downloading: boolean;
}

export function useAppUpdate() {
  const [state, setState] = useState<AppUpdateState>({
    checking: false,
    available: false,
    version: null,
    body: null,
    error: null,
    downloading: false,
  });

  useEffect(() => {
    if (!isTauri()) return;

    let cancelled = false;

    async function checkUpdate() {
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        setState((s) => ({ ...s, checking: true, error: null }));
        const update = await check();
        if (cancelled) return;
        if (update) {
          setState({
            checking: false,
            available: true,
            version: update.version,
            body: update.body ?? null,
            error: null,
            downloading: false,
          });
        } else {
          setState((s) => ({ ...s, checking: false, available: false }));
        }
      } catch (e) {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          checking: false,
          error: e instanceof Error ? e.message : String(e),
        }));
      }
    }

    checkUpdate();
    return () => {
      cancelled = true;
    };
  }, []);

  const downloadAndInstall = async (): Promise<boolean> => {
    if (!state.available || !isTauri()) return false;
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (!update) return false;
      setState((s) => ({ ...s, downloading: true }));
      await update.downloadAndInstall();
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
      return true;
    } catch (e) {
      setState((s) => ({
        ...s,
        downloading: false,
        error: e instanceof Error ? e.message : String(e),
      }));
      return false;
    }
  };

  const dismiss = () => {
    setState((s) => ({ ...s, available: false, version: null, body: null }));
  };

  return { ...state, downloadAndInstall, dismiss };
}
