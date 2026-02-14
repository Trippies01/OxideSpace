# Discord Seviyesinde Ses: Krisp ve Gürültü Engelleme

Cızırtı ve arka plan gürültüsünü azaltmak için iki yol var: **Krisp SDK** (ticari, Discord kalitesi) ve **RNNoise** (ücretsiz, açık kaynak).

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

| Özellik        | Krisp              | RNNoise (örn. @jitsi/rnnoise-wasm) |
|----------------|--------------------|-------------------------------------|
| Kalite         | Çok yüksek (Discord benzeri) | İyi, cızırtı/gürültü azaltır       |
| Maliyet        | Ticari lisans      | Ücretsiz                            |
| Kurulum        | Portal + model dosyaları | NPM + entegrasyon kodu             |
| API anahtarı   | Portal/lisans      | Gerekmez                            |

- **“Discord seviyesi” istiyorsan:** Krisp için [krisp.ai/developers](https://krisp.ai/developers/) veya [sdk.krisp.ai](https://sdk.krisp.ai/) üzerinden başvurup SDK + model dosyalarını alın; projede mikrofonu Krisp’ten geçirip LiveKit’e verin.
- **Hızlı ve ücretsiz çözüm:** `@jitsi/rnnoise-wasm` paketi projeye eklendi; ileride Ayarlar’da “Gelişmiş gürültü engelleme” ile açılıp mikrofon stream’i bu filtreden geçirilebilir.

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
