# Tauri ile Çalıştırma

Proje Tauri 2 ile masaüstü uygulaması olarak yapılandırıldı.

## Gereksinimler

1. **Node.js**
2. **Rust** – [https://rustup.rs](https://rustup.rs) ile kurun.
3. **Windows:** Visual Studio Build Tools (C++ workload) – [tauri-dev.bat](tauri-dev.bat) veya [tauri-build.bat](tauri-build.bat) kullanıyorsan otomatik ortam yüklenir.

## Komutlar

| Komut | Açıklama |
|--------|----------|
| `npm run tauri:dev` | Geliştirme modunda uygulamayı açar |
| `npm run tauri:build` | Release build ve .exe üretir |

**Türkçe karakter:** Proje klasörü adında ı, ğ, ü vb. varsa build/çalıştırma sorun çıkarabilir. **tauri-build.bat** veya **tauri-dev.bat** kullan; bu dosyalar VS ortamını yükleyip doğru dizinde çalıştırır. İstersen klasörü **oxide-app** veya **uideneme** gibi ASCII bir isimle yeniden adlandırabilirsin.

## .exe konumu

Build sonrası: **src-tauri\target\release\oxide-app.exe**
