# Supabase Edge Functions

Bu klasör Supabase Edge Functions içerir.

## LiveKit Token Function

`livekit-token` fonksiyonu LiveKit için JWT token oluşturur.

### Kurulum

1. Supabase CLI'yi yükleyin:
```bash
npm install -g supabase
```

2. Supabase projenize bağlanın:
```bash
supabase login
supabase link --project-ref your-project-ref
```

3. Environment variables ekleyin (Supabase Dashboard > Project Settings > Edge Functions):
   - `LIVEKIT_URL`: LiveKit server URL (örn: `wss://your-livekit-server.com`)
   - `LIVEKIT_API_KEY`: LiveKit API Key
   - `LIVEKIT_API_SECRET`: LiveKit API Secret

4. Function'ı deploy edin:
```bash
supabase functions deploy livekit-token
```

### Kullanım

Function'ı frontend'den çağırmak için:

```typescript
const { data, error } = await supabase.functions.invoke('livekit-token', {
  body: {
    userId: 'user-123',
    roomName: 'room-456',
    userName: 'John Doe', // Opsiyonel
  },
});

if (data) {
  const token = data.token;
  // Token'ı LiveKit ile kullan
}
```

### Test

Function'ı lokal olarak test etmek için:

```bash
supabase functions serve livekit-token
```

Ardından:

```bash
curl -X POST http://localhost:54321/functions/v1/livekit-token \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","roomName":"test-room"}'
```



