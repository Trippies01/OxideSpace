# Vercel ile Hosting – Adım Adım

OxideSpace uygulamasını Vercel’e deploy etmek için aşağıdaki adımları sırayla uygula.

---

## Adım 1: GitHub’a proje yükle (henüz yoksa)

1. **GitHub’da giriş yap:** [github.com](https://github.com)  
2. Sağ üstten **“+”** → **“New repository”**  
3. Repository adı: örn. `oxide-app`  
4. **Public** seç, **“Create repository”** de.  
5. Bilgisayarında proje klasöründe terminal aç ve şunları çalıştır (bir kez yapman yeterli):

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADIN/oxide-app.git
   git push -u origin main
   ```

   `KULLANICI_ADIN` yerine kendi GitHub kullanıcı adını yaz.  
   Repo adını farklı verdysen `oxide-app` yerine onu kullan.

---

## Adım 2: Vercel hesabı ve proje

1. **Vercel’e gir:** [vercel.com](https://vercel.com)  
2. **“Sign Up”** veya **“Log in”** → **“Continue with GitHub”** ile GitHub ile giriş yap.  
3. Girişten sonra **“Add New…”** → **“Project”** tıkla.  
4. **“Import Git Repository”** kısmında GitHub repo’nu görürsün.  
   - Repo görünmüyorsa **“Adjust GitHub App Permissions”** ile Vercel’e repo erişimi ver.  
5. **oxide-app** (veya koyduğun repo adı) yanındaki **“Import”** butonuna tıkla.

---

## Adım 3: Build ayarları

Açılan sayfada şunları kontrol et / doldur:

| Alan | Değer |
|------|--------|
| **Framework Preset** | Vite (Vercel genelde otomatik seçer) |
| **Root Directory** | Boş bırak (proje kökü) |
| **Build Command** | `npm run build` (varsayılan genelde doğru) |
| **Output Directory** | `dist` (Vite’ın çıktı klasörü) |
| **Install Command** | `npm install` (varsayılan) |

Projede `vercel.json` olduğu için Vercel bu ayarları oradan da okuyabilir; yine de ekrandaki değerlerin böyle olduğundan emin ol.

---

## Adım 4: Environment Variables (Supabase)

Aynı sayfada **“Environment Variables”** bölümüne in.

1. **Name:** `VITE_SUPABASE_URL`  
   **Value:** Supabase proje URL’in  
   - Nereden: [Supabase Dashboard](https://supabase.com/dashboard) → Projen → **Settings** → **API** → **Project URL**

2. **“Add”** veya **“Add Another”** ile ikinci değişkeni ekle:

   **Name:** `VITE_SUPABASE_ANON_KEY`  
   **Value:** Supabase anon (public) key’in  
   - Nereden: Aynı sayfada **Project API keys** → **anon public**

3. Her iki değişken için **Environment** olarak **Production**, **Preview**, **Development** hepsini seçebilirsin (veya en azından **Production** seçili olsun).

4. **“Deploy”** butonuna bas.

---

## Adım 5: Deploy’un bitmesi

- Build 1–3 dakika sürebilir.  
- Bittiğinde **“Visit”** veya **“Continue to Dashboard”** çıkar.  
- Site adresin şöyle olur: `https://oxide-app-xxxx.vercel.app` (veya verdiğin repo/proje adına göre).

Bu linki kopyala; hem sen hem arkadaşın tarayıcıdan bu adresi açarak uygulamayı kullanacaksın.

---

## Adım 6: Supabase Redirect URL ekleme

Giriş / şifre sıfırlama linklerinin doğru dönmesi için Supabase’e Vercel adresini tanıt:

1. **Supabase Dashboard** → Projen → **Authentication** → **URL Configuration**.  
2. **“Redirect URLs”** kısmına ekle:
   - `https://oxide-app-xxxx.vercel.app`
   - `https://oxide-app-xxxx.vercel.app/**`

   (Gerçek adresin ne ise onu yaz; Vercel’deki **Visit** linki aynen bu.)

3. **Save** ile kaydet.

Bundan sonra Vercel’deki sitede giriş ve şifre sıfırlama düzgün çalışır.

---

## Sonraki güncellemeler

Kodu güncelleyip GitHub’a push ettiğinde Vercel otomatik yeni deploy alır:

```bash
git add .
git commit -m "Güncelleme açıklaması"
git push
```

Vercel Dashboard → **Deployments** kısmından son deploy’u ve adresi görebilirsin.

---

## Sorun giderme

### "Unable to create index.lock" / "File exists" hatası

Bu hata, önceki bir `git add` veya `git commit` işlemi yarıda kaldığında veya başka bir program (Cursor, VS Code, vb.) Git kullanırken oluşur.

**Yapman gerekenler:**

1. **Tüm Git işlemlerini kapat:** Açık olan başka terminalde `git commit` veya `git add` çalışıyorsa kapat. Cursor/VS Code’daki Source Control (Git) panelini kapatıp tekrar aç.
2. **Kilit dosyasını sil:** PowerShell’de proje klasöründeyken:

   ```powershell
   Remove-Item -Path ".git\index.lock" -Force
   ```

   Veya Windows’ta **Dosya Gezgini** ile `OxideSpace\.git` klasörüne gir, `index.lock` dosyasını bul ve sil.
3. **Tekrar dene:**

   ```powershell
   git add .
   git commit -m "Initial commit"
   ```

Projede artık **.gitignore** var; `node_modules`, `dist`, `.env.local` repo’ya eklenmeyecek. Sadece kaynak kod ve ayar dosyaları gidecek.

---

## Kısa kontrol listesi

- [ ] Proje GitHub’da  
- [ ] Vercel’de “Import” ile proje eklendi  
- [ ] Build: `npm run build`, Output: `dist`  
- [ ] `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` environment variable olarak eklendi  
- [ ] Deploy tamamlandı, site linki alındı  
- [ ] Supabase Redirect URLs’e Vercel linki eklendi  

Hepsi tamamsa uygulama canlıda ve arkadaşınla aynı link üzerinden test edebilirsin.
