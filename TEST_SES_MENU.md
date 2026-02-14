# Ses Menüsü ve Ses Kanalı Nasıl Test Edilir

## 1. Uygulamayı çalıştır

**Tarayıcıda (en hızlı):**
```bash
npm run dev
```
Tarayıcıda `http://localhost:5173` açılır.

**Tauri masaüstü (sağ tık tarayıcı menüsü çıkmaz):**
```bash
npm run tauri:dev
```
veya **tauri-dev.bat** çift tıkla.

---

## 2. Ses kanalına gir

1. Giriş yap (e-posta / şifre).
2. Sol taraftan bir **sunucu** seç.
3. Sol listede **ses kanalı**na tıkla (kulaklık ikonlu kanal; örn. "Genel" veya "Ses odası").
4. Arayüz ses kanalı görünümüne geçer: video alanı, altında mikrofon / kulaklık / kamera / ekran paylaşımı çubuğu.

---

## 3. Ses menüsünü test et (sağ tık)

1. **Sağ tık yap:** Video alanının **herhangi bir yerinde** (siyah sahne, katılımcı kutuları, üstte kanal adı, **alt kontrol çubuğu**) sağ tıkla.
2. **Beklenen:** Tarayıcı menüsü (Geri, İncele, vb.) **açılmaz**. Bunun yerine **“Ses düzeyleri”** başlıklı koyu menü açılır.
3. Menüde şunlar olmalı:
   - **Yayın sesi** – slider (0–100%), yüzde, kıs/aç butonu
   - **Normal ses (mikrofonlar)** – aynı şekilde slider + yüzde + kıs/aç
   - **Kapat** butonu

**Kontrol listesi:**

| Adım | Ne yap | Beklenen |
|------|--------|----------|
| 1 | Sahne (siyah alan) üzerinde sağ tıkla | Ses düzeyleri menüsü açılır |
| 2 | Alt kontrol çubuğunda sağ tıkla | Aynı menü açılır |
| 3 | “Yayın sesi” slider’ını hareket ettir | Yüzde değişir, ses uygulanır |
| 4 | “Normal ses” slider’ını hareket ettir | Yüzde değişir |
| 5 | Yayın sesinde kıs/aç (hoparlör ikonu) tıkla | 0% ↔ 100% olur |
| 6 | Menü dışına tıkla veya Escape | Menü kapanır |
| 7 | “Kapat” tıkla | Menü kapanır |

---

## 4. Tarayıcıda sağ tık (Discord benzeri)

- **Chrome/Edge:** Ses kanalı alanında sağ tıklayınca **sadece** “Ses düzeyleri” menüsü çıkmalı; “İncele”, “Sayfayı kaydet” vb. **çıkmamalı**.
- Çıkıyorsa: Sayfayı yenile, tekrar ses kanalına gir ve sağ tıklamayı **video/alan/kontrol çubuğu** üzerinde yaptığından emin ol.

---

## 5. Otomatik test (Playwright – isteğe bağlı)

Sadece “sayfa açılır” ve “giriş formu var” gibi temel testler:

```bash
npm run test:e2e
```

Ses menüsünü otomatik test etmek için: giriş + ses kanalına tıklama adımları gerekir (test hesabı ve ortam değişkeni). Şu an tam akış **manuel** test ile yapılıyor; yukarıdaki adımlar buna göre.

---

## Kısa özet

1. `npm run dev` veya `npm run tauri:dev` ile uygulamayı aç.
2. Giriş yap → sunucu seç → **ses kanalına** gir.
3. Ses kanalı ekranında **herhangi bir yerde** sağ tıkla → “Ses düzeyleri” menüsü açılmalı.
4. Slider ve kıs/aç butonlarıyla değerleri değiştirip menüyü kapatmayı dene.

Bu akışı geçiyorsan ses menüsü ve sağ tık davranışı doğru çalışıyor demektir.
