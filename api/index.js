module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url;

  if (url.includes('/health')) {
    return res.status(200).json({ status: 'ok', message: 'Server is running perfectly' });
  }

  if (url.includes('/admin/login')) {
    const { password } = req.body || {};
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || '1234';

    if (password === ADMIN_PASS) {
      return res.status(200).json({ success: true, token: 'admin-authenticated-token' });
    }
    return res.status(401).json({ success: false, message: 'رمز المرور غير صحيح' });
  }

  return res.status(404).json({ error: 'Route not found' });
};
