# Test Nasıl Çalıştırılır?

## 1. Otomatik E2E testleri (Playwright)

Ben (asistan) veya sen terminalden çalıştırabilirsin.

### Kurulum (bir kez)
```bash
npm install
npx playwright install chromium
```

### Çalıştırma
```bash
npm run test:e2e
```
Bu komut:
- `npm run dev` ile uygulamayı başlatır (veya zaten 5173’te çalışıyorsa onu kullanır)
- Tarayıcıda `/` açar
- Smoke testleri çalıştırır: sayfa yükleniyor mu, “OxideSpace” ve giriş formu görünüyor mu?

### Giriş yapan test (isteğe bağlı)
Gerçek giriş yapıp ana arayüzün açıldığını test etmek için ortam değişkenleri ver:
```bash
# Windows (PowerShell)
$env:E2E_TEST_EMAIL="test@example.com"; $env:E2E_TEST_PASSWORD="sifre123"; npm run test:e2e

# Windows (CMD)
set E2E_TEST_EMAIL=test@example.com
set E2E_TEST_PASSWORD=sifre123
npm run test:e2e
```
Supabase’de bu hesabın gerçekten var olması gerekir.

---

## 2. Manuel test (Bölüm 3 A–G)

Bunları **sen** uygulama üzerinde elle yapmalısın; tam otomasyonu Supabase/LiveKit ve gerçek hesaplar olmadan vermek zor.

### Ne yapmalısın?
1. `npm run dev` ile uygulamayı çalıştır.
2. `UYGULAMA_PLANI_VE_TEST.md` içindeki **Bölüm 3** listesini aç (A. Auth – G. Hata).
3. Her maddeyi sırayla dene:
   - **A.** Giriş/kayıt/çıkış
   - **B.** Sunucu oluştur, davet kodu, kanal ekle/sil, sıralama
   - **C.** Mesaj gönder/sil/düzenle, uzun mesaj engeli
   - **D.** DM listesi, DM mesajı, kanal ↔ DM geçişi
   - **E.** Ses kanalına gir, mikrofon/kamera/ekran
   - **F.** Ayarlar, profil, aygıt seçimi
   - **G.** Hata: geçersiz davet, ağ kesintisi vb.
4. Çalışmayan veya eksik gördüğün yeri not et; düzeltme için bu listeyi kullan.

### Ben (asistan) ne yapabilirim?
- **E2E:** `npm run test:e2e` komutunu senin ortamında çalıştıramam (Playwright kurulumu ve tarayıcı gerekir), ama projeye test dosyalarını ekledim; sen `npm run test:e2e` diyerek smoke testleri çalıştırabilirsin.
- **Manuel:** Sen uygulamayı açıp adım adım denerken, “şu adımda şu hata çıktı” dersen, o hatayı koda bakıp düzeltebilirim.
- **Genişletme:** İstersen yeni E2E senaryoları (örn. sunucu oluşturma, kanal seçme) ekleyebilirim; yine çalıştırmak senin ortamında olur.

---

## Özet
| Ne | Kim yapar | Komut / aksiyon |
|----|-----------|------------------|
| Smoke (sayfa + giriş formu) | Sen veya CI | `npm run test:e2e` |
| Giriş sonrası otomatik test | Sen (env ile) | `E2E_TEST_EMAIL=... E2E_TEST_PASSWORD=... npm run test:e2e` |
| Tüm A–G akışları | Sen | Manuel: plan dokümanı Bölüm 3’ü takip et |
