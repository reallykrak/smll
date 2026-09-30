const sql = require('./_lib/db');
const { getUserId } = require('./_lib/auth');
const { SERVICES, HOSTS } = require('./_lib/catalog');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'Giriş yapmalısınız.' });

    const { service, link, quantity } = req.body || {};
    const svc = SERVICES.find(s => s.id === service);
    if (!svc) return res.status(400).json({ error: 'Geçersiz servis.' });

    let host = '';
    try { const u = new URL(String(link)); if (u.protocol === 'https:') host = u.hostname.replace(/^www\./, '').replace(/^m\./, ''); } catch {}
    if (!HOSTS[svc.platform].some(h => host === h || host.endsWith('.' + h)))
      return res.status(400).json({ error: 'Geçerli bir ' + svc.platform + ' linki giriniz (https://...).' });

    const q = parseInt(quantity);
    if (!(q >= svc.min && q <= svc.max)) return res.status(400).json({ error: `Miktar ${svc.min} ile ${svc.max} arasında olmalıdır.` });

    const cost = Math.max(1, Math.ceil((q * svc.price) / 1000));
    const r = await sql`
      WITH u AS (
        UPDATE users SET balance = balance - ${cost}::int
        WHERE id = ${uid} AND balance >= ${cost}::int
        RETURNING id, balance
      ), o AS (
        INSERT INTO orders (user_id, service_id, service_name, link, quantity, cost)
        SELECT id, ${svc.id}::text, ${svc.name}::text, ${String(link)}::text, ${q}::int, ${cost}::int FROM u
        RETURNING id
      )
      SELECT u.balance, o.id FROM u, o`;
    if (!r.length) return res.status(402).json({ error: 'Yetersiz bakiye. Lütfen bakiye yükleyiniz.' });
    res.json({ orderId: r[0].id, balance: r[0].balance });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};
