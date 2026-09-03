module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  body = body || {};

  const url = req.url || '';

  if (url.includes('/health')) {
    return res.status(200).json({ status: 'ok', server: 'Vercel Clean Native API' });
  }

  if (url.includes('/admin/login')) {
    const password = body.password;
    // قراءة الباسورد المحمي من متغيرات Vercel أو استخدام 1873 كقيمة افتراضية
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || '1873';

    if (String(password) === String(ADMIN_PASS)) {
      return res.status(200).json({
        success: true,
        token: 'admin-authenticated-token-2026',
        message: 'تم تسجيل الدخول بنجاح'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'رمز المرور غير صحيح'
      });
    }
  }

  return res.status(200).json({ status: 'online', endpoint: url });
};
