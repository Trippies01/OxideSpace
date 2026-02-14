# Discord Seviyesinde Ses: Krisp ve Gürültü Engelleme

Cızırtı ve arka plan gürültüsünü azaltmak için **Krisp SDK** (ticari), **Picovoice Koala**, **DeepFilterNet**, **RNNoise** ve diğer açık kaynak alternatifler kullanılabilir.

---

## Krisp yerine kullanılabilecek alternatifler (GitHub / npm)

| Çözüm | Kalite | Tarayıcı | Maliyet | GitHub / Kaynak |
|-------|--------|----------|---------|------------------|
| **Picovoice Koala** | Krisp’e yakın | ✅ Evet | Ücretsiz (AccessKey) | [@picovoice/koala-web](https://www.npmjs.com/package/@picovoice/koala-web), [Picovoice Docs](https://picovoice.ai/docs/quick-start/koala-web/) |
| **DeepFilterNet** | Çok iyi (full-band 48kHz) | ⚠️ WASM/deneme | Ücretsiz (MIT/Apache) | [Rikorose/DeepFilterNet](https://github.com/Rikorose/DeepFilterNet) (~3.8k ⭐) |
| **RNNoise (WASM)** | İyi | ✅ Evet | Ücretsiz | [jitsi/rnnoise-wasm](https://github.com/jitsi/rnnoise-wasm), npm: `@jitsi/rnnoise-wasm` |
| **Enhanced RNNoise** | İyi+ (reverb/feedback) | Python/API | Ücretsiz | [tannu64/Enhanced-RNNoise](https://github.com/tannu64/enhanced-rnnoise-real-time-audio-noise-suppression) |
| **NoiseTorch** | İyi (RNNoise) | ❌ Sadece Linux | Ücretsiz | [noisetorch/NoiseTorch](https://github.com/noisetorch/NoiseTorch) (~10k ⭐) |
| **Magic Mic** | İyi | Masaüstü (Tauri) | Ücretsiz | [audo-ai/magic-mic](https://github.com/audo-ai/magic-mic) |

### Önerilen: Picovoice Koala (tarayıcı, Krisp’e en yakın)

- **NPM:** `npm install @picovoice/koala-web`
- **Ücretsiz:** Picovoice Console’da hesap açıp **AccessKey** alıyorsunuz (ücretsiz tier).
- **Tarayıcıda çalışır**, ses cihazda işlenir (sunucuya gitmez), düşük gecikme.
- **Entegrasyon:** `livekitService.setAudioFilter(...)` ile mikrofon stream’ini Koala’dan geçirip LiveKit’e verebilirsiniz.  
  Örnek: [Koala Web Quick Start](https://picovoice.ai/docs/quick-start/koala-web/), [How to Add Noise Suppression to any Web App](https://picovoice.ai/blog/how-to-add-noise-suppression-to-any-web-app).

#### OxideSpace'te Koala kurulumu (yapıldı)

1. **Access Key:** [Picovoice Console](https://console.picovoice.ai/) → hesap açın, Access Key alın.
2. **`.env.local`** içine ekleyin: `VITE_PICOVOICE_ACCESS_KEY=your_access_key`
3. **Model dosyası:** Console'dan Koala model dosyasını (`koala_params.pv` veya benzeri) indirip proje kökündeki **`public/`** klasörüne koyun (varsayılan isim: `koala_params.pv`). Farklı isim kullanırsanız: `VITE_KOALA_MODEL_PATH=/your_model.pv`
4. **Ayar:** Uygulama içinde **Ayarlar → Ses ve Görüntü** → "Koala gürültü bastırma" kutusunu işaretleyin. Mikrofon açıksa otomatik yeniden uygulanır.

### DeepFilterNet (en iyi kalite, açık kaynak)

- **GitHub:** [Rikorose/DeepFilterNet](https://github.com/Rikorose/DeepFilterNet) – full-band (48kHz) konuşma iyileştirme.
- **Python/Rust/LADSPA** hazır; tarayıcı için WASM/ONNX denemeleri var ([Issue #472](https://github.com/Rikorose/DeepFilterNet/issues/472), [quaziadib/deepfilternet_wasm_test](https://github.com/quaziadib/deepfilternet_wasm_test)).
- Lisans: MIT / Apache-2.0.

### RNNoise (zaten projede)

- **npm:** `@jitsi/rnnoise-wasm` – Jitsi Meet’in kullandığı WASM modülü.
- Tarayıcıda doğrudan kullanılabilir; Krisp/Koala kadar güçlü değil ama cızırtı ve arka plan gürültüsü için etkili.

---

## 1. Krisp API / SDK (Discord seviyesi)

### Nedir?
- **Krisp**: Tarayıcıda AI tabanlı gürültü giderme (mikrofon + hoparlör).
- Discord benzeri kalite; ticari lisans gerekir.

### API / SDK nasıl alınır?
1. **Geliştirici portalı:** [krisp.ai/developers](https://krisp.ai/developers/) veya [sdk.krisp.ai](https://sdk.krisp.ai/)
2. **Kayıt / lisans:** Sitede hesap açıp SDK lisansı için başvuru yapın (ticari kullanım için Krisp ile iletişim).
3. **SDK indirme:** Portal üzerinden **Web (JavaScript) SDK** paketini indirin. Paket içinde:
   - `krispsdk.mjs` (kütüphane)
   - Model dosyaları: `model_8.kef`, `model_nc_mq.kef`, isteğe bağlı `model_bvc.kef`, inbound modelleri

### Önemli notlar
- **NPM yok:** Kütüphane npm’de yayınlanmıyor; portaldan indirip projeye (ör. `public/` veya `src/assets/`) koymanız gerekir.
- **Model dosyaları:** `.kef` dosyalarını projede (veya CDN’de) barındırıp SDK init’te path vermeniz gerekir.
- **getUserMedia:** Krisp kullanırken tarayıcı gürültü bastırmasını kapatın:  
  `echoCancellation: false, noiseSuppression: false, autoGainControl: false`
- **Entegrasyon:** Mikrofon stream’i → Krisp `createNoiseFilter()` → çıkan stream’i LiveKit’e verin.

### Dokümantasyon
- [Krisp JS SDK – Getting Started](https://sdk-docs.krisp.ai/docs/getting-started-js)
- [Integration (Outbound NC)](https://sdk-docs.krisp.ai/docs/integration-browser-sdk-bvc-nc)

---

## 2. RNNoise (Ücretsiz)

### Nedir?
- Açık kaynak, WASM tabanlı gürültü bastırma (Xiph/RNNoise).
- Jitsi Meet ve birçok uygulama tarayıcıda bunu kullanıyor.
- **Ücretsiz**, API anahtarı veya lisans ücreti yok.

### Nasıl kullanılır?
- **NPM:** `@jitsi/rnnoise-wasm`  
  Projede bu paket eklenip mikrofon stream’i, RNNoise ile işlendikten sonra LiveKit’e verilebilir (ayarlarda “Gelişmiş gürültü engelleme” ile açılıp kapatılabilir).

Krisp kadar güçlü değil ama cızırtı ve sürekli arka plan gürültüsü için belirgin iyileşme sağlar.

---

## Özet

| Özellik        | Krisp              | Picovoice Koala     | RNNoise (jitsi)     | DeepFilterNet       |
|----------------|--------------------|---------------------|---------------------|----------------------|
| Kalite         | Çok yüksek         | Krisp’e yakın       | İyi                 | Çok iyi (full-band)  |
| Tarayıcı       | ✅                 | ✅                  | ✅                  | ⚠️ WASM/deneme       |
| Maliyet        | Ticari lisans      | Ücretsiz (AccessKey)| Ücretsiz            | Ücretsiz (MIT/Apache)|
| Kurulum        | Portal + SDK       | npm + Picovoice Console | npm              | GitHub / pip / WASM   |

- **Krisp yerine, tarayıcıda en pratik:** **Picovoice Koala** – ücretsiz AccessKey, npm paketi, Krisp’e yakın kalite. `livekitService.setAudioFilter(...)` ile bağlanabilir.
- **En iyi açık kaynak kalite:** **DeepFilterNet** – GitHub’da Python/Rust hazır; tarayıcı için WASM örnekleri var.
- **Hızlı ve ücretsiz (zaten projede):** `@jitsi/rnnoise-wasm` – Ayarlar’da “Gelişmiş gürültü engelleme” ile kullanılabilir.

### Projede Krisp kullanmak (isteğe bağlı)

LiveKit servisi, mikrofonu yayınlamadan önce isteğe bağlı bir **ses filtresi** uygulayabiliyor. Krisp’i bağlamak için:

1. Krisp SDK’yı indirip projeye ekleyin (ör. `public/krisp/` veya `src/assets/krisp/`).
2. `livekitService.setAudioFilter(async (stream) => { ... })` ile bir filtre verin; bu fonksiyon ham mikrofon `MediaStream`’ini alıp Krisp’ten geçirilmiş `MediaStream` döndürsün.
3. Ses kanalına girip mikrofon açıldığında, stream otomatik olarak bu filtreden geçer.

Örnek (Krisp kullanıyorsanız):

```javascript
// Krisp init (SDK ve model path’leri sizin kurulumunuza göre)
const sdk = new KrispSDK({ params: { models: { modelNC: "/path/to/model_nc_mq.kef" } } });
await sdk.init();

livekitService.setAudioFilter(async (stream) => {
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const destination = audioContext.createMediaStreamDestination();
  const filterNode = await sdk.createNoiseFilter(audioContext, () => filterNode.enable(), () => {});
  source.connect(filterNode).connect(destination);
  return destination.stream;
});
```

Böylece cızırtı ve gürültü Krisp seviyesinde azaltılır.
