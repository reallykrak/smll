const crypto = require('crypto');
const sql = require('./_lib/db');
const { getUserId } = require('./_lib/auth');

const rand = (n) => crypto.randomBytes(8).toString('hex').toUpperCase().slice(0, n);

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'Giriş yapmalısınız.' });

    const { method } = req.body || {};
    const tl = Number((req.body || {}).amount);
    if (!(tl >= 10 && tl <= 10000)) return res.status(400).json({ error: 'Tutar ₺10 ile ₺10.000 arasında olmalıdır.' });
    const kurus = Math.round(tl * 100);

    // ── HAVALE / EFT ────────────────────────────────────────────
    if (method === 'iban') {
      const oid = 'ZDM' + rand(6);
      await sql`INSERT INTO deposits (user_id, oid, method, amount) VALUES (${uid}, ${oid}, 'iban', ${kurus})`;
      return res.json({
        oid, amount: kurus,
        iban: process.env.IBAN_NO, name: process.env.IBAN_NAME, bank: process.env.IBAN_BANK
      });
    }

    // ── KART + 3D SECURE (PayTR iFrame API) ─────────────────────
    if (method === 'card') {
      const u = (await sql`SELECT name, email FROM users WHERE id = ${uid}`)[0];
      const oid = 'ZDMC' + Date.now() + rand(6); // PayTR: sadece harf+rakam
      await sql`INSERT INTO deposits (user_id, oid, method, amount) VALUES (${uid}, ${oid}, 'card', ${kurus})`;

      const MID = process.env.PAYTR_MERCHANT_ID, KEY = process.env.PAYTR_MERCHANT_KEY, SALT = process.env.PAYTR_MERCHANT_SALT;
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || '127.0.0.1';
      const basket = Buffer.from(JSON.stringify([['Bakiye Yukleme', (kurus / 100).toFixed(2), 1]])).toString('base64');
      const noInst = '1', maxInst = '0', currency = 'TL', test = process.env.PAYTR_TEST_MODE || '1';
      const hashStr = `${MID}${ip}${oid}${u.email}${kurus}${basket}${noInst}${maxInst}${currency}${test}`;
      const paytrToken = crypto.createHmac('sha256', KEY).update(hashStr + SALT).digest('base64');

      const body = new URLSearchParams({
        merchant_id: MID, user_ip: ip, merchant_oid: oid, email: u.email,
        payment_amount: String(kurus), paytr_token: paytrToken, user_basket: basket,
        debug_on: test, no_installment: noInst, max_installment: maxInst,
        user_name: u.name, user_address: 'Turkiye', user_phone: process.env.PAYTR_DEFAULT_PHONE || '05000000000',
        merchant_ok_url: process.env.SITE_URL + '/odeme-ok.html',
        merchant_fail_url: process.env.SITE_URL + '/odeme-hata.html',
        timeout_limit: '30', currency, test_mode: test, lang: 'tr'
      });
      const r = await fetch('https://www.paytr.com/odeme/api/get-token', { method: 'POST', body });
      const j = await r.json();
      if (j.status !== 'success') {
        await sql`UPDATE deposits SET status = 'failed' WHERE oid = ${oid}`;
        console.error('PayTR hata:', j);
        return res.status(502).json({ error: 'Ödeme başlatılamadı. Lütfen daha sonra tekrar deneyin.' });
      }
      return res.json({ token: j.token });
    }

    res.status(400).json({ error: 'Geçersiz ödeme yöntemi.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};
