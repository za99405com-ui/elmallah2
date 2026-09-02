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
  
  // Custom pieces & weight configuration (Admin controlled, flexible range)
  saleType: 'weight' | 'piece';   // هل البيع بالوزن أم بالقطعة
  piecesPerKiloRange?: string;    // عدد القطع التقريبي في الكيلو (مثال: 3-4 قطع / كجم)
  pieceWeightRange?: string;      // الوزن التقريبي للقطعة (مثال: 250-350 جرام)
  minOrder?: number;              // الحد الأدنى للطلب (مثال: 1 كجم أو 2 قطعة)
  maxOrder?: number;              // الحد الأقصى للطلب

  // Deposit settings per product
  depositType?: 'none' | 'fixed' | 'percentage'; // نوع العربون للمنتج
  depositValue?: number;          // قيمة العربون (جنيه أو نسبة مئوية)

  isPopular?: boolean;
  isTodayOffer?: boolean;
  isNewArrival?: boolean;
  salesCount: number;
  badgeText?: string;
}

export interface CartItem {
  product: Product;
  quantity: number; // in units (e.g. 1 kg, 2 kg, or 3 pieces)
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
  depositRequired: number;        // قيمة العربون المطلوب
  depositPaid: number;            // قيمة العربون المدفوع/المحول
  depositStatus: DepositStatus;   // حالة مراجعة العربون
  depositTransactionRef?: string; // رقم المعاملة أو اسم المحول
  remainingAmount: number;        // المبلغ المتبقي للسداد عند الاستلام

  status: OrderStatus;
  createdAt: string;
  deliveryTargetDate?: string;    // e.g. "اليوم مبرد" أو "غداً مبرد"
  isBeforeCutoff?: boolean;
  estimatedDeliveryTime?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed'; // نسبة مئوية أو مبلغ ثابت
  discountValue: number;                // مثلاً 10 (10%) أو 50 (50 جنيه)
  minOrderAmount?: number;              // الحد الأدنى للطلب لتفعيل الكوبون
  maxDiscount?: number;                 // أقصى حد للخصم في حالة النسبة المئوية
  usageLimit?: number;                  // أقصى عدد مرات استخدام
  usageCount: number;                   // عدد مرات الاستخدام الحالية
  expiryDate?: string;                  // تاريخ انتهاء الصلاحية
  isActive: boolean;                    // تفعيل/تعطيل
}

export interface DeliveryRegion {
  id: string;
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
  defaultDepositType: 'fixed' | 'percentage' | 'none'; // سياسة العربون الافتراضية
  defaultDepositValue: number;     // قيمة العربون الافتراضي (مثلاً 50 ج أو 20%)
  allowCoupons: boolean;           // تفعيل نظام الكوبونات
}
