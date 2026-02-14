// Uygulama genelinde kullanılan sabitler

export const MESSAGE_MAX_LENGTH = 2000;
export const SERVER_NAME_MIN_LENGTH = 2;
export const SERVER_NAME_MAX_LENGTH = 100;
export const CHANNEL_NAME_MIN_LENGTH = 1;
export const CHANNEL_NAME_MAX_LENGTH = 100;
export const USERNAME_MAX_LENGTH = 32;

// Dosya / resim paylaşımı
export const MAX_ATTACHMENT_SIZE_MB = 10;
export const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
export const MESSAGE_ATTACHMENTS_BUCKET = 'message-attachments';
export const AVATARS_BUCKET = 'avatars';
export const MAX_AVATAR_SIZE_MB = 2;
export const MAX_AVATAR_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

// Zaman aşımı / süreler (ms)
export const AUTH_CHECK_TIMEOUT_MS = 8000;

// Giriş / güvenlik
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
