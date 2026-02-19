# Oxide Space – Kurulum (Setup)

Bu proje Tauri ile masaüstü uygulaması olarak derlenir. **Windows 10 (64-bit)** ve üzeri için hazırlanmıştır. Uygulama ikonu `src-tauri/icons/` klasöründe tanımlıdır.

- **Hedef işletim sistemi:** Windows 10 / 11 (x64)
- **WebView2:** Kurulumda gerekirse WebView2 otomatik yüklenir (installer içinde bootstrapper gömülüdür).

---

## Arkadaşına nasıl verilir / Nasıl kurulur (Son kullanıcı)

### Senin yapacakların (installer’ı hazırlayan)

1. Projede `npm run setup` çalıştır.
2. Kurulum dosyası şu klasörlerden birinde oluşur:
   - **MSI:** `src-tauri/target/release/bundle/msi/Oxide Space_0.1.0_x64_en-US.msi` (veya benzeri)
   - **EXE:** `src-tauri/target/release/bundle/nsis/Oxide Space_0.1.0_x64-setup.exe` (veya benzeri)
3. Bu **.msi** veya **.exe** dosyasını arkadaşına gönder (WeTransfer, Google Drive, USB vb.).

### Arkadaşının yapacakları (kurulum)

1. Gönderdiğin **.msi** veya **.exe** dosyasını indirsin / kopyalasın.
2. Dosyaya çift tıklasın.
3. Windows “Bu uygulama cihazınızda değişiklik yapmak istiyor” derse **Evet** desin.
4. Kurulum sihirbazındaki adımları takip etsin (Next / İleri → kurulum konumunu değiştirmek istemezse varsayılanı bırakabilir → Install / Yükle).
5. Kurulum bitince **Finish** / **Bitir** desin.
6. Uygulama **Başlat menüsünde** “Oxide Space” adıyla görünür; oradan açabilir veya masaüstü kısayolunu kullanabilir.

**Not:** İlk çalıştırmada Windows Defender veya SmartScreen “Tanınmıyor” uyarısı verebilir. “Yine de çalıştır” / “Ek bilgi” → “Yine de çalıştır” seçilerek açılabilir (imza satın alınmadığı için normaldir).

**Özet (arkadaşına yazıp atabileceğin):**
> Oxide Space’i kurmak için: Gönderdiğim .msi veya .exe dosyasını çift tıkla, kurulumu tamamla. Kurulumdan sonra Başlat menüsünden “Oxide Space” yazarak açabilirsin. İlk açılışta Windows uyarı verirse “Yine de çalıştır” de.

---

## Geliştirici: Gereksinimler

- Node.js (v18+)
- Rust (Tauri için)
- Windows: Visual Studio Build Tools veya Visual Studio (C++ workload)

## Kurulum dosyası (installer) oluşturma

Windows için kurulum dosyasını (`.msi` veya `.exe`) üretmek için:

```bash
npm run setup
```

Bu komut:

1. Web arayüzünü derler (`npm run build`)
2. Tauri uygulamasını ve Windows installer’ı oluşturur

Çıktılar (Windows 10/11 x64):

- **MSI:** `src-tauri/target/release/bundle/msi/` → `.msi` installer  
- **NSIS (EXE):** `src-tauri/target/release/bundle/nsis/` → `.exe` installer  

Build yalnızca Windows installer’ları (msi + nsis) üretir. WebView2 yoksa kurulum sırasında gömülü bootstrapper ile yüklenir.

## Sadece uygulama ikonunu güncellemek

Yeni bir ikon kullanacaksanız:

1. Yeni ikonu **1024x1024** veya en az **512x512** PNG olarak hazırlayın.
2. Dosyayı `src-tauri/icons/app-icon.png` olarak kaydedin (üzerine yazın veya yedekleyip değiştirin).
3. Tauri ikonlarını yeniden üretin:

```bash
npx tauri icon src-tauri/icons/app-icon.png
```

4. Ardından kurulumu tekrar oluşturmak için:

```bash
npm run setup
```

## Geliştirme modu

Sadece uygulamayı çalıştırmak (installer olmadan):

```bash
npm run tauri:dev
```

---

## Supabase: E-posta doğrulama ve Google ile giriş

Uygulama giriş/kayıt için Supabase Auth kullanır. E-postanın gelmesi ve Google ile giriş için dashboard ayarları gerekir.

### E-posta ile kayıt – doğrulama maili gelmiyorsa

1. **Supabase Dashboard** → [Authentication](https://supabase.com/dashboard) → **Providers** → **Email**
   - **Confirm email** açık olsun (açıksa kayıt sonrası doğrulama linki gönderilir).
2. **Redirect URLs**: **URL Configuration** bölümünde **Redirect URLs** listesine uygulamanın dönüş adresini ekleyin:
   - Geliştirme: `http://localhost:5173/`, `http://127.0.0.1:5173/`
   - Tauri (production): Uygulamanın açıldığı adres (örn. `https://your-app.com/` veya kullandığınız custom scheme).
3. **Site URL**: Varsayılan yönlendirme adresi; yukarıdaki adreslerden biriyle aynı olmalı (örn. `http://localhost:5173`).
4. **Mailler spam’e düşüyorsa**: **Project Settings** → **Auth** → **SMTP** bölümünden kendi SMTP sunucunuzu tanımlayın (Gmail, SendGrid, vb.). SMTP kullanmazsanız Supabase’in varsayılan gönderimi sınırlı olabilir ve bazı sağlayıcılar spam’e atar.

### Google ile giriş – adım adım

Ekranda gördüğün **Google** ayar penceresini doldurmak için önce Google Cloud Console’da bir “OAuth istemcisi” oluşturman gerekiyor. Sonra **Müşteri Kimliği** ve **İstemci Gizli Anahtarı**’nı Supabase’e yapıştıracaksın.

---

#### Adım 1: Google Cloud Console’a gir

1. Tarayıcıda **[Google Cloud Console](https://console.cloud.google.com/)** adresine git.
2. Google hesabınla giriş yap.
3. Üstteki proje seçiciden bir proje seç veya **Yeni proje** ile yeni proje oluştur (örn. “OxideSpace”).
4. Proje seçili olduğundan emin ol.

---

#### Adım 2: OAuth izin ekranını ayarla (ilk kez yapıyorsan)

1. Sol menüden **APIs & Services** → **OAuth consent screen**’e tıkla.
2. **User Type** olarak **External** seçip **Create** de.
3. **App information**:
   - **App name:** Örn. `OxideSpace`
   - **User support email:** Kendi e-postan
   - **Developer contact:** Kendi e-postan
4. **Save and Continue** de.
5. **Scopes** sayfasında **Add or remove scopes** → `.../auth/userinfo.email` ve `.../auth/userinfo.profile` ekle → **Save and Continue**.
6. **Test users** (External ve “Testing” modundaysa): Giriş yapacak hesapları ekleyebilirsin; **Save and Continue** de.
7. **Summary**’de **Back to Dashboard** de.

---

#### Adım 3: OAuth 2.0 Client ID oluştur

1. Sol menüden **APIs & Services** → **Credentials**’a git.
2. **+ Create Credentials** → **OAuth client ID** seç.
3. **Application type:** **Web application** seç.
4. **Name:** Örn. `OxideSpace Web` yaz.
5. **Authorized redirect URIs** bölümüne şu adresi **tek satır** olarak ekle (Supabase’teki “Geri Çağrı URL’si” ile birebir aynı olmalı):
   ```
   https://mzlpnbjubwdhfytwbvit.supabase.co/auth/v1/callback
   ```
   - Supabase’teki Google ayarında **Geri Çağrı URL'si** farklıysa, buraya **onun aynısını** yaz.
   - **Add URI** ile ekledikten sonra listede göründüğünden emin ol.
6. **Create**’e tıkla.
7. Açılan pencerede:
   - **Client ID** (uzun metin, örn. `xxxxx.apps.googleusercontent.com`) → bunu kopyala.
   - **Client secret** → **Copy** ile kopyala (bir daha tam gösterilmez, sakla).

---

#### Adım 4: Supabase’teki Google ayarını doldur

1. **Supabase Dashboard** → **Authentication** → **Providers** → **Google** sayfasını aç (gördüğün “Google ile Giriş Yap” penceresi).
2. **Google ile Giriş Yap özelliğini etkinleştirin** anahtarını **açık** (yeşil) bırak.
3. **Müşteri Kimlikleri** kutusuna: Google’dan kopyaladığın **Client ID**’yi yapıştır. (Birden fazla istemci kullanacaksan virgülle ayırarak yazabilirsin; tek istemci için sadece bir tane yeter.)
4. **İstemci Gizli Anahtarı (OAuth için)** kutusuna: Google’dan kopyaladığın **Client secret**’ı yapıştır. Göz ikonuyla göster/gizle yapabilirsin.
5. **Geri Çağrı URL'si** zaten dolu olmalı: `https://mzlpnbjubwdhfytwbvit.supabase.co/auth/v1/callback`  
   Bu adresi **Google Console’daki Authorized redirect URIs**’e eklediysen uyumludur; **Kopyala** ile alıp Google tarafında kullanabilirsin.
6. **Nonce kontrollerini atla**: Kapalı bırak (güvenlik için önerilir).
7. **E-posta adresi olmayan kullanıcılara izin ver**: Kapalı bırak (e-posta istiyorsan).
8. **Kaydetmek** butonuna tıkla.

---

#### Adım 5: Uygulama tarafında Redirect URL (Supabase URL Configuration)

Google girişinden sonra kullanıcı **uygulamanın** açık olduğu adrese döner. Bu adres Supabase’te tanımlı olmalı:

1. **Authentication** → **URL Configuration** bölümüne git.
2. **Redirect URLs** listesine uygulamanın adresini ekle:
   - Geliştirme (tarayıcı): `http://localhost:5173/` ve gerekirse `http://127.0.0.1:5173/`
   - Tauri / production: Uygulamanın gerçekten açıldığı adres (örn. `https://alanadi.com/`).
3. **Site URL**’i de aynı mantıkla ayarla (örn. `http://localhost:5173`).

Bunlar olmadan “redirect_uri” hatası alabilirsin.

**Önemli (bad_oauth_state):** Uygulama Vite ile **5173** portunda çalışır. Supabase Site URL ve Redirect URLs'de **http://localhost:5173** kullanın; localhost:3000 kullanmayın. 3000 yazılıysa "Bağlanmayı reddetti" ve bad_oauth_state hatası alırsınız.

---

#### Özet

| Nerede | Ne yapacaksın |
|--------|----------------|
| Google Cloud Console | Proje seç → Credentials → Create OAuth client ID (Web) → Redirect URI = Supabase callback URL |
| Google Cloud Console | Client ID ve Client secret’ı kopyala |
| Supabase → Google provider | Müşteri Kimlikleri = Client ID, İstemci Gizli Anahtarı = Client secret → Kaydet |
| Supabase → URL Configuration | Redirect URLs’e uygulama adresini ekle (localhost veya production) |

Kayıt veya Google girişi sonrası kullanıcı için `public.profiles` kaydı otomatik oluşturulur (veritabanı trigger’ı ile).

---

## Güncelleme yayınlama (kullanıcılar “Güncelle” ile yeni sürümü alsın)

Uygulama açıldığında güncelleme kontrol edilir; yeni sürüm varsa üstte “Yeni sürüm: vx.y.z” banner’ı çıkar, kullanıcı **Güncelle** ile indirip kurar ve uygulama yeniden başlar.

### 1. İmza anahtarı (bir kez)

Güncellemeleri doğrulamak için bir kez anahtar üret:

```bash
npx tauri signer generate -w ~/.tauri/oxide.key
```

- **Özel anahtar** (`oxide.key`) güvende kalsın, kimseyle paylaşma.
- **Ortak anahtar** (terminalde yazdırılan uzun metin) `tauri.conf.json` içinde `plugins.updater.pubkey` alanına yapıştırılacak.

`tauri.conf.json` örneği:

```json
"plugins": {
  "updater": {
    "endpoints": ["https://raw.githubusercontent.com/Trippies01/OxideSpace/main/updates/latest.json"],
    "pubkey": "BURAYA_ORTAK_ANAHTAR_YAPISTIR"
  }
}
```

### 2. Yeni sürümü derleme

Sürümü artır: `src-tauri/tauri.conf.json` içinde `version` (örn. `"0.1.1"`) ve istersen `package.json` içinde de.

Sonra imzalı kurulumu üret (PowerShell’de):

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = "C:\Users\SENIN_KULLANICI\.tauri\oxide.key"
npm run setup
```

(macOS/Linux’ta `export TAURI_SIGNING_PRIVATE_KEY="$HOME/.tauri/oxide.key"` kullan.)

Çıktılar:

- `src-tauri/target/release/bundle/nsis/` → `.exe` ve `.sig`
- `src-tauri/target/release/bundle/msi/` → `.msi` ve `.sig`

### 3. Güncelleme dosyasını yayınlama

**Seçenek A – GitHub Releases (önerilen)**

1. GitHub’da yeni release oluştur (örn. tag `v0.1.1`).
2. İlgili `.exe` (veya `.msi`) ve `.sig` dosyasını release’e ekle (asset olarak).
3. `updates/latest.json` dosyasını güncelle:

- `version`: yeni sürüm (örn. `"0.1.1"`)
- `notes`: kullanıcıya gösterilecek kısa not
- `pub_date`: ISO 8601 tarih (örn. `2025-02-14T12:00:00Z`)
- `platforms.windows-x86_64`:
  - `signature`: ilgili `.sig` dosyasının **içeriği** (tek satır, base64)
  - `url`: kurulum dosyasının **doğrudan indirme linki** (GitHub’da “asset”e sağ tık → “Copy link address” veya Releases sayfasındaki asset URL’si)

Örnek `updates/latest.json`:

```json
{
  "version": "0.1.1",
  "notes": "Hata düzeltmeleri ve iyileştirmeler.",
  "pub_date": "2025-02-14T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "SIG_DOSYASININ_ICERIGI",
      "url": "https://github.com/Trippies01/OxideSpace/releases/download/v0.1.1/Oxide.Space_0.1.1_x64-setup.nsis.exe"
    }
  }
}
```

4. `updates/latest.json` değişikliğini commit edip `main`’e (veya kullandığın branch’e) push et.

Böylece uygulama `tauri.conf.json`’daki `endpoints` adresinden bu JSON’u okuyacak; sürüm mevcut sürümden büyükse banner çıkacak ve **Güncelle** ile indirip kuracak.

**Seçenek B – Kendi sunucun**

Kurulum `.exe`/`.msi` ve `.sig` dosyasını kendi sunucuna koy; `updates/latest.json`’daki `url`’yi bu indirme linkine yönlendir ve JSON’u o sunucuda veya GitHub’da yayınla. `endpoints` içinde bu JSON’un erişilebilir URL’sini kullan.

### Kullanıcı tarafı

- Uygulama açıldığında güncelleme otomatik kontrol edilir.
- Yeni sürüm varsa üstte banner çıkar; **Güncelle** deyince indirilir, kurulur ve uygulama yeniden başlar.
- Banner’ı “X” ile kapatırsa bu oturumda bir daha çıkmaz; sonraki açılışta tekrar kontrol edilir.

---

## GoDaddy domain'ini Vercel'e bağlama

GoDaddy’den aldığın domain’i (örn. `oxide.space`) Vercel’de yayındaki projeye bağlamak için aşağıdaki adımları uygula. Hem **ana domain** (örn. `oxide.space`) hem de **www** (örn. `www.oxide.space`) çalışabilir.

---

### Adım 1: Vercel’de domain ekle

1. **[vercel.com](https://vercel.com)** → Giriş yap.
2. Projeyi seç (OxideSpace veya domain’i bağlayacağın proje).
3. Üst menüden **Settings** → sol taraftan **Domains**’e tıkla.
4. **Add** veya **Add Domain** butonuna tıkla.
5. GoDaddy’den aldığın domain’i yaz (örn. `oxide.space`) → **Add**.
6. İstersen `www.oxide.space` için de tekrar **Add** ile ekle (Vercel genelde ikisini de önerir).
7. Vercel sana hangi **DNS kayıtlarını** eklemen gerektiğini gösterecek. Bu ekranda kal; bir sonraki adımda GoDaddy’de bu kayıtları gireceksin.

**Örnek olarak Vercel şunları isteyebilir:**

| Tür   | İsim (Name / Host) | Değer (Value / Points to)        |
|-------|---------------------|-----------------------------------|
| **A** | `@`                 | `76.76.21.21`                     |
| **CNAME** | `www`           | `cname.vercel-dns.com`            |

(Vercel bazen farklı IP veya CNAME verebilir; **her zaman Vercel’in Domains sayfasında yazdığı değerleri** kullan.)

---

### Adım 2: GoDaddy’de DNS ayarları

1. **[godaddy.com](https://www.godaddy.com)** → Giriş yap.
2. Üstten **Ürünlerim** / **My Products** → Domain’ini bul (örn. `oxide.space`) → yanındaki **DNS** veya **Manage DNS**’e tıkla.
3. **DNS Management** / **DNS Yönetimi** sayfasında kayıt listesi görünecek. Burada **A** ve **CNAME** ekleyeceğiz.

---

#### Ana domain için (oxide.space gibi, www’suz)

1. **Add** / **Ekle** (veya **Add New Record**) → **A (Address)** seç.
2. **Name / Host / İsim:**
   - GoDaddy’de çoğu zaman `@` yazarsan “root” (ana domain) olur.
   - Bazı arayüzlerde boş bırakılırsa da root kabul edilir. Arayüzde “@” veya “root” yazan seçeneği kullan.
3. **Value / Points to / IP Address:** Vercel’in verdiği IP’yi yaz (örn. `76.76.21.21`). Vercel’deki Domains sayfasında **A record** için yazan değer tam bu olmalı.
4. **TTL:** Varsayılan (örn. 600 saniye veya 1 saat) kalabilir.
5. **Save** / **Kaydet**.

---

#### www için (www.oxide.space)

1. Yine **Add** / **Ekle** → bu sefer **CNAME** seç.
2. **Name / Host:** `www` yaz (sadece www, nokta yok).
3. **Value / Points to:** Vercel’in verdiği CNAME’i yaz (örn. `cname.vercel-dns.com`). Vercel’de **www** için CNAME’de tam ne yazıyorsa onu kopyala.
4. **TTL:** Varsayılan.
5. **Save** / **Kaydet**.

**Not:** Eski bir **www** için A kaydı veya farklı bir CNAME varsa, onu **Edit** ile Vercel’in verdiği değere güncelle veya **Delete** ile silip yukarıdaki CNAME’i ekle.

---

### Adım 3: Eski çakışan kayıtları temizle (varsa)

- **A** kaydı: Sadece **@** (root) için **bir tane** A kaydı olsun; değeri Vercel’in IP’si (`76.76.21.21` vb.) olsun. Başka A (@) kayıtları varsa silebilir veya Vercel IP’ye çevirebilirsin.
- **CNAME** kaydı: **www** için sadece Vercel’in söylediği CNAME kalsın (örn. `cname.vercel-dns.com`).

---

### Adım 4: Yayılımı bekle ve kontrol et

1. DNS değişiklikleri **birkaç dakika ile 48 saat** arasında yayılır; çoğu zaman 15–30 dakikada çalışır.
2. Vercel’de **Settings** → **Domains** sayfasında domain’in yanında **Valid Configuration** / yeşil tik çıkana kadar bekleyebilirsin. Hata varsa Vercel hangi kaydın eksik/yanlış olduğunu gösterir.
3. Tarayıcıda `https://oxide.space` ve `https://www.oxide.space` açıp sitenin Vercel’deki projeye gittiğini kontrol et.

---

### Adım 5: HTTPS (SSL)

Vercel, domain kendine doğru bağlandıktan sonra **otomatik** SSL sertifikası verir. Ekstra bir şey yapmana gerek yok; bir süre sonra `https://` ile açılır. Bazen “Certificate is being issued” birkaç dakika sürebilir.

---

### Özet tablo

| Nerede   | Ne yapıyorsun |
|----------|----------------|
| **Vercel** | Domains → Add → domain’i ekle (örn. `oxide.space` ve `www.oxide.space`). A ve CNAME değerlerini not al. |
| **GoDaddy** | DNS → A kaydı: Name `@`, Value = Vercel’in IP’si. |
| **GoDaddy** | DNS → CNAME: Name `www`, Value = Vercel’in CNAME’i (örn. `cname.vercel-dns.com`). |
| **Bekle** | 15 dk – 48 saat. Vercel’de “Valid” olunca site yayında. |

Domain farklıysa (örn. `alanadi.com`) sadece domain adını değiştir; adımlar aynıdır.

---

**İkon:** Uygulama ikonu `src-tauri/icons/app-icon.png` kaynak alınarak oluşturulmuştur; tüm platform boyutları `tauri icon` ile üretilir.
