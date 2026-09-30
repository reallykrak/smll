const sql = require('./_lib/db');
const credit = require('./_lib/credit');

module.exports = async (req, res) => {
  try {
    if (!process.env.ADMIN_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_KEY)
      return res.status(401).json({ error: 'Yetkisiz' });

    if (req.method === 'GET') {
      const deposits = await sql`SELECT d.oid, d.amount, d.created_at, u.email FROM deposits d JOIN users u ON u.id = d.user_id
                                 WHERE d.method = 'iban' AND d.status = 'pending' ORDER BY d.id DESC LIMIT 100`;
      const orders = await sql`SELECT o.id, o.service_name, o.link, o.quantity, o.cost, o.created_at, u.email FROM orders o JOIN users u ON u.id = o.user_id
                               WHERE o.status = 'pending' ORDER BY o.id LIMIT 100`;
      return res.json({ deposits, orders });
    }
    if (req.method !== 'POST') return res.status(405).end();

    const { type, oid, id, action } = req.body || {};
    if (type === 'deposit') {
      if (action === 'approve') return res.json({ ok: await credit(sql, oid) });
      if (action === 'reject') { await sql`UPDATE deposits SET status = 'rejected' WHERE oid = ${oid} AND status = 'pending'`; return res.json({ ok: true }); }
    }
    if (type === 'order') {
      if (action === 'complete') { await sql`UPDATE orders SET status = 'completed' WHERE id = ${id} AND status = 'pending'`; return res.json({ ok: true }); }
      if (action === 'cancel') { // iptal + iade (atomik)
        const r = await sql`WITH o AS (UPDATE orders SET status = 'cancelled' WHERE id = ${id} AND status = 'pending' RETURNING user_id, cost)
                            UPDATE users SET balance = users.balance + o.cost FROM o WHERE users.id = o.user_id RETURNING users.id`;
        return res.json({ ok: r.length > 0 });
      }
    }
    res.status(400).json({ error: 'Geçersiz istek.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};
