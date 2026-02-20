# Windows Kurulum Dosyasını İmzalama (SmartScreen Uyarısını Kaldırma)

"Şüpheli indirme işlemi engellendi" uyarısı, **Windows SmartScreen** ve tarayıcıların **imzasız** `.exe` dosyalarını güvenilir bulmamasından kaynaklanır. Kurulum dosyasını **kod imzalama sertifikası** ile imzaladığınızda bu uyarı çıkmaz.

## Ne Yapmanız Gerekiyor?

1. **Kod imzalama sertifikası satın alın** (SSL sertifikası değil, **code signing** sertifikası).
   - **OV (Organization Validated):** Daha uygun fiyat, bireyler de alabilir; ilk zamanlarda SmartScreen uyarısı çıkabilir, kullanım arttıkça “reputation” oluşur.
   - **EV (Extended Validation):** Daha pahalı, donanım anahtarı gerekir; genelde daha hızlı güven kazanır.
   - Örnek sağlayıcılar: [DigiCert](https://www.digicert.com/signing/code-signing-certificates), [Sectigo/Comodo](https://sectigo.com/ssl-certificates-tls/code-signing), [SSL.com](https://www.ssl.com/certificates/code-signing/). Microsoft’un listesi: [Code signing - Microsoft Docs](https://learn.microsoft.com/en-us/windows-hardware/drivers/dashboard/code-signing-cert-manage).

2. **Sertifikayı .pfx formatına çevirin** (genelde `.cer` + private key verilir):
   ```bash
   openssl pkcs12 -export -in cert.cer -inkey private-key.key -out certificate.pfx
   ```
   Çıkan şifreyi (export password) kaydedin.

3. **Windows’a .pfx’i içe aktarın** (PowerShell, kendi şifrenizle):
   ```powershell
   $WINDOWS_PFX_PASSWORD = 'SERTIFIKA_SIFRENIZ'
   Import-PfxCertificate -FilePath .\certificate.pfx -CertStoreLocation Cert:\CurrentUser\My -Password (ConvertTo-SecureString -String $WINDOWS_PFX_PASSWORD -Force -AsPlainText)
   ```

4. **Thumbprint ve timestamp URL’sini alın:**
   - **certmgr.msc** açın → Kişisel → Sertifikalar → az önce eklediğiniz sertifikaya çift tıklayın → **Ayrıntılar** sekmesi:
     - **İmza karma algoritması** → `digestAlgorithm` (çoğunlukla `sha256`).
     - **Benzersiz Parmak İzi (Thumbprint)** → `certificateThumbprint` (boşluksuz kopyalayın).
   - **Zaman damgası URL’si:** Sertifika sağlayıcınızın verdiği adres (örnekler):
     - DigiCert: `http://timestamp.digicert.com`
     - Sectigo/Comodo: `http://timestamp.comodoca.com`
     - SSL.com: `http://ts.ssl.com`

5. **`src-tauri/tauri.conf.json` içinde `bundle.windows` bölümünü doldurun:**
   ```json
   "windows": {
     "certificateThumbprint": "SERTIFIKA_THUMBPRINT_BURAYA",
     "digestAlgorithm": "sha256",
     "timestampUrl": "http://timestamp.digicert.com",
     ...
   }
   ```
   (Mevcut `webviewInstallMode`, `nsis` vb. ayarları aynen bırakın; sadece bu üç alanı ekleyin/güncelleyin.)

6. **Yeniden build alın:**
   ```bash
   npm run tauri build
   ```
   Çıktıda “Successfully signed” benzeri bir mesaj görürseniz imzalama başarılıdır.

7. **Oluşan kurulumu** `public/downloads/` için tekrar kopyalayın:
   ```bash
   npm run copy-setup
   ```

Bundan sonra aynı imzalı `.exe` dosyasını dağıttığınızda, SmartScreen ve tarayıcı “şüpheli indirme” uyarısını göstermemelidir (EV ile daha hızlı, OV ile kullanım arttıkça güven oluşur).

## Özet

| Durum | Sonuç |
|--------|--------|
| Sertifika yok | “Şüpheli indirme engellendi” uyarısı çıkar. |
| OV/EV sertifika + `tauri.conf.json` ayarlı + imzalı build | Uyarı çıkmaması gerekir (OV’de bazen ilk dönemde uyarı görülebilir). |

Sertifika satın alma ve onay süreci sağlayıcıya göre birkaç gün sürebilir. Bu dokümandaki adımlar tamamlandığında kurulumunuz güvenli ve uyarısız dağıtılabilir.
