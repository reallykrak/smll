# ZeroDijitalMarket

Vercel (statik site + `/api` serverless) + Neon Postgres + PayTR.

## Kurulum
1. **Neon** (neon.tech) → ücretsiz proje aç → `db/schema.sql` içeriğini SQL Editor'de çalıştır → bağlantı adresini kopyala.
2. **PayTR** mağaza hesabı aç (Merchant ID / Key / Salt). PayTR panelinde **Bildirim URL**: `https://SITENIZ/api/paytr-callback`
3. GitHub'a yükle → Vercel'de içe aktar (Framework: Other).
4. Vercel → Settings → Environment Variables: `.env.example` içindeki tüm değişkenleri gir. Deploy.
5. Yönetim: `https://SITENIZ/admin.html` (ADMIN_KEY ile) → havale onayı, sipariş tamamlama/iptal+iade.

## Akış
- Kart: `/api/deposit` → PayTR token → iframe (3D Secure) → PayTR `/api/paytr-callback` → bakiye otomatik eklenir.
- Havale/EFT: `/api/deposit` → benzersiz açıklama kodu (ZDMxxxxxx) → müşteri IBAN'a kodla gönderir → admin panelden onaylar.
- Kart bilgisi asla sitenizden geçmez (PayTR barındırır) → PCI yükünüz yok.
- Siparişler `pending` düşer; sağlayıcıya iletim (SMM API) henüz bağlı değil.

## Sonraki sürüm notları
- Servis/fiyat düzenleme: `api/_lib/catalog.js` (fiyatlar kuruş / 1000 adet). SMS fiyatları aynı dosyada.
- SMS Onay: 5sim hesabı aç, `SMS_API_KEY` gir. Kod gelmezse kullanıcı iptal edip otomatik iade alır.
- Destek linkleri: `js/config.js` (WHATSAPP, TELEGRAM).
- DB'yi güncellemek için `db/schema.sql` dosyasını tekrar çalıştır (güvenli).
- Siparişler `pending` düşer; tedarikçiye iletim admin panelinden elle yapılır (`/admin.html`).
