const { SERVICES, SMS } = require('./_lib/catalog');
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=60');
  res.json({ services: SERVICES, sms: SMS.map(({ provider, ...s }) => s) });
};
