import React, { useState } from 'react';
import { VoiceRoomContainer } from './VoiceRoomContainer';

/**
 * Ses kanalı sayfası — katılımcılar gerçekte LiveKit/context'ten gelir.
 * Bu sayfa standalone kullanımda boş katılımcı listesi ile "Henüz kimse yok" gösterir.
 */
export const VoiceChannelPage: React.FC = () => {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [screenShareOn, setScreenShareOn] = useState(false);

  return (
    <VoiceRoomContainer
      channelName="Ses Kanalı"
      participants={[]}
      onInvite={() => window.alert('Sesli Sohbete Davet et — yakında')}
      onActivity={() => window.alert('Aktivite Seç — yakında')}
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
  );
};
