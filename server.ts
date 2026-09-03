import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_COUPONS, 
  INITIAL_REGIONS, 
  INITIAL_SETTINGS 
} from './src/data/initialData';
import type { Product, Order, Coupon, DeliveryRegion, StoreSettings } from './src/types';
import { getSupabase } from './src/utils/supabase';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory Database for API
let products: Product[] = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
let orders: Order[] = JSON.parse(JSON.stringify(INITIAL_ORDERS));
let coupons: Coupon[] = JSON.parse(JSON.stringify(INITIAL_COUPONS));
let regions: DeliveryRegion[] = JSON.parse(JSON.stringify(INITIAL_REGIONS));
let settings: StoreSettings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));

// Admin Security (Server-Side Only)
let adminPasscode = process.env.ADMIN_PASSWORD || '1873';
const activeAdminSessions = new Map<string, { createdAt: number; expiresAt: number; ip?: string }>();
const failedLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();

// Helper to clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeAdminSessions.entries()) {
    if (session.expiresAt <= now) {
      activeAdminSessions.delete(token);
    }
  }
}, 60 * 1000);

// Lazy-initialized Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export async function createServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger for API routes
  app.use('/api', (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // ==========================================
  // API ROUTES
  // ==========================================

  // Admin Authentication Middleware
  const verifyAdminToken = (req: express.Request): boolean => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    const token = authHeader.substring(7).trim();
    const session = activeAdminSessions.get(token);
    if (!session) return false;
    if (session.expiresAt <= Date.now()) {
      activeAdminSessions.delete(token);
      return false;
    }
    return true;
  };

  // Health & Info Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Al-Mallah Fish Store Backend API',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      supabaseConfigured: Boolean(getSupabase()),
      adminSecurity: {
        activeSessionsCount: activeAdminSessions.size,
        protection: 'Server-side rate limiting & session token validation'
      },
      stats: {
        totalProducts: products.length,
        totalOrders: orders.length,
        totalCoupons: coupons.length,
        totalRegions: regions.length
      }
    });
  });

  // ==========================================
  // ADMIN AUTHENTICATION API (Protected Backend)
  // ==========================================

  // 1. Admin Login with Brute-force & Lockout Protection
  app.post('/api/admin/login', (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const { passcode } = req.body;
    const now = Date.now();

    // Check Lockout Status
    const ipStatus = failedLoginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
    if (ipStatus.lockedUntil > now) {
      const remainingSeconds = Math.ceil((ipStatus.lockedUntil - now) / 1000);
      return res.status(429).json({
        success: false,
        error: `تم إيقاف المحاولات مؤقتاً لأسباب أمنية. يرجى المحاولة بعد ${remainingSeconds} ثانية.`,
        lockoutSeconds: remainingSeconds
      });
    }

    const cleanInput = (passcode || '').toString().trim();
    if (!cleanInput) {
      return res.status(400).json({
        success: false,
        error: 'يرجى إدخال رمز المرور السري للإدارة'
      });
    }

    // Verify against server-side secret
    if (cleanInput === adminPasscode) {
      // Clear failed attempts upon success
      failedLoginAttempts.delete(ip);

      // Generate cryptographically secure session token
      const token = 'alm_' + crypto.randomBytes(32).toString('hex');
      const sessionDurationMs = 12 * 60 * 60 * 1000; // 12 hours
      const expiresAt = now + sessionDurationMs;

      activeAdminSessions.set(token, {
        createdAt: now,
        expiresAt,
        ip
      });

      return res.json({
        success: true,
        message: 'تم تسجيل دخول الإدارة بنجاح',
        token,
        expiresAt: new Date(expiresAt).toISOString(),
        user: {
          role: 'admin',
          name: 'مدير المتجر',
          authenticatedAt: new Date().toISOString()
        }
      });
    }

    // Handle Failed Attempt
    const newCount = (ipStatus.lockedUntil > now ? 0 : ipStatus.count) + 1;
    if (newCount >= 5) {
      const lockoutDurationMs = 60 * 1000; // 60 seconds
      failedLoginAttempts.set(ip, {
        count: newCount,
        lockedUntil: now + lockoutDurationMs
      });
      return res.status(429).json({
        success: false,
        error: 'تجاوزت الحد الأقصى للمحاولات الخاطئة (5 محاولات). تم حظر المحاولات لمدة 60 ثانية لحماية النظام.',
        lockoutSeconds: 60
      });
    }

    failedLoginAttempts.set(ip, {
      count: newCount,
      lockedUntil: 0
    });

    const remaining = 5 - newCount;
    return res.status(401).json({
      success: false,
      error: `رمز المرور غير صحيح. يتبقى لك ${remaining} محاولة قبل الحظر المؤقت.`,
      remainingAttempts: remaining
    });
  });

  // 2. Verify Active Admin Session Token
  app.post('/api/admin/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    const bodyToken = req.body?.token;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7).trim() 
      : bodyToken;

    if (!token) {
      return res.status(401).json({ success: false, valid: false, error: 'رمز الجلسة مفقود' });
    }

    const session = activeAdminSessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      if (session) activeAdminSessions.delete(token);
      return res.status(401).json({ success: false, valid: false, error: 'انتهت صلاحية جلسة الإدارة أو غير صالحة' });
    }

    res.json({
      success: true,
      valid: true,
      expiresAt: new Date(session.expiresAt).toISOString(),
      role: 'admin'
    });
  });

  // 3. Admin Logout
  app.post('/api/admin/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    const bodyToken = req.body?.token;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7).trim() 
      : bodyToken;

    if (token) {
      activeAdminSessions.delete(token);
    }
    res.json({ success: true, message: 'تم تسجيل خروج الإدارة بنجاح' });
  });

  // 4. Change Admin Passcode (Protected)
  app.post('/api/admin/change-password', (req, res) => {
    const isAuth = verifyAdminToken(req);
    const { currentPasscode, newPasscode } = req.body;

    if (!isAuth) {
      // If token not provided, verify current passcode
      if (currentPasscode !== adminPasscode) {
        return res.status(401).json({ success: false, error: 'كلمة المرور الحالية غير صحيحة' });
      }
    }

    if (!newPasscode || newPasscode.toString().trim().length < 4) {
      return res.status(400).json({ success: false, error: 'يجب أن تتكون كلمة المرور الجديدة من 4 خانات على الأقل' });
    }

    adminPasscode = newPasscode.toString().trim();
    // Clear other sessions for security
    activeAdminSessions.clear();

    res.json({ 
      success: true, 
      message: 'تم تحديث رمز مرور الإدارة بنجاح وتم إنهاء الجلسات السابقة للأمان' 
    });
  });

  // ==========================================
  // PRODUCTS API
  // ==========================================
  
  // List products with optional category, search, and visibility filters
  app.get('/api/products', (req, res) => {
    const { category, search, inStock, visibleOnly } = req.query;
    let result = [...products];

    if (visibleOnly === 'true') {
      result = result.filter(p => p.isVisible !== false);
    }
    if (category && category !== 'all') {
      result = result.filter(p => p.category === category);
    }
    if (inStock === 'true') {
      result = result.filter(p => p.inStock);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
    res.json({ success: true, count: result.length, data: result });
  });

  // Get single product
  app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
    }
    res.json({ success: true, data: product });
  });

  // Create new product
  app.post('/api/products', (req, res) => {
    const newProduct: Product = {
      ...req.body,
      id: `p-${Date.now()}`,
      salesCount: req.body.salesCount || 0,
      inStock: req.body.inStock ?? true,
      isVisible: req.body.isVisible ?? true,
      sortOrder: req.body.sortOrder || products.length + 1
    };
    products.push(newProduct);
    res.status(201).json({ success: true, message: 'تمت إضافة المنتج بنجاح', data: newProduct });
  });

  // Update product
  app.put('/api/products/:id', (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
    }
    products[index] = { ...products[index], ...req.body, id: req.params.id };
    res.json({ success: true, message: 'تم تحديث بيانات المنتج', data: products[index] });
  });

  // Toggle stock status
  app.patch('/api/products/:id/stock', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
    }
    product.inStock = req.body.inStock ?? !product.inStock;
    res.json({ success: true, data: product });
  });

  // Delete product
  app.delete('/api/products/:id', (req, res) => {
    const initialLen = products.length;
    products = products.filter(p => p.id !== req.params.id);
    if (products.length === initialLen) {
      return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
  });

  // ==========================================
  // ORDERS API
  // ==========================================

  // List all orders with optional status or customer filter
  app.get('/api/orders', (req, res) => {
    const { status, phone, activeOnly } = req.query;
    let result = [...orders];

    if (activeOnly === 'true') {
      result = result.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    }
    if (status && status !== 'all') {
      result = result.filter(o => o.status === status);
    }
    if (phone && typeof phone === 'string') {
      result = result.filter(o => o.customerPhone.includes(phone));
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, count: result.length, data: result });
  });

  // Get single order
  app.get('/api/orders/:id', (req, res) => {
    const order = orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }
    res.json({ success: true, data: order });
  });

  // Place new order
  app.post('/api/orders', (req, res) => {
    const orderNum = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      ...req.body,
      id: `ord-${Date.now()}`,
      orderNumber: `#${orderNum}`,
      status: 'new',
      depositStatus: req.body.paymentMethod === 'cash_on_delivery' ? 'none' : 'pending',
      createdAt: new Date().toISOString()
    };
    orders.unshift(newOrder);
    res.status(201).json({ success: true, message: 'تم تسجيل الطلب بنجاح', data: newOrder });
  });

  // Update order status
  app.patch('/api/orders/:id/status', (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }
    if (req.body.status) {
      order.status = req.body.status;
    }
    res.json({ success: true, message: 'تم تحديث حالة الطلب', data: order });
  });

  // Update deposit review status
  app.patch('/api/orders/:id/deposit', (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }
    if (req.body.depositStatus) {
      order.depositStatus = req.body.depositStatus;
    }
    res.json({ success: true, message: 'تم تحديث حالة العربون', data: order });
  });

  // Delete order
  app.delete('/api/orders/:id', (req, res) => {
    const initialLen = orders.length;
    orders = orders.filter(o => o.id !== req.params.id);
    if (orders.length === initialLen) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف الطلب بنجاح' });
  });

  // ==========================================
  // COUPONS API
  // ==========================================

  // List coupons
  app.get('/api/coupons', (req, res) => {
    res.json({ success: true, count: coupons.length, data: coupons });
  });

  // Validate a coupon code
  app.post('/api/coupons/validate', (req, res) => {
    const { code, cartTotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال كود الكوبون' });
    }

    const coupon = coupons.find(c => c.code.trim().toUpperCase() === code.trim().toUpperCase());
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'كوبون الخصم غير صحيح أو غير موجود' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, error: 'هذا الكوبون غير مفعّل حالياً' });
    }

    if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
      return res.status(400).json({ 
        success: false, 
        error: `الحد الأدنى لتطبيق هذا الكوبون هو ${coupon.minOrderAmount} جنيه` 
      });
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, error: 'تم استهلاك الحد الأقصى لاستخدام هذا الكوبون' });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = Math.min(coupon.discountValue, cartTotal);
    }

    res.json({
      success: true,
      message: `تم تطبيق خصم الكوبون بنجاح: ${discount} جنيه`,
      data: {
        coupon,
        discountAmount: Math.round(discount * 10) / 10
      }
    });
  });

  // Add new coupon
  app.post('/api/coupons', (req, res) => {
    const newCoupon: Coupon = {
      ...req.body,
      id: `c-${Date.now()}`,
      code: req.body.code.trim().toUpperCase(),
      usageCount: 0,
      isActive: req.body.isActive ?? true
    };
    coupons.push(newCoupon);
    res.status(201).json({ success: true, message: 'تمت إضافة الكوبون بنجاح', data: newCoupon });
  });

  // Toggle coupon status
  app.patch('/api/coupons/:id/toggle', (req, res) => {
    const coupon = coupons.find(c => c.id === req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'الكوبون غير موجود' });
    }
    coupon.isActive = !coupon.isActive;
    res.json({ success: true, data: coupon });
  });

  // Delete coupon
  app.delete('/api/coupons/:id', (req, res) => {
    const initialLen = coupons.length;
    coupons = coupons.filter(c => c.id !== req.params.id);
    if (coupons.length === initialLen) {
      return res.status(404).json({ success: false, error: 'الكوبون غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف الكوبون بنجاح' });
  });

  // ==========================================
  // REGIONS API
  // ==========================================

  app.get('/api/regions', (req, res) => {
    res.json({ success: true, count: regions.length, data: regions });
  });

  app.post('/api/regions', (req, res) => {
    const newRegion: DeliveryRegion = {
      ...req.body,
      id: `reg-${Date.now()}`,
      isActive: req.body.isActive ?? true
    };
    regions.push(newRegion);
    res.status(201).json({ success: true, message: 'تمت إضافة منطقة التوصيل', data: newRegion });
  });

  app.put('/api/regions/:id', (req, res) => {
    const index = regions.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'المنطقة غير موجودة' });
    }
    regions[index] = { ...regions[index], ...req.body, id: req.params.id };
    res.json({ success: true, message: 'تم تحديث بيانات المنطقة', data: regions[index] });
  });

  app.patch('/api/regions/:id/toggle', (req, res) => {
    const region = regions.find(r => r.id === req.params.id);
    if (!region) {
      return res.status(404).json({ success: false, error: 'المنطقة غير موجودة' });
    }
    region.isActive = !region.isActive;
    res.json({ success: true, data: region });
  });

  app.delete('/api/regions/:id', (req, res) => {
    const initialLen = regions.length;
    regions = regions.filter(r => r.id !== req.params.id);
    if (regions.length === initialLen) {
      return res.status(404).json({ success: false, error: 'المنطقة غير موجودة' });
    }
    res.json({ success: true, message: 'تم حذف المنطقة بنجاح' });
  });

  // ==========================================
  // STORE SETTINGS API
  // ==========================================

  app.get('/api/settings', (req, res) => {
    res.json({ success: true, data: settings });
  });

  app.put('/api/settings', (req, res) => {
    settings = { ...settings, ...req.body };
    res.json({ success: true, message: 'تم حفظ إعدادات المتجر بنجاح', data: settings });
  });

  // ==========================================
  // GEMINI AI ASSISTANT API (Fish recipes & help)
  // ==========================================

  app.post('/api/ai/assistant', async (req, res) => {
    const { question, fishType, occasion } = req.body;
    
    try {
      const ai = getGeminiClient();
      if (!ai) {
        // Fallback intelligent response if API key is not yet set
        return res.json({
          success: true,
          answer: `🐟 **نصيحة شيف متجر الملاح:**
للحصول على أفضل طعم لأسماك ${fishType || 'البحر الطازجة'}:
1. **التنظيف:** غسيل السمك بالماء البارد والليمون وقليل من الكمون دون نقع طويل في الخل للحفاظ على تماسك اللحم.
2. **التسوية:** الشوي بالردة على نار عالية أو سنجاري بالفرن مع البصل والطماطم والكزبرة والفلفل الحار والليمون وزيت الزيتون.
3. **التوصيل المبرد:** ننصح بالطلب قبل الساعة 3:00 فجراً لضمان وصول صيد الفجر طازج ومبرد في نفس اليوم! 🚚`
        });
      }

      const prompt = `أنت شيف أسماك ومستشار متخصص في متجر "الملاح لبيع الأسماك الطازجة" في مصر.
أجب العميل بلباقة واحترافية باللغة العربية مع لمسة ودودة وأسلوب مصري راقي ومختصر ومفيد.
السؤال أو الطلب: "${question || `أفضل طريقة لتحضير وتتبيل سمك ${fishType}`}"
المناسبة أو عدد الأفراد: "${occasion || 'عائلي'}"

قدّم نصائح عن:
1. أنسب طريقة طهي (مشوي، سنجاري، زيت وليمون، طاجن، مقلي).
2. التتبيلة والبهارات الأنسب.
3. نصيحة الحفظ والتنظيف.
اجعل الإجابة منسقة بنقاط واضحة وجميلة.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt
      });

      res.json({
        success: true,
        answer: response.text || 'أهلاً بك في متجر الملاح للأسماك الطازجة صيد اليوم!'
      });
    } catch (error: any) {
      console.error('Gemini AI Assistant error:', error);
      res.status(500).json({
        success: false,
        error: 'حدث خطأ أثناء معالجة الطلب عبر المساعد الذكي'
      });
    }
  });

  // ==========================================
  // VITE / STATIC MIDDLEWARE
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

module.exports = app;
    console.log(`🐟 Al-Mallah Fish Store Backend Server running on http://0.0.0.0:${PORT}`);
  });

  return app;
}

// Auto-start if run directly
createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;

module.exports = app;
