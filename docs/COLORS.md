# OxideSpace – Uygulamada Kullanılan Renk Kodları

Tüm hex kodları ve nerede kullanıldıkları aşağıda listelenmiştir.

---

## Ana arayüz (App, sidebar, arka plan)

| Renk / Kullanım | Hex | Tailwind / Not |
|-----------------|-----|-----------------|
| Ana arka plan (ekran, body) | `#09090b` | `bg-[#09090b]` |
| Header / üst bar gradient | `#0c0c0f` → `#121218` → `#0c0c0f` | `from-[#0c0c0f] via-[#121218] to-[#0c0c0f]` |
| Kart / panel arka planı | `#121217` | `bg-[#121217]` |
| Modal / dropdown arka plan | `#18181b` | `bg-[#18181b]` |
| Loading / splash arka plan | `#0a0a0f` | `bg-[#0a0a0f]` |
| Profil / ayar paneli alt | `#0c0c0f` | `bg-[#0c0c0f]/80` |

---

## Auth (Giriş / Kayıt) sayfası

| Renk / Kullanım | Hex | Not |
|-----------------|-----|-----|
| Form kartı arka plan | `#121217` | `bg-[#121217]/80` |
| Gradient (turuncu–kırmızı) | — | `from-orange-500` → `to-red-600` (Tailwind) |
| Focus / vurgu | `rgba(249, 115, 22, 0.5)` | `focus:border-orange-500/50`, `--focus-ring` |
| Google ikonu mavi | `#4285F4` | SVG fill |
| Google ikonu yeşil | `#34A853` | SVG fill |
| Google ikonu sarı | `#FBBC05` | SVG fill |
| Google ikonu kırmızı | `#EA4335` | SVG fill |

---

## Discord / Ses kanalı paleti

Tailwind’de `tailwind.config.js` içinde tanımlı:

| İsim | Hex | Kullanım |
|------|-----|----------|
| `discord.bg` | `#000000` | Siyah |
| `discord.bg-app` | `#1e1f22` | Kontrol çubuğu, tile border, scrollbar |
| `discord.surface` | `#2b2d31` | Video tile, sidebar, panel yüzeyi |
| `discord.surface-hover` | `#313338` | DiscordVoiceRoom ana arka plan |
| `discord.control-bar` | `#232428` | (config’de; bazen #1e1f22 kullanılıyor) |
| `discord.blurple` | `#5865F2` | Discord mavi, slider accent, vurgu |
| `discord.success` | `#23a559` | Konuşma border, yeşil buton, “Bağlan” |
| `discord.destructive` | `#da373c` | Çıkış / disconnect |
| `discord.text-primary` | `#f2f3f5` | Ana metin |
| `discord.text-secondary` | `#949ba4` | İkincil metin |

### Ses / video bileşenlerinde doğrudan hex

| Hex | Kullanım |
|-----|----------|
| `#1e1f22` | VoiceControlBar, VoiceChannelView arka plan, tile border, scrollbar thumb |
| `#2b2d31` | Video tile, sidebar, ekran paylaşımı alanı |
| `#313338` | DiscordVoiceRoom ana container |
| `#23a559` | Konuşma vurgusu, “Bağlan” butonu |
| `#1f9651` | Yeşil buton hover |
| `#da373c` | Disconnect butonu |
| `#a1282c` | Disconnect hover |
| `#f2f3f5` | Metin (açık) |
| `#313338` | Buton metni (koyu mod) |
| `#35373c` | Hover arka plan |
| `#3f4147` | Ayırıcı çizgi, hover |
| `#383a40` | Input arka plan |
| `#111214` | Tooltip / popover |
| `#80848e` | İkincil metin (ses menüsü) |
| `#b5bac1` | Ses menüsü metin |
| `#404249` | Ses menüsü hover |
| `#dbdee1` | Ses menüsü ana metin |

---

## Vurgu / marka (turuncu–kırmızı)

| Kullanım | Değer |
|----------|--------|
| Ana gradient | Tailwind: `orange-500` → `red-600` |
| Focus ring (CSS variable) | `rgba(249, 115, 22, 0.5)` → `0.6` |
| Seçim arka planı | `selection:bg-orange-500/30` |
| Header gölge | `rgba(249,115,22,0.12)` |
| Slider / toggle | `accent-orange-500`, `ring-orange-500` |

---

## Diğer sabit renkler

| Hex | Kullanım |
|-----|----------|
| `#1DB954` | Spotify yeşil (entegrasyon kartı) |
| `#5865F2` | Discord Blurple (ses menüsü slider, entegrasyon) |

---

## Tailwind sınıfları (hex’e karşılık)

- **Beyaz / saydam:** `white`, `white/5`, `white/10`, `white/15`, `white/20`
- **Siyah:** `black`, `black/40`, `black/90`
- **Gri / zinc:** `zinc-400`, `zinc-500`, `zinc-700`, `gray-100`, `gray-500`, `gray-700`, `gray-900`
- **Turuncu:** `orange-400`, `orange-500`, `orange-600`, `orange-900/10`
- **Kırmızı:** `red-400`, `red-500/10`, `red-600`
- **Yeşil:** `green-400`, `green-500`, `green-900/20`
- **Amber:** `amber-500/60` (sürükle-bırak vurgusu)

---

## index.css ve scrollbar

| Öğe | Değer |
|-----|--------|
| Focus outline | `rgba(249, 115, 22, 0.6)` |
| Custom scrollbar thumb | `rgba(255,255,255,0.1)` → hover `0.2` |
| Discord sidebar scrollbar thumb | `#1e1f22`, hover `#2b2d31` |
| Firefox scrollbar | `scrollbar-color: rgba(255,255,255,0.15) transparent` |

Bu dosya tasarım veya marka rehberi için referans olarak kullanılabilir.
