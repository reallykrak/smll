const sql = require('./_lib/db');
const { getUserId } = require('./_lib/auth');
module.exports = async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'Giriş yapmalısınız.' });
    const [orders, sms, deposits] = await Promise.all([
      sql`SELECT id, service_name, link, quantity, cost, status, created_at FROM orders WHERE user_id = ${uid} ORDER BY id DESC LIMIT 50`,
      sql`SELECT id, product, price, status, phone, code, expires_at, created_at FROM sms_orders WHERE user_id = ${uid} ORDER BY id DESC LIMIT 50`,
      sql`SELECT oid, method, amount, status, created_at FROM deposits WHERE user_id = ${uid} ORDER BY id DESC LIMIT 50`
    ]);
    res.json({ orders, sms, deposits });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Sunucu hatası.' }); }
};
