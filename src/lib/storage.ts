import { supabase } from './supabase';
import { MESSAGE_ATTACHMENTS_BUCKET, AVATARS_BUCKET } from '../constants';

/**
 * Mesaj eki (resim/dosya) yükler; public URL döndürür.
 * Bucket: message-attachments — Supabase Dashboard > Storage > New bucket "message-attachments",
 * public seçeneği işaretlenmeli (veya RLS ile okuma izni verilmeli).
 */
export async function uploadMessageAttachment(
  file: File,
  userId: string,
  channelOrThreadId: string
): Promise<string> {
  const ext = file.name.split('.').pop() || 'bin';
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80);
  const path = `${userId}/${channelOrThreadId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(MESSAGE_ATTACHMENTS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(MESSAGE_ATTACHMENTS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Profil resmi yükler; public URL döndürür.
 * Bucket: avatars — Supabase Dashboard > Storage > New bucket "avatars", public.
 * Yol: {userId}/avatar.{ext}
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const safeExt = ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'jpg';
  const path = `${userId}/avatar.${safeExt}`;

  const { error } = await supabase.storage.from(AVATARS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
