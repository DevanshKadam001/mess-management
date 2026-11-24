import React, { useState, useEffect } from 'react';
import { Product, Category, Vendor } from '../../types';
import { api } from '../../services/api';
import { FoodCard } from '../../components/FoodCard';
import { FoodDetailModal } from '../../components/FoodDetailModal';
import {
  Search,
  Sparkles,
  Flame,
  Store,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Utensils,
  Leaf,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string, param?: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  searchQuery,
  onSearchChange,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('All');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [sortBy, setSortBy] = useState<string>('popular');

  // Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes, vendRes] = await Promise.all([
          api.getProducts(),
          api.getCategories(),
          api.getVendors(),
        ]);

        if (prodRes.success) setProducts(prodRes.data);
        if (catRes.success) setCategories(catRes.data);
        if (vendRes.success) setVendors(vendRes.data);
      } catch (err) {
        console.error('Failed to load menu data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtered products calculation
  const filteredProducts = products.filter((p) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category?.name.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Category filter
    if (selectedCategory !== 'All' && p.category?.name !== selectedCategory) {
      return false;
    }

    // Vendor filter
    if (selectedVendorId !== 'All' && p.vendorId !== selectedVendorId) {
      return false;
    }

    // Diet filter (Veg/Non-veg)
    if (dietFilter === 'veg' && !p.isVeg) return false;
    if (dietFilter === 'non-veg' && p.isVeg) return false;

    return true;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'prep-time') return a.preparationTime - b.preparationTime;
    return 0; // Default popular order
  });

  // Today's special items & popular dishes
  const specials = products.filter((p) => p.badge || p.calories).slice(0, 3);
  const popularDishes = products.filter((p) => p.isAvailable).slice(0, 4);

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Banner with Modern Gradient */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white shadow-xl shadow-orange-600/15">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />

        <div className="relative p-6 sm:p-10 md:p-12 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            Fast Campus Ordering & Zero Queue Waiting
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Order fresh meals right from your desk or hostel.
          </h1>

          <p className="text-white/90 text-sm sm:text-base max-w-xl leading-relaxed">
            Choose from multiple campus stalls, pay via UPI or cash, and track live cooking status with instant collection OTP.
          </p>

          {/* Quick Search on mobile */}
          <div className="pt-2 block md:hidden">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search food items..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white text-slate-900 text-xs shadow-lg outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Canteen Stalls Quick Switcher */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-slate-900">Campus Stalls</h2>
          </div>
          <span className="text-xs text-slate-500">{vendors.length} stalls open today</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div
            onClick={() => setSelectedVendorId('All')}
            className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
              selectedVendorId === 'All'
                ? 'bg-orange-50/80 border-orange-300 ring-2 ring-orange-400/20 shadow-sm'
                : 'bg-white border-slate-100 hover:border-slate-200 shadow-xs'
            }`}
          >
            <div>
              <h3 className="font-bold text-sm text-slate-900">All Campus Counters</h3>
              <p className="text-xs text-slate-500 mt-0.5">Explore entire food catalog</p>
            </div>
            <span className="text-xs font-bold text-orange-600 bg-white px-2.5 py-1 rounded-xl shadow-2xs">
              {products.length} Items
            </span>
          </div>

          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              onClick={() => setSelectedVendorId(vendor.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                selectedVendorId === vendor.id
                  ? 'bg-orange-50/80 border-orange-300 ring-2 ring-orange-400/20 shadow-sm'
                  : 'bg-white border-slate-100 hover:border-slate-200 shadow-xs'
              }`}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 truncate">
                    {vendor.stallName}
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {vendor.location || 'Campus Canteen'}
                </p>
              </div>
              <span className="text-xs font-bold text-orange-600 bg-white px-2.5 py-1 rounded-xl shadow-2xs flex-shrink-0">
                {vendor.productsCount || 0} Items
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Category Navigation Pills */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-slate-900">Food Categories</h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex-shrink-0 ${
              selectedCategory === 'All'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'bg-white text-slate-700 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            All Items ({products.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex-shrink-0 flex items-center gap-2 ${
                selectedCategory === cat.name
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'bg-white text-slate-700 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === cat.name ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {cat.productsCount || 0}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Filter Bar: Diet & Sorting */}
      <section className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Veg / Non-veg Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDietFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              dietFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setDietFilter('veg')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              dietFilter === 'veg'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Vegetarian
          </button>
          <button
            onClick={() => setDietFilter('non-veg')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              dietFilter === 'non-veg'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Non-Veg
          </button>
        </div>

        {/* Sort By Dropdown */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-orange-500 text-slate-800"
          >
            <option value="popular">Recommended / Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="prep-time">Fastest Preparation Time</option>
          </select>
        </div>
      </section>

      {/* Main Food Products Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {selectedCategory === 'All' ? 'Full Food Menu' : `${selectedCategory} Dishes`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {sortedProducts.length} delicious choices
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-4 h-64 animate-pulse space-y-3">
                <div className="h-32 bg-slate-100 rounded-xl" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-100 space-y-3">
            <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 opacity-50" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No food items found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your category, diet filters, or search terms to discover more items.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedVendorId('All');
                setDietFilter('all');
                onSearchChange('');
              }}
              className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold hover:bg-orange-100 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {sortedProducts.map((product) => (
              <FoodCard
                key={product.id}
                product={product}
                onOpenDetails={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Food Details Modal */}
      <FoodDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
