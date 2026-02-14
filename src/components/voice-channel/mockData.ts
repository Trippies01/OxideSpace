/**
 * Ses kanalı katılımcı tipi (VoiceRoomContainer / ParticipantGrid).
 * Gerçek veri LiveKit/context'ten gelir; mock veri kaldırıldı.
 */
export interface MockParticipant {
  id: string;
  name: string;
  avatar: string;
  isSpeaking: boolean;
}
