const jwt = require('jsonwebtoken');
const NAME = 'zdm_session';

function setCookie(res, uid) {
  const t = jwt.sign({ uid }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.setHeader('Set-Cookie', `${NAME}=${t}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`);
}
function clearCookie(res) {
  res.setHeader('Set-Cookie', `${NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
}
function getUserId(req) {
  const m = (req.headers.cookie || '').match(new RegExp('(?:^|; )' + NAME + '=([^;]+)'));
  if (!m) return null;
  try { return jwt.verify(m[1], process.env.JWT_SECRET).uid; } catch { return null; }
}
module.exports = { setCookie, clearCookie, getUserId };
