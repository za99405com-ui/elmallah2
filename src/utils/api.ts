import { Product, Order, Coupon, DeliveryRegion, StoreSettings } from '../types';

const API_BASE = '/api';

// Admin Token Storage Helper
export const getStoredAdminToken = (): string | null => {
  try {
    return sessionStorage.getItem('almallah_admin_token');
  } catch (e) {
    return null;
  }
};

export const setStoredAdminToken = (token: string | null) => {
  try {
    if (token) {
      sessionStorage.setItem('almallah_admin_token', token);
    } else {
      sessionStorage.removeItem('almallah_admin_token');
    }
  } catch (e) {
    console.error('Failed to update admin token storage', e);
  }
};

const getAuthHeaders = (): Record<string, string> => {
  const token = getStoredAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Admin Authentication (Protected Backend API)
  async adminLogin(passcode: string) {
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setStoredAdminToken(data.token);
      }
      return data;
    } catch (e: any) {
      return {
        success: false,
        error: e.message || 'تعذر الاتصال بخادم الإدارة'
      };
    }
  },

  async adminVerify(token?: string) {
    try {
      const t = token || getStoredAdminToken();
      if (!t) return { success: false, valid: false };

      const res = await fetch(`${API_BASE}/admin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t}`
        },
        body: JSON.stringify({ token: t })
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setStoredAdminToken(null);
      }
      return data;
    } catch (e) {
      return { success: false, valid: false };
    }
  },

  async adminLogout() {
    try {
      const token = getStoredAdminToken();
      if (token) {
        await fetch(`${API_BASE}/admin/logout`, {
          method: 'POST',
          headers: getAuthHeaders()
        });
      }
    } catch (e) {
      console.warn('Admin logout backend error:', e);
    } finally {
      setStoredAdminToken(null);
    }
    return { success: true };
  },

  async adminChangePassword(currentPasscode: string, newPasscode: string) {
    try {
      const res = await fetch(`${API_BASE}/admin/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPasscode, newPasscode })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'تعذر تحديث كلمة المرور' };
    }
  },

  // Health
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch (e) {
      console.warn('API Health check error:', e);
      return { status: 'offline' };
    }
  },

  // Products
  async getProducts(params?: { category?: string; search?: string; inStock?: boolean; visibleOnly?: boolean }) {
    try {
      const query = new URLSearchParams();
      if (params?.category) query.append('category', params.category);
      if (params?.search) query.append('search', params.search);
      if (params?.inStock) query.append('inStock', 'true');
      if (params?.visibleOnly) query.append('visibleOnly', 'true');

      const res = await fetch(`${API_BASE}/products?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const json = await res.json();
      return json.data as Product[];
    } catch (e) {
      console.warn('Products API fallback:', e);
      return null;
    }
  },

  async createProduct(product: Omit<Product, 'id'>) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(product)
    });
    return await res.json();
  },

  async updateProduct(id: string, product: Partial<Product>) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(product)
    });
    return await res.json();
  },

  async deleteProduct(id: string) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  // Orders
  async getOrders(params?: { status?: string; phone?: string; activeOnly?: boolean }) {
    try {
      const query = new URLSearchParams();
      if (params?.status) query.append('status', params.status);
      if (params?.phone) query.append('phone', params.phone);
      if (params?.activeOnly) query.append('activeOnly', 'true');

      const res = await fetch(`${API_BASE}/orders?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const json = await res.json();
      return json.data as Order[];
    } catch (e) {
      console.warn('Orders API fallback:', e);
      return null;
    }
  },

  async createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return await res.json();
  },

  async updateOrderStatus(id: string, status: Order['status']) {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return await res.json();
  },

  async updateOrderDeposit(id: string, depositStatus: Order['depositStatus']) {
    const res = await fetch(`${API_BASE}/orders/${id}/deposit`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ depositStatus })
    });
    return await res.json();
  },

  async deleteOrder(id: string) {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  // Coupons
  async getCoupons() {
    try {
      const res = await fetch(`${API_BASE}/coupons`);
      if (!res.ok) throw new Error('Failed to fetch coupons');
      const json = await res.json();
      return json.data as Coupon[];
    } catch (e) {
      console.warn('Coupons API fallback:', e);
      return null;
    }
  },

  async validateCoupon(code: string, cartTotal: number) {
    const res = await fetch(`${API_BASE}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, cartTotal })
    });
    return await res.json();
  },

  async createCoupon(coupon: Omit<Coupon, 'id'>) {
    const res = await fetch(`${API_BASE}/coupons`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(coupon)
    });
    return await res.json();
  },

  async deleteCoupon(id: string) {
    const res = await fetch(`${API_BASE}/coupons/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  // Regions
  async getRegions() {
    try {
      const res = await fetch(`${API_BASE}/regions`);
      if (!res.ok) throw new Error('Failed to fetch regions');
      const json = await res.json();
      return json.data as DeliveryRegion[];
    } catch (e) {
      console.warn('Regions API fallback:', e);
      return null;
    }
  },

  async createRegion(region: Omit<DeliveryRegion, 'id'>) {
    const res = await fetch(`${API_BASE}/regions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(region)
    });
    return await res.json();
  },

  async updateRegion(id: string, region: Partial<DeliveryRegion>) {
    const res = await fetch(`${API_BASE}/regions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(region)
    });
    return await res.json();
  },

  async deleteRegion(id: string) {
    const res = await fetch(`${API_BASE}/regions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  },

  // Settings
  async getSettings() {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (!res.ok) throw new Error('Failed to fetch settings');
      const json = await res.json();
      return json.data as StoreSettings;
    } catch (e) {
      console.warn('Settings API fallback:', e);
      return null;
    }
  },

  async updateSettings(settings: Partial<StoreSettings>) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    return await res.json();
  },

  // AI Assistant / Recipes
  async askAiAssistant(question: string, fishType?: string, occasion?: string) {
    try {
      const res = await fetch(`${API_BASE}/ai/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, fishType, occasion })
      });
      return await res.json();
    } catch (e) {
      console.warn('AI Assistant error:', e);
      return {
        success: false,
        error: 'تعذر الاتصال بالمساعد الذكي'
      };
    }
  }
};
