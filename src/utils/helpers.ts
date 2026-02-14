export const normalizeStatus = (status?: string): "online" | "idle" | "dnd" | "invisible" | undefined => {
    if (status === 'online' || status === 'idle' || status === 'dnd' || status === 'invisible') {
        return status;
    }
    return undefined;
};

/** XSS: Mesaj içeriğini güvenli göstermek için HTML escape */
export function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/** Mesaj içeriğindeki [IMG:url] ve [FILE:url] eklerini parse eder */
export function parseMessageContent(content: string): {
  text: string;
  imageUrls: string[];
  fileUrls: string[];
} {
  const imageUrls: string[] = [];
  const fileUrls: string[] = [];
  let text = content;

  text = text.replace(/\[IMG:(https?:\/\/[^\]]+)\]/g, (_, url) => {
    imageUrls.push(url);
    return '';
  });
  text = text.replace(/\[FILE:(https?:\/\/[^\]]+)\]/g, (_, url) => {
    fileUrls.push(url);
    return '';
  });

  text = text.replace(/\n{2,}/g, '\n').trim();
  return { text, imageUrls, fileUrls };
}

/** URL'nin dosya adı kısmı (güvenli gösterim için) */
export function getFileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const name = path.split('/').pop() || 'Dosya';
    return decodeURIComponent(name).slice(0, 60) || 'Dosya';
  } catch {
    return 'Dosya';
  }
}
