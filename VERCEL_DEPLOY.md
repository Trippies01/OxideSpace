# OxideSpace – Vercel’e Adım Adım Deploy Rehberi

Projen Vite + React ve `vercel.json` zaten hazır. Aşağıdaki adımları sırayla uygula.

---

## Adım 1: Projeyi Git’e al (henüz yoksa)

1. **GitHub’da yeni repo oluştur:** https://github.com/new  
   - Repository name: `OxideSpace` (veya istediğin isim)  
   - Public seç, "Create repository" tıkla.

2. **Proje klasöründe terminal aç** ve şunları çalıştır:

```powershell
cd "c:\Users\semih\OneDrive\Desktop\OxideSpace"

git init
git add .
git commit -m "Initial commit - OxideSpace"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/OxideSpace.git
git push -u origin main
```

- `KULLANICI_ADIN` yerine kendi GitHub kullanıcı adını yaz.  
- Repo oluştururken "Add a README" seçtiysen önce `git pull origin main --rebase` yap, sonra `git push -u origin main`.

---

## Adım 2: Vercel hesabı ve proje

1. **Vercel’e gir:** https://vercel.com  
2. **"Sign Up"** veya **"Log In"** → **"Continue with GitHub"** ile giriş yap.  
3. Gerekirse GitHub’da Vercel’e erişim izni ver.  
4. **"Add New..."** → **"Project"** seç.  
5. **"Import Git Repository"** kısmında **OxideSpace** (veya repo adın) görünecek → **Import** tıkla.

---

## Adım 3: Build ayarlarını kontrol et

Vercel, `vercel.json` sayesinde projeyi otomatik tanıyacak. Ekranda şunları gör ve **değiştirme** (zaten doğru):

| Ayar              | Değer           |
|-------------------|------------------|
| Framework Preset  | Vite             |
| Build Command     | `npm run build`  |
| Output Directory  | `dist`           |
| Install Command   | `npm install`   |

Root Directory boş bırak. **Deploy**’a basma, önce ortam değişkenlerini ekle (Adım 4).

---

## Adım 4: Ortam değişkenlerini ekle

Projede Supabase ve LiveKit kullanılıyor. Vercel’de:

1. **"Environment Variables"** bölümünü aç.  
2. Aşağıdaki değişkenleri tek tek ekle (Production, Preview, Development hepsini seçebilirsin):

| Name                     | Value                    | Açıklama                    |
|--------------------------|--------------------------|-----------------------------|
| `VITE_SUPABASE_URL`      | `https://xxx.supabase.co`| Supabase proje URL’in      |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...`             | Supabase anon/public key   |
| `VITE_LIVEKIT_URL`       | `wss://xxx.livekit.cloud`| LiveKit URL (kullanıyorsan)|

- Supabase: https://supabase.com/dashboard → Proje → **Settings** → **API**  
- LiveKit: LiveKit Cloud veya kendi sunucunun URL’i.

3. Her satırda **"Add"** veya **"Save"** tıkla.

---

## Adım 5: Deploy’u başlat

1. **"Deploy"** butonuna tıkla.  
2. Build loglarını izle; hata çıkarsa logdaki satırı kopyalayıp kontrol edebilirsin.  
3. Bitince **"Visit"** veya proje URL’i (örn. `oxide-space.vercel.app`) ile siteyi aç.

---

## Adım 6: Sonraki güncellemeler

Kod değiştirdikçe:

```powershell
git add .
git commit -m "Ne yaptıysan kısa yaz"
git push
```

Vercel, `main` branch’e her push’ta otomatik yeni deploy alır.

---

## Opsiyonel: Vercel CLI ile deploy

Tarayıcı yerine terminalden deploy etmek istersen:

1. **Vercel CLI kur:**

```powershell
npm i -g vercel
```

2. **Proje klasöründe:**

```powershell
cd "c:\Users\semih\OneDrive\Desktop\OxideSpace"
vercel login
vercel
```

- İlk seferde proje adı, root directory vb. sorulur; Enter ile varsayılanları kabul edebilirsin.  
- Ortam değişkenlerini yine Vercel Dashboard’dan (Adım 4) eklemen gerekir.

---

## Sık karşılaşılan durumlar

- **404 / sayfa bulunamadı:** `vercel.json` içindeki `rewrites` SPA için gerekli; projede zaten var, dokunma.  
- **Supabase / LiveKit çalışmıyor:** Dashboard’da ilgili `VITE_` değişkenlerinin doğru ve Production’da göründüğünden emin ol; sonra **Redeploy** yap.  
- **Build hatası:** "Build Logs"’ta hata satırına bak; genelde eksik paket veya TypeScript hatası olur. Lokalde `npm run build` çalışıyorsa Vercel’de de çalışması gerekir.

Bu rehberi takip ederek projeyi Vercel’e deploy edebilirsin. Takıldığın adımı yazarsan oradan devam edebiliriz.
