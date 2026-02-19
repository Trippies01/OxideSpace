# OxideSpace – Canvas kanalı

**Varsayılan:** Her kanalın **kendi** canvas'ı vardır (ortak beyaz tahta / Excalidraw). Veriler kanal başına saklanır; tek bir "herkesin gördüğü paylaşılan yer" yok.

---

## Nasıl çalışır (varsayılan)

- **Canvas kanalı** = o kanala özel beyaz tahta. Kanal A'nın çizimi Kanal B'de görünmez.
- Veri `channels.canvas_data` içinde **kanal bazında** tutulur; anlık senkron Supabase Realtime ile yapılır.
- Kullanıcı URL girmez; kanala tıklar, doğrudan o kanalın canvas'ı açılır.
- REMOVED_EOL `http://localhost:9001/#/embed` iframe’de yüklenir (kullanıcıya gösterilmez, env ile değiştirilebilir).
- **Penpot**: `/embed` adresi, yapılandırılmış varsayılan dosyaya (paylaşım linki) yönlendirir; giriş ekranı çıkmaz.
- **Tek seferlik kurulum**: Sadece Penpot’u çalıştıran kişi (siz veya sunucu yöneticisi) bir kez “varsayılan embed dosyası”nı ayarlar. Sonrasında tüm kullanıcılar sadece kanala tıklar.

---

## İsteğe bağlı: Tek bir Penpot dosyası (eskisi gibi)

Tüm canvas kanallarında **aynı** Penpot dosyasının açılmasını isterseniz (tek paylaşılan yer), `.env.local` içinde şunu tanımlayın:

```env
VITE_PENPOT_EMBED_URL=http://localhost:9001/#/embed?file-id=...&share-id=...
```

Bu ayar **yoksa** (varsayılan) her kanal kendi canvas’ına sahip olur; kimse sizin paylaştığınız tek yeri görmez.
