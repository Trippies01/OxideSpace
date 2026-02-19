# OxideSpace – Canvas Kanalı

OxideSpace’de **Tasarım / Canvas** kanalları ortak beyaz tahta olarak çalışır. Link veya harici URL yok; kanal açıldığında doğrudan canvas gelir.

---

## Nasıl çalışır

- **Canvas kanalı oluşturma**: Bir sunucuda “Yeni Frekans Oluştur” → “Tasarım / Canvas” seçin, kanal adı ve kategori verin → Oluştur.
- **Kanal açıldığında**: Ortak beyaz tahta (Excalidraw) hemen yüklenir. Link girişi veya Penpot URL’i yok.
- **Ortak çalışma**: Aynı kanaldaki herkes aynı canvas’ı anlık görür (Supabase Realtime). Çizimler otomatik kaydedilir.

## Teknik

- Veri `channels.canvas_data` içinde saklanır.
- Gerçek zamanlı senkronizasyon için Supabase Realtime `canvas:{channelId}` kanalı kullanılır.
