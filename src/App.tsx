import React, { useState, useMemo, useTransition, useCallback } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DeliveryCutoffBanner } from './components/DeliveryCutoffBanner';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SearchModal } from './components/SearchModal';
import { CheckoutFlow } from './components/CheckoutFlow';
import { OrdersTracker } from './components/OrdersTracker';
import { FavoritesView } from './components/FavoritesView';
import { SettingsView } from './components/SettingsView';
import { AdminDashboard } from './components/AdminDashboard';
import { AboutPage, DeliveryPolicyPage, ContactPage } from './components/InfoPages';
import { Footer } from './components/Footer';
import { STORE_CATEGORIES } from './data/initialData';
import { 
  MessageCircle, 
  ShoppingCart, 
  Search,
  X
} from 'lucide-react';
import { Product, ProductCategory } from './types';
import { getWhatsAppLink } from './utils/whatsapp';

/* -------------------------------------------------------------------------- */
/* Subcomponent: Products Catalog View (Memoized)                             */
/* -------------------------------------------------------------------------- */
interface ProductsCatalogViewProps {
  visibleProducts: Product[];
  selectedCategory: ProductCategory | 'all';
  onSelectCategory: (cat: ProductCategory | 'all') => void;
}

const ProductsCatalogView = React.memo<ProductsCatalogViewProps>(({
  visibleProducts,
  selectedCategory,
  onSelectCategory
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProducts = useMemo(() => {
    return visibleProducts.filter((product) => {
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          product.name.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [visibleProducts, selectedCategory, searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleResetFilters = useCallback(() => {
    onSelectCategory('all');
    setSearchQuery('');
  }, [onSelectCategory]);

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>قائمة الأسماك الطازجة</span>
              <span className="text-base">🐟</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
              صيد اليوم طازج 100% بدون تجميد - اختر الكمية وأضفها للسلة فوراً
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم (بلطي، جمبري...)"
              className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            🐟 كل الأسماك ({visibleProducts.length})
          </button>

          {STORE_CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => onSelectCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === c.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-xl">
            🐠
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">لم نجد أصناف مطابقة</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto">
            يرجى تجربة فلتر آخر أو إعادة تعيين البحث لعرض كافة أنواع الأسماك الطازجة.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer hover:opacity-90"
          >
            إعادة ضبط الفلاتر
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
});
ProductsCatalogView.displayName = 'ProductsCatalogView';

/* -------------------------------------------------------------------------- */
/* Subcomponent: Floating Action Buttons (Memoized)                           */
/* -------------------------------------------------------------------------- */
interface FloatingButtonsProps {
  whatsappNumber: string;
  cartCount: number;
  activeTab: string;
  onOpenCart: () => void;
}

const FloatingActionButtons = React.memo<FloatingButtonsProps>(({
  whatsappNumber,
  cartCount,
  activeTab,
  onOpenCart
}) => {
  return (
    <div className="fixed bottom-16 lg:bottom-6 left-3.5 z-40 flex flex-col gap-2">
      {/* Floating WhatsApp for Help & Support */}
      <a
        href={getWhatsAppLink(whatsappNumber, 'مرحباً متجر الملاح، أحتاج مساعدة أو استفسار')}
        target="_blank"
        rel="noreferrer"
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="واتساب للمساعدة والدعم"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* Floating Cart Button */}
      {cartCount > 0 && activeTab !== 'cart' && (
        <button
          type="button"
          onClick={onOpenCart}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all relative cursor-pointer"
          title="إتمام الطلب"
        >
          <ShoppingCart className="w-5 h-5 text-cyan-400 dark:text-cyan-600" />
          <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
            {cartCount}
          </span>
        </button>
      )}
    </div>
  );
});
FloatingActionButtons.displayName = 'FloatingActionButtons';

/* -------------------------------------------------------------------------- */
/* Main App Component                                                         */
/* -------------------------------------------------------------------------- */
const MainApp: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    visibleProducts,
    selectedCategory, 
    setSelectedCategory,
    cartCount,
    storeSettings
  } = useStore();

  const [isPending, startTransition] = useTransition();

  const handleOpenCart = useCallback(() => {
    startTransition(() => {
      setActiveTab('cart');
    });
  }, [setActiveTab]);

  const handleSelectCategory = useCallback((cat: ProductCategory | 'all') => {
    startTransition(() => {
      setSelectedCategory(cat);
    });
  }, [setSelectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white transition-colors" dir="rtl">
      
      {/* Top Navbar */}
      <Navbar />

      {/* Non-blocking transition loading line indicator */}
      {isPending && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-500 z-50 animate-pulse" />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        
        {/* Delivery Cut-off Banner (Shown on main catalog and cart) */}
        {(activeTab === 'products' || activeTab === 'cart') && (
          <DeliveryCutoffBanner />
        )}

        {/* VIEW 1: PRODUCTS CATALOG (Default Store View) */}
        {activeTab === 'products' && (
          <ProductsCatalogView
            visibleProducts={visibleProducts}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {/* VIEW 2: CART & 3-STEP CHECKOUT */}
        {activeTab === 'cart' && <CheckoutFlow />}

        {/* VIEW 3: ORDERS TRACKER */}
        {activeTab === 'orders' && <OrdersTracker />}

        {/* VIEW 4: FAVORITES */}
        {activeTab === 'favorites' && <FavoritesView />}

        {/* VIEW 5: SETTINGS & USER ACCOUNT */}
        {activeTab === 'settings' && <SettingsView />}

        {/* VIEW 6: ADMIN DASHBOARD */}
        {activeTab === 'admin' && <AdminDashboard />}

        {/* VIEW 7: ABOUT PAGE */}
        {activeTab === 'about' && <AboutPage />}

        {/* VIEW 8: DELIVERY POLICY */}
        {activeTab === 'delivery' && <DeliveryPolicyPage />}

        {/* VIEW 9: CONTACT US */}
        {activeTab === 'contact' && <ContactPage />}

      </main>

      {/* Floating WhatsApp & Floating Cart Button */}
      <FloatingActionButtons
        whatsappNumber={storeSettings.whatsappNumber}
        cartCount={cartCount}
        activeTab={activeTab}
        onOpenCart={handleOpenCart}
      />

      {/* Global Modals */}
      <SearchModal />
      <ProductDetailModal />

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}
