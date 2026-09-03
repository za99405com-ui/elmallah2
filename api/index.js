import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let rawBody = '';
  try {
    if (req.body) {
      rawBody = typeof req.body === 'object' ? JSON.stringify(req.body) : String(req.body);
    } else {
      const buffers = [];
      for await (const chunk of req) { buffers.push(chunk); }
      rawBody = Buffer.concat(buffers).toString();
    }
  } catch (e) { rawBody = ''; }

  let parsedBody = {};
  try { parsedBody = JSON.parse(rawBody); } catch (e) {}

  const url = req.url || '';

  // 1. تسجيل دخول الأدمن برمز 1873
  if (url.includes('/admin/login')) {
    const isPass1873 = rawBody.includes('1873') || url.includes('1873') || (req.query && JSON.stringify(req.query).includes('1873'));
    if (isPass1873) {
      return res.status(200).json({ success: true, token: 'admin-authenticated-token-1873' });
    }
    return res.status(401).json({ success: false, message: 'رمز المرور غير صحيح' });
  }

  // 2. إرسال طلب جديد إلى Supabase
  if (req.method === 'POST' && url.includes('/orders')) {
    const orderData = {
      phone: parsedBody.phone || parsedBody.customerPhone || 'guest',
      device_id: parsedBody.deviceId || parsedBody.device_id || 'unknown',
      items: parsedBody.items || [],
      total: parsedBody.total || 0,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase.from('orders').insert([orderData]).select();
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.status(200).json({ success: true, order: data[0] });
    }
    return res.status(200).json({ success: true, order: orderData });
  }

  // 3. جلب الطلبات (مفصولة للمستخدم / شاملة للأدمن)
  if (req.method === 'GET' && url.includes('/orders')) {
    const authHeader = req.headers['authorization'] || '';
    const isAdmin = authHeader.includes('admin-authenticated-token-1873');

    const phone = req.query?.phone;
    const deviceId = req.query?.deviceId || req.query?.device_id;

    if (supabase) {
      let query = supabase.from('orders').select('*');
      
      // إن لم يكن أدمن، يتم تصفية الطلبات بحسب الهاتف أو جهاز المستخدم فقط
      if (!isAdmin) {
        if (phone && deviceId) {
          query = query.or(`phone.eq.${phone},device_id.eq.${deviceId}`);
        } else if (phone) {
          query = query.eq('phone', phone);
        } else if (deviceId) {
          query = query.eq('device_id', deviceId);
        } else {
          return res.status(200).json({ success: true, orders: [] });
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.status(200).json({ success: true, orders: data });
    }

    return res.status(200).json({ success: true, orders: [] });
  }

  return res.status(200).json({ status: 'online' });
}
