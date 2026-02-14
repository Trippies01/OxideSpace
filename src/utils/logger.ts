/**
 * Production'da console çıktısı olmasın; sadece dev'de log/error/warn kullan.
 */
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

export const logger = {
  log: (...args: unknown[]) => { if (isDev) console.log(...args); },
  error: (...args: unknown[]) => { if (isDev) console.error(...args); },
  warn: (...args: unknown[]) => { if (isDev) console.warn(...args); },
  debug: (...args: unknown[]) => { if (isDev) console.debug(...args); },
};
