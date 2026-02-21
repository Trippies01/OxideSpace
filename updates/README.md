# Masaüstü güncelleme manifesti

Bu klasör, Tauri masaüstü uygulamasının otomatik güncelleme için kullandığı `latest.json` dosyasını içerir.

## Yeni sürüm yayınlama (GitHub + masaüstü)

1. **Sürümü yükselt** (zaten yapıldıysa atla)
   - `package.json`: `"version": "0.3.0"`
   - `src-tauri/tauri.conf.json`: `"version": "0.3.0"`

2. **Projeyi build et**
   ```bash
   npm run build
   npm run tauri build
   ```
   veya
   ```bash
   npm run setup
   ```

3. **İmzalı yükleyiciyi bul**
   - Windows: `src-tauri/target/release/bundle/nsis/Oxide Space_0.3.0_x64-setup.exe` (ve `.sig` dosyası aynı dizinde)

4. **GitHub Release oluştur**
   - Repo: https://github.com/Trippies01/OxideSpace
   - "Releases" → "Draft a new release"
   - Tag: `v0.3.0` (Create new tag)
   - Title: `v0.3.0`
   - Açıklamaya bu sürümün değişikliklerini yaz (örn. DM görüşme ekranı, gelen arama)
   - Yükleyici dosyayı sürükle-bırak: `Oxide Space_0.3.0_x64-setup.exe`
   - "Publish release" tıkla

5. **latest.json güncelle**
   - Build sonrası Tauri bazen `target/release/bundle/` altında güncel manifest üretir; yoksa:
   - `updates/latest.json` içinde `version`, `url` ve `signature` alanlarını güncelle.
   - **Signature:** `src-tauri/target/release/bundle/nsis/Oxide Space_0.3.0_x64-setup.exe.sig` dosyasının **içeriğini** base64 olarak kullan (Tauri dokümantasyonundaki imza formatına uygun şekilde).
   - **URL:** `https://github.com/Trippies01/OxideSpace/releases/download/v0.3.0/Oxide.Space_0.3.0_x64-setup.exe` (GitHub’ın dosyayı verdiği gerçek indirme adresi; bazen dosya adı farklı olabilir, release sayfasındaki linke bakın.)
   - `pub_date`: ISO 8601 (örn. `2026-02-20T14:00:00Z`)
   - `notes`: Kısa sürüm notu

6. **Değişiklikleri GitHub’a push et**
   ```bash
   git add package.json src-tauri/tauri.conf.json updates/latest.json
   git commit -m "chore: release v0.3.0"
   git push origin main
   ```

Böylece mevcut kullanıcılar uygulama içi güncelleme bildirimi alır ve yeni sürümü indirebilir.
