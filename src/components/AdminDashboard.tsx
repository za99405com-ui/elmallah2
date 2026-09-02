import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  AlertTriangle,
  RotateCcw,
  Phone, 
  MessageCircle, 
  DollarSign, 
  Clock, 
  Search, 
  Settings, 
  CreditCard, 
  MapPin, 
  Tag, 
  Printer, 
  Lock,
  Server,
  Terminal,
  Code,
  Play,
  RefreshCw,
  Zap,
  CheckCircle2,
  Activity,
  Database,
  Sparkles
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, Order, OrderStatus, ProductCategory, ProductUnit, Coupon, DeliveryRegion } from '../types';
import { STORE_CATEGORIES } from '../data/initialData';
import { getWhatsAppLink } from '../utils/whatsapp';
import { api } from '../utils/api';

export const AdminDashboard: React.FC = React.memo(() => {
  const { 
    products, 
    orders, 
    updateOrderStatus, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    resetProductsToDefault,
    toggleProductStock,
    setActiveTab, 
    isAdminAuthenticated, 
    verifyAdminPasscode, 
    changeAdminPassword,
    logoutAdmin,
    storeSettings, 
    updateStoreSettings, 
    cutoffInfo, 
    coupons, 
    addCoupon, 
    updateCoupon, 
    deleteCoupon, 
    regions, 
    addRegion, 
    updateRegion, 
    deleteRegion, 
    confirmDeposit,
    rejectDeposit,
    confirmOrderAndDeposit,
    adminLockoutSeconds,
    backendConnected,
    askAiAssistant
  } = useStore();

  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Change Password State
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passChangeSuccess, setPassChangeSuccess] = useState('');
  const [passChangeError, setPassChangeError] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  type AdminTabType = 'overview' | 'orders' | 'products' | 'customers' | 'coupons' | 'deposits' | 'regions' | 'settings' | 'api';
  const [adminTab, setAdminTab] = useState<AdminTabType>('overview');

  // API Tester State
  const [selectedApiEndpoint, setSelectedApiEndpoint] = useState<string>('/api/health');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST' | 'PATCH' | 'DELETE'>('GET');
  const [apiRequestBody, setApiRequestBody] = useState<string>('{\n  "code": "TAZA10",\n  "cartTotal": 350\n}');
  const [apiTestResponse, setApiTestResponse] = useState<any>(null);
  const [apiLatencyMs, setApiLatencyMs] = useState<number | null>(null);
  const [isTestingApi, setIsTestingApi] = useState<boolean>(false);
  const [liveHealth, setLiveHealth] = useState<any>(null);

  // AI Assistant Tester State inside API tab
  const [aiQuestion, setAiQuestion] = useState<string>('ما هي أفضل طريقة لتسوية سمك الدنيس بالزيت والليمون؟');
  const [aiFishType, setAiFishType] = useState<string>('دنيس بحري طازج');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const fetchLiveHealth = async () => {
    try {
      const data = await api.getHealth();
      setLiveHealth(data);
    } catch (e) {
      setLiveHealth({ status: 'offline' });
    }
  };

  useEffect(() => {
    fetchLiveHealth();
    const interval = setInterval(fetchLiveHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRunApiTest = async () => {
    setIsTestingApi(true);
    setApiTestResponse(null);
    const start = performance.now();
    try {
      let res: Response;
      if (apiMethod === 'GET') {
        res = await fetch(selectedApiEndpoint);
      } else {
        res = await fetch(selectedApiEndpoint, {
          method: apiMethod,
          headers: { 'Content-Type': 'application/json' },
          body: apiRequestBody ? apiRequestBody.trim() : undefined
        });
      }
      const data = await res.json();
      const end = performance.now();
      setApiLatencyMs(Math.round(end - start));
      setApiTestResponse({
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        data
      });
    } catch (err: any) {
      const end = performance.now();
      setApiLatencyMs(Math.round(end - start));
      setApiTestResponse({
        status: 500,
        ok: false,
        error: err.message || 'فشل الاتصال بنقطة النهاية'
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleTestAiChef = async () => {
    if (!aiQuestion.trim()) return;
    setIsAiLoading(true);
    setAiResponse('');
    try {
      const res = await askAiAssistant(aiQuestion, aiFishType);
      if (res.success && res.answer) {
        setAiResponse(res.answer);
      } else {
        setAiResponse(res.error || 'حدث خطأ في المساعد الذكي');
      }
    } catch (e: any) {
      setAiResponse('تعذر الاتصال بـ API المساعد الذكي: ' + (e?.message || ''));
    } finally {
      setIsAiLoading(false);
    }
  };

  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('active');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected Order for Invoice/Receipt Preview
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  // Settings local state
  const [cutoffHour, setCutoffHour] = useState<number>(storeSettings.cutoffHour);
  const [cutoffMinute, setCutoffMinute] = useState<number>(storeSettings.cutoffMinute);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(storeSettings.isStoreOpen);
  const [whatsappNumber, setWhatsappNumber] = useState<string>(storeSettings.whatsappNumber);
  const [instapayNumber, setInstapayNumber] = useState<string>(storeSettings.instapayNumber);
  const [vodafoneCashNumber, setVodafoneCashNumber] = useState<string>(storeSettings.vodafoneCashNumber);
  const [defaultDepositType, setDefaultDepositType] = useState<'fixed' | 'percentage' | 'none'>(storeSettings.defaultDepositType);
  const [defaultDepositValue, setDefaultDepositValue] = useState<number>(storeSettings.defaultDepositValue);
  const [minimumOrderAmount, setMinimumOrderAmount] = useState<number>(storeSettings.minimumOrderAmount);
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  // Product modal (Add or Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Product Form State
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<ProductCategory>('fresh_sea');
  const [prodPrice, setProdPrice] = useState<number>(150);
  const [prodOriginalPrice, setProdOriginalPrice] = useState<number | ''>('');
  const [prodUnit, setProdUnit] = useState<ProductUnit>('كيلو');
  const [prodSaleType, setProdSaleType] = useState<'weight' | 'piece'>('weight');
  const [prodPiecesPerKilo, setProdPiecesPerKilo] = useState('');
  const [prodPieceWeight, setProdPieceWeight] = useState('');
  const [prodMinOrder, setProdMinOrder] = useState<number>(1);
  const [prodMaxOrder, setProdMaxOrder] = useState<number>(99);
  const [prodDepositType, setProdDepositType] = useState<'none' | 'fixed' | 'percentage'>('none');
  const [prodDepositValue, setProdDepositValue] = useState<number | ''>('');
  const [prodImage, setProdImage] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodBadgeText, setProdBadgeText] = useState('');
  const [prodInStock, setProdInStock] = useState(true);
  const [prodIsVisible, setProdIsVisible] = useState(true);

  // Coupon Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState<boolean>(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscountType, setCouponDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [couponDiscountVal, setCouponDiscountVal] = useState<number>(20);
  const [couponMinOrder, setCouponMinOrder] = useState<number>(150);
  const [couponMaxDiscount, setCouponMaxDiscount] = useState<number | ''>('');
  const [couponLimit, setCouponLimit] = useState<number | ''>('');

  // Region Modal State
  const [isRegionModalOpen, setIsRegionModalOpen] = useState<boolean>(false);
  const [editingRegion, setEditingRegion] = useState<DeliveryRegion | null>(null);
  const [regionToDelete, setRegionToDelete] = useState<DeliveryRegion | null>(null);
  const [regionGov, setRegionGov] = useState('');
  const [regionCities, setRegionCities] = useState('');
  const [regionFee, setRegionFee] = useState<number>(30);
  const [regionMinOrder, setRegionMinOrder] = useState<number>(100);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
    const newOrders = orders.filter(o => o.status === 'new').length;
    const pendingDeposits = orders.filter(o => o.depositStatus === 'pending').length;
    return {
      totalRevenue,
      totalOrders: orders.length,
      newOrders,
      pendingDeposits
    };
  }, [orders]);

  // Auth Gate
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4 text-right">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center mx-auto text-xl">
          <Lock className="w-6 h-6" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">لوحة تحكم الإدارة محمية</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs">يرجى إدخال رمز المرور للمتابعة (مؤمن عبر الخادم)</p>
        </div>

        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            if (isAuthSubmitting || !passcodeInput.trim()) return;
            setIsAuthSubmitting(true);
            setAuthError('');
            try {
              const result = await verifyAdminPasscode(passcodeInput);
              if (result.success) {
                setAuthError('');
                setPasscodeInput('');
              } else {
                setAuthError(result.error || 'رمز المرور غير صحيح');
              }
            } catch (err: any) {
              setAuthError('حدث خطأ أثناء الاتصال بالخادم');
            } finally {
              setIsAuthSubmitting(false);
            }
          }}
          className="space-y-3"
        >
          <div>
            <input
              type="password"
              value={passcodeInput}
              disabled={adminLockoutSeconds > 0 || isAuthSubmitting}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder={adminLockoutSeconds > 0 ? `محظور (${adminLockoutSeconds}ث)` : 'رمز المرور'}
              autoFocus
              className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-center font-mono font-bold text-lg text-slate-900 dark:text-white focus:outline-hidden ${
                adminLockoutSeconds > 0 
                  ? 'border-rose-400 opacity-60 cursor-not-allowed' 
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {authError && (
              <p className="text-rose-600 dark:text-rose-400 text-xs font-bold mt-2 text-center leading-relaxed">
                {authError}
              </p>
            )}
            {adminLockoutSeconds > 0 && (
              <p className="text-amber-600 dark:text-amber-400 text-xs font-bold mt-1 text-center">
                ⏳ يرجى الانتظار {adminLockoutSeconds} ثانية لإعادة المحاولة.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adminLockoutSeconds > 0 || isAuthSubmitting}
              className="flex-1 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {isAuthSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <span>تسجيل الدخول</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Product Modal Openers
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('fresh_sea');
    setProdPrice(150);
    setProdOriginalPrice('');
    setProdUnit('كيلو');
    setProdSaleType('weight');
    setProdPiecesPerKilo('3 - 4 حبات / كجم');
    setProdPieceWeight('250 - 350 جم');
    setProdMinOrder(1);
    setProdMaxOrder(20);
    setProdDepositType('none');
    setProdDepositValue('');
    setProdImage('https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80');
    setProdDescription('سمك طازج صيد فجر اليوم ممتاز من مياه البحر الصافية.');
    setProdBadgeText('طازة اليوم 🐟');
    setProdInStock(true);
    setProdIsVisible(true);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdPrice(p.price);
    setProdOriginalPrice(p.originalPrice || '');
    setProdUnit(p.unit);
    setProdSaleType(p.saleType || 'weight');
    setProdPiecesPerKilo(p.piecesPerKiloRange || '');
    setProdPieceWeight(p.pieceWeightRange || '');
    setProdMinOrder(p.minOrder || 1);
    setProdMaxOrder(p.maxOrder || 99);
    setProdDepositType(p.depositType || 'none');
    setProdDepositValue(p.depositValue ?? '');
    setProdImage(p.image);
    setProdDescription(p.description);
    setProdBadgeText(p.badgeText || '');
    setProdInStock(p.inStock);
    setProdIsVisible(p.isVisible !== false);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || prodPrice <= 0) return;

    const payload = {
      name: prodName,
      category: prodCategory,
      price: Number(prodPrice),
      originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : undefined,
      unit: prodUnit,
      saleType: prodSaleType,
      piecesPerKiloRange: prodPiecesPerKilo || undefined,
      pieceWeightRange: prodPieceWeight || undefined,
      minOrder: Number(prodMinOrder) || 1,
      maxOrder: Number(prodMaxOrder) || 99,
      depositType: prodDepositType,
      depositValue: prodDepositValue !== '' ? Number(prodDepositValue) : undefined,
      image: prodImage || 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80',
      description: prodDescription,
      badgeText: prodBadgeText || undefined,
      inStock: prodInStock,
      isVisible: prodIsVisible,
      sortOrder: editingProduct?.sortOrder ?? (products.length + 1)
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }

    setIsProductModalOpen(false);
  };

  // Coupon Modals
  const openAddCouponModal = () => {
    setEditingCoupon(null);
    setCouponCode('');
    setCouponDiscountType('fixed');
    setCouponDiscountVal(30);
    setCouponMinOrder(200);
    setCouponMaxDiscount('');
    setCouponLimit('');
    setIsCouponModalOpen(true);
  };

  const openEditCouponModal = (c: Coupon) => {
    setEditingCoupon(c);
    setCouponCode(c.code);
    setCouponDiscountType(c.discountType);
    setCouponDiscountVal(c.discountValue);
    setCouponMinOrder(c.minOrderAmount || 0);
    setCouponMaxDiscount(c.maxDiscount || '');
    setCouponLimit(c.usageLimit || '');
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    const payload = {
      code: couponCode.trim().toUpperCase(),
      discountType: couponDiscountType,
      discountValue: Number(couponDiscountVal),
      minOrderAmount: Number(couponMinOrder) || 0,
      maxDiscount: couponMaxDiscount ? Number(couponMaxDiscount) : undefined,
      usageLimit: couponLimit ? Number(couponLimit) : undefined,
      isActive: editingCoupon ? editingCoupon.isActive : true
    };

    if (editingCoupon) {
      updateCoupon(editingCoupon.id, payload);
    } else {
      addCoupon(payload);
    }
    setIsCouponModalOpen(false);
  };

  // Region Modals
  const openAddRegionModal = () => {
    setEditingRegion(null);
    setRegionGov('');
    setRegionCities('مدينة 1، مدينة 2');
    setRegionFee(35);
    setRegionMinOrder(150);
    setIsRegionModalOpen(true);
  };

  const openEditRegionModal = (r: DeliveryRegion) => {
    setEditingRegion(r);
    setRegionGov(r.governorate);
    setRegionCities(r.cities.join('، '));
    setRegionFee(r.deliveryFee);
    setRegionMinOrder(r.minOrderAmount || 0);
    setIsRegionModalOpen(true);
  };

  const handleSaveRegion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regionGov.trim()) return;

    const citiesArr = regionCities
      .split(/[,،]/)
      .map(c => c.trim())
      .filter(Boolean);

    const payload = {
      governorate: regionGov.trim(),
      cities: citiesArr.length > 0 ? citiesArr : [regionGov.trim()],
      deliveryFee: Number(regionFee),
      minOrderAmount: Number(regionMinOrder) || 0,
      isActive: editingRegion ? editingRegion.isActive : true
    };

    if (editingRegion) {
      updateRegion(editingRegion.id, payload);
    } else {
      addRegion(payload);
    }
    setIsRegionModalOpen(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      cutoffHour: Number(cutoffHour),
      cutoffMinute: Number(cutoffMinute),
      isStoreOpen,
      whatsappNumber,
      instapayNumber,
      vodafoneCashNumber,
      defaultDepositType,
      defaultDepositValue: Number(defaultDepositValue),
      minimumOrderAmount: Number(minimumOrderAmount)
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  // Customers data aggregation
  const customersList = useMemo(() => {
    const map = new Map<string, {
      name: string;
      phone: string;
      orderCount: number;
      totalSpent: number;
      lastOrderDate: string;
      address: string;
    }>();

    orders.forEach((ord) => {
      const key = ord.customerPhone;
      if (!map.has(key)) {
        map.set(key, {
          name: ord.customerName,
          phone: ord.customerPhone,
          orderCount: 1,
          totalSpent: ord.total,
          lastOrderDate: ord.createdAt,
          address: `${ord.governorate} - ${ord.city}`
        });
      } else {
        const c = map.get(key)!;
        c.orderCount += 1;
        c.totalSpent += ord.total;
        if (new Date(ord.createdAt) > new Date(c.lastOrderDate)) {
          c.lastOrderDate = ord.createdAt;
        }
      }
    });

    return Array.from(map.values());
  }, [orders]);

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'active') {
      if (o.status === 'delivered' || o.status === 'cancelled') return false;
    } else if (orderStatusFilter === 'review' || orderStatusFilter === 'delivered') {
      if (o.status !== 'delivered') return false;
    } else if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
      );
    }
    return true;
  });

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-3 px-3 sm:px-4 space-y-4">
      
      {/* Admin Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 shadow-xs">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">لوحة تحكم الإدارة - الملاح للأسماك الطازجة 🐟</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              إدارة الطلبات، الأسعار، العرابين، الكوبونات، والمناطق
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              logoutAdmin();
              setActiveTab('products');
            }}
            className="flex-1 md:flex-none px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/50 flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>تسجيل خروج الإدارة</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className="flex-1 md:flex-none px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1"
          >
            <span>← العودة للمتجر</span>
          </button>
        </div>
      </div>

      {/* 8 Main Admin Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
        {[
          { id: 'overview', label: 'المؤشرات', icon: LayoutDashboard },
          { id: 'orders', label: `الطلبات (${orders.length})`, icon: Package, badge: stats.newOrders },
          { id: 'products', label: `المنتجات (${products.length})`, icon: ShoppingBag },
          { id: 'deposits', label: `العرابين (${stats.pendingDeposits})`, icon: CreditCard, badge: stats.pendingDeposits },
          { id: 'coupons', label: `الكوبونات (${coupons.length})`, icon: Tag },
          { id: 'regions', label: `المناطق (${regions.length})`, icon: MapPin },
          { id: 'customers', label: `العملاء (${customersList.length})`, icon: Users },
          { id: 'settings', label: 'إعدادات المتجر', icon: Settings },
          { id: 'api', label: 'الخادم و API', icon: Server }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = adminTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setAdminTab(t.id as AdminTabType)}
              className={`px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              {t.badge && t.badge > 0 ? (
                <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {t.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW & KPI DASHBOARD TAB */}
      {adminTab === 'overview' && (
        <div className="space-y-4">
          {/* Quick Stat Widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">إجمالي المبيعات</span>
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {stats.totalRevenue.toLocaleString()} ج
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">عدد الطلبات</span>
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {stats.totalOrders} طلب
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">طلبات جديدة</span>
                <span className="text-sm sm:text-base font-black text-amber-700 dark:text-amber-300">
                  {stats.newOrders} جديد
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 flex items-center justify-center border border-cyan-200 dark:border-cyan-800">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">عرابين قيد المراجعة</span>
                <span className="text-sm sm:text-base font-black text-cyan-700 dark:text-cyan-300">
                  {stats.pendingDeposits} عربون
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">إجراءات سريعة:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={openAddProductModal}
                className="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-right cursor-pointer"
              >
                <Plus className="w-4 h-4 text-cyan-600 mb-1" />
                <span className="font-bold text-xs text-slate-900 dark:text-white block">إضافة سمك طازج</span>
                <span className="text-[10px] text-slate-400">إضافة صنف صيد فجر</span>
              </button>

              <button
                onClick={() => setAdminTab('orders')}
                className="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-right cursor-pointer"
              >
                <Package className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="font-bold text-xs text-slate-900 dark:text-white block">متابعة الطلبات</span>
                <span className="text-[10px] text-slate-400">تحديث حالة التجهيز</span>
              </button>

              <button
                onClick={() => setAdminTab('deposits')}
                className="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-right cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-amber-600 mb-1" />
                <span className="font-bold text-xs text-slate-900 dark:text-white block">مراجعة العرابين</span>
                <span className="text-[10px] text-slate-400">تأكيد تحويلات إنستاباي</span>
              </button>

              <button
                onClick={openAddCouponModal}
                className="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-right cursor-pointer"
              >
                <Tag className="w-4 h-4 text-purple-600 mb-1" />
                <span className="font-bold text-xs text-slate-900 dark:text-white block">إنشاء كود خصم</span>
                <span className="text-[10px] text-slate-400">عروض ترويجية للعملاء</span>
              </button>
            </div>
          </div>

          {/* Cutoff & Delivery Overview */}
          <div className="bg-cyan-50/50 dark:bg-slate-800/40 p-4 rounded-2xl border border-cyan-200/60 dark:border-slate-700 space-y-1 text-xs">
            <div className="flex items-center gap-2 font-bold text-cyan-900 dark:text-cyan-200">
              <Clock className="w-4 h-4 text-cyan-600" />
              <span>نظام مواعيد التسليم اليومية:</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              آخر موعد لاستقبال طلبات اليوم هو الساعة <strong>{cutoffInfo.cutoffTimeString}</strong>. حالة التوقيت الحالي: <strong>{cutoffInfo.badgeLabel}</strong>. الطلبات الواردة بعد هذا الموعد تُسجّل تلقائياً لتسليم الغد الطازج.
            </p>
          </div>
        </div>
      )}

      {/* 2. ORDERS MANAGEMENT TAB */}
      {adminTab === 'orders' && (
        <div className="space-y-3">
          {/* Controls: Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث برقم الطلب، الاسم، أو الهاتف..."
                className="w-full pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 flex-wrap w-full sm:w-auto">
              {[
                { id: 'active', label: `الطلبات الجارية (${orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length})` },
                { id: 'review', label: `المراجعة (${orders.filter(o => o.status === 'delivered').length})` },
                { id: 'all', label: `الكل (${orders.length})` },
                { id: 'new', label: 'جديد' },
                { id: 'preparing', label: 'تجهيز' },
                { id: 'on_delivery', label: 'توصيل' },
                { id: 'cancelled', label: 'ملغي' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setOrderStatusFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    orderStatusFilter === f.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-2xs font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Cards */}
          <div className="space-y-2.5">
            {filteredOrders.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">لا توجد طلبات تطابق الفلتر المحدد.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5"
                >
                  {/* Order Top Line */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{order.orderNumber}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} - {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                      {order.deliveryTargetDate && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">
                          موعد التسليم: {order.deliveryTargetDate}
                        </span>
                      )}
                      {order.depositStatus === 'confirmed' && (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                          عربون مؤكد ✓ ({order.depositPaid} ج)
                        </span>
                      )}
                      {order.depositStatus === 'pending' && (
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold animate-pulse">
                          عربون قيد المراجعة ({order.depositPaid} ج)
                        </span>
                      )}
                    </div>

                    {/* Status Changer & Invoice Button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOrderForInvoice(order)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-slate-200"
                        title="طباعة فاتورة"
                      >
                        <Printer className="w-3 h-3" />
                        <span>فاتورة</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">الحالة:</span>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className="px-2 py-0.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                        >
                          <option value="new">طلب جديد</option>
                          <option value="preparing">جاري التجهيز</option>
                          <option value="on_delivery">خرج للتوصيل</option>
                          <option value="delivered">تم التسليم</option>
                          <option value="cancelled">تم الإلغاء</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info & Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 font-medium block text-[10px]">العميل:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{order.customerName}</span>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">{order.governorate} - {order.city}</p>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">{order.address}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block text-[10px]">الاتصال والتواصل:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs block mb-1" dir="ltr">
                        {order.customerPhone}
                      </span>
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="px-2 py-0.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-md text-[10px] font-bold flex items-center gap-1"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>اتصال</span>
                        </a>
                        <a
                          href={getWhatsAppLink(order.customerPhone, `مرحباً ${order.customerName}، معك متجر الملاح بخصوص طلبك ${order.orderNumber}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-2.5 h-2.5" />
                          <span>واتساب</span>
                        </a>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block text-[10px]">الحساب والمدفوعات:</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white block">{order.total} جنيه</span>
                      <span className="text-emerald-600 text-[10px] block">
                        (سمك: {order.subtotal} ج {order.discountAmount > 0 ? `- خصم: ${order.discountAmount} ج` : ''} | توصيل مجاني)
                      </span>
                      <span className="block text-cyan-700 dark:text-cyan-400 font-bold mt-0.5 text-[10px]">
                        العربون: {order.depositPaid} ج ({order.depositStatus === 'confirmed' ? 'مؤكد ✓' : 'قيد المراجعة'}) | المتبقي: {order.remainingAmount} ج
                      </span>
                      {order.depositTransactionRef && (
                        <span className="block text-amber-800 dark:text-amber-300 font-bold mt-0.5 text-[10px]">
                          رقم المحول منه: {order.depositTransactionRef}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Easy 1-click Confirm Deposit & Order Bar */}
                  {order.depositStatus === 'pending' && (
                    <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 p-2.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">⏳</span>
                        <div>
                          <p className="font-bold text-amber-900 dark:text-amber-200">
                            بانتظار مراجعة التحويل من: <span className="font-mono text-cyan-800 dark:text-cyan-300 underline" dir="ltr">{order.depositTransactionRef || 'لم يُحدد'}</span>
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            طريقة التحويل: {order.paymentMethod === 'instapay' ? 'إنستاباي' : order.paymentMethod === 'vodafone_cash' ? 'فودافون كاش' : 'استلام'} | المبلغ: {order.depositPaid} ج
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={() => confirmOrderAndDeposit(order.id)}
                          className="flex-1 sm:flex-none px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span>✓ مراجعة وتأكيد الحجز الفوري</span>
                        </button>
                        <button
                          onClick={() => rejectDeposit(order.id)}
                          className="px-2.5 py-1.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl hover:bg-rose-200 cursor-pointer"
                        >
                          رفض
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Items breakdown */}
                  <div>
                    <h5 className="text-[10px] font-medium text-slate-400 mb-1">الأصناف:</h5>
                    <div className="flex flex-wrap gap-1">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg text-xs flex items-center gap-1"
                        >
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded-sm object-cover"
                          />
                          <span className="font-bold text-slate-900 dark:text-white">{item.productName}</span>
                          <span className="text-slate-500">
                            ({item.quantity} {item.unit})
                          </span>
                          <span className="text-slate-900 dark:text-white font-bold">={item.itemTotal} ج</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. PRODUCTS MANAGEMENT TAB */}
      {adminTab === 'products' && (
        <div className="space-y-3">
          {/* Top action bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث في المنتجات..."
                className="w-full pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
              >
                <option value="all">كل الأقسام ({products.length})</option>
                {STORE_CATEGORIES.map((c) => {
                  const count = products.filter(p => p.category === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.name} ({count})
                    </option>
                  );
                })}
              </select>

              <button
                onClick={openAddProductModal}
                className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة صنف</span>
              </button>

              {products.length === 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('هل تريد استعادة قائمة الأسماك والمنتجات الافتراضية؟')) {
                      resetProductsToDefault();
                    }
                  }}
                  className="px-3 py-1.5 bg-cyan-600 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap hover:bg-cyan-700"
                  title="استعادة المنتجات الأولية للمتجر"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>استعادة الأصناف</span>
                </button>
              )}
            </div>
          </div>

          {/* Products Grid or Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">لا توجد منتجات مطابقة للبحث</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {products.length === 0 ? 'تم إزالة جميع المنتجات من المتجر.' : 'جرب تغيير كلمة البحث أو اختيار قسم آخر.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={openAddProductModal}
                  className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة صنف جديد</span>
                </button>
                {products.length === 0 && (
                  <button
                    onClick={() => resetProductsToDefault()}
                    className="px-4 py-2 bg-cyan-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-cyan-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة الأصناف الافتراضية</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-3 border shadow-2xs flex flex-col justify-between space-y-2 ${
                    p.isVisible === false ? 'opacity-60 border-dashed border-slate-300 dark:border-slate-700' : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex gap-2.5">
                    <img
                      src={p.image}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-100 dark:border-slate-800"
                    />
                    <div className="space-y-0.5 flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">{p.name}</h4>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-slate-900 dark:text-white font-bold text-xs">{p.price} جنيه</span>
                        <span className="text-slate-400 text-[10px]">/ {p.unit}</span>
                        {p.originalPrice && (
                          <span className="text-slate-400 text-[10px] line-through">{p.originalPrice} ج</span>
                        )}
                      </div>
                      {p.piecesPerKiloRange && (
                        <span className="inline-block text-[10px] bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 font-medium px-1.5 py-0.2 rounded border border-cyan-100 dark:border-cyan-900/50">
                          {p.piecesPerKiloRange}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{p.description}</p>

                  {/* Status Toggle & Action Buttons */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => toggleProductStock(p.id)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
                        p.inStock
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {p.inStock ? '✓ متوفر' : '✗ غير متوفر'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditProductModal(p)}
                        className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                        title="تعديل بيانات الصنف"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setProductToDelete(p)}
                        className="p-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer transition-colors"
                        title="حذف الصنف"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. DEPOSITS & PAYMENTS TAB */}
      {adminTab === 'deposits' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden space-y-3 p-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">مراجعة وتأكيد سداد العرابين وأرقام المحولين</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">تأكيد تحويلات إنستاباي وفودافون كاش لطلبات الصيد الطازج وتفعيل الحجز بنقرة واحدة</p>
          </div>

          <div className="space-y-2">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{ord.orderNumber}</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">({ord.customerName} - {ord.customerPhone})</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 mt-1">
                    طريقة التحويل: <strong>{ord.paymentMethod === 'instapay' ? 'إنستاباي' : ord.paymentMethod === 'vodafone_cash' ? 'فودافون كاش' : 'الدفع عند الاستلام'}</strong> | 
                    العربون المطلوب: <strong className="text-cyan-700 dark:text-cyan-300">{ord.depositPaid} جنيه</strong> | 
                    إجمالي الطلب: <strong>{ord.total} جنيه</strong>
                  </div>
                  {ord.depositTransactionRef ? (
                    <div className="text-xs text-amber-800 dark:text-amber-300 mt-1 font-bold bg-amber-100/60 dark:bg-amber-950/60 px-2 py-0.5 rounded-md inline-block">
                      رقم المحول منه: <span className="font-mono text-cyan-800 dark:text-cyan-300" dir="ltr">{ord.depositTransactionRef}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      لم يتم تسجيل رقم المحول منه
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                    ord.depositStatus === 'confirmed'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                      : ord.depositStatus === 'pending'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 animate-pulse'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                  }`}>
                    {ord.depositStatus === 'confirmed' ? '✓ تم تأكيد الحجز' : ord.depositStatus === 'pending' ? '⏳ بانتظار المراجعة' : 'مرفوض'}
                  </span>

                  {ord.depositStatus === 'pending' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => confirmOrderAndDeposit(ord.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <span>✓ مراجعة وتأكيد الحجز</span>
                      </button>
                      <button
                        onClick={() => rejectDeposit(ord.id)}
                        className="px-2 py-1.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        رفض
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. COUPONS TAB */}
      {adminTab === 'coupons' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">إدارة كوبونات وأكواد الخصم</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">إنشاء أكواد خصم بنسبة مئوية أو قيمة ثابتة للعملاء</p>
            </div>
            <button
              onClick={openAddCouponModal}
              className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة كوبون جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-cyan-700 dark:text-cyan-400 tracking-wider">
                    {c.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.isActive ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {c.isActive ? 'نشط' : 'معطل'}
                  </span>
                </div>

                <div className="text-slate-700 dark:text-slate-300 space-y-0.5">
                  <p>الخصم: <strong>{c.discountValue} {c.discountType === 'percentage' ? '%' : 'جنيه'}</strong></p>
                  <p>الحد الأدنى للطلب: <strong>{c.minOrderAmount || 0} جنيه</strong></p>
                  <p>مرات الاستخدام: <strong>{c.usageCount} {c.usageLimit ? `/ ${c.usageLimit}` : ''}</strong></p>
                </div>

                <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => openEditCouponModal(c)}
                    className="p-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                    title="تعديل الكوبون"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCouponToDelete(c)}
                    className="p-1 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded hover:bg-rose-100 cursor-pointer transition-colors"
                    title="حذف الكوبون"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. DELIVERY REGIONS TAB */}
      {adminTab === 'regions' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">إدارة مناطق ومحافظات التوصيل</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">تحديد مصاريف التوصيل السريع والحد الأدنى لكل محافظة وحي</p>
            </div>
            <button
              onClick={openAddRegionModal}
              className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة محافظة / منطقة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {regions.map((r) => (
              <div
                key={r.id}
                className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white">{r.governorate}</h4>
                  <span className="font-bold text-cyan-700 dark:text-cyan-400">{r.deliveryFee} ج توصيل</span>
                </div>

                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  الأحياء: {r.cities.join('، ')}
                </p>

                <p className="text-slate-600 dark:text-slate-300">
                  الحد الأدنى للطلب: <strong>{r.minOrderAmount || 0} جنيه</strong>
                </p>

                <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => openEditRegionModal(r)}
                    className="p-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                    title="تعديل المنطقة"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setRegionToDelete(r)}
                    className="p-1 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded hover:bg-rose-100 cursor-pointer transition-colors"
                    title="حذف المنطقة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. CUSTOMERS TAB */}
      {adminTab === 'customers' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">سجل العملاء والطلبات</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">إجمالي {customersList.length} عميل</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-2.5">اسم العميل</th>
                  <th className="p-2.5">رقم الهاتف</th>
                  <th className="p-2.5">العنوان</th>
                  <th className="p-2.5">الطلبات</th>
                  <th className="p-2.5">الإجمالي</th>
                  <th className="p-2.5">تواصل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customersList.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">{c.name}</td>
                    <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300" dir="ltr">{c.phone}</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">{c.address}</td>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">{c.orderCount} طلب</td>
                    <td className="p-2.5 font-bold text-slate-950 dark:text-white">{c.totalSpent} ج</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${c.phone}`}
                          className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md"
                          title="اتصال"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                        <a
                          href={getWhatsAppLink(c.phone, `مرحباً ${c.name}، يسعدنا خدمتك من متجر الملاح`)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-md cursor-pointer"
                          title="واتساب"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. SETTINGS TAB */}
      {adminTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-600" />
              <span>إعدادات المتجر العامة ومواعيد الطلبات والمدفوعات</span>
            </h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-lg">
            {/* Daily Cutoff */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                  ساعة الإغلاق اليومي للطلبات:
                </label>
                <select
                  value={cutoffHour}
                  onChange={(e) => setCutoffHour(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
                >
                  <option value={1}>1:00 فجراً</option>
                  <option value={2}>2:00 فجراً</option>
                  <option value={3}>3:00 فجراً (الافتراضي)</option>
                  <option value={4}>4:00 فجراً</option>
                  <option value={5}>5:00 فجراً</option>
                  <option value={6}>6:00 صباحاً</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">الدقائق:</label>
                <select
                  value={cutoffMinute}
                  onChange={(e) => setCutoffMinute(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
                >
                  <option value={0}>00 دقيقة</option>
                  <option value={15}>15 دقيقة</option>
                  <option value={30}>30 دقيقة</option>
                  <option value={45}>45 دقيقة</option>
                </select>
              </div>
            </div>

            {/* Payment & WhatsApp numbers */}
            <div className="space-y-2 pt-1">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">أرقام التواصل والتحويلات المعتمدة:</h4>
              
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">رقم واتساب المتجر الرسمي:</label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white text-right focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">رقم / حساب إنستاباي:</label>
                  <input
                    type="text"
                    value={instapayNumber}
                    onChange={(e) => setInstapayNumber(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white text-right focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">رقم فودافون كاش:</label>
                  <input
                    type="text"
                    value={vodafoneCashNumber}
                    onChange={(e) => setVodafoneCashNumber(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white text-right focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Default Deposit Calculation */}
            <div className="space-y-2 pt-1">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">إعدادات العربون الافتراضي لجدية الصيد:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">نوع العربون الافتراضي:</label>
                  <select
                    value={defaultDepositType}
                    onChange={(e) => setDefaultDepositType(e.target.value as 'fixed' | 'percentage' | 'none')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">قيمة ثابتة (جنيه)</option>
                    <option value="none">بدون عربون إلزامي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">القيمة الافتراضية:</label>
                  <input
                    type="number"
                    value={defaultDepositValue}
                    onChange={(e) => setDefaultDepositValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isStoreOpen}
                  onChange={(e) => setIsStoreOpen(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 accent-slate-900"
                />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  المتجر مفتوح لاستقبال الطلبات
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {settingsSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-700" />
                  <span>تم حفظ وتطبيق جميع إعدادات المتجر بنجاح ✓</span>
                </>
              ) : (
                <span>حفظ وتطبيق الإعدادات</span>
              )}
            </button>
          </form>

          {/* Security & Password Change Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">أمان لوحة الإدارة وكلمة المرور</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">تغيير رمز المرور السري الخاص بإدارة المتجر (مُخزن ومشفر في السيرفر)</p>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPassChangeError('');
                setPassChangeSuccess('');

                if (!newPass || newPass.trim().length < 4) {
                  setPassChangeError('يجب أن تتكون كلمة المرور الجديدة من 4 أحرف أو أرقام على الأقل');
                  return;
                }
                if (newPass !== confirmPass) {
                  setPassChangeError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
                  return;
                }

                setIsChangingPass(true);
                try {
                  const res = await changeAdminPassword(oldPass, newPass);
                  if (res.success) {
                    setPassChangeSuccess(res.message || 'تم تحديث رمز مرور الإدارة بنجاح');
                    setOldPass('');
                    setNewPass('');
                    setConfirmPass('');
                    setTimeout(() => setPassChangeSuccess(''), 4000);
                  } else {
                    setPassChangeError(res.error || 'فشل تحديث كلمة المرور');
                  }
                } catch (err: any) {
                  setPassChangeError('تعذر الاتصال بالخادم لتحديث كلمة المرور');
                } finally {
                  setIsChangingPass(false);
                }
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-1">رمز المرور الحالي (اختياري مع الجلسة):</label>
                  <input
                    type="password"
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                    placeholder="••••"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-1">رمز المرور الجديد:</label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="رمز جديد (4 خانات+)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-1">تأكيد رمز المرور الجديد:</label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="أعد إدخال الرمز الجديد"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              {passChangeError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold">
                  {passChangeError}
                </div>
              )}

              {passChangeSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  {passChangeSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isChangingPass || !newPass.trim()}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isChangingPass ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري التحديث...</span>
                  </>
                ) : (
                  <span>تحديث رمز المرور السري</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 9. BACKEND & REST API EXPLORER TAB */}
      {adminTab === 'api' && (
        <div className="space-y-4">
          
          {/* Top Status & Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">حالة الخادم (Server Status)</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>متصل (Online)</span>
                </span>
              </div>
              <p className="text-base font-black text-slate-900 dark:text-white font-mono">
                Port 3000 (Express + Vite)
              </p>
              <p className="text-[11px] text-slate-400">استجابة لحظية للطلبات والـ APIs</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">محرك الذكاء الاصطناعي (Gemini)</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300">
                  <Sparkles className="w-3 h-3 text-cyan-600" />
                  <span>نشط</span>
                </span>
              </div>
              <p className="text-base font-black text-slate-900 dark:text-white font-mono">
                gemini-3.7-flash
              </p>
              <p className="text-[11px] text-slate-400">وصفات الأسماك والمساعد الذكي</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">سرعة الاستجابة (Latency)</span>
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-base font-black text-slate-900 dark:text-white font-mono">
                {apiLatencyMs !== null ? `${apiLatencyMs} ms` : '< 15 ms'}
              </p>
              <p className="text-[11px] text-slate-400">متوسط وقت معالجة الـ Endpoints</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">قاعدة البيانات (In-Memory DB)</span>
                <Database className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-base font-black text-slate-900 dark:text-white font-mono">
                {liveHealth?.stats?.totalProducts || products.length} منتجات | {liveHealth?.stats?.totalOrders || orders.length} طلبات
              </p>
              <p className="text-[11px] text-slate-400">مزامنة فورية ثنائية الاتجاه</p>
            </div>
          </div>

          {/* Interactive API Tester Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">منصة تجربة واجهات برمجة التطبيقات (API Playground)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">اختبر استجابات الخادم والـ Endpoints مباشرة من المتصفح</p>
                </div>
              </div>

              <button
                onClick={fetchLiveHealth}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>فحص الخادم</span>
              </button>
            </div>

            {/* Endpoint Selector Bar */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Method */}
                <select
                  value={apiMethod}
                  onChange={(e) => setApiMethod(e.target.value as any)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>

                {/* Preset Endpoints Dropdown */}
                <select
                  value={selectedApiEndpoint}
                  onChange={(e) => {
                    const ep = e.target.value;
                    setSelectedApiEndpoint(ep);
                    if (ep === '/api/health' || ep === '/api/products' || ep === '/api/orders' || ep === '/api/coupons' || ep === '/api/regions' || ep === '/api/settings') {
                      setApiMethod('GET');
                    } else if (ep === '/api/coupons/validate') {
                      setApiMethod('POST');
                      setApiRequestBody(JSON.stringify({ code: 'TAZA10', cartTotal: 450 }, null, 2));
                    } else if (ep === '/api/ai/assistant') {
                      setApiMethod('POST');
                      setApiRequestBody(JSON.stringify({ question: 'طريقة تسوية البوري المبطرخ في الفرن', fishType: 'بوري بورسعيدي' }, null, 2));
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="/api/health">GET /api/health - فحص حالة الخادم والإحصائيات</option>
                  <option value="/api/products">GET /api/products - استرجاع كافة الأسماك والمنتجات</option>
                  <option value="/api/orders">GET /api/orders - استرجاع طلبات العملاء وحالات التوصيل</option>
                  <option value="/api/coupons">GET /api/coupons - استرجاع كوبونات الخصم</option>
                  <option value="/api/coupons/validate">POST /api/coupons/validate - التحقق من صلاحية كود خصم</option>
                  <option value="/api/regions">GET /api/regions - استرجاع مناطق ومحافظات التوصيل</option>
                  <option value="/api/settings">GET /api/settings - استرجاع إعدادات المتجر ومواعيد الصيد</option>
                  <option value="/api/ai/assistant">POST /api/ai/assistant - استشارة شيف الملاح الذكي (Gemini API)</option>
                </select>

                {/* Send Button */}
                <button
                  onClick={handleRunApiTest}
                  disabled={isTestingApi}
                  className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isTestingApi ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>إرسال الطلب (Send)</span>
                </button>
              </div>

              {/* Request Body (for POST / PATCH) */}
              {(apiMethod === 'POST' || apiMethod === 'PATCH') && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Request Payload (JSON Body):
                  </label>
                  <textarea
                    value={apiRequestBody}
                    onChange={(e) => setApiRequestBody(e.target.value)}
                    rows={4}
                    className="w-full p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800 focus:outline-hidden"
                    dir="ltr"
                  />
                </div>
              )}

              {/* Response Viewer */}
              {apiTestResponse && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">استجابة الخادم (Response):</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                        apiTestResponse.ok ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        HTTP {apiTestResponse.status} {apiTestResponse.statusText}
                      </span>
                    </div>

                    {apiLatencyMs !== null && (
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {apiLatencyMs} ms
                      </span>
                    )}
                  </div>

                  <pre 
                    className="p-3.5 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto max-h-72 leading-relaxed" 
                    dir="ltr"
                  >
                    {JSON.stringify(apiTestResponse.data || apiTestResponse.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Gemini AI Assistant Quick Live Test Console */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">تجربة استشارات ووصفات الأسماك (Gemini 3.7 Flash Backend)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">مسار الخادم: <code className="font-mono text-cyan-600">POST /api/ai/assistant</code></p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نوع السمك:</label>
                <input
                  type="text"
                  value={aiFishType}
                  onChange={(e) => setAiFishType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  placeholder="مثال: دنيس، بلطي، وقار، سالمون"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">السؤال أو الاستفسار:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden"
                    placeholder="اكتب سؤالك لشيف الملاح..."
                  />
                  <button
                    onClick={handleTestAiChef}
                    disabled={isAiLoading || !aiQuestion.trim()}
                    className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isAiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>استشر الشيف</span>
                  </button>
                </div>
              </div>
            </div>

            {aiResponse && (
              <div className="p-4 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-cyan-800 dark:text-cyan-300">رد مستشار وشيف الملاح (Gemini AI):</span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                  {aiResponse}
                </p>
              </div>
            )}
          </div>

          {/* Endpoints Reference Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">دليل واجهات برمجة التطبيقات (API Reference Table):</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-3 font-bold">الطريقة (Method)</th>
                    <th className="py-2.5 px-3 font-bold">المسار (Endpoint)</th>
                    <th className="py-2.5 px-3 font-bold">الوصف</th>
                    <th className="py-2.5 px-3 font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  <tr>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-md font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px]">GET</span></td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">/api/health</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">فحص سلامة الخادم، زمن التشغيل وإحصائيات النظام</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-600 font-sans font-bold">200 OK</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-md font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px]">GET</span></td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">/api/products</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">جلب جميع الأسماك مع الفلترة حسب التصنيف والتوفر</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-600 font-sans font-bold">200 OK</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-md font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">POST</span></td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">/api/products</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">إضافة سمك طازج جديد وتعيين تفاصيل القطع والأوزان</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-600 font-sans font-bold">201 Created</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-md font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px]">GET</span></td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">/api/orders</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">استرجاع طلبات العملاء وفلترتها بالنشطة أو المسلمة</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-600 font-sans font-bold">200 OK</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-md font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">POST</span></td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">/api/orders</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">تسجيل طلب جديد وحساب العرابين والتوصيل المبرد</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-600 font-sans font-bold">201 Created</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-md font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px]">PATCH</span></td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">/api/orders/:id/status</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">تحديث حالة الطلب (تجهيز، خرج للتوصيل، تم التسليم)</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-600 font-sans font-bold">200 OK</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-md font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">POST</span></td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">/api/coupons/validate</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">التحقق من الكود وحساب الخصم المسموح للطلب</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-600 font-sans font-bold">200 OK</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-md font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px]">POST</span></td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">/api/ai/assistant</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">توليد نصائح الطهي وطرق تحضير وتتبيل الأسماك عبر الذكاء الاصطناعي</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-600 font-sans font-bold">200 OK</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Product Add/Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto text-right space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingProduct ? 'تعديل بيانات سمك طازج' : 'إضافة سمك طازج صيد فجر'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs font-medium max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">اسم السمك: *</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="مثال: دنيس بحري طازة"
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">القسم:</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
                  >
                    {STORE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">وحدة البيع:</label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value as ProductUnit)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="كيلو">كيلو</option>
                    <option value="نصف كيلو">نصف كيلو</option>
                    <option value="قطعة">قطعة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">السعر (جنيه): *</label>
                  <input
                    type="number"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">السعر قبل الخصم (اختياري):</label>
                  <input
                    type="number"
                    value={prodOriginalPrice}
                    onChange={(e) => setProdOriginalPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="السعر القديم"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Pieces per kilo & piece weight specs with easy presets & removal */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-800 dark:text-slate-200 font-bold text-xs">
                      🐟 خيار الكيلو فيه كام قطعة (تقريبي):
                    </label>
                    {prodPiecesPerKilo && (
                      <button
                        type="button"
                        onClick={() => setProdPiecesPerKilo('')}
                        className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                      >
                        ✕ إزالة هذا الخيار
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={prodPiecesPerKilo}
                      onChange={(e) => setProdPiecesPerKilo(e.target.value)}
                      placeholder="اكتب يدويًا (مثال: 3 - 4 حبات / كجم) أو اختر من الأسفل"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-hidden"
                    />
                  </div>

                  {/* Quick presets for pieces per kilo */}
                  <div className="flex items-center gap-1 flex-wrap mt-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">خيارات سريعة:</span>
                    {[
                      '1 - 2 حبة / كجم',
                      '2 - 3 حبات / كجم',
                      '3 - 4 حبات / كجم',
                      '4 - 6 حبات / كجم',
                      '7 - 10 حبات / كجم',
                      'قطعة جامبو (أكبر من 1 كجم)'
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setProdPiecesPerKilo(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          prodPiecesPerKilo === preset
                            ? 'bg-cyan-600 text-white border-cyan-600 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-800 dark:text-slate-200 font-bold text-xs">
                      الوزن التقريبي للقطعة (اختياري):
                    </label>
                    {prodPieceWeight && (
                      <button
                        type="button"
                        onClick={() => setProdPieceWeight('')}
                        className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                      >
                        ✕ إزالة
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={prodPieceWeight}
                    onChange={(e) => setProdPieceWeight(e.target.value)}
                    placeholder="مثال: 250 - 350 جم"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">الحد الأدنى للطلب:</label>
                  <input
                    type="number"
                    value={prodMinOrder}
                    onChange={(e) => setProdMinOrder(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">الحد الأقصى للطلب:</label>
                  <input
                    type="number"
                    value={prodMaxOrder}
                    onChange={(e) => setProdMaxOrder(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Deposit Settings for product */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 text-[11px]">عربون هذا الصنف:</label>
                  <select
                    value={prodDepositType}
                    onChange={(e) => setProdDepositType(e.target.value as 'none' | 'percentage' | 'fixed')}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="none">حسب الإعداد الافتراضي للمتجر</option>
                    <option value="percentage">نسبة مئوية مخصصة (%)</option>
                    <option value="fixed">قيمة ثابتة (جنيه)</option>
                  </select>
                </div>

                {prodDepositType !== 'none' && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 text-[11px]">قيمة العربون المخصص:</label>
                    <input
                      type="number"
                      value={prodDepositValue}
                      onChange={(e) => setProdDepositValue(e.target.value ? Number(e.target.value) : '')}
                      placeholder={prodDepositType === 'percentage' ? 'مثال: 20' : 'مثال: 50'}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-900 dark:text-white focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">رابط صورة السمك:</label>
                <input
                  type="text"
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">الوصف:</label>
                <textarea
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodInStock}
                    onChange={(e) => setProdInStock(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 accent-slate-900"
                  />
                  <span>متوفر صيد اليوم</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodIsVisible}
                    onChange={(e) => setProdIsVisible(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 accent-slate-900"
                  />
                  <span>ظاهر في المتجر</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                >
                  حفظ الصنف
                </button>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      const prodToDel = editingProduct;
                      setIsProductModalOpen(false);
                      setProductToDelete(prodToDel);
                    }}
                    className="px-3 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الصنف</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-right" dir="rtl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">تأكيد حذف المنتج</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">إزالة الصنف نهائياً من المتجر</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              <img
                src={productToDelete.image}
                alt={productToDelete.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="text-xs space-y-0.5 overflow-hidden">
                <p className="font-bold text-slate-900 dark:text-white truncate">{productToDelete.name}</p>
                <p className="text-slate-500 dark:text-slate-400">{productToDelete.price} جنيه / {productToDelete.unit}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف هذا المنتج؟ سيتم حذفه من قوائم المتجر، وسلة الشراء والمفضلة لدى العملاء فوراً.
            </p>

            <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-rose-700 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>نعم، احذف الصنف</span>
              </button>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto text-right space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {editingCoupon ? 'تعديل الكوبون' : 'إضافة كوبون خصم جديد'}
            </h3>
            <form onSubmit={handleSaveCoupon} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">كود الخصم: *</label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="مثال: TAZA15"
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold uppercase text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">نوع الخصم:</label>
                  <select
                    value={couponDiscountType}
                    onChange={(e) => setCouponDiscountType(e.target.value as 'fixed' | 'percentage')}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="fixed">قيمة ثابتة (جنيه)</option>
                    <option value="percentage">نسبة مئوية (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">قيمة الخصم:</label>
                  <input
                    type="number"
                    value={couponDiscountVal}
                    onChange={(e) => setCouponDiscountVal(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">الحد الأدنى للطلب (جنيه):</label>
                <input
                  type="number"
                  value={couponMinOrder}
                  onChange={(e) => setCouponMinOrder(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  حفظ الكوبون
                </button>
                {editingCoupon && (
                  <button
                    type="button"
                    onClick={() => {
                      const toDel = editingCoupon;
                      setIsCouponModalOpen(false);
                      setCouponToDelete(toDel);
                    }}
                    className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl cursor-pointer hover:bg-rose-100 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Region Modal */}
      {isRegionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto text-right space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {editingRegion ? 'تعديل منطقة التوصيل' : 'إضافة محافظة / منطقة جديدة'}
            </h3>
            <form onSubmit={handleSaveRegion} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">اسم المحافظة: *</label>
                <input
                  type="text"
                  value={regionGov}
                  onChange={(e) => setRegionGov(e.target.value)}
                  placeholder="مثال: القاهرة"
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">الأحياء والمدن التابعة (مفصولة بفاصلة):</label>
                <input
                  type="text"
                  value={regionCities}
                  onChange={(e) => setRegionCities(e.target.value)}
                  placeholder="مدينة نصر، التجمع، المعادي"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">سعر التوصيل (جنيه):</label>
                  <input
                    type="number"
                    value={regionFee}
                    onChange={(e) => setRegionFee(Number(e.target.value))}
                    min={0}
                    required
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">الحد الأدنى للطلب:</label>
                  <input
                    type="number"
                    value={regionMinOrder}
                    onChange={(e) => setRegionMinOrder(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  حفظ المنطقة
                </button>
                {editingRegion && (
                  <button
                    type="button"
                    onClick={() => {
                      const toDel = editingRegion;
                      setIsRegionModalOpen(false);
                      setRegionToDelete(toDel);
                    }}
                    className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl cursor-pointer hover:bg-rose-100 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsRegionModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Coupon Confirmation Modal */}
      {couponToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                تأكيد حذف الكوبون
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                هل أنت متأكد من رغبتك في حذف الكوبون <strong className="font-mono text-cyan-600">{couponToDelete.code}</strong> بقيمة ({couponToDelete.discountValue} {couponToDelete.discountType === 'percentage' ? '%' : 'جنيه'}) نهائياً؟
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  deleteCoupon(couponToDelete.id);
                  setCouponToDelete(null);
                }}
                className="flex-1 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 cursor-pointer transition-colors"
              >
                نعم، احذف الكوبون
              </button>
              <button
                type="button"
                onClick={() => setCouponToDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Region Confirmation Modal */}
      {regionToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                تأكيد حذف منطقة التوصيل
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                هل أنت متأكد من رغبتك في حذف منطقة <strong className="text-slate-900 dark:text-white">{regionToDelete.governorate}</strong> (سعر التوصيل: {regionToDelete.deliveryFee} جنيه)؟
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  deleteRegion(regionToDelete.id);
                  setRegionToDelete(null);
                }}
                className="flex-1 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 cursor-pointer transition-colors"
              >
                نعم، احذف المنطقة
              </button>
              <button
                type="button"
                onClick={() => setRegionToDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal for Quick Print */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-900 my-auto text-right space-y-4 font-sans">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="font-black text-lg text-slate-950">فاتورة طلب سمك طازج 🐟</h2>
                <p className="text-xs text-slate-500 font-mono">متجر الملاح - رقم: {selectedOrderForInvoice.orderNumber}</p>
              </div>
              <button
                onClick={() => setSelectedOrderForInvoice(null)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1 text-slate-700">
              <p><strong>العميل:</strong> {selectedOrderForInvoice.customerName}</p>
              <p><strong>الهاتف:</strong> {selectedOrderForInvoice.customerPhone}</p>
              {selectedOrderForInvoice.depositTransactionRef && (
                <p className="text-cyan-800 font-bold"><strong>رقم المحول منه:</strong> {selectedOrderForInvoice.depositTransactionRef}</p>
              )}
              <p><strong>العنوان:</strong> {selectedOrderForInvoice.governorate} - {selectedOrderForInvoice.city} - {selectedOrderForInvoice.address}</p>
              <p><strong>تاريخ الطلب:</strong> {new Date(selectedOrderForInvoice.createdAt).toLocaleString('ar-EG')}</p>
            </div>

            <div className="border-t border-b py-2 space-y-1.5 text-xs">
              {selectedOrderForInvoice.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.productName} ({it.quantity} {it.unit})</span>
                  <span className="font-bold">{it.itemTotal} ج</span>
                </div>
              ))}
              <div className="flex justify-between text-emerald-600 font-bold pt-1">
                <span>التوصيل:</span>
                <span>مجاناً 🚚</span>
              </div>
              {selectedOrderForInvoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>خصم الكوبون ({selectedOrderForInvoice.couponCode}):</span>
                  <span>-{selectedOrderForInvoice.discountAmount} ج</span>
                </div>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-black text-sm text-slate-950">
                <span>الإجمالي الكلي:</span>
                <span>{selectedOrderForInvoice.total} جنيه</span>
              </div>
              <div className="flex justify-between text-cyan-800 font-bold">
                <span>العربون ({selectedOrderForInvoice.depositStatus === 'confirmed' ? 'مؤكد ✓' : 'قيد المراجعة'}):</span>
                <span>{selectedOrderForInvoice.depositPaid} جنيه</span>
              </div>
              <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t">
                <span>المتبقي للدليفري عند الاستلام:</span>
                <span>{selectedOrderForInvoice.remainingAmount} جنيه</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة الفاتورة</span>
              </button>
              <button
                onClick={() => setSelectedOrderForInvoice(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
});
