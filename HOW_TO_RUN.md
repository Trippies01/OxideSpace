# Oxide App – Uygulamayı Açma

## Geliştirme modunda açmak (önerilen)

1. **Cursor** veya **PowerShell** aç.
2. Proje klasörüne git.
3. Şu komutu yaz:
   ```bash
   npm run tauri:dev
   ```
4. Bir süre sonra masaüstü penceresi açılır.

---

## Alternatif: Batch dosyası

Proje klasöründeki **tauri-dev.bat** dosyasına **çift tıkla**.  
(VS Build Tools kurulu olmalı; ilk seferde Rust derlemesi 1–2 dakika sürebilir.)

---

## .exe oluşturmak (tek başına çalıştırılabilir)

1. Proje klasöründeki **tauri-build.bat** dosyasına **çift tıkla** (önerilen; Türkçe karakter sorununu atlar),  
   **veya** terminalde: `npm run tauri:build`
2. Build bittikten sonra şu dosyayı çalıştır:
   - **src-tauri\target\release\oxide-app.exe**
3. Bu .exe'ye çift tıklayarak uygulamayı her zaman açabilirsin (internet gerekmez).

---

**Özet:** Günlük kullanım için `npm run tauri:dev`. .exe için **tauri-build.bat** kullan.
