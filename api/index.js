export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let rawBody = '';
  try {
    if (req.body) {
      rawBody = typeof req.body === 'object' ? JSON.stringify(req.body) : String(req.body);
    } else {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      rawBody = Buffer.concat(buffers).toString();
    }
  } catch (e) {
    rawBody = '';
  }

  // ينجح الدخول إذا أرسل المستخدم 1873 أو احتوى جسم الطلب أو الرابط عليه
  const isMatch = rawBody.includes('1873') || 
                  req.url.includes('1873') || 
                  (req.query && JSON.stringify(req.query).includes('1873'));

  if (isMatch) {
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
