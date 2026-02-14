# Arkadaşınla Test Etmek

Uygulama **Supabase** kullandığı için veriler (giriş, mesajlar, sunucular) zaten bulutta. Arkadaşın da **aynı Supabase projesine** bağlanırsa ikiniz aynı sunucuları, kanalları ve DM’leri görürsünüz. **Hosting şart değil**; aşağıdaki yollardan birini seçmen yeterli.

---

## Seçenek 1: Aynı WiFi’de – En hızlı (hosting yok)

Sen bilgisayarında projeyi “ağa açık” çalıştırırsın, arkadaşın tarayıcıdan senin IP’ne bağlanır.

1. Projede:
   ```bash
   npm run dev:host
   ```
2. Terminalde çıkan adresi görürsün, örn: `http://192.168.1.5:5173`
3. Arkadaşın **aynı WiFi’de** tarayıcıda bu adresi açar: `http://192.168.1.5:5173`
4. Sen de aynı adresi veya `http://localhost:5173` kullanabilirsin.

**Supabase:**  
Supabase Dashboard → **Authentication → URL Configuration → Redirect URLs** kısmına şunu ekle:
- `http://192.168.1.5:5173` (kendi IP’ni yaz; her ağda değişebilir)
- `http://192.168.1.5:5173/**`

Böylece giriş / şifre sıfırlama linkleri bu adreste çalışır.

---

## Seçenek 2: İnternetten – Frontend’i deploy et (en rahat)

Frontend’i **Vercel** veya **Netlify**’a ücretsiz deploy edersen arkadaşın sadece linki açar; sen de aynı linki veya Tauri uygulamasını kullanırsın.

### Vercel ile (kısa adımlar)

1. [vercel.com](https://vercel.com) → GitHub ile giriş.
2. “Add New Project” → Repoyu seç (veya projeyi GitHub’a push et).
3. Root: proje klasörü, Build: `npm run build`, Output: `dist`.
4. **Environment Variables** ekle (Supabase için):
   - `VITE_SUPABASE_URL` = Supabase proje URL’in
   - `VITE_SUPABASE_ANON_KEY` = Supabase anon key’in
5. Deploy et; sana `https://xxx.vercel.app` gibi bir link verir.

**Supabase:**  
Authentication → URL Configuration → Redirect URLs:
- `https://xxx.vercel.app`
- `https://xxx.vercel.app/**`

Arkadaşın bu linki açar, kayıt olur / giriş yapar; sen de aynı linkten veya Tauri’den giriş yaparsan aynı sunucuları ve mesajları görürsünüz.

### Netlify

1. [netlify.com](https://netlify.com) → “Add new site” → “Import from Git”.
2. Build command: `npm run build`, Publish directory: `dist`.
3. Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. Deploy sonrası verilen site URL’ini Supabase Redirect URLs’e ekle (yukarıdaki gibi).

---

## Seçenek 3: İkiniz de uygulamayı kendi bilgisayarınızda çalıştırın

- Arkadaşın projeyi clone’layıp kendi bilgisayarında `npm run dev` çalıştırır **ve** aynı `.env` değerlerini kullanır (sadece `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY`; bu key’leri güvenli bir yolla paylaş).
- Veya sen **Tauri build** alıp `.exe` / kurulum dosyasını arkadaşına gönderirsin; o da aynı Supabase projesine bağlı çalışacak şekilde build’i senin env ile alırsın (veya arkadaş kendi .env’ini koyar).

Bu durumda herkes kendi `localhost:5173`’ünü kullanır; veri yine Supabase’de ortak olur.

---

## Özet

| Yöntem              | Hosting gerekir mi? | Arkadaş ne yapar?              |
|---------------------|---------------------|---------------------------------|
| 1. Aynı WiFi (dev:host) | Hayır               | Tarayıcıdan senin IP:5173 açar |
| 2. Vercel/Netlify   | Ücretsiz hosting    | Verdiğin tek linki açar        |
| 3. İkisi de local   | Hayır               | Kendi bilgisayarında çalıştırır |

**Supabase:** Hangi yöntemi kullanırsan kullan, Authentication → Redirect URLs kısmına o adresi (LAN IP veya deploy URL) mutlaka ekle; yoksa giriş/şifre sıfırlama yönlendirmesi hata verir.
