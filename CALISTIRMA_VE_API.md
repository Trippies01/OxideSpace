# OxideSpace – Çalıştırma ve API Bağlantısı

Bu rehber, projeyi yerelde nasıl çalıştıracağınızı ve **Supabase API** bağlantısını nasıl kuracağınızı adım adım anlatır.

---

## 1. Projeyi çalıştırmak

### Gereksinimler
- **Node.js** v18 veya üzeri
- **npm** (Node ile gelir)
- Masaüstü uygulama (Tauri) için: **Rust** ve **Windows Build Tools** (Visual Studio C++ workload)

### Adım 1: Bağımlılıkları yükle
Proje klasöründe:

```bash
cd C:\Users\semih\OneDrive\Desktop\OxideSpace
npm install
```

### Adım 2: Ortam değişkenlerini (API bağlantısı) ayarla
Supabase olmadan uygulama açılır ama giriş yapılamaz ve veri çekilemez. Önce Supabase’i ayarlayın (aşağıda), sonra:

1. Kök dizinde **`.env.local`** dosyası oluşturun (yoksa).
2. İçine şunları yazın (kendi değerlerinizle değiştirin):

```env
VITE_SUPABASE_URL=https://PROJE_REFERANSINIZ.supabase.co
VITE_SUPABASE_ANON_KEY=anon_key_buraya
```

Örnek için `.env.example` dosyasına bakabilirsiniz. `.env.local` dosyası git’e eklenmez; güvenlik için paylaşmayın.

### Adım 3: Uygulamayı çalıştır

**Seçenek A – Sadece web (tarayıcı)**  
Vite sunucusu 5173 portunda açılır:

```bash
npm run dev
```

Tarayıcıda: **http://localhost:5173**

**Seçenek B – Masaüstü uygulama (Tauri, önerilen)**  
Hem arayüz hem de pencere açılır:

```bash
npm run tauri:dev
```

Bu komut önce web arayüzünü derler, sonra Tauri ile masaüstü penceresini açar. İlk seferde Rust bağımlılıkları indirilebilir.

---

## 2. API bağlantısı: Supabase kurulumu

OxideSpace veritabanı ve giriş için **Supabase** kullanır. Kendi Supabase projenizi oluşturup bağlamanız gerekir.

### 2.1 Supabase projesi oluşturma
1. **[supabase.com](https://supabase.com)** → Giriş yap (veya kayıt ol).
2. **New Project** → Organizasyon ve proje adı seçin (örn. OxideSpace).
3. Veritabanı şifresi belirleyin (saklayın).
4. Bölge seçin → **Create new project**. Proje hazır olana kadar bekleyin.

### 2.2 URL ve Anon Key almak
1. Sol menüden **Project Settings** (dişli ikonu) → **API**.
2. Şunları kopyalayın:
   - **Project URL** → `.env.local` içinde `VITE_SUPABASE_URL`
   - **anon public** key (Public / anon key) → `.env.local` içinde `VITE_SUPABASE_ANON_KEY`

Örnek:
```env
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...
```

### 2.3 Veritabanı tabloları
Uygulama şu tablolara ihtiyaç duyar: `profiles`, `servers`, `server_members`, `channels`, `messages`, `notifications`, `dm_threads`, `friends`, vb.  

Projede hazır **migration** veya **SQL** dosyaları varsa Supabase **SQL Editor**’da çalıştırın. Yoksa:
- **Table Editor** ile elle tabloları oluşturabilirsiniz.
- Veya `src/types/supabase.ts` ve `SETUP.md` içinde geçen yapıya göre (servers, channels, profiles, messages, server_members, RLS politikaları) kendi migration’larınızı yazabilirsiniz.

**Auth:** Supabase **Authentication** açık olmalı. **Authentication → Providers** ile Email ve istersen Google girişi ayarlayın. Redirect URL’leri **Authentication → URL Configuration** içinde `http://localhost:5173` (ve Tauri için gerekli adresler) ekleyin. Detay için `SETUP.md` içindeki “Supabase: E-posta doğrulama ve Google ile giriş” bölümüne bakın.

### 2.4 Bağlantıyı test etmek
1. `.env.local` kaydedildikten sonra uygulamayı yeniden başlatın: `npm run dev` veya `npm run tauri:dev`.
2. Uygulamada **Kayıt ol** / **Giriş yap** deneyin. E-posta veya Google ile giriş çalışıyorsa Supabase bağlantısı doğrudur.
3. Sunucu oluşturup kanal açabiliyorsanız veritabanı ve RLS de doğru demektir.

---

## 3. İsteğe bağlı: Ses (LiveKit)

Sesli kanallar **LiveKit** kullanır. Sadece metin ve canvas kullanacaksanız bu adımı atlayabilirsiniz.

1. [LiveKit Cloud](https://cloud.livekit.io) veya kendi LiveKit sunucunuzla bir proje alın.
2. **API Key** ve **API Secret** ile **WebSocket URL** (örn. `wss://xxx.livekit.cloud`) elde edin.
3. Uygulama şu an **client-side** için `VITE_LIVEKIT_URL` bekliyor; token genelde Supabase Edge Function veya backend’den alınır.  
   Geliştirme için geçici olarak `.env.local`’e ekleyebilirsiniz:
   ```env
   VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
   ```
   Token üretimi ve güvenli kullanım için backend/Edge Function dokümantasyonuna bakın.

---

## 4. Özet komutlar

| Ne yapıyorsunuz      | Komut              |
|----------------------|--------------------|
| Bağımlılık yükle     | `npm install`      |
| Web’de çalıştır      | `npm run dev`      |
| Masaüstünde çalıştır | `npm run tauri:dev`|
| Production build     | `npm run build`    |
| Kurulum (installer)  | `npm run setup`    |

**API bağlantısı:** `.env.local` içinde `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` tanımlı olmalı. Supabase’te proje oluşturup bu değerleri aldıktan sonra uygulama giriş ve veritabanı işlemlerini yapabilir.
