// SMS Onay — numara tedarikçisi: 5sim (https://5sim.net). Ortam: SMS_API_KEY, SMS_COUNTRY (varsayılan turkey)
const sql = require('./_lib/db');
const { getUserId } = require('./_lib/auth');
const { SMS } = require('./_lib/catalog');

async function prov(path) {
  const r = await fetch('https://5sim.net/v1' + path, { headers: { Authorization: 'Bearer ' + process.env.SMS_API_KEY, Accept: 'application/json' } });
  const t = await r.text();
  if (!r.ok) throw new Error(t || String(r.status));
  try { return JSON.parse(t); } catch { return { raw: t }; }
}
const pub = (o) => ({ id: o.id, product: o.product, price: o.price, status: o.status, phone: o.phone, code: o.code, expires_at: o.expires_at });
const refund = (id, uid, from, to) => sql`
  WITH s AS (UPDATE sms_orders SET status = ${to} WHERE id = ${id} AND user_id = ${uid} AND status = ${from} RETURNING user_id, price)
  UPDATE users SET balance = users.balance + s.price FROM s WHERE users.id = s.user_id RETURNING users.balance`;

module.exports = async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'Giriş yapmalısınız.' });
    if (!process.env.SMS_API_KEY) return res.status(503).json({ error: 'SMS servisi şu an aktif değil.' });

    // ── Durum sorgula (kod geldi mi?) ──
    if (req.method === 'GET') {
      const id = parseInt(req.query.id);
      let o = (await sql`SELECT * FROM sms_orders WHERE id = ${id} AND user_id = ${uid}`)[0];
      if (!o) return res.status(404).json({ error: 'Bulunamadı.' });
      if (o.status === 'waiting') {
        const c = await prov('/user/check/' + o.provider_id);
        const code = c.sms && c.sms[0] && c.sms[0].code;
        if (code) {
          await sql`UPDATE sms_orders SET status = 'received', code = ${String(code)} WHERE id = ${id} AND status = 'waiting'`;
          prov('/user/finish/' + o.provider_id).catch(() => {});
        } else if (['CANCELED', 'TIMEOUT', 'BANNED'].includes(c.status)) {
          await refund(id, uid, 'waiting', 'expired');
        }
        o = (await sql`SELECT * FROM sms_orders WHERE id = ${id} AND user_id = ${uid}`)[0];
      }
      return res.json({ order: pub(o) });
    }
    if (req.method !== 'POST') return res.status(405).end();

    const { action, product, id } = req.body || {};

    // ── Numara al ──
    if (action === 'buy') {
      const p = SMS.find(x => x.id === product);
      if (!p) return res.status(400).json({ error: 'Geçersiz servis.' });
      const r = await sql`
        WITH u AS (UPDATE users SET balance = balance - ${p.price}::int WHERE id = ${uid} AND balance >= ${p.price}::int RETURNING id),
        o AS (INSERT INTO sms_orders (user_id, product, price, status) SELECT id, ${p.id}::text, ${p.price}::int, 'buying' FROM u RETURNING id)
        SELECT id FROM o`;
      if (!r.length) return res.status(402).json({ error: 'Yetersiz bakiye. Lütfen bakiye yükleyiniz.' });
      const oid = r[0].id;
      try {
        const b = await prov(`/user/buy/activation/${process.env.SMS_COUNTRY || 'turkey'}/any/${p.provider}`);
        if (!b.id || !b.phone) throw new Error('bos yanit');
        await sql`UPDATE sms_orders SET status = 'waiting', phone = ${String(b.phone)}, provider_id = ${String(b.id)},
                  expires_at = ${b.expires || new Date(Date.now() + 15 * 60000).toISOString()} WHERE id = ${oid}`;
      } catch (e) {
        console.error('SMS satın alma hatası:', e.message);
        await refund(oid, uid, 'buying', 'failed');
        return res.status(502).json({ error: 'Şu an bu servis için numara bulunamadı. Bakiyeniz iade edildi.' });
      }
      const o = (await sql`SELECT * FROM sms_orders WHERE id = ${oid}`)[0];
      return res.json({ order: pub(o) });
    }

    // ── İptal + iade (kod gelmediyse) ──
    if (action === 'cancel') {
      const o = (await sql`SELECT * FROM sms_orders WHERE id = ${parseInt(id)} AND user_id = ${uid}`)[0];
      if (!o || o.status !== 'waiting') return res.status(400).json({ error: 'İptal edilemez.' });
      const c = await prov('/user/check/' + o.provider_id).catch(() => ({}));
      if (c.sms && c.sms.length) return res.status(400).json({ error: 'Kod geldi, iptal edilemez.' });
      await prov('/user/cancel/' + o.provider_id).catch(() => {});
      await refund(o.id, uid, 'waiting', 'cancelled');
      const n = (await sql`SELECT * FROM sms_orders WHERE id = ${o.id}`)[0];
      return res.json({ order: pub(n) });
    }
    res.status(400).json({ error: 'Geçersiz istek.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};
