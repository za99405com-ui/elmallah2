// Re-export all core types for standard modular imports
export type ProductUnit = 'كيلو' | 'نصف كيلو' | 'قطعة' | 'علبة' | 'طاجن';

export type ProductCategory = 
  | 'fresh_sea'        // أسماك بحرية فاخرة
  | 'fresh_lake'       // بلطي وبوري طازة
  | 'shrimp_seafood'   // جمبري وفواكه بحر
  | 'fillet'           // فيليه طازج
  | 'offers';          // باقات وعروض طازة

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  unit: ProductUnit;
  inStock: boolean;
  isVisible: boolean;             // إظهار/إخفاء المنتج
  sortOrder: number;              // ترتيب العرض
  image: string;
  description: string;
  
  // Custom pieces & weight configuration
  saleType: 'weight' | 'piece';   // هل البيع بالوزن أم بالقطعة
  piecesPerKiloRange?: string;    // عدد القطع التقريبي في الكيلو (مثال: 3-4 قطع / كجم)
  pieceWeightRange?: string;      // الوزن التقريبي للقطعة (مثال: 250-350 جرام)
  minOrder?: number;              // الحد الأدنى للطلب
  maxOrder?: number;              // الحد الأقصى للطلب

  // Deposit settings per product
  depositType?: 'none' | 'fixed' | 'percentage';
  depositValue?: number;

  isPopular?: boolean;
  isTodayOffer?: boolean;
  isNewArrival?: boolean;
  salesCount: number;
  badgeText?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export type OrderStatus = 
  | 'new'          // 🟡 طلب جديد
  | 'preparing'    // 🔵 جاري التجهيز
  | 'on_delivery'  // 🟠 خرج للتوصيل
  | 'delivered'    // 🟢 تم التسليم
  | 'cancelled';   // 🔴 تم الإلغاء

export type PaymentMethod = 
  | 'cash_on_delivery'  // الدفع عند الاستلام مع عربون
  | 'instapay'          // تحويل إنستاباي
  | 'vodafone_cash';    // تحويل فودافون كاش

export type DepositStatus = 
  | 'none'              // لا يوجد عربون
  | 'pending'           // في انتظار تأكيد التحويل من الإدارة
  | 'confirmed'         // تم تأكيد استلام العربون
  | 'rejected';         // تم رفض التحويل / غير صحيح

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  unit: ProductUnit;
  price: number;
  quantity: number;
  itemTotal: number;
  piecesPerKiloRange?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderCode?: string;
  customerName: string;
  customerPhone: string;
  governorate: string;
  city: string;
  address: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  couponCode?: string;
  total: number;

  // Deposit & Payment Information
  paymentMethod: PaymentMethod;
  depositRequired: number;
  depositPaid: number;
  depositStatus: DepositStatus;
  depositTransactionRef?: string;
  remainingAmount: number;

  status: OrderStatus;
  createdAt: string;
  deliveryTargetDate?: string;
  isBeforeCutoff?: boolean;
  estimatedDeliveryTime?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  expiryDate?: string;
  isActive: boolean;
}

export interface DeliveryRegion {
  id: string;
  name?: string;
  governorate: string;
  cities: string[];
  deliveryFee: number;
  minOrderAmount?: number;
  estimatedTime?: string;
  isActive: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  createdAt: string;
}

export interface StoreCategory {
  id: ProductCategory;
  name: string;
  emoji: string;
  image: string;
  countBadge?: string;
}

export interface StoreSettings {
  cutoffHour: number;              // Default: 3 (3:00 AM)
  cutoffMinute: number;            // Default: 0
  isStoreOpen: boolean;            // قبول الطلبات
  minimumOrderAmount: number;      // الحد الأدنى للطلب
  whatsappNumber: string;          // رقم الواتساب (Default: 01015192040)
  instapayNumber: string;          // رقم أو حساب إنستاباي (Default: 01015192040)
  vodafoneCashNumber: string;      // رقم فودافون كاش (Default: 01015192040)
  defaultDepositType: 'fixed' | 'percentage' | 'none';
  defaultDepositValue: number;
  allowCoupons: boolean;
}

// Database / Supabase Schema Types
export interface DatabaseSchema {
  products: Product;
  orders: Order;
  coupons: Coupon;
  delivery_regions: DeliveryRegion;
  store_settings: StoreSettings;
}
