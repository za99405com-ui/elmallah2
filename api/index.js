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

  // البحث عن الرمز في كل المفتايح الممكنة (password, pass, code, pin) أو Query
  const rawInput = body.password || body.pass || body.code || body.pin || req.query?.password || req.query?.code || '';
  const inputPass = String(rawInput).trim();
  const envPass = String(process.env.ADMIN_PASSWORD || '1873').trim();

  // قبول الرمز 1873 دائماً
  if (inputPass === '1873' || inputPass === envPass || inputPass.includes('1873')) {
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
