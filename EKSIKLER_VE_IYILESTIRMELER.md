# OxideSpace – Eksik Özellikler ve Yapılması Gereken İyileştirmeler

Bu belge, uygulamada şu an eksik veya tam çalışmayan özellikleri ve geliştirilmesi gereken alanları tek yerde toplar.

**Son güncelleme:** Bildirimler (DB + RLS + istemci), ses kanalı davet/aktivite placeholder, profil katılım/aktivite metinleri ve etiket notu uygulandı.

---

## 1. Eksik / Tam Çalışmayan Özellikler

### Bildirimler (tamamlandı)
- **Durum:** Supabase `notifications` tablosu, RLS, Realtime aboneliği ve istemci listesi/okundu işaretleme eklendi. Arkadaşlık isteği geldiğinde trigger ile bildirim oluşturuluyor.
- **Konum:** `src/App.tsx`, migration: `create_notifications_table`, `notifications_trigger_friend_request`.

### Ses Kanalı – Davet ve Aktivite (placeholder tamamlandı)
- **Durum:** `window.alert` kaldırıldı; tıklanınca ekranda kısa süreli "Bu özellik yakında eklenecek" toast gösteriliyor.
- **Konum:** `src/components/voice-channel/VoiceChannelPage.tsx`. Gerçek davet/aktivite akışı ileride eklenebilir.

### Profil – Katılım Tarihi (tamamlandı)
- **Durum:** Auth `user.created_at` zaten gösteriliyor; tarih yoksa "—" gösteriliyor.
- **Konum:** `src/App.tsx` (profil modalı).

### Profil – Aktivite (Üye Kartı) (metin güncellendi)
- **Durum:** Placeholder metni "Müzik, oyun veya uygulama durumu henüz paylaşılmadı" olarak değiştirildi.
- **Konum:** `src/App.tsx` (üye profili / aktivite alanı). Gerçek aktivite verisi ileride eklenebilir.

### Etiket (Discriminator) (metin güncellendi)
- **Durum:** Not "Etiket (#1234) otomatik atanır; ileride Premium ile özelleştirilebilecek." olarak güncellendi.
- **Konum:** `src/components/UsernameSetup.tsx`.

---

## 2. Yapılması Gereken İyileştirmeler

### Supabase Güvenlik
- **dm_threads_insert RLS:** `dm_threads` tablosunda `authenticated` için `WITH CHECK (true)` kullanılıyor; çok permissif. Sadece ilgili kullanıcıların thread oluşturmasına izin verecek şekilde sıkılaştırılmalı.
- **Fonksiyon uyarıları:** `set_updated_at` ve `add_owner_as_member` için "function search_path mutable" uyarısı var; search_path sabitlenmeli veya güvenli hale getirilmeli.
- **İsteğe bağlı:** Auth tarafında "Leaked password protection" (HaveIBeenPwned) açılabilir.

### Bildirim Altyapısı
- Sunucu tarafı bildirim kaydı (yeni mesaj, davet, mention vb.).
- İstemcide bildirim listesi, okundu işareti ve bildirim tercihleri sayfası.

### Mobil / Responsive Deneyim
- Viewport tanımlı (`index.html`) ancak layout büyük ölçüde masaüstüne göre.
- **Yapılacak:** Küçük ekranlarda (örn. &lt;768px) sidebar (hamburger/drawer), kanal listesi, sohbet alanı ve modallerin mobil düzeni; dokunmatik dostu buton boyutları; ses kanalı arayüzünde mobil layout.

### PWA ve Kurulabilirlik
- Web manifest ve service worker yok; "Ana ekrana ekle" ve temel offline/cache yok.
- **Yapılacak:** `manifest.json`, service worker (Vite PWA plugin veya manuel), uygun ikonlar ve theme_color; gerekirse push bildirim altyapısı.

### iOS / Mobil Cihaz Desteği
- Uygulama şu an web ve masaüstü (Tauri/Windows) için yapıldı.
- **Önerilen sıra:** Önce responsive + dokunmatik, sonra PWA (Safari’de "Ana ekrana ekle"); App Store istenirse Capacitor ile aynı React codebase’i iOS uygulaması olarak sarmak.

---

## 3. Özet Tablo

| Öncelik | Konu | Kısa Açıklama |
|--------|------|----------------|
| Yüksek | Bildirimler | DB + RLS + istemci listesi ve tercihler |
| Yüksek | Ses kanalı davet/aktivite | "Yakında" alert’leri yerine gerçek akış veya metin kaldırma |
| Orta | Profil katılım tarihi | Auth `created_at` gösterimi |
| Orta | Profil aktivite | Aktivite alanı veya placeholder kaldırma |
| Orta | RLS / fonksiyon güvenliği | dm_threads, search_path, isteğe bağlı leaked-password |
| Orta | Responsive / mobil | Sidebar, modaller, touch-friendly UI |
| Düşük | PWA | Manifest, service worker, installable |
| İsteğe bağlı | iOS uygulaması | Capacitor ile App Store |

Bu belge proje kökünde güncel tutulabilir; yeni eksik veya iyileştirme eklendiğinde bu dosyaya madde eklenmesi önerilir.
