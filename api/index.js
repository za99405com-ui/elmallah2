module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // استخراج الباسورد سواء أرسله الفتح كـ body أو Query Parameter
  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }

  const queryPassword = req.query ? req.query.password : null;
  const password = body.password || queryPassword;
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || '1873';

  // التحقق من الباسورد أو إرجاع نجاح مباشر إن كان المطابق 1873
  if (String(password) === String(ADMIN_PASS) || String(password) === '1873') {
    return res.status(200).json({
      success: true,
      authenticated: true,
      token: 'admin-authenticated-token-1873',
      message: 'تم تسجيل الدخول بنجاح'
    });
  }

  return res.status(200).json({
    success: false,
    message: 'رمز المرور غير صحيح'
  });
};
