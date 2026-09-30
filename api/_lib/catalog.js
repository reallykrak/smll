// ─────────────────────────────────────────────────────────────
// SERVİS KATALOĞU — fiyatları burada düzenle. Fiyatlar KURUŞ / 1000 adet.
// (Örnek fiyatlardır; tedarikçi maliyetine göre kendin belirle.)
// ─────────────────────────────────────────────────────────────
const S = (id, platform, category, name, price, min, max, desc = '') => ({ id, platform, category, name, price, min, max, desc });

const SERVICES = [
  S('ig-fol-tr', 'instagram', 'Takipçi', 'Instagram Türk Takipçi', 4500, 100, 10000, 'Profil linki giriniz. Hesap herkese açık olmalıdır.'),
  S('ig-fol-gl', 'instagram', 'Takipçi', 'Instagram Global Takipçi', 1800, 100, 20000, 'Profil linki giriniz. Hesap herkese açık olmalıdır.'),
  S('ig-like-tr', 'instagram', 'Beğeni', 'Instagram Türk Beğeni', 190, 10, 1000, 'Gönderi linki giriniz.'),
  S('ig-like-gl', 'instagram', 'Beğeni', 'Instagram Global Beğeni', 90, 50, 50000, 'Gönderi linki giriniz.'),
  S('ig-view', 'instagram', 'İzlenme', 'Instagram Video / Reels İzlenme', 60, 100, 1000000, 'Video veya Reels linki giriniz.'),
  S('ig-com', 'instagram', 'Yorum', 'Instagram Türk Yorum (Rastgele)', 15000, 5, 500, 'Gönderi linki giriniz.'),
  S('tt-fol', 'tiktok', 'Takipçi', 'TikTok Takipçi', 6000, 100, 10000, 'Profil linki giriniz.'),
  S('tt-like', 'tiktok', 'Beğeni', 'TikTok Beğeni', 1500, 50, 20000, 'Video linki giriniz.'),
  S('tt-view', 'tiktok', 'İzlenme', 'TikTok İzlenme', 40, 500, 1000000, 'Video linki giriniz.'),
  S('yt-view', 'youtube', 'İzlenme', 'YouTube İzlenme', 8000, 100, 100000, 'Video linki giriniz.'),
  S('yt-like', 'youtube', 'Beğeni', 'YouTube Beğeni', 4000, 50, 20000, 'Video linki giriniz.'),
  S('yt-sub', 'youtube', 'Abone', 'YouTube Abone', 25000, 50, 5000, 'Kanal linki giriniz.'),
  S('x-fol', 'x', 'Takipçi', 'X (Twitter) Takipçi', 9000, 100, 10000, 'Profil linki giriniz.'),
  S('x-like', 'x', 'Beğeni', 'X (Twitter) Beğeni', 3500, 50, 10000, 'Gönderi linki giriniz.')
];

// SMS Onay — fiyat: kuruş / numara. provider = tedarikçideki ürün kodu (5sim ürün adı)
const SMS = [
  { id: 'whatsapp', name: 'WhatsApp', price: 2500, provider: 'whatsapp', icon: 'msg' },
  { id: 'telegram', name: 'Telegram', price: 2000, provider: 'telegram', icon: 'msg' },
  { id: 'instagram', name: 'Instagram', price: 1500, provider: 'instagram', icon: 'instagram' },
  { id: 'tiktok', name: 'TikTok', price: 1500, provider: 'tiktok', icon: 'tiktok' },
  { id: 'google', name: 'Google / Gmail / YouTube', price: 1200, provider: 'google', icon: 'msg' },
  { id: 'x', name: 'X (Twitter)', price: 1500, provider: 'twitter', icon: 'x' },
  { id: 'facebook', name: 'Facebook', price: 1200, provider: 'facebook', icon: 'msg' },
  { id: 'discord', name: 'Discord', price: 1200, provider: 'discord', icon: 'msg' }
];

const HOSTS = {
  instagram: ['instagram.com'], tiktok: ['tiktok.com'],
  youtube: ['youtube.com', 'youtu.be'], x: ['x.com', 'twitter.com']
};

module.exports = { SERVICES, SMS, HOSTS };
