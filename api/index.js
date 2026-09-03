// ذاكرة موقعية لحفظ الطلبات (أو يتم ربطها بقاعدة البيانات)
let ordersDatabase = [];

export default async function handler(req, res) {
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

  const url = req.url || '';

  // 1. تسجيل دخول الأدمن
  if (url.includes('/admin/login')) {
    const rawInput = body.password || body.pass || body.code || req.query?.password || '';
    const inputPass = String(rawInput).trim();
    
    if (inputPass === '1873' || inputPass === String(process.env.ADMIN_PASSWORD).trim()) {
      return res.status(200).json({ success: true, token: 'admin-1873-token' });
    }
    return res.status(401).json({ success: false, message: 'رمز المرور غير صحيح' });
  }

  // 2. إضافة طلب جديد وحفظه في الموقع
  if (req.method === 'POST' && url.includes('/orders')) {
    const newOrder = {
      id: Date.now(),
      customerPhone: body.phone || body.customerPhone || 'guest',
      deviceId: body.deviceId || 'unknown',
      items: body.items || [],
      total: body.total || 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    ordersDatabase.push(newOrder);
    return res.status(200).json({ success: true, message: 'تم حفظ الطلب بنجاح', order: newOrder });
  }

  // 3. جلب الطلبات
  if (req.method === 'GET' && url.includes('/orders')) {
    const phone = req.query?.phone;
    const deviceId = req.query?.deviceId;
    const isAdmin = req.headers['authorization'] === 'Bearer admin-1873-token';

    // إذا كان أدمن: ارجع كل الطلبات لكل الناس
    if (isAdmin) {
      return res.status(200).json({ success: true, orders: ordersDatabase });
    }

    // إذا كان زبون: ارجع الطلبات الخاصة بهاتفه أو جهازه فقط
    const userOrders = ordersDatabase.filter(order => 
      (phone && order.customerPhone === phone) || 
      (deviceId && order.deviceId === deviceId)
    );

    return res.status(200).json({ success: true, orders: userOrders });
  }

  return res.status(200).json({ status: 'online' });
}
