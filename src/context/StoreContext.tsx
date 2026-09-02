import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Product, 
  CartItem, 
  Order, 
  OrderStatus, 
  StoreSettings, 
  UserAccount, 
  ProductCategory,
  PaymentMethod,
  Coupon,
  DeliveryRegion
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_SETTINGS, 
  INITIAL_COUPONS, 
  INITIAL_REGIONS 
} from '../data/initialData';
import { api } from '../utils/api';

interface StoreContextType {
  // Navigation & Theme
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Products
  products: Product[];
  visibleProducts: Product[];
  addProduct: (product: Omit<Product, 'id' | 'salesCount'>) => void;
  updateProduct: (id: string, updatedFields: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  resetProductsToDefault: () => void;
  toggleProductStock: (id: string) => void;
  toggleProductVisibility: (id: string) => void;
  selectedCategory: ProductCategory | 'all';
  setSelectedCategory: (cat: ProductCategory | 'all') => void;
  selectedProductForModal: Product | null;
  setSelectedProductForModal: (p: Product | null) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, notes?: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartDepositRequired: number;

  // Coupons
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  couponError: string | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  addCoupon: (coupon: Omit<Coupon, 'id' | 'usageCount'>) => void;
  updateCoupon: (id: string, updated: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  toggleCouponStatus: (id: string) => void;

  // Delivery Regions
  regions: DeliveryRegion[];
  activeRegions: DeliveryRegion[];
  selectedRegionId: string;
  setSelectedRegionId: (id: string) => void;
  currentDeliveryFee: number;
  addRegion: (region: Omit<DeliveryRegion, 'id'>) => void;
  updateRegion: (id: string, updated: Partial<DeliveryRegion>) => void;
  deleteRegion: (id: string) => void;
  toggleRegionStatus: (id: string) => void;

  // Orders
  orders: Order[];
  createOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    governorate: string;
    city: string;
    address: string;
    notes?: string;
    paymentMethod: PaymentMethod;
    depositPaid: number;
    depositTransactionRef?: string;
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  confirmDeposit: (orderId: string) => void;
  rejectDeposit: (orderId: string) => void;
  confirmOrderAndDeposit: (orderId: string) => void;
  reOrder: (order: Order) => void;
  currentTrackedOrder: Order | null;
  setCurrentTrackedOrder: (order: Order | null) => void;

  // Favorites
  favorites: string[];
  toggleFavorite: (productId: string) => void;

  // Store Settings & 3:00 AM Cutoff
  storeSettings: StoreSettings;
  updateStoreSettings: (newSettings: Partial<StoreSettings>) => void;
  cutoffInfo: {
    isBeforeCutoff: boolean;
    cutoffTimeString: string;
    deliveryDateLabel: string;
    badgeLabel: string;
  };

  // User Auth & Session
  currentUser: UserAccount | null;
  loginUser: (phone: string, name?: string) => void;
  registerUser: (user: Omit<UserAccount, 'id' | 'createdAt'>) => void;
  logoutUser: () => void;
  updateUserAccount: (data: Partial<UserAccount>) => void;

  // Admin Authentication & Security (Server-Verified)
  isAdminAuthenticated: boolean;
  verifyAdminPasscode: (passcode: string) => Promise<{ success: boolean; error?: string; lockoutSeconds?: number }>;
  changeAdminPassword: (currentPasscode: string, newPasscode: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logoutAdmin: () => void;
  adminLockoutSeconds: number;
  adminFailedAttempts: number;

  // Backend & AI
  backendConnected: boolean;
  askAiAssistant: (question: string, fishType?: string, occasion?: string) => Promise<{ success: boolean; answer?: string; error?: string }>;

  // Modals & UI
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isQuickCartOpen: boolean;
  setIsQuickCartOpen: (open: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('products');

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('almallah_theme');
    if (saved === 'dark' || saved === 'light') {
      if (saved === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return saved;
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('almallah_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('almallah_products_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_PRODUCTS;
  });

  useEffect(() => {
    localStorage.setItem('almallah_products_v2', JSON.stringify(products));
  }, [products]);

  const visibleProducts = useMemo(() => {
    return products
      .filter(p => p.isVisible !== false)
      .sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
  }, [products]);

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('almallah_coupons_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_COUPONS;
  });

  useEffect(() => {
    localStorage.setItem('almallah_coupons_v2', JSON.stringify(coupons));
  }, [coupons]);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Delivery Regions
  const [regions, setRegions] = useState<DeliveryRegion[]>(() => {
    const saved = localStorage.getItem('almallah_regions_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_REGIONS;
  });

  useEffect(() => {
    localStorage.setItem('almallah_regions_v2', JSON.stringify(regions));
  }, [regions]);

  const activeRegions = useMemo(() => regions.filter(r => r.isActive), [regions]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>(() => {
    return activeRegions[0]?.id || 'reg-cairo';
  });

  // Delivery fee is 0 (Free Delivery) per store policy
  const currentDeliveryFee = useMemo(() => {
    return 0;
  }, []);

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('almallah_cart_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('almallah_cart_v2', JSON.stringify(cart));
  }, [cart]);

  // Settings
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('almallah_settings_v2');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          whatsappNumber: '01015192040',
          instapayNumber: parsed.instapayNumber || '01015192040',
          vodafoneCashNumber: parsed.vodafoneCashNumber || '01015192040'
        };
      } catch (e) { console.error(e); }
    }
    return INITIAL_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('almallah_settings_v2', JSON.stringify(storeSettings));
  }, [storeSettings]);

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('almallah_orders_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ORDERS;
  });

  useEffect(() => {
    localStorage.setItem('almallah_orders_v2', JSON.stringify(orders));
  }, [orders]);

  const [currentTrackedOrder, setCurrentTrackedOrder] = useState<Order | null>(null);

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('almallah_favorites_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return ['p1', 'p3'];
  });

  useEffect(() => {
    localStorage.setItem('almallah_favorites_v2', JSON.stringify(favorites));
  }, [favorites]);

  // User Auth
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('almallah_user_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('almallah_user_v2', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('almallah_user_v2');
    }
  }, [currentUser]);

  // Admin Auth & Security (Server-Verified Session)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return Boolean(api.getHealth && sessionStorage.getItem('almallah_admin_token'));
  });
  const [adminFailedAttempts, setAdminFailedAttempts] = useState<number>(0);
  const [adminLockoutSeconds, setAdminLockoutSeconds] = useState<number>(0);

  // Lockout countdown timer
  useEffect(() => {
    if (adminLockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setAdminLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [adminLockoutSeconds]);

  // Backend State & Sync
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function syncBackend() {
      try {
        const health = await api.getHealth();
        if (health && health.status === 'ok') {
          if (isMounted) setBackendConnected(true);

          // Verify admin session token with backend if exists
          const existingToken = sessionStorage.getItem('almallah_admin_token');
          if (existingToken) {
            const verifyRes = await api.adminVerify(existingToken);
            if (isMounted) {
              setIsAdminAuthenticated(Boolean(verifyRes && verifyRes.valid));
            }
          }
          
          const [backendProducts, backendOrders, backendCoupons, backendRegions, backendSettings] = await Promise.allSettled([
            api.getProducts(),
            api.getOrders(),
            api.getCoupons(),
            api.getRegions(),
            api.getSettings()
          ]);

          if (isMounted) {
            if (backendProducts.status === 'fulfilled' && backendProducts.value && backendProducts.value.length > 0) {
              setProducts(backendProducts.value);
            }
            if (backendOrders.status === 'fulfilled' && backendOrders.value && backendOrders.value.length > 0) {
              setOrders(backendOrders.value);
            }
            if (backendCoupons.status === 'fulfilled' && backendCoupons.value && backendCoupons.value.length > 0) {
              setCoupons(backendCoupons.value);
            }
            if (backendRegions.status === 'fulfilled' && backendRegions.value && backendRegions.value.length > 0) {
              setRegions(backendRegions.value);
            }
            if (backendSettings.status === 'fulfilled' && backendSettings.value) {
              setStoreSettings(prev => ({ ...prev, ...backendSettings.value }));
            }
          }
        }
      } catch (err) {
        console.warn('Backend sync failed, using client storage:', err);
      }
    }
    syncBackend();
    return () => { isMounted = false; };
  }, []);

  const askAiAssistant = async (question: string, fishType?: string, occasion?: string) => {
    return await api.askAiAssistant(question, fishType, occasion);
  };

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isQuickCartOpen, setIsQuickCartOpen] = useState<boolean>(false);

  // Cart Calculations
  const cartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartDepositRequired = useMemo(() => {
    if (cart.length === 0) return 0;
    // Calculate based on product rules or default store setting
    let totalDeposit = 0;
    for (const item of cart) {
      const p = item.product;
      const itemSubtotal = p.price * item.quantity;
      if (p.depositType === 'fixed' && p.depositValue) {
        totalDeposit += p.depositValue;
      } else if (p.depositType === 'percentage' && p.depositValue) {
        totalDeposit += (itemSubtotal * p.depositValue) / 100;
      } else if (storeSettings.defaultDepositType === 'percentage') {
        totalDeposit += (itemSubtotal * (storeSettings.defaultDepositValue || 20)) / 100;
      } else if (storeSettings.defaultDepositType === 'fixed') {
        totalDeposit += (storeSettings.defaultDepositValue || 50);
      }
    }
    return Math.round(totalDeposit);
  }, [cart, storeSettings]);

  // Dynamic Coupon Discount Calculation
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.minOrderAmount && cartSubtotal < appliedCoupon.minOrderAmount) {
      return 0;
    }
    if (appliedCoupon.discountType === 'fixed') {
      return Math.min(appliedCoupon.discountValue, cartSubtotal);
    }
    if (appliedCoupon.discountType === 'percentage') {
      const calc = (cartSubtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount && calc > appliedCoupon.maxDiscount) {
        return appliedCoupon.maxDiscount;
      }
      return Math.round(calc * 10) / 10;
    }
    return 0;
  }, [appliedCoupon, cartSubtotal]);

  // 3:00 AM Daily Cutoff Logic
  const cutoffInfo = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const isBefore = 
      currentHour < storeSettings.cutoffHour || 
      (currentHour === storeSettings.cutoffHour && currentMinute < storeSettings.cutoffMinute);

    const cutoffHourDisplay = storeSettings.cutoffHour === 0 ? '12:00 منتصف الليل' : `${storeSettings.cutoffHour}:00 ص`;

    return {
      isBeforeCutoff: isBefore,
      cutoffTimeString: cutoffHourDisplay,
      deliveryDateLabel: isBefore ? 'التوصيل اليوم مبرد' : 'التوصيل غداً مبرد',
      badgeLabel: isBefore ? '⚡ طلبات اليوم (قبل 3:00 ص)' : '📅 طلبات الغد (بعد 3:00 ص)'
    };
  }, [storeSettings.cutoffHour, storeSettings.cutoffMinute]);

  // Product Actions
  const addProduct = (productData: Omit<Product, 'id' | 'salesCount'>) => {
    const newProduct: Product = {
      ...productData,
      id: `p-${Date.now()}`,
      salesCount: 0,
      isVisible: productData.isVisible ?? true,
      sortOrder: productData.sortOrder ?? (products.length + 1)
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id);
      try {
        localStorage.setItem('almallah_products_v2', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving deleted product:', e);
      }
      return next;
    });
    setCart(prev => prev.filter(item => item.product.id !== id));
    setFavorites(prev => prev.filter(favId => favId !== id));
    if (selectedProductForModal?.id === id) {
      setSelectedProductForModal(null);
    }
  };

  const resetProductsToDefault = () => {
    setProducts(INITIAL_PRODUCTS);
    try {
      localStorage.setItem('almallah_products_v2', JSON.stringify(INITIAL_PRODUCTS));
    } catch (e) {
      console.error('Error resetting products:', e);
    }
  };

  const toggleProductStock = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: !p.inStock } : p));
  };

  const toggleProductVisibility = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isVisible: !p.isVisible } : p));
  };

  // Cart Actions
  const addToCart = (product: Product, quantity = 1, notes?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, notes: notes || item.notes }
            : item
        );
      }
      return [...prev, { product, quantity, notes }];
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Coupon Actions
  const applyCoupon = (code: string): boolean => {
    setCouponError(null);
    const cleanCode = code.trim().toUpperCase();
    const found = coupons.find(c => c.code.toUpperCase() === cleanCode);

    if (!found) {
      setCouponError('كود الكوبون غير صحيح');
      return false;
    }
    if (!found.isActive) {
      setCouponError('هذا الكوبون غير مفعّل حالياً');
      return false;
    }
    if (found.expiryDate && new Date(found.expiryDate) < new Date()) {
      setCouponError('انتهت صلاحية هذا الكوبون');
      return false;
    }
    if (found.usageLimit && found.usageCount >= found.usageLimit) {
      setCouponError('تم استنفاذ الحد الأقصى لاستخدام الكوبون');
      return false;
    }
    if (found.minOrderAmount && cartSubtotal < found.minOrderAmount) {
      setCouponError(`الحد الأدنى لتفعيل الكوبون هو ${found.minOrderAmount} جنيه`);
      return false;
    }

    setAppliedCoupon(found);
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const addCoupon = (couponData: Omit<Coupon, 'id' | 'usageCount'>) => {
    const newCoupon: Coupon = {
      ...couponData,
      id: `c-${Date.now()}`,
      code: couponData.code.trim().toUpperCase(),
      usageCount: 0
    };
    setCoupons(prev => [newCoupon, ...prev]);
  };

  const updateCoupon = (id: string, updated: Partial<Coupon>) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const deleteCoupon = (id: string) => {
    setCoupons(prev => {
      const next = prev.filter(c => c.id !== id);
      try {
        localStorage.setItem('almallah_coupons_v2', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving coupons:', e);
      }
      return next;
    });
    setAppliedCoupon(curr => (curr?.id === id ? null : curr));
  };

  const toggleCouponStatus = (id: string) => {
    setCoupons(prev => {
      const next = prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c);
      try {
        localStorage.setItem('almallah_coupons_v2', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Delivery Regions Actions
  const addRegion = (regionData: Omit<DeliveryRegion, 'id'>) => {
    const newRegion: DeliveryRegion = {
      ...regionData,
      id: `reg-${Date.now()}`
    };
    setRegions(prev => {
      const next = [...prev, newRegion];
      try {
        localStorage.setItem('almallah_regions_v2', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const updateRegion = (id: string, updated: Partial<DeliveryRegion>) => {
    setRegions(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...updated } : r);
      try {
        localStorage.setItem('almallah_regions_v2', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const deleteRegion = (id: string) => {
    setRegions(prev => {
      const next = prev.filter(r => r.id !== id);
      try {
        localStorage.setItem('almallah_regions_v2', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving regions:', e);
      }
      return next;
    });
  };

  const toggleRegionStatus = (id: string) => {
    setRegions(prev => {
      const next = prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
      try {
        localStorage.setItem('almallah_regions_v2', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Order Actions
  const createOrder = (orderData: {
    customerName: string;
    customerPhone: string;
    governorate: string;
    city: string;
    address: string;
    notes?: string;
    paymentMethod: PaymentMethod;
    depositPaid: number;
    depositTransactionRef?: string;
  }): Order => {
    const orderItems = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.image,
      unit: item.product.unit,
      price: item.product.price,
      quantity: item.quantity,
      itemTotal: item.product.price * item.quantity,
      piecesPerKiloRange: item.product.piecesPerKiloRange
    }));

    const finalSubtotal = cartSubtotal;
    const finalDelivery = currentDeliveryFee;
    const finalDiscount = couponDiscount;
    const finalTotal = Math.max(0, finalSubtotal + finalDelivery - finalDiscount);
    const finalDepositReq = Math.min(finalTotal, cartDepositRequired);
    const finalRemaining = Math.max(0, finalTotal - orderData.depositPaid);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `#${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      governorate: orderData.governorate,
      city: orderData.city,
      address: orderData.address,
      notes: orderData.notes,
      items: orderItems,
      subtotal: finalSubtotal,
      deliveryFee: finalDelivery,
      discountAmount: finalDiscount,
      couponCode: appliedCoupon?.code,
      total: finalTotal,
      paymentMethod: orderData.paymentMethod,
      depositRequired: finalDepositReq,
      depositPaid: orderData.depositPaid,
      depositStatus: orderData.depositPaid > 0 ? 'pending' : 'none',
      depositTransactionRef: orderData.depositTransactionRef,
      remainingAmount: finalRemaining,
      status: 'new',
      createdAt: new Date().toISOString(),
      deliveryTargetDate: cutoffInfo.isBeforeCutoff ? 'اليوم' : 'غداً',
      isBeforeCutoff: cutoffInfo.isBeforeCutoff,
      estimatedDeliveryTime: 'خلال 2-4 ساعات مبرد 🚚'
    };

    setOrders(prev => [newOrder, ...prev]);

    // Increase coupon usage count if applied
    if (appliedCoupon) {
      setCoupons(prev => prev.map(c => c.id === appliedCoupon.id ? { ...c, usageCount: c.usageCount + 1 } : c));
    }

    clearCart();
    setCurrentTrackedOrder(newOrder);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    if (currentTrackedOrder?.id === orderId) {
      setCurrentTrackedOrder(prev => prev ? { ...prev, status } : null);
    }
  };

  const confirmDeposit = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          depositStatus: 'confirmed',
          remainingAmount: Math.max(0, o.total - o.depositPaid)
        };
      }
      return o;
    }));
  };

  const confirmOrderAndDeposit = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: o.status === 'new' ? 'preparing' : o.status,
          depositStatus: 'confirmed',
          remainingAmount: Math.max(0, o.total - o.depositPaid)
        };
      }
      return o;
    }));
    if (currentTrackedOrder?.id === orderId) {
      setCurrentTrackedOrder(prev => prev ? { 
        ...prev, 
        status: prev.status === 'new' ? 'preparing' : prev.status, 
        depositStatus: 'confirmed',
        remainingAmount: Math.max(0, prev.total - prev.depositPaid)
      } : null);
    }
  };

  const rejectDeposit = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          depositStatus: 'rejected',
          remainingAmount: o.total
        };
      }
      return o;
    }));
  };

  const reOrder = (order: Order) => {
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.inStock) {
        addToCart(prod, item.quantity);
      }
    });
    setActiveTab('cart');
  };

  // Favorites Actions
  const toggleFavorite = (productId: string) => {
    setFavorites(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // Settings Actions
  const updateStoreSettings = (newSettings: Partial<StoreSettings>) => {
    setStoreSettings(prev => ({ ...prev, ...newSettings }));
  };

  // User Profile Actions
  const loginUser = (phone: string, name?: string) => {
    const user: UserAccount = {
      id: `usr-${Date.now()}`,
      name: name || 'عميل الملاح',
      phone,
      governorate: 'القاهرة',
      city: 'مدينة نصر',
      address: '',
      createdAt: new Date().toISOString()
    };
    setCurrentUser(user);
  };

  const registerUser = (user: Omit<UserAccount, 'id' | 'createdAt'>) => {
    const newUser: UserAccount = {
      ...user,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setCurrentUser(newUser);
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  const updateUserAccount = (data: Partial<UserAccount>) => {
    if (!currentUser) return;
    setCurrentUser({ ...currentUser, ...data });
  };

  // Admin Auth Actions (Server-Side Authenticated)
  const verifyAdminPasscode = async (passcode: string): Promise<{ success: boolean; error?: string; lockoutSeconds?: number }> => {
    if (adminLockoutSeconds > 0) {
      return { 
        success: false, 
        error: `تم إيقاف المحاولات مؤقتاً لأسباب أمنية. يرجى المحاولة بعد ${adminLockoutSeconds} ثانية.`,
        lockoutSeconds: adminLockoutSeconds
      };
    }

    try {
      const result = await api.adminLogin(passcode);
      if (result.success) {
        setIsAdminAuthenticated(true);
        setAdminFailedAttempts(0);
        setAdminLockoutSeconds(0);
        return { success: true };
      }

      if (result.lockoutSeconds) {
        setAdminLockoutSeconds(result.lockoutSeconds);
        setAdminFailedAttempts(5);
        return {
          success: false,
          error: result.error || 'تم حظر المحاولات مؤقتاً.',
          lockoutSeconds: result.lockoutSeconds
        };
      }

      setAdminFailedAttempts(prev => prev + 1);
      return {
        success: false,
        error: result.error || 'رمز المرور غير صحيح'
      };
    } catch (e: any) {
      return {
        success: false,
        error: 'تعذر التحقق من رمز المرور عبر الخادم'
      };
    }
  };

  const changeAdminPassword = async (currentPasscode: string, newPasscode: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    return await api.adminChangePassword(currentPasscode, newPasscode);
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    api.adminLogout();
  };

  return (
    <StoreContext.Provider
      value={{
        activeTab,
        setActiveTab,
        theme,
        toggleTheme,
        products,
        visibleProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        resetProductsToDefault,
        toggleProductStock,
        toggleProductVisibility,
        selectedCategory,
        setSelectedCategory,
        selectedProductForModal,
        setSelectedProductForModal,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        cartDepositRequired,
        coupons,
        appliedCoupon,
        couponDiscount,
        couponError,
        applyCoupon,
        removeCoupon,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        toggleCouponStatus,
        regions,
        activeRegions,
        selectedRegionId,
        setSelectedRegionId,
        currentDeliveryFee,
        addRegion,
        updateRegion,
        deleteRegion,
        toggleRegionStatus,
        orders,
        createOrder,
        updateOrderStatus,
        confirmDeposit,
        rejectDeposit,
        confirmOrderAndDeposit,
        reOrder,
        currentTrackedOrder,
        setCurrentTrackedOrder,
        favorites,
        toggleFavorite,
        storeSettings,
        updateStoreSettings,
        cutoffInfo,
        currentUser,
        loginUser,
        registerUser,
        logoutUser,
        updateUserAccount,
        isAdminAuthenticated,
        verifyAdminPasscode,
        changeAdminPassword,
        logoutAdmin,
        adminLockoutSeconds,
        adminFailedAttempts,
        backendConnected,
        askAiAssistant,
        isSearchOpen,
        setIsSearchOpen,
        isQuickCartOpen,
        setIsQuickCartOpen
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
