import React, { useState, useCallback, useRef } from 'react';
import { VoiceRoomContainer } from './VoiceRoomContainer';

const PLACEHOLDER_MESSAGE = 'Bu özellik yakında eklenecek.';

/**
 * Ses kanalı sayfası — katılımcılar gerçekte LiveKit/context'ten gelir.
 * Bu sayfa standalone kullanımda boş katılımcı listesi ile "Henüz kimse yok" gösterir.
 */
export const VoiceChannelPage: React.FC = () => {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [screenShareOn, setScreenShareOn] = useState(false);
  const [placeholderToast, setPlaceholderToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showPlaceholder = useCallback((message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setPlaceholderToast(message);
    toastTimeoutRef.current = setTimeout(() => {
      setPlaceholderToast(null);
      toastTimeoutRef.current = null;
    }, 3000);
  }, []);

  return (
    <>
      {placeholderToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#18181b] border border-white/10 text-zinc-200 text-sm shadow-xl animate-in fade-in duration-200">
          {placeholderToast}
        </div>
      )}
      <VoiceRoomContainer
        channelName="Ses Kanalı"
        participants={[]}
        onInvite={() => showPlaceholder(PLACEHOLDER_MESSAGE)}
        onActivity={() => showPlaceholder(PLACEHOLDER_MESSAGE)}
      micOn={micOn}
      videoOn={videoOn}
      deafened={deafened}
      screenShareOn={screenShareOn}
      onMicToggle={() => setMicOn((v) => !v)}
      onVideoToggle={() => setVideoOn((v) => !v)}
      onDeafenToggle={() => setDeafened((v) => !v)}
      onScreenShareToggle={() => setScreenShareOn((v) => !v)}
      onDisconnect={() => window.alert('Ses kanalından ayrıldın')}
      />
    </>
  );
};
