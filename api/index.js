let ordersDatabase = [];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. قراءة بيانات الطلب بشكل آمن
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

  const url = req.url || '';

  // 2. مسار تسجيل دخول الإدارة (يفحص الرمز 1873 تحديداً)
  if (url.includes('/admin/login')) {
    const isPass1873 = rawBody.includes('1873') || 
                       url.includes('1873') || 
                       (req.query && JSON.stringify(req.query).includes('1873'));

    if (isPass1873) {
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

  // 3. مسار حفظ الطلبات الجديدة
  if (req.method === 'POST' && url.includes('/orders')) {
    let parsedBody = {};
    try { parsedBody = JSON.parse(rawBody); } catch (e) {}

    const newOrder = {
      id: Date.now(),
      customerPhone: parsedBody.phone || parsedBody.customerPhone || 'guest',
      deviceId: parsedBody.deviceId || 'unknown',
      items: parsedBody.items || [],
      total: parsedBody.total || 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    ordersDatabase.push(newOrder);
    return res.status(200).json({ success: true, message: 'تم حفظ الطلب بنجاح', order: newOrder });
  }

  // 4. مسار جلب الطلبات (مفصولة للزبون / كاملة للأدمن)
  if (req.method === 'GET' && url.includes('/orders')) {
    const authHeader = req.headers['authorization'] || '';
    const isAdmin = authHeader.includes('admin-authenticated-token-1873');

    if (isAdmin) {
      return res.status(200).json({ success: true, orders: ordersDatabase });
    }

    const phone = req.query?.phone;
    const deviceId = req.query?.deviceId;

    const userOrders = ordersDatabase.filter(order => 
      (phone && order.customerPhone === phone) || 
      (deviceId && order.deviceId === deviceId)
    );

    return res.status(200).json({ success: true, orders: userOrders });
  }

  return res.status(200).json({ status: 'online' });
}
