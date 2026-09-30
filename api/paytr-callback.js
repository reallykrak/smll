// PayTR panelinde "Bildirim URL" olarak: https://SITENIZ/api/paytr-callback
const crypto = require('crypto');
const sql = require('./_lib/db');
const credit = require('./_lib/credit');

module.exports = async (req, res) => {
  try {
    const b = req.body || {};
    const hash = crypto.createHmac('sha256', process.env.PAYTR_MERCHANT_KEY)
      .update(String(b.merchant_oid) + process.env.PAYTR_MERCHANT_SALT + b.status + b.total_amount)
      .digest('base64');
    if (hash !== b.hash) return res.status(400).send('bad hash');

    if (b.status === 'success') await credit(sql, b.merchant_oid);
    else await sql`UPDATE deposits SET status = 'failed' WHERE oid = ${b.merchant_oid} AND status = 'pending'`;

    res.status(200).send('OK'); // PayTR "OK" bekler
  } catch (e) {
    console.error(e);
    res.status(500).send('error');
  }
};
