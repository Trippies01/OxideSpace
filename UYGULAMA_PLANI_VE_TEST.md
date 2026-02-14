# OxideSpace – Uygulama Geliştirme Planı ve Test Listesi

**Tarih:** Güncel  
**Hedef:** Düzgün çalışmayanları düzeltmek, eksikleri tamamlamak, adım adım test ederek ilerlemek.

---

## Bölüm 1: Mevcut Durum Özeti

### ✅ Şu an çalışanlar
- Giriş / kayıt (Supabase Auth)
- Sunucu oluşturma, listeleme, davet kodu ile katılma
- Kanal oluşturma, listeleme, silme
- Metin kanalında mesajlaşma (sunucu kanalları)
- DM (arkadaş listesi, thread, mesaj gönderme/silme)
- Ses kanalına katılma (LiveKit), mikrofon/kamera/ekran paylaşımı
- Kamera/mikrofon sadece ses kanalı veya ayarlar açıkken yükleniyor (açılışta açılmıyor)
- Context API (Server, Voice, UI, User, Message)
- Toast, modaller, ayarlar sayfası iskeleti

### ❌ Düzgün çalışmayan veya eksik (kısa liste)
- Mesajlar: DM ile kanal mesajları farklı akışta; kanal değişince/DM seçilince bazen karışabiliyor
- Loading: Mesaj/sunucu/kanal/ses kanalı yüklenirken net loading göstergesi yok
- Hata yönetimi: Birçok yerde sadece console; kullanıcıya anlamlı mesaj/toast yok
- Input doğrulama: Mesaj uzunluğu, XSS, sunucu/kanal adı kuralları eksik
- Emoji picker: ~~Placeholder, çalışmıyor~~ (Faz 2.4 ile düzeltildi)
- Mesaj düzenleme: Yok
- Mesaj/kanal arama: Yok
- Typing indicator / çevrimiçi durum real-time: Yok
- Dosya/resim paylaşımı: Yok
- App.tsx hâlâ büyük (~2400 satır), bazı `any` kullanımları var

---

## Bölüm 2: Adım Adım Yapılacaklar (Öncelik Sırasıyla)

### FAZ 1 – Kritik: Düzgün Çalışma ve Temel UX (Önce bunlar)

| # | Görev | Açıklama | Test kriteri |
|---|--------|----------|----------------|
| 1.1 | **DM vs Kanal mesaj senkronu** | MessageContext sadece kanal mesajları için; DM’de `currentMessages` App’te. Kanal ↔ DM geçişinde doğru liste gösterilsin, boş/yanlış mesaj kalmasın. | Kanal seç → mesajlar gelir. DM seç → DM mesajları gelir. Tekrar kanal seç → kanal mesajları doğru. |
| 1.2 | **Loading göstergeleri** | Mesaj listesi, sunucu listesi, kanal listesi, ses kanalına katılırken en azından spinner/skeleton. | Her bu veri yüklenirken görsel loading görünür. |
| 1.3 | **Hata mesajları (toast)** | Tüm kritik async işlemlerde (mesaj gönder/ sil, sunucu/kanal oluştur, ses kanalı, davet) hata yakala ve kullanıcıya toast ile göster. | Hata tetiklenince toast çıkar, konsol tek başına kalmış olmaz. |
| 1.4 | **Input validation** | Mesaj: max uzunluk (örn. 2000), trim. Sunucu/kanal adı: min/max karakter, izin verilen karakterler. | Uzun/boş mesaj gönderilmez; geçersiz sunucu/kanal adı kabul edilmez. |
| 1.5 | **XSS / mesaj güvenliği** | Mesaj içeriğini göstermede escape veya DOMPurify; link’ler için güvenli politika. | Script/HTML enjekte edilmiş mesaj çalıştırmaz. |

### FAZ 2 – Önemli: Eksik Özellikler ve Tutarlılık

| # | Görev | Açıklama | Test kriteri |
|---|--------|----------|----------------|
| 2.1 | **Mesaj silme (kanal)** | Kanal mesajı silme UI’dan tetiklenince Supabase’de de silinsin, liste anında güncellensin. | Sil → listeden kaybolur, sayfa yenilenmeden. |
| 2.2 | **Mesaj düzenleme** | Son mesajını düzenleme (tek satır veya modal), DB güncellemesi + real-time. | Düzenle → kaydet → herkes güncel içeriği görür. |
| 2.3 | **Boş durumlar (empty state)** | Boş kanal, boş DM listesi, arkadaş yok, mesaj yok için kısa metin + (isteğe) aksiyon butonu. | Hiç veri yokken anlamlı metin ve CTA görünür. |
| 2.4 | **Emoji picker** | Mesaj girişine basit bir emoji seçici ekle (native veya küçük kütüphane). | Tıklayınca emoji listesi açılır, seçilen metne eklenir. |
| 2.5 | **TypeScript `any` azaltma** | Özellikle props ve event handler’larda `any` yerine doğru tipler. | Kritik bileşenlerde any kalkar, build temiz. |

### FAZ 3 – İyileştirme: Real-time ve UX

| # | Görev | Açıklama | Test kriteri |
|---|--------|----------|----------------|
| 3.1 | **Typing indicator** | Supabase realtime ile “X yazıyor…” (kanal/DM). | Bir kullanıcı yazarken diğer tarafta kısa süre görünür. |
| 3.2 | **Çevrimiçi durum** | Profil/sunucu üyesi listesinde online/offline (realtime veya periyodik). | Durum değişince kısa sürede güncellenir. |
| 3.3 | **Mesaj arama** | Kanal veya DM’de metin araması (client veya Supabase full-text). | Arama metniyle eşleşen mesajlar listelenir. |
| 3.4 | **Kanal arama / filtre** | Sidebar’da kanal listesinde arama veya filtre. | Yazınca listelenen kanallar daralır. |
| 3.5 | **Dosya/resim paylaşımı** | Mesajla resim veya dosya (Supabase Storage), önizleme. | Yükle → mesajda link/thumbnail görünür, açılır. |

### FAZ 4 – Kod Kalitesi ve Sürdürülebilirlik

| # | Görev | Açıklama | Test kriteri |
|---|--------|----------|----------------|
| 4.1 | **App.tsx küçültme** | Büyük blokları ayrı bileşenlere/hook’lara taşı (ayarlar, modaller, formlar). | App.tsx satır sayısı belirgin azalır, mantık grupları ayrı dosyalarda. |
| 4.2 | **Constants** | Magic string/sayıları (max mesaj uzunluğu, limitler, route/key isimleri) constants dosyasına al. | Değişiklik tek yerden yapılabilir. |
| 4.3 | **Performans** | Gereksiz re-render’ları azalt (React.memo, useMemo, useCallback); gerekirse mesaj listesinde virtual scroll. | Uzun mesaj listesinde scroll akıcı, gereksiz render azalır. |
| 4.4 | **Production log’lar** | `console.log` / `console.error` sadece dev’de veya log servisi ile. | Production build’de gereksiz log çıkmaz. |

---

## Bölüm 3: Detaylı Test Listesi (Her Faz Sonrası Çalıştırılacak)

### A. Auth ve Giriş
- [ ] Sayfa açılınca sadece loading (veya login) görünür; kamera/mikrofon açılmaz.
- [ ] Geçersiz Supabase/network’te 8 sn sonra login ekranı gelir.
- [ ] Email/şifre ile giriş: başarılı girişte ana arayüz açılır.
- [ ] Kayıt: kullanıcı adı + email + şifre ile kayıt olunur, giriş yapılır.
- [ ] Çıkış: çıkış sonrası login ekranına dönülür.

### B. Sunucu ve Kanallar
- [ ] Sunucu oluştur: isim + (opsiyonel) ikon; oluşturulunca listede görünür.
- [ ] Davet kodu: geçerli kodla sunucuya katılma; listede yeni sunucu görünür.
- [ ] Kanal oluştur: metin/ses, isim, kategori; listede kanal görünür.
- [ ] Kanal silme: yetkili kullanıcı silebilir; silinince listeden kalkar, aktif kanal silindiyse chat alanı boş/uyarı.
- [ ] Kanal sıralama (sürükle-bırak): sıra kaydedilir veya en azından UI’da değişir (backend destekliyorsa kalıcı).

### C. Metin Kanalları ve Mesajlar
- [ ] Kanal seçilince o kanala ait mesajlar yüklenir (loading sonrası).
- [ ] Mesaj gönder: metin yazıp gönder; anında listede görünür.
- [ ] Uzun/boş mesaj: validation ile engellenir veya hata mesajı gösterilir.
- [ ] Başka kullanıcı mesajı: real-time veya yenileme ile görünür.
- [ ] Mesaj silme (kanal): silinen mesaj listeden kaybolur.
- [ ] (Faz 2 sonrası) Mesaj düzenleme: güncellenen içerik herkeste güncel görünür.

### D. DM (Direct Message)
- [ ] Arkadaş ekle: kullanıcı adı/email ile eklenir; DM listesinde görünür.
- [ ] DM thread seçilince o konuşmanın mesajları yüklenir.
- [ ] DM’de mesaj gönder: anında görünür.
- [ ] DM’de mesaj silme: mesaj listeden kalkar.
- [ ] Kanal ↔ DM geçişi: her seferinde doğru mesaj listesi gösterilir (karışmaz).

### E. Ses Kanalları (LiveKit)
- [ ] Ses kanalına tıklanınca katılım isteği/izin; katılınca ses arayüzü açılır.
- [ ] Mikrofon aç/kapa: durum UI’da ve (varsa) diğer kullanıcıda doğru yansır.
- [ ] Kamera aç: sadece bu noktada kamera açılır; görüntü görünür.
- [ ] Ekran paylaşımı: paylaşım başlar/bitir; diğer tarafta görüntü gelir/gider.
- [ ] Kanaldan ayrıl: ayrılınca odadan çıkılır, liste güncellenir.
- [ ] Aygıt listesi: sadece ayarlar veya ses kanalındayken yüklenir; açılışta kamera/mikrofon açılmaz.

### F. Ayarlar ve Profil
- [ ] Ayarlar modalı açılır; sekme geçişleri çalışır.
- [ ] Ses/video aygıtları: ayarlar veya ses kanalındayken listelenir; seçim değişince (varsa) LiveKit’e yansır.
- [ ] Mikrofon testi: test çubuğu veya seviye gösterimi çalışır.
- [ ] Kamera önizleme: sadece “Kamera önizleme” açıldığında kamera açılır.
- [ ] Profil bilgisi: görünen isim/avatar (varsa) doğru.

### G. Hata ve Edge Case
- [ ] Sunucu/kanal oluşturma hata (örn. ağ kesintisi): kullanıcıya toast ile bilgi verilir.
- [ ] Mesaj gönderirken hata: toast + mesaj alanı temizlenmez veya uygun şekilde geri alınır.
- [ ] Geçersiz davet kodu: anlamlı hata mesajı.
- [ ] Ses kanalı token/bağlantı hatası: kullanıcıya mesaj gösterilir.

---

## Bölüm 4: İlerleme Takibi (Checklist)

### Faz 1 – Kritik
- [x] 1.1 DM vs Kanal mesaj senkronu
- [x] 1.2 Loading göstergeleri
- [x] 1.3 Hata mesajları (toast)
- [x] 1.4 Input validation
- [x] 1.5 XSS / mesaj güvenliği  
**Faz 1 tamamlandığında:** Bölüm 3 test listesinin A–G maddelerini tekrar çalıştır.

### Faz 2 – Önemli
- [x] 2.1 Mesaj silme (kanal)
- [x] 2.2 Mesaj düzenleme
- [x] 2.3 Boş durumlar (mevcut empty state kullanılıyor)
- [x] 2.4 Emoji picker (basit emoji listesi)
- [x] 2.5 TypeScript any azaltma (navbar/sunucu listesi Server tipi; davet katılma hata tipleri)  
**Faz 2 sonrası:** Özellik testleri (mesaj düzenleme, emoji, boş durumlar) eklenerek listeyi güncelle.

### Faz 3 – İyileştirme
- [x] 3.1 Typing indicator
- [x] 3.2 Çevrimiçi durum
- [x] 3.3 Mesaj arama
- [x] 3.4 Kanal arama / filtre (header arama kutusu + Sidebar’da zaten filtrelenmiş liste)
- [x] 3.5 Dosya/resim paylaşımı (Supabase Storage, önizleme)

### Faz 4 – Kod Kalitesi
- [ ] 4.1 App.tsx küçültme
- [x] 4.2 Constants (AUTH_CHECK_TIMEOUT_MS eklendi)
- [ ] 4.3 Performans
- [x] 4.4 Production log’lar

---

## Bölüm 5: Teknik Notlar (Geliştirici İçin)

- **Mesaj akışı:** Kanal mesajları `MessageContext` + `useMessages(activeChannelId)`; DM mesajları App’te `currentMessages` + `fetchDmMessages(threadId)`. Kanal/DM geçişinde hangi kaynağın kullanıldığı net olmalı (Faz 1.1).
- **Veritabanı:** Supabase (PostgreSQL). Tablolar: `profiles`, `servers`, `channels`, `messages`, `dm_threads`, `dm_messages`, `voice_states`, `server_members`, `server_invites` vb.
- **Realtime:** Supabase Realtime (mesajlar, voice_states); LiveKit (ses/video).
- **Dosya paylaşımı (Faz 3.5):** Supabase Storage bucket `message-attachments` kullanılır. Dashboard > Storage > New bucket `message-attachments` oluşturulup public yapılmalı. Mesaj içeriğinde `[IMG:url]` ve `[FILE:url]` formatı ile saklanır; ChatArea bu formatı parse edip resim önizlemesi ve dosya linki gösterir.

---

**Son güncelleme:** Davet kodu katılma RPC’siz (server_invites + server_members) yapıldı; emoji picker dışarı tıklayınca kapanıyor; navbar’da Server tipi kullanılıyor; kanal silinince aktif kanal silindiyse ilk metin kanalına geçiliyor.  
**Sıradaki adım:** Faz 4.1 (App.tsx küçültme) ve 4.3 (Performans) isteğe bağlı; test listesinin A–G maddeleri ile manuel test.

---

## Bölüm 6: Şu Anki Durum ve Öncelikler (Kısa Özet)

### Çalışan / Tamamlanan
- Faz 1–3 plan maddeleri işaretli (mesaj senkronu, loading, toast, validation, XSS, silme/düzenleme, emoji, boş durumlar, typing, çevrimiçi, arama, dosya paylaşımı).
- Faz 4'ten 4.2 ve 4.4 tamamlandı (constants, production log'lar).

### Eksik veya Dikkat Edilmesi Gerekenler
| Konu | Durum | Öneri |
|------|--------|--------|
| **Kanal sıralama (sürükle-bırak)** | Tamamlandı: `channels.position` kolonu eklendi; sürükle-bırak sonrası sıra DB'ye yazılıyor ve kalıcı. | — |
| **Faz 4.1 – App.tsx küçültme** | Yapılmadı. | Handler'lar ve modaller ayrı hook/component'lere taşınabilir. |
| **Faz 4.3 – Performans** | Yapılmadı. | Gereksiz re-render (memo/useCallback) ve uzun mesaj listesinde virtual scroll değerlendirilebilir. |
| **ServerContext tipleri** | `dbServers` / `dbChannels` hâlâ `any[]`. | `Server[]` ve `Channel[]` yapılabilir. |
| **Manuel test** | A–G maddeleri tam çalıştırılmamış olabilir. | Özellikle mesaj gönder/sil/düzenle, davet, ses kanalı, hata senaryoları denenmeli. |

### Önerilen Sıra
1. **Manuel test:** Bölüm 3 (A–G) listesini uygulama üzerinde çalıştır; bozuk/eksik akışları not et.
2. **İsteğe bağlı:** Faz 4.1 (App.tsx bölme) ve 4.3 (performans).
3. **İsteğe bağlı:** ServerContext'te `dbServers`/`dbChannels` için doğru tipler.

---

## Bölüm 7: Kritik Yapılacaklar ve Bitiş Tahmini

### Şu an kritik (yapılması gereken)
| Öncelik | Ne | Neden |
|--------|-----|--------|
| **1** | **Manuel test (Bölüm 3 A–G)** | Plan maddeleri işaretli ama uygulama gerçekte her akışı doğru mu bilinmiyor. Giriş, sunucu/kanal CRUD, mesaj gönder/sil/düzenle, DM, davet, ses kanalı, ayarlar, hata senaryoları tek tek denenmeli. Bulunan hatalar düzeltilmeli. |
| **2** | **Test sırasında çıkan hatalar** | Testte kırılan akışlar (örn. davet kodu, DM geçişi, ses token hatası) kritik; biri yapılıp diğeri yapılmazsa proje “bitmiş” sayılmaz. |

### Kritik değil (isteğe bağlı / sonra)
- **Faz 4.1 (App.tsx küçültme):** Bakım kolaylığı; uygulama çalışıyorsa “proje bitti” için zorunlu değil.
- **Faz 4.3 (Performans):** Büyük mesaj listesi / ağır kullanım yoksa ertelenebilir.
- **ServerContext tipleri:** Tip güvenliği; çalışmayı bozmaz.

### Projeyi ne zaman bitirebiliriz?
| “Bitti” tanımı | Tahmini süre (tek kişi, yarı zamanlı) |
|----------------|----------------------------------------|
| **MVP: Kullanıcı giriş yapıp sunucu/kanal/mesaj/ses kullanabiliyor** | Plan maddeleri tamamlandığı için **zaten bu aşamada**. Bitiş: **Manuel test (A–G) yapılıp çıkan kritik hatalar giderildiğinde** — kabaca **1–3 gün** (test + düzeltmeler). |
| **Tam bitiş: Test temiz + kod sade (4.1) + performans (4.3)** | +**3–7 gün** (App bölme, optimizasyon, tekrar test). |

**Özet:** Kritik olan şu an **test etmek ve testten çıkan hataları düzeltmek**. Onlar bittikten sonra proje “kullanılabilir” anlamda biter. 4.1 ve 4.3 ise “temiz ve sürdürülebilir” bitiş için ek süre.

---

## Bölüm 8: Test Nasıl Yapılır?

### Otomatik (E2E – Playwright)
- **Kurulum (bir kez):** `npm install` ve `npx playwright install chromium`
- **Çalıştırma:** `npm run test:e2e`
- Smoke testleri: sayfa yüklenir, "OxideSpace" ve giriş formu görünür (3 test geçti).
- **Giriş sonrası (isteğe bağlı):** `E2E_TEST_EMAIL` ve `E2E_TEST_PASSWORD` ile giriş testi (Supabase hesabı gerekli).

### Manuel (Bölüm 3 A–G)
- `npm run dev` ile uygulamayı aç; Bölüm 3 listesini (A–G) sırayla elle dene; bozuk maddeleri not et.

### Detay
- **tests/TEST_NASIL_CALISTIRILIR.md** – Komutlar ve rehber.
