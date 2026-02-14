# Voice Channel UI (Discord-style)

Design system colors are in `tailwind.config.js` under `theme.extend.colors.discord`.

## Quick preview

Render the assembled page anywhere (e.g. in `App.tsx` for a dev route):

```tsx
import { VoiceChannelPage } from './components/voice-channel';

// Use as a full-page view:
<VoiceChannelPage />
```

## Layout

- **1 participant:** Centered single tile.
- **2 participants:** Stacked vertically on mobile, side-by-side on desktop.
- **3+ participants:** Responsive grid (1 → 2 → 3 columns).

## Wire to real data

Replace `VoiceChannelPage` usage with `VoiceRoomContainer` and pass:

- `participants` — from your LiveKit/context (map to `{ id, name, avatar, isSpeaking }`).
- `channelName` — current voice channel name.
- Control bar callbacks — connect to `livekitService` (mic, video, deafen, screen share, disconnect).

Your existing `VoiceChannelControls` can be refactored to use these building blocks and the same design tokens.
