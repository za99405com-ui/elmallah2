export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }

  // استخراج الباسورد وتنظيف الفراغات
  const inputPass = String(body.password || body.pass || req.query?.password || '').trim();
  const envPass = String(process.env.ADMIN_PASSWORD || '1873').trim();

  // قبول الدخول إذا طابق 1873 أو المتغير المعرف
  if (inputPass === '1873' || inputPass === envPass) {
    return res.status(200).json({
      success: true,
      token: 'admin-authenticated-token-1873',
      message: 'تم تسجيل الدخول بنجاح'
    });
  }

  return res.status(401).json({
    success: false,
    message: 'رمز المرور غير صحيح'
  });
}
